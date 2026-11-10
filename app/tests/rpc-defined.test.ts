/**
 * كلّ دالّة RPC تناديها الشيفرة معرَّفةٌ في `supabase/migrations/`.
 *
 * ═══ لماذا (مراجعة الأمن ٢٠٢٦/١١/٠٩، البند ٤) ═══
 *
 * `paylink-order-create` تنادي `order_rate_hit` وتفشل مغلقةً (٥٠٣) إن غابت —
 * ولا هجرة تعرّفها. فالدالّة حيّة في القاعدة بلا مصدر في المستودع، وإعادة
 * بناء القاعدة من الهجرات (أو نقلٌ تالٍ كنقل ٢٠٢٦/٠٨/٢٢) تُطفئ **كل** طلب
 * إلكتروني بصمت. والفحص يمسك التالية قبل أن تقع.
 *
 * يقرأ: `rpc("x")` (عميل supabase-js في دوالّ الحافة) و`rpc/x` (الواجهة عبر
 * `rest()`، ودوالّ الحافة عبر `fetch`). ويبحث عن `create [or replace] function
 * [public.]x` في الهجرات.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");

/**
 * دوالّ تناديها الشيفرة وتعيش في القاعدة الحيّة **بلا هجرة**. لا تُخترع
 * تعريفاتها هنا: تُستخرج من القاعدة (`pg_get_functiondef`) وتُلتزَم هجرةً،
 * ثم يُحذف سطرها من هذه القائمة. والفحص يسقط إن بقي فيها اسمٌ صار معرَّفاً.
 *
 * ⚠️ أوّل تشغيل (٢٠٢٦/١١/٠٩) وجد **عشرين** لا واحدة كما ظنّ التقرير: سجلّ
 * الهجرات يبدأ ٢٠٢٦/٠٨/٢٠، والسكيما الأساسية قبله لم تُلتزَم قطّ — و
 * `20260822_project_move_claudmenu.sql` يقول ذلك صراحةً («القاعدة هي المصدر
 * الحيّ»)، ونقلُ ذلك اليوم طبّق سبع هجرات من الحيّ لا من الملفّات. فكلّ اسمٍ
 * أدناه يعني: إعادة بناء القاعدة من المستودع تُسقط ما يُذكر بجانبه.
 */
const BASELINE = "قبل سجلّ الهجرات — السكيما الأساسية لم تُلتزَم";
const KNOWN_MISSING: Record<string, string> = {
  // ── مسار الدفع والطلبات (الأخطر: تفشل مغلقةً فيُردّ كل طلب) ──
  place_order: `${BASELINE}؛ أُنشئت في هجرة \`order_rpcs\` الحيّة (نقل ٠٨/٢٢) — غيابها يُسقط كل طلب`,
  billing_rate_hit: `${BASELINE}؛ حدّ معدّل \`paylink-create\` — غيابها يوقف الاشتراك`,
  api_rate_hit: `${BASELINE}؛ حدّ معدّل واجهة API (§14)`,
  founder_email: `${BASELINE}؛ بريد المؤسّس — مصدر \`is_founder()\` و٤٨ سياسة RLS`,
  // ── المنيو العامّ ──
  is_menu_published: `${BASELINE}؛ قفل النشر (§21)`,
  track_view: `${BASELINE}؛ عدّاد المشاهدة بالساعة — هجرة \`analytics_hourly_upsert\` الحيّة`,
  increment_dish_views: `${BASELINE}؛ مشاهدات الطبق الذرّية`,
  popular_dishes: `${BASELINE}؛ «الأكثر طلباً» في المنيو (§13)`,
  // ── اللوحة ووضع الكاشير ──
  is_founder: `${BASELINE}؛ \`SECURITY DEFINER\` — بوّابة لوحة المؤسّس`,
  change_restaurant_slug: `${BASELINE}؛ تغيير الرابط مع تسجيل القديم بديلاً — رابط مطبوع في QR`,
  staff_stamp: `${BASELINE}؛ ختم الولاء من وضع الكاشير (§8)`,
  set_staff_pin: `${BASELINE}؛ رمز الكاشير (§8)`,
  // ── لوحة المؤسّس (§11) ──
  founder_overview: `${BASELINE}؛ لوحة المؤسّس`,
  founder_merchants: `${BASELINE}؛ لوحة المؤسّس`,
  founder_funnel: `${BASELINE}؛ لوحة المؤسّس`,
  founder_revenue_monthly: `${BASELINE}؛ لوحة المؤسّس`,
  founder_revenue_orphans: `${BASELINE}؛ لوحة المؤسّس`,
  founder_health: `${BASELINE}؛ لوحة المؤسّس`,
  founder_billing: `${BASELINE}؛ وحدة الاستلام (§21)`,
};

function walk(dir: string, exts: RegExp, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "_archive" || name === "_tombstones") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, exts, out);
    else if (exts.test(name)) out.push(p);
  }
  return out;
}

const CALL = /rpc\(\s*["'`]([a-z_][a-z0-9_]*)["'`]|rpc\/([a-z_][a-z0-9_]*)/g;

function calledRpcs(): Map<string, string[]> {
  const files = [
    ...walk(join(ROOT, "app/src"), /\.(ts|tsx)$/),
    ...walk(join(ROOT, "supabase/functions"), /\.ts$/),
    ...walk(join(ROOT, "netlify"), /\.(ts|js|mjs)$/),
    ...walk(join(ROOT, "shared"), /\.(ts|js|mjs)$/),
  ];
  const out = new Map<string, string[]>();
  for (const f of files) {
    for (const m of readFileSync(f, "utf8").matchAll(CALL)) {
      const name = m[1] ?? m[2];
      out.set(name, [...(out.get(name) ?? []), f.slice(ROOT.length + 1)]);
    }
  }
  return out;
}

function definedFunctions(): Set<string> {
  const sql = walk(join(ROOT, "supabase/migrations"), /\.sql$/)
    .map((f) => readFileSync(f, "utf8"))
    .join("\n");
  const re = /create\s+(?:or\s+replace\s+)?function\s+(?:"?public"?\.)?"?([a-z_][a-z0-9_]*)"?/gi;
  return new Set([...sql.matchAll(re)].map((m) => m[1].toLowerCase()));
}

const called = calledRpcs();
const defined = definedFunctions();

describe("دوالّ RPC المناداة معرَّفة في الهجرات", () => {
  it("القراءة وجدت ما يكفي ليكون الفحص ذا معنى", () => {
    expect(called.size).toBeGreaterThan(15);
    expect(called.has("place_order")).toBe(true);
    expect(called.has("track_view")).toBe(true);
  });

  for (const [name, where] of called) {
    if (name in KNOWN_MISSING) continue;
    it(`${name} معرَّفة (تناديها ${where[0]})`, () => {
      expect(defined.has(name), `${name} لا هجرة تعرّفها — ${where.join("، ")}`).toBe(true);
    });
  }

  it("‏`KNOWN_MISSING` لا تحمل اسماً صار معرَّفاً أو لم يعد منادى", () => {
    for (const name of Object.keys(KNOWN_MISSING)) {
      expect(defined.has(name), `${name} صارت معرَّفة — احذفها من KNOWN_MISSING`).toBe(false);
      expect(called.has(name), `${name} لم تعد منادى — احذفها من KNOWN_MISSING`).toBe(true);
    }
  });
});

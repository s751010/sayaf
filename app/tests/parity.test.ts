/**
 * فحوص التكافؤ — **أثمن ما في هذه المجموعة**.
 *
 * ثلاثة أزواج من الملفّات مكتوبة بيد مرّتين لأن وحدات النشر مختلفة (Vite في
 * `app/` · Deno في `supabase/functions/` · Deno على حافة Netlify). ولكل زوج
 * منها **عطل وقع فعلاً** بسبب تباعد نسخة عن أصلها:
 *
 *  · `options`: المعرّف موضعٌ في المصفوفة، فتباعد التحليل يشير إلى إضافة أخرى.
 *  · `plans`: اسم الباقة في الخادم كان «الأساسية» والمنتج «كلاود منيو»، فكل
 *    دفعة تُسجَّل باسم باقة لا وجود لها.
 *  · مفتاح `anon` في دالة الحافة: نسخة قديمة ⇒ ٤٠١ ⇒ صمت كامل ولا وسوم.
 *
 * التعليق «حافظ عليهما متطابقين» لا يحرس شيئاً. هذه الفحوص تُسقط CI.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { parseOptions } from "@/lib/options";
import { PLANS, CURRENCY_CODE } from "@/lib/plans";
import { parseDishOptions } from "../../supabase/functions/_shared/options";

const repo = (p: string) => fileURLToPath(new URL(`../../${p}`, import.meta.url));

/* ══ ١) محلّل الإضافات: الواجهة ⟷ الخادم ══════════════════════════════ */

describe("تكافؤ parseOptions ⟷ parseDishOptions", () => {
  /** حالات مقصودة: كلٌّ منها شكل رآه المنتج أو يستطيع API التاجر كتابته. */
  const CASES: [label: string, raw: string | null][] = [
    ["فارغ", ""],
    ["null", null],
    ["مسافات", "   "],
    ["الصيغة المعتمدة", '[{"name":"حار","price":9}]'],
    ["عدّة خيارات", '[{"name":"وسط","price":5},{"name":"كبير","price":8}]'],
    ["بلا سعر", '[{"name":"بدون بصل"}]'],
    ["سعر صفر", '[{"name":"عادي","price":0}]'],
    // ⚠️ التباعد الذي كان قائماً: الخادم يحصّل ٥ والواجهة تعرضه مجّاناً.
    ["سعر نصّي", '[{"name":"جبن","price":"5"}]'],
    ["سعر نصّي بمسافات", '[{"name":"جبن","price":" 7 "}]'],
    ["سعر نصّي فارغ", '[{"name":"جبن","price":""}]'],
    ["سعر غير رقمي", '[{"name":"جبن","price":"abc"}]'],
    ["سعر null", '[{"name":"جبن","price":null}]'],
    ["سعر منطقي", '[{"name":"جبن","price":true}]'],
    ["سعر سالب", '[{"name":"خصم","price":-3}]'],
    ["سعر كسري", '[{"name":"نصف","price":2.5}]'],
    ["Infinity", '[{"name":"x","price":1e999}]'],
    ["مصفوفة نصوص", '["حار","وسط"]'],
    ["نصّ فارغ داخل المصفوفة", '["حار","  ","وسط"]'],
    ["اسم فارغ", '[{"name":"  ","price":5},{"name":"صالح","price":2}]'],
    ["اسم غير نصّي", '[{"name":5,"price":5},{"name":"صالح"}]'],
    ["عنصر null", '[null,{"name":"صالح"}]'],
    ["عنصر رقم", '[7,{"name":"صالح"}]'],
    ["أسماء بمسافات طرفية", '[{"name":"  حار  ","price":3}]'],
    ["JSON ليس مصفوفة", '{"name":"حار"}'],
    ["JSON تالف", "[{name:"],
    ["نصّ حرّ بأسطر", "حار\nوسط\nكبير"],
    ["نصّ حرّ بفواصل عربية", "حار، وسط، كبير"],
    ["نصّ حرّ بفواصل لاتينية", "حار, وسط"],
    ["نصّ حرّ بفراغات زائدة", "  حار ,, وسط  "],
    ["الشكل المُجمَّع القديم", '[{"items":[{"id":1,"name":"حار"}]}]'],
  ];

  it.each(CASES)("%s", (_label, raw) => {
    const app = parseOptions(raw).map((o) => ({ name: o.name, price: o.price ?? 0 }));
    const edge = parseDishOptions(raw).map((o) => ({ name: o.name, price: o.price }));
    // الترتيب جزء من العقد لا تفصيل عرض: المعرّف هو الموضع.
    expect(app).toEqual(edge);
  });

  it("السعر النصّي يُحصَّل ويُعرض بنفس القيمة", () => {
    const raw = '[{"name":"جبن","price":"5"}]';
    expect(parseOptions(raw)[0].price).toBe(5);
    expect(parseDishOptions(raw)[0].price).toBe(5);
  });

  it("الموضع يبقى ثابتاً حين يسقط عنصر غير صالح", () => {
    const raw = '[{"name":"  "},{"name":"أول"},null,{"name":"ثانٍ"}]';
    const app = parseOptions(raw);
    const edge = parseDishOptions(raw);
    expect(app.map((o) => o.name)).toEqual(["أول", "ثانٍ"]);
    expect(edge.map((o) => o.name)).toEqual(["أول", "ثانٍ"]);
  });
});

/* ══ ٢) الباقات: الواجهة ⟷ _shared/plans.ts ═══════════════════════════ */

describe("تكافؤ plans.ts ⟷ _shared/plans.ts", () => {
  const shared = readFileSync(repo("supabase/functions/_shared/plans.ts"), "utf8");

  it("كل باقة في الواجهة موجودة في الخادم بنفس الاسم والسعر", () => {
    for (const plan of PLANS) {
      // القراءة نصّية لا بالاستيراد: الملفّ يستعمل صيغة Deno، وقراءته كنصّ
      // تفحص **ما يُنشَر فعلاً** لا نسخة تُترجَم بإعدادات أخرى.
      expect(shared, `المعرّف ${plan.id} مفقود`).toContain(`"${plan.id}"`);
      expect(shared, `اسم ${plan.id} مختلف`).toContain(plan.name);
      expect(shared, `سعر ${plan.id} مختلف`).toMatch(
        new RegExp(`monthly\\s*:\\s*${plan.monthly}\\b`)
      );
    }
  });

  it("الخادم لا يسعّر باقة لا تبيعها الواجهة", () => {
    const ids = [...shared.matchAll(/^\s*(?:")?([a-z_]+)(?:")?\s*:\s*\{/gm)].map((m) => m[1]);
    const known = new Set([...PLANS.map((p) => p.id), "trial"]);
    for (const id of ids) {
      if (/^(monthly|yearly|name|features|limits)$/.test(id)) continue;
      expect(known.has(id), `الخادم يعرف باقة «${id}» لا تبيعها الواجهة`).toBe(true);
    }
  });

  it("رمز العملة معياري — قوقل يتجاهل السعر بغيره", () => {
    expect(CURRENCY_CODE).toBe("SAR");
  });
});

/* ══ ٣) دالة الحافة ⟷ config.ts ═══════════════════════════════════════ */

describe("تكافؤ دالة الحافة ⟷ config.ts", () => {
  const config = readFileSync(repo("app/src/lib/config.ts"), "utf8");
  const edge = readFileSync(repo("netlify/edge-functions/menu-meta.ts"), "utf8");
  const grab = (src: string, name: string) =>
    src.match(new RegExp(`${name}\\s*[:=]\\s*\\n?\\s*"([^"]+)"`))?.[1];

  it("مفتاح anon مطابق", () => {
    // ⚠️ عدم التطابق **صامت تماماً**: الاستعلام يعود ٤٠١، والدالة تعيد الردّ
    // الأصلي كما صُمّمت، فلا خطأ ولا سجلّ — ووسوم المطاعم لا تُحقن أبداً.
    // وقد وقع هذا فعلاً عند أول كتابة للدالة.
    expect(grab(edge, "SUPABASE_ANON_KEY")).toBe(grab(config, "SUPABASE_ANON_KEY"));
  });

  it("عنوان Supabase مطابق", () => {
    expect(grab(edge, "SUPABASE_URL")).toBe(grab(config, "SUPABASE_URL"));
  });
});

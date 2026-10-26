/**
 * شاشات الطلب تلبس الطابع (٢٠٢٦/١٠/٢٦) — السلّة · نافذة الطبق · التذكرة · المتابعة.
 *
 * ═══ العطل ═══
 *
 * لقطة المالك: سلّة «محمصة» بعلامةٍ زرقاء — كلّ حدٍّ وزرٍّ أزرق (`--m-border`
 * و`--m-accent` هما لون العلامة متى اختار التاجر لوناً)، وإيموجي مكان الأيقونات
 * المرسومة، و«الإجمالي الفرعي» و«الإجمالي» بالرقم نفسه، وإشعار خصوصيةٍ طويل وسط
 * النموذج. فصارت السلّة «استمارة» لا جزءاً من المنيو.
 *
 * كلّ وعدٍ هنا يحرسه فحصٌ يعدّ نقيضه فعلاً — وكلّ فحصٍ يثبت أولاً أنه وجد ما
 * يفحصه (درس ٤٧: فحصٌ فارغ ينجح بلا أن يفحص شيئاً).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(fileURLToPath(new URL(`../src/${p}`, import.meta.url)), "utf8");

/** الشيفرة بلا تعليقاتها — التعليق يذكر «⚠️» و«🛍️» شرحاً لا واجهةً. */
function code(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((l) => !/^\s*(\/\/|\*)/.test(l))
    .join("\n");
}

const SCREENS = [
  "components/menu/CartReview.tsx",
  "components/menu/Cart.tsx",
  "components/menu/DishModal.tsx",
  "components/menu/PickupTicket.tsx",
  "components/menu/LoyaltyProgress.tsx",
  "pages/OrderStatus.tsx",
];

describe("شاشات الطلب — أيقونات مرسومة لا إيموجي", () => {
  it.each(SCREENS)("%s: لا إيموجي في الواجهة", (f) => {
    const src = code(read(f));
    expect(src.length, "الملفّ فارغ بعد التعرية — الفحص لا يفحص شيئاً").toBeGreaterThan(1000);
    // رموز الحساسية (`a.emoji`) بيانات من `lib/allergens` لا نصٌّ مكتوب هنا.
    expect(src.match(/\p{Extended_Pictographic}/gu) ?? []).toEqual([]);
    // ولا رموز نصّية تقوم مقام أيقونة: «☐ ☑ ＋ ✕ 🗑».
    expect(src).not.toMatch(/[☐☑＋✕]/);
  });

  it("الأيقونات الجديدة موجودة في المجموعة المرسومة", () => {
    const icons = read("lib/icons.tsx");
    for (const name of ["bag", "chat", "salt"]) expect(icons).toMatch(new RegExp(`\\n  ${name}: \\{`));
  });
});

describe("السلّة — لون العلامة على الإتمام والمختار وحدهما", () => {
  const src = code(read("components/menu/CartReview.tsx"));

  it("لا حدّ بلون العلامة (`--m-border` المصبوغ) ولا كتلة بها خارج زرّ الإتمام", () => {
    expect(src).toContain("m-o-cta");
    expect(src).not.toContain("var(--m-border)");
    expect(src).not.toMatch(/background(Color)?: "var\(--m-accent\)"/);
    expect(src).not.toMatch(/borderColor: "var\(--m-accent\)"/);
  });

  it("الإجمالي الفرعي لا يظهر إلا حين يختلف عن الإجمالي (ضريبةٌ تُضاف)", () => {
    const at = src.indexOf("الإجمالي الفرعي");
    expect(at).toBeGreaterThan(0);
    expect(src.indexOf("الإجمالي الفرعي", at + 1)).toBe(-1);
    const gate = src.lastIndexOf("{vatAdded > 0 && (", at);
    expect(gate, "السطر خارج شرط الضريبة").toBeGreaterThan(0);
    // لا إغلاقٌ للشرط بين بدايته والسطر.
    expect(src.slice(gate, at)).not.toMatch(/\)\}\s*$/m);
  });

  it("إشعار الجمع قصيرٌ ولم يُسقط إفصاحاً: المطعم · بوّابة الدفع · ختم الولاء · رابط الخصوصية", () => {
    const ar = src.match(/"اسمك وجوالك[^"]*"/)?.[0] ?? "";
    expect(ar).toContain("للمطعم");
    expect(ar).toContain("لتنفيذ طلبك");
    expect(ar).toContain("بوّابة الدفع");
    expect(ar).toContain("بطاقة ولاء");
    expect(ar).toContain("عند الدفع");
    expect(ar.length, "عاد الإشعار فقرة").toBeLessThan(130);
    const en = src.match(/"Your name and mobile[^"]*"/)?.[0] ?? "";
    for (const w of ["restaurant", "payment gateway", "loyalty", "stamps your number"]) expect(en).toContain(w);
    expect(src).toContain('to="/privacy"');
  });
});

describe("نافذة الطبق — «نفد اليوم»", () => {
  const src = code(read("components/menu/DishModal.tsx"));

  it("النفاد من `available === false` وحده — لا من السلّة (المنيو يمرّر `cart=null` للنافد)", () => {
    expect(src).toMatch(/const soldOut = dish\.available === false;/);
    expect(src).toMatch(/const orderable = sellable && !soldOut;/);
    // الزرّ المعطّل يظهر للنافد سواءٌ وُجدت سلّة أم لا.
    expect(src).toMatch(/\) : soldOut \? \(/);
    expect(src).toContain('"نفد اليوم"');
    expect(src).toContain('"Sold out today"');
  });
});

describe("صفحة المتابعة والتذكرة بطابع المطعم", () => {
  it("المتابعة تلبس خامة الطابع وورقته وتطلب خطّيه", () => {
    const src = code(read("pages/OrderStatus.tsx"));
    expect(src).toContain("skinClass(theme.design)");
    expect(src).toContain('className="m-paper"');
    expect(src).toContain('loadThemeFont(theme.vars["--m-display"])');
    // لا ذهب المنصّة على الطلب الملبوس.
    expect(src).not.toMatch(/bg-gold"|text-ink\/70|bg-line/);
  });

  it("«قيّمنا على قوقل» من حقل الترويسة نفسه، وبعد الجاهزية وحدها", () => {
    const ticket = code(read("components/menu/PickupTicket.tsx"));
    expect(ticket).toMatch(/return status === "ready" \|\| status === "picked_up";/);
    expect(code(read("pages/OrderStatus.tsx"))).toMatch(/restaurant\.reviews_enabled !== false && restaurant\.google_review_url/);
    expect(read("pages/MenuPage.tsx")).toMatch(/reviewUrl=\{primaryLinks\.find\(\(l\) => l\.icon === "star"\)\?\.url \?\? null\}/);
  });
});

describe("خامة شاشات الطلب في CSS", () => {
  const css = read("styles/menu-skins.css");
  const start = css.indexOf("══ شاشات الطلب");
  const section = css.slice(start);

  it("القسم موجود ولكلّ طابعٍ ذي خامةٍ قواعده فيه", () => {
    expect(start).toBeGreaterThan(0);
    for (const skin of ["receipt", "neon", "sticker", "letterboard", "editorial", "roshan", "najdi", "roastery"]) {
      expect(section, skin).toContain(`.m-skin-${skin} .m-o-`);
    }
  });

  it("التحويل والحركة داخل `no-preference` وحدها", () => {
    const motion = section.indexOf("@media (prefers-reduced-motion: no-preference)");
    expect(motion).toBeGreaterThan(0);
    const still = section.slice(0, motion);
    expect(still).toContain(".m-o-cta");
    expect(still).not.toMatch(/\b(transform|transition|animation):/);
  });

  it("لا `letter-spacing` في القسم (الدرس ١٢)", () => {
    expect(section).not.toMatch(/letter-spacing/);
  });
});

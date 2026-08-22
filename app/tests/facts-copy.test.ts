/**
 * أرقام المنتج في النصوص الساكنة — **حارس التكرار الثالث**.
 *
 * ═══ العطل الذي وقع مرّتين ═══
 *
 * `Landing.tsx` كتبت «١٢ طابعاً» بعدد ثابت فبقيت ١٢ بعد إضافة سبعة. فأُنشئ
 * `lib/facts.ts` ليحسب العدد من `ALL_THEMES.length` — وحُلّت المشكلة **في
 * الشيفرة**.
 *
 * ثم وقعت ثانيةً وفي مكان لا يصله الحلّ: **النصوص**. صار المنتج ٢١ طابعاً
 * وبقيت ثمانية نصوص تقول «تسعة عشر» — في وسوم `index.html` التي تقرؤها
 * محرّكات البحث، وفي `manifest.webmanifest`، وفي بطاقة المشاركة التي تظهر في
 * واتساب. أي أن الصفحة كانت **تنقص من المنتج طابعين** أمام التاجر لحظة
 * القرار، ولا شيء يمسك ذلك: لا `tsc` يقرأ النثر، ولا فحص يفتح `index.html`.
 *
 * ═══ لماذا لا يكفي أن تُستورد `THEME_COUNT` ═══
 *
 * ملفّات `index.html` و`manifest.webmanifest` و`og.mjs` خارج حزمة التطبيق:
 * الأوّلان يُقرآن قبل أن يعمل جافاسكربت، والثالث سكربت Node مستقلّ. فلا سبيل
 * إلى استيراد ثابت فيها — والبديل أن **يُقرأ الرقم منها ويُقارن بالمصدر**.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { THEME_COUNT } from "@/lib/facts";
import { ALL_THEMES } from "@/lib/themes";

const read = (rel: string) =>
  readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

/** الأعداد المكتوبة بالحروف العربية التي ظهرت في النصوص فعلاً. */
const SPELLED = [
  "ثمانية", "تسعة", "عشرة", "أحد عشر", "اثنا عشر", "اثني عشر",
  "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "ستّة عشر",
  "سبعة عشر", "ثمانية عشر", "تسعة عشر", "عشرون", "عشرين",
];

describe("عدد الطوابع — مصدر واحد", () => {
  it("`THEME_COUNT` محسوب من المصفوفة لا مكتوب", () => {
    expect(THEME_COUNT).toBe(ALL_THEMES.length);
    // ⚠️ لو صار رقماً ثابتاً يوماً، هذا الفحص وحده يبقى بلا معنى.
    expect(read("../src/lib/facts.ts")).toContain("ALL_THEMES.length");
  });

  /**
   * الملفّات الثلاثة الساكنة: الرقم فيها مكتوب بالضرورة، فيُقارن بالمصدر.
   * ⚠️ ويُفحص **الرقم عدداً** لا مجرّد وجود النصّ: `21` تمرّ و`19` تسقط.
   */
  it.each([
    ["index.html", "../index.html"],
    ["manifest.webmanifest", "../public/manifest.webmanifest"],
    ["scripts/og.mjs", "../scripts/og.mjs"],
  ])("%s يذكر العدد الصحيح ولا يخالفه", (_name, rel) => {
    const text = read(rel);
    const mentions = [...text.matchAll(/(\d{1,3})\s*طابع/g)].map((m) => Number(m[1]));
    expect(mentions.length, "لا ذكر لعدد الطوابع إطلاقاً").toBeGreaterThan(0);
    for (const n of mentions) expect(n).toBe(THEME_COUNT);
  });

  it.each([
    ["index.html", "../index.html"],
    ["manifest.webmanifest", "../public/manifest.webmanifest"],
    ["scripts/og.mjs", "../scripts/og.mjs"],
    ["Landing.tsx", "../src/pages/Landing.tsx"],
  ])("%s لا يكتب العدد بالحروف", (_name, rel) => {
    // عددٌ مكتوب بالحروف لا يُمسك بالمقارنة أعلاه — وهو الشكل الذي تقادم فعلاً.
    const text = read(rel);
    for (const word of SPELLED) {
      expect(text, `«${word} طابعاً» مكتوب بالحروف`).not.toContain(`${word} طابع`);
    }
  });
});

describe("لا وعد بمجّانية دائمة", () => {
  /**
   * ⚠️ المنتج **اشتراك** بتجربة تنتهي — لا طبقة مجانية دائمة، وهذا ما تقوله
   * صفحة الأسعار منذ البداية. لكن البطل ووسوم الصفحة كانا يَعِدان «مجاناً
   * للأبد»، فكان التاجر يصل صفحة الأسعار ليجد وعداً آخر. الفحص يمنع عودة
   * الوعد إلى الواجهات التي تسبق صفحة الأسعار.
   */
  it.each([
    ["الهبوط", "../src/pages/Landing.tsx"],
    ["index.html", "../index.html"],
    ["manifest.webmanifest", "../public/manifest.webmanifest"],
  ])("%s لا يَعِد بمجّانية دائمة", (_name, rel) => {
    const text = read(rel).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    for (const claim of ["مجاناً للأبد", "مجاني للأبد", "مجانًا للأبد"]) {
      expect(text, `وعدٌ بمجّانية دائمة: «${claim}»`).not.toContain(claim);
    }
  });
});

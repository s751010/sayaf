/**
 * ألفاظ النداء في صفحة الهبوط — **حارس التكاثر**.
 *
 * ═══ العطل ═══
 *
 * كانت الصفحة تحمل **اثني عشر لفظاً مختلفاً** لفعلين اثنين لا غير: سجّل، أو
 * شاهد. «ابدأ مجاناً» · «ابدأ الآن» · «ابدأ تجربتك المجانية» · «أنشئ منيوك
 * الآن» · «جهّز بطاقتك مجاناً» · «جرّبه على منيوك» · «شوفه أولاً» · «جرّب
 * المنيو» · «افتح هذا الطابع» · «افتحه بملء الشاشة»…
 *
 * والزائر أمام أسماء كثيرة لشيء واحد لا يختار أوّلها — يختار **لا شيء**.
 *
 * ولا شيء يمسك هذا: كل لفظ منها صحيح لغةً، ويمرّ `tsc`، ويبدو في مراجعة
 * الدفعة تحسيناً موضعياً. التكاثر لا يظهر إلا حين تُقرأ الصفحة كاملة — وهو
 * بالضبط ما لا يفعله أحد بعد الدفعة العاشرة.
 *
 * ═══ ولماذا لا «مجاناً» على الزرّ ═══
 *
 * لا طبقة مجانية في المنتج (§`plans.ts`)، والمجاني هو التجربة وحدها. ولفظُ
 * زرٍّ يقول «مجاناً» يَعِد بما لا يجده التاجر بعد أسبوع — فتُقال المدّة نصّاً
 * مساعداً **تحت** الزرّ لا على وجهه.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { CTA_PRIMARY, CTA_SECONDARY } from "@/lib/facts";

const read = (rel: string) =>
  readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

/** الملفّات التي ترسم نداءً للزائر في مسار الهبوط. */
const SURFACES: [string, string][] = [
  ["Landing.tsx", "../src/pages/Landing.tsx"],
  ["site.tsx", "../src/components/site.tsx"],
  ["ScanDemo.tsx", "../src/components/landing/ScanDemo.tsx"],
];

/** ⚠️ ألفاظ عاشت في الصفحة فعلاً ثم تقاعدت — لا قائمة متخيَّلة. */
const RETIRED = [
  "ابدأ مجاناً",
  "ابدأ الآن",
  "ابدأ تجربتك المجانية",
  "أنشئ منيوك الآن",
  "جهّز بطاقتك مجاناً",
  "جرّبه على منيوك",
  "شوفه أولاً",
  "جرّب المنيو",
  "افتح هذا الطابع منيواً كاملاً",
];

/** يُسقط التعليقات: الشرح يذكر الألفاظ المتقاعدة عمداً ليوثّق سبب تقاعدها. */
const codeOf = (text: string) =>
  text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("لفظان لا أكثر", () => {
  it("الثابتان معرَّفان ولا يحمل أيّهما «مجاناً»", () => {
    expect(CTA_PRIMARY.length).toBeGreaterThan(2);
    expect(CTA_SECONDARY.length).toBeGreaterThan(2);
    for (const label of [CTA_PRIMARY, CTA_SECONDARY]) {
      expect(label, "المجانيّ هو التجربة لا المنتج").not.toContain("مجان");
    }
    expect(CTA_PRIMARY).not.toBe(CTA_SECONDARY);
  });

  it("`facts.ts` يصدّرهما — فلا نسخة ثانية بيد", () => {
    const facts = read("../src/lib/facts.ts");
    expect(facts).toContain("export const CTA_PRIMARY");
    expect(facts).toContain("export const CTA_SECONDARY");
  });

  it.each(SURFACES)("%s لا يكتب لفظ نداء بيد", (_name, rel) => {
    const code = codeOf(read(rel));
    // اللفظان يصلان بالثابت لا بالنصّ — فوجود النصّ حرفياً يعني نسخةً ثانية.
    for (const label of [CTA_PRIMARY, CTA_SECONDARY]) {
      expect(code, `«${label}» مكتوب بيد بدل الثابت`).not.toContain(`>${label}<`);
    }
  });

  it.each(SURFACES)("%s خالٍ من الألفاظ المتقاعدة", (_name, rel) => {
    const code = codeOf(read(rel));
    for (const label of RETIRED) {
      expect(code, `لفظ متقاعد عاد: «${label}»`).not.toContain(label);
    }
  });

  it("الصفحة تستعمل الثابتين فعلاً", () => {
    const code = codeOf(read("../src/pages/Landing.tsx"));
    expect(code).toContain("CTA_PRIMARY");
    expect(code).toContain("CTA_SECONDARY");
  });
});

describe("الأقسام المحذوفة لا تعود بلا قرار", () => {
  /**
   * ⚠️ حُذفت أربعة أقسام لأنها تأخذ خمس شاشات مقابل قيمة ★☆☆☆☆: مسرح
   * الطوابع، وشريط الأرقام، والخطوات الثلاث، وبطاقة الكاشير. قيمتها كلّها
   * باقية — سطراً في المزايا أو في قائمة الباقة، لا شاشةً.
   *
   * والإغراء الطبيعي لأي مساهم لاحق أن «يُعيد ما نقص». فليُعده بقرار.
   */
  it("لا `ThemeStage` ولا `CardShowcase` في الهبوط", () => {
    const code = codeOf(read("../src/pages/Landing.tsx"));
    for (const gone of ["ThemeStage", "CardShowcase", "const STATS", "const STEPS"]) {
      expect(code, `عاد المحذوف: ${gone}`).not.toContain(gone);
    }
  });

  it("السعر يسبق الأسئلة — ولا يُدفن آخر الصفحة", () => {
    // كان القسم ١١ من ١٤: التاجر يسأل «كم عليّ؟» في أوّل ربع دقيقة.
    const code = read("../src/pages/Landing.tsx");
    const pricing = code.indexOf('id="pricing"');
    const faq = code.indexOf("الأسئلة الشائعة");
    const features = code.indexOf('id="features"');
    expect(pricing).toBeGreaterThan(-1);
    expect(pricing, "السعر يجب أن يلي المزايا").toBeGreaterThan(features);
    expect(pricing, "السعر يجب أن يسبق الأسئلة").toBeLessThan(faq);
  });
});

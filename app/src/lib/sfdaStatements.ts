/**
 * عبارتا الهيئة في ذيل المنيو — **مصدرٌ واحد** لنصّهما ولشرط ظهورهما (§26).
 *
 * ═══ لماذا ملفٌّ واحد ═══
 *
 * العبارة تُكتب في أربعة أماكن: المنيو الرقمي (`MenuPage`)، والمطبوع
 * (`PrintMenu`)، وملفّ التفتيش (`complianceFile`)، وقائمة «لو دخل المفتّش
 * اليوم» (`sfdaChecklist`). ونسخةٌ بيدٍ في كلٍّ منها تتباعد عند أوّل تصحيح —
 * فالنصّ والشرط هنا، وكلٌّ منها يقرأ ولا يكتب.
 *
 * ═══ النصّ الرسمي (sfda.gov.sa) ═══
 *
 * ١. **لائحة الملح** (`/ar/regulations/19819`): «تُكتب عبارة توضيحية على هامش
 *    أو بداية قوائم الطعام تتضمن: الصنف يحتوي على كمية ملح أعلى من الكمية
 *    الموصى بها يوميًا / يُوصى بألا يزيد استهلاك الفرد اليومي من الملح على 5
 *    جرام (2000 ملجم صوديوم)». الكلمات حرفاً بحرف؛ و«/» صارت نقطةً بين جملتين.
 *    تظهر **متى كان في المنيو صنفٌ عليه علامة الملح** — والعتبة من
 *    `isHighSodium` وحدها، فإن تغيّرت هناك تبعها الشرط هنا بلا سطرٍ جديد.
 * ٢. **دليل السعرات** (FS-G-071-v2، البند 06): «البيانات التغذوية الإضافية
 *    متاحة عند الطلب». تظهر **متى كان في المنيو صنفٌ بسعرات** — شرط جملة
 *    الاحتياج اليومي نفسه.
 *
 * والإنجليزية لزبونٍ اختار EN — ترجمةٌ للمعنى، والنصّ الملزِم هو العربي.
 *
 * خالص: لا شبكة ولا React — يحرسه `sfda-statements.test.ts`.
 */
import { isHighSodium } from "./nutrition";

export type Statement = { readonly ar: string; readonly en: string };

/** لائحة الملح — تُكتب بجانب أيقونة علامة الملح نفسها. */
export const SALT_STATEMENT: Statement = {
  ar:
    "الصنف يحتوي على كمية ملح أعلى من الكمية الموصى بها يوميًا. " +
    "يُوصى بألا يزيد استهلاك الفرد اليومي من الملح على 5 جرام (2000 ملجم صوديوم).",
  en:
    "This item contains more salt than the recommended daily amount. " +
    "Daily salt intake should not exceed 5 g (2,000 mg sodium).",
};

/** دليل السعرات، البند 06. */
export const MORE_INFO_STATEMENT: Statement = {
  ar: "البيانات التغذوية الإضافية متاحة عند الطلب.",
  en: "Additional nutrition information is available on request.",
};

export function statementText(s: Statement, en: boolean): string {
  return en ? s.en : s.ar;
}

type SodiumLike = { sodium_mg?: number | null };
type CaloriesLike = { calories?: number | null };

/** في المنيو صنفٌ عليه علامة الملح ⇒ عبارة الملح. */
export function needsSaltStatement(dishes: readonly SodiumLike[]): boolean {
  return dishes.some((d) => isHighSodium(d.sodium_mg ?? null));
}

/** في المنيو صنفٌ بسعرات ⇒ «البيانات التغذوية الإضافية متاحة عند الطلب». */
export function needsMoreInfoStatement(dishes: readonly CaloriesLike[]): boolean {
  return dishes.some((d) => d.calories !== null && d.calories !== undefined);
}

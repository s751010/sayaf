/**
 * ملفّ البيانات الغذائية للتفتيش — ما يطبعه التاجر ويضعه أمام المفتّش (§26).
 *
 * ═══ ما هو، وما ليس هو ═══
 *
 * جدولٌ بكلّ أطباق المنيو المعروضة: السعرات والصوديوم والكافيين ومسبّبات
 * الحساسية، وما لم يُدخَل يُكتب «غير مُدخَل» لا يُترك فراغاً ولا يُخفى — فالفراغ
 * يُقرأ صفراً، والإخفاء يُقرأ «لا يوجد».
 *
 * ⚠️ **وليس شهادة.** الأرقام يحسبها التاجر من وصفته بقيمٍ مرجعية عامّة أو
 * يكتبها بيده، ولا يحلّلها مختبر ولا تراجعها جهة. فالملفّ **لا يقول عن نفسه ولا
 * عن الأطباق إنها مطابقة أو مقبولة**، ويقول صراحةً إنها تقديرية راجعها التاجر
 * (`company/legal-risk.md`: «لا ادّعاء امتثال نيابةً عن التاجر في أي نصّ»).
 * والكلمات المحظورة يحرسها `compliance-file.test.ts` على كلّ نصّ هنا.
 *
 * كلّها **خالصة** — الصفحة (`ComplianceFile.tsx`) ترسم وتطبع فقط.
 */
import { displayAllergens } from "@/lib/allergens";
import { groupByCategory } from "@/lib/categories";
import { DAILY_CAFFEINE_MAX_MG, DAILY_KCAL, isHighSodium } from "@/lib/nutrition";
import type { Dish, Menu } from "@/lib/types";

/** ما يُكتب مكان الرقم الغائب — واحدٌ في كل الأعمدة. */
export const NOT_ENTERED = "غير مُدخَل";

/**
 * عنوان الورقة. **لا «امتثال» فيه**: زرّ اللوحة يسمّيها «ملفّ الامتثال» لأن
 * الشاشة اسمها كذلك عند التاجر، أمّا الورقة أمام المفتّش فتصف ما فيها لا حكمَه.
 */
export const FILE_TITLE = "ملفّ البيانات الغذائية للمنيو";

/**
 * الإقرار — يُطبع أعلى الجدول لا في ذيله: من يقرأ الورقة يقرؤه قبل الأرقام.
 * وهو نصّ مربّع الموافقة عند التسجيل نفسه في معناه (`Login.tsx`: «تقديرية
 * أراجعها قبل نشرها»).
 */
export const ESTIMATE_NOTE =
  "الأرقام في هذا الملفّ تقديرية: حسبها التاجر من وصفاته بقيمٍ مرجعية عامّة أو أدخلها بنفسه، وراجعها قبل نشرها. " +
  "وليست نتيجة تحليلٍ مخبري ولا شهادةً من أي جهة، والمسؤولية عن صحّتها على المنشأة.";

export interface ComplianceRow {
  id: string;
  name: string;
  calories: string;
  sodium: string;
  /** صوديوم فوق الحدّ (`isHighSodium`) — يُعلَّم بجانب رقمه كما في المنيو المطبوع. */
  highSodium: boolean;
  caffeine: string;
  allergens: string;
  /** تاريخ آخر تحديث للطبق إن حمله الصفّ — وإلا `null`. */
  updated: string | null;
}

export interface ComplianceSection {
  name: string;
  rows: ComplianceRow[];
}

export interface ComplianceFileData {
  sections: ComplianceSection[];
  total: number;
  /** عدّ ما أُدخل — أرقامٌ لا حكم («مكتمل» لفظ اللوحة، لا الورقة). */
  withCalories: number;
  withSodium: number;
  /** يظهر عمود «آخر تحديث» فقط إن حمل طبقٌ واحد على الأقل تاريخاً. */
  hasUpdated: boolean;
  /** عبارات الهيئة المرجعية — من ثوابت `lib/nutrition.ts` نفسها. */
  statements: string[];
}

/** الطبق كما يصل من `getMyDishes` (`select=*`) — وقد يحمل `updated_at` إن وُجد العمود. */
export type ComplianceDish = Pick<
  Dish,
  "id" | "name" | "category" | "menu_id" | "calories" | "sodium_mg" | "caffeine_mg" | "allergens"
> & { updated_at?: string | null };

/** رقمٌ أو «غير مُدخَل» — وصفرٌ رقمٌ صحيح (عصيرٌ بلا كافيين) لا غياب. */
function num(v: number | null | undefined): string {
  return v === null || v === undefined || !Number.isFinite(v) ? NOT_ENTERED : String(v);
}

/**
 * تاريخٌ ميلادي بأرقام لاتينية وبتوقيت الرياض.
 *
 * ⚠️ `ar-SA` وحدها **هجرية** افتراضياً في المتصفّحات — فبلا `ca-gregory` كان
 * تاريخ الورقة سيُطبع بتقويمٍ غير الذي يكتبه التاجر في سجلّاته.
 */
export function fileDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ar-SA-u-nu-latn-ca-gregory", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Riyadh",
  }).format(date);
}

/**
 * يبني الملفّ من أطباق التاجر.
 *
 * - **القوائم المفعّلة وحدها** (`active !== false`): هي ما يراه الزبون، والمفتّش
 *   يقارن الورقة بالمنيو. والطبق اليتيم (بلا قائمة) لا يُعرض للزبون فلا يُدرج.
 *   والنافد اليوم **يُدرج**: باقٍ في المنيو بشارته (`lib/soldOut.ts`).
 * - الأقسام بترتيب التاجر (`groupByCategory`) — الترتيب نفسه في المطبوع.
 */
export function buildComplianceFile(
  dishes: readonly ComplianceDish[],
  menus: readonly Pick<Menu, "id" | "active">[],
  categoryOrder: string[]
): ComplianceFileData {
  const shown = new Set(menus.filter((m) => m.active !== false).map((m) => m.id));
  const mine = dishes.filter((d) => d.menu_id !== null && shown.has(d.menu_id));
  const groups = groupByCategory([...mine], categoryOrder, "أطباق");

  const sections = groups.map((g) => ({
    name: g.name,
    rows: g.items.map((d) => {
      const al = displayAllergens(d.allergens, false);
      return {
        id: d.id,
        name: d.name,
        calories: num(d.calories),
        sodium: num(d.sodium_mg),
        highSodium: isHighSodium(d.sodium_mg),
        caffeine: num(d.caffeine_mg),
        // قائمةٌ فارغة ليست «خالٍ من الحساسية»: غياب البيانات ليس إثبات خلوّ
        // (المبدأ نفسه في فلتر المنيو) — فتُكتب «غير مُدخَل» لا «لا يوجد».
        allergens: al.length ? al.map((a) => a.label).join("، ") : NOT_ENTERED,
        updated: d.updated_at ? fileDate(d.updated_at) || null : null,
      };
    }),
  }));

  const statements = [
    `يحتاج البالغ في المتوسّط إلى ${DAILY_KCAL.toLocaleString("ar-SA-u-nu-latn")} سعرة حرارية يومياً.`,
  ];
  // كالمنيو الرقمي والمطبوع: عبارة الكافيين متى وُجد صنفٌ بكافيين.
  if (mine.some((d) => (d.caffeine_mg ?? 0) > 0)) {
    statements.push(`الحدّ الأعلى اليومي من الكافيين للبالغ ${DAILY_CAFFEINE_MAX_MG} ملغم.`);
  }

  return {
    sections,
    total: mine.length,
    withCalories: mine.filter((d) => d.calories !== null && d.calories !== undefined).length,
    withSodium: mine.filter((d) => d.sodium_mg !== null && d.sodium_mg !== undefined).length,
    hasUpdated: sections.some((s) => s.rows.some((r) => r.updated)),
    statements,
  };
}

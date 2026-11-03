/**
 * قائمة اشتراطات المنيو — **بنداً بنداً، كما يقرؤها المفتّش**.
 *
 * ═══ لماذا ═══
 *
 * شاشة الامتثال كانت تقول «٨٨٪ جاهز» — رقمٌ صحيح لكنه لا يجيب سؤال التاجر
 * الحقيقي: «لو دخل المفتّش اليوم، وش ينقصني؟». وهذه تجيبه بالبنود نفسها التي
 * يطلبها الاشتراط (السعرات، والصوديوم وعلامته، والكافيين على المشروبات، وتنبيه
 * الحساسية، وجملة الاحتياج اليومي)، ولكل بندٍ حالته وطريق إصلاحه.
 *
 * ⚠️ **الصيغة «جاهز» لا «متوافق مع الهيئة»**: نحسب ونعرض، والمسؤولية النظامية
 * على المنشأة (كما في `lib/plans.ts` و`Legal.tsx`). البند المكتمل يعني أن
 * الرقم موجود ويُعرض، لا أن الجهة اعتمدته.
 *
 * دالّة خالصة: لا شبكة ولا React — يقرؤها `Nutrition.tsx` و`Overview.tsx`،
 * ويحرسها `sfda-checklist.test.ts`.
 */
import type { Dish, Restaurant } from "./types";
import { isDrinkText } from "./recipe";
import { DAILY_CAFFEINE_MAX_MG, DAILY_KCAL } from "./nutrition";

export type CheckState = "done" | "todo" | "auto";

export type CheckItem = {
  id: "calories" | "sodium" | "caffeine" | "allergens" | "daily";
  label: string;
  state: CheckState;
  /** سطرٌ يشرح الحالة: «٧ من ٨ أصناف» · «يظهر تلقائياً أسفل منيوك». */
  detail: string;
  /** إلى أين يذهب التاجر ليُكمل البند — للبند الناقص وحده. */
  fix?: { to: string; label: string };
};

type DishLike = Pick<Dish, "name" | "category" | "calories" | "sodium_mg" | "caffeine_mg">;

const isDrink = (d: Pick<Dish, "name" | "category">) => isDrinkText(`${d.category ?? ""} ${d.name}`);

const NUM = (n: number) => n.toLocaleString("ar-SA-u-nu-latn");

/** «الأصناف: ٧ من ٨» — المعدود قبل العدد، فلا تمييزَ يتبدّل بين ٣ و١١. */
export function ofTotal(have: number, total: number, noun: string): string {
  return `${noun}: ${NUM(have)} من ${NUM(total)}`;
}

export function sfdaChecklist(
  dishes: readonly DishLike[],
  restaurant: Pick<Restaurant, "allergens_text">
): CheckItem[] {
  const total = dishes.length;
  const withKcal = dishes.filter((d) => d.calories !== null).length;
  const withSodium = dishes.filter((d) => d.sodium_mg !== null).length;
  const drinks = dishes.filter(isDrink);
  const drinksWithCaffeine = drinks.filter((d) => d.caffeine_mg !== null).length;
  const note = (restaurant.allergens_text ?? "").trim();

  const toNutrition = { to: "/dashboard/nutrition", label: "احسبها من الوصفة" };

  return [
    {
      id: "calories",
      label: "السعرات الحرارية على كل صنف",
      state: total > 0 && withKcal === total ? "done" : "todo",
      detail:
        total === 0
          ? "أضف أصنافك أوّلاً"
          : `${ofTotal(withKcal, total, "الأصناف")} — ودقائق المشي تُحسب منها تلقائياً`,
      ...(total > 0 && withKcal < total ? { fix: toNutrition } : {}),
    },
    {
      id: "sodium",
      label: "الصوديوم لكل صنف، وعلامة الملح على ما يزيد عن ٦٠٠ ملغم",
      state: total > 0 && withSodium === total ? "done" : "todo",
      detail: total === 0 ? "أضف أصنافك أوّلاً" : `${ofTotal(withSodium, total, "الأصناف")} — والعلامة تظهر تلقائياً`,
      ...(total > 0 && withSodium < total ? { fix: toNutrition } : {}),
    },
    {
      id: "caffeine",
      label: "الكافيين على كل مشروب",
      state: drinksWithCaffeine === drinks.length ? "done" : "todo",
      detail: drinks.length === 0 ? "لا مشروبات في منيوك" : ofTotal(drinksWithCaffeine, drinks.length, "المشروبات"),
      ...(drinksWithCaffeine < drinks.length ? { fix: toNutrition } : {}),
    },
    {
      id: "allergens",
      label: "تنبيه عام عن مسبّبات الحساسية",
      state: note ? "done" : "todo",
      detail: note ? "مكتوب ويظهر أسفل منيوك" : "مثل: «أطباقنا قد تحتوي على مكسرات وجلوتين»",
      ...(note ? {} : { fix: { to: "/dashboard/settings", label: "اكتبه في الإعدادات" } }),
    },
    {
      id: "daily",
      label: `جملة الاحتياج اليومي (${NUM(DAILY_KCAL)} سعرة، و${NUM(DAILY_CAFFEINE_MAX_MG)} ملغم كافيين)`,
      state: "auto",
      detail: "تظهر تلقائياً أسفل منيوك — لا شيء عليك",
    },
  ];
}

/** البنود التي يجب أن يُكملها التاجر بنفسه — `auto` ليس منها. */
export function checklistTodo(items: readonly CheckItem[]): number {
  return items.filter((i) => i.state === "todo").length;
}

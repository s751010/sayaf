/**
 * المعلومات الغذائية المحسوبة.
 *
 * ثلاثة أعمدة في `dishes` هي `GENERATED ALWAYS AS … STORED` — تحسبها قاعدة
 * البيانات ولا يجوز إرسال قيمة لها (وإلا رُفض الطلب كاملاً). الدوال هنا تُكرّر
 * نفس تعبيرات Postgres حرفياً كي نعرض للتاجر ما سيُحسب **قبل** الحفظ، بدل أن
 * نطلب منه إدخاله يدوياً.
 *
 * أي تغيير في تعبير العمود في قاعدة البيانات يجب أن يُطابَق هنا.
 */

/** `round(calories / 4)` — دقائق مشي تقريبية لحرق الطبق. */
export function burnMinutes(calories: number | null): number | null {
  if (calories === null || !Number.isFinite(calories)) return null;
  return Math.round(calories / 4);
}

/** `sodium_mg > 600` — تنبيه صوديوم مرتفع (معيار هيئة الغذاء والدواء). */
export function isHighSodium(sodiumMg: number | null): boolean {
  return sodiumMg !== null && Number.isFinite(sodiumMg) && sodiumMg > 600;
}

/** `calories IS NOT NULL AND sodium_mg IS NOT NULL` — اكتمال بيانات SFDA. */
export function isSfdaCompliant(
  calories: number | null,
  sodiumMg: number | null
): boolean {
  return calories !== null && sodiumMg !== null;
}

export type ComputedNutrition = {
  burnMinutes: number | null;
  highSodium: boolean;
  sfdaCompliant: boolean;
};

export function computedNutrition(
  calories: number | null,
  sodiumMg: number | null
): ComputedNutrition {
  return {
    burnMinutes: burnMinutes(calories),
    highSodium: isHighSodium(sodiumMg),
    sfdaCompliant: isSfdaCompliant(calories, sodiumMg),
  };
}

/** متوسّط الاحتياج اليومي للبالغ — العبارة المرجعية أسفل القوائم. */
export const DAILY_KCAL = 2000;

/**
 * الحدّ الأعلى اليومي للكافيين للبالغ — عبارةٌ تطلبها لائحة الهيئة (نافذة منذ
 * يوليو ٢٠٢٥) **مع** كمية الكافيين في كل منيو فيه مشروبٌ بكافيين.
 */
export const DAILY_CAFFEINE_MAX_MG = 400;

/**
 * الاشتراك — باقة واحدة لكل المزايا.
 *
 * سابقاً كانت باقتان («الأساسية» 99 و«الاحترافية» 199) تفصلان بينهما ميزات
 * (AI، إنجليزية، ولاء، قوائم لامحدودة). حُذف المستشار الذكي وفُتحت الإنجليزية
 * للجميع، فلم يبقَ للتمييز معنى: الآن باقة واحدة بـ99 شهرياً تفتح كل شيء.
 */

export type PlanLimits = {
  /** أقصى عدد قوائم (null = غير محدود). */
  maxMenus: number | null;
  /** أقصى عدد أصناف (null = غير محدود). */
  maxDishes: number | null;
  /** بطاقة الولاء. */
  loyalty: boolean;
  /** منيو ثنائي اللغة (عربي/إنجليزي). */
  english: boolean;
};

export type Plan = {
  /**
   * plan_id المُرسل لبوابة الدفع — يطابق مفاتيح PRICES في دالة moyasar-webhook
   * ({ basic: 49, standard: 99, premium: 199 })، حتى يُفعَّل الاشتراك ويُسجَّل
   * الإيراد بشكل صحيح دون تعديل الدالة.
   *
   * ⚠️ يبقى `standard` لأن سعره في الويبهوك 99 — وهو سعر الباقة الواحدة.
   * لا تغيّره إلى معرّف جديد قبل تعديل الدالة، وإلا سُجِّل الإيراد خطأً.
   */
  id: string;
  name: string;
  /** السعر الشهري بالريال السعودي. */
  monthly: number;
  /** السعر السنوي بالريال (= الشهري × 11، أي شهر مجاني). */
  yearly: number;
  featured?: boolean;
  features: string[];
  limits: PlanLimits;
};

export type BillingCycle = "monthly" | "yearly";

/** العملة الموحّدة عبر كل الصفحات. */
export const CURRENCY = "ر.س";

/** عدد الأشهر المدفوعة في الاشتراك السنوي (12 − شهر مجاني). */
const YEARLY_MONTHS = 11;

/** كل المزايا مفتوحة — لا فروق بين مستويات. */
const ALL_FEATURES: PlanLimits = {
  maxMenus: null,
  maxDishes: null,
  loyalty: true,
  english: true,
};

/**
 * المصدر الوحيد للاشتراك (single source of truth).
 * تُستهلك في صفحة الهبوط، صفحة الفوترة، وفرض الصلاحيات في اللوحة.
 */
export const PLANS: Plan[] = [
  {
    id: "standard",
    name: "كلاود منيو",
    monthly: 99,
    yearly: 99 * YEARLY_MONTHS, // 1089
    featured: true,
    features: [
      "قوائم وأصناف غير محدودة",
      "رفع صور الأطباق مع ضغط تلقائي",
      "أكواد QR للطاولات + صفحة طباعة",
      "منيو ثنائي اللغة (عربي/إنجليزي)",
      "بطاقة الولاء الرقمية",
      "٨ ثيمات + ثيم بلون علامتك",
      "معلومات غذائية ومسببات حساسية (SFDA)",
      "ساعات عمل يومية وحالة «مفتوح الآن»",
      "تحليلات المشاهدات والأطباق",
      "روابط تواصل وتقييم قوقل والموقع",
      "دعم فني مباشر من اللوحة",
    ],
    limits: ALL_FEATURES,
  },
];

/** الباقة الوحيدة — مختصر مريح للمُستدعين. */
export const PLAN = PLANS[0];

export function planPrice(plan: Plan, cycle: BillingCycle): number {
  return cycle === "yearly" ? plan.yearly : plan.monthly;
}

/** ما يعادله الاشتراك السنوي شهرياً — لعرض «يعادل X ر.س/شهر». */
export function effectiveMonthly(plan: Plan, cycle: BillingCycle): number {
  return cycle === "yearly" ? Math.round(plan.yearly / 12) : plan.monthly;
}

/**
 * أي `plan_id` مخزَّن → الباقة الوحيدة.
 * الاشتراكات القديمة تحمل `basic`/`premium`؛ كلها تُفتح الآن على نفس المزايا،
 * فلا حاجة لتمييز — ما يهمّ هو `active` في `entitlements`.
 */
export function resolvePlan(_planId: string | null | undefined): Plan {
  return PLAN;
}

export type PlanLimits = {
  /** أقصى عدد قوائم (null = غير محدود). */
  maxMenus: number | null;
  /** أقصى عدد أصناف (null = غير محدود). */
  maxDishes: number | null;
  /** المستشار الذكي (AI). */
  ai: boolean;
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

/**
 * المصدر الوحيد لباقات الاشتراك (single source of truth).
 * تُستهلك في صفحة الهبوط `/`، صفحة الفوترة، وفرض الصلاحيات في اللوحة.
 */
export const PLANS: Plan[] = [
  {
    id: "standard",
    name: "الأساسية",
    monthly: 99,
    yearly: 99 * YEARLY_MONTHS, // 1089
    features: [
      "قائمة واحدة",
      "حتى 100 صنف",
      "أكواد QR للطاولات",
      "إحصائيات المشاهدات",
      "روابط تواصل وتقييم قوقل",
      "معلومات غذائية + توافق SFDA",
    ],
    limits: {
      maxMenus: 1,
      maxDishes: 100,
      ai: false,
      loyalty: false,
      english: false,
    },
  },
  {
    id: "premium",
    name: "الاحترافية",
    monthly: 199,
    yearly: 199 * YEARLY_MONTHS, // 2189
    featured: true,
    features: [
      "كل مزايا الأساسية",
      "قوائم وأصناف غير محدودة",
      "المستشار الذكي (AI)",
      "بطاقة الولاء",
      "منيو ثنائي اللغة (عربي/إنجليزي)",
      "دعم أولوية",
    ],
    limits: {
      maxMenus: null,
      maxDishes: null,
      ai: true,
      loyalty: true,
      english: true,
    },
  },
];

/** سعر الباقة حسب دورة الفوترة. */
export function planPrice(plan: Plan, cycle: BillingCycle): number {
  return cycle === "yearly" ? plan.yearly : plan.monthly;
}

/** ما يعادله الاشتراك السنوي شهرياً (للعرض: «يعادل X ر.س/شهر»). */
export function effectiveMonthly(plan: Plan, cycle: BillingCycle): number {
  return cycle === "yearly" ? Math.round(plan.yearly / 12) : plan.monthly;
}

/**
 * يحوّل plan_id المخزَّن في الاشتراك إلى باقة لاستخراج الصلاحيات.
 * الميزات المتقدمة (AI/الولاء/الإنجليزي/اللامحدود) تنفتح فقط مع «الاحترافية» (premium).
 * أي معرّف آخر (standard، أو basic القديم، أو غير معروف) يُعامل كـ«الأساسية».
 */
export function resolvePlan(planId: string | null | undefined): Plan {
  const pro = PLANS.find((p) => p.id === "premium")!;
  const basic = PLANS.find((p) => p.id === "standard")!;
  return planId === "premium" ? pro : basic;
}

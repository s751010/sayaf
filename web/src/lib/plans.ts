export type Plan = {
  id: string;
  name: string;
  price: number;
  featured?: boolean;
  features: string[];
};

/** عملة التسعير الموحّدة عبر كل الصفحات. */
export const CURRENCY = "ر.س";

/** نص دورة الفوترة المعروض بجانب السعر (موحّد في كل الصفحات). */
export const PRICE_UNIT_LABEL = `${CURRENCY} / شهرياً`;

/**
 * المصدر الوحيد لباقات الاشتراك (single source of truth).
 * تُستهلك في صفحة الهبوط `/` وصفحة الفوترة `/dashboard/billing`.
 * `id` يطابق `plan_id` المتوقَّع في moyasar-webhook (basic | standard | premium).
 */
export const PLANS: Plan[] = [
  {
    id: "basic",
    name: "الأساسية",
    price: 399,
    features: ["منيو رقمي + QR", "حتى 50 صنف", "إحصائيات أساسية"],
  },
  {
    id: "standard",
    name: "المتقدمة",
    price: 649,
    featured: true,
    features: [
      "كل مزايا الأساسية",
      "أصناف غير محدودة",
      "ذكاء اصطناعي",
      "روابط تواصل وتقييم قوقل",
    ],
  },
  {
    id: "premium",
    name: "الاحترافية",
    price: 949,
    features: [
      "كل مزايا المتقدمة",
      "بطاقة ولاء",
      "مدفوعات وطلبات",
      "دعم أولوية",
    ],
  },
];

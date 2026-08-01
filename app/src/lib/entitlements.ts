/**
 * صلاحيات المستخدم.
 *
 * باقة واحدة تفتح كل المزايا، فالسؤال الوحيد هو: هل الاشتراك نشط؟
 * كل مزايا اللوحة متاحة للتجربة بلا اشتراك — ما يتوقّف بدونه هو **نشر** المنيو
 * للزبائن (انظر `isMenuPublished` في lib/data).
 */
import { getActiveSubscription } from "./data";
import { PLAN, type PlanLimits } from "./plans";

export type Entitlements = PlanLimits & {
  planId: string;
  planName: string;
  /** هل يملك المستخدم اشتراكاً نشطاً غير منتهٍ؟ */
  active: boolean;
  /** الاشتراك النشط هو تجربة مجانية لا اشتراك مدفوع. */
  trial: boolean;
  /** الأيام المتبقية في التجربة (0 إن لم تكن تجربة). */
  trialDaysLeft: number;
  /**
   * الصلاحيات لم تُحسم بعد (الطلب جارٍ).
   * بدونها كان التاجر يرى «بدون اشتراك» لحظةً في كل تحميل.
   */
  loading: boolean;
};

export const DEFAULT_ENTITLEMENTS: Entitlements = {
  ...PLAN.limits,
  planId: PLAN.id,
  planName: PLAN.name,
  active: false,
  trial: false,
  trialDaysLeft: 0,
  loading: true,
};

/**
 * نص حالة الاشتراك كما يُعرض للتاجر — مصدر واحد فلا تختلف الشارات بين الصفحات.
 */
export function planLabel(ent: Entitlements): string {
  if (ent.loading) return "…";
  if (!ent.active) return "بدون اشتراك";
  if (ent.trial) {
    return ent.trialDaysLeft <= 1
      ? "التجربة تنتهي اليوم"
      : `تجربة مجانية · ${ent.trialDaysLeft} يوماً`;
  }
  return `باقة ${ent.planName}`;
}

/** أيام كاملة متبقية حتى `endDate` (٠ إن مضى الموعد). */
function daysLeft(endDate: string | null): number {
  if (!endDate) return 0;
  const ms = new Date(endDate).getTime() - Date.now();
  return ms > 0 ? Math.ceil(ms / 86400_000) : 0;
}

export async function fetchEntitlements(userId: string): Promise<Entitlements> {
  let active = false;
  let trial = false;
  let trialDaysLeft = 0;
  try {
    const sub = await getActiveSubscription(userId);
    active = !!sub;
    // التجربة تفتح كل شيء كالاشتراك المدفوع؛ الفرق في ما نعرضه للتاجر فقط.
    trial = sub?.plan_id === "trial";
    trialDaysLeft = trial ? daysLeft(sub?.end_date ?? null) : 0;
  } catch {
    /* فشل القراءة ⇒ نفترض عدم الاشتراك (لا نمنح نشراً بالخطأ) */
  }
  return {
    ...PLAN.limits,
    planId: PLAN.id,
    planName: PLAN.name,
    active,
    trial,
    trialDaysLeft,
    loading: false,
  };
}

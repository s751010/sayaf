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
  loading: true,
};

export async function fetchEntitlements(userId: string): Promise<Entitlements> {
  let active = false;
  try {
    const sub = await getActiveSubscription(userId);
    active = !!sub;
  } catch {
    /* فشل القراءة ⇒ نفترض عدم الاشتراك (لا نمنح نشراً بالخطأ) */
  }
  return {
    ...PLAN.limits,
    planId: PLAN.id,
    planName: PLAN.name,
    active,
    loading: false,
  };
}

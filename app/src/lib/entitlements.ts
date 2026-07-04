/**
 * صلاحيات المستخدم حسب اشتراكه النشط — نسخة client-side من منطق web/.
 * بدون اشتراك ساري → صلاحيات «الأساسية» افتراضياً (بدون AI/ولاء/إنجليزي/لامحدود).
 */
import { getActiveSubscription } from "./data";
import { resolvePlan, type PlanLimits } from "./plans";

export type Entitlements = PlanLimits & {
  planId: string;
  planName: string;
  /** هل يملك المستخدم اشتراكاً نشطاً غير منتهٍ؟ */
  active: boolean;
};

export const DEFAULT_ENTITLEMENTS: Entitlements = {
  ...resolvePlan(null).limits,
  planId: resolvePlan(null).id,
  planName: resolvePlan(null).name,
  active: false,
};

export async function fetchEntitlements(userId: string): Promise<Entitlements> {
  let planId: string | null = null;
  let active = false;
  try {
    const sub = await getActiveSubscription(userId);
    if (sub) {
      planId = sub.plan_id;
      active = true;
    }
  } catch {
    /* عند فشل القراءة نفترض الأساسية — لا نمنح ميزات مدفوعة بالخطأ */
  }
  const plan = resolvePlan(planId);
  return { ...plan.limits, planId: plan.id, planName: plan.name, active };
}

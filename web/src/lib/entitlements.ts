import "server-only";
import { createServerSupabase, getCurrentUser } from "@/lib/supabase/server";
import { resolvePlan, type PlanLimits } from "@/lib/plans";

export type Entitlements = PlanLimits & {
  /** معرّف الباقة الفعّالة (premium = الاحترافية، غيرها = الأساسية). */
  planId: string;
  /** اسم الباقة الفعّالة للعرض. */
  planName: string;
  /** هل يملك المستخدم اشتراكاً نشطاً غير منتهٍ؟ */
  active: boolean;
};

/**
 * صلاحيات المستخدم الحالي بناءً على اشتراكه النشط.
 * بدون اشتراك ساري → صلاحيات «الأساسية» افتراضياً (بدون AI/ولاء/إنجليزي/لامحدود).
 */
export async function getMyEntitlements(): Promise<Entitlements> {
  const user = await getCurrentUser();
  const supabase = await createServerSupabase();

  let planId: string | null = null;
  let active = false;

  if (user && supabase) {
    const { data } = await supabase
      .from("subscriptions")
      .select("plan_id, active, end_date")
      .eq("user_id", user.id)
      .eq("active", true)
      .order("end_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      const endsAt = data.end_date ? new Date(data.end_date as string).getTime() : null;
      const notExpired = endsAt === null || endsAt > Date.now();
      if (notExpired) {
        planId = (data.plan_id as string) ?? null;
        active = true;
      }
    }
  }

  const plan = resolvePlan(planId);
  return { ...plan.limits, planId: plan.id, planName: plan.name, active };
}

"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase, getCurrentUser } from "@/lib/supabase/server";
import { getMyRestaurant } from "@/lib/owner";
import type { ActionState } from "@/app/dashboard/actions";

/**
 * حفظ بيانات اعتماد PayLink الخاصة بالمطعم.
 *
 * السرّ يُكتب ولا يُقرأ أبداً في اتجاه المتصفح. ترك خانة السرّ فارغة يعني
 * «أبقِ السرّ الحالي كما هو» — حتى لا يضطر التاجر لإعادة لصقه عند كل تعديل.
 */
export async function savePaymentSettings(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createServerSupabase();
  const user = await getCurrentUser();
  const restaurant = await getMyRestaurant();
  if (!supabase || !user || !restaurant) return { error: "أنشئ مطعمك أولاً." };

  const apiId = String(formData.get("api_id") ?? "").trim();
  const secretKey = String(formData.get("secret_key") ?? "").trim();
  const enabled = formData.get("enabled") === "on";

  if (enabled && !apiId) {
    return { error: "أدخل API ID قبل تفعيل الدفع." };
  }

  // هل يوجد سرّ محفوظ مسبقاً؟ (عمود محسوب — لا نقرأ السرّ نفسه)
  const { data: existing } = await supabase
    .from("restaurant_payment_settings")
    .select("has_secret")
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();

  const hasStoredSecret = Boolean((existing as { has_secret: boolean } | null)?.has_secret);
  if (enabled && !secretKey && !hasStoredSecret) {
    return { error: "أدخل Secret Key قبل تفعيل الدفع." };
  }

  const payload: Record<string, unknown> = {
    restaurant_id: restaurant.id,
    user_id: user.id,
    provider: "paylink",
    api_id: apiId || null,
    enabled,
    updated_at: new Date().toISOString(),
  };
  // لا نكتب السرّ إلا إذا أدخل التاجر واحداً جديداً.
  if (secretKey) payload.secret_key = secretKey;

  const { error } = await supabase
    .from("restaurant_payment_settings")
    .upsert(payload, { onConflict: "restaurant_id" });

  if (error) return { error: "تعذّر حفظ بيانات الدفع." };

  revalidatePath("/dashboard/payments");
  return {
    message: enabled
      ? "حُفظت البيانات — الدفع الإلكتروني مفعّل في منيوك."
      : "حُفظت البيانات. الدفع غير مفعّل حالياً.",
  };
}

/** حذف بيانات الاعتماد نهائياً (بما فيها السرّ). */
export async function deletePaymentSettings(): Promise<void> {
  const supabase = await createServerSupabase();
  const restaurant = await getMyRestaurant();
  if (!supabase || !restaurant) return;

  await supabase
    .from("restaurant_payment_settings")
    .delete()
    .eq("restaurant_id", restaurant.id);

  revalidatePath("/dashboard/payments");
}

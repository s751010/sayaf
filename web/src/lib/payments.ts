import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * إعدادات بوابة الدفع الخاصة بالمطعم.
 *
 * ⚠️ `secret_key` **لا يُقرأ هنا إطلاقاً** ولا يُعاد لأي واجهة. الحاجة الوحيدة
 * في اللوحة هي معرفة «هل ضُبط أم لا»، ودالة الحافة وحدها تقرأ السرّ بمفتاح
 * الخدمة لحظة إنشاء الفاتورة.
 */
export type PaymentSettingsView = {
  configured: boolean;
  enabled: boolean;
  apiId: string | null;
};

export async function getMyPaymentSettings(
  restaurantId: string
): Promise<PaymentSettingsView> {
  const supabase = await createServerSupabase();
  if (!supabase) return { configured: false, enabled: false, apiId: null };

  // `has_secret` عمود محسوب في قاعدة البيانات — يخبرنا أن السرّ مضبوط دون
  // أن نجلب السرّ نفسه إلى هذه العملية أصلاً.
  const { data } = await supabase
    .from("restaurant_payment_settings")
    .select("api_id, enabled, has_secret")
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (!data) return { configured: false, enabled: false, apiId: null };

  const row = data as { api_id: string | null; enabled: boolean; has_secret: boolean };
  return {
    configured: Boolean(row.api_id && row.has_secret),
    enabled: Boolean(row.enabled),
    apiId: row.api_id,
  };
}

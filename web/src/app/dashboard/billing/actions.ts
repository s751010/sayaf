"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * يبدأ عملية دفع PayLink ويعيد رابط صفحة الدفع.
 *
 * ⚠️ لا يمرّ أي مبلغ من المتصفح. هذا الإجراء يمرّر `plan_id` و`cycle` فقط إلى
 * دالة `paylink-create` التي تشتقّ السعر من جدول أسعار على الخادم وتتحقق من
 * كود الخصم مقابل جدول `promo_codes`. مفاتيح PayLink السرية لا تغادر أسرار
 * الدالة، ولا يوجد أي مفتاح دفع في حزمة المتصفح.
 *
 * تفعيل الاشتراك لا يحدث هنا ولا في المتصفح — حصراً في `paylink-webhook`
 * بعد أن تؤكّد PayLink الدفع.
 */
export type StartPaymentResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function startPayment(formData: FormData): Promise<StartPaymentResult> {
  const planId = String(formData.get("plan_id") ?? "");
  const cycle = String(formData.get("cycle") ?? "");
  const promoCode = String(formData.get("promo_code") ?? "").trim();

  if (planId !== "standard" && planId !== "premium") {
    return { ok: false, error: "باقة غير معروفة." };
  }
  if (cycle !== "monthly" && cycle !== "yearly") {
    return { ok: false, error: "دورة فوترة غير معروفة." };
  }

  const supabase = await createServerSupabase();
  if (!supabase) return { ok: false, error: "الخدمة غير مهيّأة." };

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { ok: false, error: "انتهت الجلسة، سجّل الدخول مجدداً." };

  const { url: supabaseUrl, anonKey } = getSupabaseEnv();

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/paylink-create`, {
      method: "POST",
      headers: {
        apikey: anonKey!,
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: planId,
        cycle,
        promo_code: promoCode || undefined,
      }),
      cache: "no-store",
    });

    const data = (await res.json().catch(() => ({}))) as {
      url?: string;
      error?: string;
    };
    if (!res.ok || !data.url) {
      return { ok: false, error: data.error ?? "تعذّر بدء عملية الدفع." };
    }
    return { ok: true, url: data.url };
  } catch {
    return { ok: false, error: "تعذّر الاتصال ببوابة الدفع." };
  }
}

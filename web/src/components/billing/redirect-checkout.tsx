"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { providerInfo, type PaymentProvider } from "@/lib/payments";
import type { BillingCycle } from "@/lib/plans";

/**
 * تدفّق الدفع بالتحويل (Paylink / PayTabs / MyFatoorah):
 * يطلب من edge function `payments` إنشاء صفحة دفع مستضافة (السعر يُحسب
 * سيرفرياً هناك) ثم يحوّل العميل إليها. بعد الدفع تعيده البوابة إلى
 * /dashboard/billing/callback حيث يتم التحقق والتفعيل.
 */
export function RedirectCheckout({
  provider,
  planId,
  cycle,
}: {
  provider: PaymentProvider;
  planId: string;
  cycle: BillingCycle;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const info = providerInfo(provider);

  async function start() {
    setPending(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: fnError } = await supabase.functions.invoke(
        "payments",
        { body: { op: "create", plan_id: planId, cycle } }
      );

      if (fnError || !data?.ok || !data?.redirect_url) {
        let code = "";
        const ctx = (fnError as { context?: Response } | null)?.context;
        if (ctx) {
          try {
            code = ((await ctx.json()) as { error?: string })?.error ?? "";
          } catch {
            // تجاهل — نعرض الرسالة العامة
          }
        }
        setError(
          code === "provider_unconfigured"
            ? "بوابة الدفع غير متاحة حالياً — تواصل معنا لتفعيل اشتراكك."
            : "تعذّر بدء عملية الدفع. حاول مجدداً أو تواصل مع الدعم."
        );
        setPending(false);
        return;
      }

      window.location.href = data.redirect_url as string;
    } catch {
      setError("تعذّر بدء عملية الدفع. حاول مجدداً أو تواصل مع الدعم.");
      setPending(false);
    }
  }

  return (
    <div>
      <Button
        variant="gold"
        className="w-full"
        onClick={start}
        disabled={pending}
      >
        {pending ? "جارٍ التحويل..." : "الانتقال إلى صفحة الدفع الآمنة"}
      </Button>
      {error && (
        <p className="mt-3 rounded-xl border border-danger/30 bg-danger/10 p-3 text-center text-xs text-danger">
          {error}
        </p>
      )}
      <p className="mt-3 text-center text-xs text-muted">
        ستُحوَّل إلى صفحة دفع آمنة لدى {info.label} ثم تعود تلقائياً.
      </p>
    </div>
  );
}

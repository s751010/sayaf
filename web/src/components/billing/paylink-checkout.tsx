"use client";

import { useState, useTransition } from "react";
import { startPayment } from "@/app/dashboard/billing/actions";
import { Button } from "@/components/ui/button";
import type { BillingCycle, Plan } from "@/lib/plans";

/**
 * خطوة الدفع: كود خصم اختياري ثم تحويل إلى صفحة PayLink المستضافة.
 *
 * لا يُرسل مبلغ من هنا — الخادم يشتقّ السعر من الباقة والدورة. هذا ما يمنع
 * أن يعرض العميل سعراً ويُخصم منه آخر، وأن يتلاعب أحد بالمبلغ من المتصفح.
 */
export function PaylinkCheckout({
  plan,
  cycle,
}: {
  plan: Plan;
  cycle: BillingCycle;
}) {
  const [promo, setPromo] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    setError("");
    startTransition(async () => {
      const formData = new FormData();
      formData.set("plan_id", plan.id);
      formData.set("cycle", cycle);
      formData.set("promo_code", promo);

      const result = await startPayment(formData);
      if (result.ok) window.location.href = result.url;
      else setError(result.error);
    });
  }

  return (
    <div>
      <label
        htmlFor="promo_code"
        className="mb-1.5 block text-sm font-semibold text-cream"
      >
        كود الخصم (اختياري)
      </label>
      <input
        id="promo_code"
        dir="ltr"
        value={promo}
        onChange={(e) => setPromo(e.target.value.toUpperCase())}
        placeholder="CLOUD10"
        className="w-full rounded-xl border border-line-dim bg-white/5 px-4 py-2.5 font-mono tracking-wide text-cream outline-none transition-colors placeholder:text-muted focus:border-gold/40"
      />
      <p className="mt-1.5 text-xs text-muted">
        يُتحقَّق من الكود ويُحتسب الخصم على الخادم قبل إصدار الفاتورة.
      </p>

      {error && (
        <p className="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </p>
      )}

      <Button
        variant="gold"
        className="mt-5 w-full"
        onClick={submit}
        disabled={pending}
      >
        {pending ? "جارٍ التحويل…" : "المتابعة للدفع"}
      </Button>

      <p className="mt-4 text-center text-xs text-muted">
        ستُحوَّل لصفحة PayLink الآمنة — مدى، بطاقات، Apple Pay، STC Pay.
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { MoyasarForm } from "./moyasar-form";
import { RedirectCheckout } from "./redirect-checkout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, cn } from "@/lib/utils";
import { providerInfo, type PaymentProvider } from "@/lib/payments";
import {
  PLANS,
  CURRENCY,
  planPrice,
  effectiveMonthly,
  type Plan,
  type BillingCycle,
} from "@/lib/plans";

export function BillingClient({
  userId,
  userName,
  provider,
}: {
  userId: string;
  userName: string;
  /** البوابة النشطة من إعدادات المؤسس (site_settings.features.payment_provider). */
  provider: PaymentProvider;
}) {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [plan, setPlan] = useState<Plan | null>(null);
  const yearly = cycle === "yearly";

  if (plan) {
    const amount = planPrice(plan, cycle);
    return (
      <div className="mx-auto max-w-md">
        <button
          onClick={() => setPlan(null)}
          className="mb-4 text-sm text-warm hover:text-gold"
        >
          → تغيير الباقة
        </button>
        <Card>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-bold text-cream">
              باقة {plan.name}{" "}
              <span className="text-sm font-normal text-warm">
                ({yearly ? "سنوي" : "شهري"})
              </span>
            </h2>
            <span className="font-display text-2xl font-black text-gold">
              {formatPrice(amount)} {CURRENCY}
            </span>
          </div>
          {provider === "moyasar" ? (
            <MoyasarForm
              amountHalalas={amount * 100}
              description={`اشتراك كلاود منيو — باقة ${plan.name} (${
                yearly ? "سنوي" : "شهري"
              })`}
              metadata={{
                user_id: userId,
                user_name: userName,
                plan_id: plan.id,
                cycle,
              }}
            />
          ) : (
            <RedirectCheckout
              provider={provider}
              planId={plan.id}
              cycle={cycle}
            />
          )}
          <p className="mt-4 text-center text-xs text-muted">
            مدفوعات آمنة عبر {providerInfo(provider).label} — مدى، بطاقات،
            Apple Pay.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* مبدّل شهري/سنوي */}
      <div className="mb-6 flex justify-center">
        <div className="inline-flex rounded-xl border border-line-dim bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setCycle("monthly")}
            className={cn(
              "rounded-lg px-5 py-2 text-sm font-bold transition-colors",
              !yearly ? "bg-gold text-charcoal" : "text-warm hover:text-cream"
            )}
          >
            شهري
          </button>
          <button
            type="button"
            onClick={() => setCycle("yearly")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-bold transition-colors",
              yearly ? "bg-gold text-charcoal" : "text-warm hover:text-cream"
            )}
          >
            سنوي
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px]",
                yearly
                  ? "bg-charcoal/15 text-charcoal"
                  : "bg-success/15 text-success"
              )}
            >
              شهر مجاني
            </span>
          </button>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {PLANS.map((p) => (
          <Card
            key={p.id}
            className={p.featured ? "border-gold/40 bg-gold/[0.04]" : ""}
          >
            {p.featured && <Badge>الأكثر اختياراً</Badge>}
            <h3 className="mt-3 text-xl font-bold text-cream">{p.name}</h3>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-3xl font-black text-gold">
                {formatPrice(planPrice(p, cycle))}
              </span>
              <span className="text-sm text-warm">
                {CURRENCY} / {yearly ? "سنوياً" : "شهرياً"}
              </span>
            </div>
            <p className="mt-1 h-4 text-xs text-muted">
              {yearly
                ? `يعادل ${formatPrice(effectiveMonthly(p, cycle))} ${CURRENCY}/شهر`
                : ""}
            </p>
            <ul className="mt-5 flex flex-col gap-2">
              {p.features.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2 text-sm text-cream"
                >
                  <Check size={15} className="shrink-0 text-success" /> {f}
                </li>
              ))}
            </ul>
            <Button
              variant={p.featured ? "gold" : "outline"}
              className="mt-6 w-full"
              onClick={() => setPlan(p)}
            >
              اشترك الآن
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

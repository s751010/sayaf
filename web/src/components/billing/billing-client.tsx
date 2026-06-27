"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { MoyasarForm } from "./moyasar-form";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { PLANS, PRICE_UNIT_LABEL, CURRENCY, type Plan } from "@/lib/plans";

export function BillingClient({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const [plan, setPlan] = useState<Plan | null>(null);

  if (plan) {
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
            <h2 className="font-bold text-cream">باقة {plan.name}</h2>
            <span className="font-display text-2xl font-black text-gold">
              {formatPrice(plan.price)} {CURRENCY}
            </span>
          </div>
          <MoyasarForm
            amountHalalas={plan.price * 100}
            description={`اشتراك كلاود منيو — باقة ${plan.name}`}
            metadata={{
              user_id: userId,
              user_name: userName,
              plan_id: plan.id,
              cycle: "monthly",
            }}
          />
          <p className="mt-4 text-center text-xs text-muted">
            مدفوعات آمنة عبر Moyasar — مدى، بطاقات، Apple Pay، STC Pay.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {PLANS.map((p) => (
        <Card key={p.id} className={p.featured ? "border-gold/40 bg-gold/[0.04]" : ""}>
          {p.featured && <Badge>الأكثر اختياراً</Badge>}
          <h3 className="mt-3 text-xl font-bold text-cream">{p.name}</h3>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-black text-gold">
              {formatPrice(p.price)}
            </span>
            <span className="text-sm text-warm">{PRICE_UNIT_LABEL}</span>
          </div>
          <ul className="mt-5 flex flex-col gap-2">
            {p.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-cream">
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
  );
}

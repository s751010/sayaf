"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice, cn } from "@/lib/utils";
import {
  PLANS,
  CURRENCY,
  planPrice,
  effectiveMonthly,
  type BillingCycle,
} from "@/lib/plans";

export function PricingSection() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const yearly = cycle === "yearly";

  return (
    <div className="mx-auto max-w-4xl">
      <h2 className="text-center font-display text-3xl font-bold md:text-4xl">
        باقتان تناسبان كل مطعم
      </h2>
      <p className="mt-3 text-center text-warm">
        اختر دورة الفوترة — الاشتراك السنوي يمنحك شهراً مجاناً.
      </p>

      {/* مبدّل شهري/سنوي */}
      <div className="mt-7 flex justify-center">
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
                yearly ? "bg-charcoal/15 text-charcoal" : "bg-success/15 text-success"
              )}
            >
              شهر مجاني
            </span>
          </button>
        </div>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {PLANS.map((p) => (
          <Card
            key={p.id}
            className={
              p.featured ? "border-gold/40 bg-gold/[0.04] sm:-translate-y-2" : ""
            }
          >
            {p.featured && <Badge>الأكثر اختياراً</Badge>}
            <h3 className="mt-3 text-xl font-bold text-cream">{p.name}</h3>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-4xl font-black text-gold">
                {formatPrice(planPrice(p, cycle))}
              </span>
              <span className="text-sm text-warm">
                {CURRENCY} / {yearly ? "سنوياً" : "شهرياً"}
              </span>
            </div>
            <p className="mt-1 h-4 text-xs text-muted">
              {yearly ? `يعادل ${formatPrice(effectiveMonthly(p, cycle))} ${CURRENCY}/شهر` : ""}
            </p>
            <ul className="mt-6 flex flex-col gap-3">
              {p.features.map((feat) => (
                <li
                  key={feat}
                  className="flex items-center gap-2 text-sm text-cream"
                >
                  <Check size={16} className="shrink-0 text-success" />
                  {feat}
                </li>
              ))}
            </ul>
            <Link
              href="/dashboard/billing"
              className={cn(
                buttonVariants({ variant: p.featured ? "gold" : "outline" }),
                "mt-7 w-full"
              )}
            >
              اختر الباقة
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}

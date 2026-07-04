/** الاشتراك والفوترة — الباقات + الدفع عبر Moyasar (مدى/بطاقات/Apple Pay/STC Pay). */
import { useEffect, useRef, useState } from "react";
import { Badge, Button, Card, ErrorNote, useToast } from "@/components/ui";
import { MOYASAR_PK } from "@/lib/config";
import { getActiveSubscription } from "@/lib/data";
import {
  CURRENCY,
  PLANS,
  planPrice,
  resolvePlan,
  type BillingCycle,
  type Plan,
} from "@/lib/plans";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import type { Subscription } from "@/lib/types";
import { PricingCards } from "@/pages/Landing";
import { useDashboard } from "./Dashboard";

declare global {
  interface Window {
    Moyasar?: { init: (opts: Record<string, unknown>) => void };
  }
}

const MOYASAR_VERSION = "1.14.0";

/**
 * نموذج Moyasar المستضاف. المبلغ بالهللات (×100). المفتاح مفتاح نشر عام.
 * metadata تصل لدالة moyasar-webhook التي تفعّل الاشتراك وتسجّل الإيراد.
 */
function MoyasarForm({
  amountHalalas,
  description,
  metadata,
}: {
  amountHalalas: number;
  description: string;
  metadata: Record<string, string>;
}) {
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    if (!document.getElementById("moyasar-css")) {
      const link = document.createElement("link");
      link.id = "moyasar-css";
      link.rel = "stylesheet";
      link.href = `https://cdn.moyasar.com/mpf/${MOYASAR_VERSION}/moyasar.css`;
      document.head.appendChild(link);
    }

    const start = () => {
      window.Moyasar?.init({
        element: ".moyasar-form",
        amount: amountHalalas,
        currency: "SAR",
        description,
        publishable_api_key: MOYASAR_PK,
        callback_url: `${window.location.origin}/dashboard/billing?payment=done`,
        methods: ["creditcard", "applepay", "stcpay"],
        metadata,
      });
    };

    if (window.Moyasar) start();
    else {
      const script = document.createElement("script");
      script.src = `https://cdn.moyasar.com/mpf/${MOYASAR_VERSION}/moyasar.js`;
      script.onload = start;
      document.body.appendChild(script);
    }
  }, [amountHalalas, description, metadata]);

  return <div className="moyasar-form rounded-xl bg-white p-3" />;
}

export default function Billing() {
  const { user, ent, refreshEnt } = useDashboard();
  const toast = useToast();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [sub, setSub] = useState<Subscription | null | undefined>(undefined);

  useEffect(() => {
    document.title = "الاشتراك — كلاود منيو";
    getActiveSubscription(user.id).then(setSub).catch(() => setSub(null));
    // العودة من بوابة الدفع.
    if (new URLSearchParams(window.location.search).get("payment") === "done") {
      toast("وصل إشعار الدفع — يُفعَّل اشتراكك خلال لحظات.");
      refreshEnt();
    }
  }, [user.id, refreshEnt, toast]);

  const yearly = cycle === "yearly";

  if (plan) {
    const amount = planPrice(plan, cycle);
    return (
      <div className="mx-auto max-w-md">
        <button onClick={() => setPlan(null)} className="mb-4 text-sm font-bold text-dim hover:text-gold">
          → تغيير الباقة
        </button>
        <Card>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-bold text-ink">
              باقة {plan.name}{" "}
              <span className="text-sm font-normal text-dim">({yearly ? "سنوي" : "شهري"})</span>
            </h2>
            <span className="font-display text-2xl font-black text-gold">
              {formatPrice(amount)} {CURRENCY}
            </span>
          </div>
          <MoyasarForm
            amountHalalas={amount * 100}
            description={`اشتراك كلاود منيو — باقة ${plan.name} (${yearly ? "سنوي" : "شهري"})`}
            metadata={{
              user_id: user.id,
              user_name: user.email ?? "",
              plan_id: plan.id,
              cycle,
            }}
          />
          <p className="mt-4 text-center text-xs text-faint">
            مدفوعات آمنة عبر Moyasar — مدى، بطاقات، Apple Pay، STC Pay.
          </p>
          {MOYASAR_PK.startsWith("pk_test") && (
            <div className="mt-3">
              <ErrorNote>وضع الاختبار: لن تُخصم مبالغ حقيقية (مفتاح pk_test).</ErrorNote>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-black text-ink">الاشتراك</h1>

      {/* الحالة الحالية */}
      <Card className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-dim">باقتك الحالية</p>
          <p className="font-display text-xl font-black text-ink">
            {ent.active ? resolvePlan(sub?.plan_id).name : "لا يوجد اشتراك فعّال"}
          </p>
          {sub?.end_date && (
            <p className="mt-0.5 text-xs text-faint">صالح حتى {formatDate(sub.end_date)}</p>
          )}
        </div>
        <Badge variant={ent.active ? "green" : "red"}>{ent.active ? "نشط" : "غير نشط"}</Badge>
      </Card>

      {/* مبدّل الدورة */}
      <div className="mt-8 flex justify-center">
        <div className="inline-flex rounded-xl border border-line bg-panel p-1">
          {(["monthly", "yearly"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCycle(c)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-bold transition-colors",
                cycle === c ? "bg-gold text-on-gold" : "text-dim hover:text-ink"
              )}
            >
              {c === "monthly" ? "شهري" : "سنوي"}
              {c === "yearly" && (
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[11px]",
                  cycle === "yearly" ? "bg-on-gold/15 text-on-gold" : "bg-good/15 text-good"
                )}>
                  شهر مجاني
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <PricingCards
          cycle={cycle}
          onSelect={(id) => setPlan(PLANS.find((p) => p.id === id) ?? null)}
          selectLabel="اشترك الآن"
        />
      </div>

      <p className="mt-6 text-center text-xs text-faint">
        بعد إتمام الدفع يُفعَّل اشتراكك تلقائياً خلال دقيقة. تحتاج مساعدة؟ راسلنا من صفحة التواصل.
      </p>
      {sub === undefined && <span className="sr-only">جارٍ تحميل الاشتراك</span>}
      <div className="mt-4 flex justify-center">
        <Button variant="ghost" onClick={() => refreshEnt().then(() => toast("حُدّثت حالة الاشتراك."))}>
          ↻ تحديث حالة الاشتراك
        </Button>
      </div>
    </div>
  );
}

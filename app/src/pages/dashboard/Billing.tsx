/** الاشتراك والفوترة — الباقات + الدفع عبر PayLink (مدى/بطاقات/Apple Pay/STC Pay). */
import { useEffect, useState } from "react";
import { Badge, Button, Card, ErrorNote, Field, Input, useToast } from "@/components/ui";
import { createPaylinkInvoice } from "@/lib/api";
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

export default function Billing() {
  const { user, ent, refreshEnt } = useDashboard();
  const toast = useToast();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [sub, setSub] = useState<Subscription | null | undefined>(undefined);
  const [promo, setPromo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "الاشتراك — كلاود منيو";
    getActiveSubscription(user.id).then(setSub).catch(() => setSub(null));

    // العودة من صفحة PayLink.
    const payment = new URLSearchParams(window.location.search).get("payment");
    if (payment === "done") {
      toast("وصل إشعار الدفع — يُفعَّل اشتراكك خلال لحظات.");
      refreshEnt();
    } else if (payment === "cancelled") {
      toast("أُلغيت عملية الدفع.", "err");
    }
  }, [user.id, refreshEnt, toast]);

  const yearly = cycle === "yearly";

  /**
   * لا يُرسل أي مبلغ من هنا — الخادم يشتقّ السعر من الباقة والدورة ويتحقق من
   * كود الخصم، ثم نُحوّل العميل لصفحة PayLink. تفعيل الاشتراك يتم حصراً
   * بويبهوك PayLink بعد تأكيد الدفع.
   */
  async function startPayment() {
    if (!plan) return;
    setBusy(true);
    setError("");
    try {
      const invoice = await createPaylinkInvoice({
        planId: plan.id,
        cycle,
        promoCode: promo,
      });
      window.location.href = invoice.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر بدء عملية الدفع.");
      setBusy(false);
    }
  }

  if (plan) {
    const amount = planPrice(plan, cycle);
    return (
      <div className="mx-auto max-w-md">
        <button
          onClick={() => {
            setPlan(null);
            setError("");
          }}
          className="mb-4 text-sm font-bold text-dim hover:text-gold"
        >
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

          <Field label="كود الخصم (اختياري)">
            <Input
              dir="ltr"
              value={promo}
              onChange={(e) => setPromo(e.target.value.toUpperCase())}
              placeholder="CLOUD10"
              className="font-mono tracking-wide"
            />
          </Field>
          <p className="mt-1.5 text-xs text-faint">
            يُتحقَّق من الكود ويُحتسب الخصم على الخادم قبل إصدار الفاتورة.
          </p>

          {error && (
            <div className="mt-4">
              <ErrorNote>{error}</ErrorNote>
            </div>
          )}

          <Button onClick={startPayment} disabled={busy} className="mt-5 w-full">
            {busy ? "جارٍ التحويل…" : "المتابعة للدفع"}
          </Button>

          <p className="mt-4 text-center text-xs text-faint">
            ستُحوَّل لصفحة PayLink الآمنة — مدى، بطاقات، Apple Pay، STC Pay.
          </p>
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

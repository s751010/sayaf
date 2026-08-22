/**
 * بطاقات الأسعار — مصدر واحد لما يراه الزائر في صفحة الهبوط.
 *
 * الأسعار والحدود من `lib/plans.ts` لا من نصّ هنا: رقم الطلب في ويبهوك الدفع
 * يُقرأ من معرّف الباقة نفسه، فالسعر المكتوب بيد في صفحة يعني إيراداً يُسجَّل
 * خطأً (§4 في `docs/payments.md`).
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Card } from "@/components/ui";
import { CURRENCY, PLANS, effectiveMonthly, planPrice, type BillingCycle } from "@/lib/plans";
import { TRIAL_DAYS, trialDays } from "@/lib/data";
import { cn, formatPrice } from "@/lib/utils";

/**
 * مدّة التجربة كما تفرضها القاعدة — **مصدَّرة** لأن البطل يعرضها أيضاً.
 * نسخةٌ ثانية تقرأ `TRIAL_DAYS` وحده كانت ستعرض الاحتياط لا القيمة النافذة،
 * فيقول البطل رقماً وصفحة الأسعار آخر.
 */
export function useTrialDays(): number {
  const [days, setDays] = useState(TRIAL_DAYS);
  useEffect(() => {
    let alive = true;
    trialDays().then((n) => alive && setDays(n));
    return () => {
      alive = false;
    };
  }, []);
  return days;
}

/** تمييز العدد في العربية: يوم · يومان · ٣–١٠ أيام · ١١+ يوماً. */
export function daysLabel(n: number): string {
  if (n === 1) return "يوماً واحداً";
  if (n === 2) return "يومين";
  if (n <= 10) return `${n} أيام`;
  return `${n} يوماً`;
}

export function PricingCards({
  cycle,
  onSelect,
  selectLabel = "اشترك الآن",
}: {
  cycle: BillingCycle;
  onSelect?: (planId: string) => void;
  selectLabel?: string;
}) {
  const yearly = cycle === "yearly";
  const days = useTrialDays();
  // بطاقة واحدة بعمودين — لا طبقة مجانية دائمة. القرار تجاري: مجانيٌّ دائم
  // بلا تمويل يمنح المنتج ولا يجلب إيراداً، والتاجر الذي لا يدفع أبداً لا
  // يصير عميلاً أبداً. المدخل تجربة تنتهي، لا بابٌ مفتوح.
  return (
    <div className="mx-auto grid max-w-4xl items-start gap-5">

      {PLANS.map((p, i) => (
        <Card
          key={p.id}
          className={cn(
            "anim-fade-up relative flex flex-col gap-8 md:flex-row md:items-start",
            p.featured && "border-gold/40 bg-gold/[.04] shadow-[0_0_50px_-18px_var(--c-glow)]"
          )}
        >
          {/* الشارة تصف ما يشتريه التاجر لا شعبيّةً مُدّعاة: لا يوجد عميل
              واحد بعد، و«الأكثر اختياراً» بلا عملاء ادّعاءٌ كاذب. */}
          {p.featured && (
            <Badge className="absolute -top-3 right-5">كل شيء — بلا باقات</Badge>
          )}

          <div className="flex flex-col md:w-[17rem] md:shrink-0">
            <h3 className={cn("font-display text-xl font-extrabold text-ink", i === 0 && "mt-0")}>
              {p.name}
            </h3>
            {/* السنوي **عرضٌ لا دورة فوترة**.
                عرضُ «٥٩٩ سنوياً» وحده رقمٌ كبير يُقارَن بـ٥٩، فيبدو أغلى.
                والمرساة هي ما يدفعه فعلاً لو بقي شهرياً — ٥٩×١٢ — مشطوبةً
                بجانبه. بلا المرساة لا يوجد عرض، بل سعرٌ ثانٍ. */}
            {yearly && (
              <p className="mt-3 flex items-baseline gap-2 text-sm text-dim">
                <span className="line-through decoration-2" dir="ltr">
                  {formatPrice(p.monthly * 12)}
                </span>
                <span>{CURRENCY} لو بقيتَ شهرياً</span>
              </p>
            )}
            <div className={cn("flex items-baseline gap-2", yearly ? "mt-1" : "mt-3")}>
              <span className="font-display text-5xl font-black text-gold" dir="ltr">
                {formatPrice(planPrice(p, cycle))}
              </span>
              <span className="text-sm text-dim">
                {CURRENCY} / {yearly ? "سنوياً" : "شهرياً"}
              </span>
            </div>
            {/* `text-dim` لا `text-faint`: الأخير 3.76:1 على الداكن و2.58:1
                على الفاتح — يسقط AA، وهذا سطر تسعير يُقرأ لا زخرفة. */}
            <p className="mt-2 min-h-5 text-sm">
              {yearly ? (
                <span className="font-bold text-good">
                  توفّر {formatPrice(p.monthly * 12 - p.yearly)} {CURRENCY} — أي{" "}
                  {formatPrice(effectiveMonthly(p, cycle))} {CURRENCY} في الشهر
                </span>
              ) : (
                <span className="text-dim">
                  أو {formatPrice(p.yearly)} {CURRENCY} سنوياً ووفّر{" "}
                  {formatPrice(p.monthly * 12 - p.yearly)}
                </span>
              )}
            </p>

            {/* المدخل: تجربة تنتهي لا باب مفتوح. وذكرُ «بلا بطاقة» هنا لا في
                الأسئلة — لأنه الاعتراض الذي يوقف الضغطة، لا الذي يُبحث عنه. */}
            <p className="mt-4 rounded-xl border border-line-gold bg-gold/[.06] px-3 py-2.5 text-center text-sm font-bold text-ink">
              جرّبه {daysLabel(days)} مجاناً — بلا بطاقة
            </p>

            {onSelect ? (
              <button
                onClick={() => onSelect(p.id)}
                className={cn(
                  "mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl py-2.5 text-sm font-bold transition-colors",
                  p.featured
                    ? "bg-gold text-on-gold hover:bg-gold2"
                    : "border border-line-gold text-ink hover:bg-gold/10"
                )}
              >
                {selectLabel}
              </button>
            ) : (
              <Link
                to="/login?mode=signup"
                className={cn(
                  "mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl py-2.5 text-center text-sm font-bold transition-colors",
                  p.featured
                    ? "bg-gold text-on-gold hover:bg-gold2"
                    : "border border-line-gold text-ink hover:bg-gold/10"
                )}
              >
                {selectLabel}
              </Link>
            )}
          </div>

          <ul className="flex flex-1 flex-col gap-2.5 md:mt-0">
            {p.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-ink">
                <span className="mt-0.5 shrink-0 text-good">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}

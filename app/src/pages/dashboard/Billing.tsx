/**
 * الاشتراك والفوترة — الدفع عبر **PayLink بالتحويل**.
 *
 * ═══ تحويل لا تضمين ═══
 *
 * كان هنا نموذج Moyasar مستضاف يُحقن في الصفحة (`cdn.moyasar.com`). صار
 * الدفع تحويلاً إلى صفحة PayLink، وهذا مكسب أمني لا شكليّ:
 *
 * • **لا يمرّ رقم بطاقة بنا إطلاقاً** — لا في DOM ولا في ذاكرة الصفحة.
 * • **لا سكربت طرف ثالث** في صفحة يملك التاجر فيها جلسة؛ فحُذفت نطاقات
 *   Moyasar من CSP بلا بديل (`public/_headers`).
 * • **لا مبلغ من العميل**: نرسل `cycle` (وكود الخصم إن وُجد) فقط، والخادم
 *   يشتقّ السعر من جدوله — نفس قاعدة سلة الزبون (§13).
 *
 * ═══ الويبهوك هو من يُفعّل، لا العودة ═══
 *
 * `?payment=done` تعني «العميل رجع من صفحة الدفع» لا «الاشتراك فُعِّل».
 * المُفعِّل الوحيد هو `paylink-webhook` بعد أن تسأل PayLink بمفاتيحنا. ولهذا
 * الشاشة تقول «يُفعَّل خلال لحظات» وتستطلع الحالة، ولا تدّعي النجاح.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, ErrorNote, Field, Input, useToast } from "@/components/ui";
import { getActiveSubscription, getMyPayments, type PaymentRow } from "@/lib/data";
import { startSubscription } from "@/lib/billing";
import { ApiError } from "@/lib/api";
import {
  CURRENCY,
  PLAN,
  planPrice,
  resolvePlan,
  type BillingCycle,
} from "@/lib/plans";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import type { Subscription } from "@/lib/types";
import { useDashboard } from "./Dashboard";
import { Icon } from "@/lib/icons";

/** مرّات استطلاع التفعيل بعد العودة، كل ٣ ثوانٍ. */
const POLL_TRIES = 6;
const POLL_MS = 3000;

export default function Billing() {
  const { user, ent, refreshEnt } = useDashboard();
  const toast = useToast();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [sub, setSub] = useState<Subscription | null | undefined>(undefined);
  /** `null` = يُحمَّل · `[]` = لم يدفع بعد (القاعدة ج). */
  const [payments, setPayments] = useState<PaymentRow[] | null>(null);
  const [promo, setPromo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  /** `null` = لم يعُد من الدفع · عدد = محاولات الاستطلاع المتبقّية. */
  const [awaiting, setAwaiting] = useState<number | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    document.title = "الاشتراك — كلاود منيو";
    getActiveSubscription(user.id).then(setSub).catch(() => setSub(null));
    getMyPayments(user.id).then(setPayments).catch(() => setPayments([]));
    const back = new URLSearchParams(window.location.search).get("payment");
    if (back === "done") setAwaiting(POLL_TRIES);
    if (back === "cancelled") setError("أُلغيت العملية — لم يُخصم منك شيء.");
  }, [user.id]);

  /**
   * استطلاع التفعيل بعد العودة.
   *
   * ⚠️ العودة **ليست** تفعيلاً: PayLink تُرجع العميل فور الدفع، بينما الاشتراك
   * يُنشَأ في `paylink-webhook` بعد أن تسأل PayLink بمفاتيحنا — وقد يتأخّر
   * ثوانيَ. ادّعاء «تمّ اشتراكك» هنا كذبٌ يظهر للتاجر بعد ثانيتين حين يرى
   * لوحته بلا اشتراك.
   */
  useEffect(() => {
    if (awaiting === null || ent.active) {
      if (awaiting !== null && ent.active) {
        setAwaiting(null);
        toast("🎉 فُعِّل اشتراكك — شكراً لثقتك.");
      }
      return;
    }
    if (awaiting <= 0) return;
    timer.current = window.setTimeout(() => {
      refreshEnt();
      getActiveSubscription(user.id).then(setSub).catch(() => {});
      getMyPayments(user.id).then(setPayments).catch(() => {});
      setAwaiting((n) => (n ?? 1) - 1);
    }, POLL_MS);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [awaiting, ent.active, refreshEnt, user.id, toast]);

  const yearly = cycle === "yearly";
  const amount = planPrice(PLAN, cycle);

  /**
   * ⚠️ **المبلغ المعروض هنا للطمأنة، والمبلغ الحقيقي يأتي من الخادم.**
   * `startSubscription` لا ترسل مبلغاً؛ `paylink-create` تشتقّه من `cycle`.
   * فلو اختلف المعروض عن المفوتَر فالخادم هو الصادق — ولهذا نعرض ما أعاده
   * قبل التحويل لا ما حسبناه.
   */
  const checkout = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const session = await startSubscription(cycle, promo);
      window.location.assign(session.url);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "تعذّر فتح صفحة الدفع. حاول مجدداً أو راسلنا."
      );
      setBusy(false);
    }
  }, [cycle, promo]);

  return (
    <div>
      <h1 className="font-display text-2xl font-black text-ink">الاشتراك</h1>

      {/* في انتظار تأكيد الويبهوك — لا نقول «تمّ» قبل أن يصل. */}
      {awaiting !== null && !ent.active && (
        <Card className="mt-5 border-gold/40 bg-gold/[.05]">
          <p className="inline-flex items-center gap-2 font-display font-extrabold text-ink">
            <Icon name="clock" size={17} className="shrink-0 text-gold" />
            {awaiting > 0 ? "دفعتك وصلت — يُفعَّل اشتراكك خلال لحظات" : "تأخّر تأكيد الدفع"}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-dim">
            {awaiting > 0
              ? "نتحقّق من البوّابة الآن. لا تغلق الصفحة — ستُحدَّث تلقائياً."
              : "خُصم المبلغ ولم يصلنا التأكيد بعد؟ راسلنا من صندوق الدعم ومعك رقم العملية، ونُفعّله يدوياً."}
          </p>
          {awaiting <= 0 && (
            <Button variant="outline" className="mt-3" onClick={() => setAwaiting(POLL_TRIES)}>
              <Icon name="clock" size={15} /> أعِد المحاولة
            </Button>
          )}
        </Card>
      )}

      {/* الحالة الحالية */}
      <Card className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-dim">باقتك الحالية</p>
          <p className="font-display text-xl font-black text-ink">
            {sub === undefined
              ? "جارٍ التحميل…"
              : ent.trial
                ? "تجربة مجانية"
                : ent.active
                  ? resolvePlan(sub?.plan_id).name
                  : "لا يوجد اشتراك فعّال"}
          </p>
          {sub?.end_date && (
            <p className="mt-0.5 text-xs text-faint">صالح حتى {formatDate(sub.end_date)}</p>
          )}
        </div>
        <Badge variant={ent.loading || sub === undefined ? "neutral" : ent.active ? "green" : "red"}>
          {ent.loading || sub === undefined ? "…" : ent.active ? "نشط" : "غير نشط"}
        </Badge>
      </Card>

      {/* عدّاد التجربة — يشتدّ في آخر ثلاثة أيام. */}
      {ent.trial && (
        <Card
          className={cn(
            "mt-4",
            ent.trialDaysLeft <= 3 ? "border-bad/40 bg-bad/[.05]" : "border-gold/30 bg-gold/[.04]"
          )}
        >
          <p className="font-display font-extrabold text-ink">
            {ent.trialDaysLeft <= 1
              ? "⏳ تجربتك تنتهي اليوم"
              : `⏳ باقٍ ${ent.trialDaysLeft} يوماً من تجربتك المجانية`}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-dim">
            منيوك يعمل الآن بكل المزايا. اشترك قبل انتهاء التجربة ليبقى متاحاً
            لزبائنك بلا انقطاع — بياناتك وأطباقك وصورك تبقى محفوظة في كل الأحوال.
          </p>
        </Card>
      )}

      {/* سجل الدفعات — يظهر لمن دفع فعلاً فقط.
          ⚠️ **إيصال لا فاتورة ضريبية**: الفاتورة الضريبية تحتاج رقماً ضريبياً
          للطرفين وترقيماً متسلسلاً وصيغة ZATCA، وهي مؤجَّلة بقرار المالك. لا
          يُسمّى هذا فاتورة في أي نصّ معروض. */}
      {payments && payments.length > 0 && (
        <Card className="mt-4">
          <p className="inline-flex items-center gap-2 font-display font-extrabold text-ink">
          <Icon name="card" size={17} className="shrink-0 text-gold" />{" "}
          سجل دفعاتك</p>
          <ul className="mt-3 flex flex-col divide-y divide-line">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2.5">
                <span className="text-sm font-bold text-ink">{formatDate(p.created_at)}</span>
                <span className="text-xs text-dim">{p.plan_name ?? "اشتراك"}</span>
                {p.payment_ref && (
                  <code dir="ltr" className="text-[11px] text-faint">
                    {p.payment_ref.slice(0, 20)}
                  </code>
                )}
                <span className="ms-auto font-bold text-gold" dir="ltr">
                  {formatPrice(Number(p.amount ?? 0))} {CURRENCY}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-faint">
            هذا سجل دفعاتك لدينا. تحتاج فاتورة ضريبية بصيغة الهيئة؟ راسلنا من صندوق
            الدعم ونصدرها لك.
          </p>
        </Card>
      )}

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

      {/* بطاقة الدفع — باقة واحدة، فلا معنى لشبكة مفاضلة. */}
      <Card className="mx-auto mt-6 max-w-md border-gold/30">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-lg font-extrabold text-ink">{PLAN.name}</h2>
          <span className="font-display text-3xl font-black text-gold" dir="ltr">
            {formatPrice(amount)}{" "}
            <span className="text-sm font-normal text-dim">{CURRENCY}</span>
          </span>
        </div>
        <p className="mt-1 text-sm text-dim">
          {yearly ? "لسنة كاملة — بشهر مجاني" : "لشهر واحد، تُجدّده متى شئت"}
        </p>

        <ul className="mt-4 flex flex-col gap-1.5">
          {PLAN.features.slice(0, 6).map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-dim">
              <Icon name="check" size={15} className="mt-0.5 shrink-0 text-good" />
              {f}
            </li>
          ))}
        </ul>

        <Field label="كود خصم (اختياري)" className="mt-4">
          <Input
            value={promo}
            onChange={(e) => setPromo(e.target.value)}
            placeholder="اتركه فارغاً إن لم يكن عندك"
            dir="ltr"
            className="text-center"
          />
        </Field>

        {error && (
          <div className="mt-3">
            <ErrorNote>{error}</ErrorNote>
          </div>
        )}

        <Button className="mt-4 w-full py-3" onClick={checkout} disabled={busy}>
          {busy ? "جارٍ فتح صفحة الدفع…" : "اشترك الآن"}
          {!busy && <Icon name="external" size={16} />}
        </Button>

        {/* ما يُطمئن قبل الدفع: أين يذهب، وأن بياناته لا تمرّ بنا. */}
        <p className="mt-3 text-center text-xs leading-relaxed text-faint">
          تُحوَّل إلى صفحة الدفع الآمنة في PayLink — مدى وبطاقات وApple Pay.
          بيانات بطاقتك لا تمرّ بنا ولا نحتفظ بها.
        </p>
        <p className="mt-2 text-center text-xs text-dim">
          بالدفع أنت توافق على{" "}
          <Link to="/help#policy" target="_blank" className="font-bold text-gold hover:underline">
            سياسة الاشتراك والإلغاء والاسترجاع
          </Link>
          .
        </p>
      </Card>

      {/* أكثر ما يقلق التاجر قبل أن يدفع: «وش يصير لبياناتي؟» */}
      <Card className="mx-auto mt-4 max-w-md">
        <p className="inline-flex items-center gap-2 font-display font-extrabold text-ink">
          <Icon name="info" size={17} className="shrink-0 text-gold" /> ماذا يحدث عند انتهاء اشتراكك؟
        </p>
        <ul className="mt-2 flex flex-col gap-1.5 text-sm leading-relaxed text-dim">
          <li className="flex items-start gap-2">
            <Icon name="check" size={15} className="mt-0.5 shrink-0 text-good" />
            <span>
              <b className="text-ink">بياناتك تبقى كما هي</b> — أطباقك وصورك وتصميمك
              وبطاقات ولاء زبائنك، لا يُحذف منها شيء.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Icon name="check" size={15} className="mt-0.5 shrink-0 text-good" />
            <span>لوحتك تبقى مفتوحة، وتُكمل التعديل متى عدت.</span>
          </li>
          <li className="flex items-start gap-2">
            <Icon name="warn" size={15} className="mt-0.5 shrink-0 text-gold" />
            <span>
              قد يتوقّف عرض المنيو للزبائن حتى تجدّد — وأكواد QR المطبوعة تعمل
              كما هي فور التجديد، فلا تحتاج طباعتها من جديد.
            </span>
          </li>
        </ul>
      </Card>

      <div className="mt-5 flex justify-center">
        <Button
          variant="ghost"
          onClick={() => refreshEnt().then(() => toast("حُدّثت حالة الاشتراك."))}
        >
          <Icon name="clock" size={15} /> تحديث حالة الاشتراك
        </Button>
      </div>
    </div>
  );
}

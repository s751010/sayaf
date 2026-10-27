/**
 * تذكرة الاستلام — ما يراه الزبون بعد الدفع، ورابطها `/o/:id` يُحفظ ويُرسَل.
 *
 * تسأل `verifyOrder` عن حالة الدفع لأن فاتورة الطلب على حساب **المطعم** في
 * البوابة لا على حساب المنصّة: لا ويبهوك يصلنا، فالسحب هو السبيل — وبلا أي
 * إعداد يطلبه من التاجر.
 *
 * ═══ الشكل: تذكرةٌ من ورق الطابع (٢٠٢٦/١٠/٢٦) ═══
 *
 * كان رقم الاستلام كتلةً بلون علامة التاجر ونصّاً أبيض بشفافية — تذكرةٌ زرقاء
 * فوق منيو كرافت. الآن **كعبُ تذكرة** بحبر الطابع وخطّ عناوينه، مثقوبٌ عن
 * جسمها بخطٍّ متقطّع وقضمتين، ويلبس خامة كل طابع (`m-o-*` في `menu-skins.css`).
 * و`TicketStub` و`ReviewNudge` تُصدَّران لصفحة المتابعة: شكلٌ واحد للطلب أينما رآه.
 */
import { useEffect, useState } from "react";
import { verifyOrder, type PublicOrder } from "@/lib/data";
import { formatMoney } from "@/lib/utils";
import { vatAddedOnTop } from "@/lib/vat";
import { isVatNumber } from "@/lib/legal";
import { Icon, type IconName } from "@/lib/icons";
import { LoyaltyProgress } from "@/components/menu/LoyaltyProgress";

/** الحالات كما يقرؤها الزبون — لا أسماء تقنية. */
const STATUS_VIEW: Record<
  string,
  { ar: string; en: string; hint_ar: string; hint_en: string; icon: IconName }
> = {
  new: {
    ar: "وصل طلبك للمطعم",
    en: "Order received",
    hint_ar: "سيبدأ التحضير بعد قليل.",
    hint_en: "Preparation starts shortly.",
    icon: "ticket",
  },
  preparing: {
    ar: "طلبك قيد التحضير",
    en: "Preparing your order",
    hint_ar: "لحظات ويجهز.",
    hint_en: "Almost there.",
    icon: "flame",
  },
  ready: {
    ar: "طلبك جاهز للاستلام",
    en: "Ready for pickup",
    hint_ar: "توجّه للكاشير وأرِه الرقم.",
    hint_en: "Head to the counter and show your number.",
    icon: "bell",
  },
  picked_up: {
    ar: "تم الاستلام",
    en: "Picked up",
    hint_ar: "بالهناء والشفاء.",
    hint_en: "Enjoy your meal.",
    icon: "check",
  },
  cancelled: {
    ar: "أُلغي الطلب",
    en: "Order cancelled",
    hint_ar: "راجع المطعم إن خُصم المبلغ.",
    hint_en: "Contact the restaurant if you were charged.",
    icon: "close",
  },
};

/**
 * كعب التذكرة: رقم الاستلام **أكبر شيء في الشاشة** — هو ما يُنادى به.
 * بحبر الطابع وخطّ عناوينه لا كتلةً بلون العلامة؛ والإلغاء يشطبه.
 */
export function TicketStub({
  code,
  restaurant,
  en,
  cancelled = false,
  size = "lg",
}: {
  code: number;
  restaurant: string;
  en: boolean;
  cancelled?: boolean;
  size?: "lg" | "xl";
}) {
  return (
    <div className="m-o-card m-o-stub px-4 pb-5 pt-5 text-center">
      <p className="text-xs font-bold" style={{ color: "var(--m-muted)" }}>
        {en ? "Your pickup number" : "رقم استلامك"}
      </p>
      <p
        className={`m-o-title m-o-num mt-1 font-black leading-none ${size === "xl" ? "text-7xl" : "text-6xl"}`}
        style={{
          color: "var(--m-text)",
          textDecoration: cancelled ? "line-through" : undefined,
          opacity: cancelled ? 0.6 : 1,
        }}
      >
        {code}
      </p>
      <p className="mt-2 text-xs font-bold" style={{ color: "var(--m-muted)" }}>
        {restaurant}
      </p>
    </div>
  );
}

/**
 * «قيّمنا على قوقل» بعد الاستلام — بطاقةٌ هادئة لا نافذة تقاطع.
 *
 * تُعرض حين يصير الطلب جاهزاً أو مُستلَماً فقط: طلب التقييم قبل أن يأكل الزبون
 * سؤالٌ عن شيء لم يجرّبه. والرابط من الحقل نفسه الذي يحمله زرّ الترويسة
 * (`google_review_url`، ويحترم `reviews_enabled`) — لا مصدر ثانٍ.
 */
export function ReviewNudge({ url, en }: { url: string; en: boolean }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="m-o-card m-o-review flex items-center gap-3 px-4 py-3"
      style={{ color: "var(--m-text)" }}
    >
      <span className="m-o-badge flex h-10 w-10 shrink-0 items-center justify-center">
        <Icon name="star" size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="m-o-title block text-sm font-black">{en ? "Enjoyed it?" : "عجبك طلبك؟"}</span>
        <span className="block text-xs" style={{ color: "var(--m-muted)" }}>
          {en ? "Rate us on Google — it takes a minute." : "قيّمنا على قوقل — دقيقة من وقتك تفرق معنا."}
        </span>
      </span>
      <span className="shrink-0" style={{ color: "var(--m-muted)" }}>
        <Icon name="external" size={16} />
      </span>
    </a>
  );
}

/** الحالة التي يُطلب فيها التقييم — بعد أن يكون الطعام في يد الزبون أو على الكاونتر. */
export function wantsReview(status: string): boolean {
  return status === "ready" || status === "picked_up";
}

/**
 * ما يراه الزبون بعد الدفع — **رقم الاستلام أولاً**.
 *
 * ═══ لماذا رقمٌ ضخم لا رسالة شكر ═══
 *
 * كانت هذه الشاشة تقول «تم استلام الدفع» وتنتهي — بلا رقم ولا حالة، لأن
 * الطلب لم يكن يُحفظ أصلاً. والزبون الواقف أمام الكاشير لا يحتاج شكراً؛
 * يحتاج رقماً يُنطق. فالرقم هو أكبر عنصر في الشاشة، وما عداه تفصيل.
 *
 * ═══ التأكيد يقع هنا لا في الويبهوك ═══
 *
 * `verifyOrder` تسأل PayLink بمفاتيح المطعم وتؤكّد الطلب. فحتى لو لم يضبط
 * التاجر أي ويبهوك في حسابه — وأغلبهم لن يفعل — يصل الطلب للوحته لحظة عودة
 * الزبون. والنداء متكافئ فتحديث الصفحة لا يُكرّر شيئاً.
 */
export function PickupTicket({
  orderId,
  status,
  en,
  vatNumber,
  reviewUrl = null,
  onDismiss,
  onConfirmed,
}: {
  orderId: string | null;
  status: "paid" | "cancelled";
  en: boolean;
  /** «شامل الضريبة» ادّعاء بضريبة — لا يُقال إلا لمطعمٍ له رقم ضريبي صالح. */
  vatNumber?: string | null;
  /** رابط تقييم قوقل للمطعم — `null` إن لم يضعه أو أطفأ الزرّ. */
  reviewUrl?: string | null;
  onDismiss: () => void;
  onConfirmed: () => void;
}) {
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "pending" | "error">(
    status === "paid" && orderId ? "loading" : "ok"
  );

  useEffect(() => {
    if (status !== "paid" || !orderId) return;
    let alive = true;
    let timer: number | undefined;

    const check = async () => {
      try {
        const result = await verifyOrder(orderId);
        if (!alive) return;
        if ("pending" in result) {
          setState("pending");
          // البوّابة قد تتأخّر ثوانيَ في تسجيل الدفعة — نعيد السؤال مرّة.
          timer = window.setTimeout(check, 4000);
          return;
        }
        setOrder(result);
        setState("ok");
        onConfirmed();
      } catch {
        if (alive) setState("error");
      }
    };
    check();
    return () => {
      alive = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [orderId, status, onConfirmed]);

  if (status === "cancelled") {
    return (
      <div className="m-o-card anim-fade-up mx-auto mt-5 flex max-w-md items-start gap-3 px-4 py-3">
        <span className="m-o-badge flex h-9 w-9 shrink-0 items-center justify-center">
          <Icon name="info" size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-o-title text-sm font-black" style={{ color: "var(--m-text)" }}>
            {en ? "Payment cancelled" : "أُلغيت عملية الدفع"}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--m-muted)" }}>
            {en
              ? "Your order is still here — you can pay whenever you're ready."
              : "طلبك ما زال موجوداً — تقدر تدفع متى ما جهزت."}
          </p>
        </div>
        <button
          onClick={onDismiss}
          aria-label={en ? "Dismiss" : "إخفاء"}
          className="flex h-9 w-9 shrink-0 items-center justify-center"
          style={{ color: "var(--m-muted)" }}
        >
          <Icon name="close" size={15} />
        </button>
      </div>
    );
  }

  if (state === "loading" || state === "pending") {
    return (
      <div className="m-o-card anim-fade-up mx-auto mt-5 max-w-md px-4 py-5 text-center">
        <p className="m-o-title text-sm font-bold" style={{ color: "var(--m-text)" }}>
          {en ? "Confirming your payment…" : "نؤكّد دفعتك…"}
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--m-muted)" }}>
          {en ? "This takes a few seconds." : "ثوانٍ قليلة، لا تغلق الصفحة."}
        </p>
      </div>
    );
  }

  if (state === "error" || !order) {
    return (
      <div className="m-o-card anim-fade-up mx-auto mt-5 max-w-md px-4 py-4 text-center">
        <p className="m-o-title text-sm font-bold" style={{ color: "var(--m-text)" }}>
          {en ? "Couldn't confirm the order" : "تعذّر تأكيد الطلب"}
        </p>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--m-muted)" }}>
          {en
            ? "If you were charged, show this screen to the staff — your payment is recorded."
            : "إن خُصم المبلغ فأرِ هذه الشاشة للموظف — دفعتك مسجّلة عندنا."}
        </p>
        <button onClick={onDismiss} className="mt-3 min-h-10 text-xs underline" style={{ color: "var(--m-muted)" }}>
          {en ? "Dismiss" : "إخفاء"}
        </button>
      </div>
    );
  }

  const view = STATUS_VIEW[order.status] ?? STATUS_VIEW.new;
  const vatAdded = vatAddedOnTop(order.total, order.items);
  const ready = order.status === "ready";

  return (
    <div data-ticket className="m-ticket anim-fade-up mx-auto mt-5 flex max-w-md flex-col gap-3">
      <div className="m-o-tear">
        <TicketStub code={order.code} restaurant={order.restaurant} en={en} />

        <div className="m-o-card m-o-tail px-4 py-4">
          <div className="flex items-center gap-3">
            {/* الحالة الحاضرة هي «المختار» الوحيد هنا: جاهزٌ ⇒ بلون العلامة. */}
            <span
              className={`m-o-badge flex h-10 w-10 shrink-0 items-center justify-center ${ready ? "m-o-badge-on" : ""}`}
            >
              <Icon name={view.icon} size={19} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="m-o-title text-sm font-black" style={{ color: "var(--m-text)" }}>
                {en ? view.en : view.ar}
              </p>
              <p className="text-xs" style={{ color: "var(--m-muted)" }}>
                {en ? view.hint_en : view.hint_ar}
              </p>
            </div>
          </div>

          <ul className="m-o-rule mt-3 flex flex-col gap-1 pt-3">
            {order.items.map((item, i) => (
              <li key={i} className="flex items-baseline justify-between gap-3 text-xs" style={{ color: "var(--m-muted)" }}>
                <span className="min-w-0 flex-1 truncate">
                  <span className="m-o-num">{item.qty}</span> × {item.name}
                  {item.options ? ` — ${item.options}` : ""}
                </span>
                <span className="m-o-num shrink-0">{formatMoney(item.line_total)}</span>
              </li>
            ))}
          </ul>

          {/* الولاء **قبل الإجمالي**: بعد المبلغ ينتهي انتباه القارئ، وهذه
              الجملة هي التي تُرجعه غداً. */}
          {order.loyalty && <LoyaltyProgress loyalty={order.loyalty} en={en} />}

          {vatAdded > 0 && (
            <div className="mt-3 flex items-baseline justify-between text-xs" style={{ color: "var(--m-muted)" }}>
              <span>{en ? "VAT (15%)" : "ضريبة القيمة المضافة ١٥٪"}</span>
              <span className="m-o-num">{formatMoney(vatAdded, en)}</span>
            </div>
          )}

          <div className="m-o-total mt-3 flex items-baseline justify-between pt-3">
            <span className="m-o-title text-sm font-black" style={{ color: "var(--m-text)" }}>
              {en ? "Total" : "الإجمالي"}
            </span>
            <span className="m-o-num text-sm font-black" style={{ color: "var(--m-text)" }}>
              {formatMoney(order.total, en)}
            </span>
          </div>
          {/* ⚠️ «شامل الضريبة» ادّعاءٌ بضريبة، والتذكرة إيصالٌ يُحفظ: مطعمٌ بلا
              رقم ضريبي صالح لا تُقال عنه. فالسطر واحدٌ من حالتين صادقتين — ضريبةٌ
              أُضيفت فعلاً (مبلغها في السطر أعلاه)، أو أسعارٌ شاملة لمطعمٍ مسجّل —
              وما عداهما صمت. كانت «شامل» تُكتب لكل طلبٍ `vat_included` بلا رقم. */}
          {(vatAdded > 0 || (order.vat_included && isVatNumber(vatNumber))) && (
            <p className="mt-1 text-[11px]" style={{ color: "var(--m-muted)" }}>
              {vatAdded > 0
                ? en
                  ? "Prices exclude VAT — added above"
                  : "الأسعار غير شاملة — أُضيفت الضريبة أعلاه"
                : en
                  ? "VAT (15%) included"
                  : "شامل ضريبة القيمة المضافة ١٥٪"}
            </p>
          )}

          {/* ⚠️ هذا الرابط ليس زينة: بدونه تبقى صفحة المتابعة يتيمة لا يصلها
              أحد. الزبون يقفل جواله وينتظر، والتذكرة داخل المنيو تختفي بأول
              تحديث — فالرابط هو ما يعيده إلى طلبه. */}
          <a
            href={`/o/${orderId}`}
            className="m-o-ghost mt-3 flex min-h-11 w-full items-center justify-center gap-1.5 py-2.5 text-sm font-black"
          >
            <Icon name="link" size={15} /> {en ? "Track my order" : "تابع طلبك — احفظ الرابط"}
          </a>

          <button onClick={onDismiss} className="mt-1 min-h-10 w-full text-xs underline" style={{ color: "var(--m-muted)" }}>
            {en ? "Back to menu" : "العودة للمنيو"}
          </button>
        </div>
      </div>

      {reviewUrl && wantsReview(order.status) && <ReviewNudge url={reviewUrl} en={en} />}
    </div>
  );
}

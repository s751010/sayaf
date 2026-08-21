/**
 * تذكرة الاستلام — ما يراه الزبون بعد الدفع، ورابطها `/o/:id` يُحفظ ويُرسَل.
 *
 * تسأل `verifyOrder` عن حالة الدفع لأن فاتورة الطلب على حساب **المطعم** في
 * البوابة لا على حساب المنصّة: لا ويبهوك يصلنا، فالسحب هو السبيل — وبلا أي
 * إعداد يطلبه من التاجر.
 */
import { useEffect, useState, type CSSProperties } from "react";
import { mFont } from "@/components/menu/chrome";
import { verifyOrder, type PublicOrder } from "@/lib/data";
import { formatMoney } from "@/lib/utils";

/** الحالات كما يقرؤها الزبون — لا أسماء تقنية. */
const STATUS_VIEW: Record<
  string,
  { ar: string; en: string; hint_ar: string; hint_en: string; icon: string }
> = {
  new: {
    ar: "وصل طلبك للمطعم",
    en: "Order received",
    hint_ar: "سيبدأ التحضير بعد قليل.",
    hint_en: "Preparation starts shortly.",
    icon: "🧾",
  },
  preparing: {
    ar: "طلبك قيد التحضير",
    en: "Preparing your order",
    hint_ar: "لحظات ويجهز.",
    hint_en: "Almost there.",
    icon: "👨‍🍳",
  },
  ready: {
    ar: "طلبك جاهز للاستلام",
    en: "Ready for pickup",
    hint_ar: "توجّه للكاشير وأرِه الرقم.",
    hint_en: "Head to the counter and show your number.",
    icon: "✅",
  },
  picked_up: {
    ar: "تم الاستلام",
    en: "Picked up",
    hint_ar: "بالهناء والشفاء 🌿",
    hint_en: "Enjoy your meal 🌿",
    icon: "🎉",
  },
  cancelled: {
    ar: "أُلغي الطلب",
    en: "Order cancelled",
    hint_ar: "راجع المطعم إن خُصم المبلغ.",
    hint_en: "Contact the restaurant if you were charged.",
    icon: "⛔",
  },
};

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
  onDismiss,
  onConfirmed,
}: {
  orderId: string | null;
  status: "paid" | "cancelled";
  en: boolean;
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

  const card: CSSProperties = {
    borderColor: "var(--m-accent)",
    background: "var(--m-surface)",
    borderRadius: "var(--m-radius)",
  };

  if (status === "cancelled") {
    return (
      <div className="anim-fade-up mx-auto mt-5 flex max-w-md items-start gap-3 border px-4 py-3" style={card}>
        <span className="text-2xl">↩️</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black" style={{ color: "var(--m-text)", ...mFont }}>
            {en ? "Payment cancelled" : "أُلغيت عملية الدفع"}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--m-muted)" }}>
            {en
              ? "Your order is still here — you can pay whenever you're ready."
              : "طلبك ما زال موجوداً — تقدر تدفع متى ما جهزت."}
          </p>
        </div>
        <button onClick={onDismiss} aria-label={en ? "Dismiss" : "إخفاء"} className="shrink-0 text-sm" style={{ color: "var(--m-muted)" }}>
          ✕
        </button>
      </div>
    );
  }

  if (state === "loading" || state === "pending") {
    return (
      <div className="anim-fade-up mx-auto mt-5 max-w-md border px-4 py-5 text-center" style={card}>
        <p className="text-sm font-bold" style={{ color: "var(--m-text)", ...mFont }}>
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
      <div className="anim-fade-up mx-auto mt-5 max-w-md border px-4 py-4 text-center" style={card}>
        <p className="text-sm font-bold" style={{ color: "var(--m-text)", ...mFont }}>
          {en ? "Couldn't confirm the order" : "تعذّر تأكيد الطلب"}
        </p>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--m-muted)" }}>
          {en
            ? "If you were charged, show this screen to the staff — your payment is recorded."
            : "إن خُصم المبلغ فأرِ هذه الشاشة للموظف — دفعتك مسجّلة عندنا."}
        </p>
        <button onClick={onDismiss} className="mt-3 text-xs underline" style={{ color: "var(--m-muted)" }}>
          {en ? "Dismiss" : "إخفاء"}
        </button>
      </div>
    );
  }

  const view = STATUS_VIEW[order.status] ?? STATUS_VIEW.new;

  return (
    <div className="anim-fade-up mx-auto mt-5 max-w-md overflow-hidden border" style={card}>
      {/* رقم الاستلام — أكبر شيء في الشاشة عمداً. */}
      <div className="px-4 py-5 text-center" style={{ background: "var(--m-accent)" }}>
        <p className="text-xs font-bold" style={{ color: "var(--m-on-accent, #fff)", opacity: 0.85 }}>
          {en ? "Your pickup number" : "رقم استلامك"}
        </p>
        <p
          className="mt-1 text-6xl font-black tabular-nums leading-none"
          style={{ color: "var(--m-on-accent, #fff)", ...mFont }}
        >
          {order.code}
        </p>
        <p className="mt-2 text-xs" style={{ color: "var(--m-on-accent, #fff)", opacity: 0.85 }}>
          {order.restaurant}
        </p>
      </div>

      <div className="px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{view.icon}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black" style={{ color: "var(--m-text)", ...mFont }}>
              {en ? view.en : view.ar}
            </p>
            <p className="text-xs" style={{ color: "var(--m-muted)" }}>
              {en ? view.hint_en : view.hint_ar}
            </p>
          </div>
        </div>

        <ul className="mt-3 flex flex-col gap-1 border-t pt-3" style={{ borderColor: "var(--m-border)" }}>
          {order.items.map((item, i) => (
            <li key={i} className="flex items-baseline justify-between gap-3 text-xs" style={{ color: "var(--m-muted)" }}>
              <span className="min-w-0 flex-1 truncate">
                {item.qty} × {item.name}
                {item.options ? ` — ${item.options}` : ""}
              </span>
              <span className="tabular-nums">{formatMoney(item.line_total)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex items-baseline justify-between border-t pt-3" style={{ borderColor: "var(--m-border)" }}>
          <span className="text-sm font-black" style={{ color: "var(--m-text)", ...mFont }}>
            {en ? "Total" : "الإجمالي"}
          </span>
          <span className="text-sm font-black tabular-nums" style={{ color: "var(--m-text)" }}>
            {formatMoney(order.total, en)}
          </span>
        </div>
        <p className="mt-1 text-[11px]" style={{ color: "var(--m-muted)" }}>
          {order.vat_included
            ? en
              ? "VAT (15%) included"
              : "شامل ضريبة القيمة المضافة ١٥٪"
            : en
              ? "VAT (15%) not included"
              : "غير شامل ضريبة القيمة المضافة ١٥٪"}
        </p>

        {/* ⚠️ هذا الرابط ليس زينة: بدونه تبقى صفحة المتابعة يتيمة لا يصلها
            أحد. الزبون يقفل جواله وينتظر، والتذكرة داخل المنيو تختفي بأول
            تحديث — فالرابط هو ما يعيده إلى طلبه. */}
        <a
          href={`/o/${orderId}`}
          className="mt-3 flex w-full items-center justify-center gap-1.5 py-2.5 text-sm font-black"
          style={{
            background: "var(--m-bg-2)",
            color: "var(--m-text)",
            border: "1px solid var(--m-border)",
            borderRadius: "var(--m-radius)",
          }}
        >
          📲 {en ? "Track my order" : "تابع طلبك — احفظ الرابط"}
        </a>

        <button onClick={onDismiss} className="mt-2 w-full text-xs underline" style={{ color: "var(--m-muted)" }}>
          {en ? "Back to menu" : "العودة للمنيو"}
        </button>
      </div>
    </div>
  );
}

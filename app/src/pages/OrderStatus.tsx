/**
 * `/o/:id` — صفحة متابعة الطلب.
 *
 * ═══ لماذا صفحة مستقلّة لا لوحة داخل المنيو ═══
 *
 * الزبون يدفع ثم يقفل الجوال ويجلس ينتظر. لوحةٌ داخل المنيو تختفي بأول
 * تحديث، ورقمٌ يُنسى. فالطلب يستحقّ **رابطاً**: يُحفظ في المتصفّح، يُرسَل
 * لمن سيستلم بدلاً عنه، ويُفتح مرّةً بعد مرّة فيجد صاحبه حالته الحيّة.
 *
 * ═══ الاستطلاع ═══
 *
 * `getOrderStatus` تقرأ الصفّ وحده — لا تسأل PayLink. سؤال البوّابة يقع
 * مرّة واحدة في `verifyOrder` عند العودة من الدفع؛ وبعدها كل نداء إليها
 * إهدارٌ لحصّة التاجر. والاستطلاع يتوقّف حين تُخفى الصفحة وحين يكتمل الطلب.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getOrderStatus, type OrderStatus as Status, type PublicOrder } from "@/lib/data";
import { formatMoney, httpUrl } from "@/lib/utils";
import { Icon } from "@/lib/icons";
import { LoyaltyProgress } from "@/components/menu/LoyaltyProgress";

/** المراحل كما يعيشها الزبون. الإلغاء ليس مرحلة — لذلك خارج المسار. */
const STEPS: { key: Status; label: string; icon: string }[] = [
  { key: "new", label: "وصل المطعم", icon: "check" },
  { key: "preparing", label: "قيد التحضير", icon: "flame" },
  { key: "ready", label: "جاهز للاستلام", icon: "bell" },
  { key: "picked_up", label: "تم الاستلام", icon: "star" },
];

const HEADLINE: Record<string, { title: string; body: string }> = {
  new: { title: "وصل طلبك للمطعم", body: "سيبدأ التحضير بعد قليل." },
  preparing: { title: "طلبك قيد التحضير الآن", body: "لحظات ويجهز." },
  ready: { title: "طلبك جاهز!", body: "توجّه للكاشير وأرِه رقمك." },
  picked_up: { title: "تم الاستلام", body: "بالهناء والشفاء 🌿" },
  cancelled: { title: "أُلغي الطلب", body: "راجع المطعم إن خُصم المبلغ." },
};

function etaText(iso: string | null, status: Status): string | null {
  if (!iso || status === "picked_up" || status === "cancelled") return null;
  const mins = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  if (status === "ready") return null;
  if (mins <= 0) return "متوقّع خلال لحظات";
  if (mins === 1) return "متوقّع خلال دقيقة";
  return `متوقّع خلال ${mins} دقيقة`;
}

export default function OrderStatusPage() {
  const { id = "" } = useParams();
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");
  const busy = useRef(false);

  const load = useCallback(async () => {
    if (busy.current || !id) return;
    busy.current = true;
    try {
      const row = await getOrderStatus(id);
      if (row) {
        setOrder(row);
        setState("ok");
      } else {
        setState((prev) => (prev === "ok" ? "ok" : "missing"));
      }
    } catch {
      // فشل شبكة لا يمسح ما على الشاشة.
    } finally {
      busy.current = false;
    }
  }, [id]);

  useEffect(() => {
    document.title = "متابعة الطلب — كلاود منيو";
    load();
  }, [load]);

  const done = order?.status === "picked_up" || order?.status === "cancelled";
  useEffect(() => {
    if (done) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 10000);
    const onShow = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onShow);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onShow);
    };
  }, [load, done]);

  if (state === "loading") {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-5">
        <p className="text-sm text-muted">نجلب طلبك…</p>
      </main>
    );
  }

  if (state === "missing" || !order) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-5 text-center">
        <p className="text-4xl">🔎</p>
        <h1 className="text-lg font-black text-ink">لم نجد هذا الطلب</h1>
        <p className="text-sm text-muted">
          تأكّد من الرابط. وإن كنت دفعت للتوّ فقد يستغرق التأكيد لحظات — حدّث
          الصفحة.
        </p>
        <button onClick={load} className="mt-1 text-sm font-bold text-gold underline">
          تحديث
        </button>
      </main>
    );
  }

  const head = HEADLINE[order.status] ?? HEADLINE.new;
  const eta = etaText(order.ready_eta, order.status);
  const activeIndex = STEPS.findIndex((s) => s.key === order.status);
  const cancelled = order.status === "cancelled";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 px-4 py-6">
      {/* رقم الاستلام — أكبر شيء في الصفحة عمداً: هو ما يُنادى به. */}
      <section
        className={`rounded-3xl px-5 py-6 text-center ${cancelled ? "bg-bad/10" : "bg-gold"}`}
      >
        <p className={`text-xs font-bold ${cancelled ? "text-bad" : "text-ink/70"}`}>
          رقم استلامك
        </p>
        <p
          className={`mt-1 text-7xl font-black tabular-nums leading-none ${
            cancelled ? "text-bad line-through" : "text-ink"
          }`}
        >
          {order.code}
        </p>
        <p className={`mt-2 text-sm font-bold ${cancelled ? "text-bad" : "text-ink/80"}`}>
          {order.restaurant}
        </p>
      </section>

      <section className="rounded-2xl border border-line bg-card px-4 py-4">
        <h1 className="text-base font-black text-ink">{head.title}</h1>
        <p className="mt-0.5 text-sm text-muted">{head.body}</p>
        {eta && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gold/12 px-3 py-1 text-xs font-bold text-gold">
            <Icon name="clock" size={13} /> {eta}
          </p>
        )}

        {!cancelled && (
          <ol className="mt-4 flex flex-col gap-0">
            {STEPS.map((step, i) => {
              const reached = i <= activeIndex;
              const current = i === activeIndex;
              return (
                <li key={step.key} className="flex items-stretch gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] ${
                        reached ? "bg-gold text-ink" : "bg-line text-muted"
                      }`}
                    >
                      <Icon name={step.icon as never} size={13} />
                    </span>
                    {i < STEPS.length - 1 && (
                      <span
                        className={`w-0.5 flex-1 ${i < activeIndex ? "bg-gold" : "bg-line"}`}
                        style={{ minHeight: 18 }}
                      />
                    )}
                  </div>
                  <p
                    className={`pb-3 pt-1 text-sm ${
                      current ? "font-black text-ink" : reached ? "text-ink/70" : "text-muted"
                    }`}
                  >
                    {step.label}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-card px-4 py-4">
        <h2 className="text-sm font-black text-ink">تفاصيل الطلب</h2>
        <ul className="mt-2 flex flex-col gap-1.5">
          {order.items.map((item, i) => (
            <li key={i} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 flex-1 text-ink">
                <span className="font-bold tabular-nums">{item.qty}×</span> {item.name}
                {item.options ? <span className="text-xs text-muted"> — {item.options}</span> : null}
              </span>
              <span className="tabular-nums text-muted">{formatMoney(item.line_total)}</span>
            </li>
          ))}
        </ul>
        {/* الولاء قبل الإجمالي: هذه الصفحة يفتحها الزبون مرّاتٍ وهو ينتظر
            طلبه — وهي أطول لحظة انتباه في رحلته. */}
        {order.loyalty && <LoyaltyProgress loyalty={order.loyalty} en={false} />}

        <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
          <span className="text-sm font-black text-ink">الإجمالي</span>
          <span className="text-sm font-black tabular-nums text-ink">
            {formatMoney(order.total)}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted">
          {order.vat_included
            ? "شامل ضريبة القيمة المضافة ١٥٪"
            : "غير شامل ضريبة القيمة المضافة ١٥٪"}
        </p>
      </section>

      {(order.address || order.maps || order.restaurant_phone) && (
        <section className="rounded-2xl border border-line bg-card px-4 py-4">
          <h2 className="text-sm font-black text-ink">الاستلام من الفرع</h2>
          {order.address && <p className="mt-1 text-sm text-muted">{order.address}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {order.maps && (
              <a
                href={httpUrl(order.maps)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-xs font-bold text-ink"
              >
                <Icon name="pin" size={13} /> الاتجاهات
              </a>
            )}
            {order.restaurant_phone && (
              <a
                href={`tel:${order.restaurant_phone.replace(/[^\d+]/g, "")}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-xs font-bold text-ink"
              >
                <Icon name="bell" size={13} /> اتصل بالمطعم
              </a>
            )}
          </div>
        </section>
      )}

      {order.restaurant_slug && (
        <Link
          to={`/${order.restaurant_slug}`}
          className="text-center text-sm font-bold text-gold underline"
        >
          العودة لمنيو {order.restaurant}
        </Link>
      )}
    </main>
  );
}

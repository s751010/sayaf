/**
 * شاشة الكاشير — لوحٌ على الكاونتر يُقرأ من مترين.
 *
 * ═══ ليست صفحة الطلبات بخطٍّ أكبر ═══
 *
 * صفحة الطلبات (`Orders.tsx`) يفتحها التاجر من جواله ليُدير: يغلق الاستقبال،
 * يطبع، يلغي، يتّصل بالزبون. وهذه يقف أمامها كاشيرٌ يداه مشغولتان: لا يقرأ،
 * يلمح — فالرقم أكبر شيء، ثم الأصناف وخياراتها، ثم الملاحظة بالأحمر، ثم زرٌّ
 * واحد بعرض البطاقة ينقل الطلب خطوة. لا إلغاء هنا: لمسةٌ خاطئة على لوحٍ
 * مزدحم تُلغي طلباً مدفوعاً، والإلغاء يحتاج تأكيداً وقراراً — مكانه صفحة
 * الطلبات. ولا جوال الزبون: الشاشة مقابل الصالة.
 *
 * ═══ ثلاثة مسارات بترتيب المطبخ ═══
 *
 * «جديد ← قيد التحضير ← جاهز» — أفقياً حين يكون اللوح بالعرض، وبعضها تحت بعض
 * حين يكون بالطول (٧٦٨ و١٠٢٤ في الوضعين مقيسةٌ في `e2e/kitchen.spec.ts`).
 * والأزرار والحالات من `lib/orderFlow.ts` — الجدول نفسه الذي تقرؤه صفحة
 * الطلبات، ومطابقٌ لمراحل الزبون في صفحة المتابعة.
 *
 * ═══ الشاشة لا تنطفئ ═══
 *
 * `navigator.wakeLock` حيث يوجد — والمتصفّح يُسقطه كلّما اختفى التبويب، فيُعاد
 * طلبه عند الظهور. وحيث لا يوجد يُقال ذلك للكاشير بدل أن يُفترض.
 *
 * ═══ القاعدة (ج) ═══
 *
 * `null` = يُحمَّل · `[]` = لا طلبات فعلاً · والفشل حالةٌ ثالثة: قبل أوّل
 * نجاح شاشةُ «لم نصل» بزرّ إعادة — لا «لا طلبات» يطمئن إليها كاشيرٌ وزبونٌ
 * دفع ينتظر. وبعد نجاحٍ تبقى الطلبات المعروضة ويُقال إنها قد تكون قديمة.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertControls, useOrderAlerts } from "@/components/OrderAlerts";
import { Badge, Button, Skeleton, useToast } from "@/components/ui";
import { listOrders, setOrderStatus, type MerchantOrder, type OrderStatus } from "@/lib/data";
import { Icon } from "@/lib/icons";
import { LABEL, NEXT, OPEN, clockTime, isLate, since } from "@/lib/orderFlow";
import { usePolling } from "@/lib/poll";
import { cn } from "@/lib/utils";
import { useDashboard } from "./Dashboard";

/** عنوان المسار وتمييزه — «جديد» يلمع لأنه ما ينتظر يداً. */
const LANES: { status: OrderStatus; title: string; empty: string }[] = [
  { status: "new", title: "جديد", empty: "لا طلب جديد" },
  { status: "preparing", title: "قيد التحضير", empty: "لا شيء يُحضَّر" },
  { status: "ready", title: "جاهز للاستلام", empty: "لا شيء ينتظر زبونه" },
];

/** `null` = نسأل · `true` = محجوز · `false` = غير متاح أو رُفض. */
function useWakeLock(): boolean | null {
  const [awake, setAwake] = useState<boolean | null>(null);
  useEffect(() => {
    if (!("wakeLock" in navigator)) {
      setAwake(false);
      return;
    }
    let alive = true;
    let sentinel: WakeLockSentinel | null = null;
    const acquire = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const s = await navigator.wakeLock.request("screen");
        if (!alive) {
          void s.release().catch(() => {});
          return;
        }
        sentinel = s;
        setAwake(true);
        s.addEventListener("release", () => {
          if (alive) setAwake(false);
        });
      } catch {
        // بطارية منخفضة أو سياسة المتصفّح — نقوله ولا ننهار.
        if (alive) setAwake(false);
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void acquire();
    };
    void acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", onVisible);
      void sentinel?.release().catch(() => {});
    };
  }, []);
  return awake;
}

export default function Kitchen() {
  const { restaurant } = useDashboard();
  const { sync } = useOrderAlerts();
  const toast = useToast();
  const [orders, setOrders] = useState<MerchantOrder[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  // «قبل ٣ د» يتقدّم وحده بين جولتين — الكاشير يحكم بها على التأخّر.
  const [now, setNow] = useState(() => Date.now());
  const awake = useWakeLock();

  useEffect(() => {
    document.title = "شاشة الكاشير — كلاود منيو";
    const t = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    const rows = await listOrders(restaurant.id);
    setOrders(rows);
    setNow(Date.now());
    // الشاشة تعرض الطلبات ⇒ «رآها» التاجر، ويرنّ الجرس لما لم يُرنّ له.
    sync(rows, { seen: true });
  }, [restaurant.id, sync]);

  const poll = usePolling(load);

  async function move(order: MerchantOrder, to: OrderStatus) {
    setBusy(order.id);
    // تحديث متفائل: الكاشير يضغط ويلتفت للزبون، فانتظار الشبكة يُربكه.
    setOrders((prev) =>
      prev ? prev.map((o) => (o.id === order.id ? { ...o, status: to } : o)) : prev
    );
    try {
      await setOrderStatus(order.id, to);
    } catch {
      // التراجع محلّياً أوّلاً: لو فشلت إعادة الجلب أيضاً لبقي على الشاشة
      // «جاهز» لطلبٍ لم يُعلَّم جاهزاً — والزبون يرى غير ما يراه الكاشير.
      setOrders((prev) =>
        prev ? prev.map((o) => (o.id === order.id ? { ...o, status: order.status } : o)) : prev
      );
      toast(`تعذّر تحديث الطلب ${order.code} — أعدناه إلى حالته.`, "err");
      poll.refresh();
    } finally {
      setBusy(null);
    }
  }

  const lanes = useMemo(
    () =>
      LANES.map((lane) => ({
        ...lane,
        // الأقدم أوّلاً داخل المسار: من انتظر أكثر يُخدم أوّلاً.
        orders: (orders ?? [])
          .filter((o) => o.status === lane.status)
          .sort((a, b) => a.created_at.localeCompare(b.created_at)),
      })),
    [orders]
  );

  const failing = poll.failures > 0;
  const openCount = (orders ?? []).filter((o) => OPEN.includes(o.status)).length;
  const accepting = restaurant.accepting_orders !== false;

  return (
    <div className="flex min-h-dvh flex-col bg-page text-ink">
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-line bg-page/95 px-4 py-3 backdrop-blur sm:px-6">
        {/* سهمٌ نصّي لا `chevron`: تلك تنقلب في RTL لتشير «إلى الأمام»، والرجوع
            هنا إلى اليمين — حيث يبدأ السطر العربي. */}
        <Link
          to="/dashboard/orders"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] border border-line px-3 text-sm font-bold text-dim hover:text-ink"
        >
          <span aria-hidden="true">→</span> الطلبات
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl font-black text-ink">شاشة الكاشير</h1>
          <p className="truncate text-sm text-dim">
            {restaurant.name}
            {orders !== null && ` · ${openCount} طلب مفتوح`}
            {awake === true && " · الشاشة لن تنطفئ"}
          </p>
        </div>
        <AlertControls large />
      </header>

      {!accepting && (
        <p className="border-b border-bad/30 bg-bad/[.07] px-4 py-2 text-center text-sm font-bold text-bad sm:px-6">
          استقبال الطلبات مغلق — السلّة مخفيّة عن الزبائن. تفتحه من{" "}
          <Link to="/dashboard/orders" className="underline">
            صفحة الطلبات
          </Link>
          .
        </p>
      )}

      {/* فشلٌ بعد نجاح: ما على الشاشة يبقى، ويُقال إنه قد لا يكون الأحدث. */}
      {failing && orders !== null && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-center gap-3 border-b border-line bg-panel2 px-4 py-2 text-sm text-dim"
        >
          <span>
            لم نصل للتحديث{poll.lastOk ? ` منذ ${since(new Date(poll.lastOk).toISOString(), now)}` : ""} —
            نعيد المحاولة تلقائياً، وقد يكون هنا ما لم يظهر بعد.
          </span>
          <Button variant="outline" onClick={poll.refresh}>
            أعد المحاولة الآن
          </Button>
        </div>
      )}

      <main className="flex-1 px-4 py-4 sm:px-6">
        {orders === null ? (
          failing ? (
            <div role="alert" className="mx-auto mt-16 flex max-w-md flex-col items-center gap-3 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-bad/10 text-bad">
                <Icon name="warn" size={24} />
              </span>
              <h2 className="text-xl font-black text-ink">لم نصل إلى طلباتك</h2>
              <p className="text-base text-dim">
                غالباً انقطاعٌ في الاتصال. الطلبات محفوظة عندنا ولم يضع منها شيء — وسنعيد
                المحاولة تلقائياً.
              </p>
              {/* الحجم داخل وسمٍ لا في `className`: `cn` تجمع ولا تدمج، فـ`text-sm`
                  في الزرّ و`text-base` هنا يتنازعان والفائز ترتيب CSS لا النيّة. */}
              <Button className="min-h-12 px-6" onClick={poll.refresh}>
                <span className="text-base">أعد المحاولة</span>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 landscape:grid-cols-3">
              <Skeleton className="h-56" />
              <Skeleton className="h-56" />
              <Skeleton className="h-56" />
            </div>
          )
        ) : (
          <div className="grid items-start gap-4 landscape:grid-cols-3">
            {lanes.map((lane) => (
              <section key={lane.status} aria-label={lane.title} className="flex min-w-0 flex-col gap-3">
                <h2 className="flex items-center gap-2 text-lg font-black text-ink">
                  <span
                    className={cn(
                      "h-3 w-3 rounded-full",
                      lane.status === "new" ? "bg-gold" : lane.status === "ready" ? "bg-good" : "bg-ink/30"
                    )}
                    aria-hidden="true"
                  />
                  {lane.title}
                  <span className="text-base font-bold text-dim tabular-nums">{lane.orders.length}</span>
                </h2>
                {lane.orders.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-faint">
                    {lane.empty}
                  </p>
                ) : (
                  <div className="grid gap-3 portrait:sm:grid-cols-2 portrait:lg:grid-cols-3">
                    {lane.orders.map((order) => (
                      <TicketCard
                        key={order.id}
                        order={order}
                        now={now}
                        busy={busy === order.id}
                        onMove={move}
                      />
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function TicketCard({
  order,
  now,
  busy,
  onMove,
}: {
  order: MerchantOrder;
  now: number;
  busy: boolean;
  onMove: (order: MerchantOrder, to: OrderStatus) => void;
}) {
  const next = NEXT[order.status];
  const late = isLate(order, now);
  const fresh = order.status === "new";
  return (
    <article
      aria-label={`طلب رقم ${order.code}`}
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-2xl border bg-panel p-4",
        fresh ? "border-gold ring-2 ring-gold/30" : "border-line",
        late && "ring-2 ring-bad/50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* رقم الاستلام: أكبر عنصر عمداً — هو ما يُنادى به. */}
        <div className="min-w-0">
          <span className="block text-xs font-bold text-dim">رقم</span>
          <span className="block text-5xl font-black leading-none text-ink tabular-nums">
            {order.code}
          </span>
        </div>
        <div className="shrink-0 text-end">
          <p className="text-lg font-black text-ink tabular-nums" dir="ltr">
            {clockTime(order.created_at)}
          </p>
          <p className="text-sm text-dim">{since(order.created_at, now)}</p>
          {late && (
            <Badge variant="red" className="mt-1">
              تأخّر
            </Badge>
          )}
          {!late && !fresh && (
            <Badge variant={LABEL[order.status]?.variant ?? "neutral"} className="mt-1">
              {LABEL[order.status]?.text ?? order.status}
            </Badge>
          )}
        </div>
      </div>

      {order.customer_name && (
        <p className="text-lg font-bold text-ink [overflow-wrap:anywhere]">{order.customer_name}</p>
      )}

      <ul className="flex flex-col gap-1.5 border-t border-line pt-3">
        {order.items.map((item, i) => (
          <li key={i} className="text-lg leading-snug text-ink [overflow-wrap:anywhere]">
            <span className="font-black tabular-nums">{item.qty}×</span> {item.name}
            {item.options ? (
              <span className="block text-base text-dim">{item.options}</span>
            ) : null}
          </li>
        ))}
      </ul>

      {order.note && (
        <p className="rounded-xl bg-bad/[.08] px-3 py-2 text-base font-bold text-bad [overflow-wrap:anywhere]">
          ⚠️ {order.note}
        </p>
      )}

      {next && (
        <Button
          className="min-h-14 w-full"
          variant={order.status === "ready" ? "outline" : "gold"}
          disabled={busy}
          onClick={() => onMove(order, next.to)}
        >
          <span className="text-lg font-black">{next.label}</span>
        </Button>
      )}
    </article>
  );
}

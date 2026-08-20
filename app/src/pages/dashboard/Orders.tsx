/**
 * لوحة الطلبات — ما يراه الكاشير في الذروة.
 *
 * ═══ صُمّمت للنظرة لا للقراءة ═══
 *
 * الكاشير لا «يقرأ» هذه الشاشة؛ يلمحها بين زبونين. فالترتيب: رقم الاستلام
 * أولاً وأكبر عنصر، ثم زرّ الفعل التالي وحده — لا قائمة حالات يختار منها.
 * والطلبات الجديدة أعلى القائمة دائماً.
 *
 * ═══ التحديث ═══
 *
 * استطلاع كل ١٥ ثانية بدل realtime: الاشتراك الحيّ يحتاج اتصالاً مفتوحاً
 * يسقط مع كل قفل شاشة على جهاز الكاشير، والاستطلاع البسيط أصدق في هذه
 * البيئة. ويتوقّف حين تكون الصفحة مخفيّة فلا يستهلك بطارية بلا فائدة.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, Card, EmptyState, Skeleton, useToast } from "@/components/ui";
import { listOrders, setOrderStatus, type MerchantOrder, type OrderStatus } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import { useDashboard } from "./Dashboard";

/** الحالة التالية وزرّها. `null` = الطلب انتهى. */
const NEXT: Record<string, { to: OrderStatus; label: string } | null> = {
  new: { to: "preparing", label: "ابدأ التحضير" },
  preparing: { to: "ready", label: "جاهز للاستلام" },
  ready: { to: "picked_up", label: "سلّمته للزبون" },
  picked_up: null,
  cancelled: null,
};

const LABEL: Record<string, { text: string; variant: "gold" | "green" | "red" | "neutral" }> = {
  new: { text: "جديد", variant: "gold" },
  preparing: { text: "قيد التحضير", variant: "gold" },
  ready: { text: "جاهز للاستلام", variant: "green" },
  picked_up: { text: "سُلّم", variant: "neutral" },
  cancelled: { text: "ملغي", variant: "red" },
};

const OPEN: OrderStatus[] = ["new", "preparing", "ready"];

function since(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "الآن";
  if (mins < 60) return `قبل ${mins} د`;
  const hours = Math.round(mins / 60);
  return `قبل ${hours} س`;
}

export default function Orders() {
  const { restaurant } = useDashboard();
  const toast = useToast();
  const [orders, setOrders] = useState<MerchantOrder[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  // مرجعٌ لا حالة: يُقرأ داخل مؤقّت ولا يجوز أن تُعيد قيمته جدولة المؤقّت.
  const loading = useRef(false);

  const load = useCallback(async () => {
    if (loading.current) return;
    loading.current = true;
    try {
      setOrders(await listOrders(restaurant.id));
    } catch {
      // فشل استطلاع لا يمسح ما على الشاشة: طلبٌ قديم أنفع من فراغ.
    } finally {
      loading.current = false;
    }
  }, [restaurant.id]);

  useEffect(() => {
    load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 15000);
    const onShow = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onShow);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onShow);
    };
  }, [load]);

  async function move(order: MerchantOrder, to: OrderStatus) {
    setBusy(order.id);
    // تحديث متفائل: الكاشير يضغط ويلتفت للزبون، فانتظار الشبكة يُربكه.
    setOrders((prev) =>
      prev ? prev.map((o) => (o.id === order.id ? { ...o, status: to } : o)) : prev
    );
    try {
      await setOrderStatus(order.id, to);
    } catch {
      toast("تعذّر تحديث الطلب — حدّث الصفحة.", "err");
      await load();
    } finally {
      setBusy(null);
    }
  }

  const { open, done } = useMemo(() => {
    const list = orders ?? [];
    return {
      open: list.filter((o) => OPEN.includes(o.status)),
      done: list.filter((o) => !OPEN.includes(o.status)),
    };
  }, [orders]);

  if (orders === null) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-black text-ink">الطلبات</h1>
          <p className="text-xs text-muted">
            {open.length > 0
              ? `${open.length} طلب مفتوح`
              : "لا طلبات مفتوحة — الشاشة تتحدّث تلقائياً"}
          </p>
        </div>
        <Button variant="ghost" onClick={load}>
          تحديث
        </Button>
      </div>

      {open.length === 0 && done.length === 0 && (
        <EmptyState
          icon="ticket"
          title="لا طلبات بعد"
          desc="حين يدفع زبون من صفحة منيوك، يظهر طلبه هنا فوراً برقم استلام."
        />
      )}

      {open.map((order) => {
        const next = NEXT[order.status];
        const label = LABEL[order.status] ?? LABEL.new;
        return (
          <Card key={order.id} className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              {/* رقم الاستلام: أكبر عنصر عمداً — هو ما يُنادى به. */}
              <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-gold/12 text-gold">
                <span className="text-[10px] font-bold opacity-70">رقم</span>
                <span className="text-2xl font-black tabular-nums leading-none">{order.code}</span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={label.variant}>{label.text}</Badge>
                  <span className="text-xs text-muted">{since(order.created_at)}</span>
                  <span className="text-xs font-bold tabular-nums text-ink">
                    {formatPrice(order.total)}
                  </span>
                </div>

                <ul className="mt-2 flex flex-col gap-0.5">
                  {order.items.map((item, i) => (
                    <li key={i} className="text-sm text-ink">
                      <span className="font-bold tabular-nums">{item.qty}×</span> {item.name}
                      {item.options ? (
                        <span className="text-xs text-muted"> — {item.options}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>

                {order.note && (
                  <p className="mt-2 rounded-lg bg-bad/[.06] px-2.5 py-1.5 text-xs font-bold text-bad">
                    ⚠️ {order.note}
                  </p>
                )}

                {(order.customer_name || order.customer_phone) && (
                  <p className="mt-1.5 text-xs text-muted">
                    {order.customer_name}
                    {order.customer_name && order.customer_phone ? " · " : ""}
                    {order.customer_phone && (
                      <a href={`tel:${order.customer_phone}`} dir="ltr" className="underline">
                        {order.customer_phone}
                      </a>
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {next && (
                <Button
                  className="flex-1"
                  disabled={busy === order.id}
                  onClick={() => move(order, next.to)}
                >
                  {next.label}
                </Button>
              )}
              <Button
                variant="ghost"
                disabled={busy === order.id}
                onClick={() => {
                  if (confirm(`إلغاء الطلب رقم ${order.code}؟`)) move(order, "cancelled");
                }}
              >
                إلغاء
              </Button>
            </div>
          </Card>
        );
      })}

      {done.length > 0 && (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setShowDone((v) => !v)}
            className="self-start text-xs font-bold text-muted underline"
          >
            {showDone ? "إخفاء" : `عرض المنتهية (${done.length})`}
          </button>
          {showDone &&
            done.map((order) => {
              const label = LABEL[order.status] ?? LABEL.picked_up;
              return (
                <Card key={order.id} className="flex items-center gap-3 opacity-70">
                  <span className="text-lg font-black tabular-nums text-muted">{order.code}</span>
                  <Badge variant={label.variant}>{label.text}</Badge>
                  <span className="min-w-0 flex-1 truncate text-xs text-muted">
                    {order.items.map((i) => `${i.qty}× ${i.name}`).join("، ")}
                  </span>
                  <span className="text-xs font-bold tabular-nums text-ink">
                    {formatPrice(order.total)}
                  </span>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}

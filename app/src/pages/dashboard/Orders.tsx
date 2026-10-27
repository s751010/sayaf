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
 * استطلاع كل عشرين ثانية بدل realtime — `usePolling` في `lib/poll.ts`: يتوقّف
 * والصفحة مخفيّة، ويتراجع عند فشل الشبكة. والجرس **ليس هنا**: صار للّوحة كلّها
 * (`OrderAlertsProvider`)، وهذه الصفحة تسلّمه ما جلبته فيرنّ لما وصل ويعلّمه
 * «مرئياً». ولشاشة الكاونتر صفحتها: `Kitchen.tsx`.
 */
import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertControls, useOrderAlerts } from "@/components/OrderAlerts";
import { Badge, Button, Card, EmptyState, Skeleton, useToast } from "@/components/ui";
import {
  listOrders,
  setOrderStatus,
  updateRestaurantFields,
  type MerchantOrder,
  type OrderStatus,
} from "@/lib/data";
import { Icon } from "@/lib/icons";
import { LABEL, NEXT, OPEN, isLate, since } from "@/lib/orderFlow";
import { usePolling } from "@/lib/poll";
import { formatMoney } from "@/lib/utils";
import { vatAddedOnTop } from "@/lib/vat";
import { useDashboard } from "./Dashboard";

/**
 * تذكرة المطبخ.
 *
 * نافذة طباعة بـHTML مبنيّ هنا لا `window.print()` على الصفحة: لوحة التاجر
 * مليئة بما لا يخصّ الطبّاخ، وطابعة الإيصالات عرضها ٨٠مم. فالتذكرة تُبنى
 * لهذا القياس ولهذه العين: الرقم ضخم، والأصناف كبيرة، والملاحظة بارزة.
 *
 * والنصّ يُهرَّب قبل الحقن — اسم الصنف وملاحظة الزبون نصّان يكتبهما بشر.
 */
function esc(v: unknown): string {
  return String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string
  );
}

function printTicket(order: MerchantOrder, restaurantName: string) {
  const win = window.open("", "_blank", "width=380,height=640");
  if (!win) return;
  const rows = order.items
    .map(
      (i) =>
        `<tr><td class="q">${esc(i.qty)}×</td><td>${esc(i.name)}${
          i.options ? `<div class="opt">${esc(i.options)}</div>` : ""
        }</td><td class="p">${esc(formatMoney(i.line_total))}</td></tr>`
    )
    .join("");
  const vat = vatAddedOnTop(order.total, order.items);
  win.document.write(`<!doctype html><html dir="rtl" lang="ar"><head>
<meta charset="utf-8"><title>طلب ${esc(order.code)}</title><style>
  *{box-sizing:border-box} body{font-family:system-ui,sans-serif;margin:0;padding:10px;width:80mm;color:#000}
  .code{text-align:center;font-size:52px;font-weight:900;line-height:1;margin:6px 0}
  .lbl{text-align:center;font-size:11px;letter-spacing:.1em}
  .rest{text-align:center;font-size:13px;font-weight:700;margin-bottom:8px}
  hr{border:0;border-top:1px dashed #000;margin:8px 0}
  table{width:100%;border-collapse:collapse;font-size:14px}
  td{padding:3px 0;vertical-align:top} .q{width:34px;font-weight:900} .p{text-align:left;white-space:nowrap}
  .opt{font-size:11px;color:#444}
  .note{border:2px solid #000;padding:6px;margin-top:8px;font-size:13px;font-weight:700}
  .tot{display:flex;justify-content:space-between;font-size:16px;font-weight:900;margin-top:8px}
  .meta{font-size:11px;color:#333;margin-top:6px;text-align:center}
</style></head><body>
  <div class="rest">${esc(restaurantName)}</div>
  <div class="lbl">رقم الاستلام</div>
  <div class="code">${esc(order.code)}</div>
  <hr><table>${rows}${
    vat > 0 ? `<tr><td></td><td>ضريبة القيمة المضافة 15%</td><td class="p">${esc(formatMoney(vat))}</td></tr>` : ""
  }</table><hr>
  <div class="tot"><span>الإجمالي</span><span>${esc(formatMoney(order.total))}</span></div>
  ${order.note ? `<div class="note">⚠️ ${esc(order.note)}</div>` : ""}
  <div class="meta">${esc(order.customer_name ?? "")} ${esc(order.customer_phone ?? "")}</div>
  <div class="meta">${esc(new Date(order.created_at).toLocaleString("ar-SA"))}</div>
</body></html>`);
  win.document.close();
  win.focus();
  win.print();
}

export default function Orders() {
  const { restaurant, setRestaurant } = useDashboard();
  const { sync } = useOrderAlerts();
  const toast = useToast();
  const [orders, setOrders] = useState<MerchantOrder[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const accepting = restaurant.accepting_orders !== false;

  /**
   * مفتاح «نستقبل الآن» — مكانه هنا لا في الإعدادات.
   *
   * من يغلق الاستقبال يغلقه وهو واقف في الضغط، لا وهو يتصفّح صفحة إعدادات
   * من ثلاثين حقلاً. والإغلاق يُخفي السلّة عن الزبون فوراً، فلا يدفع ثمن
   * طلبٍ لن يُحضَّر.
   */
  async function toggleAccepting() {
    const next = !accepting;
    setRestaurant({ ...restaurant, accepting_orders: next });
    try {
      await updateRestaurantFields(restaurant.id, { accepting_orders: next });
      toast(next ? "فُتح استقبال الطلبات." : "أُغلق استقبال الطلبات.", "ok");
    } catch {
      setRestaurant({ ...restaurant, accepting_orders: accepting });
      toast("تعذّر تغيير الحالة.", "err");
    }
  }
  const load = useCallback(async () => {
    const rows = await listOrders(restaurant.id);
    setOrders(rows);
    // الصفحة تعرض الطلبات ⇒ «رآها» التاجر؛ والجرس يرنّ لما لم يُرنّ له.
    sync(rows, { seen: true });
  }, [restaurant.id, sync]);

  /**
   * ⚠️ الفشل **يُعدّ** ولا يُبتلع. كان `catch {}` هنا يُبقي هيكل التحميل إلى
   * الأبد إن سقطت الشبكة قبل أوّل جلب — شاشة رمادية لا تقول شيئاً، وزبونٌ دفع
   * ينتظر. وبعد أوّل نجاح لا يُمسح ما على الشاشة: طلبٌ قديم أنفع من فراغ.
   */
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
      toast("تعذّر تحديث الطلب — أعدناه إلى حالته.", "err");
      poll.refresh();
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
    if (poll.failures > 0) {
      return (
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <div role="alert" className="flex flex-col items-center gap-2">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-bad/10 text-bad">
              <Icon name="warn" size={22} />
            </span>
            <h1 className="text-lg font-black text-ink">لم نصل إلى طلباتك</h1>
            <p className="max-w-sm text-sm text-dim">
              غالباً انقطاعٌ في الاتصال. الطلبات محفوظة ولم يضع منها شيء — ونعيد المحاولة
              تلقائياً.
            </p>
          </div>
          <Button onClick={poll.refresh}>أعد المحاولة</Button>
        </Card>
      );
    }
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
        <Button variant="ghost" onClick={poll.refresh}>
          تحديث
        </Button>
      </div>

      {/* شاشة الكاونتر والجرس — أوّل ما يحتاجه من يستقبل الطلبات. */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          to="/dashboard/kitchen"
          className="press inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-ink px-4 py-2.5 text-sm font-semibold text-page"
        >
          <Icon name="ticket" size={16} /> افتح شاشة الكاشير
        </Link>
        <AlertControls />
      </div>

      {poll.failures > 0 && (
        <p role="status" className="rounded-xl bg-panel2 px-3 py-2 text-xs text-dim">
          لم نصل للتحديث الأخير — ما تراه قد لا يكون الأحدث، ونعيد المحاولة تلقائياً.
        </p>
      )}

      {/* حالة الاستقبال: أوّل ما تقع عليه العين، لأنها أخطر مفتاح في الشاشة. */}
      <Card
        className={`flex flex-wrap items-center justify-between gap-3 ${
          accepting ? "" : "ring-1 ring-bad/40"
        }`}
      >
        <div className="min-w-0">
          <p className="text-sm font-black text-ink">
            {accepting ? "🟢 نستقبل طلبات الآن" : "🔴 استقبال الطلبات مغلق"}
          </p>
          <p className="text-xs text-muted">
            {accepting
              ? `يظهر للزبون أن الطلب يجهز خلال ~${restaurant.prep_minutes ?? 20} دقيقة.`
              : "السلّة مخفيّة عن زبائنك، ولا يمكن إنشاء طلب جديد."}
          </p>
        </div>
        <Button variant={accepting ? "outline" : "gold"} onClick={toggleAccepting}>
          {accepting ? "أغلق الاستقبال" : "افتح الاستقبال"}
        </Button>
      </Card>

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
        const late = isLate(order);
        return (
          <Card
            key={order.id}
            className={`flex flex-col gap-3 ${late ? "ring-1 ring-bad/40" : ""}`}
          >
            <div className="flex items-start gap-3">
              {/* رقم الاستلام: أكبر عنصر عمداً — هو ما يُنادى به. */}
              <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-gold/12 text-gold">
                <span className="text-[10px] font-bold opacity-70">رقم</span>
                <span className="text-2xl font-black tabular-nums leading-none">{order.code}</span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={label.variant}>{label.text}</Badge>
                  {/* الوعد المقطوع للزبون: تجاوزُه يُقال صراحةً لا يُترك للحدس. */}
                  {late && <Badge variant="red">تأخّر</Badge>}
                  <span className="text-xs text-muted">{since(order.created_at)}</span>
                  <span className="text-xs font-bold tabular-nums text-ink">
                    {formatMoney(order.total)}
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
              <Button variant="ghost" onClick={() => printTicket(order, restaurant.name)}>
                طباعة
              </Button>
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
                    {formatMoney(order.total)}
                  </span>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}

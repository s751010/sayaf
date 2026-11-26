/**
 * «الطلبات» — حجم الطلبات ومبيعاتها عبر المنصّة كلّها.
 *
 * **بلا اسم زبون ولا جوال**: `getOrdersSince` لا يطلبهما أصلاً (قرار المالك —
 * زبائن التاجر ليسوا زبائن المنصّة). الأرقام هنا لتعرف هل الطلبات تمشي، لا
 * لتعرف من طلب.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, ErrorNote, Skeleton } from "@/components/ui";
import { getMerchants, getOrdersSince, type FounderMerchant, type PlatformOrder } from "@/lib/founder";
import { ORDER_STATUS_LABEL, dailyCounts, summarizeOrders } from "@/lib/founderInsights";
import { formatMoney } from "@/lib/utils";
import { Bars } from "./parts/Bars";

export default function Orders() {
  const [orders, setOrders] = useState<PlatformOrder[] | null>(null);
  const [merchants, setMerchants] = useState<FounderMerchant[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getOrdersSince(30), getMerchants()])
      .then(([o, m]) => {
        setOrders(o);
        setMerchants(m);
      })
      .catch(() => setError("تعذّر تحميل الطلبات."));
  }, []);

  const sum = useMemo(() => (orders ? summarizeOrders(orders) : null), [orders]);
  const series = useMemo(() => (orders ? dailyCounts(orders.map((o) => o.created_at), 30) : null), [orders]);
  const nameOf = useMemo(() => new Map(merchants.map((m) => [m.id, m])), [merchants]);

  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!sum || !series) return <Skeleton className="h-64" />;

  const tiles = [
    { l: "اليوم", v: `${sum.today}` },
    { l: "آخر ٧ أيام", v: `${sum.week}` },
    { l: "مبيعات ٣٠ يوم", v: formatMoney(sum.gmvMonth), sub: `${sum.paidMonth} طلب مدفوع` },
    { l: "متوسط الطلب", v: sum.avgTicket === null ? "—" : formatMoney(sum.avgTicket) },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-black text-ink">الطلبات</h1>
      <p className="mt-1 text-sm text-dim">طلبات الاستلام عبر كل المطاعم — أرقام فقط، بدون بيانات الزبائن.</p>

      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.l} className="p-4">
            <p className="text-xs font-bold text-dim">{t.l}</p>
            <p className="mt-1 font-display text-xl font-black text-ink">{t.v}</p>
            {t.sub && <p className="text-[11px] text-faint">{t.sub}</p>}
          </Card>
        ))}
      </section>

      {sum.month === 0 ? (
        <Card className="mt-6 text-center text-sm text-dim">
          ما وصل أي طلب آخر ٣٠ يوم. الطلبات تحتاج نشر دوالّ الطلبات — شوف{" "}
          <Link to="/founder/tasks" className="font-bold text-gold underline">
            مهامي
          </Link>
          .
        </Card>
      ) : (
        <>
          <Card className="mt-6">
            <h2 className="text-sm font-bold text-dim">الطلبات يومياً — آخر ٣٠ يوم</h2>
            <Bars points={series} unit="طلب" />
          </Card>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Card>
              <h2 className="text-sm font-bold text-dim">حسب الحالة</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {sum.byStatus.map((s) => (
                  <li key={s.status} className="flex items-center justify-between text-sm">
                    <span className="text-ink">{ORDER_STATUS_LABEL[s.status] ?? s.status}</span>
                    <span className="font-black text-ink">{s.n}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <h2 className="text-sm font-bold text-dim">حسب المطعم</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {sum.byRestaurant.slice(0, 8).map((r) => {
                  const m = nameOf.get(r.restaurant_id);
                  return (
                    <li key={r.restaurant_id} className="flex items-center justify-between gap-2 text-sm">
                      {m ? (
                        <Link to={`/founder/merchants/${m.id}`} className="truncate text-ink hover:underline">
                          {m.name}
                        </Link>
                      ) : (
                        <span className="text-dim">مطعم محذوف</span>
                      )}
                      <span className="shrink-0 text-dim">
                        <span className="font-black text-ink">{r.n}</span> · {formatMoney(r.gmv)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

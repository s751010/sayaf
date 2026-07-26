/** نظرة عامة للمؤسس — أرقام المنصة + آخر عمليات الإيراد. */
import { useEffect, useState } from "react";
import { Card, Skeleton } from "@/components/ui";
import { founderAdmin } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/utils";
import type { RevenueEntry } from "@/lib/types";

type Stats = {
  revenue: number;
  monthRevenue: number;
  activeSubs: number;
  restaurants: number;
  openTickets: number;
};

export default function FounderOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [revenue, setRevenue] = useState<RevenueEntry[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const [rows, subs, rests, tickets] = await Promise.all([
          founderAdmin<RevenueEntry[]>("revenue_log?select=*&order=created_at.desc&limit=200"),
          // العدّ على الاشتراكات السارية فعلاً: active=true وتاريخ انتهاء لم يمرّ.
          founderAdmin<{ id: string }[]>(
            `subscriptions?active=eq.true&end_date=gte.${new Date().toISOString()}&select=id`
          ),
          founderAdmin<{ id: string }[]>("restaurants?select=id"),
          founderAdmin<{ id: string }[]>("support_tickets?status=eq.open&select=id"),
        ]);

        setRevenue(rows);
        setStats({
          revenue: rows.reduce((s, r) => s + Number(r.amount ?? 0), 0),
          monthRevenue: rows
            .filter((r) => new Date(r.created_at).getTime() >= monthStart.getTime())
            .reduce((s, r) => s + Number(r.amount ?? 0), 0),
          activeSubs: subs.length,
          restaurants: rests.length,
          openTickets: tickets.length,
        });
      } catch {
        setFailed(true);
      }
    })();
  }, []);

  if (failed) {
    return (
      <Card className="py-12 text-center">
        <span className="text-4xl">📡</span>
        <p className="mt-3 font-bold text-ink">تعذّر تحميل بيانات المنصة</p>
      </Card>
    );
  }

  const cards = [
    { label: "إجمالي الإيراد", value: `${formatPrice(stats?.revenue ?? 0)} ر.س`, icon: "💰" },
    { label: "إيراد هذا الشهر", value: `${formatPrice(stats?.monthRevenue ?? 0)} ر.س`, icon: "📈" },
    { label: "اشتراكات سارية", value: stats?.activeSubs ?? 0, icon: "📦" },
    { label: "المطاعم", value: stats?.restaurants ?? 0, icon: "🍽️" },
    { label: "تذاكر مفتوحة", value: stats?.openTickets ?? 0, icon: "🎫" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-black text-ink">نظرة عامة على المنصة</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label} className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/12 text-xl">
              {c.icon}
            </span>
            <div>
              <p className="text-xs text-dim">{c.label}</p>
              {stats === null ? (
                <Skeleton className="mt-1 h-6 w-20" />
              ) : (
                <p className="font-display text-xl font-black text-ink">{c.value}</p>
              )}
            </div>
          </Card>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="mb-4 font-display text-lg font-extrabold text-ink">💳 آخر العمليات</h2>
        {stats === null ? (
          <Skeleton className="h-40" />
        ) : revenue.length === 0 ? (
          <Card className="text-center text-sm text-dim">لا توجد عمليات مسجّلة بعد.</Card>
        ) : (
          <div className="flex flex-col gap-2">
            {revenue.slice(0, 25).map((r) => (
              <Card key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-ink">
                    {r.plan_name ?? r.plan_id ?? "اشتراك"}
                    {r.action && <span className="me-2 text-xs font-normal text-faint"> · {r.action}</span>}
                  </p>
                  <p className="truncate text-xs text-faint">
                    {r.user_name ?? r.user_id ?? "—"} · {formatDate(r.created_at)}
                  </p>
                </div>
                <span className="font-display font-black text-gold">
                  {formatPrice(Number(r.amount ?? 0))} ر.س
                </span>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

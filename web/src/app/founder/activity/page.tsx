import { Store, Wallet, LifeBuoy, Star, UserPlus, CalendarClock } from "lucide-react";
import { getFounderInsights, type ActivityEvent } from "@/lib/founder-insights";
import { FounderNav } from "@/components/founder/founder-nav";
import { FounderDenied } from "@/components/founder/denied";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const KIND: Record<ActivityEvent["kind"], { icon: typeof Store; color: string }> = {
  signup: { icon: Store, color: "#60a5fa" },
  payment: { icon: Wallet, color: "#22c55e" },
  ticket: { icon: LifeBuoy, color: "#f59e0b" },
  review: { icon: Star, color: "#d4a843" },
};

export default async function FounderActivityPage() {
  const insights = await getFounderInsights();
  if (!insights) return <FounderDenied />;

  const stats = [
    { label: "تسجيلات آخر ٧ أيام", value: insights.signups7, icon: UserPlus },
    { label: "تسجيلات آخر ٣٠ يوماً", value: insights.signups30, icon: Store },
    { label: "اشتراكات تنتهي قريباً", value: insights.expiringSoon, icon: CalendarClock },
  ];

  return (
    <main className="flex-1 px-[var(--page-px,clamp(16px,5vw,60px))] py-10">
      <div className="mx-auto max-w-3xl">
        <FounderNav />
        <h1 className="font-display text-2xl font-bold text-cream">📜 سجل النشاط</h1>
        <p className="mt-1 text-warm">
          كل ما حدث على المنصّة — تسجيلات ومدفوعات وتذاكر وتقييمات — مرتّباً زمنياً.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <Card key={s.label} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/12 text-gold">
                <s.icon size={18} />
              </span>
              <span>
                <span className="block font-display text-xl font-black text-cream">
                  {s.value}
                </span>
                <span className="block text-xs text-muted">{s.label}</span>
              </span>
            </Card>
          ))}
        </div>

        {insights.events.length === 0 ? (
          <Card className="mt-6 py-12 text-center text-warm">
            لا يوجد نشاط مسجَّل بعد.
          </Card>
        ) : (
          <Card className="mt-6">
            <div className="flex flex-col">
              {insights.events.map((e, i) => {
                const k = KIND[e.kind];
                return (
                  <div
                    key={`${e.at}-${i}`}
                    className="flex items-start gap-3 border-b border-line-dim py-3 last:border-0"
                  >
                    <span
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${k.color}1f`, color: k.color }}
                    >
                      <k.icon size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-cream">{e.title}</p>
                      <p className="truncate text-xs text-warm">{e.detail}</p>
                    </div>
                    <span className="shrink-0 whitespace-nowrap text-xs text-muted">
                      {e.ago}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}

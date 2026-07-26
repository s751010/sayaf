import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { getFounderInsights, type HealthLevel } from "@/lib/founder-insights";
import { FounderNav } from "@/components/founder/founder-nav";
import { FounderDenied } from "@/components/founder/denied";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const STYLES: Record<HealthLevel, { icon: typeof CheckCircle2; color: string; label: string }> = {
  ok: { icon: CheckCircle2, color: "#22c55e", label: "سليم" },
  warn: { icon: AlertTriangle, color: "#f59e0b", label: "يحتاج انتباه" },
  bad: { icon: XCircle, color: "#ef5350", label: "مشكلة" },
};

export default async function FounderHealthPage() {
  const insights = await getFounderInsights();
  if (!insights) return <FounderDenied />;

  const counts = {
    ok: insights.health.filter((h) => h.level === "ok").length,
    warn: insights.health.filter((h) => h.level === "warn").length,
    bad: insights.health.filter((h) => h.level === "bad").length,
  };

  return (
    <main className="flex-1 px-[var(--page-px,clamp(16px,5vw,60px))] py-10">
      <div className="mx-auto max-w-3xl">
        <FounderNav />
        <h1 className="font-display text-2xl font-bold text-cream">🩺 صحة النظام</h1>
        <p className="mt-1 text-warm">
          كل بند مشتقّ من بيانات فعلية في قاعدة البيانات — لا قيم ثابتة تُطمئن بلا فحص.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {(["ok", "warn", "bad"] as const).map((level) => {
            const s = STYLES[level];
            return (
              <span
                key={level}
                className="flex items-center gap-2 rounded-xl border border-line-dim px-3.5 py-2 text-sm font-semibold"
                style={{ color: s.color }}
              >
                <s.icon size={15} />
                {counts[level]} {s.label}
              </span>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {insights.health.map((item) => {
            const s = STYLES[item.level];
            return (
              <Card key={item.label} className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${s.color}1f`, color: s.color }}
                >
                  <s.icon size={17} />
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-cream">{item.label}</p>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                      style={{ background: `${s.color}1f`, color: s.color }}
                    >
                      {s.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-warm">{item.detail}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}

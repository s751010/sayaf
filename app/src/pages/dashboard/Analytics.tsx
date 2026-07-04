/**
 * التحليلات — مشاهدات آخر ٣٠ يوماً + توزيع ساعات الذروة.
 * سلسلة واحدة بلون `--c-chart` (مُدقَّق بمدقّق dataviz على السطحين).
 */
import { useEffect, useMemo, useState } from "react";
import { Card, Skeleton } from "@/components/ui";
import { getMyAnalytics } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { AnalyticsRow } from "@/lib/types";
import { useDashboard } from "./Dashboard";

type DayPoint = { date: string; label: string; views: number };

/** رسم أعمدة SVG بسيط: أعمدة رفيعة بنهاية مدوّرة، فجوة 2px، تلميح عند المرور. */
function BarChart({
  points,
  ariaLabel,
}: {
  points: { label: string; views: number; sub?: string }[];
  ariaLabel: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = 180;
  const PAD = 6;
  const max = Math.max(1, ...points.map((p) => p.views));
  const bw = (W - PAD * 2) / points.length;

  return (
    <div className="relative" role="img" aria-label={ariaLabel}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseLeave={() => setHover(null)}>
        {/* شبكة خفيفة */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={PAD}
            x2={W - PAD}
            y1={H - 22 - (H - 34) * f}
            y2={H - 22 - (H - 34) * f}
            stroke="var(--c-line)"
            strokeWidth="1"
          />
        ))}
        <line x1={PAD} x2={W - PAD} y1={H - 22} y2={H - 22} stroke="var(--c-line)" strokeWidth="1" />
        {points.map((p, i) => {
          const h = Math.max(p.views > 0 ? 3 : 0, ((H - 34) * p.views) / max);
          const x = PAD + i * bw + 1; // فجوة 2px بين الأعمدة
          return (
            <g key={i}>
              {/* هدف تحويم أعرض من العمود */}
              <rect
                x={PAD + i * bw}
                y={0}
                width={bw}
                height={H - 22}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
              />
              {h > 0 && (
                <path
                  d={`M${x},${H - 22} v${-(h - Math.min(4, h))} q0,-${Math.min(4, h)} ${Math.min(4, bw - 2)},-${Math.min(4, h)} h${Math.max(0, bw - 2 - Math.min(4, bw - 2) * 2)} q${Math.min(4, bw - 2)},0 ${Math.min(4, bw - 2)},${Math.min(4, h)} v${h - Math.min(4, h)} Z`}
                  fill="var(--c-chart)"
                  opacity={hover === null || hover === i ? 1 : 0.45}
                />
              )}
              {/* تسمية محور مختارة (كل ٥) */}
              {(i % Math.ceil(points.length / 6) === 0 || i === points.length - 1) && (
                <text
                  x={PAD + i * bw + bw / 2}
                  y={H - 7}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--c-faint)"
                >
                  {p.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute -top-1 rounded-lg border border-line bg-panel2 px-2.5 py-1.5 text-xs font-bold text-ink shadow-lg"
          style={{
            right: `${(hover / points.length) * 100}%`,
            transform: "translateX(30%)",
          }}
        >
          {points[hover].sub ?? points[hover].label}: {points[hover].views} مشاهدة
        </div>
      )}
    </div>
  );
}

export default function Analytics() {
  const { user } = useDashboard();
  const [rows, setRows] = useState<AnalyticsRow[] | null>(null);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    document.title = "التحليلات — كلاود منيو";
    getMyAnalytics(user.id, 30).then(setRows).catch(() => setRows([]));
  }, [user.id]);

  const { days, hours, total, avg, best } = useMemo(() => {
    const byDate = new Map<string, number>();
    const byHour = new Array<number>(24).fill(0);
    for (const r of rows ?? []) {
      if (r.date) byDate.set(r.date, (byDate.get(r.date) ?? 0) + (r.views ?? 0));
      if (r.hour != null) byHour[r.hour] += r.views ?? 0;
    }
    // آخر ٣٠ يوماً متتالية (حتى الأيام بلا مشاهدات تظهر صفراً).
    const days: DayPoint[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400_000);
      const iso = d.toISOString().slice(0, 10);
      days.push({
        date: iso,
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        views: byDate.get(iso) ?? 0,
      });
    }
    const total = days.reduce((s, d) => s + d.views, 0);
    const best = [...days].sort((a, b) => b.views - a.views)[0];
    return {
      days,
      hours: byHour.map((v, h) => ({ label: `${h}`, sub: `الساعة ${h}:00`, views: v })),
      total,
      avg: Math.round(total / 30),
      best: best?.views ? best : null,
    };
  }, [rows]);

  const tiles = [
    { label: "إجمالي المشاهدات (٣٠ يوماً)", value: total },
    { label: "متوسط يومي", value: avg },
    { label: "أفضل يوم", value: best ? `${best.views} (${best.label})` : "—" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-ink">التحليلات</h1>
          <p className="mt-1 text-sm text-dim">مشاهدات منيوك خلال آخر ٣٠ يوماً.</p>
        </div>
        <button
          onClick={() => setShowTable((v) => !v)}
          className={cn(
            "rounded-xl border px-4 py-2 text-sm font-bold",
            showTable ? "border-gold/40 bg-gold/10 text-gold" : "border-line text-dim hover:text-ink"
          )}
        >
          {showTable ? "📊 رسوم" : "🧾 جدول"}
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {tiles.map((t) => (
          <Card key={t.label}>
            <p className="text-xs text-dim">{t.label}</p>
            {rows === null ? (
              <Skeleton className="mt-2 h-7 w-20" />
            ) : (
              <p className="mt-1 font-display text-2xl font-black text-ink">{t.value}</p>
            )}
          </Card>
        ))}
      </div>

      {rows === null ? (
        <Skeleton className="mt-5 h-56" />
      ) : showTable ? (
        <Card className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-right text-xs text-dim">
                <th className="py-2 font-bold">اليوم</th>
                <th className="py-2 font-bold">المشاهدات</th>
              </tr>
            </thead>
            <tbody>
              {days.filter((d) => d.views > 0).length === 0 ? (
                <tr><td colSpan={2} className="py-6 text-center text-dim">لا مشاهدات مسجَّلة بعد.</td></tr>
              ) : (
                [...days].reverse().map((d) => (
                  <tr key={d.date} className="border-b border-line/50">
                    <td className="py-2 text-ink">{d.label}</td>
                    <td className="py-2 font-bold text-ink">{d.views}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      ) : (
        <>
          <Card className="mt-5">
            <p className="mb-3 text-sm font-bold text-ink">المشاهدات اليومية</p>
            {total === 0 ? (
              <p className="py-10 text-center text-sm text-dim">
                لا مشاهدات بعد — شارك كود QR وستظهر الأرقام هنا لحظياً.
              </p>
            ) : (
              <BarChart points={days} ariaLabel="المشاهدات اليومية خلال آخر ثلاثين يوماً" />
            )}
          </Card>
          {total > 0 && (
            <Card className="mt-5">
              <p className="mb-1 text-sm font-bold text-ink">ساعات الذروة</p>
              <p className="mb-3 text-xs text-faint">توزيع المشاهدات على ساعات اليوم (UTC)</p>
              <BarChart points={hours} ariaLabel="توزيع المشاهدات على ساعات اليوم" />
            </Card>
          )}
        </>
      )}
    </div>
  );
}

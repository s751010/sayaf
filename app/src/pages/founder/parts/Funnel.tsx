/**
 * قمع التحويل — «أين يتسرّب التجّار» (من «الفلوس» إلى «التسويق»، ٢٠٢٦/١١/٢٦).
 *
 * القمع يقول أين تخسر، والإيراد يقول كم دخل. الخطوة الحمراء أكبر تسرّب.
 */
import { useEffect, useState } from "react";
import { Card, Skeleton } from "@/components/ui";
import { getFunnel, type FunnelStep } from "@/lib/founder";
import { Icon } from "@/lib/icons";

export function Funnel() {
  const [funnel, setFunnel] = useState<FunnelStep[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getFunnel().then(setFunnel).catch(() => setFailed(true));
  }, []);

  const top = funnel?.[0]?.n ?? 0;
  if (failed) return <Card className="text-sm text-dim">تعذّر تحميل القمع.</Card>;

  return (
      <section>
        <h2 className="inline-flex items-center gap-2 mb-3 font-display text-lg font-extrabold text-ink">
          <Icon name="bars" size={17} className="shrink-0 text-gold" />{" "}
          أين يتسرّب التجّار</h2>
        {funnel === null ? (
          <Skeleton className="h-56" />
        ) : (
          <Card>
            <div className="flex flex-col gap-3">
              {funnel.map((s, i) => {
                const prev = i > 0 ? funnel[i - 1].n : s.n;
                const pct = top ? Math.round((s.n / top) * 100) : 0;
                const drop = prev > 0 ? Math.round(((prev - s.n) / prev) * 100) : 0;
                return (
                  <div key={s.ord}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-sm font-bold text-ink">
                        {s.ord}. {s.step}
                      </span>
                      <span className="text-sm text-dim">
                        <span className="font-black text-ink">{s.n}</span>
                        <span className="text-xs"> · {pct}%</span>
                        {i > 0 && drop > 0 && (
                          <span className={drop >= 50 ? "text-xs text-bad" : "text-xs text-faint"}>
                            {" "}
                            (فقدتَ {drop}%)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink/8">
                      <div
                        className={drop >= 50 && i > 0 ? "h-full bg-bad" : "h-full bg-gold"}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-faint">
              الخطوة الحمراء هي أكبر تسرّب عندك — وهي المكان الوحيد الذي يستحق مجهودك التالي.
            </p>
          </Card>
        )}
      </section>

  );
}

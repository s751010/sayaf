/** تقييمات الزبائن — ملخّص مُحلَّل لما يرسله الزبائن من صفحة المنيو. */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Skeleton } from "@/components/ui";
import { getMySurveyResponses, summarizeSurveys, type SurveySummary } from "@/lib/data";
import { scoreColor } from "@/lib/survey";
import { formatDate } from "@/lib/utils";
import { useDashboard } from "./Dashboard";

export default function Reviews() {
  const { restaurant } = useDashboard();
  const [summary, setSummary] = useState<SurveySummary | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    document.title = "التقييمات — كلاود منيو";
    getMySurveyResponses(restaurant.id)
      .then((rows) => setSummary(summarizeSurveys(rows)))
      .catch(() => setFailed(true));
  }, [restaurant.id]);

  return (
    <div>
      <h1 className="font-display text-2xl font-black text-ink">تقييمات الزبائن</h1>
      <p className="mt-1 text-sm text-dim">ما يقوله زبائنك بعد الزيارة.</p>

      {failed ? (
        <Card className="mt-8 py-12 text-center">
          <span className="text-4xl">📡</span>
          <p className="mt-3 font-bold text-ink">تعذّر تحميل التقييمات</p>
          <p className="mt-1 text-sm text-dim">تحقق من اتصالك ثم أعد تحميل الصفحة.</p>
        </Card>
      ) : summary === null ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : summary.count === 0 ? (
        <Card className="mt-8 py-12 text-center">
          <span className="text-5xl">⭐</span>
          <p className="mt-4 font-bold text-ink">لا توجد تقييمات بعد</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-dim">
            {restaurant.reviews_enabled === false ? (
              <>
                التقييمات معطّلة حالياً — فعّلها من{" "}
                <Link to="/dashboard/settings" className="font-bold text-gold hover:underline">
                  صفحة الإعدادات
                </Link>{" "}
                ليظهر زر «قيّم تجربتك» في منيوك.
              </>
            ) : (
              "زر «قيّم تجربتك» ظاهر في منيوك العام. أول ما يقيّم زبون، تظهر النتائج هنا محلَّلة."
            )}
          </p>
        </Card>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "المتوسط العام", value: `${summary.overall}/5`, icon: "⭐", color: scoreColor(summary.overall) },
              { label: "عدد التقييمات", value: summary.count, icon: "💬", color: "#60a5fa" },
              { label: "نسبة الرضا", value: `${summary.satisfaction}%`, icon: "😊", color: "#22c55e" },
              { label: "آخر ٧ أيام", value: summary.last7, icon: "🔥", color: "#d4a843" },
            ].map((s) => (
              <Card key={s.label} className="flex items-center gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
                  style={{ background: `${s.color}1f` }}
                >
                  {s.icon}
                </span>
                <div>
                  <p className="font-display text-xl font-black text-ink">{s.value}</p>
                  <p className="text-xs text-dim">{s.label}</p>
                </div>
              </Card>
            ))}
          </div>

          <Card className="mt-6">
            <h2 className="font-display text-lg font-extrabold text-ink">التفصيل حسب السؤال</h2>
            <div className="mt-5 flex flex-col gap-4">
              {summary.perQuestion.map((q) => (
                <div key={q.id}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-bold text-ink">
                      {q.icon} {q.label}
                    </span>
                    <span className="text-dim">
                      {q.avg === null ? "—" : `${q.avg}/5`}
                      <span className="me-2 text-xs text-faint"> ({q.n})</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink/8">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${((q.avg ?? 0) / 5) * 100}%`,
                        background: scoreColor(q.avg ?? 0),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {summary.notes.length > 0 && (
            <Card className="mt-6">
              <h2 className="font-display text-lg font-extrabold text-ink">
                ملاحظات الزبائن ({summary.notes.length})
              </h2>
              <div className="mt-5 flex flex-col gap-3">
                {summary.notes.slice(0, 50).map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border-e-[3px] bg-ink/4 p-3"
                    style={{ borderColor: scoreColor(r.avg_score ?? 3) }}
                  >
                    <p className="text-sm leading-relaxed text-ink">{r.note}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-faint">
                      <span>⭐ {r.avg_score ?? "—"}</span>
                      <span>{formatDate(r.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

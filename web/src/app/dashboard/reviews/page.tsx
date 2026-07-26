import { Star, MessageSquare, Smile, Flame } from "lucide-react";
import { getMyRestaurant, getSurveySummary } from "@/lib/owner";
import { RestaurantOnboarding } from "@/components/dashboard/restaurant-onboarding";
import { scoreColor } from "@/lib/survey";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function ReviewsPage() {
  const restaurant = await getMyRestaurant();
  if (!restaurant) return <RestaurantOnboarding />;

  const summary = await getSurveySummary(restaurant.id);

  if (summary.count === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-2xl font-bold text-cream">تقييمات الزبائن</h1>
        <p className="mt-1 text-warm">ما يقوله زبائنك بعد الزيارة.</p>
        <Card className="mt-8 py-12 text-center">
          <span className="text-5xl">⭐</span>
          <p className="mt-4 font-semibold text-cream">لا توجد تقييمات بعد</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-warm">
            {restaurant.reviews_enabled === false
              ? "التقييمات معطّلة حالياً — فعّلها من صفحة الإعدادات ليظهر زر «قيّم تجربتك» في منيوك."
              : "زر «قيّم تجربتك» ظاهر في منيوك العام. أول ما يقيّم زبون، تظهر النتائج هنا محلَّلة."}
          </p>
        </Card>
      </div>
    );
  }

  const stats = [
    {
      label: "المتوسط العام",
      value: `${summary.overall}/5`,
      icon: Star,
      color: scoreColor(summary.overall),
    },
    { label: "عدد التقييمات", value: summary.count, icon: MessageSquare, color: "#60a5fa" },
    { label: "نسبة الرضا", value: `${summary.satisfaction}%`, icon: Smile, color: "#22c55e" },
    { label: "آخر ٧ أيام", value: summary.last7, icon: Flame, color: "#d4a843" },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl font-bold text-cream">تقييمات الزبائن</h1>
      <p className="mt-1 text-warm">ما يقوله زبائنك بعد الزيارة.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ background: `${s.color}1f`, color: s.color }}
            >
              <s.icon size={18} />
            </span>
            <span>
              <span className="block font-display text-xl font-black text-cream">{s.value}</span>
              <span className="block text-xs text-muted">{s.label}</span>
            </span>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <h2 className="font-display text-lg font-bold text-cream">التفصيل حسب السؤال</h2>
        <div className="mt-5 flex flex-col gap-4">
          {summary.perQuestion.map((q) => (
            <div key={q.id}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                <span className="font-semibold text-cream">
                  {q.icon} {q.label}
                </span>
                <span className="text-warm">
                  {q.avg === null ? "—" : `${q.avg}/5`}
                  <span className="mr-2 text-xs text-muted">({q.n})</span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/8">
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
          <h2 className="font-display text-lg font-bold text-cream">
            ملاحظات الزبائن ({summary.notes.length})
          </h2>
          <div className="mt-5 flex flex-col gap-3">
            {summary.notes.slice(0, 50).map((r) => (
              <div
                key={r.id}
                className="rounded-xl border-r-[3px] bg-white/4 p-3"
                style={{ borderColor: scoreColor(r.avg_score ?? 3) }}
              >
                <p className="text-sm leading-relaxed text-cream">{r.note}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-muted">
                  <span>⭐ {r.avg_score ?? "—"}</span>
                  <span>{formatDate(r.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

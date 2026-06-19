import { Eye, TrendingUp, Layers } from "lucide-react";
import { getMyRestaurant, getMyDishes } from "@/lib/owner";
import { RestaurantOnboarding } from "@/components/dashboard/restaurant-onboarding";
import { Card } from "@/components/ui/card";

export default async function AnalyticsPage() {
  const restaurant = await getMyRestaurant();
  if (!restaurant) return <RestaurantOnboarding />;

  const dishes = await getMyDishes(restaurant.id);
  const totalViews = dishes.reduce((s, d) => s + (d.views ?? 0), 0);
  const topDishes = [...dishes]
    .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
    .slice(0, 6);
  const maxViews = Math.max(1, ...topDishes.map((d) => d.views ?? 0));

  const categoryMap = new Map<string, number>();
  for (const d of dishes) {
    const key = d.category?.trim() || "بدون قسم";
    categoryMap.set(key, (categoryMap.get(key) ?? 0) + 1);
  }
  const categories = [...categoryMap.entries()].sort((a, b) => b[1] - a[1]);

  const stats = [
    { label: "إجمالي المشاهدات", value: totalViews, icon: Eye },
    { label: "عدد الأصناف", value: dishes.length, icon: Layers },
    { label: "المتاح للعرض", value: dishes.filter((d) => d.available).length, icon: TrendingUp },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl font-bold text-cream">الإحصائيات</h1>
      <p className="mt-1 text-warm">أداء أصناف مطعمك.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/12 text-gold">
              <s.icon size={22} />
            </span>
            <div>
              <p className="text-sm text-warm">{s.label}</p>
              <p className="font-display text-2xl font-black text-cream">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="font-bold text-cream">الأكثر مشاهدةً</h2>
          {topDishes.length === 0 || totalViews === 0 ? (
            <p className="mt-4 text-sm text-warm">لا توجد مشاهدات بعد.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {topDishes.map((d) => (
                <li key={d.id}>
                  <div className="flex justify-between text-sm">
                    <span className="truncate text-cream">
                      {d.emoji} {d.name}
                    </span>
                    <span className="text-warm">{d.views ?? 0}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-gold to-gold-dark"
                      style={{ width: `${((d.views ?? 0) / maxViews) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="font-bold text-cream">الأصناف حسب القسم</h2>
          {categories.length === 0 ? (
            <p className="mt-4 text-sm text-warm">لا توجد أصناف.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {categories.map(([name, count]) => (
                <li key={name} className="flex justify-between text-sm">
                  <span className="text-cream">{name}</span>
                  <span className="text-warm">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        تتبّع المشاهدات الحيّة لكل زيارة سيُضاف لاحقاً (جدول analytics).
      </p>
    </div>
  );
}

import Link from "next/link";
import { BookOpen, UtensilsCrossed, Eye, ExternalLink } from "lucide-react";
import { getMyRestaurant, getMyMenus, getMyDishes } from "@/lib/owner";
import { RestaurantOnboarding } from "@/components/dashboard/restaurant-onboarding";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default async function DashboardHome() {
  const restaurant = await getMyRestaurant();
  if (!restaurant) return <RestaurantOnboarding />;

  const [menus, dishes] = await Promise.all([
    getMyMenus(restaurant.id),
    getMyDishes(restaurant.id),
  ]);
  const views = dishes.reduce((sum, d) => sum + (d.views ?? 0), 0);

  const stats = [
    { label: "القوائم", value: menus.length, icon: BookOpen },
    { label: "الأصناف", value: dishes.length, icon: UtensilsCrossed },
    { label: "المشاهدات", value: views, icon: Eye },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-cream">
            {restaurant.name}
          </h1>
          <p className="mt-1 text-warm">نظرة عامة على مطعمك.</p>
        </div>
        <Link
          href={`/${restaurant.slug}`}
          target="_blank"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <ExternalLink size={16} /> عرض المنيو العام
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/12 text-gold">
              <s.icon size={22} />
            </span>
            <div>
              <p className="text-sm text-warm">{s.label}</p>
              <p className="font-display text-2xl font-black text-cream">
                {s.value}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/dashboard/dishes/new" className={buttonVariants()}>
          إضافة صنف
        </Link>
        <Link
          href="/dashboard/menus"
          className={buttonVariants({ variant: "outline" })}
        >
          إدارة القوائم
        </Link>
      </div>
    </div>
  );
}

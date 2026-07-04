import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import { isFounder } from "@/lib/founder";
import { resolvePlan } from "@/lib/plans";
import { FounderNav } from "@/components/founder/founder-nav";
import { FounderDenied } from "@/components/founder/denied";
import { RestaurantEditForm } from "@/components/founder/restaurant-edit-form";
import { SubscriptionControls } from "@/components/founder/subscription-controls";
import { deleteRestaurantFounder, toggleDishFounder, deleteDishFounder } from "@/app/founder/actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import type { Restaurant, Dish, Menu } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function FounderRestaurantDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isFounder())) return <FounderDenied />;
  const { id } = await params;

  const supabase = await createServerSupabase();
  const { data: restaurantRow } = await supabase!
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const restaurant = restaurantRow as Restaurant | null;
  if (!restaurant) notFound();

  const [{ data: subRow }, { data: menuRows }, { data: dishRows }] = await Promise.all([
    restaurant.user_id
      ? supabase!
          .from("subscriptions")
          .select("plan_id, end_date, active, created_at")
          .eq("user_id", restaurant.user_id)
          .eq("active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase!.from("menus").select("*").eq("restaurant_id", id),
    supabase!
      .from("dishes")
      .select("*")
      .eq("restaurant_id", id)
      .order("category", { ascending: true }),
  ]);

  const sub = subRow as { plan_id: string | null; end_date: string | null } | null;
  const menus = (menuRows ?? []) as Menu[];
  const dishes = (dishRows ?? []) as Dish[];
  const currentPlan = sub?.plan_id ?? null;
  const planLabel = sub ? resolvePlan(currentPlan).name : "بدون اشتراك";

  return (
    <main className="flex-1 px-[var(--page-px,clamp(16px,5vw,60px))] py-10">
      <div className="mx-auto max-w-4xl">
        <FounderNav />

        <Link
          href="/founder/restaurants"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-warm hover:text-cream"
        >
          <ArrowRight size={16} /> رجوع للمطاعم
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-cream">{restaurant.name}</h1>
            <p className="mt-1 text-sm text-warm">
              <Badge variant={sub ? "green" : "neutral"}>{planLabel}</Badge>
              {restaurant.slug && (
                <a
                  href={`/${restaurant.slug}`}
                  target="_blank"
                  className="mr-2 text-gold hover:underline"
                  dir="ltr"
                >
                  /{restaurant.slug}
                </a>
              )}
            </p>
          </div>
        </div>

        {/* بيانات المطعم */}
        <section className="mt-6">
          <h2 className="mb-3 font-display text-lg font-bold text-cream">بيانات المطعم</h2>
          <RestaurantEditForm restaurant={restaurant} />
        </section>

        {/* الاشتراك */}
        <section className="mt-8">
          <h2 className="mb-3 font-display text-lg font-bold text-cream">الاشتراك</h2>
          <SubscriptionControls userId={restaurant.user_id} currentPlan={currentPlan} />
        </section>

        {/* الأصناف */}
        <section className="mt-8">
          <h2 className="mb-3 font-display text-lg font-bold text-cream">
            الأصناف ({dishes.length}) · القوائم ({menus.length})
          </h2>
          <div className="flex flex-col gap-2">
            {dishes.length === 0 && (
              <Card className="text-center text-warm">لا توجد أصناف في هذا المتجر.</Card>
            )}
            {dishes.map((d) => (
              <Card key={d.id} className="flex flex-wrap items-center gap-3">
                <span className="text-xl">{d.emoji ?? "🍽"}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-cream">{d.name}</p>
                  <p className="text-xs text-muted">
                    {d.category ?? "بدون تصنيف"} · {formatPrice(d.price ?? 0)} ر.س
                  </p>
                </div>
                <Badge variant={d.available ? "green" : "neutral"}>
                  {d.available ? "متوفّر" : "موقوف"}
                </Badge>
                <form action={toggleDishFounder}>
                  <input type="hidden" name="id" value={d.id} />
                  <input type="hidden" name="restaurant_id" value={id} />
                  <input type="hidden" name="next" value={d.available ? "false" : "true"} />
                  <Button type="submit" variant="ghost" size="sm">
                    {d.available ? "⏸ إيقاف" : "▶ تفعيل"}
                  </Button>
                </form>
                <form action={deleteDishFounder}>
                  <input type="hidden" name="id" value={d.id} />
                  <input type="hidden" name="restaurant_id" value={id} />
                  <Button type="submit" variant="ghost" size="sm" className="text-danger">
                    🗑
                  </Button>
                </form>
              </Card>
            ))}
          </div>
        </section>

        {/* منطقة الخطر */}
        <section className="mt-10 rounded-2xl border border-danger/30 bg-danger/5 p-5">
          <h2 className="font-display text-lg font-bold text-danger">حذف المطعم</h2>
          <p className="mt-1 text-sm text-warm">
            يحذف المطعم وكل قوائمه وأصنافه وعملاء ولائه نهائياً. لا يمكن التراجع.
          </p>
          <form action={deleteRestaurantFounder} className="mt-4">
            <input type="hidden" name="id" value={id} />
            <Button type="submit" variant="ghost" size="sm" className="text-danger">
              حذف المطعم نهائياً
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}

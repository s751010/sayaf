import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { getMyRestaurant, getMyMenus, getMyDishes } from "@/lib/owner";
import { deleteDish, toggleDishAvailability } from "@/app/dashboard/actions";
import { RestaurantOnboarding } from "@/components/dashboard/restaurant-onboarding";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export default async function DishesPage() {
  const restaurant = await getMyRestaurant();
  if (!restaurant) return <RestaurantOnboarding />;

  const [menus, dishes] = await Promise.all([
    getMyMenus(restaurant.id),
    getMyDishes(restaurant.id),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-cream">الأصناف</h1>
          <p className="mt-1 text-warm">{dishes.length} صنف</p>
        </div>
        {menus.length > 0 && (
          <Link href="/dashboard/dishes/new" className={buttonVariants({ size: "sm" })}>
            <Plus size={16} /> صنف جديد
          </Link>
        )}
      </div>

      {menus.length === 0 ? (
        <Card className="mt-6 text-center text-warm">
          أنشئ قائمة أولاً من صفحة{" "}
          <Link href="/dashboard/menus" className="text-gold">
            القوائم
          </Link>
          .
        </Card>
      ) : dishes.length === 0 ? (
        <Card className="mt-6 text-center text-warm">لا توجد أصناف بعد.</Card>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {dishes.map((d) => (
            <Card key={d.id} className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-charcoal-3 text-2xl">
                {d.emoji ?? "🍽"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-cream">{d.name}</span>
                  {d.featured && <Badge variant="gold">مميز</Badge>}
                  {!d.available && <Badge variant="red">مخفي</Badge>}
                </div>
                <span className="text-sm text-warm">
                  {d.category ?? "بدون قسم"} · {formatPrice(d.price)} ر.س
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <form action={toggleDishAvailability}>
                  <input type="hidden" name="id" value={d.id} />
                  <input type="hidden" name="next" value={String(!d.available)} />
                  <button
                    type="submit"
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-warm hover:bg-white/5 hover:text-cream"
                  >
                    {d.available ? "إخفاء" : "إظهار"}
                  </button>
                </form>
                <Link
                  href={`/dashboard/dishes/${d.id}`}
                  className="rounded-lg p-2 text-warm hover:bg-white/5 hover:text-gold"
                  aria-label="تعديل"
                >
                  <Pencil size={16} />
                </Link>
                <form action={deleteDish}>
                  <input type="hidden" name="id" value={d.id} />
                  <button
                    type="submit"
                    aria-label="حذف"
                    className="rounded-lg p-2 text-warm hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 size={16} />
                  </button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

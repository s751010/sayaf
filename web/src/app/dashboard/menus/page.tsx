import { BookOpen } from "lucide-react";
import { getMyRestaurant, getMyMenus } from "@/lib/owner";
import { RestaurantOnboarding } from "@/components/dashboard/restaurant-onboarding";
import { MenuCreate } from "@/components/dashboard/menu-create";
import { Card } from "@/components/ui/card";

export default async function MenusPage() {
  const restaurant = await getMyRestaurant();
  if (!restaurant) return <RestaurantOnboarding />;

  const menus = await getMyMenus(restaurant.id);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-bold text-cream">القوائم</h1>
      <p className="mt-1 text-warm">
        قوائم مطعم <span className="text-gold">{restaurant.name}</span>
      </p>

      <Card className="mt-6">
        <MenuCreate />
      </Card>

      <div className="mt-6 flex flex-col gap-3">
        {menus.length === 0 ? (
          <p className="py-8 text-center text-warm">لا توجد قوائم بعد.</p>
        ) : (
          menus.map((m) => (
            <Card key={m.id} className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/12 text-gold">
                <BookOpen size={18} />
              </span>
              <span className="font-medium text-cream">
                {m.name || "قائمة بدون اسم"}
              </span>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

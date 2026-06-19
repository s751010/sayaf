import Link from "next/link";
import { getMyRestaurant, getLoyaltyCustomers } from "@/lib/owner";
import { RestaurantOnboarding } from "@/components/dashboard/restaurant-onboarding";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function LoyaltyPage() {
  const restaurant = await getMyRestaurant();
  if (!restaurant) return <RestaurantOnboarding />;

  const customers = await getLoyaltyCustomers(restaurant.id);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-cream">الولاء</h1>
          <p className="mt-1 text-warm">{customers.length} عميل في البرنامج</p>
        </div>
        <Badge variant={restaurant.loyalty_enabled ? "green" : "neutral"}>
          {restaurant.loyalty_enabled ? "مفعّل" : "غير مفعّل"}
        </Badge>
      </div>

      <Card className="mt-6 text-sm text-warm">
        المكافأة بعد{" "}
        <span className="text-gold">{restaurant.loyalty_goal ?? "—"}</span> زيارة:{" "}
        <span className="text-cream">{restaurant.loyalty_reward ?? "غير محددة"}</span>.{" "}
        <Link href="/dashboard/settings" className="text-gold">
          تعديل الإعدادات
        </Link>
      </Card>

      <div className="mt-6 flex flex-col gap-2">
        {customers.length === 0 ? (
          <Card className="text-center text-warm">لا يوجد عملاء بعد.</Card>
        ) : (
          customers.map((c) => (
            <Card key={c.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-cream">{c.name ?? "عميل"}</p>
                {c.phone && (
                  <p className="text-xs text-muted" dir="ltr">
                    {c.phone}
                  </p>
                )}
              </div>
              <Badge variant="gold">
                {c.visits ?? c.points ?? 0} زيارة
              </Badge>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

import { getMyRestaurant } from "@/lib/owner";
import { RestaurantOnboarding } from "@/components/dashboard/restaurant-onboarding";
import { QrStudio } from "@/components/dashboard/qr-studio";

export default async function QrPage() {
  const restaurant = await getMyRestaurant();
  if (!restaurant) return <RestaurantOnboarding />;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-bold text-cream">أكواد QR</h1>
      <p className="mt-1 text-warm">
        اطبع كود QR لمطعمك أو لكل طاولة، وضعه على الطاولات ليتصفّح الزبائن المنيو.
      </p>
      <div className="mt-6">
        <QrStudio slug={restaurant.slug ?? ""} />
      </div>
    </div>
  );
}

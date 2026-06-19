import { getMyRestaurant } from "@/lib/owner";
import { RestaurantOnboarding } from "@/components/dashboard/restaurant-onboarding";
import { SettingsForm } from "@/components/dashboard/settings-form";

export default async function SettingsPage() {
  const restaurant = await getMyRestaurant();
  if (!restaurant) return <RestaurantOnboarding />;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-bold text-cream">الإعدادات</h1>
      <p className="mt-1 text-warm">معلومات مطعمك وروابط التواصل وبرنامج الولاء.</p>
      <div className="mt-8">
        <SettingsForm restaurant={restaurant} />
      </div>
    </div>
  );
}

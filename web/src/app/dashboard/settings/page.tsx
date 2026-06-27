import { getMyRestaurant, getMyMenus } from "@/lib/owner";
import { getMyEntitlements } from "@/lib/entitlements";
import { RestaurantOnboarding } from "@/components/dashboard/restaurant-onboarding";
import { SettingsForm } from "@/components/dashboard/settings-form";

export default async function SettingsPage() {
  const restaurant = await getMyRestaurant();
  if (!restaurant) return <RestaurantOnboarding />;

  const [menus, ent] = await Promise.all([
    getMyMenus(restaurant.id),
    getMyEntitlements(),
  ]);
  const currentTheme = menus[0]?.theme ?? "dark-gold";

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-bold text-cream">الإعدادات</h1>
      <p className="mt-1 text-warm">
        معلومات مطعمك، ثيم المنيو، روابط التواصل، وبرنامج الولاء.
      </p>
      <div className="mt-8">
        <SettingsForm
          restaurant={restaurant}
          currentTheme={currentTheme}
          canEnglish={ent.english}
          canLoyalty={ent.loyalty}
        />
      </div>
    </div>
  );
}

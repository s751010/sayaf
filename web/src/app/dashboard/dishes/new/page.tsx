import { redirect } from "next/navigation";
import { getMyRestaurant, getMyMenus } from "@/lib/owner";
import { getMyEntitlements } from "@/lib/entitlements";
import { DishForm } from "@/components/dashboard/dish-form";

export default async function NewDishPage() {
  const restaurant = await getMyRestaurant();
  if (!restaurant) redirect("/dashboard/menus");
  const [menus, ent] = await Promise.all([
    getMyMenus(restaurant.id),
    getMyEntitlements(),
  ]);
  if (menus.length === 0) redirect("/dashboard/menus");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-2xl font-bold text-cream">
        صنف جديد
      </h1>
      <DishForm menus={menus} canEnglish={ent.english} />
    </div>
  );
}

import { notFound, redirect } from "next/navigation";
import { getMyRestaurant, getMyMenus, getDish } from "@/lib/owner";
import { DishForm } from "@/components/dashboard/dish-form";

export default async function EditDishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const restaurant = await getMyRestaurant();
  if (!restaurant) redirect("/dashboard/menus");

  const [menus, dish] = await Promise.all([
    getMyMenus(restaurant.id),
    getDish(id),
  ]);
  if (!dish) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-2xl font-bold text-cream">
        تعديل: {dish.name}
      </h1>
      <DishForm menus={menus} dish={dish} />
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicMenu, getRestaurantBySlug } from "@/lib/data";
import { DishCard } from "@/components/menu/dish-card";
import { SocialLinks } from "@/components/menu/social-links";
import { ViewBeacon } from "@/components/menu/view-beacon";

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) return { title: "المطعم غير موجود" };
  return {
    title: restaurant.name,
    description: `قائمة ${restaurant.name} الرقمية — اطلب وتصفّح الأصناف بسهولة.`,
    openGraph: {
      title: restaurant.name,
      images: restaurant.banner_image || restaurant.logo_image || undefined,
    },
  };
}

export default async function MenuPage({ params }: Params) {
  const { slug } = await params;
  const data = await getPublicMenu(slug);
  if (!data) notFound();

  const { restaurant, menu, categories, dishes } = data;

  return (
    <main className="flex-1">
      {menu && <ViewBeacon menuId={menu.id} ownerId={restaurant.user_id} />}
      {/* Banner */}
      <header className="relative">
        {restaurant.banner_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurant.banner_image}
            alt=""
            className="h-44 w-full object-cover md:h-60"
          />
        )}
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-8 text-center">
          {restaurant.logo_image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={restaurant.logo_image}
              alt={restaurant.name}
              className="-mt-16 h-24 w-24 rounded-2xl border-2 border-gold/40 object-cover shadow-lg"
            />
          )}
          <div>
            <h1 className="font-display text-3xl font-black text-cream md:text-4xl">
              {restaurant.name}
            </h1>
            {restaurant.type && (
              <p className="mt-1 text-sm text-warm">{restaurant.type}</p>
            )}
          </div>
          <SocialLinks restaurant={restaurant} />
        </div>
      </header>

      {/* Menu */}
      <div className="mx-auto max-w-5xl px-4 pb-20">
        {dishes.length === 0 ? (
          <p className="py-16 text-center text-warm">
            لا توجد أصناف متاحة حالياً.
          </p>
        ) : (
          categories.map((cat) => (
            <section key={cat.name} className="mt-10">
              <h2 className="mb-4 border-b border-line-dim pb-2 font-display text-xl font-bold text-gold">
                {cat.name}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {cat.dishes.map((dish) => (
                  <DishCard key={dish.id} dish={dish} />
                ))}
              </div>
            </section>
          ))
        )}

        {restaurant.working_hours && (
          <p className="mt-12 text-center text-sm text-muted">
            🕒 {restaurant.working_hours}
          </p>
        )}
      </div>
    </main>
  );
}

import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicMenu, getRestaurantBySlug } from "@/lib/data";
import { getTheme } from "@/lib/themes";
import { DishCard } from "@/components/menu/dish-card";
import { SocialLinks } from "@/components/menu/social-links";
import { CategoryNav } from "@/components/menu/category-nav";
import { ViewBeacon } from "@/components/menu/view-beacon";
import { categoryId as slugId } from "@/lib/utils";

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) return { title: "المطعم غير موجود" };
  return {
    title: restaurant.name,
    description: `قائمة ${restaurant.name} الرقمية — تصفّح الأصناف واطلب بسهولة.`,
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

  const { restaurant, menu, categories, dishes, featured } = data;
  const theme = getTheme(menu?.theme);
  const rootStyle = { ...theme.vars, background: "var(--m-bg)", color: "var(--m-text)" } as CSSProperties;
  const display = { fontFamily: "var(--m-font)" } as CSSProperties;

  return (
    <main className="min-h-screen" style={rootStyle}>
      {menu && <ViewBeacon menuId={menu.id} ownerId={restaurant.user_id} />}

      {/* Banner */}
      <header className="relative">
        <div className="relative h-52 w-full overflow-hidden md:h-72">
          {restaurant.banner_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={restaurant.banner_image} alt="" className="h-full w-full object-cover" />
          ) : (
            <div
              className="h-full w-full"
              style={{ background: "linear-gradient(135deg, var(--m-accent), var(--m-bg-2))", opacity: 0.85 }}
            />
          )}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, var(--m-bg) 6%, transparent 70%)" }}
          />
        </div>

        <div className="relative mx-auto -mt-16 flex max-w-4xl flex-col items-center px-4 text-center">
          <div
            className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border-2 shadow-xl"
            style={{ borderColor: "var(--m-accent)", background: "var(--m-bg-2)" }}
          >
            {restaurant.logo_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={restaurant.logo_image} alt={restaurant.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-5xl">{restaurant.logo || "🍽"}</span>
            )}
          </div>

          <h1 className="mt-4 text-3xl font-black md:text-4xl" style={display}>
            {restaurant.name}
          </h1>
          {restaurant.type && (
            <p className="mt-1 text-sm" style={{ color: "var(--m-muted)" }}>
              {restaurant.type}
            </p>
          )}
          {restaurant.working_hours && (
            <p className="mt-1 text-xs" style={{ color: "var(--m-muted)" }}>
              🕒 {restaurant.working_hours}
            </p>
          )}

          <div className="mt-5 w-full">
            <SocialLinks restaurant={restaurant} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pb-24 pt-8">
        {dishes.length === 0 ? (
          <p className="py-20 text-center" style={{ color: "var(--m-muted)" }}>
            لا توجد أصناف متاحة حالياً.
          </p>
        ) : (
          <>
            {/* Featured highlights */}
            {featured.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-4 text-xl font-bold" style={display}>
                  <span style={{ color: "var(--m-accent)" }}>★</span> الأكثر تميّزاً
                </h2>
                <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {featured.map((dish) => (
                    <div key={dish.id} className="w-56 shrink-0">
                      <DishCard dish={dish} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            <CategoryNav categories={categories.map((c) => c.name)} />

            {categories.map((cat) => (
              <section key={cat.name} id={slugId(cat.name)} className="scroll-mt-20 pt-6">
                <h2
                  className="mb-4 inline-block border-b-2 pb-1 text-xl font-bold"
                  style={{ ...display, color: "var(--m-text)", borderColor: "var(--m-accent)" }}
                >
                  {cat.name}
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {cat.dishes.map((dish) => (
                    <DishCard key={dish.id} dish={dish} />
                  ))}
                </div>
              </section>
            ))}
          </>
        )}

        {restaurant.allergens_text && (
          <p className="mt-12 text-center text-xs" style={{ color: "var(--m-muted)" }}>
            ⚠️ {restaurant.allergens_text}
          </p>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t py-6 text-center" style={{ borderColor: "var(--m-border)" }}>
        <a
          href="https://cloudsmenu.netlify.app"
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold opacity-70 transition-opacity hover:opacity-100"
          style={{ color: "var(--m-muted)" }}
        >
          مصنوع بـ ❤️ عبر كلاود منيو
        </a>
      </footer>
    </main>
  );
}

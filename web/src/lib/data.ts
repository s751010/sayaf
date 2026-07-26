import "server-only";
import { createPublicServerClient } from "@/lib/supabase/server";
import {
  PUBLIC_DISH_COLUMNS,
  PUBLIC_MENU_COLUMNS,
  PUBLIC_RESTAURANT_COLUMNS,
  type BlogPost,
  type PublicDish,
  type PublicMenuRow,
  type PublicRestaurant,
} from "@/lib/types";

// ── Blog (public, SEO) ─────────────────────────────────────────────
export async function getPublishedPosts(): Promise<BlogPost[]> {
  const supabase = createPublicServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });
  return (data as BlogPost[]) ?? [];
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = createPublicServerClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return (data as BlogPost | null) ?? null;
}

/** Lightweight lookup used by generateMetadata. */
export async function getRestaurantBySlug(
  slug: string
): Promise<PublicRestaurant | null> {
  const supabase = createPublicServerClient();
  if (!supabase) return null;
  // أعمدة صريحة: دور anon لا يملك صلاحية على user_id، و`*` يفشل بسببه.
  const { data } = await supabase
    .from("restaurants")
    .select(PUBLIC_RESTAURANT_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  return (data as PublicRestaurant | null) ?? null;
}

export interface PublicMenu {
  restaurant: PublicRestaurant;
  menu: PublicMenuRow | null;
  dishes: PublicDish[];
  featured: PublicDish[];
  categories: { name: string; dishes: PublicDish[] }[];
}

/**
 * Loads the public menu for a restaurant slug: the restaurant record, its
 * first menu, and the available dishes grouped by category. Returns null when
 * the restaurant doesn't exist or Supabase isn't configured.
 */
export async function getPublicMenu(slug: string): Promise<PublicMenu | null> {
  const supabase = createPublicServerClient();
  if (!supabase) return null;

  const { data: restaurantRow } = await supabase
    .from("restaurants")
    .select(PUBLIC_RESTAURANT_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  const restaurant = restaurantRow as PublicRestaurant | null;
  if (!restaurant) return null;

  const { data: menuRow } = await supabase
    .from("menus")
    .select(PUBLIC_MENU_COLUMNS)
    .eq("restaurant_id", restaurant.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const menu = menuRow as PublicMenuRow | null;

  let dishes: PublicDish[] = [];
  if (menu) {
    const { data } = await supabase
      .from("dishes")
      .select(PUBLIC_DISH_COLUMNS)
      .eq("menu_id", menu.id)
      .eq("available", true)
      .order("category", { ascending: true })
      .order("created_at", { ascending: true });
    dishes = (data ?? []) as unknown as PublicDish[];
  }

  const byCategory = new Map<string, PublicDish[]>();
  for (const dish of dishes) {
    const key = dish.category?.trim() || "القائمة";
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key)!.push(dish);
  }
  // Featured dishes float to the top within each category.
  const categories = [...byCategory.entries()].map(([name, items]) => ({
    name,
    dishes: [...items].sort(
      (a, b) => Number(b.featured ?? false) - Number(a.featured ?? false)
    ),
  }));

  const featured = dishes.filter((d) => d.featured).slice(0, 8);

  return { restaurant, menu: menu ?? null, dishes, featured, categories };
}

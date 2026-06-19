import "server-only";
import { createPublicServerClient } from "@/lib/supabase/server";
import type { BlogPost, Dish, Menu, Restaurant } from "@/lib/types";

// ── Blog (public, SEO) ─────────────────────────────────────────────
export async function getPublishedPosts(): Promise<BlogPost[]> {
  const supabase = createPublicServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });
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
): Promise<Restaurant | null> {
  const supabase = createPublicServerClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return (data as Restaurant | null) ?? null;
}

export interface PublicMenu {
  restaurant: Restaurant;
  menu: Menu | null;
  dishes: Dish[];
  categories: { name: string; dishes: Dish[] }[];
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
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  const restaurant = restaurantRow as Restaurant | null;
  if (!restaurant) return null;

  const { data: menuRow } = await supabase
    .from("menus")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const menu = menuRow as Menu | null;

  let dishes: Dish[] = [];
  if (menu) {
    const { data } = await supabase
      .from("dishes")
      .select("*")
      .eq("menu_id", menu.id)
      .eq("available", true);
    dishes = (data ?? []) as Dish[];
  }

  const byCategory = new Map<string, Dish[]>();
  for (const dish of dishes) {
    const key = dish.category?.trim() || "القائمة";
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key)!.push(dish);
  }
  const categories = [...byCategory.entries()].map(([name, items]) => ({
    name,
    dishes: items,
  }));

  return { restaurant, menu: menu ?? null, dishes, categories };
}

import "server-only";
import { createServerSupabase, getCurrentUser } from "@/lib/supabase/server";
import type { Dish, Menu, Restaurant } from "@/lib/types";

/** The current owner's restaurant (one per user), or null if not onboarded. */
export async function getMyRestaurant(): Promise<Restaurant | null> {
  const user = await getCurrentUser();
  const supabase = await createServerSupabase();
  if (!user || !supabase) return null;
  const { data } = await supabase
    .from("restaurants")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data as Restaurant | null) ?? null;
}

export async function getMyMenus(restaurantId: string): Promise<Menu[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("menus")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: true });
  return (data as Menu[]) ?? [];
}

export async function getMyDishes(restaurantId: string): Promise<Dish[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("dishes")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("category", { ascending: true });
  return (data as Dish[]) ?? [];
}

/** Loyalty customers (schema is partially known — typed loosely). */
export type LoyaltyCustomer = {
  id: string;
  name?: string | null;
  phone?: string | null;
  visits?: number | null;
  points?: number | null;
  [key: string]: unknown;
};

export async function getLoyaltyCustomers(
  restaurantId: string
): Promise<LoyaltyCustomer[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("loyalty_customers")
    .select("*")
    .eq("restaurant_id", restaurantId);
  return (data as LoyaltyCustomer[]) ?? [];
}

export async function getDish(id: string): Promise<Dish | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("dishes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as Dish | null) ?? null;
}

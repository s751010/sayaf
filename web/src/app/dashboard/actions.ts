"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase, getCurrentUser } from "@/lib/supabase/server";
import { getMyRestaurant } from "@/lib/owner";

export type ActionState = { error?: string; message?: string };

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Numeric form field → number | null (null when empty/invalid). */
function numOrNull(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function strOrNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

// ── Restaurant onboarding ──────────────────────────────────────────
export async function createRestaurant(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createServerSupabase();
  const user = await getCurrentUser();
  if (!supabase || !user) return { error: "الجلسة منتهية. سجّل الدخول مجدداً." };

  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? name));
  const type = strOrNull(formData.get("type"));
  if (!name || !slug) return { error: "أدخل اسم المطعم والرابط (slug)." };

  const { error } = await supabase
    .from("restaurants")
    .insert({ name, slug, type, user_id: user.id });
  if (error)
    return { error: "تعذّر الإنشاء — قد يكون الرابط (slug) مستخدماً." };

  revalidatePath("/dashboard");
  redirect("/dashboard/menus");
}

// ── Restaurant settings ────────────────────────────────────────────
export async function updateRestaurant(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createServerSupabase();
  const restaurant = await getMyRestaurant();
  if (!supabase || !restaurant) return { error: "أنشئ مطعمك أولاً." };

  const fields = {
    name: String(formData.get("name") ?? "").trim() || restaurant.name,
    type: strOrNull(formData.get("type")),
    logo_image: strOrNull(formData.get("logo_image")),
    banner_image: strOrNull(formData.get("banner_image")),
    working_hours: strOrNull(formData.get("working_hours")),
    allergens_text: strOrNull(formData.get("allergens_text")),
    google_review_url: strOrNull(formData.get("google_review_url")),
    social_instagram: strOrNull(formData.get("social_instagram")),
    social_twitter: strOrNull(formData.get("social_twitter")),
    social_tiktok: strOrNull(formData.get("social_tiktok")),
    social_snapchat: strOrNull(formData.get("social_snapchat")),
    social_maps: strOrNull(formData.get("social_maps")),
    loyalty_enabled: formData.get("loyalty_enabled") === "on",
    loyalty_goal: numOrNull(formData.get("loyalty_goal")),
    loyalty_reward: strOrNull(formData.get("loyalty_reward")),
  };

  const { error } = await supabase
    .from("restaurants")
    .update(fields)
    .eq("id", restaurant.id);
  if (error) return { error: "تعذّر حفظ الإعدادات." };

  revalidatePath("/dashboard/settings");
  revalidatePath(`/${restaurant.slug}`);
  return { message: "تم حفظ الإعدادات." };
}

// ── Menus ──────────────────────────────────────────────────────────
export async function createMenu(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createServerSupabase();
  const restaurant = await getMyRestaurant();
  if (!supabase || !restaurant) return { error: "أنشئ مطعمك أولاً." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "أدخل اسم القائمة." };

  const { error } = await supabase
    .from("menus")
    .insert({ name, restaurant_id: restaurant.id });
  if (error) return { error: "تعذّر إنشاء القائمة." };

  revalidatePath("/dashboard/menus");
  return { message: "تمت إضافة القائمة." };
}

// ── Dishes (create + update share one typed payload) ───────────────
export async function saveDish(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createServerSupabase();
  const user = await getCurrentUser();
  const restaurant = await getMyRestaurant();
  if (!supabase || !user || !restaurant)
    return { error: "الجلسة منتهية أو لا يوجد مطعم." };

  const id = strOrNull(formData.get("id"));
  const menu_id = strOrNull(formData.get("menu_id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "اسم الصنف مطلوب." };
  if (!menu_id) return { error: "اختر القائمة." };

  // Single source of truth for the editable fields — no silent drops.
  const fields = {
    name,
    description: strOrNull(formData.get("description")),
    price: numOrNull(formData.get("price")) ?? 0,
    category: strOrNull(formData.get("category")),
    emoji: strOrNull(formData.get("emoji")) ?? "🍽",
    image: strOrNull(formData.get("image")),
    featured: formData.get("featured") === "on",
    available: formData.get("available") === "on",
    calories: numOrNull(formData.get("calories")),
    sodium_mg: numOrNull(formData.get("sodium_mg")),
    caffeine_mg: numOrNull(formData.get("caffeine_mg")),
  };

  if (id) {
    const { error } = await supabase.from("dishes").update(fields).eq("id", id);
    if (error) return { error: "تعذّر تحديث الصنف." };
  } else {
    const { error } = await supabase.from("dishes").insert({
      ...fields,
      menu_id,
      restaurant_id: restaurant.id,
      user_id: user.id,
      views: 0,
    });
    if (error) return { error: "تعذّر إضافة الصنف." };
  }

  revalidatePath("/dashboard/dishes");
  redirect("/dashboard/dishes");
}

export async function deleteDish(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const id = strOrNull(formData.get("id"));
  if (!supabase || !id) return;
  await supabase.from("dishes").delete().eq("id", id);
  revalidatePath("/dashboard/dishes");
}

export async function toggleDishAvailability(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const id = strOrNull(formData.get("id"));
  const next = formData.get("next") === "true";
  if (!supabase || !id) return;
  await supabase.from("dishes").update({ available: next }).eq("id", id);
  revalidatePath("/dashboard/dishes");
}

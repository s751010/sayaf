"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase, getCurrentUser } from "@/lib/supabase/server";
import { getMyRestaurant } from "@/lib/owner";
import { getMyEntitlements } from "@/lib/entitlements";
import { parseDishOptions, serializeDishOptions } from "@/lib/options";
import type { Dish, Menu } from "@/lib/types";

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

/** نص مفصول بفواصل (عربية أو إنجليزية) → مصفوفة نظيفة. */
function csvToArray(v: FormDataEntryValue | null): string[] {
  return String(v ?? "")
    .split(/[,،]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
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

  // الصلاحيات: الولاء والمنيو الإنجليزي حصريّان لباقة الاحترافية —
  // نُجبر إيقافهما لمن لا يملك الصلاحية حتى لو وصل الحقل في النموذج.
  const ent = await getMyEntitlements();

  const fields = {
    name: String(formData.get("name") ?? "").trim() || restaurant.name,
    type: strOrNull(formData.get("type")),
    phone: strOrNull(formData.get("phone")),
    address: strOrNull(formData.get("address")),
    logo_image: strOrNull(formData.get("logo_image")),
    banner_image: strOrNull(formData.get("banner_image")),
    working_hours: strOrNull(formData.get("working_hours")),
    allergens_text: strOrNull(formData.get("allergens_text")),
    google_review_url: strOrNull(formData.get("google_review_url")),
    social_whatsapp: strOrNull(formData.get("social_whatsapp")),
    social_instagram: strOrNull(formData.get("social_instagram")),
    social_twitter: strOrNull(formData.get("social_twitter")),
    social_tiktok: strOrNull(formData.get("social_tiktok")),
    social_snapchat: strOrNull(formData.get("social_snapchat")),
    social_maps: strOrNull(formData.get("social_maps")),
    english_enabled: ent.english && formData.get("english_enabled") === "on",
    loyalty_enabled: ent.loyalty && formData.get("loyalty_enabled") === "on",
    loyalty_goal: numOrNull(formData.get("loyalty_goal")),
    loyalty_reward: strOrNull(formData.get("loyalty_reward")),
    reviews_enabled: formData.get("reviews_enabled") === "on",
  };

  const { error } = await supabase
    .from("restaurants")
    .update(fields)
    .eq("id", restaurant.id);
  if (error) return { error: "تعذّر حفظ الإعدادات." };

  // Theme is stored per menu — apply the chosen theme to all of the
  // restaurant's menus so the public page reflects it.
  const theme = strOrNull(formData.get("menu_theme"));
  if (theme) {
    await supabase.from("menus").update({ theme }).eq("restaurant_id", restaurant.id);
  }

  revalidatePath("/dashboard/settings");
  if (restaurant.slug) revalidatePath(`/${restaurant.slug}`);
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

  // فرض حدّ القوائم حسب الباقة (الأساسية: قائمة واحدة، الاحترافية: غير محدود).
  const ent = await getMyEntitlements();
  if (ent.maxMenus !== null) {
    const { count } = await supabase
      .from("menus")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurant.id);
    if ((count ?? 0) >= ent.maxMenus) {
      return {
        error: `باقتك الحالية تسمح بـ ${ent.maxMenus} قائمة. رقِّ إلى الاحترافية لقوائم غير محدودة.`,
      };
    }
  }

  const { error } = await supabase
    .from("menus")
    .insert({ name, restaurant_id: restaurant.id });
  if (error) return { error: "تعذّر إنشاء القائمة." };

  revalidatePath("/dashboard/menus");
  return { message: "تمت إضافة القائمة." };
}

/**
 * نسخ قائمة كاملة بأصنافها.
 *
 * يحترم حدّ القوائم في الباقة تماماً كإنشاء قائمة جديدة، ويعيد بناء كل صنف من
 * قائمة حقول صريحة (القاعدة أ) بدل نسخ الصف كما هو — فلا تُنسخ `id` أو
 * `created_at` أو عدّاد المشاهدات، والصنف الجديد يبدأ بمشاهدات صفر.
 */
export async function duplicateMenu(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createServerSupabase();
  const user = await getCurrentUser();
  const restaurant = await getMyRestaurant();
  if (!supabase || !user || !restaurant) return { error: "أنشئ مطعمك أولاً." };

  const menuId = String(formData.get("menu_id") ?? "").trim();
  if (!menuId) return { error: "قائمة غير معروفة." };

  const ent = await getMyEntitlements();
  if (ent.maxMenus !== null) {
    const { count } = await supabase
      .from("menus")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurant.id);
    if ((count ?? 0) >= ent.maxMenus) {
      return {
        error: `باقتك الحالية تسمح بـ ${ent.maxMenus} قائمة. رقِّ إلى الاحترافية لقوائم غير محدودة.`,
      };
    }
  }

  // RLS تضمن أن القائمة تخص هذا المستخدم؛ نتأكد كذلك من المطعم.
  const { data: sourceRow } = await supabase
    .from("menus")
    .select("*")
    .eq("id", menuId)
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();

  const source = sourceRow as Menu | null;
  if (!source) return { error: "القائمة غير موجودة." };

  const { data: created, error: menuError } = await supabase
    .from("menus")
    .insert({
      name: `${source.name} (نسخة)`,
      description: source.description,
      theme: source.theme,
      language: source.language,
      cover_image: source.cover_image,
      active: false, // النسخة تبدأ معطّلة حتى يراجعها التاجر قبل نشرها.
      restaurant_id: restaurant.id,
      user_id: user.id,
    })
    .select("id")
    .single();

  if (menuError || !created) return { error: "تعذّر نسخ القائمة." };

  const { data: dishRows } = await supabase
    .from("dishes")
    .select("*")
    .eq("menu_id", menuId);

  const dishes = (dishRows ?? []) as Dish[];
  if (dishes.length > 0) {
    const copies = dishes.map((d) => ({
      name: d.name,
      description: d.description,
      price: d.price,
      category: d.category,
      emoji: d.emoji,
      image: d.image,
      featured: d.featured,
      available: d.available,
      calories: d.calories,
      sodium_mg: d.sodium_mg,
      caffeine_mg: d.caffeine_mg,
      burn_minutes: d.burn_minutes,
      allergens: d.allergens,
      name_en: d.name_en,
      description_en: d.description_en,
      options: d.options,
      views: 0,
      menu_id: created.id as string,
      restaurant_id: restaurant.id,
      user_id: user.id,
    }));

    const { error: dishError } = await supabase.from("dishes").insert(copies);
    if (dishError) {
      // لا نترك قائمة نصف منسوخة خلفنا.
      await supabase.from("menus").delete().eq("id", created.id);
      return { error: "تعذّر نسخ أصناف القائمة." };
    }
  }

  revalidatePath("/dashboard/menus");
  return {
    message: `نُسخت القائمة مع ${dishes.length} صنفاً. النسخة معطّلة — فعّلها بعد المراجعة.`,
  };
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

  // الصلاحيات: حقول اللغة الإنجليزية حصرية لباقة الاحترافية.
  const ent = await getMyEntitlements();

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
    allergens: csvToArray(formData.get("allergens")),
    name_en: ent.english ? strOrNull(formData.get("name_en")) : null,
    description_en: ent.english ? strOrNull(formData.get("description_en")) : null,
    // خيارات الطبق: نعيد تحليلها وتنظيفها على الخادم — لا نثق بنص العميل كما هو.
    options: serializeDishOptions(
      parseDishOptions(strOrNull(formData.get("options")))
    ),
  };

  if (id) {
    const { error } = await supabase.from("dishes").update(fields).eq("id", id);
    if (error) return { error: "تعذّر تحديث الصنف." };
  } else {
    // فرض حدّ الأصناف حسب الباقة (الأساسية: 100، الاحترافية: غير محدود).
    if (ent.maxDishes !== null) {
      const { count } = await supabase
        .from("dishes")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", restaurant.id);
      if ((count ?? 0) >= ent.maxDishes) {
        return {
          error: `باقتك الحالية تسمح بـ ${ent.maxDishes} صنف. رقِّ إلى الاحترافية لأصناف غير محدودة.`,
        };
      }
    }

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

/**
 * كل استعلامات وكتابات الجداول في مكان واحد.
 *
 * ⚠️ القاعدة (أ) من CLAUDE.md: الكتابة تتم بكائنات payload صريحة (whitelist) —
 * أي حقل جديد يجب إضافته في: (1) تهيئة الفورم، (2) payload الإضافة هنا،
 * (3) payload التحديث هنا. حقل ناقص = يُسقَط بصمت بلا أي خطأ.
 */
import { rest, restCount } from "./api";
import type {
  AnalyticsRow,
  BlogPost,
  Dish,
  LoyaltyCustomer,
  Menu,
  Restaurant,
  Subscription,
} from "./types";

// ── عام (زائر — بمفتاح anon) ─────────────────────────────────────────

export async function getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  const rows = await rest<Restaurant[]>(
    `restaurants?slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`,
    { anonymous: true }
  );
  return rows[0] ?? null;
}

export async function getActiveMenus(restaurantId: string): Promise<Menu[]> {
  const rows = await rest<Menu[]>(
    `menus?restaurant_id=eq.${restaurantId}&select=*&order=created_at.asc`,
    { anonymous: true }
  );
  // active=null تُعامل كمفعّلة (بيانات قديمة قبل إضافة العمود).
  return rows.filter((m) => m.active !== false);
}

export async function getAvailableDishes(menuIds: string[]): Promise<Dish[]> {
  if (menuIds.length === 0) return [];
  const list = menuIds.map(encodeURIComponent).join(",");
  return rest<Dish[]>(
    `dishes?menu_id=in.(${list})&available=eq.true&select=*&order=created_at.asc`,
    { anonymous: true }
  );
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  return rest<BlogPost[]>(
    `blog_posts?published=eq.true&select=*&order=created_at.desc`,
    { anonymous: true }
  );
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const rows = await rest<BlogPost[]>(
    `blog_posts?slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`,
    { anonymous: true }
  );
  return rows[0] ?? null;
}

export async function getSiteSetting<T>(key: string): Promise<T | null> {
  try {
    const rows = await rest<{ value: T }[]>(
      `site_settings?key=eq.${encodeURIComponent(key)}&select=value&limit=1`,
      { anonymous: true }
    );
    return rows[0]?.value ?? null;
  } catch {
    return null;
  }
}

/** تسجيل مشاهدة منيو — نفس شكل صف analytics في النسخة الأصلية. */
export function trackMenuView(menuId: string, ownerId: string | null): void {
  const now = new Date();
  rest("analytics", {
    method: "POST",
    anonymous: true,
    headers: { Prefer: "return=minimal" },
    body: {
      menu_id: menuId,
      user_id: ownerId,
      date: now.toISOString().slice(0, 10),
      hour: now.getUTCHours(),
      views: 1,
    },
  }).catch(() => {});
}

/** زيادة عداد مشاهدات طبق (أفضل جهد — تجاهُل أي فشل). */
export function trackDishView(dish: Dish): void {
  rest(`dishes?id=eq.${dish.id}`, {
    method: "PATCH",
    anonymous: true,
    headers: { Prefer: "return=minimal" },
    body: { views: (dish.views ?? 0) + 1 },
  }).catch(() => {});
}

// ── التاجر (برمز المستخدم — تحكمه سياسات RLS) ────────────────────────

export async function getMyRestaurant(userId: string): Promise<Restaurant | null> {
  const rows = await rest<Restaurant[]>(
    `restaurants?user_id=eq.${userId}&select=*&order=created_at.asc&limit=1`
  );
  return rows[0] ?? null;
}

export async function createRestaurant(payload: {
  name: string;
  slug: string;
  type: string | null;
  user_id: string;
}): Promise<Restaurant> {
  const rows = await rest<Restaurant[]>("restaurants", { method: "POST", body: payload });
  return rows[0];
}

/** whitelist تحديث المطعم — كل الحقول القابلة للتعديل من صفحة الإعدادات. */
export type RestaurantSettingsPayload = {
  name: string;
  type: string | null;
  phone: string | null;
  address: string | null;
  logo_image: string | null;
  banner_image: string | null;
  working_hours: string | null;
  allergens_text: string | null;
  google_review_url: string | null;
  social_whatsapp: string | null;
  social_instagram: string | null;
  social_twitter: string | null;
  social_tiktok: string | null;
  social_snapchat: string | null;
  social_maps: string | null;
  english_enabled: boolean;
  loyalty_enabled: boolean;
  loyalty_goal: number | null;
  loyalty_reward: string | null;
};

export async function updateRestaurant(
  id: string,
  payload: RestaurantSettingsPayload
): Promise<void> {
  await rest(`restaurants?id=eq.${id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: payload,
  });
}

export async function getMyMenus(restaurantId: string): Promise<Menu[]> {
  return rest<Menu[]>(
    `menus?restaurant_id=eq.${restaurantId}&select=*&order=created_at.asc`
  );
}

export async function createMenu(payload: {
  name: string;
  restaurant_id: string;
  user_id: string;
}): Promise<Menu> {
  const rows = await rest<Menu[]>("menus", { method: "POST", body: payload });
  return rows[0];
}

export async function updateMenu(
  id: string,
  payload: Partial<Pick<Menu, "name" | "description" | "theme" | "active">>
): Promise<void> {
  await rest(`menus?id=eq.${id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: payload,
  });
}

export async function deleteMenu(id: string): Promise<void> {
  await rest(`dishes?menu_id=eq.${id}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
  await rest(`menus?id=eq.${id}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
}

/** يطبّق الثيم المختار على كل قوائم المطعم (الثيم مخزَّن لكل قائمة). */
export async function applyThemeToAllMenus(restaurantId: string, theme: string): Promise<void> {
  await rest(`menus?restaurant_id=eq.${restaurantId}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: { theme },
  });
}

export async function getMyDishes(restaurantId: string): Promise<Dish[]> {
  return rest<Dish[]>(
    `dishes?restaurant_id=eq.${restaurantId}&select=*&order=created_at.desc`
  );
}

export async function countMenus(restaurantId: string): Promise<number> {
  return restCount(`menus?restaurant_id=eq.${restaurantId}&select=id`);
}

export async function countDishes(restaurantId: string): Promise<number> {
  return restCount(`dishes?restaurant_id=eq.${restaurantId}&select=id`);
}

/**
 * whitelist حقول الطبق (القاعدة أ) — مصدر واحد للإضافة والتحديث معاً،
 * فلا يمكن أن يُحفظ حقل في الإنشاء ويسقط في التعديل أو العكس.
 */
export type DishPayload = {
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  emoji: string;
  image: string | null;
  featured: boolean;
  available: boolean;
  calories: number | null;
  sodium_mg: number | null;
  caffeine_mg: number | null;
  burn_minutes: number | null;
  allergens: string[];
  name_en: string | null;
  description_en: string | null;
  options: string | null;
};

export async function createDish(
  payload: DishPayload,
  refs: { menu_id: string; restaurant_id: string; user_id: string }
): Promise<Dish> {
  const rows = await rest<Dish[]>("dishes", {
    method: "POST",
    body: { ...payload, ...refs, views: 0 },
  });
  return rows[0];
}

export async function updateDish(id: string, payload: DishPayload & { menu_id: string }): Promise<void> {
  await rest(`dishes?id=eq.${id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: payload,
  });
}

export async function deleteDish(id: string): Promise<void> {
  await rest(`dishes?id=eq.${id}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
}

export async function toggleDishAvailability(id: string, available: boolean): Promise<void> {
  await rest(`dishes?id=eq.${id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: { available },
  });
}

// ── الاشتراك والتحليلات والولاء ──────────────────────────────────────

export async function getActiveSubscription(userId: string): Promise<Subscription | null> {
  const rows = await rest<Subscription[]>(
    `subscriptions?user_id=eq.${userId}&active=eq.true&select=*&order=end_date.desc&limit=1`
  );
  const sub = rows[0];
  if (!sub) return null;
  const endsAt = sub.end_date ? new Date(sub.end_date).getTime() : null;
  return endsAt === null || endsAt > Date.now() ? sub : null;
}

export async function getMyAnalytics(userId: string, days = 30): Promise<AnalyticsRow[]> {
  const since = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
  return rest<AnalyticsRow[]>(
    `analytics?user_id=eq.${userId}&date=gte.${since}&select=*&order=date.asc`
  );
}

export async function getLoyaltyCustomers(restaurantId: string): Promise<LoyaltyCustomer[]> {
  return rest<LoyaltyCustomer[]>(
    `loyalty_customers?restaurant_id=eq.${restaurantId}&select=*&order=created_at.desc`
  );
}

/** انضمام زبون لبرنامج الولاء من صفحة المنيو العامة — نفس عقد النسخة الأصلية. */
export async function joinLoyalty(payload: {
  restaurant_id: string;
  name: string;
  phone: string;
}): Promise<LoyaltyCustomer> {
  const card_code = Math.random().toString(36).slice(2, 8).toUpperCase();
  const rows = await rest<LoyaltyCustomer[]>("loyalty_customers", {
    method: "POST",
    anonymous: true,
    body: { ...payload, card_code, stamps: 0, total_visits: 0 },
  });
  return rows[0];
}

export async function getLoyaltyCustomer(id: string): Promise<LoyaltyCustomer | null> {
  const rows = await rest<LoyaltyCustomer[]>(
    `loyalty_customers?id=eq.${id}&select=*&limit=1`,
    { anonymous: true }
  );
  return rows[0] ?? null;
}

/** ختم زيارة (من لوحة التاجر). */
export async function stampLoyalty(c: LoyaltyCustomer): Promise<LoyaltyCustomer | null> {
  const rows = await rest<LoyaltyCustomer[]>(`loyalty_customers?id=eq.${c.id}`, {
    method: "PATCH",
    body: { stamps: (c.stamps ?? 0) + 1, total_visits: (c.total_visits ?? 0) + 1 },
  });
  return rows[0] ?? null;
}

/** صرف المكافأة: تصفير الأختام وزيادة عداد المكافآت المصروفة. */
export async function redeemLoyalty(c: LoyaltyCustomer): Promise<LoyaltyCustomer | null> {
  const rows = await rest<LoyaltyCustomer[]>(`loyalty_customers?id=eq.${c.id}`, {
    method: "PATCH",
    body: { stamps: 0, rewards_used: (c.rewards_used ?? 0) + 1 },
  });
  return rows[0] ?? null;
}

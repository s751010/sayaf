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

/**
 * هل منيو هذا المطعم منشور للزبائن (صاحبه مشترك بشكل نشط)؟
 *
 * عبر دالة `is_menu_published` لأن `subscriptions_select` مقصورة على صاحب الصف
 * أو المؤسس — الزائر المجهول لا يستطيع قراءة الاشتراك. الدالة تكشف بولياناً
 * واحداً فقط، لا تفاصيل الاشتراك.
 */
export async function isMenuPublished(slug: string): Promise<boolean> {
  const v = await rest<boolean>("rpc/is_menu_published", {
    method: "POST",
    anonymous: true,
    body: { p_slug: slug },
  });
  return v === true;
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
  // `available` قد تكون null في صفوف قديمة، و`eq.true` كان يستثنيها فتغيب عن
  // منيو الزبون بينما تظهر «متاحة» في لوحة التاجر (لأنه يقرأها `?? true`).
  // نطابق منطق القوائم أعلاه: null = متاح.
  return rest<Dish[]>(
    // ترتيب التاجر أولاً، ثم الأقدم — الصفوف القديمة كلها sort_order = 0
    // فتحافظ على ترتيبها السابق حتى يرتّبها بنفسه.
    `dishes?menu_id=in.(${list})&or=(available.is.null,available.eq.true)&select=*&order=sort_order.asc,created_at.asc`,
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

/**
 * صفّ حدث في `analytics`.
 *
 * `date`/`hour` بتوقيت **الرياض** (UTC+3) لا UTC: التاجر يقرأ «الساعة ٢١» على
 * أنها التاسعة مساءً عنده، وكانت تُكتب بـUTC فتُقرأ منزاحة ثلاث ساعات، ويقع
 * حدث ما بعد منتصف الليل في يوم خاطئ.
 *
 * سياسة `analytics_insert` تتطلّب `menu_id` غير فارغ ومملوكاً للـ`user_id`،
 * فكل حدث — حتى فتح طبق — يحمل معرّف القائمة.
 */
function analyticsRow(menuId: string, ownerId: string | null) {
  const riyadh = new Date(Date.now() + 3 * 3600_000);
  return {
    menu_id: menuId,
    user_id: ownerId,
    date: riyadh.toISOString().slice(0, 10),
    hour: riyadh.getUTCHours(),
    views: 1,
  };
}

/** تسجيل مشاهدة منيو. */
export function trackMenuView(
  menuId: string,
  ownerId: string | null,
  meta: { table?: string | null; lang?: string } = {}
): void {
  rest("analytics", {
    method: "POST",
    anonymous: true,
    headers: { Prefer: "return=minimal" },
    body: {
      ...analyticsRow(menuId, ownerId),
      table_no: meta.table ?? null,
      lang: meta.lang ?? "ar",
    },
  }).catch(() => {});
}

/**
 * زيادة عداد مشاهدات طبق (أفضل جهد — تجاهُل أي فشل).
 *
 * عبر دالة `increment_dish_views` لا بـPATCH مباشر: سياسة `dishes_update`
 * مقصورة على `authenticated`، فكان الـPATCH المجهول يفشل دائماً بصمت. والدالة
 * تزيد ذرّياً فلا تُفقد زيادات متزامنة بين زبونين.
 */
export function trackDishView(
  dish: Dish,
  meta: { table?: string | null; lang?: string } = {}
): void {
  // (١) العدّاد التراكمي على الطبق — للترتيب السريع في اللوحة.
  rest("rpc/increment_dish_views", {
    method: "POST",
    anonymous: true,
    headers: { Prefer: "return=minimal" },
    body: { p_dish_id: dish.id },
  }).catch(() => {});

  // (٢) حدث مؤرَّخ في analytics — يمنح الطبق بعداً زمنياً كان مفقوداً تماماً
  //     (العدّاد وحده لا يجيب «أي طبق صعد هذا الأسبوع؟»).
  if (!dish.menu_id) return;
  rest("analytics", {
    method: "POST",
    anonymous: true,
    headers: { Prefer: "return=minimal" },
    body: {
      ...analyticsRow(dish.menu_id, dish.user_id),
      dish_id: dish.id,
      table_no: meta.table ?? null,
      lang: meta.lang ?? "ar",
    },
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
  prices_include_vat: boolean;
  vat_number: string | null;
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

/**
 * لون علامة المطعم (`cover_color`).
 *
 * دالة مستقلّة عن `RestaurantSettingsPayload` عن قصد: ذلك النوع هو whitelist
 * صفحة الإعدادات، واللون يُحرَّر من صفحة القوائم مع الثيم. إضافته للـwhitelist
 * كانت ستوجب وجوده في فورم الإعدادات (القاعدة أ) بلا داعٍ.
 */
export async function updateBrandColor(id: string, hex: string): Promise<void> {
  await rest(`restaurants?id=eq.${id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: { cover_color: hex },
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
  payload: Partial<
    Pick<Menu, "name" | "description" | "theme" | "active" | "window_from" | "window_to">
  >
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

/**
 * أطباق اللوحة — بنفس ترتيب المنيو العام تماماً (`getAvailableDishes`).
 *
 * كان الترتيب هنا `created_at.desc` وهناك `created_at.asc`، أي أن التاجر يرتّب
 * في شاشة ويرى عكسها عند الزبون. مع السحب صار التطابق شرطاً لا تحسيناً.
 */
export async function getMyDishes(restaurantId: string): Promise<Dish[]> {
  return rest<Dish[]>(
    `dishes?restaurant_id=eq.${restaurantId}&select=*&order=sort_order.asc,created_at.asc`
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
  allergens: string[];
  name_en: string | null;
  description_en: string | null;
  options: string | null;
};

/**
 * ⚠️ لا تُدرج هنا أبداً: `burn_minutes` · `is_high_sodium` · `sfda_compliant`.
 *
 * الثلاثة أعمدة `GENERATED ALWAYS AS … STORED` في Postgres، تحسبها قاعدة
 * البيانات من `calories` و`sodium_mg`:
 *   burn_minutes   = round(calories / 4)
 *   is_high_sodium = sodium_mg > 600
 *   sfda_compliant = calories IS NOT NULL AND sodium_mg IS NOT NULL
 *
 * إرسال أي قيمة لعمود محسوب يجعل Postgres يرفض الطلب كاملاً:
 *   «cannot insert a non-DEFAULT value into column "burn_minutes"»
 * وكان `burn_minutes` مُدرجاً هنا فعلاً، فكان **كل** إنشاء وتعديل طبق يفشل.
 * استخدم `computedNutrition()` في lib/nutrition.ts لعرضها للتاجر بدل طلبها.
 */

export async function createDish(
  payload: DishPayload,
  refs: { menu_id: string; restaurant_id: string; user_id: string; sort_order?: number }
): Promise<Dish> {
  const rows = await rest<Dish[]>("dishes", {
    method: "POST",
    body: { ...payload, ...refs, views: 0 },
  });
  return rows[0];
}

/** أقصى عدد صفوف في طلب إدراج واحد — منيو ٦٠ صنفاً يمرّ في طلبين. */
const IMPORT_CHUNK = 50;

/**
 * إدراج دفعة أطباق (استيراد من نص أو CSV).
 *
 * PostgREST يقبل مصفوفة JSON على POST كإدراج متعدد الصفوف، لكنه يشترط أن تحمل
 * **كل** عناصر المصفوفة نفس المفاتيح؛ نوع `DishPayload` الكامل (لا Partial) هو
 * ما يضمن ذلك — انظر `rowToPayload` في lib/import.
 */
export async function createDishes(
  payloads: DishPayload[],
  refs: { menu_id: string; restaurant_id: string; user_id: string; sort_order?: number }
): Promise<Dish[]> {
  const created: Dish[] = [];
  const base = refs.sort_order ?? 0;
  for (let i = 0; i < payloads.length; i += IMPORT_CHUNK) {
    const body = payloads
      .slice(i, i + IMPORT_CHUNK)
      // ترتيب متصاعد يحفظ ترتيب القائمة التي لصقها التاجر كما كتبها.
      .map((p, j) => ({ ...p, ...refs, sort_order: base + i + j, views: 0 }));
    const rows = await rest<Dish[]>("dishes", { method: "POST", body });
    created.push(...rows);
  }
  return created;
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

/**
 * ترتيب الأطباق بعد السحب.
 *
 * خارج `DishPayload` عن قصد (كسابقة `updateBrandColor` و`setDishImage`): الترتيب
 * يُضبط بالسحب لا من فورم الطبق، وإدراجه في الـwhitelist كان سيوجب حمله في كل
 * حفظ طبق فيدهس ترتيباً غيّره التاجر لتوّه.
 */
export async function reorderDishes(
  updates: { id: string; sort_order: number }[]
): Promise<void> {
  await Promise.all(
    updates.map((u) =>
      rest(`dishes?id=eq.${u.id}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: { sort_order: u.sort_order },
      })
    )
  );
}

/**
 * إعادة تسمية تصنيف على كل أطباقه دفعة واحدة.
 * الفلترة بـ`category=eq.` تحتاج ترميز القيمة — أسماء التصنيفات عربية وقد
 * تحمل مسافات وفواصل.
 */
export async function renameCategory(
  restaurantId: string,
  from: string,
  to: string | null
): Promise<void> {
  await rest(
    `dishes?restaurant_id=eq.${restaurantId}&category=eq.${encodeURIComponent(from)}`,
    { method: "PATCH", headers: { Prefer: "return=minimal" }, body: { category: to } }
  );
}

/** ترتيب التصنيفات — عمود نصّي مستقل عن whitelist الإعدادات. */
export async function updateCategoryOrder(
  restaurantId: string,
  categoryOrder: string | null
): Promise<void> {
  await rest(`restaurants?id=eq.${restaurantId}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: { category_order: categoryOrder },
  });
}

/**
 * صورة الطبق وحدها — يستخدمها الربط الدفعي في شاشة «صور دفعة واحدة».
 *
 * خارج `DishPayload` عن قصد (كسابقة `updateBrandColor`): تلك whitelist فورم
 * الطبق، وإدراج الصورة فيها كان سيوجب مرور الربط الدفعي بالفورم كاملاً
 * فيمحو بقية الحقول بقيم الفورم الفارغة.
 */
export async function setDishImage(id: string, image: string | null): Promise<void> {
  await rest(`dishes?id=eq.${id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: { image },
  });
}

// ── الدعم الفني ──────────────────────────────────────────────────────

/**
 * تذاكر الدعم.
 *
 * الجدول وسياساته كانت جاهزة منذ البداية (`tickets_insert` تسمح للتاجر
 * بالإدخال على صفّه، و`tickets_select` تُريه تذاكره وردّ المؤسس)، لكن لم تكن
 * هناك أي واجهة تُنشئ تذكرة — فصندوق المؤسس يستقبل من النسخة القديمة فقط.
 */
export type SupportTicket = {
  id: string;
  subject: string | null;
  message: string | null;
  status: string | null;
  admin_reply: string | null;
  created_at: string;
};

export async function createSupportTicket(payload: {
  user_id: string;
  user_name: string | null;
  email: string | null;
  restaurant_name: string | null;
  subject: string;
  message: string;
}): Promise<SupportTicket> {
  const rows = await rest<SupportTicket[]>("support_tickets", {
    method: "POST",
    body: { ...payload, status: "open" },
  });
  return rows[0];
}

export async function getMySupportTickets(userId: string): Promise<SupportTicket[]> {
  return rest<SupportTicket[]>(
    `support_tickets?user_id=eq.${userId}&select=id,subject,message,status,admin_reply,created_at&order=created_at.desc&limit=20`
  );
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
  const rows = await rest<LoyaltyCustomer[]>("loyalty_customers", {
    method: "POST",
    anonymous: true,
    body: { ...payload, card_code: newCardCode(), stamps: 0, total_visits: 0 },
  });
  return rows[0];
}

/**
 * رمز بطاقة ولاء بطول ثابت ٦ خانات.
 * `Math.random().toString(36).slice(2, 8)` كان ينتج أحياناً خانة واحدة (مثلاً
 * 0.5 → "0.i" → "I")، والموظف يبحث عن الزبون بهذا الرمز.
 * نستخدم مصدر عشوائية مشفَّر ونستبعد الحروف الملتبسة (0/O و 1/I/L).
 */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function newCardCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
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

// ── وضع الكاشير ──────────────────────────────────────────────────────

/**
 * التاجر لا يريد إعطاء الكاشير حسابه الكامل (يقدر يحذف كل الأطباق)، ولا إنشاء
 * حساب بريد لكل موظف. فالكاشير يدخل `/stamp` برمز، وكل العمليات تمرّ من دالة
 * `staff_stamp` في قاعدة البيانات: هي وحدها تتحقّق من الرمز وتنفّذ الختم ذرّياً.
 *
 * الرمز **لا يمنح أي وصول** لقاعدة البيانات: سياسات `loyalty_customers`
 * و`staff_pins` لا تسمح للزائر المجهول بشيء.
 */
export type StaffCustomer = {
  id: string;
  name: string | null;
  stamps: number;
  total_visits: number;
  card_code: string | null;
  /** آخر أربعة أرقام فقط — يكفي للتمييز بلا كشف جوال الزبون للكاشير. */
  phone_tail: string;
};

export type StaffResult = {
  ok: boolean;
  error?: "not_found" | "no_pin" | "locked" | "bad_pin" | "short_query" | "bad_action" | "customer_not_found" | "not_enough";
  until?: string;
  goal?: number;
  reward?: string | null;
  restaurant?: string;
  customers?: StaffCustomer[];
  customer?: StaffCustomer;
};

export async function staffAction(params: {
  slug: string;
  pin: string;
  action: "lookup" | "stamp" | "redeem";
  query?: string;
  customerId?: string;
}): Promise<StaffResult> {
  return rest<StaffResult>("rpc/staff_stamp", {
    method: "POST",
    anonymous: true,
    body: {
      p_slug: params.slug,
      p_pin: params.pin,
      p_action: params.action,
      p_query: params.query ?? null,
      p_customer_id: params.customerId ?? null,
    },
  });
}

/** رمز كاشير جديد — نفس أبجدية بطاقة الولاء (بلا 0/O و 1/I/L). */
export function newStaffPin(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

/** يضبط رمز الكاشير (يستبدل السابق). التجزئة تتم في قاعدة البيانات. */
export async function setStaffPin(restaurantId: string, pin: string): Promise<void> {
  await rest("rpc/set_staff_pin", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: { p_restaurant_id: restaurantId, p_pin: pin, p_name: null },
  });
}

export type StaffPinRow = {
  id: string;
  enabled: boolean;
  last_used_at: string | null;
  locked_until: string | null;
  created_at: string;
};

/** هل للمطعم رمز كاشير؟ (الهاش نفسه لا يُقرأ.) */
export async function getStaffPin(restaurantId: string): Promise<StaffPinRow | null> {
  const rows = await rest<StaffPinRow[]>(
    `staff_pins?restaurant_id=eq.${restaurantId}&select=id,enabled,last_used_at,locked_until,created_at&limit=1`
  );
  return rows[0] ?? null;
}

export async function deleteStaffPin(restaurantId: string): Promise<void> {
  await rest(`staff_pins?restaurant_id=eq.${restaurantId}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
}

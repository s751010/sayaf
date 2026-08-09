/**
 * كل استعلامات وكتابات الجداول في مكان واحد.
 *
 * ⚠️ القاعدة (أ) من CLAUDE.md: الكتابة تتم بكائنات payload صريحة (whitelist) —
 * أي حقل جديد يجب إضافته في: (1) تهيئة الفورم، (2) payload الإضافة هنا،
 * (3) payload التحديث هنا. حقل ناقص = يُسقَط بصمت بلا أي خطأ.
 */
import { callFunction, rest, restCount } from "./api";
import { generateApiKey, hashApiKey, prefixOf } from "./apiKeys";
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

/**
 * ⚠️ لا تستخدم `select=*` في أي استعلام عام.
 *
 * صلاحيات `anon` على `restaurants` و`menus` و`dishes` ممنوحة **على مستوى
 * الأعمدة** لا الجدول (لإخفاء `user_id` عن الزوّار). و`select=*` يتوسّع إلى كل
 * الأعمدة، فأي عمود جديد بلا منح صريح يُسقط الطلب كاملاً بـ«permission denied»
 * — أي أن إضافة عمود واحد تُطفئ منيوهات كل المطاعم دفعة واحدة. حدث هذا فعلاً.
 *
 * القوائم الصريحة أدناه تجعل العمود الجديد غير مرئي للزبون حتى يُضاف هنا عمداً،
 * بدل أن يكسر الصفحة. وهي أيضاً حاجز ثانٍ يمنع تسريب عمود حسّاس مستقبلاً.
 */
const PUBLIC_RESTAURANT_COLS = [
  "id", "name", "type", "phone", "address", "logo", "cover_color",
  "logo_image", "banner_image", "slug", "google_review_url",
  // مفتاح إظهار زرّ التقييم. كان العمود موجوداً في القاعدة و**لا يقرؤه سطر
  // واحد**، فالزرّ يظهر لكل مطعم بلا سبيل لإطفائه. مُنح لـanon مع إدراجه هنا
  // في نفس الدفعة — القاعدة (و) شقّان لا يفترقان.
  "reviews_enabled", "allergens_text",
  "working_hours", "social_instagram", "social_twitter", "social_tiktok",
  "social_snapchat", "social_whatsapp", "social_maps", "english_enabled",
  "loyalty_enabled", "loyalty_goal", "loyalty_reward",
  "prices_include_vat", "vat_number", "category_order", "season",
  // الإشارة العامة الوحيدة لتشغيل السلة: `restaurant_payment_settings.enabled`
  // محجوب عن anon بالكامل (فيه المفتاح السرّي)، فلا يستطيع الزبون سؤاله.
  "online_payment_enabled",
  // ومسار الطلب الثاني: نصّاً على واتساب المطعم، بلا بوابة ولا مال يمرّ بنا.
  "whatsapp_orders_enabled",
  // بكسلات التتبّع — يقرؤها المتصفح ليحقنها في صفحة المنيو (§15).
  "meta_pixel_id", "ga_measurement_id", "snap_pixel_id", "created_at",
].join(",");

/**
 * ⚠️ **`cover_image` مستبعَد عمداً** — لا لأنه محجوب بل لأنه **لا يُعرض**:
 * لا `MenuPage` ولا أي مكوّن منيو يقرؤه، ولا شاشة في اللوحة ترفعه (بقايا نسخة
 * أقدم). وثلاث قوائم في الإنتاج تحمل فيه **data URI** بمجموع ٣٩٤ ألف محرف —
 * أي أن كل زائر منيو كان ينزّل ١١١–١٦٢ كيلوبايت من base64 **لا يراها**، داخل
 * ردّ JSON حاجز لا صورةً كسولة.
 *
 * حذف اسم من هذه القائمة آمن دائماً (عكس إضافته — القاعدة و): القائمة تضيق
 * فلا يظهر «permission denied»، وما لا يُقرأ لا يُفقد. والعمود باقٍ في القاعدة
 * وفي النوع؛ من يعيده يوماً إلى الواجهة يعيده هنا معه.
 */
const PUBLIC_MENU_COLS = [
  "id", "restaurant_id", "name", "description", "theme", "language",
  "active", "views", "window_from", "window_to", "created_at",
].join(",");

const PUBLIC_DISH_COLS = [
  "id", "menu_id", "restaurant_id", "name", "description", "price", "category",
  "emoji", "image", "featured", "available", "sort_order", "views", "calories",
  "sodium_mg", "caffeine_mg", "burn_minutes", "is_high_sodium", "sfda_compliant",
  "allergens", "name_en", "description_en", "options", "created_at",
].join(",");

/**
 * `asOwner` تجلب الصف بجلسة المستخدم بدل مفتاح anon، فتصل إلى `user_id`
 * المحجوب عن الزوّار. تستخدمها المعاينة للتحقّق من ملكية المطعم فقط.
 */
export async function getRestaurantBySlug(
  slug: string,
  opts: { asOwner?: boolean } = {}
): Promise<Restaurant | null> {
  const cols = opts.asOwner ? "*" : PUBLIC_RESTAURANT_COLS;
  const rows = await rest<Restaurant[]>(
    `restaurants?slug=eq.${encodeURIComponent(slug)}&select=${cols}&limit=1`,
    { anonymous: !opts.asOwner }
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

/**
 * هل الحساب المسجَّل حالياً هو حساب المؤسس؟
 *
 * الجواب من `public.is_founder()` في القاعدة — **نفسها** التي تحكم ٤٨ سياسة
 * RLS. البديل (نسخ بريد المؤسس إلى الواجهة) كان سيكرّر مصدر الحقيقة ويجعل
 * تغيير البريد تغييراً في مكانين. الدالة لا تكشف شيئاً: بوليان عن جلسة المتصل
 * نفسه لا غير.
 *
 * لا ترمي أبداً: فشل الشبكة يعني «ليس المؤسس» فيمضي الدخول إلى لوحة التاجر
 * كالمعتاد — تاجر عادي لا يجوز أن يعلق لأن نداءً تأخّر.
 */
export async function isFounder(): Promise<boolean> {
  try {
    return (await rest<boolean>("rpc/is_founder", { method: "POST", body: {} })) === true;
  } catch {
    return false;
  }
}

export async function getActiveMenus(restaurantId: string): Promise<Menu[]> {
  const rows = await rest<Menu[]>(
    `menus?restaurant_id=eq.${restaurantId}&select=${PUBLIC_MENU_COLS}&order=created_at.asc`,
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
    `dishes?menu_id=in.(${list})&or=(available.is.null,available.eq.true)&select=${PUBLIC_DISH_COLS}&order=sort_order.asc,created_at.asc`,
    { anonymous: true }
  );
}

/**
 * أطباق المطعم كلّها بطلب واحد — **لا تنتظر معرّفات القوائم**.
 *
 * ═══ لماذا وُجدت بجانب `getAvailableDishes` ═══
 *
 * تلك تُرشّح بـ`menu_id=in.(…)`، فلا تستطيع الانطلاق قبل أن تصل القوائم. وكان
 * ذلك يجعل صفحة المنيو أربع رحلات شبكة **متسلسلة**:
 *   المطعم → إعدادات الفوترة → القوائم → الأطباق
 * وقاعدة البيانات في **طوكيو** (‎٢٠٠–٢٦٠ملي للرحلة)، والقارئ زبونٌ واقف عند
 * الطاولة على بيانات جوّاله. أي أن ترتيب الطلبات وحده كان يكلّف ≈ نصف ثانية
 * قبل أن يظهر طبق واحد.
 *
 * و`restaurant_id` عمود على `dishes` **ممنوح لـ`anon`** وداخل
 * `PUBLIC_DISH_COLS` (مفحوص) — فالقاعدة (و) محفوظة، والترشيح بالقوائم ينتقل
 * إلى المتصفّح حيث لا يكلّف رحلة.
 *
 * ⚠️ الفارق عن `getAvailableDishes`: هذه تُعيد أطباق **كل** قوائم المطعم بما
 * فيها المعطّلة وخارج نافذة الوقت. فالمنادي **ملزَم** بترشيحها بمعرّفات
 * القوائم المعروضة فعلاً — وإلا ظهرت للزبون أصناف قائمةٍ أطفأها التاجر.
 *
 * وشرط التوفّر يبقى **مطابقاً حرفياً**: `null` تعني متاح (صفوف قديمة قبل
 * إضافة العمود)، و`eq.true` وحدها كانت تُخفيها عن الزبون بينما يراها التاجر
 * «متاحة» في لوحته.
 */
export async function getRestaurantDishes(restaurantId: string): Promise<Dish[]> {
  if (!restaurantId) return [];
  return rest<Dish[]>(
    `dishes?restaurant_id=eq.${encodeURIComponent(restaurantId)}` +
      `&or=(available.is.null,available.eq.true)` +
      `&select=${PUBLIC_DISH_COLS}&order=sort_order.asc,created_at.asc`,
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

/**
 * يبلّغ عن انهيار واجهة إلى `client_errors`.
 *
 * ═══ ⚠️ لا ترمي أبداً، ولا تُنتظَر ═══
 *
 * منادِيها الوحيد هو `ErrorBoundary` — أي أن التطبيق **منهار بالفعل** حين
 * تُستدعى. فاستثناءٌ منها يعني خطأً ثانياً يقع أثناء الإبلاغ عن الأول، وقد
 * يبتلع شاشةَ الاعتذار نفسها. كل شيء هنا داخل `catch` صامت.
 *
 * ═══ ما يُرسَل — وما لا يُرسَل ═══
 *
 * لا بريد، ولا معرّف مستخدم، ولا محتوى نموذج. الرسالة وأول أسطر الأثر
 * والمسار ووكيل المتصفّح — ما يكفي لإعادة إنتاج العطل لا لمعرفة صاحبه.
 * و`?table=` يُقصّ من المسار: رقم طاولة الزبون لا شأن له بعطل برمجي.
 *
 * والتوقيع (للتجميع وحدّ المعدّل) **يحسبه الخادم** لا نحن — العميل المنهار
 * أسوأ جهة تُؤتمَن على حساب مفتاح التجميع.
 */
export function reportClientError(
  error: Error,
  componentStack?: string | null
): void {
  try {
    const cut = (s: string | null | undefined, n: number) =>
      s ? s.slice(0, n) : null;

    void rest("client_errors", {
      method: "POST",
      anonymous: true,
      headers: { Prefer: "return=minimal" },
      body: {
        message: (error?.message || String(error) || "خطأ بلا رسالة").slice(0, 500),
        stack_head: cut(error?.stack, 2000),
        component_stack: cut(componentStack, 2000),
        page: cut(window.location.pathname + window.location.search.replace(/([?&])table=[^&]*/g, "$1table=…"), 500),
        user_agent: cut(navigator.userAgent, 400),
      },
    }).catch(() => {});
  } catch {
    /* الإبلاغ عن عطل لا يجوز أن يصنع عطلاً */
  }
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

/**
 * تسجيل مشاهدة منيو.
 *
 * `ownerId` يجوز أن يكون `null`: الزائر المجهول لا يستطيع قراءة
 * `restaurants.user_id` (محجوب عنه عمداً)، وتريجر `analytics_fill_owner`
 * يشتقّ المالك من القائمة في القاعدة فتمرّ سياسة `analytics_insert`.
 */
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
  reviews_enabled: boolean;
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
  season: string | null;
  meta_pixel_id: string | null;
  ga_measurement_id: string | null;
  snap_pixel_id: string | null;
  whatsapp_orders_enabled: boolean;
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
 * حفظ **قسم** من الإعدادات لا الصفحة كلها.
 *
 * صفحة الإعدادات كانت ثلاثين حقلاً وزرَّ حفظ واحداً في القاع؛ فمن عدّل الشعار
 * وحده مرّ بكل شيء ليصل إلى الزر. الآن لكل قسم زرّه.
 *
 * ⚠️ **`Partial` لا يُضعف القاعدة (أ)**: النوع ما زال يحصر **المفاتيح** في
 * الـwhitelist نفسها، فالمفتاح المكتوب خطأً أو العمود المحسوب يُرفضان وقت
 * الترجمة كما كانا. الذي رُفع هو شرط «أرسِل كل الحقول» لا شرط «الحقول
 * المعروفة وحدها» — وPATCH بمجموعة جزئية لا يمسّ بقية الأعمدة أصلاً.
 */
export async function updateRestaurantFields(
  id: string,
  patch: Partial<RestaurantSettingsPayload>
): Promise<void> {
  if (!Object.keys(patch).length) return;
  await rest(`restaurants?id=eq.${id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: patch,
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

/* ── الدفع الإلكتروني داخل المنيو ─────────────────────────────────── */

/**
 * إعدادات بوابة الدفع للمطعم — **بلا `secret_key` إطلاقاً**.
 *
 * ⚠️ لا تُضِف `secret_key` إلى هذا النوع ولا إلى `PAYMENT_COLS` ولو للمؤسس:
 * المفتاح يخوّل حاملَه إصدار فواتير باسم المطعم وقبض أمواله. الوجود المشروع
 * الوحيد له في هذا النظام هو عمود القاعدة، تقرؤه `paylink-order-create` وحدها
 * بمفتاح الخدمة على الخادم. العمود المحسوب `has_secret` يخبر الواجهة أن مفتاحاً
 * محفوظ دون كشف شيء منه.
 */
export type PaymentSettings = {
  restaurant_id: string;
  provider: string;
  api_id: string | null;
  enabled: boolean;
  has_secret: boolean;
};

const PAYMENT_COLS = "restaurant_id,provider,api_id,enabled,has_secret";

export async function getPaymentSettings(
  restaurantId: string
): Promise<PaymentSettings | null> {
  const rows = await rest<PaymentSettings[]>(
    `restaurant_payment_settings?restaurant_id=eq.${restaurantId}&select=${PAYMENT_COLS}&limit=1`
  );
  return rows[0] ?? null;
}

/**
 * حفظ بيانات البوابة. `secret_key: null` تعني «أبقِ المحفوظ كما هو» — والمفتاح
 * لا يُقرأ أصلاً فلا سبيل لإعادة إرساله، ولو أرسلناه فارغاً لمحوناه بكل حفظ.
 *
 * upsert بمفتاح `restaurant_id` (المفتاح الأساسي)، و`merge-duplicates` لا
 * يلمس عموداً غائباً عن الجسم.
 */
export async function savePaymentSettings(input: {
  restaurant_id: string;
  user_id: string;
  api_id: string | null;
  secret_key: string | null;
  enabled: boolean;
}): Promise<void> {
  const body: Record<string, unknown> = {
    restaurant_id: input.restaurant_id,
    user_id: input.user_id,
    provider: "paylink",
    api_id: input.api_id,
    enabled: input.enabled,
  };
  if (input.secret_key !== null) body.secret_key = input.secret_key;
  await rest("restaurant_payment_settings", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body,
  });
}

/**
 * مفتاح ظهور السلة للزبون (`restaurants.online_payment_enabled`).
 *
 * خارج `RestaurantSettingsPayload` عمداً (القاعدة هـ): يُحفظ من بطاقة الدفع مع
 * بيانات البوابة في نفس الضغطة، وإدراجه في whitelist الإعدادات كان سيجعل زرّ
 * «حفظ الإعدادات» يحمله فيدهس ما ضبطه التاجر في البطاقة الأخرى.
 */
export async function updateOnlinePayment(
  restaurantId: string,
  enabled: boolean
): Promise<void> {
  await rest(`restaurants?id=eq.${restaurantId}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: { online_payment_enabled: enabled },
  });
}

/** صفّ دفعة كما يراه التاجر في صفحة الاشتراك. */
export type PaymentRow = {
  id: string;
  plan_name: string | null;
  amount: number | null;
  payment_ref: string | null;
  created_at: string;
};

/**
 * سجل دفعات التاجر من `revenue_log`.
 *
 * لا حاجة لترحيل: سياسة `revenue_select` القائمة هي
 * `auth.uid() = user_id OR is_founder()` — التاجر يقرأ صفوفه أصلاً، والإدراج
 * محصور بالمؤسس فلا يستطيع تلفيق دفعة.
 *
 * ⚠️ هذا **إيصال لا فاتورة ضريبية**: الفاتورة الضريبية تتطلّب رقماً ضريبياً
 * للطرفين وترقيماً متسلسلاً وصيغة ZATCA — مؤجَّلة بقرار المالك. لا تُسمِّه
 * فاتورة في الواجهة.
 */
export async function getMyPayments(userId: string): Promise<PaymentRow[]> {
  return rest<PaymentRow[]>(
    `revenue_log?user_id=eq.${userId}` +
      "&select=id,plan_name,amount,payment_ref,created_at&order=created_at.desc&limit=50"
  );
}

/**
 * تشغيل بطاقة الولاء وضبطها **من صفحة الولاء نفسها**.
 *
 * دالة مستقلّة عن `RestaurantSettingsPayload` (القاعدة هـ) رغم أن الحقول الثلاثة
 * موجودة فيه: صفحة الولاء لا تحمل بقية إعدادات المطعم، وإرسال الـpayload كاملاً
 * منها كان سيدهس ما ضبطه التاجر في الإعدادات لتوّه.
 *
 * سبب وجودها أصلاً: البرنامج مفعَّل عند **مطعم واحد من ١٩**، وصفحة الولاء كانت
 * تقول «فعّله من الإعدادات» — رحلة صفحتين لمن جاء ليفعّله. الآن تتمّ في مكانها.
 */
export async function setupLoyalty(
  restaurantId: string,
  input: { enabled: boolean; goal?: number | null; reward?: string | null }
): Promise<void> {
  const body: Record<string, unknown> = { loyalty_enabled: input.enabled };
  if (input.goal !== undefined) {
    // نفس الحصر في صفحة الإعدادات: بطاقة الزبون ترسم `Array(goal)` وقيمة خارج
    // المدى كانت تُسقط صفحة المنيو بـRangeError.
    body.loyalty_goal =
      input.goal === null ? null : Math.min(20, Math.max(1, Math.round(input.goal)));
  }
  if (input.reward !== undefined) body.loyalty_reward = input.reward;
  await rest(`restaurants?id=eq.${restaurantId}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body,
  });
}

/* ── Webhooks ─────────────────────────────────────────────────────── */

/** وجهة ويبهوك كما يراها التاجر — **بلا `secret`** (محجوب على مستوى العمود). */
export type Webhook = {
  id: string;
  restaurant_id: string;
  url: string;
  events: string[];
  enabled: boolean;
  created_at: string;
};

export const WEBHOOK_EVENTS = [
  { id: "menu.viewed", label: "فتح المنيو", hint: "كل مرة يفتح زبون منيوك" },
  { id: "dish.unavailable", label: "نفاد صنف", hint: "عند إطفاء طبق — الأنسب لنقطة البيع" },
  { id: "loyalty.stamped", label: "ختم ولاء", hint: "عدد الأختام فقط، بلا بيانات الزبون" },
] as const;

const WEBHOOK_COLS = "id,restaurant_id,url,events,enabled,created_at";

export async function getWebhooks(restaurantId: string): Promise<Webhook[]> {
  return rest<Webhook[]>(
    `webhooks?restaurant_id=eq.${restaurantId}&select=${WEBHOOK_COLS}&order=created_at.desc`
  );
}

/**
 * يُنشئ وجهة ويعيد **سرّ التوقيع مرة واحدة**.
 *
 * السرّ يولّده الخادم (`gen_random_bytes` في `DEFAULT`) لا التاجر، ويصل هنا من
 * ردّ `RETURNING` وحده — العمود محجوب عن `SELECT` فلا يُقرأ بعدها أبداً. بهذا
 * لا يستطيع من يصل للوحة لاحقاً انتحال توقيعنا تجاه خادم التاجر.
 */
export async function createWebhook(input: {
  restaurant_id: string;
  user_id: string;
  url: string;
  events: string[];
}): Promise<{ hook: Webhook; secret: string }> {
  const rows = await rest<(Webhook & { secret: string })[]>(
    "webhooks?select=" + WEBHOOK_COLS + ",secret",
    {
      method: "POST",
      body: {
        restaurant_id: input.restaurant_id,
        user_id: input.user_id,
        url: input.url.trim(),
        events: input.events,
        enabled: true,
      },
    }
  );
  const { secret, ...hook } = rows[0];
  return { hook, secret };
}

export async function setWebhookEnabled(id: string, enabled: boolean): Promise<void> {
  await rest(`webhooks?id=eq.${id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: { enabled },
  });
}

export async function deleteWebhook(id: string): Promise<void> {
  await rest(`webhooks?id=eq.${id}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
}

export type WebhookDelivery = {
  id: number;
  event: string;
  attempts: number;
  delivered_at: string | null;
  last_error: string | null;
  created_at: string;
};

/** آخر التسليمات — يجيب سؤال «لماذا لم يصلني شيء؟» بلا مراسلة الدعم. */
export async function getWebhookDeliveries(restaurantId: string): Promise<WebhookDelivery[]> {
  return rest<WebhookDelivery[]>(
    `webhook_events?restaurant_id=eq.${restaurantId}` +
      "&select=id,event,attempts,delivered_at,last_error,created_at&order=id.desc&limit=15"
  );
}

/* ── مفاتيح API ───────────────────────────────────────────────────── */

/**
 * صفّ مفتاح كما يراه التاجر — **بلا `key_hash`**.
 *
 * الحجب على مستوى العمود في القاعدة لا في هذا النوع: `GRANT SELECT` على
 * `api_keys` يستثني `key_hash` صراحةً، فحتى `select=*` لا يكشفه. النوع هنا
 * يعكس ذلك فقط.
 */
export type ApiKey = {
  id: string;
  restaurant_id: string;
  name: string;
  prefix: string;
  scopes: string[];
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

const API_KEY_COLS =
  "id,restaurant_id,name,prefix,scopes,last_used_at,revoked_at,created_at";

export async function getApiKeys(restaurantId: string): Promise<ApiKey[]> {
  return rest<ApiKey[]>(
    `api_keys?restaurant_id=eq.${restaurantId}&select=${API_KEY_COLS}&order=created_at.desc`
  );
}

/**
 * يُنشئ المفتاح ويعيد **السرّ كاملاً مرة واحدة**. لا سبيل لاستعادته بعدها —
 * القاعدة لا تحمل إلا هاشه.
 *
 * الحارسان في القاعدة لا هنا: سياسة `api_keys_insert` تشترط أن يكون
 * `restaurants.api_enabled` مفتوحاً (يفتحه المؤسس)، وتريجر يحدّ بخمسة مفاتيح
 * حيّة. فتاجر يتجاوز الواجهة بنداء PostgREST مباشر يُردّ بالسياسة نفسها.
 */
export async function createApiKey(input: {
  restaurant_id: string;
  user_id: string;
  name: string;
  canWrite: boolean;
}): Promise<{ key: ApiKey; secret: string }> {
  const secret = generateApiKey();
  const rows = await rest<ApiKey[]>(`api_keys?select=${API_KEY_COLS}`, {
    method: "POST",
    body: {
      restaurant_id: input.restaurant_id,
      user_id: input.user_id,
      name: input.name.trim() || "مفتاح",
      key_hash: await hashApiKey(secret),
      prefix: prefixOf(secret),
      scopes: input.canWrite ? ["read", "write"] : ["read"],
    },
  });
  return { key: rows[0], secret };
}

/**
 * الإبطال لا الحذف: الصف يبقى ليظلّ `founder_audit` وسجل الاستخدام مفهومَين،
 * ودالة الحافة ترفض أي مفتاح بـ`revoked_at` غير فارغ. والحذف متاح للمؤسس وحده.
 */
export async function revokeApiKey(id: string): Promise<void> {
  await rest(`api_keys?id=eq.${id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: { revoked_at: new Date().toISOString() },
  });
}

/** سطر في سلة الزبون. `option_ids` = **مواضع** الإضافات في `parseOptions(dish.options)`. */
export type OrderLine = { dish_id: string; qty: number; option_ids: string[] };

/**
 * بدء دفع طلب زبون عبر `paylink-order-create`.
 *
 * **لا يُرسَل مبلغ إطلاقاً**: الدالة تعيد قراءة الأسعار من جدول `dishes`
 * وتُسعّر الإضافات من خيارات الطبق المخزَّنة. ما ترسله السلة هو النيّة فقط
 * (أي طبق، كم، وأي إضافات)، فلا يستطيع زائر يعبث بجسم الطلب أن يخفّض ثمنه.
 */
export async function createOrder(input: {
  restaurant_id: string;
  items: OrderLine[];
  table?: string | null;
  customer?: { name?: string; mobile?: string };
}): Promise<{ url: string; transactionNo: string; amount: number }> {
  return callFunction("paylink-order-create", input, { anonymous: true });
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
 * تعديل السعر من قائمة الأطباق مباشرة.
 *
 * خارج `DishPayload` عن قصد (نفس سابقة `toggleDishAvailability` أعلاه): تمرير
 * الـpayload كاملاً لتغيير رقم واحد كان سيوجب تحميل الطبق كله ثم إعادة إرساله،
 * فيدهس أي حقل لم يُحمَّل. تغيير السعر أكثر فعل يومي عند المطعم فيجب أن يكون
 * أرخص نداء لا أغلاه.
 */
export async function updateDishPrice(id: string, price: number): Promise<void> {
  await rest(`dishes?id=eq.${id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: { price },
  });
}

/**
 * ينسخ طبقاً بكل حقوله عدا المحسوبة.
 *
 * الأحجام والنكهات (وسط/كبير، حار/عادي) أكثر ما يتكرّر في منيو سعودي، وإعادة
 * إدخال ستة عشر حقلاً لتغيير كلمة واحدة هو ما يجعل التاجر يتوقّف عند الطبق
 * الثالث. الأعمدة المحسوبة (`burn_minutes` وأختاها) **لا تُنسخ** — إرسالها
 * يجعل Postgres يرفض الطلب كاملاً (القاعدة د).
 */
export async function duplicateDish(
  d: Dish,
  refs: { menu_id: string; restaurant_id: string; user_id: string }
): Promise<Dish> {
  return createDish(
    {
      name: `${d.name} (نسخة)`,
      name_en: d.name_en,
      description: d.description,
      description_en: d.description_en,
      price: d.price ?? 0,
      category: d.category,
      emoji: d.emoji ?? "",
      image: d.image,
      // النسخة ليست مميّزة: «طبق اليوم» واحد، ونسخُه يفسد بطاقته في المنيو.
      featured: false,
      available: d.available ?? true,
      calories: d.calories,
      sodium_mg: d.sodium_mg,
      caffeine_mg: d.caffeine_mg,
      allergens: d.allergens ?? [],
      options: d.options,
    },
    { ...refs, sort_order: (d.sort_order ?? 0) + 1 }
  );
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

/** مدة التجربة المجانية بالأيام (تريجر القاعدة يقبل حتى ١٥ يوماً). */
export const TRIAL_DAYS = 14;

/**
 * يبدأ التجربة المجانية لمستخدم جديد.
 *
 * لا يحتاج أي تغيير خلفي: `is_menu_published` تسأل عن اشتراك نشط لم ينتهِ
 * فقط، فصف التجربة يفتح نشر المنيو تلقائياً — وهذا ما يجعل التحويل إلى
 * `pk_live` لا يُطفئ منيو تاجر بدأ لتوّه.
 *
 * فشل الإنشاء لا يُوقف التسجيل: تريجر `guard_client_subscription` يرفض تجربة
 * ثانية لنفس المستخدم، وهذا رفض متوقّع لا خطأ يستحق إزعاج التاجر به.
 */
export async function startTrial(userId: string): Promise<void> {
  const endsAt = new Date(Date.now() + TRIAL_DAYS * 86400_000).toISOString();
  await rest("subscriptions", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: { user_id: userId, plan_id: "trial", active: true, end_date: endsAt },
  });
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

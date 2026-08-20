/**
 * Domain types for CloudMenu — aligned to the real Supabase schema
 * (introspected from project wjqpsbpebpntpeinqccl). Keep in sync with the DB.
 */

export interface Restaurant {
  id: string;
  user_id: string | null;
  name: string;
  type: string | null;
  phone: string | null;
  address: string | null;
  logo: string | null;
  cover_color: string | null;
  logo_image: string | null;
  banner_image: string | null;
  slug: string | null;
  google_review_url: string | null;
  allergens_text: string | null;
  working_hours: string | null;
  social_instagram: string | null;
  social_twitter: string | null;
  social_tiktok: string | null;
  social_snapchat: string | null;
  social_whatsapp: string | null;
  social_maps: string | null;
  english_enabled: boolean | null;
  loyalty_enabled: boolean | null;
  loyalty_goal: number | null;
  loyalty_reward: string | null;
  reviews_enabled: boolean | null;
  /**
   * علم للقراءة فقط تزامنه قاعدة البيانات من `restaurant_payment_settings`.
   * وجوده هنا يتيح لصفحة المنيو العامة معرفة توفّر الدفع دون لمس جدول الأسرار.
   */
  online_payment_enabled: boolean | null;
  /** يفتح مسار الطلب عبر واتساب في المنيو العام — مستقلّ عن بوابة الدفع. */
  whatsapp_orders_enabled: boolean | null;
  /** هل الأسعار المعروضة شاملة ضريبة القيمة المضافة (١٥٪). */
  prices_include_vat: boolean | null;
  /** الرقم الضريبي للمنشأة — يُعرض في تذييل المنيو إن وُجد. */
  vat_number: string | null;
  created_at: string;
}

/**
 * المطعم كما يراه الزائر — بلا `user_id`.
 *
 * دور `anon` لم يعد يملك صلاحية قراءة `user_id` على مستوى العمود، فأي استعلام
 * عام يجب أن يذكر الأعمدة صراحةً (انظر `PUBLIC_RESTAURANT_COLUMNS`).
 */
export type PublicRestaurant = Omit<Restaurant, "user_id">;

/**
 * أعمدة المطعم المسموح بها للزائر — مطابقة تماماً للمنح في قاعدة البيانات.
 * إضافة عمود عام جديد تتطلب تحديث المكانين معاً.
 */
export const PUBLIC_RESTAURANT_COLUMNS = [
  "id", "name", "type", "phone", "address", "logo", "cover_color",
  "logo_image", "banner_image", "created_at", "slug", "google_review_url",
  "allergens_text", "working_hours", "social_instagram", "social_twitter",
  "social_tiktok", "social_snapchat", "social_whatsapp", "social_maps",
  "english_enabled", "loyalty_enabled", "loyalty_goal", "loyalty_reward",
  "reviews_enabled", "online_payment_enabled", "whatsapp_orders_enabled",
  "prices_include_vat", "vat_number",
].join(", ");

/** أعمدة القائمة المسموح بها للزائر (بلا user_id). */
export const PUBLIC_MENU_COLUMNS = [
  "id", "restaurant_id", "name", "description", "theme", "language",
  "cover_image", "active", "views", "created_at", "window_from", "window_to",
].join(", ");

/** أعمدة الصنف المسموح بها للزائر (بلا user_id). */
export const PUBLIC_DISH_COLUMNS = [
  "id", "menu_id", "restaurant_id", "name", "description", "price", "category",
  "emoji", "image", "featured", "available", "views", "calories", "sodium_mg",
  "caffeine_mg", "burn_minutes", "is_high_sodium", "sfda_compliant",
  "allergens", "name_en", "description_en", "options", "sort_order", "created_at",
].join(", ");

export type PublicMenuRow = Omit<Menu, "user_id">;
export type PublicDish = Omit<Dish, "user_id">;

/**
 * تقييم زبون. `avg_score` يُحسب على الخادم من `answers` ويُقيَّد بـ CHECK في
 * قاعدة البيانات — لا يُقبل من المتصفح.
 */
export interface SurveyResponse {
  id: string;
  restaurant_id: string;
  answers: Record<string, number>;
  note: string | null;
  avg_score: number | null;
  created_at: string;
}

/**
 * بيانات اعتماد بوابة الدفع الخاصة بالمطعم (جدول منفصل بلا أي قراءة للزائر).
 * `secret_key` لا يُرسل للمتصفح إطلاقاً — تقرأه دالة الحافة بمفتاح الخدمة.
 */
export interface RestaurantPaymentSettings {
  restaurant_id: string;
  user_id: string;
  provider: "paylink";
  api_id: string | null;
  secret_key: string | null;
  enabled: boolean;
  updated_at: string;
}

export interface Menu {
  id: string;
  restaurant_id: string | null;
  user_id: string | null;
  name: string;
  description: string | null;
  theme: string | null;
  language: string | null;
  cover_image: string | null;
  active: boolean | null;
  views: number | null;
  /** نافذة ظهور القائمة بتوقيت الرياض بصيغة HH:MM — null = بلا تقييد. */
  window_from: string | null;
  window_to: string | null;
  created_at: string;
}

export interface Dish {
  id: string;
  menu_id: string | null;
  restaurant_id: string | null;
  user_id: string | null;
  name: string;
  description: string | null;
  price: number | null;
  category: string | null;
  emoji: string | null;
  image: string | null;
  featured: boolean | null;
  available: boolean | null;
  views: number | null;
  calories: number | null;
  sodium_mg: number | null;
  caffeine_mg: number | null;
  burn_minutes: number | null;
  is_high_sodium: boolean | null;
  sfda_compliant: boolean | null;
  allergens: string[] | null;
  name_en: string | null;
  description_en: string | null;
  /** ترتيب الطبق داخل تصنيفه (تصاعدي). */
  sort_order: number | null;
  options: string | null;
  created_at: string;
}

export interface BlogPost {
  id: string;
  slug: string | null;
  title: string;
  title_ar: string | null;
  excerpt: string | null;
  excerpt_ar: string | null;
  content: string | null;
  content_ar: string | null;
  cover_image: string | null;
  author: string | null;
  category: string | null;
  tags: string | null;
  status: string | null;
  published: boolean | null;
  seo_title: string | null;
  seo_description: string | null;
  views: number | null;
  published_at: string | null;
  created_at: string;
}

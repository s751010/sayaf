/**
 * أنواع الجداول — مطابقة لسكيما Supabase الفعلية (مشروع wjqpsbpebpntpeinqccl).
 * أي حقل جديد هنا يجب أن يظهر أيضاً في الفورم + payload الإضافة + payload
 * التحديث (القاعدة أ في CLAUDE.md) وإلا يسقط بصمت.
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
  payment_gateway: string | null;
  payment_key: string | null;
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
  /** هل أسعار المنيو شاملة ضريبة القيمة المضافة ١٥٪ (NOT NULL، افتراضي true). */
  prices_include_vat: boolean | null;
  /** الرقم الضريبي للمنشأة — يُعرض في تذييل المنيو إن وُجد. */
  vat_number: string | null;
  /** ترتيب التصنيفات في المنيو — نصّ يحمل مصفوفة JSON (انظر lib/categories). */
  category_order: string | null;
  /** زينة موسمية اختيارية: ramadan | national | founding (انظر lib/seasons). */
  season: string | null;
  /** موجود في الجدول (NOT NULL) لكن لا تكتبه الواجهة بعد. */
  reviews_enabled: boolean | null;
  /**
   * هل تظهر سلة الطلب والدفع للزبون؟ يُكتب من بطاقة «الدفع الإلكتروني» في
   * الإعدادات عبر `updateOnlinePayment` — خارج whitelist الإعدادات (القاعدة هـ).
   */
  online_payment_enabled: boolean | null;
  /** استقبال الطلبات نصّاً على واتساب — مستقلّ عن بوابة الدفع. */
  whatsapp_orders_enabled: boolean | null;
  /**
   * بوّابة واجهة API — **يفتحها المؤسس وحده** (تريجر `guard_api_enabled` يرفض
   * تغييرها لغيره)، ثم يولّد التاجر مفتاحه بنفسه من إعداداته. انظر §14.
   */
  api_enabled: boolean | null;
  /**
   * بكسلات التتبّع — معرّفات عامة يضبطها التاجر ليقيس إعلاناته.
   * ⚠️ القاعدة (و): لكل منها `GRANT SELECT … TO anon` في القاعدة **و** إدراج في
   * `PUBLIC_RESTAURANT_COLS`؛ أحدهما بلا الآخر يكسر منيوهات الجميع أو يُخفي العمود.
   */
  meta_pixel_id: string | null;
  ga_measurement_id: string | null;
  snap_pixel_id: string | null;
  created_at: string;
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
  /** نافذة ظهور القائمة بتوقيت الرياض `HH:MM` — null = تظهر دائماً. */
  window_from: string | null;
  window_to: string | null;
  views: number | null;
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
  /** ترتيب الطبق داخل تصنيفه — يُضبط بالسحب، خارج فورم الطبق. */
  sort_order: number | null;
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

export interface Subscription {
  id: string;
  user_id: string | null;
  plan_id: string | null;
  active: boolean | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface AnalyticsRow {
  id: string;
  menu_id: string | null;
  user_id: string | null;
  /** بتوقيت الرياض (UTC+3) — انظر `analyticsRow` في lib/data. */
  date: string | null;
  hour: number | null;
  views: number | null;
  /** `null` = مشاهدة منيو · قيمة = فتح طبق. */
  dish_id: string | null;
  table_no: string | null;
  lang: string | null;
}

export interface LoyaltyCustomer {
  id: string;
  restaurant_id: string | null;
  name: string | null;
  phone: string | null;
  card_code: string | null;
  stamps: number | null;
  total_visits: number | null;
  rewards_used: number | null;
  created_at: string;
}

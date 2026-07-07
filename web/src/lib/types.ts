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

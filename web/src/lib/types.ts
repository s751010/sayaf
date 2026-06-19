/**
 * Domain types for CloudMenu, derived from the documented Supabase schema
 * (see ../../CLAUDE.md). PostgREST is accessed via the typed Supabase client.
 *
 * NOTE: the live database lives in a separate Supabase account/project
 * (ref: wjqpsbpebpntpeinqccl) that this workspace's MCP cannot introspect,
 * so these types are maintained by hand. Keep them in sync with the schema.
 */

export type DishOption = {
  name: string;
  choices?: { label: string; price?: number }[];
};

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  type: string | null;
  user_id: string | null;
  logo_image: string | null;
  banner_image: string | null;
  theme: string | null;
  working_hours: string | null;
  allergens_text: string | null;
  google_review_url: string | null;
  social_instagram: string | null;
  social_twitter: string | null;
  social_tiktok: string | null;
  social_snapchat: string | null;
  social_maps: string | null;
  loyalty_enabled: boolean | null;
  loyalty_goal: number | null;
  loyalty_reward: string | null;
  created_at: string;
}

export interface Menu {
  id: string;
  restaurant_id: string;
  name: string | null;
  created_at: string;
}

export interface Dish {
  id: string;
  menu_id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number | null;
  category: string | null;
  emoji: string | null;
  image: string | null;
  featured: boolean | null;
  available: boolean | null;
  calories: number | null;
  sodium_mg: number | null;
  caffeine_mg: number | null;
  options: DishOption[] | null;
  views: number | null;
}

export interface BlogPost {
  id: string;
  slug: string;
  title_ar: string;
  excerpt_ar: string | null;
  content_ar: string | null;
  cover_image: string | null;
  tags: string | null;
  status: string | null;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  views: number | null;
}

/** Minimal Database shape for the typed supabase-js client (read paths in use). */
export interface Database {
  public: {
    Tables: {
      restaurants: { Row: Restaurant; Insert: Partial<Restaurant>; Update: Partial<Restaurant>; Relationships: [] };
      menus: { Row: Menu; Insert: Partial<Menu>; Update: Partial<Menu>; Relationships: [] };
      dishes: { Row: Dish; Insert: Partial<Dish>; Update: Partial<Dish>; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

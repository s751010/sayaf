import "server-only";
import { createServerSupabase, getCurrentUser } from "@/lib/supabase/server";
import type { Dish, Menu, Restaurant, SurveyResponse } from "@/lib/types";
import { SURVEY_QUESTIONS } from "@/lib/survey";

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

/**
 * تقييمات زبائن المطعم. تُقرأ بجلسة التاجر لا بمفتاح anon — النسخة القديمة
 * كانت تقرأها بمفتاح الزائر، وسياسة RLS تمنع الزائر، فكانت اللوحة فارغة دائماً.
 */
export async function getMySurveyResponses(
  restaurantId: string
): Promise<SurveyResponse[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("survey_responses")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(500);
  return (data as SurveyResponse[]) ?? [];
}

export type SurveySummary = {
  responses: SurveyResponse[];
  count: number;
  overall: number;
  satisfaction: number;
  last7: number;
  perQuestion: { id: string; label: string; icon: string; avg: number | null; n: number }[];
  notes: SurveyResponse[];
};

/**
 * تجميع التقييمات. يعيش هنا لا في الصفحة لأنه يعتمد على الوقت الحالي، والوقت
 * قيمة غير نقية لا يجوز قراءتها أثناء التصيير.
 */
export async function getSurveySummary(restaurantId: string): Promise<SurveySummary> {
  const responses = await getMySurveyResponses(restaurantId);
  const count = responses.length;

  const empty: SurveySummary = {
    responses,
    count: 0,
    overall: 0,
    satisfaction: 0,
    last7: 0,
    perQuestion: [],
    notes: [],
  };
  if (count === 0) return empty;

  const overall =
    Math.round(
      (responses.reduce((sum, r) => sum + (r.avg_score ?? 0), 0) / count) * 10
    ) / 10;

  const perQuestion = SURVEY_QUESTIONS.map((q) => {
    const values = responses
      .map((r) => r.answers?.[q.id])
      .filter((v): v is number => typeof v === "number");
    const avg = values.length
      ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10
      : null;
    return { id: q.id, label: q.label, icon: q.icon as string, avg, n: values.length };
  });

  const promoters = responses.filter((r) => (r.avg_score ?? 0) >= 4.5).length;
  const weekAgo = Date.now() - 7 * 86_400_000;

  return {
    responses,
    count,
    overall,
    satisfaction: Math.round((promoters / count) * 100),
    last7: responses.filter((r) => new Date(r.created_at).getTime() >= weekAgo).length,
    perQuestion,
    notes: responses.filter((r) => r.note?.trim()),
  };
}

/** Total recorded menu views for the owner (RLS scopes rows to auth.uid()). */
export async function getMenuViews(): Promise<number> {
  const supabase = await createServerSupabase();
  if (!supabase) return 0;
  const { data } = await supabase.from("analytics").select("views");
  return ((data as { views: number | null }[]) ?? []).reduce(
    (s, r) => s + (r.views ?? 0),
    0
  );
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

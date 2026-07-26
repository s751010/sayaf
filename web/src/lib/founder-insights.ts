import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import { isFounder } from "@/lib/founder";

/**
 * بيانات لوحتَي «صحة النظام» و«سجل النشاط».
 *
 * كل الحسابات المعتمدة على الوقت تعيش هنا لا في الصفحات — قراءة الوقت أثناء
 * التصيير قيمة غير نقية (وهو ما يمنعه lint في React 19).
 *
 * الفرق عن النسخة القديمة: لوحة الصحة هناك كانت تُعلن «قاعدة البيانات متصلة»
 * و«بوابة الدفع مفعّلة» كقيم ثابتة مكتوبة يدوياً (`ok: true`) بلا أي فحص
 * فعلي — أي أنها تُطمئن دائماً حتى لو كان كل شيء معطّلاً. هنا كل بند يُشتقّ
 * من بيانات حقيقية، وما لا يمكن فحصه لا يُدّعى.
 */

export type HealthLevel = "ok" | "warn" | "bad";

export type HealthItem = {
  label: string;
  level: HealthLevel;
  detail: string;
};

export type ActivityEvent = {
  kind: "signup" | "payment" | "ticket" | "review";
  title: string;
  detail: string;
  at: string;
  /** «قبل ٣ ساعات» — يُحسب هنا لأن الوقت قيمة غير نقية لا تُقرأ أثناء التصيير. */
  ago: string;
};

export type FounderInsights = {
  health: HealthItem[];
  events: ActivityEvent[];
  /** أعداد سريعة تُعرض فوق سجل النشاط. */
  signups7: number;
  signups30: number;
  expiringSoon: number;
};

const DAY = 86_400_000;

export async function getFounderInsights(): Promise<FounderInsights | null> {
  if (!(await isFounder())) return null;
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const now = Date.now();

  const [
    { data: restaurants, error: restaurantsError },
    { data: subscriptions },
    { data: revenue },
    { data: tickets },
    { data: reviews },
    { data: dishes },
  ] = await Promise.all([
    supabase.from("restaurants").select("id, name, slug, created_at, user_id"),
    supabase.from("subscriptions").select("user_id, plan_id, active, end_date"),
    supabase.from("revenue_log").select("amount, plan_name, user_name, created_at"),
    supabase.from("support_tickets").select("subject, status, created_at"),
    supabase.from("survey_responses").select("avg_score, created_at"),
    supabase.from("dishes").select("id, price"),
  ]);

  const restaurantRows = (restaurants ?? []) as {
    id: string;
    name: string;
    slug: string | null;
    created_at: string;
    user_id: string | null;
  }[];
  const subRows = (subscriptions ?? []) as {
    user_id: string;
    plan_id: string | null;
    active: boolean | null;
    end_date: string | null;
  }[];
  const revenueRows = (revenue ?? []) as {
    amount: number | null;
    plan_name: string | null;
    user_name: string | null;
    created_at: string;
  }[];
  const ticketRows = (tickets ?? []) as {
    subject: string | null;
    status: string | null;
    created_at: string;
  }[];
  const reviewRows = (reviews ?? []) as { avg_score: number | null; created_at: string }[];
  const dishRows = (dishes ?? []) as { id: string; price: number | null }[];

  /* ── صحة النظام — كل بند مشتقّ من بيانات فعلية ──────────────────── */
  const activeSubs = subRows.filter(
    (s) => s.active && (!s.end_date || new Date(s.end_date).getTime() > now)
  );
  const activationRate = restaurantRows.length
    ? Math.round((activeSubs.length / restaurantRows.length) * 100)
    : 0;
  const expiringSoon = activeSubs.filter(
    (s) => s.end_date && new Date(s.end_date).getTime() - now < 7 * DAY
  ).length;
  const unanswered = ticketRows.filter((t) => t.status === "open").length;
  const noSlug = restaurantRows.filter((r) => !r.slug?.trim()).length;
  const pricelessDishes = dishRows.filter((d) => !(Number(d.price) > 0)).length;

  const health: HealthItem[] = [
    {
      label: "الاتصال بقاعدة البيانات",
      level: restaurantsError ? "bad" : "ok",
      detail: restaurantsError
        ? "فشل جلب البيانات — راجع حالة Supabase."
        : `تم جلب ${restaurantRows.length} مطعماً بنجاح.`,
    },
    {
      label: "معدّل التفعيل",
      level: activationRate >= 30 ? "ok" : activationRate > 0 ? "warn" : "bad",
      detail: `${activationRate}% من المطاعم لديها اشتراك ساري (${activeSubs.length} من ${restaurantRows.length}).`,
    },
    {
      label: "اشتراكات تنتهي خلال أسبوع",
      level: expiringSoon === 0 ? "ok" : expiringSoon <= 3 ? "warn" : "bad",
      detail:
        expiringSoon === 0
          ? "لا يوجد اشتراك على وشك الانتهاء."
          : `${expiringSoon} اشتراكاً يحتاج تواصلاً قبل الانتهاء.`,
    },
    {
      label: "تذاكر الدعم المفتوحة",
      level: unanswered === 0 ? "ok" : unanswered <= 3 ? "warn" : "bad",
      detail:
        unanswered === 0
          ? "لا توجد تذاكر تنتظر رداً."
          : `${unanswered} تذكرة بانتظار رد.`,
    },
    {
      label: "اكتمال بيانات المطاعم",
      level: noSlug === 0 ? "ok" : "warn",
      detail:
        noSlug === 0
          ? "كل المطاعم لديها رابط (slug) صالح."
          : `${noSlug} مطعماً بلا رابط — صفحته العامة لا تُفتح.`,
    },
    {
      label: "أصناف بلا سعر",
      level: pricelessDishes === 0 ? "ok" : "warn",
      detail:
        pricelessDishes === 0
          ? "كل الأصناف مسعّرة."
          : `${pricelessDishes} صنفاً بلا سعر — لا يمكن دفعها إلكترونياً.`,
    },
    {
      label: "تقييمات الزبائن",
      level: reviewRows.length > 0 ? "ok" : "warn",
      detail: reviewRows.length
        ? `${reviewRows.length} تقييماً مُستلَماً.`
        : "لم يصل أي تقييم بعد.",
    },
  ];

  /* ── سجل النشاط — دمج زمني لكل ما حدث ───────────────────────────── */
  const events: ActivityEvent[] = [];

  for (const r of restaurantRows) {
    if (!r.created_at) continue;
    events.push({
      kind: "signup",
      title: r.name || "مطعم جديد",
      detail: "سجّل في المنصّة",
      at: r.created_at,
      ago: "",
    });
  }
  for (const p of revenueRows) {
    if (!p.created_at || !(Number(p.amount) > 0)) continue;
    events.push({
      kind: "payment",
      title: p.user_name || "دفعة",
      detail: `دفع ${p.amount} ر.س — ${p.plan_name ?? ""}`.trim(),
      at: p.created_at,
      ago: "",
    });
  }
  for (const t of ticketRows) {
    if (!t.created_at) continue;
    events.push({
      kind: "ticket",
      title: t.subject || "تذكرة دعم",
      detail: t.status === "open" ? "بانتظار رد" : `الحالة: ${t.status ?? "—"}`,
      at: t.created_at,
      ago: "",
    });
  }
  for (const rv of reviewRows) {
    if (!rv.created_at) continue;
    events.push({
      kind: "review",
      title: "تقييم زبون",
      detail: `متوسط ${rv.avg_score ?? "—"} من ٥`,
      at: rv.created_at,
      ago: "",
    });
  }

  events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const recent = events.slice(0, 60).map((e) => ({ ...e, ago: relativeTime(e.at, now) }));

  return {
    health,
    events: recent,
    signups7: restaurantRows.filter(
      (r) => now - new Date(r.created_at).getTime() <= 7 * DAY
    ).length,
    signups30: restaurantRows.filter(
      (r) => now - new Date(r.created_at).getTime() <= 30 * DAY
    ).length,
    expiringSoon,
  };
}

/** «قبل ٣ ساعات» — يُحسب مرة واحدة على الخادم مع بقية البيانات. */
function relativeTime(iso: string, now: number): string {
  const diff = (now - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "الآن";
  if (diff < 3600) return `قبل ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `قبل ${Math.floor(diff / 3600)} ساعة`;
  if (diff < 604800) return `قبل ${Math.floor(diff / 86400)} يوم`;
  return new Date(iso).toLocaleDateString("ar-SA");
}

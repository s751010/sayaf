/**
 * لوحتي v2 — الحساب كلّه هنا، دوالّ خالصة بلا شبكة (`founder-insights.test.ts`).
 *
 * الصفحات تجلب وتعرض؛ وهذا الملفّ يحوّل الصفوف إلى ما يُقرأ: سلاسل يومية
 * بتوقيت الرياض، وشرائح تسويق برسائل واتساب جاهزة، وحالة كل اشتراك، وملخّص
 * الطلبات، وخيط «آخر ما حصل».
 */
import type {
  AuditEntry,
  FounderMerchant,
  PlatformOrder,
  RevenueRow,
  Subscription,
  TicketLite,
} from "./founder";

const DAY = 86_400_000;

/* ── الأيام بتوقيت الرياض ─────────────────────────────────────────── */

const riyadhDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Riyadh",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** مفتاح اليوم `YYYY-MM-DD` بتوقيت الرياض. */
export function dayKey(d: Date | string | number): string {
  return riyadhDay.format(new Date(d));
}

/** آخر `days` يوماً بالترتيب، آخرها اليوم. */
export function lastDays(days: number, now = Date.now()): string[] {
  return Array.from({ length: days }, (_, i) => dayKey(now - (days - 1 - i) * DAY));
}

export interface DayPoint {
  day: string;
  n: number;
}

/** عدّ الأحداث يوماً يوماً — كل يومٍ في النافذة له نقطة ولو صفراً. */
export function dailyCounts(timestamps: string[], days: number, now = Date.now()): DayPoint[] {
  const keys = lastDays(days, now);
  const counts = new Map(keys.map((k) => [k, 0]));
  for (const t of timestamps) {
    const k = dayKey(t);
    if (counts.has(k)) counts.set(k, counts.get(k)! + 1);
  }
  return keys.map((day) => ({ day, n: counts.get(day)! }));
}

/**
 * جمع قيمٍ مؤرَّخة بيوم جاهز (`analytics.date` يومٌ بتوقيت الرياض أصلاً —
 * `track_view` يكتبه كذلك) — فلا يُعاد تحويله.
 */
export function dailySums(rows: { date: string; value: number }[], days: number, now = Date.now()): DayPoint[] {
  const keys = lastDays(days, now);
  const sums = new Map(keys.map((k) => [k, 0]));
  for (const r of rows) {
    if (sums.has(r.date)) sums.set(r.date, sums.get(r.date)! + (Number(r.value) || 0));
  }
  return keys.map((day) => ({ day, n: sums.get(day)! }));
}

export function total(points: DayPoint[]): number {
  return points.reduce((s, p) => s + p.n, 0);
}

/** نسبة التغيّر بين نصفَي السلسلة — `null` إن كان الأوّل صفراً (لا معنى للنسبة). */
export function trend(points: DayPoint[]): number | null {
  const half = Math.floor(points.length / 2);
  const a = total(points.slice(0, half));
  const b = total(points.slice(points.length - half));
  if (a === 0) return null;
  return Math.round(((b - a) / a) * 100);
}

/* ── واتساب ───────────────────────────────────────────────────────── */

/**
 * رقم سعودي بصيغة `9665XXXXXXXX` كما يطلبها `wa.me` — أو `null`.
 * يقبل: 05… · 5… · 9665… · +9665… · 009665… ومعها مسافات وشرطات.
 */
export function normalizeSaPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = raw.replace(/[^\d٠-٩]/g, "").replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c)));
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("966")) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  return /^5\d{8}$/.test(d) ? `966${d}` : null;
}

export function waLink(phone: string, text: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/* ── شرائح التسويق ────────────────────────────────────────────────── */

export type SegmentId = "trial-ending" | "no-dishes" | "quiet" | "expired" | "paid";

export interface Segment {
  id: SegmentId;
  label: string;
  why: string;
  message: (name: string) => string;
}

/**
 * الشرائح بترتيب الإلحاح. والرسائل بلهجة سعودية قصيرة، بلا وعودٍ لا يملكها
 * المنتج (قائمة الصدق في `company/README.md`): لا «الأفضل» ولا أرقام مخترعة.
 */
export const SEGMENTS: Segment[] = [
  {
    id: "trial-ending",
    label: "تجربتهم تخلص قريب",
    why: "تجربة تنتهي خلال ٥ أيام — أنسب وقت للتذكير",
    message: (n) =>
      `هلا والله 👋 معك كلاود منيو. تجربة منيو «${n}» تخلص خلال أيام — إذا ودّك يكمل شغّال لزبائنك اشترك من لوحتك، وإذا عندك أي سؤال أنا موجود.`,
  },
  {
    id: "no-dishes",
    label: "سجّلوا وما أضافوا أطباق",
    why: "أكبر تسرّب في القمع — يحتاجون يد",
    message: (n) =>
      `هلا 👋 معك كلاود منيو. شفت إنك أنشأت «${n}» وما أضفت الأصناف للحين — تقدر تصوّر منيوك الورقي ونقرأه لك، أو أرسل لي الأصناف هنا وأساعدك ترتّبها.`,
  },
  {
    id: "quiet",
    label: "منيو جاهز وما أحد فتحه",
    why: "فيه أطباق، وصفر فتحات آخر ٣٠ يوم — غالباً الكود ما انطبع",
    message: (n) =>
      `هلا 👋 معك كلاود منيو. منيو «${n}» جاهز 👌 بس ما أحد فتحه للحين — ودّك أساعدك تطبع كود QR وتحطه على الطاولات؟`,
  },
  {
    id: "expired",
    label: "انتهى اشتراكهم",
    why: "كان عندهم اشتراك وانتهى — منيوهم ممكن يطفي",
    message: (n) =>
      `هلا 👋 معك كلاود منيو. اشتراك «${n}» انتهى — إذا تبي ترجّعه شغّال لزبائنك جدّده من لوحتك، وإذا فيه شي ما عجبك قل لي.`,
  },
  {
    id: "paid",
    label: "المشتركين",
    why: "عملاؤك الدافعين — اسألهم عن رأيهم",
    message: (n) =>
      `هلا 👋 معك كلاود منيو. شكراً إنك معنا في «${n}» 🙏 ودّي أسمع رأيك: وش أكثر شي تبيه نضيفه أو نحسّنه؟`,
  },
];

export function segmentOf(m: FounderMerchant, now = Date.now()): SegmentId | null {
  const end = m.sub_end ? new Date(m.sub_end).getTime() : null;
  if (m.sub_active && m.sub_plan === "trial" && end !== null && end - now <= 5 * DAY) return "trial-ending";
  if (m.dishes_count === 0) return "no-dishes";
  if (!m.sub_active && end !== null && end < now) return "expired";
  if (m.views_30d === 0) return "quiet";
  if (m.sub_active && m.sub_plan !== "trial") return "paid";
  return null;
}

export function groupSegments(merchants: FounderMerchant[], now = Date.now()): Record<SegmentId, FounderMerchant[]> {
  const out: Record<SegmentId, FounderMerchant[]> = {
    "trial-ending": [],
    "no-dishes": [],
    quiet: [],
    expired: [],
    paid: [],
  };
  for (const m of merchants) {
    const s = segmentOf(m, now);
    if (s) out[s].push(m);
  }
  return out;
}

/* ── الاشتراكات ───────────────────────────────────────────────────── */

export type SubState = "active" | "trial" | "expiring" | "expired" | "cancelled";

export function subState(s: Subscription, now = Date.now()): SubState {
  if (s.cancelled_at || s.active === false) return "cancelled";
  const end = new Date(s.end_date).getTime();
  if (end < now) return "expired";
  if (end - now <= 7 * DAY) return "expiring";
  return s.plan_id === "trial" ? "trial" : "active";
}

export const SUB_STATE_LABEL: Record<SubState, string> = {
  active: "نشط",
  trial: "تجربة",
  expiring: "ينتهي خلال أسبوع",
  expired: "منتهٍ",
  cancelled: "ملغى",
};

export function daysLeft(endIso: string, now = Date.now()): number {
  return Math.ceil((new Date(endIso).getTime() - now) / DAY);
}

/* ── الطلبات ──────────────────────────────────────────────────────── */

/**
 * الحالات التي تعني أن الطلب دُفع (`OrderStatus` في `data.ts`): كلّ ما بعد
 * `pending_payment` عدا الإلغاء. و`paid_at` يحسمها إن وُجد.
 */
const PAID = new Set(["new", "preparing", "ready", "picked_up"]);

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending_payment: "ينتظر الدفع",
  new: "جديد",
  preparing: "يتجهّز",
  ready: "جاهز",
  picked_up: "استُلم",
  cancelled: "ملغى",
};

export interface OrdersSummary {
  today: number;
  week: number;
  month: number;
  paidMonth: number;
  gmvMonth: number;
  avgTicket: number | null;
  byStatus: { status: string; n: number }[];
  byRestaurant: { restaurant_id: string; n: number; gmv: number }[];
}

export function summarizeOrders(orders: PlatformOrder[], now = Date.now()): OrdersSummary {
  const today = dayKey(now);
  let t = 0,
    w = 0,
    m = 0,
    paid = 0,
    gmv = 0;
  const status = new Map<string, number>();
  const rest = new Map<string, { n: number; gmv: number }>();
  for (const o of orders) {
    const at = new Date(o.created_at).getTime();
    const age = now - at;
    if (age > 30 * DAY) continue;
    m++;
    if (age <= 7 * DAY) w++;
    if (dayKey(at) === today) t++;
    status.set(o.status, (status.get(o.status) ?? 0) + 1);
    const isPaid = o.status !== "cancelled" && (PAID.has(o.status) || !!o.paid_at);
    const r = rest.get(o.restaurant_id) ?? { n: 0, gmv: 0 };
    r.n++;
    if (isPaid) {
      paid++;
      gmv += Number(o.total) || 0;
      r.gmv += Number(o.total) || 0;
    }
    rest.set(o.restaurant_id, r);
  }
  return {
    today: t,
    week: w,
    month: m,
    paidMonth: paid,
    gmvMonth: Math.round(gmv * 100) / 100,
    avgTicket: paid ? Math.round((gmv / paid) * 100) / 100 : null,
    byStatus: [...status].map(([s, n]) => ({ status: s, n })).sort((a, b) => b.n - a.n),
    byRestaurant: [...rest]
      .map(([restaurant_id, v]) => ({ restaurant_id, ...v }))
      .sort((a, b) => b.gmv - a.gmv || b.n - a.n),
  };
}

/* ── آخر ما حصل ───────────────────────────────────────────────────── */

export type ActivityKind = "signup" | "subscription" | "payment" | "ticket" | "audit" | "order";

export interface Activity {
  at: string;
  kind: ActivityKind;
  text: string;
  to?: string;
}

/** خيطٌ واحد من مصادر متفرّقة، الأحدث أوّلاً. */
export function activityFeed(
  src: {
    merchants?: FounderMerchant[] | null;
    subs?: Subscription[] | null;
    revenue?: RevenueRow[] | null;
    tickets?: TicketLite[] | null;
    audit?: AuditEntry[] | null;
    orders?: PlatformOrder[] | null;
  },
  limit = 12
): Activity[] {
  const byOwner = new Map((src.merchants ?? []).map((m) => [m.owner_id, m]));
  const byId = new Map((src.merchants ?? []).map((m) => [m.id, m]));
  const out: Activity[] = [];

  for (const m of src.merchants ?? [])
    out.push({ at: m.created_at, kind: "signup", text: `سجّل مطعم «${m.name}»`, to: `/founder/merchants/${m.id}` });

  for (const s of src.subs ?? []) {
    if (!s.created_at) continue;
    const m = s.user_id ? byOwner.get(s.user_id) : undefined;
    const who = m ? `«${m.name}»` : "تاجر";
    out.push({
      at: s.created_at,
      kind: "subscription",
      text: s.plan_id === "trial" ? `${who} بدأ التجربة` : `${who} اشترك`,
      to: m ? `/founder/merchants/${m.id}` : "/founder/subscriptions",
    });
  }

  for (const r of src.revenue ?? [])
    out.push({
      at: r.created_at,
      kind: "payment",
      text: `دفعة ${Number(r.amount ?? 0)} ر.س${r.user_name ? ` من ${r.user_name}` : ""}`,
      to: "/founder/money",
    });

  for (const t of src.tickets ?? [])
    out.push({
      at: t.created_at,
      kind: "ticket",
      text: `تذكرة: ${t.subject ?? "بلا موضوع"}${t.restaurant_name ? ` — ${t.restaurant_name}` : ""}`,
      to: "/founder/support",
    });

  for (const a of src.audit ?? [])
    out.push({ at: a.at, kind: "audit", text: `أنت: ${a.action}${a.target_name ? ` — ${a.target_name}` : ""}` });

  for (const o of src.orders ?? []) {
    const m = byId.get(o.restaurant_id);
    out.push({
      at: o.created_at,
      kind: "order",
      text: `طلب جديد${m ? ` في «${m.name}»` : ""}${o.total ? ` — ${Number(o.total)} ر.س` : ""}`,
      to: "/founder/orders",
    });
  }

  return out.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

/** «قبل ٣ ساعات» — للخيط. */
export function ago(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return "الحين";
  const m = Math.round(s / 60);
  if (m < 60) return `قبل ${m} د`;
  const h = Math.round(m / 60);
  if (h < 24) return `قبل ${h} س`;
  const d = Math.round(h / 24);
  return d === 1 ? "أمس" : `قبل ${d} يوم`;
}

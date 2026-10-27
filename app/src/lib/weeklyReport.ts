/**
 * التقرير الأسبوعي — «كيف كان منيوي هذا الأسبوع مقارنةً بالذي قبله؟».
 *
 * دوالّ خالصة بلا شبكة ولا ساعة: كل ما يتغيّر (الآن · الصفوف · الأطباق ·
 * الطلبات) يُمرَّر، فالحدود والفروق تُفحص بأرقامٍ ثابتة (`weekly-report.test.ts`).
 *
 * ═══ ما يُقرأ — وما لا يُقرأ ═══
 *
 * لا جدول ولا دالّة جديدة: كل رقم هنا من بيانات يقرؤها التاجر اليوم بسياساته.
 *  · `analytics` (صفوف `track_view` بالساعة): مشاهدات المنيو (`dish_id` فارغ)
 *    وفتح الأطباق (`dish_id` قائم) — **مؤرَّخة**، فهي وحدها تجيب «هذا الأسبوع».
 *  · `dishes.views` عدّادٌ تراكمي منذ إنشاء الطبق بلا تاريخ — لا يقول شيئاً عن
 *    أسبوع بعينه، فلا يدخل هنا (الرئيسية تعرضه «الأكثر مشاهدة» على حاله).
 *  · `popular_dishes` لا تُرجع إلا معرّفاتٍ بثلاثة طلبات فأكثر بلا أعداد ولا
 *    تاريخ — شارةٌ للزبون لا مقياس.
 *  · `orders` (الحالة والمبلغ ووقت الإنشاء) — لمن ربط بوّابة، وبالأعمدة نفسها
 *    التي يقرؤها `listOrders`.
 *
 * ═══ الأسبوع: الأحد ⇐ السبت، بتوقيت الرياض ═══
 *
 * أسبوع العمل في المملكة يبدأ الأحد، و«أيام الأسبوع» في التحليلات مرسومة من
 * الأحد (`getUTCDay`). والأهمّ لمطعم: الأحد بدايةً يُبقي ليلة الخميس والجمعة
 * والسبت — ذروة المطاعم — **في أسبوعٍ واحد**؛ ولو بدأ بالسبت لانشطرت عطلة
 * نهاية الأسبوع بين تقريرين.
 * ⚠️ و`DAYS` في `lib/hours.ts` يبدأ بالسبت — ذاك ترتيب عرض محرّر الساعات، لا
 * حدّ أسبوع، فلا يُستعار هنا.
 *
 * والرياض UTC+3 ثابتة بلا توقيت صيفي، فالإزاحة رقمٌ لا جدول مناطق — كما في
 * `riyadhNow` (`lib/hours.ts`) و`riyadhDayKey` (`Analytics.tsx`). و`analytics.date`
 * و`hour` مكتوبان بتوقيت الرياض أصلاً (`track_view`)، فلا يُحوَّلان ثانيةً.
 *
 * ═══ «هذا الأسبوع» يُقارَن بمثله لا بأسبوعٍ كامل ═══
 *
 * يوم الثلاثاء ظهراً مضى من الأسبوع يومان ونصف؛ ومقارنته بسبعة أيام كاملة
 * تُظهر «▼ ٦٥٪» لكل مطعم كل أسبوع — رقمٌ كاذب يُحبط. فالأسبوع الجاري يُقارَن
 * بالمدّة نفسها من الأسبوع الماضي: من الأحد حتى اليوم نفسه **والساعة نفسها**.
 */
import type { AnalyticsRow, Dish } from "./types";

const DAY = 86_400_000;
const RIYADH = 3 * 3_600_000;

export const DOW_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"] as const;

/* ── التقويم ──────────────────────────────────────────────────────────── */

/** لحظةٌ ما ⇐ يومها وساعتها بتوقيت الرياض. */
export function riyadhParts(ms: number): { iso: string; dow: number; hour: number } {
  const d = new Date(ms + RIYADH);
  return { iso: d.toISOString().slice(0, 10), dow: d.getUTCDay(), hour: d.getUTCHours() };
}

/** `YYYY-MM-DD` مُزاحاً بأيام — حساب تقويم لا ساعة، فلا يعبر حدّ يوم خطأً. */
export function shiftIso(iso: string, days: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);
}

export function dowOf(iso: string): number {
  return new Date(`${iso}T00:00:00Z`).getUTCDay();
}

/** أحد الأسبوع الذي يقع فيه اليوم. */
export function weekStartOf(iso: string): string {
  return shiftIso(iso, -dowOf(iso));
}

/** منتصف ليل الرياض ليومٍ ما كلحظة UTC — حدّ استعلام `orders.created_at`. */
export function riyadhMidnightUtc(iso: string): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) - RIYADH).toISOString();
}

/** «٢٢/١٠» بأرقام لاتينية — كتسميات «المشاهدات اليومية» (الدرس ١٣). */
export function dayLabel(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${Number(d)}/${Number(m)}`;
}

/* ── النوافذ ─────────────────────────────────────────────────────────── */

export type WeekMode = "current" | "last";

export type WeekWindow = {
  /** الأحد — أوّل يوم. */
  start: string;
  /** آخر يوم داخل النافذة (شاملاً). */
  end: string;
  /**
   * يُقطع اليوم الأخير عند هذه الساعة (شاملة) — لمقارنة «حتى الآن» بمثلها.
   * `null` = اليوم الأخير كاملاً.
   */
  cutHour: number | null;
};

/**
 * نافذتا التقرير: الأسبوع المعروض والذي يُقارَن به.
 *
 * `current` = من الأحد حتى الآن، مقابل المدّة نفسها قبل سبعة أيام.
 * `last`    = الأسبوع المنصرم كاملاً، مقابل الذي قبله كاملاً.
 */
export function weekWindows(
  nowMs: number,
  mode: WeekMode
): { week: WeekWindow; prev: WeekWindow; inProgress: boolean } {
  const today = riyadhParts(nowMs);
  const thisSunday = weekStartOf(today.iso);
  if (mode === "current") {
    return {
      // ما بعد الآن لا بيانات له أصلاً، فلا حاجة لقطع اليوم الجاري.
      week: { start: thisSunday, end: today.iso, cutHour: null },
      prev: { start: shiftIso(thisSunday, -7), end: shiftIso(today.iso, -7), cutHour: today.hour },
      inProgress: true,
    };
  }
  const start = shiftIso(thisSunday, -7);
  return {
    week: { start, end: shiftIso(start, 6), cutHour: null },
    prev: { start: shiftIso(start, -7), end: shiftIso(start, -1), cutHour: null },
    inProgress: false,
  };
}

/**
 * هل يقع (يوم، ساعة) في النافذة؟ والساعة الفارغة (صفوف قديمة بلا ساعة)
 * تُحسب في يومها كاملاً — لا نعرف متى وقعت، وإسقاطها أسوأ من عدّها.
 */
export function inWindow(w: WeekWindow, iso: string | null, hour: number | null): boolean {
  if (!iso || iso < w.start || iso > w.end) return false;
  if (w.cutHour !== null && iso === w.end && hour !== null && hour > w.cutHour) return false;
  return true;
}

/**
 * كم من النافذة كان المطعم موجوداً فيه؟
 * `none` = أُنشئ بعدها · `partial` = أُنشئ في أثنائها · `full` = قبلها.
 */
export type Coverage = "none" | "partial" | "full";

export function coverageOf(w: WeekWindow, createdIso: string | null): Coverage {
  if (!createdIso || createdIso <= w.start) return "full";
  if (createdIso > w.end) return "none";
  return "partial";
}

/* ── الفرق ───────────────────────────────────────────────────────────── */

/**
 * الفرق بين أسبوعين — **بلا قسمة على صفر بحال**.
 *
 * `first` لا أسبوع قبله يُقارَن به (المطعم أحدث منه) · `none` صفرٌ وصفر ·
 * `new` من لا شيء إلى شيء (لا نسبة لها) · `same` تغيّرٌ يُقرّب إلى ٠٪ ·
 * `up`/`down` بنسبةٍ صحيحة موجبة.
 */
export type Delta =
  | { kind: "first" }
  | { kind: "none" }
  | { kind: "new" }
  | { kind: "same" }
  | { kind: "up" | "down"; pct: number };

export function deltaOf(now: number, prev: number, prevCoverage: Coverage = "full"): Delta {
  if (prevCoverage === "none") return { kind: "first" };
  if (prev <= 0) return now > 0 ? { kind: "new" } : { kind: "none" };
  const pct = Math.round(((now - prev) / prev) * 100);
  if (pct === 0) return { kind: "same" };
  return pct > 0 ? { kind: "up", pct } : { kind: "down", pct: -pct };
}

/* ── التقرير ─────────────────────────────────────────────────────────── */

/** ما يلزم من الطلب — أعمدة `listOrders` نفسها. */
export type OrderLite = { status: string; total: number | string | null; created_at: string };

export type Metric = { now: number; prev: number; delta: Delta };

export type WeeklyReport = {
  mode: WeekMode;
  week: WeekWindow;
  prev: WeekWindow;
  inProgress: boolean;
  /** هل كان المطعم موجوداً طوال الأسبوع المعروض والذي قبله؟ */
  weekCoverage: Coverage;
  prevCoverage: Coverage;
  /** يوم إنشاء المطعم بتوقيت الرياض — لجملة «أسبوعك الأوّل بدأ …». */
  createdIso: string | null;
  views: Metric;
  dishOpens: Metric;
  /** نسبة من فتح طبقاً ممّن فتح المنيو — `null` بلا مشاهدة (لا قسمة على صفر). */
  openRate: number | null;
  /** الأحد ⇐ السبت دائماً سبعة؛ وما بعد اليوم في الأسبوع الجاري `future`. */
  byDay: { iso: string; dow: number; views: number; future: boolean }[];
  busiestDay: { iso: string; dow: number; views: number } | null;
  busiestHour: { hour: number; views: number } | null;
  topDishes: { dish: Dish; opens: number; prev: number }[];
  /** أطباقٌ لم يفتحها أحد — فارغة حين لم يفتح المنيوَ أحد (كلّها صفر إذن، وليس ذلك خبراً عن الأطباق). */
  zeroDishes: Dish[];
  /** `null` = لا بوّابة دفع ⇒ لا طلبات تُقرأ (لا «صفر طلب»). */
  orders: { count: Metric; revenue: Metric } | null;
  /** لا مشاهدة ولا فتح ولا طلب في الأسبوع المعروض. */
  empty: boolean;
};

/** كم صنفاً في «الأكثر فتحاً». */
export const TOP_DISHES = 5;

function sumViews(rows: AnalyticsRow[], w: WeekWindow, dish: boolean): number {
  let s = 0;
  for (const r of rows) {
    if (Boolean(r.dish_id) !== dish) continue;
    if (inWindow(w, r.date, r.hour)) s += r.views ?? 0;
  }
  return s;
}

function orderTotals(orders: OrderLite[], w: WeekWindow): { count: number; revenue: number } {
  let count = 0;
  let revenue = 0;
  for (const o of orders) {
    // كـ`getOrdersToday`: الملغى ليس طلباً، وما لم يُدفع بعد مستبعدٌ من الاستعلام.
    if (o.status === "cancelled" || o.status === "pending_payment") continue;
    const ms = Date.parse(o.created_at);
    if (!Number.isFinite(ms)) continue;
    const p = riyadhParts(ms);
    if (!inWindow(w, p.iso, p.hour)) continue;
    count++;
    const t = Number(o.total ?? 0);
    if (Number.isFinite(t)) revenue += t;
  }
  // الهللات: جمع الأعشار العائمة يعطي ١٢٫٣٠٠٠٠٠١ — يُقرَّب إلى منزلتين.
  return { count, revenue: Math.round(revenue * 100) / 100 };
}

export function buildWeeklyReport(input: {
  nowMs: number;
  mode: WeekMode;
  rows: AnalyticsRow[];
  dishes: Dish[];
  /** `null` = المطعم بلا بوّابة دفع — قسم الطلبات لا يُرسم. */
  orders: OrderLite[] | null;
  /** `restaurants.created_at` — لأوّل أسبوعٍ ناقص. */
  restaurantCreatedAt?: string | null;
}): WeeklyReport {
  const { nowMs, mode, rows, dishes, orders } = input;
  const { week, prev, inProgress } = weekWindows(nowMs, mode);

  const createdMs = input.restaurantCreatedAt ? Date.parse(input.restaurantCreatedAt) : NaN;
  const createdIso = Number.isFinite(createdMs) ? riyadhParts(createdMs).iso : null;
  const weekCoverage = coverageOf(week, createdIso);
  const prevCoverage = coverageOf(prev, createdIso);

  const vNow = sumViews(rows, week, false);
  const vPrev = sumViews(rows, prev, false);
  const oNow = sumViews(rows, week, true);
  const oPrev = sumViews(rows, prev, true);

  // الأيام السبعة.
  const perDay = new Map<string, number>();
  const hours = new Array<number>(24).fill(0);
  for (const r of rows) {
    if (r.dish_id || !inWindow(week, r.date, r.hour)) continue;
    const v = r.views ?? 0;
    perDay.set(r.date!, (perDay.get(r.date!) ?? 0) + v);
    if (r.hour != null && Number.isInteger(r.hour) && r.hour >= 0 && r.hour <= 23) hours[r.hour] += v;
  }
  const byDay = Array.from({ length: 7 }, (_, i) => {
    const iso = shiftIso(week.start, i);
    return { iso, dow: dowOf(iso), views: perDay.get(iso) ?? 0, future: iso > week.end };
  });

  // الأعلى، وعند التعادل الأسبق — ثابتٌ لا يقفز بين فتحتين.
  let busiestDay: WeeklyReport["busiestDay"] = null;
  for (const d of byDay) {
    if (d.views > 0 && (!busiestDay || d.views > busiestDay.views)) {
      busiestDay = { iso: d.iso, dow: d.dow, views: d.views };
    }
  }
  let busiestHour: WeeklyReport["busiestHour"] = null;
  hours.forEach((v, h) => {
    if (v > 0 && (!busiestHour || v > busiestHour.views)) busiestHour = { hour: h, views: v };
  });

  // فتح كل طبق في الأسبوعين.
  const hitsNow = new Map<string, number>();
  const hitsPrev = new Map<string, number>();
  for (const r of rows) {
    if (!r.dish_id) continue;
    if (inWindow(week, r.date, r.hour)) hitsNow.set(r.dish_id, (hitsNow.get(r.dish_id) ?? 0) + (r.views ?? 0));
    else if (inWindow(prev, r.date, r.hour)) hitsPrev.set(r.dish_id, (hitsPrev.get(r.dish_id) ?? 0) + (r.views ?? 0));
  }
  // الطبق المحذوف لا يظهر: لا اسم له نعرضه، ولا فعل للتاجر عليه.
  const topDishes = dishes
    .map((dish) => ({ dish, opens: hitsNow.get(dish.id) ?? 0, prev: hitsPrev.get(dish.id) ?? 0 }))
    .filter((d) => d.opens > 0)
    .sort((a, b) => b.opens - a.opens)
    .slice(0, TOP_DISHES);

  // طبقٌ أُضيف بعد نهاية الأسبوع لم يكن في المنيو ليُفتح.
  const zeroDishes =
    vNow > 0
      ? dishes.filter((d) => {
          if ((hitsNow.get(d.id) ?? 0) > 0) return false;
          const c = Date.parse(d.created_at);
          return !Number.isFinite(c) || riyadhParts(c).iso <= week.end;
        })
      : [];

  let ordersOut: WeeklyReport["orders"] = null;
  let ordersNow = 0;
  if (orders) {
    const a = orderTotals(orders, week);
    const b = orderTotals(orders, prev);
    ordersNow = a.count;
    ordersOut = {
      count: { now: a.count, prev: b.count, delta: deltaOf(a.count, b.count, prevCoverage) },
      revenue: { now: a.revenue, prev: b.revenue, delta: deltaOf(a.revenue, b.revenue, prevCoverage) },
    };
  }

  return {
    mode,
    week,
    prev,
    inProgress,
    weekCoverage,
    prevCoverage,
    createdIso,
    views: { now: vNow, prev: vPrev, delta: deltaOf(vNow, vPrev, prevCoverage) },
    dishOpens: { now: oNow, prev: oPrev, delta: deltaOf(oNow, oPrev, prevCoverage) },
    openRate: vNow > 0 ? Math.round((oNow / vNow) * 100) : null,
    byDay,
    busiestDay,
    busiestHour,
    topDishes,
    zeroDishes,
    orders: ordersOut,
    empty: vNow === 0 && oNow === 0 && ordersNow === 0,
  };
}

/**
 * أقدم لحظةٍ يحتاجها التقرير بوضعيه — حدّ استعلام الطلبات.
 * أحد الأسبوع الذي قبل الماضي: نافذة المقارنة لوضع «الأسبوع الماضي».
 */
export function reportSince(nowMs: number): string {
  return riyadhMidnightUtc(weekWindows(nowMs, "last").prev.start);
}

/**
 * التقرير الأسبوعي — `lib/weeklyReport.ts`.
 *
 * التقويم كلّه بأرقامٍ ثابتة: ٢٥ أكتوبر ٢٠٢٦ أحد، والرياض UTC+3. فالحدّ الذي
 * يخطئ فيه حسابٌ بتوقيت الجهاز (منتصف ليل الرياض = ٢١:٠٠ UTC من اليوم السابق)
 * مثبَّتٌ هنا لا متروكٌ لساعة العدّاء.
 */
import { describe, expect, it } from "vitest";
import {
  DOW_AR,
  buildWeeklyReport,
  coverageOf,
  dayLabel,
  deltaOf,
  inWindow,
  reportSince,
  riyadhMidnightUtc,
  riyadhParts,
  shiftIso,
  weekStartOf,
  weekWindows,
  type OrderLite,
} from "@/lib/weeklyReport";
import type { AnalyticsRow, Dish } from "@/lib/types";

/** الثلاثاء ٢٧/١٠ الساعة ١٤:٠٠ بتوقيت الرياض. */
const TUE_2PM = Date.parse("2026-10-27T11:00:00Z");

const row = (o: Partial<AnalyticsRow>): AnalyticsRow => ({
  id: Math.random().toString(36),
  menu_id: "m",
  user_id: "u",
  date: "2026-10-26",
  hour: 13,
  views: 1,
  dish_id: null,
  table_no: null,
  lang: "ar",
  ...o,
});
const dish = (o: Partial<Dish>) =>
  ({ id: "d", name: "صنف", image: "x.webp", created_at: "2026-09-01T00:00:00Z", ...o }) as Dish;
const order = (o: Partial<OrderLite>): OrderLite => ({ status: "picked_up", total: 10, created_at: "2026-10-26T10:00:00Z", ...o });

describe("التقويم بتوقيت الرياض", () => {
  it("منتصف ليل الرياض يقع ٢١:٠٠ UTC من اليوم السابق — السبت UTC أحدٌ في الرياض", () => {
    expect(riyadhParts(Date.parse("2026-10-24T21:30:00Z"))).toEqual({ iso: "2026-10-25", dow: 0, hour: 0 });
    expect(riyadhParts(Date.parse("2026-10-24T20:59:00Z"))).toEqual({ iso: "2026-10-24", dow: 6, hour: 23 });
    expect(riyadhMidnightUtc("2026-10-25")).toBe("2026-10-24T21:00:00.000Z");
  });

  it("الأسبوع يبدأ الأحد — كأيام الأسبوع في التحليلات", () => {
    expect(DOW_AR[0]).toBe("الأحد");
    expect(weekStartOf("2026-10-25")).toBe("2026-10-25"); // الأحد نفسه
    expect(weekStartOf("2026-10-31")).toBe("2026-10-25"); // السبت آخره
    expect(weekStartOf("2026-11-01")).toBe("2026-11-01"); // أحدٌ جديد
  });

  it("يعبر الشهر والسنة بلا انزلاق يوم", () => {
    expect(shiftIso("2026-01-01", -7)).toBe("2025-12-25");
    expect(weekStartOf("2026-01-01")).toBe("2025-12-28");
    expect(dayLabel("2026-03-05")).toBe("5/3");
  });
});

describe("النافذتان", () => {
  it("«هذا الأسبوع» من الأحد حتى الآن، مقابل المدّة نفسها حتى الساعة نفسها", () => {
    const w = weekWindows(TUE_2PM, "current");
    expect(w.week).toEqual({ start: "2026-10-25", end: "2026-10-27", cutHour: null });
    expect(w.prev).toEqual({ start: "2026-10-18", end: "2026-10-20", cutHour: 14 });
    expect(w.inProgress).toBe(true);
  });

  it("«الأسبوع الماضي» كاملاً، مقابل الذي قبله كاملاً", () => {
    const w = weekWindows(TUE_2PM, "last");
    expect(w.week).toEqual({ start: "2026-10-18", end: "2026-10-24", cutHour: null });
    expect(w.prev).toEqual({ start: "2026-10-11", end: "2026-10-17", cutHour: null });
  });

  it("أوّل دقيقة من الأحد: الأسبوع الجاري يومٌ واحد، والماضي ما انتهى للتوّ", () => {
    const sun = Date.parse("2026-10-24T21:05:00Z");
    expect(weekWindows(sun, "current").week).toEqual({ start: "2026-10-25", end: "2026-10-25", cutHour: null });
    expect(weekWindows(sun, "current").prev.cutHour).toBe(0);
    expect(weekWindows(sun, "last").week.end).toBe("2026-10-24");
  });

  it("قطع الساعة على اليوم الأخير وحده — والساعة الفارغة تُعدّ في يومها", () => {
    const { prev } = weekWindows(TUE_2PM, "current");
    expect(inWindow(prev, "2026-10-20", 14)).toBe(true);
    expect(inWindow(prev, "2026-10-20", 15)).toBe(false);
    expect(inWindow(prev, "2026-10-19", 23)).toBe(true);
    expect(inWindow(prev, "2026-10-20", null)).toBe(true);
    expect(inWindow(prev, "2026-10-21", 1)).toBe(false);
    expect(inWindow(prev, null, 1)).toBe(false);
  });

  it("أقدم حدٍّ للطلبات: أحد الأسبوع الذي قبل الماضي، منتصف ليل الرياض", () => {
    expect(reportSince(TUE_2PM)).toBe("2026-10-10T21:00:00.000Z");
  });
});

describe("الفرق — بلا قسمة على صفر", () => {
  it.each([
    [0, 0, { kind: "none" }],
    [5, 0, { kind: "new" }],
    [10, 10, { kind: "same" }],
    [1001, 1000, { kind: "same" }], // ٠٫١٪ تُقرَّب صفراً — لا «▲ ٠٪»
    [15, 10, { kind: "up", pct: 50 }],
    [5, 10, { kind: "down", pct: 50 }],
    [0, 7, { kind: "down", pct: 100 }],
  ])("%i مقابل %i", (now, prev, want) => {
    expect(deltaOf(now, prev)).toEqual(want);
  });

  it("لا مقارنة بأسبوعٍ لم يكن المطعم فيه", () => {
    expect(deltaOf(12, 0, "none")).toEqual({ kind: "first" });
  });

  it("التغطية من يوم الإنشاء", () => {
    const w = { start: "2026-10-18", end: "2026-10-24", cutHour: null };
    expect(coverageOf(w, null)).toBe("full");
    expect(coverageOf(w, "2026-10-18")).toBe("full");
    expect(coverageOf(w, "2026-10-19")).toBe("partial");
    expect(coverageOf(w, "2026-10-25")).toBe("none");
  });
});

describe("buildWeeklyReport", () => {
  const base = { nowMs: TUE_2PM, mode: "current" as const, orders: null, restaurantCreatedAt: "2026-09-01T00:00:00Z" };

  it("أسبوعٌ فارغ: أصفارٌ صادقة — لا نسبة ولا ذروة ولا «أطباق ميتة»", () => {
    const r = buildWeeklyReport({ ...base, rows: [], dishes: [dish({ id: "a" }), dish({ id: "b" })] });
    expect(r.empty).toBe(true);
    expect(r.views).toEqual({ now: 0, prev: 0, delta: { kind: "none" } });
    expect(r.openRate).toBeNull();
    expect(r.busiestDay).toBeNull();
    expect(r.busiestHour).toBeNull();
    // لم يفتح المنيوَ أحد، فصفرُ كل طبق ليس خبراً عن الطبق.
    expect(r.zeroDishes).toEqual([]);
    expect(r.byDay).toHaveLength(7);
    expect(r.byDay.map((d) => d.future)).toEqual([false, false, false, true, true, true, true]);
  });

  it("الأسبوع الجاري يُقارَن بمثله: ما بعد الساعة نفسها من الأسبوع الماضي لا يُحسب", () => {
    const rows = [
      row({ date: "2026-10-26", hour: 20, views: 10 }), // هذا الأسبوع
      row({ date: "2026-10-19", hour: 20, views: 4 }), // الاثنين الماضي — داخل
      row({ date: "2026-10-20", hour: 9, views: 1 }), // الثلاثاء الماضي قبل ١٤ — داخل
      row({ date: "2026-10-20", hour: 21, views: 50 }), // بعد ١٤ — خارج
      row({ date: "2026-10-23", hour: 21, views: 99 }), // الجمعة الماضية — خارج
    ];
    const r = buildWeeklyReport({ ...base, rows, dishes: [] });
    expect(r.views).toEqual({ now: 10, prev: 5, delta: { kind: "up", pct: 100 } });

    // والأسبوع الماضي كاملاً يعدّها كلّها.
    const last = buildWeeklyReport({ ...base, mode: "last", rows, dishes: [] });
    expect(last.views.now).toBe(4 + 1 + 50 + 99);
  });

  it("أوّل أسبوعٍ ناقص: لا مقارنة، ويُعرف من أيّ يوم بدأ", () => {
    const rows = [row({ date: "2026-10-27", hour: 10, views: 3 })];
    const r = buildWeeklyReport({ ...base, rows, dishes: [], restaurantCreatedAt: "2026-10-26T18:00:00Z" });
    expect(r.createdIso).toBe("2026-10-26");
    expect(r.weekCoverage).toBe("partial");
    expect(r.prevCoverage).toBe("none");
    expect(r.views.delta).toEqual({ kind: "first" });
  });

  it("المطعم أُنشئ ٢١:٣٠ UTC السبت = الأحد في الرياض: أسبوعه كامل", () => {
    const r = buildWeeklyReport({ ...base, rows: [], dishes: [], restaurantCreatedAt: "2026-10-24T21:30:00Z" });
    expect(r.weekCoverage).toBe("full");
    expect(r.prevCoverage).toBe("none");
  });

  it("الأسبوع السابق الناقص يُقارَن ويُعلَّم ناقصاً", () => {
    const r = buildWeeklyReport({
      ...base,
      mode: "last",
      rows: [row({ date: "2026-10-16", views: 2 }), row({ date: "2026-10-22", views: 6 })],
      dishes: [],
      restaurantCreatedAt: "2026-10-15T09:00:00Z",
    });
    expect(r.prevCoverage).toBe("partial");
    expect(r.weekCoverage).toBe("full");
    expect(r.views).toEqual({ now: 6, prev: 2, delta: { kind: "up", pct: 200 } });
  });

  it("أنشط يوم وساعة — والتعادل للأسبق", () => {
    const rows = [
      row({ date: "2026-10-25", hour: 21, views: 4 }),
      row({ date: "2026-10-26", hour: 13, views: 3 }),
      row({ date: "2026-10-26", hour: 21, views: 1 }),
      row({ date: "2026-10-26", hour: null, views: 9 }), // بلا ساعة: يومه نعم، ساعته لا
    ];
    const r = buildWeeklyReport({ ...base, rows, dishes: [] });
    expect(r.busiestDay).toEqual({ iso: "2026-10-26", dow: 1, views: 13 });
    expect(r.busiestHour).toEqual({ hour: 21, views: 5 });

    const tie = buildWeeklyReport({
      ...base,
      rows: [row({ date: "2026-10-25", views: 2 }), row({ date: "2026-10-26", views: 2 })],
      dishes: [],
    });
    expect(tie.busiestDay?.iso).toBe("2026-10-25");
  });

  it("الأكثر فتحاً: مرتّبة، بفتح الأسبوع السابق، بلا طبقٍ محذوف، خمسةٌ على الأكثر", () => {
    const dishes = ["a", "b", "c", "d", "e", "f", "g"].map((id) => dish({ id, name: id }));
    const rows = [
      row({ views: 20 }),
      ...dishes.map((d, i) => row({ dish_id: d.id, views: i + 1 })),
      row({ dish_id: "gone", views: 100 }),
      row({ dish_id: "g", date: "2026-10-19", views: 4 }),
    ];
    const r = buildWeeklyReport({ ...base, rows, dishes });
    expect(r.topDishes.map((t) => t.dish.id)).toEqual(["g", "f", "e", "d", "c"]);
    expect(r.topDishes[0]).toMatchObject({ opens: 7, prev: 4 });
    expect(r.dishOpens.now).toBe(1 + 2 + 3 + 4 + 5 + 6 + 7 + 100);
    expect(r.openRate).toBe(Math.round((128 / 20) * 100));
  });

  it("بلا فتح: الطبق الذي لم يُفتح — لا الذي أُضيف بعد نهاية الأسبوع", () => {
    const dishes = [
      dish({ id: "a" }),
      dish({ id: "b" }),
      dish({ id: "late", created_at: "2026-10-26T10:00:00Z" }),
    ];
    const rows = [row({ date: "2026-10-20", views: 5 }), row({ date: "2026-10-20", dish_id: "a" })];
    const r = buildWeeklyReport({ ...base, mode: "last", rows, dishes });
    expect(r.zeroDishes.map((d) => d.id)).toEqual(["b"]);
  });

  it("الطلبات بتوقيت الرياض: الملغى خارج، والمبلغ بلا كسور عائمة", () => {
    const orders = [
      order({ created_at: "2026-10-24T21:30:00Z", total: 0.1 }), // الأحد ٠٠:٣٠ — هذا الأسبوع
      order({ created_at: "2026-10-26T10:00:00Z", total: "0.2" }),
      order({ created_at: "2026-10-26T10:00:00Z", status: "cancelled", total: 500 }),
      order({ created_at: "2026-10-24T20:30:00Z", total: 30 }), // السبت ٢٣:٣٠ — الأسبوع الماضي، خارج المقارنة الجارية
      order({ created_at: "2026-10-19T08:00:00Z", total: 40 }), // الاثنين الماضي — داخل
    ];
    const r = buildWeeklyReport({ ...base, rows: [], dishes: [], orders });
    expect(r.orders?.count).toEqual({ now: 2, prev: 1, delta: { kind: "up", pct: 100 } });
    expect(r.orders?.revenue.now).toBe(0.3);
    expect(r.orders?.revenue.prev).toBe(40);
    // طلبٌ بلا مشاهدة يكفي ليكون الأسبوع غير فارغ.
    expect(r.empty).toBe(false);
  });

  it("بلا بوّابة: `null` لا «صفر طلب»", () => {
    expect(buildWeeklyReport({ ...base, rows: [], dishes: [] }).orders).toBeNull();
    expect(buildWeeklyReport({ ...base, rows: [], dishes: [], orders: [] }).orders?.count.delta).toEqual({ kind: "none" });
  });
});

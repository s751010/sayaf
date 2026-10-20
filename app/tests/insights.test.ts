/**
 * «ماذا أفعل الآن؟» — `lib/insights.ts`.
 *
 * ثلاثة أعطال وُجدت أثناء كتابة مقالات المدونة (كل وصفٍ فيها تُحقِّق منه في
 * الشيفرة)، ولم يكن لهذا الملفّ فحصٌ واحد:
 *
 *  · «لغة العرض» تُعدّ من مشاهدات المنيو المسجَّلة **قبل** أن يبدّل الزبون
 *    لغته — فالإنجليزية صفرٌ دائماً، والتوصية بها مستحيلة الظهور.
 *  · زرّ «فعّل الولاء» يقود إلى الإعدادات، والولاء في صفحته.
 *  · توصيةٌ تَعِد بـ«شارة التوافق مع هيئة الغذاء والدواء» لا وجود لها.
 */
import { describe, expect, it } from "vitest";
import { buildInsights, languageSplit } from "@/lib/insights";
import type { AnalyticsRow, Dish, Restaurant } from "@/lib/types";

const row = (o: Partial<AnalyticsRow>): AnalyticsRow => ({
  id: Math.random().toString(36),
  menu_id: "m",
  user_id: "u",
  date: "2026-10-20",
  hour: 13,
  views: 1,
  dish_id: null,
  table_no: null,
  lang: "ar",
  ...o,
});
const dish = (o: Partial<Dish>) => ({ id: "d", name: "صنف", name_en: null, image: "x.webp", calories: 100, sodium_mg: 100, ...o }) as Dish;
const restaurant = (o: Partial<Restaurant> = {}) =>
  ({ id: "r", loyalty_enabled: true, english_enabled: false, google_review_url: "https://g", ...o }) as Restaurant;

/** مشاهدات كافية (فوق `MIN_VIEWS`) — كلّها `ar` كما تُسجَّل فعلاً عند التحميل. */
const views = Array.from({ length: 30 }, () => row({}));

describe("languageSplit", () => {
  it("تُعدّ من فتح الأطباق لا من مشاهدة المنيو", () => {
    const rows = [...views, row({ dish_id: "d1", lang: "en", views: 4 }), row({ dish_id: "d2", lang: "ar", views: 6 })];
    expect(languageSplit(rows)).toEqual({ ar: 6, en: 4 });
  });

  it("تحترم نطاق التاريخ", () => {
    const rows = [row({ dish_id: "d1", lang: "en", date: "2026-09-01" }), row({ dish_id: "d1", lang: "en" })];
    expect(languageSplit(rows, new Set(["2026-10-20"]))).toEqual({ ar: 0, en: 1 });
  });
});

describe("buildInsights", () => {
  it("«فعّل الولاء» يقود إلى صفحة الولاء", () => {
    const out = buildInsights([dish({})], views, restaurant({ loyalty_enabled: false }));
    expect(out.find((i) => i.id === "loyalty-off")?.action?.to).toBe("/dashboard/loyalty");
  });

  it("لا توصية تَعِد بشارة من الهيئة", () => {
    const dishes = [dish({ id: "a", calories: null }), dish({ id: "b", sodium_mg: null }), dish({ id: "c" })];
    const sfda = buildInsights(dishes, views, restaurant()).find((i) => i.id === "sfda");
    expect(sfda).toBeDefined();
    expect(sfda!.text).not.toMatch(/شارة/);
    expect(sfda!.action?.to).toBe("/dashboard/nutrition");
  });

  it("الترجمة الناقصة تظهر حين يقرأ زبائن بالإنجليزية", () => {
    const rows = [...views, row({ dish_id: "k", lang: "en", views: 5 })];
    const out = buildInsights([dish({ id: "k", name: "كبسة" })], rows, restaurant({ english_enabled: true }));
    const gap = out.find((i) => i.id === "english-gaps");
    expect(gap?.text).toContain("«كبسة»");
  });

  it("ولا تظهر حين الإنجليزية مطفأة — المبدّل لا يظهر للزبون أصلاً", () => {
    const rows = [...views, row({ dish_id: "k", lang: "en", views: 5 })];
    const out = buildInsights([dish({ id: "k" })], rows, restaurant({ english_enabled: false }));
    expect(out.some((i) => i.id.startsWith("english"))).toBe(false);
  });

  it("ولا حين الصنف المفتوح مترجَم", () => {
    const rows = [...views, row({ dish_id: "k", lang: "en", views: 5 })];
    const out = buildInsights([dish({ id: "k", name_en: "Kabsa" })], rows, restaurant({ english_enabled: true }));
    expect(out.some((i) => i.id === "english-gaps")).toBe(false);
  });
});

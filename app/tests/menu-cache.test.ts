/**
 * آخر منيو ناجح على جهاز الزبون (`lib/menuCache.ts`).
 *
 * ═══ ما يحرسه ═══
 *
 * - المفتاح `cm2_menu_cache_<slug>` من `K` لا نصّاً مكتوباً.
 * - الحفظ ثم القراءة يعيدان المنيو نفسه، وأطباق القوائم المطفأة لا تُخزَّن.
 * - نافذة العرض تُطبَّق **عند العرض** لا عند الحفظ: نسخة الصباح لا تعرض قائمة
 *   الفطور مساءً — والترشيح نفسه للحيّ والمحفوظ (`visibleMenu`).
 * - نسخةٌ تالفة أو بشكلٍ قديم تُقرأ `null` (فتبقى حالة الفشل) لا انهياراً.
 * - تخزينٌ محجوب أو ممتلئ لا يرمي: الحفظ يسقط بصمت والقراءة `null`.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearMenuCache,
  menuCacheKey,
  parseMenuCache,
  readMenuCache,
  saveMenuCache,
  visibleMenu,
} from "@/lib/menuCache";
import { K } from "@/lib/storage";
import type { Dish, Menu, Restaurant } from "@/lib/types";

const restaurant = { id: "r1", name: "مقهى الفحص", slug: "e2e-cafe" } as Restaurant;
const menu = (id: string, extra: Partial<Menu> = {}) => ({ id, name: id, active: true, ...extra }) as Menu;
const dish = (id: string, menu_id: string | null) => ({ id, name: id, menu_id, price: 10 }) as Dish;

/** ‏٠٨:٠٠ و١٨:٠٠ بتوقيت الرياض (+٣). */
const MORNING = new Date("2026-11-07T05:00:00Z");
const EVENING = new Date("2026-11-07T15:00:00Z");

function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, String(v)),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("المفتاح", () => {
  it("من `K` ويُلحق به الـslug", () => {
    expect(K.MENU_CACHE).toBe("cm2_menu_cache");
    expect(menuCacheKey("e2e-cafe")).toBe("cm2_menu_cache_e2e-cafe");
    expect(menuCacheKey("مشراق-0e94")).toBe("cm2_menu_cache_مشراق-0e94");
  });
});

describe("visibleMenu — الشرط نفسه للحيّ والمحفوظ", () => {
  it("يستبعد الطبق اليتيم وطبق القائمة غير المعروضة، ويحفظ الترتيب", () => {
    const { menus, dishes } = visibleMenu(
      [menu("m1")],
      [dish("b", "m1"), dish("orphan", null), dish("other", "m2"), dish("a", "m1")]
    );
    expect(menus.map((m) => m.id)).toEqual(["m1"]);
    expect(dishes.map((d) => d.id)).toEqual(["b", "a"]);
  });

  it("نافذة العرض تُحسب بوقت العرض", () => {
    const active = [
      menu("breakfast", { window_from: "06:00", window_to: "11:00" }),
      menu("dinner", { window_from: "17:00", window_to: "23:00" }),
    ];
    const all = [dish("eggs", "breakfast"), dish("steak", "dinner")];
    expect(visibleMenu(active, all, MORNING).dishes.map((d) => d.id)).toEqual(["eggs"]);
    expect(visibleMenu(active, all, EVENING).dishes.map((d) => d.id)).toEqual(["steak"]);
  });

  it("إن أسقطت النافذة كل القوائم تُعرض كلّها — لا منيو فارغ", () => {
    const active = [menu("breakfast", { window_from: "06:00", window_to: "11:00" })];
    const { menus, dishes } = visibleMenu(active, [dish("eggs", "breakfast")], EVENING);
    expect(menus.map((m) => m.id)).toEqual(["breakfast"]);
    expect(dishes.map((d) => d.id)).toEqual(["eggs"]);
  });
});

describe("الحفظ والقراءة", () => {
  it("يعيد ما حُفظ، بلا أطباق القوائم المطفأة، ومعه وقت الحفظ", () => {
    vi.stubGlobal("window", { localStorage: memoryStorage() });
    saveMenuCache(
      "e2e-cafe",
      { restaurant, menus: [menu("m1")], dishes: [dish("latte", "m1"), dish("hidden", "off"), dish("x", null)] },
      1_700_000_000_000
    );
    const got = readMenuCache("e2e-cafe");
    expect(got?.savedAt).toBe(1_700_000_000_000);
    expect(got?.restaurant.name).toBe("مقهى الفحص");
    expect(got?.menus.map((m) => m.id)).toEqual(["m1"]);
    expect(got?.dishes.map((d) => d.id)).toEqual(["latte"]);
    // لكل مطعم نسخته.
    expect(readMenuCache("another")).toBeNull();
  });

  it("المسح يُسقط النسخة", () => {
    vi.stubGlobal("window", { localStorage: memoryStorage() });
    saveMenuCache("e2e-cafe", { restaurant, menus: [menu("m1")], dishes: [] });
    expect(readMenuCache("e2e-cafe")).not.toBeNull();
    clearMenuCache("e2e-cafe");
    expect(readMenuCache("e2e-cafe")).toBeNull();
  });

  it("تخزينٌ يرمي (وضع الخصوصية · ممتلئ) لا يُسقط شيئاً", () => {
    const boom = () => {
      throw new Error("QuotaExceededError");
    };
    vi.stubGlobal("window", {
      localStorage: { getItem: boom, setItem: boom, removeItem: boom } as unknown as Storage,
    });
    expect(() => saveMenuCache("e2e-cafe", { restaurant, menus: [], dishes: [] })).not.toThrow();
    expect(readMenuCache("e2e-cafe")).toBeNull();
    expect(() => clearMenuCache("e2e-cafe")).not.toThrow();
  });

  it("بلا window أصلاً (بيئة بلا متصفّح) لا يرمي", () => {
    expect(() => saveMenuCache("e2e-cafe", { restaurant, menus: [], dishes: [] })).not.toThrow();
    expect(readMenuCache("e2e-cafe")).toBeNull();
  });

  it("slug فارغ لا يُحفظ له شيء", () => {
    const store = memoryStorage();
    vi.stubGlobal("window", { localStorage: store });
    saveMenuCache("", { restaurant, menus: [], dishes: [] });
    expect(store.length).toBe(0);
    expect(readMenuCache("")).toBeNull();
  });
});

describe("parseMenuCache — التالف `null` لا انهيار", () => {
  const good = { v: 1, savedAt: 1, restaurant, menus: [menu("m1")], dishes: [dish("a", "m1")] };

  it("السليم يُقرأ", () => {
    expect(parseMenuCache(JSON.stringify(good))?.dishes).toHaveLength(1);
  });

  it.each([
    ["فارغ", null],
    ["ليس JSON", "{oops"],
    ["null", "null"],
    ["نسخة شكلٍ أخرى", JSON.stringify({ ...good, v: 2 })],
    ["بلا وقت", JSON.stringify({ ...good, savedAt: "أمس" })],
    ["بلا مطعم", JSON.stringify({ ...good, restaurant: null })],
    ["مطعم بلا اسم", JSON.stringify({ ...good, restaurant: { id: "r1" } })],
    ["قوائم ليست مصفوفة", JSON.stringify({ ...good, menus: {} })],
    ["أطباق ليست مصفوفة", JSON.stringify({ ...good, dishes: "x" })],
  ])("%s ⇒ null", (_, raw) => {
    expect(parseMenuCache(raw)).toBeNull();
  });

  it("عنصرٌ تالف داخل المصفوفة يُسقَط وحده", () => {
    const raw = JSON.stringify({ ...good, menus: [null, menu("m1"), 3], dishes: [dish("a", "m1"), "x", null] });
    const got = parseMenuCache(raw);
    expect(got?.menus.map((m) => m.id)).toEqual(["m1"]);
    expect(got?.dishes.map((d) => d.id)).toEqual(["a"]);
  });
});

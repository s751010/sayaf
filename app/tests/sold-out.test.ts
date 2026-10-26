/**
 * «نفد اليوم» — الطبق النافد يُرى ولا يُطلب.
 *
 * ═══ ما يحرسه ═══
 *
 * كان النافد يُرشَّح من الاستعلام العامّ فيختفي. والآن يصل، فكلّ موضعٍ كان
 * يفترض «ما وصل متاح» صار خطراً: السلّة تعدّ الطبق الغائب عن خريطتها «لم يعد
 * متاحاً» — فلو أخذت خريطة كلّ الأطباق لأرسلت طبقاً نافداً. هذا الملفّ يثبّت:
 *
 * ١. الحكم (`isSoldOut`): `false` وحدها نافدة، و`null` صفٌّ قديم **متاح**.
 * ٢. الاستعلام: بلا مرشّح توفّر، وبأعمدة صريحة لا `select=*` (القاعدة و).
 * ٣. البطاقة في التخطيطات الأربعة: الشارة، والصورة الباهتة، وبلا «الأكثر طلباً».
 * ٤. الترتيب وغلاف القسم والسلّة ونافذة الطبق في `MenuPage`.
 * ٥. لكلّ طابعٍ بخامةٍ شكلُ شارته في `menu-skins.css`.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { isSoldOut, orderableById, soldOutLabel, soldOutLast } from "@/lib/soldOut";
import { ALL_THEMES, getTheme, type DishLayout } from "@/lib/themes";
import type { Dish } from "@/lib/types";

const calls: string[] = [];
vi.mock("@/lib/api", () => ({
  rest: async (path: string) => {
    calls.push(path);
    return [];
  },
  restCount: async () => 0,
  callFunction: async () => ({}),
}));

const { getRestaurantDishes } = await import("@/lib/data");
const { DishCard } = await import("@/components/menu/DishCard");
const { sectionCover } = await import("@/components/menu/SectionHeading");

function dish(id: string, extra: Partial<Dish> = {}): Dish {
  return {
    id,
    menu_id: "m",
    restaurant_id: "r",
    user_id: "u",
    name: `طبق ${id}`,
    name_en: `Dish ${id}`,
    description: "وصف",
    description_en: null,
    price: 20,
    category: "رئيسية",
    emoji: "🍽️",
    image: null,
    featured: false,
    available: true,
    sort_order: 0,
    views: 0,
    created_at: "2026-01-01T00:00:00Z",
    calories: 300,
    sodium_mg: null,
    caffeine_mg: null,
    allergens: ["milk"],
    options: null,
    burn_minutes: null,
    is_high_sodium: null,
    sfda_compliant: false,
    ...extra,
  };
}

describe("الحكم: `false` الصريحة وحدها نافدة", () => {
  it("false ⇒ نافد", () => expect(isSoldOut({ available: false })).toBe(true));
  it("true ⇒ متاح", () => expect(isSoldOut({ available: true })).toBe(false));
  // صفوفٌ قبل إضافة العمود — واللوحة تقرؤها `?? true`. إخفاؤها يُطفئ أصنافاً عاملة.
  it("null ⇒ متاح (صفٌّ قديم)", () => expect(isSoldOut({ available: null })).toBe(false));
  it("غياب الطبق ⇒ ليس نافداً", () => expect(isSoldOut(undefined)).toBe(false));
  it("النصّ واحد بالعربية والإنجليزية", () => {
    expect(soldOutLabel(false)).toBe("نفد اليوم");
    expect(soldOutLabel(true)).toBe("Sold out today");
  });
});

describe("الترتيب: النافد إلى آخر قسمه، والباقي بترتيب التاجر", () => {
  const list = [
    dish("a"),
    dish("b", { available: false }),
    dish("c", { available: null }),
    dish("d", { available: false }),
    dish("e"),
  ];

  it("المتاح بترتيبه ثم النافد بترتيبه", () => {
    expect(soldOutLast(list).map((d) => d.id)).toEqual(["a", "c", "e", "b", "d"]);
  });
  it("لا يمسّ المصفوفة الأصلية", () => {
    soldOutLast(list);
    expect(list.map((d) => d.id)).toEqual(["a", "b", "c", "d", "e"]);
  });
  it("بلا نافد ⇒ الترتيب نفسه", () => {
    const all = [dish("x"), dish("y"), dish("z")];
    expect(soldOutLast(all).map((d) => d.id)).toEqual(["x", "y", "z"]);
  });
});

describe("السلّة تأخذ خريطة ما يُطلب وحده", () => {
  const map = orderableById([dish("a"), dish("b", { available: false }), dish("c", { available: null })]);
  it("النافد غائب ⇒ `CartReview` تعرضه «لم يعد متاحاً» وتحجب الإرسال", () => {
    expect(map.has("b")).toBe(false);
  });
  it("المتاح والقديم حاضران", () => {
    expect([...map.keys()]).toEqual(["a", "c"]);
  });
});

describe("الاستعلام العامّ", () => {
  it("بلا مرشّح توفّر، وبأعمدة صريحة تحمل `available`", async () => {
    calls.length = 0;
    await getRestaurantDishes("rid");
    expect(calls).toHaveLength(1);
    const path = calls[0];
    expect(path).not.toMatch(/available\.(is|eq)/);
    // القاعدة (و): لا `select=*` على استعلامٍ عامّ أبداً.
    expect(path).not.toContain("select=*");
    const cols = /select=([^&]+)/.exec(path)?.[1].split(",") ?? [];
    expect(cols).toContain("available");
    expect(path).toContain("restaurant_id=eq.rid");
  });
});

describe("بطاقة الطبق في التخطيطات الأربعة", () => {
  // الرسم على «الخادم» (بلا DOM): `MetaRow` تقيس بـ`useLayoutEffect` فيحذّر React
  // أنه لا يعمل هنا — وهذا متوقَّع، فيُكتم **هذا التحذير وحده** وما عداه يمرّ.
  const original = console.error;
  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
      if (String(args[0]).includes("useLayoutEffect does nothing on the server")) return;
      original(...args);
    });
  });
  afterAll(() => vi.restoreAllMocks());
  const LAYOUTS: DishLayout[] = ["grid", "list", "showcase", "deck"];
  const base = getTheme("dark-gold").design;
  const render = (d: Dish, layout: DishLayout, opts: { popular?: boolean; en?: boolean } = {}) =>
    renderToStaticMarkup(
      createElement(DishCard, {
        dish: d,
        en: !!opts.en,
        design: { ...base, layout },
        popular: !!opts.popular,
        onOpen: () => {},
      })
    );

  it.each(LAYOUTS)("%s: النافد يحمل الشارة وعلامة الجذر", (layout) => {
    const html = render(dish("x", { available: false, image: "https://example.com/a.jpg" }), layout);
    expect(html).toContain("نفد اليوم");
    expect(html).toContain("m-soldout");
    expect(html).toContain("data-soldout=\"\"");
  });

  it.each(LAYOUTS)("%s: المتاح والقديم بلا شارة", (layout) => {
    for (const d of [dish("x"), dish("y", { available: null })]) {
      const html = render(d, layout);
      expect(html).not.toContain("نفد اليوم");
      expect(html).not.toContain("data-soldout");
    }
  });

  it.each(LAYOUTS)("%s: «الأكثر طلباً» لا تعلو طبقاً نافداً", (layout) => {
    expect(render(dish("x", { available: false }), layout, { popular: true })).not.toContain("الأكثر طلباً");
    // وتبقى للمتاح — الفحص يثبت أنه وجد ما يفحصه.
    expect(render(dish("x"), layout, { popular: true })).toContain("الأكثر طلباً");
  });

  it("بالإنجليزية", () => {
    expect(render(dish("x", { available: false }), "grid", { en: true })).toContain("Sold out today");
  });

  it("الشارة فوق الصورة في الشبكة، وفي سطر التفاصيل في القائمة", () => {
    expect(render(dish("x", { available: false }), "grid")).toMatch(/data-soldout-tag="" data-over=""/);
    expect(render(dish("x", { available: false }), "list")).not.toContain("data-over");
  });
});

describe("غلاف القسم من المتاح وحده", () => {
  it("المميّز النافد لا يصير الغلاف", () => {
    const cover = sectionCover(
      [
        dish("a", { available: false, featured: true, image: "https://example.com/out.jpg" }),
        dish("b", { image: "https://example.com/in.jpg" }),
      ],
      false
    );
    expect(cover?.src).toBe("https://example.com/in.jpg");
  });
  it("كلّها نافدة ⇒ بلا غلاف", () => {
    expect(sectionCover([dish("a", { available: false, image: "https://example.com/out.jpg" })], false)).toBeNull();
  });
});

describe("`MenuPage`: السلّة ونافذة الطبق وطبق اليوم", () => {
  const src = readFileSync(fileURLToPath(new URL("../src/pages/MenuPage.tsx", import.meta.url)), "utf8");

  it("`CartReview` تأخذ خريطة ما يُطلب لا كلّ الأطباق", () => {
    const review = src.slice(src.indexOf("<CartReview"), src.indexOf("/>", src.indexOf("<CartReview")));
    expect(review).toContain("dishById={orderable}");
  });
  it("نافذة الطبق النافد بلا سلّة", () => {
    expect(src).toMatch(/cart=\{cartOn && ordersOpen && !isSoldOut\(openDish\) \? cart : null\}/);
  });
  it("زرّ الإضافة بشرطٍ واحد يستثني النافد", () => {
    expect(src).toMatch(/const canAdd = \(d: Dish\) =>[\s\S]{0,120}!isSoldOut\(d\)/);
    expect(src).toContain("{canAdd(d) && (");
    expect(src).toContain("addSlot={canAdd(d)}");
  });
  it("«طبق اليوم» لا يكون نافداً، والنافد إلى آخر قسمه", () => {
    expect(src).toContain("d.featured && !isSoldOut(d)");
    expect(src).toContain("soldOutLast(list)");
  });
});

describe("لكلّ طابعٍ شارته في `menu-skins.css`", () => {
  const css = readFileSync(fileURLToPath(new URL("../src/styles/menu-skins.css", import.meta.url)), "utf8");
  const skins = [...new Set(ALL_THEMES.map((t) => t.design.skin))].filter((s) => s !== "store");

  it("الأساس والصورة الباهتة معرّفان", () => {
    expect(css).toMatch(/\n\.m-soldout \{/);
    expect(css).toMatch(/\[data-soldout\] \.m-img \{[^}]*opacity/);
  });
  it.each(skins)("`.m-skin-%s .m-soldout` معرّفة", (skin) => {
    expect(css).toContain(`.m-skin-${skin} .m-soldout`);
  });
  it("لا تُبهَت البطاقة كلّها — الاسم والسعر بتباينهما الكامل", () => {
    expect(css).not.toMatch(/\[data-soldout\]\s*\{[^}]*opacity/);
  });
});

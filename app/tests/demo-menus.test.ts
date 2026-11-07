/**
 * منيو تجريبي لكل شريحة — صفحة الكافيه لا تعرض منيو مطعم ستيك.
 */
import { describe, expect, it } from "vitest";
import { DEMO_KINDS, demoData, demoKindForSuits, isDemoKind } from "@/lib/demoMenus";
import { ALL_THEMES } from "@/lib/themes";
import { SEGMENTS } from "@/lib/segments";
import { getTheme, splitThemeId } from "@/lib/themes";
import { burnMinutes, isHighSodium } from "@/lib/nutrition";
import { parseOptions } from "@/lib/options";

describe("demoMenus", () => {
  it("كل شريحة تفتح منيواً موجوداً، والمنيوهات مختلفة", () => {
    const names = new Set<string>();
    for (const seg of SEGMENTS) {
      expect(isDemoKind(seg.demo), seg.slug).toBe(true);
      names.add(demoData(seg.demo).restaurant.name);
    }
    expect(names.size).toBe(SEGMENTS.length);
    expect(demoData(SEGMENTS.find((s) => s.slug === "specialty-coffee")!.demo).restaurant.name).not.toBe("مطعم الديوان");
  });

  it("المجهول وغير المذكور يسقطان إلى «الديوان» — `/demo` والهبوط و`e2e/smoke.spec.ts`", () => {
    expect(demoData(null).restaurant.name).toBe("مطعم الديوان");
    expect(demoData("royal").restaurant.name).toBe("مطعم الديوان");
    const desserts = demoData(null).dishes.filter((d) => d.category === "الحلويات").map((d) => d.name);
    expect(desserts).toEqual(["كنافة بالقشطة", "تمر مع جبن قشقوان"]);
  });

  for (const kind of DEMO_KINDS) {
    it(`«${kind}»: طابعٌ حقيقي، ومعرّفات فريدة، وأعمدةٌ محسوبة بصيغ القاعدة، وإضافات تُقرأ`, () => {
      const { restaurant, menus, dishes } = demoData(kind);
      expect(getTheme(menus[0].theme).id).toBe(splitThemeId(menus[0].theme).base);
      expect(new Set(dishes.map((d) => d.id)).size).toBe(dishes.length);
      for (const d of dishes) {
        expect(d.restaurant_id).toBe(restaurant.id);
        expect(d.menu_id).toBe(menus[0].id);
        expect(d.burn_minutes).toBe(burnMinutes(d.calories));
        if (d.sodium_mg != null) expect(d.is_high_sodium).toBe(isHighSodium(d.sodium_mg));
        if (d.options) expect(parseOptions(d.options).length).toBeGreaterThan(0);
      }
      // كل قسمٍ في الترتيب له صنفٌ واحد على الأقل — لا عنوان فوق فراغ.
      for (const c of JSON.parse(restaurant.category_order ?? "[]") as string[]) {
        expect(dishes.some((d) => d.category === c), `${kind}: ${c}`).toBe(true);
      }
    });
  }

  it("منيو الكافيه: الكافيين على كل مشروب — هو ما تَعِد به صفحته", () => {
    const { dishes } = demoData("cafe");
    const drinks = dishes.filter((d) => ["إسبريسو وحليب", "تقطير", "باردة"].includes(d.category ?? ""));
    expect(drinks.length).toBeGreaterThan(4);
    for (const d of drinks) expect(d.caffeine_mg, d.name).not.toBeNull();
    expect(dishes.some((d) => d.available === false)).toBe(true);
  });

  it.each([
    // ٠٧/١١: محلّ القهوة السعودية والإسبريسو بار — الكافيين على كلّ مشروب قهوة.
    ["qahwa", ["القهوة السعودية"]],
    ["espresso", ["إسبريسو", "بالحليب", "باردة"]],
    // ٠٧/١١: كشك الكرك وبيت الشاي — والأعشاب بلا كافيين صفرٌ مكتوب لا خانةٌ فارغة.
    ["karak", ["الكرك", "شاي وأعشاب"]],
    ["teahouse", ["الشاي"]],
  ] as const)("منيو «%s»: الكافيين على كلّ مشروب قهوةٍ أو شاي، وصنفٌ نافد", (kind, cats) => {
    const { dishes } = demoData(kind);
    const coffee = dishes.filter((d) => (cats as readonly string[]).includes(d.category ?? ""));
    expect(coffee.length).toBeGreaterThan(3);
    for (const d of coffee) expect(d.caffeine_mg, d.name).not.toBeNull();
    expect(dishes.some((d) => d.available === false)).toBe(true);
  });

  it("منيو البرجر: الوجبة أرخص من أجزائها، وسعراتها وصوديومها مجموع أجزائها", () => {
    const { dishes } = demoData("burger");
    const by = (id: string) => dishes.find((d) => d.id === id)!;
    for (const [combo, burger] of [["b5", "b1"], ["b6", "b2"]] as const) {
      const parts = [by(burger), by("b9"), by("b12")];
      expect(by(combo).price).toBeLessThan(parts.reduce((s, d) => s + (d.price ?? 0), 0));
      expect(by(combo).calories).toBe(parts.reduce((s, d) => s + (d.calories ?? 0), 0));
      expect(by(combo).sodium_mg).toBe(parts.reduce((s, d) => s + (d.sodium_mg ?? 0), 0));
    }
    // وصنفٌ نافد يُري الزبون «نفد اليوم» بشكل الطابع.
    expect(dishes.some((d) => d.available === false)).toBe(true);
  });

  it.each([
    // [الوجبة، أجزاؤها]: الصينيّة أربعٌ من كلّ فطيرة، وصحن الحارة فولٌ وتميسٌ وشاهي.
    ["bakery", "k5", [["k1", 4], ["k2", 4], ["k3", 4]]],
    ["breakfast", "q4", [["q1", 1], ["q5", 1], ["q12", 1]]],
    // ٠٧/١١: «المشكّل» حصّةٌ من كلّ سيخ، و«عرض الاثنين» مارغريتا وأرابياتا وخبزٌ بالثوم.
    ["grill", "g5", [["g1", 1], ["g2", 1], ["g3", 1]]],
    ["pizza", "p6", [["p1", 1], ["p7", 1], ["p10", 1]]],
    // ٠٧/١١: «ضيافة المجلس» دلّةٌ صغيرة وسكري ولقيمات، و«عرض الصباح» فلات وايت وكوكيز.
    ["qahwa", "a6", [["a1", 1], ["a7", 1], ["a10", 1]]],
    ["espresso", "e15", [["e5", 1], ["e12", 1]]],
    // ٠٧/١١: «عرض السهرة» كاستا كرك وبراتا بالجبن، و«جلسة الشاي» إبريقٌ وبقصم وحلاوة.
    ["karak", "k7", [["k1", 2], ["b1", 1]]],
    ["teahouse", "x1", [["h2", 1], ["d1", 1], ["d2", 1]]],
  ] as const)("«%s»: «%s» أرخص من أجزائه، وسعراته وصوديومه مجموعها", (kind, combo, parts) => {
    const { dishes } = demoData(kind);
    const by = (id: string) => dishes.find((d) => d.id === id)!;
    const sum = (k: "price" | "calories" | "sodium_mg") => parts.reduce((s, [id, n]) => s + (by(id)[k] ?? 0) * n, 0);
    expect(by(combo).price).toBeLessThan(sum("price"));
    expect(by(combo).calories).toBe(sum("calories"));
    expect(by(combo).sodium_mg).toBe(sum("sodium_mg"));
    expect(dishes.some((d) => d.available === false)).toBe(true);
  });

  it("«عاينه كاملاً» يفتح الطابع على منيو عالمه — «مرفأ» على مطعم أسماك لا ستيك", () => {
    const kindOf = (id: string) => demoKindForSuits(ALL_THEMES.find((t) => t.id === id)!.suits, id);
    expect(kindOf("harbor")).toBe("seafood");
    expect(kindOf("patisserie")).toBe("sweets");
    expect(kindOf("juice")).toBe("juice");
    expect(kindOf("burger")).toBe("burger");
    // ٠٧/١١: منيوهما لا منيو نوعهما الأوّل («حلواني» و«نجدي») — و«عسير» على الشعبي كما كان.
    expect(kindOf("bakery")).toBe("bakery");
    expect(kindOf("breakfast")).toBe("breakfast");
    expect(kindOf("asir")).toBe("shaabi");
    // ٠٧/١١: «جمر» و«ريحان» على منيويهما — و«فاخر» (شارته الأولى «مشويات») على الديوان كما كان.
    expect(kindOf("grill")).toBe("grill");
    expect(kindOf("pizza")).toBe("pizza");
    // ٠٧/١١: «دلّة» و«باريستا» على منيويهما — و«لوحة حروف» و«عصري» تبدّلت شارتاهما وبقيا كما كانا.
    expect(kindOf("dallah")).toBe("qahwa");
    expect(kindOf("barista")).toBe("espresso");
    expect(kindOf("letterboard")).toBe("cafe");
    expect(kindOf("modern")).toBe("juice");
    // ٠٧/١١: «كرك» و«سماور» على منيويهما — و«فاتورة» و«دكّان» تبدّلت شارتاهما وبقيا كما كانا.
    expect(kindOf("karak")).toBe("karak");
    expect(kindOf("samovar")).toBe("teahouse");
    expect(kindOf("receipt")).toBe("burger");
    expect(kindOf("dukkan")).toBe("shaabi");
    expect(kindOf("editorial")).toBe("sweets");
    expect(kindOf("patisserie")).toBe("sweets");
    expect(kindOf("najdi")).toBe("shaabi");
    expect(kindOf("roastery")).toBe("cafe");
    expect(kindOf("dark-gold")).toBe("restaurant");
    // ولكلّ طابعٍ منيوٌ موجود — لا معاينة على بيانات ناقصة.
    for (const t of ALL_THEMES) expect(isDemoKind(demoKindForSuits(t.suits, t.id)), t.id).toBe(true);
    // والطابع الجديد يُعاين على منيوٍ طابعُه هو نفسه.
    for (const id of ["harbor", "patisserie", "juice", "burger", "bakery", "breakfast", "grill", "pizza", "dallah", "barista", "karak", "samovar"]) {
      expect(demoData(kindOf(id)).menus[0].theme).toBe(id);
    }
  });
});


/**
 * منيو تجريبي لكل شريحة — صفحة الكافيه لا تعرض منيو مطعم ستيك.
 */
import { describe, expect, it } from "vitest";
import { DEMO_KINDS, demoData, isDemoKind } from "@/lib/demoMenus";
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
});

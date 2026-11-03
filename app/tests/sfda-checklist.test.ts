/**
 * «لو دخل المفتّش اليوم» — كل بندٍ يقول حالته الصحيحة، ولا يَعِد بما لا يُرى.
 */
import { describe, expect, it } from "vitest";
import { checklistTodo, ofTotal, sfdaChecklist } from "@/lib/sfdaChecklist";

type D = { name: string; category: string | null; calories: number | null; sodium_mg: number | null; caffeine_mg: number | null };
const d = (name: string, category: string, calories: number | null, sodium: number | null, caffeine: number | null = null): D => ({
  name,
  category,
  calories,
  sodium_mg: sodium,
  caffeine_mg: caffeine,
});

const byId = (items: ReturnType<typeof sfdaChecklist>) => Object.fromEntries(items.map((i) => [i.id, i]));

describe("sfdaChecklist", () => {
  it("منيو مكتمل بتنبيهٍ عام ⇒ لا بند ناقص", () => {
    const items = sfdaChecklist(
      [d("لاتيه", "مشروبات", 127, 95, 126), d("كرواسون", "مخبوزات", 310, 380)],
      { allergens_text: "قد يحتوي على مكسرات" }
    );
    expect(checklistTodo(items)).toBe(0);
    expect(byId(items).daily.state).toBe("auto");
  });

  it("صنفٌ بلا سعرات ⇒ بند السعرات ناقص، ورابطه إلى الحاسبة", () => {
    const items = byId(sfdaChecklist([d("لاتيه", "مشروبات", null, null), d("كرواسون", "مخبوزات", 310, 380)], { allergens_text: "x" }));
    expect(items.calories.state).toBe("todo");
    expect(items.calories.detail).toContain("الأصناف: 1 من 2");
    expect(items.calories.fix?.to).toBe("/dashboard/nutrition");
  });

  it("مشروبٌ بلا كافيين ⇒ البند ناقص؛ وبلا مشروبات ⇒ جاهز", () => {
    const withDrink = byId(sfdaChecklist([d("قهوة مقطرة", "مشروبات", 5, 10, null)], { allergens_text: "x" }));
    expect(withDrink.caffeine.state).toBe("todo");
    const noDrinks = byId(sfdaChecklist([d("كرواسون", "مخبوزات", 310, 380)], { allergens_text: "x" }));
    expect(noDrinks.caffeine.state).toBe("done");
    expect(noDrinks.caffeine.detail).toBe("لا مشروبات في منيوك");
  });

  it("بلا تنبيه حساسية عام ⇒ ناقص، ورابطه إلى الإعدادات — والمسافات وحدها لا تُعدّ تنبيهاً", () => {
    const items = byId(sfdaChecklist([d("كرواسون", "مخبوزات", 310, 380)], { allergens_text: "   " }));
    expect(items.allergens.state).toBe("todo");
    expect(items.allergens.fix?.to).toBe("/dashboard/settings");
  });

  it("منيو فارغ لا يُعلن السعرات «جاهزة»", () => {
    const items = byId(sfdaChecklist([], { allergens_text: null }));
    expect(items.calories.state).toBe("todo");
    expect(items.sodium.state).toBe("todo");
  });

  it("لا «متوافق مع الهيئة» في أي نصّ — نحسب ونعرض، والمسؤولية على المنشأة", () => {
    const text = JSON.stringify(sfdaChecklist([d("لاتيه", "مشروبات", 127, 95, 126)], { allergens_text: "x" }));
    expect(text).not.toMatch(/متوافق|معتمد/);
  });

  it("ofTotal: المعدود قبل العدد", () => {
    expect(ofTotal(7, 8, "الأصناف")).toBe("الأصناف: 7 من 8");
  });
});

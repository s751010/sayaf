/**
 * محرّك الوصفة — الرقم الذي يُطبع على منيو يقرؤه مفتّش.
 *
 * كل حالةٍ هنا محسوبة باليد من قيم `lib/ingredients.ts` (لكل ١٠٠غ)، فإن تغيّر
 * رقمٌ مرجعي سقط الفحص الذي يعتمد عليه، ويُراجَع التغيير قبل أن يصل منيواً.
 */
import { describe, expect, it } from "vitest";
import { INGREDIENTS } from "@/lib/ingredients";
import {
  computeNutrition,
  manualLine,
  matchIngredient,
  normalizeArabic,
  normalizeDigits,
  nutritionFromText,
  parseLine,
  parseRecipe,
} from "@/lib/recipe";
import { ALLERGENS } from "@/lib/allergens";

describe("التطبيع", () => {
  it("الأرقام العربية والفاصلة العشرية العربية", () => {
    expect(normalizeDigits("٢٠٠ مل")).toBe("200 مل");
    expect(normalizeDigits("١٫٥ كوب")).toBe("1.5 كوب");
  });

  it("الهمزات والتاء المربوطة والتشكيل", () => {
    expect(normalizeArabic("إسْبريسو")).toBe("اسبريسو");
    expect(normalizeArabic("زبدة")).toBe(normalizeArabic("زبده"));
  });
});

describe("مطابقة المكوّن", () => {
  it("الأطول يغلب: «حليب شوفان» ليس حليباً بقرياً", () => {
    expect(matchIngredient("حليب شوفان")?.id).toBe("oat-milk");
    expect(matchIngredient("حليب")?.id).toBe("milk-whole");
    expect(matchIngredient("قهوة عربية")?.id).toBe("saudi-coffee");
  });

  it("الغموض يُحسم نحو الأعلى صوديوماً", () => {
    expect(matchIngredient("زبدة")?.id).toBe("butter");
  });

  it("«ال» و«و» في أوّل الكلمة لا تُفشل المطابقة", () => {
    expect(matchIngredient("والسكر")?.id).toBe("sugar");
    expect(matchIngredient("الحليب")?.id).toBe("milk-whole");
  });

  it("لا مطابقة داخل كلمة أخرى", () => {
    // «مل» داخل «كامل» ليست وحدة، و«سكر» داخل «سكري» ليست سكراً.
    expect(parseLine("حليب كامل الدسم").ingredientId).toBe("milk-whole");
    expect(matchIngredient("مرض سكري")).toBeNull();
  });
});

describe("تحليل السطر", () => {
  it("كمية ووحدة صريحتان", () => {
    expect(parseLine("حليب 200 مل")).toMatchObject({ ingredientId: "milk-whole", unit: "ml", grams: 206 });
  });

  it("وحدةٌ تحمل عدداً ضمنياً: «شوتين»", () => {
    expect(parseLine("شوتين إسبريسو")).toMatchObject({ ingredientId: "espresso", qty: 2, unit: "shot", grams: 60 });
  });

  it("«ملعقتين صغار» سكر = ٨٫٤غ", () => {
    expect(parseLine("سكر ملعقتين صغار")).toMatchObject({ unit: "tsp", qty: 2, grams: 8.4 });
  });

  it("أرقام عربية وكسور", () => {
    expect(parseLine("عسل ١ ملعقة كبيرة").grams).toBe(21);
    expect(parseLine("1/2 كوب حليب").grams).toBe(122);
  });

  it("عددٌ صغير بلا وحدة لمكوّنٍ له حبّة = حبّات، والكبير = غرامات", () => {
    expect(parseLine("بيض 2")).toMatchObject({ unit: "piece", grams: 100 });
    expect(parseLine("طماطم 100")).toMatchObject({ unit: "g", grams: 100 });
  });

  it("لا تخمين: «ملح» بلا كمية لا وزن له", () => {
    expect(parseLine("ملح").grams).toBeNull();
  });

  it("الوصفة تنقسم على الأسطر والفواصل العربية", () => {
    expect(parseRecipe("حليب 200 مل، إسبريسو شوت\nسكر 10 غ")).toHaveLength(3);
  });
});

describe("الحساب", () => {
  it("لاتيه: شوتان إسبريسو + ٢٠٠ مل حليب كامل", () => {
    // إسبريسو 60غ: 9×0.6=5.4 سعرة، 212×0.6=127.2 كافيين، 14×0.6=8.4 صوديوم
    // حليب 206غ: 61×2.06=125.66 سعرة، 5.1×2.06=10.5 سكر، 43×2.06=88.58 صوديوم
    const r = nutritionFromText("شوتين إسبريسو\nحليب 200 مل");
    expect(r.kcal).toBe(131);
    expect(r.caffeine).toBe(127);
    expect(r.sugar).toBe(10.5);
    expect(r.sodium).toBe(97);
    expect(r.allergens).toEqual(["milk"]);
    expect(r.burnMinutes).toBe(33);
    expect(r.highSodium).toBe(false);
    expect(r.unresolved).toEqual([]);
  });

  it("الحصص تقسم القيم", () => {
    const one = nutritionFromText("رز مطبوخ 400 غ\nلحم غنم مطبوخ 300 غ", 1);
    const two = nutritionFromText("رز مطبوخ 400 غ\nلحم غنم مطبوخ 300 غ", 2);
    expect(two.kcal).toBe(Math.round(one.kcal / 2));
    expect(two.servingGrams).toBe(350);
  });

  it("تنبيه الصوديوم فوق ٦٠٠ ملغم", () => {
    const r = nutritionFromText("جبنة حلوم 60 غ\nخبز عربي 1");
    expect(r.sodium).toBeGreaterThan(600);
    expect(r.highSodium).toBe(true);
  });

  it("سطرٌ مجهول لا يدخل الحساب ويُعاد للتصحيح", () => {
    const r = nutritionFromText("حليب 100 مل\nمكوّن سرّي 50 غ");
    expect(r.unresolved).toEqual(["مكوّن سرّي 50 غ"]);
    expect(r.kcal).toBe(63);
  });

  it("التقدير يُعلَن", () => {
    expect(nutritionFromText("قهوة سعودية كوب").hasEstimates).toBe(true);
    expect(nutritionFromText("إسبريسو شوت").hasEstimates).toBe(false);
  });

  it("الاختيار اليدوي يعطي نفس نتيجة النصّ", () => {
    const viaText = computeNutrition(parseRecipe("حليب 200 مل"));
    const viaManual = computeNutrition([manualLine("milk-whole", 200, "ml")]);
    expect(viaManual.kcal).toBe(viaText.kcal);
  });
});

describe("سلامة القاعدة المرجعية", () => {
  const ids = new Set(ALLERGENS.map((a) => a.id));

  it("كل مسبّب حساسية معرّفٌ في `lib/allergens.ts`", () => {
    for (const ing of INGREDIENTS) for (const a of ing.allergens) expect(ids.has(a), `${ing.id}: ${a}`).toBe(true);
  });

  it("المعرّفات فريدة، والقيم غير سالبة، والدهون المشبعة ≤ الدهون", () => {
    const seen = new Set<string>();
    for (const ing of INGREDIENTS) {
      expect(seen.has(ing.id), `مكرّر: ${ing.id}`).toBe(false);
      seen.add(ing.id);
      for (const v of Object.values(ing.per100)) expect(v).toBeGreaterThanOrEqual(0);
      expect(ing.per100.satFat).toBeLessThanOrEqual(ing.per100.fat);
      expect(ing.per100.sugar).toBeLessThanOrEqual(100);
    }
  });

  it("السعرات قريبةٌ مما تقوله الدهون وحدها (لا رقمٌ مقلوب)", () => {
    // ٩ سعرات لكل غرام دهون حدٌّ أدنى لا يمكن أن تنزل تحته السعرات الكلّية.
    for (const ing of INGREDIENTS) {
      expect(ing.per100.kcal + 1, ing.id).toBeGreaterThanOrEqual(ing.per100.fat * 9 * 0.95);
    }
  });
});

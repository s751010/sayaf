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
  isDrinkText,
  nutritionPatch,
  parseLine,
  parseRecipe,
  readyToApply,
  splitRecipe,
  withIngredient,
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

/**
 * ═══ حالات وجدتها مراجعة ٢٠٢٦/١٠/١٦ ═══
 *
 * كلٌّ منها كان يضع على الملصق رقماً خاطئاً **بصمت** — بلا سطرٍ «لم يُفهم»
 * ينبّه التاجر. والصمت هو العطل: سطرٌ مجهول يُصحَّح، ورقمٌ خاطئ يُطبع.
 */
describe("الوحدات المركّبة والكسور", () => {
  it("«ملعقتين صغيرتين» ملعقتا شاي لا ملعقتا طعام", () => {
    const l = parseLine("سكر ملعقتين صغيرتين");
    expect([l.ingredientId, l.unit, l.qty, l.grams]).toEqual(["sugar", "tsp", 2, 8.4]);
  });

  it("«ملعقتين شاي» وحدةٌ لا مكوّن — السكر لا يضيع خلف الشاي", () => {
    const l = parseLine("سكر ملعقتين شاي");
    expect([l.ingredientId, l.unit, l.qty, l.grams]).toEqual(["sugar", "tsp", 2, 8.4]);
  });

  it.each(["حليب كوب ونصف", "كوب ونص حليب"])("«%s» = ١٫٥ كوب", (raw) => {
    const l = parseLine(raw);
    expect([l.ingredientId, l.unit, l.qty, l.grams]).toEqual(["milk-whole", "cup", 1.5, 366]);
  });

  it("«ملعقة ونصف» = ١٫٥ ملعقة", () => {
    expect(parseLine("سكر ملعقة ونصف").qty).toBe(1.5);
  });

  it.each([
    ["1½ كوب حليب", 1.5],
    ["حليب 2 ½ كوب", 2.5],
    ["حليب 1 1/2 كوب", 1.5],
  ])("الكسر المختلط «%s»", (raw, qty) => {
    expect(parseLine(raw).qty).toBe(qty);
  });

  it("فاصلةٌ بين رقمين فاصلةٌ عشرية لا فاصل أسطر", () => {
    expect(splitRecipe("حليب 1,5 كوب")).toEqual(["حليب 1.5 كوب"]);
    expect(parseLine(splitRecipe("حليب 1,5 كوب")[0]).grams).toBe(366);
    // وبعدها مسافة ⇒ فاصل أسطر كما كان.
    expect(splitRecipe("بيض 2, سكر 10")).toEqual(["بيض 2", "سكر 10"]);
  });
});

describe("اختيار المكوّن يدوياً يعيد قراءة الكمية", () => {
  it("عددٌ صغير بلا وحدة يصير حبّات حين يُختار مكوّنٌ له وزن حبّة", () => {
    const line = parseLine("3 كتكوت");
    expect(line.ingredientId).toBeNull();
    const picked = withIngredient(line, "egg");
    expect([picked.unit, picked.grams]).toEqual(["piece", 150]);
  });

  it("والعدد الكبير يبقى غرامات، والوحدة الصريحة تبقى كما كُتبت", () => {
    expect(withIngredient(parseLine("150 كتكوت"), "egg").grams).toBe(150);
    expect(withIngredient(parseLine("2 كوب كتكوت"), "milk-whole").grams).toBe(488);
  });
});

describe("مطابقة لا تُسقط مسبّب حساسية", () => {
  it("«فول سوداني» فول سوداني — بمسبّب حساسيته", () => {
    const ing = matchIngredient("فول سوداني 30 غ");
    expect(ing?.id).toBe("peanuts");
    expect(ing?.allergens).toContain("peanuts");
  });

  it("«جوز هند» ليس عين جمل", () => {
    expect(matchIngredient("جوز هند مبشور")?.id).toBe("coconut-desiccated");
  });

  it("«دجاج مقلي» مقليٌّ لا نيء، و«صلصة طماطم» ليست كاتشب", () => {
    expect(matchIngredient("دجاج مقلي 150 غ")?.id).toBe("chicken-fried");
    expect(matchIngredient("صلصة طماطم")?.id).toBe("tomato-sauce");
  });
});

describe("ما يُحفظ", () => {
  it("لا تطبيق وفي الوصفة سطرٌ لم يُفهم", () => {
    const lines = parseRecipe("حليب 200 مل\nشيء غريب 5 كوب");
    expect(readyToApply(lines, computeNutrition(lines))).toBe(false);
    const ok = parseRecipe("حليب 200 مل");
    expect(readyToApply(ok, computeNutrition(ok))).toBe(true);
    expect(readyToApply([], computeNutrition([]))).toBe(false);
  });

  it("الحساسية تُضاف إلى ما ضبطه التاجر ولا تمحوه", () => {
    const r = nutritionFromText("حليب 200 مل");
    const patch = nutritionPatch(r, { caffeine_mg: null, allergens: ["sesame", "جلوتين", "خردل بري"] }, false);
    expect(patch.allergens.sort()).toEqual(["gluten", "milk", "sesame", "خردل بري"].sort());
  });

  it("لا كافيين «٠» يُكتب لطعام — ويُكتب لمشروب", () => {
    const burger = nutritionFromText("خبز برجر 1");
    expect(nutritionPatch(burger, { caffeine_mg: null, allergens: [] }, false).caffeine_mg).toBeNull();
    expect(nutritionPatch(burger, { caffeine_mg: null, allergens: [] }, true).caffeine_mg).toBe(0);
    const latte = nutritionFromText("شوتين إسبريسو");
    expect(nutritionPatch(latte, { caffeine_mg: null, allergens: [] }, false).caffeine_mg).toBe(latte.caffeine);
  });

  it("المشروب يُعرف من اسمه أو تصنيفه", () => {
    expect(isDrinkText("مشروبات ساخنة لاتيه")).toBe(true);
    expect(isDrinkText("الأطباق الرئيسية برجر")).toBe(false);
  });
});

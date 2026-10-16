/**
 * من الوصفة إلى أرقام الهيئة — **محلّل ومحرّك حساب خالصان**.
 *
 * التاجر يكتب الوصفة كما يتكلّم: «حليب 200 مل، شوتين إسبريسو، سكر ملعقتين
 * صغار». فيُستخرج من كل سطر مكوّنٌ وكميةٌ ووحدة، وتُحوَّل الكمية إلى غرامات،
 * وتُجمع القيم من `lib/ingredients.ts` ثم تُقسم على عدد الحصص.
 *
 * ═══ لماذا محلّلٌ حتميّ لا نموذج لغوي ═══
 *
 * الرقم هنا يُطبع على منيو يقرؤه مفتّش. والمحلّل الحتميّ يعطي نفس الجواب لنفس
 * السطر كل مرة، ويُختبر، ويقول «لم أفهم هذا السطر» بدل أن يخمّن. ما لا يُفهم
 * يعود إلى الواجهة ليختار التاجر مكوّنه بيده.
 *
 * ⚠️ لا شبكة ولا قاعدة هنا: الدوالّ تعمل في المتصفّح وفي الاختبارات سواءً.
 */
import { INGREDIENTS, ingredientById, type AllergenId, type Ingredient, type UnitGrams } from "@/lib/ingredients";
import { burnMinutes, isHighSodium } from "@/lib/nutrition";

export type Unit = "g" | "kg" | "ml" | "l" | "cup" | "tbsp" | "tsp" | "piece" | "shot" | "slice" | "clove" | "pinch";

export type RecipeLine = {
  /** النصّ كما كتبه التاجر. */
  raw: string;
  ingredientId: string | null;
  qty: number;
  unit: Unit;
  /** الوزن بالغرام بعد التحويل، أو `null` إن تعذّر (مكوّن مجهول). */
  grams: number | null;
};

export type NutritionResult = {
  kcal: number;
  fat: number;
  satFat: number;
  sugar: number;
  sodium: number;
  caffeine: number;
  burnMinutes: number;
  highSodium: boolean;
  allergens: AllergenId[];
  /** مكوّنٌ واحد على الأقل قيمته تقديرية لا مرجعية. */
  hasEstimates: boolean;
  /** أسطرٌ لم تُفهم — لا تدخل الحساب، والواجهة تطلب تصحيحها. */
  unresolved: string[];
  /** إجمالي وزن الحصة الواحدة بالغرام. */
  servingGrams: number;
};

/* ── التطبيع ─────────────────────────────────────────────────────── */

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** أرقام عربية وفارسية ← لاتينية، والفاصلة العشرية العربية ← نقطة. */
export function normalizeDigits(s: string): string {
  return s
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)))
    .replace(/٫/g, ".")
    .replace(/½/g, " 0.5 ")
    .replace(/¼/g, " 0.25 ")
    .replace(/¾/g, " 0.75 ");
}

/** يوحّد الهمزات والتاء المربوطة والألف المقصورة ويُسقط التشكيل والتطويل. */
export function normalizeArabic(s: string): string {
  return s
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/* ── الوحدات ─────────────────────────────────────────────────────── */

/**
 * ألفاظ الوحدات → الوحدة ومُضاعِفها الضمني («شوتين» = ٢ شوت).
 * ⚠️ الأطول أوّلاً: «ملعقة كبيرة» قبل «ملعقة»، وإلا التُقطت الكلمة الأقصر.
 */
const UNIT_WORDS: [string, Unit, number][] = [
  ["ملاعق كبيره", "tbsp", 1], ["ملعقتين كبار", "tbsp", 2], ["ملعقتين كبيره", "tbsp", 2], ["ملعقه كبيره", "tbsp", 1], ["ملعقه طعام", "tbsp", 1],
  ["ملاعق صغيره", "tsp", 1], ["ملعقتين صغار", "tsp", 2], ["ملعقتين صغيره", "tsp", 2], ["ملعقه صغيره", "tsp", 1], ["ملعقه شاي", "tsp", 1],
  ["ملعقتين", "tbsp", 2], ["ملعقه", "tbsp", 1], ["ملاعق", "tbsp", 1],
  ["tbsp", "tbsp", 1], ["tsp", "tsp", 1],
  ["كيلوغرام", "kg", 1], ["كيلوجرام", "kg", 1], ["كيلو", "kg", 1], ["كجم", "kg", 1], ["kg", "kg", 1],
  ["غرامات", "g", 1], ["جرامات", "g", 1], ["غرام", "g", 1], ["جرام", "g", 1], ["جم", "g", 1], ["غم", "g", 1], ["grams", "g", 1], ["gram", "g", 1], ["gm", "g", 1], ["g", "g", 1], ["غ", "g", 1],
  ["مليلتر", "ml", 1], ["ملليلتر", "ml", 1], ["مل", "ml", 1], ["ml", "ml", 1],
  ["لترات", "l", 1], ["لتر", "l", 1], ["l", "l", 1],
  ["اكواب", "cup", 1], ["كوبين", "cup", 2], ["كوب", "cup", 1], ["cups", "cup", 1], ["cup", "cup", 1],
  ["شوتات", "shot", 1], ["شوتين", "shot", 2], ["شوت", "shot", 1], ["shots", "shot", 1], ["shot", "shot", 1],
  ["حبات", "piece", 1], ["حبتين", "piece", 2], ["حبه", "piece", 1], ["قطع", "piece", 1], ["قطعتين", "piece", 2], ["قطعه", "piece", 1], ["pieces", "piece", 1], ["piece", "piece", 1], ["pcs", "piece", 1],
  ["شرائح", "slice", 1], ["شريحتين", "slice", 2], ["شريحه", "slice", 1], ["slices", "slice", 1], ["slice", "slice", 1],
  ["فصوص", "clove", 1], ["فصين", "clove", 2], ["فص", "clove", 1], ["cloves", "clove", 1], ["clove", "clove", 1],
  ["رشه", "pinch", 1], ["رشتين", "pinch", 2], ["pinch", "pinch", 1],
];

/** كلمات كمّية بلا أرقام. */
const NUMBER_WORDS: [string, number][] = [
  ["نص", 0.5], ["نصف", 0.5], ["ربع", 0.25], ["ثلث", 1 / 3],
  ["واحد", 1], ["واحده", 1], ["اثنين", 2], ["ثنتين", 2], ["ثلاث", 3], ["ثلاثه", 3], ["اربع", 4], ["اربعه", 4], ["خمس", 5], ["خمسه", 5],
];

/** أكبر عددٍ بلا وحدة يُقرأ حبّات لا غرامات («تمر 3» حبّات، «تمر 50» غرامات). */
const PIECE_COUNT_MAX = 12;

/** أحجام عامّة بالمل حين لا يحدّد المكوّن وزن الوحدة. */
const GENERIC_ML: Partial<Record<Unit, number>> = { cup: 240, tbsp: 15, tsp: 5, shot: 30 };

/** غرامات الوحدة لهذا المكوّن، أو `null` إن تعذّر بلا تخمين. */
export function unitToGrams(ingredient: Ingredient, qty: number, unit: Unit): number | null {
  if (!(qty > 0)) return null;
  const density = ingredient.density ?? 1;
  switch (unit) {
    case "g": return qty;
    case "kg": return qty * 1000;
    case "ml": return qty * density;
    case "l": return qty * 1000 * density;
    case "pinch": return qty * 0.4;
    default: {
      const specific = ingredient.units?.[unit as keyof UnitGrams];
      if (specific !== undefined) return qty * specific;
      const ml = GENERIC_ML[unit];
      if (ml !== undefined) return qty * ml * density;
      // «حبة» أو «شريحة» من مكوّنٍ لم يُعرَّف وزنُ حبّته: لا نخمّن.
      return null;
    }
  }
}

/* ── مطابقة المكوّن ─────────────────────────────────────────────── */

type Synonym = { norm: string; id: string };

/** كل مرادف مطبَّعاً، الأطول أوّلاً — فـ«حليب خالي الدسم» يسبق «حليب». */
const SYNONYMS: Synonym[] = INGREDIENTS.flatMap((ing) =>
  [...ing.ar, ing.en].map((name) => ({ norm: normalizeArabic(name), id: ing.id }))
).sort((a, b) => b.norm.length - a.norm.length);

/** حدود الكلمة بالعربية: بداية/نهاية النصّ أو مسافة، مع «ال» و«و» و«ب» اختيارياً. */
function containsWord(text: string, word: string): boolean {
  const esc = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\s)(?:و|ب)?(?:ال)?${esc}(?=$|\\s)`).test(text);
}

/** أطول مرادفٍ يظهر في النصّ كلمةً كاملة. */
export function matchIngredient(text: string): Ingredient | null {
  const t = normalizeArabic(text);
  if (!t) return null;
  for (const s of SYNONYMS) {
    if (containsWord(t, s.norm)) return ingredientById(s.id) ?? null;
  }
  return null;
}

/* ── تحليل السطر ─────────────────────────────────────────────────── */

/** يقسم الوصفة إلى أسطر: سطر جديد · فاصلة عربية أو لاتينية · فاصلة منقوطة · «+». */
export function splitRecipe(text: string): string[] {
  return normalizeDigits(text)
    .split(/[\n،,;؛+]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseLine(raw: string): RecipeLine {
  let t = normalizeArabic(normalizeDigits(raw));

  // الوحدة أوّلاً (قد تحمل عدداً ضمنياً: «شوتين»).
  let unit: Unit | null = null;
  let implied = 1;
  for (const [word, u, mult] of UNIT_WORDS) {
    const w = normalizeArabic(word);
    const re = new RegExp(`(^|\\s|\\d)${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=$|\\s)`);
    if (re.test(t)) {
      unit = u;
      implied = mult;
      t = t.replace(re, "$1 ").trim();
      break;
    }
  }

  // ثم العدد: رقمٌ صريح، أو كسرٌ «1/2»، أو كلمة.
  let qty: number | null = null;
  const frac = t.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
  if (frac) {
    qty = Number(frac[1]) / Number(frac[2]);
    t = t.replace(frac[0], " ");
  } else {
    const num = t.match(/\d+(?:\.\d+)?/);
    if (num) {
      qty = Number(num[0]);
      t = t.replace(num[0], " ");
    } else {
      for (const [word, n] of NUMBER_WORDS) {
        if (containsWord(t, word)) {
          qty = n;
          t = t.replace(new RegExp(`(^|\\s)${word}(?=$|\\s)`), " ");
          break;
        }
      }
    }
  }

  const ingredient = matchIngredient(t);
  const finalQty = (qty ?? 1) * implied;
  /**
   * عددٌ بلا وحدة: «بيض 2» حبّتان، و«طماطم 100» مئة غرام لا مئة حبّة.
   * فالعدد الصغير لمكوّنٍ له وزن حبّة = حبّات، وما سواه = غرامات.
   */
  const piecey = ingredient?.units?.piece !== undefined;
  const finalUnit: Unit =
    unit ?? (qty === null ? "piece" : piecey && qty <= PIECE_COUNT_MAX ? "piece" : "g");
  const grams = ingredient ? unitToGrams(ingredient, finalQty, finalUnit) : null;

  return {
    raw: raw.trim(),
    ingredientId: ingredient?.id ?? null,
    qty: round(finalQty, 2),
    unit: finalUnit,
    grams: grams === null ? null : round(grams, 1),
  };
}

export function parseRecipe(text: string): RecipeLine[] {
  return splitRecipe(text).map(parseLine);
}

/* ── الحساب ──────────────────────────────────────────────────────── */

function round(n: number, digits = 0): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

/**
 * القيم لكل حصّة.
 *
 * التقريب: السعرات والصوديوم والكافيين أعداد صحيحة، والدهون والسكر منزلة
 * عشرية واحدة. ودقائق الحرق وتنبيه الصوديوم من `lib/nutrition.ts` نفسها التي
 * تكرّر تعبيرات أعمدة القاعدة — فما يُعرض هنا هو ما ستحسبه القاعدة بعد الحفظ.
 */
export function computeNutrition(lines: RecipeLine[], servings = 1): NutritionResult {
  const s = servings > 0 ? servings : 1;
  const sum = { kcal: 0, fat: 0, satFat: 0, sugar: 0, sodium: 0, caffeine: 0 };
  const allergens = new Set<AllergenId>();
  const unresolved: string[] = [];
  let hasEstimates = false;
  let grams = 0;

  for (const line of lines) {
    const ing = line.ingredientId ? ingredientById(line.ingredientId) : undefined;
    if (!ing || line.grams === null || !(line.grams > 0)) {
      unresolved.push(line.raw);
      continue;
    }
    const k = line.grams / 100;
    sum.kcal += ing.per100.kcal * k;
    sum.fat += ing.per100.fat * k;
    sum.satFat += ing.per100.satFat * k;
    sum.sugar += ing.per100.sugar * k;
    sum.sodium += ing.per100.sodium * k;
    sum.caffeine += ing.per100.caffeine * k;
    grams += line.grams;
    for (const a of ing.allergens) allergens.add(a);
    if (ing.estimate) hasEstimates = true;
  }

  const kcal = round(sum.kcal / s);
  const sodium = round(sum.sodium / s);
  return {
    kcal,
    fat: round(sum.fat / s, 1),
    satFat: round(sum.satFat / s, 1),
    sugar: round(sum.sugar / s, 1),
    sodium,
    caffeine: round(sum.caffeine / s),
    burnMinutes: burnMinutes(kcal) ?? 0,
    highSodium: isHighSodium(sodium),
    allergens: [...allergens],
    hasEstimates,
    unresolved,
    servingGrams: round(grams / s),
  };
}

/** اختصار: نصّ الوصفة ← قيم الحصة. */
export function nutritionFromText(text: string, servings = 1): NutritionResult {
  return computeNutrition(parseRecipe(text), servings);
}

/** يعيد بناء سطرٍ من اختيار يدوي (مكوّن + كمية + وحدة) — للواجهة. */
export function manualLine(ingredientId: string, qty: number, unit: Unit): RecipeLine {
  const ing = ingredientById(ingredientId);
  const grams = ing ? unitToGrams(ing, qty, unit) : null;
  const label = ing ? `${ing.ar[0]} ${qty} ${UNIT_LABEL[unit]}` : `${qty} ${UNIT_LABEL[unit]}`;
  return { raw: label, ingredientId: ing ? ingredientId : null, qty, unit, grams: grams === null ? null : round(grams, 1) };
}

export const UNIT_LABEL: Record<Unit, string> = {
  g: "غ", kg: "كغ", ml: "مل", l: "لتر", cup: "كوب", tbsp: "ملعقة كبيرة", tsp: "ملعقة صغيرة",
  piece: "حبة", shot: "شوت", slice: "شريحة", clove: "فص", pinch: "رشة",
};

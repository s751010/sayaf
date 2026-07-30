/**
 * مسببات الحساسية — مصدر واحد للوحة التحكم وصفحة الزبون.
 *
 * القائمة هي المسببات الرئيسية المعتمدة في لوائح هيئة الغذاء والدواء السعودية
 * (وهي نفسها قائمة الاتحاد الأوروبي الأربعة عشر). `id` ثابت ولا يتغيّر — هو ما
 * يُخزَّن في عمود `dishes.allergens` (text[]).
 */
export type Allergen = {
  /** يُخزَّن في قاعدة البيانات — لا تغيّره. */
  id: string;
  ar: string;
  en: string;
  emoji: string;
};

export const ALLERGENS: Allergen[] = [
  { id: "gluten", ar: "جلوتين", en: "Gluten", emoji: "🌾" },
  { id: "crustaceans", ar: "قشريات", en: "Crustaceans", emoji: "🦐" },
  { id: "eggs", ar: "بيض", en: "Eggs", emoji: "🥚" },
  { id: "fish", ar: "أسماك", en: "Fish", emoji: "🐟" },
  { id: "peanuts", ar: "فول سوداني", en: "Peanuts", emoji: "🥜" },
  { id: "soy", ar: "صويا", en: "Soy", emoji: "🫘" },
  { id: "milk", ar: "حليب", en: "Milk", emoji: "🥛" },
  { id: "nuts", ar: "مكسرات", en: "Tree nuts", emoji: "🌰" },
  { id: "celery", ar: "كرفس", en: "Celery", emoji: "🥬" },
  { id: "mustard", ar: "خردل", en: "Mustard", emoji: "🌭" },
  { id: "sesame", ar: "سمسم", en: "Sesame", emoji: "🫧" },
  { id: "sulphites", ar: "كبريتات", en: "Sulphites", emoji: "🍷" },
  { id: "lupin", ar: "ترمس", en: "Lupin", emoji: "🌱" },
  { id: "molluscs", ar: "رخويات", en: "Molluscs", emoji: "🦪" },
];

const BY_ID = new Map(ALLERGENS.map((a) => [a.id, a]));

/**
 * أسماء عربية شائعة → المعرّف القياسي.
 * صفوف قديمة كُتبت بالنص العربي مباشرة في حقل مفصول بفواصل، فلا نُسقطها.
 */
const ALIASES: Record<string, string> = {
  "جلوتين": "gluten",
  "غلوتين": "gluten",
  "قمح": "gluten",
  "قشريات": "crustaceans",
  "روبيان": "crustaceans",
  "جمبري": "crustaceans",
  "بيض": "eggs",
  "أسماك": "fish",
  "اسماك": "fish",
  "سمك": "fish",
  "فول سوداني": "peanuts",
  "فستق عبيد": "peanuts",
  "صويا": "soy",
  "حليب": "milk",
  "ألبان": "milk",
  "البان": "milk",
  "مكسرات": "nuts",
  "كرفس": "celery",
  "خردل": "mustard",
  "سمسم": "sesame",
  "كبريتات": "sulphites",
  "ترمس": "lupin",
  "رخويات": "molluscs",
};

/** يحوّل قيمة مخزَّنة (معرّف أو اسم عربي حر) إلى مسبب معروف إن أمكن. */
export function resolveAllergen(raw: string): Allergen | null {
  const key = raw.trim();
  if (!key) return null;
  const direct = BY_ID.get(key.toLowerCase());
  if (direct) return direct;
  const viaAlias = ALIASES[key];
  return viaAlias ? (BY_ID.get(viaAlias) ?? null) : null;
}

export type DisplayAllergen = { key: string; label: string; emoji: string };

/**
 * قيم مخزَّنة → عناصر جاهزة للعرض.
 * ما لا نعرفه يُعرض كما كتبه التاجر (لا نُخفي معلومة سلامة عن الزبون).
 */
export function displayAllergens(
  stored: string[] | null | undefined,
  en = false
): DisplayAllergen[] {
  const out: DisplayAllergen[] = [];
  const seen = new Set<string>();
  for (const raw of stored ?? []) {
    const known = resolveAllergen(raw);
    const key = known?.id ?? raw.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(
      known
        ? { key: known.id, label: en ? known.en : known.ar, emoji: known.emoji }
        : { key, label: raw.trim(), emoji: "⚠️" }
    );
  }
  return out;
}

/** القيم المخزَّنة التي لا تطابق أي مسبب معروف (لعرضها كإدخال حر في المحرّر). */
export function customAllergens(stored: string[] | null | undefined): string[] {
  return (stored ?? [])
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !resolveAllergen(s));
}

/** المعرّفات المعروفة الموجودة في القيم المخزَّنة. */
export function knownAllergenIds(stored: string[] | null | undefined): string[] {
  const ids = new Set<string>();
  for (const raw of stored ?? []) {
    const a = resolveAllergen(raw);
    if (a) ids.add(a.id);
  }
  return [...ids];
}

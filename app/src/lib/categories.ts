/**
 * التصنيفات: توحيدها وترتيبها.
 *
 * مشكلتان أبلغ عنهما التاجر: التصنيف حقل نصّي حر فيصبح «مشاوي» و«المشاوي»
 * تصنيفين، وترتيب التصنيفات في المنيو خارج سيطرته (كان ترتيب أول ظهور لطبق).
 *
 * الترتيب يُخزَّن في `restaurants.category_order` نصّاً يحمل JSON — نفس
 * اتفاقية `working_hours` و`dishes.options` القائمة في المشروع.
 */
import type { Dish } from "./types";
import type { IconName } from "./icons";

/* ══ قاموس التصنيفات ══════════════════════════════════════════════════
 *
 * `categoryKey` يطبّع **الرسم**: يدمج «المقبلات/مقبلات» و«حلويات/الحلويات».
 * لكنه لا يستطيع أن يعرف أن **«فطور» و«إفطار» شيء واحد** — وهما كلمتان
 * مختلفتان لا رسمان لكلمة. وقد وقع هذا فعلاً في الإنتاج عند **٢٠ طبقاً**:
 * «فطور»×٢ و«إفطار»×٢ تصنيفان في منيو واحد، و«المقبلات والسلطات» منفصل عن
 * «المقبلات».
 *
 * ونحن كنّا نُنتج الفوضى بأنفسنا: قوائم البداية كانت تُخرج **٢٦ اسم تصنيف**،
 * منها ثمانية للمشروبات وخمسة للحلى، بلا اتّساق في «ال» التعريف.
 *
 * ── طبقة تفسير لا قفل ────────────────────────────────────────────────
 * القيمة تبقى **نصّاً حرّاً في `dishes.category` كما هي**: لا عمود، ولا
 * ترحيل، ولا تُبدَّل بيانات تاجر من تحته. القاموس يقترح ويرتّب ويكشف
 * التكرار — نفس ما فعلته `aliasType()` مع `restaurants.type`.
 *
 * ⚠️ **المطابقة بالمفتاح الكامل لا بالاحتواء.** `aliasType` تطابق بالاحتواء
 * فصار ترتيب `HINTS` فيها جزءاً من المنطق (الأخصّ أولاً وإلا خرج «مطعم
 * مشويات» بقالب المطاعم). هنا لا ترتيب ولا أسبقية: مفتاحٌ يطابق أو لا
 * يطابق. الثمن قائمة مرادفات أطول، والمقابل أن إضافة مرادف لا تكسر مرادفاً
 * قائماً — وهذا يستحقّ الطول.
 */

export type Canon = {
  id: string;
  ar: string;
  en: string;
  /** رمز من `lib/icons.tsx`. */
  icon: IconName;
  /** الرتبة في المنيو — لا أبجدية. */
  rank: number;
  /** كل ما يكتبه التاجر ويعني هذا التصنيف. يمرّ بـ`categoryKey` عند البناء. */
  alias: string[];
};

/**
 * الرتب بترتيب **قراءة المنيو** لا الأبجدية.
 *
 * ⚠️ كان الاحتياطي `localeCompare` فيخرج: الأسماك ← الأطباق الرئيسية ←
 * الإفطار ← **الحلويات** ← الشوربات ← المشاوي ← المشروبات ← المقبلات.
 * الحلويات رابعاً قبل المشاوي والمقبلات — ولا منيو يُقرأ هكذا.
 */
export const CANON: Canon[] = [
  {
    id: "appetizers", ar: "المقبلات", en: "Appetizers", icon: "mezze", rank: 10,
    alias: ["مقبلات", "المقبلات والسلطات", "مقبلات وسلطات", "مزة", "مزات", "فواتح شهية",
      "بادئات", "مقبلات باردة", "مقبلات ساخنة", "starters", "appetizers", "mezze"],
  },
  {
    id: "soups", ar: "الشوربات", en: "Soups", icon: "soup", rank: 20,
    alias: ["شوربات", "شوربة", "حساء", "شوربه", "soup", "soups"],
  },
  {
    id: "salads", ar: "السلطات", en: "Salads", icon: "salad", rank: 25,
    alias: ["سلطات", "سلطة", "السلطات والمقبلات", "سلطات وشوربات", "salad", "salads"],
  },
  {
    id: "breakfast", ar: "الإفطار", en: "Breakfast", icon: "egg", rank: 30,
    alias: ["افطار", "إفطار", "فطور", "الفطور", "ريوق", "الريوق", "صباحية", "فطار",
      "وجبات الإفطار", "وجبات الافطار", "breakfast", "morning"],
  },
  {
    id: "mains", ar: "الأطباق الرئيسية", en: "Main Dishes", icon: "kabsa", rank: 40,
    alias: ["أطباق رئيسية", "اطباق رئيسية", "الأطباق الرئيسيه", "رئيسية", "الرئيسية",
      "وجبات رئيسية", "الوجبات الرئيسية", "أطباق", "اطباق", "وجبات", "الوجبات",
      "mains", "main dishes", "main"],
  },
  {
    id: "traditional", ar: "الأطباق الشعبية", en: "Traditional", icon: "pot", rank: 45,
    alias: ["أطباق شعبية", "اطباق شعبية", "الأطباق الشعبيه", "شعبية", "الشعبية",
      "أكلات شعبية", "اكلات شعبية", "تراثية", "الأكلات الشعبية", "traditional"],
  },
  {
    id: "grills", ar: "المشاوي", en: "Grills", icon: "skewer", rank: 50,
    alias: ["مشاوي", "مشويات", "المشويات", "مشوي", "جريل", "كباب", "الكباب",
      "grills", "grill", "bbq"],
  },
  {
    id: "seafood", ar: "الأسماك والبحريات", en: "Seafood", icon: "fish", rank: 55,
    alias: ["أسماك", "اسماك", "الأسماك", "سمك", "بحريات", "البحريات", "مأكولات بحرية",
      "الروبيان", "روبيان", "جمبري", "seafood", "fish"],
  },
  {
    id: "sandwiches", ar: "السندويتشات", en: "Sandwiches", icon: "sandwich", rank: 60,
    alias: ["سندويتشات", "ساندويتشات", "سندويشات", "سندويش", "ساندويش", "شاورما",
      "الشاورما", "راب", "لفائف", "sandwich", "sandwiches", "wraps"],
  },
  {
    id: "burgers", ar: "البرجر", en: "Burgers", icon: "burger", rank: 62,
    alias: ["برجر", "برغر", "برقر", "همبرجر", "هامبرجر", "burger", "burgers"],
  },
  {
    id: "pizza", ar: "البيتزا والباستا", en: "Pizza & Pasta", icon: "pizza", rank: 65,
    alias: ["بيتزا", "البيتزا", "باستا", "الباستا", "مكرونة", "معكرونة", "بيتزا وباستا",
      "pizza", "pasta"],
  },
  {
    id: "fried", ar: "البروست والمقليات", en: "Fried", icon: "fries", rank: 68,
    alias: ["بروست", "البروست", "مقليات", "المقليات", "دجاج مقلي", "كرسبي",
      "broast", "fried", "fried chicken"],
  },
  {
    id: "bakery", ar: "المخبوزات والمعجنات", en: "Bakery", icon: "croissant", rank: 70,
    alias: ["مخبوزات", "معجنات", "المعجنات", "مخبوزات ومعجنات", "فطائر", "فطاير",
      "كرواسون", "bakery", "pastries", "pastry"],
  },
  {
    id: "bread", ar: "الخبز", en: "Bread", icon: "bread", rank: 72,
    alias: ["خبز", "تميس", "التميس", "خبز تنور", "أرغفة", "ارغفة", "bread"],
  },
  {
    id: "desserts", ar: "الحلويات", en: "Desserts", icon: "cake", rank: 80,
    alias: ["حلويات", "حلى", "حلا", "الحلى", "تحلية", "التحلية", "ديزرت", "كيك",
      "الكيك", "كعك", "حلويات شرقية", "حلويات غربية", "دونات", "دونات وكوكيز",
      "كوكيز", "dessert", "desserts", "sweets", "cake"],
  },
  {
    id: "hotcoffee", ar: "القهوة الساخنة", en: "Hot Coffee", icon: "dallah", rank: 90,
    alias: ["قهوة ساخنة", "القهوه الساخنه", "قهوة", "القهوة", "مشروبات ساخنة",
      "المشروبات الساخنة", "ساخنة", "الساخنة", "إسبريسو", "اسبريسو",
      "coffee", "hot coffee", "hot drinks"],
  },
  {
    id: "coldcoffee", ar: "القهوة الباردة", en: "Iced Coffee", icon: "icedcup", rank: 92,
    alias: ["قهوة باردة", "القهوه البارده", "آيس كوفي", "ايس كوفي", "قهوة مثلجة",
      "كولد برو", "iced coffee", "cold brew", "iced"],
  },
  {
    id: "tea", ar: "الشاي", en: "Tea", icon: "istikana", rank: 94,
    alias: ["شاي", "شاهي", "الشاهي", "كرك", "شاي كرك", "ماتشا", "أعشاب", "اعشاب",
      "tea", "matcha", "herbal"],
  },
  {
    id: "juices", ar: "العصائر الطازجة", en: "Fresh Juices", icon: "juice", rank: 96,
    alias: ["عصائر", "عصير", "العصائر", "عصائر طازجة", "عصائر طبيعية", "فريش",
      "juice", "juices", "fresh juice"],
  },
  {
    id: "drinks", ar: "المشروبات", en: "Drinks", icon: "bottle", rank: 98,
    alias: ["مشروبات", "مشروبات أخرى", "مشروبات اخرى", "مشروبات باردة",
      "المشروبات الباردة", "باردة", "غازية", "مشروبات غازية", "مياه", "ماء",
      "صودا", "موهيتو", "كوكتيلات", "موكتيل", "موكتيلات", "سموذي", "ميلك شيك",
      "شيك", "drinks", "beverages", "soda", "smoothie"],
  },
  {
    id: "sides", ar: "الإضافات", en: "Sides & Extras", icon: "sides", rank: 110,
    alias: ["إضافات", "اضافات", "الاضافات", "جانبية", "أطباق جانبية", "اطباق جانبية",
      "مقبلات جانبية", "sides", "extras", "add-ons", "addons"],
  },
];

/** فهرس مفتاح ⇐ تصنيف قانوني. يُبنى مرة واحدة. */
const BY_KEY = new Map<string, Canon>();
for (const k of CANON) {
  for (const name of [k.ar, k.en, ...k.alias]) {
    const key = categoryKey(name);
    // الأول يفوز: لو تكرّر مرادف بين تصنيفين فالأعلى في القائمة أولى، ولا
    // يُدهس بصمت.
    if (key && !BY_KEY.has(key)) BY_KEY.set(key, k);
  }
}

/** التصنيف القانوني لاسم مكتوب، أو `null` لاسم لا نعرفه (وهو مسموح). */
export function canonOf(raw: string | null | undefined): Canon | null {
  if (!raw?.trim()) return null;
  return BY_KEY.get(categoryKey(raw)) ?? null;
}

/** رمز التصنيف — يسقط إلى الصحن العامّ لما لا نعرفه. */
export function categoryIcon(raw: string | null | undefined): IconName {
  return canonOf(raw)?.icon ?? "plate";
}

/** مفتاح المقارنة: بلا «ال» التعريف ولا تشكيل، بهمزات وتاء مربوطة موحّدة. */
export function categoryKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[ً-ْ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/^ال/, "")
    .replace(/\s+/g, " ");
}

/**
 * يعيد التصنيف المعروف المطابق (ولو اختلف رسمه أو لفظه)، أو `null`.
 *
 * مرحلتان بهذا الترتيب:
 * 1. **مطابقة الرسم** — «مقبلات» ⇔ «المقبلات». الأدقّ فتُجرَّب أولاً.
 * 2. **مطابقة المعنى** عبر القاموس — «فطور» ⇔ «إفطار».
 *
 * والمرحلة الثانية لا تقارن إلا حين يكون للطرفين تصنيف قانوني: اسمان لا
 * يعرفهما القاموس يبقيان منفصلين، وهذا صحيح — لا نخمّن على التاجر.
 */
export function matchKnownCategory(raw: string, known: string[]): string | null {
  const key = categoryKey(raw);
  if (!key) return null;
  const exact = known.find((k) => categoryKey(k) === key);
  if (exact) return exact;
  const canon = canonOf(raw);
  if (!canon) return null;
  return known.find((k) => canonOf(k)?.id === canon.id) ?? null;
}

/** التصنيفات الموجودة فعلاً في الأطباق، بلا تكرار. */
export function categoriesOf(dishes: Dish[]): string[] {
  const seen = new Map<string, string>();
  for (const d of dishes) {
    const c = d.category?.trim();
    if (!c) continue;
    const k = categoryKey(c);
    if (!seen.has(k)) seen.set(k, c);
  }
  return [...seen.values()];
}

/** `restaurants.category_order` → مصفوفة أسماء. أي تلف في القيمة = بلا ترتيب. */
export function parseCategoryOrder(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string" && v.trim() !== "");
  } catch {
    return [];
  }
}

export function serializeCategoryOrder(order: string[]): string | null {
  return order.length ? JSON.stringify(order) : null;
}

/**
 * يرتّب أسماء التصنيفات حسب ترتيب التاجر.
 *
 * ⚠️ **ترتيب التاجر يبقى فوق كل شيء** — من سحب تصنيفاته بيده لا يُدهس ترتيبه
 * بقاموس. القاموس يحكم ما لم يرتّبه أحد فقط.
 *
 * وما ليس في الترتيب المحفوظ يأتي بعده بـ`rank` القانوني (مقبلات ← رئيسية ←
 * حلويات ← مشروبات)، ثم أبجدياً لما لا يعرفه القاموس — فلا يختفي جديد ولا
 * يقفز إلى الأعلى.
 */
export function sortCategories(names: string[], order: string[]): string[] {
  const saved = new Map(order.map((name, i) => [categoryKey(name), i]));
  /** رتبة القاموس، و`Infinity` لما لا يعرفه فيهبط إلى القاع مرتّباً أبجدياً. */
  const canonRank = (n: string) => canonOf(n)?.rank ?? Infinity;
  return [...names].sort((a, b) => {
    const ra = saved.get(categoryKey(a));
    const rb = saved.get(categoryKey(b));
    if (ra !== undefined && rb !== undefined) return ra - rb;
    if (ra !== undefined) return -1;
    if (rb !== undefined) return 1;
    const ca = canonRank(a);
    const cb = canonRank(b);
    if (ca !== cb) return ca - cb;
    return a.localeCompare(b, "ar");
  });
}

/**
 * يدمج ترتيباً محفوظاً مع التصنيفات الحالية:
 * يُسقط ما لم يعد له أطباق، ويُلحق الجديد في آخر القائمة.
 */
export function reconcileOrder(order: string[], current: string[]): string[] {
  const currentKeys = new Set(current.map(categoryKey));
  const kept = order.filter((n) => currentKeys.has(categoryKey(n)));
  const keptKeys = new Set(kept.map(categoryKey));
  const added = current.filter((n) => !keptKeys.has(categoryKey(n)));
  return [...kept, ...added];
}

/** يحرّك عنصراً من موضع إلى آخر (للسحب وأزرار ▲▼). */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

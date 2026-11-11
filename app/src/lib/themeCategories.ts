/**
 * أقسام الطوابع حسب نوع المطعم — **مصدرٌ واحد** للوحة والهبوط و`/demo` (اختيار المالك ٢٠٢٦/١١/٠٧).
 *
 * ═══ لماذا ═══
 *
 * ستّةٌ وثلاثون طابعاً في شبكةٍ واحدة تُقرأ كتالوجاً لا اختياراً: صاحب الفوّال يمرّر
 * دفتر جلدٍ ومجلّة وكيس بنّ قبل أن يصل إلى صينيّته. والأقسام تختصر الطريق إلى
 * ثلاثةٍ أو أربعة تشبه مكانه، و«الكل» باقٍ بترتيب `themeSuggest` لمن أراد الكلّ.
 *
 * ═══ ما ليس هذا ═══
 *
 * - **ليس `suits`**: الشارة على الطابع (≤ ٢، نوعٌ من `aliasType` أو تخصّصٌ — ٠٩/١١) حكمٌ على الطابع
 *   «لمن يناسب»، وترتيب المُنتقي مبنيٌّ عليها. والقسم رفٌّ في المعرض: الطابع يقف
 *   على أكثر من رفّ («عصري» في المقاهي والبيتزا والبحري)، والرفّ ثلاثةٌ فأكثر.
 * - **لا يطبّق شيئاً**: فتح قسمٍ يعرض ولا يكتب طابعاً (قرار ٢٥/١٠).
 * - **ولا مفردات نوعٍ جديدة**: قسم التاجر من `suggestionKey` نفسه (`aliasType`
 *   والصفوف الفرعية والكافيه الشعبي) — جدولٌ من مفاتيحه إلى الأقسام لا قاموسٌ ثانٍ.
 *
 * كلّها خالصة: بلا حالة ولا شبكة ولا DOM. والأيقونة اسمٌ من `lib/icons.tsx` لا رسم.
 */
import type { DemoKind } from "./demoMenus";
import type { IconName } from "./icons";
import { norm } from "./starterMenus";
import {
  ARABIC_COFFEE, BAKERY, BREAKFAST, BREW_BAR, BROAST, BURGER, DRIVE_THRU, GRILL, ICE_CREAM, ITALIAN, PIZZA,
  POPULAR_CAFE, SHAWARMA, SPECIALTY, SUSHI, TEA_HOUSE, suggestionKey,
  type CafeFlavor,
} from "./themeSuggest";

export type ThemeCategoryId =
  | "cafe" | "tea" | "bakery" | "breakfast" | "fast" | "pizza"
  | "grill" | "shaabi" | "seafood" | "juice" | "upscale";

export interface ThemeCategory {
  id: ThemeCategoryId;
  name: string;
  nameEn: string;
  /** من `lib/icons.tsx` — لا إيموجي في الواجهة (§20). */
  icon: IconName;
  /** معرّفات `DESIGN_THEMES` **بترتيب المالك** — الأوّل بيت القسم. */
  themes: readonly string[];
  /** منيو `/demo` الذي يُعاين عليه القسم (`lib/demoMenus.ts`). */
  kind: DemoKind;
}

/**
 * بترتيب المالك: الأقسام، وطوابع كلّ قسم. و«باريستا» و«دلّة» (٠٧/١١) في المقاهي بعد بيتها
 * «محمصة» — أشكال القهوة الثلاثة أوّلاً — و«دلّة» أيضاً في الشعبي (الكافيه الشعبي يُفتح عليه
 * ومقترحه «دلّة») وفي «راقي ومناسبات» (القهوة العربية سيّدة المناسبات).
 *
 * و«شاي» (٠٧/١١، كرك وسماور) قسمٌ حادي عشر بعد المقاهي: الكشك ثم البيت ثم «دلّة» (المجلس
 * يقدّم الاثنين) ثم «ملصقات» (وُلدت لمحلّ الشاي الشبابي) — ومنيوه كشك الكرك، وقسم التاجر
 * «شاي» نوعاً (`aliasType`) أو بيتَ شاي. و«سماور» أيضاً في الشعبي بعد «دلّة» (جلسةٌ أرضية).
 *
 * ⚠️ **ولا شايَ على رفّ المقاهي**: رفّ الشاي يجاوره. وسماورٌ هناك كان سيجعل `?theme=samovar`
 * يُضيء «مقاهي» لا «شاي» (`demoCategoryOf` ⇐ أوّل رفٍّ فيه الطابع)، والكرك وحده يجعل المقاهي
 * سبعةً تترك طابعاً وحيداً في عمودين.
 *
 * و**القهوة الأربعة** (٠٩/١١، اختيار المالك): المقاهي ثمانية أشكالٍ للقهوة — محمصة · تقطير ·
 * لاتيه · باريستا · مطحنة · درايف · دلّة · لوحة حروف (صفّان تامّان على الأربعة) — وخرجت «مجلّة»
 * و«عصري» من رفّ المقاهي (باقيتان على البيتزا والراقي والبحري). و«لاتيه» أيضاً على المخابز
 * والحلويات (شارتها: كافيه الحلا)، و«درايف» على العصائر (شارتها: كشك الطريق).
 *
 * و**البيتزا الأربعة** (٠٩/١١، الموجة ٢): «بيتزا وإيطالي» ستّة — ريحان (بيته ومنيوه) · حطب · نابولي ·
 * علبة · شريحة · مجلّة — وخرج «عصري» منه (شارته «بحري» اليوم، ورفّه البحري). و«شريحة» و«علبة» على
 * رفّ الوجبات السريعة أيضاً، و«نابولي» على «راقي ومناسبات» (المطعم الإيطالي الأنيق).
 *
 * و**المشاوي الأربعة** (٠٩/١١، الموجة ٣): «مشاوي وشاورما» ستّة — جمر (بيته ومنيوه) · شاورما · أوجاق ·
 * ستيك · مدخنة · فاخر — وخرج «عسير» منه (باقٍ على الشعبي، ويُعاين على منيوه). و«شاورما» على رفّ
 * الوجبات السريعة ثانياً، و«ستيك» على «راقي ومناسبات» بعد «فاخر».
 *
 * و**حذف المالك «أوجاق» و«ستيك» و«مدخنة»** (١١/١١): «مشاوي وشاورما» جمر · شاورما · فاخر · عسير — عاد
 * «عسير» (شارته «مشويات» ثانيةً)، و«راقي ومناسبات» بلا «ستيك». و«سماش» و«سطل» (البرجر والبروست) بعد «صاج» على رفّ الوجبات السريعة.
 *
 * و**الموجة ب** (١١/١١): «مغرفة» (الآيسكريم) ثالثةَ «مخابز وحلويات» بعد «حلواني»؛ و«عيدان» (السوشي) ثانيَ «بحري»
 * بعد «مرفأ» وفي «راقي ومناسبات» بعد «فاخر». ولا رفَّ «آسيوي» بطابعٍ واحد — رفٌّ ثلاثةٌ فأكثر، والسوشي يقف حيث
 * يصدق: البحر والمطعم الراقي.
 */
export const THEME_CATEGORIES: readonly ThemeCategory[] = [
  { id: "cafe", name: "مقاهي", nameEn: "Cafés", icon: "dallah", themes: ["roastery", "v60", "latte", "barista", "grinder", "drive", "dallah", "letterboard"], kind: "cafe" },
  { id: "tea", name: "شاي", nameEn: "Tea", icon: "istikana", themes: ["karak", "samovar", "dallah", "sticker"], kind: "karak" },
  { id: "bakery", name: "مخابز وحلويات", nameEn: "Bakeries & sweets", icon: "croissant", themes: ["bakery", "patisserie", "scoop", "latte", "letterboard"], kind: "bakery" },
  { id: "breakfast", name: "فطور", nameEn: "Breakfast", icon: "egg", themes: ["breakfast", "dukkan", "bakery"], kind: "breakfast" },
  { id: "fast", name: "وجبات سريعة", nameEn: "Fast food", icon: "burger", themes: ["burger", "smash", "bucket", "shawarma", "neon", "receipt", "sticker", "slices", "pizzabox"], kind: "burger" },
  { id: "pizza", name: "بيتزا وإيطالي", nameEn: "Pizza & Italian", icon: "pizza", themes: ["pizza", "woodfire", "napoli", "pizzabox", "slices", "editorial"], kind: "pizza" },
  { id: "grill", name: "مشاوي وشاورما", nameEn: "Grills & shawarma", icon: "skewer", themes: ["grill", "shawarma", "dark-gold", "asir"], kind: "grill" },
  { id: "shaabi", name: "شعبي", nameEn: "Traditional", icon: "pot", themes: ["najdi", "dallah", "samovar", "dukkan", "breakfast", "asir"], kind: "shaabi" },
  { id: "seafood", name: "بحري", nameEn: "Seafood", icon: "fish", themes: ["harbor", "chopsticks", "modern", "dark-gold"], kind: "seafood" },
  { id: "juice", name: "عصائر", nameEn: "Juices", icon: "juice", themes: ["juice", "drive", "sticker", "neon"], kind: "juice" },
  { id: "upscale", name: "راقي ومناسبات", nameEn: "Fine dining & occasions", icon: "sparkle", themes: ["dark-gold", "chopsticks", "roshan", "dallah", "editorial", "napoli"], kind: "restaurant" },
];

/** أقلّ ما يكون في قسم — قسمٌ بطابعين قائمةٌ لا رفّ. */
export const MIN_PER_CATEGORY = 3;

export function categoryById(id: string | null | undefined): ThemeCategory | null {
  return THEME_CATEGORIES.find((c) => c.id === id) ?? null;
}

/**
 * مفتاح `SUGGESTED` ⇒ القسم الذي ينفتح أوّلاً. **كلّ مفتاحٍ مذكور** (الفحص يسقط
 * لمفتاحٍ بلا سطر)، و«مطعم» وحده `null`: هو سقوط `aliasType` لكلّ نصٍّ لا يُعرف
 * («مأكولات سعودية وعالمية» · `general`) — فلا نعرف نشاطه، فيفتح «الكل».
 *
 * والكافيه الشعبي ⇒ «شعبي» لا «مقاهي»: ترتيبه يبدأ بـ«دلّة» (`themeSuggest`، ٠٧/١١ — كان
 * «نجدي»)، و«دلّة» على رفّ الشعبي أيضاً؛ وشارة «يناسب نوع نشاطك» يجب أن تقع داخل القسم
 * المفتوح. وصفوف القهوة («قهوة عربية» · «قهوة مختصّة» · «قهوة مقطّرة» · «قهوة سريعة») ⇒ «مقاهي»،
 * والشاي وبيته ⇒ «شاي».
 */
export const CATEGORY_BY_KEY: Readonly<Record<string, ThemeCategoryId | null>> = {
  مطعم: null,
  كافيه: "cafe",
  [POPULAR_CAFE]: "shaabi",
  [ARABIC_COFFEE]: "cafe",
  [SPECIALTY]: "cafe",
  [BREW_BAR]: "cafe",
  [DRIVE_THRU]: "cafe",
  شاي: "tea",
  [TEA_HOUSE]: "tea",
  عصائر: "juice",
  "مطعم سريع": "fast",
  [PIZZA]: "pizza",
  [ITALIAN]: "pizza",
  مشويات: "grill",
  [GRILL]: "grill",
  [SHAWARMA]: "grill",
  [BROAST]: "fast",
  [BURGER]: "fast",
  // ١١/١١ (الموجة ب): الآيسكريم على «مخابز وحلويات»، والسوشي على «بحري».
  [ICE_CREAM]: "bakery",
  [SUSHI]: "seafood",
  شعبي: "shaabi",
  [BREAKFAST]: "breakfast",
  بحري: "seafood",
  "مخبز وحلويات": "bakery",
  [BAKERY]: "bakery",
};

/**
 * قسم التاجر من نوع نشاطه — `null` ⇒ «الكل». و`flavor` زرّ «مختصّ أم شعبي؟» حين
 * يضغطه: يبدّل القسم كما يبدّل الترتيب.
 */
export function categoryForType(rawType: string | null | undefined, flavor?: CafeFlavor): ThemeCategoryId | null {
  if (!norm(rawType ?? "")) return null;
  return CATEGORY_BY_KEY[suggestionKey(rawType, flavor)] ?? null;
}

/** طوابع القسم كائناتٍ بترتيبه — والمعرّف المجهول يُسقط (الفحص يمنعه أصلاً). */
export function themesOf<T extends { id: string }>(id: ThemeCategoryId | null, all: readonly T[]): T[] {
  const cat = categoryById(id);
  if (!cat) return [...all];
  const byId = new Map(all.map((t) => [t.id, t]));
  return cat.themes.map((t) => byId.get(t)).filter((t): t is T => !!t);
}

/**
 * قسم `/demo` من معاملَيه — **ولا يغيّر ما يعرضانه**: `?kind=` و`?theme=` يبقيان
 * يعملان كما كانا، وهذا يقرأ منهما أيّ رفٍّ يُضاء.
 *
 * ١. القسم الذي منيوه هذا النوع **وفيه** هذا الطابع (ما يكتبه الشريط نفسه).
 * ٢. القسم الذي هذا الطابع **أوّله** (بيته): `?theme=harbor` ⇒ «بحري».
 * ٣. أوّل قسمٍ فيه الطابع: `?theme=letterboard` ⇒ «مقاهي».
 * ٤. القسم الذي منيوه هذا النوع.
 *
 * و`theme` هنا الطابع المعروض فعلاً: المعامل، أو طابع منيو النوع إن جاء `kind` وحده
 * (`?kind=sweets` ⇒ «حلواني» ⇒ «مخابز وحلويات»). وبلا معاملٍ إطلاقاً لا قسم.
 */
export function demoCategoryOf(kind: string | null | undefined, theme: string | null | undefined): ThemeCategoryId | null {
  const t = theme ?? "";
  return (
    THEME_CATEGORIES.find((c) => c.kind === kind && c.themes.includes(t)) ??
    THEME_CATEGORIES.find((c) => c.themes[0] === t) ??
    THEME_CATEGORIES.find((c) => c.themes.includes(t)) ??
    THEME_CATEGORIES.find((c) => c.kind === kind)
  )?.id ?? null;
}

/**
 * عدد الأعمدة لشبكة من `n` بطاقة — **بلا بطاقةٍ وحيدة في آخر صفّ** قدر الإمكان.
 * `choices` بترتيب التفضيل: أوّل عددٍ **لا يزيد على البطاقات** ولا يترك واحدةً وحدها،
 * ثم أوّل ما لا يزيد عليها، ثم أصغرها. (ثلاثة من [4،3] ⇒ ثلاثة لا صفٌّ بخانةٍ فارغة ·
 * أربعة من [3،2] ⇒ اثنان · عشرون من [3،2] ⇒ ثلاثة: آخر صفٍّ اثنتان لا واحدة.)
 */
export function fillColumns<C extends number>(n: number, choices: readonly C[]): C {
  const fits = choices.filter((c) => c <= n);
  return fits.find((c) => n % c !== 1) ?? fits[0] ?? choices.reduce((a, b) => (b < a ? b : a));
}

/**
 * ترتيب الطوابع حسب نوع النشاط — **اقتراحٌ يرتّب، لا تطبيق**.
 *
 * ═══ لماذا ═══
 *
 * كلّ مطعمٍ جديد يبدأ «فاخر» (الافتراضي)، والمُنتقي يعرض الطوابع كلّها بترتيبٍ واحد
 * للجميع: صاحب المحمصة يرى أوّلاً أسود وذهباً للمشاوي. فالمُنتقي يضع أوّلاً ما
 * يناسب نوع نشاطه، وعليه شارة «يناسب نوع نشاطك».
 *
 * ═══ ما لا يفعله (قرار ٢٦/١٠) ═══
 *
 * - **لا يكتب طابعاً عند الإنشاء** ولا يطبّق شيئاً: قرار المعاينة قبل التطبيق
 *   (٢٥/١٠)، والطابع المكتوب عند الإنشاء يبقى كما هو.
 * - **لا مفردات جديدة**: النوع من `aliasType` نفسه (`lib/starterMenus.ts`)،
 *   والجدول هنا بمفاتيحه حرفياً — فحصٌ في `theme-suggest.test.ts` يسقط لو تباعدا.
 * - **لا عمود للكافيه**: «مختصّ أم شعبي» تلميحٌ من نصّ `restaurants.type` الحرّ
 *   (`cafeFlavor`)، والتاجر يبدّله بزرّ في المُنتقي ولا يُحفظ.
 *
 * كلّها دوالّ خالصة: بلا حالة ولا شبكة ولا DOM.
 */
import { aliasType, norm } from "./starterMenus";

export type CafeFlavor = "specialty" | "popular";

/** مفتاح الصفّ الإضافي: الكافيه الشعبي يُرتَّب كالمكان الشعبي لا كالمختصّ. */
export const POPULAR_CAFE = "كافيه شعبي";

/**
 * أوّل ثلاثة لكل نوع — نصّ النمو (`copy.md` §٢) حرفياً. والباقي بعدها بترتيب
 * `DESIGN_THEMES`. **قاعدتا الاتّساق** (يحرسهما الفحص):
 * ١. أوّل طابعٍ لكل نوع يحمل شارة ذلك النوع في `suits`.
 * ٢. كلّ شارةٍ على طابع تعني أنه بين الثلاثة الأولى لذلك النوع.
 */
export const SUGGESTED: Readonly<Record<string, readonly [string, string, string]>> = {
  مطعم: ["dark-gold", "modern", "editorial"],
  كافيه: ["roastery", "letterboard", "sticker"],
  [POPULAR_CAFE]: ["najdi", "sticker", "receipt"],
  عصائر: ["sticker", "modern", "neon"],
  // ٢٧/١٠: «دكّان» و«عسير» للشعبي — فخرج منه «فاتورة» و«روشان» وشارتاهما
  // (قاعدة الاتّساق ٢)، وبقي كلٌّ أوّلَ نوعه الآخر أو ثانيه. وعربة الطعام «سريع».
  "مطعم سريع": ["neon", "receipt", "dukkan"],
  مشويات: ["dark-gold", "najdi", "asir"],
  شعبي: ["najdi", "dukkan", "asir"],
  بحري: ["roshan", "dark-gold", "modern"],
  "مخبز وحلويات": ["editorial", "letterboard", "modern"],
};

/** الشارة التي يجب أن يحملها أوّل الصفّ — الكافيه الشعبي مكانٌ شعبي. */
export function badgeTypeOf(key: string): string {
  return key === POPULAR_CAFE ? "شعبي" : key;
}

/** كلماتٌ تجعل الكافيه شعبياً — بعد `norm` (التاء المربوطة هاء، والألف موحّدة). */
const POPULAR_HINTS = ["شعبي", "شعبيه", "تراثي", "عربي", "مجلس", "جمر"];

/**
 * مختصّ أم شعبي — من نصّ النوع **قبل** `aliasType`: «مقهى شعبي» يُردّ هناك إلى
 * «كافيه» (لأن «مقهي» أسبق في `HINTS`) فيضيع وصفه. والافتراض «مختصّ».
 */
export function cafeFlavor(rawType: string | null | undefined): CafeFlavor {
  const v = norm(rawType ?? "");
  return POPULAR_HINTS.some((h) => v.includes(h)) ? "popular" : "specialty";
}

/** مفتاح الترتيب لنوعٍ خام — و`flavor` يغلب التلميح حين يختاره التاجر بالزرّ. */
export function suggestionKey(rawType: string | null | undefined, flavor?: CafeFlavor): string {
  const type = aliasType(rawType);
  if (type !== "كافيه") return SUGGESTED[type] ? type : "مطعم";
  return (flavor ?? cafeFlavor(rawType)) === "popular" ? POPULAR_CAFE : "كافيه";
}

export interface ThemeOrder<T> {
  /** الطوابع كلّها: الثلاثة المقترحة أوّلاً، ثم الباقي بترتيبه الأصلي. */
  ordered: T[];
  /** معرّف الأوّل — عليه وحده شارة «يناسب نوع نشاطك». */
  suggested: string;
  /** مفتاح الصفّ في `SUGGESTED`. */
  key: string;
  /** للمُنتقي: سؤال «مختصّ أم شعبي؟» لا يظهر إلا للكافيه. */
  isCafe: boolean;
}

/** يرتّب الطوابع لنوع النشاط — لا يحذف طابعاً ولا يضيف. */
export function rankThemes<T extends { id: string }>(
  themes: readonly T[],
  rawType: string | null | undefined,
  flavor?: CafeFlavor
): ThemeOrder<T> {
  const key = suggestionKey(rawType, flavor);
  const top = SUGGESTED[key];
  const rank = (id: string) => {
    const i = top.indexOf(id);
    return i < 0 ? top.length : i;
  };
  // `sort` مستقرّ: ما ليس بين الثلاثة يبقى بترتيبه الأصلي.
  const ordered = [...themes].sort((a, b) => rank(a.id) - rank(b.id));
  return { ordered, suggested: top[0], key, isCafe: aliasType(rawType) === "كافيه" };
}

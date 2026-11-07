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
 * - **ولا نوعٌ جديد للمخبز ولا للفطور** (٠٧/١١): صفّان فرعيّان (`SUB_ROWS`) يقرآن
 *   نصّ النوع نفسه كما يقرؤه `cafeFlavor` — «مخبز تميس» و«فطائر» و«فول وتميس» —
 *   وشارتاهما من المفردات القائمة (`badgeTypeOf`).
 *
 * كلّها دوالّ خالصة: بلا حالة ولا شبكة ولا DOM.
 */
import { aliasType, norm } from "./starterMenus";

export type CafeFlavor = "specialty" | "popular";

/** مفتاح الصفّ الإضافي: الكافيه الشعبي يُرتَّب كالمكان الشعبي لا كالمختصّ. */
export const POPULAR_CAFE = "كافيه شعبي";

/**
 * صفّان فرعيّان (٠٧/١١) — المفتاح هو ما يُعرض للتاجر («رتّبناها حسب نوع نشاطك
 * (مخبز ومعجّنات)»)، والشارة التي يحملها أوّلهما من المفردات القائمة.
 */
export const BAKERY = "مخبز ومعجّنات";
export const BREAKFAST = "فطور شعبي";

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
  // ٠٣/١١: «عصّارة» و«مرفأ» و«حلواني» أوّلَ أنواعها — وما كان أوّلاً صار ثانياً
  // بشارته، وخرج الثالث القديم (بلا شارةٍ لذلك النوع، فلا تُمسّ قاعدة ٢).
  عصائر: ["juice", "sticker", "modern"],
  // ٢٧/١٠: «دكّان» و«عسير» للشعبي — فخرج منه «فاتورة» و«روشان» وشارتاهما
  // (قاعدة الاتّساق ٢)، وبقي كلٌّ أوّلَ نوعه الآخر أو ثانيه. وعربة الطعام «سريع».
  // ٠٧/١١: «صاج» أوّلَ البرجر والوجبات السريعة (و«برجر» و«وجبات سريعة» كلاهما
  // «مطعم سريع» في `aliasType`)، ونيون وفاتورة بعده بشارتيهما، وخرج «دكّان» من
  // الصفّ وشارتُه معه (قاعدة ٢) — وبقي ثاني الشعبي.
  "مطعم سريع": ["burger", "neon", "receipt"],
  مشويات: ["dark-gold", "najdi", "asir"],
  // ٠٧/١١: «فوّال» ثالثَ الشعبي — فخرج «عسير» وشارتُه (قاعدة ٢)، وبقي ثالثَ المشويات.
  شعبي: ["najdi", "dukkan", "breakfast"],
  [BREAKFAST]: ["breakfast", "dukkan", "najdi"],
  بحري: ["harbor", "roshan", "dark-gold"],
  // ٠٧/١١: «حلواني» أوّلُ الحلويات كما كان، و«فرن» ثانيه — وخرجت «لوحة حروف» وشارتها
  // (قاعدة ٢) وبقيت ثانيةَ الكافيه. والمخبز نفسه (`BAKERY`) يبدأ بـ«فرن».
  "مخبز وحلويات": ["patisserie", "bakery", "editorial"],
  [BAKERY]: ["bakery", "patisserie", "letterboard"],
};

/** الشارة التي يجب أن يحملها أوّل الصفّ — الكافيه الشعبي مكانٌ شعبي، والفطور كذلك. */
export function badgeTypeOf(key: string): string {
  if (key === POPULAR_CAFE || key === BREAKFAST) return "شعبي";
  if (key === BAKERY) return "مخبز وحلويات";
  return key;
}

/**
 * الصفّان الفرعيّان: يُقرآن من النصّ الحرّ **بعد** `norm`، وداخل نوعٍ يحتملهما
 * وحده — «فطائر» و«فول» لا كلمة لهما في `aliasType` فيصيران «مطعم»، و«مخبز» هناك
 * «مخبز وحلويات». والفطور قبل المخبز: «تميس» خبزٌ يُؤكل فطوراً، و«مخبز تميس» مخبزٌ
 * (نوعه «مخبز وحلويات» فلا يدخل صفّ الفطور أصلاً).
 *
 * ⚠️ **الاسم المجرّد لنوعٍ قائم لا يدخل صفّاً فرعياً**: «مخبز وحلويات» كما يختاره
 * التاجر من القائمة يبقى على صفّه («حلواني» أوّلاً) — فيه «مخبز» حرفاً ولم يقل شيئاً
 * أكثر ممّا قاله النوع.
 */
interface SubRow {
  key: string;
  /** الأنواع التي يحتمله نصّها — من مفردات `aliasType`. */
  within: readonly string[];
  /** يكفي أن يحتويها النصّ. */
  hints: readonly string[];
  /** كلمةٌ كاملة لا جزءُ كلمة: «فرن» في «مطعم فرنسي» ليس فرناً. */
  words?: readonly string[];
}

const SUB_ROWS: readonly SubRow[] = [
  {
    key: BREAKFAST,
    within: ["شعبي", "مطعم"],
    hints: ["فطور", "افطار", "فول", "فوال", "تميس", "مطبق", "breakfast"],
  },
  {
    key: BAKERY,
    within: ["مخبز وحلويات", "مطعم"],
    hints: ["مخبز", "مخابز", "خباز", "معجنات", "فطائر", "فطاير", "كرواسون", "bakery", "bakehouse"],
    words: ["فرن", "الفرن", "افران", "الافران"],
  },
];

function subRowOf(rawType: string | null | undefined, type: string): string | null {
  const v = norm(rawType ?? "");
  if (!v || v === norm(type)) return null;
  const words = v.split(" ");
  const row = SUB_ROWS.find(
    (r) => r.within.includes(type) && (r.hints.some((h) => v.includes(h)) || !!r.words?.some((w) => words.includes(w)))
  );
  return row?.key ?? null;
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
  if (type === "كافيه") return (flavor ?? cafeFlavor(rawType)) === "popular" ? POPULAR_CAFE : "كافيه";
  return subRowOf(rawType, type) ?? (SUGGESTED[type] ? type : "مطعم");
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

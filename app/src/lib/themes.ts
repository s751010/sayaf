/**
 * طوابع المنيو العام.
 *
 * كان كل «ثيم» لوحة ألوان فحسب — ثمانية ثيمات بتخطيط واحد حرفياً، فالفرق
 * يُقرأ ولا يُرى. الآن الثيم **طابع كامل**: زخرفة، شكل ترويسة، تخطيط أطباق،
 * فواصل أقسام، واقتران خطوط. `vars` تُطبَّق على جذر الصفحة وتُقرأ بـ`var(--m-*)`،
 * و`design` تقرأها المكوّنات لتغيّر البنية لا اللون.
 *
 * يُخزَّن في `menus.theme` (نص واحد) — انظر `getTheme` لصيغ التخزين المدعومة.
 */
import type { PatternId } from "./patterns";

/**
 * شكل الترويسة — أكثر ما يمنح المنيو شخصيته من أول نظرة.
 *
 * الأربعة الأولى **واجهة متجر** (غلافٌ والشعار على حافّته)، والخمسة بعدها
 * ترويساتٌ بنيتها مختلفة كلّياً — انظر `SkinHeads.tsx`:
 * `paper` رأس فاتورة · `letterboard` لوحة حروف معلّقة · `poster` ملصقٌ
 * بشريط أقسامٍ يجري · `sign` لافتة نيون على جدار طوب · `masthead` ترويسة
 * مجلّة · `arcade` أقواس روشان.
 */
export type HeaderShape =
  | "arch" | "band" | "frame" | "soft"
  | "paper" | "letterboard" | "poster" | "sign" | "masthead" | "arcade";
/**
 * تخطيط الأطباق — هذا ما يجعل الفرق بين الطوابع يُرى لا يُقرأ.
 * `deck` بطاقاتٌ تُسحب أفقياً لكل قسم، تكبر حين تتوسّط الشاشة.
 */
export type DishLayout = "grid" | "list" | "showcase" | "deck";
export type HeadingStyle =
  | "ornament" | "rule" | "plain"
  | "stars" | "letters" | "poster" | "neon" | "numeral" | "cartouche";
/** شكل صورة الطبق — دائري للكافيهات، مربّع حادّ للمينيمال، وقوسُ نافذة للروشان. */
export type ImageShape = "rounded" | "square" | "circle" | "arch";
/**
 * **الخامة الكاملة** للطابع — صنفٌ على جذر المنيو (`m-skin-*`) يقرؤه
 * `styles/menu-skins.css`: الملمس (ورق، لبّاد، طوب، بلاط)، والحواف (فاتورة
 * ممزّقة، إطار خشب، ملصقٌ بحدٍّ أسود)، والحركة الخاصّة بالطابع (طباعة،
 * اشتعال، ملصقاتٌ تُلصق، انفتاح رواشين). `store` واجهة المتجر بلا شيء منها.
 */
export type MenuSkin = "store" | "receipt" | "letterboard" | "sticker" | "neon" | "editorial" | "roshan";
/** كيف يُقدَّم السعر: نصّاً، أو شارة ملوّنة، أو خطّاً منقّطاً يقود إليه. */
export type PriceStyle = "plain" | "badge" | "leader";
/** الفاصل بين صفوف القائمة الرأسية. */
export type RowDivider = "none" | "dots" | "rule";

/**
 * ── محاور الخامة الأربعة ──────────────────────────────────────────────
 *
 * المحاور التسعة قبلها كلها **بنيوية**: تخطيط، وشكل ترويسة، وشكل صورة، وإيقاع.
 * فالفرق بين «حصري فاخر» و«زمردي فاخر» يُرى في البنية ولا يُحسّ في الخامة —
 * كلاهما أسطح مسطّحة بحدّ بعرض بكسل، والفخامة في المطبوع تأتي من العمق واللمعة
 * وثقل الحافة لا من اللون وحده.
 *
 * وهذه الأربعة **لا تحمل لوناً**: قيمها تُشتقّ في CSS بـ`color-mix()` من
 * `--m-*` القائمة، فترتفع الطوابع الستّة عشر بلا أن يتبدّل لون واحد على منيو
 * تاجر يعمل الآن (§18).
 */
/** عمق السطح — ظلال متعدّدة الطبقات مشتقّة من لون نصّ الطابع. */
export type SurfaceDepth = "flat" | "raised" | "float";
/** مسحة ضوء بطيئة تعبر أسطح التمييز. `silk` أخفت وأبطأ من `gold`. */
export type Sheen = "none" | "gold" | "silk";
/** دخول بطاقات الأطباق مع التمرير — CSS خالص، بلا مراقب تقاطع. */
export type Entrance = "none" | "fade" | "rise" | "unfold";
/** معالجة الحافة: خيط شعري داخلي، أو حدّ مذهّب بتدرّج. */
export type EdgeTreatment = "plain" | "hairline" | "gilded";

export interface MenuDesign {
  skin: MenuSkin;
  pattern: PatternId;
  /** شفافية الزخرفة — تبقى منخفضة كي لا تزاحم قراءة النص فوقها. */
  patternOpacity: number;
  header: HeaderShape;
  layout: DishLayout;
  heading: HeadingStyle;
  density: "cozy" | "airy";
  /**
   * ثلاثة محاور أُضيفت لاحقاً. سببها أن الطوابع كانت تتمايز بخمسة حقول فقط،
   * وهذا سقفٌ يجعل أي طابع جديد إعادةَ توزيعٍ لنفس الخمسة. وكلٌّ منها له قيمة
   * تحفظ الشكل القائم، فلا يتغيّر منيو تاجر لم نقصد تغييره.
   */
  imageShape: ImageShape;
  priceStyle: PriceStyle;
  divider: RowDivider;
  /** محاور الخامة — انظر التعليق فوق أنواعها. */
  depth: SurfaceDepth;
  sheen: Sheen;
  entrance: Entrance;
  edge: EdgeTreatment;
}

export interface MenuTheme {
  id: string;
  name: string; // التسمية العربية في المُنتقي
  /** سطر يشرح الطابع للتاجر وهو يختار. */
  tagline: string;
  vars: Record<string, string>;
  design: MenuDesign;
}

/**
 * سلّم المسافات — إيقاع رأسي واحد لكل المنيو.
 *
 * كانت المسافات إحدى عشرة قيمة مزاجية (`mt-5, mt-7, mt-6, pt-10, mt-8…`) بلا
 * علاقة بينها. العين تبحث عن تكرار منتظم لتقرأ الصفحة «مرتّبة»، فلا تجده
 * فتقرأها مبعثرة — حتى لو كان كل عنصر جميلاً وحده.
 */
export const RHYTHM = {
  cozy: { block: "mt-6", section: "pt-9", gap: "gap-3", head: "mb-3" },
  airy: { block: "mt-8", section: "pt-14", gap: "gap-5", head: "mb-5" },
} as const;

/**
 * الأساس الذي تُبنى عليه الطوابع — قيمه هي **الشكل القائم اليوم حرفياً**، فأي
 * طابع لا يذكر حقلاً يبقى كما كان. وُجد لأن `MenuDesign` صار تسعة حقول، وتكرارها
 * كاملةً في كل طابع يخفي ما يميّزه وسط ما يشترك فيه.
 */
const BASE_DESIGN: MenuDesign = {
  skin: "store",
  pattern: "none",
  patternOpacity: 0,
  header: "soft",
  layout: "grid",
  heading: "plain",
  density: "cozy",
  imageShape: "rounded",
  priceStyle: "plain",
  divider: "rule",
  depth: "flat",
  sheen: "none",
  entrance: "none",
  edge: "plain",
};

const design = (over: Partial<MenuDesign> = {}): MenuDesign => ({ ...BASE_DESIGN, ...over });

/**
 * خطوط الطوابع.
 *
 * كايرو وطجوال ثابتان في الحزمة (واجهة التطبيق كلها عليهما)، وما عداهما
 * **يُحمَّل عند الطلب** عبر `lib/fonts.ts` — فطابعٌ بخطّ عارف رقعة لا يكلّف
 * زبونَ مطعمٍ آخر بايتاً واحداً.
 */
const FONT = {
  cairo: "var(--font-cairo)",
  tajawal: "var(--font-tajawal)",
  reem: "var(--font-reem)",
  amiri: "var(--font-amiri)",
  kufi: "var(--font-noto-kufi)",
  almarai: "var(--font-almarai)",
  ruqaa: "var(--font-ruqaa)",
  lalezar: "var(--font-lalezar)",
};

/**
 * ⚠️ **اقتران خطّين: عرضٌ للعناوين وقراءةٌ للأصناف.**
 *
 * `--m-font` كان يحكم كل شيء — اسم المطعم وعناوين الأقسام وأسماء الأطباق معاً.
 * فلمّا جُرِّب خطّ رقعة على الطابع الملكي خرج اسم المطعم بديعاً و**أسماء الأطباق
 * شبه غير مقروءة**: الرقعة خطّ عرضٍ مترابط لا خطّ نصٍّ يُمسح بالعين في مطعم
 * مُضاء بخفوت. والمنيو يُقرأ قبل أن يُعجب.
 *
 * فصار `--m-display` للعناوين وحدها، ويسقط إلى `--m-font` لكل طابع لا يذكره —
 * فلا يتغيّر شيء لمن لم يطلب اقتراناً.
 */

/**
 * الطوابع المصمَّمة — لكل واحد هوية كاملة لا لون.
 * تأتي أولاً في المُنتقي لأنها ما نريد أن يختاره التاجر.
 */
/**
 * ═══ ستّة طوابع لا واحد وعشرون (٢٠٢٦/١٠/٢١) ═══
 *
 * كانت ٢١ طابعاً، كثيرٌ منها **لونٌ آخر للبنية نفسها** («زمردي» و«أرجواني»
 * و«قهوة» كلّها ليلي ذهبي بأرضية ملوّنة). والتاجر أمام ٢١ خياراً لا يختار
 * أفضلها — يتردّد، أو يأخذ الأوّل. وكلّ طابعٍ ضعيفٍ في القائمة يُضعف الباقي.
 *
 * ═══ ثم ثمانية: خمسة «مفاهيم» لا ألوان (٢٠٢٦/١٠/٢١) ═══
 *
 * الستّة كانت كلّها **واجهة متجر واحدة** بألوانٍ وزخارف مختلفة — جميلة، لكنها
 * الشكل الذي يعرفه السوق. فبقي منها ثلاثة (فاخر · عصري · تراثي)، وخرج ثلاثة
 * كانت ألواناً أكثر منها أفكاراً، وجاء مكانها خمسة **لكلٍّ منها بنيةٌ لم تظهر
 * في منيو رقمي قبل**: فاتورةٌ تُطبع، ولافتة نيون تشتعل، ومجلّة بأرقام أقسام،
 * ونوافذ روشان تنفتح. وكلّها تلبس لون علامة التاجر وشعاره.
 *
 * ═══ ثم تسعة: المقهى ومحلّ الشاي أوّلاً (٢٠٢٦/١٠/٢١) ═══
 *
 * أغلب من يشتري المنتج **كافيهات ومحلات شاي**. والسبّورة (الطابع الخامس الأوّل)
 * جاءت طباشيرَ ورقعةً تُقرأ قديمة، فصارت **لوحة حروف**: اللوحة نفسها كما
 * يعلّقها الكافيه اليوم فوق الكاونتر. وجاء معها **ملصقات** لمحلّ الشاي والكافيه
 * الشبابي — حدٌّ أسود غليظ وظلٌّ مصمت، وغلافٌ لكلّ قسم من صور أطباقه.
 *
 * ⚠️ والطوابع المحذوفة **لا تنكسر**: `LEGACY` يردّ كلّ معرّف قديم إلى أقرب
 * طابع **بلون تمييزه الأصلي** — فمنيو «أرجواني ملكي» يصير «فاخر» بذهبه، لا
 * منيواً بلا طابع. والقرار مكتوب في `docs/design.md` §18.
 */
export const DESIGN_THEMES: MenuTheme[] = [
  {
    id: "dark-gold",
    name: "فاخر",
    tagline: "للمشاوي والمطاعم الراقية — أسود دافئ وذهب",
    // ⚠️ الألوان كما كانت حرفياً: هذا شكل المنتج لمن لم يختر (§18).
    vars: {
      "--m-bg": "#141210",
      "--m-bg-2": "#1b1813",
      "--m-surface": "rgba(255,255,255,.045)",
      "--m-text": "#faf6ee",
      "--m-muted": "#9a8f7c",
      "--m-accent": "#d4a843",
      "--m-accent-2": "#f0c96a",
      "--m-on-accent": "#141210",
      "--m-border": "rgba(212,168,67,.20)",
      "--m-font": FONT.kufi,
      "--m-radius": "1rem",
    },
    design: design({
      pattern: "girih",
      patternOpacity: 0.03,
      header: "frame",
      heading: "ornament",
      density: "airy",
      imageShape: "rounded",
      depth: "float", sheen: "gold", entrance: "rise", edge: "gilded",
    }),
  },
  {
    id: "receipt",
    name: "فاتورة",
    tagline: "للمطاعم الشعبية والفود ترك — منيو يُطبع أمام زبونك كفاتورة",
    vars: {
      // ‏`--m-page` الطاولة تحت الورقة: الوحيد الذي تختلف أرضيّته عن صفحته.
      "--m-page": "#24221f",
      "--m-bg": "#fbfaf5",
      "--m-bg-2": "#f0ede4",
      "--m-surface": "#fbfaf5",
      "--m-text": "#1c1a17",
      "--m-muted": "#5d5850",
      // أحمر الختم — وحده ما يُطبع بلونٍ على ورقٍ حراري.
      "--m-accent": "#c8322a",
      "--m-accent-2": "#e0645c",
      "--m-on-accent": "#ffffff",
      "--m-border": "rgba(28,26,23,.30)",
      "--m-font": FONT.tajawal,
      "--m-display": FONT.cairo,
      "--m-radius": "0.25rem",
    },
    design: design({
      skin: "receipt",
      header: "paper",
      layout: "list",
      heading: "stars",
      imageShape: "square",
      priceStyle: "leader",
      divider: "dots",
    }),
  },
  {
    id: "neon",
    name: "نيون",
    tagline: "للبرجر والسهر — لافتة نيون تشتعل باسم مطعمك",
    vars: {
      "--m-bg": "#0b0a10",
      "--m-bg-2": "#14121c",
      // سطحٌ مُصمت: الشفّاف فوق الأسود يُطفئ توهّج الحواف.
      "--m-surface": "#16141f",
      "--m-text": "#f6f4ff",
      "--m-muted": "#a9a6c3",
      "--m-accent": "#ff3d81",
      // السماوي نقيض الوردي في أنابيب النيون — للسعر وحلقة الشعار.
      "--m-accent-2": "#3df5ff",
      "--m-on-accent": "#0b0a10",
      "--m-border": "rgba(255,61,129,.26)",
      "--m-font": FONT.cairo,
      "--m-display": FONT.reem,
      "--m-radius": "1rem",
    },
    design: design({
      skin: "neon",
      header: "sign",
      layout: "deck",
      heading: "neon",
      divider: "none",
    }),
  },
  {
    id: "sticker",
    name: "ملصقات",
    tagline: "لمحلات الشاي والكافيهات الشبابية — ملصقاتٌ جريئة بحدٍّ أسود وحركةٌ مرحة",
    vars: {
      // ورقٌ زبديّ دافئ، وحبرٌ أسود لكلّ حدّ، وطماطميّ ونعناعيّ للملصقات.
      "--m-bg": "#fff4e2",
      "--m-bg-2": "#ffe6bf",
      "--m-surface": "#ffffff",
      "--m-text": "#151413",
      "--m-muted": "#5b554b",
      "--m-accent": "#ff5a36",
      "--m-accent-2": "#7bd3b4",
      // ‏#ff5a36 مع الأبيض 3.0:1 ومع الحبر 5.9 — `bestOnAccent` تختار الحبر.
      "--m-on-accent": "#151413",
      // الحدّ **حبرٌ مصمت** لا خيطٌ شفّاف: الحدّ الأسود الغليظ هو الطابع نفسه.
      "--m-border": "#151413",
      "--m-font": FONT.almarai,
      "--m-display": FONT.lalezar,
      "--m-radius": "1.1rem",
    },
    design: design({
      skin: "sticker",
      header: "poster",
      heading: "poster",
      imageShape: "square",
      priceStyle: "badge",
      divider: "none",
    }),
  },
  {
    id: "letterboard",
    name: "لوحة حروف",
    tagline: "للكافيهات والمخابز — لوحة الحروف المعلّقة فوق الكاونتر، باسمك وأسعارك",
    vars: {
      // ‏`--m-page` جدار الكافيه (بلاطٌ أبيض)، و`--m-bg` لبّاد اللوحة نفسها.
      "--m-page": "#ebe7df",
      "--m-bg": "#1b1a19",
      "--m-bg-2": "#242321",
      "--m-surface": "rgba(255,255,255,.035)",
      "--m-text": "#f4f2ec",
      "--m-muted": "#b5b2ab",
      // حروفٌ ملوّنة كالتي تُباع مع اللوحة — وردي للأسعار والعناوين.
      "--m-accent": "#ff9eb5",
      "--m-accent-2": "#ffd36e",
      "--m-on-accent": "#1b1a19",
      "--m-border": "rgba(244,242,236,.16)",
      "--m-font": FONT.almarai,
      "--m-display": FONT.almarai,
      "--m-radius": "0.4rem",
    },
    design: design({
      skin: "letterboard",
      header: "letterboard",
      layout: "list",
      heading: "letters",
      density: "airy",
      imageShape: "rounded",
      priceStyle: "leader",
      divider: "none",
    }),
  },
  {
    id: "editorial",
    name: "مجلّة",
    tagline: "للبرنش والحلويات — منيو بإخراج مجلّة فاخرة",
    vars: {
      "--m-bg": "#f3efe6",
      "--m-bg-2": "#e8e2d5",
      "--m-surface": "#faf7f0",
      "--m-text": "#161513",
      "--m-muted": "#57524a",
      "--m-accent": "#a3271c",
      "--m-accent-2": "#d4775a",
      "--m-on-accent": "#ffffff",
      "--m-border": "rgba(22,21,19,.18)",
      "--m-font": FONT.almarai,
      "--m-display": FONT.amiri,
      // ‏`0px` لا `0`: يدخل `calc(var(--m-radius) * 1.4)`، و`calc(0 * 1.4)`
      // عددٌ بلا وحدة فيُبطل `border-radius` كلّه.
      "--m-radius": "0px",
    },
    design: design({
      skin: "editorial",
      header: "masthead",
      layout: "list",
      heading: "numeral",
      density: "airy",
      imageShape: "square",
      entrance: "rise",
    }),
  },
  {
    id: "roshan",
    name: "روشان",
    tagline: "للمطبخ الحجازي والبحري — أقواس جدّة القديمة ورواشينها",
    vars: {
      // حجر المنقبة الجيري، وأخضر الرواشين المدهونة، وطين القلل.
      "--m-bg": "#f6efe4",
      "--m-bg-2": "#ece2d2",
      "--m-surface": "#fffaf3",
      "--m-text": "#2a1c11",
      "--m-muted": "#6b5543",
      "--m-accent": "#0f6b66",
      "--m-accent-2": "#c8743f",
      "--m-on-accent": "#ffffff",
      "--m-border": "rgba(42,28,17,.14)",
      "--m-font": FONT.almarai,
      "--m-display": FONT.amiri,
      "--m-radius": "0.9rem",
    },
    design: design({
      skin: "roshan",
      pattern: "mashrabiya",
      patternOpacity: 0.03,
      header: "arcade",
      heading: "cartouche",
      imageShape: "arch",
      depth: "raised", edge: "hairline",
    }),
  },
  {
    id: "najdi",
    name: "تراثي",
    tagline: "للمطبخ السعودي — طين نجد وفيروزي الأبواب ونسيج السدو",
    vars: {
      // أرضية رملية فاتحة كجدران الطين، والفيروزي لون أبواب نجد ونوافذها.
      "--m-bg": "#f4e8d5",
      "--m-bg-2": "#e9d9be",
      "--m-surface": "#fffaf1",
      "--m-text": "#33261a",
      "--m-muted": "#7a6550",
      "--m-accent": "#1f7a72",
      "--m-accent-2": "#c8912f",
      "--m-on-accent": "#ffffff",
      "--m-border": "rgba(51,38,26,.14)",
      "--m-font": FONT.almarai,
      "--m-display": FONT.reem,
      "--m-radius": "0.6rem",
    },
    design: design({
      pattern: "sadu",
      // ‏.035 لا .06: النسيج على الصفحة كلّها كان يزاحم نصّ البطاقات فوقه.
      patternOpacity: 0.035,
      header: "band",
      heading: "ornament",
      depth: "raised", entrance: "rise", edge: "hairline",
    }),
  },
  {
    id: "modern",
    name: "عصري",
    tagline: "للكافيهات والمخابز — أبيض نظيف يُبرز صورك ولون علامتك",
    vars: {
      "--m-bg": "#ffffff",
      "--m-bg-2": "#f4f4f5",
      "--m-surface": "#ffffff",
      "--m-text": "#111113",
      "--m-muted": "#63636b",
      "--m-accent": "#111113",
      "--m-accent-2": "#3f3f46",
      "--m-on-accent": "#ffffff",
      "--m-border": "rgba(0,0,0,.08)",
      "--m-font": FONT.cairo,
      "--m-radius": "1rem",
    },
    design: design({
      depth: "raised", entrance: "fade", edge: "hairline",
    }),
  },
];

/** لا مجموعة «كلاسيكية» بعد اليوم — بقي الاسم لأن صفحات اللوحة تستورده. */
export const THEMES: MenuTheme[] = [];

/** كل ما يظهر في المُنتقي. */
export const ALL_THEMES: MenuTheme[] = DESIGN_THEMES;

const DEFAULT_THEME = DESIGN_THEMES[0];

/**
 * كل معرّف خرج من القائمة ⇒ أقرب طابعٍ باقٍ **بلون تمييزه الأصلي**.
 *
 * القيمة بصيغة التخزين نفسها (`طابع:#لون`)، و`getTheme` يحلّلها كما يحلّل
 * ما في القاعدة. ولون التاجر إن كان قد اختاره (`royal:#123456`) يغلب لون
 * القديم. والفاتح يبقى فاتحاً والداكن داكناً، فلا ينقلب منيو أحد ليلاً.
 *
 * الأسماء الأولى (`green` · `cream` …) أقدم من كل الطوابع — باقية في صفوف
 * إنتاج قديمة.
 */
const LEGACY: Record<string, string> = {
  // خرجت يوم دخلت (٢٠٢٦/١٠/٢١) ⇒ الطابع الذي ورث فكرتها.
  specialty: "modern:#3f6f52",
  urban: "neon:#ff5a1f",
  marble: "editorial:#8a6a3f",
  // وُلدت وخرجت في اليوم نفسه: السبّورة صارت لوحة حروف — اللوحة نفسها بشكلٍ
  // يعرفه الكافيه اليوم.
  chalk: "letterboard",
  // الأقدم ⇒ أقرب طابعٍ **محايد** بلونه: منيو عاملٌ لا يستيقظ على لافتة نيون.
  luxe: "dark-gold:#c9a227",
  hijazi: "dark-gold:#e07a5f",
  oud: "dark-gold:#b8873b",
  emerald: "dark-gold:#d9b65f",
  royal: "dark-gold:#d4af37",
  coffee: "dark-gold:#c89f6a",
  majlis: "dark-gold:#cf9445",
  crimson: "dark-gold:#e0533d",
  ocean: "dark-gold:#2dd4bf",
  qatt: "modern:#c0392b",
  bahri: "modern:#155e75",
  minimal: "modern",
  sahra: "modern:#a9744a",
  lulu: "modern:#5f6b7a",
  "light-luxe": "modern:#b8902f",
  green: "dark-gold:#d9b65f",
  cream: "modern:#b8902f",
  light: "modern:#b8902f",
  white: "modern:#b8902f",
  dark: "dark-gold",
  gold: "dark-gold",
  purple: "dark-gold:#d4af37",
  red: "dark-gold:#e0533d",
  blue: "dark-gold:#2dd4bf",
  brown: "dark-gold:#c89f6a",
  mono: "modern",
};

/**
 * الثيم المخصّص بلون العلامة.
 *
 * يُخزَّن في `menus.theme` بالصيغة `custom:#RRGGBB` — لا عمود جديد، ويمرّ عبر
 * نفس مسار الحفظ الموجود (`applyThemeToAllMenus`). اللون نفسه يُحفظ أيضاً في
 * `restaurants.cover_color` (عمود موجود ويحمل ألوان علامات فعلية في الإنتاج)
 * كي تظهر تدرّجات الترويسة بلون التاجر.
 */
export const CUSTOM_PREFIX = "custom:";

export function customThemeId(hex: string): string {
  return `${CUSTOM_PREFIX}${normalizeHex(hex)}`;
}

/** يستخرج لون الثيم المخصّص من معرّف مخزَّن، أو `null` لثيم عادي. */
export function customHexOf(id: string | null | undefined): string | null {
  if (!id?.startsWith(CUSTOM_PREFIX)) return null;
  const hex = id.slice(CUSTOM_PREFIX.length);
  return isHex(hex) ? normalizeHex(hex) : null;
}

export function isHex(v: string): boolean {
  return /^#?[0-9a-fA-F]{6}$/.test(v.trim());
}

export function normalizeHex(v: string): string {
  const h = v.trim().replace(/^#/, "").toLowerCase();
  return `#${h}`;
}

function rgb(hex: string): [number, number, number] {
  const h = normalizeHex(hex).slice(1);
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** سطوع نسبي (WCAG) — يقرّر هل النص على اللون فاتح أم غامق. */
function luminance(hex: string): number {
  const srgb = rgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

/** نسبة تباين WCAG بين لونين. */
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * لون النص فوق لون التمييز — **الأعلى تبايناً** بين الفاتح والغامق.
 *
 * كان الاختيار بعتبة سطوع ثابتة (`luminance > 0.45`)، وهي تفشل على الألوان
 * المتوسطة: المرجاني `#e07a5f` سطوعه دون العتبة فيُختار له نص أبيض بتباين
 * 2.95:1 — دون حدّ WCAG AA. المقارنة الفعلية تختار الغامق فيرتفع إلى 6.9:1.
 */
/**
 * لون آمن لوحدات كود QR على أرضية فاتحة.
 *
 * ⚠️ **هذه ليست مسألة ذوق.** ماسحات QR تقرأ التباين لا اللون، وتحتاج نسبة
 * عالية بين الوحدة والأرضية. فلون علامة فاتح (ذهبي، أصفر، ليموني) يُنتج
 * كوداً يبدو أنيقاً على الشاشة **ولا يُمسح** — والتاجر يكتشف ذلك بعد أن
 * يطبع خمسين بطاقة ويضعها على الطاولات.
 *
 * فاللون يُغمَّق تدريجياً حتى يبلغ ٧:١ مع الأرضية (أعلى من حدّ WCAG AAA
 * للنص، لأن الماسح أقلّ تسامحاً من العين). وإن استحال بلوغها يسقط إلى
 * الغامق الافتراضي — كودٌ يعمل بلا هوية خيرٌ من هوية بلا كود.
 */
export function qrSafeColor(hex: string, background = "#ffffff"): string {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return "#141210";
  let color = hex;
  for (let i = 0; i < 12 && contrast(color, background) < 7; i++) {
    color = mix(color, [0, 0, 0], 0.12);
  }
  return contrast(color, background) >= 7 ? color : "#141210";
}

export function bestOnAccent(hex: string): string {
  const dark = "#141210";
  const light = "#ffffff";
  return contrast(hex, dark) >= contrast(hex, light) ? dark : light;
}

function mix(hex: string, target: [number, number, number], amount: number): string {
  const [r, g, b] = rgb(hex);
  const m = (a: number, t: number) => Math.round(a + (t - a) * amount);
  return `#${[m(r, target[0]), m(g, target[1]), m(b, target[2])]
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("")}`;
}

/**
 * يبني ثيماً كاملاً (١١ متغيّراً) من لون واحد.
 *
 * `MenuPage` تنشر `vars` كلها على جذر الصفحة، ولا يوجد fallback لـ`--m-*` في
 * CSS العام — فأي متغيّر ناقص يعني نصاً غير مرئي. لذلك نُولّد المجموعة كاملة.
 */
export function buildCustomTheme(hex: string): MenuTheme {
  const accent = normalizeHex(isHex(hex) ? hex : "#d4a843");
  const onAccent = bestOnAccent(accent);

  // خلفية غامقة مشتقّة من اللون: تحفظ «شخصية» العلامة دون إرهاق العين.
  const bg = mix(accent, [10, 9, 8], 0.9);
  const bg2 = mix(accent, [14, 13, 11], 0.84);
  const [r, g, b] = rgb(accent);

  return {
    id: customThemeId(accent),
    name: "لون علامتي",
    tagline: "لون علامتك على تخطيط بسيط ومحايد",
    // محايد عمداً: هذا الوضع يقول «لوني أنا»، فأي زخرفة أو تخطيط مميّز يزاحم
    // اللون الذي اختاره التاجر بدل أن يبرزه.
    design: design(),
    vars: {
      "--m-bg": bg,
      "--m-bg-2": bg2,
      "--m-surface": "rgba(255,255,255,.05)",
      "--m-text": "#f7f3ea",
      "--m-muted": "#a49b8a",
      "--m-accent": accent,
      "--m-accent-2": mix(accent, [255, 255, 255], 0.28),
      "--m-on-accent": onAccent,
      "--m-border": `rgba(${r},${g},${b},.32)`,
      "--m-font": FONT.tajawal,
      "--m-radius": "1rem",
    },
  };
}

export const LAYOUTS: DishLayout[] = ["grid", "list", "showcase", "deck"];

function isLayout(v: string): v is DishLayout {
  return (LAYOUTS as string[]).includes(v);
}

/**
 * صيغ `menus.theme` المدعومة — كلها تعيش في عمود نصّي واحد بلا تغيير مخطَّط:
 *
 * | القيمة | المعنى |
 * |---|---|
 * | `najdi` | طابع بألوانه وتخطيطه الأصليين |
 * | `najdi:#2fa8a0` | نفس الطابع بلون علامة التاجر |
 * | `najdi:grid` | نفس الطابع لكن بشكل عرض اختاره التاجر (`grid|list|showcase|deck`) |
 * | `najdi:#2fa8a0:grid` | طابع + لون + شكل عرض |
 * | `custom:#hex` | صيغة قديمة — تبقى تعمل كما كانت تماماً |
 * | `royal` … | طابعٌ خرج من القائمة ⇒ أقرب باقٍ بلونه عبر `LEGACY` |
 *
 * التحليل **غير مرتبط بترتيب** المقاطع: المقطع الذي يصلح لوناً لون، والمطابق
 * لأحد `grid|list|showcase|deck` تخطيط، والأول اسم الطابع. هكذا لا تنكسر أي قيمة
 * مخزَّنة اليوم مهما كان ترتيب ما يُكتب لاحقاً.
 */
export function splitThemeId(id: string | null | undefined): {
  base: string | null;
  hex: string | null;
  layout: DishLayout | null;
} {
  if (!id) return { base: null, hex: null, layout: null };
  const legacy = customHexOf(id);
  if (legacy) return { base: null, hex: legacy, layout: null };

  const [base, ...rest] = id.split(":");
  let hex: string | null = null;
  let layout: DishLayout | null = null;
  for (const part of rest) {
    const p = part.trim();
    if (!hex && isHex(p)) hex = normalizeHex(p);
    else if (!layout && isLayout(p)) layout = p;
  }
  return { base: base || null, hex, layout };
}

/** يبني معرّف التخزين من طابع ولون وشكل عرض اختياريين. */
export function themeIdOf(
  base: string,
  hex?: string | null,
  layout?: DishLayout | null
): string {
  let id = base;
  if (hex && isHex(hex)) id += `:${normalizeHex(hex)}`;
  if (layout && isLayout(layout)) id += `:${layout}`;
  return id;
}

/**
 * يصبغ طابعاً بلون علامة التاجر مع الإبقاء على شخصيته (الزخرفة والتخطيط والخط).
 * هذا جوهر «طابع كامل × لون علامتك»: اللون يتغيّر، والتصميم يبقى.
 */
function tintTheme(theme: MenuTheme, hex: string): MenuTheme {
  const accent = normalizeHex(hex);
  const [r, g, b] = rgb(accent);
  const onAccent = bestOnAccent(accent);
  return {
    ...theme,
    id: themeIdOf(theme.id, accent),
    vars: {
      ...theme.vars,
      "--m-accent": accent,
      "--m-accent-2": mix(accent, [255, 255, 255], 0.3),
      "--m-on-accent": onAccent,
      "--m-border": `rgba(${r},${g},${b},.28)`,
    },
  };
}

/**
 * يبدّل شكل عرض الأطباق دون المساس ببقية الطابع.
 *
 * `design.layout` صار **افتراضاً** لا قيداً: التاجر الذي يحبّ ألوان «الحصري»
 * ويريد مربّعات بدل القائمة يملك الخيار، وباقي شخصية الطابع (الزخرفة، شكل
 * الترويسة، الخط، الإيقاع) تبقى كما صُمّمت.
 */
function withLayout(theme: MenuTheme, layout: DishLayout): MenuTheme {
  if (theme.design.layout === layout) return theme;
  return {
    ...theme,
    id: themeIdOf(theme.id, null, layout),
    design: { ...theme.design, layout },
  };
}

/**
 * لونٌ بدرجة التمييز **يُقرأ نصّاً** فوق أرضية الطابع.
 *
 * ⚠️ لون العلامة يأتي من التاجر لا منّا: أصفرُ علامةٍ على الطابع الأبيض كان
 * يكتب الأسعار بتباين 2.2:1، وأحمرُ داكن على لوحة الحروف 2.9:1 — سعرٌ لا يُقرأ
 * في مطعمٍ خافت الإضاءة. فالتمييز يبقى كما هو للكتل والشرائح (عليها نصّ
 * `--m-on-accent`)، ونسخته هذه للنصّ وحده: نفس اللون، أفتح أو أغمق بقدر ما
 * يلزم لبلوغ ٤٫٥:١ لا أكثر.
 */
export function readableOn(hex: string, ground: string, min = 4.5): string {
  if (!isHex(hex) || !isHex(ground)) return hex;
  const toward: [number, number, number] = luminance(ground) < 0.4 ? [255, 255, 255] : [0, 0, 0];
  let c = normalizeHex(hex);
  for (let i = 0; i < 16 && contrast(c, ground) < min; i++) c = mix(c, toward, 0.1);
  return c;
}

function withInk(theme: MenuTheme): MenuTheme {
  const v = theme.vars;
  const ink = readableOn(v["--m-accent"] ?? "", v["--m-bg"] ?? "");
  return { ...theme, vars: { ...v, "--m-accent-ink": ink } };
}

export function getTheme(id: string | null | undefined): MenuTheme {
  const { base, hex, layout } = splitThemeId(id);
  // صيغة قديمة `custom:#hex` بلا طابع — تبقى كما كانت.
  if (!base) {
    const legacy = hex ? buildCustomTheme(hex) : DEFAULT_THEME;
    return withInk(layout ? withLayout(legacy, layout) : legacy);
  }
  const legacy = LEGACY[base] ? splitThemeId(LEGACY[base]) : null;
  const key = legacy?.base ?? base;
  const found = ALL_THEMES.find((t) => t.id === key) ?? DEFAULT_THEME;
  // لون التاجر أوّلاً، ثم لون الطابع القديم الذي كان عليه.
  const tint = hex ?? legacy?.hex ?? null;
  const theme = tint ? tintTheme(found, tint) : found;
  return withInk(layout ? withLayout(theme, layout) : theme);
}

/** معرّف الطابع الباقي لأي قيمة مخزَّنة — قديمةً كانت أو حالية. للمُنتقي. */
export function themeBaseOf(id: string | null | undefined): string {
  return splitThemeId(getTheme(id).id).base ?? DEFAULT_THEME.id;
}

/**
 * أصناف الخامة التي تُطبَّق على جذر المنيو.
 *
 * الأربعة تُترجَم إلى أصناف يقرؤها `global.css` ويشتقّ منها الظلال واللمعة
 * والحافة بـ`color-mix()` من `--m-*` — فلا قيمة لونية تُكتب هنا ولا في أي طابع.
 *
 * `entrance` يُستثنى من هذا الوسم عمداً: بطاقة الطبق تحمله بنفسها كي يبقى
 * التدرّج (`--i`) على مستوى البطاقة لا على مستوى الصفحة.
 */
/** طابعٌ أرضيّته داكنة — للترويسة: غلافٌ داكن مزخرف بدل كتلةٍ بلون العلامة. */
export function isDarkTheme(t: MenuTheme): boolean {
  const bg = t.vars["--m-bg"] ?? "#000000";
  return isHex(bg) && luminance(bg) < 0.2;
}

export function skinClass(d: MenuDesign): string {
  return `m-skin-${d.skin} m-depth-${d.depth} m-sheen-${d.sheen} m-edge-${d.edge}`;
}

/** صنف دخول البطاقة — يُقرن مع متغيّر `--i` لترتيبها في القسم. */
export function entranceClass(d: MenuDesign): string {
  return d.entrance === "none" ? "" : `m-enter m-enter-${d.entrance}`;
}

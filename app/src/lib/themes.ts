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

/** شكل الخلفية وراء الشعار — أكثر ما يمنح المنيو شخصيته من أول نظرة. */
export type HeaderShape = "arch" | "band" | "frame" | "soft";
/** تخطيط الأطباق — هذا ما يجعل الفرق بين الطوابع يُرى لا يُقرأ. */
export type DishLayout = "grid" | "list" | "showcase";
export type HeadingStyle = "ornament" | "rule" | "plain";
/** شكل صورة الطبق — دائري للكافيهات، مربّع حادّ للمينيمال، ودارج للباقي. */
export type ImageShape = "rounded" | "square" | "circle";
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
export const DESIGN_THEMES: MenuTheme[] = [
  {
    id: "najdi",
    name: "نجدي تراثي",
    tagline: "طين ورمل وفيروزي أبواب نجد، مع نسيج السدو",
    vars: {
      // أرضية رملية فاتحة كجدران الطين، والفيروزي لون أبواب نجد ونوافذها.
      "--m-bg": "#f4e8d5",
      "--m-bg-2": "#e9d9be",
      "--m-surface": "#fffaf1",
      "--m-text": "#33261a",
      "--m-muted": "#8a745a",
      "--m-accent": "#1f7a72",
      "--m-accent-2": "#c8912f",
      "--m-on-accent": "#ffffff",
      "--m-border": "rgba(51,38,26,.14)",
      "--m-font": FONT.reem,
      "--m-radius": "0.5rem",
    },
    design: design({
      pattern: "sadu",
      patternOpacity: 0.07,
      header: "band",
      heading: "ornament",
      imageShape: "square",
      priceStyle: "badge",
      depth: "raised", sheen: "none", entrance: "rise", edge: "hairline",
    }),
  },
  {
    id: "luxe",
    name: "حصري فاخر",
    tagline: "أسود عميق وذهب شامبانيا، وقائمة بلا صور كبيرة",
    vars: {
      "--m-bg": "#0b0b0c",
      "--m-bg-2": "#131315",
      "--m-surface": "rgba(255,255,255,.035)",
      "--m-text": "#f4efe4",
      "--m-muted": "#8d8679",
      "--m-accent": "#c9a227",
      "--m-accent-2": "#e3c766",
      "--m-on-accent": "#0b0b0c",
      "--m-border": "rgba(201,162,39,.28)",
      "--m-font": FONT.amiri,
      "--m-display": FONT.ruqaa,
      "--m-radius": "0.25rem",
    },
    design: design({
      pattern: "girih",
      patternOpacity: 0.035,
      header: "frame",
      layout: "list",
      heading: "rule",
      density: "airy",
      imageShape: "square",
      priceStyle: "leader",
      divider: "none",
      depth: "float", sheen: "gold", entrance: "unfold", edge: "gilded",
    }),
  },
  {
    id: "hijazi",
    name: "حجازي",
    tagline: "أزرق البحر ومرجاني، بأقواس الرواشين",
    vars: {
      "--m-bg": "#0d1f26",
      "--m-bg-2": "#122a33",
      "--m-surface": "rgba(255,255,255,.05)",
      "--m-text": "#eaf6f7",
      "--m-muted": "#8faab3",
      "--m-accent": "#e07a5f",
      "--m-accent-2": "#4ecdc4",
      // غامق لا أبيض: الأبيض على المرجاني 2.95:1 فقط — دون حدّ WCAG AA.
      "--m-on-accent": "#141210",
      "--m-border": "rgba(224,122,95,.26)",
      "--m-font": FONT.cairo,
      "--m-radius": "1.25rem",
    },
    design: design({
      pattern: "mashrabiya",
      patternOpacity: 0.06,
      header: "arch",
      imageShape: "circle",
      priceStyle: "badge",
      depth: "raised", sheen: "silk", entrance: "rise", edge: "hairline",
    }),
  },
  {
    id: "modern",
    name: "عصري مينيمال",
    tagline: "أبيض نظيف وصور كبيرة — للكافيهات الحديثة",
    vars: {
      "--m-bg": "#ffffff",
      "--m-bg-2": "#f4f4f5",
      "--m-surface": "#ffffff",
      "--m-text": "#101012",
      "--m-muted": "#6b6b73",
      "--m-accent": "#101012",
      "--m-accent-2": "#3f3f46",
      "--m-on-accent": "#ffffff",
      "--m-border": "rgba(0,0,0,.09)",
      "--m-font": FONT.cairo,
      "--m-radius": "1rem",
    },
    design: design({
      layout: "showcase",
      density: "airy",
      imageShape: "square",
      depth: "flat", sheen: "none", entrance: "fade", edge: "hairline",
    }),
  },

  /* ── طوابع أُضيفت في جولة التصميم ───────────────────────────────────── */
  {
    id: "qatt",
    name: "عسيري (القطّ)",
    tagline: "أشرطة القطّ العسيري الزاهية على أبيض — أجرأ ما في القائمة",
    vars: {
      // بياض جدران عسير، والأحمر والأخضر لونا النقش الغالبان فيه.
      "--m-bg": "#fffdf8",
      "--m-bg-2": "#fdf3e7",
      "--m-surface": "#ffffff",
      "--m-text": "#2a1a12",
      "--m-muted": "#8a6f5e",
      "--m-accent": "#c0392b",
      "--m-accent-2": "#1e7a4b",
      "--m-on-accent": "#ffffff",
      "--m-border": "rgba(192,57,43,.22)",
      "--m-font": FONT.kufi,
      "--m-radius": "0.35rem",
    },
    design: design({
      pattern: "qatt",
      patternOpacity: 0.075,
      header: "band",
      heading: "ornament",
      imageShape: "square",
      priceStyle: "badge",
      depth: "raised", sheen: "none", entrance: "rise", edge: "plain",
    }),
  },
  {
    id: "sahra",
    name: "صحراوي",
    tagline: "رمل ونخيل ومساحات واسعة — هدوء يليق بالمقاهي",
    vars: {
      "--m-bg": "#f7f1e6",
      "--m-bg-2": "#efe4d2",
      "--m-surface": "#fffdf8",
      "--m-text": "#3b2f22",
      "--m-muted": "#94806a",
      "--m-accent": "#a9744a",
      "--m-accent-2": "#d9b382",
      "--m-on-accent": "#ffffff",
      "--m-border": "rgba(59,47,34,.12)",
      "--m-font": FONT.almarai,
      "--m-radius": "1.4rem",
    },
    design: design({
      pattern: "palm",
      patternOpacity: 0.05,
      header: "soft",
      heading: "rule",
      density: "airy",
      imageShape: "circle",
      depth: "raised", sheen: "silk", entrance: "fade", edge: "hairline",
    }),
  },
  {
    id: "specialty",
    name: "كافيه تخصّصي",
    tagline: "عاجيّ نظيف وصور كبيرة وطباعة هادئة — أسلوب المحامص",
    vars: {
      "--m-bg": "#faf9f7",
      "--m-bg-2": "#f0eeea",
      "--m-surface": "#ffffff",
      "--m-text": "#1c1b19",
      "--m-muted": "#7d7a74",
      "--m-accent": "#3f6f52",
      "--m-accent-2": "#8fae9b",
      "--m-on-accent": "#ffffff",
      "--m-border": "rgba(28,27,25,.09)",
      "--m-font": FONT.almarai,
      "--m-radius": "0.2rem",
    },
    design: design({
      layout: "showcase",
      heading: "rule",
      density: "airy",
      imageShape: "square",
      divider: "none",
      depth: "raised", sheen: "none", entrance: "rise", edge: "hairline",
    }),
  },
  {
    id: "urban",
    name: "حضري ليلي",
    tagline: "فحميّ عميق بلون كهربائي — للمطاعم التي تفتح متأخّراً",
    vars: {
      "--m-bg": "#0b0d12",
      "--m-bg-2": "#151922",
      "--m-surface": "rgba(255,255,255,.045)",
      "--m-text": "#eef1f7",
      "--m-muted": "#8b95a8",
      "--m-accent": "#5b93ff",
      "--m-accent-2": "#8ab4ff",
      // ‏#5b93ff تباينه مع الأبيض 3.0:1 ومع الغامق 6.2 — `bestOnAccent` تختار الغامق.
      "--m-on-accent": "#0b0d12",
      "--m-border": "rgba(91,147,255,.24)",
      "--m-font": FONT.kufi,
      "--m-radius": "0.75rem",
    },
    design: design({
      pattern: "najma",
      patternOpacity: 0.05,
      layout: "showcase",
      heading: "rule",
      density: "airy",
      imageShape: "square",
      priceStyle: "badge",
      depth: "float", sheen: "silk", entrance: "unfold", edge: "hairline",
    }),
  },

  /* ── ثلاثة طوابع بُنيت على محاور الخامة منذ سطرها الأول ──────────────
   * الستّة عشر السابقة صُمّمت قبل وجود `depth`/`sheen`/`edge`، فأُسندت لها
   * الخامة لاحقاً. وهذه الثلاثة عكسها: الخامة جزء من فكرتها لا إضافة عليها —
   * المرمر يقوم على العمق، والعود على اللمعة النحاسية، واللؤلؤ على الحافة.
   *
   * ألوانها **جديدة بالكامل** فلا تمسّ أحداً: لا منيو قائم عليها بعد.
   * وكلّها مُتحقَّق منها بحساب التباين نفسه الذي في هذا الملف: النصّ والخافت
   * فوق الأرضية ≥ 4.5:1 (AA)، ولون النصّ فوق التمييز من `bestOnAccent`.
   */
  {
    id: "marble",
    name: "مرمر",
    tagline: "بياض المرمر وعروقه الدافئة، ولمسة برونز",
    vars: {
      "--m-bg": "#f7f5f1",
      "--m-bg-2": "#edeae4",
      "--m-surface": "#ffffff",
      "--m-text": "#23211d",
      // ‏#6b6558 لا #7c766c: الأفتح كان 4.13:1 فوق الأرضية — دون AA، ووصف
      // الطبق يُقرأ في مطعم مُضاء بخفوت لا على شاشة مكتب.
      "--m-muted": "#6b6558",
      "--m-accent": "#8a6a3f",
      "--m-accent-2": "#b9a072",
      "--m-on-accent": "#ffffff",
      "--m-border": "rgba(35,33,29,.12)",
      "--m-font": FONT.almarai,
      "--m-display": FONT.reem,
      "--m-radius": "0.35rem",
    },
    design: design({
      pattern: "mashrabiya",
      patternOpacity: 0.035,
      header: "frame",
      layout: "list",
      heading: "rule",
      density: "airy",
      imageShape: "square",
      priceStyle: "leader",
      divider: "none",
      depth: "float", sheen: "silk", entrance: "rise", edge: "hairline",
    }),
  },
  {
    id: "oud",
    name: "عود",
    tagline: "خشب داكن ونحاس، لمجالس القهوة والعشاء المتأخّر",
    vars: {
      "--m-bg": "#17110d",
      "--m-bg-2": "#1f1712",
      "--m-surface": "rgba(255,255,255,.04)",
      "--m-text": "#f2e9dd",
      "--m-muted": "#a1907c",
      "--m-accent": "#b8873b",
      "--m-accent-2": "#d9ae63",
      "--m-on-accent": "#141210",
      "--m-border": "rgba(184,135,59,.26)",
      "--m-font": FONT.amiri,
      "--m-display": FONT.ruqaa,
      "--m-radius": "0.3rem",
    },
    design: design({
      pattern: "girih",
      patternOpacity: 0.04,
      header: "arch",
      heading: "ornament",
      density: "airy",
      imageShape: "square",
      priceStyle: "badge",
      depth: "float", sheen: "gold", entrance: "unfold", edge: "gilded",
    }),
  },
  {
    id: "lulu",
    name: "لؤلؤ",
    tagline: "صدفيّ ناعم وفضّة الخليج، بحواف مستديرة",
    vars: {
      "--m-bg": "#f4f2f4",
      "--m-bg-2": "#e9e6ea",
      "--m-surface": "#fffdfe",
      "--m-text": "#2a2630",
      // ‏#6a6474 لا #7d7787 — نفس سبب المرمر (كان 3.88:1).
      "--m-muted": "#6a6474",
      "--m-accent": "#5f6b7a",
      "--m-accent-2": "#a9b4c2",
      "--m-on-accent": "#ffffff",
      "--m-border": "rgba(42,38,48,.12)",
      "--m-font": FONT.kufi,
      "--m-display": FONT.reem,
      "--m-radius": "1.1rem",
    },
    design: design({
      pattern: "crescent",
      patternOpacity: 0.04,
      header: "soft",
      layout: "showcase",
      heading: "plain",
      density: "airy",
      imageShape: "circle",
      priceStyle: "badge",
      depth: "raised", sheen: "silk", entrance: "fade", edge: "hairline",
    }),
  },
];

/**
 * اللوحات الثمانية — كانت **ألواناً بلا تصميم**.
 *
 * رأس هذا الملف يقول إن الثيم صار «طابعاً كاملاً»، وكان ذلك صحيحاً لأربعة منها
 * فقط: هذه الثمانية كانت تتقاسم `CLASSIC_DESIGN` حرفياً — نفس الزخرفة (لا شيء)،
 * نفس الترويسة، نفس التخطيط، نفس الإيقاع. أي أن الفرق بين «زمردي فاخر» و«أحمر
 * شهي» يُقرأ في الاسم ولا يُرى على الشاشة.
 *
 * ⚠️ **ألوان كل واحدة تبقى حرفياً كما هي**: ثمانية مطاعم حقيقية تستعملها اليوم،
 * و`dark-gold` هو `DEFAULT_THEME` أي شكل المنتج لمن لم يختر شيئاً. الذي تغيّر
 * هو البناء والخطّ والزخرفة والإيقاع لا لوحة الألوان.
 *
 * و`dark-gold` تحديداً أُبقي تخطيطها `grid`: تبديل تخطيط الافتراضي يقلب شكل
 * منيو كل من لم يختر، وهذا أبعد ممّا يبرّره تحسينُ مظهر.
 */
const CLASSIC_THEMES: MenuTheme[] = [
  {
    id: "dark-gold",
    name: "ليلي ذهبي",
    tagline: "ذهب على أسود دافئ، بزخرفة جيري وإطار شعري",
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
    design: design({ pattern: "girih", patternOpacity: 0.03, header: "frame", heading: "ornament", density: "airy", imageShape: "square", priceStyle: "badge", depth: "float", sheen: "gold", entrance: "rise", edge: "gilded" }),
  },
  {
    id: "light-luxe",
    name: "أبيض راقٍ",
    tagline: "عاجيّ راقٍ بقائمة رأسية وخطوط منقّطة تقود إلى السعر",
    vars: {
      "--m-bg": "#f6f2ea",
      "--m-bg-2": "#efe8da",
      "--m-surface": "#ffffff",
      "--m-text": "#2a2218",
      "--m-muted": "#8a7d68",
      "--m-accent": "#b8902f",
      "--m-accent-2": "#caa24a",
      "--m-on-accent": "#ffffff",
      "--m-border": "rgba(40,34,24,.10)",
      "--m-font": FONT.amiri,
      "--m-radius": "0.85rem",
    },
    design: design({ pattern: "mashrabiya", patternOpacity: 0.04, header: "frame", layout: "list", heading: "rule", density: "airy", imageShape: "square", priceStyle: "leader", divider: "none", depth: "raised", sheen: "silk", entrance: "fade", edge: "hairline" }),
  },
  {
    id: "emerald",
    name: "زمردي فاخر",
    tagline: "زمرّد وذهب بشريط سدو وزخرفة جيري",
    vars: {
      "--m-bg": "#0b1f16",
      "--m-bg-2": "#0f2a1f",
      "--m-surface": "rgba(255,255,255,.05)",
      "--m-text": "#eafff4",
      "--m-muted": "#8fb3a3",
      "--m-accent": "#d9b65f",
      "--m-accent-2": "#34d399",
      "--m-on-accent": "#0b1f16",
      "--m-border": "rgba(217,182,95,.22)",
      "--m-font": FONT.reem,
      "--m-radius": "1rem",
    },
    design: design({ pattern: "girih", patternOpacity: 0.045, header: "band", heading: "ornament", imageShape: "rounded", priceStyle: "badge", depth: "float", sheen: "gold", entrance: "unfold", edge: "gilded" }),
  },
  {
    id: "royal",
    name: "أرجواني ملكي",
    tagline: "أرجوان ونجوم ثمانية، بخطّ رقعة على قائمة رأسية",
    vars: {
      "--m-bg": "#190f26",
      "--m-bg-2": "#221634",
      "--m-surface": "rgba(255,255,255,.05)",
      "--m-text": "#f4ecff",
      "--m-muted": "#b3a3c9",
      "--m-accent": "#d4af37",
      "--m-accent-2": "#c084fc",
      "--m-on-accent": "#190f26",
      "--m-border": "rgba(212,175,55,.22)",
      "--m-font": FONT.amiri,
      "--m-display": FONT.ruqaa,
      "--m-radius": "1.1rem",
    },
    design: design({ pattern: "najma", patternOpacity: 0.05, header: "frame", layout: "list", heading: "rule", density: "airy", imageShape: "square", priceStyle: "leader", divider: "none", depth: "float", sheen: "gold", entrance: "unfold", edge: "gilded" }),
  },
  {
    id: "coffee",
    name: "قهوة دافئة",
    tagline: "بنّي دافئ وصور كبيرة — للمحامص والمقاهي",
    vars: {
      "--m-bg": "#20150f",
      "--m-bg-2": "#2a1c14",
      "--m-surface": "rgba(255,255,255,.05)",
      "--m-text": "#f3e9df",
      "--m-muted": "#b89b85",
      "--m-accent": "#c89f6a",
      "--m-accent-2": "#e0b888",
      "--m-on-accent": "#20150f",
      "--m-border": "rgba(200,159,106,.22)",
      "--m-font": FONT.tajawal,
      "--m-radius": "0.9rem",
    },
    design: design({ pattern: "sadu", patternOpacity: 0.05, header: "band", layout: "showcase", density: "airy", imageShape: "rounded", depth: "raised", sheen: "silk", entrance: "rise", edge: "hairline" }),
  },
  {
    id: "crimson",
    name: "أحمر شهي",
    tagline: "أحمر شهيّ بأشرطة القطّ العسيري وصور دائرية",
    vars: {
      "--m-bg": "#1a0d0d",
      "--m-bg-2": "#251111",
      "--m-surface": "rgba(255,255,255,.05)",
      "--m-text": "#fdeeee",
      "--m-muted": "#c79a9a",
      "--m-accent": "#e0533d",
      "--m-accent-2": "#f0a830",
      "--m-on-accent": "#ffffff",
      "--m-border": "rgba(224,83,61,.25)",
      "--m-font": FONT.cairo,
      "--m-radius": "0.85rem",
    },
    design: design({ pattern: "qatt", patternOpacity: 0.05, heading: "ornament", imageShape: "circle", priceStyle: "badge", depth: "raised", sheen: "none", entrance: "rise", edge: "plain" }),
  },
  {
    id: "ocean",
    name: "أزرق بحري",
    tagline: "أزرق بحري بقوس روشان وشبكة مشربية",
    vars: {
      "--m-bg": "#0a1822",
      "--m-bg-2": "#0e2230",
      "--m-surface": "rgba(255,255,255,.05)",
      "--m-text": "#eaf6ff",
      "--m-muted": "#8fb0c4",
      "--m-accent": "#2dd4bf",
      "--m-accent-2": "#38bdf8",
      "--m-on-accent": "#06141d",
      "--m-border": "rgba(45,212,191,.22)",
      "--m-font": FONT.reem,
      "--m-radius": "1rem",
    },
    design: design({ pattern: "mashrabiya", patternOpacity: 0.05, header: "arch", density: "airy", imageShape: "circle", depth: "raised", sheen: "silk", entrance: "fade", edge: "hairline" }),
  },
  {
    id: "minimal",
    name: "مينيمال",
    tagline: "أبيض خالص بقائمة رأسية بلا زخرفة — أقصى ما يمكن من هدوء",
    vars: {
      "--m-bg": "#ffffff",
      "--m-bg-2": "#f4f4f5",
      "--m-surface": "#fafafa",
      "--m-text": "#18181b",
      "--m-muted": "#71717a",
      "--m-accent": "#18181b",
      "--m-accent-2": "#3f3f46",
      "--m-on-accent": "#ffffff",
      "--m-border": "rgba(0,0,0,.10)",
      "--m-font": FONT.almarai,
      "--m-radius": "0.6rem",
    },
    design: design({ layout: "list", density: "airy", imageShape: "square", divider: "rule", depth: "flat", sheen: "none", entrance: "fade", edge: "hairline" }),
  },
  {
    id: "bahri",
    name: "بحري",
    tagline: "رملي فاتح وموجٌ متداخل بأزرق الخليج — للمأكولات البحرية",
    vars: {
      "--m-bg": "#f7f4ee",
      "--m-bg-2": "#eee9df",
      "--m-surface": "#fdfcf9",
      "--m-text": "#1a2530",
      "--m-muted": "#5f6f7c",
      // أزرق خليجي عميق: تباينه مع الأرضية ≈ 6.9:1 — فوق حدّ AA بوضوح.
      "--m-accent": "#155e75",
      "--m-accent-2": "#7fb2c4",
      "--m-on-accent": "#ffffff",
      "--m-border": "rgba(26,37,48,.10)",
      "--m-font": FONT.tajawal,
      "--m-radius": "0.9rem",
    },
    design: design({
      pattern: "mawj",
      patternOpacity: 0.06,
      header: "band",
      imageShape: "rounded",
      density: "airy",
      depth: "raised", sheen: "silk", entrance: "rise", edge: "hairline",
    }),
  },
  {
    id: "majlis",
    name: "مجلس",
    tagline: "بُنّي دافئ ونسيج حصير بلمسة نحاسية — دفء الديوانية",
    vars: {
      "--m-bg": "#211913",
      "--m-bg-2": "#2b211a",
      "--m-surface": "#2f251d",
      "--m-text": "#f3e9dc",
      "--m-muted": "#b3a394",
      // نحاسي دافئ: تباينه مع الأرضية الداكنة ≈ 6.4:1، والنص فوقه غامق.
      "--m-accent": "#cf9445",
      "--m-accent-2": "#8a6b45",
      "--m-on-accent": "#211913",
      "--m-border": "rgba(243,233,220,.12)",
      "--m-font": FONT.reem,
      "--m-radius": "0.8rem",
    },
    design: design({
      pattern: "hasir",
      patternOpacity: 0.05,
      header: "arch",
      heading: "ornament",
      imageShape: "rounded",
      priceStyle: "badge",
      depth: "raised", sheen: "gold", entrance: "fade", edge: "plain",
    }),
  },
];

export const THEMES: MenuTheme[] = CLASSIC_THEMES;

/** كل ما يظهر في المُنتقي — الطوابع المصمَّمة أولاً. */
export const ALL_THEMES: MenuTheme[] = [...DESIGN_THEMES, ...THEMES];

const DEFAULT_THEME = THEMES[0];

/** يحوّل أسماء الثيمات القديمة (الموجودة في قاعدة البيانات الحية) إلى المعرّفات الجديدة. */
const ALIASES: Record<string, string> = {
  green: "emerald",
  cream: "light-luxe",
  light: "light-luxe",
  white: "light-luxe",
  dark: "dark-gold",
  gold: "dark-gold",
  purple: "royal",
  red: "crimson",
  blue: "ocean",
  brown: "coffee",
  mono: "minimal",
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

export const LAYOUTS: DishLayout[] = ["grid", "list", "showcase"];

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
 * | `najdi:grid` | نفس الطابع لكن بشكل عرض اختاره التاجر |
 * | `najdi:#2fa8a0:grid` | طابع + لون + شكل عرض |
 * | `custom:#hex` | صيغة قديمة — تبقى تعمل كما كانت تماماً |
 * | `dark-gold` … | الثيمات الثمانية القديمة عبر `ALIASES` |
 *
 * التحليل **غير مرتبط بترتيب** المقاطع: المقطع الذي يصلح لوناً لون، والمطابق
 * لأحد `grid|list|showcase` تخطيط، والأول اسم الطابع. هكذا لا تنكسر أي قيمة
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

export function getTheme(id: string | null | undefined): MenuTheme {
  const { base, hex, layout } = splitThemeId(id);
  // صيغة قديمة `custom:#hex` بلا طابع — تبقى كما كانت.
  if (!base) {
    const legacy = hex ? buildCustomTheme(hex) : DEFAULT_THEME;
    return layout ? withLayout(legacy, layout) : legacy;
  }
  const key = ALIASES[base] ?? base;
  const found = ALL_THEMES.find((t) => t.id === key) ?? DEFAULT_THEME;
  const theme = hex ? tintTheme(found, hex) : found;
  return layout ? withLayout(theme, layout) : theme;
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
export function skinClass(d: MenuDesign): string {
  return `m-depth-${d.depth} m-sheen-${d.sheen} m-edge-${d.edge}`;
}

/** صنف دخول البطاقة — يُقرن مع متغيّر `--i` لترتيبها في القسم. */
export function entranceClass(d: MenuDesign): string {
  return d.entrance === "none" ? "" : `m-enter m-enter-${d.entrance}`;
}

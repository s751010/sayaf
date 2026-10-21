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
/**
 * ═══ ستّة طوابع لا واحد وعشرون (٢٠٢٦/١٠/٢١) ═══
 *
 * كانت ٢١ طابعاً، كثيرٌ منها **لونٌ آخر للبنية نفسها** («زمردي» و«أرجواني»
 * و«قهوة» كلّها ليلي ذهبي بأرضية ملوّنة). والتاجر أمام ٢١ خياراً لا يختار
 * أفضلها — يتردّد، أو يأخذ الأوّل. وكلّ طابعٍ ضعيفٍ في القائمة يُضعف الباقي.
 *
 * فصارت ستّة، **لكلّ نوع مطعم واحد**، وكلٌّ منها يلبس لون علامة التاجر
 * وشعاره: فالتمايز بين مطعمين يأتي من هويّتهما لا من عدد الطوابع.
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
  {
    id: "specialty",
    name: "محمصة",
    tagline: "للقهوة المختصّة — عاجيّ هادئ وقائمة مرتّبة بالصور",
    vars: {
      "--m-bg": "#faf9f7",
      "--m-bg-2": "#f0eeea",
      "--m-surface": "#ffffff",
      "--m-text": "#1c1b19",
      "--m-muted": "#6b675f",
      "--m-accent": "#3f6f52",
      "--m-accent-2": "#8fae9b",
      "--m-on-accent": "#ffffff",
      "--m-border": "rgba(28,27,25,.09)",
      "--m-font": FONT.almarai,
      "--m-radius": "0.75rem",
    },
    design: design({
      layout: "list",
      heading: "rule",
      density: "airy",
      depth: "flat", entrance: "fade", edge: "hairline",
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
    id: "urban",
    name: "ستريت",
    tagline: "للبرجر والوجبات السريعة — فحميّ جريء ولون حارّ",
    vars: {
      "--m-bg": "#0e0f12",
      "--m-bg-2": "#17191e",
      // سطحٌ مُصمت لا شفّاف: الشفّاف فوق الأرضية الداكنة يُظهر ما خلفه.
      "--m-surface": "#1a1c22",
      "--m-text": "#f4f5f7",
      "--m-muted": "#9aa1ad",
      "--m-accent": "#ff5a1f",
      "--m-accent-2": "#ff8a5b",
      // ‏#ff5a1f مع الأبيض 3.1:1 ومع الفحميّ 6.4 — `bestOnAccent` تختار الفحميّ.
      "--m-on-accent": "#0e0f12",
      "--m-border": "rgba(255,255,255,.09)",
      "--m-font": FONT.cairo,
      "--m-display": FONT.kufi,
      "--m-radius": "1rem",
    },
    design: design({
      priceStyle: "badge",
      divider: "none",
      depth: "raised", entrance: "rise", edge: "plain",
    }),
  },
  {
    id: "marble",
    name: "راقٍ",
    tagline: "للبرنش والحلويات — مرمر أبيض ولمسة برونز",
    vars: {
      "--m-bg": "#f7f5f1",
      "--m-bg-2": "#edeae4",
      "--m-surface": "#ffffff",
      "--m-text": "#23211d",
      // ‏#6b6558 لا أفتح: الأفتح كان 4.13:1 فوق الأرضية — دون AA.
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
      priceStyle: "leader",
      divider: "none",
      depth: "float", sheen: "silk", entrance: "rise", edge: "hairline",
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
  luxe: "dark-gold:#c9a227",
  hijazi: "dark-gold:#e07a5f",
  oud: "dark-gold:#b8873b",
  emerald: "dark-gold:#d9b65f",
  royal: "dark-gold:#d4af37",
  coffee: "dark-gold:#c89f6a",
  majlis: "dark-gold:#cf9445",
  crimson: "urban:#e0533d",
  ocean: "urban:#2dd4bf",
  qatt: "modern:#c0392b",
  bahri: "modern:#155e75",
  minimal: "modern",
  sahra: "specialty:#a9744a",
  lulu: "marble:#5f6b7a",
  "light-luxe": "marble:#b8902f",
  green: "dark-gold:#d9b65f",
  cream: "marble:#b8902f",
  light: "marble:#b8902f",
  white: "marble:#b8902f",
  dark: "dark-gold",
  gold: "dark-gold",
  purple: "dark-gold:#d4af37",
  red: "urban:#e0533d",
  blue: "urban:#2dd4bf",
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
 * | `royal` … | طابعٌ خرج من القائمة ⇒ أقرب باقٍ بلونه عبر `LEGACY` |
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
  const legacy = LEGACY[base] ? splitThemeId(LEGACY[base]) : null;
  const key = legacy?.base ?? base;
  const found = ALL_THEMES.find((t) => t.id === key) ?? DEFAULT_THEME;
  // لون التاجر أوّلاً، ثم لون الطابع القديم الذي كان عليه.
  const tint = hex ?? legacy?.hex ?? null;
  const theme = tint ? tintTheme(found, tint) : found;
  return layout ? withLayout(theme, layout) : theme;
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
  return `m-depth-${d.depth} m-sheen-${d.sheen} m-edge-${d.edge}`;
}

/** صنف دخول البطاقة — يُقرن مع متغيّر `--i` لترتيبها في القسم. */
export function entranceClass(d: MenuDesign): string {
  return d.entrance === "none" ? "" : `m-enter m-enter-${d.entrance}`;
}

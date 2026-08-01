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

export interface MenuDesign {
  pattern: PatternId;
  /** شفافية الزخرفة — تبقى منخفضة كي لا تزاحم قراءة النص فوقها. */
  patternOpacity: number;
  header: HeaderShape;
  layout: DishLayout;
  heading: HeadingStyle;
  density: "cozy" | "airy";
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

/** طابع الثيمات اللونية القديمة — يحفظ شكل منيو كل تاجر قائم كما هو. */
const CLASSIC_DESIGN: MenuDesign = {
  pattern: "none",
  patternOpacity: 0,
  header: "soft",
  layout: "grid",
  heading: "plain",
  density: "cozy",
};

const FONT = {
  cairo: "var(--font-cairo)",
  tajawal: "var(--font-tajawal)",
  reem: "var(--font-reem)",
  amiri: "var(--font-amiri)",
};

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
    design: {
      pattern: "sadu",
      patternOpacity: 0.07,
      header: "band",
      layout: "grid",
      heading: "ornament",
      density: "cozy",
    },
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
      "--m-radius": "0.25rem",
    },
    design: {
      pattern: "girih",
      patternOpacity: 0.035,
      header: "frame",
      layout: "list",
      heading: "rule",
      density: "airy",
    },
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
    design: {
      pattern: "mashrabiya",
      patternOpacity: 0.06,
      header: "arch",
      layout: "grid",
      heading: "plain",
      density: "cozy",
    },
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
    design: {
      pattern: "none",
      patternOpacity: 0,
      header: "soft",
      layout: "showcase",
      heading: "plain",
      density: "airy",
    },
  },
];

/**
 * لوحات ألوان كلاسيكية — تخطيط واحد لكلها، تبقى لمن اختارها من قبل.
 * `design` يُضاف لها آلياً في `THEMES` أدناه فلا يتكرّر ثماني مرات.
 */
const CLASSIC_PALETTES: Omit<MenuTheme, "design" | "tagline">[] = [
  {
    id: "dark-gold",
    name: "ليلي ذهبي",
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
      "--m-font": FONT.tajawal,
      "--m-radius": "1rem",
    },
  },
  {
    id: "light-luxe",
    name: "أبيض راقٍ",
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
  },
  {
    id: "emerald",
    name: "زمردي فاخر",
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
  },
  {
    id: "royal",
    name: "أرجواني ملكي",
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
      "--m-radius": "1.1rem",
    },
  },
  {
    id: "coffee",
    name: "قهوة دافئة",
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
  },
  {
    id: "crimson",
    name: "أحمر شهي",
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
  },
  {
    id: "ocean",
    name: "أزرق بحري",
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
  },
  {
    id: "minimal",
    name: "مينيمال",
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
      "--m-font": FONT.cairo,
      "--m-radius": "0.6rem",
    },
  },
];

export const THEMES: MenuTheme[] = CLASSIC_PALETTES.map((p) => ({
  ...p,
  tagline: "لوحة ألوان كلاسيكية",
  design: CLASSIC_DESIGN,
}));

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
    tagline: "لون علامتك على تخطيط كلاسيكي",
    design: CLASSIC_DESIGN,
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

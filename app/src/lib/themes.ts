/**
 * ثيمات المنيو العام. كل ثيم مجموعة CSS custom properties تُطبَّق على جذر
 * صفحة المنيو؛ المكوّنات تقرأها عبر `var(--m-*)`. يُخزَّن لكل قائمة في `menus.theme`.
 */
export interface MenuTheme {
  id: string;
  name: string; // التسمية العربية في المُنتقي
  vars: Record<string, string>;
}

const FONT = {
  cairo: "var(--font-cairo)",
  tajawal: "var(--font-tajawal)",
  reem: "var(--font-reem)",
  amiri: "var(--font-amiri)",
};

export const THEMES: MenuTheme[] = [
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
  const lum = luminance(accent);
  // لون فاتح ⇒ نص غامق عليه، والعكس. (تباين مقبول على اللون نفسه.)
  const onAccent = lum > 0.45 ? "#141210" : "#ffffff";

  // خلفية غامقة مشتقّة من اللون: تحفظ «شخصية» العلامة دون إرهاق العين.
  const bg = mix(accent, [10, 9, 8], 0.9);
  const bg2 = mix(accent, [14, 13, 11], 0.84);
  const [r, g, b] = rgb(accent);

  return {
    id: customThemeId(accent),
    name: "لون علامتي",
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

export function getTheme(id: string | null | undefined): MenuTheme {
  if (!id) return DEFAULT_THEME;
  const custom = customHexOf(id);
  if (custom) return buildCustomTheme(custom);
  const key = ALIASES[id] ?? id;
  return THEMES.find((t) => t.id === key) ?? DEFAULT_THEME;
}

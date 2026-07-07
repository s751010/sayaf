/**
 * Restaurant menu themes. Each theme is a set of CSS custom properties applied
 * to the public menu root; components read them via `var(--m-*)`. Stored per
 * menu in `menus.theme`.
 */
export interface MenuTheme {
  id: string;
  name: string; // Arabic label for the picker
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

/** Maps legacy/loose theme names (in the live DB) onto the new theme ids. */
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

export function getTheme(id: string | null | undefined): MenuTheme {
  if (!id) return DEFAULT_THEME;
  const key = ALIASES[id] ?? id;
  return THEMES.find((t) => t.id === key) ?? DEFAULT_THEME;
}

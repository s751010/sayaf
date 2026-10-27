/**
 * عدّة الطباعة بالطابع — ستاند الطاولة · ورقة ملصقات QR · بطاقة الكاونتر.
 *
 * ═══ ما هي ═══
 *
 * ثلاث قطع **مسبقة الضبط** فوق محرّك البطاقات نفسه (`lib/cards.ts` · §١٧):
 * لا رسمٌ ثانٍ ولا كودٌ ثانٍ. والفرق عن الاستوديو أن القطعة تلبس **طابع المنيو
 * كاملاً** — ألوانه بعد حلّ تباينها، وخطّ عرضه، وزخرفته، و«حافّته» (ملمسه في
 * الطباعة: دفتر جلد، فاتورة، نيون، شُرفات نجدية…). فما يمسحه الزبون على
 * الطاولة يشبه ما يفتحه على جواله.
 *
 * ═══ وهذا الملفّ خالص ═══
 *
 * لا DOM هنا ولا canvas: البوّابة واللوحة المحلولة والقطع دوالّ تُفحص في
 * Vitest بلا متصفّح (`tests/print-kit.test.ts`). الرسم في `cards.ts`
 * و`printMotifs.ts`.
 */
import { bestOnAccent, getTheme, isHex, normalizeHex, qrSafeColor, readableOn, type MenuSkin } from "./themes";
import type { PatternId } from "./patterns";

/* ── البوّابة: لا طباعة قبل النطاق ───────────────────────────────────── */

/**
 * مضيفات **مؤقّتة** — كودٌ مطبوع يشير إليها يبقى عليها للأبد.
 *
 * قرار المالك (٢٠٢٦/١٠/٢٥): لا يُدفع التاجر إلى طباعة قبل ربط النطاق النهائي.
 * والسبب مادّي لا ذوقي: الكود على مئة طاولة لا يُحدَّث، و`*.netlify.app` اسمٌ
 * لا نملكه بالمعنى الذي نملك به نطاقاً (يُعاد تسميته، أو يُحذف المشروع).
 */
const PROVISIONAL_HOSTS: readonly RegExp[] = [
  /(^|\.)netlify\.app$/,
  /(^|\.)netlify\.live$/,
  /(^|\.)vercel\.app$/,
  /(^|\.)pages\.dev$/,
  /(^|\.)github\.io$/,
  /(^|\.)supabase\.co$/,
  /^localhost$/,
  /\.local$/,
  /\.test$/,
  /\.example$/,
  /^\d{1,3}(\.\d{1,3}){3}$/, // عنوان IP
  /^\[?[0-9a-f:]+\]?$/i, // IPv6
];

/** هل هذا المضيف مؤقّت (معاينة، خادم تطوير، نطاق فرعي لمنصّة استضافة)؟ */
export function isProvisionalHost(host: string | null | undefined): boolean {
  const h = String(host ?? "").trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  if (!h || !h.includes(".") && h !== "localhost") return true;
  return PROVISIONAL_HOSTS.some((re) => re.test(h));
}

export type PrintGateReason = "no-url" | "no-domain" | "provisional-domain" | "host-mismatch";

export type PrintGate =
  | { ready: true; host: string }
  | { ready: false; reason: PrintGateReason; host: string | null; note: string };

const NOTE_DOMAIN =
  "التنزيل والطباعة يُفتحان يوم يُربط نطاق كلاود منيو النهائي. الكود المطبوع لا يُحدَّث، " +
  "وكودٌ يشير إلى العنوان المؤقّت يبقى عليه للأبد — فصمّم الآن وعاين، ويُفتح الزرّان وحدهما حين يجهز النطاق.";

/**
 * **هل يجوز أن يُطبع كودٌ يحمل هذا الرابط؟** — دالّة خالصة.
 *
 * `menuDomain` هو `MENU_DOMAIN` من `shared/menu-url.mjs`، و`url` هو ما يدخل
 * الكود فعلاً (`menuUrl(slug)`). ويُشترط الاثنان:
 *
 * 1. **نطاقٌ مكتوب** (`MENU_DOMAIN` ليس `null`): التلقائي يعني «أيّاً كان
 *    المضيف الذي فُتحت منه اللوحة» — والتاجر الذي يفتحها من `netlify.app`
 *    يطبع `netlify.app`. وكتابة النطاق هناك قرارٌ يُتّخذ **بعد** ربطه.
 * 2. **وليس مؤقّتاً**: من كتب `xyz.netlify.app` هناك لم يُنهِ شيئاً.
 * 3. **والرابط على ذلك النطاق فعلاً** (أو نطاقٍ فرعيّ منه): حارسٌ لمن يبني
 *    الرابط من غير المصدر — الكود يُفحص بما فيه لا بما يُفترض أن فيه.
 */
export function printGate(menuDomain: string | null | undefined, url: string | null | undefined): PrintGate {
  let host: string | null = null;
  try {
    host = url ? new URL(url).hostname.toLowerCase() : null;
  } catch {
    host = null;
  }
  if (!host) {
    return { ready: false, reason: "no-url", host: null, note: "منيوك بلا رابط بعد — اضبطه من الإعدادات أولاً." };
  }
  const domain = String(menuDomain ?? "").trim().toLowerCase().replace(/\.$/, "");
  if (!domain) return { ready: false, reason: "no-domain", host, note: NOTE_DOMAIN };
  if (isProvisionalHost(domain)) return { ready: false, reason: "provisional-domain", host, note: NOTE_DOMAIN };
  if (host !== domain && !host.endsWith(`.${domain}`)) {
    return {
      ready: false,
      reason: "host-mismatch",
      host,
      note: `الرابط في الكود (${host}) ليس على نطاق المنيو (${domain}) — لا يُطبع كودٌ لا نضمن بقاءه.`,
    };
  }
  return { ready: true, host };
}

/* ── القطع الثلاث ────────────────────────────────────────────────────── */

export type KitPieceId = "tent" | "stickers" | "counter";

export interface KitPiece {
  id: KitPieceId;
  name: string;
  desc: string;
  /** قياس المحرّك (`CardSizeId`) — نصّاً هنا كي يبقى الملفّ خالصاً بلا canvas. */
  size: "tent-a5" | "sticker" | "counter";
  layout: "centered" | "framed";
  /** ما يُطبع في ورقة A4 واحدة — يحسبه `perSheet` في المحرّك. */
  sheet: boolean;
}

/**
 * القطع مرتّبةً بما يراه الزبون أوّلاً: الطاولة، ثم الملصق، ثم الكاونتر.
 *
 * - **ستاند الطاولة**: ورقة A5 (١٤٨×٢١٠مم) تُطوى فتقف بوجهين بقياس A6 أفقيّ
 *   (١٤٨×١٠٥مم) — الكود في وجهٍ يُقرأ من الجهتين.
 * - **ملصقات QR**: ٨٠×٨٠مم، ستّة في ورقة A4 (`perSheet`).
 * - **بطاقة الكاونتر**: ١٠٠×١٥٠مم في ستاند أكريليك عند نقطة الدفع.
 */
export const KIT_PIECES: readonly KitPiece[] = [
  { id: "tent", name: "ستاند الطاولة", desc: "ورقة A5 تُطوى من المنتصف فتقف بوجهين", size: "tent-a5", layout: "centered", sheet: false },
  { id: "stickers", name: "ملصقات QR", desc: "ورقة A4 من الملصقات المربّعة — قصّها والصقها", size: "sticker", layout: "centered", sheet: true },
  { id: "counter", name: "بطاقة الكاونتر", desc: "لستاند الأكريليك عند الكاشير", size: "counter", layout: "framed", sheet: false },
];

/* ── لوحة الطابع محلولةَ التباين ──────────────────────────────────────── */

/** نسبة تباين WCAG — نسخة محلية: `themes.ts` لا يصدّر `contrast`. */
export function contrastRatio(a: string, b: string): number {
  const lum = (hex: string) => {
    const h = normalizeHex(hex).slice(1);
    const c = [0, 2, 4].map((i) => {
      const s = parseInt(h.slice(i, i + 2), 16) / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** مزج لونين بنسبة — `t` من ٠ (الأوّل) إلى ١ (الثاني). */
export function mixHex(a: string, b: string, t: number): string {
  const pa = normalizeHex(a).slice(1);
  const pb = normalizeHex(b).slice(1);
  return `#${[0, 2, 4]
    .map((i) => {
      const x = parseInt(pa.slice(i, i + 2), 16);
      const y = parseInt(pb.slice(i, i + 2), 16);
      return Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
    })
    .join("")}`;
}

/**
 * وزن خطّ العرض الذي **يملكه** الخطّ فعلاً.
 *
 * `900` على لاله‌زار (وزنٌ واحد ٤٠٠) يجعل المتصفّح يُسمِّن الحروف تسميناً
 * اصطناعياً فتلتصق، وعلى الرقعة (٤٠٠/٧٠٠) يختار ٧٠٠ ويُسمّنه. فالوزن من
 * الأوزان المثبَّتة في `lib/fonts.ts` و`main.tsx` لا رقمٌ واحد للجميع.
 */
export function displayWeightOf(fontVar: string | undefined | null): string {
  const v = String(fontVar ?? "");
  if (v.includes("--font-lalezar")) return "400";
  if (/--font-(ruqaa|amiri|reem)\b/.test(v)) return "700";
  if (/--font-(almarai|noto-kufi)\b/.test(v)) return "800";
  return "900"; // كايرو المتغيّر وطجوال (٩٠٠ عبر الاحتياط الأقرب) — كما كان.
}

export interface KitPalette {
  /** الأرضيّتان كما في الطابع — لا لون جديد. */
  bg: string;
  bg2: string;
  /** حبر الاسم — حبر الطابع، مُحلولاً على كلّ أرضية يقع عليها. */
  text: string;
  /** الخافت (سطر الدعوة والتذييل) — مُحلولاً كذلك. */
  muted: string;
  /** التمييز للكتل والأقراص والإطارات — لون الطابع (أو العلامة) كما هو. */
  accent: string;
  /** التمييز **نصّاً** على الأرضية (العرض الترويجي). */
  accentInk: string;
  /** الكتلة التي يُكتب عليها (شارة الطاولة، شريط) — التمييز إن قرأ عليه نصّه. */
  accentBlock: string;
  onAccent: string;
  qrDark: string;
  qrLight: string;
  pattern: PatternId;
  patternOpacity: number;
  skin: MenuSkin;
  /** متغيّرا الخطّ كما في الطابع (`var(--font-x)`) — لتحميلهما قبل الرسم. */
  fontVar: string;
  displayVar: string;
  displayWeight: string;
  /**
   * الأرضيات التي حُلّ عليها التباين — يقرؤها الفحص ليثبت ما يَعِد به: كلّ
   * نصٍّ يقع على أيٍّ منها بـ٤٫٥:١ فأكثر.
   */
  grounds: string[];
}

/** شفافية أعلى ما يُرسم تحت النصّ من ملمس الحافّة (أخاديد اللبّاد، شبكة عصري). */
export const TEXTURE_ALPHA = 0.06;
/** الزخرفة على البطاقة أعلى بقليل من المنيو — الورق يبتلع الحبر الخفيف. */
export const PATTERN_BOOST = 0.02;

/**
 * لوحة القطعة من طابع المنيو — **بلا مسّ قيمة لون في الطابع** (§١٨).
 *
 * ⚠️ الطابع صُمّم لشاشة، والبطاقة ليست شاشة: النصّ يقع على تدرّجٍ من `--m-bg-2`
 * إلى `--m-bg`، وفوقه زخرفةٌ بلون التمييز، وفوقها ملمسٌ بحبر الطابع. فيُحلّ كلّ
 * حبرٍ نصّيّ على **كلّ** تلك الأرضيات (الدرس ٥٤: الأرضية الفعلية لا أرضيّتا
 * الطابع)، بنفس `readableOn` التي يحلّ بها المنيو حبر سعره — والحلّ اشتقاقٌ
 * على القطعة لا تعديلٌ على الطابع.
 */
export function kitPalette(themeId: string | null, brandHex: string | null = null): KitPalette {
  const raw = brandHex && isHex(brandHex) ? normalizeHex(brandHex) : null;
  const theme = getTheme(themeId);
  const v = theme.vars;
  const bg = isHex(v["--m-bg"] ?? "") ? normalizeHex(v["--m-bg"]) : "#141210";
  const bg2 = isHex(v["--m-bg-2"] ?? "") ? normalizeHex(v["--m-bg-2"]) : bg;
  const accent = raw ?? (isHex(v["--m-accent"] ?? "") ? normalizeHex(v["--m-accent"]) : "#d4a843");
  const text0 = isHex(v["--m-text"] ?? "") ? normalizeHex(v["--m-text"]) : "#f6f1e6";
  const muted0 = isHex(v["--m-muted"] ?? "") ? normalizeHex(v["--m-muted"]) : "#9a8f7c";
  const pattern = theme.design.pattern;
  const patternOpacity = pattern === "none" ? 0 : theme.design.patternOpacity + PATTERN_BOOST;

  // الأرضيات: الطرفان ووسط التدرّج، وكلٌّ منها تحت الزخرفة (بلون التمييز) وتحت
  // الملمس (بحبر النصّ) — أسوأ بكسلٍ يقع عليه حرف.
  const base = [bg, bg2, mixHex(bg, bg2, 0.5)];
  const grounds = [
    ...base,
    ...base.map((g) => mixHex(g, accent, Math.min(1, patternOpacity))),
    ...base.map((g) => mixHex(g, text0, TEXTURE_ALPHA)),
  ];
  const solve = (ink: string) => {
    // الاتّجاه واحد لكلّ أرضيات الطابع (كلّها داكنة أو كلّها فاتحة)، فحلٌّ لا
    // يُفسد ما قبله — ثم دورةٌ ثانية تحسم أيّ أرضية تحرّك عنها الحبر بعد حلّها.
    let c = ink;
    for (let pass = 0; pass < 2; pass++) for (const g of grounds) c = readableOn(c, g);
    return c;
  };

  const onAccent = bestOnAccent(accent);
  // قلّما يلزم: `bestOnAccent` تختار الأعلى بين الغامق والأبيض، وأسوأ لونٍ
  // متوسّط يعطي أقلّ من ٤٫٥ بقليل. فتُدفع الكتلة (لا النصّ) بعيداً عنه.
  const accentBlock = contrastRatio(accent, onAccent) >= 4.5 ? accent : readableOn(accent, onAccent);

  const fontVar = v["--m-font"] ?? "var(--font-tajawal)";
  const displayVar = v["--m-display"] ?? fontVar;
  return {
    bg,
    bg2,
    text: solve(text0),
    muted: solve(muted0),
    accent,
    accentInk: solve(accent),
    accentBlock,
    onAccent,
    // الكود بحبر العلامة بعد حارس ٧:١ — كما في صفحة الأكواد (`qrSafeColor`).
    qrDark: qrSafeColor(accent),
    qrLight: "#ffffff",
    pattern,
    patternOpacity,
    skin: theme.design.skin,
    fontVar,
    displayVar,
    displayWeight: displayWeightOf(displayVar),
    grounds,
  };
}

/* ── ورقة الطباعة ────────────────────────────────────────────────────── */

/**
 * صفحة الطباعة لنسخٍ من صورةٍ واحدة على A4 — **مصدر واحد** للاستوديو والعدّة.
 *
 * كانت مكتوبةً داخل `Cards.tsx`؛ ولمّا احتاجتها العدّة نُقلت بدل أن تُنسخ:
 * قياسان مختلفان للورقة الواحدة يعنيان أن `perSheet` يَعِد بستّ ويطبع غيرها.
 * `@page{margin:8mm}` و`gap:6mm` هما ما يحسب عليه `perSheet` (`A4` في
 * `cards.ts`) — فلا يتغيّر أحدهما وحده.
 */
export function sheetHtml(png: string, mm: [number, number], copies: number, title = "بطاقات للطباعة"): string {
  const safeTitle = title.replace(/[<>&"']/g, "");
  const imgs = [...Array(Math.max(1, copies))].map(() => `<img src="${png}" alt="">`).join("");
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<title>${safeTitle}</title><style>
  @page{size:A4;margin:8mm}
  body{margin:0;display:flex;flex-wrap:wrap;gap:6mm;align-content:flex-start;justify-content:center}
  img{width:${mm[0]}mm;height:${mm[1]}mm;object-fit:contain;
      outline:1px dashed #ccc;outline-offset:2mm;break-inside:avoid}
</style></head><body>${imgs}</body></html>`;
}

/** اسم ملف القطعة — يحمل المطعم والقطعة، و«bleed» إن كان للمطبعة. */
export function kitFileName(slug: string | null, piece: KitPieceId, bleed = false): string {
  return `cloudmenu-${slug || "menu"}-${piece}${bleed ? "-bleed" : ""}.png`;
}

/**
 * استوديو بطاقات الكاشير — يرسم بطاقة QR جاهزة للطباعة بهوية المطعم.
 *
 * ═══ لماذا canvas لا HTML→صورة ═══
 *
 * الطباعة تحتاج **بكسلات حقيقية بدقة 300DPI**: بطاقة 100×150مم تعني
 * 1181×1772 بكسل. تحويل HTML إلى صورة يحتاج مكتبة (html2canvas ~200KB) تُعيد
 * تنفيذ محرّك تخطيط ناقص ثم تخطئ في العربية وفي الخطوط المستضافة. الرسم
 * المباشر أدقّ وأخفّ، والثمن أن التخطيط يُكتب يدوياً هنا.
 *
 * ═══ ثلاثة محاور، لا واحد ═══
 *
 * البطاقة = **قياس × نمط × تخطيط**. النسخة الأولى كان لها محوران فقط (قياس
 * ونمط) وتخطيطٌ واحد لكل شيء: كلّ عنصر متمركز على محور واحد بمسافات متساوية،
 * فتخرج البطاقات كلها كومةً من العناصر لا تصميماً. والأسوأ أن الهرم كان مقلوباً
 * — اسم المطعم أكبر عنصر بينما **الكود هو الفعل المطلوب**.
 *
 * ═══ أربعة مزالق محسوبة ═══
 *
 * 1. **الخط**: `loadThemeFont` ثم `document.fonts.ready` قبل أي `fillText`.
 *    الثانية وحدها لا تكفي بعد أن صارت خطوط الطوابع تُحمَّل عند الطلب: تُرضى
 *    فوراً إن لم يُطلب الخطّ أصلاً، فتُرسم البطاقة بخطّ احتياطي بصمت.
 * 2. **طول الاسم**: `fitLines` تُصغّر ثم تلفّ ثم تقصّ. أسماء المطاعم السعودية
 *    طويلة عادةً، فهذه الحالة الشائعة لا الطرفية.
 * 3. **الشعار عبر CORS**: أي فشل ⇒ تُرسم البطاقة بلا شعار. زرّ تنزيل لا يعمل
 *    أسوأ من بطاقة بلا شعار.
 * 4. **منطقة هدوء الكود**: `qrDataUrl` يولّد بهامش وحدتين والمواصفة تطلب أربعاً؛
 *    الفرق يسدّه بياض اللوح تحته. فأي زخرفة أو علامة تُرسم **داخل** ذلك البياض
 *    تأكل منطقة الهدوء وتُفشل المسح — ولهذا علامات الأركان خارج اللوح لا داخله.
 */
import { qrDataUrl, loadImage } from "./qr";
import { ALL_THEMES, bestOnAccent, isHex, normalizeHex } from "./themes";
import { patternImage, PATTERN_MM, type PatternId } from "./patterns";
import { loadThemeFont } from "./fonts";
import { iconNameOf, paintIcon } from "./icons";

/* ── القياسات ──────────────────────────────────────────────────────── */

export type CardSizeId = "counter" | "tent" | "card" | "sticker" | "a5" | "window";

export interface CardSize {
  id: CardSizeId;
  name: string;
  /** بالمليمتر — العرض ثم الارتفاع. */
  mm: [number, number];
  desc: string;
  /** عدد ما يُطبع منها في ورقة A4 واحدة — **محسوب** لا مكتوب (`perSheet`). */
  perSheet: number;
}

/**
 * ورقة A4 كما يراها المتصفح عند الطباعة: `@page { size:A4; margin:8mm }`
 * تترك ١٩٤×٢٨١مم، والبطاقات تتباعد بـ٦مم في صفحة الطباعة.
 */
const A4 = { w: 210, h: 297, margin: 8, gap: 6 };

/**
 * كم بطاقة تسع فعلاً في ورقة A4.
 *
 * ⚠️ كان الرقم مكتوباً بالي(د): `counter` (١٠٠×١٥٠مم) كُتب لها **٢** بينما
 * بطاقتان جنباً إلى جنب تحتاجان ٢٠٦مم عرضاً والمتاح ١٩٤، وفوق بعضهما ٣٠٦مم
 * والمتاح ٢٨١. فكان الزرّ يَعِد التاجر بورقة فيها اثنتان ويطبع له صفحتين.
 * الحساب هنا يجعل الرقم صادقاً تلقائياً لأي قياس يُضاف لاحقاً.
 */
export function perSheet([w, h]: [number, number]): number {
  const fit = (avail: number, dim: number) =>
    Math.max(0, Math.floor((avail + A4.gap) / (dim + A4.gap)));
  // ⚠️ بلا إدارة: صفحة الطباعة تصفّ الصور كما هي، فحسابُ «الأفضل بين الوضعين»
  // يعد بتسع بطاقات ٨٥×٥٥ بينما الصفحة تسع ثماني — كذبةٌ أدقّ من سابقتها لكنها
  // كذبة. الرقم يجب أن يصف ما تفعله صفحة الطباعة فعلاً.
  return fit(A4.w - A4.margin * 2, w) * fit(A4.h - A4.margin * 2, h);
}

function size(
  id: CardSizeId,
  name: string,
  mm: [number, number],
  desc: string
): CardSize {
  return { id, name, mm, desc, perSheet: perSheet(mm) };
}

export const CARD_SIZES: CardSize[] = [
  size("counter", "ستاند الكاشير", [100, 150], "يوضع في ستاند أكريليك عند نقطة الدفع"),
  size("tent", "ستاند مثلث (يُطوى)", [100, 210], "يُطوى من المنتصف فيقف على الطاولة بوجهين"),
  size("card", "كرت صغير", [85, 55], "بحجم كرت العمل — مع الفاتورة أو الطلب"),
  size("sticker", "ملصق مربّع", [80, 80], "يُلصق على الطاولة أو الواجهة"),
  size("window", "ملصق واجهة", [150, 150], "كبير — على زجاج المدخل يُقرأ من الشارع"),
  size("a5", "بوستر A5", [148, 210], "على الجدار أو ستاند المدخل"),
];

/* ── الأنماط ───────────────────────────────────────────────────────── */

export type CardStyleId = "dark" | "light" | "mono" | "night" | "brand" | "heritage";

export interface CardStyle {
  id: CardStyleId;
  name: string;
  desc: string;
}

export const CARD_STYLES: CardStyle[] = [
  { id: "dark", name: "أسود فاخر", desc: "خلفية داكنة وذهب، وزخرفة جيري خافتة" },
  { id: "light", name: "عاجي ناعم", desc: "فاتح دافئ — الأوفر حبراً عند الطباعة" },
  { id: "heritage", name: "تراثي بالسدو", desc: "رمليّ وفيروزي بنسيج سدو" },
  { id: "night", name: "ليل حضري", desc: "فحميّ بلون كهربائي — للكافيهات الحديثة" },
  { id: "mono", name: "أبيض وأسود", desc: "بلا تدرّجات ولا زخرفة — أرخص طباعة وأوضحها" },
  { id: "brand", name: "ألوان منيوك", desc: "يأخذ ألوانه من طابع منيوك نفسه" },
];

/* ── التخطيطات ─────────────────────────────────────────────────────── */

export type CardLayoutId = "centered" | "split" | "framed" | "banner";

export interface CardLayout {
  id: CardLayoutId;
  name: string;
  desc: string;
  /** القياسات التي يليق بها — ما لا يليق لا يُعرض بدل أن يُعرض مشوّهاً. */
  allow: CardSizeId[];
}

export const CARD_LAYOUTS: CardLayout[] = [
  {
    id: "centered",
    name: "متمركز",
    desc: "الكود في القلب والاسم فوقه — الأوضح من بعيد",
    allow: ["counter", "tent", "card", "sticker", "window", "a5"],
  },
  {
    id: "split",
    name: "مقسوم",
    desc: "كتلة ملوّنة أعلاها تحمل شعارك واسمك",
    allow: ["counter", "tent", "sticker", "window", "a5"],
  },
  {
    id: "framed",
    name: "بإطار",
    desc: "إطار مزدوج بعلامات أركان — أقرب للفخامة",
    allow: ["counter", "card", "window", "a5"],
  },
  {
    id: "banner",
    name: "شريط سفلي",
    desc: "الكود مهيمن وشريط ملوّن أسفله للطاولة والعرض",
    allow: ["counter", "card", "sticker", "window", "a5"],
  },
];

export function layoutsFor(id: CardSizeId): CardLayout[] {
  return CARD_LAYOUTS.filter((l) => l.allow.includes(id));
}

/** أول تخطيط مسموح — لضبط الحالة حين يبدّل التاجر القياس. */
export function defaultLayout(id: CardSizeId): CardLayoutId {
  return layoutsFor(id)[0]?.id ?? "centered";
}

const DPI = 300;
const MM_PER_INCH = 25.4;
/** حدود القصّ التي تطلبها المطابع — ٣مم من كل جهة. */
export const BLEED_MM = 3;

/** مليمتر → بكسل بدقة الطباعة. */
export function mmToPx(mm: number, dpi = DPI): number {
  return Math.round((mm / MM_PER_INCH) * dpi);
}

export function sizeOf(id: CardSizeId): CardSize {
  return CARD_SIZES.find((s) => s.id === id) ?? CARD_SIZES[0];
}

/* ── لوحة الألوان ──────────────────────────────────────────────────── */

interface Palette {
  bg: string;
  bg2: string;
  text: string;
  muted: string;
  accent: string;
  onAccent: string;
  /** خلفية مربّع الـQR — فاتحة دائماً، فقارئات الجوال تتوقّع تبايناً عالياً. */
  qrLight: string;
  qrDark: string;
  pattern: PatternId;
  patternOpacity: number;
  font: string;
  /**
   * «مقتصد في الحبر»: يمنع المساحات الملوّنة الكبيرة.
   *
   * النمط `mono` وُجد ليكون **أرخص طباعة**، وكتلة سوداء تملأ ثلث البطاقة تنقض
   * سبب وجوده. فتصير الكتل عنده إطاراً بخطّ رفيع بدل مساحة مصمتة.
   */
  frugal: boolean;
}

const FALLBACK_FONT = '"Cairo Variable", "Segoe UI", system-ui, sans-serif';

/** يحلّ `var(--font-reem)` إلى مكدّس الخطوط الفعلي — canvas لا يفهم المتغيّرات. */
function resolveFont(value: string | undefined): string {
  if (!value) return FALLBACK_FONT;
  const ref = /var\((--[a-z0-9-]+)\)/i.exec(value);
  if (!ref) return value;
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(ref[1]).trim();
    return v || FALLBACK_FONT;
  } catch {
    return FALLBACK_FONT;
  }
}

/**
 * ⚠️ `useBrand` ليس تفصيلاً: بدونه كان لون علامة التاجر **يدهس كل الأنماط**،
 * فيخرج «أسود فاخر — خلفية داكنة ولمسة ذهبية» فيروزياً لمن لون علامته فيروزي.
 * النمط الذي يَعِد بالذهب يجب أن يعطي ذهباً؛ ومن أراد لونه فله «ألوان منيوك»
 * أو مفتاح صريح.
 */
function paletteFor(
  style: CardStyleId,
  themeId: string | null,
  brandHex: string | null,
  useBrand: boolean
): Palette {
  const raw = brandHex && isHex(brandHex) ? normalizeHex(brandHex) : null;
  const brand = style === "brand" || useBrand ? raw : null;

  if (style === "brand") {
    // ألوان طابع منيو التاجر — فتخرج البطاقة أخت منيوه لا غريبة عنه.
    const theme = ALL_THEMES.find((t) => t.id === themeId) ?? ALL_THEMES[0];
    const v = theme.vars;
    const accent = brand ?? v["--m-accent"] ?? "#c9a227";
    return {
      bg: v["--m-bg"] ?? "#141210",
      bg2: v["--m-bg-2"] ?? v["--m-bg"] ?? "#141210",
      text: v["--m-text"] ?? "#f6f1e6",
      muted: v["--m-muted"] ?? "#9a8f7c",
      accent,
      onAccent: bestOnAccent(accent),
      qrLight: "#ffffff",
      qrDark: "#141210",
      pattern: theme.design.pattern,
      patternOpacity: theme.design.patternOpacity + 0.02,
      font: resolveFont(v["--m-font"]),
      frugal: false,
    };
  }

  if (style === "light") {
    const accent = brand ?? "#b98a1e";
    return {
      bg: "#faf7f0", bg2: "#f1ebdd", text: "#1a1613", muted: "#7b7264",
      accent, onAccent: bestOnAccent(accent),
      qrLight: "#ffffff", qrDark: "#141210",
      pattern: "mashrabiya", patternOpacity: 0.035,
      font: FALLBACK_FONT, frugal: false,
    };
  }

  if (style === "mono") {
    // بلا لون علامة ولو طُلب: النمط كله «حبر واحد»، وإدخال لون ثانٍ يُبطله.
    return {
      bg: "#ffffff", bg2: "#ffffff", text: "#000000", muted: "#4a4a4a",
      accent: "#000000", onAccent: "#ffffff",
      qrLight: "#ffffff", qrDark: "#000000",
      pattern: "none", patternOpacity: 0,
      font: FALLBACK_FONT, frugal: true,
    };
  }

  if (style === "night") {
    const accent = brand ?? "#5b93ff";
    return {
      bg: "#090c13", bg2: "#141b2b", text: "#e9eef8", muted: "#8794ab",
      accent, onAccent: bestOnAccent(accent),
      qrLight: "#ffffff", qrDark: "#0a0d14",
      pattern: "najma", patternOpacity: 0.05,
      font: FALLBACK_FONT, frugal: false,
    };
  }

  if (style === "heritage") {
    const accent = brand ?? "#1f7a72";
    return {
      bg: "#f4e8d5", bg2: "#e9d9be", text: "#33261a", muted: "#8a745a",
      accent, onAccent: bestOnAccent(accent),
      qrLight: "#fffaf1", qrDark: "#33261a",
      pattern: "sadu", patternOpacity: 0.085,
      font: resolveFont("var(--font-reem)"), frugal: false,
    };
  }

  // dark — أسود عميق وذهب، بنسيج جيري خافت جداً.
  const accent = brand ?? "#d4a843";
  return {
    bg: "#111010", bg2: "#1c1916", text: "#f7f2e7", muted: "#9a8f7c",
    accent, onAccent: bestOnAccent(accent),
    qrLight: "#ffffff", qrDark: "#141210",
    pattern: "girih", patternOpacity: 0.03,
    font: FALLBACK_FONT, frugal: false,
  };
}

/* ── أدوات نصّ ─────────────────────────────────────────────────────── */

/** أكبر حجم خط يجعل النص يسع العرض المتاح — بحد أدنى كي لا يصير مجهرياً. */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  start: number,
  min: number,
  weight: string,
  font: string
): number {
  let s = start;
  while (s > min) {
    ctx.font = `${weight} ${s}px ${font}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    s -= Math.max(1, Math.round(s * 0.04));
  }
  ctx.font = `${weight} ${s}px ${font}`;
  return s;
}

/** لفّ جشع على المسافات. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [text];
}

/**
 * يُصغّر ثم **يلفّ** — لا يُصغّر وحده.
 *
 * `fitText` وحدها تتوقّف عند الحد الأدنى ثم تترك النص يفيض: «مطعم مشراق
 * للمأكولات الشعبية» على كرت 85×55مم لا يسع سطراً واحداً بأي حجم مقروء، فكان
 * يمتدّ تحت مربّع الـQR ويُفشل مسحه.
 *
 * وإن لم يسع حتى بالحد الأدنى وبأقصى عدد أسطر، يُقصّ آخر سطر بثلاث نقاط.
 */
function fitLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  start: number,
  min: number,
  weight: string,
  font: string,
  maxLines = 2
): { size: number; lines: string[] } {
  let s = start;
  for (;;) {
    ctx.font = `${weight} ${s}px ${font}`;
    const lines = wrap(ctx, text, maxWidth);
    if (
      (lines.length <= maxLines && lines.every((l) => ctx.measureText(l).width <= maxWidth)) ||
      s <= min
    ) {
      const kept = lines.slice(0, maxLines);
      if (lines.length > maxLines && kept.length) {
        let last = `${kept[kept.length - 1]}…`;
        while (last.length > 1 && ctx.measureText(last).width > maxWidth) {
          last = `${last.slice(0, -2)}…`;
        }
        kept[kept.length - 1] = last;
      }
      return { size: s, lines: kept };
    }
    s -= Math.max(1, Math.round(s * 0.05));
  }
}

/**
 * سلّم الأحجام — نسبة من **الضلع القصير** لا من العرض.
 *
 * النسب كانت مبعثرة (`W*0.095`، `H*0.135`، `W*0.05`…) وكلها من العرض، فانكسرت
 * على الكرت العريض القصير: `W*0.095` هناك = ٩٥ بكسل ارتفاع خط على بطاقة
 * ارتفاعها ٦٥٠ — فيبتلع الاسم البطاقة. الضلع القصير يبقي التناسب واحداً مهما
 * تغيّرت نسبة الأبعاد.
 */
function scaleOf(W: number, H: number, k: number) {
  const S = Math.min(W, H);
  return {
    display: S * 0.094 * k,
    title: S * 0.062 * k,
    body: S * 0.042 * k,
    caption: S * 0.028 * k,
  };
}

/* ── أدوات رسم ─────────────────────────────────────────────────────── */

/** يستخرج الـdata-URI من قيمة `background-image` التي تعيدها `patternImage`. */
function patternUri(css: string): string | null {
  const m = /url\(["']?(.+?)["']?\)/s.exec(css);
  return m ? m[1] : null;
}

async function paintPattern(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  id: PatternId,
  color: string,
  opacity: number,
  tile: number
): Promise<void> {
  if (id === "none" || opacity <= 0) return;
  const uri = patternUri(patternImage(id, color, opacity));
  if (!uri) return;
  try {
    const img = await loadImage(uri);
    // تُرسم على لوحة مساعدة بمقاس البلاطة المطلوب ثم تُكرَّر: `createPattern`
    // يكرّر بالحجم الأصلي للصورة، وهو صغير جداً عند 300DPI فيبدو ضجيجاً.
    const tc = document.createElement("canvas");
    tc.width = tile;
    tc.height = tile;
    const tctx = tc.getContext("2d");
    if (!tctx) return;
    tctx.drawImage(img, 0, 0, tile, tile);
    const pat = ctx.createPattern(tc, "repeat");
    if (!pat) return;
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, w, h);
  } catch {
    /* الزخرفة تحسين لا شرط — البطاقة تُرسم بدونها. */
  }
}

/* ── المدخلات ──────────────────────────────────────────────────────── */

export interface CardInput {
  size: CardSizeId;
  style: CardStyleId;
  layout: CardLayoutId;
  /** اسم المطعم كما يظهر على البطاقة. */
  name: string;
  logo: string | null;
  emoji: string | null;
  /** معرّف طابع منيو التاجر — لنمط «ألوان منيوك». */
  themeId: string | null;
  brandHex: string | null;
  url: string;
  table?: string | null;
  promo?: string | null;
  headline?: string;
  /** يفرض لون العلامة على الأنماط الثابتة — اختيار صريح من التاجر. */
  useBrand?: boolean;
  /** حدود قصّ ٣مم + علامات قصّ، كما تطلب المطابع. */
  bleed?: boolean;
}

const DEFAULT_HEADLINE = "امسح وتصفّح المنيو";
const FOOTER = "Powered by CloudMenu";
/** أصغر كود يُمسح بثقة من مسافة ذراع — ٢٤مم. */
const QR_MIN_MM = 24;

/**
 * يرسم البطاقة على canvas معطى.
 *
 * `scale` يسمح بمعاينة مصغّرة **بنفس الدالة**: معاينة مرسومة بمنطق آخر تكذب على
 * التاجر، فيُنزّل ملفاً لا يشبه ما رآه.
 */
export async function renderCard(
  canvas: HTMLCanvasElement,
  input: CardInput,
  scale = 1
): Promise<void> {
  const meta = sizeOf(input.size);
  const p = paletteFor(input.style, input.themeId, input.brandHex, input.useBrand === true);

  // ⚠️ الترتيب مقصود — انظر رأس الملف (المزلق ١).
  await loadThemeFont(p.font);
  if (document.fonts?.ready) await document.fonts.ready;

  const bleed = input.bleed ? Math.round(mmToPx(BLEED_MM) * scale) : 0;
  const W = Math.round(mmToPx(meta.mm[0]) * scale);
  const H = Math.round(mmToPx(meta.mm[1]) * scale);
  canvas.width = W + bleed * 2;
  canvas.height = H + bleed * 2;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.direction = "rtl";
  ctx.textAlign = "center";

  // أرضية تغطّي منطقة القصّ أيضاً: التدرّجات تُرسم لكل وجه داخل منطقة القصّ،
  // فلولا هذه لخرجت الحواف بيضاء وضاع الغرض من الـbleed.
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(bleed, bleed);

  if (input.size === "tent") {
    /**
     * الستاند المثلث: الورقة تُطوى من المنتصف فتقف كـ`Λ`.
     *
     * ⚠️ الطيّة هي **القمّة**، وحافتا الورقة هما ما يلامس الطاولة. فرأس كل وجه
     * (الشعار) عند الطيّة وقدمه (التذييل) عند الحافة الخارجية. النسخة الأولى
     * فعلت العكس تماماً — رسمت الوجه الأول من حافة الورقة نازلاً والثاني مقلوباً
     * من الحافة الأخرى، فاستقرّ الشعاران على الطاولة والتذييلان تصادما عند
     * القمّة. التحويلان أدناه يجعلان الوجهين ينموان **من الطيّة إلى الخارج**.
     */
    const half = Math.round(H / 2);
    ctx.save();
    ctx.translate(0, half);
    await paintFace(ctx, W, half, p, input);
    ctx.restore();

    ctx.save();
    ctx.translate(W, half);
    ctx.rotate(Math.PI);
    await paintFace(ctx, W, half, p, input);
    ctx.restore();

    ctx.save();
    ctx.setLineDash([W * 0.02, W * 0.02]);
    ctx.strokeStyle = p.muted;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = Math.max(1, W * 0.003);
    ctx.beginPath();
    ctx.moveTo(0, half);
    ctx.lineTo(W, half);
    ctx.stroke();
    ctx.restore();
  } else {
    await paintFace(ctx, W, H, p, input);
  }

  ctx.restore();
  if (bleed) paintCropMarks(ctx, canvas.width, canvas.height, bleed, p);
}

/**
 * علامات القصّ — خطوط قصيرة عند أركان خط القصّ داخل منطقة الـbleed.
 * تُرسم بلون النصّ لا بالأسود دائماً: على بطاقة داكنة لا يُرى الأسود.
 */
function paintCropMarks(
  ctx: CanvasRenderingContext2D,
  CW: number,
  CH: number,
  b: number,
  p: Palette
): void {
  const len = b * 0.7;
  ctx.save();
  ctx.strokeStyle = p.muted;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = Math.max(1, b * 0.06);
  ctx.beginPath();
  for (const [x, sx] of [
    [b, -1],
    [CW - b, 1],
  ] as const) {
    for (const [y, sy] of [
      [b, -1],
      [CH - b, 1],
    ] as const) {
      ctx.moveTo(x + sx * (b - len), y);
      ctx.lineTo(x + sx * b, y);
      ctx.moveTo(x, y + sy * (b - len));
      ctx.lineTo(x, y + sy * b);
    }
  }
  ctx.stroke();
  ctx.restore();
}

/** وجه واحد من البطاقة — يُستدعى مرتين لبطاقة الطيّ. */
async function paintFace(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  p: Palette,
  input: CardInput
): Promise<void> {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.clip(); // وجه لا يتسرّب إلى وجه — حارس الطيّ.

  if (p.frugal) {
    ctx.fillStyle = p.bg;
    ctx.fillRect(0, 0, W, H);
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, p.bg2);
    grad.addColorStop(1, p.bg);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }
  // البلاطة بمقياس **فيزيائي**: كانت ٢٢٪ من العرض ≈ ٢٦مم فتخرج كتلاً عملاقة
  // لا نسيجاً (بدا السدو على الستاند المثلث كأسهم). النسيج يُقرأ نسيجاً عند
  // مقاس ثابت بالمليمتر مهما كبرت الورقة — كقماش حقيقي.
  const tileMm = PATTERN_MM[p.pattern];
  if (tileMm) {
    const tile = Math.max(24, Math.round((mmToPx(tileMm) * W) / mmToPx(sizeOf(input.size).mm[0])));
    await paintPattern(ctx, W, H, p.pattern, p.accent, p.patternOpacity, tile);
  }

  if (W > H) await paintRow(ctx, W, H, p, input);
  else await paintStack(ctx, W, H, p, input);

  ctx.restore();
}

/** شارة الشعار — دائرة بلون التمييز، وبداخلها صورة الشعار أو الإيموجي. */
async function paintLogo(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  p: Palette,
  input: CardInput,
  invert = false
): Promise<void> {
  const disc = invert ? p.onAccent : p.accent;
  const glyph = invert ? p.accent : p.onAccent;
  ctx.save();
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  if (p.frugal) {
    // «مقتصد»: قرص مصمت يعني حبراً كثيراً، فيصير حلقة.
    ctx.fillStyle = p.bg;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }

  if (input.logo) {
    try {
      const img = await loadImage(input.logo, true);
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.88, 0, Math.PI * 2);
      ctx.clip();
      const d = r * 1.76;
      ctx.drawImage(img, cx - d / 2, cy - d / 2, d, d);
      ctx.restore();
      return;
    } catch {
      /* يسقط إلى الإيموجي أدناه — انظر رأس الملف. */
    }
  }
  /**
   * ⚠️ **الرمز يُرسم مساراً لا نصّاً.**
   *
   * كان هنا `fillText(input.emoji)`، فيأتي شكل الإيموجي من **خطّ نظام
   * التشغيل**: `🍽` على ماك غيره على ويندوز غيره على أندرويد. أي أن الملف
   * المُنزَّل يختلف عن المعاينة التي رآها التاجر على الشاشة — وهذا نقضٌ صريح
   * لقاعدة الاستوديو «معاينة بمنطق رسم آخر تكذب على التاجر»، ولا يُكتشف إلا
   * بعد أن تُطبع مئة بطاقة.
   *
   * `paintIcon` تستعمل **نفس مسارات** `Icon` في الـDOM، فما يُطبع هو ما يُرى.
   * والإيموجي القديم يبقى مرسوماً بالنصّ كما كان — لا نبدّل رمز تاجر محفوظ.
   */
  const color = p.frugal ? p.text : glyph;
  const icon = iconNameOf(input.emoji);
  if (icon) {
    paintIcon(ctx, icon, cx, cy, r * 1.5, color, { weight: 1.9 });
  } else {
    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    ctx.font = `${Math.round(r * 1.05)}px ${FALLBACK_FONT}`;
    ctx.fillText(input.emoji || "🍽", cx, cy + r * 0.04);
  }
  ctx.restore();
}

/**
 * مربّع الكود على خلفية فاتحة + علامات أركان.
 *
 * ⚠️ العلامات **خارج اللوح** بفجوة: بياض اللوح هو ما يكمّل منطقة هدوء الكود
 * (`qrDataUrl` يولّد بهامش وحدتين والمواصفة تطلب أربعاً)، فأي حبر داخله يقضم
 * الهدوء ويُفشل المسح — والطباعة على ستاند تُقرأ من نصف متر في إضاءة مطعم،
 * وهناك لا مجال لتسامح القارئ.
 */
async function paintQr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  p: Palette,
  input: CardInput,
  brackets = true
): Promise<void> {
  const pad = s * 0.05;
  ctx.save();
  ctx.fillStyle = p.qrLight;
  ctx.beginPath();
  ctx.roundRect(x - pad, y - pad, s + pad * 2, s + pad * 2, s * 0.07);
  ctx.fill();

  if (brackets) {
    const gap = pad * 0.5;
    const arm = s * 0.1;
    const x0 = x - pad - gap;
    const y0 = y - pad - gap;
    const x1 = x + s + pad + gap;
    const y1 = y + s + pad + gap;
    ctx.strokeStyle = p.accent;
    ctx.lineWidth = Math.max(2, s * 0.014);
    ctx.lineCap = "square";
    ctx.beginPath();
    ctx.moveTo(x0, y0 + arm); ctx.lineTo(x0, y0); ctx.lineTo(x0 + arm, y0);
    ctx.moveTo(x1 - arm, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y0 + arm);
    ctx.moveTo(x0, y1 - arm); ctx.lineTo(x0, y1); ctx.lineTo(x0 + arm, y1);
    ctx.moveTo(x1 - arm, y1); ctx.lineTo(x1, y1); ctx.lineTo(x1, y1 - arm);
    ctx.stroke();
  }

  try {
    const px = Math.max(320, Math.round(s));
    const uri = await qrDataUrl(input.url, input.logo, px, { dark: p.qrDark, light: p.qrLight });
    const img = await loadImage(uri);
    /**
     * إحداثيات صحيحة + بلا تنعيم.
     *
     * الرسم على إحداثي كسري يجعل المتصفح يعيد أخذ العينات فتُنعَّم حواف وحدات
     * الكود، ووحدة رمادية الحافة عند 300DPI تطبع ضبابية. (كشفه فكّ الترميز
     * البرمجي وهو أقسى من كاميرا جوال.)
     */
    const smooth = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, Math.round(x), Math.round(y), px, px);
    ctx.imageSmoothingEnabled = smooth;
  } catch {
    /* لن يحدث عملياً: qrDataUrl تبتلع أخطاءها وتعيد الكود العادي. */
  }
  ctx.restore();
}

/** شارة رقم الطاولة. */
function paintTable(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  h: number,
  label: string,
  p: Palette,
  font: string,
  onBar = false
): void {
  ctx.save();
  ctx.font = `800 ${Math.round(h * 0.54)}px ${font}`;
  const w = ctx.measureText(label).width + h * 1.05;
  ctx.fillStyle = onBar ? p.onAccent : p.accent;
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, y, w, h, h / 2);
  if (p.frugal) {
    ctx.strokeStyle = p.text;
    ctx.lineWidth = Math.max(2, h * 0.05);
    ctx.stroke();
    ctx.fillStyle = p.text;
  } else {
    ctx.fill();
    ctx.fillStyle = onBar ? p.accent : p.onAccent;
  }
  ctx.textBaseline = "middle";
  ctx.fillText(label, cx, y + h / 2);
  ctx.restore();
}

/**
 * ارتفاع السطر — الحافة العليا تُجمَع جمعاً بسيطاً ولا تكذب.
 *
 * جُرِّب أولاً بخط أساس `middle` وتقديمٍ بنسب من حجم الخط، فتراكبت شارة الطاولة
 * على لوح الـQR: مع `middle` عليك أن تطرح نصف ارتفاع العنصر السابق وتضيف نصف
 * ارتفاع التالي في كل خطوة، وأي نسبة تقديرية تُخطئ بمقدار نصف سطر.
 */
const LINE = 1.32;

/* ── التخطيط الرأسي (والمربّع) ─────────────────────────────────────── */

interface StackPlan {
  k: number;
  logoR: number;
  name: { size: number; lines: string[] };
  headline: { size: number; text: string } | null;
  qr: number;
  tableH: number;
  promoSize: number;
  footerSize: number;
  gap: number;
  pad: number;
  inner: number;
  headerH: number;
  barH: number;
  /** نصف قطر شارة الشعار الراكبة على حافة الشريط السفلي (صفر لغيره). */
  badgeR: number;
}

/**
 * يوزّع الارتفاع على العناصر — **والنصّ هو من يتنازل، لا الكود ولا الحافة**.
 *
 * ⚠️ النسخة الأولى كتبت `Math.max(320, Math.max(W*0.3, room))` حيث `room` هي
 * المساحة المتبقّية فعلاً — فكانت الأرضيّتان تدهسان الحساب ويتجاوز الكودُ
 * البطاقةَ. النتيجة على الملصق المربّع (٨٠×٨٠مم): العرض الترويجي والتذييل
 * **مقطوعان خارج الحافة**. هنا يُجرَّب معامل تصغير نازل للنصّ حتى يتّسع كل شيء،
 * ثم يُسقَط سطر الدعوة (نصّنا نحن)، ثم يُقصَر الاسم إلى سطر — ولا يُمسّ العرض
 * الترويجي ولا رقم الطاولة إطلاقاً لأنهما بيانات التاجر.
 */
function planStack(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  p: Palette,
  input: CardInput
): StackPlan {
  const cardW = sizeOf(input.size).mm[0];
  const pxPerMm = W / cardW;
  const pad = Math.max(W * 0.075, pxPerMm * 5);
  const inner = W - pad * 2;
  const qrMin = Math.min(inner, QR_MIN_MM * pxPerMm);
  const headline = input.headline?.trim() || DEFAULT_HEADLINE;
  const split = input.layout === "split";
  const banner = input.layout === "banner";
  const framed = input.layout === "framed";
  const innerFrame = framed ? inner - pad * 0.7 : inner;

  for (let step = 0; ; step++) {
    const k = Math.max(0.55, 1 - step * 0.045);
    const last = k <= 0.55;
    const maxLines = step > 8 ? 1 : 2;
    const withHeadline = step <= 10;
    const s = scaleOf(W, H, k);
    const gap = H * 0.021 * Math.max(0.75, k);

    const logoR = W * 0.082 * k;
    const name = fitLines(
      ctx, input.name, innerFrame,
      s.display, Math.max(s.caption, W * 0.038),
      "900", p.font, maxLines
    );
    const hSize = withHeadline ? s.body : 0;
    const tableH = input.table ? s.title * 1.15 : 0;
    const promoSize = input.promo ? s.body * 0.95 : 0;
    const footerSize = s.caption;

    const nameH = name.size * LINE * name.lines.length;
    // كتلة الترويسة (مقسوم) أو الشريط (سفلي) تبتلع الشعار والاسم معاً.
    const headerH = split ? pad * 0.9 + logoR * 2 + gap + nameH + pad * 0.7 : 0;
    /**
     * في «الشريط السفلي» يجلس الشعار **راكباً حافة الشريط** — نصفه فوقها ونصفه
     * تحتها. أول نسخة أسقطت الشعار من هذا التخطيط رأساً: `paintStack` تتخطّى
     * `paintLogo` حين يكون التخطيط شريطاً، فتخرج بطاقةٌ بلا شعار المطعم أصلاً —
     * وهي أول ما تَعِد به الصفحة («شعار مطعمك واسمه»).
     */
    const badgeR = banner ? logoR * 0.85 : 0;
    const barH = banner
      ? badgeR * 0.95 + gap * 0.5 + nameH + (tableH ? gap * 0.7 + tableH : 0) +
        (promoSize ? gap * 0.5 + promoSize * LINE : 0) + footerSize * LINE + pad * 0.85
      : 0;

    let used = pad * (framed ? 1.5 : 1.1); // فراغ علوي
    if (split) used = headerH;
    else if (!banner) used += logoR * 2 + gap * 1.15 + nameH + gap * 0.35;
    if (withHeadline) used += hSize * LINE + gap * 0.9;

    let below = gap; // ما تحت الكود
    if (banner) below += badgeR + gap * 0.4 + barH;
    else {
      if (tableH) below += tableH + gap;
      if (promoSize) below += promoSize * LINE + gap * 0.6;
      below += footerSize * LINE + pad * (framed ? 1.2 : 0.75);
    }

    const room = H - used - below;
    const qrBox = Math.min(innerFrame, room / 1.1); // ١٫١ ← حاشية اللوح ٥٪ من كل جهة
    if (qrBox >= qrMin || last) {
      return {
        k, logoR, name,
        headline: withHeadline ? { size: hSize, text: headline } : null,
        qr: Math.max(Math.min(qrMin, innerFrame), Math.round(qrBox)),
        tableH, promoSize, footerSize, gap, pad, inner: innerFrame, headerH, barH, badgeR,
      };
    }
  }
}

async function paintStack(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  p: Palette,
  input: CardInput
): Promise<void> {
  const L = input.layout;
  const plan = planStack(ctx, W, H, p, input);
  const { pad, gap, inner } = plan;
  ctx.textBaseline = "top";

  if (L === "framed") paintFrame(ctx, W, H, p, pad * 0.55);

  let y = pad * (L === "framed" ? 1.5 : 1.1);

  if (L === "split") {
    /* كتلة ملوّنة تحمل الشعار والاسم — أقوى تمييز بصري بين التخطيطات. */
    ctx.save();
    ctx.fillStyle = p.frugal ? p.bg : p.accent;
    ctx.fillRect(0, 0, W, plan.headerH);
    if (p.frugal) {
      ctx.strokeStyle = p.text;
      ctx.lineWidth = Math.max(2, W * 0.004);
      ctx.beginPath();
      ctx.moveTo(0, plan.headerH);
      ctx.lineTo(W, plan.headerH);
      ctx.stroke();
    }
    ctx.restore();

    let hy = pad * 0.9;
    await paintLogo(ctx, W / 2, hy + plan.logoR, plan.logoR, p, input, true);
    hy += plan.logoR * 2 + gap;
    ctx.fillStyle = p.frugal ? p.text : p.onAccent;
    ctx.textBaseline = "top";
    for (const line of plan.name.lines) {
      ctx.font = `900 ${plan.name.size}px ${p.font}`;
      ctx.fillText(line, W / 2, hy);
      hy += plan.name.size * LINE;
    }
    y = plan.headerH + gap * 1.4;
  } else if (L !== "banner") {
    await paintLogo(ctx, W / 2, y + plan.logoR, plan.logoR, p, input);
    y += plan.logoR * 2 + gap * 1.15;
    ctx.fillStyle = p.text;
    ctx.textBaseline = "top";
    for (const line of plan.name.lines) {
      ctx.font = `900 ${plan.name.size}px ${p.font}`;
      ctx.fillText(line, W / 2, y);
      y += plan.name.size * LINE;
    }
    y += gap * 0.35;
  }

  if (plan.headline) {
    ctx.fillStyle = p.muted;
    ctx.textBaseline = "top";
    fitText(ctx, plan.headline.text, inner, plan.headline.size, plan.headline.size * 0.6, "500", p.font);
    ctx.fillText(plan.headline.text, W / 2, y);
    y += plan.headline.size * LINE + gap * 0.9;
  }

  /* الكود — أكبر عنصر، فهو سبب وجود البطاقة كلها. */
  const qrPad = plan.qr * 0.05;
  await paintQr(ctx, (W - plan.qr) / 2, y + qrPad, plan.qr, p, input, L !== "framed");
  y += plan.qr + qrPad * 2 + gap;

  if (L === "banner") {
    /* شريط سفلي ملوّن يحمل الاسم والطاولة والعرض والتذييل. */
    const top = H - plan.barH;
    ctx.save();
    ctx.fillStyle = p.frugal ? p.bg : p.accent;
    ctx.fillRect(0, top, W, plan.barH);
    if (p.frugal) {
      ctx.strokeStyle = p.text;
      ctx.lineWidth = Math.max(2, W * 0.004);
      ctx.beginPath();
      ctx.moveTo(0, top);
      ctx.lineTo(W, top);
      ctx.stroke();
    }
    ctx.restore();

    // الشعار يركب الحافة: نصفه على الأرضية ونصفه على الشريط، فيربط الكتلتين
    // بدل أن تلتقيا بخطّ حادّ.
    await paintLogo(ctx, W / 2, top, plan.badgeR, p, input, true);

    let by = top + plan.badgeR * 0.95 + plan.gap * 0.5;
    ctx.fillStyle = p.frugal ? p.text : p.onAccent;
    ctx.textBaseline = "top";
    for (const line of plan.name.lines) {
      ctx.font = `900 ${plan.name.size}px ${p.font}`;
      ctx.fillText(line, W / 2, by);
      by += plan.name.size * LINE;
    }
    if (plan.tableH) {
      by += gap * 0.7;
      paintTable(ctx, W / 2, by, plan.tableH, `طاولة ${input.table}`, p, p.font, true);
      by += plan.tableH;
      ctx.textBaseline = "top";
    }
    if (plan.promoSize && input.promo) {
      by += gap * 0.5;
      ctx.fillStyle = p.frugal ? p.text : p.onAccent;
      fitText(ctx, input.promo, inner, plan.promoSize, plan.promoSize * 0.6, "700", p.font);
      ctx.fillText(input.promo, W / 2, by);
      by += plan.promoSize * LINE;
    }
    paintFooter(ctx, W / 2, by + gap * 0.3, plan.footerSize, p, p.frugal ? p.text : p.onAccent);
    return;
  }

  if (plan.tableH) {
    paintTable(ctx, W / 2, y, plan.tableH, `طاولة ${input.table}`, p, p.font);
    y += plan.tableH + gap;
    ctx.textBaseline = "top";
  }
  if (plan.promoSize && input.promo) {
    ctx.fillStyle = p.accent;
    ctx.textBaseline = "top";
    fitText(ctx, input.promo, inner, plan.promoSize, plan.promoSize * 0.6, "700", p.font);
    ctx.fillText(input.promo, W / 2, y);
    y += plan.promoSize * LINE + gap * 0.6;
  }

  /**
   * التذييل يميل للقاع **لكنه لا يُثبَّت فيه**.
   *
   * التثبيت المطلق كان يصطدم بشارة الطاولة والعرض على الوجه القصير من بطاقة
   * الطيّ: المحتوى ينمو نحو القاع بينما التذييل ينتظره هناك فيتراكب النصّان.
   */
  const bottom = H - pad * (L === "framed" ? 1.05 : 0.62) - plan.footerSize * LINE;
  paintFooter(ctx, W / 2, Math.max(y, bottom), plan.footerSize, p, p.muted);
}

function paintFooter(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  fs: number,
  p: Palette,
  color: string
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = p.frugal ? 0.8 : 0.72;
  ctx.textBaseline = "top";
  ctx.font = `500 ${Math.round(fs)}px ${FALLBACK_FONT}`;
  ctx.direction = "ltr";
  ctx.fillText(FOOTER, cx, y);
  ctx.restore();
  ctx.direction = "rtl";
}

/** إطار مزدوج بعلامات أركان — الخطّ الخارجي بلون التمييز والداخلي خافت. */
function paintFrame(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  p: Palette,
  inset: number
): void {
  const r = Math.min(W, H) * 0.02;
  ctx.save();
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = Math.max(2, Math.min(W, H) * 0.006);
  ctx.beginPath();
  ctx.roundRect(inset, inset, W - inset * 2, H - inset * 2, r);
  ctx.stroke();

  const i2 = inset * 1.45;
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = p.muted;
  ctx.lineWidth = Math.max(1, Math.min(W, H) * 0.002);
  ctx.beginPath();
  ctx.roundRect(i2, i2, W - i2 * 2, H - i2 * 2, r * 0.7);
  ctx.stroke();

  // علامات أركان أثقل: تُعطي الإطار «وزناً» عند الزوايا كإطار مطبوع حقيقي.
  ctx.globalAlpha = 1;
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = Math.max(3, Math.min(W, H) * 0.011);
  const arm = Math.min(W, H) * 0.07;
  ctx.beginPath();
  for (const [x, sx] of [[inset, 1], [W - inset, -1]] as const) {
    for (const [y, sy] of [[inset, 1], [H - inset, -1]] as const) {
      ctx.moveTo(x + sx * r, y + sy * arm);
      ctx.lineTo(x + sx * r, y + sy * r * 0.6);
      ctx.moveTo(x + sx * arm, y + sy * r);
      ctx.lineTo(x + sx * r * 0.6, y + sy * r);
    }
  }
  ctx.stroke();
  ctx.restore();
}

/* ── التخطيط الأفقي (الكرت الصغير) ────────────────────────────────── */

/**
 * الكرت العريض القصير: الكود في جهة والنصّ في الأخرى.
 *
 * ⚠️ عطلان أُصلحا هنا: (١) كان الكود يأخذ **٩٢٪** من الارتفاع فيخنق عمود النصّ
 * حتى صار اسم «مطعم مشراق للمأكولات الشعبية» يُقصّ إلى «للمأكولات…»؛
 * (٢) `table` و`promo` كانا **لا يُرسمان إطلاقاً** — التاجر يكتبهما في
 * الاستوديو فيختفيان بلا أثر ولا تفسير. الكود الآن ٧٦٪ (≈٣٧مم على كرت ٥٥مم،
 * وفوق حدّ المسح من ٣٠سم بمراحل) والعمود يتّسع للاثنين.
 */
async function paintRow(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  p: Palette,
  input: CardInput
): Promise<void> {
  const L = input.layout;
  const pxPerMm = H / sizeOf(input.size).mm[1];
  const pad = Math.max(H * 0.085, pxPerMm * 4);
  if (L === "framed") paintFrame(ctx, W, H, p, pad * 0.5);

  const frameInset = L === "framed" ? pad * 0.8 : 0;
  const barH = L === "banner" ? H * 0.16 : 0;
  const availH = H - pad * 2 - frameInset - barH;
  const qr = Math.round((availH * 0.98) / 1.1);
  const qrPad = qr * 0.05;
  // الكود في اليمين: العين العربية تبدأ من اليمين، والكود هو الفعل المطلوب.
  const qrX = W - pad - frameInset - qrPad - qr;
  await paintQr(ctx, qrX, pad + frameInset + qrPad, qr, p, input, L !== "framed");

  const textW = qrX - qrPad - pad * 2 - frameInset;
  const cx = pad + frameInset + textW / 2;
  const s = scaleOf(W, H, 1);
  const gap = H * 0.028;
  ctx.textBaseline = "top";

  const r = H * 0.085;
  const name = fitLines(ctx, input.name, textW, s.display * 1.15, H * 0.052, "900", p.font);
  const headline = input.headline?.trim() || DEFAULT_HEADLINE;
  const hSize = fitText(ctx, headline, textW, s.body * 1.05, H * 0.035, "500", p.font);
  const tableH = input.table && L !== "banner" ? s.title * 1.05 : 0;
  const promoOnCard = input.promo && L !== "banner";
  const promoSize = promoOnCard ? s.body * 0.9 : 0;

  const blockH =
    r * 2 + gap +
    name.size * LINE * name.lines.length + gap * 0.4 +
    hSize * LINE +
    (tableH ? gap * 0.7 + tableH : 0) +
    (promoSize ? gap * 0.5 + promoSize * LINE : 0);
  let y = Math.max(pad + frameInset, (H - barH - blockH) / 2);

  await paintLogo(ctx, cx, y + r, r, p, input);
  y += r * 2 + gap;

  ctx.fillStyle = p.text;
  ctx.textBaseline = "top";
  for (const line of name.lines) {
    ctx.font = `900 ${name.size}px ${p.font}`;
    ctx.fillText(line, cx, y);
    y += name.size * LINE;
  }
  y += gap * 0.4;

  ctx.fillStyle = p.muted;
  ctx.font = `500 ${hSize}px ${p.font}`;
  ctx.fillText(headline, cx, y);
  y += hSize * LINE;

  if (tableH) {
    y += gap * 0.7;
    paintTable(ctx, cx, y, tableH, `طاولة ${input.table}`, p, p.font);
    y += tableH;
    ctx.textBaseline = "top";
  }
  if (promoSize && input.promo) {
    y += gap * 0.5;
    ctx.fillStyle = p.accent;
    fitText(ctx, input.promo, textW, promoSize, promoSize * 0.6, "700", p.font);
    ctx.fillText(input.promo, cx, y);
  }

  if (L === "banner") {
    const top = H - barH;
    ctx.save();
    ctx.fillStyle = p.frugal ? p.bg : p.accent;
    ctx.fillRect(0, top, W, barH);
    if (p.frugal) {
      ctx.strokeStyle = p.text;
      ctx.lineWidth = Math.max(2, H * 0.006);
      ctx.beginPath();
      ctx.moveTo(0, top);
      ctx.lineTo(W, top);
      ctx.stroke();
    }
    ctx.restore();

    const bits = [input.table ? `طاولة ${input.table}` : null, input.promo?.trim() || null]
      .filter(Boolean)
      .join("  ·  ");
    ctx.fillStyle = p.frugal ? p.text : p.onAccent;
    ctx.textBaseline = "middle";
    if (bits) {
      fitText(ctx, bits, W - pad * 2, barH * 0.42, barH * 0.24, "700", p.font);
      ctx.fillText(bits, W / 2, top + barH * 0.5);
    } else {
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.font = `600 ${Math.round(barH * 0.34)}px ${FALLBACK_FONT}`;
      ctx.direction = "ltr";
      ctx.fillText(FOOTER, W / 2, top + barH * 0.5);
      ctx.restore();
      ctx.direction = "rtl";
      return;
    }
    ctx.textBaseline = "top";
  }

  const fs = Math.round(s.caption);
  paintFooter(ctx, cx, H - pad * 0.75 - frameInset - barH - fs * LINE, fs, p, p.muted);
}

/** اسم ملف التنزيل — يحمل المطعم والقياس ليعرف التاجر ما في يده. */
export function cardFileName(
  slug: string | null,
  size: CardSizeId,
  style: CardStyleId,
  layout?: CardLayoutId
): string {
  return `cloudmenu-${slug || "card"}-${size}-${style}${layout ? `-${layout}` : ""}.png`;
}

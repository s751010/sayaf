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
 * ═══ ثلاثة مزالق محسوبة ═══
 *
 * 1. **الخط**: `document.fonts.ready` قبل أي `fillText`. بدونها يرسم canvas
 *    بخط احتياطي (وقد يكون بلا دعم عربي) فتخرج البطاقة بحروف منفصلة أو مربّعات
 *    — والمعاينة على الشاشة تبدو سليمة لأن DOM يعيد الرسم بعد تحميل الخط بينما
 *    canvas لا يعيد شيئاً.
 * 2. **طول الاسم**: `measureText` ثم تصغير تلقائي. «مطعم» و«مطاعم الديوان
 *    للمأكولات الشعبية» لا يُرسمان بحجم واحد، والفيضان يقصّ اسم التاجر.
 * 3. **الشعار عبر CORS**: أي فشل ⇒ تُرسم البطاقة بلا شعار. زرّ تنزيل لا يعمل
 *    أسوأ من بطاقة بلا شعار.
 */
import { qrDataUrl, loadImage } from "./qr";
import { ALL_THEMES, bestOnAccent, isHex, normalizeHex } from "./themes";
import { patternImage, type PatternId } from "./patterns";

/* ── القياسات ──────────────────────────────────────────────────────── */

export type CardSizeId = "counter" | "tent" | "card" | "sticker";

export interface CardSize {
  id: CardSizeId;
  name: string;
  /** بالمليمتر — العرض ثم الارتفاع. */
  mm: [number, number];
  desc: string;
  /** عدد ما يُطبع منها في ورقة A4 واحدة. */
  perSheet: number;
}

export const CARD_SIZES: CardSize[] = [
  {
    id: "counter",
    name: "ستاند الكاشير",
    mm: [100, 150],
    desc: "يوضع في ستاند أكريليك عند نقطة الدفع",
    perSheet: 2,
  },
  {
    id: "tent",
    name: "ستاند مثلث (يُطوى)",
    mm: [100, 210],
    desc: "يُطوى من المنتصف فيقف على الطاولة بوجهين",
    perSheet: 1,
  },
  {
    id: "card",
    name: "كرت صغير",
    mm: [85, 55],
    desc: "بحجم كرت العمل — مع الفاتورة أو الطلب",
    perSheet: 8,
  },
  {
    id: "sticker",
    name: "ملصق مربّع",
    mm: [80, 80],
    desc: "يُلصق على الطاولة أو الواجهة",
    perSheet: 6,
  },
];

/* ── الأنماط ───────────────────────────────────────────────────────── */

export type CardStyleId = "brand" | "dark" | "light" | "heritage";

export interface CardStyle {
  id: CardStyleId;
  name: string;
  desc: string;
}

export const CARD_STYLES: CardStyle[] = [
  { id: "dark", name: "أسود فاخر", desc: "خلفية داكنة ولمسة ذهبية" },
  { id: "light", name: "عاجي ناعم", desc: "الأوفر حبراً عند الطباعة" },
  { id: "brand", name: "ألوان منيوك", desc: "يأخذ ألوانه من طابع منيوك نفسه" },
  { id: "heritage", name: "تراثي بالسدو", desc: "زخرفة سدو خفيفة وإطار" },
];

const DPI = 300;
const MM_PER_INCH = 25.4;

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

function paletteFor(style: CardStyleId, themeId: string | null, brandHex: string | null): Palette {
  const brand = brandHex && isHex(brandHex) ? normalizeHex(brandHex) : null;

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
      patternOpacity: theme.design.patternOpacity,
      font: resolveFont(v["--m-font"]),
    };
  }

  if (style === "light") {
    const accent = brand ?? "#b98a1e";
    return {
      bg: "#faf7f0", bg2: "#f1ebdd", text: "#1a1613", muted: "#7b7264",
      accent, onAccent: bestOnAccent(accent),
      qrLight: "#ffffff", qrDark: "#141210",
      pattern: "none", patternOpacity: 0, font: FALLBACK_FONT,
    };
  }

  if (style === "heritage") {
    const accent = brand ?? "#1f7a72";
    return {
      bg: "#f4e8d5", bg2: "#e9d9be", text: "#33261a", muted: "#8a745a",
      accent, onAccent: bestOnAccent(accent),
      qrLight: "#fffaf1", qrDark: "#33261a",
      pattern: "sadu", patternOpacity: 0.1,
      font: resolveFont("var(--font-reem)"),
    };
  }

  // dark — شكل اللقطات: أسود عميق وذهب.
  const accent = brand ?? "#d4a843";
  return {
    bg: "#111010", bg2: "#1c1916", text: "#f7f2e7", muted: "#9a8f7c",
    accent, onAccent: bestOnAccent(accent),
    qrLight: "#ffffff", qrDark: "#141210",
    pattern: "none", patternOpacity: 0, font: FALLBACK_FONT,
  };
}

/* ── أدوات رسم ─────────────────────────────────────────────────────── */

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
  let size = start;
  while (size > min) {
    ctx.font = `${weight} ${size}px ${font}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= Math.max(1, Math.round(size * 0.04));
  }
  ctx.font = `${weight} ${size}px ${font}`;
  return size;
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
 * يمتدّ تحت مربّع الـQR. أسماء المطاعم السعودية طويلة عادةً فهذه هي الحالة
 * الشائعة لا الطرفية.
 *
 * وإن لم يسع حتى بالحد الأدنى وبأقصى عدد أسطر، يُقصّ آخر سطر بثلاث نقاط: اسم
 * مقصوص بوضوح أفضل من اسم يزحف فوق الكود فيمنع مسحه.
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
  let size = start;
  for (;;) {
    ctx.font = `${weight} ${size}px ${font}`;
    const lines = wrap(ctx, text, maxWidth);
    if (
      (lines.length <= maxLines && lines.every((l) => ctx.measureText(l).width <= maxWidth)) ||
      size <= min
    ) {
      const kept = lines.slice(0, maxLines);
      if (lines.length > maxLines && kept.length) {
        let last = `${kept[kept.length - 1]}…`;
        while (last.length > 1 && ctx.measureText(last).width > maxWidth) {
          last = `${last.slice(0, -2)}…`;
        }
        kept[kept.length - 1] = last;
      }
      return { size, lines: kept };
    }
    size -= Math.max(1, Math.round(size * 0.05));
  }
}

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
  if (id === "none") return;
  const uri = patternUri(patternImage(id, color, opacity));
  if (!uri) return;
  try {
    const img = await loadImage(uri);
    // تُرسم على لوحة مساعدة بمقاس البلاطة المطلوب ثم تُكرَّر: `createPattern`
    // يكرّر بالحجم الأصلي للصورة، وهو صغير جداً عند 300DPI فيبدو ضجيجاً.
    const tileCanvas = document.createElement("canvas");
    tileCanvas.width = tile;
    tileCanvas.height = tile;
    const tctx = tileCanvas.getContext("2d");
    if (!tctx) return;
    tctx.drawImage(img, 0, 0, tile, tile);
    const pat = ctx.createPattern(tileCanvas, "repeat");
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
}

const DEFAULT_HEADLINE = "امسح وتصفّح المنيو";
const FOOTER = "Powered by CloudMenu";

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
  // ⚠️ قبل أي fillText — انظر رأس الملف.
  if (document.fonts?.ready) await document.fonts.ready;

  const size = sizeOf(input.size);
  const W = Math.round(mmToPx(size.mm[0]) * scale);
  const H = Math.round(mmToPx(size.mm[1]) * scale);
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const p = paletteFor(input.style, input.themeId, input.brandHex);
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (input.size === "tent") {
    // بطاقة الطاولة تُطوى من المنتصف، فالنصف العلوي يُرسم مقلوباً ١٨٠° ليقرأه
    // الجالس على الجهة المقابلة بعد الطيّ. طباعة نصفين متطابقين لأعلى تعني
    // وجهاً مقلوباً على الطاولة.
    const half = Math.round(H / 2);
    await paintFace(ctx, W, half, p, input, 0);
    ctx.save();
    ctx.translate(W, H);
    ctx.rotate(Math.PI);
    await paintFace(ctx, W, half, p, input, 0);
    ctx.restore();
    // خط الطيّ
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
    return;
  }

  await paintFace(ctx, W, H, p, input, 0);
}

/** وجه واحد من البطاقة — يُستدعى مرتين لبطاقة الطيّ. */
async function paintFace(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  p: Palette,
  input: CardInput,
  offsetY: number
): Promise<void> {
  ctx.save();
  ctx.translate(0, offsetY);

  /* الخلفية */
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, p.bg2);
  grad.addColorStop(1, p.bg);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  await paintPattern(ctx, W, H, p.pattern, p.accent, p.patternOpacity, Math.round(W * 0.22));

  const landscape = W > H;
  if (landscape) {
    await paintLandscape(ctx, W, H, p, input);
  } else {
    await paintPortrait(ctx, W, H, p, input);
  }

  ctx.restore();
}

/** شارة الشعار — دائرة بلون التمييز، وبداخلها صورة الشعار أو الإيموجي. */
async function paintLogo(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  p: Palette,
  input: CardInput
): Promise<void> {
  ctx.save();
  ctx.fillStyle = p.accent;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

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
  ctx.fillStyle = p.onAccent;
  ctx.font = `${Math.round(r * 1.1)}px ${FALLBACK_FONT}`;
  ctx.fillText(input.emoji || "🍽", cx, cy + r * 0.04);
  ctx.restore();
}

/**
 * التدفّق الرأسي بخط أساس `top` وارتفاع سطر صريح.
 *
 * جُرِّب أولاً بخط أساس `middle` وتقديمٍ بنسب من حجم الخط، فتراكبت شارة الطاولة
 * على لوح الـQR وكاد الاسم يلامس سطر الدعوة: مع `middle` عليك أن تطرح نصف
 * ارتفاع العنصر السابق وتضيف نصف ارتفاع التالي في كل خطوة، وأي نسبة تقديرية
 * تُخطئ بمقدار نصف سطر. الحافة العليا تُجمَع جمعاً بسيطاً ولا تكذب.
 */
const LINE = 1.32;

async function paintPortrait(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  p: Palette,
  input: CardInput
): Promise<void> {
  const pad = W * 0.085;
  const inner = W - pad * 2;
  const gap = H * 0.022;
  ctx.textBaseline = "top";

  /* ما يُحجز أسفل الكود — يُحسب من العناصر الفعلية لا بنسبة مقدَّرة. */
  const footerH = W * 0.03 * LINE + gap * 1.4;
  const tableH = input.table ? W * 0.086 + gap : 0;
  const promoH = input.promo ? W * 0.045 * LINE + gap : 0;
  const bottomReserve = footerH + tableH + promoH;

  let y = H * 0.062;

  /* الشعار */
  const r = W * 0.09;
  await paintLogo(ctx, W / 2, y + r, r, p, input);
  y += r * 2 + gap * 1.2;

  /* اسم المطعم — سطران عند الحاجة (أسماء المطاعم السعودية طويلة عادةً) */
  ctx.fillStyle = p.text;
  const name = fitLines(ctx, input.name, inner, W * 0.095, W * 0.05, "900", p.font);
  for (const line of name.lines) {
    ctx.fillText(line, W / 2, y);
    y += name.size * LINE;
  }
  y += gap * 0.3;

  /* سطر الدعوة */
  const headline = input.headline?.trim() || DEFAULT_HEADLINE;
  ctx.fillStyle = p.muted;
  const hSize = fitText(ctx, headline, inner, W * 0.05, W * 0.03, "500", p.font);
  ctx.fillText(headline, W / 2, y);
  y += hSize * LINE + gap * 1.1;

  /* كود QR — أكبر عنصر، فهو سبب وجود البطاقة */
  const qrPadRatio = 0.045;
  // اللوح الأبيض يفيض عن الكود بمقدار الحاشية من كل جهة، فيُحسَب ضمن الارتفاع.
  const room = Math.min(inner, (H - y - bottomReserve) / (1 + qrPadRatio * 2));
  const qr = Math.max(320, Math.round(Math.max(W * 0.3, room)));
  const qrPad = qr * qrPadRatio;
  await paintQr(ctx, (W - qr) / 2, y + qrPad, qr, p, input, qrPadRatio);
  y += qr + qrPad * 2 + gap;

  /* رقم الطاولة */
  if (input.table) {
    const label = `طاولة ${input.table}`;
    const th = W * 0.086;
    ctx.font = `800 ${Math.round(W * 0.046)}px ${p.font}`;
    const tw = ctx.measureText(label).width + W * 0.09;
    ctx.fillStyle = p.accent;
    ctx.beginPath();
    ctx.roundRect((W - tw) / 2, y, tw, th, th / 2);
    ctx.fill();
    ctx.fillStyle = p.onAccent;
    ctx.textBaseline = "middle";
    ctx.fillText(label, W / 2, y + th / 2);
    ctx.textBaseline = "top";
    y += th + gap;
  }

  /* العرض الترويجي */
  if (input.promo) {
    ctx.fillStyle = p.accent;
    const ps = fitText(ctx, input.promo, inner, W * 0.045, W * 0.028, "700", p.font);
    ctx.fillText(input.promo, W / 2, y);
    y += ps * LINE;
  }

  /**
   * التذييل يميل للقاع **لكنه لا يُثبَّت فيه**.
   *
   * التثبيت المطلق كان يصطدم بشارة الطاولة والعرض الترويجي على الوجه القصير من
   * بطاقة الطيّ (١٠٠×١٠٥مم): المحتوى ينمو لأعلى القاع بينما التذييل ينتظره هناك،
   * فيتراكب النصّان. `max` تضمن أن يبقى أسفل ما قبله مهما امتلأت البطاقة.
   */
  ctx.fillStyle = p.muted;
  ctx.globalAlpha = 0.75;
  const fs = Math.round(W * 0.03);
  ctx.font = `500 ${fs}px ${FALLBACK_FONT}`;
  ctx.direction = "ltr";
  ctx.fillText(FOOTER, W / 2, Math.max(y + gap * 0.6, H - H * 0.038 - fs));
  ctx.direction = "rtl";
  ctx.globalAlpha = 1;
}

/** الكرت الصغير: الكود في جهة والنصّ في الأخرى — الارتفاع لا يكفي للتكديس. */
async function paintLandscape(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  p: Palette,
  input: CardInput
): Promise<void> {
  const pad = H * 0.09;
  const qrPadRatio = 0.045;
  // ٠٫٩٢ لا ١: الكرت الصغير عريض قصير، وكودٌ بكامل الارتفاع يخنق عمود النصّ.
  const qr = Math.max(320, Math.round(((H - pad * 2) * 0.92) / (1 + qrPadRatio * 2)));
  const qrPad = qr * qrPadRatio;
  // الكود في اليمين: العين العربية تبدأ من اليمين، والكود هو الفعل المطلوب.
  await paintQr(ctx, W - pad - qrPad - qr, pad + qrPad, qr, p, input, qrPadRatio);

  const textW = W - (qr + qrPad * 2) - pad * 3;
  const cx = pad + textW / 2;
  ctx.textBaseline = "top";

  const r = H * 0.095;
  const headline = input.headline?.trim() || DEFAULT_HEADLINE;

  /* الكتلة النصّية تُتمركز رأسياً: قياسها يُحسب أولاً ثم يبدأ الرسم. */
  const name = fitLines(ctx, input.name, textW, H * 0.135, H * 0.062, "900", p.font);
  const hSize = fitText(ctx, headline, textW, H * 0.07, H * 0.042, "500", p.font);
  const blockH =
    r * 2 + H * 0.04 + name.size * LINE * name.lines.length + H * 0.012 + hSize * LINE;
  let y = (H - blockH) / 2 - H * 0.035;

  await paintLogo(ctx, cx, y + r, r, p, input);
  y += r * 2 + H * 0.04;

  ctx.fillStyle = p.text;
  ctx.font = `900 ${name.size}px ${p.font}`;
  for (const line of name.lines) {
    ctx.fillText(line, cx, y);
    y += name.size * LINE;
  }
  y += H * 0.012;

  ctx.fillStyle = p.muted;
  ctx.font = `500 ${hSize}px ${p.font}`;
  ctx.fillText(headline, cx, y);

  ctx.globalAlpha = 0.7;
  ctx.font = `500 ${Math.round(H * 0.045)}px ${FALLBACK_FONT}`;
  ctx.direction = "ltr";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(FOOTER, cx, H - pad * 0.55);
  ctx.direction = "rtl";
  ctx.textBaseline = "top";
  ctx.globalAlpha = 1;
}

/** مربّع الكود على خلفية فاتحة — التباين العالي شرط قراءته من بعيد. */
async function paintQr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  p: Palette,
  input: CardInput,
  padRatio = 0.045
): Promise<void> {
  const pad = size * padRatio;
  ctx.fillStyle = p.qrLight;
  ctx.beginPath();
  ctx.roundRect(x - pad, y - pad, size + pad * 2, size + pad * 2, size * 0.07);
  ctx.fill();
  try {
    const px = Math.max(320, Math.round(size));
    const uri = await qrDataUrl(input.url, input.logo, px, {
      dark: p.qrDark,
      light: p.qrLight,
    });
    const img = await loadImage(uri);
    /**
     * إحداثيات صحيحة + بلا تنعيم.
     *
     * الرسم على إحداثي كسري (١٠٠٫٥ مثلاً) يجعل المتصفح يعيد أخذ العينات فتُنعَّم
     * حواف وحدات الكود، ووحدة رمادية الحافة عند 300DPI تطبع ضبابية. القارئات
     * الحديثة تتسامح، لكن الطباعة على ستاند تُقرأ من نصف متر في إضاءة مطعم —
     * وهناك كل وحدة حادّة تفرق. (كشفه فكّ الترميز البرمجي وهو أقسى من كاميرا جوال.)
     */
    const smooth = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, Math.round(x), Math.round(y), px, px);
    ctx.imageSmoothingEnabled = smooth;
  } catch {
    /* لن يحدث عملياً: qrDataUrl تبتلع أخطاءها وتعيد الكود العادي. */
  }
}

/** اسم ملف التنزيل — يحمل المطعم والقياس ليعرف التاجر ما في يده. */
export function cardFileName(slug: string | null, size: CardSizeId, style: CardStyleId): string {
  return `cloudmenu-${slug || "card"}-${size}-${style}.png`;
}

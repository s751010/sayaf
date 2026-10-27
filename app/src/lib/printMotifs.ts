/**
 * «حافّة» الطابع على الورق — ما يجعل قطعة العدّة أختَ منيوها لا بطاقةً ملوّنة.
 *
 * ═══ لماذا ═══
 *
 * ثمانية من الطوابع الاثني عشر **بلا زخرفة** (`pattern: "none"`): شخصيّتها في
 * البنية والخامة (`menu-skins.css`) لا في نسيجٍ يُكرَّر — ورقُ فاتورة، ولبّاد
 * لوحة حروف، وأنبوب نيون، وحدّ ملصقٍ أسود… فبطاقةٌ تأخذ ألوانها وحدها تخرج
 * متشابهةً عبر الطوابع: أرضيةٌ وكود. هنا لكلّ خامةٍ **علامةٌ مطبوعة** واحدة
 * مشتقّة من شكلها على الشاشة.
 *
 * ═══ ثلاثة قيود لا تُخترق ═══
 *
 * 1. **في الحزام وحده**: كلّ رسمٍ بين `outer` و`reach` من حافّة القصّ — والمحرّك
 *    يضع المحتوى (النصّ والكود) أبعد من `reach` دائماً (`facePad` في `cards.ts`).
 *    فلا خطّ يمرّ تحت حرفٍ ولا داخل منطقة هدوء الكود. والاستثناء ملمسان
 *    (أخاديد اللبّاد، شبكة عصري) بشفافية `TEXTURE_ALPHA` **محسوبةٍ في تباين
 *    كلّ نصّ** (`kitPalette`).
 * 2. **بلا لونٍ جديد**: حبر الطابع وتمييزه وخافته فقط (§١٨).
 * 3. **بلا نصّ**: الحافّة زخرفة؛ ما يُقرأ يبقى في المحرّك.
 */
import type { MenuSkin } from "./themes";
import { TEXTURE_ALPHA } from "./printKit";

export interface MotifInk {
  accent: string;
  text: string;
  muted: string;
  bg: string;
}

export interface MotifBox {
  W: number;
  H: number;
  /** بكسل لكل مليمتر بدقّة هذا الرسم. */
  mm: number;
  /** أقرب ما يُرسم إلى حافّة القصّ. */
  outer: number;
  /** أبعد ما يصله الرسم نحو الداخل — المحتوى بعده. */
  reach: number;
}

type Ctx = CanvasRenderingContext2D;

function rrect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** حلقةٌ مستطيلة بإزاحةٍ من الحافّة. */
function ring(ctx: Ctx, b: MotifBox, inset: number, r: number): void {
  rrect(ctx, inset, inset, b.W - inset * 2, b.H - inset * 2, r);
}

/** يكرّر شكلاً على طول ضلعٍ أفقي (أعلى وأسفل) — بعددٍ صحيح فيلتقي بالركنين. */
function alongTopBottom(
  b: MotifBox,
  step: number,
  draw: (x: number, w: number, top: boolean) => void
): void {
  const span = b.W - b.outer * 2;
  const n = Math.max(1, Math.round(span / step));
  const w = span / n;
  for (const top of [true, false]) for (let i = 0; i < n; i++) draw(b.outer + i * w, w, top);
}

/** فاخر — دفتر جلد: خطٌّ مذهّب، وغرزٌ ذهبيّة بعده كخيطٍ يخيط الحافّة. */
function folio(ctx: Ctx, b: MotifBox, k: MotifInk): void {
  ctx.strokeStyle = k.accent;
  ctx.lineWidth = b.mm * 0.35;
  ring(ctx, b, b.outer, b.mm * 1.6);
  ctx.stroke();
  ctx.setLineDash([b.mm * 1.6, b.mm * 1.1]);
  ctx.lineWidth = b.mm * 0.3;
  ring(ctx, b, b.outer + b.mm * 1.5, b.mm * 1.1);
  ctx.stroke();
}

/** فاتورة — حافّة مسنّنة كورقٍ مقطوع من اللفّة، وسطرٌ مثقّب تحتها. */
function receipt(ctx: Ctx, b: MotifBox, k: MotifInk): void {
  const amp = b.mm * 1.1;
  ctx.strokeStyle = k.muted;
  ctx.lineWidth = b.mm * 0.25;
  ctx.beginPath();
  alongTopBottom(b, b.mm * 2.6, (x, w, top) => {
    const y0 = top ? b.outer : b.H - b.outer;
    const y1 = top ? y0 + amp : y0 - amp;
    ctx.moveTo(x, y0);
    ctx.lineTo(x + w / 2, y1);
    ctx.lineTo(x + w, y0);
  });
  ctx.stroke();
  ctx.setLineDash([b.mm * 0.7, b.mm * 0.7]);
  ctx.beginPath();
  for (const y of [b.outer + amp + b.mm * 1.3, b.H - b.outer - amp - b.mm * 1.3]) {
    ctx.moveTo(b.outer, y);
    ctx.lineTo(b.W - b.outer, y);
  }
  ctx.stroke();
}

/** نيون — أنبوبٌ متوهّج: هالةٌ بالتمييز، وقلبٌ فاتح رفيع كأنبوب الغاز المضيء. */
function neon(ctx: Ctx, b: MotifBox, k: MotifInk): void {
  const at = b.outer + b.mm * 1.2;
  ctx.shadowColor = k.accent;
  ctx.shadowBlur = b.mm * 2.2;
  ctx.strokeStyle = k.accent;
  ctx.lineWidth = b.mm * 0.9;
  ring(ctx, b, at, b.mm * 4);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = k.text;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = b.mm * 0.25;
  ring(ctx, b, at, b.mm * 4);
  ctx.stroke();
}

/** ملصقات — حدٌّ أسود غليظ وظلٌّ مصمت بالتمييز مُزاحٌ عنه، كملصقٍ مقصوص. */
function sticker(ctx: Ctx, b: MotifBox, k: MotifInk): void {
  const at = b.outer + b.mm * 0.6;
  const off = b.mm * 0.9;
  const r = b.mm * 3;
  ctx.lineWidth = b.mm * 1.1;
  ctx.strokeStyle = k.accent;
  rrect(ctx, at + off, at + off, b.W - at * 2 - off, b.H - at * 2 - off, r);
  ctx.stroke();
  ctx.strokeStyle = k.text;
  rrect(ctx, at, at, b.W - at * 2 - off, b.H - at * 2 - off, r);
  ctx.stroke();
}

/** لوحة حروف — أخاديد اللبّاد على الوجه كلّه، وإطارٌ عريض حوله. */
function letterboard(ctx: Ctx, b: MotifBox, k: MotifInk): void {
  ctx.strokeStyle = k.text;
  ctx.globalAlpha = TEXTURE_ALPHA;
  ctx.lineWidth = b.mm * 0.3;
  ctx.beginPath();
  for (let y = b.reach; y < b.H - b.reach; y += b.mm * 2.4) {
    ctx.moveTo(b.reach, y);
    ctx.lineTo(b.W - b.reach, y);
  }
  ctx.stroke();
  ctx.globalAlpha = 0.28;
  ctx.lineWidth = b.reach - b.outer - b.mm * 0.6;
  ring(ctx, b, (b.outer + b.reach - b.mm * 0.6) / 2, b.mm * 1.2);
  ctx.stroke();
}

/** مجلّة — مسطرتا الترويسة والذيل: غليظةٌ ثم رفيعة، كرأس صفحةٍ مطبوعة. */
function editorial(ctx: Ctx, b: MotifBox, k: MotifInk): void {
  ctx.fillStyle = k.text;
  const thick = b.mm * 0.9;
  const thin = b.mm * 0.25;
  const gap = b.mm * 0.7;
  const x = b.outer;
  const w = b.W - b.outer * 2;
  ctx.fillRect(x, b.outer, w, thick);
  ctx.fillRect(x, b.outer + thick + gap, w, thin);
  ctx.fillRect(x, b.H - b.outer - thick, w, thick);
  ctx.fillRect(x, b.H - b.outer - thick - gap - thin, w, thin);
}

/**
 * روشان — قوسٌ مدبّب يحيط الوجه كنافذةٍ خشبية. ولا قوس على الوجه الأفقي: كتفاه
 * يمرّان هناك خلف لوح الكود، فيصير إطاراً مزدوجاً بزاويتين مقوّستين.
 */
function roshan(ctx: Ctx, b: MotifBox, k: MotifInk): void {
  ctx.strokeStyle = k.accent;
  ctx.lineWidth = b.mm * 0.45;
  for (const inset of [b.outer, b.outer + b.mm * 1.4]) {
    const x0 = inset;
    const x1 = b.W - inset;
    const y1 = b.H - inset;
    ctx.beginPath();
    if (b.H > b.W) {
      const spring = inset + Math.min(b.W, b.H) * 0.16;
      ctx.moveTo(x0, y1);
      ctx.lineTo(x0, spring);
      ctx.quadraticCurveTo(x0, inset + (spring - inset) * 0.25, b.W / 2, inset);
      ctx.quadraticCurveTo(x1, inset + (spring - inset) * 0.25, x1, spring);
      ctx.lineTo(x1, y1);
      ctx.closePath();
    } else {
      ctx.roundRect(x0, inset, x1 - x0, y1 - inset, [b.mm * 6, b.mm * 6, b.mm, b.mm]);
    }
    ctx.stroke();
  }
}

/** نجدي — شُرفات بيت الطين: مثلّثاتٌ مدرّجة على الرأس والقدم. */
function najdi(ctx: Ctx, b: MotifBox, k: MotifInk): void {
  const h = Math.min(b.mm * 2.4, b.reach - b.outer);
  ctx.fillStyle = k.accent;
  ctx.beginPath();
  alongTopBottom(b, b.mm * 3.2, (x, w, top) => {
    const base = top ? b.outer + h : b.H - b.outer - h;
    const tip = top ? b.outer : b.H - b.outer;
    const step = w * 0.18;
    // درجتان ثم رأس — الشرفة النجدية مدرّجة لا مثلّثٌ أملس.
    ctx.moveTo(x + step * 0.5, base);
    ctx.lineTo(x + step * 0.5, base + (tip - base) * 0.35);
    ctx.lineTo(x + step * 1.5, base + (tip - base) * 0.35);
    ctx.lineTo(x + w / 2, tip);
    ctx.lineTo(x + w - step * 1.5, base + (tip - base) * 0.35);
    ctx.lineTo(x + w - step * 0.5, base + (tip - base) * 0.35);
    ctx.lineTo(x + w - step * 0.5, base);
    ctx.closePath();
  });
  ctx.fill();
}

/** عصري — شبكةٌ طباعية خافتة، ومسطرةٌ بعلامات المليمتر على الحافّة السفلى. */
function modern(ctx: Ctx, b: MotifBox, k: MotifInk): void {
  ctx.strokeStyle = k.text;
  ctx.globalAlpha = TEXTURE_ALPHA;
  ctx.lineWidth = b.mm * 0.2;
  ctx.beginPath();
  const cell = b.mm * 5;
  for (let x = b.outer; x <= b.W - b.outer + 0.5; x += cell) {
    ctx.moveTo(x, b.outer);
    ctx.lineTo(x, b.H - b.outer);
  }
  for (let y = b.outer; y <= b.H - b.outer + 0.5; y += cell) {
    ctx.moveTo(b.outer, y);
    ctx.lineTo(b.W - b.outer, y);
  }
  ctx.stroke();
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = b.mm * 0.2;
  ctx.beginPath();
  const y = b.H - b.outer;
  for (let i = 0, x = b.outer; x <= b.W - b.outer + 0.5; i++, x += b.mm) {
    const len = i % 10 === 0 ? b.mm * 2.2 : i % 5 === 0 ? b.mm * 1.5 : b.mm * 0.8;
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - len);
  }
  ctx.stroke();
}

/** محمصة — ختمُ كيس القهوة المكبوس: شريطان وبينهما تجاعيد الكبس. */
function roastery(ctx: Ctx, b: MotifBox, k: MotifInk): void {
  const top = b.outer;
  const h = Math.min(b.mm * 2.6, b.reach - b.outer);
  ctx.strokeStyle = k.text;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = b.mm * 0.3;
  ctx.beginPath();
  ctx.moveTo(b.outer, top);
  ctx.lineTo(b.W - b.outer, top);
  ctx.moveTo(b.outer, top + h);
  ctx.lineTo(b.W - b.outer, top + h);
  for (let x = b.outer + b.mm * 0.75; x < b.W - b.outer; x += b.mm * 1.5) {
    ctx.moveTo(x, top + b.mm * 0.5);
    ctx.lineTo(x, top + h - b.mm * 0.5);
  }
  ctx.stroke();
  // وثنيةُ القاع: خطٌّ مزدوج متقطّع كما يُطوى الكيس.
  ctx.setLineDash([b.mm * 1.2, b.mm * 0.8]);
  ctx.beginPath();
  ctx.moveTo(b.outer, b.H - b.outer);
  ctx.lineTo(b.W - b.outer, b.H - b.outer);
  ctx.stroke();
}

/** دكّان — لوحة صفيح: حافّةٌ مطويّة غليظة بالتمييز، وأربعة مسامير في أركانها. */
function dukkan(ctx: Ctx, b: MotifBox, k: MotifInk): void {
  const at = b.outer + b.mm * 0.6;
  ctx.strokeStyle = k.accent;
  ctx.lineWidth = b.mm * 1.2;
  ring(ctx, b, at, b.mm * 2.4);
  ctx.stroke();
  const r = b.mm * 0.75;
  const c = at + b.mm * 2.6;
  for (const [x, y] of [[c, c], [b.W - c, c], [c, b.H - c], [b.W - c, b.H - c]]) {
    ctx.fillStyle = k.muted;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = k.text;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

/** عسير — شريط القطّ: مثلّثاتٌ متناوبة بلونين كجدار بيتٍ عسيري مدهون باليد. */
function asir(ctx: Ctx, b: MotifBox, k: MotifInk): void {
  const h = Math.min(b.mm * 2.6, b.reach - b.outer);
  let i = 0;
  alongTopBottom(b, b.mm * 3, (x, w, top) => {
    const y0 = top ? b.outer : b.H - b.outer;
    const y1 = top ? y0 + h : y0 - h;
    ctx.fillStyle = i++ % 2 ? k.text : k.accent;
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x + w / 2, y0);
    ctx.lineTo(x + w, y1);
    ctx.closePath();
    ctx.fill();
  });
  ctx.fillStyle = k.accent;
  ctx.fillRect(b.outer, b.outer + h + b.mm * 0.5, b.W - b.outer * 2, b.mm * 0.5);
  ctx.fillRect(b.outer, b.H - b.outer - h - b.mm * 1, b.W - b.outer * 2, b.mm * 0.5);
}

const MOTIFS: Record<MenuSkin, ((ctx: Ctx, b: MotifBox, k: MotifInk) => void) | null> = {
  gold: folio,
  receipt,
  neon,
  sticker,
  letterboard,
  editorial,
  roshan,
  najdi,
  modern,
  roastery,
  dukkan,
  asir,
  // «لون علامتي» محايدٌ عمداً على الشاشة — وكذلك على الورق.
  store: null,
};

/** هل لهذه الخامة حافّةٌ مطبوعة؟ (للفحص: كلّ طابعٍ في المُنتقي له واحدة.) */
export function hasMotif(skin: MenuSkin): boolean {
  return MOTIFS[skin] != null;
}

/** يرسم حافّة الطابع على وجهٍ واحد — يُستدعى بعد الأرضية والزخرفة وقبل المحتوى. */
export function paintMotif(ctx: Ctx, skin: MenuSkin, box: MotifBox, ink: MotifInk): void {
  const draw = MOTIFS[skin];
  if (!draw || box.reach <= box.outer) return;
  ctx.save();
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  draw(ctx, box, ink);
  ctx.restore();
}

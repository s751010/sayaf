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

/** مرفأ — حبلٌ مجدول حول الوجه: إطارٌ بالتمييز تقطعه شَرطاتٌ مائلة كفتل الحبل. */
function harbor(ctx: Ctx, b: MotifBox, k: MotifInk): void {
  const at = b.outer + b.mm * 0.9;
  ctx.strokeStyle = k.accent;
  ctx.lineWidth = b.mm * 1.6;
  ring(ctx, b, at, b.mm * 3);
  ctx.stroke();
  // الفتل: شرطةٌ مائلة بلون الورق كلّ ٢٫٢ ملم على الضلعين العلوي والسفلي.
  ctx.strokeStyle = k.bg;
  ctx.lineWidth = b.mm * 0.35;
  const step = b.mm * 2.2;
  for (const y of [at, b.H - at]) {
    for (let x = at + b.mm * 3.5; x < b.W - at - b.mm * 3.5; x += step) {
      ctx.beginPath();
      ctx.moveTo(x - b.mm * 0.5, y - b.mm * 0.7);
      ctx.lineTo(x + b.mm * 0.5, y + b.mm * 0.7);
      ctx.stroke();
    }
  }
}

/** حلواني — حافّة دانتيل: أنصافُ دوائر متلاصقة على الضلعين، وخطٌّ رفيع داخلها. */
function patisserie(ctx: Ctx, b: MotifBox, k: MotifInk): void {
  const r = Math.min(b.mm * 1.6, (b.reach - b.outer) / 2);
  alongTopBottom(b, r * 2, (x, w, top) => {
    const y = top ? b.outer : b.H - b.outer;
    ctx.fillStyle = k.accent;
    ctx.beginPath();
    ctx.arc(x + w / 2, y, w / 2, top ? 0 : Math.PI, top ? Math.PI : Math.PI * 2);
    ctx.fill();
  });
  ctx.strokeStyle = k.muted;
  ctx.lineWidth = b.mm * 0.25;
  ctx.setLineDash([b.mm * 0.5, b.mm * 0.6]);
  ring(ctx, b, b.outer + r + b.mm * 1.2, b.mm * 1.4);
  ctx.stroke();
  ctx.setLineDash([]);
}

/** عصّارة — شرائح فاكهة: أنصافُ دوائر مفصّصة بالتمييز تتوزّع على الضلعين. */
function juice(ctx: Ctx, b: MotifBox, k: MotifInk): void {
  const r = Math.min(b.mm * 2.4, b.reach - b.outer);
  let i = 0;
  alongTopBottom(b, r * 3, (x, w, top) => {
    if (i++ % 2) return;
    const cx = x + w / 2;
    const y = top ? b.outer : b.H - b.outer;
    const from = top ? 0 : Math.PI;
    ctx.fillStyle = k.accent;
    ctx.beginPath();
    ctx.arc(cx, y, r, from, from + Math.PI);
    ctx.fill();
    // الفصوص: خطوطٌ بلون الورق من المركز.
    ctx.strokeStyle = k.bg;
    ctx.lineWidth = b.mm * 0.3;
    for (let a = 1; a < 5; a++) {
      const t = from + (Math.PI * a) / 5;
      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.lineTo(cx + Math.cos(t) * r * 0.85, y + Math.sin(t) * r * 0.85);
      ctx.stroke();
    }
  });
}

/** صاج — جبنٌ يسيل: شريطٌ بالتمييز على الضلعين، وقطراتٌ تتدلّى منه نحو الداخل بأطوالٍ تتبدّل. */
function burger(ctx: Ctx, b: MotifBox, k: MotifInk): void {
  const band = Math.min(b.mm * 0.9, (b.reach - b.outer) / 4);
  const room = b.reach - b.outer - band;
  if (room <= 0) return;
  const r = Math.min(b.mm * 0.9, room / 3);
  // أطوال القطرات من المسافة المتاحة — أطولها ٨٥٪ منها، فلا تبلغ `reach` أبداً.
  const LENGTHS = [0.55, 0.3, 0.85, 0.42];
  ctx.fillStyle = k.accent;
  ctx.fillRect(b.outer, b.outer, b.W - b.outer * 2, band);
  ctx.fillRect(b.outer, b.H - b.outer - band, b.W - b.outer * 2, band);
  let i = 0;
  alongTopBottom(b, r * 5, (x, w, top) => {
    const len = Math.max(r * 2, room * LENGTHS[i++ % LENGTHS.length]);
    const cx = x + w / 2;
    const y0 = top ? b.outer + band : b.H - b.outer - band;
    const tip = top ? y0 + len - r : y0 - len + r;
    ctx.beginPath();
    ctx.moveTo(cx - r, y0);
    ctx.lineTo(cx - r, tip);
    // نصف دائرةٍ تحت القطرة (أعلى الوجه) أو فوقها (أسفله) — نحو الداخل دائماً.
    ctx.arc(cx, tip, r, Math.PI, 0, top);
    ctx.lineTo(cx + r, y0);
    ctx.closePath();
    ctx.fill();
  });
}

/** فرن — صفُّ أرغفةٍ على الضلعين: بيضاويٌّ بالتمييز، وعليه شَرطتان بلون الورق كشقّ الخبّاز. */
function bakery(ctx: Ctx, b: MotifBox, k: MotifInk): void {
  const room = b.reach - b.outer;
  const ry = Math.min(b.mm * 1.3, room * 0.4);
  const rx = ry * 1.9;
  alongTopBottom(b, rx * 3, (x, w, top) => {
    const cx = x + w / 2;
    const cy = top ? b.outer + room * 0.45 : b.H - b.outer - room * 0.45;
    ctx.fillStyle = k.accent;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = k.bg;
    ctx.lineWidth = b.mm * 0.3;
    for (const dx of [-0.38, 0.38]) {
      ctx.beginPath();
      ctx.moveTo(cx + rx * dx - ry * 0.35, cy + ry * 0.45);
      ctx.lineTo(cx + rx * dx + ry * 0.35, cy - ry * 0.45);
      ctx.stroke();
    }
  });
}

/** فوّال — صحونُ نحاسٍ على الرفّ: حلقتان (حافّةٌ بالتمييز وقاعٌ بالخافت) على خطٍّ رفيع. */
function breakfast(ctx: Ctx, b: MotifBox, k: MotifInk): void {
  const room = b.reach - b.outer;
  const r = Math.min(b.mm * 1.7, room * 0.42);
  for (const y of [b.outer + room * 0.5, b.H - b.outer - room * 0.5]) {
    ctx.fillStyle = k.muted;
    ctx.fillRect(b.outer, y - b.mm * 0.12, b.W - b.outer * 2, b.mm * 0.24);
  }
  alongTopBottom(b, r * 3.2, (x, w, top) => {
    const cx = x + w / 2;
    const cy = top ? b.outer + room * 0.5 : b.H - b.outer - room * 0.5;
    ctx.fillStyle = k.bg;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = k.accent;
    ctx.lineWidth = b.mm * 0.45;
    ctx.beginPath();
    ctx.arc(cx, cy, r - b.mm * 0.25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = k.muted;
    ctx.lineWidth = b.mm * 0.22;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.52, 0, Math.PI * 2);
    ctx.stroke();
  });
}

/** جمر — سيخٌ على الضلعين: قضيبٌ بالخافت بحلقةٍ في أوّله، وقطعٌ مربّعة بالتمييز والخافت. */
function grill(ctx: Ctx, b: MotifBox, k: MotifInk): void {
  const room = b.reach - b.outer;
  const s = Math.min(b.mm * 2.2, room * 0.5);
  for (const y of [b.outer + room * 0.5, b.H - b.outer - room * 0.5]) {
    ctx.fillStyle = k.muted;
    ctx.fillRect(b.outer + s, y - b.mm * 0.18, b.W - b.outer * 2 - s, b.mm * 0.36);
    ctx.strokeStyle = k.muted;
    ctx.lineWidth = b.mm * 0.45;
    ctx.beginPath();
    ctx.arc(b.outer + s * 0.5, y, s * 0.42, 0, Math.PI * 2);
    ctx.stroke();
  }
  alongTopBottom(b, s * 1.9, (x, w, top) => {
    if (x < b.outer + s * 1.5) return;
    const cy = top ? b.outer + room * 0.5 : b.H - b.outer - room * 0.5;
    const i = Math.round((x - b.outer) / w);
    ctx.fillStyle = i % 3 === 1 ? k.muted : k.accent;
    rrect(ctx, x + (w - s) / 2, cy - s / 2, s, s, s * 0.25);
    ctx.fill();
  });
}

/** ريحان — حاشيةُ مفرشٍ على الضلعين: صفّان من المربّعات بالتمييز متناوبان. */
function pizza(ctx: Ctx, b: MotifBox, k: MotifInk): void {
  const room = b.reach - b.outer;
  const c = Math.min(b.mm * 1.6, room * 0.32);
  alongTopBottom(b, c, (x, w, top) => {
    const i = Math.round((x - b.outer) / w);
    const y0 = top ? b.outer + room * 0.5 - c : b.H - b.outer - room * 0.5 - c;
    ctx.fillStyle = k.accent;
    ctx.fillRect(x, y0 + (i % 2 ? c : 0), w, c);
  });
}

/** دلّة — صفُّ فناجين على الضلعين: فنجالٌ بلا أذن بالتمييز، وبين كلّ اثنين حبّة هيلٍ بالخافت. */
function dallah(ctx: Ctx, b: MotifBox, k: MotifInk): void {
  const room = b.reach - b.outer;
  const s = Math.min(b.mm * 2.6, room * 0.6);
  alongTopBottom(b, s * 1.7, (x, w, top) => {
    const cx = x + w / 2;
    const cy = top ? b.outer + room * 0.5 : b.H - b.outer - room * 0.5;
    const i = Math.round((x - b.outer) / w);
    if (i % 2) {
      // حبّة الهيل: بيضويٌّ مائل.
      ctx.fillStyle = k.muted;
      ctx.beginPath();
      ctx.ellipse(cx, cy, s * 0.32, s * 0.17, i % 4 === 1 ? -0.5 : 0.5, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    // الفنجال من جانبه: فمٌ عريض يضيق إلى قاعدةٍ صغيرة، وخطٌّ تحت الحافّة.
    const h = s * 0.7;
    const top0 = cy - h / 2;
    ctx.fillStyle = k.accent;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.5, top0);
    ctx.lineTo(cx + s * 0.5, top0);
    ctx.quadraticCurveTo(cx + s * 0.44, top0 + h * 0.8, cx + s * 0.18, top0 + h * 0.86);
    ctx.lineTo(cx + s * 0.2, top0 + h);
    ctx.lineTo(cx - s * 0.2, top0 + h);
    ctx.lineTo(cx - s * 0.18, top0 + h * 0.86);
    ctx.quadraticCurveTo(cx - s * 0.44, top0 + h * 0.8, cx - s * 0.5, top0);
    ctx.fill();
    ctx.fillStyle = k.bg;
    ctx.fillRect(cx - s * 0.42, top0 + h * 0.2, s * 0.84, b.mm * 0.22);
  });
}

/** باريستا — حبّات بنٍّ على الضلعين بالتمييز والخافت بالتناوب، بشقّها في الوسط. */
function barista(ctx: Ctx, b: MotifBox, k: MotifInk): void {
  const room = b.reach - b.outer;
  const s = Math.min(b.mm * 2.2, room * 0.55);
  alongTopBottom(b, s * 1.6, (x, w, top) => {
    const cx = x + w / 2;
    const cy = top ? b.outer + room * 0.5 : b.H - b.outer - room * 0.5;
    const i = Math.round((x - b.outer) / w);
    const tilt = i % 2 ? -0.6 : 0.6;
    ctx.fillStyle = i % 3 === 2 ? k.muted : k.accent;
    ctx.beginPath();
    ctx.ellipse(cx, cy, s * 0.36, s * 0.5, tilt, 0, Math.PI * 2);
    ctx.fill();
    // الشقّ: خطٌّ منحنٍ بلون الأرضية على طول الحبّة.
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(tilt);
    ctx.strokeStyle = k.bg;
    ctx.lineWidth = b.mm * 0.3;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.4);
    ctx.bezierCurveTo(-s * 0.16, -s * 0.12, s * 0.16, s * 0.12, 0, s * 0.4);
    ctx.stroke();
    ctx.restore();
  });
}

/**
 * كرك — حبلُ مصابيح على الضلعين: سلكٌ بالخافت يتدلّى بين مساميره، ومصباحٌ بالتمييز في أخفض
 * كلّ تدلّية بقبّعته بالخافت.
 */
function karak(ctx: Ctx, b: MotifBox, k: MotifInk): void {
  const room = b.reach - b.outer;
  const s = Math.min(b.mm * 2.4, room * 0.55);
  alongTopBottom(b, s * 2.6, (x, w, top) => {
    const y0 = top ? b.outer + room * 0.18 : b.H - b.outer - room * 0.18;
    const sag = (top ? 1 : -1) * room * 0.34;
    ctx.strokeStyle = k.muted;
    ctx.lineWidth = b.mm * 0.22;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.quadraticCurveTo(x + w / 2, y0 + sag * 2, x + w, y0);
    ctx.stroke();
    // المصباح في أخفض التدلّية: قبّعةٌ بالخافت، ثم الزجاجة بالتمييز.
    const cx = x + w / 2;
    const cy = y0 + sag;
    const dir = top ? 1 : -1;
    ctx.fillStyle = k.muted;
    ctx.fillRect(cx - s * 0.13, Math.min(cy, cy + dir * s * 0.22), s * 0.26, s * 0.22);
    ctx.fillStyle = k.accent;
    ctx.beginPath();
    ctx.ellipse(cx, cy + dir * s * 0.46, s * 0.24, s * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

/** سماور — حاشية سجّادٍ على الضلعين: صفُّ أسنانٍ بالتمييز بين خيطين بالخافت. */
function samovar(ctx: Ctx, b: MotifBox, k: MotifInk): void {
  const room = b.reach - b.outer;
  const t = Math.min(b.mm * 1.8, room * 0.42);
  for (const top of [true, false]) {
    const mid = top ? b.outer + room * 0.5 : b.H - b.outer - room * 0.5;
    ctx.fillStyle = k.muted;
    ctx.fillRect(b.outer, mid - t * 0.75, b.W - b.outer * 2, b.mm * 0.22);
    ctx.fillRect(b.outer, mid + t * 0.75 - b.mm * 0.22, b.W - b.outer * 2, b.mm * 0.22);
  }
  alongTopBottom(b, t * 1.4, (x, w, top) => {
    const mid = top ? b.outer + room * 0.5 : b.H - b.outer - room * 0.5;
    const base = mid + (top ? -1 : 1) * t * 0.5;
    const tip = mid + (top ? 1 : -1) * t * 0.45;
    ctx.fillStyle = k.accent;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.08, base);
    ctx.lineTo(x + w * 0.92, base);
    ctx.lineTo(x + w / 2, tip);
    ctx.closePath();
    ctx.fill();
  });
}

/** تقطير — قطراتٌ بالتمييز على الضلعين، وبينها قمعٌ صغير بالخافت. */
function v60(ctx: Ctx, b: MotifBox, k: MotifInk): void {
  const room = b.reach - b.outer;
  const s = Math.min(b.mm * 2.4, room * 0.6);
  alongTopBottom(b, s * 1.7, (x, w, top) => {
    const cx = x + w / 2;
    const cy = top ? b.outer + room * 0.5 : b.H - b.outer - room * 0.5;
    const i = Math.round((x - b.outer) / w);
    if (i % 2) {
      // القمع: شبه منحرفٍ يضيق إلى القاع، وحافّته فوقه.
      ctx.fillStyle = k.muted;
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.42, cy - s * 0.32);
      ctx.lineTo(cx + s * 0.42, cy - s * 0.32);
      ctx.lineTo(cx + s * 0.1, cy + s * 0.22);
      ctx.lineTo(cx - s * 0.1, cy + s * 0.22);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(cx - s * 0.5, cy - s * 0.4, s, b.mm * 0.3);
      return;
    }
    // القطرة: رأسٌ مدبّب فوق قوسٍ مستدير.
    const r = s * 0.24;
    ctx.fillStyle = k.accent;
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.4);
    ctx.quadraticCurveTo(cx + r * 1.15, cy - r * 0.2, cx + r, cy + r * 0.45);
    ctx.arc(cx, cy + r * 0.45, r, 0, Math.PI);
    ctx.quadraticCurveTo(cx - r * 1.15, cy - r * 0.2, cx, cy - s * 0.4);
    ctx.fill();
  });
}

/** لاتيه — قلوبٌ من رسمة الحليب بالتمييز، وبينها فنجانٌ من فوق (حلقةٌ بالخافت). */
function latte(ctx: Ctx, b: MotifBox, k: MotifInk): void {
  const room = b.reach - b.outer;
  const s = Math.min(b.mm * 2.4, room * 0.6);
  alongTopBottom(b, s * 1.6, (x, w, top) => {
    const cx = x + w / 2;
    const cy = top ? b.outer + room * 0.5 : b.H - b.outer - room * 0.5;
    const i = Math.round((x - b.outer) / w);
    if (i % 2) {
      ctx.strokeStyle = k.muted;
      ctx.lineWidth = b.mm * 0.3;
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = k.muted;
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.14, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    const r = s * 0.36;
    ctx.fillStyle = k.accent;
    ctx.beginPath();
    ctx.moveTo(cx, cy + r);
    ctx.bezierCurveTo(cx - r * 1.35, cy + r * 0.2, cx - r * 1.1, cy - r * 1.05, cx - r * 0.45, cy - r * 0.55);
    ctx.bezierCurveTo(cx - r * 0.15, cy - r * 0.67, cx, cy - r * 0.43, cx, cy - r * 0.23);
    ctx.bezierCurveTo(cx, cy - r * 0.43, cx + r * 0.15, cy - r * 0.67, cx + r * 0.45, cy - r * 0.55);
    ctx.bezierCurveTo(cx + r * 1.1, cy - r * 1.05, cx + r * 1.35, cy + r * 0.2, cx, cy + r);
    ctx.fill();
  });
}

/** مطحنة — درجات الطحن: خمس حبيباتٍ تصغر في كلّ خانة، بالتمييز والخافت بالتناوب. */
function grinder(ctx: Ctx, b: MotifBox, k: MotifInk): void {
  const room = b.reach - b.outer;
  const s = Math.min(b.mm * 2.6, room * 0.6);
  alongTopBottom(b, s * 2.4, (x, w, top) => {
    const cy = top ? b.outer + room * 0.5 : b.H - b.outer - room * 0.5;
    const i = Math.round((x - b.outer) / w);
    ctx.fillStyle = i % 2 ? k.muted : k.accent;
    for (let g = 0; g < 5; g++) {
      ctx.beginPath();
      ctx.arc(x + w * (0.14 + g * 0.18), cy, s * (0.22 - g * 0.035), 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/** درايف — خطّ مسارٍ متقطّع بالخافت على الضلعين، وسهمٌ بالتمييز كلّ ثلاث شُرَط. */
function drive(ctx: Ctx, b: MotifBox, k: MotifInk): void {
  const room = b.reach - b.outer;
  const s = Math.min(b.mm * 2.4, room * 0.6);
  alongTopBottom(b, s * 1.5, (x, w, top) => {
    const cx = x + w / 2;
    const cy = top ? b.outer + room * 0.5 : b.H - b.outer - room * 0.5;
    const i = Math.round((x - b.outer) / w);
    if (i % 3 === 1) {
      // السهم: رأسٌ مثلّث على ساقٍ قصيرة، كالمرسوم على الإسفلت.
      ctx.fillStyle = k.accent;
      ctx.fillRect(cx - s * 0.4, cy - s * 0.09, s * 0.42, s * 0.18);
      ctx.beginPath();
      ctx.moveTo(cx + s * 0.42, cy);
      ctx.lineTo(cx + s * 0.02, cy - s * 0.3);
      ctx.lineTo(cx + s * 0.02, cy + s * 0.3);
      ctx.closePath();
      ctx.fill();
      return;
    }
    ctx.fillStyle = k.muted;
    rrect(ctx, cx - s * 0.42, cy - s * 0.08, s * 0.84, s * 0.16, s * 0.08);
    ctx.fill();
  });
}

/** حطب — ألسنة لهبٍ بالتمييز على الضلعين، وبينها جمرتان بالخافت. */
function woodfire(ctx: Ctx, b: MotifBox, k: MotifInk): void {
  const room = b.reach - b.outer;
  const s = Math.min(b.mm * 2.6, room * 0.62);
  alongTopBottom(b, s * 1.6, (x, w, top) => {
    const cx = x + w / 2;
    const cy = top ? b.outer + room * 0.5 : b.H - b.outer - room * 0.5;
    const i = Math.round((x - b.outer) / w);
    if (i % 2) {
      ctx.fillStyle = k.muted;
      for (const dx of [-0.18, 0.18]) {
        ctx.beginPath();
        ctx.arc(cx + s * dx, cy + s * 0.12, s * 0.1, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    // اللسان: قاعدةٌ مستديرة ورأسٌ مدبّب — يشير إلى الداخل في الضلعين.
    const dir = top ? 1 : -1;
    const base = cy - dir * s * 0.32;
    const tip = cy + dir * s * 0.42;
    ctx.fillStyle = k.accent;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.2, base);
    ctx.quadraticCurveTo(cx - s * 0.24, cy, cx, tip);
    ctx.quadraticCurveTo(cx + s * 0.24, cy, cx + s * 0.2, base);
    ctx.closePath();
    ctx.fill();
  });
}

/** علبة — شرائح بيتزا بالتمييز رأسها إلى الداخل، وبينها خطّ ثنيةٍ متقطّع بالخافت. */
function pizzabox(ctx: Ctx, b: MotifBox, k: MotifInk): void {
  const room = b.reach - b.outer;
  const s = Math.min(b.mm * 2.6, room * 0.62);
  alongTopBottom(b, s * 1.5, (x, w, top) => {
    const cx = x + w / 2;
    const cy = top ? b.outer + room * 0.5 : b.H - b.outer - room * 0.5;
    const i = Math.round((x - b.outer) / w);
    if (i % 2) {
      ctx.strokeStyle = k.muted;
      ctx.lineWidth = b.mm * 0.3;
      ctx.setLineDash([b.mm * 0.8, b.mm * 0.6]);
      ctx.beginPath();
      ctx.moveTo(x + w * 0.12, cy);
      ctx.lineTo(x + w * 0.88, cy);
      ctx.stroke();
      ctx.setLineDash([]);
      return;
    }
    const dir = top ? 1 : -1;
    const crust = cy - dir * s * 0.34;
    ctx.fillStyle = k.accent;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.34, crust);
    ctx.quadraticCurveTo(cx, crust - dir * s * 0.16, cx + s * 0.34, crust);
    ctx.lineTo(cx, cy + dir * s * 0.4);
    ctx.closePath();
    ctx.fill();
  });
}

/** شريحة — مصابيح اللوحة المضيئة: نقاطٌ بالتمييز، وكلّ ثالثةٍ بطاقة سعرٍ صغيرة بالخافت. */
function slices(ctx: Ctx, b: MotifBox, k: MotifInk): void {
  const room = b.reach - b.outer;
  const s = Math.min(b.mm * 2.2, room * 0.6);
  alongTopBottom(b, s * 1.2, (x, w, top) => {
    const cx = x + w / 2;
    const cy = top ? b.outer + room * 0.5 : b.H - b.outer - room * 0.5;
    const i = Math.round((x - b.outer) / w);
    if (i % 3 === 1) {
      ctx.fillStyle = k.muted;
      rrect(ctx, cx - s * 0.36, cy - s * 0.16, s * 0.72, s * 0.32, s * 0.08);
      ctx.fill();
      return;
    }
    ctx.fillStyle = k.accent;
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.17, 0, Math.PI * 2);
    ctx.fill();
  });
}

/** نابولي — بلاطٌ مزجّج: مربّعٌ بحدٍّ بالخافت وزهرةٌ بأربع بتلاتٍ بالتمييز في قلبه. */
function napoli(ctx: Ctx, b: MotifBox, k: MotifInk): void {
  const room = b.reach - b.outer;
  const s = Math.min(b.mm * 3, room * 0.7);
  alongTopBottom(b, s * 1.15, (x, w, top) => {
    const cx = x + w / 2;
    const cy = top ? b.outer + room * 0.5 : b.H - b.outer - room * 0.5;
    ctx.strokeStyle = k.muted;
    ctx.lineWidth = b.mm * 0.25;
    ctx.strokeRect(cx - s * 0.46, cy - s * 0.46, s * 0.92, s * 0.92);
    ctx.fillStyle = k.accent;
    for (let p = 0; p < 4; p++) {
      const a = (Math.PI / 2) * p;
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(a) * s * 0.17, cy + Math.sin(a) * s * 0.17, s * 0.15, s * 0.07, a, 0, Math.PI * 2);
      ctx.fill();
    }
  });
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
  harbor,
  patisserie,
  juice,
  burger,
  bakery,
  breakfast,
  grill,
  pizza,
  dallah,
  barista,
  karak,
  samovar,
  v60,
  latte,
  grinder,
  drive,
  woodfire,
  pizzabox,
  slices,
  napoli,
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

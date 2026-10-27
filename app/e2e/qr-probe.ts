/**
 * مسبار كود QR في قطعةٍ مرسومة — **يُحمَّل داخل المتصفّح** من خادم vite
 * (`import("/e2e/qr-probe.ts")` في `page.evaluate`)، فيرسم بالمحرّك الحقيقي
 * (`renderCard`) بخطوطه وزخارفه، ثم يقيس البكسلات.
 *
 * ═══ لماذا لا فكّ ترميز ═══
 *
 * لا مكتبة فكٍّ في `node_modules` (`jsQR` ذُكرت في §١٧ ولم تبقَ). فالفحص أقسى
 * من الفكّ: يبني المصفوفة المتوقَّعة من الرابط نفسه (`QRCode.create`)، ثم يقرأ
 * مركز **كلّ وحدة** في الصورة ويطابقها. الفاكّ يتسامح مع ٧–١٥٪ تلفاً بتصحيح
 * الأخطاء؛ هذا لا يتسامح مع وحدةٍ واحدة. ومعه: منطقة الهدوء بالوحدات على
 * الجهات الأربع، وتباين الحبر الفعلي على الورق، ومقاس الوحدة بالمليمتر.
 */
import QRCode from "qrcode";
import { renderCard, sizeOf, type CardInput } from "../src/lib/cards";

export interface QrFace {
  /** وحدات طوبقت (N×N) — وعدد ما خالف المتوقَّع. */
  modules: number;
  mismatches: number;
  /** منطقة الهدوء بالوحدات: أعلى · يمين · أسفل · يسار. */
  quiet: [number, number, number, number];
  /** تباين حبر الوحدة الغامقة على الفاتحة كما رُسما فعلاً. */
  contrast: number;
  /** مقاس الوحدة على الورق بالمليمتر (بدقّة ٣٠٠). */
  moduleMm: number;
  /** ضلع الكود (بلا هدوء) بالمليمتر. */
  sizeMm: number;
}

type RGB = [number, number, number];

function lum([r, g, b]: RGB): number {
  const c = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const ratio = (a: RGB, b: RGB) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** يقيس وجهاً واحداً: منطقة `[y0, y1)` من اللوحة، و`flip` للوجه المقلوب في الستاند. */
function probeFace(
  img: ImageData,
  y0: number,
  y1: number,
  expected: { size: number; get: (r: number, c: number) => boolean },
  flip: boolean,
  pxPerMm: number
): QrFace {
  const W = img.width;
  const at = (x: number, y: number): RGB => {
    const i = (y * W + x) * 4;
    return [img.data[i], img.data[i + 1], img.data[i + 2]];
  };
  const isWhite = (p: RGB) => p[0] === 255 && p[1] === 255 && p[2] === 255;

  // ١) اللوح: أطول تتابعٍ أبيض أفقياً — اللوح أكبر سطحٍ أبيض مصمت في البطاقة.
  let best = { len: 0, y: 0, x0: 0 };
  for (let y = y0; y < y1; y += 2) {
    let run = 0;
    for (let x = 0; x < W; x++) {
      run = isWhite(at(x, y)) ? run + 1 : 0;
      // تتابعٌ يلمس حافّة اللوحة أرضيةٌ بيضاء («عصري») لا لوح — اللوح داخل الوجه دائماً.
      const x0 = x - run + 1;
      const closed = x + 1 < W && !isWhite(at(x + 1, y));
      if (run > best.len && x0 > 0 && closed) best = { len: run, y, x0 };
    }
  }
  // ٢) داخل صفّ اللوح الأبيض: الحبر هو أغمق لونٍ في المربّع الذي يحدّه.
  const px0 = best.x0;
  const px1 = best.x0 + best.len;
  // حدود اللوح الرأسية من عمودٍ قرب حافّته — داخل الهامش الأبيض الذي يحيط
  // المصفوفة، فهو أبيض من رأس اللوح إلى قاعه (لا يمرّ بوحدة).
  const mx = px0 + Math.max(2, Math.round(best.len * 0.04));
  let py0 = best.y;
  let py1 = best.y;
  while (py0 - 1 >= y0 && isWhite(at(mx, py0 - 1))) py0--;
  while (py1 + 1 < y1 && isWhite(at(mx, py1 + 1))) py1++;

  // ٣) صندوق الحبر: كلّ بكسلٍ غير أبيض داخل اللوح (بعد هامشٍ يستبعد حوافّه
  //    المدوّرة) — مصفوفة الكود تبدأ وتنتهي بأنماط الإيجاد فالصندوق دقيق.
  const inset = Math.round((px1 - px0) * 0.03);
  let bx0 = Infinity, by0 = Infinity, bx1 = -1, by1 = -1;
  let ink: RGB = [255, 255, 255];
  for (let y = py0 + inset; y <= py1 - inset; y++) {
    for (let x = px0 + inset; x < px1 - inset; x++) {
      const p = at(x, y);
      if (isWhite(p)) continue;
      if (lum(p) < lum(ink)) ink = p;
      if (x < bx0) bx0 = x;
      if (x > bx1) bx1 = x;
      if (y < by0) by0 = y;
      if (y > by1) by1 = y;
    }
  }
  const N = expected.size;
  const side = Math.min(bx1 - bx0 + 1, by1 - by0 + 1);
  const m = side / N;

  // ٤) كلّ وحدة من مركزها.
  let mismatches = 0;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const x = Math.floor(bx0 + (c + 0.5) * m);
      const y = Math.floor(by0 + (r + 0.5) * m);
      const dark = !isWhite(at(x, y)) && ratio(at(x, y), [255, 255, 255]) > 3;
      const want = flip ? expected.get(N - 1 - r, N - 1 - c) : expected.get(r, c);
      if (dark !== want) mismatches++;
    }
  }

  // ٥) الهدوء: بياضٌ متّصل من حافّة المصفوفة حتى أوّل بكسل غير أبيض، على خطّ
  //    منتصف كلّ جهة.
  const cx = Math.round((bx0 + bx1) / 2);
  const cy = Math.round((by0 + by1) / 2);
  const walk = (x: number, y: number, dx: number, dy: number) => {
    let n = 0;
    while (x >= 0 && x < W && y >= y0 && y < y1 && isWhite(at(x, y))) {
      n++;
      x += dx;
      y += dy;
    }
    return n / m;
  };
  const quiet: [number, number, number, number] = [
    walk(cx, by0 - 1, 0, -1),
    walk(bx1 + 1, cy, 1, 0),
    walk(cx, by1 + 1, 0, 1),
    walk(bx0 - 1, cy, -1, 0),
  ];
  return {
    modules: N * N,
    mismatches,
    quiet,
    contrast: ratio(ink, [255, 255, 255]),
    moduleMm: m / pxPerMm,
    sizeMm: side / pxPerMm,
  };
}

/** يرسم القطعة بالمحرّك الحقيقي ويقيس كودها (وكودَي الوجهين في الستاند). */
export async function probe(input: CardInput): Promise<QrFace[]> {
  const canvas = document.createElement("canvas");
  await renderCard(canvas, input, 1);
  const ctx = canvas.getContext("2d")!;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const qr = QRCode.create(input.url, { errorCorrectionLevel: input.logo ? "H" : "M" });
  const expected = { size: qr.modules.size, get: (r: number, c: number) => !!qr.modules.get(r, c) };
  const pxPerMm = canvas.width / sizeOf(input.size).mm[0];
  const folded = input.size === "tent" || input.size === "tent-a5";
  if (!folded) return [probeFace(img, 0, canvas.height, expected, false, pxPerMm)];
  const half = Math.round(canvas.height / 2);
  // الوجه العلوي مقلوبٌ ١٨٠° (رأسه عند الطيّة) — والسفلي معتدل.
  return [
    probeFace(img, 0, half - 2, expected, true, pxPerMm),
    probeFace(img, half + 2, canvas.height, expected, false, pxPerMm),
  ];
}

/** القطعة مرسومةً صورةً — للّقطات. */
export async function renderPng(input: CardInput, scale = 0.5): Promise<string> {
  const canvas = document.createElement("canvas");
  await renderCard(canvas, input, scale);
  return canvas.toDataURL("image/png");
}

/** هل حُمّلت خطوط الطابع فعلاً؟ (الدرس: اللقطة بخطٍّ احتياطيّ تكذب صامتة.) */
export function fontsLoaded(families: string[]): Record<string, boolean> {
  return Object.fromEntries(families.map((f) => [f, document.fonts.check(`16px "${f}"`, "بسم")]));
}

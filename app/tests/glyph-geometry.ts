/**
 * صندوق الحبر لرمزٍ من `lib/icons.tsx` — بلا متصفّح.
 *
 * `getBBox` يحتاج DOM يرسم، و`jsdom` لا يرسم. فهذا محلّل مسارات صغير: يمشي
 * أوامر SVG كلّها (مطلقةً ونسبية، وما بعد `M` خطٌّ ضمني) ويأخذ عيّناتٍ من كلّ
 * منحنى وقوس، ثم يمدّ الحدود بنصف الحدّ للمسارات المُحدَّدة. الدقّة ~٠٫٠١ وحدة،
 * وهي أكثر مما تحتاجه قاعدة «داخل ١٫٥–٢٢٫٥».
 */
import type { Glyph } from "../src/lib/icons";

type Pt = [number, number];
const ARGS: Record<string, number> = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };
const STEPS = 48;

/** نقاط مسارٍ واحد (عيّنات على المنحنيات والأقواس). */
export function samplePath(d: string): Pt[] {
  const toks = d.match(/[MLHVCSQTAZmlhvcsqtaz]|-?(?:\d*\.\d+|\d+\.?)(?:e-?\d+)?/g) ?? [];
  const pts: Pt[] = [];
  let x = 0, y = 0, sx = 0, sy = 0;
  let cmd = "";
  let prevCtrl: Pt | null = null;
  let prevQ: Pt | null = null;
  let i = 0;
  while (i < toks.length) {
    if (/[a-z]/i.test(toks[i])) {
      cmd = toks[i++];
      if (cmd.toUpperCase() === "Z") {
        x = sx; y = sy; pts.push([x, y]);
        prevCtrl = prevQ = null;
        continue;
      }
    }
    const U = cmd.toUpperCase();
    const rel = cmd !== U;
    const a = toks.slice(i, i + ARGS[U]).map(Number);
    i += ARGS[U];
    const ox = rel ? x : 0, oy = rel ? y : 0;
    let ctrl: Pt | null = null, q: Pt | null = null;
    switch (U) {
      case "M":
        x = ox + a[0]; y = oy + a[1]; sx = x; sy = y; pts.push([x, y]);
        cmd = rel ? "l" : "L"; // ما بعد M خطٌّ ضمني
        break;
      case "L": x = ox + a[0]; y = oy + a[1]; pts.push([x, y]); break;
      case "H": x = (rel ? x : 0) + a[0]; pts.push([x, y]); break;
      case "V": y = (rel ? y : 0) + a[0]; pts.push([x, y]); break;
      case "C": case "S": {
        const p0: Pt = [x, y];
        const c1: Pt = U === "C" ? [ox + a[0], oy + a[1]] : prevCtrl ? [2 * x - prevCtrl[0], 2 * y - prevCtrl[1]] : [x, y];
        const k = U === "C" ? 2 : 0;
        const c2: Pt = [ox + a[k], oy + a[k + 1]];
        const p3: Pt = [ox + a[k + 2], oy + a[k + 3]];
        for (let s = 1; s <= STEPS; s++) {
          const t = s / STEPS, u = 1 - t;
          pts.push([
            u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p3[0],
            u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p3[1],
          ]);
        }
        ctrl = c2; [x, y] = p3;
        break;
      }
      case "Q": case "T": {
        const p0: Pt = [x, y];
        const c1: Pt = U === "Q" ? [ox + a[0], oy + a[1]] : prevQ ? [2 * x - prevQ[0], 2 * y - prevQ[1]] : [x, y];
        const k = U === "Q" ? 2 : 0;
        const p2: Pt = [ox + a[k], oy + a[k + 1]];
        for (let s = 1; s <= STEPS; s++) {
          const t = s / STEPS, u = 1 - t;
          pts.push([u * u * p0[0] + 2 * u * t * c1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * c1[1] + t * t * p2[1]]);
        }
        q = c1; [x, y] = p2;
        break;
      }
      case "A": {
        const [x2, y2] = [ox + a[5], oy + a[6]];
        pts.push(...arc(x, y, a[0], a[1], a[2], a[3], a[4], x2, y2));
        x = x2; y = y2;
        break;
      }
    }
    prevCtrl = ctrl;
    prevQ = q;
  }
  return pts;
}

/** قوس SVG بالتمثيل المركزي (مواصفة SVG، الملحق F.6.5) ثم عيّنات. */
function arc(x1: number, y1: number, rx: number, ry: number, deg: number, fa: number, fs: number, x2: number, y2: number): Pt[] {
  if (!rx || !ry) return [[x2, y2]];
  rx = Math.abs(rx); ry = Math.abs(ry);
  const phi = (deg * Math.PI) / 180, cos = Math.cos(phi), sin = Math.sin(phi);
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
  const xp = cos * dx + sin * dy, yp = -sin * dx + cos * dy;
  const lam = (xp * xp) / (rx * rx) + (yp * yp) / (ry * ry);
  if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
  const num = rx * rx * ry * ry - rx * rx * yp * yp - ry * ry * xp * xp;
  const den = rx * rx * yp * yp + ry * ry * xp * xp;
  const coef = (fa === fs ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
  const cxp = (coef * rx * yp) / ry, cyp = (-coef * ry * xp) / rx;
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2, cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
  const ang = (ux: number, uy: number, vx: number, vy: number) =>
    Math.sign(ux * vy - uy * vx || 1) * Math.acos(Math.max(-1, Math.min(1, (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy)))));
  const t1 = ang(1, 0, (xp - cxp) / rx, (yp - cyp) / ry);
  let dt = ang((xp - cxp) / rx, (yp - cyp) / ry, (-xp - cxp) / rx, (-yp - cyp) / ry);
  if (!fs && dt > 0) dt -= 2 * Math.PI;
  if (fs && dt < 0) dt += 2 * Math.PI;
  const out: Pt[] = [];
  for (let s = 1; s <= STEPS; s++) {
    const t = t1 + (dt * s) / STEPS;
    out.push([cx + rx * cos * Math.cos(t) - ry * sin * Math.sin(t), cy + rx * sin * Math.cos(t) + ry * cos * Math.sin(t)]);
  }
  return out;
}

export type InkBox = { x0: number; y0: number; x1: number; y1: number; w: number; h: number; cx: number; cy: number };

/** صندوق الحبر: المسارات المُحدَّدة ممدودةً بنصف الحدّ، والمملوءة واللمسة كما هي. */
export function inkBox(g: Glyph, stroke = 1.75): InkBox {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const take = (d: string, pad: number) => {
    for (const [x, y] of samplePath(d)) {
      x0 = Math.min(x0, x - pad); y0 = Math.min(y0, y - pad);
      x1 = Math.max(x1, x + pad); y1 = Math.max(y1, y + pad);
    }
  };
  for (const d of g.s ?? []) take(d, stroke / 2);
  for (const d of g.f ?? []) take(d, 0);
  for (const d of g.t ?? []) take(d, 0);
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}

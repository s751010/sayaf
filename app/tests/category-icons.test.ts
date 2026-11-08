/**
 * رموز الأقسام طقمٌ واحد (§20، طلب المالك ٢٠٢٦/١١/٠٨).
 *
 * قال المالك عن شريط الأقسام: «المقبلات الشكل كأنه قارب». وحين قيست رموز
 * الطعام معاً ظهر ما لا يراه أحد في رمزٍ منفرد: بخار الاستكانة يخرج من الشبكة،
 * والبيضة والدلّة أصغر من أخواتهما ومزاحتان، والكرواسون ينزل وحدتين. فهذا
 * الملفّ يحرس **الطقم** لا رمزاً بعينه:
 *
 * ١. **الربط**: كلّ قسمٍ في القاموس وكلّ قسمٍ في المنيوهات التجريبية يلبس رمز
 *    طعامٍ حقيقياً — لا الصحن العامّ، ولا رمزاً مكرّراً لقسمين مختلفين في منيو.
 * ٢. **مصدر رسم واحد**: الـDOM (`Icon`) واللوحة (`paintIcon`) يرسمان المسارات
 *    نفسها بالترتيب نفسه — المطبوع هو المعروض (§20).
 * ٣. **الهندسة**: الحبر داخل الشبكة، متوسّطٌ، وبحجمٍ واحد تقريباً.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CANON, categoriesOf, categoryIcon } from "@/lib/categories";
import { DEMO_KINDS, demoData } from "@/lib/demoMenus";
import { FOOD_NAMES, GLYPHS, Icon, paintIcon, type IconName } from "@/lib/icons";
import { inkBox } from "./glyph-geometry";

const FOOD = new Set<string>(FOOD_NAMES);

describe("الربط: كلّ قسمٍ برمز طعامٍ يناسبه", () => {
  it("كلّ رمزٍ في القاموس رمز طعامٍ موجود", () => {
    for (const k of CANON) expect(FOOD.has(k.icon), `${k.id} ⇐ ${k.icon}`).toBe(true);
  });

  it("كلّ قسمٍ في المنيوهات التجريبية برمز طعام — لا الصحن العامّ", () => {
    for (const kind of ["restaurant", ...DEMO_KINDS]) {
      for (const cat of categoriesOf(demoData(kind).dishes)) {
        expect(FOOD.has(categoryIcon(cat)), `${kind} · «${cat}» ⇐ ${categoryIcon(cat)}`).toBe(true);
      }
    }
  });

  it("ولا يتكرّر رمزٌ لقسمين في منيوٍ واحد إلا حيث القسمان من نوعٍ واحد", () => {
    // المعروف المسموح: «عصير طازج» و«سموذي» و«كوكتيلات» كلّها كأس عصير؛ و«الكيك»
    // و«الحلويات الشرقية» حلوى؛ و«الأسماك» و«القشريات» بحريّات… — والممنوع ما
    // كان: البيتزا والمعكرونة بشريحةٍ واحدة، و«بالحليب» و«باردة» بقارورتين.
    const allowed = new Set(["juice", "cake", "fish", "croissant", "istikana", "cup"]);
    for (const kind of ["restaurant", ...DEMO_KINDS]) {
      const seen = new Map<IconName, string>();
      for (const cat of categoriesOf(demoData(kind).dishes)) {
        const icon = categoryIcon(cat);
        const before = seen.get(icon);
        if (before && !allowed.has(icon)) {
          throw new Error(`${kind}: «${before}» و«${cat}» برمزٍ واحد (${icon})`);
        }
        seen.set(icon, cat);
      }
    }
  });

  it.each([
    // المالك: «المقبلات كأنه قارب» — الرمز أُعيد رسمه والربط باقٍ.
    ["المقبلات", "mezze"],
    ["المعكرونة", "pasta"],
    ["البيتزا", "pizza"],
    ["البيتزا والباستا", "pizza"],
    ["التمور", "dates"],
    ["الإضافات", "sides"],
    ["الجانبية", "sides"],
  ] as const)("«%s» ⇐ %s", (cat, icon) => {
    expect(categoryIcon(cat)).toBe(icon);
  });
});

describe("مصدر رسم واحد للـDOM وللوحة", () => {
  // اللوحة في node بلا `Path2D`: بديلٌ يحفظ النصّ الذي بُني منه فقط.
  const real = (globalThis as { Path2D?: unknown }).Path2D;
  beforeAll(() => {
    (globalThis as { Path2D?: unknown }).Path2D = class {
      constructor(public d: string) {}
    };
  });
  afterAll(() => {
    (globalThis as { Path2D?: unknown }).Path2D = real;
  });

  it.each([...FOOD_NAMES, "plate"])("%s: المسارات نفسها بالترتيب نفسه", (name) => {
    const g = GLYPHS[name];
    const html = renderToStaticMarkup(createElement(Icon, { name }));
    const dom = [...html.matchAll(/<path d="([^"]+)"( fill="currentColor")?/g)].map((m) => ({ d: m[1], fill: !!m[2] }));

    const canvas: { d: string; fill: boolean }[] = [];
    const ctx = {
      save() {}, restore() {}, translate() {}, scale() {},
      stroke(p: { d: string }) { canvas.push({ d: p.d, fill: false }); },
      fill(p: { d: string }) { canvas.push({ d: p.d, fill: true }); },
    } as unknown as CanvasRenderingContext2D;
    expect(paintIcon(ctx, name, 0, 0, 24, "#000")).toBe(true);

    const source = [...(g.s ?? []).map((d) => ({ d, fill: false })), ...(g.f ?? []).map((d) => ({ d, fill: true }))];
    expect(dom).toEqual(source);
    expect(canvas).toEqual(source);
  });
});

describe("الهندسة: طقمٌ بحجمٍ واحد على شبكةٍ واحدة", () => {
  // الحدود بالحبر (المسار + نصف الحدّ ١٫٧٥): المنطقة الحيّة ٢–٢٢ للمسار.
  it.each([...FOOD_NAMES, "plate"])("%s: داخل الشبكة ومتوسّط وبحجم أخواته", (name) => {
    const b = inkBox(GLYPHS[name]);
    const at = `${name}: x[${b.x0.toFixed(2)}, ${b.x1.toFixed(2)}] y[${b.y0.toFixed(2)}, ${b.y1.toFixed(2)}]`;
    // ١. لا حبر خارج ١٫٥–٢٢٫٥: بخار الاستكانة كان يبلغ ٠٫٧.
    expect(Math.min(b.x0, b.y0), at).toBeGreaterThanOrEqual(1.5);
    expect(Math.max(b.x1, b.y1), at).toBeLessThanOrEqual(22.5);
    // ٢. متوسّط: البيضة كانت ١٣، والكرواسون ١٤، والإضافات ١٣٫٣.
    expect(Math.abs(b.cx - 12), at).toBeLessThanOrEqual(0.6);
    expect(Math.abs(b.cy - 12), at).toBeLessThanOrEqual(0.6);
    // ٣. بحجم أخواته: البيضة كانت ١٦٫٧ والدلّة ١٦٫٩ بين رموزٍ تبلغ ٢٠.
    const big = Math.max(b.w, b.h);
    expect(big, at).toBeGreaterThanOrEqual(17.5);
    expect(big, at).toBeLessThanOrEqual(21);
  });
});

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
 *    نفسها بالترتيب نفسه — المطبوع هو المعروض (§20). **واللمسة منها**: طبقة
 *    التعبئة الناعمة (`t`، «خطٌّ + لمسة لون»، المالك ٢٠٢٦/١١/٠٨) تُرسم أوّلاً
 *    في الاثنين، و`tint: false` يسقطها من اللوحة وحدها (الكاشير المقتصد).
 * ٣. **الهندسة**: الحبر داخل الشبكة، متوسّطٌ، وبحجمٍ واحد تقريباً — واللمسة
 *    داخل حبر الخطّ لا تخرج منه.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CANON, categoriesOf, categoryIcon } from "@/lib/categories";
import { DEMO_KINDS, demoData } from "@/lib/demoMenus";
import { FOOD_NAMES, GLYPHS, Icon, paintIcon, TINT, type IconName } from "@/lib/icons";
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
    // المالك: «المقبلات كأنه قارب» — الرمز أُعيد رسمه (صحنٌ بثلاث خانات) والربط باقٍ.
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

  type Op = { d: string; as: "tint" | "stroke" | "fill" };

  /** لوحةٌ تسجّل ما يُرسم: المسار، وكيف، وبأيّ شفافيةٍ ولون. */
  function recorder() {
    const ops: (Op & { alpha: number; style: string })[] = [];
    const stack: { globalAlpha: number; fillStyle: string }[] = [];
    const ctx = {
      globalAlpha: 1, fillStyle: "", strokeStyle: "", lineWidth: 1, lineCap: "", lineJoin: "",
      save() { stack.push({ globalAlpha: this.globalAlpha, fillStyle: this.fillStyle }); },
      restore() { Object.assign(this, stack.pop()); },
      translate() {}, scale() {},
      stroke(p: { d: string }) { ops.push({ d: p.d, as: "stroke", alpha: this.globalAlpha, style: this.strokeStyle }); },
      // اللمسة وحدها تُرسم بشفافيةٍ أو بلونٍ غير حبر الرمز — هكذا تُعرف من النقاط.
      fill(p: { d: string }) {
        const tint = this.globalAlpha !== 1 || this.fillStyle !== this.strokeStyle;
        ops.push({ d: p.d, as: tint ? "tint" : "fill", alpha: this.globalAlpha, style: this.fillStyle });
      },
    };
    return { ops, ctx: ctx as unknown as CanvasRenderingContext2D };
  }

  const sourceOf = (name: string): Op[] => {
    const g = GLYPHS[name];
    return [
      ...(g.t ?? []).map((d) => ({ d, as: "tint" as const })),
      ...(g.s ?? []).map((d) => ({ d, as: "stroke" as const })),
      ...(g.f ?? []).map((d) => ({ d, as: "fill" as const })),
    ];
  };

  it.each([...FOOD_NAMES, "plate"])("%s: المسارات نفسها بالترتيب نفسه — اللمسة أوّلاً", (name) => {
    const html = renderToStaticMarkup(createElement(Icon, { name }));
    const dom: Op[] = [...html.matchAll(/<path d="([^"]+)"([^>]*)>/g)].map((m) => ({
      d: m[1],
      as: m[2].includes('class="cm-tint"') ? "tint" : m[2].includes('fill="currentColor"') ? "fill" : "stroke",
    }));

    const { ops, ctx } = recorder();
    expect(paintIcon(ctx, name, 0, 0, 24, "#000")).toBe(true);

    const source = sourceOf(name);
    expect(dom).toEqual(source);
    expect(ops.map(({ d, as }) => ({ d, as }))).toEqual(source);
  });

  it.each([...FOOD_NAMES])("%s: اللمسة في اللوحة بحبر الرمز بكثافة TINT، وتسقط بـ`tint: false`", (name) => {
    const plain = recorder();
    paintIcon(plain.ctx, name, 0, 0, 24, "#123456");
    const tints = plain.ops.filter((o) => o.as === "tint");
    expect(tints.length).toBe(GLYPHS[name].t?.length);
    for (const o of tints) expect([o.alpha, o.style]).toEqual([TINT, "#123456"]);
    // والخطّ بعدها بلا شفافية: `save/restore` حول اللمسة لا يُسرّب الكثافة إليه.
    for (const o of plain.ops.filter((x) => x.as !== "tint")) expect(o.alpha).toBe(1);

    const colored = recorder();
    paintIcon(colored.ctx, name, 0, 0, 24, "#123456", { tint: "#abcdef" });
    for (const o of colored.ops.filter((x) => x.as === "tint")) expect([o.alpha, o.style]).toEqual([1, "#abcdef"]);

    const bare = recorder();
    paintIcon(bare.ctx, name, 0, 0, 24, "#123456", { tint: false });
    expect(bare.ops.map(({ d, as }) => ({ d, as }))).toEqual(sourceOf(name).filter((o) => o.as !== "tint"));
  });

  it("كلّ رمز طعامٍ بلمسة، والصحن العامّ بلا لمسة", () => {
    // الصحن رمز «لا نعرف هذا القسم» ورمزٌ في لوحة التاجر — لونٌ عليه يَعِد بمعنى ليس فيه.
    for (const name of FOOD_NAMES) expect(GLYPHS[name].t?.length ?? 0, name).toBeGreaterThan(0);
    expect(GLYPHS.plate.t).toBeUndefined();
  });

  it("الـDOM يحمل احتياطاً بلا CSS: حبر الرمز بكثافة TINT", () => {
    const html = renderToStaticMarkup(createElement(Icon, { name: "egg" }));
    expect(html).toContain(`class="cm-tint" fill="currentColor" fill-opacity="${TINT}" stroke="none"`);
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

  it.each([...FOOD_NAMES])("%s: اللمسة داخل حبر الخطّ لا تخرج منه", (name) => {
    // تعبئةٌ تتجاوز الحدّ تُقرأ طباعةً منزاحة عن قالبها.
    const g = GLYPHS[name];
    const tint = inkBox({ f: g.t });
    const line = inkBox({ s: g.s, f: g.f });
    const at = `${name}: لمسة x[${tint.x0.toFixed(2)}, ${tint.x1.toFixed(2)}] y[${tint.y0.toFixed(2)}, ${tint.y1.toFixed(2)}]`;
    expect(tint.x0, at).toBeGreaterThanOrEqual(line.x0);
    expect(tint.y0, at).toBeGreaterThanOrEqual(line.y0);
    expect(tint.x1, at).toBeLessThanOrEqual(line.x1);
    expect(tint.y1, at).toBeLessThanOrEqual(line.y1);
  });
});

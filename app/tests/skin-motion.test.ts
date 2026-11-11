/**
 * طبقة التفاعل المشتركة (`lib/skinMotion.ts`) — الحساب وحده، بلا متصفّح.
 *
 * ما يحرسه: التقدّم لا يخرج عن ‎0..1 ولا يكون `NaN` (صفحةٌ أقصر من الشاشة، ارتداد iOS
 * فوق القمّة)، وهو **مكمَّم** — متغيّرٌ موروثٌ على الجذر لا يُكتب لكلّ بكسل. والطابع
 * الذي يقرأ الطبقة له في CSS ما يقرؤه، وكلّه داخل `no-preference`.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  ADDED_MS, MOTION_SKINS, SCROLL_READERS, SCROLL_STEP, SCROLL_Y_MAX, SCROLL_Y_READERS, SCROLL_Y_STEP, scrollDepth,
  scrollProgress, wantsMotion,
} from "@/lib/skinMotion";
import { ALL_THEMES } from "@/lib/themes";
import { skinFile } from "./skin-css";

describe("تقدّم التمرير", () => {
  it.each([
    [0, 3000, 800, 0],
    [1100, 3000, 800, 0.5],
    [2200, 3000, 800, 1],
    // ارتداد iOS: فوق القمّة وتحت القاع.
    [-60, 3000, 800, 0],
    [2400, 3000, 800, 1],
    // صفحةٌ لا تتمرّر.
    [0, 700, 800, 0],
    [10, 800, 800, 0],
  ])("y=%d صفحة %d شاشة %d ⇒ %d", (y, doc, view, p) => {
    expect(scrollProgress(y, doc, view)).toBe(p);
  });

  it("لا `NaN` ولا لانهاية", () => {
    expect(scrollProgress(Number.NaN, 3000, 800)).toBe(0);
    expect(scrollProgress(100, Number.NaN, 800)).toBe(0);
    expect(scrollDepth(Number.NaN)).toBe(0);
  });

  it("مكمَّمٌ بدرجته — بكسلٌ واحد لا يغيّر القيمة", () => {
    const a = scrollProgress(1000, 10800, 800);
    const b = scrollProgress(1001, 10800, 800);
    expect(a).toBe(b);
    expect(Math.abs(a / SCROLL_STEP - Math.round(a / SCROLL_STEP))).toBeLessThan(1e-6);
  });

  it("العمق بالبكسل: مكمَّمٌ، ولا سالب، وحدّه `SCROLL_Y_MAX`", () => {
    expect(scrollDepth(-40)).toBe(0);
    expect(scrollDepth(201)).toBe(200);
    expect(scrollDepth(203)).toBe(204);
    expect(scrollDepth(99999)).toBe(SCROLL_Y_MAX);
    expect(SCROLL_Y_MAX % SCROLL_Y_STEP).toBe(0);
  });
});

describe("الطوابع التي تقرأ الطبقة", () => {
  it("كلّها طوابع موجودة — والباقي لا يدفع ثمنها", () => {
    for (const s of MOTION_SKINS) expect(ALL_THEMES.some((t) => t.design.skin === s), s).toBe(true);
    expect(wantsMotion("gold")).toBe(false);
    expect(wantsMotion("store")).toBe(false);
  });

  it.each([...MOTION_SKINS])("«%s»: يقرأ التمرير والإضافة ودخول القسم — داخل `no-preference`", (skin) => {
    const css = skinFile(skin).replace(/\/\*[\s\S]*?\*\//g, "");
    const motion = css.split("@media (prefers-reduced-motion: no-preference)").slice(1).join("");
    expect(motion, "--m-scroll").toMatch(/var\(--m-scroll(-y)?\b/);
    expect(motion, "data-m-added").toContain("[data-m-added]");
    expect(motion, "data-m-in").toContain("[data-m-in]");
    // خارج الحركة لا يُقرأ شيءٌ منها: الشكل الساكن لا ينتظر إشارة.
    const still = css.split("@media (prefers-reduced-motion: no-preference)")[0];
    expect(still).not.toMatch(/--m-scroll|data-m-(added|in|scrolling|motion)/);
  });

  /**
   * ⚠️ المتغيّران لا يُكتبان على جذر المنيو: متغيّرٌ موروث يُكتب هناك في كلّ إطار
   * يُعيد حساب أنماط كلّ بطاقة — ٣٠ مهمّة طويلة حتى ٣٠٠ms في تمريرةٍ واحدة
   * (مراجعة الجودة ٢٠٢٦/١١/١٠). فلكلٍّ صاحبه: `--m-scroll` للشريط اللاصق،
   * و`--m-scroll-y` للترويسة. وقارئٌ في CSS من غير صاحبه **لا يتحرّك** — يسقط هنا.
   */
  it("لكلّ متغيّرٍ صاحبه: الشريط والترويسة لا جذر المنيو", () => {
    expect(SCROLL_READERS).toBe(".m-nav");
    expect(SCROLL_Y_READERS).toBe("header");
  });

  it.each([...MOTION_SKINS])("«%s»: `--m-scroll` يقرؤه الشريط وحده، و`--m-scroll-y` الترويسة وحدها", (skin) => {
    const css = skinFile(skin).replace(/\/\*[\s\S]*?\*\//g, "");
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selector = m[1].trim();
      const body = m[2];
      const readsP = /var\(--m-scroll[,)\s]/.test(body);
      const readsY = /var\(--m-scroll-y\b/.test(body);
      if (!readsP && !readsY) continue;
      const onNav = selector.split(",").every((sel) => sel.includes(".m-nav"));
      const offNav = selector.split(",").every((sel) => !sel.includes(".m-nav"));
      if (readsP) expect(onNav, `${skin}: «${selector}» يقرأ --m-scroll خارج الشريط`).toBe(true);
      if (readsY) expect(offNav, `${skin}: «${selector}» يقرأ --m-scroll-y في الشريط`).toBe(true);
    }
  });

  it("حركة الإضافة أقصر من عمر إشارتها", () => {
    for (const skin of MOTION_SKINS) {
      const css = skinFile(skin).replace(/\/\*[\s\S]*?\*\//g, "");
      const shorthands = [...css.matchAll(/\[data-m-added\][^{]*\{([^}]*)\}/g)].flatMap((m) =>
        [...m[1].matchAll(/animation:\s*([^;]+);/g)].map((a) => a[1])
      );
      expect(shorthands.length, skin).toBeGreaterThan(0);
      for (const a of shorthands) {
        // المدّة ثم التأخير — ولا تكرار بلا نهاية: الإشارة تسقط والحركة يجب أن تكون انتهت.
        const [dur = 0, delay = 0] = [...a.matchAll(/(\d*\.?\d+)s\b/g)].map((t) => Number(t[1]) * 1000);
        expect(a, skin).not.toContain("infinite");
        expect(dur + delay, `${skin}: ${a}`).toBeLessThanOrEqual(ADDED_MS);
      }
    }
  });
});

describe("الصفحة تربط الطبقة", () => {
  const page = readFileSync(fileURLToPath(new URL("../src/pages/MenuPage.tsx", import.meta.url)), "utf8");

  it("الخطّاف فوق العوائد المبكّرة، والإضافة من البطاقة والنافذة معاً", () => {
    const hook = page.indexOf("useSkinMotion(");
    const early = page.indexOf('if (state.status === "loading")');
    expect(hook).toBeGreaterThan(0);
    expect(hook).toBeLessThan(early);
    expect(page).toMatch(/skinMotion\.added\(from/);
    expect(page).toMatch(/cartWithSignal/);
  });
});

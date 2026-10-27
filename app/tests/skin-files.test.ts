/**
 * طوابع في ملفّاتها (`styles/skins/<id>.css`) — منذ «دكّان» و«عسير» (٢٠٢٦/١٠/٢٧).
 *
 * ثلاثة أعطال يمنعها هذا الملفّ، كلّها صامتة في الأنواع والبناء:
 *
 * ١. **ملفٌّ لا يُستورد**: البناء أخضر والطابع واجهة متجرٍ عارية. والأسوأ أن
 *    `@import` بعد أيّ قاعدةٍ في `menu-skins.css` **يُسقطه postcss بتحذير** ويخرج
 *    البناء بلا الملفّ (قيس ٢٧/١٠، والمهمّة طلبت وضعه في الذيل) — فالاستيراد في
 *    الرأس، قبل أوّل قاعدة.
 * ٢. **ترتيبٌ لا خصوصية**: الملفّ يسبق قواعد `menu-skins.css` كلّها، فقاعدةٌ فيه
 *    بخصوصية نظيرها العامّ **تخسر** أمامه. فكلّ انتقائيٍّ يبدأ بصنف خامته.
 * ٣. **حركةٌ خارج `no-preference`**، أو حركةٌ بالتمرير خارج `@supports`.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ALL_THEMES } from "@/lib/themes";
import { IMPORT_RE, skinFile, skinFileIds } from "./skin-css";

const MAIN = readFileSync(fileURLToPath(new URL("../src/styles/menu-skins.css", import.meta.url)), "utf8");
const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

/** مدى كلّ كتلةٍ متوازنة تبدأ عند `header` — [بدايتها، نهايتها]. */
function blocks(css: string, header: string): [number, number][] {
  const out: [number, number][] = [];
  for (let at = css.indexOf(header); at >= 0; at = css.indexOf(header, at + 1)) {
    let i = css.indexOf("{", at);
    let depth = 0;
    for (; i < css.length; i++) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}" && --depth === 0) break;
    }
    out.push([at, i + 1]);
  }
  return out;
}
const cut = (css: string, ranges: [number, number][]) =>
  ranges.reduceRight((s, [a, b]) => s.slice(0, a) + s.slice(b), css);

const ids = skinFileIds();

describe("ملفّات الخامات", () => {
  it("وجدنا ملفّات نفحصها", () => {
    // الفحص يثبت أنه وجد ما يفحصه قبل أن يحكم (الدرس ٤٧).
    expect(ids).toEqual(expect.arrayContaining(["dukkan", "asir"]));
  });

  it("كلّ ملفٍّ مستورَدٌ من `menu-skins.css` **قبل أوّل قاعدة**", () => {
    const head = strip(MAIN);
    const firstRule = head.search(/[^\s@][^{};]*\{/);
    const imported = [...head.matchAll(IMPORT_RE)];
    expect(imported.map((m) => m[1]).sort()).toEqual([...ids].sort());
    for (const m of imported) expect(m.index!, `${m[1]} بعد أوّل قاعدة`).toBeLessThan(firstRule);
  });

  it.each(ids)("`%s`: لطابعٍ موجود خامته بالاسم نفسه", (id) => {
    expect(ALL_THEMES.some((t) => t.design.skin === id)).toBe(true);
  });

  it.each(ids)("`%s`: كلّ انتقائيٍّ يبدأ بصنف خامته", (id) => {
    const css = strip(skinFile(id));
    const rules = cut(css, blocks(css, "@keyframes"));
    const selectors = [...rules.matchAll(/([^{};]+)\{/g)]
      .map((m) => m[1].trim())
      .filter((s) => !s.startsWith("@"));
    expect(selectors.length).toBeGreaterThan(10);
    for (const group of selectors) {
      for (const sel of group.split(",")) expect(sel.trim(), sel).toMatch(new RegExp(`^(\\[dir="ltr"\\])?\\.m-skin-${id}\\b`));
    }
  });

  it.each(ids)("`%s`: الحركة داخل `no-preference`، والمربوطة بالتمرير داخل `@supports` أيضاً", (id) => {
    const css = strip(skinFile(id));
    const noKeyframes = cut(css, blocks(css, "@keyframes"));
    const motion = blocks(noKeyframes, "@media (prefers-reduced-motion: no-preference)");
    expect(motion.length).toBeGreaterThan(0);
    // رأس `@supports (animation-timeline: …)` شرطٌ لا تصريح — يُطرح قبل البحث.
    const still = cut(noKeyframes, motion).replaceAll("@supports (animation-timeline: view())", "@supports");
    expect(still).not.toMatch(/\b(animation|transition)(-[a-z-]+)?\s*:/);
    // ‏`animation-timeline` لا يقع إلا داخل `@supports (animation-timeline: view())`.
    const supports = blocks(noKeyframes, "@supports (animation-timeline: view())");
    for (let at = noKeyframes.indexOf("animation-timeline:"); at >= 0; at = noKeyframes.indexOf("animation-timeline:", at + 1)) {
      expect(supports.some(([a, b]) => at > a && at < b), `animation-timeline خارج @supports في ${id}`).toBe(true);
    }
  });
});

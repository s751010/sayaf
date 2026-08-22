/**
 * حارس لوحتَي الثيم — `app/src/styles/global.css`.
 *
 * ═══ ⚠️ العطلان اللذان يمنعهما ═══
 *
 * **الأول: انقلاب الأساس بلا قصد.** الفاتح يعيش على `:root` والداكن على
 * `[data-theme="dark"]`. سطرٌ واحد يعيد القديم، ولا اختبار بصري يلتقطه لأن
 * الصفحتين سليمتان — إحداهما فقط ليست ما قرّره المالك.
 *
 * **والثاني — وهو الأخطر: تباينٌ يسقط بصمت.** الوضع الفاتح كان موجوداً منذ
 * البداية لكنه اختياري، فلم يُدقَّق قطّ. ولمّا صار أساساً ظهر أن ذهبه
 * `#a8821f` على ورقه `#faf6ee` تباينٌ **3.31:1** — وأن نصّ زرّ «ابدأ مجاناً»
 * نفسه **3.46:1**. أي أن أهمّ زرّ في المنتج كان تحت حدّ WCAG AA.
 *
 * ═══ لماذا السطح ليس الورق ═══
 *
 * نمط `bg-gold/10 text-gold` مستعمَل في عشرات المواضع: رقعةٌ صبغتها من اللون
 * نفسه. وهي تُعتِم الخلفية فتُنقص تباين النصّ الغامق عليها — فذهبٌ يعبر على
 * `--c-page` بـ4.51 يسقط على رقعته إلى 3.88. فالفحص يبني الرقعة من اللون
 * المفحوص لا من قيمة ثابتة.
 *
 * والقيم تُقرأ من ملفّ CSS نفسه لا تُعاد كتابتها هنا: نسخةٌ ثانية بيد كانت
 * ستمرّ وهي متباعدة — نفس درس `parity.test.ts`.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const CSS = readFileSync(
  fileURLToPath(new URL("../src/styles/global.css", import.meta.url)),
  "utf8",
);

type RGB = [number, number, number];

/** نسبة تباين WCAG — مكرّرة عمداً كي يفحص الاختبار النتيجة لا التنفيذ. */
function luminance([r, g, b]: RGB): number {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a: RGB, b: RGB): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function rgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** طبقة شفّافة فوق سطح — تُحاكي `bg-gold/10` وأخواتها. */
function tint(fg: RGB, alpha: number, bg: RGB): RGB {
  return [0, 1, 2].map((i) => fg[i] * alpha + bg[i] * (1 - alpha)) as RGB;
}

/**
 * يقرأ كتلة رموز من CSS. `selector` هو `:root` أو `[data-theme="dark"]`،
 * والقراءة تتوقّف عند أوّل `}` في عمود صفر — فالتعليقات الطويلة داخل الكتلة
 * لا تكسرها.
 */
function tokensOf(selector: string): Record<string, string> {
  const start = CSS.indexOf(`${selector} {`);
  expect(start, `لم تُوجد كتلة ${selector}`).toBeGreaterThan(-1);
  const end = CSS.indexOf("\n}", start);
  const block = CSS.slice(start, end);
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/^\s*(--c-[a-z0-9-]+):\s*([^;]+);/gim)) {
    out[m[1]] = m[2].trim();
  }
  return out;
}

const LIGHT = tokensOf(":root");
const DARK = tokensOf('[data-theme="dark"]');

describe("الأساس فاتح والداكن استثناء", () => {
  it("`:root` يحمل الورق الفاتح لا الأسود", () => {
    // ⚠️ الانقلاب يعيد المنتج كلّه إلى الداكن بسطر واحد.
    expect(LIGHT["--c-page"]).toBe("#faf6ee");
    expect(LIGHT["--c-ink"]).toBe("#241d12");
  });

  it("`[data-theme=\"dark\"]` هو الذي يحمل الأسود", () => {
    expect(DARK["--c-page"]).toBe("#0e0c09");
    expect(DARK["--c-ink"]).toBe("#f5efe3");
  });

  it("لا رمز في الفاتح إلا وله نظير في الداكن", () => {
    // رمزٌ يُضاف لأحدهما وحده يُورَث من الآخر بصمت فيخرج بلون خطأ.
    expect(Object.keys(DARK).sort()).toEqual(Object.keys(LIGHT).sort());
  });

  it("لا قاعدة `[data-theme=\"light\"]` باقية", () => {
    // الصيغة القديمة: بقاؤها يعني مساراً ميّتاً يُضلّل من يقرأ الملفّ.
    //
    // ⚠️ التعليقات تُنزع أوّلاً: أوّل صياغة لهذا الفحص سقطت على **تعليقٍ**
    // يشرح الصيغة القديمة، لا على قاعدة. فحصٌ يقرأ النثر يكذب مرّتين.
    const rules = CSS.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(rules).not.toContain('[data-theme="light"]');
  });
});

/**
 * الأسطح التي يقع عليها نصٌّ بلون التمييز فعلاً — والرقعة تُبنى من اللون
 * المفحوص نفسه لأنها صبغةٌ منه.
 */
function surfacesFor(color: RGB, t: Record<string, string>): [string, RGB][] {
  const page = rgb(t["--c-page"]);
  const panel = rgb(t["--c-panel"]);
  const panel2 = rgb(t["--c-panel2"]);
  return [
    ["page", page],
    ["panel", panel],
    ["panel2", panel2],
    ["رقعة 10% على page", tint(color, 0.1, page)],
    ["رقعة 12% على panel2", tint(color, 0.12, panel2)],
  ];
}

describe.each([
  ["الفاتح", LIGHT],
  ["الداكن", DARK],
])("تباين %s — WCAG AA", (_name, t) => {
  it.each(["--c-gold", "--c-good", "--c-bad"])(
    "%s يعبر 4.5:1 على كل سطح يقع عليه — الرقعة منها",
    (token) => {
      const color = rgb(t[token]);
      for (const [where, surface] of surfacesFor(color, t)) {
        expect(contrast(color, surface), `${token} على ${where}`).toBeGreaterThanOrEqual(4.5);
      }
    },
  );

  it("نصّ الزرّ الرئيسي على خلفيته الذهبية يعبر 4.5:1", () => {
    // ⚠️ هذا بالضبط ما كان مكسوراً: `--c-on-gold` على `--c-gold` = 3.46:1.
    expect(contrast(rgb(t["--c-on-gold"]), rgb(t["--c-gold"]))).toBeGreaterThanOrEqual(4.5);
  });

  it("نصّ الزرّ يبقى مقروءاً على لون التحويم أيضاً", () => {
    // `hover:bg-gold2` في أكثر من عشرين موضعاً — والتحويم لا يُفحص بصرياً.
    expect(contrast(rgb(t["--c-on-gold"]), rgb(t["--c-gold2"]))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(["--c-ink", "--c-dim"])("%s يعبر 4.5:1 على الورق واللوحة", (token) => {
    for (const bg of ["--c-page", "--c-panel"]) {
      expect(contrast(rgb(t[token]), rgb(t[bg])), `${token} على ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("`--c-gold2` مغايرٌ لـ`--c-gold` بما يُرى", () => {
    // متساويان ⇒ التدرّج يختفي والتحويم لا يُحسّ. لا حدّ WCAG هنا — حدّ إدراك.
    expect(contrast(rgb(t["--c-gold"]), rgb(t["--c-gold2"]))).toBeGreaterThan(1.15);
  });

  /**
   * ⚠️ `--c-faint` **دون AA في الوضعين** (≈3.6–3.8) — وهذا اختيار تدرّجٍ قائم
   * لا شيءٌ كسره قلبُ الأساس. رفعه إلى 4.5 يدهس الفرق بينه وبين `--c-dim`
   * فيضيع تدرّج ثلاثي كامل. الاختبار يحرس **ألّا يزداد سوءاً** بلا قرار.
   */
  it("`--c-faint` لا يهبط دون تعادُل الوضعين (3.5:1)", () => {
    expect(contrast(rgb(t["--c-faint"]), rgb(t["--c-page"]))).toBeGreaterThanOrEqual(3.5);
  });
});

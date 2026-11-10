/**
 * بنود «صغيرة» من تدقيق المنتج ٢٠٢٦/١١/٠٩ — كلٌّ بسطره كي لا يعود بصمت.
 * (ما يحتاج متصفّحاً — الحبس و«رجوع» وأهداف اللمس المقيسة — في e2e.)
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = (p: string) => readFileSync(resolve(__dirname, "../src", p), "utf8");

describe("السلّة: حقلا الاسم والجوال (البند ٧)", () => {
  const s = src("components/menu/CartReview.tsx");
  it("كلٌّ داخل `<label>` مرئي — لا placeholder وحده", () => {
    expect(s).toMatch(/<label[^>]*>\s*\{en \? "Your name" : "اسمك"\}\s*<input/);
    expect(s).toMatch(/<label[^>]*>\s*\{en \? "Mobile" : "جوالك"\}\s*<input/);
  });
  it("‏`autocomplete` و`inputmode`", () => {
    expect(s).toContain('autoComplete="name"');
    expect(s).toContain('autoComplete="tel"');
    expect(s).toContain('inputMode="tel"');
    expect(s).toContain('type="tel"');
  });
});

describe("لا ابتلاع صامت في مسارين يراهما المستخدم (البند ٣٣)", () => {
  it("‏`OrderAlerts`: فشل إشعار النظام يصير تنبيهاً داخل اللوحة", () => {
    const s = src("components/OrderAlerts.tsx");
    expect(s).not.toMatch(/\.catch\(\(\) => \{\}\)/);
    expect(s).toMatch(/\.catch\(\(\) => onFail\(title\)\)/);
  });
  it("‏`ActiveOrderStrip`: فشل الشبكة يُبقي الطريق إلى الطلب", () => {
    const s = src("components/menu/Cart.tsx");
    expect(s).not.toMatch(/\.catch\(\(\) => \{\}\)/);
    expect(s).toMatch(/setOrder\(\{ id, view: null \}\)/);
  });
});

describe("أزرار الحفظ: نمطٌ واحد (البند ٦)", () => {
  it("‏`<Button busy>`: معطّل و`aria-busy` و«يحفظ…»", async () => {
    const { createElement } = await import("react");
    const { renderToStaticMarkup } = await import("react-dom/server");
    const { Button } = await import("@/components/ui");
    const html = renderToStaticMarkup(createElement(Button, { busy: true }, "حفظ"));
    expect(html).toMatch(/\sdisabled=""/);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("يحفظ…");
    expect(html).not.toContain(">حفظ<");
    const idle = renderToStaticMarkup(createElement(Button, { busy: false }, "حفظ"));
    expect(idle).not.toMatch(/\sdisabled=""/);
    expect(idle).not.toContain("aria-busy");
  });

  it("لا زرّ يكتب «جارٍ الحفظ…» بيده — كلّها تمرّ بـ`busy`", async () => {
    const { readdirSync, statSync } = await import("node:fs");
    const { join } = await import("node:path");
    const walk = (d: string): string[] =>
      readdirSync(d).flatMap((n) => {
        const p = join(d, n);
        return statSync(p).isDirectory() ? walk(p) : p.endsWith(".tsx") ? [p] : [];
      });
    const offenders = [...walk(resolve(__dirname, "../src/pages/dashboard")), ...walk(resolve(__dirname, "../src/components"))]
      .filter((f) => /\? "جارٍ الحفظ…"/.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
});

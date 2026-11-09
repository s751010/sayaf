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

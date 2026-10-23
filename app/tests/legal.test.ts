/**
 * النصوص النظامية والبحث العربي — ما يُسأل عنه البائع لا الشيفرة.
 *
 * كل فحص هنا يحرس جملةً قيلت للزبون أو التاجر: خصمٌ موصوفٌ بغير حقيقته، أو
 * ضريبةٌ تُدّعى بلا رقم ضريبي، أو بكسلٌ يُحمَّل قبل أن يُسأل الزبون.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LEGAL, SUBSCRIPTION_TAX_NOTE, VAT_REGISTERED, isVatNumber, yearlyDiscountPct } from "@/lib/legal";
import { PLANS } from "@/lib/plans";
import { normalizeAr } from "@/lib/arabic";
import { categoryLabel } from "@/lib/categories";
import { hasPixels } from "@/lib/pixels";
import { RESERVED } from "@/lib/menuUrl";

const src = (p: string) => readFileSync(new URL(`../src/${p}`, import.meta.url), "utf8");

describe("الضريبة على الاشتراك", () => {
  it("لا ادّعاء ضريبة بلا رقم ضريبي صالح", () => {
    expect(VAT_REGISTERED).toBe(isVatNumber(LEGAL.vat));
    if (!VAT_REGISTERED) expect(SUBSCRIPTION_TAX_NOTE).toContain("غير مسجّلة");
  });

  it("شكل الرقم الضريبي: ١٥ رقماً تبدأ وتنتهي بـ3", () => {
    expect(isVatNumber("300000000000003")).toBe(true);
    expect(isVatNumber("30000000000000")).toBe(false);
    expect(isVatNumber("100000000000003")).toBe(false);
    expect(isVatNumber(null)).toBe(false);
  });

  it("لا وعد بفاتورة ضريبية ولا «شامل الضريبة» مكتوباً بيد في صفحات البيع", () => {
    for (const f of ["pages/Help.tsx", "pages/Legal.tsx", "pages/dashboard/Billing.tsx"]) {
      const s = src(f);
      expect(s, f).not.toMatch(/ونصدرها لك|شامل ضريبة القيمة المضافة\.|حيثما تنطبق/);
    }
  });
});

describe("«شامل الضريبة» لا يُقال بلا رقم ضريبي", () => {
  it("المنيو والسلّة والمطبوع يشترطون رقماً ضريبياً صالحاً", () => {
    for (const f of ["pages/MenuPage.tsx", "components/menu/CartReview.tsx", "pages/dashboard/PrintMenu.tsx"]) {
      expect(src(f), f).toContain("isVatNumber(");
    }
  });

  it("الإعدادات لا تحفظ «غير شاملة» بلا رقم ضريبي — فهي تُضيف ١٥٪ على الزبون", () => {
    expect(src("pages/dashboard/Settings.tsx")).toMatch(/blocked=\{!f\.prices_include_vat && !isVatNumber\(f\.vat_number\)\}/);
  });
});

describe("خصم السنوي", () => {
  it("محسوب من السعرين — ٥٩٩ مقابل ١١٨٨ ≈ ٥٠٪", () => {
    const p = PLANS[0]!;
    expect(yearlyDiscountPct(p)).toBe(Math.round((1 - p.yearly / (p.monthly * 12)) * 100));
  });

  it("لا «شهر مجاني» ولا «بسعر ١١ شهراً» — الخصم الحقيقي أكبر بكثير", () => {
    for (const f of ["pages/Help.tsx", "pages/Legal.tsx", "pages/dashboard/Billing.tsx"]) {
      expect(src(f), f).not.toMatch(/شهر مجاني|بسعر ١١ شهراً/);
    }
  });
});

describe("العلم الوطني", () => {
  it("لا علم سعودي زينةً في المنتج — نظام العلم يمنعه", () => {
    for (const f of ["components/site.tsx", "lib/seasons.ts"]) {
      expect(src(f), f).not.toContain("🇸🇦");
    }
  });
});

describe("الموافقة قبل البكسل", () => {
  it("لا بكسل صالح ⇒ لا سؤال", () => {
    expect(hasPixels({ meta: null, ga: null, snap: null })).toBe(false);
    expect(hasPixels({ meta: "abc", ga: null, snap: null })).toBe(false);
    expect(hasPixels({ meta: "1234567890", ga: null, snap: null })).toBe(true);
  });

  it("المنيو لا يحقن البكسل إلا بعد «موافق»", () => {
    const s = src("pages/MenuPage.tsx");
    expect(s).toMatch(/pixelConsent !== "yes"[^\n]*\) return;\s*installPixels/);
  });
});

describe("البحث العربي", () => {
  it.each([
    ["قهوه", "قهوة سعودية"],
    ["كبسه", "كبسة لحم"],
    ["حمص", "حمّص بالطحينة"],
    ["اسباجيتي", "إسباجيتي"],
    ["حلوي", "حلوى"],
  ])("«%s» يجد «%s»", (q, name) => {
    expect(normalizeAr(name).includes(normalizeAr(q))).toBe(true);
  });
});

describe("التصنيف بلغة الزبون", () => {
  it("المعروف يُترجَم، والمجهول يبقى كما كتبه التاجر، والعربية لا تُمسّ", () => {
    expect(categoryLabel("المقبلات", true)).toBe("Appetizers");
    expect(categoryLabel("مقبلات", true)).toBe("Appetizers");
    expect(categoryLabel("أطباق الجدّة", true)).toBe("أطباق الجدّة");
    expect(categoryLabel("مقبلات", false)).toBe("مقبلات");
  });
});

describe("الروابط المخمَّنة", () => {
  it("محجوزة كي لا يأخذها تاجر، ومحوَّلة في _redirects قبل التطبيق", () => {
    const redirects = readFileSync(new URL("../public/_redirects", import.meta.url), "utf8");
    for (const p of ["pricing", "contact", "faq"]) {
      expect(RESERVED.has(p)).toBe(true);
      expect(redirects.indexOf(`/${p} `)).toBeGreaterThan(-1);
      expect(redirects.indexOf(`/${p} `)).toBeLessThan(redirects.indexOf("/*"));
    }
  });
});

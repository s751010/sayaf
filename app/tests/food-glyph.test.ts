/**
 * رمز الطبق من اسمه (`lib/foodGlyph.ts`) — تدقيق ٢٠٢٦/١١/٠٧.
 *
 * كان ثلث أطباق المنيوهات التجريبية وعناوين أقسامها بالصحن العامّ. هذه الحالات
 * من تلك المنيوهات نفسها، وترتيب الجدول فيها منطق: الطعام قبل الشراب، والطبق
 * قبل لحمه، والبارد قبل الساخن.
 */
import { describe, expect, it } from "vitest";
import { guessGlyph } from "../src/lib/foodGlyph";
import { categoryIcon, canonOf } from "../src/lib/categories";

describe("guessGlyph — اسم الطبق", () => {
  it.each([
    ["فول بالسمن", "pot"],
    ["شاي حليب", "istikana"],
    ["لبن", "bottle"],
    ["رمان طازج", "juice"],
    ["أفوكادو بالعسل", "juice"],
    ["تشيز كيك التوت", "cake"],
    ["حليب بالزعفران", "bottle"],
    ["آيس لاتيه", "icedcup"],
    ["سبانش لاتيه", "cup"],
    ["قهوة سعودية بالهيل", "dallah"],
    ["V60 — محصول اليوم", "cup"],
    ["سمك سلمون بالليمون", "fish"],
    ["سلطعون بالبهارات", "fish"],
    ["مندي دجاج", "kabsa"],
    ["ساندويتش دجاج سبايسي", "sandwich"],
    ["تندر دجاج — ٥ قطع", "fries"],
    ["برجر دجاج مقرمش", "burger"],
    ["هامور مشوي — كيلو", "fish"],
    ["ستيك واقيو مشوي", "skewer"],
    ["شوربة سمك", "soup"],
    ["سلطة الحمّص بالطحينة", "salad"],
    // ٠٧/١١: منيو «فرن» و«فوّال».
    ["مطبّق جبن", "croissant"],
    ["مطبّق لحم", "croissant"],
    ["شريك بالسمسم", "bread"],
    // ٠٧/١١: منيو «جمر» و«ريحان».
    ["دجاج مشوي على الفحم", "skewer"],
    ["شيش طاووق", "skewer"],
    ["صحن شاورما عربي", "sandwich"],
    ["فيتوتشيني ألفريدو بالدجاج", "pizza"],
    ["لازانيا لحم", "pizza"],
    ["بيتزا دجاج بيستو", "pizza"],
  ] as const)("«%s» ⇐ %s", (name, icon) => {
    expect(guessGlyph(name)).toBe(icon);
  });

  it("لا يخمّن ما لا يعرفه — يسقط إلى ما بعده", () => {
    expect(guessGlyph("تمر مع جبن قشقوان")).toBeNull();
    expect(guessGlyph("")).toBeNull();
    expect(guessGlyph(null)).toBeNull();
  });

  it("المفتاح القصير لا يطابق بالبدء: «لبنة» مقبّلات لا «لبن»", () => {
    expect(guessGlyph("لبنة بالزيت")).toBe("mezze");
  });
});

describe("categoryIcon — القاموس أولاً، ثم الكلمة", () => {
  it.each([
    ["عصير طازج", "juice"],
    ["تقطير", "cup"],
    ["القشريات", "fish"],
    ["الأرز", "kabsa"],
    ["المندي والمظبي", "kabsa"],
    ["الإيدامات", "pot"],
    ["الدجاج", "fries"],
    ["الحلويات الشرقية", "cake"],
    ["المطبّق", "croissant"],
    ["من الفرن", "bread"],
    ["إسبريسو وحليب", "cup"],
  ] as const)("«%s» ⇐ %s", (cat, icon) => {
    expect(categoryIcon(cat)).toBe(icon);
  });

  it("التخمين للرمز وحده: لا يجعل الاسم تصنيفاً قانونياً (فلا يمسّ الترتيب)", () => {
    expect(canonOf("عصير طازج")).toBeNull();
    expect(canonOf("القشريات")).toBeNull();
  });

  it("المعروف في القاموس يبقى رمزه", () => {
    expect(categoryIcon("المشروبات")).toBe("bottle");
    expect(categoryIcon("المقبلات")).toBe("mezze");
  });

  it("المجهول تماماً صحنٌ عامّ", () => {
    expect(categoryIcon("أصناف الشيف")).toBe("plate");
  });
});

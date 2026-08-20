/**
 * حارس تباين كود QR.
 *
 * ⚠️ العطل الذي يمنعه: تاجر يختار ذهبياً فاتحاً، فيخرج كود أنيق على الشاشة
 * **لا يُمسح** — ويكتشفه بعد أن يطبع خمسين بطاقة ويضعها على الطاولات. وهذا
 * عطل لا يظهر في أي فحص بصري، لأن الكود يبدو سليماً تماماً.
 */
import { describe, expect, it } from "vitest";
import { qrSafeColor } from "../src/lib/themes";

/** نسبة تباين WCAG — مكرّرة هنا عمداً كي يفحص الاختبار النتيجة لا التنفيذ. */
function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    const srgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("qrSafeColor", () => {
  const LIGHT_BRANDS = [
    "#d4a843", // الذهبي الافتراضي للمنصّة
    "#ffd700", // ذهبي صريح
    "#f5e663", // ليموني
    "#e07a5f", // مرجاني (نفس اللون الذي كسر bestOnAccent سابقاً)
    "#9ccc65", // أخضر فاتح
    "#ffffff", // أبيض — الحالة القصوى
  ];

  it.each(LIGHT_BRANDS)("يرفع %s إلى تباين يمسحه القارئ", (brand) => {
    const safe = qrSafeColor(brand);
    expect(contrast(safe, "#ffffff")).toBeGreaterThanOrEqual(7);
  });

  it("يترك اللون الغامق كما هو تقريباً — الهوية تبقى ما دامت آمنة", () => {
    const navy = "#0b1f3a";
    expect(contrast(qrSafeColor(navy), "#ffffff")).toBeGreaterThanOrEqual(7);
    // غامقٌ أصلاً ⇒ لا يُغمَّق أكثر فيفقد لونه.
    expect(qrSafeColor(navy).toLowerCase()).toBe(navy);
  });

  it("يسقط إلى الغامق الافتراضي عند قيمة غير صالحة", () => {
    expect(qrSafeColor("ليس لوناً")).toBe("#141210");
    expect(qrSafeColor("#fff")).toBe("#141210");
  });
});

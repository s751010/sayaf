/**
 * ضريبة القيمة المضافة على الطلب — **نسخة الخادم**، ونظيرتها `app/src/lib/vat.ts`
 * (`parity.test.ts` يحرس تطابقهما).
 *
 * ═══ العطل ═══
 *
 * التاجر الذي أسعاره **غير شاملة** يرى في ذيل منيوه «تُضاف 15% عند الدفع»، لكن
 * `paylink-order-create` كانت تحصّل الإجمالي الفرعي وحده (`p_total: amount`).
 * أي أن المنيو يَعِد بضريبة لا تُحصَّل — والتاجر يدفعها للهيئة من جيبه.
 *
 * والشاملة لا يتغيّر فيها شيء: الضريبة داخل السعر، والإجمالي هو المجموع.
 */
export const VAT_RATE = 0.15;

/** الرقم الضريبي صالح الشكل: ١٥ رقماً تبدأ وتنتهي بـ3 (صيغة الهيئة). */
export const isVatNumber = (v: string | null | undefined): boolean =>
  !!v && /^3\d{13}3$/.test(v.trim());

/**
 * هل تُضاف ١٥٪ فوق أسعار هذا المطعم؟ **«غير شامل» ورقمٌ ضريبي صالح معاً** —
 * وإلا فلا ضريبة تُضاف (أمن ٢٠٢٦/١١/٠٩، البند ١؛ قرار المالك).
 *
 * الواجهة كانت تمنع «غير شامل» بلا رقم، لكن الخادم لم يكن يفحص: طلب PATCH
 * مباشر من التاجر يضبطه، فيُحصَّل من كل زبون ١٥٪ باسم ضريبةٍ غير مسجّلة.
 * والطلب **لا يُرفض** — لا نُطفئ طلبات مطعمٍ عامل؛ يمرّ بلا إضافة.
 * نسختان متطابقتان: هنا وفي النظير (`parity.test.ts`).
 */
export function chargesVatOnTop(
  pricesIncludeVat: boolean | null | undefined,
  vatNumber: string | null | undefined
): boolean {
  return pricesIncludeVat === false && isVatNumber(vatNumber);
}

/**
 * الحساب **بالهللة** لا بالريال: `1.5 × 0.15` في الفاصلة العائمة 0.22499999…
 * فيُقرَّب إلى 0.22 والصحيح 0.23 — هللةٌ تنحرف في نحو ١٫٣٪ من المبالغ. والضرب
 * في عددٍ صحيح من الهللات لا يقع في هذا، والنصف يُقرَّب إلى الأعلى.
 */
const PCT = Math.round(VAT_RATE * 100);
const toHalalas = (n: number) => Math.round(n * 100);

export function orderTotals(
  subtotal: number,
  pricesIncludeVat: boolean
): { subtotal: number; vat: number; total: number } {
  const s = toHalalas(subtotal);
  if (pricesIncludeVat) {
    const net = Math.round((s * 100) / (100 + PCT));
    return { subtotal: s / 100, vat: (s - net) / 100, total: s / 100 };
  }
  const vat = Math.round((s * PCT) / 100);
  return { subtotal: s / 100, vat: vat / 100, total: (s + vat) / 100 };
}

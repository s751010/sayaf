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

const round2 = (n: number) => Math.round(n * 100) / 100;

export function orderTotals(
  subtotal: number,
  pricesIncludeVat: boolean
): { subtotal: number; vat: number; total: number } {
  const s = round2(subtotal);
  if (pricesIncludeVat) return { subtotal: s, vat: round2(s - s / (1 + VAT_RATE)), total: s };
  const vat = round2(s * VAT_RATE);
  return { subtotal: s, vat, total: round2(s + vat) };
}

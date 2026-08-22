/**
 * مقارنة نصّين بزمن ثابت.
 *
 * ═══ ⚠️ لماذا مشتركة ═══
 *
 * كانت **ثلاث نسخ متطابقة** بيد في `founder-admin` و`billing-admin` و
 * `webhook-dispatch` (باسم `sameSecret` في الأخيرة) — و`moyasar-webhook`
 * وحدها كانت تقارن سرّها بـ`!==` العادية. أي أن المعيار كان أربعة معايير.
 *
 * `!==` تخرج عند أول محرف مختلف، فزمن الردّ يسرّب طول البادئة الصحيحة.
 * الفرق مقيسٌ بالنانوثانية ولا يُستغلّ عبر الشبكة عملياً — لكن ثمن الصواب
 * هنا ستّة أسطر، وثمن الخطأ أن يصير «أحياناً» عادةً.
 */
export function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

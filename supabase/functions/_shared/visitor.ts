/**
 * مفتاح الزائر لحدّ المعدّل — **هاشٌ لا عنوان** (أمن ٢٠٢٦/١١/٠٩، البندان ٢ و٥؛
 * قرار المالك).
 *
 * ═══ لماذا ═══
 *
 * حدّ `paylink-order-create` كان **للمطعم وحده** (٣٠/دقيقة): سكربتٌ واحد يملأ
 * السقف فيُردّ كل زبونٍ حقيقي طوال الهجوم. و`order-verify` بلا حدّ أصلاً، وكل
 * نداءٍ فيها يسأل PayLink بمفاتيح التاجر. فحدٌّ ثانٍ للزائر **فوق** حدّ المطعم.
 *
 * ═══ ما يُخزَّن ═══
 *
 * لا العنوان: SHA-256 لـ`pepper:scope:ip` مقصوصاً إلى uuid (مفتاح
 * `abuse_rate_hit`). والـpepper سرٌّ من بيئة الدالّة — فضاء IPv4 صغير، وهاشٌ
 * بلا سرّ يُعكَس بالتجربة. وبلا عنوانٍ مقروء يُرجَع `null`، و`abuse_rate_hit`
 * تمرّر `null` (لا نُطفئ طلب زبونٍ لأن وسيطاً حذف ترويسة).
 *
 * ⚠️ الترويسة تُزوَّر من العميل؛ لكن بوّابة Supabase تضع عنوان الاتّصال الحقيقي
 * **أوّلاً**، فالقيمة الأولى هي ما نثق به. والمزوِّر يكسب مفتاحاً جديداً لكل
 * طلب — ويبقى حدّ المطعم تحته، فلا يعود الوضع أسوأ مما كان.
 *
 * خالصة بلا Deno — يقرؤها `app/tests/visitor-key.test.ts`.
 */

/** أوّل عنوانٍ في `x-forwarded-for` (أو `x-real-ip`) — أو `null`. */
export function clientIp(headers: { get(name: string): string | null }): string | null {
  const first = (headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim();
  const ip = first || (headers.get("x-real-ip") ?? "").trim();
  return ip && ip.length <= 64 ? ip : null;
}

/** أوّل ١٦ بايتاً من الهاش بصيغة uuid (الإصدار ٤ شكلاً — لا معنى له غير الشكل). */
export function uuidFromBytes(bytes: Uint8Array): string {
  const b = Array.from(bytes.slice(0, 16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = b.map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

/** مفتاح الزائر في نطاقٍ (`orders_visitor` · `verify_visitor`) — أو `null` بلا عنوان. */
export async function visitorKey(
  ip: string | null,
  scope: string,
  pepper: string
): Promise<string | null> {
  if (!ip) return null;
  const data = new TextEncoder().encode(`${pepper}:${scope}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return uuidFromBytes(new Uint8Array(digest));
}

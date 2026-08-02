/**
 * توليد مفاتيح API — **في المتصفح، لا على الخادم**.
 *
 * السرّ يُولَّد هنا ويُعرض للتاجر مرة واحدة، ولا يُرسَل إلى قاعدة البيانات إلا
 * مُجزَّأً. فلا يمرّ بخادمنا ولا يُسجَّل في أي log ولا يظهر في أي نسخة احتياطية.
 * هذا أقوى من نمط رمز الكاشير القائم (§8) الذي يُرسل الرمز ليُجزَّأ في القاعدة.
 *
 * **SHA-256 لا bcrypt، عن قصد.** bcrypt بطيء بتصميمه ليقاوم تخمين أسرار منخفضة
 * الإنتروبيا (رمز الكاشير: ستة أرقام = مليون احتمال). ومفتاح من ٣٢ محرفاً من
 * أبجدية ٦٢ رمزاً يحمل ~١٩٠ بت — لا يُخمَّن مهما بلغت سرعة الهاش، فبطء bcrypt
 * هنا ضريبة على **كل نداء API** بلا مقابل أمني.
 */

/** بلا `O`/`0`/`l`/`I`: التاجر ينسخ المفتاح يدوياً أحياناً. */
const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const SECRET_LENGTH = 32;
export const KEY_PREFIX = "cm_live_";

/** طول البادئة المخزَّنة للعرض — تكفي للتمييز ولا تكشف شيئاً مفيداً. */
const PREFIX_LENGTH = KEY_PREFIX.length + 8;

/**
 * `crypto.getRandomValues` لا `Math.random`: الثاني مولّد شبه عشوائي قابل
 * للتنبّؤ من مخرجاته، ولا يصلح لسرّ إطلاقاً.
 *
 * التوزيع منتظم بالرفض (`rejection sampling`): أخذ `byte % 57` كان سيجعل أوّل
 * ٢٦ رمزاً أكثر احتمالاً من الباقي (256 لا تقبل القسمة على 57).
 */
export function generateApiKey(): string {
  const max = Math.floor(256 / ALPHABET.length) * ALPHABET.length;
  let out = "";
  const buf = new Uint8Array(SECRET_LENGTH * 2);
  while (out.length < SECRET_LENGTH) {
    crypto.getRandomValues(buf);
    for (const b of buf) {
      if (b >= max) continue;
      out += ALPHABET[b % ALPHABET.length];
      if (out.length === SECRET_LENGTH) break;
    }
  }
  return KEY_PREFIX + out;
}

export async function hashApiKey(key: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function prefixOf(key: string): string {
  return key.slice(0, PREFIX_LENGTH);
}

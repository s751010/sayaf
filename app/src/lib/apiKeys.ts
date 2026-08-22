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
/**
 * نصّ عشوائي من أبجدية، **بتوزيع منتظم**.
 *
 * ⚠️ مُصدَّرة ليستعملها مولّد رمز الكاشير وبطاقة الولاء (`lib/data.ts`)
 * أيضاً: كانا يأخذان `byte % 31` مباشرةً، و٢٥٦ لا تقبل القسمة على ٣١ —
 * فأوّل ثمانية رموز أكثر احتمالاً من الباقي. الفرق ضئيل (ينقص الإنتروبيا
 * أجزاءً من البت) لكنه **معياران في ملفّين**: هذا الملفّ يفعلها صواباً
 * ويشرح لماذا، وذاك يفعلها خطأً. نسخة واحدة تُنهي السؤال.
 */
export function randomFrom(alphabet: string, length: number): string {
  const max = Math.floor(256 / alphabet.length) * alphabet.length;
  let out = "";
  const buf = new Uint8Array(length * 2);
  while (out.length < length) {
    crypto.getRandomValues(buf);
    for (const b of buf) {
      if (b >= max) continue;   // الرفض: هو ما يجعل التوزيع منتظماً
      out += alphabet[b % alphabet.length];
      if (out.length === length) break;
    }
  }
  return out;
}

export function generateApiKey(): string {
  return KEY_PREFIX + randomFrom(ALPHABET, SECRET_LENGTH);
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

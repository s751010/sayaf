/**
 * حارس الروابط الصادرة — SSRF.
 *
 * ═══ ⚠️ العطل الذي سدّه ═══
 *
 * `webhook-dispatch` ينادي `fetch(h.url)` **برابط يكتبه التاجر**. وكان القيد
 * الوحيد `^https://` — وهو يمرّ:
 *
 *   https://127.0.0.1:8000/…          خدمات محلّية على مضيف التشغيل
 *   https://169.254.169.254/…         بيانات السحابة الوصفية (أشهر هدف SSRF)
 *   https://10.0.0.5/…                شبكة داخلية
 *   https://metadata.google.internal  اسمٌ لا عنوان
 *
 * والدالة تعمل بمفتاح الخدمة داخل شبكة المزوّد، فما تصل إليه ليس ما يصل إليه
 * زائر من الإنترنت. والردّ لا يعود للتاجر — لكن **نصّ الخطأ كان يعود**
 * (`last_error` في لوحته)، وفرقُ «رُفض الاتصال» عن «انتهت المهلة» عن «فشل
 * TLS» **عرّافٌ يمسح به المنافذ الداخلية** طلباً بعد طلب.
 *
 * ═══ ما لا يفعله هذا الحارس ═══
 *
 * لا يمنع **إعادة ربط DNS**: اسمٌ عامّ يُحلّ إلى عنوان داخلي بعد الفحص. سدّه
 * يحتاج تثبيت العنوان بين الفحص والاتصال، وهو غير متاح في `fetch` الحالية.
 * الحارس يرفع الكلفة من «اكتب عنواناً» إلى «شغّل نطاقاً وخادم DNS» — وهذا
 * ما يمكن بلوغه هنا، ويُقال صراحةً بدل أن يُوهم بأمان تامّ.
 */

/** أسباب الرفض — تُسجَّل كصنف لا كنصّ حرّ (انظر أعلاه: العرّاف). */
export type UrlRejection =
  | "not_https"
  | "bad_port"
  | "ip_literal"
  | "internal_host"
  | "malformed";

const INTERNAL_SUFFIXES = [".local", ".internal", ".localdomain", ".home.arpa"];
const INTERNAL_NAMES = new Set(["localhost", "metadata.google.internal", "metadata"]);

/** `1.2.3.4` — الأربع خانات، لا مجرّد «فيه أرقام ونقاط». */
const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

/**
 * `null` إن كان الرابط صالحاً للإرسال، وإلا **صنف** الرفض.
 *
 * ⚠️ يُرفض كل عنوان IP حرفي — لا الخاصّة وحدها. الوجهة المشروعة اسمُ نطاق:
 * تاجرٌ يضع عنواناً عارياً إمّا مخطئ أو يحاول شيئاً، وكلاهما لا يُرسَل إليه.
 */
export function checkWebhookUrl(raw: string): UrlRejection | null {
  let u: URL;
  try {
    u = new URL(String(raw ?? "").trim());
  } catch {
    return "malformed";
  }

  if (u.protocol !== "https:") return "not_https";
  // منفذ غير 443 يعني خدمة غير قياسية — وهو شكل مسح المنافذ نفسه.
  if (u.port && u.port !== "443") return "bad_port";

  const host = u.hostname.toLowerCase();

  // IPv6 يصل داخل أقواس، فـ`hostname` يعيده بلا أقواس ولكن بنقطتين.
  if (IPV4.test(host) || host.includes(":")) return "ip_literal";

  if (INTERNAL_NAMES.has(host)) return "internal_host";
  if (INTERNAL_SUFFIXES.some((s) => host.endsWith(s))) return "internal_host";
  // اسمٌ بلا نقطة ليس نطاقاً عامّاً (`intranet` · `db` داخل شبكة الحاويات).
  if (!host.includes(".")) return "internal_host";

  return null;
}

/**
 * تصنيف فشل الاتصال — **ما يُكتب في `last_error` الذي يراه التاجر**.
 *
 * النصّ الخام كان يعود كما هو، وهو يميّز «رُفض الاتصال» من «انتهت المهلة» من
 * «فشل TLS» — أي يجيب عن «هل المنفذ مفتوح؟». والصنف يكفي التاجر ليعرف أن
 * وجهته لا تستجيب، ولا يكفي لرسم شبكةٍ ليست له.
 */
export function classifyFetchError(err: unknown): string {
  const m = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (m.includes("abort") || m.includes("timed out") || m.includes("timeout")) return "timeout";
  if (m.includes("dns") || m.includes("name not resolved") || m.includes("getaddrinfo")) return "dns";
  if (m.includes("certificate") || m.includes("tls") || m.includes("ssl")) return "tls";
  return "unreachable";
}

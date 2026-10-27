/**
 * قراءة المنيو من صورة — ما يُقرَّر **قبل** النداء وبعد فشله (دوالّ خالصة).
 *
 * `menu-scan` نداءٌ مدفوع: كل صورة تمرّ على نموذجٍ يُحاسَب عليه المالك، وحدّ
 * الحساب (٤٠/ساعة) والمطعم (٢٠/ساعة) في الخادم. وهنا ما يخصّ المتصفّح:
 *
 * - `imageKey`: بصمة الصورة — الصورة نفسها لا تُقرأ مرّتين في الجلسة.
 * - `scanFailure`: الفشل جملةٌ عربية، ومعه قرار «أعد المحاولة» أم «صورة أخرى».
 */

/** ما يكفي من الملفّ لتمييزه بلا قراءة محتواه (القراءة تكلّف على الجوال). */
export type ImageLike = { name: string; size: number; lastModified: number; type: string };

/**
 * بصمة الصورة: الاسم والحجم وتاريخ التعديل والنوع.
 *
 * ليست تجزئة محتوى — ولا تحتاجها: الخطر الذي تحرسه أن يختار التاجر **الملفّ
 * نفسه** ثانيةً (رجع خطوة، أو ضغط مرّتين)، وذاك يطابق الأربعة حرفياً. وصورتان
 * مختلفتان بالأربعة نفسها لا تقعان عملياً، وأسوأ ما فيهما حصيلةٌ يراجعها
 * التاجر قبل الحفظ.
 */
export function imageKey(f: ImageLike): string {
  return [f.name, f.size, f.lastModified, f.type].join("|");
}

export interface ScanFailure {
  /** ما يُعرض للتاجر — عربيٌّ دائماً. */
  message: string;
  /** يظهر زرّ «أعد المحاولة بالصورة نفسها»؟ */
  retry: boolean;
}

const ARABIC = /[؀-ۿ]/;

export const SCAN_OFFLINE = "انقطع الاتصال قبل أن نقرأ الصورة. تحقّق من الشبكة وأعد المحاولة — صورتك ما زالت هنا.";
export const SCAN_BUSY = "خدمة القراءة مشغولة الآن. أعد المحاولة بعد لحظة.";
export const SCAN_FAILED = "تعذّرت القراءة. جرّب صورة أوضح بإضاءة جيدة وبلا انعكاس.";

/**
 * يحوّل الخطأ إلى ما يراه التاجر.
 *
 * ⚠️ كان النصّ يُعرض كما هو: فشل الشبكة يرمي `TypeError: Failed to fetch`،
 * فيقرأ التاجر **«Failed to fetch»** إنجليزيةً تحت صورته، ولا زرّ إلا «اختر
 * صورة» من جديد. والقاعدة: الفشل ليس فراغاً ولا رمزاً تقنياً (الدرس ٣٢).
 *
 * - **الشبكة أو الخادم** (٥xx · ٤٠٨): عابر ⇒ «أعد المحاولة» بالصورة نفسها.
 * - **٤٢٩**: الحدّ في الخادم بلغ سقفه ⇒ رسالته، **بلا** زرّ إعادة — الضغط
 *   عليه لا يفعل إلا أن يرتطم بالحدّ ثانيةً.
 * - **٤xx غيره** (صورة مرفوضة، جلسة): الإعادة بالصورة نفسها لا تُصلحه.
 */
export function scanFailure(e: unknown): ScanFailure {
  const status =
    e && typeof e === "object" && "status" in e && typeof (e as { status: unknown }).status === "number"
      ? (e as { status: number }).status
      : null;
  const raw = e instanceof Error ? e.message.trim() : "";
  const arabic = raw && ARABIC.test(raw) ? raw : null;

  // `fetch` نفسه يرمي `TypeError` حين لا يصل الطلب (لا شبكة · حجب · مهلة).
  if (status === null && e instanceof TypeError) return { message: SCAN_OFFLINE, retry: true };
  if (status === 429) return { message: arabic ?? "جرّبت كثيراً خلال ساعة. انتظر قليلاً.", retry: false };
  if (status !== null && (status >= 500 || status === 408)) {
    return { message: arabic ?? SCAN_BUSY, retry: true };
  }
  return { message: arabic ?? SCAN_FAILED, retry: false };
}

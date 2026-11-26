/**
 * بعد كل نشر: قطعةٌ قديمة لم تعد موجودة ⇐ تحديثٌ واحد للصفحة، لا شاشة خطأ.
 *
 * ═══ العطل (مسجَّل في `client_errors`) ═══
 *
 * التاجر يفتح لوحته، ثم يُنشر إصدارٌ جديد، ثم يضغط قسماً لم يُحمَّل بعد
 * (`lazy`). المتصفّح يطلب القطعة بالاسم المُهشَّر **القديم**، و`_redirects`
 * يعيد عليه `index.html` بحالة ٢٠٠ ⇐ «'text/html' is not a valid JavaScript
 * MIME type» ⇐ `ErrorBoundary` ⇐ «حدث خطأ غير متوقع». كل نشرٍ كان يضرب كل
 * تبويبٍ مفتوح.
 *
 * والعلاج: أعد تحميل الصفحة **مرّة** — التنقّل شبكةٌ أوّلاً في `sw.js`، فيصل
 * `index.html` الجديد بأسماء القطع الجديدة. والحارس في `sessionStorage` يمنع
 * حلقة تحديثٍ لا تنتهي إن كان العطل شيئاً آخر: محاولةٌ واحدة كل دقيقة.
 */
import { K, getItem, setItem } from "./storage";

const PATTERNS = [
  /Failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /Importing a module script failed/i,
  /is not a valid JavaScript MIME type/i,
  /Unable to preload CSS/i,
  /ChunkLoadError|Loading chunk \S+ failed/i,
];

export function isChunkLoadError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  return PATTERNS.some((re) => re.test(msg));
}

/** هل مرّ على آخر محاولة تحديثٍ وقتٌ كافٍ؟ — خالصة للفحص. */
export function mayReload(lastAttempt: string | null, now = Date.now(), gapMs = 60_000): boolean {
  const t = lastAttempt ? Number(lastAttempt) : 0;
  return !Number.isFinite(t) || now - t > gapMs;
}

/** يحدّث الصفحة إن سُمح، ويعيد `true` إن فعل. */
export function reloadOnce(): boolean {
  if (!mayReload(getItem(K.CHUNK_RELOAD, true))) return false;
  setItem(K.CHUNK_RELOAD, String(Date.now()), true);
  window.location.reload();
  return true;
}

/**
 * Vite يطلق `vite:preloadError` حين يفشل استيرادٌ ديناميكي — قبل أن يصل الخطأ
 * إلى React. نلتقطه هنا، و`ErrorBoundary` شبكة الأمان الثانية.
 */
export function installChunkReload(): void {
  window.addEventListener("vite:preloadError", (e) => {
    if (reloadOnce()) e.preventDefault();
  });
}

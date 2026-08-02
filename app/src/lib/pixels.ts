/**
 * بكسلات التتبّع في صفحة المنيو.
 *
 * ═══ المبادئ ═══
 *
 * 1. **بلا معرّف ⇒ بلا سكربت.** منيو تاجر لم يضبط شيئاً لا يحمّل بايتاً واحداً
 *    من طرف ثالث. هذا ليس تحسين أداء فقط: زبون في مطعم لم يطلب تتبّعاً لا
 *    يُتتبَّع.
 * 2. **صفحة المنيو وحدها.** لا لوحة التاجر ولا لوحة المؤسس ولا الديمو — بيانات
 *    التاجر عن نفسه ليست بيانات إعلانية.
 * 3. **النطاقات مسمّاة في CSP** (`app/public/_headers`). أي مزوّد جديد يحتاج
 *    إضافة نطاقه صراحةً — بلا `*` وبلا `unsafe-inline` للسكربتات.
 *
 * ═══ لماذا لا `dangerouslySetInnerHTML` بسكربت مضمَّن ═══
 *
 * CSP الحالية تسمح بـ`script-src 'self' <نطاقات مسمّاة>` بلا `unsafe-inline`،
 * فأي سكربت مضمَّن يُحجب. لذلك تُبنى شفرة التهيئة برمجياً هنا وتُحمَّل ملفات
 * المزوّدين من نطاقاتها — وهذا أفضل أمنياً من فتح `unsafe-inline` للجميع.
 * التهيئة نفسها تُنفَّذ بدوال لا بنصّ، فلا تمرّ من CSP أصلاً.
 */

export type PixelIds = {
  meta: string | null;
  ga: string | null;
  snap: string | null;
};

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string; callMethod?: (...a: unknown[]) => void };
    _fbq?: unknown;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    snaptr?: ((...args: unknown[]) => void) & { queue?: unknown[]; handleRequest?: (...a: unknown[]) => void };
  }
}

const MARK = "data-cm-pixel";

function addScript(src: string): void {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  s.setAttribute(MARK, "1");
  document.head.appendChild(s);
}

/**
 * يحقن البكسلات المضبوطة. يُنادى مرة واحدة لكل تحميل صفحة منيو.
 *
 * لا يزيل شيئاً عند التفكيك: سكربتات المزوّدين تُلوّث `window` عالمياً ولا
 * تُنظَّف بإزالة الوسم، فمحاولة «الإلغاء» توهم بأمان غير موجود. والزبون يفتح
 * منيو واحداً في الجلسة عملياً.
 */
export function installPixels(ids: PixelIds): void {
  if (typeof document === "undefined") return;
  if (document.head.querySelector(`[${MARK}]`)) return; // حُقنت في هذا التحميل

  if (ids.meta) {
    // نسخة مكافئة لشفرة Meta الرسمية، مبنية بدوال لا بنصّ مضمَّن (انظر أعلاه).
    const fbq = function (...args: unknown[]) {
      const f = window.fbq!;
      if (f.callMethod) f.callMethod(...args);
      else f.queue!.push(args);
    } as NonNullable<typeof window.fbq>;
    if (!window.fbq) {
      window.fbq = fbq;
      window._fbq = fbq;
      fbq.queue = [];
      fbq.loaded = true;
      fbq.version = "2.0";
      addScript("https://connect.facebook.net/en_US/fbevents.js");
    }
    window.fbq!("init", ids.meta);
    window.fbq!("track", "PageView");
  }

  if (ids.ga) {
    window.dataLayer = window.dataLayer ?? [];
    // gtag تعتمد على `arguments` حرفياً — سهم بمعاملات مفرودة يكسر تنسيقها.
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    } as typeof window.gtag;
    window.gtag!("js", new Date());
    window.gtag!("config", ids.ga);
    addScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ids.ga)}`);
  }

  if (ids.snap) {
    const snaptr = function (...args: unknown[]) {
      const s = window.snaptr!;
      if (s.handleRequest) s.handleRequest(...args);
      else s.queue!.push(args);
    } as NonNullable<typeof window.snaptr>;
    if (!window.snaptr) {
      window.snaptr = snaptr;
      snaptr.queue = [];
      addScript("https://sc-static.net/scevent.min.js");
    }
    window.snaptr!("init", ids.snap);
    window.snaptr!("track", "PAGE_VIEW");
  }
}

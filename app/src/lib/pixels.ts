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
 * 4. **المعرّف يُفحص شكلاً قبل أن يُحقن** — انظر `GTM-` أدناه.

 * ═══ ⚠️ لماذا `GTM-` مرفوض تحديداً ═══
 *
 * `googletagmanager.com/gtag/js?id=…` يقبل شكلين:
 *   • معرّف قياس/إعلان (`G-` · `AW-` · `GT-`) ⇒ يحمّل شفرة قياس محدودة.
 *   • معرّف **حاوية** (`GTM-`) ⇒ يحمّل ما وضعه صاحب الحاوية فيها، **وهو
 *     جافاسكربت حرّة**.
 *
 * والحقن يقع على نطاق المنصّة، وجلسة التاجر في `localStorage` عليه. فتاجرٌ
 * يضع `GTM-XXXX` لحاوية يملكها يزرع شفرةً تعمل في منيوه — وأي تاجر آخر
 * (أو المؤسّس) يفتح ذلك المنيو وهو مسجَّل يسلّمه جلسته. ليست ثغرة في قوقل
 * بل في **الثقة بمعرّف يكتبه المستخدم**.
 *
 * القيد الحقيقي في القاعدة (`restaurants_ga_id_shape`) لأن API التاجر (§14)
 * يتجاوز هذه الصفحة؛ وهذا الفحص طبقةٌ ثانية عند نقطة الحقن نفسها.
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

/**
 * أشكال المعرّفات المقبولة — نسخة مطابقة لقيود `restaurants_*_shape` في
 * القاعدة. القيدان يحرسان مدخلين مختلفين (اللوحة وAPI التاجر)، فتباعدهما
 * يعني معرّفاً يُحفظ ولا يُحقن أو العكس.
 */
const SHAPE = {
  ga: /^(G|AW|GT)-[A-Z0-9]{4,20}$/,
  meta: /^[0-9]{6,20}$/,
  snap: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
} as const;

/** يُعيد المعرّف إن كان شكله مقبولاً، وإلا `null` — فلا يُحمَّل شيء. */
export function validPixelId(kind: keyof typeof SHAPE, raw: string | null): string | null {
  const v = (raw ?? "").trim();
  return v && SHAPE[kind].test(v) ? v : null;
}

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

  // ⚠️ الفحص هنا لا عند القراءة: هذه آخر نقطة قبل بناء رابط السكربت.
  const meta = validPixelId("meta", ids.meta);
  const ga = validPixelId("ga", ids.ga);
  const snap = validPixelId("snap", ids.snap);

  if (meta) {
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
    window.fbq!("init", meta);
    window.fbq!("track", "PageView");
  }

  if (ga) {
    window.dataLayer = window.dataLayer ?? [];
    // gtag تعتمد على `arguments` حرفياً — سهم بمعاملات مفرودة يكسر تنسيقها.
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    } as typeof window.gtag;
    window.gtag!("js", new Date());
    window.gtag!("config", ga);
    addScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga)}`);
  }

  if (snap) {
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
    window.snaptr!("init", snap);
    window.snaptr!("track", "PAGE_VIEW");
  }
}

/**
 * قياس القمع — ستة أحداث عند نقاط القرار وحدها.
 *
 * ═══ المشكلة التي يحلّها ═══
 *
 * `lib/pixels.ts` يحقن بكسلات **التاجر** في صفحة منيوه (§15). أما موقعنا نحن
 * — الهبوط والتسجيل واللوحة — فكان **بلا أي قياس إطلاقاً**: لا زوّار، ولا
 * مصدر، ولا معدّل تحويل، ولا معرفة أين يسقط الزائر. أي ريال يُنفَق على إعلان
 * لا سبيل لمعرفة إن أتى بمشترك.
 *
 * ═══ ⚠️ لماذا محايد المزوّد ولا يرسل شيئاً افتراضياً ═══
 *
 * اختيار أداة التحليلات وإنشاء حسابها قرار مالك. فبُنيت الطبقة **والأحداث**
 * الآن — وهي العمل الحقيقي — ويبقى المزوّد سطراً في `site_settings`.
 * فحتى تُلصق القيمة:
 *   · صفر طلب طرف ثالث · صفر بايت يُحمَّل · صفر نطاق جديد في CSP.
 * ويوم تُلصق يمتلئ القمع **فوراً** بلا دورة تطوير.
 *
 * ⚠️ وإضافة أي مزوّد لاحقاً تستوجب إضافة نطاقه في `app/public/_headers` —
 * وإلا حجبته CSP بصمت (لا `unsafe-inline` ولا `*` هناك، §15).
 *
 * ═══ ما لا يُرسَل أبداً ═══
 *
 * لا بريد، ولا اسم مطعم، ولا جوّال، ولا معرّف مستخدم. الأحداث **مجرّدة**:
 * «حدث تسجيل» لا «فلان سجّل». القمع يحتاج أعداداً لا هويات.
 */
import { getSiteSetting } from "./data";

/** نقاط القرار الستّ في رحلة التاجر — من أول زيارة إلى أول ريال. */
export type TrackEvent =
  | "signup_started"
  | "restaurant_created"
  | "first_dish_added"
  | "qr_downloaded"
  | "checkout_started"
  | "subscription_paid";

type AnalyticsConfig = {
  /**
   * معرّف المزوّد. فارغ أو غائب ⇒ لا يُرسل شيء.
   * لـGA4: `G-XXXXXXXXXX` · ولـPlausible: نطاق الموقع (`cloudmenu.sa`).
   */
  id?: string;
  /**
   * ⚠️ **كان مُعلَناً وغير مقروء** — وهذه ثغرة وثائق لا تحسين.
   *
   * `LAUNCH.md` يطلب من المالك إدراج `{"provider":"ga4","id":"G-…"}`، وكان
   * `installProvider` يحمّل **سكربت Plausible دائماً** ويمرّر المعرّف في
   * `data-domain`. أي أن اتّباع التعليمة حرفياً كان يُركّب مزوّداً خاطئاً
   * بمعرّفٍ لا يفهمه — بلا خطأ في الطرفية ولا حدث يصل. والمالك يرى سكربتاً
   * يُحمَّل فيظنّ القياس يعمل.
   *
   * القيمتان المدعومتان الآن: `ga4` و`plausible` (الافتراض).
   */
  provider?: "ga4" | "plausible" | string;
  /** نطاق السكربت لمن يستضيف Plausible بنفسه. */
  host?: string;
};

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Record<string, string> }) => void;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** GA4 يميّز نفسه بمعرّفه (`G-…`) — فلا يُشترط على المالك أن يكتب المزوّد. */
function providerOf(cfg: AnalyticsConfig): "ga4" | "plausible" {
  if (cfg.provider === "ga4" || cfg.provider === "plausible") return cfg.provider;
  return /^(G|AW|GT)-/i.test(cfg.id ?? "") ? "ga4" : "plausible";
}

/** الطابور: أحداث وقعت قبل أن تُحسم الإعدادات — لا تضيع ولا تُرسَل مرّتين. */
const pending: TrackEvent[] = [];
let config: AnalyticsConfig | null = null;
let resolved = false;
let loading: Promise<void> | null = null;

/**
 * هل يرفض هذا الزائر التتبّع؟
 *
 * `Do-Not-Track` يُحترَم صراحةً. لا يوجبه نظام سعودي، لكن من ضبطه أعلن رغبته
 * — وتجاهُلها في منتج يبيع الثقة تناقض.
 */
function optedOut(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.doNotTrack === "1" || (window as { doNotTrack?: string }).doNotTrack === "1";
}

/** يحمّل سكربت المزوّد مرّة واحدة — ولا يُستدعى إلا بعد التأكّد من وجود معرّف. */
function installProvider(cfg: AnalyticsConfig): void {
  if (!cfg.id) return;
  if (document.querySelector("script[data-cm-analytics]")) return;

  const el = document.createElement("script");
  el.setAttribute("data-cm-analytics", "");

  if (providerOf(cfg) === "ga4") {
    /**
     * GA4 — ونطاقاه مسموحان في CSP أصلاً (`_headers`)، فلا شيء يُضاف هناك.
     *
     * ⚠️ `gtag` تعتمد على `arguments` حرفياً، فدالّة سهمٍ بمعاملات مفرودة
     * تكسر تنسيقها — نفس الفخّ الموثَّق في `lib/pixels.ts`.
     */
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    } as typeof window.gtag;
    window.gtag!("js", new Date());
    window.gtag!("config", cfg.id);
    el.async = true;
    el.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(cfg.id)}`;
    document.head.appendChild(el);
    return;
  }

  // Plausible: بلا كوكيز، وخفيف، ولا يجمع هويات — يناسب منتجاً يَعِد الزبون
  // في سياسته بألّا نتعقّبه.
  el.defer = true;
  el.setAttribute("data-domain", cfg.id);
  el.src = `${(cfg.host ?? "https://plausible.io").replace(/\/+$/, "")}/js/script.js`;
  document.head.appendChild(el);
}

/** يقرأ الإعداد مرّة واحدة ثم يُفرغ ما تجمّع في الطابور. */
function ensureConfig(): Promise<void> {
  loading ??= getSiteSetting<AnalyticsConfig | string>("analytics")
    .then((raw) => {
      const parsed =
        typeof raw === "string" ? (JSON.parse(raw) as AnalyticsConfig) : raw ?? null;
      config = parsed?.id ? parsed : null;
      if (config) installProvider(config);
    })
    // فشل القراءة ⇒ لا قياس. لا يُعطَّل شيء في المنتج من أجل عدّاد.
    .catch(() => {
      config = null;
    })
    .finally(() => {
      resolved = true;
      const queued = pending.splice(0, pending.length);
      if (config) for (const e of queued) send(e);
    });
  return loading;
}

function send(event: TrackEvent): void {
  // كلاهما يقبل اسم الحدث نصّاً؛ والاسم واحد في المزوّدين فيبقى القمع مقروءاً
  // لو بُدّل المزوّد لاحقاً.
  if (config && providerOf(config) === "ga4") window.gtag?.("event", event);
  else window.plausible?.(event);
}

/**
 * يسجّل حدثاً.
 *
 * **لا يرمي أبداً ولا يُبطئ شيئاً**: كل نداء آمن للاستدعاء داخل معالج ضغطة أو
 * بعد نجاح حفظ. وحدثٌ يفشل إرساله لا يجوز أن يوقف تسجيل تاجر.
 */
export function track(event: TrackEvent): void {
  if (typeof window === "undefined" || optedOut()) return;
  if (!resolved) {
    // سقف الطابور: زائر يتنقّل كثيراً قبل حسم الإعدادات لا يجوز أن يُراكم بلا حدّ.
    if (pending.length < 20) pending.push(event);
    void ensureConfig();
    return;
  }
  if (config) send(event);
}

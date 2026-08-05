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
  /** معرّف المزوّد. فارغ أو غائب ⇒ لا يُرسل شيء. */
  id?: string;
  /** `plausible` مبدئياً؛ يتوسّع حين يُختار غيره. */
  provider?: string;
  /** نطاق السكربت لمن يستضيف بنفسه. */
  host?: string;
};

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Record<string, string> }) => void;
  }
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

  // Plausible مبدئياً: بلا كوكيز، وخفيف، ولا يجمع هويات — يناسب منتجاً
  // يَعِد الزبون في سياسته بألّا نتعقّبه.
  const el = document.createElement("script");
  el.defer = true;
  el.setAttribute("data-cm-analytics", "");
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
  window.plausible?.(event);
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

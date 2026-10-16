/**
 * CORS المشترك بين دوال الحافة — **مصدر واحد لقائمة الأصول المسموحة**.
 *
 * ═══ لماذا مشتركة لا منسوخة ═══
 *
 * كانت القائمة نفسها مكتوبة بيد في **أربع** دوال (`founder-admin` ·
 * `payments` · `billing-admin` · `notify-support`)، وبقيت اثنتان على `*`
 * (`paylink-create` و`menu-scan`) رغم أنهما بنفس مستوى الثقة: الأولى تُنشئ
 * فواتير وتقرأ أكواد الخصم، والثانية تُنفق على نموذج مدفوع.
 *
 * وأربع نسخ من قائمة **أمان** تعني أن من يشدّ إحداها لاحقاً — بإضافة نطاق أو
 * إزالته — يترك الثلاث الأخرى على القديم بلا أن يصرخ شيء. نفس درس
 * `safe-equal.ts` و`founder-secret.ts` حرفياً.
 *
 * ═══ ما لا يفعله هذا الملفّ ═══
 *
 * CORS **ليس** الحارس. الهوية في كل هذه الدوال رأس `Authorization` صريح أو
 * سرّ مشترك، لا كوكي — فالخطر ليس CSRF كلاسيكياً، والنداء من خادم (بلا
 * `Origin`) يمرّ كما كان. القائمة تمنع «كل صفحة تجرّب» لا أكثر، والبوّابة
 * داخل كل دالّة هي ما يحرس فعلاً.
 */

/**
 * النطاقات الثابتة — الإنتاج والتطوير المحلّي.
 *
 * ═══ ⚠️ لماذا ليس `cloudsmenu.netlify.app` ═══
 *
 * كان هذا هو المكتوب في كل نسخة من القائمة، و**الموقع لا يملكه المشروع**:
 * لا وجود لمشروع بهذا الاسم في حساب Netlify (٢٥ مشروعاً، مُتحقَّق)، والمضيف
 * مع ذلك **حيّ ويردّ ٢٠٠** — أي أنه لأحدٍ آخر. فكانت القائمة تسمح لأصلٍ
 * أجنبي بمناداة دوالّ تُنشئ فواتير وتقرأ أكواد الخصم وتفعّل اشتراكات.
 *
 * ومشروع المنيو في الحساب هو `heroic-marzipan-b46da4` (مُتحقَّق من معرّفه
 * `bdcfa5fd-…` وهو نفسه هدف `deploy.yml`).
 */
const STATIC_ORIGINS = [
  "https://heroic-marzipan-b46da4.netlify.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

/** معاينات Netlify (`deploy-preview-12--heroic-marzipan-b46da4.netlify.app`). */
const PREVIEW_RE = /^https:\/\/[a-z0-9-]+--heroic-marzipan-b46da4\.netlify\.app$/;

/**
 * ⚠️ يُقرأ عند كل نداء لا عند التحميل: ضبط `ALLOWED_ORIGINS` من لوحة Supabase
 * يسري على النسخ الدافئة بلا إعادة نشر — ونطاقٌ جديد يُضاف به لا بتعديل هنا
 * (مفصولة بفواصل).
 */
function extraOrigins(): string[] {
  return (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

export function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  return (
    STATIC_ORIGINS.includes(origin) ||
    PREVIEW_RE.test(origin) ||
    extraOrigins().includes(origin)
  );
}

/** الرؤوس الافتراضية — تكفي كل دالّة تُنادى بجلسة Supabase. */
const DEFAULT_HEADERS = "authorization, x-client-info, apikey, content-type";

export type CorsOptions = {
  /** رؤوس إضافية تُضاف إلى الافتراضية (مثل `x-founder-secret`). */
  extraHeaders?: string[];
  /** الأفعال المسموحة — `POST, OPTIONS` افتراضاً. */
  methods?: string;
};

/**
 * رؤوس CORS لطلبٍ بعينه.
 *
 * **أصلٌ غير معروف ⇒ لا يُعكس** — فيمنع المتصفّح القراءة. ولا نردّ `*` أبداً
 * على هذه الدوال.
 */
export function corsHeaders(
  req: Request,
  opts: CorsOptions = {},
): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const headers = opts.extraHeaders?.length
    ? `${DEFAULT_HEADERS}, ${opts.extraHeaders.join(", ")}`
    : DEFAULT_HEADERS;
  return {
    ...(isAllowedOrigin(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
    Vary: "Origin",
    "Access-Control-Allow-Headers": headers,
    "Access-Control-Allow-Methods": opts.methods ?? "POST, OPTIONS",
  };
}

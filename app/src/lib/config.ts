/**
 * الإعدادات العامة للتطبيق — مفاتيح عامة بطبيعتها (تُرسل من المتصفح):
 * مفتاح Supabase anon محكوم بسياسات RLS.
 *
 * ⚠️ **لا سرّ دفع هنا إطلاقاً.** بوّابة الاشتراك صارت PayLink، ومفاتيحها
 * (`PAYLINK_API_ID` · `PAYLINK_SECRET_KEY`) تعيش في **أسرار دوال Supabase
 * وحدها** ولا تصل المتصفّح بأي شكل. وPayLink تعمل بالتحويل لا بالتضمين، فلا
 * يمرّ رقم بطاقة بنا ولا نحتاج سكربت طرف ثالث — لهذا اختفت نطاقات Moyasar من
 * `public/_headers` بلا بديل.
 *
 * وسرّ المؤسس (`cm_fsecret`) لا يُضمَّن هنا أبداً — يُدخله المؤسس بنفسه في لوحته.
 */
export const SUPABASE_URL = "https://wxrukupcyfypnqnotmxv.supabase.co";

export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4cnVrdXBjeWZ5cG5xbm90bXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NjA2OTEsImV4cCI6MjA5NzAzNjY5MX0.68unhGtpIxnTg4XsjdYHLiXM7aLuwls5Jo0tSarqR90";

export const SITE_NAME = "كلاود منيو";

/**
 * أصل الموقع المنشور — يقرؤه `seo.ts` (canonical و`og:url`) وسكربت خريطة
 * الموقع ووحدة استلام PayLink في لوحة المؤسّس.
 *
 * ═══ ⚠️ لماذا تغيّر عن `cloudsmenu.netlify.app` ═══
 *
 * ذلك المضيف **ليس ملكاً للمشروع**: لا مشروع بهذا الاسم في حساب Netlify
 * (٢٥ مشروعاً، مُتحقَّق)، ومع ذلك يردّ ٢٠٠ — أي أنه لأحدٍ آخر. فكان كل
 * `canonical` وكل `og:url` وكل رابط في خريطة الموقع يشير إلى موقع غريب،
 * و**رابط عودة PayLink بعد دفعة الاشتراك يُنزل التاجر عند ذلك الغريب**.
 *
 * والموقع الحقيقي هو مشروع `heroic-marzipan-b46da4` في الحساب — وهو نفسه
 * هدف `.github/workflows/deploy.yml`.
 *
 * ⚠️ **ولا علاقة لهذا بروابط المنيو المطبوعة.** تلك تُبنى في
 * `shared/menu-url.mjs` من المضيف الذي وصل عليه الطلب فعلاً
 * (`MENU_DOMAIN = null`) لا من هنا — فكود QR المطبوع لا يتأثّر بهذا السطر.
 *
 * ⟵ يصير `cloudmenu.sa` يوم يُربَط النطاق، مع `MENU_DOMAIN` هناك.
 */
export const SITE_URL = "https://heroic-marzipan-b46da4.netlify.app";

/**
 * واتساب الدعم — التاجر السعودي يراسل واتساب لا يفتح تذكرة.
 *
 * قيمة احتياطية فقط: المصدر المعتمد هو مفتاح `support_whatsapp` في جدول
 * `site_settings` ليغيّره المؤسس بلا إعادة نشر. اتركها فارغة ليختفي الزر
 * تلقائياً بدل أن يقود إلى رقم لا يردّ.
 */
export const SUPPORT_WHATSAPP = "";

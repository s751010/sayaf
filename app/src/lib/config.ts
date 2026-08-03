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
export const SUPABASE_URL = "https://wjqpsbpebpntpeinqccl.supabase.co";

export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcXBzYnBlYnBudHBlaW5xY2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNTE1MDEsImV4cCI6MjA5NTcyNzUwMX0.c2kB9phWo2SbOsaUmb_h5A9y0pcd7eKLzEbGmC41I4M";

export const SITE_NAME = "كلاود منيو";
export const SITE_URL = "https://cloudsmenu.netlify.app";

/**
 * واتساب الدعم — التاجر السعودي يراسل واتساب لا يفتح تذكرة.
 *
 * قيمة احتياطية فقط: المصدر المعتمد هو مفتاح `support_whatsapp` في جدول
 * `site_settings` ليغيّره المؤسس بلا إعادة نشر. اتركها فارغة ليختفي الزر
 * تلقائياً بدل أن يقود إلى رقم لا يردّ.
 */
export const SUPPORT_WHATSAPP = "";

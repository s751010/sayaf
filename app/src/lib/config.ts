/**
 * الإعدادات العامة للتطبيق. هذه مفاتيح عامة بطبيعتها (تُرسل من المتصفح):
 * مفتاح Supabase anon محكوم بسياسات RLS.
 * سر المؤسس (cm_fsecret) لا يُضمَّن هنا أبداً — يُدخله المؤسس بنفسه في لوحته.
 *
 * ⚠️ بوابة الدفع PayLink **ليس لها أي مفتاح هنا**: مفاتيحها (apiId/secretKey)
 * أسرار خادم تعيش في أسرار دالة `paylink-create` فقط. المتصفح يطلب رابط دفع
 * ويُحوَّل إليه — لا يرى مفتاحاً ولا يرسل مبلغاً.
 */
export const SUPABASE_URL = "https://wjqpsbpebpntpeinqccl.supabase.co";

export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcXBzYnBlYnBudHBlaW5xY2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNTE1MDEsImV4cCI6MjA5NTcyNzUwMX0.c2kB9phWo2SbOsaUmb_h5A9y0pcd7eKLzEbGmC41I4M";

export const SITE_NAME = "كلاود منيو";
export const SITE_URL = "https://cloudsmenu.netlify.app";

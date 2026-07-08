/**
 * الإعدادات العامة للتطبيق. هذه مفاتيح عامة بطبيعتها (تُرسل من المتصفح):
 * مفتاح Supabase anon محكوم بسياسات RLS، ومفتاح Moyasar هو مفتاح نشر (publishable).
 * سر المؤسس (cm_fsecret) لا يُضمَّن هنا أبداً — يُدخله المؤسس بنفسه في لوحته.
 */
export const SUPABASE_URL = "https://wjqpsbpebpntpeinqccl.supabase.co";

export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcXBzYnBlYnBudHBlaW5xY2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNTE1MDEsImV4cCI6MjA5NTcyNzUwMX0.c2kB9phWo2SbOsaUmb_h5A9y0pcd7eKLzEbGmC41I4M";

// TODO(production): استبدله بمفتاح النشر الحقيقي pk_live_... عند الإطلاق (قرار المالك).
export const MOYASAR_PK = "pk_test_ZcUaLJxdz27Fc9SkQyneSfuq193EBUmMr8tBqHj7";

export const SITE_NAME = "كلاود منيو";
export const SITE_URL = "https://cloudsmenu.netlify.app";

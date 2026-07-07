-- ════════════════════════════════════════════════════════════
-- سد تسريب اكتُشف باختبار اختراق (طُبّق عبر MCP بتاريخ 2026-07-07):
-- جدول restaurants قراءته العامة using(true) (لصفحة المنيو) كانت تكشف
-- عمودَي payment_gateway/payment_key لأي زائر بمفتاح anon العام.
-- العمودان ميتان (لا يقرأهما/يكتبهما أي كود — المنصّة تستخدم
-- site_settings.features.payment_provider + أسرار Edge Functions)، لذا
-- حُذفا نهائياً. select("*") في المنيو ولوحة التاجر يبقى يعمل طبيعياً.
--
-- ملاحظة: محاولة تقييد العمودين بصلاحية عمود (column GRANT) لا تنفع لأن
-- PostgREST يتطلب SELECT على مستوى الجدول لأجل select("*")؛ الحذف أنظف.
-- ════════════════════════════════════════════════════════════

revoke select on public.restaurants from anon;
revoke select on public.restaurants from authenticated;
grant select on public.restaurants to anon, authenticated;

alter table public.restaurants drop column if exists payment_gateway;
alter table public.restaurants drop column if exists payment_key;

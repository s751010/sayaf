-- ═══════════════════════════════════════════════════════════════════
--  تصلّب أمني — الجولة الثانية · ٢٠٢٦/٠٨/٢٢
--
--  بعد فحص شامل للواجهة و١٦ دالّة حافة منشورة والسكيما والمنح والشيفرة
--  الميّتة. مطبَّق على wxrukupcyfypnqnotmxv عبر هجرتين:
--    notify_support_secret_and_trigger
--    security_round_2_grants_and_input_guards
--  هذا الملفّ سجلّ مقروء؛ القاعدة هي المصدر الحيّ.
-- ═══════════════════════════════════════════════════════════════════

-- ═══ ١) منح `anon` تُقصر على ما له سياسة فعلاً ═══
--
-- الافتراض في Supabase أن كل جدول جديد يُمنح `anon` كل شيء، وRLS وحدها
-- تحرسه. فستّة جداول كانت تحمل `anon=arwdDxtm` **بلا سياسة `anon` واحدة** —
-- أي أن بينها وبين العالم سياسةً واحدة، لا سياسةً ومنحاً.
--
-- ⚠️ وأخطرها اثنان: `restaurant_payment_settings` فيه `secret_key` الخاص
-- بحساب PayLink للتاجر، و`staff_pins` فيه هاشات رموز الكاشير.
--
-- خريطة سياسات `anon` (مُتحقَّقة بالاستعلام **قبل** الكتابة — والقاعدة (و)
-- تجعل الخطأ هنا يُطفئ منيوهات الجميع): قراءةً على announcements ·
-- blog_posts · dishes · menus · restaurant_slug_aliases · restaurants ·
-- site_settings — وإدراجاً على analytics · client_errors ·
-- loyalty_customers · survey_responses. وما عداها لا شيء.
revoke all on public.founder_audit                from anon;
revoke all on public.restaurant_payment_settings  from anon;
revoke all on public.revenue_log                  from anon;
revoke all on public.staff_pins                   from anon;
revoke all on public.subscriptions                from anon;
revoke all on public.support_tickets              from anon;

-- `survey_responses`: صفر صفّ وصفر سطر شيفرة يقرؤه أو يكتب فيه (§2 في
-- CLAUDE.md). سياسة إدراج بلا كاتب سطحٌ بلا مقابل.
revoke all on public.survey_responses from anon;

-- `analytics`: لا سياسة قراءة لـ`anon` إطلاقاً (القراءة للمالك والمؤسّس)،
-- والإدراج مُنع في هجرة النقل. فبقاء SELECT منحٌ لا يستعمله أحد.
revoke select on public.analytics from anon;

-- `dishes.views`: المسار المشروع هو `increment_dish_views` (SECURITY
-- DEFINER)، وسياسة `dishes_update` لا تشمل `anon` أصلاً. المنح بقيّة قديمة.
revoke update (views) on public.dishes from anon;

-- ═══ ٢) `secret_key` يُحجب عن التاجر نفسه ═══
--
-- الواجهة تصف المفتاح بأنه «كتابةً فقط» (§13) وتقرأ `has_secret` المحسوب
-- بدلاً منه — لكن PostgREST كان يعيده لمن يطلبه بجلسته. الوصف كان عُرفاً في
-- الواجهة لا قيداً في القاعدة. والكتابة تبقى: التاجر يضبط مفتاحه ولا يقرؤه.
revoke select on public.restaurant_payment_settings from authenticated;
grant select (restaurant_id, user_id, provider, api_id, enabled, has_secret, updated_at)
  on public.restaurant_payment_settings to authenticated;

-- ═══ ٣) معرّفات بكسلات التتبّع — أخطرها `GTM-` ═══
--
-- ⚠️ `installPixels` يحمّل `googletagmanager.com/gtag/js?id=<من التاجر>`.
-- ومعرّف حاوية GTM (`GTM-XXXX`) يجعل قوقل تُشغّل **ما يضعه صاحب الحاوية
-- فيها** — أي جافاسكربت حرّة على نطاق المنصّة. وجلسة التاجر في
-- `localStorage` على النطاق نفسه: تاجرٌ خبيث يزرع سارق جلسة في منيوه، وأي
-- تاجر آخر (أو المؤسّس) يفتحه وهو مسجَّل يسلّمه حسابه.
--
-- فالمقبول معرّفات القياس والإعلان وحدها (`G-` · `AW-` · `GT-`)، و`GTM-`
-- مرفوض. والقيد **في القاعدة** لا في الواجهة وحدها: API التاجر (§14) يكتب
-- في الجدول مباشرةً ولا يمرّ بالفورم.
alter table public.restaurants
  add constraint restaurants_ga_id_shape check (
    ga_measurement_id is null or ga_measurement_id ~ '^(G|AW|GT)-[A-Z0-9]{4,20}$'),
  add constraint restaurants_meta_pixel_shape check (
    meta_pixel_id is null or meta_pixel_id ~ '^[0-9]{6,20}$'),
  add constraint restaurants_snap_pixel_shape check (
    snap_pixel_id is null or
    snap_pixel_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

-- ═══ ٤) رابط الويبهوك: لا عناوين داخلية ═══
--
-- قيد `^https://` كان قائماً، لكنه يمرّر `https://127.0.0.1` و
-- `https://169.254.169.254` (بيانات السحابة الوصفية) و`https://localhost`.
-- والدالة تنادي الرابط بمفتاح الخدمة **من داخل شبكة المزوّد**.
--
-- هذا يمنع أوضح الأشكال **قبل الحفظ** فيرى التاجر خطأه عند الإضافة؛ والحارس
-- الكامل في `_shared/url-guard.ts` يفحص **عند الإرسال** أيضاً — لأن الصفوف
-- المحفوظة قبل هذا القيد لم تمرّ به.
alter table public.webhooks
  add constraint webhooks_url_not_internal check (
    url !~* '^https://(localhost|127\.|0\.|10\.|169\.254\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|\[)'
    and url !~* '\.(local|internal|localdomain)(/|:|$)'
    and url !~* '^https://metadata\.');

-- ═══ ٥) `client_errors`: حدّ عامّ فوق حدّ التوقيع ═══
--
-- ⚠️ الحدّ كان مفتاحه **توقيع الخطأ** وحده — والتوقيع يُحسب من الرسالة، فمن
-- يغيّر الرسالة في كل نداء يولّد توقيعاً جديداً ويلتفّ التفافاً كاملاً.
-- والجدول مفتوح لإدراج `anon` بحدّ ٥٫٤ ك.ب للصفّ.
--
-- (التعريف الكامل في القاعدة — انظر `guard_client_error_rate`. المضاف:
--  حدّ عامّ ٦٠/دقيقة لكل المنصّة قبل حدّ التوقيع، وسقف صلب ٥٠ ألف صفّ فوق
--  سقف الثلاثين يوماً: انفجارٌ في يوم واحد لا يبلغه سقفٌ زمني.)

-- ═══ ٦) توصيل `notify-support` من القاعدة ═══
--
-- الدالة كانت منشورة **ولا شيء يناديها**: لا تريجر ولا سطر في الواجهة —
-- فتذاكر الدعم لم تكن تُشعر أحداً منذ نقل المشروع.
--
-- والتوصيل من الهجرات لا من لوحة Supabase عمداً: Database Webhook تُضبط
-- بالنقر فتُنسى عند أي نقل، وهذا بالضبط ما حدث. أمّا التريجر فيسافر معها.
-- نفس نمط `tick_webhook_dispatch` القائم في الإنتاج.
insert into public.internal_secrets (key, value)
values ('support_notify_secret', encode(gen_random_bytes(32), 'hex'))
on conflict (key) do nothing;

-- create function public.notify_support_ticket() … security definer
--   → net.http_post(url := '…/functions/v1/notify-support',
--                   headers := {'x-notify-secret': <السرّ>},
--                   body := {'record': {…}})
-- create trigger notify_support_ticket after insert on public.support_tickets

-- ═══════════════════════════════════════════════════════════════════
--  نقل المنصّة إلى مشروعها الخاصّ — ٢٠٢٦/٠٨/٢٢
--
--  من  wjqpsbpebpntpeinqccl (طوكيو، ويسكنه منتج آخر: دوالّ `sahse_*`)
--  إلى wxrukupcyfypnqnotmxv (سنغافورة، اسمه «claudmenu»)
--
--  مطبَّق على الجديد عبر ستّ هجرات:
--    orders_subsystem_and_operational_columns
--    order_rpcs
--    order_rpc_execute_grants
--    analytics_hourly_upsert
--    security_hardening_parity
--    storage_buckets_for_menu_images
--    function_execute_parity
--  هذا الملفّ سجلّ مقروء؛ القاعدة هي المصدر الحيّ.
--
--  ═══ لماذا لم يكن «تبديل سطر» ═══
--
--  المشروع الجديد كان **نسخة أقدم** من السكيما: أُنشئ قبل عمل الأسابيع
--  الأخيرة، فغابت عنه منظومة الطلبات كاملة، وتصحيح عدّاد المشاهدات،
--  وتصلّب أمني عدّة. وثلاثة فروق كانت **تفتح ثغرات** لا تنقص ميزات:
--
--    ١. `change_restaurant_slug` مفتوحة لـ`anon` — دالة `SECURITY DEFINER`
--       تُعيد كتابة رابط منيو أي مطعم. (القديم: `authenticated` فقط.)
--    ٢. `promo_codes` مقروءة لـ`anon`: كل كود خصم فعّال مكشوف قبل إعلانه.
--    ٣. `analytics` مفتوحة لـ`anon` بالإدراج: مشاهدات مزوَّرة لمطعم غيرك.
--
--  والفروق الأخرى نقصٌ صريح: لا `orders` ولا `order_items`، ولا حرّاس
--  `reject_base64_image` و`loyalty_enrol_guard`، وفهرس المشاهدات ما زال
--  `UNIQUE (menu_id, date)` — أي أن كل مشاهدة بعد الأولى في اليوم تُبتلع.
--
--  ═══ ما لم يُنقَل عمداً ═══
--
--  `image_migration_backup` — جدول لقطة لهجرة صور انتهت في القديم.
--  دوالّ `sahse_*` ودالّاها في الحافة — منتج آخر لا علاقة له بكلاود منيو،
--  وهي السبب الأصلي للنقل: مشروع لمنتج واحد.
--
--  ═══ البيانات ═══
--
--  حسابات التجربة حُذفت بإذن المالك (بقي المؤسّس و`rr@gmail.com`)، و
--  «مطعم الديوان» (`demo`) بقي بـ`user_id = NULL`: هو منيو المنتج التجريبي
--  لا حساب تاجر. وصور المطاعم نُقلت إلى تخزين المشروع الجديد
--  (`migrate-images`) بعد **التحقّق من كل رابط جديد بطلب GET** قبل كتابته،
--  وثلاثٌ منها كانت `data:` base64 داخل أعمدة نصّية (٤٧٥ كيلوبايت).
--
--  ═══ ما يبقى على المالك (لا يُضبط من SQL) ═══
--
--  ١. **تأكيد البريد**: القديم يُفعّل الحساب فوراً، والجديد يطلب تأكيداً.
--     بلا SMTP مضبوط لا يصل بريد ⇒ لا تاجر جديد يدخل. أطفئه ليطابق
--     القديم، أو اضبط SMTP.
--  ٢. **Redirect URLs**: أضِف `<origin>/reset-password` وإلا انكسر رابط
--     استعادة كلمة المرور.
--  ٣. **أسرار الدوال**: PayLink و`SITE_URL` وما تحتاجه `notify-support`.
--     (`GEMINI_API_KEY` مضبوط ومُختبَر: `menu-scan` قرأ منيو اختبار كاملاً.)
-- ═══════════════════════════════════════════════════════════════════

-- ═══ ١) أعمدة التشغيل ═══
alter table public.restaurants
  add column if not exists accepting_orders  boolean not null default true,
  add column if not exists prep_minutes      integer not null default 20,
  add column if not exists min_order_amount  numeric not null default 0;

-- القاعدة (و): العمود الذي يراه الزبون يحتاج منحاً على مستوى العمود.
grant select (accepting_orders, prep_minutes, min_order_amount)
  on public.restaurants to anon;

-- ═══ ٢) الطلبات ═══
-- (الجداول والفهارس والسياسات والمنح والحرّاس — انظر
--  20260820_orders_pickup.sql فالتعريفات متطابقة حرفياً.)
-- المنح هنا هي الفرق الجوهري:
--   `orders`      → authenticated: SELECT/INSERT/DELETE، و UPDATE **بالأعمدة**
--                   (status, ready_at, picked_up_at, updated_at) لا غير.
--   `order_items` → authenticated كاملاً، وRLS يقصره على طلبات مالكه.
--   `anon`        → لا شيء إطلاقاً؛ متابعة الزبون عبر `order_public_status`.

-- ═══ ٣) صلاحيات التنفيذ — أهم قسم أمني في هذا الملفّ ═══
-- PostgreSQL يمنح EXECUTE لـPUBLIC على كل دالة جديدة. و`place_order`
-- تكتب الأسعار كما تُملى عليها، و`mark_order_paid` تُعلن طلباً مدفوعاً.
-- لو بقيتا على الافتراض لاستطاع أي زائر أن يطلب بريال ويعلن دفعه.
revoke all on function public.place_order(uuid, jsonb, numeric, numeric, boolean, text, text, text) from public, anon, authenticated;
revoke all on function public.mark_order_paid(uuid, text) from public, anon, authenticated;
revoke all on function public.abuse_hit(text, uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.place_order(uuid, jsonb, numeric, numeric, boolean, text, text, text) to service_role;
grant execute on function public.mark_order_paid(uuid, text) to service_role;
grant execute on function public.abuse_hit(text, uuid, integer, integer) to service_role;
grant execute on function public.order_public_status(uuid) to anon, authenticated, service_role;
grant execute on function public.popular_dishes(uuid, integer, integer) to anon, authenticated, service_role;

revoke all on function public.change_restaurant_slug(uuid, text) from public, anon;
grant execute on function public.change_restaurant_slug(uuid, text) to authenticated, service_role;
revoke all on function public.guard_order_status() from public, anon, authenticated;
revoke all on function public.guard_slug_change()  from public, anon, authenticated;
revoke all on function public.orders_fill_owner()  from public, anon, authenticated;
grant execute on function public.guard_order_status() to service_role;
grant execute on function public.guard_slug_change()  to service_role;
grant execute on function public.orders_fill_owner()  to service_role;

-- ═══ ٤) عدّاد المشاهدات بالساعة ═══
-- كان `UNIQUE (menu_id, date)`: صفٌّ واحد لكل قائمة في اليوم، فعمود `hour`
-- بلا معنى ولوحة «أوقات الذروة» تعرض ساعة واحدة. والبديل فهرسان جزئيان،
-- و`track_view` تحسب **بتوقيت الرياض**: ذروة الغداء تُقاس بساعة المطعم.
alter table public.analytics drop constraint if exists analytics_menu_date_unique;
create unique index if not exists analytics_menu_hour_unique
  on public.analytics (menu_id, date, hour) where dish_id is null;
create unique index if not exists analytics_dish_hour_unique
  on public.analytics (menu_id, date, hour, dish_id) where dish_id is not null;
revoke insert, update, delete on public.analytics from anon, authenticated;

-- ═══ ٥) أكواد الخصم ليست عامّة ═══
drop policy if exists promos_select on public.promo_codes;
create policy promos_select on public.promo_codes for select to authenticated
  using ((select public.is_founder()));
revoke all on public.promo_codes from anon;

-- ═══ ٦) دلاء التخزين ═══
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('dish-images',       'dish-images',       true, 5242880, array['image/webp','image/jpeg','image/png']),
  ('menu-images',       'menu-images',       true, 5242880, array['image/webp','image/jpeg','image/png']),
  ('restaurant-images', 'restaurant-images', true, 5242880, array['image/webp','image/jpeg','image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
-- الرفع لكل مسجَّل، والحذف/الاستبدال لصاحب الملفّ وحده.
-- ⚠️ الرفع بمفتاح الخدمة يصل بـ`owner = NULL`، فبعد أي نقل يُصحَّح:
--   update storage.objects o set owner = r.user_id, owner_id = r.user_id::text
--     from public.restaurants r
--    where o.owner is null and split_part(o.name,'/',1) = r.id::text;

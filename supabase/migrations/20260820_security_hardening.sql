-- ═══════════════════════════════════════════════════════════════════
--  تحصين أمني — ٢٠٢٦/٠٨/٢٠
--
--  مطبَّق فعلاً على المشروع wjqpsbpebpntpeinqccl. هذا الملفّ سجلّ مقروء
--  لما تغيّر ولماذا؛ القاعدة هي المصدر الحيّ.
--
--  ⚠️ اقرأ القسم (ب) قبل أي تحصين مستقبلي: نصفُ ما في القسم (أ) كُتب أولاً
--  بصيغة أوسع كسرت مساراتٍ حيّة، ثم صُحّح. الدرس مكتوب هناك.
-- ═══════════════════════════════════════════════════════════════════

-- ═══ (أ) ما بقي — ثغرات حقيقية سُدّت ═══════════════════════════════

-- ١) احتيال بطاقة الولاء (كانت مستغَلّة فعلاً)
--
-- سياسة `loyalty_insert` تسمح لدور anon بإنشاء بطاقة في أي مطعم مفعِّل
-- الولاء، ومنح الأعمدة كان يسمح له بكتابة `stamps` و`rewards_used` و
-- `total_visits` بأي قيمة. و`staff_stamp` يقرأ `stamps` من الصفّ نفسه —
-- فبطاقة بـ٩٩٩ ختماً تُستبدل بجائزة فوراً. خسارة نقدية مباشرة.
--
-- التريجر `zz_guard_rate` كان يكبح المعدّل ولم يكن يحرس القيم إطلاقاً.
--
-- `card_code` يُحترم كما ورد من المتصفح: `newCardCode()` في
-- app/src/lib/data.ts يولّده بأبجدية خالية من المحارف الملتبسة (0/O و1/I/L)
-- لأن الكاشير يقرؤه ويكتبه. التوليد هنا للحالة التي يغيب فيها فقط.
create or replace function public.loyalty_enrol_guard()
returns trigger
language plpgsql security definer set search_path to 'public', 'extensions'
as $$
declare
  v_owner uuid;
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code text := '';
  i int;
begin
  select user_id into v_owner from public.restaurants where id = new.restaurant_id;

  -- صاحب المطعم (والمؤسس) يضبط بطاقات زبائنه كما يشاء من لوحته.
  if v_owner is not null and auth.uid() is not null
     and (auth.uid() = v_owner or public.is_founder()) then
    return new;
  end if;

  new.stamps       := 0;
  new.total_visits := 0;
  new.rewards_used := 0;

  if new.card_code is null or btrim(new.card_code) = '' then
    for i in 1..6 loop
      v_code := v_code || substr(v_alphabet,
                                 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;
    new.card_code := v_code;
  end if;

  return new;
end;
$$;
revoke all on function public.loyalty_enrol_guard() from public, anon, authenticated;

drop trigger if exists loyalty_enrol_guard on public.loyalty_customers;
create trigger loyalty_enrol_guard
  before insert on public.loyalty_customers
  for each row execute function public.loyalty_enrol_guard();

-- ٢) أكواد الخصم كانت مكشوفة للعلن (كانت مستغَلّة فعلاً)
--
-- `promo_codes` كانت مقروءة لدور anon بشرط `active = true`، والمفتاح العام
-- مضمَّن في كل صفحة — أي أن أي شخص يفتح `/rest/v1/promo_codes` ويستلم كل
-- كود ونسبة خصمه. لا شيء انكسر: التحقق يتم في `paylink-create` بمفتاح
-- الخدمة، ولوحة المؤسس تقرأ بجلسة مصادَقة.
drop policy if exists promos_select on public.promo_codes;
create policy promos_select on public.promo_codes
  for select to authenticated
  using ((select public.is_founder()));
revoke all on public.promo_codes from anon;

-- ٣) تضييق EXECUTE على دوال لا تناديها أي واجهة
revoke all on function public.guard_slug_change() from public, anon, authenticated;
revoke all on function public.api_rate_hit(uuid, integer) from public, anon, authenticated;
revoke all on function public.founder_email() from public, anon, authenticated;
revoke all on function public.change_restaurant_slug(uuid, text) from public, anon;
grant  execute on function public.change_restaurant_slug(uuid, text) to authenticated;
revoke all on function public.set_staff_pin(uuid, text, text) from public, anon;
grant  execute on function public.set_staff_pin(uuid, text, text) to authenticated;

-- عدّاد نوافذ عام، لخدمة أي مسار كتابة عام مستقبلاً. (المسارات القائمة
-- يكبحها `guard_anon_insert_rate` أصلاً — لا تُضِف مكبحاً ثانياً فوقه.)
create or replace function public.abuse_hit(
  p_scope text, p_key uuid, p_limit integer, p_minutes integer default 60
) returns boolean
language plpgsql security definer set search_path to 'public'
as $$
declare
  w timestamptz := date_trunc('hour', now())
                 + (floor(extract(minute from now()) / greatest(p_minutes,1))
                    * greatest(p_minutes,1)) * interval '1 minute';
  c integer;
begin
  insert into public.abuse_throttle (scope, key_id, window_start, count)
  values (p_scope, p_key, w, 1)
  on conflict (scope, key_id, window_start)
  do update set count = public.abuse_throttle.count + 1
  returning count into c;
  if c % 100 = 0 then
    delete from public.abuse_throttle where window_start < now() - interval '1 day';
  end if;
  return c <= p_limit;
end;
$$;
revoke all on function public.abuse_hit(text, uuid, integer, integer)
  from public, anon, authenticated;


-- ═══ (ب) ما تراجعتُ عنه — ودرسه ═════════════════════════════════════
--
-- الهجرات الأربع الأولى كُتبت بعد قراءة فرع `main` القديم (تطبيق `web/`
-- الذي حُذف من هذا الفرع). فبدت أربعة مسارات «غير مستعملة» وهي في المنتج
-- الحقيقي حمّالة، فسُحبت ثم أُعيدت:
--
--   • `analytics` — إدراج anon: `trackMenuView`/`trackDishView` يُدرجان من
--     صفحة المنيو العامة. سحبُه قتل التتبّع كلّه.
--   • `subscriptions` — إدراج authenticated: `startTrial()` ينشئ تجربة
--     الثلاثة أيام لكل تاجر جديد، و`is_menu_published` تشترط اشتراكاً نشطاً
--     لنشر المنيو. حصرُه بالمؤسس كان يمنع كل تاجر جديد من نشر منيوه.
--     الحارس الحقيقي هو التريجر `guard_client_subscription`: يفرض
--     `plan_id='trial'` ومدّة ≤١٥ يوماً ومرّة واحدة لكل مستخدم مدى الحياة.
--     الباقة المدفوعة تبقى مستحيلة الإنشاء من المتصفح — وهذا هو المقصد.
--   • `is_menu_published` و`increment_dish_views` — تناديهما صفحة المنيو
--     العامة بدور anon.
--
-- وثلاث حمايات أضفتُها كانت موجودة أصلاً بأسماء لم أرَها، فأُزيل التكرار:
-- `guard_anon_insert_rate` (على analytics و loyalty_customers و
-- survey_responses) و`guard_client_error_rate`. مكبحان على جدول واحد
-- يعنيان رفضاً عند حدٍّ لم يقصده أحد.
--
-- الدرس: قبل سحب أي صلاحية، ابحث عن مناديها في المنتج الحيّ، وعدّد
-- التريجرات القائمة على الجدول. غياب المنادي في فرعٍ ما ليس غيابه.

-- الحالة النهائية للسياسات المتراجَع عنها (كما هي في القاعدة الآن):
drop policy if exists analytics_insert on public.analytics;
create policy analytics_insert on public.analytics
  for insert to anon, authenticated
  with check ((menu_id is not null) and private.menu_owned_by(menu_id, user_id));
grant insert on public.analytics to anon;

drop policy if exists subscriptions_insert on public.subscriptions;
create policy subscriptions_insert on public.subscriptions
  for insert to authenticated
  with check ((select public.is_founder()) or ((select auth.uid()) = user_id));

grant execute on function public.is_menu_published(text)     to anon, authenticated;
grant execute on function public.increment_dish_views(uuid)  to anon, authenticated;


-- ═══ (ج) مدّة التجربة: مصدر واحد ═══════════════════════════════════
--
-- كانت المدّة في مكانين لا يعرف أحدهما الآخر: `TRIAL_DAYS = 3` في الواجهة
-- تحسب `end_date` وترسله، و`guard_client_subscription` يقبل أي قيمة حتى
-- ١٥ يوماً. فمن يعدّل جسم الطلب يأخذ **خمسة أضعاف** ما تبيعه المنصّة، ومن
-- يرفع الثابت في الواجهة فوق ١٥ يكسر التسجيل بصمت.
--
-- الحلّ ليس تشديد الحدّ بل **نزع القرار من العميل**: القاعدة تحسب `end_date`
-- بنفسها وتتجاهل ما يصل. فلا حدّ يُتجاوز ولا ثابتان يتباعدان.
--
-- المدّة في `site_settings.billing.trial_days` ليغيّرها المؤسّس من لوحته بلا
-- هجرة ولا نشر، مقصوصة بين يوم و٣٠ يوماً.
create or replace function public.trial_days()
returns integer
language sql stable security definer set search_path to 'public'
as $$
  select least(30, greatest(1, coalesce(
    (select (value ->> 'trial_days')::int
       from public.site_settings where key = 'billing'), 3)))
$$;
revoke all on function public.trial_days() from public;
grant execute on function public.trial_days() to anon, authenticated;

create or replace function public.guard_client_subscription()
returns trigger
language plpgsql security definer set search_path to 'public'
as $$
begin
  if auth.uid() is null or public.is_founder() then
    return new;  -- الويبهوك بمفتاح الخدمة، والمؤسس
  end if;

  if new.user_id is distinct from auth.uid() then
    raise exception 'لا يمكن إنشاء اشتراك لمستخدم آخر';
  end if;
  if coalesce(new.plan_id, '') <> 'trial' then
    raise exception 'الاشتراك المدفوع يُنشأ من بوابة الدفع فقط';
  end if;
  if exists (select 1 from public.subscriptions
              where user_id = new.user_id and plan_id = 'trial') then
    raise exception 'استُخدمت التجربة المجانية مسبقاً';
  end if;

  -- ⬇️ تُفرض هنا ولا تُقرأ من الطلب إطلاقاً.
  new.start_date := now();
  new.end_date   := now() + (public.trial_days() || ' days')::interval;
  new.active     := true;
  return new;
end;
$$;

-- مُتحقَّق حيّاً بمستخدم حقيقي:
--   • طلب `plan_id:"standard"` من المتصفح  → مرفوض.
--   • طلب `trial` بـ`end_date` بعد ٣٦٥ يوماً → قُبل، ونزل الصفّ بـ**٣ أيام**.
--   • طلب تجربة ثانية                        → مرفوض.

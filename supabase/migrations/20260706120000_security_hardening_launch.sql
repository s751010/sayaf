-- ════════════════════════════════════════════════════════════
-- تقوية الأمان قبل الإطلاق (طُبّقت عبر Supabase MCP بتاريخ 2026-07-06):
-- 1) loyalty_customers: كانت مفتوحة بالكامل (قراءة/إدراج/تحديث للجميع)
-- 2) analytics: إدراج عام يبقى لكن بتحقق مرجعي (menu_id حقيقي يخص owner_id)
-- 3) فهرس فريد جزئي على payment_ref لمنع تكرار تفعيل الدفعات
-- 4) storage: إزالة سياسات listing العامة + قصر الرفع على المصادقين
-- 5) blog_posts: كانت (published OR true) تكشف المسودات + توحيد حارس المؤسس
-- ملاحظة: دالة menu_owned_by نُقلت لاحقاً إلى مخطط private
-- (انظر 20260706121000_move_menu_owned_by_to_private_schema.sql)
-- ════════════════════════════════════════════════════════════

-- ── 1) loyalty_customers ──
drop policy if exists loyalty_founder_all on public.loyalty_customers;
drop policy if exists loyalty_read on public.loyalty_customers;
drop policy if exists loyalty_insert on public.loyalty_customers;
drop policy if exists loyalty_update on public.loyalty_customers;

-- القراءة: صاحب المطعم أو المؤسس فقط (أرقام الجوالات بيانات خاصة)
create policy loyalty_select on public.loyalty_customers
  for select to authenticated
  using (
    exists (
      select 1 from public.restaurants r
      where r.id = loyalty_customers.restaurant_id
        and r.user_id = (select auth.uid())
    )
    or (select public.is_founder())
  );

-- تسجيل عميل من صفحة المنيو العامة: فقط لمطعم حقيقي مفعّل فيه الولاء
create policy loyalty_insert on public.loyalty_customers
  for insert to anon, authenticated
  with check (
    restaurant_id is not null
    and exists (
      select 1 from public.restaurants r
      where r.id = loyalty_customers.restaurant_id
        and r.loyalty_enabled = true
    )
  );

create policy loyalty_update on public.loyalty_customers
  for update to authenticated
  using (
    exists (
      select 1 from public.restaurants r
      where r.id = loyalty_customers.restaurant_id
        and r.user_id = (select auth.uid())
    )
    or (select public.is_founder())
  )
  with check (
    exists (
      select 1 from public.restaurants r
      where r.id = loyalty_customers.restaurant_id
        and r.user_id = (select auth.uid())
    )
    or (select public.is_founder())
  );

create policy loyalty_delete on public.loyalty_customers
  for delete to authenticated
  using (
    exists (
      select 1 from public.restaurants r
      where r.id = loyalty_customers.restaurant_id
        and r.user_id = (select auth.uid())
    )
    or (select public.is_founder())
  );

-- ── 2) analytics ──
-- دالة security definer حتى لا يعتمد التحقق على سياسات RLS لجدول menus
create or replace function public.menu_owned_by(mid uuid, uid uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.menus m
    where m.id = mid
      and (uid is null or m.user_id = uid)
  );
$$;

revoke all on function public.menu_owned_by(uuid, uuid) from public;
grant execute on function public.menu_owned_by(uuid, uuid) to anon, authenticated;

drop policy if exists own_analytics on public.analytics;
drop policy if exists analytics_public_insert on public.analytics;
drop policy if exists analytics_founder_read on public.analytics;

create policy analytics_select on public.analytics
  for select to authenticated
  using ((select auth.uid()) = user_id or (select public.is_founder()));

create policy analytics_insert on public.analytics
  for insert to anon, authenticated
  with check (menu_id is not null and public.menu_owned_by(menu_id, user_id));

create policy analytics_update on public.analytics
  for update to authenticated
  using ((select auth.uid()) = user_id or (select public.is_founder()))
  with check ((select auth.uid()) = user_id or (select public.is_founder()));

create policy analytics_delete on public.analytics
  for delete to authenticated
  using ((select auth.uid()) = user_id or (select public.is_founder()));

-- ── 3) منع تكرار تفعيل الدفعات (منح المؤسس تكرر 'founder-grant' فتُستثنى) ──
create unique index if not exists subscriptions_payment_ref_key
  on public.subscriptions (payment_ref)
  where payment_ref is not null and payment_ref <> 'founder-grant';

-- ── 4) storage: البكتات عامة والملفات تُخدم بالرابط العام دون RLS ──
drop policy if exists public_read_dish on storage.objects;
drop policy if exists public_read_menu on storage.objects;
drop policy if exists menu_images_public_read on storage.objects;
drop policy if exists public_read_restaurant on storage.objects;
drop policy if exists auth_upload_dish on storage.objects;
drop policy if exists auth_upload_menu on storage.objects;
drop policy if exists auth_upload_restaurant on storage.objects;
drop policy if exists menu_images_auth_insert on storage.objects;

create policy images_auth_insert on storage.objects
  for insert to authenticated
  with check (bucket_id in ('dish-images','menu-images','restaurant-images'));

-- ── 5) blog_posts ──
drop policy if exists blog_read on public.blog_posts;
drop policy if exists blog_founder_write on public.blog_posts;

create policy blog_select on public.blog_posts
  for select to anon, authenticated
  using (published = true or (select public.is_founder()));

create policy blog_insert on public.blog_posts
  for insert to authenticated
  with check ((select public.is_founder()));

create policy blog_update on public.blog_posts
  for update to authenticated
  using ((select public.is_founder()))
  with check ((select public.is_founder()));

create policy blog_delete on public.blog_posts
  for delete to authenticated
  using ((select public.is_founder()));

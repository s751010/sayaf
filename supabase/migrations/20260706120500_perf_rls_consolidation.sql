-- ════════════════════════════════════════════════════════════
-- تحسين أداء RLS (طُبّقت عبر Supabase MCP بتاريخ 2026-07-06):
-- * سياسة واحدة لكل جدول+عملية بدل السياسات المتكررة (68 تحذيراً)
-- * (select auth.uid()) / (select public.is_founder()) بدل الاستدعاء
--   المباشر حتى لا يُعاد تقييمها لكل صف (13 تحذير auth_rls_initplan)
-- * فهرسة المفاتيح الأجنبية غير المفهرسة (4)
-- القراءة العامة using(true) على dishes/menus/restaurants مقصودة
-- (صفحة المنيو العامة) وتحافظ على السلوك الحالي حرفياً.
-- ════════════════════════════════════════════════════════════

-- ── dishes ──
drop policy if exists dishes_founder_all on public.dishes;
drop policy if exists dishes_own on public.dishes;
drop policy if exists dishes_owner on public.dishes;
drop policy if exists own_dishes on public.dishes;
drop policy if exists dishes_public_read on public.dishes;
drop policy if exists public_dishes on public.dishes;

create policy dishes_select on public.dishes
  for select to anon, authenticated using (true);
create policy dishes_insert on public.dishes
  for insert to authenticated
  with check ((select auth.uid()) = user_id or (select public.is_founder()));
create policy dishes_update on public.dishes
  for update to authenticated
  using ((select auth.uid()) = user_id or (select public.is_founder()))
  with check ((select auth.uid()) = user_id or (select public.is_founder()));
create policy dishes_delete on public.dishes
  for delete to authenticated
  using ((select auth.uid()) = user_id or (select public.is_founder()));

-- ── menus ──
drop policy if exists menus_founder_all on public.menus;
drop policy if exists menus_own on public.menus;
drop policy if exists menus_owner on public.menus;
drop policy if exists own_menus on public.menus;
drop policy if exists menus_public_read on public.menus;
drop policy if exists public_menus on public.menus;

create policy menus_select on public.menus
  for select to anon, authenticated using (true);
create policy menus_insert on public.menus
  for insert to authenticated
  with check ((select auth.uid()) = user_id or (select public.is_founder()));
create policy menus_update on public.menus
  for update to authenticated
  using ((select auth.uid()) = user_id or (select public.is_founder()))
  with check ((select auth.uid()) = user_id or (select public.is_founder()));
create policy menus_delete on public.menus
  for delete to authenticated
  using ((select auth.uid()) = user_id or (select public.is_founder()));

-- ── restaurants ──
drop policy if exists restaurants_founder_all on public.restaurants;
drop policy if exists restaurants_own on public.restaurants;
drop policy if exists restaurants_public_read on public.restaurants;

create policy restaurants_select on public.restaurants
  for select to anon, authenticated using (true);
create policy restaurants_insert on public.restaurants
  for insert to authenticated
  with check ((select auth.uid()) = user_id or (select public.is_founder()));
create policy restaurants_update on public.restaurants
  for update to authenticated
  using ((select auth.uid()) = user_id or (select public.is_founder()))
  with check ((select auth.uid()) = user_id or (select public.is_founder()));
create policy restaurants_delete on public.restaurants
  for delete to authenticated
  using ((select auth.uid()) = user_id or (select public.is_founder()));

-- ── announcements ──
drop policy if exists announcements_founder_all on public.announcements;
drop policy if exists announcements_read on public.announcements;

create policy announcements_select on public.announcements
  for select to anon, authenticated
  using (status = 'active' or (select public.is_founder()));
create policy announcements_insert on public.announcements
  for insert to authenticated with check ((select public.is_founder()));
create policy announcements_update on public.announcements
  for update to authenticated
  using ((select public.is_founder())) with check ((select public.is_founder()));
create policy announcements_delete on public.announcements
  for delete to authenticated using ((select public.is_founder()));

-- ── promo_codes ──
drop policy if exists promos_founder_all on public.promo_codes;
drop policy if exists promos_read on public.promo_codes;

create policy promos_select on public.promo_codes
  for select to anon, authenticated
  using (active = true or (select public.is_founder()));
create policy promos_insert on public.promo_codes
  for insert to authenticated with check ((select public.is_founder()));
create policy promos_update on public.promo_codes
  for update to authenticated
  using ((select public.is_founder())) with check ((select public.is_founder()));
create policy promos_delete on public.promo_codes
  for delete to authenticated using ((select public.is_founder()));

-- ── revenue_log (الكتابة من المؤسس أو service role فقط) ──
drop policy if exists revenue_founder_all on public.revenue_log;
drop policy if exists revenue_own on public.revenue_log;

create policy revenue_select on public.revenue_log
  for select to authenticated
  using ((select auth.uid()) = user_id or (select public.is_founder()));
create policy revenue_insert on public.revenue_log
  for insert to authenticated with check ((select public.is_founder()));
create policy revenue_update on public.revenue_log
  for update to authenticated
  using ((select public.is_founder())) with check ((select public.is_founder()));
create policy revenue_delete on public.revenue_log
  for delete to authenticated using ((select public.is_founder()));

-- ── site_settings ──
drop policy if exists site_settings_founder_all on public.site_settings;
drop policy if exists settings_read on public.site_settings;

create policy settings_select on public.site_settings
  for select to anon, authenticated using (true);
create policy settings_insert on public.site_settings
  for insert to authenticated with check ((select public.is_founder()));
create policy settings_update on public.site_settings
  for update to authenticated
  using ((select public.is_founder())) with check ((select public.is_founder()));
create policy settings_delete on public.site_settings
  for delete to authenticated using ((select public.is_founder()));

-- ── subscriptions (الكتابة من المؤسس أو service role فقط) ──
drop policy if exists subscriptions_founder_all on public.subscriptions;
drop policy if exists subscriptions_own_read on public.subscriptions;

create policy subscriptions_select on public.subscriptions
  for select to authenticated
  using ((select auth.uid()) = user_id or (select public.is_founder()));
create policy subscriptions_insert on public.subscriptions
  for insert to authenticated with check ((select public.is_founder()));
create policy subscriptions_update on public.subscriptions
  for update to authenticated
  using ((select public.is_founder())) with check ((select public.is_founder()));
create policy subscriptions_delete on public.subscriptions
  for delete to authenticated using ((select public.is_founder()));

-- ── support_tickets ──
drop policy if exists tickets_founder_all on public.support_tickets;
drop policy if exists tickets_insert on public.support_tickets;
drop policy if exists tickets_own_read on public.support_tickets;

create policy tickets_select on public.support_tickets
  for select to authenticated
  using ((select auth.uid()) = user_id or (select public.is_founder()));
create policy tickets_insert on public.support_tickets
  for insert to anon, authenticated
  with check (
    (select auth.uid()) = user_id
    or user_id is null
    or (select public.is_founder())
  );
create policy tickets_update on public.support_tickets
  for update to authenticated
  using ((select public.is_founder())) with check ((select public.is_founder()));
create policy tickets_delete on public.support_tickets
  for delete to authenticated using ((select public.is_founder()));

-- ── فهارس المفاتيح الأجنبية ──
create index if not exists dishes_restaurant_id_idx on public.dishes (restaurant_id);
create index if not exists dishes_user_id_idx on public.dishes (user_id);
create index if not exists menus_user_id_idx on public.menus (user_id);
create index if not exists support_tickets_user_id_idx on public.support_tickets (user_id);

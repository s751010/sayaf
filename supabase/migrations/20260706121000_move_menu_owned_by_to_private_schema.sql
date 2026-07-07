-- نقل دالة التحقق المرجعي إلى مخطط غير مكشوف عبر PostgREST
-- (تبقى قابلة للاستدعاء من سياسات RLS فقط، لا من /rest/v1/rpc)
create schema if not exists private;

create or replace function private.menu_owned_by(mid uuid, uid uuid)
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

revoke all on function private.menu_owned_by(uuid, uuid) from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.menu_owned_by(uuid, uuid) to anon, authenticated;

drop policy if exists analytics_insert on public.analytics;
create policy analytics_insert on public.analytics
  for insert to anon, authenticated
  with check (menu_id is not null and private.menu_owned_by(menu_id, user_id));

drop function if exists public.menu_owned_by(uuid, uuid);

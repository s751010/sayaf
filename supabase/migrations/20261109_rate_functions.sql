-- ═══════════════════════════════════════════════════════════════════
--  دوالّ حدّ المعدّل — ٢٠٢٦/١١/٠٩
--
--  ١. `abuse_rate_hit` و`order_rate_hit` **كما هما في القاعدة الحيّة**
--     (استخرجهما المدير بـ`pg_get_functiondef` يوم ٢٠٢٦/١١/٠٩). كانتا حيّتين
--     بلا مصدر في المستودع، و`paylink-order-create` تفشل مغلقةً (٥٠٣) بغياب
--     الثانية — فإعادة بناء القاعدة من الهجرات كانت تُطفئ كل طلب إلكتروني
--     (أمن ٢٠٢٦/١١/٠٩، البند ٤؛ `app/tests/rpc-defined.test.ts`).
--
--  ٢. حدّ الزائر (البندان ٢ و٥، بقرار المالك) **لا يحتاج DDL جديداً**:
--     `abuse_rate_hit` بنطاقَين جديدين — `orders_visitor` و`verify_visitor` —
--     ومفتاحٍ uuid من هاش العنوان (`_shared/visitor.ts`). لا يُخزَّن عنوان.
--
--  متكافئة: تُعاد بلا أثر. الصلاحيات كما في الحيّ: service_role وحده.
-- ═══════════════════════════════════════════════════════════════════

-- الجدول موجودٌ حيّاً؛ يُنشأ هنا لإعادة البناء وحدها (ولا يُمسّ إن وُجد).
do $$
begin
  if to_regclass('public.abuse_throttle') is null then
    create table public.abuse_throttle (
      scope        text        not null,
      key_id       uuid        not null,
      window_start timestamptz not null,
      count        integer     not null default 0,
      unique (scope, key_id, window_start)
    );
    alter table public.abuse_throttle enable row level security;
    revoke all on table public.abuse_throttle from public, anon, authenticated;
  end if;
end $$;

CREATE OR REPLACE FUNCTION public.abuse_rate_hit(p_scope text, p_key uuid, p_limit integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  w timestamptz := date_trunc('minute', now());
  c integer;
begin
  if p_key is null then return true; end if;

  insert into public.abuse_throttle (scope, key_id, window_start, count)
  values (p_scope, p_key, w, 1)
  on conflict (scope, key_id, window_start)
  do update set count = public.abuse_throttle.count + 1
  returning count into c;

  -- تنظيف كسول كل مئة نداء — الجدول لا ينمو والكلفة مُهمَلة.
  if c % 100 = 0 then
    delete from public.abuse_throttle where window_start < now() - interval '1 hour';
  end if;

  return c <= p_limit;
end;
$function$;

CREATE OR REPLACE FUNCTION public.order_rate_hit(p_restaurant uuid, p_limit integer)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public.abuse_rate_hit('orders', p_restaurant, p_limit);
$function$;

revoke all on function public.abuse_rate_hit(text, uuid, integer) from public, anon, authenticated;
revoke all on function public.order_rate_hit(uuid, integer) from public, anon, authenticated;
grant execute on function public.abuse_rate_hit(text, uuid, integer) to service_role;
grant execute on function public.order_rate_hit(uuid, integer) to service_role;

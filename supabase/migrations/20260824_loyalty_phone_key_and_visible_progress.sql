-- ═══════════════════════════════════════════════════════════════════════
-- (١) مفتاح الجوال: آخر تسعة أرقام · (٢) تقدّم البطاقة يصل الزبون
-- ═══════════════════════════════════════════════════════════════════════
--
-- ⚠️ **هذه الهجرة تصحّح سابقتها** (`20260824_loyalty_stamp_on_paid_order`)
-- وتكمّلها. وقد طُبِّقت الاثنتان على القاعدة الحيّة.
--
-- ═══ (١) العطل الذي كشفه الفحص الحيّ ═══
--
-- السابقة طابقت الجوال بـ«أرقامه فقط»، وادّعى تعليقها أن ذلك يوحّد صيغ
-- `05…` و`+966…`. **وهو لا يوحّدها**:
--
--   +966 50 111 2233  ⇒  966501112233
--   0501112233        ⇒  0501112233      ← مفتاح آخر لنفس الزبون
--
-- فحصٌ حيّ (في معاملة أُلغيت) على القاعدة أعطى **بطاقتين بختمٍ واحد لكلٍّ**
-- بدل بطاقة بختمين. أي أن الزبون الذي يكتب جواله بصيغة مختلفة في زيارته
-- الثانية يبدأ من الصفر — وهو أسوأ ما يفعله برنامج ولاء.
--
-- والقاعدة السعودية: تسعة أرقام بعد رمز الدولة (5XXXXXXXX)، تُكتب بأربع صيغ
-- شائعة (05… · 5… · 9665… · +9665…). و**آخر تسعة أرقام** تجمعها في مفتاح واحد.
-- مُتحقَّق حيّاً بالصيغ الثلاث + ويبهوك مكرّر ⇒ بطاقة واحدة · ٣ أختام.
--
-- ═══ (٢) ولاءٌ لا يراه صاحبه ليس ولاءً ═══
--
-- الختم صار تلقائياً، لكنه كان يقع في صمت: الزبون يدفع ويمضي ولا يعرف أنه
-- اقترب من مكافأة. فتُضاف `loyalty` إلى ردّ `order_public_status` لتعرضها
-- تذكرة الاستلام وصفحة `/o/:id` («ربحت ختماً · ٣ من ٥ · بقي طلبان»).
--
-- ولا تسريب: معرّف الطلب هو الصلاحية (§13)، والبطاقة المعادة **بطاقة صاحب
-- الطلب نفسه** تُطابَق بجواله، ولا يُعاد جوال ولا اسم — تقدّمٌ ورمزٌ يقرأه
-- الكاشير من الزبون.

-- ── (١) مفتاح المطابقة ──────────────────────────────────────────────
create or replace function public.phone_key(p_phone text)
returns text
language sql
immutable
parallel safe
as $$
  select right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 9);
$$;

comment on function public.phone_key(text) is
  'مفتاح مطابقة الجوال — آخر ٩ أرقام، فتتّحد صيغ 05… و+9665… لزبون واحد.';

create or replace function public.mark_order_paid(p_order uuid, p_ref text)
returns public.orders
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_order public.orders;
  v_prep  integer;
  v_rest  public.restaurants%rowtype;
  v_key   text;
  v_cust  uuid;
begin
  select coalesce(r.prep_minutes, 20) into v_prep
    from public.orders o join public.restaurants r on r.id = o.restaurant_id
   where o.id = p_order;

  update public.orders
     set status = 'new',
         paid_at = now(),
         payment_ref = p_ref,
         ready_eta = now() + make_interval(mins => coalesce(v_prep, 20))
   where id = p_order and status = 'pending_payment'
  returning * into v_order;

  -- الختم على الانتقال وحده ⇒ تكافؤٌ بالبناء (ويبهوك يصل مرّتين يختم مرّة).
  if v_order.id is not null then
    begin
      select * into v_rest from public.restaurants where id = v_order.restaurant_id;
      v_key := public.phone_key(v_order.customer_phone);

      if coalesce(v_rest.loyalty_enabled, false) and length(v_key) = 9 then
        select c.id into v_cust
          from public.loyalty_customers c
         where c.restaurant_id = v_rest.id
           and public.phone_key(c.phone) = v_key
         order by c.created_at
         limit 1
           for update;

        if v_cust is null then
          insert into public.loyalty_customers (restaurant_id, phone, name)
          values (v_rest.id,
                  regexp_replace(coalesce(v_order.customer_phone, ''), '\D', '', 'g'),
                  nullif(btrim(coalesce(v_order.customer_name, '')), ''))
          returning id into v_cust;
        end if;

        update public.loyalty_customers
           set stamps       = coalesce(stamps, 0) + 1,
               total_visits = coalesce(total_visits, 0) + 1,
               last_visit   = now()
         where id = v_cust;
      end if;
    exception
      when others then
        -- الدفعة أهمّ من الختم — ولا يبقى الفشل صامتاً.
        raise warning 'mark_order_paid: تعذّر ختم الولاء للطلب % — %', p_order, sqlerrm;
    end;
  end if;

  if v_order.id is null then
    select * into v_order from public.orders where id = p_order;
  end if;
  return v_order;
end;
$function$;

revoke all on function public.mark_order_paid(uuid, text) from public, anon, authenticated;
grant execute on function public.mark_order_paid(uuid, text) to service_role;

-- الفهرس يتبع المفتاح الجديد؛ والقديم (على الأرقام كلّها) لم يعد يُستعمَل.
drop index if exists public.loyalty_customers_phone_digits_idx;
create index if not exists loyalty_customers_phone_key_idx
  on public.loyalty_customers (restaurant_id, public.phone_key(phone));

-- ── (٢) التقدّم يصل الزبون ───────────────────────────────────────────
create or replace function public.order_public_status(p_order uuid)
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
  select jsonb_build_object(
    'code', o.code,
    'status', o.status,
    'total', o.total,
    'vat_included', o.vat_included,
    'created_at', o.created_at,
    'ready_eta', o.ready_eta,
    'restaurant', r.name,
    'restaurant_slug', r.slug,
    'restaurant_phone', r.phone,
    'address', r.address,
    'maps', r.social_maps,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
               'name', i.name, 'options', i.options_label,
               'qty', i.qty, 'line_total', i.line_total) order by i.name)
        from public.order_items i where i.order_id = o.id), '[]'::jsonb),
    'loyalty', case
      when coalesce(r.loyalty_enabled, false) then (
        select jsonb_build_object(
                 'stamps', coalesce(c.stamps, 0),
                 -- نفس حدّ `staff_stamp`: بين ١ و٢٠ مهما كتب التاجر.
                 'goal', least(20, greatest(1, coalesce(r.loyalty_goal, 5))),
                 'reward', r.loyalty_reward,
                 'card_code', c.card_code)
          from public.loyalty_customers c
         where c.restaurant_id = r.id
           and public.phone_key(c.phone) = public.phone_key(o.customer_phone)
         order by c.created_at
         limit 1)
      end)
    from public.orders o
    join public.restaurants r on r.id = o.restaurant_id
   where o.id = p_order
     and o.status <> 'pending_payment';
$function$;

comment on function public.order_public_status(uuid) is
  'حالة الطلب للزبون — حقول آمنة، ومعها تقدّم بطاقة ولائه (§13).';

-- ═══ ما تحقّق فعلاً على القاعدة الحيّة (معاملة أُلغيت بعدها) ═══
--
--   دفعة بـ«+966 50 111 2233»  ⇒ بطاقة جديدة · ختم ١
--   نداء ثانٍ لنفس الطلب       ⇒ ختم ١  (بلا مضاعفة)
--   دفعة بـ«0501112233»        ⇒ نفس البطاقة · ختم ٢
--   دفعة بـ«501112233»         ⇒ نفس البطاقة · ختم ٣
--   عدد البطاقات               ⇒ ١
--   وردّ order_public_status   ⇒ loyalty {goal:5, reward:'قهوة مجانية',
--                                        stamps:1, card_code:'H545NG'}

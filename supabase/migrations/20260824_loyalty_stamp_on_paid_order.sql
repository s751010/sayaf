-- ═══════════════════════════════════════════════════════════════════════
-- ختمُ ولاءٍ تلقائي عند كل دفعة إلكترونية
-- ═══════════════════════════════════════════════════════════════════════
--
-- ما كان: الختم فعلٌ يدويّ من الكاشير وحده (`staff_stamp` برمز الموظّف).
-- فالزبون الذي يدفع في المنيو **لا يمرّ بالكاشير أصلاً** — يستلم ويمضي. أي أن
-- أكثر زبائن المطعم التزاماً (دفعوا مقدَّماً) هم الوحيدون الذين لا تُختم
-- بطاقتهم. والولاء الذي لا يُختم لا يُعيد أحداً.
--
-- ما صار: كل انتقال طلبٍ إلى «مدفوع» يختم بطاقة صاحب الجوال في ذلك المطعم،
-- ويُنشئ له بطاقةً إن لم تكن له واحدة.
--
-- ═══ لماذا داخل `mark_order_paid` تحديداً ═══
--
-- لأنها **النقطة الوحيدة** التي يصير فيها الطلب مدفوعاً — يناديها
-- `order-verify` (عودة الزبون من البوّابة) و`paylink-webhook` (إشعار البوّابة)
-- كلتاهما. ووضعُ الختم في إحداهما يعني زبوناً يُختم وآخر لا يُختم حسب أيّهما
-- سبق. ووضعه في الواجهة يعني ختماً يُصنع من متصفّح الزبون.
--
-- ═══ لا ختم مضاعف — بالبناء لا بالفحص ═══
--
-- الشرط `status = 'pending_payment'` في التحديث يجعل الدالّة **متكافئة**:
-- النداء الثاني لا يطابق صفّاً فلا يعيد شيئاً. والختم معلَّق على ذلك التطابق
-- نفسه، فالويبهوك الذي يصل مرّتين (وهو يصل مرّتين) يختم مرّةً واحدة.
--
-- ⚠️ **والختم لا يُسقط دفعة أبداً.** كل ما يخصّ الولاء داخل كتلة استثناء
-- مبتلَعة: طلبٌ دُفع فعلاً يجب أن يُسجَّل مدفوعاً ولو انهار الولاء كلّه —
-- الأولوية للمال لا للزينة. ولا يبقى الفشل صامتاً: `raise warning` يكتبه في
-- سجلّ Postgres ليُقرأ من لوحة Supabase.

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
  v_phone text;
  v_cust  uuid;
begin
  select coalesce(r.prep_minutes, 20) into v_prep
    from public.orders o join public.restaurants r on r.id = o.restaurant_id
   where o.id = p_order;

  update public.orders
     set status = 'new',
         paid_at = now(),
         payment_ref = p_ref,
         -- الوعد يبدأ من لحظة الدفع لا من لحظة فتح السلة.
         ready_eta = now() + make_interval(mins => coalesce(v_prep, 20))
   where id = p_order and status = 'pending_payment'
  returning * into v_order;

  -- ═══ الختم — على الانتقال وحده ═══
  if v_order.id is not null then
    begin
      select * into v_rest
        from public.restaurants
       where id = v_order.restaurant_id;

      -- أرقام فقط: الجوال يُكتب بصيغ شتّى (٠٥٠… · +٩٦٦… · بفواصل)، والمطابقة
      -- على النصّ الخام تُنشئ بطاقةً ثانية لنفس الزبون في كل صيغة يكتبها.
      v_phone := regexp_replace(coalesce(v_order.customer_phone, ''), '\D', '', 'g');

      if coalesce(v_rest.loyalty_enabled, false) and length(v_phone) >= 9 then
        select c.id into v_cust
          from public.loyalty_customers c
         where c.restaurant_id = v_rest.id
           and regexp_replace(coalesce(c.phone, ''), '\D', '', 'g') = v_phone
         order by c.created_at
         limit 1
           for update;

        if v_cust is null then
          -- بطاقة جديدة: `loyalty_enrol_guard` يولّد `card_code` ويصفّر
          -- العدّادات (النداء بمفتاح الخدمة، أي `auth.uid()` فارغ) — فالزيادة
          -- أدناه تسري على الاثنين سواءً: الجديد والقديم.
          insert into public.loyalty_customers (restaurant_id, phone, name)
          values (v_rest.id, v_phone, nullif(btrim(coalesce(v_order.customer_name, '')), ''))
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
        -- ⚠️ الدفعة أهمّ من الختم: تُبتلع ويُترك أثرها في سجلّ الخادم.
        raise warning 'mark_order_paid: تعذّر ختم الولاء للطلب % — %', p_order, sqlerrm;
    end;
  end if;

  if v_order.id is null then
    select * into v_order from public.orders where id = p_order;
  end if;
  return v_order;
end;
$function$;

-- المنح كما كانت: خدمةً وحدها (`place_order` و`mark_order_paid` محجوبتان عن
-- الزائر والتاجر معاً — §13).
revoke all on function public.mark_order_paid(uuid, text) from public, anon, authenticated;
grant execute on function public.mark_order_paid(uuid, text) to service_role;

comment on function public.mark_order_paid(uuid, text) is
  'تسجيل دفعة طلب (متكافئة) — وتختم بطاقة الولاء على الانتقال وحده (§13 · §الولاء).';

-- فهرس المطابقة بالجوال: بحثٌ على تعبيرٍ لا على العمود، فبلا هذا الفهرس يُمسح
-- جدول زبائن المطعم كاملاً عند كل دفعة.
create index if not exists loyalty_customers_phone_digits_idx
  on public.loyalty_customers (restaurant_id, (regexp_replace(coalesce(phone, ''), '\D', '', 'g')));

-- ═══ كيف تتأكّد بعد التطبيق ═══
--
-- ١) طلبٌ تجريبي بجوال زبون، ثم:
--      select stamps, total_visits, card_code from public.loyalty_customers
--       where restaurant_id = '<المطعم>' order by last_visit desc limit 1;
--    ⇐ ختمٌ واحد بعد الدفعة الأولى.
--
-- ٢) **والتكافؤ**: نادِ `mark_order_paid` على نفس الطلب مرّتين ⇒ `stamps`
--    لا تزيد في الثانية (وهذا ما يحدث فعلاً حين يصل ويبهوك PayLink مكرّراً).
--
-- ٣) ومطعمٌ بـ`loyalty_enabled = false` ⇒ لا بطاقة تُنشأ ولا ختم.
--
-- ═══ حدٌّ معروف، يُذكر ولا يُخفى ═══
--
-- دفعتان لنفس الجوال **في اللحظة نفسها** قد تُنشئان بطاقتين: القفل
-- (`for update`) لا يمسك صفّاً غير موجود بعد. ولم أضع قيد تفرّد على
-- (المطعم، أرقام الجوال) لأنه يفشل على أي صفّين مكرّرين قائمين اليوم — وذاك
-- تنظيفٌ يسبق القيد لا يتبعه. والأثر عند وقوعه: بطاقتان تُقرأ إحداهما
-- (`order by created_at limit 1`)، لا ختمٌ ضائع ولا دفعةٌ تسقط.

-- ═══════════════════════════════════════════════════════════════════
--  تحصين ما قبل الإطلاق — ٢٠٢٦/٠٨/٢٠
--  مطبَّق فعلاً على المشروع wjqpsbpebpntpeinqccl عبر أربع هجرات:
--    20260820131110_harden_subscriptions_promos_analytics
--    20260820131142_loyalty_enrol_guard_and_public_write_throttle
--    20260820131230_tighten_rpc_execute_grants
--    20260820131906_throttle_client_error_reports
--  هذا الملف نسخة مجمّعة للمرجع — القاعدة هي المصدر الحيّ.
-- ═══════════════════════════════════════════════════════════════════

-- ① الاشتراكات: منع الترقية الذاتية من المتصفح.
drop policy if exists subscriptions_insert on public.subscriptions;
create policy subscriptions_insert on public.subscriptions
  for insert to authenticated with check ((select public.is_founder()));

-- ② أكواد الخصم: لم تعد مقروءة لدور الزائر.
drop policy if exists promos_select on public.promo_codes;
create policy promos_select on public.promo_codes
  for select to authenticated using ((select public.is_founder()));
revoke all on public.promo_codes from anon;

-- ③ التحليلات: الكتابة عبر track_menu_view فقط.
drop policy if exists analytics_insert on public.analytics;
create policy analytics_insert on public.analytics
  for insert to authenticated
  with check ((menu_id is not null)
              and (((select auth.uid()) = user_id) or (select public.is_founder())));
revoke insert, update, delete on public.analytics from anon;

-- ④⑤⑦ الحرّاس والمكابح — انظر تعريفات الدوال في القاعدة:
--   public.abuse_hit(text, uuid, integer, integer)
--   public.loyalty_enrol_guard()   → trigger على loyalty_customers
--   public.survey_throttle()       → trigger على survey_responses
--   public.client_error_throttle() → trigger على client_errors

-- ⑥ تضييق EXECUTE على دوال SECURITY DEFINER (تفاصيلها في الهجرة الثالثة).

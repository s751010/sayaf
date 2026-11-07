-- قيد لون العلامة: `restaurants.cover_color` نصٌّ حرّ يصل إلى `style` في دليل
-- المطاعم. الواجهة تفحصه، وهذا الحارس في القاعدة نفسها (LAUNCH.md ⇐ د٢).
--
-- ✅ مطبَّقة على claudmenu في ٢٠٢٦/١١/٠٧ بإذن المالك، باسم
-- `restaurants_cover_color_hex`. المطاعم الثلاثة كلّها صالحة قبلها، فتحقّق القيد
-- على الصفوف القائمة أيضاً (`validate`).

alter table public.restaurants add constraint restaurants_cover_color_hex
  check (cover_color is null or cover_color ~ '^#[0-9a-fA-F]{6}$') not valid;
alter table public.restaurants validate constraint restaurants_cover_color_hex;

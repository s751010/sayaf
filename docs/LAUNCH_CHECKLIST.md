# قائمة الإطلاق — كلاود منيو 🚀

آخر تحديث: 2026-07-07. كل ما هو مُنجز ✅ تم تطبيقه فعلياً على قاعدة البيانات
والدوال المنشورة. المتبقي ☐ خطوات يدوية على المالك قبل استقبال أول عميل يدفع.

---

## ما أُنجز تلقائياً ✅

- [x] **تأمين RLS بالكامل** — `get_advisors(security)` نظيف (باستثناء مفتاح يدوي واحد أدناه):
  - `loyalty_customers`: كانت قراءةً وتعديلاً مفتوحة للجميع (أرقام جوالات العملاء + نقاطهم).
    الآن: القراءة/التعديل/الحذف لصاحب المطعم والمؤسس فقط، وتسجيل عميل جديد من صفحة
    المنيو ممكن فقط لمطعم حقيقي مفعّل فيه الولاء.
  - `analytics`: الإدراج العام أصبح مرجعياً (يتطلب menu_id حقيقياً يخص المطعم).
  - `blog_posts`: كانت المسودات غير المنشورة مكشوفة للعموم — أُغلقت.
  - Storage: أُزيلت سياسات listing العامة وقُصر الرفع على المستخدمين المسجلين.
- [x] **أداء قاعدة البيانات** — 68 سياسة RLS متكررة → 0، و13 تحذير `auth_rls_initplan` → 0،
  وفهرسة 4 مفاتيح أجنبية.
- [x] **سد ثغرة تفعيل الاشتراك المجاني** — فهرس فريد على `subscriptions.payment_ref` +
  `moyasar-webhook` v3 (مصادقة secret_token + إعادة جلب الدفعة من API ميسر + منع تكرار).
- [x] **بنية دفع موحدة بأربع بوابات** — edge function `payments` (create/verify) منشورة،
  والمؤسس يختار البوابة النشطة من `/founder/settings`.
- [x] error boundaries عربية + robots يمنع `/dashboard` و`/founder` + sitemap يشمل المدونة.

---

## المتبقي عليك قبل الإطلاق ☐

### 1) أسرار Supabase (الأهم)
Supabase Dashboard → Edge Functions → Secrets — أضف:

| السر | القيمة | مطلوب لـ |
|------|--------|----------|
| `MOYASAR_SK` | المفتاح السرّي من لوحة ميسر (`sk_test_` الآن، `sk_live_` عند الإطلاق) | ميسر + الـwebhook |
| `MOYASAR_WEBHOOK_SECRET` | رمز عشوائي طويل تولّده بنفسك | الـwebhook |
| `APP_BASE_URL` | `https://cloudsmenu.netlify.app` (أو الدومين المخصص لاحقاً) | كل بوابات التحويل |
| `PAYLINK_API_ID` + `PAYLINK_SECRET_KEY` | من لوحة Paylink بعد فتح حساب تاجر | باي لينك |
| `PAYTABS_PROFILE_ID` + `PAYTABS_SERVER_KEY` | من لوحة PayTabs السعودية | باي تابس |
| `MYFATOORAH_API_KEY` | من بوابة MyFatoorah السعودية | ماي فاتورة |

> ⚠️ حتى تُضبط `MOYASAR_SK` و`MOYASAR_WEBHOOK_SECRET`، الـwebhook يرفض كل الطلبات (503)
> وتفعيل اشتراكات ميسر عبر صفحة الرجوع لن يعمل. هذه أول خطوة بعد قراءة هذا الملف.
> البوابات التي لم تُضبط أسرارها تظهر للتاجر برسالة «بوابة الدفع غير متاحة حالياً» — لا يتعطل شيء.

### 2) لوحة ميسر
- [ ] Webhooks → أضف endpoint:
  `https://wjqpsbpebpntpeinqccl.supabase.co/functions/v1/moyasar-webhook`
  واضبط secret token = نفس قيمة `MOYASAR_WEBHOOK_SECRET`.
- [ ] عند الإطلاق الفعلي: بدّل `NEXT_PUBLIC_MOYASAR_PK` في Netlify إلى `pk_live_...`
  و`MOYASAR_SK` في Supabase إلى `sk_live_...`.

### 3) حسابات بوابات الدفع الأخرى (حسب رغبتك — كلها اختيارية ما دامت ميسر تعمل)
- [ ] **Paylink** — paylink.sa: سجل تجاري/معروف، ثم انسخ `apiId` و`secretKey`.
  للتجربة قبل التفعيل: اضبط `PAYLINK_BASE_URL=https://restpilot.paylink.sa` مع بيانات pilot.
- [ ] **PayTabs السعودية** — merchant.paytabs.sa: انسخ `profile_id` وServer Key.
- [ ] **MyFatoorah السعودية** — انسخ API Token من بوابة الحساب السعودي.
  للتجربة: `MYFATOORAH_BASE_URL=https://apitest.myfatoorah.com` مع مفتاح الاختبار.

### 4) Supabase Auth
- [ ] Dashboard → Authentication → Passwords → فعّل **Leaked password protection**
  (آخر تحذير أمني متبقٍ في get_advisors).

### 5) Netlify (تأكيد فقط — لا جديد)
- [ ] المتغيرات الأربعة مضبوطة: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_MOYASAR_PK`, `FOUNDER_EMAIL`.

### 6) اختبار نهائي قبل الإعلان
- [ ] من `/founder/settings` اختر البوابة النشطة.
- [ ] نفّذ عملية اشتراك حقيقية واحدة (99 ر.س، قابلة للاسترداد) عبر البوابة المختارة
  وتأكد أن: الاشتراك تفعّل في `/dashboard`، وظهر في `/founder` (الإيرادات).
- [ ] افتح منيو عام وامسح QR وتأكد من تسجيل المشاهدات في الإحصائيات.

---

## كيف يعمل الدفع الآن (للمرجع)

1. التاجر يختار باقة في `/dashboard/billing`.
2. **ميسر:** نموذج مدمج في الصفحة. **البوابات الأخرى:** زر يحوّله لصفحة دفع مستضافة
   (تنشئها دالة `payments` سيرفرياً — السعر لا يمر من المتصفح أبداً).
3. بعد الدفع يعود إلى `/dashboard/billing/callback` التي تتحقق من الدفعة
   **سيرفر-لسيرفر بالمفتاح السرّي** ثم تفعّل الاشتراك وتسجّل الإيراد.
4. لو أغلق التاجر المتصفح قبل الرجوع: webhook ميسر يفعّل الاشتراك كشبكة أمان.
   منع التكرار مضمون بفهرس فريد على `payment_ref` — لا تفعيل مزدوج ولا إيراد مكرر.

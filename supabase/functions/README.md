# دوال الحافة (Supabase Edge Functions)

مصدر الدوال التي تعتمد عليها `web/` و`app/`. **نشرها يدوي** — الملفات هنا مصدر
فقط ولا تُنشر تلقائياً بأي بناء.

| الدالة | `verify_jwt` | الغرض |
|---|---|---|
| `paylink-create` | **true** | إنشاء فاتورة PayLink وإرجاع رابط الدفع |
| `paylink-webhook` | **false** | المكان الوحيد الذي يُفعَّل فيه اشتراك |
| `founder-admin` | **false** | وكيل PostgREST للوحة المؤسس، محمي بسرّ |

---

## 1. الأسرار المطلوبة

```bash
supabase secrets set \
  PAYLINK_ENV=test \
  PAYLINK_API_ID=APP_ID_xxxxxxxxx \
  PAYLINK_SECRET_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx \
  SITE_URL=https://cloudsmenu.netlify.app \
  FOUNDER_SECRET=<سلسلة عشوائية ٣٢ محرفاً فأكثر>
```

`SUPABASE_URL` و`SUPABASE_ANON_KEY` و`SUPABASE_SERVICE_ROLE_KEY` تُحقن تلقائياً
من المنصة — لا تضِفها يدوياً.

### بيئة PayLink

| `PAYLINK_ENV` | القاعدة | المفاتيح |
|---|---|---|
| `test` (الافتراضي) | `https://restpilot.paylink.sa` | التجريبية الموثّقة لدى PayLink |
| `production` | `https://restapi.paylink.sa` | من [my.paylink.sa](https://my.paylink.sa) |

الانتقال للإنتاج = تغيير `PAYLINK_ENV` والمفاتيح فقط. لا يوجد أي مفتاح دفع في
كود المتصفح، فلا يحتاج الانتقال إعادة بناء للواجهة.

## 2. النشر

```bash
supabase functions deploy paylink-create                 # verify_jwt افتراضياً
supabase functions deploy paylink-webhook --no-verify-jwt
supabase functions deploy founder-admin  --no-verify-jwt
```

## 3. ربط الويبهوك

من لوحة [my.paylink.sa](https://my.paylink.sa) ← إعدادات الويبهوك، ضع:

```
https://wjqpsbpebpntpeinqccl.supabase.co/functions/v1/paylink-webhook
```

---

## لماذا هذا التقسيم؟

**المبلغ لا يأتي من المتصفح أبداً.** العميل يرسل `plan_id` و`cycle` فقط،
و`paylink-create` يشتقّ السعر من `_shared/plans.ts`. هذا يمنع تكرار خلل النسخة
القديمة الذي كان يعرض سعراً سنوياً ويخصم آخر.

**التفعيل لا يحدث في المتصفح أبداً.** في النسخة القديمة كان المتصفح يُدخل صف
`subscriptions` بنفسه بعد الدفع، ما يعني أن أي مستخدم مسجَّل يستطيع منح نفسه
باقة مدفوعة مجاناً. الآن `paylink-webhook` وحده يكتب، وبمفتاح الخدمة.

**ويبهوك PayLink بلا توقيع.** دليل PayLink لا يوثّق أي هاش أو توقيع للتحقق من
أصل النداء، فأي جهة تستطيع استدعاء الرابط بجسم مزوَّر. لذلك لا يُصدَّق جسم
الويبهوك: تُؤخذ منه `transactionNo` فقط، ثم تُسأل PayLink عبر `getInvoice`
بمفاتيحنا الخاصة، ويُقارَن رقم الطلب المحفوظ داخل الفاتورة. لا يمكن إنشاء فاتورة
تحت حسابنا بلا `PAYLINK_SECRET_KEY` — وهذا أساس الثقة.

**تكافؤ العمليات.** تعيد PayLink إرسال الويبهوك حتى عشر مرات حتى تصلها 200،
فتتحقق الدالة من `payment_ref` قبل إنشاء أي صف.

## قيود معروفة

- `founder-admin` يعتمد **سرّاً مشتركاً** واحداً، وهو أضعف من حارسَي `web/`
  (بريد مؤكَّد + `is_founder()` في RLS). الدالة هنا لتُعيد لوحة المؤسس في
  `app/` للعمل؛ ونقل `app/` إلى نموذج `web/` هو التحسين التالي الموصى به.
- جدول الأسعار مكرَّر في ثلاثة أماكن (`_shared/plans.ts`، `web/src/lib/plans.ts`،
  `app/src/lib/plans.ts`) لأن دوال الحافة لا تشارك حزمة مع الواجهتين. أي تعديل
  سعر يجب أن يمرّ على الثلاثة.

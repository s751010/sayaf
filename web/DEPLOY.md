# نشر كلاود منيو (web/) على Netlify

> ⚠️ **مهم:** هذا تطبيق **Next.js يعمل على الخادم (SSR)** — لا يُرفع بالسحب والإفلات
> مثل النسخة القديمة `public/`. يجب نشره عبر **ربط Git** حتى يبنيه Netlify ويشغّل
> الـ SSR والـ Middleware (Proxy) والمسارات الديناميكية مثل `/[slug]`.

---

## 1) اربط المستودع بـ Netlify

1. Netlify → **Add new site** → **Import an existing project** → اختر مستودع GitHub.
2. اختر الفرع المطلوب نشره.
3. الإعدادات تُقرأ تلقائياً من `netlify.toml` في جذر المستودع:
   - **Base directory:** `web`
   - **Build command:** `npm run build`
   - **Node version:** `22`
   - Netlify يكتشف Next.js ويُلحق وقت تشغيله (`@netlify/plugin-nextjs`) تلقائياً —
     **لا تضبط `publish` يدوياً** (ضبطه على `.next` يسبّب 404 على كل المسارات).

> إن لم يُقرأ `netlify.toml` لأي سبب، اضبط يدوياً في الـ UI: Base directory = `web`.

---

## 2) أضِف متغيّرات البيئة

في Netlify → **Site settings → Environment variables**، أضِف (انظر `.env.example`):

| المتغيّر | الوصف |
|---------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | رابط مشروع Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | مفتاح anon (JWT) العام |
| `NEXT_PUBLIC_MOYASAR_PK` | مفتاح Moyasar — `pk_live_…` للإطلاق الفعلي |
| `FOUNDER_EMAIL` | بريد المؤسس (يفتح `/founder`) |

> بدون متغيّرات Supabase سيُبنى الموقع لكن لن تعمل المصادقة/البيانات.

---

## 3) أطلق النشر

اضغط **Deploy**. بعد نجاح البناء سيعمل:
- صفحة الهبوط `/` والمدوّنة (ثابتة/ISR).
- منيو المطاعم `/[slug]` (SSR طازج كل 60 ثانية).
- لوحة التاجر `/dashboard/*` ولوحة المؤسس `/founder` (ديناميكية مع جلسات الكوكيز).

---

## 4) ربط الدفع (Moyasar)

في لوحة Moyasar → **Webhooks**، أضِف رابط الدالة:
`https://wjqpsbpebpntpeinqccl.supabase.co/functions/v1/moyasar-webhook`
حتى يُفعَّل الاشتراك تلقائياً عند نجاح الدفع.

---

## قبل الإطلاق الفعلي ✅
- [ ] استبدل `pk_test` بـ `pk_live` في `NEXT_PUBLIC_MOYASAR_PK`.
- [ ] اربط الدومين المخصّص في Netlify (Domain settings).
- [ ] اختبر دورة اشتراك كاملة تنتهي بتفعيل الاشتراك.

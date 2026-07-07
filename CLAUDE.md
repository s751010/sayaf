# CLAUDE.md — CloudMenu (كلاود منيو)

منيو رقمي QR للمطاعم السعودية. هذا الملف هو المرجع الإلزامي لأي عمل على المشروع.
اقرأه بالكامل قبل أي تعديل.

---

## 1. البنية الأساسية (Architecture)

- **المصدر الحيّ الوحيد هو تطبيق Next.js في `web/`.** مبني بـ **Next.js 16 + React 19 +
  Tailwind 4 + Supabase SSR**، منظّم بمكوّنات وصفحات وserver actions قابلة للقراءة والتطوير.
- **النشر:** Netlify مربوط بـ Git، يبني من `web/` تلقائياً (`netlify.toml` بالجذر: `base="web"`).
  الدومين: `https://cloudsmenu.netlify.app/`.
- **الأرشيف:** النسخة القديمة كانت ملف HTML واحد مصغّر (~1.49MB) يُنشر يدوياً. أُرشِف في
  `legacy/public/index.html` ولم يعد يُطوَّر أو يُنشر. لا تعدّله؛ استخدمه للمرجع فقط.
- اللغة: عربية RTL، خطوط Google (Cairo, Tajawal, …).

### قاعدة ذهبية للعمل اليومي
> كل تطوير يتم في `web/` بكود مصدري نظيف. أي حقل/جدول جديد يجب أن يتوافق مع مخطط
> Supabase الحقيقي (تحقّق عبر Supabase MCP)، وأي عملية مؤسس محميّة بحارسين: `isFounder()`
> في التطبيق **و** قفل RLS في قاعدة البيانات.

---

## 2. الـBackend (Supabase)

- Project ref: `wjqpsbpebpntpeinqccl` — URL: `https://wjqpsbpebpntpeinqccl.supabase.co`
- **Supabase Auth حقيقي** (جلسات عبر cookies، `@supabase/ssr`) — لا localStorage session.
- الوصول عبر **Supabase JS SDK** (`.from(...).select/insert/update/delete`) لا fetch يدوي.
  - عميل عام للقراءة: `createPublicServerClient()` — `web/src/lib/supabase/server.ts`
  - عميل مصادَق مربوط بالكوكيز: `createServerSupabase()` — نفس الملف
- تحديث الجلسة عبر proxy: `web/src/proxy.ts` + `web/src/lib/supabase/proxy.ts`

**الجداول الحقيقية (12، مؤكّدة من قاعدة البيانات):**
`restaurants`, `menus`, `dishes`, `analytics`, `subscriptions`, `announcements`,
`promo_codes`, `support_tickets`, `revenue_log`, `site_settings`, `blog_posts`,
`loyalty_customers`. (ملاحظة: لا يوجد جدول `survey_responses`.)

### الأمان (RLS)
- كل الجداول عليها RLS مفعّل. جداول المؤسس (`announcements`, `promo_codes`, `revenue_log`,
  `support_tickets`, `blog_posts`) مقفولة للكتابة/القراءة الحسّاسة عبر دالة
  `public.is_founder()` التي تقارن `auth.jwt()->>'email'` ببريد المؤسس.
- بيانات المطعم (`restaurants/menus/dishes/analytics/subscriptions/loyalty_customers`)
  مقيّدة بـ `auth.uid() = user_id` (كل تاجر يرى بياناته فقط)، مع قراءة عامة لصفحة المنيو.
- عند أي تعديل DDL: شغّل `get_advisors(security)` عبر Supabase MCP وتأكّد من عدم ظهور
  تحذيرات `rls_policy_always_true`.

### حارس المؤسس
- بريد المؤسس: `seeaf2013@gmail.com` (متغيّر `FOUNDER_EMAIL`).
- في التطبيق: `isFounder()` — `web/src/lib/founder.ts`، يُستخدم في كل صفحات وactions `/founder`.
- في قاعدة البيانات: دالة `is_founder()` في سياسات RLS. الحارسان معاً = دفاع بعمق.

### المدفوعات (4 بوابات — ميسر، Paylink، PayTabs، MyFatoorah)
- **البوابة النشطة** يختارها المؤسس من `/founder/settings` وتُخزَّن في
  `site_settings.features.payment_provider` (الافتراضي `moyasar`). تعريف البوابات في
  `web/src/lib/payments.ts`.
- **مسار التفعيل الوحيد هو edge function `payments`** (المصدر في `supabase/functions/payments/`):
  - `op=create`: ينشئ صفحة دفع مستضافة لدى البوابة النشطة (السعر يُحسب سيرفرياً) ويرجع
    رابط التحويل. ميسر مستثناة (نموذج مدمج في المتصفح عبر `moyasar-form.tsx`).
  - `op=verify`: تحقق سيرفر-لسيرفر بالمفتاح السرّي ثم تفعيل idempotent (فهرس فريد جزئي
    على `subscriptions.payment_ref`) + تسجيل `revenue_log`. تُستدعى من صفحة الرجوع
    `web/src/app/dashboard/billing/callback/page.tsx`.
  - **لا شيء يُرسل من العميل يفعّل اشتراكاً** — الخطة/المستخدم/الدورة تُقرأ من `orderRef`
    المرمّز سيرفرياً وترجعه البوابة، أو من metadata ميسر المؤكدة من API ميسر.
- `moyasar-webhook` (v3، المصدر في `supabase/functions/moyasar-webhook/`) شبكة أمان فقط:
  مصادقة `secret_token` + إعادة جلب الدفعة من API ميسر + نفس التفعيل الـidempotent.
  منشورة بـ `verify_jwt=false` (المصادقة عبر السرّ — النمط القياسي للـwebhooks).
- **أسرار البوابات في Supabase → Edge Functions → Secrets حصراً** (لا Netlify ولا الكود):
  `MOYASAR_SK`, `MOYASAR_WEBHOOK_SECRET`, `PAYLINK_API_ID`, `PAYLINK_SECRET_KEY`,
  `PAYTABS_PROFILE_ID`, `PAYTABS_SERVER_KEY`, `MYFATOORAH_API_KEY`, `APP_BASE_URL`
  (+ `*_BASE_URL` اختيارية للبيئات التجريبية). غياب سر البوابة النشطة = رد
  `provider_unconfigured` ورسالة عربية للتاجر (تدهور آمن).
- مفتاح النشر العام لميسر يُقرأ من `NEXT_PUBLIC_MOYASAR_PK`. لا يزال `pk_test`
  (بطلب المالك). عند الإطلاق ضع `pk_live_...` في Netlify.
- **قاعدة إلزامية:** `PRICES` في `supabase/functions/payments/index.ts` و
  `supabase/functions/moyasar-webhook/index.ts` يجب أن تطابق `PLANS` في
  `web/src/lib/plans.ts` حرفياً (standard 99/1089، premium 199/2189، سنوي = شهري × 11).
  أي تغيير سعر يُطبَّق في الملفات الثلاثة معاً ثم يُعاد نشر الدالتين عبر MCP.
- قائمة الإطلاق الكاملة (حسابات التجار، ضبط الأسرار، webhook ميسر): `docs/LAUNCH_CHECKLIST.md`.

---

## 3. القواعد الإلزامية (Mandatory Rules)

### (أ) أي حقل جديد لأي جدول = مصدر واحد صريح للحقول
الكتابة تتم بكائن `fields` صريح في server action (مثال: `saveDish` في
`web/src/app/dashboard/actions.ts`). أضِف الحقل في: (1) كائن `fields`، (2) نموذج الإدخال،
(3) العرض للزبون إن كان يظهر له، (4) تأكّد من وجود العمود في Supabase. حقل غير مذكور في
`fields` يُسقَط بصمت.

### (ب) عمليات المؤسس محميّة بحارسين
أي server action للمؤسس يبدأ بـ `founderClient()` (يتحقق من `isFounder()`)، وأي جدول
مؤسس مقفول في RLS بـ `is_founder()`. لا تكتفِ بحارس التطبيق — RLS مفتوح = ثغرة.

### (ج) التحقق قبل الدفع
شغّل من داخل `web/`: `npm run build && npx tsc --noEmit && npm run lint` — يجب أن تمرّ كلها.

### (د) خريطة الوكلاء (AI Advisory Personas)
المصدر: `web/src/lib/personas.ts`. أي تعديل على شخصية يبقي `id` ثابتاً (يمر عبر `ai-proxy`).

---

## 4. سير العمل الموصى به (Workflow) قبل أي push
1. طوّر في `web/` بكود مصدري.
2. إن أضفت حقلاً: طبّق القاعدة (أ).
3. إن كانت عملية مؤسس: طبّق القاعدة (ب) (حارس تطبيق + RLS).
4. نفّذ التحقق — القاعدة (ج) — وشغّل `get_advisors` بعد أي DDL.
5. commit برسالة واضحة ثم push على الفرع المخصّص فقط.

## 5. ملاحظات وتحذيرات
- لا تعدّل `legacy/` — أرشيف فقط.
- المفاتيح العامة (anon JWT, Moyasar pk) آمنة للواجهة. لا تكشف أسراراً في logs/commits.
- عند لمس المدفوعات/الجلسة/سياسات RLS: راجع المالك قبل الدفع.

## 6. بنية المستودع (Repo layout)

| المسار | الغرض |
|------|-------|
| `web/` | تطبيق Next.js — **المصدر الحيّ الوحيد** |
| `web/src/app/` | الصفحات وserver actions (`/`, `/[slug]`, `/dashboard`, `/founder`, `/blog`) |
| `web/src/components/` | مكوّنات (site, menu, dashboard, founder, billing, ui) |
| `web/src/lib/` | منطق مشترك (supabase, founder, entitlements, plans, personas, themes) |
| `web/.env.example` | متغيّرات البيئة المطلوبة على Netlify |
| `supabase/functions/` | مصادر edge functions المُدارة من المستودع (`payments`, `moyasar-webhook`) — تُنشر عبر Supabase MCP |
| `supabase/migrations/` | نسخ migrations المطبّقة عبر MCP (سجل مرجعي) |
| `docs/LAUNCH_CHECKLIST.md` | قائمة ما قبل الإطلاق (أسرار، حسابات بوابات، إعدادات) |
| `netlify.toml` | إعداد النشر (`base="web"`) |
| `legacy/public/` | الموقع المصغّر القديم (أرشيف، لا يُنشر) |
| `legacy/check_html_js.mjs` | أداة فحص الملف المصغّر القديم (أرشيف) |

### متغيّرات البيئة (Netlify → Environment variables)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `FOUNDER_EMAIL`,
`NEXT_PUBLIC_MOYASAR_PK`. انظر `web/.env.example`.

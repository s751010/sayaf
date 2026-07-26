# CLAUDE.md — CloudMenu (كلاود منيو)

منيو رقمي QR للمطاعم السعودية. هذا الملف هو المرجع الإلزامي لأي عمل على المشروع.
اقرأه بالكامل قبل أي تعديل.

---

## 1. البنية الأساسية (Architecture)

- **المصدر الحيّ الوحيد هو تطبيق Next.js في `web/`.** مبني بـ **Next.js 16 + React 19 +
  Tailwind 4 + Supabase SSR**، منظّم بمكوّنات وصفحات وserver actions قابلة للقراءة والتطوير.
- **النشر:** Netlify مربوط بـ Git، يبني من `web/` تلقائياً (`netlify.toml` بالجذر:
  `base="web"` + `publish=".next"` + plugin محوّل Next مثبَّت صراحةً — الاكتشاف
  التلقائي معطّل في هذا الموقع وبدونه تظهر 404 على كل مسار).
  الدومين الحالي: `https://cloudsmenu.netlify.app/` (مؤقت حتى شراء دومين رسمي —
  عند التغيير عدّل `SITE_URL` في `web/src/lib/site.ts` و`app/src/lib/config.ts`،
  وهو موحّد الآن بين النسختين بعد أن كانت `web/` تستخدم دومين `cloudmenuy` مختلفاً).
- **الأرشيف:** النسخة القديمة ملف HTML واحد مصغّر (~1.49MB) كان يُنشر يدوياً وكان
  هو الموقع الرسمي حتى استُبدل بـ`web/`. أُرشِف في `legacy/public/index.html`.
  لا تعدّله؛ استخدمه للمرجع فقط. أخطاؤه موثّقة في `ANALYSIS-COMPARISON.md`.
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

**الجداول الحقيقية (14، مؤكّدة من قاعدة البيانات):**
`restaurants`, `menus`, `dishes`, `analytics`, `subscriptions`, `announcements`,
`promo_codes`, `support_tickets`, `revenue_log`, `site_settings`, `blog_posts`,
`loyalty_customers`, `survey_responses`, `restaurant_payment_settings`.

- `survey_responses` — تقييمات الزبائن. الكتابة للزائر، والقراءة لصاحب المطعم
  أو المؤسس فقط. `avg_score` مقيَّد بـ CHECK بين ١ و٥ فلا يُزوَّر من المتصفح.
- `restaurant_payment_settings` — بيانات اعتماد PayLink لكل مطعم. **بلا أي
  سياسة قراءة لدور `anon`**؛ تقرأها دالة الحافة بمفتاح الخدمة فقط. لا تنقل هذه
  الحقول إلى `restaurants` أبداً — قراءته عامّة (`qual = true`) فيتسرّب السرّ.
- عمودان مشتقّان على `restaurants` تزامنهما قاعدة البيانات ولا تُكتب يدوياً:
  `online_payment_enabled` (بمُشغِّل من جدول الدفع) و`has_secret` (عمود محسوب).

### الأمان (RLS)
- كل الجداول عليها RLS مفعّل. جداول المؤسس (`announcements`, `promo_codes`, `revenue_log`,
  `support_tickets`, `blog_posts`) مقفولة للكتابة/القراءة الحسّاسة عبر دالة
  `public.is_founder()` التي تقارن `auth.jwt()->>'email'` ببريد المؤسس.
- بيانات المطعم (`restaurants/menus/dishes/analytics/subscriptions/loyalty_customers`)
  مقيّدة بـ `auth.uid() = user_id` (كل تاجر يرى بياناته فقط)، مع قراءة عامة لصفحة المنيو.
- عند أي تعديل DDL: شغّل `get_advisors(security)` عبر Supabase MCP وتأكّد من عدم ظهور
  تحذيرات `rls_policy_always_true`.

#### صلاحيات على مستوى العمود (لا تكفي RLS وحدها)
RLS تضبط الصفوف لا الأعمدة. لذا `user_id` محجوب عن دور `anon` بمنح صريح على
`restaurants` و`menus` و`dishes` — كان يصل للمتصفح داخل صفحة المنيو العامة.
**النتيجة العملية: `select("*")` يفشل لدور الزائر.** أي استعلام عام يجب أن يذكر
الأعمدة صراحةً عبر `PUBLIC_RESTAURANT_COLUMNS` / `PUBLIC_MENU_COLUMNS` /
`PUBLIC_DISH_COLUMNS` في `web/src/lib/types.ts` (ونظائرها في `app/src/lib/data.ts`).
إضافة عمود عام جديد = تحديث المنح في قاعدة البيانات **و** القائمة في الكود.

تسجيل المشاهدات يمر بدالة `public.track_menu_view(menu_id)` (SECURITY DEFINER)
التي تستنتج مالك القائمة بنفسها — فلا يحتاج المتصفح معرفة `user_id` إطلاقاً.

### حارس المؤسس
- بريد المؤسس: `seeaf2013@gmail.com` (متغيّر `FOUNDER_EMAIL`).
- في التطبيق: `isFounder()` — `web/src/lib/founder.ts`، يُستخدم في كل صفحات وactions `/founder`.
- في قاعدة البيانات: دالة `is_founder()` في سياسات RLS. الحارسان معاً = دفاع بعمق.

### المدفوعات (PayLink)
البوابة **PayLink** (`paylink.sa`) — حلّت محل Moyasar في `web/` و`app/` معاً.

- **لا يوجد أي مفتاح دفع في المتصفح.** `PAYLINK_API_ID` و`PAYLINK_SECRET_KEY`
  أسرارُ خادم في أسرار دوال Supabase حصراً. راجع `supabase/functions/README.md`.
- **المبلغ لا يُرسل من العميل أبداً**: الواجهة ترسل `plan_id` + `cycle` فقط،
  ودالة `paylink-create` تشتقّ السعر من `supabase/functions/_shared/plans.ts`.
- **التفعيل لا يحدث في المتصفح أبداً**: `paylink-webhook` وحده يكتب في
  `subscriptions` و`revenue_log` بمفتاح الخدمة، بعد التحقق من الفاتورة عبر
  `getInvoice` (ويبهوك PayLink بلا توقيع، فلا يُصدَّق جسمه).
- **أكواد الخصم** تُتحقَّق من جدول `promo_codes` داخل `paylink-create`، ويُحتسب
  الاستخدام في الويبهوك بعد نجاح الدفع فقط.
- التبديل للإنتاج = تغيير `PAYLINK_ENV` والمفاتيح في أسرار الدوال. لا إعادة بناء.

> ⚠️ جدول الأسعار مكرَّر في ثلاثة أماكن (`_shared/plans.ts`, `web/src/lib/plans.ts`,
> `app/src/lib/plans.ts`) لأن دوال الحافة لا تشارك حزمة مع الواجهتين.
> **أي تعديل سعر يجب أن يمرّ على الثلاثة** وإلا اختلف المعروض عن المخصوم.

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
- المفتاح العام (anon JWT) آمن للواجهة. مفاتيح PayLink أسرار خادم — لا تضعها في
  أي ملف داخل `web/` أو `app/`، ولا تكشف أسراراً في logs/commits.
- عند لمس المدفوعات/الجلسة/سياسات RLS: راجع المالك قبل الدفع.

## 6. بنية المستودع (Repo layout)

| المسار | الغرض |
|------|-------|
| `web/` | تطبيق Next.js — **المصدر الحيّ الوحيد** |
| `web/src/app/` | الصفحات وserver actions (`/`, `/[slug]`, `/dashboard`, `/founder`, `/blog`) |
| `web/src/components/` | مكوّنات (site, menu, dashboard, founder, billing, ui) |
| `web/src/lib/` | منطق مشترك (supabase, founder, entitlements, plans, personas, themes) |
| `web/.env.example` | متغيّرات البيئة المطلوبة على Netlify |
| `supabase/functions/` | مصدر دوال الحافة (PayLink + founder-admin) — **تُنشر يدوياً** |
| `app/` + `deploy/` | نسخة SPA ثابتة — خطة رجوع سريعة، تُنشر بسحب `deploy/` يدوياً |
| `netlify.toml` | إعداد النشر (`base="web"`) |
| `legacy/public/` | الموقع المصغّر القديم (أرشيف، لا يُنشر) |
| `legacy/check_html_js.mjs` | أداة فحص الملف المصغّر القديم (أرشيف) |

### متغيّرات البيئة (Netlify → Environment variables) — تخص نشر `web/` فقط
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `FOUNDER_EMAIL`.
انظر `web/.env.example`. (نسخة v2 في `app/` لا تحتاج أياً منها.)
أسرار الدفع ليست هنا — مكانها أسرار دوال Supabase (`supabase/functions/README.md`).

---

## 7. النسخة v2 — `app/` (المصدر) + `deploy/` (الناتج) = **خطة رجوع**، لا هدف النشر

SPA ثابتة بـ **Vite + React 18 + TypeScript + Tailwind v4**، تُنشر بالسحب المباشر
بلا متغيّرات بيئة. **لم تعد هدف البناء**: `netlify.toml` يبني `web/`.

تُنشر بسحب مجلد `deploy/` يدوياً إلى Netlify (السحب اليدوي لا يقرأ `netlify.toml`).

**بلغت تكافؤ الميزات مع `web/`**: التقييمات (استبيان الزبون + صفحة تحليل للتاجر)،
سلة الطلب وخيارات الأطباق والإرسال عبر واتساب والدفع الإلكتروني للطلب، الإعلانات،
تذاكر الدعم (إرسال من التاجر + ردّ من المؤسس)، أكواد الخصم، ولوحة مؤسس كاملة
(نظرة عامة وإيرادات، المطاعم والاشتراكات، الدعم، الخصومات، الإعلانات، المدونة).

⚠️ **اسحب المجلد كاملاً لا ملفاته**: `_redirects` هو ما يجعل `/login` و`/dashboard`
و`/<slug>` تعمل. بدونه يعطي الموقع 404 على كل مسار عدا الجذر — وهذا بالضبط سبب
عطل «الموقع ما عاد يدخّلني» في نشرة يوليو ٢٠٢٦ اليدوية.

- **`app/`** — الكود المصدري. `npm run build` داخلها يبني إلى `deploy/` بجذر المستودع.
- **`deploy/`** — الناتج الجاهز (ملتزَم في git): اسحب المجلد كاملاً إلى Netlify وانتهى.
  يحتوي `_redirects` (SPA fallback للـ slug) و`_headers` (CSP، خطوط ذاتية الاستضافة عبر
  @fontsource) وPWA (manifest + sw + أيقونات) وSEO.
- **نفس خلفية Supabase تماماً** لكن **بدون SDK** — نداءات `fetch` مباشرة لـ PostgREST/GoTrue
  في `app/src/lib/api.ts` + `session.ts`. المفاتيح العامة مضمّنة في `app/src/lib/config.ts`.
  نفس عقود `ai-proxy` (body `{system,messages,temperature}` → `{text}`) و`founder-admin`
  (ترويسة `x-founder-secret` + body `{table,method,query,body}`)، ونفس عقد الولاء
  (`loyalty_customers`: `card_code/stamps/total_visits/rewards_used`).
- **القاعدة (أ) مطبقة هيكلياً**: whitelists الكتابة في `app/src/lib/data.ts`
  (`DishPayload`, `RestaurantSettingsPayload`, `SupportTicketPayload`) هي مصدر الحقول
  الوحيد للإضافة والتحديث معاً — حقل جديد يُضاف هناك + في فورم
  `Dishes.tsx`/`Settings.tsx` + عمود Supabase.
- **خيارات الأطباق**: `app/src/lib/options.ts` بنفس شكل `web/src/lib/options.ts`
  (`[{id,name,type,required,items:[{id,name,price}]}]`). المعرّفات إلزامية: دالة
  `paylink-order-create` تطابق `option_ids` القادمة من السلة لتعيد حساب السعر بنفسها.
  القارئ يتسامح مع الأشكال القديمة (نص حر/مصفوفة مسطّحة) فلا تختفي بيانات سابقة.
- **التسعير**: من `app/src/lib/plans.ts` — باقتان (99/199) مطابقة لـ `web/src/lib/plans.ts`
  ولجدول الأسعار في `supabase/functions/_shared/plans.ts`. الدفع عبر PayLink، وبيئته
  الافتراضية `test` حتى يضبط المالك `PAYLINK_ENV=production` في أسرار الدوال.
- جلسة v2 بمفتاح `cm2_session`. سر المؤسس يبقى `cm_fsecret` في sessionStorage — لا يُضمَّن أبداً.
- **التحقق قبل الدفع (v2)**: من داخل `app/`: `npm run build` (يشمل `tsc --noEmit`) يجب أن يمرّ.
- `web/` (Next.js) تبقى في المستودع كمرجع/بديل؛ إن أردت نشرها اضبط موقع Netlify منفصلاً
  بـ Base directory = web + متغيّرات البيئة أعلاه.

# CLAUDE.md — CloudMenu (كلاود منيو)

منيو رقمي QR للمطاعم السعودية. هذا الملف هو المرجع الإلزامي لأي عمل على المشروع.

---

## 1. البنية

**نسخة واحدة فقط:** `app/` — Vite 6 + React 18 + TypeScript + Tailwind v4، SPA عربية RTL.
البناء يخرج إلى `deploy/` (ملتزَم في git) وهو ما يُنشر على Netlify.

```
app/src/
  main.tsx              نقطة الدخول (خطوط، ثيم، service worker)
  App.tsx               الراوتر + AuthProvider + ToastProvider + ErrorBoundary
  pages/
    Landing.tsx         صفحة الهبوط + PricingCards (مُعاد استخدامها في Billing)
    MenuPage.tsx        المنيو العام /:slug — أهم صفحة في المنتج
    Demo.tsx            منيو تجريبي حي /demo (بيانات محلية، بدون شبكة)
    Login.tsx  Blog.tsx  BlogPost.tsx  Help.tsx  NotFound.tsx  Founder.tsx
    dashboard/          Dashboard(shell) Overview Dishes Menus Qr Analytics
                        Loyalty Ai Billing Settings
  components/
    ui.tsx              نظام التصميم: Button Card Badge Field Input Modal Toast…
    site.tsx            Logo / Navbar / Footer
    ImageUploader.tsx   رفع الصور (ضغط + Supabase Storage)
    ErrorBoundary.tsx   يمنع الشاشة البيضاء
  lib/
    api.ts              rest() restCount() askAI() founderAdmin() ApiError
    data.ts             كل الاستعلامات + whitelists الكتابة
    session.ts auth.tsx GoTrue بدون SDK + سياق React
    config.ts plans.ts entitlements.ts themes.ts personas.ts types.ts utils.ts
    storage.ts          مفاتيح localStorage/sessionStorage الموحّدة (K)
```

اللغة: عربية RTL. الخطوط ذاتية الاستضافة عبر `@fontsource` (لا Google Fonts).
الثيم: رموز دلالية في `styles/global.css` تنقلب مع `data-theme` (داكن افتراضي).

---

## 2. الـBackend — Supabase

Project ref: `wjqpsbpebpntpeinqccl` · URL في `app/src/lib/config.ts`.
**لا يوجد SDK** — كل شيء عبر `fetch` مباشرة إلى PostgREST، ويمر من دالة واحدة:
`rest<T>()` في `app/src/lib/api.ts`. لا تنادِ `fetch` مباشرة من صفحة.

**الجداول:** `restaurants` `menus` `dishes` `analytics` `subscriptions`
`revenue_log` `support_tickets` `site_settings` `blog_posts` `loyalty_customers`
`promo_codes` `announcements` `survey_responses` `restaurant_payment_settings`.

**Edge Functions المنشورة فعلياً** (مؤكَّدة من لوحة Supabase):
`ai-proxy` · `founder-admin` · `moyasar-webhook` · `notify-support` ·
`dynamic-task` · `payments` · `paylink-create` · `paylink-webhook` ·
`paylink-order-create`.

> `founder-admin` **موجود ونشط**. (توثيق قديم في `web/MIGRATION.md` كان يقول
> غير ذلك — كان خطأً، والمجلد حُذف.)
> دوال `paylink-*` و `payments` وجدول `restaurant_payment_settings` موجودة في
> الخلفية لكن **لا تستدعيها الواجهة بعد** — الدفع داخل المنيو لم يُوصَل.

**Storage buckets** (موجودة، عامة للقراءة، الكتابة لـ `authenticated`):
`dish-images` · `menu-images` · `restaurant-images`.

---

## 3. القواعد الإلزامية

### (أ) الحقل الجديد لازم يمر بثلاثة أماكن
الكتابة تتم بكائن payload صريح (whitelist)، وأي مفتاح غير مذكور **يُسقَط بصمت**.
في v2 هذا مفروض هيكلياً عبر نوعين في `app/src/lib/data.ts`:

- `DishPayload` — يستخدمه `createDish` و `updateDish` معاً.
- `RestaurantSettingsPayload` — يستخدمه `updateRestaurant`.

لإضافة حقل: (1) عمود في Supabase → (2) الحقل في `types.ts` → (3) الحقل في
الـPayload المناسب → (4) الحقل في الفورم. **وإن كان يُعرض للزبون: أضِف عرضه في
`MenuPage.tsx` أيضاً** — حفظه لا يكفي.

### (ب) فحص الأنواع بعد كل تعديل
```bash
cd app && npm run typecheck
```
`npm run build` يشغّل `tsc --noEmit` قبل `vite build`، فأي خطأ نوع يوقف النشر.
`tsconfig.json` يفعّل `strict` و `noUnusedLocals` و `noUnusedParameters`.

### (ج) لا تكسر حالات التحميل
كل قائمة تُجلب من الشبكة تستخدم `null` كإشارة «يُحمَّل الآن» و`[]` كإشارة «فارغ
فعلاً». خلط الاثنين يعرض «لا توجد بيانات» للمستخدم أثناء التحميل. الصلاحيات
(`entitlements`) لها `ent.loading` — لا تعرض جدار ترقية قبل أن تُحسم.

### (د) خريطة الوكلاء (AI Advisory Personas)
مطابقة لـ `app/src/lib/personas.ts`. الـ`id` ثابت ولا يتغيّر.

| id | الاسم | الدور | إيموجي | اللون |
|---|---|---|---|---|
| `all` | الفريق كاملاً | جميع الأعضاء | 👥 | `#D4A843` |
| `ceo` | أحمد | المدير التنفيذي | 👔 | `#D4A843` |
| `cmo` | نورة | مديرة التسويق | 📣 | `#F472B6` |
| `cto` | فارس | مدير التقنية | 💻 | `#60A5FA` |
| `cfo` | ريم | مديرة المالية | 💰 | `#34D399` |
| `cs` | خالد | مدير نجاح العملاء | 🤝 | `#A78BFA` |
| `growth` | سلمى | محللة النمو | 📊 | `#F97316` |

---

## 4. التسعير والمدفوعات

باقتان في `app/src/lib/plans.ts` — **مصدر واحد، لا تكرّره**:

| id | الاسم | شهري | سنوي (×11) | قوائم | أصناف | AI | ولاء | EN |
|---|---|---|---|---|---|---|---|---|
| `standard` | الأساسية | 99 | 1089 | 1 | 100 | ❌ | ❌ | ❌ |
| `premium` | الاحترافية | 199 | 2189 | ∞ | ∞ | ✅ | ✅ | ✅ |

- Moyasar: `MOYASAR_PK` في `config.ts` لا يزال `pk_test` مع `TODO(production)`.
  الواجهة تعرض تنبيه «وضع الاختبار» تلقائياً طالما المفتاح يبدأ بـ `pk_test`.
- المبلغ يُحوَّل لهللات (`*100`).
- ⚠️ **تنبيه محاسبي مفتوح:** `moyasar-webhook` يسجّل الإيراد بالسعر الشهري فقط
  (99/199). اشتراك سنوي بـ1089 يُسجَّل كـ99 في `revenue_log`. يحتاج إصلاحاً في
  الدالة قبل تفعيل الدفع الحقيقي.

---

## 5. التخزين المحلي

مفاتيح موحّدة في `app/src/lib/storage.ts` (استخدم `K` ولا تكتب المفتاح نصاً):

| المفتاح | المخزن | الغرض |
|---|---|---|
| `cm2_session` | localStorage | الجلسة (GoTrue) |
| `cm2_theme` | localStorage | الوضع الداكن/الفاتح |
| `cm_fsecret` | sessionStorage | سر المؤسس — **لا يُضمَّن في الكود أبداً** |
| `cm_table` | sessionStorage | رقم الطاولة من `?table=` |
| `cm2_loyalty_<id>` | localStorage | بطاقة ولاء الزبون محلياً |

---

## 6. سير العمل قبل أي push

1. نفّذ التعديل في `app/src`.
2. `cd app && npm run typecheck` — صفر أخطاء.
3. إن أضفت حقلاً: طبّق القاعدة (أ) كاملة.
4. `npm run build` لتحديث `deploy/` (النشر يقرأ منه).
5. commit + push على الفرع المخصّص.

---

## 7. ملاحظات وتحذيرات

- **لا تكشف** `cm_fsecret` في logs أو commits. مفتاح Supabase anon عام بطبيعته
  (محمي بـRLS)، لكن سر المؤسس ليس كذلك.
- عند لمس المدفوعات/الجلسة/سر المؤسس: راجع المالك قبل الدفع.
- `deploy/` يُعاد توليده بالكامل عند كل بناء (`emptyOutDir`)، فتوقّع diff كبيراً
  بأسماء ملفات مُهشَّرة جديدة. هذا طبيعي.
- حدود الباقات تُفحص في العميل فقط (`Dishes.tsx`/`Menus.tsx`) — استشارية لا أمنية.
  الحماية الحقيقية يجب أن تكون في RLS/تريجر على قاعدة البيانات.

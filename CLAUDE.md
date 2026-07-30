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
                        Loyalty Billing Settings
  components/
    ui.tsx              نظام التصميم: Button Card Badge Field Input Modal Toast…
    site.tsx            Logo / Navbar / Footer
    ImageUploader.tsx   رفع الصور (ضغط + Supabase Storage)
    OptionsEditor.tsx   الإضافات (صفوف اسم+سعر)
    AllergenPicker.tsx  مسببات الحساسية (اختيار بالضغط)
    HoursEditor.tsx     ساعات العمل يوماً بيوم
    SupportBox.tsx      الدعم الفني ← لوحة المؤسس
    ErrorBoundary.tsx   يمنع الشاشة البيضاء
  lib/
    api.ts              rest() restCount() uploadImage() founderAdmin() ApiError
    data.ts             كل الاستعلامات + whitelists الكتابة
    session.ts auth.tsx GoTrue بدون SDK + سياق React
    config.ts plans.ts entitlements.ts themes.ts types.ts utils.ts
    allergens.ts hours.ts nutrition.ts options.ts
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

**Edge Functions المنشورة فعلياً** (مؤكَّدة من لوحة Supabase؛ `ai-proxy`
موجودة لكن لم تُعد الواجهة تستدعيها بعد حذف المستشار الذكي):
`founder-admin` · `moyasar-webhook` · `notify-support` ·
`dynamic-task` · `payments` · `paylink-create` · `paylink-webhook` ·
`paylink-order-create`.

> `founder-admin` **موجود ونشط**. (توثيق قديم في `web/MIGRATION.md` كان يقول
> غير ذلك — كان خطأً، والمجلد حُذف.)
> دوال `paylink-*` و `payments` وجدول `restaurant_payment_settings` موجودة في
> الخلفية لكن **لا تستدعيها الواجهة بعد** — الدفع داخل المنيو لم يُوصَل.

**Storage buckets** (موجودة، عامة للقراءة، الكتابة لـ `authenticated`):
`dish-images` · `menu-images` · `restaurant-images`.

**دوال RPC مُضافة:** `increment_dish_views` (زيادة ذرّية؛ سياسة `dishes_update`
تمنع الزائر المجهول من PATCH مباشر) · `is_menu_published` (بوليان لقفل النشر) ·
`track_menu_view` (موجودة مسبقاً، غير مستخدَمة من الواجهة).

**صيغ مخزَّنة في أعمدة نصّية** — احترمها ولا تكتب فوقها نصاً حراً:
- `restaurants.working_hours` → JSON `{"sat":{"open","from","to"},…}`
  (بيانات إنتاج فعلية) · القارئ في `lib/hours.ts` يتسامح مع النص الحر.
- `menus.theme` → معرّف ثيم أو `custom:#RRGGBB` للثيم بلون العلامة.
- `dishes.options` → JSON `[{name,price?}]` · `lib/options.ts`.
- `dishes.allergens` → `text[]` بمعرّفات `lib/allergens.ts` (مع مرادفات عربية
  للصفوف القديمة).

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

### (د) الأعمدة المحسوبة — لا تُرسل لها قيمة أبداً
ثلاثة أعمدة في `dishes` هي `GENERATED ALWAYS AS … STORED`؛ إرسال أي قيمة لها
يجعل Postgres يرفض الطلب كاملاً («cannot insert a non-DEFAULT value…»):

| العمود | يُحسب من |
|---|---|
| `burn_minutes` | `round(calories / 4)` |
| `is_high_sodium` | `sodium_mg > 600` |
| `sfda_compliant` | `calories IS NOT NULL AND sodium_mg IS NOT NULL` |

اعرضها للتاجر عبر `lib/nutrition.ts` (يُكرّر التعبيرات حرفياً) ولا تطلبها منه.
كان `burn_minutes` مُدرجاً في `DishPayload` فكان **كل** حفظ طبق يفشل.

---

## 4. التسعير والمدفوعات

**باقة واحدة** في `app/src/lib/plans.ts` — مصدر واحد، لا تكرّره:

| id | الاسم | شهري | سنوي (×11) | المزايا |
|---|---|---|---|---|
| `standard` | كلاود منيو | 99 | 1089 | كل شيء بلا حدود |

- ⚠️ **لا تغيّر `id`**: `moyasar-webhook` يسعّر `standard` بـ99. تغييره قبل
  تعديل الدالة يسجّل الإيراد خطأً.
- Moyasar: `MOYASAR_PK` لا يزال `pk_test` مع `TODO(production)`.
- `ENFORCE_MENU_PUBLISHING` في `config.ts` مشتقّ من وضع الدفع: قفل نشر المنيو
  لغير المشتركين **معطَّل** طالما البوابة تجريبية (وإلا أُطفئت منيوهات قائمة
  بلا طريقة للاشتراك)، ويصبح نشطاً تلقائياً مع `pk_live`.
- ⚠️ **تنبيه محاسبي مفتوح:** `moyasar-webhook` يسجّل الإيراد بالسعر الشهري فقط.
  اشتراك سنوي بـ1089 يُسجَّل كـ99 في `revenue_log`. يحتاج إصلاحاً في الدالة.

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

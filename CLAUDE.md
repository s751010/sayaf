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
    Login.tsx  ResetPassword.tsx  Stamp.tsx (وضع الكاشير العام)
    Blog.tsx  BlogPost.tsx  Help.tsx  NotFound.tsx
    dashboard/          Dashboard(shell) Overview Dishes Menus Qr Analytics
                        Loyalty Billing Settings
    founder/            Founder(shell+بوابة) Overview Merchants MerchantDetail
                        Money Comms Health
  components/
    ui.tsx              نظام التصميم: Button Card Badge Field Input Modal Toast…
    site.tsx            Logo / Navbar / Footer / PreviewMenuButton
    menu/MenuHeader.tsx  ترويسة المنيو: قوس/شريط سدو/إطار/ناعم
    menu/DishCard.tsx    بطاقة الطبق بثلاثة تخطيطات (شبكة/قائمة/عرض)
    menu/DishOfTheDay.tsx بطاقة «طبق اليوم» للطبق المميّز الأول
    menu/ThemePreview.tsx معاينة الطابع المصغّرة في اللوحة
    ImageUploader.tsx   رفع صورة واحدة (يستورد الضغط من lib/image)
    BulkImages.tsx      رفع صور متعدد + ربط كل صورة بطبقها
    DishImport.tsx      استيراد أصناف (لصق نص أو CSV) + جدول مراجعة
    StarterMenu.tsx     قائمة بداية جاهزة حسب نوع المطعم
    CategoryManager.tsx ترتيب التصنيفات + إعادة التسمية والدمج
    Reorder.tsx         ReorderList — سحب HTML5 + أزرار ▲▼ (بلا مكتبة)
    CashierCard.tsx     توليد رمز الكاشير + رابط /stamp وQR
    Insights.tsx        بطاقة «ماذا أفعل الآن؟»
    SupportWhatsApp.tsx زر واتساب الدعم (رقمه من site_settings)
    ShareMenu.tsx       مشاركة رابط المنيو (واتساب/نسخ/مشاركة النظام)
    OptionsEditor.tsx   الإضافات (صفوف اسم+سعر)
    AllergenPicker.tsx  مسببات الحساسية (اختيار بالضغط)
    HoursEditor.tsx     ساعات العمل يوماً بيوم
    SupportBox.tsx      الدعم الفني ← لوحة المؤسس
    AnnouncementBar.tsx إعلانات المؤسس داخل لوحة التاجر (§11)
    ErrorBoundary.tsx   يمنع الشاشة البيضاء
  lib/
    api.ts              rest() restCount() uploadImage() founderAdmin() ApiError
    data.ts             كل الاستعلامات + whitelists الكتابة
    session.ts auth.tsx GoTrue بدون SDK + سياق React (+ استعادة كلمة المرور)
    config.ts plans.ts entitlements.ts themes.ts types.ts utils.ts
    allergens.ts hours.ts nutrition.ts options.ts
    patterns.ts         زخارف SVG (سدو، مشربية، جيري CC0، نخيل، أهلّة)
    seasons.ts          الزينة الموسمية (رمضان/الوطني/التأسيس)
    categories.ts       توحيد أسماء التصنيفات وترتيبها
    image.ts            ضغط الصور (مشترك بين الرافعَين)
    import.ts           محلّل النص/CSV → DishPayload
    insights.ts         التوصيات من التحليلات
    starterMenus.ts     قوائم البداية حسب نوع المطعم
    founder.ts          استعلامات لوحة المؤسس + سجل التدقيق (rest() لا founderAdmin)
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
`promo_codes` `announcements` `survey_responses` `restaurant_payment_settings`
`staff_pins` `founder_audit`.

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
`track_menu_view` (موجودة مسبقاً، غير مستخدَمة من الواجهة) ·
`staff_stamp` و `set_staff_pin` (وضع الكاشير، انظر §8) ·
`founder_email` (بريد المؤسس — مصدر واحد، انظر §10) ·
`founder_overview` · `founder_merchants` · `founder_funnel` ·
`founder_revenue_monthly` · `founder_revenue_orphans` · `founder_health`
(لوحة المؤسس، انظر §11).

**`is_founder()` صارت `SECURITY DEFINER`** لتقرأ `founder_email()` المحجوبة عن
`anon` و`authenticated`. لا تُرجعها إلى SQL عادية إلا مع منح EXECUTE على
`founder_email()` — وإلا انهارت ٤٨ سياسة RLS تعتمد عليها دفعةً واحدة.

**تريجر `guard_client_subscription`** على `subscriptions BEFORE INSERT`:
يقصر ما يُدرجه العميل على صف `plan_id='trial'` واحد مدى الحياة، لنفسه، بحد ١٥
يوماً. **يمرّ منه اثنان بلا فحص**: نداء service-role (`auth.uid()` فارغ —
`moyasar-webhook` و`payments`)، و**المؤسس** (يمنح الاشتراكات يدوياً من لوحته
لغيره، فكان التريجر يردّه بـ«لا يمكن إنشاء اشتراك لمستخدم آخر»).

> ⚠️ **درس محفور**: سياسة `subscriptions_insert` كانت تشترط `is_founder()`
> وحدها، فكان `startTrial` يفشل لكل تاجر — و`Dashboard.tsx` يبتلع الفشل بـ
> `.catch(() => {})`. النتيجة: ١٩ مطعماً بلا صف اشتراك، وكانت منيوهاتهم
> ستنطفئ جميعاً لحظة التحويل إلى `pk_live` (لأن `is_menu_published` تشترط
> اشتراكاً نشطاً). السياسة الآن `is_founder() OR auth.uid() = user_id`
> والتريجر هو الحارس. **لا تغلق سياسة كتابة يعتمد عليها مسار صامت الفشل.**

**صيغ مخزَّنة في أعمدة نصّية** — احترمها ولا تكتب فوقها نصاً حراً:
- `restaurants.working_hours` → JSON `{"sat":{"open","from","to"},…}`
  (بيانات إنتاج فعلية) · القارئ في `lib/hours.ts` يتسامح مع النص الحر.
- `restaurants.category_order` → JSON `["مشاوي","مقبلات",…]` · `lib/categories.ts`.
- `menus.theme` → مقاطع مفصولة بـ`:` في عمود نصّي واحد (**لا عمود جديد**):
  `طابع` · `طابع:#RRGGBB` (لون العلامة) · `طابع:grid|list|showcase` (شكل عرض
  الأطباق) · `طابع:#RRGGBB:grid` · و`custom:#RRGGBB` صيغة قديمة تبقى تعمل ·
  `splitThemeId`/`themeIdOf`/`getTheme` في `lib/themes.ts`. التحليل **غير مرتبط
  بالترتيب**: المقطع الذي يصلح لوناً لون، والمطابق لتخطيط تخطيط، والباقي يُتجاهل
  بلا انهيار. الطابع **ليس لوناً**: يحمل زخرفة وشكل ترويسة وخطاً وإيقاع مسافات؛
  و`design.layout` فيه **افتراض** يتجاوزه اختيار التاجر لا قيد.
- `restaurants.season` → `ramadan` | `national` | `founding` | null · `lib/seasons.ts`.
- `menus.window_from` / `window_to` → `HH:MM` بتوقيت الرياض (نافذة ظهور
  القائمة، تدعم تجاوز منتصف الليل) · `inTimeWindow` في `lib/hours.ts`.
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

### (و) ⚠️ الاستعلامات العامة: لا `select=*` أبداً
صلاحيات `anon` على `restaurants` و`menus` و`dishes` ممنوحة **على مستوى الأعمدة**
لا الجدول (لإخفاء `user_id` عن الزوّار). و`select=*` في PostgREST يتوسّع إلى كل
الأعمدة، فأي عمود جديد بلا `GRANT SELECT (col) … TO anon` يجعل الطلب كله يفشل بـ
«permission denied for table …» — أي أن **إضافة عمود واحد تُطفئ منيوهات كل
المطاعم دفعة واحدة**. حدث هذا فعلاً بعد إضافة أعمدة الضريبة والترتيب.

لذلك القوائم الصريحة `PUBLIC_RESTAURANT_COLS` / `PUBLIC_MENU_COLS` /
`PUBLIC_DISH_COLS` في `lib/data.ts`. **عند إضافة عمود يراه الزبون:**
1. `grant select (العمود) on public.<الجدول> to anon;`
2. أضِفه إلى قائمة الأعمدة العامة المناسبة.

بدون (١) يفشل الطلب، وبدون (٢) لا يصل العمود للصفحة. والقائمة الصريحة تعني أن
عموداً حسّاساً جديداً لن يتسرّب للزبون تلقائياً.

> `analytics.user_id` يملؤه تريجر `analytics_fill_owner` من مالك القائمة، فلا
> يحتاج الزائر المجهول قراءة `restaurants.user_id` إطلاقاً.

### (ز) تباين الألوان في الطوابع
لون النص فوق لون التمييز يُختار بـ`bestOnAccent()` في `lib/themes.ts` — **بمقارنة
تباين فعلية** لا بعتبة سطوع. العتبة الثابتة كانت تختار أبيض على المرجاني
`#e07a5f` بتباين 2.95:1، دون حدّ WCAG AA. أي لون تمييز جديد (ثابت أو من لون
علامة التاجر) يجب أن يمرّ بهذه الدالة.

### (هـ) أعمدة عمداً **خارج** الـwhitelists
ليست سهواً: كل منها يُكتب من شاشة أخرى، وإدراجه في الـpayload كان سيوجب حمله
في كل حفظ فيدهس ما ضبطه التاجر لتوّه. لكل واحد دالة مستقلّة في `lib/data.ts`:

| العمود | الدالة | لماذا |
|---|---|---|
| `restaurants.cover_color` | `updateBrandColor` | يُحرَّر مع الثيم في صفحة القوائم |
| `restaurants.category_order` | `updateCategoryOrder` | يُضبط بالسحب في مدير التصنيفات |
| `dishes.image` | `setDishImage` | يُكتب من الربط الدفعي للصور |
| `dishes.sort_order` | `reorderDishes` | يُضبط بالسحب لا من فورم الطبق |
| `dishes.available` | `toggleDishAvailability` | مفتاح سريع في القائمة |
| `dishes.price` | `updateDishPrice` | يُعدَّل من صفّ القائمة مباشرة |

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
- ✅ **الإيراد السنوي يُسجَّل صحيحاً** (`monthly × 11 = 1089`) في
  `moyasar-webhook` و `payments` معاً. تحذير سابق في `web/MIGRATION.md` ادّعى
  خلاف ذلك — كان خطأً (كخطأ ادّعائه أن `founder-admin` غير موجودة). الصفوف
  القديمة في `revenue_log` بمبالغ 69/99 تعود لنسخة دالة أقدم بتسعير مختلف.
- `PLAN_NAMES` في الدالتين يجب أن يطابق اسم الباقة في `plans.ts` — وإلا
  سُجِّل في `revenue_log` اسم باقة لا وجود لها في الواجهة (حُدِّث في v4).

---

## 5. التخزين المحلي

مفاتيح موحّدة في `app/src/lib/storage.ts` (استخدم `K` ولا تكتب المفتاح نصاً):

| المفتاح | المخزن | الغرض |
|---|---|---|
| `cm2_session` | localStorage | الجلسة (GoTrue) |
| `cm2_theme` | localStorage | الوضع الداكن/الفاتح |
| `cm_fsecret` | sessionStorage | سر المؤسس الاحتياطي — **لا يُضمَّن في الكود أبداً** (§10) |
| `cm_table` | sessionStorage | رقم الطاولة من `?table=` |
| `cm_staff` | sessionStorage | رمز الكاشير + slug مطعمه (لا يبقى على جهاز مشترك) |
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
- **استعادة كلمة المرور تحتاج إعداداً خارج الكود**: أضِف
  `<origin>/reset-password` إلى Redirect URLs في Supabase → Authentication →
  URL Configuration، وإلا رفض GoTrue إعادة التوجيه ولن يعمل الرابط.
- `Leaked Password Protection` معطّلة في إعدادات Auth (تحذير advisor). تفعيلها
  قرار مالك، ويستحق مع وجود استعادة كلمة المرور الآن.
- **زخارف `lib/patterns.ts`**: `girih` مشتقّة من ملف **CC0** من OpenClipart
  (الرابط والرخصة في رأس الملف)، والأربع الباقيات إنشاء أصلي موثَّق. أي زخرفة
  جديدة تحمل مصدرها ورخصتها فوق دالتها — ولا تُضاف زخرفة برخصة عدوى
  (CC BY-SA) في منتج تجاري مغلق.

---

## 8. وضع الكاشير (`/stamp`)

التاجر لا يريد إعطاء الكاشير حسابه الكامل ولا إنشاء حسابات بريد لموظفيه.

**المبدأ: الرمز لا يمنح أي وصول لقاعدة البيانات.** لا سياسة RLS تسمح للزائر
المجهول بقراءة `loyalty_customers` ولا `staff_pins`. كل شيء يمرّ من دالتين:

| الدالة | من ينادي | ماذا تفعل |
|---|---|---|
| `set_staff_pin(restaurant, pin, name)` | التاجر (authenticated) | تتحقّق من ملكية المطعم ثم تخزّن **هاش** bcrypt؛ مرفوضة لـanon |
| `staff_stamp(slug, pin, action, query, customer)` | صفحة `/stamp` (anon) | تتحقّق من الرمز ثم `lookup`/`stamp`/`redeem` ذرّياً |

- الرمز يُعرض للمالك **مرة واحدة** عند التوليد (لا نخزّن إلا الهاش). رمز جديد
  يُبطل السابق فوراً.
- ١٠ محاولات فاشلة ⇒ قفل ١٥ دقيقة. هذا يفتح باب إزعاج لمن يعرف الـslug، لكن
  المالك يبدّل الرمز بضغطة فيُفكّ القفل — مقايضة مقصودة.
- `staff_stamp` تعيد **آخر أربعة أرقام** من جوال الزبون لا الرقم كاملاً.
- الختم/الصرف يستخدمان `SELECT … FOR UPDATE` ثم زيادة في SQL؛ هذا يصلح سباقاً
  كان قائماً في `stampLoyalty` (قراءة ثم كتابة من المتصفح تُضيع ختم كاشير ثانٍ).
- تحذيرا advisor على الدالتين (`SECURITY DEFINER` قابلة للنداء) **متوقّعان**:
  الأولى عامة بالتصميم والرمز بوابتها، والثانية للمسجّلين وتتحقّق من الملكية.

---

## 9. التجربة المجانية

`startTrial(userId)` تُنشئ صف `subscriptions` بـ`plan_id='trial'` لمدة ١٤ يوماً
عند إنشاء المطعم. **لا تحتاج أي تغيير خلفي**: `is_menu_published` تسأل فقط عن
اشتراك نشط لم ينتهِ، فصف التجربة يفتح النشر تلقائياً — وهذا ما يمنع أن يُطفئ
التحويل إلى `pk_live` منيو تاجر بدأ لتوّه.

- الحالة تُعرض عبر `planLabel(ent)` في `lib/entitlements.ts` — مصدر واحد فلا
  تختلف الشارات بين الصفحات.
- عند الدفع لا حاجة لتعطيل صف التجربة: `getActiveSubscription` ترتّب بـ
  `end_date.desc`، والاشتراك المدفوع (٣٠ يوماً فأكثر) يسبق ما تبقّى من التجربة.
- الحماية في التريجر `guard_client_subscription` (انظر §2).

---

## 10. دخول لوحة المؤسس

الوصول للوحة `/founder` يمرّ من `founder-admin` وحدها، ولها **بوابتان تُقبل
أيّهما**:

| البوابة | كيف | متى تُستخدم |
|---|---|---|
| جلسة بريد المؤسس | `Authorization: Bearer <jwt>` والدالة تسأل `/auth/v1/user` عن البريد وتشترط أنه **مؤكَّد** | المسار المعتاد |
| `x-founder-secret` | يقارَن بزمن ثابت بـ`FOUNDER_SECRET` (٢٤ محرفاً فأكثر) | احتياطي فقط |

- **بريد المؤسس لا يُكرَّر في الواجهة ولا في الدالة**: مصدره `public.founder_email()`
  في القاعدة، وهي نفسها التي تقرأها `is_founder()` في سياسات RLS. تغييره تغييرٌ
  في مكان واحد.
- الدالة **لا تعيد 503 عند غياب `FOUNDER_SECRET`** بعد الآن: كان الفحص يقع قبل
  كل شيء فيقفل اللوحة كلها على متغيّر بيئة منسيّ. الآن غيابه يُعطّل المسار
  الاحتياطي وحده.
- `Founder.tsx` لا يسأل «هل هذا بريد المؤسس؟» — يجرّب النداء بما لديه: نجح
  فتحت اللوحة، فشل ظهر الدخول. نسخُ البريد إلى العميل كان سيكرّر مصدر الحقيقة.
- `FOUNDER_SECRET` **لا يُقرأ برمجياً** من Supabase؛ إن احتجته اضبط قيمة جديدة
  في Edge Functions → Secrets. ولا يُضمَّن في المستودع ولا في القاعدة إطلاقاً.
- تحذير advisor على `is_founder()` (`SECURITY DEFINER` قابلة للنداء من anon)
  **متوقَّع**: لا تعيد إلا بوليان عن جلسة المتصل نفسه ولا تكشف شيئاً. أما
  `founder_email()` فمحجوبة عن anon وauthenticated فلا تظهر في التحذيرات.

---

## 11. لوحة المؤسس (`/founder/*`)

قشرة بتبويبات في `pages/founder/Founder.tsx` (البوابة كما في §10)، وأقسامها
صفحات مستقلّة. الوصول يمرّ من `is_founder()` وحدها.

### لماذا `rest()` لا `founderAdmin()`

سياسات RLS تمنح المؤسس وصولاً كاملاً **بجلسته هو**: كل سياسات الكتابة على
`restaurants` و`menus` و`dishes` و`subscriptions` وغيرها تحمل `OR is_founder()`،
ودور `authenticated` يملك صلاحية على كل الأعمدة. فقاعدة (و) «لا `select=*`»
تخصّ `anon` وحده ولا تقيّد اللوحة. النتيجة: اللوحة تنادي `rest()` مباشرة كلوحة
التاجر، بلا قفزة إضافية عبر دالة الحافة.

`founder-admin` تبقى **بوابة السرّ الاحتياطية** فقط. ومن دخل بالسرّ وحده يرى
تفسيراً صريحاً بدل أقسام فارغة: الدوال المجمّعة تقرأ الـJWT فلا تعمل بلا جلسة.

### الدوال المجمّعة

`founder_overview()` و`founder_merchants()`: `SECURITY DEFINER` بحارس
`is_founder()` **داخلها** (ترفع `42501` لغيره)، وEXECUTE لـ`authenticated` فقط.
سببان لوجودها: `auth.users` غير مكشوف لـPostgREST وبريد المالك ضروري، وعدّ
القوائم/الأطباق/المشاهدات لكل مطعم من المتصفح = N+1.

### حدود لا تُتجاوز (قرار المالك)

| ممنوع | البديل المعتمد |
|---|---|
| جوالات زبائن الولاء وأسماؤهم | `loyalty_count` عدداً فقط من `founder_merchants()` |
| `restaurant_payment_settings.secret_key` | العمود المحسوب `has_secret` |
| تعليق حساب تاجر | غير موجود — لا عمود ولا واجهة |

### سجل التدقيق

`founder_audit`: **لا سياسة UPDATE ولا DELETE** عمداً — سجل لا يُنقَّح. تُنادى
`logAudit()` **قبل** كل تغيير، ولا ترمي أبداً (فشل التسجيل لا يمنع الإجراء).

### أقسام اللوحة والوصل بلوحة التاجر

| القسم | ما يفعله | أثره عند التاجر |
|---|---|---|
| نظرة عامة | أرقام المنصة + «يحتاج انتباهك» مشتقّاً منها + تذاكر الدعم | ردّ التذكرة يظهر في `SupportBox.tsx` |
| التجّار | سجل + بطاقة لكل تاجر + تحكّم بالاشتراك والبيانات والحذف | الاشتراك يظهر فوراً في `planLabel` وقفل النشر (نفس الجدول) |
| المال والنمو | قمع التحويل · الإيراد شهرياً · إيراد بلا اشتراك · أكواد الخصم | — (الأكواد غير موصولة بمسار الدفع بعد) |
| التواصل | إعلانات + محرّر المدونة | `AnnouncementBar` في أعلى لوحة كل تاجر مطابق للجمهور |
| الصحة | تنبيهات عملية + سجل التدقيق + `site_settings` | رقم واتساب الدعم يقرؤه `SupportWhatsApp.tsx` |

> **باب أُغلق**: كانت `tickets_insert` تسمح لدور `anon` بالإدراج إن كان
> `user_id IS NULL`، ومفتاح anon عام بحكم التصميم — فأي زائر يستطيع إغراق صندوق
> الدعم (وقد حدث: تذكرة مجهولة «HACK/spam»). ولا مسار في التطبيق ينشئ تذكرة بلا
> حساب. السياسة الآن `authenticated` فقط بشرط `auth.uid() = user_id`.

---

## 12. الدخول كتاجر (`/dashboard?as=<restaurantId>`)

المؤسس يفتح لوحة تاجر كما يراها ليدعمه. المدخل زر في بطاقة التاجر.

- **الحارس `is_founder()` لا وجود الوسيط**: تاجر يكتب `?as=` يدوياً يُتجاهَل
  الوسيط ويرى لوحته هو. و`viewAs = null` تعني «لم يُحسم» فلا تُجلب لوحة خاطئة.
- الصلاحيات المعروضة صلاحيات **مالك المطعم** (`fetchEntitlements(owner_id)`) لا
  صلاحيات المؤسس — وإلا ظهرت حالة اشتراك لا تخصّ التاجر.
- **قراءة فقط، والحارس `<fieldset disabled>` واحد حول `{children}`** في
  `Shell`. اختيارها بدل نثر `disabled` في ست صفحات مقصود: تلك تُنسى في صفحة
  جديدة، وهذه تُعطّل كل زر وحقل متفرّع عنها بآلية HTML أصلية. الروابط تبقى
  تعمل فيظلّ التنقّل ممكناً.
- **لماذا لا كتابة**: كل كتابة تحمل `user.id` من السياق، فالكتابة في وضع
  الانتحال كانت ستُنشئ صفوفاً باسم المؤسس داخل مطعم التاجر.
- الدخول يُسجَّل في `founder_audit` بـ«فتح لوحة تاجر»، وشريط الإعلانات لا يظهر
  في هذا الوضع (إعلاناتك موجّهة للتجّار لا لك).

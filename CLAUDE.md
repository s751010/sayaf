# CLAUDE.md — CloudMenu (كلاود منيو)

منيو رقمي QR للمطاعم السعودية. هذا الملفّ **المرجع الإلزامي**: القواعد التي
يُكسَر المنتج بكسرها. وما وراءها من تفصيل في `docs/` — انظر الخريطة أدناه.

---

## الخريطة — أين تجد الباقي

هذا الملفّ **القواعد**: ما يجب أن تعرفه قبل أن تلمس سطراً. والتفصيل — لماذا
اتُّخذ كل قرار، وأي عطل أدّى إليه — في `docs/`. **الأرقام لم تتغيّر**: ستّة
وأربعون تعليقاً في الشيفرة تشير إلى «§18» و«§21» وأخواتها، فبقيت كما هي أينما
سكنت.

| الملفّ | الأقسام |
|---|---|
| `docs/founder.md` | §10 دخول لوحة المؤسّس · §11 أقسامها · §12 الدخول كتاجر |
| `docs/payments.md` | §4 التسعير · §13 سلّة الزبون · §21 اشتراك PayLink |
| `docs/api.md` | §14 واجهة API · §15 بكسلات التتبّع · §16 الويبهوكات |
| `docs/design.md` | §17 بطاقات الكاشير · §18 الطوابع · §20 التصنيفات والأيقونات · §22 اللاندنق |
| `docs/security.md` | §8 وضع الكاشير · §9 التجربة المجانية · §24 التصلّب الأمني |
| `docs/rounds.md` | §19 لوحة التاجر · §23 جاهزية الإطلاق · §25 الحمولة والمدونة |
| `LAUNCH.md` | ما يبقى على المالك — بكل بند: لماذا · كيف · كيف تتأكّد |

---

## الثوابت التي لا تُكسر

سبعة أشياء إن كُسر أحدها ظهر الضرر عند تاجر لا عندك. الفحوص في
`app/tests/` تحرس أوّلها بصوت عالٍ؛ والباقي يحتاج انتباهك.

| الثابت | لماذا | أين تفصيله |
|---|---|---|
| **قيم ألوان الطوابع لا تتغيّر** | ١٨ مطعماً حقيقياً عليها، و`dark-gold` شكلُ المنتج لمن لم يختر | §18 · `invariants.test.ts` (بصمة) |
| **لا `select=*` على استعلام عامّ** | صلاحيات `anon` على مستوى العمود؛ عمود واحد بلا منح يُطفئ منيوهات الجميع | القاعدة (و) أدناه |
| **الأعمدة المحسوبة لا تُرسَل** | Postgres يرفض الطلب كاملاً | القاعدة (د) أدناه |
| **الكتابة بقوائم بيضاء** | المفتاح غير المذكور يُسقَط بصمت | القاعدة (أ) أدناه |
| **`_shared` ونظائرها متطابقة** | معرّف الإضافة موضعٌ في مصفوفة؛ التباعد يُحصّل خطأً | `parity.test.ts` |
| **الباقة الواحدة `standard` بـ٩٩ ر.س** | رقم الطلب في الويبهوك يُقرأ منها؛ تغيير المعرّف يسجّل الإيراد خطأً | §4 في `docs/payments.md` |
| **قفل النشر يبدأ مطفأً** | تشغيله يُطفئ منيو كل تاجر بلا اشتراك نشط | §21 · `LAUNCH.md` |
| **رابط المنيو لا يُبنى بيد** | `location.origin` مضيف اللوحة لا مضيف المنيو، والرابط يدخل كود QR **مطبوعاً** | `shared/menu-url.mjs` |
| **تغيير رابط بلا تسجيل القديم بديلاً** | يُطفئ منيو مطعم عامل — الكود المطبوع لا يُحدَّث | `change_restaurant_slug` |

---

## 1. البنية

**نسخة واحدة فقط:** `app/` — Vite 6 + React 18 + TypeScript + Tailwind v4، SPA عربية RTL.
البناء يخرج إلى `deploy/` — و**لا يُلتزَم في git**: Netlify يبني من المستودع
(`netlify.toml`) وينشر الناتج. وفي الجذر أيضاً `netlify/edge-functions/` (حقن
وسوم المشاركة) و`shared/` (شيفرة خالصة تقرؤها الحافة والسكربتات والاختبارات).

```
app/src/
  main.tsx              نقطة الدخول (خطوط، ثيم، service worker)
  App.tsx               الراوتر + AuthProvider + ToastProvider + ErrorBoundary
  pages/
    Landing.tsx         صفحة الهبوط (الأقسام والحركة)
    MenuPage.tsx        المنيو العام /:slug — أهم صفحة في المنتج
    Restaurants.tsx     دليل المطاعم العام /restaurants
    OrderStatus.tsx     متابعة الطلب /o/:id
    Demo.tsx            منيو تجريبي حي /demo (بيانات محلية، بدون شبكة)
    Login.tsx  ResetPassword.tsx  Stamp.tsx (وضع الكاشير العام)
    Blog.tsx  BlogPost.tsx  Help.tsx  ApiDocs.tsx  NotFound.tsx
    dashboard/          Dashboard(shell) Overview Dishes Menus Design Cards Qr
                        Analytics Loyalty Billing Settings Tabs
    founder/            Founder(shell+بوابة) Overview Merchants MerchantDetail
                        Money Comms Health
  components/
    ui.tsx              نظام التصميم: Button Card Badge Field Input Modal Toast…
    site.tsx            Logo / Navbar / Footer / PreviewMenuButton
    menu/MenuHeader.tsx  ترويسة المنيو: قوس/شريط سدو/إطار/ناعم
    menu/DishCard.tsx    بطاقة الطبق بثلاثة تخطيطات (شبكة/قائمة/عرض)
    menu/DishOfTheDay.tsx بطاقة «طبق اليوم» للطبق المميّز الأول
    menu/ThemePreview.tsx معاينة الطابع المصغّرة في اللوحة
    menu/chrome.tsx      قِطَع المنيو الصغيرة: Chip · MenuSheet · SectionHeading · mFont
    menu/DishModal.tsx   نافذة الطبق — **نقطة اختيار الإضافات الوحيدة**
    menu/LoyaltyCard.tsx بطاقة الولاء داخل المنيو (تُحفظ محلياً)
    menu/Cart.tsx        السلّة نفسها: useCart · CartBar · AddToCartButton (§13)
    menu/CartReview.tsx  شاشة المراجعة والدفع (§13)
    menu/PickupTicket.tsx تذكرة الاستلام بعد الدفع (§13)
    landing/PhonePreview.tsx معاينة الهاتف الحيّة في صفحة الهبوط
    landing/PricingCards.tsx بطاقات الأسعار — أرقامها من lib/plans لا من نصّ
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
    PaymentSettingsCard.tsx ربط بوابة PayLink للتاجر — المفتاح كتابةً فقط (§13)
    ApiKeysCard.tsx     مفاتيح API للتاجر — السرّ يُعرض مرة واحدة (§14)
    WebhooksCard.tsx    وجهات الويبهوك + سجل التسليم (§16)
    ErrorBoundary.tsx   يمنع الشاشة البيضاء
  lib/
    api.ts              rest() restCount() uploadImage() founderAdmin() ApiError
    data.ts             كل الاستعلامات + whitelists الكتابة
    session.ts auth.tsx GoTrue بدون SDK + سياق React (+ استعادة كلمة المرور)
    config.ts plans.ts entitlements.ts themes.ts types.ts utils.ts
    allergens.ts hours.ts nutrition.ts options.ts
    patterns.ts         زخارف SVG (سدو، مشربية، جيري CC0، نخيل، أهلّة، قطّ عسيري، نجمة)
    fonts.ts            تحميل خطوط الطوابع عند الطلب (§18)
    icons.tsx           ٦٩ أيقونة مرسومة يدوياً — مسارات واحدة للـDOM وللـcanvas (§20)
    seasons.ts          الزينة الموسمية (رمضان/الوطني/التأسيس)
    categories.ts       قاموس CANON + توحيد أسماء التصنيفات وترتيبها (§20)
    image.ts            ضغط الصور (مشترك بين الرافعَين)
    import.ts           محلّل النص/CSV → DishPayload
    insights.ts         التوصيات من التحليلات
    nextStep.ts         سلّم «خطوتك التالية» فوق insights (§19)
    starterMenus.ts     قوائم البداية حسب نوع المطعم
    founder.ts          استعلامات لوحة المؤسس + سجل التدقيق (rest() لا founderAdmin)
    storage.ts          مفاتيح localStorage/sessionStorage الموحّدة (K)
    pixels.ts           حقن بكسلات التتبّع في صفحة المنيو (§15)
    apiKeys.ts          توليد مفاتيح API في المتصفح + هاشها (§14)
    menuUrl.ts          واجهة مُنمَّطة لـshared/menu-url.mjs — **كل رابط منيو منها**
    menuText.ts         نصوص المنيو بلغة الزبون — **مصدر واحد** لاسم الطبق ووصفه
```

اللغة: عربية RTL. الخطوط ذاتية الاستضافة عبر `@fontsource` (لا Google Fonts).
الثيم: رموز دلالية في `styles/global.css` تنقلب مع `data-theme` (داكن افتراضي).

---

## 2. الـBackend — Supabase

Project ref: `wxrukupcyfypnqnotmxv` (اسمه «claudmenu» · سنغافورة) · URL في
`app/src/lib/config.ts`.
**لا يوجد SDK** — كل شيء عبر `fetch` مباشرة إلى PostgREST، ويمر من دالة واحدة:
`rest<T>()` في `app/src/lib/api.ts`. لا تنادِ `fetch` مباشرة من صفحة.

> ⚠️ **المشروع انتقل (٢٠٢٦/٠٨/٢٢).** كان `wjqpsbpebpntpeinqccl` — ويسكنه
> منتج آخر (عشرات دوالّ `sahse_*` وجدولها)، وهو سبب النقل: مشروع لمنتج
> واحد. أي توثيق أو سكربت يذكر المعرّف القديم **قديم**، والسجلّ الكامل
> للنقل — وما بقي على المالك ضبطه من اللوحة — في
> `supabase/migrations/20260822_project_move_claudmenu.sql`.
>
> ولا يُنقَل شيء إلى القديم بعد اليوم؛ يبقى حيّاً كطريق رجوع لا أكثر.

**الجداول:** `restaurants` `menus` `dishes` `analytics` `subscriptions`
`revenue_log` `support_tickets` `site_settings` `blog_posts` `loyalty_customers`
`promo_codes` `announcements` `survey_responses` `restaurant_payment_settings`
`staff_pins` `founder_audit` `api_keys` `api_usage` `webhooks` `webhook_events`
`internal_secrets` `client_errors` `restaurant_slug_aliases`.

> ⚠️ **`survey_responses` غير مستعمَل**: صفر صفّ و**صفر سطر شيفرة** يقرؤه أو
> يكتب فيه. بقايا استطلاع رضا لم يُبنَ. لم يُحذف الجدول (حذفٌ بلا مكسب، وله
> سياسات وحدّ معدّل مضبوطة)، لكن لا تبنِ عليه شيئاً ظنّاً أنه مسار قائم —
> إمّا يُبنى الاستطلاع أو يُسقَط بقرار.
>
> و**`client_errors`** جديد: انهيارات الواجهة يرسلها `ErrorBoundary`. إدراج
> `anon` فقط، والقراءة للمؤسّس، والتوقيع يحسبه التريجر لا العميل.

**Edge Functions المنشورة فعلياً** (مؤكَّدة من لوحة Supabase؛ `ai-proxy`
موجودة لكن لم تُعد الواجهة تستدعيها بعد حذف المستشار الذكي):
`founder-admin` · `moyasar-webhook` · `notify-support` ·
`dynamic-task` · `payments` · `paylink-create` · `paylink-webhook` ·
`paylink-order-create` · `order-verify` (§13) · `api` (§14) ·
`webhook-dispatch` (§16) · `billing-admin` · `menu-scan` (قراءة المنيو من صورة).

> ⚠️ **`verify_jwt: true` لا تعني «مستخدم مسجَّل».** تعني «أي JWT موقَّع بمفتاح
> المشروع» — و**مفتاح `anon` منها**، وهو منشور في حزمة جافاسكربت التي ينزّلها
> كل زائر. فكل دالّة تحتاج هويةً حقيقية **تفحصها بنفسها**: ترفض
> `token === ANON` ثم تسأل `/auth/v1/user` (كما تفعل `menu-scan`)، أو تحرس
> نفسها بسرّ مشترك (كما تفعل `webhook-dispatch` و`notify-support`).
>
> أربع نقاط مكشوفة في فحص ٢٠٢٦/٠٨/٢٢ أصلُها هذا الظنّ وحده — أخطرها وسيط
> OpenAI مفتوح لكل زائر على فاتورة المالك.

> **ستّ دوالّ مُقبَرة** تردّ 410 ولا تفعل شيئاً: `ai-proxy` · `dynamic-task` ·
> `OpenAI` · `openai-proxy` · `generate-article` · `migrate-images`. مصادرها
> في `supabase/functions/_archive/` وشواهدها في `_tombstones/`، والسبب في
> `_archive/README.md`. ✅ للمالك حذفها نهائياً من اللوحة.

> `founder-admin` **موجود ونشط**. (توثيق قديم في `web/MIGRATION.md` كان يقول
> غير ذلك — كان خطأً، والمجلد حُذف.)
> `paylink-order-create` **موصولة الآن بالواجهة** (سلة الزبون — انظر §13).
> `payments` و`paylink-create`/`paylink-webhook` تخصّ اشتراك التاجر بالمنصّة،
> ومسار الاشتراك الحيّ ما زال Moyasar.

**Storage buckets** (موجودة، عامة للقراءة، الكتابة لـ `authenticated`):
`dish-images` · `menu-images` · `restaurant-images`.

**دوال RPC مُضافة:** `increment_dish_views` (زيادة ذرّية؛ سياسة `dishes_update`
تمنع الزائر المجهول من PATCH مباشر) · `is_menu_published` (بوليان لقفل النشر) ·
`track_view` (عدّاد المشاهدة الذرّي بالساعة وبتوقيت الرياض — الواجهة
تناديه لكل فتح منيو) · `track_menu_view` (غلاف قديم عليه، غير مستخدَم) ·
`place_order` · `mark_order_paid` · `order_public_status` · `popular_dishes`
(منظومة الطلبات، §13 — والثلاث الأولى **لـservice_role وحده**) ·
`trial_days` · `abuse_hit` ·
`staff_stamp` و `set_staff_pin` (وضع الكاشير، انظر §8) ·
`founder_email` (بريد المؤسس — مصدر واحد، انظر §10) ·
`notify_support_ticket` (تريجر `AFTER INSERT` على `support_tickets` يوقظ
`notify-support` بـ`pg_net` — التوصيل من الهجرات لا من لوحة Supabase، فلا
يضيع عند النقل التالي) ·
`founder_overview` · `founder_merchants` · `founder_funnel` ·
`founder_revenue_monthly` · `founder_revenue_orphans` · `founder_health`
(لوحة المؤسس، انظر §11) · `api_rate_hit` (حدّ معدّل الـAPI، انظر §14).

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
- `dishes.options` → JSON `[{name,price?}]` · `lib/options.ts`. **معرّف الإضافة في
  الطلب هو موضعها في هذه المصفوفة** — `paylink-order-create` تُكرّر منطق
  `parseOptions` حرفياً، فأي تغيير في التحليل هنا يوجب تغييراً مطابقاً هناك وإلا
  أشار الرقم إلى إضافة أخرى. (النسخة الأولى من الدالة افترضت شكلاً مُجمَّعاً
  `[{items:[{id,…}]}]` لا يكتبه أحد، فكان **كل** طلب بإضافة يُرفض.)
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
| `restaurants.online_payment_enabled` | `updateOnlinePayment` | يُحفظ من بطاقة «الدفع الإلكتروني» مع بيانات البوابة |

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
3. `npm test` — صفر فشل. (فحوص التكافؤ تسقط عند أي تباعد بين نسختين مكتوبتين
   بيد، ولها تاريخ أعطال حقيقي.)
4. إن أضفت حقلاً: طبّق القاعدة (أ) كاملة. وإن كان يراه الزبون: القاعدة (و)
   بشقّيها معاً.
5. `npm run build` — يتحقّق من الأنواع ثم يبني.
6. commit + push على الفرع المخصّص.

**CI يعيد ٢ و٣ و٥ على كل دفعة** (`.github/workflows/ci.yml`) — فالخطوات أعلاه
سرعةٌ لك لا حارسٌ وحيد.

> ⚠️ `deploy/` **لم يعد يُلتزَم**: Netlify يبني من المستودع. لا تعِده إلى git
> إلا إن عدتَ إلى النشر اليدوي بالسحب — وحينها أعِد سطره في `.gitignore`.

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
  (الرابط والرخصة في رأس الملف)، والستّ الباقيات (`sadu` · `mashrabiya` ·
  `palm` · `crescent` · `qatt` · `najma`) إنشاء أصلي موثَّق فوق كل دالة. أي
  زخرفة جديدة تحمل مصدرها ورخصتها فوق دالتها — ولا تُضاف زخرفة برخصة عدوى
  (CC BY-SA) في منتج تجاري مغلق.
- **`sadu` أُعيد نسجه**: المعيّنات كانت متباعدة فتُقرأ **سهاماً** لا نسيجاً،
  وظهر ذلك صارخاً على البطاقة المطبوعة حيث تكبر البلاطة. السدو الحقيقي محكم
  النسج: الأشكال تتلامس عند رؤوسها وتفصلها خيوط سداة رفيعة.
- **`najma`**: ضلعا المربّعين **متساويان أو لا تكون نجمة** — أول محاولة أعطت
  المُدار قطراً ٥٨ والقائم ضلعاً ٤٥٫٣ فخرج شكل مائل لا نجمة منتظمة.

---

## graphify

This project has a graphify knowledge graph at .graphify/.

Rules:
- For codebase or architecture questions, when `.graphify/graph.json` exists, first run `graphify query "<question>"` (or `graphify path "<A>" "<B>"` / `graphify explain "<concept>"`); these return a scoped subgraph, usually much smaller than `GRAPH_REPORT.md` or raw grep output
- If .graphify/wiki/index.md exists, navigate it instead of reading raw files
- If .graphify/graph.json is missing but graphify-out/graph.json exists, run `graphify migrate-state --dry-run` first; if tracked legacy artifacts are reported, ask before using the recommended `git mv -f graphify-out .graphify` and commit message
- If .graphify/needs_update exists or .graphify/branch.json has stale=true, warn before relying on semantic results and run /graphify . --update when appropriate
- Before proposing or committing .graphify artifacts, run `graphify portable-check .graphify`; commit-safe graph artifacts must use repo-relative paths, and never commit .graphify/branch.json, .graphify/worktree.json, .graphify/needs_update, or .graphify/cache/. If a repo already tracks any of them, first add them to .gitignore, then propose `git rm --cached .graphify/branch.json .graphify/worktree.json .graphify/needs_update` and `git rm -r --cached .graphify/cache`; never mutate git state without asking
- Before deep graph traversal, prefer `graphify summary --graph .graphify/graph.json` for compact first-hop orientation
- For review impact on changed files, use `graphify review-delta --graph .graphify/graph.json` instead of generic traversal
- Read `.graphify/GRAPH_REPORT.md` only for broad architecture review or when `query` / `path` / `explain` do not surface enough context
- After modifying code files in this session, run `npx graphify hook-rebuild` to keep the graph current

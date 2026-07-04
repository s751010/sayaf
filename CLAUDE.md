# CLAUDE.md — CloudMenu (كلاود منيو)

منيو رقمي QR للمطاعم السعودية. هذا الملف هو المرجع الإلزامي لأي عمل على المشروع.
اقرأه بالكامل قبل أي تعديل.

---

## 1. البنية الأساسية (Architecture)

- **المشروع كله ملف HTML واحد مصغّر**: `public/index.html` (~1.49MB، سطر واحد عملياً). كان اسمه `cloudmenu_v43_security_storage.html` ونُقل إلى `public/index.html` ليُقدَّم على `/` في Netlify.
- **لا يوجد كود مصدري غير مصغّر.** الملف المصغّر **هو المصدر الأصلي (canonical source)** — تم تأكيد هذا مع المالك. لا تبحث عن `src/` أو مشروع Vite منفصل؛ غير موجود.
- بُني أصلاً بـ **Vite + React 18** (علامة `/*$vite$:1*/` في الـ`<style>`، وبنية React المصغّرة، و helper الـ async المُولِّد). لكن مخرجات Vite لم تعد متوفرة كمصدر — نتعامل مع الناتج النهائي مباشرة.
- **كل تعديل يتم عبر استبدال نصوص (string replacement) يستهدف توقيعات مصغّرة**، مثل:
  - `nR=`, `aR=`, `iR=`, `yL=`, `bR=` — أسماء دوال/متغيرات مصغّرة (حرف واحد أو حرفين).
  - `XL` = رابط Supabase الأساسي، `ZL`/`BL`/`NL`/`ke`/`le` = مفتاح anon (JWT).
  - عند الاستبدال: اجعل النص المستهدَف **فريداً قدر الإمكان** (خذ سياقاً قبله وبعده) لأن الأسماء المصغّرة تتكرر.
- اللغة: عربية RTL (`<html lang="ar" dir="rtl">`)، خطوط Google (Cairo, Tajawal, …).
- استضافة: **Netlify** → `https://cloudsmenu.netlify.app/`.

### قاعدة ذهبية للعمل اليومي
> أي تعديل = إيجاد التوقيع المصغّر الصحيح → استبدال دقيق وفريد → فحص الصياغة (انظر القسم 4) → عدم كسر أي توقيع آخر.

---

## 2. الـBackend

### Supabase (PostgREST مباشرة عبر fetch — لا يوجد SDK / لا `.from()`)
- Project ref: `wjqpsbpebpntpeinqccl`
- URL: `https://wjqpsbpebpntpeinqccl.supabase.co` (في الكود = `XL`)
- مفتاح anon (JWT, role=anon) مضمّن في الملف (`ZL`/`le`/…). يُرسل في `apikey` و `Authorization: Bearer`.
- النداءات عبر `fetch(`${XL}/rest/v1/<table>...`)` مع `Prefer: return=representation` للكتابة.

**الجداول المعروفة:**
`restaurants`, `menus`, `dishes`, `analytics`, `announcements`, `blog_posts`,
`loyalty_customers`, `site_settings`, `support_tickets`, `survey_responses`.

أمثلة على الاستعلامات الفعلية في الكود:
- `rest/v1/dishes?menu_id=eq.<id>&available=eq.true&select=*`
- `rest/v1/restaurants?slug=eq.<slug>`
- `rest/v1/site_settings?key=eq.features&select=value` (مفاتيح: `features`, `footer`)
- الكتابة: `method:POST` (إضافة) و `method:PATCH` (تحديث) مع `body:JSON.stringify(payload)`.

### Edge Functions (Supabase Functions)
- `functions/v1/ai-proxy` — بروكسي نداءات الذكاء الاصطناعي (يخفي مفاتيح المزوّد). كل استدعاءات الـAI تمر عبره.
- `functions/v1/founder-admin` — عمليات لوحة المؤسس (admin)، محميّة بـ `cm_fsecret`.

### المدفوعات
- **Moyasar**. مفتاح النشر للاختبار: `pk_test_...` (placeholder للإنتاج: `pk_live_xxxxxxxxxxxxxxxx` — يجب استبداله بمفتاح حقيقي عند الإطلاق).
- التسعير: شهري `{basic:399, standard:649, premium:949}` / سنوي `YR` — والمبلغ يُحوَّل لهللات (`*100`).

### التخزين المحلي (سبب تسمية الإصدار `security_storage`)
- `localStorage`: `cm_session` (الجلسة)، `cm_admin_notes` (`T.ADMIN_NOTES`)، `cm_fsecret` (سر المؤسس)، `cm_loyalty_*`، وأكواد الخصم (`T.PROMO_CODES`).
- `sessionStorage`: `cm_table` (رقم الطاولة من `?table=` في الرابط).
- يوجد خريطة مفاتيح `T` ودالة قراءة موحّدة `E(T.KEY)`. استخدمها بدل الوصول المباشر.

---

## 3. القواعد الإلزامية (Mandatory Rules)

### (أ) أي حقل جديد لازم يُضاف في **ثلاثة** أماكن وإلا يُحذف صامتاً ⚠️
لأن الكتابة تتم بكائن payload صريح (whitelist)، أي مفتاح غير مذكور **يُسقَط بصمت** ولا يُحفظ في Supabase.
الأماكن الثلاثة (مثال مؤكّد من جدول `dishes`):

1. **تهيئة الفورم (form init state)** — الحالة الابتدائية:
   ```
   {name:``, description:``, price:``, category:``, emoji:`🍔`,
    featured:!1, image:``, calories:``, sodium_mg:``, caffeine_mg:``}
   ```
2. **whitelist الإضافة (POST)** — الكائن المُرسل عند الإنشاء:
   ```
   {name, description:…||null, price:parseFloat(...), category:…||null,
    emoji:…||`🍽`, image:…||null, featured:…||!1, available:!0,
    menu_id, restaurant_id, user_id, views:0,
    calories:…?parseInt:null, sodium_mg:…?parseInt:null,
    caffeine_mg:…?parseInt:null, options:…||null}
   ```
3. **whitelist التحديث (PATCH)** — الكائن المُرسل عند التعديل (لاحظ:
   ```
   Object.keys(o).forEach(e=>o[e]===void 0&&delete o[e]);
   ```
   يحذف أي مفتاح `undefined` — فلا يكفي وضع الحقل في الفورم فقط).

> **القاعدة:** عند إضافة حقل جديد لأي جدول، أضِفه في (1) تهيئة الفورم + (2) كائن الإضافة + (3) كائن التحديث. إن نسيت أحدها → الحقل لن يُحفظ/يُحدَّث ولن تظهر أي رسالة خطأ. تأكد أيضاً من وجود العمود في جدول Supabase.

### (ب) فحص صياغة بعد كل تعديل (`node --check`)
الملف HTML، و `node --check` يفحص JS فقط. الطريقة العملية (لا يوجد سكربت بناء رسمي):
1. استخرج محتوى وسم(وسوم) `<script>` الرئيسي إلى ملف `.js` مؤقت.
2. شغّل `node --check tmp.js` للتأكد من سلامة الصياغة (أقواس/علامات اقتباس متوازنة) — أكثر خطأ شائع بعد الاستبدال هو قوس أو backtick غير متوازن.
3. لا تترك ملفات مؤقتة في المستودع.

> الهدف: لا تدفع أبداً تعديلاً يكسر تحليل (parse) السكربت. الفحص إلزامي بعد **كل** استبدال نصّي.

### (ج) `await` داخل `z(function*(){})` يكسر التطبيق — استخدم `yield` ⚠️
- الكود يستخدم helper الـ async المُولّد من regenerator: `z(function*(){ ... })` (موجود 37 مرة).
- داخل `function*` لا يوجد `await` — الانتظار يتم بـ **`yield`**.
- كتابة `await` داخل `z(function*(){...})` خطأ صياغة يكسر التطبيق بالكامل.
- ✅ صحيح: `let r = yield fetch(...)`
- ❌ خطأ: `let r = await fetch(...)`

### (د) خريطة الوكلاء (AI Advisory Personas)
هذه شخصيات "المجلس الاستشاري بالذكاء الاصطناعي" داخل التطبيق (ميزة فعلية في الكود، تمر عبر `ai-proxy`).
الخريطة **مطابقة لما في الكود** (لا يوجد وكيل اسمه "راشد"؛ والأدوار كالتالي):

| id      | الاسم   | الدور                | إيموجي | اللون     |
|---------|---------|----------------------|--------|-----------|
| `all`   | الفريق كاملاً | جميع الأعضاء    | 👥     | `#D4A843` |
| `ceo`   | أحمد    | المدير التنفيذي       | 👔     | `#D4A843` |
| `cmo`   | نورة    | مديرة التسويق         | 📣     | `#F472B6` |
| `cto`   | فارس    | مدير التقنية          | 💻     | `#60A5FA` |
| `cfo`   | ريم     | مديرة المالية         | 💰     | `#34D399` |
| `cs`    | خالد    | مدير نجاح العملاء     | 🤝     | `#A78BFA` |
| `growth`| سلمى    | محللة النمو           | 📊     | `#F97316` |

- كل شخصية لها `sys` (system prompt) يبدأ بنص أساس مشترك `bR` ثم تخصيص الدور.
- **مهم:** الخريطة التي وردت في طلبات سابقة (راشد=المنيو، خالد=الدفع، نورة=محرر المنيو) **غير صحيحة** وتم تصحيحها لتطابق الكود. اعتمد الجدول أعلاه. أي تعديل على شخصية يجب أن يبقى الـ`id` ثابتاً.

---

## 4. سير العمل الموصى به (Workflow) قبل أي push
1. حدّد التوقيع المصغّر المستهدَف بدقة (سياق فريد).
2. نفّذ الاستبدال.
3. تأكد من القاعدة (ج): لا `await` داخل `z(function*(){})`.
4. إن أضفت حقلاً: طبّق القاعدة (أ) في الأماكن الثلاثة.
5. نفّذ فحص الصياغة — القاعدة (ب).
6. commit برسالة واضحة ثم push على الفرع المخصّص فقط.

## 5. ملاحظات وتحذيرات
- لا تفترض وجود مصدر غير مصغّر؛ كل العمل على الملف الناتج.
- المفاتيح المضمّنة (anon JWT, Moyasar pk) عامة بطبيعتها للواجهة، لكن **`cm_fsecret` و `founder-admin`** حسّاسة — لا تكشفها في logs أو commits.
- عند لمس المدفوعات/الجلسة/سر المؤسس: راجع المالك قبل الدفع.

## 6. بنية المستودع وملفات النشر (Repo & deploy layout)
كل ما يُنشر يعيش في **`public/`** (يُسحب بالكامل إلى Netlify — نشر يدوي):

| الملف | الغرض |
|------|-------|
| `public/index.html` | التطبيق المصغّر (المصدر الأصلي). يُقدَّم على `/`. |
| `public/manifest.json` + `public/icon.svg` | PWA (قابلية التثبيت). |
| `public/sw.js` | Service worker: shell offline + كاش الخطوط. **لا يكاش Supabase/Moyasar** (بيانات المنيو تبقى طازجة). مُسجّل عبر سكربت صغير قبل `</body>`. |
| `public/robots.txt` + `public/sitemap.xml` | فهرسة محركات البحث. |
| `public/_headers` | headers أمان (CSP يسمح بـ Supabase/Moyasar/Google Fonts) + سياسة كاش (HTML/sw.js بلا كاش). |
| `public/_redirects` | SPA fallback `/* /index.html 200` — **ضروري** لأن slug المطعم يُقرأ من `location.pathname`؛ بدونه أي زيارة مباشرة لـ`/<slug>` تعطي 404. |
| `netlify.toml` (الجذر) | `publish = "public"` عند ربط Netlify بـ Git. |
| `scripts/check_html_js.mjs` | أداة القاعدة (ب). الاستخدام: `node scripts/check_html_js.mjs public/index.html` |

**نشر يدوي:** اسحب مجلد `public/` كاملاً إلى Netlify؛ `_headers` و`_redirects` تُطبَّق تلقائياً.

> ⚠️ **هيكلة الكود:** لا يمكن "تنظيف"/تفكيك كود `index.html` المصغّر إلى مكوّنات بدون مصدر Vite الأصلي (غير موجود). التنظيم يقتصر على مستوى المستودع/النشر، لا على كود البندل.

## 7. النسخة الجديدة v2 — `app/` (المصدر) + `deploy/` (الناتج للسحب)

إعادة بناء كاملة للمنصة بـ **Vite + React 18 + TypeScript + Tailwind v4** — SPA ثابتة
تُنشر **بالسحب المباشر** على Netlify (بعكس `web/` التي تتطلب ربط Git وبناء SSR):

- **`app/`** — الكود المصدري. `npm run build` داخلها يبني إلى `deploy/` بجذر المستودع.
- **`deploy/`** — الناتج الجاهز (ملتزَم في git): اسحب المجلد كاملاً إلى Netlify وانتهى.
  يحتوي `_redirects` (SPA fallback للـ slug) و`_headers` (CSP بدون Google Fonts —
  الخطوط ذاتية الاستضافة عبر @fontsource) وPWA (manifest + sw + أيقونات) وSEO.
- **نفس الخلفية تماماً**: Supabase نفسه (anon key مضمّن في `app/src/lib/config.ts`)،
  نفس آلية GoTrue (`token?grant_type=password`)، نفس عقود `ai-proxy`
  (body `{system,messages,temperature}` → `{text}`) و`founder-admin`
  (ترويسة `x-founder-secret` + body `{table,method,query,body}`)، ونفس عقد الولاء
  (`loyalty_customers`: `card_code/stamps/total_visits/rewards_used`).
- **القاعدة (أ) مطبقة هيكلياً**: whitelists الكتابة في `app/src/lib/data.ts`
  (`DishPayload`, `RestaurantSettingsPayload`) هي مصدر الحقول الوحيد للإضافة
  والتحديث معاً — حقل جديد يُضاف هناك + في فورم `Dishes.tsx`/`Settings.tsx` + عمود Supabase.
- **التسعير**: من `app/src/lib/plans.ts` — باقتان (99/199) مطابقة لـ `web/src/lib/plans.ts`
  ولمفاتيح دالة moyasar-webhook. Moyasar لا يزال `pk_test` مع `TODO(production)` في `config.ts`.
- جلسة v2 بمفتاح `cm2_session` (لا تتعارض مع `cm_session` القديمة). سر المؤسس يبقى
  `cm_fsecret` في sessionStorage — لا يُضمَّن في الكود أبداً.
- قواعد `web/` (Next.js) و`public/` (القديم) لم تتغير — النسخ الثلاث تتعايش في المستودع.

### تحسينات تُطبَّق على الملف المصغّر (مرجع)
- **عرض روابط التواصل (إصلاح):** حقول `social_instagram/twitter/tiktok/snapchat/maps` على مستوى المطعم كانت تُحفظ لكن **لا تُعرض** للزبون؛ أُضيف عرضها كشرائح (chips) بعد زر تقييم قوقل في صفحة المنيو العامة. (تذكير قاعدة أ: الحقل لا يكفي حفظه — لازم يُعرض أيضاً.)
- **lazy images:** أُضيف `loading="lazy"` + `decoding="async"` للصور البعيدة (أغلفة المدونة/صور القوائم). ملاحظة: صور **base64 المدمجة لا تستفيد** من lazy لأنها محمّلة ضمن الـHTML أصلاً — الحل الجذري لها هو فصلها لملفات.
- **Moyasar:** لا يزال مفتاح الاختبار `pk_test` (بطلب المالك) مع تعليق `TODO(production)` قبله.

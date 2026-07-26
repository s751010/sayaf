# تقرير حالة المشروع — كلاود منيو

> تاريخ التقرير: 2026-07-26 · الفرع: `claude/comprehensive-analysis-comparison-qhgz11`
> الصور في `docs/screenshots/` — التُقطت من التطبيق وهو يعمل فعلاً مقابل قاعدة
> البيانات الحقيقية، لا رسومات تخيّلية.

---

## 1. أين نقف الآن

| | الحالة |
|---|---|
| **النسخة الرسمية** | `web/` — Next.js 16 + React 19 + Tailwind 4 + Supabase SSR |
| **ما يبنيه Netlify** | `web/` (`netlify.toml`: `base="web"`, `publish=".next"`, plugin محوّل Next) |
| **خطة الرجوع** | `app/` + `deploy/` — SPA ثابتة تُنشر بسحب `deploy/` يدوياً |
| **الأرشيف** | `legacy/public/index.html` — الملف المصغّر القديم، للمرجع فقط |
| **بوابة الدفع** | PayLink (بيئة `test` حتى يبدّلها المالك) |
| **قاعدة البيانات** | Supabase — ١٤ جدولاً، RLS مفعّل على الكل |

**بيانات الإنتاج الحالية:** ١٦ مطعماً · ١١ قائمة · ١٩ صنفاً · ١٢ اشتراكاً · عميل ولاء واحد.

---

## 2. الصفحات — ماذا يوجد فعلاً

### الواجهة العامة (للزبون والزائر)

| الصفحة | المسار | الصورة |
|---|---|---|
| الرئيسية التسويقية | `/` | `01-landing.webp` |
| تسجيل الدخول / إنشاء حساب | `/login` | `02-login.webp` |
| **صفحة المنيو** (قلب المنتج) | `/[slug]` | `03-menu-demo.webp` · `06-menu-mobile.webp` |
| المدونة | `/blog` · `/blog/[slug]` | `05-blog.webp` |

**ما بداخل صفحة المنيو:** ثيمات ملوّنة، تبديل عربي/إنجليزي، أقسام وتنقّل بينها،
بطاقات أصناف بالسعرات، نافذة خيارات وإضافات، **سلة طلب** مع إرسال عبر واتساب
ورقم الطاولة (`?table=`)، **زر «ادفع الآن»** عند ربط المطعم بوابته،
**زر «قيّم تجربتك»** (استبيان ٥ أسئلة)، روابط تواصل، ساعات عمل، ومسبّبات حساسية.

### لوحة التاجر — ١٣ صفحة

| الصفحة | المسار | الصورة |
|---|---|---|
| نظرة عامة | `/dashboard` | `10-dashboard.webp` |
| القوائم (**مع زر النسخ**) | `/dashboard/menus` | `11-menus.webp` |
| الأصناف | `/dashboard/dishes` | `12-dishes.webp` |
| إضافة/تعديل صنف | `/dashboard/dishes/new` · `/[id]` | `13-dish-new.webp` |
| أكواد QR (وQR لكل طاولة) | `/dashboard/qr` | `14-qr.webp` |
| الإحصائيات | `/dashboard/analytics` | `15-analytics.webp` |
| **تقييمات الزبائن** 🆕 | `/dashboard/reviews` | `16-reviews.webp` |
| المستشار الذكي | `/dashboard/ai` | `17-ai.webp` |
| بطاقة الولاء | `/dashboard/loyalty` | `18-loyalty.webp` |
| الاشتراك (PayLink) | `/dashboard/billing` | `19-billing.webp` |
| **استقبال المدفوعات** 🆕 | `/dashboard/payments` | `20-payments.webp` |
| الدعم الفني | `/dashboard/support` | `21-support.webp` |
| الإعدادات | `/dashboard/settings` | `22-settings.webp` |

### لوحة المؤسس — ٩ صفحات

| الصفحة | المسار | الصورة |
|---|---|---|
| نظرة عامة | `/founder` | `30-founder.webp` |
| المطاعم والاشتراكات | `/founder/restaurants` | `31-founder-restaurants.webp` |
| الإعلانات | `/founder/announcements` | `32-founder-announcements.webp` |
| أكواد الخصم | `/founder/promos` | `33-founder-promos.webp` |
| **صحة النظام** 🆕 | `/founder/health` | `34-founder-health.webp` |
| **سجل النشاط** 🆕 | `/founder/activity` | `35-founder-activity.webp` |
| المدونة | `/founder/blog` | `36-founder-blog.webp` |
| الدعم | `/founder/support` | `37-founder-support.webp` |
| إعدادات الموقع | `/founder/settings` | `38-founder-settings.webp` |

> **عن صور لوحة المؤسس:** التُقطت بحساب اختبار مؤقت وُجّه إليه `FOUNDER_EMAIL`
> محلياً. دالة `is_founder()` في قاعدة البيانات مربوطة ببريد المالك الحقيقي، لذا
> الأرقام المشتقّة من `subscriptions` تظهر أقل مما هي عليه (٠٪ تفعيل بدل القيمة
> الفعلية). التخطيط والسلوك صحيحان، والأرقام تكتمل عند دخول المالك ببريده.

---

## 3. الخلفية (Supabase)

### الجداول (١٤)
`restaurants` · `menus` · `dishes` · `analytics` · `subscriptions` · `announcements`
· `promo_codes` · `support_tickets` · `revenue_log` · `site_settings` · `blog_posts`
· `loyalty_customers` · **`survey_responses`** 🆕 · **`restaurant_payment_settings`** 🆕

### دوال الحافة (٤) — **تحتاج نشراً يدوياً**
| الدالة | `verify_jwt` | الدور |
|---|---|---|
| `paylink-create` | true | فاتورة اشتراك التاجر بحساب المنصّة |
| `paylink-webhook` | false | المكان الوحيد الذي يُفعَّل فيه اشتراك |
| `paylink-order-create` | false | فاتورة طلب الزبون **بحساب المطعم** |
| `founder-admin` | false | وكيل PostgREST للوحة مؤسس `app/` |

الخطوات الكاملة في `supabase/functions/README.md`.

### قواعد أمنية قائمة
- **لا مفتاح دفع في المتصفح** — أسرار PayLink في أسرار الدوال حصراً.
- **لا مبلغ يأتي من العميل** — لا للاشتراك ولا لطلب الزبون؛ الأسعار تُشتقّ على الخادم.
- **لا تفعيل اشتراك من المتصفح** — الويبهوك وحده، بعد التحقق من الفاتورة عبر `getInvoice`.
- `restaurant_payment_settings` بلا أي سياسة قراءة لدور `anon`.
- `survey_responses`: الكتابة للزائر، والقراءة لصاحب المطعم أو المؤسس فقط.

---

## 4. ما أُضيف في هذه الجولة

| الميزة | الحالة |
|---|---|
| الانتقال من Moyasar إلى PayLink (اشتراكات + طلبات) | ✅ |
| تقييمات الزبائن (استبيان عام + لوحة تحليل) | ✅ |
| بوابة دفع خاصة بكل مطعم | ✅ |
| نسخ القائمة بأصنافها | ✅ |
| صحة النظام + سجل النشاط للمؤسس | ✅ |
| إصلاح canonical/OG وخريطة الموقع وrobots | ✅ |
| توحيد `SITE_URL` على `cloudsmenu` | ✅ |
| اعتماد `web/` هدفاً للبناء في `netlify.toml` | ✅ |

### خطأ حقيقي اكتُشف أثناء التقاط الصور
`/dashboard/support` كانت تسقط بخطأ **500** في الإنتاج. السبب: ثابت
`TICKET_CATEGORIES` كان يُصدَّر من ملف `"use server"`، وهذه الملفات لا يجوز أن
تُصدِّر إلا دوالّ async — فحوّله المُجمِّع إلى مرجع server action وصار
`TICKET_CATEGORIES.map` على العميل «ليس دالة». نُقل الثابت إلى `web/src/lib/support.ts`
وعادت الصفحة تعمل. **لولا التقاط الصور لما ظهر هذا الخطأ**، لأن `tsc` و`lint`
و`build` كلها كانت تمرّ.

---

## 5. ما تبقّى على المالك

1. **متغيّرات البيئة في Netlify:** `NEXT_PUBLIC_SUPABASE_URL` و
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` و`FOUNDER_EMAIL`.
2. **نشر دوال الحافة الأربع** وضبط أسرارها (`supabase/functions/README.md`).
3. **ربط رابط ويبهوك PayLink** من لوحة `my.paylink.sa`.
4. **الانتقال لإنتاج PayLink** حين يحين: `PAYLINK_ENV=production` + مفاتيح حقيقية.
5. **تفعيل حماية كلمات المرور المسرَّبة** في إعدادات Supabase Auth — `get_advisors`
   يرصدها معطّلة.

### نُفِّذ لاحقاً ✅
- **حجب `user_id` عن الزائر** بصلاحيات على مستوى العمود على `restaurants`
  و`menus` و`dishes`، وتحويل تسجيل المشاهدات لدالة `track_menu_view`. تحقّقنا
  فعلياً: `user_id` لم يعد يظهر في HTML الصفحة العامة (كان يظهر ١٢ مرة).
- **توليد `slug` للمطاعم الستة** — كل الـ١٦ صارت لها روابط فريدة وصفحاتها تفتح.
- **إصلاح الروابط العربية** — خلل قائم كشفه التوليد: `وصفة-شاي-5492` (أنشأه
  التطبيق نفسه قبل أي تعديل) كانت صفحته ترجع 404 رغم وجود المطعم. السبب أن
  مسار الرابط يصل مُرمَّزاً أحياناً، فأُضيف `normalizeSlug`.

### باقٍ — يحتاج لوحة Supabase (لا يمكن عبر MCP)
- **حماية كلمات المرور المسرَّبة** معطّلة: Authentication → Providers → Email →
  «Leaked password protection». لا تتيح أدوات MCP تعديل إعدادات Auth، فهذه
  بضغطة منك.

### ملاحظات تستحق قراراً
- سرد كل المطاعم ما زال ممكناً للزائر (أسماء وروابط فقط، بلا `user_id`). هذا
  متأصّل في منتج منيو عام يُفتح بالرابط؛ تضييقه أكثر يتطلب إخفاء الروابط نفسها.
- `track_menu_view` تظهر في `get_advisors` كدالة SECURITY DEFINER متاحة للزائر —
  **مقصود**: هذا غرضها. سطحها ضيق (وسيط واحد، لا تُرجع بيانات، تتجاهل أي معرّف
  غير موجود).
- الملف المصغّر في `legacy/` ما زال يحمل الأخطاء الموثّقة في
  `ANALYSIS-COMPARISON.md` (الباب الخلفي، تعارض الأسعار…). لم يُمس بقرارك، وهو
  الآن أرشيف فقط بعد أن صار `web/` هو الرسمي.

---

## 6. التحقق المنفَّذ

| الفحص | النتيجة |
|---|---|
| `npx tsc --noEmit` في `web/` | ✅ |
| `npm run lint` في `web/` | ✅ |
| `npm run build` في `web/` | ✅ |
| `npm run build` في `app/` (يشمل tsc) | ✅ |
| `deno check` للدوال الأربع | ✅ |
| `get_advisors(security)` بعد الترحيلات | ✅ لا تحذيرات RLS |
| اختبار RLS بدور `anon` داخل معاملة مُلغاة | ✅ القبول والرفض كما هو متوقّع |
| تشغيل التطبيق والتقاط ٢٨ صفحة | ✅ 28/28 |

كل بيانات الاختبار المؤقتة حُذفت بعد التقاط الصور، وعادت الأعداد إلى ما كانت
عليه بالضبط (١٦ / ١١ / ١٩).

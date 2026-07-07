# CloudMenu — Next.js rebuild (`web/`)

إعادة بناء احترافية لـ«كلاود منيو» على ستاك حديث. هذا المجلد هو **مستقبل**
المشروع؛ الموقع الحالي (`../public/index.html` المصغّر) يبقى شغّالاً على Netlify
حتى يكتمل البديل ونبدّل.

## الستاك
- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (نظام تصميم بهوية كلاود منيو عبر `@theme`)
- **Supabase** (PostgREST عبر `@supabase/supabase-js`)
- مكوّنات UI على نمط shadcn (`class-variance-authority`) + أيقونات `lucide-react`
- خطوط عربية: Cairo + Tajawal عبر `next/font` (RTL أصيل)

## التشغيل محلياً
```bash
cd web
cp .env.example .env.local   # عبّئ قيم Supabase العامة
npm install
npm run dev                  # http://localhost:3000
```

## البنية
```
src/
  app/
    layout.tsx          # RTL, lang=ar, خطوط, metadata/OG
    page.tsx            # صفحة الهبوط (Static) — hero/مميزات/أسعار/CTA
    [slug]/page.tsx     # صفحة المنيو العامة (SSR/ISR) — قلب المنتج
    not-found.tsx       # 404 بهوية العلامة
    robots.ts | sitemap.ts | manifest.ts   # SEO/PWA (توليد تلقائي)
  components/
    ui/                 # Button, Card, Badge (cva)
    site/               # Navbar, Footer, Logo
    menu/               # DishCard, SocialLinks
  lib/
    types.ts            # أنواع المجال (Restaurant/Menu/Dish) + Database
    data.ts             # طبقة جلب البيانات (getPublicMenu / getRestaurantBySlug)
    supabase/           # عملاء الخادم/المتصفح + قراءة env
    utils.ts            # cn() + formatPrice()
```

## ما تم إنجازه (هذه الجولة)
- ✅ نظام تصميم كامل بهوية العلامة (ذهبي/فحمي/كريمي، خطوط عربية، RTL).
- ✅ صفحة هبوط احترافية (Static) — متجاوبة بالكامل.
- ✅ **صفحة المنيو العامة** `/[slug]` بـ SSR من Supabase: ترويسة المطعم،
  أصناف مجمّعة بالأقسام، قيم غذائية، وروابط التواصل (تُعرض فعلاً — إصلاح
  ثغرة النسخة القديمة).
- ✅ SEO أصيل: metadata/OG ديناميكي لكل مطعم + robots/sitemap + PWA manifest.
- ✅ بناء نظيف (`npm run build`) و ESLint نظيف.

## خارطة الطريق (التالي) — انظر `MIGRATION.md`
المصادقة، لوحة تحكم المطعم (CRUD للقوائم/الأصناف)، QR، الإحصائيات،
المدفوعات (Moyasar)، المجلس الاستشاري AI، الولاء، المدونة، لوحة المؤسس.

## النشر
- **Netlify (Git):** `netlify.toml` في جذر المستودع يحتاج تحديث `base="web"` و
  `publish=".next"` مع إضافة `@netlify/plugin-nextjs` عند التبديل.
- **أو Vercel:** نشر مباشر لمجلد `web/` (الأنسب لـ Next.js).
- لا تبدّل DNS/الدومين إلا بعد اكتمال تكافؤ الميزات مع النسخة الحالية.

# CloudMenu — كلاود منيو

منيو رقمي QR للمطاعم السعودية. تطبيق **Next.js 16 + React 19 + Tailwind 4** مع backend
على **Supabase** (Auth + PostgREST + RLS) ومدفوعات **Moyasar**، ويُستضاف على **Netlify**.

> ⚠️ **اقرأ [`CLAUDE.md`](./CLAUDE.md) قبل أي تعديل.** المصدر الحيّ الوحيد هو مجلد
> [`web/`](./web). النسخة المصغّرة القديمة أُرشِفت في `legacy/` ولم تعد تُطوَّر أو تُنشر.

## بنية المستودع

```
web/                    ← تطبيق Next.js (المصدر الحيّ الوحيد)
  src/app/              ← الصفحات وserver actions (/، /[slug]، /dashboard، /founder، /blog)
  src/components/       ← المكوّنات (site, menu, dashboard, founder, billing, ui)
  src/lib/              ← منطق مشترك (supabase, founder, entitlements, plans, themes)
  .env.example          ← متغيّرات البيئة المطلوبة
netlify.toml            ← إعداد النشر (base = "web")
CLAUDE.md               ← المرجع الإلزامي للعمل على المشروع
legacy/                 ← أرشيف الموقع المصغّر القديم (لا يُنشر)
  public/index.html
  check_html_js.mjs
```

## التطوير المحلي

```bash
cd web
npm install
cp .env.example .env.local   # ثم املأ المفاتيح
npm run dev
```

## النشر (Deployment)

**Netlify مربوط بـ Git.** عند الدفع للفرع المرتبط، يبني Netlify التطبيق تلقائياً عبر
`netlify.toml` بالجذر (`base = "web"`) — لا حاجة لضبط Base directory يدوياً.

1. أضِف متغيّرات البيئة من [`web/.env.example`](./web/.env.example) في
   Netlify → Site settings → Environment variables:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `FOUNDER_EMAIL`,
   `NEXT_PUBLIC_MOYASAR_PK`.
2. الدومين الحالي: `cloudmenuy.netlify.app` (مؤقت حتى شراء دومين رسمي).
   عند تغيير الدومين مستقبلاً: عدّل `SITE_URL` في `web/src/lib/site.ts` فقط —
   كل شيء (metadata، sitemap، robots، أكواد QR، الروابط) يشتق منه.

## التحقق قبل أي push

```bash
cd web
npm run build && npx tsc --noEmit && npm run lint
```

يجب أن تمرّ كلها بصفر أخطاء.

## ملاحظات production

- **Moyasar:** لا يزال مفتاح الاختبار `pk_test` (بطلب المالك). ضع `pk_live_...` في
  المتغيّر `NEXT_PUBLIC_MOYASAR_PK` قبل تفعيل الدفع الحقيقي.
- **الأمان:** جداول المؤسس مقفولة في RLS عبر دالة `is_founder()`. بعد أي تعديل على
  قاعدة البيانات، شغّل advisors الأمان في Supabase للتأكد من عدم وجود سياسات مكشوفة.

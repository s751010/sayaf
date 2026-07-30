# CloudMenu — كلاود منيو

منيو رقمي QR للمطاعم السعودية. تطبيق ويب **Vite + React 18 + TypeScript + Tailwind v4**،
مع backend على Supabase ومدفوعات Moyasar، ويُستضاف على Netlify.

> اقرأ [`CLAUDE.md`](./CLAUDE.md) قبل أي تعديل.

## بنية المستودع

```
app/                    ← الكود المصدري (هذا ما تعدّله)
  src/
    pages/              ← الصفحات (المنيو العام، لوحة التحكم، الهبوط، الديمو…)
    components/         ← ui.tsx (نظام التصميم) + site.tsx + ImageUploader
    lib/                ← data.ts (كل الاستعلامات) + api/session/plans/themes…
    styles/global.css   ← رموز التصميم (tokens) للوضع الداكن/الفاتح
  public/               ← ملفات ثابتة تُنسخ كما هي (_headers, _redirects, PWA…)
deploy/                 ← ناتج البناء (ملتزَم في git — لا تعدّله يدوياً)
netlify.toml            ← إعداد النشر
CLAUDE.md               ← المرجع الإلزامي للعمل على المشروع
```

> **نسخة واحدة فقط.** المجلدات القديمة `public/` (الملف المصغّر) و `web/` (Next.js)
> حُذفت — كانت ثلاث نسخ متوازية تتباعد عن بعضها (أسعار وحقول مختلفة). التاريخ
> محفوظ في git لو احتجت الرجوع لها.

## التطوير

```bash
cd app
npm ci
npm run dev          # خادم تطوير
npm run typecheck    # فحص الأنواع فقط (سريع)
npm run build        # tsc --noEmit && vite build  →  ../deploy
```

## النشر (Deployment)

**عند الربط بـ Git:** Netlify يقرأ `netlify.toml` بالجذر ويبني تلقائياً:

```toml
[build]
  command = "cd app && npm ci && npm run build"
  publish = "deploy"
```

**نشر يدوي (drag-and-drop):** ابنِ محلياً ثم اسحب مجلد **`deploy/`** بالكامل إلى
لوحة Netlify. ملفات `_headers` و `_redirects` تُطبَّق تلقائياً.

تحقق بعد النشر أن هذه الروابط تعمل (ليست 404):
- `https://cloudsmenu.netlify.app/robots.txt`
- `https://cloudsmenu.netlify.app/manifest.webmanifest`
- `https://cloudsmenu.netlify.app/demo` (منيو تجريبي حي)
- `https://cloudsmenu.netlify.app/<any-slug>` (يجب أن يفتح التطبيق لا 404)

## ملاحظات production

- **Moyasar:** لا يزال مفتاح الاختبار `pk_test` (بطلب المالك). استبدله بـ `pk_live`
  في `app/src/lib/config.ts` ثم أعد البناء — ابحث عن `TODO(production)`.
  التطبيق يعرض تنبيه «وضع الاختبار» تلقائياً طالما المفتاح يبدأ بـ `pk_test`.
- **CSP:** الـ`Content-Security-Policy` في `app/public/_headers` يسمح بـ Supabase
  و Moyasar. الخطوط ذاتية الاستضافة (@fontsource) فلا حاجة لـ Google Fonts.
- **OG image:** `og:image` يشير حالياً إلى `icon.svg`؛ يُفضّل استبداله بصورة
  PNG 1200×630 لأن بعض منصات التواصل لا تعرض SVG.

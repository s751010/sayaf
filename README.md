# CloudMenu — كلاود منيو

منيو رقمي QR للمطاعم السعودية. تطبيق ويب (React/Vite) يُسلَّم كملف HTML واحد،
مع backend على Supabase ومدفوعات Moyasar، ويُستضاف على Netlify.

> ⚠️ **اقرأ [`CLAUDE.md`](./CLAUDE.md) قبل أي تعديل.** الملف المُسلَّم مصغّر وهو
> المصدر الأصلي (لا يوجد مصدر غير مصغّر)، وكل تعديل يتم عبر استبدال نصّي دقيق.

> 🚧 **إعادة بناء جارية:** يجري بناء نسخة احترافية حديثة على **Next.js + Tailwind
> + Supabase** في مجلد [`web/`](./web). الموقع الحالي (`public/`) يبقى هو الإنتاج
> حتى يكتمل البديل. انظر [`web/MIGRATION.md`](./web/MIGRATION.md) لحالة الهجرة.

## بنية المستودع

```
public/                 ← مجلد النشر (هذا ما يُرفع إلى Netlify)
  index.html            ← التطبيق (ملف HTML مصغّر، ~1.49MB)
  manifest.json         ← PWA
  sw.js                 ← Service worker (offline shell + كاش الخطوط)
  icon.svg              ← أيقونة PWA / apple-touch-icon
  robots.txt            ← فهرسة
  sitemap.xml           ← خريطة الموقع
  _headers              ← Netlify: headers أمان + سياسة كاش
  _redirects            ← Netlify: SPA fallback (مهم: روابط /<slug>)
netlify.toml            ← إعداد النشر عند الربط بـ Git
scripts/
  check_html_js.mjs     ← فحص صياغة JS داخل الـHTML (إلزامي بعد كل تعديل)
CLAUDE.md               ← المرجع الإلزامي للعمل على المشروع
```

## النشر (Deployment)

**الطريقة الحالية: نشر يدوي (drag-and-drop).**

1. اسحب مجلد **`public/`** بالكامل إلى لوحة Netlify (Deploys → drag & drop).
2. ملفات `_headers` و `_redirects` داخل المجلد تُطبَّق تلقائياً.
3. تحقق بعد النشر أن هذه الروابط تعمل (ليست 404):
   - `https://cloudsmenu.netlify.app/robots.txt`
   - `https://cloudsmenu.netlify.app/manifest.json`
   - `https://cloudsmenu.netlify.app/<any-slug>` (يجب أن يفتح التطبيق لا 404)

> عند ربط Netlify بمستودع Git لاحقاً: `netlify.toml` يضبط `publish = "public"`
> تلقائياً.

## بعد أي تعديل على `public/index.html`

```bash
node scripts/check_html_js.mjs public/index.html
```

يجب أن يمر الفحص بصفر أخطاء قبل أي commit/نشر (القاعدة (ب) في CLAUDE.md).

## ملاحظات production

- **Moyasar:** لا يزال مفتاح الاختبار `pk_test` (بطلب المالك). استبدله بـ `pk_live`
  قبل تفعيل الدفع الحقيقي — ابحث عن `TODO(production)` في `index.html`.
- **CSP:** الـ`Content-Security-Policy` في `_headers` مضبوط للسماح بـ Supabase و
  Moyasar و Google Fonts. لو ظهرت مشكلة في الدفع/التحميل بعد النشر، راجع رسائل
  الـconsole وعدّل المصادر المسموحة في `_headers`.
- **OG image:** `og:image` يشير حالياً إلى `icon.svg`؛ يُفضّل استبداله بصورة
  PNG 1200×630 لأن بعض منصات التواصل لا تعرض SVG.

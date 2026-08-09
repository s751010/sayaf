import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

// الناتج يُبنى في deploy/ بجذر المستودع — وهو المجلد الذي يُسحب إلى Netlify.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    fs: {
      /**
       * ⚠️ **ضروري لـ`shared/`** — وإلا انكسر `npm run dev` وحده.
       *
       * `lib/menuUrl.ts` يستورد `../../../shared/menu-url.mjs` (شيفرة خالصة
       * تتشاركها الواجهة ودالة الحافة وسكربت الخريطة والاختبارات). البناء
       * يحلّها بلا مشكلة — لكن خادم التطوير يمنع ما هو **خارج جذره** فيردّ
       * «403 Restricted». مُتحقَّق بالفعل: البناء أخضر والتطوير كان يسقط.
       */
      allow: [fileURLToPath(new URL("..", import.meta.url))],
    },
  },
  build: {
    outDir: "../deploy",
    emptyOutDir: true,
    chunkSizeWarningLimit: 900,
    /**
     * ⚠️ **خرائط المصدر لا تُنشَر.**
     *
     * كانت `true` بحجّة «تشخيص أخطاء الإنتاج» — و**لا توجد أداة تشخيص تستهلكها**
     * (لا Sentry ولا غيرها). فالنتيجة كانت ١٣ ملفاً و٢٫٣ ميغابايت من الشيفرة
     * المصدرية كاملةً بتعليقاتها — بما فيها شروح الأمان و«لماذا لم نغلق هذا» —
     * منشورة للعالم على `/assets/*.map` **بلا مقابل واحد**.
     *
     * الخريطة تنفع حين يقرؤها متتبّع أخطاء، لا حين يقرؤها زائر.
     *
     * ✅ **متى تعود**: يوم يُركَّب متتبّع أخطاء، اضبطها `"hidden"` — تُولَّد
     * الخرائط بلا تعليق `//# sourceMappingURL` في الحزم، فتُرفع إلى المتتبّع
     * في خطوة النشر **ثم تُحذف من `deploy/`**. `"hidden"` وحدها لا تكفي:
     * الملفات تبقى في المجلد فتُنشَر مع كل شيء آخر.
     */
    sourcemap: false,
  },
});

/**
 * إعداد الاختبارات.
 *
 * منفصل عن `vite.config.ts` لأن ذاك يحمّل إضافتَي React وTailwind — ولا حاجة
 * إليهما لاختبار دوالّ خالصة، وتحميلهما يبطئ كل تشغيل بلا مقابل.
 *
 * `root` يبقى `app/` لكن الاختبارات تصل ما فوقه (`../shared` و
 * `../supabase/functions/_shared`): فحوص التكافؤ **يجب** أن تستورد الطرفين
 * الحقيقيين، وإلا صارت تفحص نسخةً ثالثة لا ما يُنشَر.
 */
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    environment: "node",
    // مسارات مطلقة في المخرَج تسهّل فتح الملفّ من الطرفية.
    reporters: ["default"],
  },
});

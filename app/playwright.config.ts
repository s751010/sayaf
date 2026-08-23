/**
 * فحص المتصفّح — الطبقة التي كانت مفقودة.
 *
 * ═══ لماذا وُجد هذا الملفّ ═══
 *
 * عطل `React #310` (خطّافات تحت عودة مبكّرة) أطفأ **كل منيو** ومرّ من
 * `typecheck` و`npm test` و`npm run build` ثلاثتها. السبب أن ٤٣٢ فحصاً كلّها
 * تفحص دوالّ خالصة — ولا واحد منها يركّب شجرة React في متصفّح حقيقي. والصفحة
 * تُرسَم صحيحةً حتى تصل الشبكة، فالعطل يظهر بعد أوّل `await` لا قبله.
 *
 * فهذا الفحص لا يفحص منطقاً: يفحص أن **الصفحة تُقلع ولا تنهار**.
 *
 * ═══ لماذا `vite` لا `vite preview` ═══
 *
 * `preview` خادمٌ ساكن **بلا سقوط SPA**: يعيد ٤٠٤ لكل مسار فرعي فيخدع الفحص
 * بأخضر كاذب على `/` وأحمر كاذب على `/demo`. والتحذير مكتوب في `LAUNCH.md`.
 * وخادم التطوير يحمل نفس شجرة المكوّنات — وهي ما نفحص.
 */
import { defineConfig, devices } from "@playwright/test";

const PORT = 4319;

export default defineConfig({
  testDir: "./e2e",
  // فحص إقلاع لا فحص منطق: لا يستحقّ تكراراً، والفشل هنا فشلٌ حقيقي دائماً.
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? "list" : "line",
  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    locale: "ar-SA",
    // العربية RTL هي المنتج — وفحصٌ بلغة أخرى يفحص منتجاً آخر.
    trace: process.env.CI ? "retain-on-failure" : "off",
    /**
     * متصفّح مثبَّت مسبقاً — لبيئة فيها كروميوم لا يطابق نسخة Playwright.
     *
     * في CI لا تُضبط المتغيّرة إطلاقاً: العدّاء ينزّل النسخة المطابقة بـ
     * `playwright install`، وهي **الصحيحة** لأنها التي فُحصت عليها المكتبة.
     * وهذه المتغيّرة مخرجٌ للبيئات المغلقة وحدها (حاويات بلا تنزيل).
     */
    launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined },
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // الجوال ليس ترفاً: **كل** زبون يفتح المنيو من كود QR بجواله.
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],

  webServer: {
    command: `npx vite --port ${PORT} --host 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});

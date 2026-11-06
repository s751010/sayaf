/**
 * فحص صفحات قبل النشر — يشغّله وكيل «مراجع الجودة» (`.claude/agents/cm-qa.md`).
 *
 * يُقلع خادم Vite بنفسه، ويفتح كل مسارٍ يُمرَّر على جوّال ٣٩٠ وحاسوب ١٢٨٠، ويطبع
 * جدولاً نصّياً: هل تُقلع الصفحة، وهل فيها فيضٌ أفقي، وأخطاء المتصفّح. ويحفظ لقطة
 * لكل فشل في `company/qa/` — **لا لقطة للنجاح** كي لا يُقرأ ما لا يلزم.
 *
 *   node scripts/qa-pages.mjs / /demo /tools/calorie-calculator
 *
 * المخرج الأخير سطرٌ واحد: `QA: PASS` أو `QA: FAIL (n)` — يقرؤه الوكيل ولا يحتاج غيره.
 * صفحات اللوحة تحتاج جلسةً مُحاكاة: لها `npx playwright test e2e/dashboard.spec.ts`.
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { chromium } from "@playwright/test";

const here = dirname(fileURLToPath(import.meta.url));
const paths = process.argv.slice(2);
if (!paths.length) {
  console.error("الاستعمال: node scripts/qa-pages.mjs <مسار> [مسار…]");
  process.exit(1);
}

const PORT = Number(process.env.QA_PORT ?? 4479);
const WIDTHS = [390, 1280];
const day = new Date().toISOString().slice(0, 10);
const shots = join(here, "../../company/qa", day);

const server = await createServer({ root: join(here, ".."), server: { port: PORT, strictPort: true, host: "127.0.0.1" }, logLevel: "error" });
await server.listen();
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined });

let failures = 0;
console.log("| المسار | العرض | يُقلع | فيض أفقي | أخطاء |");
console.log("|---|---|---|---|---|");
for (const path of paths) {
  for (const width of WIDTHS) {
    const page = await (await browser.newContext({ viewport: { width, height: 900 }, locale: "ar-SA" })).newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 120)));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 120)));
    let ok = true;
    try {
      const res = await page.goto(`http://127.0.0.1:${PORT}${path}`, { waitUntil: "networkidle", timeout: 20000 });
      ok = !!res && res.ok();
      await page.waitForTimeout(800);
    } catch {
      ok = false;
    }
    const sw = await page.evaluate(() => document.documentElement.scrollWidth).catch(() => 0);
    const overflow = sw > width + 1;
    // أخطاء الشبكة إلى Supabase متوقّعة هنا (لا قاعدة في الفحص) — لا تُعدّ.
    const real = errors.filter((e) => !/supabase|Failed to load resource|net::ERR/i.test(e));
    const bad = !ok || overflow || real.length > 0;
    if (bad) {
      failures++;
      mkdirSync(shots, { recursive: true });
      await page.screenshot({ path: join(shots, `${path.replace(/\W+/g, "_") || "root"}-${width}.png`), fullPage: true });
    }
    console.log(`| ${path} | ${width} | ${ok ? "✓" : "✗"} | ${overflow ? `✗ ${sw}px` : "✓"} | ${real.length ? real.join(" · ") : "—"} |`);
    await page.context().close();
  }
}
await browser.close();
await server.close();
console.log(failures ? `\nQA: FAIL (${failures}) — اللقطات في company/qa/${day}/` : "\nQA: PASS");
process.exit(failures ? 1 : 0);

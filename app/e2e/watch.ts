/**
 * مراقب الانهيار — مشترك بين ملفّات الفحص.
 *
 * يفرّق بين `pageerror` (استثناءٌ غير ملتقَط: عطلنا دائماً) وخطأ console من
 * نوع «تعذّر تحميل مورد» (قد يكون شبكةً محجوبة في بيئة الفحص). التفصيل في رأس
 * `smoke.spec.ts`.
 */
import type { ConsoleMessage, Page } from "@playwright/test";

/** أخطاء يسبّبها انقطاع الشبكة لا الشيفرة — تُسجَّل ولا تُسقِط. */
const NETWORK_NOISE = /Failed to load resource|net::ERR_|ERR_CONNECTION|fetch/i;

export function watch(page: Page): { crashes: string[] } {
  const crashes: string[] = [];
  page.on("pageerror", (e) => crashes.push(`pageerror: ${e.message}`));
  page.on("console", (m: ConsoleMessage) => {
    if (m.type() !== "error") return;
    const text = m.text();
    if (!NETWORK_NOISE.test(text)) crashes.push(`console: ${text}`);
  });
  return { crashes };
}

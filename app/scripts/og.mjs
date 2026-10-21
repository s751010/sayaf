/**
 * يولّد صورة المشاركة `public/og.png` بمقاس ١٢٠٠×٦٣٠.
 *
 * ═══ لماذا سكربت لا ملفّ صورة يُرفع بيد ═══
 *
 * الصورة تحمل **رموز العلامة نفسها** (`--c-gold` · `--c-page` · الزخرفة)،
 * فتغيير لون العلامة يوماً يعيد توليدها بأمر واحد بدل أن تبقى صورةً قديمة
 * تناقض الموقع. وهو نفس مبدأ §17: **معاينة بمنطق رسم آخر تكذب**.
 *
 * يُشغَّل يدوياً عند تغيير الهوية:  node scripts/og.mjs
 * ولا يدخل مسار البناء: الخرج ملفّ ساكن في `public/` يُلتزَم في git، فلا
 * يحتاج كل بناء متصفّحاً.
 *
 * الخطوط تُقرأ من `node_modules/@fontsource*` مباشرةً وتُضمَّن base64 — لأن
 * الصفحة تُرسَم من `file://` بلا خادم، ولأن انتظار خطّ لم يصل يُخرج العربية
 * بخطّ احتياطي **بصمت** (درس §18).
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, "..");

/** يقرأ ملفّ خطّ ويعيده data URI — أو null إن لم يوجد. */
function fontData(rel) {
  const p = join(app, "node_modules", rel);
  if (!existsSync(p)) {
    console.warn(`⚠️  خطّ مفقود: ${rel}`);
    return null;
  }
  return `data:font/woff2;base64,${readFileSync(p).toString("base64")}`;
}

/**
 * خطّا المنصّة نفسهما (`main.tsx`): **المراعي** للعنوان و**طجوال** للنصّ.
 * كانت الصورة بريم كوفي والقاهرة — فلمّا تبدّل خطّ المنصّة (٢٠٢٦/١٠) صارت
 * بطاقة المشاركة آخر مكانٍ يحمل الخطّ القديم، وهي أوّل ما يراه من يُرسَل إليه الرابط.
 */
const almarai = fontData("@fontsource/almarai/files/almarai-arabic-800-normal.woff2");
const tajawal500 = fontData("@fontsource/tajawal/files/tajawal-arabic-500-normal.woff2");
const tajawal700 = fontData("@fontsource/tajawal/files/tajawal-arabic-700-normal.woff2");
// ⚠️ **والأرقام في المجموعة اللاتينية لا العربية**: أوّل توليد رسم «182» بخطّ
// احتياطي ذي زوائد لأن ملفّ `arabic` وحده لا يحمل 0-9.
const almaraiLatin = fontData("@fontsource/almarai/files/almarai-latin-800-normal.woff2");
const tajawalLatin500 = fontData("@fontsource/tajawal/files/tajawal-latin-500-normal.woff2");
const tajawalLatin700 = fontData("@fontsource/tajawal/files/tajawal-latin-700-normal.woff2");
if (![almarai, tajawal500, tajawal700, almaraiLatin, tajawalLatin500, tajawalLatin700].every(Boolean)) {
  console.error("✗ تعذّر تحميل الخطوط — الصورة كانت ستُرسم بخطّ احتياطي. أُوقف.");
  process.exit(1);
}

/**
 * ⚠️ **رموز «ملصقٌ وسدو» — مطابقة للوضع الأساس في `styles/global.css`.**
 *
 * كانت البطاقة بذهب الهوية السابقة وورقها، وتَعِد بـ«تجربة رقمية فاخرة» —
 * وعدُ المنتج قبل إعادة التموضع. فمن فتح الرابط وجد صفحةً غير التي وُعد بها.
 * والوعد الآن وعد الهبوط حرفياً: الملصق المحسوب من الوصفة.
 */
const PAGE = "#f3f1ec";
const INK = "#15130f";
const DIM = "#5a5346";
const GOLD = "#785d16";
const SADU = "#9b2318";

/** `#rrggbb` → `r,g,b` — لبناء `rgba()` من نفس المصدر. */
const rgb = (hex) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(",");
const GOLD_RGB = rgb(GOLD);
const INK_RGB = rgb(INK);

/** شريط السدو — على هيئة `.sadu-band` في الموقع مكبّرةً: مثلّثات بين خيطين. */
const sadu = `background:
  linear-gradient(135deg, ${SADU} 25%, transparent 25%) 0 3px / 20px 10px repeat-x,
  linear-gradient(225deg, ${SADU} 25%, transparent 25%) 0 3px / 20px 10px repeat-x,
  linear-gradient(to bottom, ${INK} 0 3px, transparent 3px 13px, ${INK} 13px);`;

/**
 * الملصق بأرقام مثال البطل (لاتيه كراميل · `lib/recipeExamples.ts`) كما يحسبها
 * المحرّك — لا أرقامٌ تزيينية: من يفتح الرابط ويجرّب المثال يجد الرقم نفسه.
 */
const label = [
  ["الدهون", "6.9 غ"],
  ["السكريات", "22.9 غ"],
  ["الصوديوم", "98 ملغم"],
  ["الكافيين", "127 ملغم"],
  ["دقائق مشي لحرقها", "46"],
];

const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<style>
  @font-face { font-family: "Almarai"; src: url("${almarai}") format("woff2"); font-weight: 800; }
  @font-face { font-family: "Tajawal"; src: url("${tajawal500}") format("woff2"); font-weight: 500; }
  @font-face { font-family: "Tajawal"; src: url("${tajawal700}") format("woff2"); font-weight: 700; }
  @font-face { font-family: "AlmaraiL"; src: url("${almaraiLatin}") format("woff2"); font-weight: 800; }
  @font-face { font-family: "TajawalL"; src: url("${tajawalLatin500}") format("woff2"); font-weight: 500; }
  @font-face { font-family: "TajawalL"; src: url("${tajawalLatin700}") format("woff2"); font-weight: 700; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  /* القصّ على الجذر لا على body وحده. أوّل توليد خرج مقصوصاً: صفّ الشرائح
     تجاوز عرض ١٢٠٠ فاتّسع المستند، وفي RTL يمتدّ الفائض يساراً ويبدأ العرض
     من الحافة اليمنى — فانزاحت الصورة ١٩٠px وقُصّ نصفها. العلاج عند المصدر:
     منع الفائض بالالتفاف وسقف العرض، لا إزاحة معاكسة تداري الأثر. */
  html { width: 1200px; height: 630px; overflow: hidden; }
  body { width: 1200px; height: 630px; background: ${PAGE}; color: ${INK};
    font-family: "Tajawal", "TajawalL", sans-serif; position: relative; overflow: hidden;
    background-image: radial-gradient(760px 380px at 92% -12%, rgba(${GOLD_RGB},0.14), transparent 60%); }
  .wrap { position: relative; height: 100%; display: grid; grid-template-columns: 1fr 400px;
    gap: 64px; align-items: center; padding: 0 76px; }
  .text { display: flex; flex-direction: column; gap: 24px; min-width: 0; }
  .kicker { align-self: flex-start; display: inline-flex; align-items: center; gap: 12px;
    border: 1px solid rgba(${INK_RGB},0.14); background: #fff; border-radius: 999px;
    padding: 10px 22px; font-size: 23px; font-weight: 700; }
  .kicker i { width: 10px; height: 10px; border-radius: 50%; background: ${SADU}; display: block; }
  h1 { font-family: "Almarai", "AlmaraiL", sans-serif; font-weight: 800; font-size: 60px; line-height: 1.3; white-space: nowrap; letter-spacing: -0.5px; }
  h1 em { font-style: normal; color: ${GOLD}; }
  p { font-size: 26px; font-weight: 500; color: ${DIM}; line-height: 1.6; }
  .band { width: 240px; height: 16px; ${sadu} }
  .foot { display: flex; align-items: center; gap: 22px; margin-top: 6px; }
  .brand { display: flex; align-items: center; gap: 10px;
    font-family: "Almarai", "AlmaraiL"; font-weight: 800; font-size: 28px; }
  .brand b { color: ${GOLD}; }
  .label { background: #fff; border: 3px solid ${INK}; border-radius: 12px; padding: 22px 24px;
    box-shadow: 0 34px 80px -44px rgba(0,0,0,0.6); }
  .label h3 { font-family: "Almarai", "AlmaraiL"; font-weight: 800; font-size: 32px; }
  .label small { font-size: 17px; font-weight: 500; color: ${DIM}; }
  .thick { height: 12px; background: ${INK}; margin: 12px 0; }
  .mid { height: 5px; background: ${INK}; margin: 10px 0 4px; }
  .big { display: flex; justify-content: space-between; align-items: baseline; }
  .big span { font-size: 25px; font-weight: 700; }
  .big strong { font-family: "Almarai", "AlmaraiL"; font-weight: 800; font-size: 66px; line-height: 1; }
  .row { display: flex; justify-content: space-between; align-items: baseline; padding: 9px 0;
    border-bottom: 1px solid rgba(${INK_RGB},0.15); font-size: 21px; font-weight: 500; }
  .row:last-child { border-bottom: 0; }
  .row b { font-weight: 700; }
</style></head><body>
  <div class="wrap">
    <div class="text">
      <span class="kicker"><i></i>للمطاعم والمقاهي السعودية</span>
      <h1>منيو يشبه مطعمك،<br><em>ويبيع عنك.</em></h1>
      <p>باسمك وشعارك وألوانك — يطلب الزبون ويدفع من الطاولة، والسعرات محسوبة من وصفاتك. <span style="white-space: nowrap">9 طوابع.</span></p>
      <div class="foot">
        <div class="brand">
          <svg width="40" height="40" viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0c96a"/><stop offset="1" stop-color="#c99a2e"/></linearGradient></defs><path d="M13 30a7 7 0 0 1 .6-13.97A10 10 0 0 1 33 14a8 8 0 0 1 2 15.75V30H13Z" fill="url(#g)"/><rect x="16" y="33" width="16" height="2.6" rx="1.3" fill="url(#g)" opacity=".85"/><rect x="19" y="38" width="10" height="2.6" rx="1.3" fill="url(#g)" opacity=".55"/></svg>
          كلاود <b>منيو</b>
        </div>
        <div class="band"></div>
      </div>
    </div>
    <div class="label">
      <h3>القيم الغذائية</h3><small>لاتيه كراميل · لكل حصّة (286 غ)</small>
      <div class="thick"></div>
      <div class="big"><span>السعرات الحرارية</span><strong>182</strong></div>
      <div class="mid"></div>
      ${label.map(([k, v]) => `<div class="row"><span>${k}</span><b>${v}</b></div>`).join("")}
    </div>
  </div>
</body></html>`;

// `PW_CHROMIUM_PATH` كما في `playwright.config.ts`: مخرجٌ للحاويات بلا تنزيل.
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: "load" });
// ⚠️ بلا هذا تُرسم العربية بخطّ احتياطي بصمت — نفس عطل §18 في `renderCard`.
await page.evaluate(() => document.fonts.ready);
const png = await page.screenshot({ type: "png" });
await browser.close();

const out = join(app, "public", "og.png");
writeFileSync(out, png);
console.log(`✓ ${out} — ${(png.length / 1024).toFixed(1)} كيلوبايت · 1200×630`);

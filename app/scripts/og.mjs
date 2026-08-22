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

const cairo = fontData("@fontsource-variable/cairo/files/cairo-arabic-wght-normal.woff2");
const reem = fontData("@fontsource/reem-kufi/files/reem-kufi-arabic-700-normal.woff2");
if (!cairo || !reem) {
  console.error("✗ تعذّر تحميل الخطوط — الصورة كانت ستُرسم بخطّ احتياطي. أُوقف.");
  process.exit(1);
}

/**
 * ⚠️ **اللوحة النهارية — مطابقة للوضع الأساس في `styles/global.css`.**
 *
 * كانت البطاقة داكنة لأن المنتج كان داكناً. فلمّا صار الأبيض أساساً صارت
 * بطاقةٌ سوداء في واتساب وعداً بشيء غير الذي يُفتح.
 *
 * والقيم الشفّافة تحتها **تُشتقّ من اللونين** لا تُكتب أرقاماً: كانت مكتوبة
 * بيد بقنوات الذهب والحبر القديمين، فلو بُدّل `GOLD` وحده لبقيت الحدود
 * والخلفيات على الذهب السابق بلا أن يظهر خطأ.
 */
const GOLD = "#a8821f";
const GOLD2 = "#8a6a15";
const PAGE = "#faf6ee";
const INK = "#241d12";
const DIM = "#746a58";

/** `#rrggbb` → `r,g,b` — لبناء `rgba()` من نفس المصدر. */
const rgb = (hex) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(",");
const GOLD_RGB = rgb(GOLD);
const INK_RGB = rgb(INK);

/**
 * زخرفة الجيري — **مطابقة لما في `lib/patterns.ts`** لا رسم جديد.
 * أُبقيت شفّافة جداً: الزخرفة خلفية لا موضوع.
 */
const girih = `<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90' viewBox='0 0 90 90'>
  <g fill='none' stroke='${GOLD}' stroke-width='1.1' opacity='0.5'>
    <path d='M45 8 L61 24 L45 40 L29 24 Z'/>
    <path d='M45 50 L61 66 L45 82 L29 66 Z'/>
    <path d='M0 24 L16 40 L0 56'/><path d='M90 24 L74 40 L90 56'/>
    <path d='M29 24 L16 40 L29 66'/><path d='M61 24 L74 40 L61 66'/>
  </g></svg>`;

const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<style>
  @font-face { font-family: "Cairo"; src: url("${cairo}") format("woff2"); font-weight: 100 900; }
  @font-face { font-family: "Reem"; src: url("${reem}") format("woff2"); font-weight: 700; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  /* القصّ على الجذر لا على body وحده. أوّل توليد خرج مقصوصاً: صفّ الشرائح
     تجاوز عرض ١٢٠٠ فاتّسع المستند، وفي RTL يمتدّ الفائض يساراً ويبدأ العرض
     من الحافة اليمنى — فانزاحت الصورة ١٩٠px وقُصّ نصفها. العلاج عند المصدر:
     منع الفائض بالالتفاف وسقف العرض، لا إزاحة معاكسة تداري الأثر. */
  html { width: 1200px; height: 630px; overflow: hidden; }
  body { width: 1200px; height: 630px; background: ${PAGE}; font-family: "Cairo", sans-serif;
         position: relative; overflow: hidden; }
  .pattern { position: absolute; inset: 0;
    background-image: url("data:image/svg+xml;utf8,${encodeURIComponent(girih)}");
    /* ⚠️ 0.055 كانت تكفي ذهباً على أسود؛ على ورقٍ فاتح تختفي الزخرفة تماماً. */
    background-size: 90px 90px; opacity: 0.1; }
  .glow { position: absolute; width: 900px; height: 900px; border-radius: 50%;
    /* توهّجٌ على أسود يصير بقعةً على أبيض — فيُخفَّف حتى يبقى دفئاً لا لطخة. */
    background: radial-gradient(circle, rgba(${GOLD_RGB},0.1), transparent 62%);
    top: -420px; left: -180px; }
  .edge { position: absolute; inset: 0; border: 10px solid transparent;
    border-image: linear-gradient(135deg, ${GOLD}, rgba(${GOLD_RGB},0.16) 45%, ${GOLD}) 1; }
  .wrap { position: relative; height: 100%; display: flex; flex-direction: column;
    justify-content: center; padding: 0 84px; }
  .kicker { display: inline-flex; align-items: center; gap: 12px; align-self: flex-start;
    border: 1px solid rgba(${GOLD_RGB},0.34); border-radius: 999px;
    padding: 11px 24px; color: ${GOLD}; font-size: 25px; font-weight: 700;
    background: rgba(${GOLD_RGB},0.09); }
  h1 { font-family: "Reem", serif; font-size: 92px; line-height: 1.22; color: ${INK};
    margin-top: 34px; font-weight: 700; }
  h1 .g { background: linear-gradient(120deg, ${GOLD2}, ${GOLD} 55%, ${GOLD2});
    -webkit-background-clip: text; background-clip: text; color: transparent; }
  p { font-size: 31px; color: ${DIM}; margin-top: 26px; line-height: 1.6; max-width: 900px; }
  .feet { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 42px; max-width: 1032px; }
  .chip { border: 1px solid rgba(${INK_RGB},0.16); border-radius: 14px;
    padding: 13px 24px; color: ${INK}; font-size: 24px; font-weight: 700;
    background: rgba(${INK_RGB},0.05); }
  .brand { position: absolute; bottom: 46px; left: 84px; display: flex; align-items: center;
    gap: 14px; color: ${GOLD}; font-size: 30px; font-weight: 900; direction: rtl; }
  .dot { width: 15px; height: 15px; border-radius: 50%; background: ${GOLD}; }
</style></head><body>
  <div class="pattern"></div><div class="glow"></div><div class="edge"></div>
  <div class="wrap">
    <span class="kicker">🇸🇦 صُنع للمطاعم السعودية</span>
    <h1>منيو مطعمك<br><span class="g">تجربة رقمية فاخرة</span></h1>
    <p>كود QR واحد يفتح لزبائنك منيو أنيقاً بتسعة عشر طابعاً — بلا تطبيقات وبلا تعقيد.</p>
    <div class="feet">
      <span class="chip">١٩ طابعاً</span>
      <span class="chip">بطاقة ولاء</span>
      <span class="chip">إحصائيات مباشرة</span>
      <span class="chip">٣٠٠ DPI للطباعة</span>
    </div>
  </div>
  <div class="brand"><span class="dot"></span>كلاود منيو</div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: "load" });
// ⚠️ بلا هذا تُرسم العربية بخطّ احتياطي بصمت — نفس عطل §18 في `renderCard`.
await page.evaluate(() => document.fonts.ready);
const png = await page.screenshot({ type: "png" });
await browser.close();

const out = join(app, "public", "og.png");
writeFileSync(out, png);
console.log(`✓ ${out} — ${(png.length / 1024).toFixed(1)} كيلوبايت · 1200×630`);

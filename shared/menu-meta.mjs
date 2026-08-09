/**
 * حقن وسوم المشاركة لصفحة المنيو — **المنطق كلّه هنا، خالصاً**.
 *
 * ═══ المشكلة ═══
 *
 * زاحف واتساب (وفيسبوك وتويتر) **لا يشغّل جافاسكربت**. و`lib/seo.ts` يضبط
 * الوسوم بعد تركيب React، فلا يراها الزاحف إطلاقاً — بل يرى وسوم
 * `app/index.html` الساكنة، وهي وسوم **الصفحة الرئيسية**.
 *
 * فالنتيجة: تاجر يشارك رابط منيوه على واتساب (وزرّ المشاركة عندنا يدفع إلى
 * `wa.me` تحديداً) فتظهر بطاقة تحمل **اسم منصّتنا وصورتها** لا اسم مطعمه.
 * أوّل انطباع عن مطعمه في أهمّ قناة مشاركة في السوق، ونحن نأخذه لأنفسنا.
 *
 * ═══ لماذا ملفّ مشترك خالص ═══
 *
 * دالة الحافة تعمل على Deno في بيئة Netlify، ولا Deno ولا Netlify CLI في
 * بيئة التطوير هنا — فلو كان المنطق داخلها لبقي **غير مفحوص**. هنا كل شيء
 * دوالّ خالصة (نصّ ⇐ نصّ) تفحصها Vitest، ولا يبقى في الدالة إلا القشرة:
 * اجلب، نادِ، أعِد.
 *
 * ويقرأ منه `app/scripts/sitemap.mjs` قائمة المحجوزات نفسها — فلا قائمتان
 * تتباعدان.
 */

// ⚠️ المسارات المحجوزة و«ما هو منيو» يأتيان من `menu-url.mjs`: كانا هنا
// نسخةً ثانية، وقائمتان تتباعدان تعنيان حقن وسوم في مسار ليس منيواً أو
// تخطّي منيو حقيقي.
export { RESERVED, slugFromRequest } from "./menu-url.mjs";
import { menuUrl } from "./menu-url.mjs";

/** هروب قيمة تدخل سمة HTML. اسم مطعم فيه `"` كان سيكسر الوسم كلّه. */
export function escapeAttr(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * يختار صورة البطاقة.
 *
 * ⚠️ **يرفض data URI صراحةً**: صور شعار وغلاف عدّة ما زالت base64 داخل
 * القاعدة (`LAUNCH.md` §٣)، وواتساب **لا يجلب data URI** — فحقنها يضخّم
 * الترويسة ولا يعرض شيئاً. وما ليس `https://` مرفوض كذلك: الزاحف خارجيّ
 * فلا يصل مساراً نسبياً ولا `http` بلا تشفير.
 */
export function pickOgImage(restaurant, siteUrl) {
  for (const candidate of [restaurant?.banner_image, restaurant?.logo_image]) {
    if (typeof candidate === "string" && /^https:\/\//i.test(candidate.trim())) {
      return { url: candidate.trim(), own: true };
    }
  }
  return { url: `${siteUrl.replace(/\/+$/, "")}/og.png`, own: false };
}

/** يستبدل محتوى وسم `<meta>` مُحدَّد بسمته، ويُبقي الوسم كما هو إن لم يوجد. */
function setMetaContent(html, attr, name, value) {
  // `[^>]*` يعبر الأسطر (كل شيء عدا `>`), فيطابق الوسوم متعددة الأسطر في
  // `index.html` كما يطابق ذات السطر الواحد، وبأي ترتيب للسمات.
  const tag = new RegExp(`<meta\\b[^>]*\\b${attr}="${name}"[^>]*>`, "i");
  return html.replace(tag, (m) =>
    /\bcontent="/i.test(m)
      ? m.replace(/\bcontent="[^"]*"/i, `content="${escapeAttr(value)}"`)
      : m
  );
}

/** يحذف وسماً كاملاً — لأبعاد صورة لم تعد صحيحة. */
function dropMeta(html, attr, name) {
  return html.replace(new RegExp(`\\s*<meta\\b[^>]*\\b${attr}="${name}"[^>]*>`, "i"), "");
}

/**
 * يحقن وسوم مطعم في نصّ `index.html` ويعيده.
 *
 * `restaurant` هو صفّ من `restaurants` بأعمدة عامّة، و`siteUrl` أصل الموقع.
 */
export function injectMeta(html, restaurant, siteUrl, slug) {
  const name = String(restaurant?.name ?? "").trim();
  if (!name) return html;

  const origin = siteUrl.replace(/\/+$/, "");
  // ⚠️ من `menuUrl()` لا مبنيّاً هنا: canonical و`og:url` يجب أن يكونا
  // **العنوان الذي يفتحه الزبون فعلاً** — وفي وضع النطاق الفرعي ليس ذلك
  // `الأصل + /slug`. زاحفٌ يرى canonical مخالفاً للعنوان يفهرس الخطأ.
  const url = menuUrl(slug) ?? `${origin}/${encodeURIComponent(slug)}`;
  const title = `${name} — المنيو`;
  const description =
    String(restaurant?.description ?? "").trim() ||
    `تصفّح منيو ${name} من جوالك: الأصناف والأسعار محدَّثة أولاً بأول، بلا تطبيق وبلا تسجيل.`;
  const image = pickOgImage(restaurant, origin);

  let out = html;

  // العنوان: أول ما يقرؤه الإنسان في البطاقة وفي تبويب المتصفّح.
  out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeAttr(title)}</title>`);

  out = setMetaContent(out, "name", "description", description);
  out = setMetaContent(out, "property", "og:title", title);
  out = setMetaContent(out, "property", "og:description", description);
  out = setMetaContent(out, "property", "og:url", url);
  out = setMetaContent(out, "property", "og:image", image.url);
  out = setMetaContent(out, "property", "og:image:alt", `منيو ${name}`);
  out = setMetaContent(out, "name", "twitter:title", title);
  out = setMetaContent(out, "name", "twitter:description", description);
  out = setMetaContent(out, "name", "twitter:image", image.url);

  out = out.replace(
    /<link\b[^>]*\brel="canonical"[^>]*>/i,
    `<link rel="canonical" href="${escapeAttr(url)}" />`
  );

  /**
   * ⚠️ **الأبعاد تُحذف حين تكون الصورة صورة التاجر.**
   *
   * الوسمان يقولان ١٢٠٠×٦٣٠ لأنهما وُضعا لـ`og.png` المولَّدة بهذا المقاس.
   * وشعار التاجر مربّع وغلافه عريض — فترك رقمين كاذبين يجعل الزاحف يقتطع
   * الصورة على مقاس ليس مقاسها. حذفهما يجعله يقيسها بنفسه.
   */
  if (image.own) {
    out = dropMeta(out, "property", "og:image:width");
    out = dropMeta(out, "property", "og:image:height");
  }

  return out;
}

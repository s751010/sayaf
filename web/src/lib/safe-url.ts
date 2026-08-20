import "server-only";

/**
 * تعقيم الروابط التي يُدخلها التاجر ويراها زبونه في صفحة المنيو العامة.
 *
 * كانت `social-links.tsx` تضع قيمة الحقل مباشرة في `href` بلا فحص، وحقول
 * `google_review_url` و`social_*` نصوص حرّة في القاعدة. أي أن تاجراً يقدر
 * يحفظ `javascript:…` فيصبح على نطاق المنصّة رابطٌ ينفّذ شيفرة عند نقر
 * الزبون — أو رابط تصيّد يبدو صادراً من «كلاود منيو».
 *
 * القاعدة: `https` فقط (و`http` يُرفَع إلى `https`). أي شيء آخر → null،
 * والمكوّن يُسقط الرابط بدل عرضه.
 */
export function safeExternalUrl(raw: string | null | undefined): string | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;

  // بلا مخطَّط: نفترض https بدل ترك المتصفح يخمّن.
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  if (url.protocol === "http:") url.protocol = "https:";
  if (url.protocol !== "https:") return null;
  if (!url.hostname || url.hostname === "localhost") return null;

  return url.toString();
}

/** رقم جوال سعودي → رابط واتساب، أو رابط جاهز إن أدخله التاجر كاملاً. */
export function safeWhatsAppUrl(raw: string | null | undefined): string | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith("//")) {
    return safeExternalUrl(value);
  }
  const digits = value.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) return null;
  return `https://wa.me/${digits}`;
}

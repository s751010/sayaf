/**
 * ضبط وسوم SEO لكل صفحة في تطبيق صفحة-واحدة.
 *
 * الوسوم في `index.html` تصف الصفحة الرئيسية فقط. بلا هذا الملف كانت كل صفحة
 * منيو `/{slug}` ترث `canonical` و`og:url` الخاصين بالرئيسية، فتُعلن أن نسختها
 * المعيارية هي الرئيسية ولا تُفهرس إطلاقاً (نفس خلل النسخة القديمة، البند 5.9).
 */
import { SITE_NAME, SITE_URL } from "./config";

function setMeta(selector: string, attr: "content" | "href", value: string): void {
  const el = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
  if (el) el.setAttribute(attr, value);
}

export type SeoInput = {
  /** عنوان الصفحة بلا لاحقة اسم الموقع. */
  title: string;
  description?: string;
  /** المسار المطلق للصفحة، مثل `/burger-house` أو `/blog`. */
  path: string;
  /** صورة معاينة مطلقة (PNG/JPG — لا SVG، المنصات لا تعرضه). */
  image?: string;
};

export function applySeo({ title, description, path, image }: SeoInput): void {
  const url = `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`;

  document.title = fullTitle;
  setMeta('link[rel="canonical"]', "href", url);
  setMeta('meta[property="og:url"]', "content", url);
  setMeta('meta[property="og:title"]', "content", fullTitle);

  if (description) {
    setMeta('meta[name="description"]', "content", description);
    setMeta('meta[property="og:description"]', "content", description);
  }
  if (image) {
    setMeta('meta[property="og:image"]', "content", image);
    // صورة مخصّصة تستحق بطاقة كبيرة؛ الافتراضي (الأيقونة) يبقى summary.
    setMeta('meta[name="twitter:card"]', "content", "summary_large_image");
  }
}

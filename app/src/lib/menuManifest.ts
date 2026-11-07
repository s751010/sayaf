/**
 * «أضف إلى الشاشة الرئيسية» من منيو مطعم — يفتح **المطعم** لا المنصّة.
 *
 * ═══ لماذا ═══
 *
 * `index.html` يربط `manifest.webmanifest` الثابت: اسمه «كلاود منيو» و
 * `start_url` الجذر. فالزبون الذي أضاف منيو مطعمه المفضّل إلى شاشته وجد
 * أيقونةً باسمنا تفتح صفحة الهبوط — لا المنيو الذي أراده.
 *
 * فصفحة المنيو تولّد بياناً باسم المطعم ولون طابعه و`start_url` رابطه من
 * `menuUrl` (لا يُبنى بيد)، وتعيد الأصلي عند المغادرة.
 *
 * ⚠️ البيان يُربط بعنوان `blob:`، فـ`manifest-src` في CSP (`public/_headers`)
 * يحمل `blob:` — وبدونه يرفض المتصفّح البيان بصمت ويبقى الثابت. ولأن عنوان
 * `blob:` لا يصلح أساساً لعنوانٍ نسبي، فكل عنوانٍ هنا **مطلق**.
 *
 * الأيقونات أيقونات المنصّة نفسها (`PLATFORM_ICONS` — مطابقة للملفّ الثابت،
 * يحرسها `menu-manifest.test.ts`): شعار التاجر بلا مقاسٍ معروف قد يخرج مشوّهاً.
 */

/** أيقونات `public/manifest.webmanifest` — نسخةٌ محروسة بفحص التطابق. */
export const PLATFORM_ICONS = [
  { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
  { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
] as const;

export type MenuManifestInput = {
  name: string;
  /** رابط المنيو المطلق من `menuUrl` — لا غيره. */
  startUrl: string;
  /** لون الصفحة من الطابع — نفسه في `theme-color` فلا يومض لونان. */
  color: string;
  /** أصل الموقع لإطلاق عناوين الأيقونات. */
  origin: string;
};

export type WebManifest = {
  id: string;
  name: string;
  short_name: string;
  start_url: string;
  display: "standalone";
  lang: "ar";
  dir: "rtl";
  background_color: string;
  theme_color: string;
  icons: { src: string; sizes: string; type: string; purpose: string }[];
};

/** بيان المطعم — دالّة خالصة بلا DOM. */
export function menuManifest({ name, startUrl, color, origin }: MenuManifestInput): WebManifest {
  const title = name.trim() || "المنيو";
  return {
    // معرّفٌ لكل مطعم: مطعمان على شاشة واحدة تطبيقان لا تطبيقٌ يُستبدل.
    id: startUrl,
    name: title,
    short_name: title,
    start_url: startUrl,
    display: "standalone",
    lang: "ar",
    dir: "rtl",
    background_color: color,
    theme_color: color,
    icons: PLATFORM_ICONS.map((i) => ({ ...i, src: new URL(i.src, origin).href })),
  };
}

/**
 * يستبدل بيان الصفحة ويعيد دالّة الاستعادة: العنوان الأصلي كما كُتب، وعنوان
 * `blob:` يُحرَّر. وإن لم يوجد وسمٌ أصلاً يُنشأ ثم يُزال.
 */
export function swapManifest(manifest: WebManifest): () => void {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  const created = !link;
  if (!link) {
    link = document.createElement("link");
    link.rel = "manifest";
    document.head.appendChild(link);
  }
  const prev = link.getAttribute("href");
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" })
  );
  link.setAttribute("href", url);
  const el = link;
  return () => {
    if (created) el.remove();
    else if (prev !== null) el.setAttribute("href", prev);
    URL.revokeObjectURL(url);
  };
}

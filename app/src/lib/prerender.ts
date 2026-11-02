/**
 * التوليد المسبق للصفحات العامّة — **دوالّ خالصة** يشغّلها `scripts/prerender.ts`
 * بعد البناء ويفحصها `prerender.test.ts`.
 *
 * ═══ المشكلة ═══
 *
 * التطبيق صفحة واحدة: كل مسار يُخدَم بـ`index.html` نفسه، بعنوان الهبوط ووصفه
 * ورابطه القانوني `/`، ثم تكتب جافاسكربت الوسوم الصحيحة. قوقل يشغّلها (متأخّراً،
 * في دفعة ثانية)، لكن واتساب وتويتر ولينكدإن لا يشغّلونها أبداً — فمشاركة مقال
 * كانت تعرض عنوان الصفحة الرئيسية وصورتها. وفي عين زاحفٍ بلا JS كانت عشرون
 * مقالاً نسخاً مكرّرة من الرئيسية بـ`canonical` واحد.
 *
 * ═══ الحلّ ═══
 *
 * لكل صفحة عامّة ملفّ `<المسار>.html` في `deploy/` (Netlify يخدم `/help` من
 * `help.html` قبل قاعدة SPA): رأسه بوسوم الصفحة نفسها، وفي `#root` نصّها —
 * عنوان ووصف، وللمقال **نصّه كاملاً**. ثم يُقلع React ويستبدل `#root` كما كان
 * يفعل (`createRoot` يمسح الحاوية)، فلا يتغيّر شيء على الزائر.
 *
 * ⚠️ `index.html` نفسه **لا يُمسّ**: هو احتياط SPA لكل مسار، ومنه صفحات منيو
 * المطاعم (`/:slug`) — نصٌّ مُولَّد فيه كان سيظهر لزاحف كل منيو.
 */
import { SITE_NAME } from "./config";
import { absoluteUrl, clampDescription } from "./seo";

export type PrerenderPage = {
  /** المسار بلا شرطة أخيرة: `/help` · `/blog/getting-started`. */
  path: string;
  title: string;
  description: string;
  type?: "website" | "article";
  /** مسار نسبي أو رابط كامل — الافتراضي صورة المشاركة العامّة. */
  image?: string;
  /** مخطّطات schema.org تُكتب كما هي. */
  jsonLd?: unknown[];
  /** HTML داخل `#root` — موثوق (من المستودع)، لا مُدخل مستخدم. */
  body: string;
};

/** للنصوص داخل الوسوم والسمات. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** `</script>` داخل JSON يُغلق الوسم قبل وقته — يُهرَّب `<` كلّه. */
function jsonForScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** ملفّ الإخراج داخل `deploy/` لمسارٍ: `/help` ⇒ `help.html`. */
export function outputFile(path: string): string {
  const clean = path.replace(/^\/+|\/+$/g, "");
  if (!clean) throw new Error("الرئيسية لا تُولَّد: index.html احتياط SPA لكل مسار");
  return `${clean}.html`;
}

/**
 * يستبدل قيمة وسمٍ موجود في القالب. **يرمي إن لم يجده**: قالبٌ تغيّرت وسومه
 * يجب أن يُسقط البناء، لا أن يخرج صفحات بوسوم الهبوط بصمت.
 */
function replaceAttr(html: string, selector: RegExp, value: string, what: string): string {
  if (!selector.test(html)) throw new Error(`prerender: لم أجد ${what} في القالب`);
  return html.replace(selector, (_m, open: string, close: string) => `${open}${escapeHtml(value)}${close}`);
}

export function renderPage(template: string, page: PrerenderPage): string {
  const full = `${page.title} — ${SITE_NAME}`;
  const desc = clampDescription(page.description);
  const url = absoluteUrl(page.path);
  const image = absoluteUrl(page.image ?? "/og.png");

  let html = template;
  if (!/<title>[^<]*<\/title>/.test(html)) throw new Error("prerender: لم أجد <title> في القالب");
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(full)}</title>`);

  const attr = (key: "name" | "property" | "rel", k: string, valueAttr: "content" | "href") =>
    new RegExp(`(<(?:meta|link)\\s+${key}="${k}"\\s+${valueAttr}=")[^"]*(")`);
  // الوسوم المتعدّدة الأسطر في القالب (`<meta\n  name=…\n  content=…`) تُطبَّع أوّلاً.
  html = html.replace(/<meta\s+(name|property)="([^"]+)"\s+content="/g, '<meta $1="$2" content="');

  html = replaceAttr(html, attr("name", "description", "content"), desc, "description");
  html = replaceAttr(html, attr("rel", "canonical", "href"), url, "canonical");
  html = replaceAttr(html, attr("property", "og:title", "content"), full, "og:title");
  html = replaceAttr(html, attr("property", "og:description", "content"), desc, "og:description");
  html = replaceAttr(html, attr("property", "og:url", "content"), url, "og:url");
  html = replaceAttr(html, attr("property", "og:type", "content"), page.type ?? "website", "og:type");
  html = replaceAttr(html, attr("property", "og:image", "content"), image, "og:image");
  html = replaceAttr(html, attr("name", "twitter:title", "content"), full, "twitter:title");
  html = replaceAttr(html, attr("name", "twitter:description", "content"), desc, "twitter:description");
  html = replaceAttr(html, attr("name", "twitter:image", "content"), image, "twitter:image");

  const ld = (page.jsonLd ?? [])
    .map((d) => `    <script type="application/ld+json">${jsonForScript(d)}</script>\n`)
    .join("");
  if (ld) html = html.replace("</head>", `${ld}  </head>`);

  if (!html.includes('<div id="root"></div>')) throw new Error("prerender: لم أجد #root فارغاً في القالب");
  return html.replace('<div id="root"></div>', `<div id="root">${page.body}</div>`);
}

/* ── أجسام الصفحات: نصٌّ دلاليّ بسيط يقرؤه الزاحف قبل أن يُقلع React ── */

export type LinkItem = { href: string; label: string };

/** روابط داخلية في كل صفحة مولّدة — الزاحف يمشي إلى بقيّة الموقع منها. */
export function siteNav(links: LinkItem[]): string {
  const items = links.map((l) => `<li><a href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a></li>`).join("");
  return `<nav aria-label="روابط الموقع"><ul>${items}</ul></nav>`;
}

export function simpleBody(opts: { h1: string; lead: string; nav: string; extra?: string }): string {
  return (
    `<main><h1>${escapeHtml(opts.h1)}</h1><p>${escapeHtml(opts.lead)}</p>` +
    `${opts.extra ?? ""}</main>${opts.nav}`
  );
}

export function articleBody(opts: {
  title: string;
  excerpt: string;
  date: string;
  category: string;
  html: string;
  nav: string;
}): string {
  return (
    `<main><article><header><p><a href="/blog">المدونة</a> · ${escapeHtml(opts.category)}</p>` +
    `<h1>${escapeHtml(opts.title)}</h1><p>${escapeHtml(opts.excerpt)}</p>` +
    `<time datetime="${escapeHtml(opts.date)}">${escapeHtml(opts.date)}</time></header>` +
    `${opts.html}</article></main>${opts.nav}`
  );
}

/** مسار التنقّل لقوقل — يظهر في النتيجة بدل الرابط الخام. */
export function breadcrumbs(items: { name: string; path: string }[]): unknown {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

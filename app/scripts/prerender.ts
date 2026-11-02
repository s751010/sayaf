/**
 * يولّد بعد `vite build` ملفّ HTML لكل صفحة عامّة ثابتة — انظر `src/lib/prerender.ts`.
 *
 * يُشغَّل بـ`vite-node` (من حزمة vitest) كي يقرأ وحدات `src/` نفسها بأسمائها
 * المستعارة (`@/…`): العناوين والأوصاف من `routeSeo.ts` و`segments.ts`
 * و`articles.json` — لا نسخة ثانية منها هنا.
 *
 * فشله يُسقط البناء عمداً: قالبٌ تغيّرت وسومه، أو مقالٌ بلا نصّ، خيرٌ أن
 * يُرى في CI من أن تخرج صفحات بعنوان الرئيسية.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SITE_NAME } from "@/lib/config";
import { ORGANIZATION, absoluteUrl } from "@/lib/seo";
import { STATIC_SEO } from "@/lib/routeSeo";
import { SEGMENTS } from "@/lib/segments";
import { STATIC_POSTS } from "@/lib/articles";
import {
  articleBody,
  breadcrumbs,
  escapeHtml,
  outputFile,
  renderPage,
  siteNav,
  simpleBody,
  type PrerenderPage,
} from "@/lib/prerender";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "../../deploy");
const ARTICLES = join(here, "../src/content/articles");

const template = readFileSync(join(OUT, "index.html"), "utf8");

const nav = siteNav([
  { href: "/", label: SITE_NAME },
  { href: "/demo", label: "جرّب منيو تجريبياً" },
  ...SEGMENTS.map((s) => ({ href: `/for/${s.slug}`, label: s.label })),
  { href: "/blog", label: "المدونة" },
  { href: "/help", label: "المساعدة" },
  { href: "/about", label: "من نحن" },
  { href: "/restaurants", label: "دليل المطاعم" },
]);

const pages: PrerenderPage[] = [];

/* ── الصفحات الثابتة ── */
for (const seo of Object.values(STATIC_SEO)) {
  const extra =
    seo.path === "/blog"
      ? `<ul>${STATIC_POSTS.map(
          (p) => `<li><a href="/blog/${p.slug}">${escapeHtml(p.title ?? "")}</a> — ${escapeHtml(p.excerpt ?? "")}</li>`
        ).join("")}</ul>`
      : undefined;
  pages.push({
    path: seo.path,
    title: seo.title,
    description: seo.description,
    jsonLd: [breadcrumbs([{ name: SITE_NAME, path: "/" }, { name: seo.title, path: seo.path }])],
    body: simpleBody({ h1: seo.title, lead: seo.description, nav, extra }),
  });
}

/* ── صفحات الشرائح ── */
for (const seg of SEGMENTS) {
  const path = `/for/${seg.slug}`;
  const features = `<ul>${seg.features
    .map((f) => `<li><h2>${escapeHtml(f.title)}</h2><p>${escapeHtml(f.desc)}</p></li>`)
    .join("")}</ul>`;
  pages.push({
    path,
    title: seg.seoTitle,
    description: seg.seoDescription,
    jsonLd: [breadcrumbs([{ name: SITE_NAME, path: "/" }, { name: seg.label, path }])],
    body: simpleBody({ h1: seg.headline, lead: seg.lede, nav, extra: features }),
  });
}

/* ── المقالات: نصّها كاملاً ── */
for (const post of STATIC_POSTS) {
  const path = `/blog/${post.slug}`;
  const html = readFileSync(join(ARTICLES, `${post.slug}.html`), "utf8");
  const title = post.title ?? "";
  const excerpt = post.excerpt ?? "";
  const date = post.published_at ?? post.created_at ?? "";
  pages.push({
    path,
    title,
    description: excerpt,
    type: "article",
    image: post.cover_image ?? undefined,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: title,
        description: excerpt,
        inLanguage: "ar",
        datePublished: date,
        dateModified: date,
        image: post.cover_image ? absoluteUrl(post.cover_image) : undefined,
        author: { "@type": "Organization", name: post.author ?? SITE_NAME },
        mainEntityOfPage: absoluteUrl(path),
        publisher: ORGANIZATION,
      },
      breadcrumbs([
        { name: SITE_NAME, path: "/" },
        { name: "المدونة", path: "/blog" },
        { name: title, path },
      ]),
    ],
    body: articleBody({ title, excerpt, date, category: post.category ?? "", html, nav }),
  });
}

for (const page of pages) {
  const file = join(OUT, outputFile(page.path));
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, renderPage(template, page));
}
console.log(`✓ prerender: ${pages.length} صفحة عامّة بوسومها ونصّها`);

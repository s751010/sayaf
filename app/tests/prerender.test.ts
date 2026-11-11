/**
 * التوليد المسبق — كل صفحة عامّة تخرج بوسومها هي لا بوسوم الرئيسية.
 *
 * القالب هنا هو `app/index.html` الحقيقي: إن غيّر أحدٌ شكل وسم فيه (سطر واحد
 * بدل ثلاثة، ترتيب السمات…) يجب أن يسقط هذا الفحص لا أن تخرج عشرون صفحة
 * بعنوان الهبوط بصمت.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { breadcrumbs, escapeHtml, outputFile, renderPage, type PrerenderPage } from "@/lib/prerender";
import { STATIC_SEO } from "@/lib/routeSeo";

const template = readFileSync(new URL("../index.html", import.meta.url), "utf8");

const page: PrerenderPage = {
  path: "/blog/test-post",
  title: 'مقال "تجريبي" <مهمّ>',
  description: "وصف المقال الذي يجب أن يصل إلى قوقل وواتساب كما هو.",
  type: "article",
  image: "/blog/test-post/cover.webp",
  jsonLd: [{ "@type": "BlogPosting", headline: "x</script><script>alert(1)</script>" }],
  body: "<main><h1>نصّ المقال</h1></main>",
};

describe("renderPage", () => {
  const html = renderPage(template, page);

  it("العنوان والوصف والرابط القانوني للصفحة نفسها", () => {
    expect(html).toContain("<title>مقال &quot;تجريبي&quot; &lt;مهمّ&gt; — كلاود منيو</title>");
    expect(html).toMatch(/<meta name="description" content="وصف المقال الذي/);
    expect(html).toContain('<link rel="canonical" href="https://neon-frangollo-2c189e.netlify.app/blog/test-post"');
    expect(html).not.toContain('href="https://neon-frangollo-2c189e.netlify.app/"');
  });

  it("وسوم المشاركة كلّها تتبع الصفحة (واتساب وتويتر لا يشغّلان جافاسكربت)", () => {
    for (const k of ["og:title", "og:description", "og:url", "og:image"]) {
      expect(html, k).toMatch(new RegExp(`property="${k}" content="(?!كلاود منيو — منيو يشبه)`));
    }
    expect(html).toContain('property="og:type" content="article"');
    expect(html).toContain('property="og:image" content="https://neon-frangollo-2c189e.netlify.app/blog/test-post/cover.webp"');
    expect(html).toMatch(/name="twitter:title" content="مقال/);
    expect(html).not.toMatch(/منيو يشبه مطعمك ويبيع عنك/);
  });

  it("JSON-LD داخل الرأس ولا يُغلق وسم script قبل وقته", () => {
    const head = html.slice(0, html.indexOf("</head>"));
    expect(head).toContain('<script type="application/ld+json">');
    expect(head).not.toContain("</script><script>alert");
    expect(head).toContain("\\u003c/script>");
  });

  it("النصّ داخل #root — يقرؤه الزاحف قبل أن يُقلع React", () => {
    expect(html).toContain('<div id="root"><main><h1>نصّ المقال</h1></main></div>');
    expect(html).toContain('<script type="module"');
  });

  it("يرمي إن تغيّر القالب — لا صفحات بوسوم الرئيسية بصمت", () => {
    expect(() => renderPage(template.replace(/<link rel="canonical"[^>]*>/, ""), page)).toThrow(/canonical/);
    expect(() => renderPage(template.replace('<div id="root"></div>', "<div id=root></div>"), page)).toThrow(/root/);
  });
});

describe("noindex", () => {
  it("صفحةٌ تُخدَم ولا تُفهرَس تحمل وسم robots — والبقيّة بلا وسم", () => {
    expect(renderPage(template, { ...page, noindex: true })).toContain('<meta name="robots" content="noindex, nofollow" />');
    expect(renderPage(template, page)).not.toContain('name="robots"');
  });

  it("الدليل مخفيّ حتى يمتلئ، وخارج الذيل وخريطة الموقع", () => {
    expect(STATIC_SEO.restaurants.noindex).toBe(true);
    const site = readFileSync(new URL("../src/components/site.tsx", import.meta.url), "utf8");
    const sitemap = readFileSync(new URL("../scripts/sitemap.mjs", import.meta.url), "utf8");
    expect(site).not.toContain('to="/restaurants"');
    expect(sitemap).not.toContain('loc: "/restaurants"');
  });

  it("صفحة الحاسبة لا تصطدم بروابط المطاعم: مقطعان لا يُقرآن منيواً", async () => {
    const { slugFromRequest } = await import("../../shared/menu-url.mjs");
    expect(slugFromRequest("example.com", STATIC_SEO.calories.path)).toBeNull();
    const sitemap = readFileSync(new URL("../scripts/sitemap.mjs", import.meta.url), "utf8");
    expect(sitemap).toContain(`loc: "${STATIC_SEO.calories.path}"`);
  });
});

describe("outputFile", () => {
  it("مسار ⇒ ملفّ .html يخدمه Netlify قبل قاعدة SPA", () => {
    expect(outputFile("/help")).toBe("help.html");
    expect(outputFile("/blog/getting-started")).toBe("blog/getting-started.html");
    expect(outputFile("/for/food-trucks/")).toBe("for/food-trucks.html");
  });

  it("الرئيسية لا تُولَّد: index.html احتياط كل مسار ومنها منيوهات المطاعم", () => {
    expect(() => outputFile("/")).toThrow();
  });
});

describe("المصدر الواحد", () => {
  it("كل صفحة ثابتة بعنوان ووصف ومسار، والوصف في حدود ما يعرضه قوقل", () => {
    for (const [k, s] of Object.entries(STATIC_SEO)) {
      // مقطعٌ أو اثنان (`/tools/calorie-calculator`) — والمقطعان لا يُقرآن منيواً.
      expect(s.path, k).toMatch(/^\/[a-z-]+(\/[a-z-]+)?$/);
      expect(s.title.length, k).toBeGreaterThan(2);
      expect(s.description.length, k).toBeGreaterThan(50);
      expect(s.description.length, k).toBeLessThanOrEqual(170);
    }
  });

  it("الصفحات تقرأ الجدول ولا تكتب نسخة ثانية", () => {
    const read = (f: string) => readFileSync(new URL(`../src/pages/${f}`, import.meta.url), "utf8");
    for (const [file, keys] of [
      ["Help.tsx", ["help"]],
      ["About.tsx", ["about"]],
      ["Blog.tsx", ["blog"]],
      ["Restaurants.tsx", ["restaurants"]],
      ["Legal.tsx", ["privacy", "terms"]],
      ["CalorieTool.tsx", ["calories"]],
      ["Login.tsx", ["login"]],
    ] as const) {
      for (const k of keys) expect(read(file), `${file} ⇐ ${k}`).toContain(`useSeo(STATIC_SEO.${k})`);
    }
  });

  it("escapeHtml و breadcrumbs", () => {
    expect(escapeHtml(`<a href="x">&</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;");
    const b = breadcrumbs([{ name: "أ", path: "/" }, { name: "ب", path: "/blog" }]) as {
      itemListElement: { position: number; item: string }[];
    };
    expect(b.itemListElement.map((i) => i.position)).toEqual([1, 2]);
    expect(b.itemListElement[1].item).toBe("https://neon-frangollo-2c189e.netlify.app/blog");
  });
});

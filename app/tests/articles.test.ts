// @vitest-environment jsdom
/**
 * مقالات المدونة الثابتة — `src/content/` و`public/blog/`.
 *
 * ═══ لماذا فحصٌ لمحتوى ═══
 *
 * المقال الثابت ثلاثة ملفّات يجمعها الـslug وحده: سطرٌ في `articles.json`،
 * ونصٌّ في `articles/<slug>.html`، وصورٌ في `public/blog/<slug>/`. ولا شيء
 * يربطها عند البناء: غلافٌ ناقص صورةٌ مكسورة في بطاقة المدونة، ونصٌّ ناقص
 * «المقال غير موجود» لرابطٍ في خريطة الموقع — وكلاهما يمرّ `tsc` والبناء.
 *
 * والمنقّي يحذف الوسم غير المسموح **بصمت** (يستبدله بنصّه): جدولٌ في مقال
 * يخرج فقراتٍ مبعثرة ولا خطأ يظهر. فالفحص الأخير يقارن المقال قبل التنقية
 * وبعدها — عنصراً عنصراً.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import META from "@/content/articles.json";
import { THEME_COUNT } from "@/lib/facts";
import { sanitizeHtml } from "@/pages/BlogPost";

const path = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));
const body = (slug: string) => readFileSync(path(`../src/content/articles/${slug}.html`), "utf8");
const parse = (html: string) => new DOMParser().parseFromString(html, "text/html").body;
const slugs = META.map((m) => m.slug);

describe("البيانات الوصفية", () => {
  it("كل slug آمن للرابط وفريد", () => {
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("كل مقال بعنوان وملخّص وتصنيف وتاريخ ودقائق", () => {
    for (const m of META) {
      expect(m.title.length, m.slug).toBeGreaterThan(10);
      expect(m.excerpt.length, m.slug).toBeGreaterThan(40);
      expect(m.category, m.slug).toBeTruthy();
      expect(m.date, m.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(m.minutes, m.slug).toBeGreaterThan(0);
    }
  });
});

describe("الملفّات", () => {
  it("لكل مقال نصّه — ولا نصّ بلا مقال", () => {
    const files = readdirSync(path("../src/content/articles")).filter((f) => f.endsWith(".html"));
    expect(files.map((f) => f.replace(/\.html$/, "")).sort()).toEqual([...slugs].sort());
  });

  it("لكل مقال غلافه", () => {
    for (const s of slugs) expect(existsSync(path(`../public/blog/${s}/cover.webp`)), s).toBe(true);
  });

  it("كل صورة في النصّ موجودة، وبنصّ بديل وأبعاد", () => {
    for (const s of slugs) {
      for (const img of parse(body(s)).querySelectorAll("img")) {
        const src = img.getAttribute("src") ?? "";
        expect(src, s).toMatch(/^\/blog\//);
        expect(existsSync(path(`../public${src}`)), `${s}: ${src}`).toBe(true);
        expect(img.getAttribute("alt")?.length ?? 0, `${s}: ${src}`).toBeGreaterThan(10);
        expect(Number(img.getAttribute("width")), `${s}: ${src}`).toBeGreaterThan(0);
        expect(Number(img.getAttribute("height")), `${s}: ${src}`).toBeGreaterThan(0);
      }
    }
  });

  it("لا صورة في `public/blog` بلا مقال يعرضها", () => {
    // صورةٌ لا يشير إليها نصّ ولا هي غلاف = حمولةٌ تُنشر ولا يراها أحد.
    for (const s of slugs) {
      const used = new Set([...parse(body(s)).querySelectorAll("img")].map((i) => i.getAttribute("src")));
      used.add(`/blog/${s}/cover.webp`);
      for (const f of readdirSync(path(`../public/blog/${s}`))) {
        expect(used, `${s}/${f}`).toContain(`/blog/${s}/${f}`);
      }
    }
    const dirs = readdirSync(path("../public/blog"));
    expect(dirs.sort()).toEqual([...slugs].sort());
  });

  it("كل رابط داخلي إلى مقال يشير إلى مقال موجود", () => {
    for (const s of slugs) {
      for (const a of parse(body(s)).querySelectorAll('a[href^="/blog/"]')) {
        const target = a.getAttribute("href")!.slice("/blog/".length);
        expect(slugs, `${s} → ${target}`).toContain(target);
      }
    }
  });

  it("خريطة الموقع الاحتياطية تعرف كل مقال", () => {
    const xml = readFileSync(path("../public/sitemap.xml"), "utf8");
    for (const s of slugs) expect(xml, s).toContain(`/blog/${s}</loc>`);
  });
});

describe("أرقام المنتج في النثر", () => {
  /**
   * المقال نثرٌ لا يقرؤه `tsc`: «21 طابعاً» مكتوبةٌ بيد كما كانت «١٢ طابعاً» في
   * الهبوط يوم صارت تسعة عشر (`facts-copy.test.ts`). فيُقرأ الرقم ويُقارن بالمصدر.
   */
  it("كل ذكرٍ لعدد الطوابع يطابق `THEME_COUNT`", () => {
    const texts = [JSON.stringify(META), ...slugs.map(body)];
    for (const t of texts) {
      for (const m of t.matchAll(/(\d{1,3})\s*(?:طابع|طوابع)/g)) expect(Number(m[1])).toBe(THEME_COUNT);
    }
  });
});

describe("التنقية", () => {
  it("لا يسقط المنقّي شيئاً من أيّ مقال", () => {
    for (const s of slugs) {
      const before = parse(body(s));
      const after = parse(sanitizeHtml(body(s)));
      expect(after.querySelectorAll("*").length, s).toBe(before.querySelectorAll("*").length);
      expect(after.textContent, s).toBe(before.textContent);
      for (const img of after.querySelectorAll("img")) expect(img.getAttribute("src"), s).toBeTruthy();
      for (const a of after.querySelectorAll("a")) expect(a.getAttribute("href"), s).toBeTruthy();
    }
  });
});

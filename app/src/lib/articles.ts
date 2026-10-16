/**
 * مقالات المدونة **الثابتة** — تُشحن مع الموقع لا من القاعدة.
 *
 * ═══ لماذا ليست في `blog_posts` ═══
 *
 * المقالات المكتوبة سابقاً هناك مسوّداتٌ نشرُها قرار المالك من لوحة المؤسّس
 * (`LAUNCH.md`). وهذه الجولة (٢٠٢٦/١٠) مُنع فيها لمس Supabase أصلاً. فالمقالات
 * الأساسية تعيش في المستودع: تُراجَع في طلب الدمج كأي شيفرة، وتُنشر مع البناء.
 *
 * - البيانات الوصفية في `content/articles.json` — يقرؤها أيضاً `scripts/sitemap.mjs`.
 * - النصّ في `content/articles/<slug>.html` — يُحمَّل **عند فتح المقال** لا مع
 *   القائمة، فصفحة المدونة لا تدفع ثمن أربعة مقالات كاملة.
 * - الصور في `public/blog/<slug>/`.
 *
 * والمحتوى يمرّ على `sanitizeHtml` نفسه كمقالات القاعدة: قائمة بيضاء واحدة.
 */
import META from "@/content/articles.json";
import type { BlogPost } from "@/lib/types";

type ArticleMeta = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  minutes: number;
};

const BODIES = import.meta.glob("../content/articles/*.html", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

export const ARTICLE_AUTHOR = "فريق كلاود منيو";

function toPost(m: ArticleMeta): BlogPost & { minutes: number } {
  return {
    id: `static:${m.slug}`,
    slug: m.slug,
    title: m.title,
    title_ar: m.title,
    excerpt: m.excerpt,
    excerpt_ar: m.excerpt,
    content: null,
    content_ar: null,
    cover_image: `/blog/${m.slug}/cover.webp`,
    author: ARTICLE_AUTHOR,
    category: m.category,
    tags: null,
    status: "published",
    published: true,
    seo_title: null,
    seo_description: m.excerpt,
    views: null,
    published_at: m.date,
    created_at: m.date,
    minutes: m.minutes,
  };
}

export const STATIC_POSTS = (META as ArticleMeta[]).map(toPost);

export const isStaticSlug = (slug: string) => STATIC_POSTS.some((p) => p.slug === slug);

/** المقال كاملاً بنصّه — `null` إن لم يكن ثابتاً أو غاب ملفّه. */
export async function loadStaticPost(slug: string): Promise<BlogPost | null> {
  const post = STATIC_POSTS.find((p) => p.slug === slug);
  const load = BODIES[`../content/articles/${slug}.html`];
  if (!post || !load) return null;
  return { ...post, content_ar: await load() };
}

/**
 * الثابتة ومقالات القاعدة معاً، الأحدث أوّلاً.
 *
 * ⚠️ **مقال القاعدة يغلب الثابت بالـslug نفسه**: إن نشر المالك من لوحته مقالاً
 * بالعنوان ذاته فنسخته هي المقصودة — لا تُعرض نسختان.
 */
export function mergePosts(db: BlogPost[]): BlogPost[] {
  const fromDb = new Set(db.map((p) => p.slug).filter(Boolean));
  const all = [...db, ...STATIC_POSTS.filter((p) => !fromDb.has(p.slug))];
  return all.sort((a, b) => (b.published_at ?? b.created_at).localeCompare(a.published_at ?? a.created_at));
}

/** دقائق القراءة: المكتوبة للثابت، وتقديرٌ من طول النصّ (١٨٠ كلمة/دقيقة) لغيره. */
export function readingMinutes(p: BlogPost): number | null {
  const fixed = (p as { minutes?: unknown }).minutes;
  if (typeof fixed === "number") return fixed;
  const text = (p.content_ar || p.content || "").replace(/<[^>]+>/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return words > 0 ? Math.max(1, Math.round(words / 180)) : null;
}

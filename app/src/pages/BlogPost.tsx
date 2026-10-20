/** صفحة مقال واحد. */
import { useEffect, useState, type MouseEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Navbar, Footer } from "@/components/site";
import { Badge, EmptyState, Skeleton } from "@/components/ui";
import { getPostBySlug } from "@/lib/data";
import { isStaticSlug, loadStaticPost, readingLabel, readingMinutes, relatedPosts } from "@/lib/articles";
import { CTA_PRIMARY } from "@/lib/facts";
import { ORGANIZATION, absoluteUrl, useJsonLd, useSeo } from "@/lib/seo";
import { formatDate } from "@/lib/utils";
import type { BlogPost } from "@/lib/types";
import { postExcerpt, postTitle } from "./Blog";

/**
 * تنقية محتوى المقال قبل إدراجه كـHTML — **قائمة بيضاء**.
 *
 * ═══ ⚠️ لماذا تُبدّلت القائمة السوداء ═══
 *
 * كانت تحذف وسوماً مسمّاة (`script` · `iframe` · `object` …) وتُبقي ما عداها.
 * وثلاثة ثغرات في ذلك:
 *
 * ١. **`<template>` و`<noscript>` و`<svg>` و`<math>` لم تكن في القائمة.**
 * ٢. **سمة `style` كانت تمرّ** — وهي تكفي لتغطية الصفحة بطبقة تلتقط النقرات.
 * ٣. **والأخطر: دورة تحليل⇄تسلسل.** الدالة تُحلّل النصّ ثم تُعيده نصّاً
 *    (`innerHTML`)، وReact يُعيد تحليله. والمحتوى الأجنبي (`svg`/`math`)
 *    والمحتوى الخام (`noscript`) تختلف قواعد تحليلها عن تسلسلها، فنصٌّ يبدو
 *    بريئاً بعد التنقية يعود وسماً تنفيذياً بعد التحليل الثاني — mXSS.
 *
 * فالقاعدة انعكست: **ما ليس مسموحاً صراحةً يُحذف**، وسمةٌ ليست في القائمة
 * تُنزع. وسمٌ جديد يحتاجه المحتوى يُضاف هنا بقرار، لا يمرّ لأن أحداً نسي منعه.
 *
 * الكاتب هو المؤسّس وحده (سياسات `blog_posts`)، وCSP بلا `unsafe-inline`
 * تحجب معالجات `on*` — لكن `script-src` يسمح بـ`googletagmanager.com`، وهو
 * معبر معروف لتجاوز CSP. فلا يُتَّكل على طبقة واحدة.
 */
const ALLOWED_TAGS = new Set([
  "p", "br", "hr", "div", "span", "blockquote", "pre", "code",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "dl", "dt", "dd",
  "strong", "b", "em", "i", "u", "s", "mark", "small", "sub", "sup",
  "a", "img", "figure", "figcaption",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
]);

/** سمات مسموحة لكل وسم. وما عداها يُنزع — بما فيها `style` و`on*`. */
const ALLOWED_ATTRS: Record<string, readonly string[]> = {
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "title", "width", "height", "loading"],
  th: ["colspan", "rowspan", "scope"],
  td: ["colspan", "rowspan"],
  "*": ["dir", "lang"],
};

/** مخطّطات الروابط المقبولة — `javascript:` و`data:` خارجها بالتعريف. */
const SAFE_SCHEME = /^(https?:|mailto:|tel:|#|\/)/i;

export function sanitizeHtml(html: string): string {
  if (typeof DOMParser === "undefined") return "";
  const doc = new DOMParser().parseFromString(html, "text/html");

  /**
   * المرور بترتيب عكسي: حذف عنصر أثناء التقدّم للأمام يُزحزح ما بعده.
   * و`querySelectorAll("*")` لقطة ساكنة، فالحذف منها آمن — لكن الأبناء
   * يُحذفون مع آبائهم، فنفحص الانتماء قبل اللمس.
   */
  for (const el of [...doc.body.querySelectorAll("*")].reverse()) {
    if (!el.isConnected) continue;
    const tag = el.tagName.toLowerCase();

    if (!ALLOWED_TAGS.has(tag)) {
      // ⚠️ **يُستبدَل بمحتواه النصّي لا يُحذف بمحتواه**: فقرةٌ داخل وسم غير
      // معروف كانت ستختفي كلّها، فيخسر المؤسّس نصّاً كتبه بلا أن يدري.
      // والوسوم التنفيذية وحدها تُحذف كاملةً — نصّ سكربت ليس محتوى.
      if (tag === "script" || tag === "style" || tag === "template" || tag === "noscript") {
        el.remove();
      } else {
        el.replaceWith(...[...el.childNodes]);
      }
      continue;
    }

    const allowed = [...(ALLOWED_ATTRS[tag] ?? []), ...ALLOWED_ATTRS["*"]];
    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase();
      if (!allowed.includes(name)) {
        el.removeAttribute(attr.name);
        continue;
      }
      if ((name === "href" || name === "src") && !SAFE_SCHEME.test(attr.value.trim())) {
        el.removeAttribute(attr.name);
      }
    }

    // رابطٌ يفتح في تبويب جديد بلا `noopener` يمنح الصفحة الهدف `window.opener`.
    if (tag === "a" && el.getAttribute("target") === "_blank") {
      el.setAttribute("rel", "noopener noreferrer");
    }
  }

  return doc.body.innerHTML;
}

export default function BlogPostPage() {
  const { slug = "" } = useParams();
  const [post, setPost] = useState<BlogPost | null | undefined>(undefined);
  const navigate = useNavigate();
  const related = relatedPosts(slug);

  useEffect(() => {
    setPost(undefined);
    // لا استعادة تمرير في الراوتر: من «اقرأ أيضاً» أسفل مقال كان القارئ يصل
    // إلى أسفل المقال التالي. و`instant` لأن `scroll-behavior: smooth` عامّ،
    // فكان الانتقال يُرى تمريراً طويلاً من آخر الصفحة إلى أوّلها.
    window.scrollTo({ top: 0, behavior: "instant" });
    // ⚠️ **مقال القاعدة يغلب الثابت بالـslug نفسه** — كما في `mergePosts`.
    // كان الثابت يُحمَّل وحده هنا، فإن نشر المالك نسخةً مصحَّحة من لوحته رأى
    // القارئ عنوانها في القائمة ونصّها القديم في المقال. والثابت احتياطٌ حين
    // لا صفّ أو تسقط الشبكة، فلا يصير المقال «غير موجود» بلا اتصال.
    const load = isStaticSlug(slug)
      ? Promise.all([getPostBySlug(slug).catch(() => null), loadStaticPost(slug)]).then(
          ([db, local]) => db ?? local
        )
      : getPostBySlug(slug);
    load.then(setPost).catch(() => setPost(null));
  }, [slug]);

  /**
   * الوسوم تُضبط **بعد وصول المقال** لا عند التركيب — ولهذا تُمرَّر `null`
   * أثناء التحميل: عنوانٌ يُكتب قبل أن نعرف ما الصفحة يجعل «جارٍ التحميل»
   * هو ما تلتقطه الفهرسة.
   */
  useSeo(
    post
      ? {
          title: postTitle(post),
          description: postExcerpt(post) || undefined,
          path: `/blog/${slug}`,
          type: "article",
          image: post.cover_image ?? undefined,
        }
      : null
  );

  useJsonLd(
    "post",
    post
      ? {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: postTitle(post),
          description: postExcerpt(post) || undefined,
          inLanguage: "ar",
          datePublished: post.created_at || undefined,
          mainEntityOfPage: absoluteUrl(`/blog/${slug}`),
          publisher: ORGANIZATION,
        }
      : null
  );

  /**
   * روابط النصّ الداخلية (`/blog/…` · `/`) تنتقل داخل التطبيق: النصّ HTML
   * منقّى لا مكوّنات `Link`، فكان كل رابط بين مقالين يعيد تحميل الموقع كلّه.
   * والنقر المعدَّل (تبويب جديد) والروابط الخارجية تبقى للمتصفّح.
   */
  const onBodyClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as HTMLElement).closest("a");
    const href = a?.getAttribute("href");
    if (!a || !href || a.target === "_blank" || !href.startsWith("/") || href.startsWith("//")) return;
    e.preventDefault();
    navigate(href);
  };

  const content = post ? post.content_ar || post.content || "" : "";
  // وسم مغلق فعلي، لا مجرد وجود < و > في نص عربي عادي (مثل «< ٥ دقائق»).
  const looksLikeHtml = /<(p|div|h[1-6]|ul|ol|li|br|img|a|strong|em|blockquote|table)\b[^>]*>/i.test(
    content
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12">
        {post === undefined && (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-64" />
            <Skeleton className="h-40" />
          </div>
        )}

        {post === null && (
          <EmptyState
            icon="search"
            title="المقال غير موجود"
            action={
              <Link to="/blog" className="font-bold text-gold hover:underline">
                → كل المقالات
              </Link>
            }
          />
        )}

        {post && (
          <article className="anim-fade-up">
            <Link to="/blog" className="text-sm font-bold text-dim hover:text-gold">
              → المدونة
            </Link>
            <h1 className="mt-5 font-display text-[2rem] font-bold leading-[1.35] text-ink sm:text-4xl">
              {postTitle(post)}
            </h1>
            {postExcerpt(post) && <p className="mt-4 text-lg leading-[1.8] text-dim">{postExcerpt(post)}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-dim">
              {post.author && <span className="font-semibold text-ink">{post.author}</span>}
              <span aria-hidden="true">·</span>
              <span>{formatDate(post.published_at ?? post.created_at)}</span>
              {readingMinutes(post) && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{readingLabel(readingMinutes(post)!)}</span>
                </>
              )}
              {post.category && <Badge variant="neutral">{post.category}</Badge>}
            </div>
            {post.cover_image && (
              <img
                src={post.cover_image}
                alt=""
                width={1200}
                height={630}
                decoding="async"
                className="mt-8 aspect-[1200/630] w-full rounded-[16px] border border-line object-cover"
              />
            )}
            {/* المحتوى يأتي من لوحة المؤسس (الكتابة في blog_posts مقصورة على
                is_founder() في RLS)، لكن نُنقّيه على أي حال: حساب المؤسس قد
                يُخترق، والتنقية هنا لا تكلّف شيئاً ولا تمسّ التنسيق المشروع. */}
            {looksLikeHtml ? (
              <div
                className="prose-ar mt-6 text-ink"
                onClick={onBodyClick}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
              />
            ) : (
              <div className="prose-ar mt-6 whitespace-pre-wrap text-ink">{content}</div>
            )}

            <aside className="mt-14 rounded-[16px] border border-line bg-panel2/60 p-6 text-center">
              <p className="font-display text-xl font-bold text-ink">احسب أرقام منيوك من وصفاتك</p>
              <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-dim">
                السعرات والكافيين والحساسية — على منيو QR ومنيو مطبوع وملف لتطبيقات التوصيل.
              </p>
              <Link
                to="/login?mode=signup"
                className="press mt-5 inline-flex min-h-12 items-center rounded-[12px] bg-gold px-7 font-bold text-on-gold hover:bg-gold2"
              >
                {CTA_PRIMARY}
              </Link>
            </aside>
          </article>
        )}

        {post && related.length > 0 && (
          <section aria-labelledby="related" className="mt-14 border-t border-line pt-10">
            <h2 id="related" className="font-display text-2xl font-bold text-ink">اقرأ أيضاً</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to={`/blog/${r.slug}`}
                  className="group overflow-hidden rounded-[14px] border border-line bg-panel transition-colors hover:border-ink/30"
                >
                  <img
                    src={r.cover_image ?? ""}
                    alt=""
                    width={1200}
                    height={630}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[1200/630] w-full border-b border-line object-cover"
                  />
                  <p className="p-4 font-display text-[15px] font-bold leading-snug text-ink group-hover:text-gold">
                    {postTitle(r)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

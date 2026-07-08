/** صفحة مقال واحد. */
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Navbar, Footer } from "@/components/site";
import { Badge, EmptyState, Skeleton } from "@/components/ui";
import { getPostBySlug } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import type { BlogPost } from "@/lib/types";
import { postTitle } from "./Blog";

export default function BlogPostPage() {
  const { slug = "" } = useParams();
  const [post, setPost] = useState<BlogPost | null | undefined>(undefined);

  useEffect(() => {
    setPost(undefined);
    getPostBySlug(slug)
      .then((p) => {
        setPost(p);
        if (p) document.title = `${postTitle(p)} — كلاود منيو`;
      })
      .catch(() => setPost(null));
  }, [slug]);

  const content = post ? post.content_ar || post.content || "" : "";
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(content);

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
            emoji="🔍"
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
            <h1 className="mt-4 font-display text-3xl font-black leading-snug text-ink">
              {postTitle(post)}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-faint">
              {post.author && <span>✍️ {post.author}</span>}
              <span>{formatDate(post.published_at ?? post.created_at)}</span>
              {post.category && <Badge variant="neutral">{post.category}</Badge>}
            </div>
            {post.cover_image && (
              <img
                src={post.cover_image}
                alt=""
                loading="lazy"
                decoding="async"
                className="mt-6 w-full rounded-2xl border border-line object-cover"
              />
            )}
            {/* المحتوى يأتي من لوحة المؤسس (مصدر موثوق) — نصاً أو HTML بسيطاً */}
            {looksLikeHtml ? (
              <div className="prose-ar mt-6 text-ink" dangerouslySetInnerHTML={{ __html: content }} />
            ) : (
              <div className="prose-ar mt-6 whitespace-pre-wrap text-ink">{content}</div>
            )}
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
}

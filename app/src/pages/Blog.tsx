/** قائمة مقالات المدونة (من blog_posts حيث published=true). */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar, Footer } from "@/components/site";
import { Badge, EmptyState, Skeleton } from "@/components/ui";
import { getPublishedPosts } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import type { BlogPost } from "@/lib/types";

export function postTitle(p: BlogPost): string {
  return p.title_ar || p.title;
}

export function postExcerpt(p: BlogPost): string {
  return p.excerpt_ar || p.excerpt || "";
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    document.title = "المدونة — كلاود منيو";
    getPublishedPosts()
      .then(setPosts)
      .catch(() => setFailed(true));
  }, []);

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12">
        <header className="mb-10 text-center">
          <h1 className="font-display text-3xl font-black text-ink">
            مدونة <span className="text-gold">كلاود منيو</span>
          </h1>
          <p className="mt-2 text-dim">أفكار عملية لنمو مطعمك في السوق السعودي.</p>
        </header>

        {failed && (
          <EmptyState emoji="📡" title="تعذّر تحميل المقالات" desc="تحقق من اتصالك ثم أعد المحاولة." />
        )}

        {!failed && posts === null && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        )}

        {posts !== null && posts.length === 0 && (
          <EmptyState emoji="✍️" title="لا توجد مقالات بعد" desc="عد قريباً — نكتب لك محتوى مفيداً." />
        )}

        {posts !== null && posts.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <Link
                key={p.id}
                to={`/blog/${p.slug ?? p.id}`}
                className="group overflow-hidden rounded-2xl border border-line bg-panel transition-all hover:-translate-y-1 hover:border-gold/30"
              >
                {p.cover_image ? (
                  <img
                    src={p.cover_image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center bg-panel2 text-4xl">📰</div>
                )}
                <div className="p-5">
                  {p.category && <Badge variant="neutral" className="mb-2">{p.category}</Badge>}
                  <h2 className="font-display font-extrabold leading-snug text-ink group-hover:text-gold">
                    {postTitle(p)}
                  </h2>
                  {postExcerpt(p) && (
                    <p className="mt-2 line-clamp-2 text-sm text-dim">{postExcerpt(p)}</p>
                  )}
                  <p className="mt-3 text-xs text-faint">
                    {formatDate(p.published_at ?? p.created_at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

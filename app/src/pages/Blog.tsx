/** قائمة مقالات المدونة — الثابتة (`lib/articles.ts`) ومنشورات blog_posts معاً. */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar, Footer } from "@/components/site";
import { Badge, EmptyState, Skeleton } from "@/components/ui";
import { getPublishedPosts } from "@/lib/data";
import { useSeo } from "@/lib/seo";
import { mergePosts, readingMinutes } from "@/lib/articles";
import { formatDate } from "@/lib/utils";
import type { BlogPost } from "@/lib/types";

export function postTitle(p: BlogPost): string {
  return p.title_ar || p.title;
}

export function postExcerpt(p: BlogPost): string {
  return p.excerpt_ar || p.excerpt || "";
}

export default function Blog() {
  /** مقالات القاعدة: `null` = تُحمَّل (القاعدة «ج»). والثابتة متاحة فوراً. */
  const [posts, setPosts] = useState<BlogPost[] | null>(null);
  const [failed, setFailed] = useState(false);
  const shown = mergePosts(posts ?? []);

  useSeo({
    title: "المدونة",
    description:
      "أدلّة عملية لأصحاب المطاعم والمقاهي السعودية: اشتراطات المنيو، وحساب السعرات من الوصفة، ومسبّبات الحساسية، والمنيو الرقمي.",
    path: "/blog",
  });

  useEffect(() => {
    getPublishedPosts()
      .then(setPosts)
      .catch(() => setFailed(true));
  }, []);

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-14">
        <header className="mx-auto mb-12 max-w-2xl text-center">
          <span aria-hidden="true" className="mx-auto mb-4 block h-1.5 w-12 bg-[linear-gradient(to_left,var(--c-rule)_70%,var(--c-sadu)_70%)]" />
          <h1 className="font-display text-4xl font-bold text-ink">المدونة</h1>
          <p className="mt-3 text-lg leading-relaxed text-dim">
            أدلّة عملية لأصحاب المطاعم والمقاهي: ما يطلبه المنيو، وكيف تحسب أرقامه.
          </p>
        </header>

        {/* المقالات الثابتة تُعرض فوراً، ومقالات القاعدة تنضمّ حين تصل. والفشل
            لا يُخفي ما عندنا — يُذكر فقط إن لم يبقَ شيء يُعرض. */}
        {shown.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {shown.map((p) => {
              const minutes = readingMinutes(p);
              return (
                <Link
                  key={p.id}
                  to={`/blog/${p.slug ?? p.id}`}
                  className="group overflow-hidden rounded-[16px] border border-line bg-panel transition-colors hover:border-ink/30"
                >
                  {p.cover_image ? (
                    <img
                      src={p.cover_image}
                      alt=""
                      width={1200}
                      height={630}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[1200/630] w-full border-b border-line object-cover"
                    />
                  ) : (
                    <div className="aspect-[1200/630] w-full border-b border-line bg-panel2" />
                  )}
                  <div className="p-5">
                    <div className="mb-2 flex items-center gap-2 text-xs text-dim">
                      {p.category && <Badge variant="neutral">{p.category}</Badge>}
                      {minutes && <span>{minutes} دقائق قراءة</span>}
                    </div>
                    <h2 className="font-display text-xl font-bold leading-snug text-ink group-hover:text-gold">
                      {postTitle(p)}
                    </h2>
                    {postExcerpt(p) && (
                      <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-dim">{postExcerpt(p)}</p>
                    )}
                    <p className="mt-3 text-xs text-dim">{formatDate(p.published_at ?? p.created_at)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : failed ? (
          <EmptyState icon="warn" title="تعذّر تحميل المقالات" desc="تحقق من اتصالك ثم أعد المحاولة." />
        ) : posts === null ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        ) : (
          <EmptyState icon="doc" title="لا توجد مقالات بعد" desc="عد قريباً — نكتب لك محتوى مفيداً." />
        )}
      </main>
      <Footer />
    </div>
  );
}

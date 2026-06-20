import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPosts } from "@/lib/data";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { Card } from "@/components/ui/card";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "المدونة",
  description: "مقالات ونصائح لإدارة وتنمية المطاعم السعودية من كلاود منيو.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndex() {
  const posts = await getPublishedPosts();

  return (
    <>
      <Navbar />
      <main className="flex-1 px-[var(--page-px,clamp(16px,5vw,60px))] pt-28 pb-20">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-display text-4xl font-black">المدونة</h1>
          <p className="mt-2 text-warm">نصائح لإدارة وتنمية مطعمك.</p>

          {posts.length === 0 ? (
            <p className="py-16 text-center text-warm">لا توجد مقالات منشورة بعد.</p>
          ) : (
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {posts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <Card className="h-full overflow-hidden p-0">
                    {post.cover_image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.cover_image}
                        alt={post.title_ar || post.title}
                        loading="lazy"
                        decoding="async"
                        className="h-44 w-full object-cover"
                      />
                    )}
                    <div className="p-5">
                      <h2 className="font-display text-lg font-bold text-cream">
                        {post.title_ar || post.title}
                      </h2>
                      {(post.excerpt_ar || post.excerpt) && (
                        <p className="mt-2 line-clamp-2 text-sm text-warm">
                          {post.excerpt_ar || post.excerpt}
                        </p>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

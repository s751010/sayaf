import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/data";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";

export const revalidate = 300;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "المقال غير موجود" };
  return {
    title: post.seo_title || post.title_ar,
    description: post.seo_description || post.excerpt_ar || undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title_ar,
      description: post.excerpt_ar || undefined,
      images: post.cover_image || undefined,
      type: "article",
    },
  };
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || post.status !== "published") notFound();

  return (
    <>
      <Navbar />
      <main className="flex-1 px-[var(--page-px,clamp(16px,5vw,60px))] pt-28 pb-20">
        <article className="mx-auto max-w-2xl">
          <h1 className="font-display text-3xl font-black leading-tight md:text-4xl">
            {post.title_ar}
          </h1>
          {post.published_at && (
            <p className="mt-3 text-sm text-muted">
              {new Date(post.published_at).toLocaleDateString("ar-SA")}
            </p>
          )}
          {post.cover_image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.cover_image}
              alt={post.title_ar}
              className="mt-6 w-full rounded-2xl object-cover"
            />
          )}
          <div className="mt-8 whitespace-pre-wrap text-lg leading-loose text-cream/90">
            {post.content_ar}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}

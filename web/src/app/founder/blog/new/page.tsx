import { isFounder } from "@/lib/founder";
import { BlogPostForm } from "@/components/founder/blog-post-form";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function NewBlogPostPage() {
  if (!(await isFounder())) {
    return (
      <main className="flex flex-1 items-center justify-center px-5 py-16">
        <Card className="text-center">
          <p className="text-warm">هذه المنطقة مخصّصة للمؤسس فقط.</p>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 px-[var(--page-px,clamp(16px,5vw,60px))] py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 font-display text-2xl font-bold text-cream">مقال جديد</h1>
        <BlogPostForm />
      </div>
    </main>
  );
}

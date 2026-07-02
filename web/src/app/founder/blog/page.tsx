import Link from "next/link";
import { PenSquare, Plus } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import { isFounder } from "@/lib/founder";
import { deletePost, togglePublish } from "@/app/founder/blog/actions";
import { FounderNav } from "@/components/founder/founder-nav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BlogPost } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function FounderBlogPage() {
  if (!(await isFounder())) {
    return (
      <main className="flex flex-1 items-center justify-center px-5 py-16">
        <Card className="text-center">
          <p className="text-warm">هذه المنطقة مخصّصة للمؤسس فقط.</p>
        </Card>
      </main>
    );
  }

  const supabase = await createServerSupabase();
  const { data } = await supabase!
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });
  const posts = (data ?? []) as BlogPost[];

  return (
    <main className="flex-1 px-[var(--page-px,clamp(16px,5vw,60px))] py-10">
      <div className="mx-auto max-w-4xl">
        <FounderNav />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-cream">إدارة المدونة</h1>
            <p className="mt-1 text-warm">{posts.length} مقال</p>
          </div>
          <Link
            href="/founder/blog/new"
            className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-charcoal transition-opacity hover:opacity-90"
          >
            <Plus size={16} /> مقال جديد
          </Link>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {posts.length === 0 && (
            <Card className="text-center text-warm">لا توجد مقالات بعد — أنشئ أول مقال.</Card>
          )}
          {posts.map((post) => (
            <Card key={post.id} className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-cream">
                  {post.title_ar || post.title}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted" dir="ltr">
                  /blog/{post.slug}
                </p>
              </div>
              <Badge variant={post.published ? "green" : "neutral"}>
                {post.published ? "منشور" : "مسودة"}
              </Badge>
              <form action={togglePublish}>
                <input type="hidden" name="id" value={post.id} />
                <input type="hidden" name="next" value={String(!post.published)} />
                <Button type="submit" variant="ghost" size="sm">
                  {post.published ? "إخفاء" : "نشر"}
                </Button>
              </form>
              <Link
                href={`/founder/blog/${post.id}`}
                className="inline-flex items-center gap-1 text-sm font-semibold text-gold hover:underline"
              >
                <PenSquare size={14} /> تحرير
              </Link>
              <form action={deletePost}>
                <input type="hidden" name="id" value={post.id} />
                <Button type="submit" variant="ghost" size="sm" className="text-danger">
                  حذف
                </Button>
              </form>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}

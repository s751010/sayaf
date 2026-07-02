"use client";

import { useActionState } from "react";
import { savePost } from "@/app/founder/blog/actions";
import type { ActionState } from "@/app/dashboard/actions";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BlogPost } from "@/lib/types";

export function BlogPostForm({ post }: { post?: BlogPost }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    savePost,
    {}
  );

  return (
    <Card>
      <form action={action} className="flex flex-col gap-4">
        {post && <input type="hidden" name="id" value={post.id} />}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="العنوان (عربي)" htmlFor="title_ar">
            <Input id="title_ar" name="title_ar" required defaultValue={post?.title_ar ?? ""} />
          </Field>
          <Field label="العنوان (إنجليزي — اختياري)" htmlFor="title">
            <Input id="title" name="title" dir="ltr" defaultValue={post?.title ?? ""} />
          </Field>
        </div>

        <Field label="الرابط (slug)" htmlFor="slug" hint="يظهر في العنوان: /blog/your-slug — يُولَّد من العنوان إن تُرك فارغاً">
          <Input id="slug" name="slug" dir="ltr" defaultValue={post?.slug ?? ""} />
        </Field>

        <Field label="المقتطف (عربي)" htmlFor="excerpt_ar" hint="ملخص قصير يظهر في قائمة المدونة ونتائج البحث">
          <Textarea id="excerpt_ar" name="excerpt_ar" defaultValue={post?.excerpt_ar ?? ""} />
        </Field>

        <Field label="المحتوى (عربي)" htmlFor="content_ar">
          <Textarea id="content_ar" name="content_ar" className="min-h-60" defaultValue={post?.content_ar ?? ""} />
        </Field>

        <details className="rounded-xl border border-line-dim p-4">
          <summary className="cursor-pointer text-sm font-semibold text-warm">
            نسخة إنجليزية (اختياري)
          </summary>
          <div className="mt-4 flex flex-col gap-4">
            <Field label="Excerpt" htmlFor="excerpt">
              <Textarea id="excerpt" name="excerpt" dir="ltr" defaultValue={post?.excerpt ?? ""} />
            </Field>
            <Field label="Content" htmlFor="content">
              <Textarea id="content" name="content" dir="ltr" className="min-h-40" defaultValue={post?.content ?? ""} />
            </Field>
          </div>
        </details>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="رابط صورة الغلاف" htmlFor="cover_image">
            <Input id="cover_image" name="cover_image" dir="ltr" defaultValue={post?.cover_image ?? ""} />
          </Field>
          <Field label="الكاتب" htmlFor="author">
            <Input id="author" name="author" defaultValue={post?.author ?? ""} />
          </Field>
          <Field label="التصنيف" htmlFor="category">
            <Input id="category" name="category" defaultValue={post?.category ?? ""} />
          </Field>
          <Field label="وسوم (مفصولة بفواصل)" htmlFor="tags">
            <Input id="tags" name="tags" defaultValue={post?.tags ?? ""} />
          </Field>
          <Field label="عنوان SEO" htmlFor="seo_title">
            <Input id="seo_title" name="seo_title" defaultValue={post?.seo_title ?? ""} />
          </Field>
          <Field label="وصف SEO" htmlFor="seo_description">
            <Input id="seo_description" name="seo_description" defaultValue={post?.seo_description ?? ""} />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm text-cream">
          <input
            type="checkbox"
            name="published"
            defaultChecked={post?.published ?? false}
            className="h-4 w-4 accent-gold"
          />
          منشور (يظهر في المدونة العامة)
        </label>

        {state.error && <p className="text-sm text-danger">{state.error}</p>}

        <Button type="submit" disabled={pending} className="mt-2 self-start">
          {pending ? "جارٍ الحفظ..." : post ? "حفظ التعديلات" : "إنشاء المقال"}
        </Button>
      </form>
    </Card>
  );
}

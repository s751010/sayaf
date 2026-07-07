"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { isFounder } from "@/lib/founder";
import type { ActionState } from "@/app/dashboard/actions";

function strOrNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** إنشاء/تحديث مقال — كتابة المدونة حصرية للمؤسس (تُفرض هنا وفي RLS). */
export async function savePost(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await isFounder())) return { error: "هذه العملية للمؤسس فقط." };
  const supabase = await createServerSupabase();
  if (!supabase) return { error: "الجلسة منتهية. سجّل الدخول مجدداً." };

  const id = strOrNull(formData.get("id"));
  const title_ar = strOrNull(formData.get("title_ar"));
  if (!title_ar) return { error: "عنوان المقال (بالعربية) مطلوب." };

  const published = formData.get("published") === "on";
  const fields = {
    title: strOrNull(formData.get("title")) ?? title_ar,
    title_ar,
    slug: slugify(strOrNull(formData.get("slug")) ?? title_ar),
    excerpt: strOrNull(formData.get("excerpt")),
    excerpt_ar: strOrNull(formData.get("excerpt_ar")),
    content: strOrNull(formData.get("content")),
    content_ar: strOrNull(formData.get("content_ar")),
    cover_image: strOrNull(formData.get("cover_image")),
    author: strOrNull(formData.get("author")),
    category: strOrNull(formData.get("category")),
    tags: strOrNull(formData.get("tags")),
    seo_title: strOrNull(formData.get("seo_title")),
    seo_description: strOrNull(formData.get("seo_description")),
    published,
    status: published ? "published" : "draft",
    published_at: published ? new Date().toISOString() : null,
  };
  if (!fields.slug) return { error: "أدخل رابطاً (slug) صالحاً للمقال." };

  if (id) {
    const { error } = await supabase.from("blog_posts").update(fields).eq("id", id);
    if (error) return { error: "تعذّر تحديث المقال — تأكد أن الرابط غير مكرر." };
  } else {
    const { error } = await supabase
      .from("blog_posts")
      .insert({ ...fields, views: 0 });
    if (error) return { error: "تعذّر إنشاء المقال — تأكد أن الرابط غير مكرر." };
  }

  revalidatePath("/blog");
  revalidatePath(`/blog/${fields.slug}`);
  revalidatePath("/founder/blog");
  redirect("/founder/blog");
}

export async function deletePost(formData: FormData): Promise<void> {
  if (!(await isFounder())) return;
  const supabase = await createServerSupabase();
  const id = strOrNull(formData.get("id"));
  if (!supabase || !id) return;
  await supabase.from("blog_posts").delete().eq("id", id);
  revalidatePath("/blog");
  revalidatePath("/founder/blog");
}

export async function togglePublish(formData: FormData): Promise<void> {
  if (!(await isFounder())) return;
  const supabase = await createServerSupabase();
  const id = strOrNull(formData.get("id"));
  const next = formData.get("next") === "true";
  if (!supabase || !id) return;
  await supabase
    .from("blog_posts")
    .update({
      published: next,
      status: next ? "published" : "draft",
      published_at: next ? new Date().toISOString() : null,
    })
    .eq("id", id);
  revalidatePath("/blog");
  revalidatePath("/founder/blog");
}

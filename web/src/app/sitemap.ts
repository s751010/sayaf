import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/data";
import { createPublicServerClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";

/** يُعاد بناؤه كل ساعة — يكفي لظهور المطاعم والمقالات الجديدة. */
export const revalidate = 3600;

/**
 * خريطة الموقع تشمل صفحات المطاعم والمقالات، لا الصفحة الرئيسية وحدها.
 * كانت تحوي رابطاً واحداً فقط، فلا يصل الزاحف لأي منيو (البند 5.9).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.5 },
  ];

  const supabase = createPublicServerClient();
  if (supabase) {
    const { data: restaurants } = await supabase
      .from("restaurants")
      .select("slug")
      .not("slug", "is", null)
      .limit(5000);

    for (const r of restaurants ?? []) {
      entries.push({
        url: `${SITE_URL}/${r.slug}`,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
  }

  const posts = await getPublishedPosts().catch(() => []);
  for (const post of posts) {
    entries.push({
      url: `${SITE_URL}/blog/${post.slug}`,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return entries;
}

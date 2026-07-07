import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/data";

const BASE = "https://cloudsmenu.netlify.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/blog`, changeFrequency: "weekly", priority: 0.7 },
  ];

  // يتدهور بأمان إلى الصفحات الثابتة فقط إذا تعذّر الوصول لقاعدة البيانات
  try {
    const posts = await getPublishedPosts();
    const postEntries: MetadataRoute.Sitemap = posts
      .filter((p) => p.slug)
      .map((p) => ({
        url: `${BASE}/blog/${p.slug}`,
        changeFrequency: "monthly",
        priority: 0.6,
      }));
    return [...staticEntries, ...postEntries];
  } catch {
    return staticEntries;
  }
}

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // صفحات خاصة لا قيمة لفهرستها (ومحمية أصلاً بالجلسة وRLS).
      disallow: ["/dashboard", "/founder", "/login"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

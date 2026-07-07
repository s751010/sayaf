import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // مناطق خاصة لا معنى لفهرستها (تعيد التوجيه لتسجيل الدخول)
      disallow: ["/dashboard", "/founder", "/api"],
    },
    sitemap: "https://cloudsmenu.netlify.app/sitemap.xml",
  };
}

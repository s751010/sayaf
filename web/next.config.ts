import type { NextConfig } from "next";

/**
 * ترويسات أمنية على كل رد.
 *
 * كانت الترويسات غائبة تماماً عن `web/` (نسخة `app/` الثابتة وحدها كان لها
 * `_headers`)، أي أن الموقع الرسمي كان قابلاً للتأطير في iframe وللتحميل
 * بأنواع MIME مخمَّنة.
 *
 * ملاحظة على `script-src`: لا نستخدم nonce لأن Next يُعطّل التوليد الثابت
 * للصفحات حين يراه، وصفحات المنيو والمدونة تعتمد عليه. المقابل مقبول هنا
 * لأن الشيفرة لا تحتوي أي `dangerouslySetInnerHTML` ولا أي سكربت خارجي —
 * فـ`'self'` وحدها تمنع تحميل سكربت من نطاق آخر. (التحوّل إلى nonce مع
 * `unstable_after`/proxy مدرَج في خطة ما بعد الإطلاق.)
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  // صور التجّار تُخزَّن base64 في القاعدة أو تُستضاف خارجياً.
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self' 'unsafe-inline'",
  // Supabase وحدها — لا نقطة نهاية أخرى مسموح للمتصفح مخاطبتها.
  "connect-src 'self' https://wjqpsbpebpntpeinqccl.supabase.co",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // لا داعي لإعلان إصدار الإطار لكل ماسح آلي.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;

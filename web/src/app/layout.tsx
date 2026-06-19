import type { Metadata, Viewport } from "next";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "900"],
  variable: "--font-cairo",
  display: "swap",
});

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-tajawal",
  display: "swap",
});

const SITE_URL = "https://cloudsmenu.netlify.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "كلاود منيو — المنيو الرقمي الذكي للمطاعم السعودية",
    template: "%s · كلاود منيو",
  },
  description:
    "منيو QR ذكي للمطاعم السعودية: أكواد QR، قوائم رقمية، ذكاء اصطناعي، وإحصائيات حية.",
  applicationName: "كلاود منيو",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "كلاود منيو",
    locale: "ar_SA",
    url: SITE_URL,
    title: "كلاود منيو — المنيو الرقمي الذكي",
    description:
      "منيو QR ذكي للمطاعم السعودية: أكواد QR، قوائم رقمية، ذكاء اصطناعي، وإحصائيات حية.",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#141210",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} ${tajawal.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}

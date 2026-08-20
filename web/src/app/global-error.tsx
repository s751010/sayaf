"use client";

import { useErrorReport } from "@/components/site/error-report";

/** آخر خطّ دفاع: انهيار داخل التخطيط الجذري نفسه. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useErrorReport(error);

  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          background: "#0E0E0F",
          color: "#F5EFE6",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "1.5rem",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>تعذّر تحميل الصفحة</h1>
        <p style={{ fontSize: "0.875rem", opacity: 0.7 }}>سُجّل الخطأ تلقائياً.</p>
        <button
          type="button"
          onClick={reset}
          style={{
            borderRadius: "999px",
            background: "#D4A843",
            color: "#0E0E0F",
            padding: "0.5rem 1.25rem",
            fontWeight: 700,
            border: 0,
          }}
        >
          إعادة المحاولة
        </button>
      </body>
    </html>
  );
}

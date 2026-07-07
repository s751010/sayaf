"use client";

/**
 * حد الأخطاء الجذري: يحل محل layout الجذر عند فشله، لذا يجب أن يرسم
 * <html> و<body> بنفسه بأنماط inline (لا يمكن الاعتماد على globals.css هنا).
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  console.error(error);

  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          background: "#1c1a17",
          color: "#f5efe4",
          fontFamily: "Tajawal, Cairo, system-ui, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <div style={{ fontSize: "48px" }}>⚠️</div>
        <h1 style={{ margin: 0, fontSize: "24px" }}>حدث خطأ غير متوقع</h1>
        <p style={{ margin: 0, maxWidth: "420px", color: "#c9bda6", fontSize: "14px" }}>
          نعتذر عن الإزعاج — وقع خطأ أثناء تحميل الموقع. جرّب إعادة المحاولة،
          وإن تكرر الخطأ تواصل معنا.
        </p>
        <button
          onClick={() => unstable_retry()}
          style={{
            marginTop: "8px",
            border: "none",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #d4a843, #b8902f)",
            color: "#1c1a17",
            padding: "10px 24px",
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          إعادة المحاولة
        </button>
      </body>
    </html>
  );
}

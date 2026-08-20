"use client";

import { useEffect } from "react";

/** يرسل تفاصيل الانهيار مرة واحدة إلى `/api/client-error`. */
export function useErrorReport(error: Error & { digest?: string }) {
  useEffect(() => {
    fetch("/api/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message || "خطأ غير معروف",
        stack_head: error.stack?.slice(0, 2000),
        page: typeof window !== "undefined" ? window.location.pathname : null,
        digest: error.digest,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [error]);
}

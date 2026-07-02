"use client";

import { useEffect } from "react";

/** تسجيل الـ Service Worker (قابلية التثبيت + عمل دون اتصال للواجهة فقط). */
export function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}

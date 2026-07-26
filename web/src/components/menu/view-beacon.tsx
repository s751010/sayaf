"use client";

import { useEffect, useRef } from "react";

/**
 * يرسل حدث «مشاهدة منيو» مرة واحدة عند فتح الصفحة.
 *
 * لا يمرّر معرّف المالك: الخادم يستنتجه من `menu_id`، فلا يصل `user_id` إلى
 * المتصفح إطلاقاً.
 */
export function ViewBeacon({ menuId }: { menuId: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current || !menuId) return;
    sent.current = true;
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ menu_id: menuId }),
      keepalive: true,
    }).catch(() => {});
  }, [menuId]);
  return null;
}

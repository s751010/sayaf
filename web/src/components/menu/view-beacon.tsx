"use client";

import { useEffect, useRef } from "react";

/** Fires a single menu-view event when the public menu page loads. */
export function ViewBeacon({
  menuId,
  ownerId,
}: {
  menuId: string;
  ownerId: string | null;
}) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current || !menuId) return;
    sent.current = true;
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ menu_id: menuId, owner_id: ownerId }),
      keepalive: true,
    }).catch(() => {});
  }, [menuId, ownerId]);
  return null;
}

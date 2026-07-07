"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

/** Browser Supabase client (for future authenticated client-side features). */
export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url!, anonKey!);
}

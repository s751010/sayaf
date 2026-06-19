"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types";
import { getSupabaseEnv } from "./env";

/** Browser Supabase client (for future authenticated dashboard features). */
export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient<Database>(url!, anonKey!);
}

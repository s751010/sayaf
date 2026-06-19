import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

/**
 * Server-side Supabase client for PUBLIC reads (anon role, no user session).
 * Used by Server Components to render public menu pages. Returns null when
 * env vars are not configured so pages can degrade gracefully instead of
 * crashing the build.
 *
 * The client is intentionally untyped here; callers cast results to the
 * hand-maintained domain types in `@/lib/types` (the live DB lives in a
 * separate Supabase account this workspace can't introspect for codegen).
 */
export function createPublicServerClient(): SupabaseClient | null {
  const { url, anonKey, configured } = getSupabaseEnv();
  if (!configured) return null;
  return createClient(url!, anonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

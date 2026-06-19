import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

/**
 * Server-side Supabase client for PUBLIC reads (anon role, no user session).
 * Used by Server Components to render public menu pages. Returns null when
 * env vars are not configured so pages can degrade gracefully.
 */
export function createPublicServerClient(): SupabaseClient | null {
  const { url, anonKey, configured } = getSupabaseEnv();
  if (!configured) return null;
  return createClient(url!, anonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Authenticated server client bound to the request cookies (Supabase Auth).
 * Use inside Server Components, Server Actions, and Route Handlers.
 */
export async function createServerSupabase(): Promise<SupabaseClient | null> {
  const { url, anonKey, configured } = getSupabaseEnv();
  if (!configured) return null;
  const cookieStore = await cookies();
  return createServerClient(url!, anonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component — safe to ignore; the proxy
          // refreshes the session cookie instead.
        }
      },
    },
  });
}

/** Returns the current authenticated user, or null. */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

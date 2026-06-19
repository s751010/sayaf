import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

/**
 * Refreshes the Supabase auth session on every request and forwards the
 * updated cookies. Called from the root `proxy.ts` (Next 16's renamed
 * middleware). No-ops when Supabase env is not configured.
 */
export async function updateSession(request: NextRequest) {
  const { url, anonKey, configured } = getSupabaseEnv();
  if (!configured) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url!, anonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

"use server";

import { getSupabaseEnv } from "@/lib/supabase/env";

export type FounderResult = { ok: boolean; status?: number; data?: unknown; error?: string };

/**
 * Calls the protected `founder-admin` edge function. The secret (cm_fsecret) is
 * never stored — it's passed per request over HTTPS. The exact contract isn't
 * documented here; this sends the secret in a header + body and returns the raw
 * response for inspection. Confirm the contract before relying on it.
 */
export async function callFounderAdmin(
  secret: string,
  op: string
): Promise<FounderResult> {
  const { url, anonKey, configured } = getSupabaseEnv();
  if (!configured) return { ok: false, error: "الخدمة غير مهيأة." };
  if (!secret.trim()) return { ok: false, error: "أدخل سر المؤسس." };

  try {
    const res = await fetch(`${url}/functions/v1/founder-admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey!,
        Authorization: `Bearer ${anonKey}`,
        "x-cm-fsecret": secret,
      },
      body: JSON.stringify({ secret, op }),
    });
    const data: unknown = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, error: "تعذّر الاتصال بخدمة المؤسس." };
  }
}

"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { buildSystemPrompt } from "@/lib/personas";

export type AskResult = { reply?: string; error?: string };

/**
 * Proxies an advisory question to the CloudMenu `ai-proxy` edge function
 * (which hides the OpenAI key). Contract (confirmed from the function source):
 *   request:  { system, messages: [{role, content}], model?, temperature? }
 *   response: { text } on success, { error } otherwise
 * The function has verify_jwt enabled, so we send the signed-in user's JWT.
 */
export async function askAdvisor(
  persona: string,
  message: string
): Promise<AskResult> {
  if (!message.trim()) return { error: "اكتب سؤالك." };

  const { url, configured } = getSupabaseEnv();
  if (!configured) return { error: "الخدمة غير مهيأة." };

  const supabase = await createServerSupabase();
  if (!supabase) return { error: "الخدمة غير مهيأة." };

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: "سجّل الدخول أولاً." };

  try {
    const res = await fetch(`${url}/functions/v1/ai-proxy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        system: buildSystemPrompt(persona),
        messages: [{ role: "user", content: message }],
        temperature: 0.7,
      }),
    });

    const data: { text?: string; error?: string } = await res
      .json()
      .catch(() => ({}));

    if (!res.ok || data.error) {
      return { error: data.error || `تعذّر الاتصال (${res.status}).` };
    }
    return data.text ? { reply: data.text } : { error: "وصل ردّ فارغ." };
  } catch {
    return { error: "تعذّر الاتصال بالمستشار." };
  }
}

"use server";

import { getCurrentUser } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

export type AskResult = { reply?: string; error?: string };

/**
 * Proxies an advisory question to the CloudMenu `ai-proxy` edge function
 * (which hides the AI provider key). The exact request/response contract of
 * ai-proxy isn't documented here, so we send a generic payload and parse a few
 * common response shapes; adjust once the contract is confirmed.
 */
export async function askAdvisor(
  persona: string,
  message: string
): Promise<AskResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "سجّل الدخول أولاً." };

  const { url, anonKey, configured } = getSupabaseEnv();
  if (!configured) return { error: "الخدمة غير مهيأة." };
  if (!message.trim()) return { error: "اكتب سؤالك." };

  try {
    const res = await fetch(`${url}/functions/v1/ai-proxy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey!,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        persona,
        messages: [{ role: "user", content: message }],
      }),
    });

    if (!res.ok) {
      return { error: `تعذّر الاتصال بالمستشار (${res.status}).` };
    }

    const data: unknown = await res.json().catch(() => null);
    const reply = extractReply(data);
    return reply
      ? { reply }
      : { error: "وصل ردّ غير متوقّع من الخدمة." };
  } catch {
    return { error: "تعذّر الاتصال بالمستشار." };
  }
}

function extractReply(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (typeof d.reply === "string") return d.reply;
  if (typeof d.content === "string") return d.content;
  if (typeof d.message === "string") return d.message;
  if (typeof d.text === "string") return d.text;
  const choices = d.choices as { message?: { content?: string } }[] | undefined;
  if (Array.isArray(choices) && choices[0]?.message?.content) {
    return choices[0].message.content;
  }
  return null;
}

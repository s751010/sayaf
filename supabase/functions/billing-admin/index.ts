/**
 * billing-admin — حالة بوّابة الدفع للمؤسّس وحده.
 *
 * ينشر بـ verify_jwt = false؛ التحقّق يدوي بالكامل (بوّابتان تُقبل أيّهما).
 * **لا تعيد `PAYLINK_SECRET_KEY` ولا أي جزء منه، ولا تقبله** — قرار المالك.
 *
 * ⚠️ **لم يكن لهذه الدالة مصدر في المستودع** حتى ٢٢/٠٨/٢٠٢٦، وكانت تحمل
 * **نسخة قديمة مجرّدة** من `_shared/paylink.ts`: بلا تعليقات، و`getInvoice`
 * فيها بلا معامل `creds`. الملفّ المشترك يُرفع مع كل دالّة **وقت نشرها**،
 * فدالّة لم يُعد نشرها منذ شهر تحمل مشتركاً عمره شهر. هذا ما جعل النسختين
 * تتباعدان بلا أن يظهر شيء.
 */
import {
  apiIdTail,
  authToken,
  hasPlatformCredentials,
  isProduction,
} from "../_shared/paylink.ts";
import { safeEqual } from "../_shared/safe-equal.ts";
import { hasFounderSecret } from "../_shared/founder-secret.ts";

/**
 * ⚠️ **CORS محصور بعد أن كان `*`.**
 *
 * نقطةُ إدارةٍ تقرأ حالة بوّابة الدفع لا تُعلن نفسها لكل أصل. نفس قائمة
 * `founder-admin` و`payments` — والبوّابة هي الحارس لا CORS.
 */
const ALLOWED_ORIGINS = new Set([
  "https://cloudsmenu.netlify.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...(Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map((o) => o.trim()).filter(Boolean),
]);
/** معاينات Netlify (`deploy-preview-12--cloudsmenu.netlify.app`). */
const PREVIEW_RE = /^https:\/\/[a-z0-9-]+--cloudsmenu\.netlify\.app$/;
const isAllowedOrigin = (o: string) => ALLOWED_ORIGINS.has(o) || PREVIEW_RE.test(o);

function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  return {
    ...(isAllowedOrigin(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
    Vary: "Origin",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-founder-secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(req), "Content-Type": "application/json" },
  });
}

let founderEmail: string | null = null;
async function getFounderEmail(): Promise<string | null> {
  if (founderEmail) return founderEmail;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/founder_email`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  if (!res.ok) return null;
  const value = String((await res.json()) ?? "").trim().toLowerCase();
  if (!value) return null;
  founderEmail = value;
  return value;
}

async function isFounderSession(req: Request): Promise<boolean> {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!token || token === SERVICE_KEY) return false;

  const expected = await getFounderEmail();
  if (!expected) return false;

  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return false;

  const user = (await res.json()) as {
    email?: string;
    email_confirmed_at?: string | null;
    confirmed_at?: string | null;
  };
  const email = String(user.email ?? "").trim().toLowerCase();
  const confirmed = !!(user.email_confirmed_at ?? user.confirmed_at);
  return confirmed && safeEqual(email, expected);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "POST فقط." }, 405);

  const allowed = (await hasFounderSecret(req)) || (await isFounderSession(req));
  if (!allowed) return json(req, { error: "غير مصرّح." }, 401);

  const siteUrl = (Deno.env.get("SITE_URL") ?? "").replace(/\/+$/, "");
  const credentialsSet = hasPlatformCredentials();

  let connected = false;
  let error: string | null = null;
  if (credentialsSet) {
    try {
      await authToken();
      connected = true;
    } catch (err) {
      // ⚠️ يُعاد للمؤسّس وحده (البوّابة أعلاه)، وهو تشخيصُ بوّابته هو. ولا
      // يحمل سرّاً: `authToken` تصوغ خطأها بالحالة وحدها بلا نصّ الرد.
      error = err instanceof Error ? err.message.slice(0, 120) : "فشل غير معروف";
    }
  } else {
    error = "المفاتيح غير مضبوطة في أسرار الدوال.";
  }

  return json(req, {
    credentials_set: credentialsSet,
    connected,
    env: isProduction() ? "production" : "test",
    api_id_tail: apiIdTail(),
    checked_at: new Date().toISOString(),
    error,
    webhook_url: `${SUPABASE_URL}/functions/v1/paylink-webhook`,
    callback_url: `${siteUrl}/dashboard/billing?payment=done`,
    cancel_url: `${siteUrl}/dashboard/billing?payment=cancelled`,
  });
});

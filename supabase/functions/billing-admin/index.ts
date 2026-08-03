/**
 * billing-admin — حالة بوّابة الدفع للمؤسّس وحده.
 *
 * ═══ لماذا دالة مستقلّة ═══
 *
 * `founder-admin` **وكيل جداول** بقائمة بيضاء، لا مُرسِل أفعال. وفحص الاتصال
 * بـPayLink ليس قراءة جدول: هو نداء خارجي بمفاتيح لا يجوز أن تلمس المتصفّح.
 *
 * ═══ ما لا تفعله هذه الدالة ═══
 *
 * **لا تعيد `PAYLINK_SECRET_KEY` ولا أي جزء منه، ولا تقبله.** المفاتيح تعيش
 * في أسرار دوال Supabase وحدها؛ ما لا يدخل المتصفّح لا يُسرق منه — لا بـXSS
 * ولا من حافظة ولا من جسم POST. وهذا قرار المالك الصريح.
 *
 * ما تعيده كلّه غير سرّي:
 *   { credentials_set, connected, env, checked_at, api_id_tail, webhook_url, … }
 *
 * `api_id_tail` آخر ثلاثة محارف من **المعرّف** لا السرّ — يكفي لتعرف أي حساب
 * موصول، ولا يكفي لانتحاله.
 *
 * ينشر بـ verify_jwt = false لأن بوّابة السرّ الاحتياطية بلا JWT؛ التحقّق يدوي
 * بالكامل هنا، وهو **نفس منطق `founder-admin` حرفياً** (بوّابتان تُقبل أيّهما).
 */
import {
  apiIdTail,
  authToken,
  hasPlatformCredentials,
  isProduction,
} from "../_shared/paylink.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-founder-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

/** مقارنة بزمن ثابت — تمنع استنتاج السرّ من فروق التوقيت. */
function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
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

function hasFounderSecret(req: Request): boolean {
  const expected = Deno.env.get("FOUNDER_SECRET") ?? "";
  if (expected.length < 24) return false;
  return safeEqual(req.headers.get("x-founder-secret") ?? "", expected);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST فقط." }, 405);

  const allowed = hasFounderSecret(req) || (await isFounderSession(req));
  if (!allowed) return json({ error: "غير مصرّح." }, 401);

  const siteUrl = (Deno.env.get("SITE_URL") ?? "").replace(/\/+$/, "");
  const credentialsSet = hasPlatformCredentials();

  /**
   * فحص حيّ: نطلب رمز وصول من PayLink. نجاحه يعني أن المعرّف والسرّ صحيحان
   * وأن البيئة المضبوطة تقبلهما — وهو أصدق من مجرّد «المتغيّر موجود».
   * وأي رسالة خطأ تُختصر ولا تُمرَّر كما هي، كي لا يتسرّب شيء في نصّها.
   */
  let connected = false;
  let error: string | null = null;
  if (credentialsSet) {
    try {
      await authToken();
      connected = true;
    } catch (err) {
      error = err instanceof Error ? err.message.slice(0, 120) : "فشل غير معروف";
    }
  } else {
    error = "المفاتيح غير مضبوطة في أسرار الدوال.";
  }

  return json({
    credentials_set: credentialsSet,
    connected,
    env: isProduction() ? "production" : "test",
    api_id_tail: apiIdTail(),
    checked_at: new Date().toISOString(),
    error,
    // الروابط التي يلصقها المؤسّس في لوحة PayLink — تُولَّد هنا فلا تُكتب بيدٍ.
    webhook_url: `${SUPABASE_URL}/functions/v1/paylink-webhook`,
    callback_url: `${siteUrl}/dashboard/billing?payment=done`,
    cancel_url: `${siteUrl}/dashboard/billing?payment=cancelled`,
  });
});

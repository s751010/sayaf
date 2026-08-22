/**
 * founder-admin — وكيل PostgREST بمفتاح الخدمة، بوابته هوية المؤسس.
 *
 * ⚠️ **لم يكن لهذه الدالة مصدر في المستودع** حتى ٢٢/٠٨/٢٠٢٦ — وهي أخطر دالّة
 * في المنتج. أُنزلت من لوحة Supabase ووُضعت هنا ليصير تغييرها قابلاً للمراجعة.
 *
 * ═══ بوابتان مقبولتان (أيّهما كفى) ═══
 *
 * 1. **جلسة بريد المؤسس** (المسار المفضَّل): رأس `Authorization: Bearer <jwt>`
 *    لمستخدم بريده = `public.founder_email()` وبريده **مؤكَّد**. هذا نموذج
 *    أقوى من السرّ المشترك: كلمة مرور قابلة للتغيير، ولا سرّ يُلصق في متغيّر
 *    بيئة يُنسى.
 * 2. **`x-founder-secret`** كما كان — يبقى مساراً احتياطياً كي لا يُفقد الوصول
 *    إن تعطّل شيء في الأول. والسرّ يُقرأ من `internal_secrets` في القاعدة
 *    (`_shared/founder-secret.ts`، وفيه لماذا نُقل من أسرار الدوال)، ويشترط
 *    ٢٤ محرفاً فأكثر؛ وغيابه لا يُعطّل المسار الأول.
 *
 * بريد المؤسس **لا يُكرَّر هنا**: يُقرأ من `public.founder_email()` في القاعدة،
 * وهي نفسها التي تقرأها `is_founder()` في سياسات RLS — مصدر واحد.
 *
 * ينشر بـ verify_jwt = false لأن المسار الثاني بلا JWT؛ التحقّق يدوي بالكامل
 * هنا. والتقييد بعد البوابة على ثلاثة محاور:
 *   • قائمة بيضاء للجداول وللعمليات المسموحة على كل جدول.
 *   • **وقائمة بيضاء للاستعلام** (`_shared/founder-query.ts`) — انظر أدناه.
 *   • لا يُمرَّر مسار حر — اسم الجدول يُطابَق تطابقاً تاماً بالقائمة البيضاء.
 */
import { checkFounderQuery } from "../_shared/founder-query.ts";
import { safeEqual } from "../_shared/safe-equal.ts";
import { hasFounderSecret } from "../_shared/founder-secret.ts";

/**
 * ⚠️ **CORS محصور بعد أن كان `*`.**
 *
 * نقطةٌ تقرأ وتكتب بمفتاح الخدمة لا تُعلن نفسها لكل أصل. لا كوكيز هنا
 * (البوّابة رأسٌ صريح)، فالخطر ليس CSRF كلاسيكياً — لكن `*` على واجهة إدارة
 * دعوةٌ مفتوحة لكل صفحة تجرّب.
 */
const ALLOWED_ORIGINS = new Set([
  "https://cloudsmenu.netlify.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  // ⚠️ نطاقٌ جديد يُضاف بمتغيّر البيئة `ALLOWED_ORIGINS` (مفصولة بفواصل) لا
  // بنشرٍ جديد: يوم يُربط `cloudmenu.sa` لا يجوز أن تُقفل اللوحة حتى ينشر أحد.
  ...(Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map((o) => o.trim()).filter(Boolean),
]);
/** معاينات Netlify (`deploy-preview-12--cloudsmenu.netlify.app`). */
const PREVIEW_RE = /^https:\/\/[a-z0-9-]+--cloudsmenu\.netlify\.app$/;
const isAllowedOrigin = (o: string) => ALLOWED_ORIGINS.has(o) || PREVIEW_RE.test(o);

function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  return {
    // أصلٌ غير معروف ⇒ لا يُعكس: المتصفّح يمنع القراءة، والنداء من خادم
    // (لا Origin) يمرّ كما كان — البوّابة هي الحارس لا CORS.
    ...(isAllowedOrigin(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
    Vary: "Origin",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-founder-secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

/** جدول ← العمليات المسموحة عليه. */
const ALLOWED: Record<string, ReadonlyArray<string>> = {
  restaurants: ["GET", "PATCH"],
  subscriptions: ["GET", "PATCH"],
  revenue_log: ["GET"],
  announcements: ["GET", "POST", "PATCH", "DELETE"],
  promo_codes: ["GET", "POST", "PATCH", "DELETE"],
  support_tickets: ["GET", "PATCH"],
  blog_posts: ["GET", "POST", "PATCH", "DELETE"],
  site_settings: ["GET", "POST", "PATCH"],
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function text(req: Request, body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: { ...cors(req), "Content-Type": "application/json" },
  });
}

/**
 * بريد المؤسس من القاعدة، مخبَّأ لعمر النسخة الحيّة.
 * لو فشل النداء لا نُخبّئ الفشل كي تُعالج المحاولة التالية بشكل صحيح.
 */
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
  if (!res.ok) {
    console.error("تعذّر قراءة founder_email():", res.status);
    return null;
  }
  const value = String(await res.json() ?? "").trim().toLowerCase();
  if (!value) return null;
  founderEmail = value;
  return value;
}

/** هل يحمل الطلب جلسة بريدها بريد المؤسس وبريدها مؤكَّد؟ */
async function isFounderSession(req: Request): Promise<boolean> {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  // مفتاح anon يصل أحياناً في هذا الرأس؛ ليس جلسة مستخدم فلا معنى لفحصه.
  if (!token || token === SERVICE_KEY) return false;

  const expected = await getFounderEmail();
  if (!expected) return false;

  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return false;

  const user = await res.json() as {
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
  if (req.method !== "POST") return text(req, JSON.stringify({ error: "POST فقط." }), 405);

  const allowed = (await hasFounderSecret(req)) || (await isFounderSession(req));
  if (!allowed) return text(req, JSON.stringify({ error: "غير مصرّح." }), 401);

  let payload: { table?: string; method?: string; query?: string; body?: unknown };
  try {
    payload = await req.json();
  } catch {
    return text(req, JSON.stringify({ error: "جسم الطلب غير صالح." }), 400);
  }

  const table = String(payload.table ?? "");
  const method = String(payload.method ?? "GET").toUpperCase();
  const query = String(payload.query ?? "");

  const allowedMethods = ALLOWED[table];
  if (!allowedMethods) return text(req, JSON.stringify({ error: "جدول غير مسموح." }), 403);
  if (!allowedMethods.includes(method)) {
    return text(req, JSON.stringify({ error: "عملية غير مسموحة على هذا الجدول." }), 403);
  }

  /**
   * ⚠️ **هنا كان الباب.** كان الفحص «يبدأ بـ`?`» وحده، والاستعلام يمرّ إلى
   * PostgREST كما هو — وPostgREST يفهم في `select` الموارد المضمَّنة عبر
   * المفاتيح الأجنبية. فـ`restaurants?select=*,restaurant_payment_settings(*)`
   * يعبر قائمة الجداول إلى **مفاتيح PayLink السرّية**، و`api_keys(*)` إلى
   * هاشات المفاتيح. أي أن ثمانية جداول مسموحة كانت باباً إلى السكيما كلّها.
   */
  const badQuery = checkFounderQuery(query);
  if (badQuery) {
    console.error("founder-admin: استعلام مرفوض", badQuery, table);
    return text(req, JSON.stringify({ error: "استعلام غير مسموح.", reason: badQuery }), 400);
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  const headers: Record<string, string> = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
    Prefer: method === "DELETE" ? "return=minimal" : "return=representation",
  };

  const res = await fetch(url, {
    method,
    headers,
    body:
      method === "GET" || method === "DELETE" || payload.body == null
        ? undefined
        : JSON.stringify(payload.body),
  });

  const responseBody = await res.text();
  return text(req, responseBody || "[]", res.status);
});

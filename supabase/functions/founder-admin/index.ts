/**
 * founder-admin — وكيل PostgREST بمفتاح الخدمة، محمي بسرّ المؤسس.
 *
 * هذه الدالة كانت مفقودة من المشروع رغم أن لوحة المؤسس في `app/` (وفي النسخة
 * القديمة) تمر عبرها بالكامل — راجع البند 5.8 في ANALYSIS-COMPARISON.md.
 *
 * ينشر بـ verify_jwt = false (اللوحة لا تسجّل دخولاً بحساب Supabase؛ الحارس
 * هو السرّ)، لذا التقييد هنا صارم:
 *   • السرّ يُقارَن بزمن ثابت، ويُشترط طوله ٢٤ محرفاً فأكثر.
 *   • قائمة بيضاء للجداول وللعمليات المسموحة على كل جدول.
 *   • لا يُمرَّر مسار حر — اسم الجدول يُطابَق تطابقاً تاماً بالقائمة البيضاء.
 *
 * ⚠️ نموذج «السرّ المشترك» أضعف من حارسَي `web/` (بريد مؤكَّد + `is_founder()`
 * في RLS). هذه الدالة تُبقي `app/` تعمل؛ والانتقال إلى نموذج `web/` هو
 * التحسين التالي الموصى به.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-founder-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** جدول → العمليات المسموحة عليه. */
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

function text(body: string, status: number): Response {
  return new Response(body, { status, headers: { ...CORS, "Content-Type": "application/json" } });
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return text(JSON.stringify({ error: "POST فقط." }), 405);

  const expected = Deno.env.get("FOUNDER_SECRET") ?? "";
  if (expected.length < 24) {
    console.error("FOUNDER_SECRET غير مضبوط أو أقصر من ٢٤ محرفاً.");
    return text(JSON.stringify({ error: "الخدمة غير مهيّأة." }), 503);
  }

  const provided = req.headers.get("x-founder-secret") ?? "";
  if (!safeEqual(provided, expected)) {
    return text(JSON.stringify({ error: "غير مصرّح." }), 401);
  }

  let payload: { table?: string; method?: string; query?: string; body?: unknown };
  try {
    payload = await req.json();
  } catch {
    return text(JSON.stringify({ error: "جسم الطلب غير صالح." }), 400);
  }

  const table = String(payload.table ?? "");
  const method = String(payload.method ?? "GET").toUpperCase();
  const query = String(payload.query ?? "");

  const allowedMethods = ALLOWED[table];
  if (!allowedMethods) return text(JSON.stringify({ error: "جدول غير مسموح." }), 403);
  if (!allowedMethods.includes(method)) {
    return text(JSON.stringify({ error: "عملية غير مسموحة على هذا الجدول." }), 403);
  }
  // الاستعلام يُمرَّر لـ PostgREST كما هو، لكن لا يُسمح له بتغيير المسار.
  if (query && !query.startsWith("?")) {
    return text(JSON.stringify({ error: "استعلام غير صالح." }), 400);
  }

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const url = `${Deno.env.get("SUPABASE_URL")}/rest/v1/${table}${query}`;

  const headers: Record<string, string> = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
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
  return text(responseBody || "[]", res.status);
});

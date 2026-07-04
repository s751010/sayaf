/**
 * طبقة النداءات الموحّدة: PostgREST + Edge Functions عبر fetch مباشرة (بدون SDK).
 * كل قراءة/كتابة على الجداول تمر من هنا — apikey دائماً، وBearer برمز المستخدم
 * إن وُجدت جلسة (وإلا برمز anon) حتى تُطبَّق سياسات RLS الصحيحة.
 */
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";
import { getAccessToken } from "./session";
import { K, getItem } from "./storage";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type RestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** ترويسات إضافية (مثل Prefer: count=exact). */
  headers?: Record<string, string>;
  /** true = بدون رمز المستخدم حتى مع وجود جلسة (نادراً ما يلزم). */
  anonymous?: boolean;
};

/**
 * نداء PostgREST: `rest("dishes?menu_id=eq.X&select=*")`.
 * الكتابة تُرجع الصفوف المُنشأة/المعدّلة (Prefer: return=representation).
 */
export async function rest<T>(query: string, opts: RestOptions = {}): Promise<T> {
  const method = opts.method ?? "GET";
  const token = opts.anonymous ? null : await getAccessToken();
  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token ?? SUPABASE_ANON_KEY}`,
    ...opts.headers,
  };
  if (method !== "GET") {
    headers["Content-Type"] = "application/json";
    headers["Prefer"] = headers["Prefer"] ?? "return=representation";
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new ApiError(res.status, detail || `rest ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** عدد الصفوف المطابقة دون جلبها (HEAD + Prefer: count=exact). */
export async function restCount(query: string): Promise<number> {
  const token = await getAccessToken();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    method: "HEAD",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token ?? SUPABASE_ANON_KEY}`,
      Prefer: "count=exact",
    },
  });
  if (!res.ok) throw new ApiError(res.status, `count ${res.status}`);
  const range = res.headers.get("content-range") ?? "";
  const total = Number(range.split("/")[1]);
  return Number.isFinite(total) ? total : 0;
}

/**
 * المستشار الذكي عبر `functions/v1/ai-proxy` (يخفي مفتاح المزوّد).
 * العقد: طلب { system, messages, temperature } → { text } أو { error }.
 * الدالة تتحقق من JWT، لذا نرسل رمز المستخدم المسجَّل.
 */
export async function askAI(
  system: string,
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<{ text?: string; error?: string }> {
  const token = await getAccessToken();
  if (!token) return { error: "سجّل الدخول أولاً." };
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ system, messages, temperature: 0.7 }),
    });
    const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
    if (!res.ok || data.error) return { error: data.error || `تعذّر الاتصال (${res.status}).` };
    return data.text ? { text: data.text } : { error: "وصل ردّ فارغ." };
  } catch {
    return { error: "تعذّر الاتصال بالمستشار." };
  }
}

/**
 * لوحة المؤسس عبر `functions/v1/founder-admin` — نفس عقد النسخة الأصلية:
 * body = { table, method, query, body } وترويسة `x-founder-secret` من sessionStorage.
 */
export async function founderAdmin<T>(
  pathQuery: string,
  opts: { method?: string; body?: unknown } = {}
): Promise<T> {
  const table = pathQuery.split(/[?#]/)[0];
  const query = pathQuery.slice(table.length);
  const secret = getItem(K.FSECRET, true) ?? "";
  const res = await fetch(`${SUPABASE_URL}/functions/v1/founder-admin`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "x-founder-secret": secret,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      table,
      method: (opts.method ?? "GET").toUpperCase(),
      query,
      body: opts.body ?? null,
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new ApiError(res.status, text || `founder ${res.status}`);
  return (text ? JSON.parse(text) : []) as T;
}

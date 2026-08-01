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
  // نداء يخصّ مستخدماً مسجَّلاً بلا رمز صالح = جلسة منتهية. لا نُكمل بمفتاح anon:
  // RLS سيرد صفوفاً فارغة بنجاح، فيرى التاجر «لا توجد أطباق» بدل أن يُطلب منه
  // تسجيل الدخول. نفشل بوضوح بدل الفشل الصامت.
  if (!opts.anonymous && !token) {
    throw new ApiError(401, "انتهت الجلسة — سجّل الدخول من جديد.");
  }
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

/** الحاويات المتاحة في Supabase Storage (عامة للقراءة، الكتابة لمستخدم مسجَّل). */
export type Bucket = "dish-images" | "restaurant-images" | "menu-images";

/**
 * رفع صورة إلى Supabase Storage وإرجاع رابطها العام.
 * الحاويات عامة للقراءة، لذا الرابط الناتج يصلح مباشرة في `<img src>`.
 */
export async function uploadImage(
  bucket: Bucket,
  path: string,
  blob: Blob
): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new ApiError(401, "انتهت الجلسة — سجّل الدخول من جديد.");
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${bucket}/${encodeURI(path)}`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        "Content-Type": blob.type || "image/jpeg",
        "cache-control": "31536000",
      },
      body: blob,
    }
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new ApiError(res.status, detail || `upload ${res.status}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodeURI(path)}`;
}

/**
 * لوحة المؤسس عبر `functions/v1/founder-admin` — العقد نفسه:
 * body = { table, method, query, body }.
 *
 * الدالة تقبل **بوابتين**، فنرسل ما نملك منهما:
 * - جلسة المؤسس (`Authorization`) — المسار المفضَّل، بلا سرّ يُحفظ في المتصفح.
 * - `x-founder-secret` — يبقى احتياطياً لمن دخل به من قبل.
 */
export async function founderAdmin<T>(
  pathQuery: string,
  opts: { method?: string; body?: unknown } = {}
): Promise<T> {
  const table = pathQuery.split(/[?#]/)[0];
  const query = pathQuery.slice(table.length);
  const secret = getItem(K.FSECRET, true) ?? "";
  const token = await getAccessToken().catch(() => null);
  const res = await fetch(`${SUPABASE_URL}/functions/v1/founder-admin`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(secret ? { "x-founder-secret": secret } : {}),
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

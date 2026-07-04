/**
 * إدارة جلسة Supabase (GoTrue) بدون SDK — نفس نمط النسخة الأصلية:
 * `auth/v1/token?grant_type=password` للدخول، `signup` للتسجيل،
 * و`grant_type=refresh_token` لتجديد الجلسة قبل انتهائها.
 */
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";
import { K, getJSON, setJSON, removeItem } from "./storage";

export interface SessionUser {
  id: string;
  email: string | null;
  user_metadata?: Record<string, unknown>;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  /** طابع Unix (ثوانٍ) لانتهاء صلاحية access_token. */
  expires_at: number;
  user: SessionUser;
}

type GoTrueTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  user?: SessionUser;
  error?: string;
  error_description?: string;
  msg?: string;
};

const listeners = new Set<(s: Session | null) => void>();

export function onSessionChange(fn: (s: Session | null) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify(s: Session | null) {
  listeners.forEach((fn) => fn(s));
}

export function loadSession(): Session | null {
  const s = getJSON<Session>(K.SESSION);
  return s?.access_token && s.refresh_token && s.user ? s : null;
}

function saveSession(s: Session) {
  setJSON(K.SESSION, s);
  notify(s);
}

export function clearSession() {
  removeItem(K.SESSION);
  notify(null);
}

async function gotrue(path: string, body: unknown): Promise<GoTrueTokenResponse> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as GoTrueTokenResponse;
  if (!res.ok) {
    throw new Error(data.error_description || data.msg || data.error || `auth ${res.status}`);
  }
  return data;
}

function toSession(d: GoTrueTokenResponse): Session | null {
  if (!d.access_token || !d.refresh_token || !d.user) return null;
  return {
    access_token: d.access_token,
    refresh_token: d.refresh_token,
    expires_at: d.expires_at ?? Math.floor(Date.now() / 1000) + (d.expires_in ?? 3600),
    user: d.user,
  };
}

export async function signInWithPassword(email: string, password: string): Promise<Session> {
  const d = await gotrue("token?grant_type=password", { email, password });
  const s = toSession(d);
  if (!s) throw new Error("استجابة دخول غير مكتملة.");
  saveSession(s);
  return s;
}

/** يعيد الجلسة إن فُعّل الحساب فوراً، أو null إن كان تأكيد البريد مطلوباً. */
export async function signUp(
  email: string,
  password: string,
  name: string
): Promise<Session | null> {
  const d = await gotrue("signup", { email, password, data: { name } });
  const s = toSession(d);
  if (s) saveSession(s);
  return s;
}

export function signOut() {
  // لا حاجة لنداء الخادم — إسقاط الرموز محلياً يكفي لـ SPA.
  clearSession();
}

let refreshing: Promise<Session | null> | null = null;

async function refresh(current: Session): Promise<Session | null> {
  try {
    const d = await gotrue("token?grant_type=refresh_token", {
      refresh_token: current.refresh_token,
    });
    const s = toSession(d);
    if (!s) throw new Error("bad refresh");
    saveSession(s);
    return s;
  } catch {
    clearSession();
    return null;
  }
}

/**
 * يعيد access_token صالحاً (يجدد تلقائياً قبل الانتهاء بدقيقة)، أو null بدون جلسة.
 * تُجمع طلبات التجديد المتزامنة في وعد واحد.
 */
export async function getAccessToken(): Promise<string | null> {
  const s = loadSession();
  if (!s) return null;
  if (s.expires_at - 60 > Date.now() / 1000) return s.access_token;
  refreshing ??= refresh(s).finally(() => (refreshing = null));
  const next = await refreshing;
  return next?.access_token ?? null;
}

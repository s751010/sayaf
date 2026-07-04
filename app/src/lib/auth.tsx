/** سياق المصادقة — يغلّف lib/session ويوفّر حالة المستخدم لكل التطبيق. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  getAccessToken,
  loadSession,
  onSessionChange,
  signInWithPassword,
  signOut as sessionSignOut,
  signUp as sessionSignUp,
  type SessionUser,
} from "./session";

interface AuthContextValue {
  user: SessionUser | null;
  /** true حتى تُفحص الجلسة المخزنة عند الإقلاع (تجنّب وميض شاشة الدخول). */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  /** يعيد true إن اكتمل الدخول، وfalse إن كان تأكيد البريد مطلوباً. */
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const off = onSessionChange((s) => setUser(s?.user ?? null));
    // تحقّق من صلاحية الجلسة المخزنة (يجدد الرمز إن لزم).
    const stored = loadSession();
    if (!stored) {
      setLoading(false);
      return off;
    }
    setUser(stored.user);
    getAccessToken()
      .then((token) => {
        if (!token) setUser(null);
      })
      .finally(() => setLoading(false));
    return off;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const s = await signInWithPassword(email, password);
    setUser(s.user);
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    const s = await sessionSignUp(email, password, name);
    if (s) setUser(s.user);
    return Boolean(s);
  }, []);

  const logout = useCallback(() => {
    sessionSignOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth خارج AuthProvider");
  return ctx;
}

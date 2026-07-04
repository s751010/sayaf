/** الدخول وإنشاء الحساب — نفس حسابات Supabase الحالية تعمل هنا. */
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Logo } from "@/components/site";
import { Button, Card, ErrorNote, Field, Input, Spinner, ThemeToggle } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type Mode = "login" | "signup";

export default function Login() {
  const { user, loading, login, signup } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<Mode>(params.get("mode") === "signup" ? "signup" : "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "دخول التجّار — كلاود منيو";
  }, []);

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!email.trim() || !password) return setError("أدخل البريد وكلمة المرور.");
    if (mode === "signup" && password.length < 6)
      return setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
        navigate("/dashboard", { replace: true });
      } else {
        const done = await signup(email.trim(), password, name.trim());
        if (done) navigate("/dashboard", { replace: true });
        else setNotice("تم إنشاء الحساب! تحقق من بريدك لتفعيل الحساب ثم سجّل الدخول.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(
        /invalid|credentials/i.test(msg)
          ? "بيانات الدخول غير صحيحة."
          : /already|registered/i.test(msg)
            ? "هذا البريد مسجَّل مسبقاً — جرّب تسجيل الدخول."
            : "تعذّرت العملية. حاول مجدداً."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glow-bg flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-5 py-4">
        <Link to="/" aria-label="الرئيسية">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 pb-16">
        <div className="anim-fade-up w-full max-w-md">
          <Card className="p-7">
            <div className="mb-6 flex rounded-xl border border-line bg-panel2 p-1">
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setError("");
                    setNotice("");
                  }}
                  className={cn(
                    "flex-1 rounded-lg py-2 text-sm font-bold transition-colors",
                    mode === m ? "bg-gold text-on-gold" : "text-dim hover:text-ink"
                  )}
                >
                  {m === "login" ? "تسجيل دخول" : "حساب جديد"}
                </button>
              ))}
            </div>

            <h1 className="font-display text-xl font-black text-ink">
              {mode === "login" ? "أهلاً بعودتك 👋" : "أنشئ حساب مطعمك 🚀"}
            </h1>
            <p className="mt-1 text-sm text-dim">
              {mode === "login"
                ? "ادخل للوحة تحكم مطعمك."
                : "دقيقة واحدة ويصير عندك منيو رقمي."}
            </p>

            <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
              {mode === "signup" && (
                <Field label="اسمك">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: أبو فهد"
                    autoComplete="name"
                  />
                </Field>
              )}
              <Field label="البريد الإلكتروني">
                <Input
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </Field>
              <Field label="كلمة المرور">
                <Input
                  type="password"
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                />
              </Field>

              {error && <ErrorNote>{error}</ErrorNote>}
              {notice && (
                <p className="rounded-xl border border-good/30 bg-good/10 px-4 py-3 text-sm text-good">
                  {notice}
                </p>
              )}

              <Button type="submit" disabled={busy} className="mt-1 w-full py-3">
                {busy ? <Spinner className="h-4 w-4 border-on-gold" /> : mode === "login" ? "دخول" : "إنشاء الحساب"}
              </Button>
            </form>
          </Card>
          <p className="mt-4 text-center text-xs text-faint">
            بدخولك أنت توافق على شروط الاستخدام وسياسة الخصوصية.
          </p>
        </div>
      </main>
    </div>
  );
}

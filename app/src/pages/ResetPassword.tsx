/**
 * تعيين كلمة مرور جديدة من رابط الاستعادة `/reset-password`.
 *
 * GoTrue يعيد الرموز في **hash** الرابط (`#access_token=…&type=recovery`) لا في
 * الاستعلام، فلا تصل الخادم. نقرأها ثم نمسحها من شريط العنوان فوراً حتى لا
 * تبقى في سجلّ التصفّح أو تُنسخ مع الرابط.
 */
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/site";
import { Button, Card, ErrorNote, Field, Input, Spinner, ThemeToggle } from "@/components/ui";
import { adoptSession, updatePassword } from "@/lib/session";

const MIN_LENGTH = 8;

type Tokens = { access: string; refresh: string; expiresIn: number };

function readTokens(): Tokens | null {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return null;
  const p = new URLSearchParams(hash);
  const access = p.get("access_token");
  if (!access || p.get("type") !== "recovery") return null;
  return {
    access,
    refresh: p.get("refresh_token") ?? "",
    expiresIn: Number(p.get("expires_in")) || 3600,
  };
}

export default function ResetPassword() {
  const navigate = useNavigate();
  /**
   * تُقرأ أثناء تهيئة الحالة لا داخل `useEffect` — لأن التأثير يمسح الـhash،
   * و`StrictMode` يشغّل التأثير مرتين في التطوير فتقرأ المرّة الثانية hash
   * فارغاً وتمسح الرموز التي قرأتها المرّة الأولى.
   */
  const [tokens] = useState<Tokens | null>(readTokens);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "كلمة مرور جديدة — كلاود منيو";
    // امسح الرموز من شريط العنوان مع إبقاء المسار.
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!tokens) return;
    setError("");
    if (password.length < MIN_LENGTH)
      return setError(`كلمة المرور يجب أن تكون ${MIN_LENGTH} أحرف على الأقل.`);
    if (password !== confirm) return setError("الكلمتان غير متطابقتين.");
    setBusy(true);
    try {
      const user = await updatePassword(tokens.access, password);
      // برمز تجديد صالح ندخله لوحته مباشرة؛ بدونه يسجّل الدخول بكلمته الجديدة.
      if (tokens.refresh && user.id) {
        adoptSession(tokens.access, tokens.refresh, user, tokens.expiresIn);
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(
        /expired|invalid|jwt/i.test(msg)
          ? "انتهت صلاحية الرابط. اطلب رابطاً جديداً من صفحة الدخول."
          : "تعذّر تعيين كلمة المرور. حاول مجدداً."
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
            {tokens === null ? (
              <div className="text-center">
                <span className="text-4xl">⏳</span>
                <h1 className="mt-3 font-display text-xl font-black text-ink">
                  هذا الرابط لم يعد صالحاً
                </h1>
                <p className="mt-2 text-sm text-dim">
                  روابط الاستعادة تنتهي بعد فترة قصيرة، وتُستخدم مرة واحدة فقط.
                  اطلب رابطاً جديداً وستصلك رسالة خلال دقائق.
                </p>
                <Link
                  to="/login"
                  className="mt-5 inline-block rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-on-gold hover:bg-gold2"
                >
                  اطلب رابطاً جديداً
                </Link>
              </div>
            ) : (
              <>
                <h1 className="font-display text-xl font-black text-ink">
                  كلمة مرور جديدة 🔑
                </h1>
                <p className="mt-1 text-sm text-dim">
                  اخترها ولن تحتاج لتسجيل الدخول من جديد.
                </p>

                <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
                  <Field label="كلمة المرور الجديدة" hint={`${MIN_LENGTH} أحرف على الأقل`}>
                    <Input
                      type="password"
                      dir="ltr"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      autoFocus
                      required
                    />
                  </Field>
                  <Field label="أعد كتابتها">
                    <Input
                      type="password"
                      dir="ltr"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      required
                    />
                  </Field>

                  {error && <ErrorNote>{error}</ErrorNote>}

                  <Button type="submit" disabled={busy} className="mt-1 w-full py-3">
                    {busy ? <Spinner className="h-4 w-4 border-on-gold" /> : "احفظ وادخل"}
                  </Button>
                </form>
              </>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}

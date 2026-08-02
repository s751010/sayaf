/**
 * قشرة لوحة المؤسس: البوابة + التبويبات + الراوتر الفرعي.
 *
 * ═══ البوابة ═══
 *
 * الدخول ببريد المؤسس نفسه: إن كانت هناك جلسة، تُجرَّب مباشرة فتُفتح اللوحة بلا
 * خطوة إضافية (البريد المعتمد في `founder_email()` بالقاعدة لا هنا — فلا يتكرّر
 * في مكانين). وسرّ المؤسس يبقى **مساراً احتياطياً** مطوياً كي لا يُفقد الوصول
 * إن تعطّل شيء في الأول؛ ولا يُضمَّن في الكود أبداً ولا يُحفظ إلا في
 * sessionStorage.
 *
 * ═══ لماذا فحص الجلسة مرتين ═══
 *
 * `unlocked` تعني «الدالة قبلتني»، و`user` تعني «لديّ جلسة». الأقسام المبنية
 * على دوال القاعدة المجمّعة تحتاج **جلسة** لأن `is_founder()` تقرأ الـJWT، فمن
 * دخل بالسرّ وحده يرى تفسيراً صريحاً بدل قسم فارغ بلا سبب.
 */
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { Logo } from "@/components/site";
import {
  Badge,
  Button,
  Card,
  ErrorNote,
  Field,
  Input,
  Skeleton,
  ThemeToggle,
} from "@/components/ui";
import { founderAdmin } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { K, getItem, removeItem, setItem } from "@/lib/storage";
import { cn } from "@/lib/utils";

import Overview from "./Overview";
import Merchants from "./Merchants";
import MerchantDetail from "./MerchantDetail";
import Money from "./Money";
import Comms from "./Comms";
import Health from "./Health";

const NAV = [
  { to: "/founder", label: "نظرة عامة", icon: "📊", end: true },
  { to: "/founder/merchants", label: "التجّار", icon: "🏪" },
  { to: "/founder/money", label: "المال والنمو", icon: "💰" },
  { to: "/founder/comms", label: "التواصل", icon: "📣" },
  { to: "/founder/health", label: "الصحة", icon: "🩺" },
];

export default function Founder() {
  const { user, loading: authLoading, login, logout } = useAuth();
  const [secret, setSecret] = useState(() => getItem(K.FSECRET, true) ?? "");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  /** فحص الجلسة الحالية جارٍ — يمنع وميض شاشة الدخول أمام المؤسس المسجَّل. */
  const [probing, setProbing] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    document.title = "لوحة المؤسس — كلاود منيو";
  }, []);

  /**
   * نداء خفيف يثبت أن الدالة تقبلني، بلا جلب بيانات القسم.
   * كل قسم يجلب ما يخصّه — فلا تنتظر البوابة أثقل استعلام في اللوحة.
   */
  const probe = useCallback(async () => {
    await founderAdmin<unknown[]>("site_settings?select=key&limit=1");
  }, []);

  useEffect(() => {
    if (authLoading) return;
    let alive = true;
    if (!user && !getItem(K.FSECRET, true)) {
      setProbing(false);
      return;
    }
    probe()
      .then(() => alive && setUnlocked(true))
      .catch(() => {})
      .finally(() => alive && setProbing(false));
    return () => {
      alive = false;
    };
  }, [authLoading, user, probe]);

  /** دخول ببريد المؤسس — الحساب نفسه الذي يملك المنصة. */
  async function signIn(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
      await probe();
      setUnlocked(true);
    } catch {
      setError("البريد أو كلمة المرور غير صحيحة، أو هذا الحساب ليس حساب المؤسس.");
    } finally {
      setBusy(false);
    }
  }

  /** المسار الاحتياطي بالسرّ — يبقى حتى يتأكّد المؤسس أن دخول البريد يعمل. */
  async function unlock(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    setItem(K.FSECRET, secret.trim(), true);
    try {
      await probe();
      setUnlocked(true);
    } catch {
      removeItem(K.FSECRET, true);
      setError("السر غير صحيح أو الخدمة غير متاحة.");
    } finally {
      setBusy(false);
    }
  }

  // قاعدة حالات التحميل: لا نعرض جدار الدخول قبل أن تُحسم الجلسة والمحاولة.
  if (!unlocked && (authLoading || probing)) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-5">
        <Skeleton className="h-40 w-full max-w-sm" />
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="glow-bg flex min-h-dvh flex-col">
        <header className="flex items-center justify-between px-5 py-4">
          <Link to="/">
            <Logo />
          </Link>
          <ThemeToggle />
        </header>
        <main className="flex flex-1 items-center justify-center px-5 pb-16">
          <Card className="anim-fade-up w-full max-w-sm p-7 text-center">
            <span className="text-4xl">🛡️</span>
            <h1 className="mt-3 font-display text-xl font-black text-ink">لوحة المؤسس</h1>
            <p className="mt-1 text-sm text-dim">
              {user
                ? "هذا الحساب ليس حساب المؤسس — سجّل الدخول ببريد المؤسس."
                : "سجّل الدخول ببريد المؤسس."}
            </p>

            <form onSubmit={signIn} className="mt-5 flex flex-col gap-3 text-right">
              <Field label="البريد">
                <Input
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </Field>
              <Field label="كلمة المرور">
                <Input
                  type="password"
                  dir="ltr"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </Field>
              {error && <ErrorNote>{error}</ErrorNote>}
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? "جارٍ التحقق…" : "دخول"}
              </Button>
            </form>

            {user && (
              <button
                onClick={() => {
                  logout();
                  setError("");
                }}
                className="mt-3 text-xs font-bold text-dim hover:text-ink"
              >
                تسجيل الخروج من «{user.email}»
              </button>
            )}

            {/* المسار الاحتياطي — مطويّ كي لا يكون هو الطريق المعتاد. */}
            <details className="mt-5 text-right" open={showSecret}>
              <summary
                onClick={() => setShowSecret((v) => !v)}
                className="cursor-pointer text-center text-xs font-bold text-faint hover:text-dim"
              >
                الدخول بسر المؤسس (احتياطي)
              </summary>
              <form onSubmit={unlock} className="mt-3 flex flex-col gap-3">
                <Field label="السر">
                  <Input
                    type="password"
                    dir="ltr"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder="••••••••••"
                    required
                  />
                </Field>
                <Button type="submit" variant="ghost" disabled={busy} className="w-full">
                  {busy ? "جارٍ التحقق…" : "دخول بالسر"}
                </Button>
              </form>
            </details>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-page/85 backdrop-blur-lg">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex h-16 items-center justify-between">
            <Link to="/">
              <Logo />
            </Link>
            <div className="flex items-center gap-2">
              {/* الدخول صار يفتح هذه اللوحة تلقائياً لصاحب المنصة، فلا بدّ من
                  طريق واضح إلى لوحة التاجر — وهو يملك مطعماً أيضاً. */}
              <Link
                to="/dashboard"
                className="rounded-xl px-3 py-1.5 text-xs font-bold text-dim hover:bg-ink/5 hover:text-ink"
              >
                🍽️ لوحة التاجر
              </Link>
              <Badge>🛡️ المؤسس</Badge>
              <ThemeToggle />
            </div>
          </div>

          <nav className="-mx-1 flex gap-1 overflow-x-auto pb-2">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  cn(
                    "flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold transition-colors",
                    isActive ? "bg-gold/12 text-gold" : "text-dim hover:bg-ink/5 hover:text-ink"
                  )
                }
              >
                <span>{n.icon}</span>
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {!user ? (
          // دخل بالسرّ وحده: دوال القاعدة تقرأ الـJWT فلا تعمل بلا جلسة.
          <Card className="text-center">
            <p className="text-sm font-bold text-ink">هذه اللوحة تحتاج جلسة بريد المؤسس</p>
            <p className="mt-1.5 text-sm text-dim">
              دخلتَ بالسرّ الاحتياطي، وهو يفتح الوصول للجداول لكن أدوات اللوحة تسأل القاعدة
              «هل المتصل هو المؤسس؟» عبر جلسته. سجّل الدخول ببريدك لتظهر الأقسام.
            </p>
            <Button className="mt-4" onClick={() => removeItem(K.FSECRET, true)}>
              العودة لشاشة الدخول
            </Button>
          </Card>
        ) : (
          <Routes>
            <Route index element={<Overview />} />
            <Route path="merchants" element={<Merchants />} />
            <Route path="merchants/:id" element={<MerchantDetail />} />
            <Route path="money" element={<Money />} />
            <Route path="comms" element={<Comms />} />
            <Route path="health" element={<Health />} />
            <Route path="*" element={<Navigate to="/founder" replace />} />
          </Routes>
        )}
      </main>
    </div>
  );
}

/**
 * لوحة المؤسّس — القشرة والبوّابة والتنقّل (أُعيد بناؤها ٢٠٢٦/١١/٢٦).
 *
 * ═══ البوّابة ═══
 *
 * إيميلٌ وكلمة مرور، ثم سؤالٌ واحد للقاعدة: `is_founder()` بجلسة المستخدم —
 * **نفس السؤال الذي تسأله RLS لكلّ قسم**. فإن قالت «نعم» فتحت الأقسام كلّها
 * حتماً، وإن قالت «لا» عرضنا السبب بدقّة والإيميل الذي دخلتَ به.
 *
 * كانت تسأل دالّة الحافة `founder-admin` بدلاً منها — ولا قسم يحتاجها — فأيّ
 * خلل فيها وحدها كان يقفل اللوحة برسالة تتّهم الحساب. التفصيل في
 * `lib/founderGate.ts`.
 *
 * ═══ التنقّل ═══
 *
 * ستّة أقسام بأسماء أفعال المالك لا أسماء الجداول: اليوم · التجّار · الفلوس ·
 * الدعم · الموقع · مهامي. شريطٌ جانبي على الحاسوب، وشريطٌ سفلي على الجوال
 * (ستّة × ٦٥px على ٣٩٠px — لا يفيض، فلا قسم مخفيّ خلف تمرير).
 */
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Logo } from "@/components/site";
import { Button, Card, ErrorNote, Field, Input, Skeleton, ThemeToggle, useToast } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import {
  LOGIN_FAILURE_TEXT,
  SQL_EDITOR_URL,
  checkFounder,
  classifyLoginError,
  founderEmailSql,
  type FounderCheck,
} from "@/lib/founderGate";
import { getOverview, getSiteSettings } from "@/lib/founder";
import { TODO_SETTING_KEY, parseTodoState, remainingCount } from "@/lib/ownerTasks";
import { Icon, type IconName } from "@/lib/icons";
import { cn } from "@/lib/utils";

import Today from "./Today";
import Merchants from "./Merchants";
import MerchantDetail from "./MerchantDetail";
import Money from "./Money";
import Support from "./Support";
import Health from "./Health";
import Tasks from "./Tasks";

type NavItem = { to: string; label: string; icon: IconName; end?: boolean; count?: "tickets" | "tasks" };

const NAV: NavItem[] = [
  { to: "/founder", label: "اليوم", icon: "home", end: true },
  { to: "/founder/merchants", label: "التجّار", icon: "store" },
  { to: "/founder/money", label: "الفلوس", icon: "money" },
  { to: "/founder/support", label: "الدعم", icon: "chat", count: "tickets" },
  { to: "/founder/site", label: "الموقع", icon: "pulse" },
  { to: "/founder/tasks", label: "مهامي", icon: "check", count: "tasks" },
];

export default function Founder() {
  const { user, loading: authLoading } = useAuth();
  const [check, setCheck] = useState<FounderCheck | null>(null);

  useEffect(() => {
    document.title = "لوحتي — كلاود منيو";
  }, []);

  const runCheck = useCallback(async () => {
    setCheck(null);
    setCheck(await checkFounder());
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setCheck(null);
      return;
    }
    void runCheck();
  }, [authLoading, user, runCheck]);

  // القاعدة (ج): لا شاشة دخول ولا رفض قبل أن تُحسم الجلسة والسؤال.
  if (authLoading || (user && check === null)) {
    return (
      <GateFrame>
        <Skeleton className="h-48 w-full max-w-sm" />
      </GateFrame>
    );
  }
  if (!user) return <LoginScreen />;
  if (check === "unreachable") return <Unreachable onRetry={runCheck} />;
  if (check === "no") return <NotFounder email={user.email ?? ""} onRetry={runCheck} />;
  return <Shell />;
}

/* ── البوّابة ─────────────────────────────────────────────────────── */

function GateFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="glow-bg flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-5 py-4">
        <Link to="/">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-6 sm:items-center sm:pt-0">
        {children}
      </main>
    </div>
  );
}

function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
      // نجح الدخول: القشرة تسأل القاعدة بنفسها حين تتغيّر الجلسة.
    } catch (err) {
      setError(LOGIN_FAILURE_TEXT[classifyLoginError(err)]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <GateFrame>
      <Card className="anim-fade-up w-full max-w-sm p-7">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/12 text-gold">
            <Icon name="shield" size={22} />
          </span>
          <div>
            <h1 className="font-display text-xl font-black text-ink">لوحتي</h1>
            <p className="text-xs text-dim">لوحة صاحب كلاود منيو</p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
          <Field label="الإيميل">
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
          <Button type="submit" busy={busy} busyText="جارٍ الدخول…" className="w-full">
            دخول
          </Button>
        </form>
        <Link
          to="/login?mode=forgot"
          className="mt-4 block text-center text-xs font-bold text-dim hover:text-ink"
        >
          نسيت كلمة المرور؟
        </Link>
      </Card>
    </GateFrame>
  );
}

function Unreachable({ onRetry }: { onRetry: () => void }) {
  return (
    <GateFrame>
      <Card className="w-full max-w-sm p-7 text-center">
        <Icon name="plug" size={28} className="mx-auto text-gold" />
        <h1 className="mt-3 font-display text-lg font-black text-ink">ما قدرنا نوصل للخادم</h1>
        <p className="mt-1.5 text-sm text-dim">تأكّد من الإنترنت وجرّب مرة ثانية.</p>
        <Button className="mt-5 w-full" onClick={onRetry}>
          جرّب مرة ثانية
        </Button>
      </Card>
    </GateFrame>
  );
}

/**
 * دخلتَ، لكن بإيميلٍ غير إيميل المؤسّس — نقولها صراحة ونريك الإيميل.
 *
 * وتحتها الطريق إن كان هذا الإيميل هو الذي تريده: سطور SQL جاهزة بإيميلك
 * تلصقها في محرّر Supabase. (لا تكشف شيئاً: من لا يملك المشروع لا يشغّلها.)
 */
function NotFounder({ email, onRetry }: { email: string; onRetry: () => void }) {
  const { logout } = useAuth();
  const toast = useToast();
  const sql = founderEmailSql(email);

  return (
    <GateFrame>
      <Card className="w-full max-w-md p-7">
        <h1 className="font-display text-lg font-black text-ink">هذا الحساب ما يفتح لوحتك</h1>
        <p className="mt-2 text-sm text-dim">
          دخلت بـ{" "}
          <bdi dir="ltr" className="font-bold text-ink">
            {email}
          </bdi>
          ، واللوحة تفتح لإيميل المؤسس وحده.
        </p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" onClick={() => logout()}>
            ادخل بإيميل ثاني
          </Button>
          <Button variant="outline" className="flex-1" onClick={onRetry}>
            تحقّق مرة ثانية
          </Button>
        </div>

        {sql && (
          <details className="mt-6 rounded-xl border border-line bg-panel2 p-4">
            <summary className="cursor-pointer text-sm font-bold text-ink">
              تبي هذا الإيميل يصير إيميل المؤسس؟
            </summary>
            <ol className="mt-3 list-decimal space-y-1.5 ps-5 text-sm text-dim">
              <li>
                افتح{" "}
                <a href={SQL_EDITOR_URL} target="_blank" rel="noopener noreferrer" className="font-bold text-gold underline">
                  محرّر SQL في Supabase
                </a>
                .
              </li>
              <li>الصق السطور تحت واضغط Run.</li>
              <li>ارجع هنا واضغط «تحقّق مرة ثانية».</li>
            </ol>
            <pre dir="ltr" className="mt-3 max-h-48 overflow-auto rounded-lg bg-ink/[.06] p-3 text-[11px] leading-relaxed text-ink">
              {sql}
            </pre>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() =>
                navigator.clipboard
                  ?.writeText(sql)
                  .then(() => toast("نُسخ ✓"))
                  .catch(() => toast("ما قدرنا ننسخ — حدّده وانسخه يدوياً.", "err"))
              }
            >
              <Icon name="copy" size={14} /> انسخ
            </Button>
          </details>
        )}
      </Card>
    </GateFrame>
  );
}

/* ── القشرة ───────────────────────────────────────────────────────── */

function useNavCounts(): Partial<Record<NonNullable<NavItem["count"]>, number>> {
  const [counts, setCounts] = useState<Partial<Record<"tickets" | "tasks", number>>>({});
  const { pathname } = useLocation();

  // يُعاد عند كل تنقّل: ردٌّ على تذكرة أو «تمّ» على مهمّة يُنقص الشارة فوراً.
  useEffect(() => {
    let alive = true;
    Promise.allSettled([getOverview(), getSiteSettings()]).then(([o, s]) => {
      if (!alive) return;
      setCounts({
        tickets: o.status === "fulfilled" ? o.value.tickets_unread : undefined,
        tasks:
          s.status === "fulfilled"
            ? remainingCount(parseTodoState(s.value.find((x) => x.key === TODO_SETTING_KEY)?.value))
            : undefined,
      });
    });
    return () => {
      alive = false;
    };
  }, [pathname]);

  return counts;
}

function Shell() {
  const { user, logout } = useAuth();
  const counts = useNavCounts();

  return (
    <div className="min-h-dvh lg:flex">
      {/* الشريط الجانبي — حاسوب */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-e border-line bg-panel lg:flex">
        <div className="px-5 py-5">
          <Link to="/">
            <Logo />
          </Link>
          <p className="mt-2 text-[11px] font-bold text-faint">لوحتي · صاحب المنصة</p>
        </div>
        <nav aria-label="أقسام لوحتي" className="flex flex-col gap-1 px-3">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold transition-colors",
                  isActive ? "bg-gold/12 text-gold" : "text-dim hover:bg-ink/5 hover:text-ink"
                )
              }
            >
              <Icon name={n.icon} size={18} />
              <span className="flex-1">{n.label}</span>
              {n.count && !!counts[n.count] && (
                <span className="rounded-full bg-bad px-2 py-0.5 text-[11px] font-black text-white">
                  {counts[n.count]}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-1 border-t border-line px-3 py-4">
          <Link
            to="/dashboard"
            className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-bold text-dim hover:bg-ink/5 hover:text-ink"
          >
            <Icon name="plate" size={17} /> لوحة مطعمي
          </Link>
          <div className="flex items-center justify-between gap-2 px-3 pt-2">
            <bdi dir="ltr" className="truncate text-[11px] text-faint">
              {user?.email}
            </bdi>
            <ThemeToggle />
          </div>
          <button
            onClick={() => logout()}
            className="mt-1 rounded-xl px-3 py-2 text-start text-xs font-bold text-faint hover:text-bad"
          >
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* الترويسة — جوال */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-page/90 px-4 backdrop-blur-lg lg:hidden">
        {/* ⚠️ لا `<Logo>` ثانٍ هنا: تدرّجه بمعرّفٍ ثابت (`#lg`)، ونسخة الشريط
            الجانبي المخفيّة تسبقه في الصفحة فيُرسم شفّافاً على الجوال. */}
        <Link to="/founder" className="flex items-center gap-2 font-display text-base font-black text-ink">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/12 text-gold">
            <Icon name="shield" size={17} />
          </span>
          لوحتي
        </Link>
        <div className="flex items-center gap-1">
          <Link to="/dashboard" className="rounded-xl px-2.5 py-1.5 text-xs font-bold text-dim hover:text-ink">
            لوحة مطعمي
          </Link>
          <ThemeToggle />
          <button
            onClick={() => logout()}
            aria-label="تسجيل الخروج"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-dim hover:text-bad"
          >
            <Icon name="lock" size={17} />
          </button>
        </div>
      </header>

      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
        <div className="mx-auto max-w-5xl">
          <Routes>
            <Route index element={<Today />} />
            <Route path="merchants" element={<Merchants />} />
            <Route path="merchants/:id" element={<MerchantDetail />} />
            <Route path="money" element={<Money />} />
            <Route path="support" element={<Support />} />
            <Route path="site" element={<Health />} />
            <Route path="tasks" element={<Tasks />} />
            {/* الروابط القديمة تبقى تعمل */}
            <Route path="comms" element={<Navigate to="/founder/support?tab=comms" replace />} />
            <Route path="health" element={<Navigate to="/founder/site" replace />} />
            <Route path="*" element={<Navigate to="/founder" replace />} />
          </Routes>
        </div>
      </main>

      {/* الشريط السفلي — جوال */}
      <nav
        aria-label="أقسام لوحتي"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-line bg-panel/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
      >
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              cn(
                "relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-bold",
                isActive ? "text-gold" : "text-dim"
              )
            }
          >
            <Icon name={n.icon} size={20} />
            {n.label}
            {n.count && !!counts[n.count] && (
              <span className="absolute end-[22%] top-1.5 min-w-4 rounded-full bg-bad px-1 text-center text-[10px] font-black leading-4 text-white">
                {counts[n.count]}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

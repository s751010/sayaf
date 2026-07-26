/**
 * لوحة المؤسس — قفل بالسرّ ثم تبويبات إدارة المنصة.
 *
 * كل النداءات تمر عبر دالة الحافة `founder-admin` المحمية بسرّ `cm_fsecret`
 * (يُدخله المؤسس ويُخزَّن في sessionStorage فقط — لا يُضمَّن في الحزمة أبداً).
 * الجداول والعمليات المسموحة محدَّدة بقائمة بيضاء داخل الدالة نفسها، فحتى لو
 * سُرّب السرّ لا يمكن الوصول لغير ما فُتح عمداً.
 */
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/site";
import { Badge, Button, Card, ErrorNote, Field, Input, ThemeToggle } from "@/components/ui";
import { founderAdmin } from "@/lib/api";
import { K, getItem, removeItem, setItem } from "@/lib/storage";
import { cn } from "@/lib/utils";

import FounderOverview from "./Overview";
import FounderRestaurants from "./Restaurants";
import FounderTickets from "./Tickets";
import FounderPromos from "./Promos";
import FounderAnnouncements from "./Announcements";
import FounderBlog from "./Blog";

const TABS = [
  { id: "overview", label: "نظرة عامة", icon: "📊" },
  { id: "restaurants", label: "المطاعم", icon: "🍽️" },
  { id: "tickets", label: "الدعم", icon: "🎫" },
  { id: "promos", label: "أكواد الخصم", icon: "🏷️" },
  { id: "announcements", label: "الإعلانات", icon: "📢" },
  { id: "blog", label: "المدونة", icon: "✍️" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Founder() {
  const [secret, setSecret] = useState(() => getItem(K.FSECRET, true) ?? "");
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<TabId>("overview");

  useEffect(() => {
    document.title = "لوحة المؤسس — كلاود منيو";
  }, []);

  /** نداء خفيف للتحقق من صلاحية السرّ قبل عرض اللوحة. */
  const verify = useCallback(async () => {
    await founderAdmin<unknown[]>("revenue_log?select=amount&limit=1");
  }, []);

  // سرّ محفوظ من جلسة سابقة: افتح اللوحة مباشرة إن كان ما زال صالحاً.
  useEffect(() => {
    if (!getItem(K.FSECRET, true)) {
      setChecking(false);
      return;
    }
    verify()
      .then(() => setUnlocked(true))
      .catch(() => removeItem(K.FSECRET, true))
      .finally(() => setChecking(false));
  }, [verify]);

  async function unlock(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    setItem(K.FSECRET, secret.trim(), true);
    try {
      await verify();
      setUnlocked(true);
    } catch {
      removeItem(K.FSECRET, true);
      setError("السر غير صحيح أو الخدمة غير متاحة.");
    } finally {
      setBusy(false);
    }
  }

  function lock() {
    removeItem(K.FSECRET, true);
    setSecret("");
    setUnlocked(false);
  }

  if (!unlocked) {
    return (
      <div className="glow-bg flex min-h-dvh flex-col">
        <header className="flex items-center justify-between px-5 py-4">
          <Link to="/"><Logo /></Link>
          <ThemeToggle />
        </header>
        <main className="flex flex-1 items-center justify-center px-5 pb-16">
          <Card className="anim-fade-up w-full max-w-sm p-7 text-center">
            <span className="text-4xl">🛡️</span>
            <h1 className="mt-3 font-display text-xl font-black text-ink">لوحة المؤسس</h1>
            <p className="mt-1 text-sm text-dim">
              {checking ? "جارٍ التحقق…" : "أدخل سر المؤسس للمتابعة."}
            </p>
            {!checking && (
              <form onSubmit={unlock} className="mt-5 flex flex-col gap-3 text-right">
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
                {error && <ErrorNote>{error}</ErrorNote>}
                <Button type="submit" disabled={busy} className="w-full">
                  {busy ? "جارٍ التحقق…" : "دخول"}
                </Button>
              </form>
            )}
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-page/85 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link to="/"><Logo /></Link>
          <div className="flex items-center gap-2">
            <Badge>🛡️ المؤسس</Badge>
            <ThemeToggle />
            <button
              onClick={lock}
              className="rounded-xl border border-line px-3 py-1.5 text-xs font-bold text-bad hover:bg-bad/10"
            >
              قفل
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold transition-colors",
                tab === t.id ? "bg-gold/12 text-gold" : "text-dim hover:bg-ink/5 hover:text-ink"
              )}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        {tab === "overview" && <FounderOverview />}
        {tab === "restaurants" && <FounderRestaurants />}
        {tab === "tickets" && <FounderTickets />}
        {tab === "promos" && <FounderPromos />}
        {tab === "announcements" && <FounderAnnouncements />}
        {tab === "blog" && <FounderBlog />}
      </main>
    </div>
  );
}

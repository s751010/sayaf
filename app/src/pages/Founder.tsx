/**
 * لوحة المؤسس — كل النداءات عبر edge function `founder-admin` المحمية
 * بسر `cm_fsecret` (يُدخله المؤسس ويُخزَّن في sessionStorage فقط — لا يُضمَّن أبداً).
 */
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/site";
import { Badge, Button, Card, ErrorNote, Field, Input, Skeleton, ThemeToggle, useToast } from "@/components/ui";
import { founderAdmin } from "@/lib/api";
import { K, getItem, removeItem, setItem } from "@/lib/storage";
import { formatDate, formatPrice } from "@/lib/utils";

type Ticket = {
  id: string;
  subject: string | null;
  message: string | null;
  email: string | null;
  status: string | null;
  created_at: string;
};

type RestaurantRow = { id: string; name: string; slug: string | null; created_at: string };

type Stats = {
  revenue: number;
  activeSubs: number;
  restaurants: number;
  openTickets: number;
};

export default function Founder() {
  const toast = useToast();
  const [secret, setSecret] = useState(() => getItem(K.FSECRET, true) ?? "");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [restaurants, setRestaurants] = useState<RestaurantRow[] | null>(null);

  useEffect(() => {
    document.title = "لوحة المؤسس — كلاود منيو";
  }, []);

  const loadAll = useCallback(async () => {
    const [revenue, subs, rests, ticketRows] = await Promise.all([
      founderAdmin<{ amount: number | null }[]>("revenue_log?select=amount"),
      founderAdmin<{ id: string }[]>("subscriptions?active=eq.true&select=id"),
      founderAdmin<RestaurantRow[]>(
        "restaurants?select=id,name,slug,created_at&order=created_at.desc&limit=30"
      ),
      founderAdmin<Ticket[]>("support_tickets?select=*&order=created_at.desc&limit=30"),
    ]);
    setStats({
      revenue: revenue.reduce((s, r) => s + (r.amount ?? 0), 0),
      activeSubs: subs.length,
      restaurants: rests.length,
      openTickets: ticketRows.filter((t) => t.status === "open").length,
    });
    setRestaurants(rests);
    setTickets(ticketRows);
  }, []);

  async function unlock(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    setItem(K.FSECRET, secret.trim(), true);
    try {
      await loadAll();
      setUnlocked(true);
    } catch {
      removeItem(K.FSECRET, true);
      setError("السر غير صحيح أو الخدمة غير متاحة.");
    } finally {
      setBusy(false);
    }
  }

  async function setTicketStatus(t: Ticket, status: string) {
    try {
      await founderAdmin(`support_tickets?id=eq.${t.id}`, {
        method: "PATCH",
        body: { status },
      });
      setTickets((rows) => rows?.map((x) => (x.id === t.id ? { ...x, status } : x)) ?? null);
      toast("تم تحديث التذكرة.");
    } catch {
      toast("تعذّر التحديث.", "err");
    }
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
            <p className="mt-1 text-sm text-dim">أدخل سر المؤسس للمتابعة.</p>
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
          </Card>
        </main>
      </div>
    );
  }

  const statCards = [
    { label: "إجمالي الإيراد", value: `${formatPrice(stats?.revenue ?? 0)} ر.س`, icon: "💰" },
    { label: "اشتراكات نشطة", value: stats?.activeSubs ?? 0, icon: "📦" },
    { label: "مطاعم (آخر ٣٠)", value: stats?.restaurants ?? 0, icon: "🍽️" },
    { label: "تذاكر مفتوحة", value: stats?.openTickets ?? 0, icon: "🎫" },
  ];

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-page/85 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link to="/"><Logo /></Link>
          <div className="flex items-center gap-2">
            <Badge>🛡️ المؤسس</Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        <h1 className="font-display text-2xl font-black text-ink">نظرة عامة على المنصة</h1>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s) => (
            <Card key={s.label} className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/12 text-xl">
                {s.icon}
              </span>
              <div>
                <p className="text-xs text-dim">{s.label}</p>
                <p className="font-display text-xl font-black text-ink">{s.value}</p>
              </div>
            </Card>
          ))}
        </div>

        <section className="mt-10">
          <h2 className="mb-4 font-display text-lg font-extrabold text-ink">🎫 تذاكر الدعم</h2>
          {tickets === null ? (
            <Skeleton className="h-40" />
          ) : tickets.length === 0 ? (
            <Card className="text-center text-sm text-dim">لا توجد تذاكر.</Card>
          ) : (
            <div className="flex flex-col gap-3">
              {tickets.map((t) => (
                <Card key={t.id} className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-ink">{t.subject ?? "بلا موضوع"}</p>
                    {t.message && <p className="mt-0.5 line-clamp-2 text-sm text-dim">{t.message}</p>}
                    <p className="mt-1 text-xs text-faint">
                      {t.email && <span dir="ltr">{t.email} · </span>}
                      {formatDate(t.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={t.status === "open" ? "red" : "green"}>
                      {t.status === "open" ? "مفتوحة" : "مغلقة"}
                    </Badge>
                    <Button
                      variant="outline"
                      className="px-3 py-1.5 text-xs"
                      onClick={() => setTicketStatus(t, t.status === "open" ? "closed" : "open")}
                    >
                      {t.status === "open" ? "إغلاق" : "إعادة فتح"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="mb-4 font-display text-lg font-extrabold text-ink">🍽️ أحدث المطاعم</h2>
          {restaurants === null ? (
            <Skeleton className="h-40" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {restaurants.map((r) => (
                <Card key={r.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-ink">{r.name}</p>
                    <p className="text-xs text-faint">{formatDate(r.created_at)}</p>
                  </div>
                  {r.slug && (
                    <a href={`/${r.slug}`} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-gold hover:underline">
                      عرض ↗
                    </a>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

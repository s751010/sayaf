/** هيكل لوحة التحكم: حارس الدخول + سياق المطعم/الصلاحيات + الشريط الجانبي. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { Logo } from "@/components/site";
import {
  Badge,
  Button,
  Card,
  ErrorNote,
  Field,
  Input,
  Select,
  Spinner,
  ThemeToggle,
} from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { DEFAULT_ENTITLEMENTS, fetchEntitlements, type Entitlements } from "@/lib/entitlements";
import {
  createMenu,
  createRestaurant,
  getMyMenus,
  getMyRestaurant,
} from "@/lib/data";
import { cn, slugify } from "@/lib/utils";
import type { Menu, Restaurant } from "@/lib/types";
import type { SessionUser } from "@/lib/session";

import Overview from "./Overview";
import Menus from "./Menus";
import Dishes from "./Dishes";
import Qr from "./Qr";
import Analytics from "./Analytics";
import Loyalty from "./Loyalty";
import Settings from "./Settings";
import Billing from "./Billing";
import Ai from "./Ai";

/* ── السياق المشترك ───────────────────────────────────────────────── */
interface DashboardCtx {
  user: SessionUser;
  restaurant: Restaurant;
  setRestaurant: (r: Restaurant) => void;
  menus: Menu[];
  refreshMenus: () => Promise<void>;
  ent: Entitlements;
  refreshEnt: () => Promise<void>;
}

const Ctx = createContext<DashboardCtx | null>(null);

export function useDashboard(): DashboardCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDashboard خارج لوحة التحكم");
  return ctx;
}

/* ── إنشاء المطعم لأول مرة ────────────────────────────────────────── */
const RESTAURANT_TYPES = [
  "مطعم", "كافيه", "مخبز وحلويات", "مطعم سريع", "شعبي", "بحري", "مشويات", "عصائر", "أخرى",
];

function Onboarding({ user, onDone }: { user: SessionUser; onDone: (r: Restaurant) => void }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState(RESTAURANT_TYPES[0]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const cleanSlug = slugify(slug || name);
    if (!name.trim() || !cleanSlug) return setError("أدخل اسم المطعم والرابط.");
    setBusy(true);
    setError("");
    try {
      const r = await createRestaurant({
        name: name.trim(),
        slug: cleanSlug,
        type,
        user_id: user.id,
      });
      // قائمة أولى جاهزة حتى يبدأ بإضافة الأطباق فوراً.
      await createMenu({ name: "القائمة الرئيسية", restaurant_id: r.id, user_id: user.id }).catch(() => {});
      onDone(r);
    } catch {
      setError("تعذّر الإنشاء — قد يكون الرابط مستخدماً لمطعم آخر.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glow-bg flex min-h-dvh items-center justify-center px-5 py-10">
      <Card className="anim-fade-up w-full max-w-md p-7">
        <div className="mb-5 text-center">
          <span className="text-4xl">🎉</span>
          <h1 className="mt-2 font-display text-xl font-black text-ink">أهلاً بك في كلاود منيو</h1>
          <p className="mt-1 text-sm text-dim">خطوة واحدة: عرّفنا على مطعمك.</p>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="اسم المطعم">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: مطعم الديوان"
              required
            />
          </Field>
          <Field label="رابط المنيو" hint={`سيكون منيوك على: cloudsmenu.netlify.app/${slugify(slug || name) || "…"}`}>
            <Input
              dir="ltr"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="aldiwan"
            />
          </Field>
          <Field label="نوع النشاط">
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {RESTAURANT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </Field>
          {error && <ErrorNote>{error}</ErrorNote>}
          <Button type="submit" disabled={busy} className="mt-1 w-full py-3">
            {busy ? "جارٍ الإنشاء…" : "أنشئ مطعمي 🚀"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

/* ── الشريط الجانبي ───────────────────────────────────────────────── */
const NAV = [
  { to: "/dashboard", label: "نظرة عامة", icon: "🏠", end: true },
  { to: "/dashboard/dishes", label: "الأطباق", icon: "🍽️" },
  { to: "/dashboard/menus", label: "القوائم", icon: "📋" },
  { to: "/dashboard/qr", label: "أكواد QR", icon: "🔳" },
  { to: "/dashboard/analytics", label: "التحليلات", icon: "📊" },
  { to: "/dashboard/loyalty", label: "الولاء", icon: "💛" },
  { to: "/dashboard/ai", label: "المستشار الذكي", icon: "🤖" },
  { to: "/dashboard/billing", label: "الاشتراك", icon: "💳" },
  { to: "/dashboard/settings", label: "الإعدادات", icon: "⚙️" },
];

function Shell({ ctx, children }: { ctx: DashboardCtx; children: React.ReactNode }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const links = (compact: boolean) =>
    NAV.map((n) => (
      <NavLink
        key={n.to}
        to={n.to}
        end={n.end}
        className={({ isActive }) =>
          cn(
            compact
              ? "flex shrink-0 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-bold"
              : "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-colors",
            isActive ? "bg-gold/12 text-gold" : "text-dim hover:bg-ink/5 hover:text-ink"
          )
        }
      >
        <span className={compact ? "text-lg" : "text-base"}>{n.icon}</span>
        {n.label}
      </NavLink>
    ));

  return (
    <div className="flex min-h-dvh">
      {/* جانبي (شاشات واسعة) */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-l border-line bg-panel px-3 py-5 lg:flex">
        <Link to="/" className="mb-6 px-2"><Logo /></Link>
        <nav className="flex flex-1 flex-col gap-1">{links(false)}</nav>
        <div className="mt-4 border-t border-line pt-4">
          <div className="mb-3 flex items-center justify-between px-2">
            <Badge variant={ctx.ent.active ? "gold" : "neutral"}>
              {ctx.ent.active ? `باقة ${ctx.ent.planName}` : "بدون اشتراك"}
            </Badge>
            <ThemeToggle />
          </div>
          <p className="truncate px-2 text-xs text-faint" dir="ltr">{ctx.user.email}</p>
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="mt-2 w-full rounded-xl px-3.5 py-2 text-right text-sm font-bold text-bad hover:bg-bad/10"
          >
            ⏻ تسجيل خروج
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* علوي (جوال) */}
        <header className="sticky top-0 z-30 border-b border-line bg-page/85 backdrop-blur-lg lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Link to="/"><Logo /></Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => { logout(); navigate("/"); }}
                aria-label="تسجيل خروج"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-bad"
              >
                ⏻
              </button>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {links(true)}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-7 sm:px-6">{children}</main>
      </div>
    </div>
  );
}

/* ── نقطة الدخول ──────────────────────────────────────────────────── */
export default function Dashboard() {
  const { user, loading } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null | undefined>(undefined);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [ent, setEnt] = useState<Entitlements>(DEFAULT_ENTITLEMENTS);

  const refreshMenus = useCallback(async () => {
    if (restaurant) setMenus(await getMyMenus(restaurant.id));
  }, [restaurant]);

  const refreshEnt = useCallback(async () => {
    if (user) setEnt(await fetchEntitlements(user.id));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    getMyRestaurant(user.id)
      .then(setRestaurant)
      .catch(() => setRestaurant(null));
    refreshEnt();
  }, [user, refreshEnt]);

  useEffect(() => {
    refreshMenus().catch(() => {});
  }, [refreshMenus]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (restaurant === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (restaurant === null) {
    return (
      <Onboarding
        user={user}
        onDone={(r) => {
          setRestaurant(r);
        }}
      />
    );
  }

  const ctx: DashboardCtx = {
    user,
    restaurant,
    setRestaurant,
    menus,
    refreshMenus,
    ent,
    refreshEnt,
  };

  return (
    <Ctx.Provider value={ctx}>
      <Shell ctx={ctx}>
        <Routes>
          <Route index element={<Overview />} />
          <Route path="menus" element={<Menus />} />
          <Route path="dishes" element={<Dishes />} />
          <Route path="qr" element={<Qr />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="loyalty" element={<Loyalty />} />
          <Route path="ai" element={<Ai />} />
          <Route path="billing" element={<Billing />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Shell>
    </Ctx.Provider>
  );
}

/* بوابة ترقية مشتركة للميزات المدفوعة */
export function UpgradeGate({ title, desc }: { title: string; desc: string }) {
  return (
    <Card className="mt-6 flex flex-col items-center gap-3 border-gold/30 bg-gold/[.04] py-10 text-center">
      <span className="text-4xl">👑</span>
      <p className="font-display font-extrabold text-ink">{title}</p>
      <p className="max-w-md text-sm text-dim">{desc}</p>
      <Link
        to="/dashboard/billing"
        className="mt-2 rounded-xl bg-gold px-6 py-2.5 text-sm font-bold text-on-gold hover:bg-gold2"
      >
        رقِّ باقتك الآن
      </Link>
    </Card>
  );
}

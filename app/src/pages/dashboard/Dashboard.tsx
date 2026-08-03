/** هيكل لوحة التحكم: حارس الدخول + سياق المطعم/الصلاحيات + الشريط الجانبي. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Logo, PreviewMenuButton } from "@/components/site";
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
import {
  DEFAULT_ENTITLEMENTS,
  fetchEntitlements,
  planLabel,
  type Entitlements,
} from "@/lib/entitlements";
import {
  createMenu,
  createRestaurant,
  getMyMenus,
  getMyRestaurant,
  isFounder,
  startTrial,
} from "@/lib/data";
import { getRestaurantById, logAudit } from "@/lib/founder";
import { STARTER_TYPES } from "@/lib/starterMenus";
import { cn, slugify } from "@/lib/utils";
import type { Menu, Restaurant } from "@/lib/types";
import type { SessionUser } from "@/lib/session";

import Overview from "./Overview";
import Menus from "./Menus";
import Dishes from "./Dishes";
import Design from "./Design";
import Qr from "./Qr";
import Cards from "./Cards";
import Analytics from "./Analytics";
import Loyalty from "./Loyalty";
import Settings from "./Settings";
import Billing from "./Billing";

/* ── السياق المشترك ───────────────────────────────────────────────── */
interface DashboardCtx {
  user: SessionUser;
  restaurant: Restaurant;
  setRestaurant: (r: Restaurant) => void;
  /** `null` = ما زالت تُحمَّل · `[]` = لا توجد قوائم فعلاً. */
  menus: Menu[] | null;
  refreshMenus: () => Promise<void>;
  ent: Entitlements;
  refreshEnt: () => Promise<void>;
  /**
   * وضع «الدخول كتاجر»: المؤسس يشاهد لوحة تاجر آخر — **قراءة فقط**.
   *
   * السبب تقني لا تحفّظي: كل كتابة من اللوحة تحمل `user.id` من هذا السياق،
   * فالكتابة هنا كانت ستُنشئ صفوفاً باسم المؤسس داخل مطعم التاجر — تلويث
   * بيانات لا دعم. الصفحات تعطّل أزرارها المُعدِّلة بهذه الراية.
   */
  readOnly: boolean;
}

const Ctx = createContext<DashboardCtx | null>(null);

export function useDashboard(): DashboardCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDashboard خارج لوحة التحكم");
  return ctx;
}

/* ── إنشاء المطعم لأول مرة ────────────────────────────────────────── */
/**
 * مصدر واحد مع قوالب البداية: القائمة كانت مكتوبة هنا وفي `STARTERS` معاً،
 * فأي قالب يُضاف هناك ولا يُضاف هنا لا يصل إليه أحد. و«أخرى» تسقط إلى «مطعم»
 * عبر `aliasType`.
 */
const RESTAURANT_TYPES = [...STARTER_TYPES, "أخرى"];

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
      // قائمة أولى وتجربة مجانية — لا يُوقف فشلهما التسجيل، لكنه **يُسجَّل**.
      // ابتلاعُ فشل `startTrial` صامتاً هو ما أخفى عطلاً عن ١٩ تاجراً حتى
      // اكتُشف بالمصادفة؛ و`ensureMenu` في صفحة الأطباق تعوّض القائمة لاحقاً.
      await createMenu({ name: "القائمة الرئيسية", restaurant_id: r.id, user_id: user.id }).catch(
        (err) => console.error("تعذّر إنشاء القائمة الأولى:", err)
      );
      await startTrial(user.id).catch((err) =>
        console.error("تعذّر بدء التجربة المجانية:", err)
      );
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
/**
 * ستّة عناصر — كانت ثمانية (تسعة للمؤسس).
 *
 * ⚠️ الثمانية لم تكن تتّسع لشاشة جوال: قياس فعلي على ٣٩٠px أعطى **٦٢٧ بكسل**
 * من المحتوى، فكان «الاشتراك» و«الإعدادات» خارج الشاشة بلا دليل عليهما. وقد
 * عُولج ذلك بتدرّج على الحافة يقول «خلفي المزيد» — وهي ضمادة تصف العطل ولا
 * تصلحه. الدمج هنا يُنهيه:
 *
 * - **القوائم** ⇐ تبويب داخل «منيوي»: أغلب التجّار عندهم قائمة واحدة، فعنصرٌ
 *   كامل لها يكلّف الجميع مقابل من يملك أكثر من واحدة.
 * - **الولاء** ⇐ تبويب داخل «التحليلات»: كلاهما «كيف يتصرّف زبوني».
 * - **الاشتراك** ⇐ شارة الباقة في القاع صارت رابطاً — وهي **ظاهرة دائماً**
 *   بلا تمرير، فصار أوضح مما كان.
 * - **التصميم** ⇐ عنصر جديد أخرج مُنتقي الطوابع من دفنه أسفل «القوائم».
 *
 * وكل المسارات القديمة تبقى تعمل (انظر `Routes` أدناه) — التجّار يحفظون روابط.
 */
const NAV = [
  { to: "/dashboard", label: "الرئيسية", icon: "🏠", end: true },
  { to: "/dashboard/dishes", label: "منيوي", icon: "🍽️" },
  { to: "/dashboard/design", label: "التصميم", icon: "🎨" },
  // بطاقة الكاشير وأكواد QR فعلٌ واحد عند التاجر («أجهّز ما يُطبع»).
  { to: "/dashboard/cards", label: "الطباعة", icon: "🖨️" },
  { to: "/dashboard/analytics", label: "التحليلات", icon: "📊" },
  { to: "/dashboard/settings", label: "الإعدادات", icon: "⚙️" },
];

/** عنصر لا يراه إلا صاحب المنصة — يُلحق بـ`NAV` عند التحقّق فقط. */
const FOUNDER_NAV = { to: "/founder", label: "لوحة المؤسس", icon: "🛡️", end: false };

function Shell({ ctx, children }: { ctx: DashboardCtx; children: React.ReactNode }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  /**
   * `null` = لم يُحسم بعد (قاعدة «لا تكسر حالات التحميل»): لا نومض بعنصر
   * «لوحة المؤسس» ثم نخفيه، ولا نُظهره لتاجر بالخطأ. القرار من القاعدة.
   */
  const [founder, setFounder] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    isFounder().then((v) => alive && setFounder(v));
    return () => {
      alive = false;
    };
  }, []);
  const nav = founder === true ? [...NAV, FOUNDER_NAV] : NAV;

  const links = (compact: boolean) =>
    nav.map((n) => (
      <NavLink
        key={n.to}
        to={n.to}
        end={n.end}
        className={({ isActive }) =>
          cn(
            // الحشوة والحجم على الجوال مقيسان لا مذوقان: ستة عناصر يجب أن تسع
            // ٣٩٠px (أضيق جهاز شائع). `px-3` و`text-[10px]` كانا يعطيان ٤٢٨px
            // — أي تمريراً أفقياً لعنصر أو عنصرين، وهو ما كانت تداريه ضمادة
            // التدرّج على الحافة.
            compact
              ? "flex shrink-0 flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[9px] font-bold"
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
    <>
      {/* شريط الانتحال — في تدفّق الصفحة لا `fixed`: الترويسة على الجوال
          `sticky top-0`، فشريط ثابت كان سيغطّيها. */}
      {ctx.readOnly && (
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-gold px-4 py-1.5 text-center text-xs font-black text-on-gold">
          <span>👁️ تشاهد لوحة «{ctx.restaurant.name}» كمؤسس — العرض فقط</span>
          <Link to={`/founder/merchants/${ctx.restaurant.id}`} className="underline">
            خروج ←
          </Link>
        </div>
      )}
      <div className="flex min-h-dvh">
      {/* جانبي (شاشات واسعة) */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-l border-line bg-panel px-3 py-5 lg:flex">
        <Link to="/" className="mb-6 px-2"><Logo /></Link>
        <nav className="flex flex-1 flex-col gap-1">{links(false)}</nav>
        <PreviewMenuButton slug={ctx.restaurant.slug} className="mt-3 justify-center" />
        <div className="mt-4 border-t border-line pt-4">
          {/* الشارة هي مدخل الاشتراك الآن بدل عنصر قائمة: حالة الباقة ظاهرة
              دائماً بلا تمرير، ومن يقرأ «تبقّى ٣ أيام» هو من يريد الضغط. */}
          <div className="mb-3 flex items-center justify-between px-2">
            <Link to="/dashboard/billing" title="الاشتراك والفوترة">
              <Badge
                variant={
                  !ctx.ent.active ? "neutral" : ctx.ent.trialDaysLeft === 1 ? "red" : "gold"
                }
              >
                {planLabel(ctx.ent)} ⚙
              </Badge>
            </Link>
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
              {/* ⚠️ لازمة لا تجميل: الشريط الجانبي مخفيّ على الجوال، وقد خرج
                  «الاشتراك» من القائمة — فبدون هذه الشارة لا يبقى للجوال أي
                  مدخل إلى الفوترة إطلاقاً. */}
              <Link to="/dashboard/billing" title="الاشتراك والفوترة">
                <Badge
                  variant={
                    !ctx.ent.active ? "neutral" : ctx.ent.trialDaysLeft === 1 ? "red" : "gold"
                  }
                >
                  {planLabel(ctx.ent)}
                </Badge>
              </Link>
              <PreviewMenuButton
                slug={ctx.restaurant.slug}
                label="معاينة"
                className="px-2.5 py-1.5 text-xs"
              />
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
          {/* التبويبات ثمانية ولا تتّسع لها شاشة جوال: «الاشتراك» و«الإعدادات»
              خارجها بلا أي إشارة تدلّ عليهما. التدرّج على الحافة يقول «خلفي
              المزيد» — بلا حذف تبويب ولا إعادة ترتيب. */}
          <div className="relative">
            <nav className="flex gap-1 overflow-x-auto px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {links(true)}
            </nav>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 start-0 w-8 bg-gradient-to-l from-transparent to-page"
            />
          </div>
        </header>

        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-7 sm:px-6">
          {/* إعلانات المؤسس — تصل التاجر هنا بلا بريد ولا واتساب.
              `ent.loading` تُستثنى: لا نصنّف الجمهور قبل أن تُحسم حالة الاشتراك.
              وفي وضع الانتحال لا تُعرض: إعلاناتك موجّهة للتجّار لا لك. */}
          {!ctx.readOnly && !ctx.ent.loading && <AnnouncementBar subscribed={ctx.ent.active} />}
          {/* حارس القراءة-فقط: `fieldset[disabled]` تُعطّل **كل** زر وحقل متفرّع
              عنها بآلية HTML أصلية. اخترتُها بدل نثر `disabled` في ست صفحات لأن
              تلك تُنسى في صفحة جديدة، وهذه لا تُنسى — والروابط تبقى تعمل فيظل
              التنقّل ممكناً. */}
          <fieldset disabled={ctx.readOnly} className="m-0 min-w-0 border-0 p-0">
            {children}
          </fieldset>
        </main>
      </div>
      </div>
    </>
  );
}

/* ── نقطة الدخول ──────────────────────────────────────────────────── */
export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null | undefined>(undefined);
  const [menus, setMenus] = useState<Menu[] | null>(null);
  const [ent, setEnt] = useState<Entitlements>(DEFAULT_ENTITLEMENTS);
  /**
   * `?as=<restaurantId>` — الدخول كتاجر.
   *
   * الحارس ليس وجود الوسيط بل `is_founder()` في القاعدة: أي تاجر يكتب الوسيط
   * يدوياً يُتجاهَل ويرى لوحته هو. و`null` تعني «لم يُحسم بعد» فلا نجلب لوحة
   * خاطئة في الأثناء.
   */
  const asId = params.get("as");
  const [viewAs, setViewAs] = useState<boolean | null>(asId ? null : false);

  useEffect(() => {
    if (!asId) return setViewAs(false);
    let alive = true;
    isFounder().then((ok) => alive && setViewAs(ok));
    return () => {
      alive = false;
    };
  }, [asId]);

  const refreshMenus = useCallback(async () => {
    if (restaurant) setMenus(await getMyMenus(restaurant.id));
  }, [restaurant]);

  /** صلاحيات **مالك المطعم** في وضع الانتحال، لا صلاحيات المؤسس. */
  const entOwner = viewAs && restaurant?.user_id ? restaurant.user_id : user?.id;
  const refreshEnt = useCallback(async () => {
    if (entOwner) setEnt(await fetchEntitlements(entOwner));
  }, [entOwner]);

  useEffect(() => {
    if (!user || viewAs === null) return;
    if (viewAs && asId) {
      getRestaurantById(asId)
        .then((r) => {
          setRestaurant(r);
          void logAudit("فتح لوحة تاجر", {
            table: "restaurants",
            id: r.id,
            name: r.name,
          });
        })
        .catch(() => setRestaurant(null));
      return;
    }
    getMyRestaurant(user.id)
      .then(setRestaurant)
      .catch(() => setRestaurant(null));
  }, [user, viewAs, asId]);

  useEffect(() => {
    void refreshEnt();
  }, [refreshEnt]);

  useEffect(() => {
    // فشل الجلب يحسم الحالة إلى «فارغة» بدل تركها معلّقة على هيكل تحميل أبدي.
    refreshMenus().catch(() => setMenus([]));
  }, [refreshMenus]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (restaurant === undefined || viewAs === null) {
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
          /**
           * **دائماً** إلى الأطباق — الشاشة الفارغة بعد التسجيل هي أكثر نقطة
           * يؤجّل عندها التاجر «لبكرة» ولا يعود (١٣ من ١٩ توقّفوا عندها).
           *
           * ⚠️ كان الشرط `hasStarter(r.type)`، و`type` عمود نصّ حرّ حمل في
           * الإنتاج `general` لأربعة عشر مطعماً — فلم يتحقّق الشرط ولم يحدث
           * تحويل أصلاً. ولا فتحَ نافذةٍ تلقائياً بعد الآن: صفحة الأطباق
           * الفارغة تعرض المسارات الثلاثة متساوية، فمن عنده منيو جاهز لا
           * يبدأ بإغلاق نافذة لا يريدها.
           */
          navigate("/dashboard/dishes", { replace: true });
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
    readOnly: viewAs,
  };

  return (
    <Ctx.Provider value={ctx}>
      <Shell ctx={ctx}>
        {/* المسارات كلها تبقى كما هي وإن خرج بعضها من القائمة: التجّار يحفظون
            روابط، والتوصيات والإعلانات ترسل إلى `/dashboard/menus` و`/loyalty`
            و`/billing`. الدمج في القائمة لا يعني كسر عنوان. */}
        <Routes>
          <Route index element={<Overview />} />
          <Route path="menus" element={<Menus />} />
          <Route path="dishes" element={<Dishes />} />
          <Route path="design" element={<Design />} />
          <Route path="cards" element={<Cards />} />
          <Route path="qr" element={<Qr />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="loyalty" element={<Loyalty />} />
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

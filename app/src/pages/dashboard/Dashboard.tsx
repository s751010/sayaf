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
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { OrderAlertsProvider, useOrderAlerts } from "@/components/OrderAlerts";
import { TrialBar } from "@/components/TrialBar";
import { Logo, PreviewMenuButton } from "@/components/site";
import {
  Badge,
  Button,
  Card,
  ErrorNote,
  Field,
  Input,
  ScrollRow,
  Select,
  Spinner,
  ThemeToggle,
} from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { track } from "@/lib/track";
import {
  DEFAULT_ENTITLEMENTS,
  NO_PLAN_NAME,
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
  isSlugTaken,
  startTrial,
} from "@/lib/data";
import { menuUrl, slugError, urlAffixes } from "@/lib/menuUrl";
import { getRestaurantById, logAudit } from "@/lib/founder";
import { STARTER_TYPES } from "@/lib/starterMenus";
import { buildDashboardNav } from "@/lib/nav";
import { badgeText } from "@/lib/orderAlerts";
import { cn } from "@/lib/utils";
import type { Menu, Restaurant } from "@/lib/types";
import type { SessionUser } from "@/lib/session";

import Overview from "./Overview";
import Menus from "./Menus";
import Dishes from "./Dishes";
import Orders from "./Orders";
import Kitchen from "./Kitchen";
import Design from "./Design";
import Qr from "./Qr";
import Cards from "./Cards";
import Analytics from "./Analytics";
import Loyalty from "./Loyalty";
import Settings from "./Settings";
import Billing from "./Billing";
import Nutrition from "./Nutrition";
import PrintMenu from "./PrintMenu";
import ComplianceFile from "./ComplianceFile";
import { Icon } from "@/lib/icons";

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
  /** `null` = لم يُفحص بعد · `true` = محجوز · `false` = متاح. */
  const [taken, setTaken] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const clean = slug.trim().toLowerCase();
  const slugMsg = clean ? slugError(clean) : null;
  const affix = urlAffixes();

  /**
   * فحص التوفّر **أثناء الكتابة**.
   *
   * كان التاجر لا يعرف إلا بعد الضغط، ورسالة الفشل تخمين: «**قد** يكون
   * الرابط مستخدماً» — لأنها تُستنتج من فشل الإدراج لا من فحص. ونصف ثانية
   * تأخير تكفي كي لا نسأل القاعدة عن كل حرف.
   */
  useEffect(() => {
    if (!clean || slugMsg) {
      setTaken(null);
      return;
    }
    setChecking(true);
    const t = setTimeout(() => {
      isSlugTaken(clean)
        .then(setTaken)
        // فشل الشبكة لا يمنع المتابعة: `UNIQUE` في القاعدة هو الحارس الفعلي،
        // وهذا إرشاد. إظهار خطأ هنا يوقف تسجيلاً صالحاً بلا سبب.
        .catch(() => setTaken(null))
        .finally(() => setChecking(false));
    }, 400);
    return () => {
      clearTimeout(t);
      setChecking(false);
    };
  }, [clean, slugMsg]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    /**
     * ⚠️ **لا توليد إطلاقاً.** كان هنا `slugify(slug || name)`: من ترك الحقل
     * فارغاً يُشتقّ له رابط من اسم مطعمه — فيخرج عربياً (`مشراق`) يظهر في
     * شريط العنوان `%D9%85%D8%B4…`، لا يستطيع التاجر إملاءه على الهاتف ولا
     * كتابته على لوحة. والرابط عنوان مطعمه لا حقلٌ نملؤه عنه.
     */
    const clean = slug.trim().toLowerCase();
    const bad = slugError(clean);
    if (!name.trim()) return setError("أدخل اسم المطعم.");
    if (bad) return setError(bad);
    if (taken === true) return setError("هذا الرابط محجوز — اختر غيره.");
    setBusy(true);
    setError("");
    try {
      const r = await createRestaurant({
        name: name.trim(),
        slug: clean,
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
      track("restaurant_created");
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
          {/**
           * ⚠️ **الحقل والنطاق وحدة واحدة لا حقل ولاحقة.**
           *
           * التاجر يقرأ عنوان مطعمه كاملاً وهو يكتبه، فيعرف ما سيُطبع على
           * طاولاته. والنطاق يأتي من `MENU_DOMAIN` لا مكتوباً هنا — فيوم
           * يُربَط `cloudmenu.sa` يتغيّر هذا المعروض وكل موضع آخر معاً.
           */}
          <Field label="رابط منيوك" hint="اختره قصيراً وسهل النطق — هذا ما سيُطبع على طاولاتك.">
            <div
              dir="ltr"
              className={cn(
                "flex items-stretch overflow-hidden rounded-xl border bg-panel2 transition-colors",
                slugMsg || taken === true ? "border-bad" : taken === false ? "border-good" : "border-line"
              )}
            >
              {affix.before && (
                <span className="grid select-none place-items-center border-e border-line bg-panel px-3 text-sm font-bold text-dim">
                  {affix.before}
                </span>
              )}
              <input
                dir="ltr"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                // `inputMode` و`autoCapitalize` معاً: لوحة الجوال العربية تفتح
                // بالعربية وتُكبّر أول حرف — وكلاهما ينتج رابطاً مرفوضاً.
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="aldiwan"
                aria-label="رابط منيوك"
                aria-invalid={!!slugMsg || taken === true}
                className="min-w-0 flex-1 bg-transparent px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-faint"
              />
              {affix.after && (
                <span className="grid select-none place-items-center border-s border-line bg-panel px-3 text-sm font-bold text-dim">
                  {affix.after}
                </span>
              )}
            </div>
            <p
              className={cn(
                "mt-1.5 text-xs leading-relaxed",
                slugMsg || taken === true ? "text-bad" : taken === false ? "text-good" : "text-faint"
              )}
            >
              {slugMsg
                ? slugMsg
                : checking
                  ? "نتحقّق…"
                  : taken === true
                    ? "هذا الرابط محجوز — اختر غيره."
                    : taken === false
                      ? `متاح ✓ — منيوك سيكون على ${menuUrl(clean)?.replace("https://", "")}`
                      : "حروف إنجليزية صغيرة وأرقام وشرطة."}
            </p>
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

/* ── تعذّر التحميل ────────────────────────────────────────────────── */
/**
 * ⚠️ **الفشل ليس «لا مطعم».**
 *
 * كان فشل جلب المطعم يُحسم إلى `null` — وهي القيمة نفسها التي تعني «لم يُنشئ
 * مطعماً بعد» — فعطل شبكة عابر يُظهر شاشة «أهلاً بك، عرّفنا على مطعمك» لتاجر
 * له مطعم وكوده مطبوع على طاولاته. فيملؤها ظانّاً أن حسابه ضاع، فيخرج له
 * مطعم ثانٍ برابط جديد لا يعرفه أي كود مطبوع (الدرس ٣٢).
 *
 * فهذه الشاشة **لا تعرض نموذج الإنشاء أبداً**: تقول ما حدث، وتعيد الجلب.
 */
function LoadFailed({ founderView, onRetry }: { founderView: boolean; onRetry: () => void }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="glow-bg flex min-h-dvh items-center justify-center px-5 py-10">
      <Card className="anim-fade-up w-full max-w-md p-7 text-center">
        <div role="alert">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-bad/10 text-bad">
            <Icon name="warn" size={22} />
          </span>
          <h1 className="mt-3 font-display text-xl font-black text-ink">
            {founderView ? "تعذّر فتح لوحة هذا التاجر" : "تعذّر تحميل لوحتك"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-dim">
            {founderView
              ? "لم نصل إلى بيانات المطعم — قد يكون الاتصال انقطع، أو المعرّف غير صحيح."
              : "لم نصل إلى بيانات مطعمك — غالباً انقطاعٌ في الاتصال. مطعمك ومنيوك بخير، ولم يتغيّر شيء."}
          </p>
        </div>
        <Button onClick={onRetry} className="mt-5 w-full py-3">
          أعد المحاولة
        </Button>
        {founderView ? (
          <Link to="/founder/merchants" className="mt-3 inline-block text-sm font-bold text-dim hover:text-ink">
            العودة إلى التجّار
          </Link>
        ) : (
          // مخرجٌ إن كانت العلّة جلسةً منتهية لا شبكة: الإعادة وحدها لا تُصلحها.
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-dim hover:text-ink"
          >
            سجّل الدخول من جديد
          </button>
        )}
      </Card>
    </div>
  );
}

/* ── الشريط الجانبي ───────────────────────────────────────────────── */

/**
 * الشارة في العرض الضيّق — **الحالة لا الجملة**.
 *
 * «تجربة مجانية · ١٢ يوماً» وحدها ١٣١px، ومعها المعاينة وزرّان كانت الترويسة
 * تحتاج ٣٨٩px على شاشة ٣٢٠ فيُدفع زرّ الخروج خارجها. والرقم وحده يكفي من
 * يرى الشارة كل يوم؛ والجملة كاملةً في `aria-label` الرابط ومن عرض ٣٩٠ فما فوق.
 * والعدد بتمييزه العربي (يومان · ٣ أيام · ١١ يوماً) لأنه يُقرأ وحده بلا سياق.
 */
function planShortLabel(ent: Entitlements): string {
  if (ent.loading) return "…";
  if (!ent.active) return NO_PLAN_NAME;
  if (!ent.trial) return "مشترك";
  const n = ent.trialDaysLeft;
  if (n <= 1) return "تنتهي اليوم";
  if (n === 2) return "يومان";
  return n <= 10 ? `${n} أيام` : `${n} يوماً`;
}

function Shell({ ctx, children }: { ctx: DashboardCtx; children: React.ReactNode }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { unseen } = useOrderAlerts();
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
  // الطلبات تظهر لمن ربط بوّابة دفع فقط: مطعمٌ بلا بوّابة لا سلّة له أصلاً،
  // وشاشة طلبات فارغة أبداً وعدٌ لا يُوفى. والتركيب في `lib/nav.ts` ويحرسه فحص:
  // كان الاستبدال يُخفي التحليلات **والولاء معها** عند ربط بوّابة.
  const nav = buildDashboardNav({
    ordersOn: ctx.restaurant?.online_payment_enabled === true,
    founder,
    newOrders: unseen,
  });

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
              ? "press relative flex shrink-0 flex-col items-center gap-0.5 rounded-[10px] px-2 py-2 text-[9px] font-semibold"
              : "press relative flex items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-sm font-semibold",
            // النشط حبرٌ مقلوب — كصفّ «السعرات» في الملصق: أسود يحمل الأهمّ.
            isActive ? "bg-ink text-page" : "text-dim hover:bg-ink/5 hover:text-ink"
          )
        }
      >
        <Icon name={n.icon} size={compact ? 19 : 18} />
        {n.label}
        {/* شارة الطلبات الجديدة — مطلقة الموضع على الجوال كي لا تمدّ الشريط
            (مقيسٌ على ٣٢٠)، وفي آخر السطر على الشريط الجانبي. والعدد يُقرأ
            لقارئ الشاشة جملةً لا رقماً معلّقاً. ولون الرقم `text-page` لا
            الأبيض: أحمر الوضع الداكن فاتح (#f87171) والأبيض عليه ٢٫٨:١. */}
        {n.badge && (
          <span
            className={cn(
              "rounded-full bg-bad px-1.5 text-[10px] font-black leading-[18px] text-page tabular-nums",
              compact ? "absolute -top-0.5 end-0.5 min-w-[18px] text-center" : "ms-auto"
            )}
          >
            <span aria-hidden="true">{n.badge}</span>
            <span className="sr-only">{`، ${n.badge} طلب جديد`}</span>
          </span>
        )}
      </NavLink>
    ));

  return (
    <>
      {/* شريط الانتحال — في تدفّق الصفحة لا `fixed`: الترويسة على الجوال
          `sticky top-0`، فشريط ثابت كان سيغطّيها. */}
      {ctx.readOnly && (
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-gold px-4 py-1.5 text-center text-xs font-black text-on-gold">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="eye" size={15} />
            تشاهد لوحة «{ctx.restaurant.name}» كمؤسس — العرض فقط
          </span>
          <Link to={`/founder/merchants/${ctx.restaurant.id}`} className="underline">
            خروج ←
          </Link>
        </div>
      )}
      <div className="flex min-h-dvh">
      {/* جانبي (شاشات واسعة) */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-l border-line bg-panel px-3 py-5 lg:flex">
        <Link to="/" className="mb-4 px-2"><Logo /></Link>
        <div className="sadu-band mx-2 mb-5" aria-hidden="true" />
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
                {planLabel(ctx.ent)} <Icon name="chevron" size={13} />
              </Badge>
            </Link>
            <ThemeToggle />
          </div>
          <p className="truncate px-2 text-xs text-faint" dir="ltr">{ctx.user.email}</p>
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="mt-2 inline-flex min-h-11 w-full items-center rounded-xl px-3.5 py-2 text-right text-sm font-bold text-bad hover:bg-bad/10"
          >
            <Icon name="lock" size={15} /> تسجيل خروج
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* علوي (جوال) */}
        <header className="sticky top-0 z-30 border-b border-line bg-page/85 backdrop-blur-lg lg:hidden">
          <div className="flex h-14 items-center justify-between gap-2 px-4">
            {/* الشعار بلا اسم على الجوال: الاسم بخطّ العرض الجديد أعرض، فكان
                يُطوى سطرين ويطوي الشارة معه على ٣٩٠px. والسحابة وحدها تكفي رابطاً. */}
            <Link to="/" aria-label="كلاود منيو — الرئيسية" className="shrink-0"><Logo compact /></Link>
            {/* ⚠️ مقيسة لا مذوقة: على ٣٢٠px (أضيق جوال يُباع) الشعار ٣٦ وأطول
                شارة مختصرة («تنتهي اليوم» ٨١) و«معاينة» ٨٦ والخروج ٤٤ مع الفراغات
                = ٢٧١ من ٢٨٨ متاحة. وكان معها الوضع الليلي والشارة كاملةً (١٣١)
                فبلغ عرض الصفحة ٣٨٩ — تتمرّر أفقياً ويُدفع الخروج خارجها. فخرج
                مفتاح الوضع إلى سطر الحساب أسفل الصفحة، والشارة الكاملة تعود من
                ٣٩٠ (أطولها ٣٢١ من ٣٥٨). وأي زرّ يُضاف هنا يُقاس أولاً:
                `dashboard.spec.ts` يفحص `scrollWidth` على ٣٢٠ بأطول شارة. */}
            <div className="flex min-w-0 items-center gap-2">
              {/* ⚠️ لازمة لا تجميل: الشريط الجانبي مخفيّ على الجوال، وقد خرج
                  «الاشتراك» من القائمة — فبدون هذه الشارة لا يبقى للجوال أي
                  مدخل إلى الفوترة إطلاقاً. */}
              <Link
                to="/dashboard/billing"
                title="الاشتراك والفوترة"
                aria-label={`${planLabel(ctx.ent)} — الاشتراك والفوترة`}
              >
                <Badge
                  variant={
                    !ctx.ent.active ? "neutral" : ctx.ent.trialDaysLeft === 1 ? "red" : "gold"
                  }
                >
                  <span className="min-[390px]:hidden">{planShortLabel(ctx.ent)}</span>
                  <span className="hidden min-[390px]:inline">{planLabel(ctx.ent)}</span>
                </Badge>
              </Link>
              <PreviewMenuButton
                slug={ctx.restaurant.slug}
                label="معاينة"
                className="px-2.5 py-1.5 text-xs"
              />
              <button
                onClick={() => { logout(); navigate("/"); }}
                aria-label="تسجيل خروج"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-bad"
              >
                <Icon name="lock" size={16} />
              </button>
            </div>
          </div>
          {/* ستّة عناصر تسع ٣٩٠px بلا تمرير (مقيسة — انظر `links`)، وما زاد
              عليها («الطلبات» لمن ربط بوّابة · «لوحة المؤسّس» بعد التحقّق)
              يفيض فيمرّر. والتدرّج يقول «خلفي المزيد» **عند وجوده فعلاً**،
              وعلى حافة النهاية حيث يختبئ المحتوى. */}
          <ScrollRow className="gap-1 px-3 pb-2" itemCount={nav.length}>
            {links(true)}
          </ScrollRow>
          {/* ⚠️ الشارة وحدها لا تكفي الجوال: على ٣٢٠–٣٨٩ «الطلبات» خارج الشريط
              الظاهر (يمرَّر إليها)، فشارتها لا تُرى أصلاً. فشريطٌ بعرض الترويسة
              — لا زرٌّ في سطرها المقيس — يظهر ما دام هناك طلبٌ لم يُرَ، ويختفي
              وحده حين تُفتح الطلبات. */}
          {unseen > 0 && (
            <Link
              to="/dashboard/orders"
              className="flex min-h-11 items-center justify-center gap-2 bg-gold px-4 text-sm font-black text-on-gold"
            >
              <Icon name="bell" size={16} />
              {unseen === 1 ? "طلب جديد ينتظرك" : `طلبات جديدة تنتظرك (${badgeText(unseen)})`}
              <span aria-hidden="true">←</span>
            </Link>
          )}
        </header>

        <main className="dash-main mx-auto w-full max-w-4xl flex-1 px-4 py-7 sm:px-6">
          {/* إعلانات المؤسس — تصل التاجر هنا بلا بريد ولا واتساب.
              `ent.loading` تُستثنى: لا نصنّف الجمهور قبل أن تُحسم حالة الاشتراك.
              وفي وضع الانتحال لا تُعرض: إعلاناتك موجّهة للتجّار لا لك. */}
          {!ctx.readOnly && !ctx.ent.loading && <AnnouncementBar subscribed={ctx.ent.active} />}
          {/* انتهاء التجربة — بنفس حارسَي الإعلانات: لا في وضع الانتحال (تنبيهٌ
              يخصّ التاجر لا المؤسّس الذي يشاهد لوحته)، ولا قبل حسم الاشتراك. */}
          {!ctx.readOnly && <TrialBar ent={ctx.ent} />}
          {/* حارس القراءة-فقط: `fieldset[disabled]` تُعطّل **كل** زر وحقل متفرّع
              عنها بآلية HTML أصلية. اخترتُها بدل نثر `disabled` في ست صفحات لأن
              تلك تُنسى في صفحة جديدة، وهذه لا تُنسى — والروابط تبقى تعمل فيظل
              التنقّل ممكناً. */}
          <fieldset disabled={ctx.readOnly} className="m-0 min-w-0 border-0 p-0">
            {children}
          </fieldset>
          {/* سطر الحساب (جوال) — نظير أسفل الشريط الجانبي: البريد ومفتاح الوضع.
              خرج المفتاح إلى هنا من الترويسة ليتّسع سطرها لـ٣٢٠px، والبريد كان
              غائباً عن الجوال كلّياً فلا يعرف من على جهاز مشترك بأيّ حساب دخل.
              وخارج الـ`fieldset`: الوضع تفضيل جهاز لا كتابةٌ في مطعم التاجر. */}
          <div className="mt-10 flex items-center justify-between gap-3 border-t border-line pt-4 lg:hidden">
            <p className="min-w-0 truncate text-xs text-faint" dir="ltr">{ctx.user.email}</p>
            <ThemeToggle className="shrink-0" />
          </div>
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
  // ⚠️ فوق كل عودة مبكّرة — عطل React #310 أطفأ كل منيو من خطّاف تحتها.
  const location = useLocation();
  const [params] = useSearchParams();
  /** `undefined` = يُحمَّل · `null` = لا مطعم **فعلاً** (لا فشل) · وإلا المطعم. */
  const [restaurant, setRestaurant] = useState<Restaurant | null | undefined>(undefined);
  /**
   * فشل الجلب حالةٌ ثالثة مستقلّة — لا تُطوى في `null` (انظر `LoadFailed`).
   * و`attempt` يعيد تشغيل الجلب من زرّ «أعد المحاولة».
   */
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
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
    let alive = true;
    const loaded = (r: Restaurant | null) => {
      if (!alive) return;
      setLoadFailed(false);
      setRestaurant(r);
    };
    /**
     * ⚠️ الفشل **لا يلمس** `restaurant`: كان `setRestaurant(null)` فيظهر نموذج
     * الإنشاء لتاجر له مطعم. وفي وضع الانتحال كان أسوأ: نموذجٌ يُنشئ مطعماً
     * باسم المؤسّس. وإن كان المطعم محمَّلاً من قبل (إعادة جلب بعد تجدّد
     * الجلسة) يبقى معروضاً — فشل الخلفية لا يُطفئ لوحة تعمل.
     */
    const failed = () => {
      if (alive) setLoadFailed(true);
    };
    if (viewAs && asId) {
      getRestaurantById(asId)
        .then((r) => {
          loaded(r);
          void logAudit("فتح لوحة تاجر", {
            table: "restaurants",
            id: r.id,
            name: r.name,
          });
        })
        .catch(failed);
    } else {
      getMyRestaurant(user.id).then(loaded).catch(failed);
    }
    return () => {
      alive = false;
    };
  }, [user, viewAs, asId, attempt]);

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
  // قبل فرع «لا مطعم» وقبل الدوّار: فشلٌ بلا مطعمٍ محمَّل لا يُحسم إلى أيٍّ منهما.
  if (restaurant === undefined && loadFailed && viewAs !== null) {
    return (
      <LoadFailed
        founderView={viewAs}
        onRetry={() => {
          setLoadFailed(false);
          setAttempt((a) => a + 1);
        }}
      />
    );
  }
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

  /**
   * شاشة الكاشير **بلا غلاف**: لوح على الكاونتر يُقرأ من مترين، والشريط
   * الجانبي والترويسة وسطر الحساب تأكل ثلث عرضه ولا يحتاجها الكاشير. والمسار
   * يبقى داخل `/dashboard` فيرث الجلسة والمطعم والجرس معاً.
   */
  const kitchen = location.pathname.replace(/\/+$/, "") === "/dashboard/kitchen";

  return (
    <Ctx.Provider value={ctx}>
      {/* الجرس فوق الغلاف وشاشة الكاشير معاً: يرنّ أينما كان التاجر. */}
      <OrderAlertsProvider
        restaurantId={restaurant.id}
        pollEnabled={restaurant.online_payment_enabled === true}
        disabled={viewAs}
      >
      {kitchen ? (
        // حارس القراءة-فقط نفسه الذي في الغلاف (انظر `Shell`).
        <fieldset disabled={viewAs} className="m-0 min-w-0 border-0 p-0">
          <Kitchen />
        </fieldset>
      ) : (
      <Shell ctx={ctx}>
        {/* المسارات كلها تبقى كما هي وإن خرج بعضها من القائمة: التجّار يحفظون
            روابط، والتوصيات والإعلانات ترسل إلى `/dashboard/menus` و`/loyalty`
            و`/billing`. الدمج في القائمة لا يعني كسر عنوان. */}
        {/* المفتاح هو المسار: تبديل الشاشة يعيد تركيب الغلاف فتجري حركة
            الدخول (`.page-enter`) — ولمن طلب تقليل الحركة تظهر ثابتة. */}
        <div key={location.pathname} className="page-enter">
          <Routes>
            <Route index element={<Overview />} />
            <Route path="menus" element={<Menus />} />
            <Route path="dishes" element={<Dishes />} />
            <Route path="nutrition" element={<Nutrition />} />
            <Route path="nutrition/file" element={<ComplianceFile />} />
            <Route path="orders" element={<Orders />} />
            <Route path="design" element={<Design />} />
            <Route path="cards" element={<Cards />} />
            <Route path="qr" element={<Qr />} />
            <Route path="print" element={<PrintMenu />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="loyalty" element={<Loyalty />} />
            <Route path="billing" element={<Billing />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Shell>
      )}
      </OrderAlertsProvider>
    </Ctx.Provider>
  );
}

/* بوابة ترقية مشتركة للميزات المدفوعة */
/** مفاتيح `PlanLimits` المنطقية — ما يُفتح بالاشتراك لا ما يُعدّ. */
type FeatureKey = {
  [K in keyof Entitlements]: Entitlements[K] extends boolean ? K : never;
}[keyof Entitlements];

/**
 * جدار ميزة مدفوعة — **يستبدل المحتوى لا يُذيَّل به**.
 *
 * ═══ لماذا وُجد ═══
 *
 * `FREE_LIMITS` كان يعلن أن الولاء والكاشير والتحليلات والبطاقات والدفع
 * الإلكتروني مغلقة لغير المشترك، و**صفر مكوّن يقرأ تلك الأعلام**. فتاجرٌ
 * انتهى اشتراكه يحتفظ بكل شيء عدا الـ`api` — أي أن الاشتراك لا يبيع شيئاً
 * قابلاً للحجب.
 *
 * ═══ ⚠️ وهذا **ليس** الحارس ═══
 *
 * جدارٌ في الواجهة يمنع العرض لا الوصول: من يفتح أدوات المطوّر يتجاوزه. الحارس
 * الحقيقي في الخادم — `paylink-order-create` ترفض بـ٤٠٢ بلا اشتراك، تماماً
 * كما تفعل `api`. وما لم يُحرس خادمياً بعد موثَّق في `LAUNCH.md`.
 *
 * ═══ قاعدة (ج) ═══
 *
 * `ent.loading` **قبل** كل شيء: بدونها يرى المشترك وميض جدار ترقية في كل
 * تحميل — وهو نفس درس «لا تعرض جدار ترقية قبل أن تُحسم الصلاحيات».
 */
export function FeatureGate({
  feature,
  title,
  desc,
  children,
}: {
  feature: FeatureKey;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  const { ent } = useDashboard();
  if (ent.loading) return null;
  if (ent[feature]) return <>{children}</>;
  return <UpgradeGate title={title} desc={desc} />;
}

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

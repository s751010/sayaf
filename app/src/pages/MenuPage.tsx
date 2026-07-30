/**
 * صفحة المنيو العامة `/:slug` — قلب المنتج (ما يفتحه الزبون من كود QR).
 * تُلوَّن بالكامل بثيم القائمة عبر متغيرات `--m-*` (انظر lib/themes).
 */
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Logo } from "@/components/site";
import { SafeImage, Skeleton } from "@/components/ui";
import { parseOptions } from "@/lib/options";
import { displayAllergens } from "@/lib/allergens";
import { DAYS, openState, parseWeek, riyadhTodayId, weekSummary } from "@/lib/hours";
import {
  getActiveMenus,
  getAvailableDishes,
  getLoyaltyCustomer,
  getRestaurantBySlug,
  joinLoyalty,
  trackDishView,
  trackMenuView,
} from "@/lib/data";
import { getTheme } from "@/lib/themes";
import { K, getItem, getJSON, setItem, setJSON } from "@/lib/storage";
import { categoryId, formatPrice } from "@/lib/utils";
import type { Dish, LoyaltyCustomer, Menu, Restaurant } from "@/lib/types";

/* ── أدوات عرض صغيرة ──────────────────────────────────────────────── */
const mFont: CSSProperties = { fontFamily: "var(--m-font)" };

function dishName(d: Dish, en: boolean): string {
  return en && d.name_en ? d.name_en : d.name;
}

function dishDesc(d: Dish, en: boolean): string | null {
  return en && d.description_en ? d.description_en : d.description;
}

/**
 * التاجر قد يكتب «instagram.com/x» بلا مخطَّط، فينتج رابط نسبي مكسور داخل
 * المنيو. نضيف https:// عند الحاجة ونرفض المخططات غير الآمنة.
 */
function httpUrl(raw: string): string {
  const v = raw.trim();
  if (/^https?:\/\//i.test(v)) return v;
  if (/^(javascript|data|vbscript):/i.test(v)) return "#";
  return `https://${v.replace(/^\/+/, "")}`;
}

/** رقم مجرّد → رابط wa.me، ورابط كامل يُترك كما هو. */
function whatsappUrl(raw: string): string {
  const v = raw.trim();
  if (/^https?:\/\//i.test(v)) return v;
  const digits = v.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "#";
}

/** فهرس «مسبب → الأطباق التي تحتويه» لصفحة المسببات. */
function buildAllergenIndex(dishes: Dish[], en: boolean) {
  const map = new Map<string, { label: string; emoji: string; dishes: string[] }>();
  for (const d of dishes) {
    for (const a of displayAllergens(d.allergens, en)) {
      const entry = map.get(a.key) ?? { label: a.label, emoji: a.emoji, dishes: [] };
      entry.dishes.push(dishName(d, en));
      map.set(a.key, entry);
    }
  }
  return [...map.values()].sort((x, y) => y.dishes.length - x.dishes.length);
}


function Chip({ children, onClick, href }: { children: ReactNode; onClick?: () => void; href?: string }) {
  const cls =
    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-bold transition-transform hover:scale-[1.03]";
  const style = {
    borderColor: "var(--m-border)",
    background: "var(--m-surface)",
    color: "var(--m-text)",
  };
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls} style={style}>
      {children}
    </a>
  ) : (
    <button onClick={onClick} className={cls} style={style}>
      {children}
    </button>
  );
}

/**
 * لوح منسدل بثيم المنيو (`--m-*`).
 * `ui.tsx`'s Modal مربوط بألوان اللوحة لا بثيم المنيو، فنحتاج نسخة مستقلة —
 * لكن منطق Escape وقفل التمرير موحّد هنا بدل تكراره في كل لوح.
 */
function MenuSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="anim-fade-up max-h-[88dvh] w-full max-w-lg overflow-y-auto border p-5"
        style={{
          background: "var(--m-bg-2)",
          borderColor: "var(--m-border)",
          borderRadius: "calc(var(--m-radius) * 1.4)",
        }}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-lg font-black" style={{ color: "var(--m-text)", ...mFont }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ color: "var(--m-muted)", background: "var(--m-surface)" }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── بطاقة الطبق ──────────────────────────────────────────────────── */
function DishCard({ dish, en, onOpen }: { dish: Dish; en: boolean; onOpen: () => void }) {
  const allergenIcons = displayAllergens(dish.allergens, en);
  return (
    <button
      onClick={onOpen}
      className="group flex flex-col overflow-hidden border text-right transition-transform hover:-translate-y-0.5"
      style={{
        background: "var(--m-surface)",
        borderColor: "var(--m-border)",
        borderRadius: "var(--m-radius)",
      }}
    >
      <SafeImage
        src={dish.image}
        alt={dishName(dish, en)}
        className="h-32 w-full object-cover sm:h-36"
        wrapperClassName="h-32 w-full text-5xl sm:h-36"
        style={{ background: "var(--m-bg-2)" } as CSSProperties}
        fallback={
          <div
            className="flex h-32 w-full items-center justify-center text-5xl sm:h-36"
            style={{ background: "var(--m-bg-2)" } as CSSProperties}
          >
            {dish.emoji ?? "🍽"}
          </div>
        }
      />
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold leading-snug" style={{ color: "var(--m-text)", ...mFont }}>
            {dishName(dish, en)}
            {dish.featured && <span style={{ color: "var(--m-accent)" }}> ★</span>}
          </p>
        </div>
        {dishDesc(dish, en) && (
          <p className="line-clamp-2 text-xs leading-relaxed" style={{ color: "var(--m-muted)" }}>
            {dishDesc(dish, en)}
          </p>
        )}
        {/* رموز المسببات على البطاقة نفسها — الزبون الحسّاس يجب أن يراها وهو
            يمسح المنيو، لا أن يفتح كل طبق ليعرف. */}
        {allergenIcons.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 pt-1" aria-label={en ? "Allergens" : "مسببات الحساسية"}>
            {allergenIcons.map((a) => (
              <span
                key={a.key}
                title={a.label}
                className="rounded-md px-1 text-[11px]"
                style={{ background: "var(--m-bg-2)" }}
              >
                {a.emoji}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between pt-1.5">
          <span className="text-sm font-black" style={{ color: "var(--m-accent)" }}>
            {formatPrice(dish.price ?? 0)} <span className="text-[10px] font-bold">ر.س</span>
          </span>
          {dish.calories != null && (
            <span className="text-[10px]" style={{ color: "var(--m-muted)" }}>
              🔥 {dish.calories} {en ? "cal" : "سعرة"}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ── نافذة تفاصيل الطبق ───────────────────────────────────────────── */
function DishModal({ dish, en, onClose }: { dish: Dish; en: boolean; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const options = parseOptions(dish.options);
  const allergens = displayAllergens(dish.allergens, en);
  const nutrition = [
    dish.calories != null && { label: en ? "Calories" : "سعرات", value: dish.calories, icon: "🔥" },
    dish.sodium_mg != null && { label: en ? "Sodium" : "صوديوم", value: `${dish.sodium_mg} ملغم`, icon: "🧂" },
    dish.caffeine_mg != null && { label: en ? "Caffeine" : "كافيين", value: `${dish.caffeine_mg} ملغم`, icon: "☕" },
    dish.burn_minutes != null && { label: en ? "Burn (walk)" : "دقائق حرق", value: `${dish.burn_minutes} د`, icon: "🚶" },
  ].filter(Boolean) as { label: string; value: string | number; icon: string }[];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="anim-fade-up max-h-[92dvh] w-full max-w-lg overflow-y-auto border"
        style={{
          background: "var(--m-bg-2)",
          borderColor: "var(--m-border)",
          borderRadius: "calc(var(--m-radius) * 1.4)",
        }}
      >
        <SafeImage
          src={dish.image}
          alt=""
          className="h-56 w-full object-cover"
          fallback={
            <div
              className="flex h-44 w-full items-center justify-center text-7xl"
              style={{ background: "var(--m-bg)" } as CSSProperties}
            >
              {dish.emoji ?? "🍽"}
            </div>
          }
        />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xl font-black" style={{ color: "var(--m-text)", ...mFont }}>
              {dishName(dish, en)}
            </h3>
            <span className="shrink-0 text-lg font-black" style={{ color: "var(--m-accent)" }}>
              {formatPrice(dish.price ?? 0)} ر.س
            </span>
          </div>
          {dishDesc(dish, en) && (
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--m-muted)" }}>
              {dishDesc(dish, en)}
            </p>
          )}

          {nutrition.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {nutrition.map((n) => (
                <div
                  key={n.label}
                  className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold"
                  style={{ borderColor: "var(--m-border)", background: "var(--m-surface)", color: "var(--m-text)" }}
                >
                  <span>{n.icon}</span> {n.label}: {n.value}
                </div>
              ))}
            </div>
          )}

          {/* تنبيه الصوديوم المرتفع — عمود محسوب في قاعدة البيانات
              (sodium_mg > 600) لم يكن يُعرض للزبون إطلاقاً. */}
          {dish.is_high_sodium && (
            <p
              className="mt-3 rounded-xl border px-3 py-2 text-xs font-bold"
              style={{ borderColor: "var(--m-border)", color: "var(--m-text)", background: "var(--m-surface)" }}
            >
              🧂 {en ? "High in sodium" : "غني بالصوديوم"}
            </p>
          )}

          {allergens.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-xs font-bold" style={{ color: "var(--m-muted)" }}>
                ⚠️ {en ? "Allergens" : "مسببات الحساسية"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {allergens.map((a) => (
                  <span
                    key={a.key}
                    className="rounded-full border px-2.5 py-0.5 text-xs"
                    style={{ borderColor: "var(--m-border)", color: "var(--m-text)" }}
                  >
                    {a.emoji} {a.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {options.length > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 text-xs font-bold" style={{ color: "var(--m-muted)" }}>
                {en ? "Options" : "الخيارات والإضافات"}
              </p>
              <div className="flex flex-col gap-1.5">
                {options.map((o, i) => (
                  <div
                    key={`${o.name}-${i}`}
                    className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--m-border)", color: "var(--m-text)" }}
                  >
                    <span>{o.name}</span>
                    {o.price != null && (
                      <span style={{ color: "var(--m-accent)" }}>+{formatPrice(o.price)} ر.س</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {dish.sfda_compliant && (
            <p className="mt-4 text-center text-[11px]" style={{ color: "var(--m-muted)" }}>
              ✅ {en ? "SFDA-compliant nutrition info" : "معلومات غذائية متوافقة مع هيئة الغذاء والدواء"}
            </p>
          )}

          <button
            onClick={onClose}
            className="mt-5 w-full rounded-xl py-2.5 text-sm font-black"
            style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
          >
            {en ? "Close" : "إغلاق"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── بطاقة الولاء (زبون) ──────────────────────────────────────────── */
type LocalCard = { id: string; name: string };

function LoyaltyCard({ restaurant, en }: { restaurant: Restaurant; en: boolean }) {
  const storeKey = `cm2_loyalty_${restaurant.id}`;
  const [card, setCard] = useState<LocalCard | null>(() => getJSON<LocalCard>(storeKey));
  const [customer, setCustomer] = useState<LoyaltyCustomer | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (card) getLoyaltyCustomer(card.id).then(setCustomer).catch(() => {});
  }, [card]);

  // الهدف يأتي من قاعدة البيانات وقد يكون سالباً أو كسرياً في صفوف قديمة/مستوردة،
  // و`Array(-1)` يرمي RangeError فيُسقط منيو الزبون كاملاً. نحصره في مدى معقول.
  const goal = Math.min(20, Math.max(1, Math.round(restaurant.loyalty_goal ?? 5)));
  const stamps = customer?.stamps ?? 0;

  async function join() {
    if (!name.trim()) return setMsg(en ? "Enter your name" : "أدخل اسمك");
    if (!phone.trim()) return setMsg(en ? "Enter your phone" : "أدخل رقم جوالك");
    setBusy(true);
    setMsg("");
    try {
      const c = await joinLoyalty({
        restaurant_id: restaurant.id,
        name: name.trim(),
        phone: phone.trim(),
      });
      const local = { id: c.id, name: c.name ?? name.trim() };
      setJSON(storeKey, local);
      setCard(local);
      setCustomer(c);
    } catch {
      setMsg(en ? "Couldn't join. Try again." : "تعذّر الانضمام. حاول مجدداً.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="mx-auto mt-8 w-full max-w-md border p-5"
      style={{
        borderColor: "var(--m-border)",
        background: "var(--m-surface)",
        borderRadius: "calc(var(--m-radius) * 1.2)",
      }}
    >
      <p className="text-center font-black" style={{ color: "var(--m-text)", ...mFont }}>
        💛 {en ? "Loyalty Card" : "بطاقة الولاء"}
      </p>
      <p className="mt-1 text-center text-xs" style={{ color: "var(--m-muted)" }}>
        {en
          ? `${goal} visits → ${restaurant.loyalty_reward ?? "a reward"}`
          : `${goal} زيارات → ${restaurant.loyalty_reward ?? "مكافأة"}`}
      </p>

      {!card ? (
        <div className="mt-4 flex flex-col gap-2.5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={en ? "Your name" : "اسمك"}
            className="rounded-xl border bg-transparent px-3.5 py-2.5 text-sm"
            style={{ borderColor: "var(--m-border)", color: "var(--m-text)" }}
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ""))}
            placeholder={en ? "Phone number" : "رقم الجوال"}
            dir="ltr"
            inputMode="tel"
            className="rounded-xl border bg-transparent px-3.5 py-2.5 text-sm"
            style={{ borderColor: "var(--m-border)", color: "var(--m-text)" }}
          />
          {msg && (
            <p className="text-center text-xs" style={{ color: "var(--m-accent)" }}>
              {msg}
            </p>
          )}
          <button
            onClick={join}
            disabled={busy}
            className="rounded-xl py-2.5 text-sm font-black disabled:opacity-50"
            style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
          >
            {busy ? "…" : en ? "Join now" : "انضم الآن"}
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[...Array(goal)].map((_, i) => (
              <span
                key={i}
                className="flex h-9 w-9 items-center justify-center rounded-full border text-sm"
                style={
                  i < stamps
                    ? { background: "var(--m-accent)", color: "var(--m-on-accent)", borderColor: "var(--m-accent)" }
                    : { borderColor: "var(--m-border)", color: "var(--m-muted)" }
                }
              >
                {i < stamps ? "✓" : i + 1}
              </span>
            ))}
          </div>
          <p className="mt-3 text-center text-xs" style={{ color: "var(--m-muted)" }}>
            {stamps >= goal
              ? en
                ? "🎉 Reward unlocked! Show this to the staff."
                : "🎉 استحققت المكافأة! أرِ هذه البطاقة لموظف المطعم."
              : en
                ? `${goal - stamps} visits left — staff stamps your card on each visit.`
                : `باقي ${goal - stamps} زيارة — الموظف يختم بطاقتك عند كل زيارة.`}
          </p>
          <p className="mt-2 text-center text-[11px]" style={{ color: "var(--m-muted)" }}>
            {en ? "Card holder:" : "صاحب البطاقة:"} {card.name}
          </p>
        </div>
      )}
    </section>
  );
}

/* ── الصفحة ───────────────────────────────────────────────────────── */
type LoadState =
  | { status: "loading" }
  | { status: "notfound" }
  | { status: "error" }
  | { status: "ready"; restaurant: Restaurant; menus: Menu[]; dishes: Dish[] };

/** بيانات جاهزة تتخطّى الشبكة — تستخدمها صفحة الديمو (/demo). */
export type MenuData = { restaurant: Restaurant; menus: Menu[]; dishes: Dish[] };

export default function MenuPage({ demo }: { demo?: MenuData } = {}) {
  const { slug = "" } = useParams();
  const [params] = useSearchParams();
  const [state, setState] = useState<LoadState>(
    demo ? { status: "ready", ...demo } : { status: "loading" }
  );
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [openDish, setOpenDish] = useState<Dish | null>(null);
  const [hoursOpen, setHoursOpen] = useState(false);
  const [allergensOpen, setAllergensOpen] = useState(false);
  const tracked = useRef(false);
  // يتحدّث كل دقيقة كي لا تتجمّد حالة «مفتوح الآن» على شاشة مفتوحة طويلاً.
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNowTick(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  // رقم الطاولة من ?table= → sessionStorage (نفس مفتاح النسخة الأصلية).
  const table = params.get("table") ?? getItem(K.TABLE, true);
  useEffect(() => {
    const t = params.get("table");
    if (t) setItem(K.TABLE, t, true);
  }, [params]);

  useEffect(() => {
    // وضع الديمو: البيانات محقونة، فلا شبكة ولا تتبّع مشاهدات.
    if (demo) {
      document.title = `${demo.restaurant.name} — منيو تجريبي`;
      return;
    }
    let cancelled = false;
    setState({ status: "loading" });
    (async () => {
      try {
        const restaurant = await getRestaurantBySlug(slug);
        if (cancelled) return;
        if (!restaurant) return setState({ status: "notfound" });
        const menus = await getActiveMenus(restaurant.id);
        const dishes = await getAvailableDishes(menus.map((m) => m.id));
        if (cancelled) return;
        document.title = `${restaurant.name} — المنيو`;
        setState({ status: "ready", restaurant, menus, dishes });
        if (!tracked.current && menus[0]) {
          tracked.current = true;
          trackMenuView(menus[0].id, restaurant.user_id);
        }
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, demo]);

  const theme = getTheme(
    state.status === "ready" ? state.menus.find((m) => m.theme)?.theme : null
  );

  const en = lang === "en";

  const { featured, categories } = useMemo(() => {
    if (state.status !== "ready") return { featured: [], categories: [] as { name: string; dishes: Dish[] }[] };
    const q = search.trim().toLowerCase();
    const visible = q
      ? state.dishes.filter((d) =>
          [d.name, d.name_en, d.description, d.description_en, d.category]
            .filter(Boolean)
            .some((s) => s!.toLowerCase().includes(q))
        )
      : state.dishes;
    const byCat = new Map<string, Dish[]>();
    for (const d of visible) {
      const cat = d.category?.trim() || (en ? "Other" : "أخرى");
      byCat.set(cat, [...(byCat.get(cat) ?? []), d]);
    }
    return {
      featured: q ? [] : visible.filter((d) => d.featured),
      categories: [...byCat.entries()].map(([name, dishes]) => ({ name, dishes })),
    };
  }, [state, search, en]);

  /* حالات غير جاهزة */
  if (state.status === "loading") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Skeleton className="mx-auto h-40 max-w-md rounded-3xl" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[...Array(9)].map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      </div>
    );
  }

  if (state.status !== "ready") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-5 text-center">
        <span className="text-6xl">{state.status === "notfound" ? "🍽️" : "📡"}</span>
        <h1 className="font-display text-2xl font-black text-ink">
          {state.status === "notfound" ? "هذا المطعم غير موجود" : "تعذّر تحميل المنيو"}
        </h1>
        <p className="max-w-sm text-sm text-dim">
          {state.status === "notfound"
            ? "تأكد من الرابط المطبوع على كود QR، أو اسأل موظف المطعم."
            : "تحقق من اتصالك بالإنترنت ثم أعد المحاولة."}
        </p>
        <Link to="/" className="mt-2 text-sm font-bold text-gold hover:underline">
          → كلاود منيو
        </Link>
      </div>
    );
  }

  const { restaurant } = state;
  const socials = [
    restaurant.google_review_url && { icon: "⭐", label: en ? "Rate us on Google" : "قيّمنا على قوقل", url: httpUrl(restaurant.google_review_url), highlight: true },
    restaurant.social_maps && { icon: "📍", label: en ? "Find us on Maps" : "موقعنا على الخريطة", url: httpUrl(restaurant.social_maps), highlight: true },
    restaurant.social_whatsapp && { icon: "💬", label: en ? "WhatsApp" : "واتساب", url: whatsappUrl(restaurant.social_whatsapp) },
    restaurant.social_instagram && { icon: "📸", label: en ? "Instagram" : "إنستغرام", url: httpUrl(restaurant.social_instagram) },
    restaurant.social_twitter && { icon: "𝕏", label: en ? "X (Twitter)" : "تويتر", url: httpUrl(restaurant.social_twitter) },
    restaurant.social_tiktok && { icon: "🎵", label: en ? "TikTok" : "تيك توك", url: httpUrl(restaurant.social_tiktok) },
    restaurant.social_snapchat && { icon: "👻", label: en ? "Snapchat" : "سناب شات", url: httpUrl(restaurant.social_snapchat) },
  ].filter(Boolean) as { icon: string; label: string; url: string; highlight?: boolean }[];

  // كل المسببات الموجودة في المنيو، مع أطباق كل مسبب.
  const allergenIndex = buildAllergenIndex(state.dishes, en);

  // ساعات العمل: جدول مهيكل إن وُجد، وإلا نصّ حر يُعرض كما هو.
  const week = parseWeek(restaurant.working_hours);
  const live = week ? openState(week, en, new Date(nowTick)) : null;
  const todayId = riyadhTodayId(new Date(nowTick));

  return (
    <div
      dir={en ? "ltr" : "rtl"}
      className="min-h-dvh pb-16"
      style={{ ...theme.vars, background: "var(--m-bg)", color: "var(--m-text)" } as CSSProperties}
    >
      {/* الترويسة */}
      <header className="relative">
        <SafeImage
          src={restaurant.banner_image}
          alt=""
          className="h-44 w-full object-cover sm:h-56"
          fallback={
            <div
              className="h-32 w-full sm:h-40"
              style={
                {
                  background: `linear-gradient(160deg, ${restaurant.cover_color ?? "var(--m-bg-2)"}, var(--m-bg))`,
                } as CSSProperties
              }
            />
          }
        />
        <div className="mx-auto -mt-12 flex max-w-3xl flex-col items-center px-4 text-center">
          <SafeImage
            src={restaurant.logo_image}
            alt={restaurant.name}
            className="h-24 w-24 rounded-3xl border-2 object-cover shadow-xl"
            style={{ borderColor: "var(--m-accent)", background: "var(--m-bg-2)" } as CSSProperties}
            fallback={
              <span
                className="flex h-24 w-24 items-center justify-center rounded-3xl border-2 text-5xl shadow-xl"
                style={
                  { borderColor: "var(--m-accent)", background: "var(--m-bg-2)" } as CSSProperties
                }
              >
                {restaurant.logo ?? "🍽️"}
              </span>
            }
          />
          <h1 className="mt-3 text-2xl font-black" style={mFont}>
            {restaurant.name}
          </h1>
          {restaurant.type && (
            <p className="text-sm" style={{ color: "var(--m-muted)" }}>
              {restaurant.type}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            {table && (
              <span
                className="rounded-full px-3 py-1 text-xs font-black"
                style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
              >
                🪑 {en ? "Table" : "طاولة"} {table}
              </span>
            )}
            {/* جدول مهيكل ⇒ حالة «مفتوح الآن» + ملخّص. نصّ حر ⇒ يُعرض كما هو.
                (قبل ذلك كانت القيمة تُطبع خاماً، فيرى الزبون JSON على شاشته.) */}
            {week ? (
              <>
                <span
                  className="rounded-full px-3 py-1 text-xs font-black"
                  style={
                    live?.open
                      ? { background: "var(--m-accent)", color: "var(--m-on-accent)" }
                      : { border: "1px solid var(--m-border)", color: "var(--m-muted)" }
                  }
                >
                  {live?.open ? "🟢" : "⚪"} {live?.label}
                  {live?.open && live.until ? ` · ${en ? "until" : "حتى"} ${live.until}` : ""}
                </span>
                <button
                  onClick={() => setHoursOpen(true)}
                  className="rounded-full border px-3 py-1 text-xs"
                  style={{ borderColor: "var(--m-border)", color: "var(--m-muted)" }}
                >
                  🕐 {weekSummary(week, en)} ›
                </button>
              </>
            ) : (
              restaurant.working_hours && (
                <span
                  className="rounded-full border px-3 py-1 text-xs"
                  style={{ borderColor: "var(--m-border)", color: "var(--m-muted)" }}
                >
                  🕐 {restaurant.working_hours}
                </span>
              )
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4">
        {/* مبدّل اللغة */}
        {restaurant.english_enabled && (
          <div className="mt-5 flex justify-center">
            <div
              className="inline-flex rounded-full border p-1"
              style={{ borderColor: "var(--m-border)", background: "var(--m-surface)" }}
            >
              {(["ar", "en"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className="rounded-full px-4 py-1 text-sm font-bold transition-colors"
                  style={
                    lang === l
                      ? { background: "var(--m-accent)", color: "var(--m-on-accent)" }
                      : { color: "var(--m-muted)" }
                  }
                >
                  {l === "ar" ? "العربية" : "English"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* البحث */}
        <div className="mt-5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={en ? "🔍 Search the menu…" : "🔍 ابحث في المنيو…"}
            className="w-full rounded-2xl border bg-transparent px-4 py-3 text-sm"
            style={{ borderColor: "var(--m-border)", background: "var(--m-surface)", color: "var(--m-text)" }}
          />
        </div>

        {/* المميّز */}
        {featured.length > 0 && (
          <section className="mt-7">
            <h2 className="mb-3 text-lg font-black" style={mFont}>
              <span style={{ color: "var(--m-accent)" }}>★</span> {en ? "Featured" : "الأكثر تميّزاً"}
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {featured.map((d) => (
                <div key={d.id} className="w-44 shrink-0">
                  <DishCard dish={d} en={en} onOpen={() => { setOpenDish(d); if (!demo) trackDishView(d); }} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* شريط التصنيفات اللاصق */}
        {categories.length > 1 && (
          <nav
            className="sticky top-0 z-30 -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 py-3 backdrop-blur-lg [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ background: "color-mix(in srgb, var(--m-bg) 82%, transparent)" }}
          >
            {categories.map((c) => (
              <a
                key={c.name}
                href={`#${categoryId(c.name)}`}
                onClick={() => setActiveCat(c.name)}
                className="shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition-colors"
                style={
                  activeCat === c.name
                    ? { background: "var(--m-accent)", color: "var(--m-on-accent)" }
                    : { background: "var(--m-surface)", color: "var(--m-muted)" }
                }
              >
                {c.name}
              </a>
            ))}
          </nav>
        )}

        {/* الأقسام */}
        {categories.length === 0 ? (
          <p className="py-16 text-center" style={{ color: "var(--m-muted)" }}>
            {search
              ? en
                ? "No results for your search."
                : "لا نتائج لبحثك."
              : en
                ? "No items available yet."
                : "لا توجد أصناف متاحة حالياً."}
          </p>
        ) : (
          categories.map((cat) => (
            <section key={cat.name} id={categoryId(cat.name)} className="scroll-mt-20 pt-7">
              <h2
                className="mb-3 inline-block border-b-2 pb-1 text-lg font-black"
                style={{ ...mFont, borderColor: "var(--m-accent)" }}
              >
                {cat.name}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {cat.dishes.map((d) => (
                  <DishCard key={d.id} dish={d} en={en} onOpen={() => { setOpenDish(d); if (!demo) trackDishView(d); }} />
                ))}
              </div>
            </section>
          ))
        )}

        {/* صفحة المسببات — كل المسببات في المنيو وأي الأطباق تحتويها */}
        {allergenIndex.length > 0 && (
          <section className="mt-10">
            <button
              onClick={() => setAllergensOpen(true)}
              className="mx-auto flex w-full max-w-md items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-start transition-transform hover:scale-[1.01]"
              style={{ borderColor: "var(--m-border)", background: "var(--m-surface)" }}
            >
              <span>
                <span className="block text-sm font-black" style={{ color: "var(--m-text)" }}>
                  ⚠️ {en ? "Allergen guide" : "دليل مسببات الحساسية"}
                </span>
                <span className="mt-0.5 block text-xs" style={{ color: "var(--m-muted)" }}>
                  {en
                    ? `${allergenIndex.length} allergens across the menu`
                    : `${allergenIndex.length} مسبباً في هذا المنيو — اعرف أي طبق يحتويه`}
                </span>
              </span>
              <span style={{ color: "var(--m-accent)" }}>›</span>
            </button>
          </section>
        )}

        {/* روابط التواصل + تقييم قوقل + الموقع */}
        {socials.length > 0 && (
          <section className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {socials.map((s) =>
              s.highlight ? (
                <a
                  key={s.label}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-black transition-transform hover:scale-[1.03]"
                  style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
                >
                  {s.icon} {s.label}
                </a>
              ) : (
                <Chip key={s.label} href={s.url}>
                  {s.icon} {s.label}
                </Chip>
              )
            )}
          </section>
        )}

        {/* الولاء */}
        {restaurant.loyalty_enabled && <LoyaltyCard restaurant={restaurant} en={en} />}

        {/* الحساسية + معلومات المطعم */}
        {(restaurant.allergens_text || restaurant.address || restaurant.phone) && (
          <section className="mt-8 text-center text-xs leading-relaxed" style={{ color: "var(--m-muted)" }}>
            {restaurant.allergens_text && <p>⚠️ {restaurant.allergens_text}</p>}
            {restaurant.address && <p className="mt-1">📍 {restaurant.address}</p>}
            {restaurant.phone && (
              <p className="mt-1" dir="ltr">
                📞 {restaurant.phone}
              </p>
            )}
          </section>
        )}

        {/* توقيع المنصة */}
        <footer className="mt-12 flex flex-col items-center gap-2 opacity-70">
          <Link to="/" className="scale-90">
            <Logo />
          </Link>
        </footer>
      </main>

      {openDish && <DishModal dish={openDish} en={en} onClose={() => setOpenDish(null)} />}

      {hoursOpen && week && (
        <MenuSheet
          title={en ? "Opening hours" : "ساعات العمل"}
          onClose={() => setHoursOpen(false)}
        >
          <ul className="flex flex-col gap-1.5">
            {DAYS.map((d) => {
              const day = week[d.id];
              const isToday = d.id === todayId;
              return (
                <li
                  key={d.id}
                  className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm"
                  style={{
                    borderColor: isToday ? "var(--m-accent)" : "var(--m-border)",
                    background: isToday ? "var(--m-surface)" : "transparent",
                    color: "var(--m-text)",
                  }}
                >
                  <span className="font-bold">
                    {en ? d.en : d.ar}
                    {isToday && (
                      <span style={{ color: "var(--m-accent)" }}> · {en ? "today" : "اليوم"}</span>
                    )}
                  </span>
                  <span dir="ltr" style={{ color: day.open ? "var(--m-text)" : "var(--m-muted)" }}>
                    {day.open ? `${day.from} – ${day.to}` : en ? "Closed" : "إجازة"}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-center text-xs" style={{ color: "var(--m-muted)" }}>
            {en ? "Riyadh time" : "بتوقيت الرياض"}
          </p>
        </MenuSheet>
      )}

      {allergensOpen && (
        <MenuSheet
          title={en ? "Allergen guide" : "دليل مسببات الحساسية"}
          onClose={() => setAllergensOpen(false)}
        >
          <p className="mb-3 text-xs leading-relaxed" style={{ color: "var(--m-muted)" }}>
            {en
              ? "Allergens declared by the restaurant for each dish. If you have a severe allergy, please tell the staff."
              : "المسببات كما أعلنها المطعم لكل طبق. إن كانت حساسيتك شديدة فأخبر موظف المطعم قبل الطلب."}
          </p>
          <ul className="flex flex-col gap-2">
            {allergenIndex.map((a) => (
              <li
                key={a.label}
                className="rounded-xl border px-3 py-2.5"
                style={{ borderColor: "var(--m-border)", background: "var(--m-surface)" }}
              >
                <p className="text-sm font-black" style={{ color: "var(--m-text)" }}>
                  {a.emoji} {a.label}
                  <span className="font-normal" style={{ color: "var(--m-muted)" }}>
                    {" "}
                    · {a.dishes.length} {en ? "dishes" : "طبقاً"}
                  </span>
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--m-muted)" }}>
                  {a.dishes.join(" · ")}
                </p>
              </li>
            ))}
          </ul>
          {restaurant.allergens_text && (
            <p className="mt-4 text-center text-xs" style={{ color: "var(--m-muted)" }}>
              ⚠️ {restaurant.allergens_text}
            </p>
          )}
        </MenuSheet>
      )}
    </div>
  );
}

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
import { Skeleton } from "@/components/ui";
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

/** خيارات الطبق تُخزَّن نصاً — قد تكون JSON [{name,price}] أو نصاً حراً. */
function parseOptions(raw: string | null): { name: string; price?: number }[] {
  if (!raw?.trim()) return [];
  try {
    const v = JSON.parse(raw);
    if (Array.isArray(v)) {
      return v
        .map((o) =>
          typeof o === "string"
            ? { name: o }
            : o && typeof o.name === "string"
              ? { name: o.name, price: typeof o.price === "number" ? o.price : undefined }
              : null
        )
        .filter((o): o is { name: string; price?: number } => o !== null);
    }
  } catch {
    /* نص حر مفصول بأسطر/فواصل */
  }
  return raw
    .split(/[\n,،]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => ({ name }));
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

/* ── بطاقة الطبق ──────────────────────────────────────────────────── */
function DishCard({ dish, en, onOpen }: { dish: Dish; en: boolean; onOpen: () => void }) {
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
      {dish.image ? (
        <img
          src={dish.image}
          alt={dishName(dish, en)}
          loading="lazy"
          decoding="async"
          className="h-32 w-full object-cover sm:h-36"
        />
      ) : (
        <div
          className="flex h-32 w-full items-center justify-center text-5xl sm:h-36"
          style={{ background: "var(--m-bg-2)" }}
        >
          {dish.emoji ?? "🍽"}
        </div>
      )}
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
        {dish.image ? (
          <img src={dish.image} alt="" className="h-56 w-full object-cover" />
        ) : (
          <div className="flex h-44 items-center justify-center text-7xl" style={{ background: "var(--m-bg)" }}>
            {dish.emoji ?? "🍽"}
          </div>
        )}
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

          {(dish.allergens?.length ?? 0) > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-xs font-bold" style={{ color: "var(--m-muted)" }}>
                ⚠️ {en ? "Allergens" : "مسببات الحساسية"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {dish.allergens!.map((a) => (
                  <span
                    key={a}
                    className="rounded-full border px-2.5 py-0.5 text-xs"
                    style={{ borderColor: "var(--m-border)", color: "var(--m-text)" }}
                  >
                    {a}
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
                {options.map((o) => (
                  <div
                    key={o.name}
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

  const goal = restaurant.loyalty_goal ?? 5;
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

export default function MenuPage() {
  const { slug = "" } = useParams();
  const [params] = useSearchParams();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [openDish, setOpenDish] = useState<Dish | null>(null);
  const tracked = useRef(false);

  // رقم الطاولة من ?table= → sessionStorage (نفس مفتاح النسخة الأصلية).
  const table = params.get("table") ?? getItem(K.TABLE, true);
  useEffect(() => {
    const t = params.get("table");
    if (t) setItem(K.TABLE, t, true);
  }, [params]);

  useEffect(() => {
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
  }, [slug]);

  const theme = getTheme(
    state.status === "ready" ? state.menus.find((m) => m.theme)?.theme : null
  );

  const en = lang === "en";

  const { featured, categories } = useMemo(() => {
    if (state.status !== "ready") return { featured: [], categories: [] as { name: string; dishes: Dish[] }[] };
    const q = search.trim().toLowerCase();
    const visible = q
      ? state.dishes.filter((d) =>
          [d.name, d.name_en, d.description, d.category]
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
    restaurant.google_review_url && { icon: "⭐", label: en ? "Rate us on Google" : "قيّمنا على قوقل", url: restaurant.google_review_url, highlight: true },
    restaurant.social_whatsapp && { icon: "💬", label: "واتساب", url: restaurant.social_whatsapp.startsWith("http") ? restaurant.social_whatsapp : `https://wa.me/${restaurant.social_whatsapp.replace(/\D/g, "")}` },
    restaurant.social_instagram && { icon: "📸", label: "إنستغرام", url: restaurant.social_instagram },
    restaurant.social_twitter && { icon: "𝕏", label: "تويتر", url: restaurant.social_twitter },
    restaurant.social_tiktok && { icon: "🎵", label: "تيك توك", url: restaurant.social_tiktok },
    restaurant.social_snapchat && { icon: "👻", label: "سناب شات", url: restaurant.social_snapchat },
    restaurant.social_maps && { icon: "📍", label: en ? "Location" : "الموقع", url: restaurant.social_maps },
  ].filter(Boolean) as { icon: string; label: string; url: string; highlight?: boolean }[];

  return (
    <div
      dir={en ? "ltr" : "rtl"}
      className="min-h-dvh pb-16"
      style={{ ...theme.vars, background: "var(--m-bg)", color: "var(--m-text)" } as CSSProperties}
    >
      {/* الترويسة */}
      <header className="relative">
        {restaurant.banner_image ? (
          <img src={restaurant.banner_image} alt="" className="h-44 w-full object-cover sm:h-56" />
        ) : (
          <div
            className="h-32 w-full sm:h-40"
            style={{
              background: `linear-gradient(160deg, ${restaurant.cover_color ?? "var(--m-bg-2)"}, var(--m-bg))`,
            }}
          />
        )}
        <div className="mx-auto -mt-12 flex max-w-3xl flex-col items-center px-4 text-center">
          {restaurant.logo_image ? (
            <img
              src={restaurant.logo_image}
              alt={restaurant.name}
              className="h-24 w-24 rounded-3xl border-2 object-cover shadow-xl"
              style={{ borderColor: "var(--m-accent)", background: "var(--m-bg-2)" }}
            />
          ) : (
            <span
              className="flex h-24 w-24 items-center justify-center rounded-3xl border-2 text-5xl shadow-xl"
              style={{ borderColor: "var(--m-accent)", background: "var(--m-bg-2)" }}
            >
              {restaurant.logo ?? "🍽️"}
            </span>
          )}
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
            {restaurant.working_hours && (
              <span
                className="rounded-full border px-3 py-1 text-xs"
                style={{ borderColor: "var(--m-border)", color: "var(--m-muted)" }}
              >
                🕐 {restaurant.working_hours}
              </span>
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
                  <DishCard dish={d} en={en} onOpen={() => { setOpenDish(d); trackDishView(d); }} />
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
                  <DishCard key={d.id} dish={d} en={en} onOpen={() => { setOpenDish(d); trackDishView(d); }} />
                ))}
              </div>
            </section>
          ))
        )}

        {/* روابط التواصل + تقييم قوقل */}
        {socials.length > 0 && (
          <section className="mt-10 flex flex-wrap items-center justify-center gap-2">
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
    </div>
  );
}

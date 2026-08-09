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
import { MenuHeader } from "@/components/menu/MenuHeader";
import { DishCard, type CardReserve } from "@/components/menu/DishCard";
import { DishOfTheDay } from "@/components/menu/DishOfTheDay";
import {
  AddToCartButton,
  CartBar,
  CartReview,
  OrderResult,
  unitPrice,
  useCart,
  type Cart,
} from "@/components/menu/Cart";
import { parseOptions } from "@/lib/options";
import { displayAllergens } from "@/lib/allergens";
import {
  DAYS,
  inTimeWindow,
  openState,
  parseWeek,
  riyadhTodayId,
  weekSummary,
} from "@/lib/hours";
import {
  getActiveMenus,
  getRestaurantDishes,
  getLoyaltyCustomer,
  getRestaurantBySlug,
  isMenuPublished,
  joinLoyalty,
  trackDishView,
  trackMenuView,
} from "@/lib/data";
import { categoryIcon, parseCategoryOrder, sortCategories } from "@/lib/categories";
import {
  entranceClass,
  getTheme,
  RHYTHM,
  skinClass,
  type DishLayout,
  type HeadingStyle,
} from "@/lib/themes";
import { patternImage, PATTERN_SIZE } from "@/lib/patterns";
import { loadThemeFont } from "@/lib/fonts";
import { getSeason } from "@/lib/seasons";
import { installPixels } from "@/lib/pixels";
import { loadSession } from "@/lib/session";
import { getBillingSettings } from "@/lib/billing";
import { absoluteUrl, useJsonLd, useSeo } from "@/lib/seo";
import { K, getItem, getJSON, setItem, setJSON } from "@/lib/storage";
import { categoryId, cn, formatPrice, httpUrl, whatsappUrl } from "@/lib/utils";
import type { Dish, LoyaltyCustomer, Menu, Restaurant } from "@/lib/types";
import { DishGlyph, Icon, type IconName } from "@/lib/icons";

/* ── أدوات عرض صغيرة ──────────────────────────────────────────────── */
const mFont: CSSProperties = { fontFamily: "var(--m-font)" };
/** خطّ العناوين — يسقط إلى خطّ النصّ لكل طابع بلا اقتران. */
const dFont: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };

function dishName(d: Dish, en: boolean): string {
  return en && d.name_en ? d.name_en : d.name;
}

function dishDesc(d: Dish, en: boolean): string | null {
  return en && d.description_en ? d.description_en : d.description;
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
    "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-bold transition-transform hover:scale-[1.03]";
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
            className="flex h-11 w-11 items-center justify-center rounded-full"
            style={{ color: "var(--m-muted)", background: "var(--m-surface)" }}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}


/* ── عنوان القسم حسب الطابع ───────────────────────────────────────── */
/** التباعد يأتي من `RHYTHM` لا من هنا — سلّم واحد لكل الصفحة. */
/**
 * ما يُحجز مكانه في كل بطاقات القسم — يُحسب مرة للقسم لا لكل بطاقة.
 *
 * البطاقات في الصف الواحد تتساوى تلقائياً، لكن **الصفوف تختلف**: صف أطباقه بلا
 * وصف يقصر عن صف أطباقه بوصف سطرين، فتقع الأسعار على خطوط مختلفة وتُقرأ الشبكة
 * مهزوزة. الحجز على مستوى القسم يوحّد الارتفاع دون أن يفرض فراغاً على قسم لا
 * وصف فيه أصلاً.
 */
function sectionReserve(dishes: Dish[], en: boolean): CardReserve {
  return {
    desc: dishes.some((d) =>
      (en && d.description_en ? d.description_en : d.description)?.trim()
    ),
    meta: dishes.some((d) => d.calories != null || !!d.allergens?.length),
  };
}

const LAYOUT_CLASS: Record<DishLayout, string> = {
  grid: "grid grid-cols-2 sm:grid-cols-3",
  list: "flex flex-col",
  showcase: "grid grid-cols-1 sm:grid-cols-2",
};

function SectionHeading({ name, style }: { name: string; style: HeadingStyle }) {
  if (style === "rule") {
    return (
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px flex-1" style={{ background: "var(--m-border)" }} />
        <h2 className="text-lg font-black tracking-wide" style={{ ...dFont, color: "var(--m-text)" }}>
          {name}
        </h2>
        <span className="h-px flex-1" style={{ background: "var(--m-border)" }} />
      </div>
    );
  }
  if (style === "ornament") {
    return (
      <h2
        className="mb-3 flex items-center gap-2 text-lg font-black"
        style={{ ...dFont, color: "var(--m-text)" }}
      >
        <span aria-hidden="true" style={{ color: "var(--m-accent)" }}>
          ❖
        </span>
        {name}
        <span
          aria-hidden="true"
          className="h-px flex-1"
          style={{
            background: "linear-gradient(90deg, var(--m-accent), transparent)",
          }}
        />
      </h2>
    );
  }
  return (
    <h2
      className="mb-3 inline-block border-b-2 pb-1 text-lg font-black"
      style={{ ...dFont, borderColor: "var(--m-accent)", color: "var(--m-text)" }}
    >
      {name}
    </h2>
  );
}

/* ── نافذة تفاصيل الطبق ───────────────────────────────────────────── */
/**
 * هذه هي نقطة الإضافة الوحيدة التي تسمح باختيار الإضافات — زرّ «＋» على البطاقة
 * يضيف الطبق أساسياً بلا إضافات، ومن أراد «حار» أو «جبن زيادة» يفتح الطبق.
 */
function DishModal({
  dish,
  en,
  cart,
  onClose,
}: {
  dish: Dish;
  en: boolean;
  cart: Cart | null;
  onClose: () => void;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
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
  // طبق بلا سعر ترفضه دالة الحافة («بلا سعر»)، فلا نعرض له زرّ إضافة أصلاً.
  const orderable = !!cart?.enabled && Number(dish.price ?? 0) > 0;
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
              <DishGlyph value={dish.emoji} size={30} />
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
                {options.map((o, i) => {
                  // المعرّف هو **الموضع**: نفس ما تقرؤه دالة الحافة من العمود.
                  const id = String(i);
                  const on = picked.includes(id);
                  const row = (
                    <>
                      <span>
                        {orderable && (
                          <span aria-hidden="true" style={{ color: on ? "var(--m-accent)" : "var(--m-muted)" }}>
                            {on ? "☑ " : "☐ "}
                          </span>
                        )}
                        {o.name}
                      </span>
                      {/* «+0 ر.س» ضجيج: إضافة بلا سعر (حار، بلا بصل) اسمها يكفي. */}
                      {o.price != null && o.price > 0 && (
                        <span style={{ color: "var(--m-accent)" }}>
                          +{formatPrice(o.price)} {en ? "SAR" : "ر.س"}
                        </span>
                      )}
                    </>
                  );
                  const cls =
                    "flex min-h-11 items-center justify-between rounded-xl border px-3 py-2 text-start text-sm";
                  const style = {
                    borderColor: on ? "var(--m-accent)" : "var(--m-border)",
                    color: "var(--m-text)",
                  };
                  return orderable ? (
                    <button
                      key={`${o.name}-${i}`}
                      onClick={() =>
                        setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
                      }
                      aria-pressed={on}
                      className={cls}
                      style={style}
                    >
                      {row}
                    </button>
                  ) : (
                    <div key={`${o.name}-${i}`} className={cls} style={style}>
                      {row}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {dish.sfda_compliant && (
            <p
              className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs"
              style={{ color: "var(--m-muted)" }}
            >
              <Icon name="check" size={13} />
              {en ? "SFDA-compliant nutrition info" : "معلومات غذائية متوافقة مع هيئة الغذاء والدواء"}
            </p>
          )}

          {orderable ? (
            <div className="mt-5 flex items-center gap-2">
              <div
                className="flex shrink-0 items-center rounded-xl border"
                style={{ borderColor: "var(--m-border)" }}
              >
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label={en ? "Decrease" : "إنقاص"}
                  className="h-11 w-11 text-lg font-black"
                  style={{ color: "var(--m-muted)" }}
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-black" style={{ color: "var(--m-text)" }}>
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => Math.min(99, q + 1))}
                  aria-label={en ? "Increase" : "زيادة"}
                  className="h-11 w-11 text-lg font-black"
                  style={{ color: "var(--m-accent)" }}
                >
                  ＋
                </button>
              </div>
              <button
                onClick={() => {
                  cart!.add(dish.id, picked, qty);
                  onClose();
                }}
                className="flex min-h-11 flex-1 items-center justify-between gap-2 rounded-xl px-4 py-2.5 text-sm font-black"
                style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
              >
                <span>{en ? "Add to order" : "أضِف للطلب"}</span>
                <span dir="ltr">
                  {formatPrice(unitPrice(dish, picked) * qty)} {en ? "SAR" : "ر.س"}
                </span>
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="mt-5 min-h-11 w-full rounded-xl py-2.5 text-sm font-black"
              style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
            >
              {en ? "Close" : "إغلاق"}
            </button>
          )}
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
            className="min-h-11 rounded-xl border bg-transparent px-3.5 py-2.5 text-sm"
            style={{ borderColor: "var(--m-border)", color: "var(--m-text)" }}
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ""))}
            placeholder={en ? "Phone number" : "رقم الجوال"}
            dir="ltr"
            inputMode="tel"
            className="min-h-11 rounded-xl border bg-transparent px-3.5 py-2.5 text-sm"
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
            className="min-h-11 rounded-xl py-2.5 text-sm font-black disabled:opacity-50"
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
          <p className="mt-2 text-center text-xs" style={{ color: "var(--m-muted)" }}>
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
  /** المطعم موجود لكن صاحبه غير مشترك — المنيو غير منشور. */
  | { status: "unpublished"; name: string }
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const catRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  /** ارتفاع الشريط اللاصق الفعلي — يُستخدم لهامش التمرير ولمنطقة المراقبة. */
  const [navHeight, setNavHeight] = useState(48);
  const [openDish, setOpenDish] = useState<Dish | null>(null);
  const [hoursOpen, setHoursOpen] = useState(false);
  const [allergensOpen, setAllergensOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  /** عودة الزبون من بوابة الدفع — `?order=paid|cancelled` تبنيهما دالة الحافة. */
  const orderParam = params.get("order");
  const [orderResult, setOrderResult] = useState<"paid" | "cancelled" | null>(
    orderParam === "paid" || orderParam === "cancelled" ? orderParam : null
  );
  const tracked = useRef(false);
  /**
   * وضع المعاينة: التاجر يفتح منيوه من اللوحة قبل الطباعة.
   * النيّة (`?preview=1`) لا تكفي — تُمنح فقط بعد التأكد أن الجلسة تخصّ صاحب
   * المطعم، وإلا صار المعامل مفتاحاً عاماً يفتح كل منيو مقفل.
   */
  const wantsPreview = params.get("preview") === "1";
  const [preview, setPreview] = useState(false);
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
        // `user_id` محجوب عن الزائر المجهول، فالتحقّق من الملكية يتطلّب جلب
        // الصف بجلسة المستخدم — ولا نفعل ذلك إلا حين تُطلب المعاينة فعلاً.
        const session = loadSession();
        const tryOwner = wantsPreview && !!session;

        /**
         * ═══ الجولة الأولى: المطعم وإعدادات الفوترة **معاً** ═══
         *
         * كان هذا متسلسلاً بلا سبب: `getBillingSettings()` تقرأ
         * `site_settings?key=eq.billing` ولا تعرف شيئاً عن المطعم ولا تحتاجه.
         * وانتظارُها دورَ المطعم كان يضيف رحلة كاملة إلى **طوكيو** لكل زبون
         * يمسح كوداً على طاولة.
         */
        const [restaurant, billing] = await Promise.all([
          tryOwner
            ? getRestaurantBySlug(slug, { asOwner: true }).catch(() =>
                getRestaurantBySlug(slug)
              )
            : getRestaurantBySlug(slug),
          // تسقط إلى «مفتوح» عند أي فشل، فعطلٌ عابر عندنا لا يُطفئ منيو تاجر
          // (انظر `lib/billing.ts`) — ولهذا لا تُسقط `Promise.all`.
          getBillingSettings(),
        ]);
        if (cancelled) return;
        if (!restaurant) return setState({ status: "notfound" });
        const previewing =
          tryOwner && !!restaurant.user_id && session!.user.id === restaurant.user_id;
        setPreview(previewing);

        /**
         * ═══ الجولة الثانية: القوائم والأطباق معاً ═══
         *
         * الأطباق تُجلب بـ`restaurant_id` لا بمعرّفات القوائم، فلا تنتظرها.
         * والترشيح بالقوائم ينتقل إلى المتصفّح حيث لا يكلّف رحلة.
         *
         * ⚠️ قفل النشر يُفحص **بعد** انطلاق الجولة لا قبلها: هو مطفأ افتراضياً
         * (`enforce_publishing=false`)، فجعلُه بوّابةً متسلسلة كان يكلّف كل
         * زبون رحلةً ثالثة من أجل حالة نادرة. وإن كان القفل مشتغلاً ولم يكن
         * المنيو منشوراً، نخرج قبل عرض شيء — والطلبان الجاريان يُهمَلان.
         */
        const [active, allDishes, published] = await Promise.all([
          getActiveMenus(restaurant.id),
          getRestaurantDishes(restaurant.id),
          billing.enforce_publishing && !previewing
            ? isMenuPublished(slug).catch(() => true)
            : Promise.resolve(true),
        ]);
        if (cancelled) return;
        if (!published) {
          document.title = `${restaurant.name} — كلاود منيو`;
          return setState({ status: "unpublished", name: restaurant.name });
        }
        /**
         * نافذة العرض (قائمة فطور رمضان مثلاً). لو أسقط الترشيح كل القوائم
         * نعرضها كلها: منيو فارغ أمام زبون على الطاولة أسوأ بكثير من قائمة
         * تظهر خارج وقتها.
         */
        const inWindow = active.filter((m) => inTimeWindow(m.window_from, m.window_to));
        const menus = inWindow.length ? inWindow : active;
        /**
         * ⚠️ الترشيح هنا **يعوّض `menu_id=in.(…)` الذي كان على الخادم**، ولا
         * يجوز أن يتساهل عنه: `getRestaurantDishes` تُعيد أطباق كل القوائم بما
         * فيها المعطّلة وخارج نافذتها، فبلا هذا السطر يرى الزبون أصنافاً أطفأها
         * التاجر. والترتيب محفوظ لأن الخادم رتّب أصلاً بـ`sort_order` ثم
         * `created_at`، و`filter` لا يعيد الترتيب.
         */
        const shown = new Set(menus.map((m) => m.id));
        // ⚠️ `menu_id` قابل لأن يكون `null` (صنف يتيم بلا قائمة)، و
        // `menu_id=in.(…)` على الخادم كان **يستبعده** — فالشرط هنا يستبعده
        // كذلك. إسقاط هذا الفحص كان سيُظهر للزبون أصنافاً لم يرها قطّ.
        const dishes = allDishes.filter((d) => d.menu_id !== null && shown.has(d.menu_id));
        document.title = `${restaurant.name} — المنيو`;
        setState({ status: "ready", restaurant, menus, dishes });
        // معاينات التاجر لا تُحتسب مشاهدات، وإلا لوّثت تحليلاته بنفسه.
        if (!tracked.current && menus[0] && !previewing) {
          tracked.current = true;
          trackMenuView(menus[0].id, restaurant.user_id, { table, lang });
        }
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, demo, wantsPreview]);

  const theme = getTheme(
    state.status === "ready" ? state.menus.find((m) => m.theme)?.theme : null
  );
  const design = theme.design;
  const rhythm = RHYTHM[design.density];

  /**
   * خطّ الطابع يُطلب هنا لا في `main.tsx`.
   *
   * لا يُنتظَر ولا يُحبس عليه العرض: الصفحة تظهر بخطّ احتياطي ثم تُبدَّل الحروف
   * عند وصوله (`font-display: swap` في حزم @fontsource). منيو محبوس على تنزيل
   * خطّ أسوأ من منيو يُقرأ بخطّ آخر لجزء من الثانية.
   */
  useEffect(() => {
    // الاثنان: خطّ النصّ وخطّ العناوين. طلبُ الأول وحده يترك عناوين الطابع
    // المقترن تُرسم بخطّ احتياطي بينما أسماء أطباقه سليمة — وهو أسوأ من
    // الاثنين احتياطيين لأنه يبدو خطأً لا اختياراً.
    void loadThemeFont(theme.vars["--m-font"]);
    void loadThemeFont(theme.vars["--m-display"]);
  }, [theme.vars]);
  /**
   * وسوم الصفحة وبياناتها المنظّمة.
   *
   * ⚠️ **المعاينة والديمو لا يُفهرَسان**: الأولى نسخة التاجر من منيوه، والثاني
   * مطعم لا وجود له. فهرستهما تنافس منيو التاجر الحقيقي على كلماته نفسها.
   */
  const seoRestaurant = state.status === "ready" ? state.restaurant : null;
  useSeo(
    seoRestaurant
      ? {
          title: demo
            ? `${seoRestaurant.name} — منيو تجريبي`
            : `منيو ${seoRestaurant.name}`,
          description: demo
            ? "جرّب منيو كلاود منيو الرقمي كما يراه زبونك تماماً."
            : [
                `منيو ${seoRestaurant.name} الرقمي`,
                seoRestaurant.type,
                seoRestaurant.address,
              ]
                .filter(Boolean)
                .join(" · ") +
              ". تصفّح الأصناف والأسعار والمعلومات الغذائية من جوّالك مباشرة.",
          path: demo ? undefined : `/${slug ?? ""}`,
          type: "restaurant",
          noindex: !!demo || preview,
        }
      : null
  );

  /**
   * `Restaurant` + `Menu` — وهو ما يفتح النتيجة الغنيّة للمطاعم في قوقل.
   *
   * الأصناف تُبثّ **بأسمائها وأسعارها الحقيقية** لا بعيّنة: هذا ما يجعل قوقل
   * يعرض «يقدّم: كبسة لحم · ٩٥ ر.س». و`prune` في `lib/seo.ts` يحذف كل حقل
   * لا نملك قيمته، فلا يخرج مخطّط نصفه فراغ.
   */
  useJsonLd(
    "restaurant",
    seoRestaurant && !demo && !preview && state.status === "ready"
      ? {
          "@context": "https://schema.org",
          "@type": "Restaurant",
          name: seoRestaurant.name,
          url: absoluteUrl(`/${slug ?? ""}`),
          image: seoRestaurant.logo_image || seoRestaurant.banner_image || undefined,
          servesCuisine: seoRestaurant.type || undefined,
          telephone: seoRestaurant.phone || undefined,
          address: seoRestaurant.address
            ? { "@type": "PostalAddress", addressCountry: "SA", streetAddress: seoRestaurant.address }
            : undefined,
          // العملة صريحة: رقمٌ بلا عملة لا يُقرأ سعراً.
          currenciesAccepted: "SAR",
          hasMenu: {
            "@type": "Menu",
            name: state.menus[0]?.name || "المنيو",
            inLanguage: "ar",
            hasMenuSection: Object.entries(
              state.dishes.reduce<Record<string, typeof state.dishes>>((acc, d) => {
                const key = d.category?.trim() || "أصناف";
                (acc[key] ??= []).push(d);
                return acc;
              }, {})
            ).map(([section, items]) => ({
              "@type": "MenuSection",
              name: section,
              hasMenuItem: items.map((d) => ({
                "@type": "MenuItem",
                name: d.name,
                description: d.description || undefined,
                offers: { "@type": "Offer", price: d.price, priceCurrency: "SAR" },
                nutrition:
                  d.calories != null
                    ? { "@type": "NutritionInformation", calories: `${d.calories} calories` }
                    : undefined,
              })),
            })),
          },
        }
      : null
  );

  const season = getSeason(state.status === "ready" ? state.restaurant.season : null);
  // الزينة تُبدّل الزخرفة ولون التمييز الثانوي فقط — الخلفية والنص يبقيان
  // كما ضبطهما الطابع، فلا ينكسر التباين مهما اختار التاجر.
  const pagePattern = season?.pattern ?? design.pattern;

  const en = lang === "en";

  /**
   * السلة تُستدعى بلا شرط (قاعدة الخطّافات) وتبقى معطّلة حتى يفتح التاجر الدفع
   * الإلكتروني — والغالبية العظمى من المنيوهات لن تراها إطلاقاً.
   */
  const paymentOn =
    state.status === "ready" && state.restaurant.online_payment_enabled === true;
  /**
   * المسار الثاني: الطلب نصّاً على واتساب المطعم.
   *
   * شرطان معاً — المفتاح مُشغَّل **ورقم محفوظ**. مفتاحٌ بلا رقم يعرض زرّاً
   * يفتح فراغاً، وهذا أسوأ من غياب الميزة.
   */
  const waNumber =
    state.status === "ready" &&
    state.restaurant.whatsapp_orders_enabled === true &&
    state.restaurant.social_whatsapp?.trim()
      ? state.restaurant.social_whatsapp.trim()
      : null;
  const cart = useCart(
    state.status === "ready" ? state.restaurant.id : "",
    paymentOn || waNumber !== null
  );
  const cartOn = cart.enabled;

  // الدفع نجح ⇒ السلة أدّت غرضها. الإلغاء لا يمسّها: الزبون قد يعيد المحاولة.
  useEffect(() => {
    if (orderResult === "paid") cart.clear();
  }, [orderResult, cart.clear]);

  /**
   * بكسلات التاجر — في صفحة المنيو وحدها، وبعد استقرار البيانات.
   *
   * تُستثنى المعاينة والديمو: التاجر يتصفّح منيوه فلا يجوز أن يُحسب زبوناً في
   * إحصاءات إعلانه، تماماً كما لا يُحسب في مشاهداته (`trackMenuView`).
   */
  useEffect(() => {
    if (state.status !== "ready" || demo || preview) return;
    const r = state.restaurant;
    installPixels({
      meta: r.meta_pixel_id?.trim() || null,
      ga: r.ga_measurement_id?.trim() || null,
      snap: r.snap_pixel_id?.trim() || null,
    });
  }, [state, demo, preview]);

  const dishById = useMemo(
    () =>
      new Map(
        state.status === "ready" ? state.dishes.map((d) => [d.id, d] as const) : []
      ),
    [state]
  );
  const cartTotal = cart.lines.reduce((sum, l) => {
    const dish = dishById.get(l.dish_id);
    return dish ? sum + unitPrice(dish, l.option_ids) * l.qty : sum;
  }, 0);

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
    // ترتيب التاجر لا ترتيب أول ظهور لطبق (كان «الحلويات» قد تسبق «المقبلات»
    // لمجرّد أن أول طبق مضاف كان حلوى).
    const order = parseCategoryOrder(state.restaurant.category_order);
    return {
      featured: q ? [] : visible.filter((d) => d.featured),
      categories: sortCategories([...byCat.keys()], order).map((name) => ({
        name,
        dishes: byCat.get(name)!,
      })),
    };
  }, [state, search, en]);

  /**
   * تتبّع القسم الظاهر أثناء التمرير.
   *
   * كان `activeCat` يُضبط عند الضغط فقط، فيبرز الشريط قسماً لا يقف عنده الزبون
   * — أوضح سبب للإحساس بالضياع في منيو طويل. الهامش العلوي بقدر ارتفاع الشريط
   * كي يتبدّل القسم عند وصوله للشريط لا عند خروجه من الشاشة.
   */
  const catNames = categories.map((c) => c.name).join("|");
  useEffect(() => {
    if (!catNames) return;
    const navH = navRef.current?.offsetHeight ?? 48;
    setNavHeight(navH);
    const sections = catNames
      .split("|")
      .map((n) => document.getElementById(categoryId(n)))
      .filter((el): el is HTMLElement => !!el);
    if (!sections.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        // أعلى قسم متقاطع مع منطقة الرؤية تحت الشريط هو القسم الحالي.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target.id) {
          const name = sections.find((s) => s.id === visible.target.id)?.dataset.cat;
          if (name) setActiveCat(name);
        }
      },
      { rootMargin: `-${navH + 8}px 0px -70% 0px`, threshold: 0 }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [catNames]);

  /** الشريحة النشطة تُمرَّر إلى داخل الرؤية — في منيو بعشرة أقسام تكون خارجها. */
  useEffect(() => {
    if (!activeCat) return;
    catRefs.current[activeCat]?.scrollIntoView({
      behavior: "smooth",
      inline: "nearest",
      block: "nearest",
    });
  }, [activeCat]);

  /** زر «لأعلى» بعد شاشتين — منيو بستة أقسام يحتاجه. */
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > window.innerHeight * 2);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  // المطعم موجود لكن الاشتراك غير نشط — رسالة محترمة للزبون، ودعوة للتاجر.
  if (state.status === "unpublished") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-5 text-center">
        <span className="text-6xl">🔒</span>
        <h1 className="font-display text-2xl font-black text-ink">{state.name}</h1>
        <p className="max-w-sm text-sm text-dim">
          هذا المنيو غير متاح حالياً. إن كنت صاحب المطعم، فعّل اشتراكك ليعود
          المنيو للعمل فوراً.
        </p>
        <Link
          to="/login"
          className="mt-1 rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-on-gold"
        >
          دخول التجّار
        </Link>
        <Link to="/" className="text-sm font-bold text-gold hover:underline">
          → كلاود منيو
        </Link>
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

  /**
   * التقييم والموقع يصعدان أعلى الصفحة.
   *
   * كانا في الذيل بعد الأطباق كلها، والزبون يغادر قبل أن يصل إليه — وتقييم
   * قوقل أرخص قناة نمو للمطعم. وهما محذوفان من `socials` أدناه كي لا يتكرّرا.
   */
  const primaryLinks = [
    // `reviews_enabled !== false` لا `=== true`: الصفوف القديمة تحمل `null`
    // والافتراضي في القاعدة `true` — فمن لم يلمس المفتاح قطّ يبقى زرّه ظاهراً
    // كما كان. تشديدُها إلى `=== true` كان سيُطفئ الزرّ عن كل من سبق.
    restaurant.reviews_enabled !== false &&
      restaurant.google_review_url && {
      icon: "star" as const,
      label: en ? "Rate us on Google" : "قيّمنا على قوقل",
      url: httpUrl(restaurant.google_review_url),
    },
    restaurant.social_maps && {
      icon: "pin" as const,
      label: en ? "Find us" : "موقعنا",
      url: httpUrl(restaurant.social_maps),
    },
  ].filter(Boolean) as { icon: IconName; label: string; url: string }[];

  /**
   * ⚠️ شعارات المنصّات تبقى إيموجي عمداً: هي **علامات تجارية** يعرفها الزبون
   * بشكلها، ورسمُ تقريبٍ لها يجعلها أسوأ لا أفضل.
   */
  const socials = [
    restaurant.social_whatsapp && { icon: "💬", label: en ? "WhatsApp" : "واتساب", url: whatsappUrl(restaurant.social_whatsapp) },
    restaurant.social_instagram && { icon: "📸", label: en ? "Instagram" : "إنستغرام", url: httpUrl(restaurant.social_instagram) },
    restaurant.social_twitter && { icon: "𝕏", label: en ? "X (Twitter)" : "تويتر", url: httpUrl(restaurant.social_twitter) },
    restaurant.social_tiktok && { icon: "🎵", label: en ? "TikTok" : "تيك توك", url: httpUrl(restaurant.social_tiktok) },
    restaurant.social_snapchat && { icon: "👻", label: en ? "Snapchat" : "سناب شات", url: httpUrl(restaurant.social_snapchat) },
  ].filter(Boolean) as { icon: string; label: string; url: string }[];

  // كل المسببات الموجودة في المنيو، مع أطباق كل مسبب.
  const allergenIndex = buildAllergenIndex(state.dishes, en);

  // ساعات العمل: جدول مهيكل إن وُجد، وإلا نصّ حر يُعرض كما هو.
  const week = parseWeek(restaurant.working_hours);
  const live = week ? openState(week, en, new Date(nowTick)) : null;
  const todayId = riyadhTodayId(new Date(nowTick));

  return (
    <div
      dir={en ? "ltr" : "rtl"}
      // أصناف الخامة: العمق واللمعة والحافة تُشتقّ في CSS من `--m-*` نفسها.
      className={cn("min-h-dvh pb-16", skinClass(design))}
      style={
        {
          ...theme.vars,
          ...(season ? { "--m-accent-2": season.tint } : {}),
          // زخرفة الطابع تسري على الصفحة كلها بشفافية منخفضة — حضور بلا مزاحمة
          // للنص. `background-attachment: fixed` يجعلها تبدو نسيجاً لا خلفية.
          backgroundColor: "var(--m-bg)",
          backgroundImage: patternImage(
            pagePattern,
            season?.tint ?? theme.vars["--m-accent"],
            Math.max(design.patternOpacity, season ? 0.05 : 0)
          ),
          backgroundSize: PATTERN_SIZE[pagePattern],
          backgroundAttachment: "fixed",
          color: "var(--m-text)",
        } as CSSProperties
      }
    >
      {/* شريط المعاينة — يظهر لصاحب المطعم وحده، ولا يُحتسب في التحليلات.
          غير لاصق عمداً: شريط التصنيفات لاصق على top-0 أيضاً فيتراكبان. */}
      {preview && (
        <div
          dir="rtl"
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-xs font-black"
          style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
        >
          <span className="inline-flex items-center gap-1.5"><Icon name="eye" size={14} /> معاينة — هذا ما يراه الزبون. لا تُحتسب في مشاهداتك.</span>
          <Link to="/dashboard" className="underline underline-offset-2">
            ← عُد للوحة
          </Link>
        </div>
      )}

      {/* تهنئة الموسم — لمسة يضبطها التاجر، فوق الترويسة مباشرة. */}
      {season && (
        <div
          className="px-4 py-2 text-center text-sm font-black"
          style={{ background: "var(--m-bg-2)", color: season.tint }}
        >
          {season.emoji} {en ? season.greetingEn : season.greeting}
        </div>
      )}

      <MenuHeader restaurant={restaurant} theme={theme}>
        {table && (
          <span
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black"
            style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
          >
            <Icon name="tag" size={13} /> {en ? "Table" : "طاولة"} {table}
          </span>
        )}
        {/* ساعات العمل: **شريحة واحدة** تحمل الحالة الحيّة وتفتح جدول الأسبوع.
            كانت شريحتين («مفتوح الآن» + ملخّص الأسبوع) تزدحمان بلا داعٍ —
            الملخّص انتقل إلى داخل اللوح. */}
        {week ? (
          <button
            onClick={() => setHoursOpen(true)}
            className="inline-flex min-h-9 items-center rounded-full px-3 py-1 text-xs font-black transition-opacity hover:opacity-85"
            style={
              live?.open
                ? { background: "var(--m-accent)", color: "var(--m-on-accent)" }
                : { border: "1px solid var(--m-border)", color: "var(--m-muted)" }
            }
          >
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: live?.open ? "var(--m-accent)" : "var(--m-muted)" }}
            />{" "}
            {live?.label}
            {live?.open && live.until ? ` · ${en ? "until" : "حتى"} ${live.until}` : ""} ›
          </button>
        ) : (
          restaurant.working_hours && (
            <button
              onClick={() => setHoursOpen(true)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1 text-xs"
              style={{ borderColor: "var(--m-border)", color: "var(--m-muted)" }}
            >
              <Icon name="clock" size={13} /> {restaurant.working_hours} ›
            </button>
          )
        )}
        {/* مبدّل اللغة شريحة بين الشرائح — كان يحتلّ صفاً كاملاً وحده. */}
        {restaurant.english_enabled && (
          <div
            className="inline-flex overflow-hidden rounded-full border text-xs font-black"
            style={{ borderColor: "var(--m-border)" }}
          >
            {(["ar", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="min-h-9 px-3 py-1 transition-colors"
                style={
                  lang === l
                    ? { background: "var(--m-accent)", color: "var(--m-on-accent)" }
                    : { color: "var(--m-muted)" }
                }
              >
                {l === "ar" ? "ع" : "EN"}
              </button>
            ))}
          </div>
        )}
      </MenuHeader>

      <main className={cn("mx-auto max-w-3xl px-4", cart.count > 0 && "pb-24")}>
        {/* عودة الزبون من بوابة الدفع — أعلى شيء يراه، قبل الأطباق. */}
        {orderResult && (
          <OrderResult status={orderResult} en={en} onDismiss={() => setOrderResult(null)} />
        )}

        {/* التقييم والموقع — أعلى الصفحة حيث يراهما الزبون فعلاً. */}
        {primaryLinks.length > 0 && (
          <div className="mt-5 flex gap-2">
            {primaryLinks.map((s) => (
              <a
                key={s.label}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 px-4 py-3 text-sm font-black transition-transform hover:scale-[1.02]"
                style={{
                  background: "var(--m-accent)",
                  color: "var(--m-on-accent)",
                  borderRadius: "var(--m-radius)",
                }}
              >
                <Icon name={s.icon} size={15} /> {s.label}
              </a>
            ))}
          </div>
        )}

        {/* طبق اليوم — بطاقة واحدة كاملة بدل شريط بطاقات مقطوعة عند الحافة. */}
        {featured[0] && (
          <div className={rhythm.block}>
            <DishOfTheDay
              dish={featured[0]}
              en={en}
              onOpen={() => {
                setOpenDish(featured[0]);
                if (!demo && !preview) trackDishView(featured[0], { table, lang });
              }}
            />
          </div>
        )}

        {/* شريط التصنيفات + البحث في صف واحد لاصق.
            البحث كان يحتلّ صفاً كاملاً في الأعلى ويختفي عند التمرير؛ هنا يبقى
            في متناول اليد **أثناء التصفّح** ويوفّر كتلة كاملة قبل الأكل. */}
        {(categories.length > 1 || search) && (
          <nav
            ref={navRef}
            className={cn(
              "sticky top-0 z-30 -mx-4 flex items-center gap-2 px-4 py-2.5",
              rhythm.block
            )}
            style={{
              // خلفية معتمة لا ضبابية وحدها: الضبابية فوق نقش السدو تُنتج طمشاً.
              background: "var(--m-bg)",
              borderBottom: "1px solid var(--m-border)",
            }}
          >
            <div className="flex flex-1 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categories.map((c) => (
                <a
                  key={c.name}
                  href={`#${categoryId(c.name)}`}
                  ref={(el) => { catRefs.current[c.name] = el; }}
                  className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors"
                  style={
                    activeCat === c.name
                      ? { background: "var(--m-accent)", color: "var(--m-on-accent)" }
                      : { background: "var(--m-surface)", color: "var(--m-muted)" }
                  }
                >
                  {/* الرمز يرث لون الشريحة عبر `currentColor` — وهذا ما لا
                      يفعله الإيموجي: كان `💛` أصفر فوق كل طابع من الستّة عشر. */}
                  <Icon name={categoryIcon(c.name)} size={15} />
                  {c.name}
                </a>
              ))}
            </div>

            {searchOpen || search ? (
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onBlur={() => !search && setSearchOpen(false)}
                placeholder={en ? "Search…" : "ابحث…"}
                aria-label={en ? "Search the menu" : "ابحث في المنيو"}
                className="min-h-11 w-28 shrink-0 rounded-full border bg-transparent px-3 py-1.5 text-sm sm:w-40"
                style={{
                  borderColor: "var(--m-border)",
                  background: "var(--m-surface)",
                  color: "var(--m-text)",
                }}
              />
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                aria-label={en ? "Search the menu" : "ابحث في المنيو"}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border"
                style={{ borderColor: "var(--m-border)", color: "var(--m-muted)" }}
              >
                <Icon name="search" size={16} />
              </button>
            )}
          </nav>
        )}

        {/* الأقسام */}
        {categories.length === 0 ? (
          <div
            className={cn(rhythm.section, "mx-auto max-w-sm border px-5 py-10 text-center")}
            style={{
              borderColor: "var(--m-border)",
              background: "var(--m-surface)",
              borderRadius: "var(--m-radius)",
            }}
          >
            <Icon name={search ? "search" : "plate"} size={34} className="mx-auto" strokeWidth={1.4} />
            <p className="mt-2 text-sm font-bold" style={{ color: "var(--m-text)" }}>
              {search
                ? en
                  ? "No results for your search."
                  : "لا نتائج لبحثك."
                : en
                  ? "No items available yet."
                  : "لا توجد أصناف متاحة حالياً."}
            </p>
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setSearchOpen(false);
                }}
                className="mt-3 rounded-full px-4 py-1.5 text-xs font-black"
                style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
              >
                {en ? "Clear search" : "امسح البحث"}
              </button>
            )}
          </div>
        ) : (
          categories.map((cat) => (
            <section
              key={cat.name}
              id={categoryId(cat.name)}
              data-cat={cat.name}
              className={rhythm.section}
              // هامش تمرير مربوط بارتفاع الشريط الفعلي — كان ثابتاً (scroll-mt-20)
              // بينما ارتفاع الشريط يتغيّر، فيختفي عنوان القسم خلفه عند الضغط.
              style={{ scrollMarginTop: `${navHeight + 12}px` }}
            >
              <SectionHeading name={cat.name} style={design.heading} />
              <div className={cn(LAYOUT_CLASS[design.layout], rhythm.gap)}>
                {cat.dishes.map((d, di) => (
                  /* الغلاف `relative` موجود دائماً كي لا يتغيّر شكل الشبكة بين
                     مطعم فتح الدفع ومطعم لم يفتحه — والزر وحده هو المشروط.
                     و`--i` ترتيب البطاقة في قسمها: منه يأتي تدرّج الدخول، بلا
                     حالة React ولا مراقب تقاطع. يُحدّ بستّة كي لا يتأخّر آخر
                     صنف في قسم من ثلاثين صنفاً ثانيةً كاملة. */
                  <div
                    key={d.id}
                    className={cn("relative", entranceClass(design))}
                    style={{ "--i": Math.min(di, 6) } as CSSProperties}
                  >
                    <DishCard
                      dish={d}
                      en={en}
                      design={design}
                      reserve={sectionReserve(cat.dishes, en)}
                      onOpen={() => { setOpenDish(d); if (!demo && !preview) trackDishView(d, { table, lang }); }}
                    />
                    {cartOn && Number(d.price ?? 0) > 0 && (
                      <AddToCartButton
                        label={en ? `Add ${d.name}` : `أضِف ${d.name}`}
                        onAdd={() => cart.add(d.id)}
                        className={design.layout === "list" ? "bottom-3 end-0" : "top-2 end-2"}
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))
        )}

        {/* ── التذييل ككتلة واحدة ─────────────────────────────────────
            كانت ست كتل متتالية بمحاذاات مختلفة تطفو بلا علاقة بينها.
            الآن تسلسل واحد بفواصل رفيعة وإيقاع `RHYTHM` نفسه. */}
        <div
          className={cn(rhythm.section, "border-t")}
          style={{ borderColor: "var(--m-border)" }}
        >
          {allergenIndex.length > 0 && (
            <button
              onClick={() => setAllergensOpen(true)}
              className={cn(
                rhythm.block,
                "mx-auto flex w-full max-w-md items-center justify-between gap-3 border px-4 py-3 text-start transition-transform hover:scale-[1.01]"
              )}
              style={{
                borderColor: "var(--m-border)",
                background: "var(--m-surface)",
                borderRadius: "var(--m-radius)",
              }}
            >
              <span>
                <span
                  className="flex items-center gap-1.5 text-sm font-black"
                  style={{ color: "var(--m-text)" }}
                >
                  <Icon name="warn" size={15} />
                  {en ? "Allergen guide" : "دليل مسببات الحساسية"}
                </span>
                <span className="mt-0.5 block text-xs" style={{ color: "var(--m-muted)" }}>
                  {en
                    ? `${allergenIndex.length} allergens across the menu`
                    : `${allergenIndex.length} مسبباً في هذا المنيو — اعرف أي طبق يحتويه`}
                </span>
              </span>
              <span style={{ color: "var(--m-accent)" }}>›</span>
            </button>
          )}

          {restaurant.loyalty_enabled && <LoyaltyCard restaurant={restaurant} en={en} />}

          {socials.length > 0 && (
            <div className={cn(rhythm.block, "flex flex-wrap items-center justify-center gap-2")}>
              {socials.map((s) => (
                <Chip key={s.label} href={s.url}>
                  {s.icon} {s.label}
                </Chip>
              ))}
            </div>
          )}

          {/* معلومات المطعم والضريبة — نصّ واحد متّسق بدل ثلاث كتل. */}
          <div
            className={cn(rhythm.block, "space-y-1 text-center text-xs leading-relaxed")}
            style={{ color: "var(--m-muted)" }}
          >
            {restaurant.address && (
              <p className="inline-flex items-center gap-1.5">
                <Icon name="pin" size={13} /> {restaurant.address}
              </p>
            )}
            {restaurant.phone && <p dir="ltr">📞 {restaurant.phone}</p>}
            {restaurant.allergens_text && <p>⚠️ {restaurant.allergens_text}</p>}
            {/* أرقام غربية و«%» — نفس اتفاقية formatPrice ونِسب التحليلات،
                وتتفادى إعادة ترتيب «٪» داخل نص RTL. */}
            <p>
              {restaurant.prices_include_vat === false
                ? en
                  ? "Prices exclude 15% VAT — it is added at checkout."
                  : "الأسعار غير شاملة ضريبة القيمة المضافة (تُضاف 15% عند الدفع)."
                : en
                  ? "All prices include 15% VAT."
                  : "جميع الأسعار شاملة ضريبة القيمة المضافة 15%."}
            </p>
            {restaurant.vat_number && (
              <p>
                {en ? "VAT number" : "الرقم الضريبي"}:{" "}
                <span dir="ltr">{restaurant.vat_number}</span>
              </p>
            )}
          </div>
        </div>

        {/* توقيع المنصة */}
        <footer className={cn(rhythm.section, "flex flex-col items-center gap-2 opacity-70")}>
          {/* التصغير على المحتوى لا على الرابط: `scale-90` على الرابط نفسه
              يصغّر منطقة اللمس معه (٤٤ ⇐ ٤٠). */}
          <Link to="/" className="inline-flex min-h-11 items-center">
            <span className="scale-90">
              <Logo />
            </span>
          </Link>
        </footer>
      </main>

      {/* «لأعلى» — منيو بستة أقسام يحتاجه؛ يظهر بعد شاشتين فقط.
          يرتفع فوق شريط السلة حين تكون مشغولة كي لا يتراكبا. */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label={en ? "Back to top" : "العودة لأعلى"}
          className={cn(
            "fixed end-5 z-40 flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105",
            cart.count > 0 ? "bottom-24" : "bottom-5"
          )}
          style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
        >
          ↑
        </button>
      )}

      {cartOn && (
        <CartBar count={cart.count} total={cartTotal} en={en} onOpen={() => setCartOpen(true)} />
      )}

      {cartOpen && (
        <MenuSheet title={en ? "Your order" : "طلبك"} onClose={() => setCartOpen(false)}>
          <CartReview
            cart={cart}
            dishById={dishById}
            en={en}
            restaurantId={restaurant.id}
            restaurantName={restaurant.name}
            payOn={paymentOn}
            whatsapp={waNumber}
            table={table}
            onClose={() => setCartOpen(false)}
          />
        </MenuSheet>
      )}

      {openDish && (
        <DishModal
          dish={openDish}
          en={en}
          cart={cartOn ? cart : null}
          onClose={() => setOpenDish(null)}
        />
      )}

      {hoursOpen && (
        <MenuSheet
          title={en ? "Opening hours" : "ساعات العمل"}
          onClose={() => setHoursOpen(false)}
        >
          {/* ملخّص الأسبوع انتقل إلى هنا من شريحة ثانية كانت تزدحم في الترويسة. */}
          {week && (
            <p className="mb-3 text-center text-sm font-bold" style={{ color: "var(--m-accent)" }}>
              {weekSummary(week, en)}
            </p>
          )}
          {!week && (
            <p className="text-center text-sm leading-relaxed" style={{ color: "var(--m-text)" }}>
              {restaurant.working_hours}
            </p>
          )}
          <ul className={week ? "flex flex-col gap-1.5" : "hidden"}>
            {DAYS.map((d) => {
              if (!week) return null;
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

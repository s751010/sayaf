/**
 * ترويسات الطوابع الخمسة التي **ليست واجهة متجر**.
 *
 * ═══ لماذا ترويسة لكلّ طابع لا ترويسة واحدة بألوان ═══
 *
 * المنيوهات الرقمية كلّها في السوق شكلٌ واحد: غلافٌ ثم شعارٌ ثم قائمة. ولونٌ
 * آخر على الشكل نفسه لا يجعل منيو المطعم يُتذكَّر. فهنا خمس **بُنى** مختلفة —
 * والزبون يعرف من أوّل نظرة أيّ مطعم فتح:
 *
 * - `PaperHead`       رأس فاتورة حرارية: الاسم، والتاريخ والساعة لحظة الفتح، بخطوطٍ متقطّعة.
 * - `LetterboardHead` لوحة حروف معلّقة فوق الكاونتر: حروفٌ بارزة على لبّاد مخدّد.
 * - `PosterHead`      ملصقٌ بحدٍّ أسود وظلٍّ مصمت، وتحته شريطٌ تجري فيه أقسام المنيو.
 * - `SignHead`        لافتة نيون على جدار طوب: الاسم أنبوبٌ يشتعل.
 * - `MastheadHead` ترويسة مجلّة: خطّان، وتاريخ اليوم، والاسم بالأميري كبيراً.
 * - `ArcadeHead`   أقواس روشان: الغلاف جدارٌ تنفتح أسفله أقواس، والشعار نافذة.
 *
 * والحركة كلّها في `styles/menu-skins.css` — CSS خالص، ولا تعمل إلا لمن يقبل الحركة.
 * وكلّ ما هنا يُلوَّن بـ`--m-*`، فيلبس لون علامة التاجر كما تلبسه واجهة المتجر.
 */
import { useState, type CSSProperties, type ReactNode } from "react";
import { SafeImage } from "@/components/ui";
import { patternImage, PATTERN_SIZE } from "@/lib/patterns";
import type { MenuTheme } from "@/lib/themes";
import { restaurantTypeLabel } from "@/lib/menuText";
import type { Restaurant } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Icon } from "@/lib/icons";
import { LogoMark } from "./LogoMark";

export interface HeadProps {
  restaurant: Restaurant;
  theme: MenuTheme;
  en: boolean;
  /** أسماء أقسام المنيو كاملةً (لا المصفّاة بالبحث) — يحتاجها شريط الملصقات وحده. */
  tags?: string[];
  /** ما يجلس في زاوية الترويسة العليا (مبدّل اللغة). */
  corner?: ReactNode;
  children?: ReactNode;
}

/**
 * زاوية الترويسة العليا في آخر السطر (يسار العربية، يمين الإنجليزية) — حيث
 * يبحث الزبون عن اللغة في كل تطبيق. كلّ ترويسةٍ `relative` لتحملها.
 */
export function Corner({ children, className }: { children?: ReactNode; className?: string }) {
  if (!children) return null;
  return <div className={cn("m-corner absolute end-3 top-3 z-20", className)}>{children}</div>;
}

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };
const muted: CSSProperties = { color: "var(--m-muted)" };
const ink = "var(--m-accent-ink, var(--m-accent))";

/** وقت الفتح بتوقيت الرياض — يُحسب مرّةً عند التركيب فلا يتبدّل والزبون يقرأ. */
function useOpenedAt(format: Intl.DateTimeFormatOptions, locale: string): string {
  const [text] = useState(() => {
    try {
      return new Intl.DateTimeFormat(locale, { timeZone: "Asia/Riyadh", ...format }).format(new Date());
    } catch {
      return "";
    }
  });
  return text;
}

function Chips({ children, className }: { children?: ReactNode; className?: string }) {
  if (!children) return null;
  return <div className={cn("m-chips flex flex-wrap items-center justify-center gap-2", className)}>{children}</div>;
}

/* ══ فاتورة ════════════════════════════════════════════════════════════ */

export function PaperHead({ restaurant, en, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const stamp = useOpenedAt(
    { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false },
    "en-GB"
  ).replace(",", "  ·");
  return (
    <header className="m-head m-head-paper relative px-5 pb-2 pt-10 text-center">
      <Corner>{corner}</Corner>
      <LogoMark
        restaurant={restaurant}
        size="mx-auto h-16 w-16"
        style={{ borderRadius: "9999px", background: "var(--m-bg-2)", boxShadow: "0 0 0 1px var(--m-border)" }}
        fallbackStyle={{ color: "var(--m-text)" }}
        letterSize="2rem"
      />
      <h1 className="m-title mt-3 text-[1.75rem] font-black leading-tight sm:text-[2rem]" style={display}>
        {restaurant.name}
      </h1>
      {typeLabel && (
        <p className="mt-0.5 text-[13px]" style={muted}>
          {typeLabel}
        </p>
      )}
      <p aria-hidden="true" className="m-dash mt-5" />
      <p className="mt-3 flex items-center justify-between gap-3 text-[12px] font-bold" style={muted}>
        <span>{en ? "Opened" : "وقت الفتح"}</span>
        <span dir="ltr" className="m-mono">{stamp}</span>
      </p>
      <p aria-hidden="true" className="m-dash mt-3" />
      <Chips className="mt-4">{children}</Chips>
    </header>
  );
}

/**
 * الباركود في ذيل الفاتورة — **مشتقٌّ من رابط المطعم** (FNV-1a) لا رسمٌ واحد
 * للجميع: كل مطعم باركوده، ويبقى هو نفسه في كل زيارة.
 */
function barsOf(code: string): number[] {
  let h = 0x811c9dc5;
  const out: number[] = [];
  for (let i = 0; i < 44; i++) {
    h ^= code.charCodeAt(i % Math.max(code.length, 1)) + i;
    h = Math.imul(h, 0x01000193) >>> 0;
    out.push(1 + (h % 3));
  }
  return out;
}

export function Barcode({ code, className }: { code: string; className?: string }) {
  const bars = barsOf(code || "menu");
  let x = 0;
  const rects = bars.map((w, i) => {
    const r = i % 2 === 0 ? <rect key={i} x={x} y={0} width={w} height={40} /> : null;
    x += w;
    return r;
  });
  return (
    <svg viewBox={`0 0 ${x} 40`} preserveAspectRatio="none" aria-hidden="true" className={className} fill="currentColor">
      {rects}
    </svg>
  );
}

/** ذيل الفاتورة: عدد الأصناف، والشكر، والباركود. */
export function ReceiptEnd({ count, code, en }: { count: number; code: string; en: boolean }) {
  return (
    <div className="m-receipt-end mt-12 text-center">
      <p aria-hidden="true" className="m-dash" />
      <p className="mt-3 flex items-center justify-between text-[13px] font-bold" style={{ color: "var(--m-text)" }}>
        <span>{en ? "Items on this menu" : "عدد الأصناف"}</span>
        <span dir="ltr" className="m-mono">
          {count}
        </span>
      </p>
      <p aria-hidden="true" className="m-dash mt-3" />
      <p className="mt-6 text-lg font-black" style={display}>
        {en ? "Thank you for visiting" : "شكراً لزيارتكم"}
      </p>
      <Barcode code={code} className="mx-auto mt-4 h-12 w-56" />
      <p dir="ltr" className="m-mono mt-1.5 text-[11px] tracking-[0.3em]" style={muted}>
        {code.toUpperCase()}
      </p>
    </div>
  );
}

/* ══ لوحة حروف ══════════════════════════════════════════════════════════ */

/**
 * لوحة الحروف التي يعلّقها الكافيه فوق الكاونتر: لبّادٌ أسود مخدّد، وحروفٌ
 * بيضاء بارزة، وقطعتا رمزٍ على جانبَي السطر كما تُباع مع اللوحة. الإطار
 * الخشبي والجدار حولها في `menu-skins.css` (`.m-paper`).
 */
export function LetterboardHead({ restaurant, en, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  return (
    <header className="m-head m-head-letter relative px-5 pb-2 pt-10 text-center">
      <Corner>{corner}</Corner>
      <LogoMark
        restaurant={restaurant}
        size="mx-auto h-[4.5rem] w-[4.5rem]"
        style={{ borderRadius: "9999px", background: "var(--m-bg-2)" }}
        fallbackStyle={{ color: ink }}
        letterSize="2.2rem"
      />
      <h1 className="m-title m-letters mt-5 text-[2.1rem] font-extrabold leading-[1.3] sm:text-[2.6rem]" style={display}>
        {restaurant.name}
      </h1>
      <p className="m-letters mt-2.5 inline-flex items-center gap-2.5 text-[13px] font-bold" style={{ color: ink }}>
        <Icon name="cup" size={15} />
        {typeLabel ?? (en ? "MENU" : "قائمة اليوم")}
        <Icon name="heart" size={14} />
      </p>
      <Chips className="mt-6">{children}</Chips>
    </header>
  );
}

/* ══ ملصقات ═════════════════════════════════════════════════════════════ */

/** نجمةٌ مسنّنة — زخرفة الملصقات. اثنا عشر رأساً، مرسومة لا إيموجي. */
export function Burst({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={className} style={style}>
      <path
        d="M20 1 23.6 10.5 33.4 6.6 29.5 16.4 39 20 29.5 23.6 33.4 33.4 23.6 29.5 20 39 16.4 29.5 6.6 33.4 10.5 23.6 1 20 10.5 16.4 6.6 6.6 16.4 10.5Z"
        fill="currentColor"
        stroke="var(--m-text)"
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * الشريط الجاري — أقسام المنيو نفسها تدور كشريط لاصقٍ مائل.
 *
 * نصفان متطابقان والمسار يُزاح نصفَ عرضه فيعود بلا قفزة. وكلّ نصفٍ يُكرَّر
 * حتى عشرة عناصر على الأقلّ: نصفٌ أقصر من الشاشة كان سيُظهر فجوةً قبل أن يلتفّ.
 * زخرفيٌّ (`aria-hidden`): الأقسام نفسها في شريط التصنيفات تحته.
 */
function Marquee({ items }: { items: string[] }) {
  const half: string[] = [];
  while (half.length < 10) half.push(...items);
  return (
    <div className="overflow-hidden py-4" aria-hidden="true">
      <div className="m-marquee">
        <div className="m-marquee-track">
          {[0, 1].map((h) => (
            <span key={h} className="m-marquee-half">
              {half.map((t, i) => (
                <span key={i} className="m-marquee-item">
                  {t}
                  <span className="m-marquee-sep">✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PosterHead({ restaurant, tags = [], corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  const ticker = tags.length ? tags : [restaurant.name];
  return (
    <header className="m-head m-head-poster relative pt-3">
      {/* داخل الملصق لا فوق حافّته: الزاوية مستديرة بقطر ١٫٧٥rem. */}
      <Corner className="end-7 top-7">{corner}</Corner>
      <div className="mx-auto max-w-3xl px-3">
        <div className="m-cover m-poster-cover relative overflow-hidden px-5 pb-9 pt-10 text-center">
          {banner ? (
            <SafeImage
              src={banner}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              wrapperClassName="hidden"
              fallback={<span />}
            />
          ) : (
            <>
              {/* النجمة الكبيرة في أوّل السطر: آخره لمبدّل اللغة. */}
              <Burst className="m-spin absolute -top-6 start-[-1.5rem] h-28 w-28" style={{ color: "var(--m-accent-2)" }} />
              <Burst className="absolute bottom-5 end-4 h-7 w-7" style={{ color: "var(--m-surface)" }} />
            </>
          )}
          <div className="relative">
            <LogoMark
              restaurant={restaurant}
              size="mx-auto h-20 w-20"
              style={{ borderRadius: "9999px", background: "var(--m-surface)" }}
              fallbackStyle={{ color: "var(--m-text)" }}
            />
            {/* لاله‌زار وزنٌ واحد أسودُ أصلاً: `font-normal` لا `font-black`،
                وإلا رسم المتصفّح سُمكاً مزيّفاً فوق سُمكه فتتلاصق الحروف. */}
            <h1 className="m-title m-die mt-5 text-[2.7rem] font-normal leading-[1.2] sm:text-[3.6rem]" style={display}>
              {restaurant.name}
            </h1>
            {typeLabel && <p className="m-tag mt-3 inline-block px-3.5 py-1 text-[13px] font-bold">{typeLabel}</p>}
          </div>
        </div>
      </div>
      <Marquee items={ticker} />
      <Chips className="mx-auto max-w-3xl px-4">{children}</Chips>
    </header>
  );
}

/* ══ نيون ══════════════════════════════════════════════════════════════ */

export function SignHead({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  return (
    <header className="m-head m-head-sign relative">
      <Corner>{corner}</Corner>
      <div className="m-cover m-brick relative flex min-h-[16rem] flex-col items-center justify-center overflow-hidden px-4 pb-10 pt-12 text-center sm:min-h-[18rem]">
        {banner && (
          <SafeImage
            src={banner}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-30"
            wrapperClassName="hidden"
            fallback={<span />}
          />
        )}
        <span aria-hidden="true" className="m-sign-glow pointer-events-none absolute inset-0" />
        <div className="relative">
          <LogoMark
            restaurant={restaurant}
            size="mx-auto h-16 w-16"
            style={{ borderRadius: "9999px", background: "var(--m-bg)" }}
            fallbackStyle={{ color: "var(--m-accent-2)" }}
            letterSize="2rem"
          />
          <h1 className="m-title m-neon mt-5 text-[2.4rem] font-bold leading-[1.2] sm:text-[3.4rem]" style={display}>
            {restaurant.name}
          </h1>
          {typeLabel && (
            <p className="m-neon-2 mt-3 text-xs font-bold">{typeLabel}</p>
          )}
        </div>
      </div>
      <Chips className="mx-auto mt-4 max-w-3xl px-4">{children}</Chips>
    </header>
  );
}

/* ══ مجلّة ═════════════════════════════════════════════════════════════ */

export function MastheadHead({ restaurant, en, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const today = useOpenedAt(
    { weekday: "long", day: "numeric", month: "long", year: "numeric" },
    en ? "en-GB" : "ar-SA-u-ca-gregory"
  );
  const banner = restaurant.banner_image?.trim();
  return (
    // ‏`pt-14` حين يجلس المبدّل في الزاوية: فوق الخطّين لا عليهما.
    <header className={cn("m-head m-head-masthead relative mx-auto max-w-3xl px-4", corner ? "pt-14" : "pt-8")}>
      <Corner className="end-4">{corner}</Corner>
      <div aria-hidden="true" className="m-rule-double" />
      <p className="flex items-center justify-between gap-3 py-2 text-[11px] font-bold" style={muted}>
        <span className="truncate">{typeLabel ?? (en ? "The menu" : "قائمة الطعام")}</span>
        <span className="shrink-0">{today}</span>
      </p>
      <div aria-hidden="true" className="h-px" style={{ background: "var(--m-text)" }} />

      <div className="flex flex-col items-center pt-7 text-center">
        {restaurant.logo_image?.trim() && (
          <LogoMark
            restaurant={restaurant}
            size="h-14 w-14"
            style={{ borderRadius: "0px", background: "var(--m-bg-2)", outline: "1px solid var(--m-text)", outlineOffset: "3px" }}
            letterSize="1.75rem"
          />
        )}
        <h1 className="m-title mt-3 text-[2.75rem] font-bold leading-[1.15] sm:text-[3.5rem]" style={display}>
          {restaurant.name}
        </h1>
      </div>

      {banner && (
        <SafeImage
          src={banner}
          alt=""
          className="m-img mt-6 aspect-[16/9] w-full object-cover"
          wrapperClassName="hidden"
          fallback={<span />}
        />
      )}
      <div aria-hidden="true" className="m-rule-double mt-6" />
      <Chips className="mt-4">{children}</Chips>
    </header>
  );
}

/* ══ روشان ═════════════════════════════════════════════════════════════ */

export function ArcadeHead({ restaurant, theme, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const { pattern } = theme.design;
  const banner = restaurant.banner_image?.trim();
  const onAccent = theme.vars["--m-on-accent"] ?? "#ffffff";
  const motif = patternImage(pattern, onAccent, 0.16);
  const cover: CSSProperties = {
    backgroundColor: "var(--m-accent)",
    backgroundImage: [motif, "linear-gradient(180deg, rgba(255,255,255,.10), rgba(0,0,0,.18))"]
      .filter((v) => v !== "none")
      .join(","),
    backgroundSize: pattern === "none" ? "auto" : `${PATTERN_SIZE[pattern]}, auto`,
  };
  return (
    <header className="m-head m-head-arcade relative">
      <Corner>{corner}</Corner>
      <div className="m-cover m-arcade relative h-40 w-full overflow-hidden sm:h-56" style={cover}>
        {banner && (
          <SafeImage
            src={banner}
            alt=""
            className="h-full w-full object-cover"
            wrapperClassName="hidden"
            fallback={<span />}
          />
        )}
      </div>
      <div className="mx-auto max-w-3xl px-4 text-center">
        <div className="relative -mt-[4.75rem] flex justify-center">
          <LogoMark
            restaurant={restaurant}
            size="h-[6.5rem] w-[5.25rem]"
            style={{
              // قوس نافذة: نصف دائرة فوق مستطيل — شكل الروشان لا مربّع التطبيق.
              borderRadius: "999px 999px 0.6rem 0.6rem",
              background: "var(--m-bg-2)",
              boxShadow: "0 0 0 4px var(--m-bg), 0 0 0 5px var(--m-border), 0 16px 30px -14px rgba(0,0,0,.45)",
            }}
            fallbackStyle={{ background: "linear-gradient(var(--m-surface), var(--m-surface)), var(--m-bg)", color: ink }}
          />
        </div>
        <h1 className="m-title mt-4 text-[2.1rem] font-bold leading-tight sm:text-[2.6rem]" style={display}>
          {restaurant.name}
        </h1>
        {typeLabel && (
          <p className="mt-1 text-sm" style={muted}>
            {typeLabel}
          </p>
        )}
        <Chips className="mt-4">{children}</Chips>
      </div>
    </header>
  );
}

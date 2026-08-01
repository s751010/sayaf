/**
 * بطاقة الطبق بثلاثة تخطيطات — هذا ما يجعل الفرق بين الطوابع **يُرى** لا يُقرأ.
 *
 * - `grid`     الشبكة الأصلية (عمودان/ثلاثة).
 * - `list`     صف بعرض الشاشة مع خط نقطي يقود إلى السعر، كمنيوهات المطاعم
 *              الراقية. بلا صورة ⇒ بلا مربّع فارغ: منيو التاجر الذي لم يرفع
 *              صوراً يبدو أنيقاً لا ناقصاً.
 * - `showcase` عمود واحد بصورة كبيرة — للكافيهات التي تبيع بالصورة.
 *
 * رموز مسببات الحساسية والسعرات موجودة في التخطيطات الثلاثة: ميزة قائمة لا
 * يجوز أن تختفي لأن التاجر بدّل شكل منيوه.
 */
import type { CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import { displayAllergens } from "@/lib/allergens";
import type { DishLayout } from "@/lib/themes";
import type { Dish } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

const mFont: CSSProperties = { fontFamily: "var(--m-font)" };

function name(d: Dish, en: boolean): string {
  return en && d.name_en ? d.name_en : d.name;
}
function desc(d: Dish, en: boolean): string | null {
  return en && d.description_en ? d.description_en : d.description;
}

function Price({ dish, big }: { dish: Dish; big?: boolean }) {
  return (
    <span
      className={big ? "text-base font-black" : "text-sm font-black"}
      style={{ color: "var(--m-accent)" }}
      dir="ltr"
    >
      {formatPrice(dish.price ?? 0)} <span className="text-[10px] font-bold">ر.س</span>
    </span>
  );
}

function Allergens({ dish, en }: { dish: Dish; en: boolean }) {
  const icons = displayAllergens(dish.allergens, en);
  if (!icons.length) return null;
  return (
    <div
      className="flex flex-wrap items-center gap-1"
      aria-label={en ? "Allergens" : "مسببات الحساسية"}
    >
      {icons.map((a) => (
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
  );
}

function Calories({ dish, en }: { dish: Dish; en: boolean }) {
  if (dish.calories == null) return null;
  return (
    <span className="text-[10px]" style={{ color: "var(--m-muted)" }}>
      🔥 {dish.calories} {en ? "cal" : "سعرة"}
    </span>
  );
}

export function DishCard({
  dish,
  en,
  layout,
  onOpen,
}: {
  dish: Dish;
  en: boolean;
  layout: DishLayout;
  onOpen: () => void;
}) {
  const surface: CSSProperties = {
    background: "var(--m-surface)",
    borderColor: "var(--m-border)",
    borderRadius: "var(--m-radius)",
  };

  /* ── قائمة رأسية أنيقة ─────────────────────────────────────────────── */
  if (layout === "list") {
    const hasImage = !!dish.image?.trim();
    return (
      <button
        onClick={onOpen}
        className="flex w-full items-start gap-3 border-b px-1 py-4 text-start transition-opacity hover:opacity-80"
        style={{ borderColor: "var(--m-border)" }}
      >
        {hasImage && (
          <SafeImage
            src={dish.image}
            alt={name(dish, en)}
            className="h-16 w-16 shrink-0 object-cover"
            wrapperClassName="h-16 w-16 shrink-0"
            style={{ borderRadius: "var(--m-radius)", background: "var(--m-bg-2)" } as CSSProperties}
            fallback={<span />}
          />
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span
              className="shrink-0 text-base font-bold leading-snug"
              style={{ color: "var(--m-text)", ...mFont }}
            >
              {name(dish, en)}
              {dish.featured && <span style={{ color: "var(--m-accent)" }}> ★</span>}
            </span>
            {/* الخط النقطي يقود العين من الاسم إلى السعر — تقليد المنيوهات الراقية. */}
            <span
              aria-hidden="true"
              className="mx-1 min-w-4 flex-1 translate-y-[-3px] border-b border-dotted"
              style={{ borderColor: "var(--m-border)" }}
            />
            <Price dish={dish} big />
          </span>
          {desc(dish, en) && (
            <span
              className="mt-1 block text-xs leading-relaxed"
              style={{ color: "var(--m-muted)" }}
            >
              {desc(dish, en)}
            </span>
          )}
          <span className="mt-1.5 flex items-center gap-2">
            <Allergens dish={dish} en={en} />
            <Calories dish={dish} en={en} />
          </span>
        </span>
      </button>
    );
  }

  /* ── عرض بصورة كبيرة ───────────────────────────────────────────────── */
  if (layout === "showcase") {
    return (
      <button
        onClick={onOpen}
        className="group flex w-full flex-col overflow-hidden border text-start transition-transform hover:-translate-y-0.5"
        style={surface}
      >
        <SafeImage
          src={dish.image}
          alt={name(dish, en)}
          className="aspect-[16/10] w-full object-cover"
          wrapperClassName="aspect-[16/10] w-full text-6xl"
          style={{ background: "var(--m-bg-2)" } as CSSProperties}
          fallback={
            <div
              className="flex aspect-[16/10] w-full items-center justify-center text-6xl"
              style={{ background: "var(--m-bg-2)" } as CSSProperties}
            >
              {dish.emoji ?? "🍽"}
            </div>
          }
        />
        <div className="flex flex-col gap-1.5 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-base font-bold" style={{ color: "var(--m-text)", ...mFont }}>
              {name(dish, en)}
              {dish.featured && <span style={{ color: "var(--m-accent)" }}> ★</span>}
            </p>
            <Price dish={dish} big />
          </div>
          {desc(dish, en) && (
            <p className="line-clamp-2 text-xs leading-relaxed" style={{ color: "var(--m-muted)" }}>
              {desc(dish, en)}
            </p>
          )}
          <div className="flex items-center gap-2 pt-0.5">
            <Allergens dish={dish} en={en} />
            <Calories dish={dish} en={en} />
          </div>
        </div>
      </button>
    );
  }

  /* ── الشبكة (الافتراضي) ────────────────────────────────────────────── */
  return (
    <button
      onClick={onOpen}
      className="group flex h-full flex-col overflow-hidden border text-start transition-transform hover:-translate-y-0.5"
      style={surface}
    >
      <SafeImage
        src={dish.image}
        alt={name(dish, en)}
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
        <p className="text-sm font-bold leading-snug" style={{ color: "var(--m-text)", ...mFont }}>
          {name(dish, en)}
          {dish.featured && <span style={{ color: "var(--m-accent)" }}> ★</span>}
        </p>
        {desc(dish, en) && (
          <p className="line-clamp-2 text-xs leading-relaxed" style={{ color: "var(--m-muted)" }}>
            {desc(dish, en)}
          </p>
        )}
        {/* سطر ميتا واحد: السعر في طرف، والتفاصيل الثانوية في الآخر.
            كانا صفّين منفصلين فتنافست خمسة عناصر على انتباه واحد. */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <Price dish={dish} />
          <span className="flex items-center gap-1.5 opacity-80">
            <Allergens dish={dish} en={en} />
            <Calories dish={dish} en={en} />
          </span>
        </div>
      </div>
    </button>
  );
}

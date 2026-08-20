/**
 * قِطَع صفحة المنيو الصغيرة — رقاقة، لوح منسدل، عنوان قسم، وثوابت الخطّ.
 *
 * ═══ لماذا مستقلّة عن `MenuPage.tsx` ═══
 *
 * ليست تقسيماً بالعدّ: هذه القطع **بلا حالة ولا شبكة**، تأخذ خصائصها وتعيد
 * عرضاً. وبقاؤها داخل صفحة من ألفي سطر كان يخلطها بمنطق التحميل والتتبّع
 * والسلّة، فيصعب أن يرى القارئ أيّها يمسّ البيانات وأيّها لا يمسّها.
 *
 * كلّها تُلوَّن بمتغيّرات `--m-*` (ثيم القائمة) لا بألوان اللوحة.
 */
import { useEffect, type CSSProperties, type ReactNode } from "react";
import { type CardReserve } from "@/components/menu/DishCard";
import type { DishLayout, HeadingStyle } from "@/lib/themes";
import { Icon } from "@/lib/icons";
import type { Dish } from "@/lib/types";

export const mFont: CSSProperties = { fontFamily: "var(--m-font)" };
/** خطّ العناوين — يسقط إلى خطّ النصّ لكل طابع بلا اقتران. */
export const dFont: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };


export function Chip({ children, onClick, href }: { children: ReactNode; onClick?: () => void; href?: string }) {
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
export function MenuSheet({
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
export function sectionReserve(dishes: Dish[], en: boolean): CardReserve {
  return {
    desc: dishes.some((d) =>
      (en && d.description_en ? d.description_en : d.description)?.trim()
    ),
    meta: dishes.some((d) => d.calories != null || !!d.allergens?.length),
  };
}

export const LAYOUT_CLASS: Record<DishLayout, string> = {
  grid: "grid grid-cols-2 sm:grid-cols-3",
  list: "flex flex-col",
  showcase: "grid grid-cols-1 sm:grid-cols-2",
};

export function SectionHeading({ name, style }: { name: string; style: HeadingStyle }) {
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

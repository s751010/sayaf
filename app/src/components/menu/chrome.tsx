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
import type { DishLayout } from "@/lib/themes";
import { Icon } from "@/lib/icons";
import type { Dish } from "@/lib/types";

export const mFont: CSSProperties = { fontFamily: "var(--m-font)" };

/**
 * خطّ اسم الطبق — خطّ القراءة، إلا أن يطلب الطابع غيره بـ`--m-name-font`
 * (المجلّة تكتب أسماء أطباقها بالأميري كعناوين مقالاتها). متغيّرٌ لا صنف:
 * الاسم يحمل خطّه في `style`، والمضمَّن يغلب أي قاعدة.
 */
export const nameFont: CSSProperties = { fontFamily: "var(--m-name-font, var(--m-font))" };

// خطّ العناوين (`--m-display`) انتقل مع عناوين الأقسام إلى `SectionHeading.tsx`.


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
 * مبدّل اللغة — **في زاوية الترويسة العليا** لا بين شرائح الاسم.
 *
 * كان شريحةً وسط الحالة والتقييم والموقع، فيُقرأ معلومةً عن المطعم لا أداةً
 * للزبون. والزاوية حيث يبحث عنه الزبون في كل تطبيق. وأرضيّته شبه معتمة مع
 * ضبابٍ خلفه: يجلس فوق غلافٍ بلون العلامة أو صورةٍ أو طوبٍ ويبقى مقروءاً.
 */
export function LangToggle({ lang, onChange }: { lang: "ar" | "en"; onChange: (l: "ar" | "en") => void }) {
  return (
    <div
      role="group"
      aria-label="اللغة / Language"
      className="m-lang inline-flex h-9 overflow-hidden rounded-full text-[13px] font-bold"
      style={{
        background: "color-mix(in srgb, var(--m-bg) 86%, transparent)",
        boxShadow: "0 0 0 1px var(--m-border), 0 8px 18px -10px rgba(0,0,0,.45)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      {(["ar", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => onChange(l)}
          aria-pressed={lang === l}
          className="min-w-10 px-3 transition-colors"
          style={lang === l ? { background: "var(--m-accent)", color: "var(--m-on-accent)" } : { color: "var(--m-text)" }}
        >
          {l === "ar" ? "ع" : "EN"}
        </button>
      ))}
    </div>
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
        className="m-sheet anim-fade-up max-h-[88dvh] w-full max-w-lg overflow-y-auto border p-5"
        style={{
          // ‏`backgroundColor` لا `background`: الاختصار المضمَّن يُعيد
          // `background-image` إلى لا شيء فيغلب خامة الطابع (كرافت المحمصة).
          // والحدّ من حبر الطابع لا من لون العلامة (`--m-line`، menu-skins.css).
          backgroundColor: "var(--m-bg-2)",
          borderColor: "var(--m-line, var(--m-border))",
          borderRadius: "calc(var(--m-radius) * 1.4)",
        }}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          {/* بخطّ عناوين الطابع — عنوان النافذة صوت المنيو لا خطّ القراءة. */}
          <h3 className="m-o-title text-lg font-black" style={{ color: "var(--m-text)" }}>
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
  grid: "m-dishes grid grid-cols-2 sm:grid-cols-3",
  list: "m-dishes m-list flex flex-col",
  showcase: "m-dishes grid grid-cols-1 sm:grid-cols-2",
  // العرض والتمرير والتمركز كلّها في `menu-skins.css` (`.m-deck`).
  deck: "m-dishes m-deck",
};

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
import { ChalkStroke } from "./SkinHeads";
import { Icon } from "@/lib/icons";
import type { Dish } from "@/lib/types";

export const mFont: CSSProperties = { fontFamily: "var(--m-font)" };

/**
 * خطّ اسم الطبق — خطّ القراءة، إلا أن يطلب الطابع غيره بـ`--m-name-font`
 * (المجلّة تكتب أسماء أطباقها بالأميري كعناوين مقالاتها). متغيّرٌ لا صنف:
 * الاسم يحمل خطّه في `style`، والمضمَّن يغلب أي قاعدة.
 */
export const nameFont: CSSProperties = { fontFamily: "var(--m-name-font, var(--m-font))" };

/**
 * خطّ العناوين — يسقط إلى خطّ النصّ لكل طابع لا يذكر `--m-display` (§18).
 *
 * ⚠️ **داخليّ لا مُصدَّر** (٢٠٢٦/٠٩/١١): تستعمله `SectionHeading` وأخواتها في
 * هذا الملفّ، ولا يستورده أحد من خارجه. وتصديرُ ثابتٍ لا مستهلك خارجيّ له
 * يُغري بنسخِه بدل استيراده — وهو ما حدث فعلاً لـ`mFont` في `DishCard`.
 *
 * ولا يُظنّ أن `--m-display` ميّت: `MenuHeader.tsx` يكتب نفس التعبير سطراً،
 * و`MenuPage.tsx` يحمّل الخطّ بـ`loadThemeFont(theme.vars["--m-display"])`.
 */
const dFont: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };


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
  grid: "m-dishes grid grid-cols-2 sm:grid-cols-3",
  list: "m-dishes m-list flex flex-col",
  showcase: "m-dishes grid grid-cols-1 sm:grid-cols-2",
  // العرض والتمرير والتمركز كلّها في `menu-skins.css` (`.m-deck`).
  deck: "m-dishes m-deck",
};


/**
 * عنوان القسم — ثلاثة لواجهة المتجر، وخمسة لكلٍّ منها طابعه:
 * `stars` سطر فاتورة منقّط · `chalk` رقعة بخطّ طباشير · `neon` أنبوب يتوهّج ·
 * `numeral` رقم القسم كبيراً كأبواب المجلّات · `cartouche` لوحة حجازية مشطوفة.
 */
export function SectionHeading({
  name,
  style,
  index = 0,
}: {
  name: string;
  style: HeadingStyle;
  /** ترتيب القسم — يحتاجه `numeral` وحده. */
  index?: number;
}) {
  const ink = "var(--m-accent-ink, var(--m-accent))";
  if (style === "stars") {
    return (
      <h2 className="m-h mb-4 flex items-center gap-3 text-[15px] font-black" style={{ ...dFont, color: "var(--m-text)" }}>
        <span aria-hidden="true" className="m-dots h-2 flex-1" />
        <span className="shrink-0">{name}</span>
        <span aria-hidden="true" className="m-dots h-2 flex-1" />
      </h2>
    );
  }
  if (style === "chalk") {
    return (
      <h2 className="m-h mb-5 text-center">
        <span className="m-write block text-[1.95rem] font-bold leading-[1.45]" style={{ ...dFont, color: ink }}>
          {name}
        </span>
        <ChalkStroke className="mx-auto h-2.5 w-28" style={{ color: "var(--m-text)" }} />
      </h2>
    );
  }
  if (style === "neon") {
    return (
      <h2 className="m-h mb-4 flex items-center gap-3 text-[1.4rem] font-bold" style={dFont}>
        <span className="m-neon-2 shrink-0">{name}</span>
        <span aria-hidden="true" className="m-tube h-[2px] flex-1 rounded-full" />
      </h2>
    );
  }
  if (style === "numeral") {
    // ⚠️ «01» بالأرقام الغربية في اللغتين: الصفر الهندي «٠» نقطةٌ صغيرة، فكان
    // «٠١» يُقرأ «١» ومعه نقطةٌ شاردة. والأسعار في المنيو كلّه بالغربية أصلاً.
    const n = String(index + 1).padStart(2, "0");
    return (
      <div className="m-h mb-5">
        <div className="flex items-end gap-3">
          <span
            aria-hidden="true"
            className="m-numeral text-[3.4rem] font-bold leading-[0.85]"
            style={{ ...dFont, color: ink }}
          >
            {n}
          </span>
          <h2 className="pb-1 text-[1.65rem] font-bold leading-tight" style={{ ...dFont, color: "var(--m-text)" }}>
            {name}
          </h2>
        </div>
        <span aria-hidden="true" className="m-grow mt-3 block h-[2px]" style={{ background: "var(--m-text)" }} />
      </div>
    );
  }
  if (style === "cartouche") {
    return (
      <div className="m-h relative mb-5 flex items-center justify-center">
        <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px" style={{ background: "var(--m-border)" }} />
        <h2
          className="m-cartouche relative px-8 py-1.5 text-lg font-bold"
          style={{ ...dFont, background: "var(--m-accent)", color: "var(--m-on-accent)" }}
        >
          {name}
        </h2>
      </div>
    );
  }
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
        <span aria-hidden="true" style={{ color: ink }}>
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

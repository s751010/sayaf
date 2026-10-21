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
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { type CardReserve } from "@/components/menu/DishCard";
import type { DishLayout, HeadingStyle } from "@/lib/themes";
import { SafeImage } from "@/components/ui";
import { Burst } from "./SkinHeads";
import { Icon, type IconName } from "@/lib/icons";
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
        className="m-sheet anim-fade-up max-h-[88dvh] w-full max-w-lg overflow-y-auto border p-5"
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
 * غلاف القسم: صورةٌ من أطباقه — **المميّز أوّلاً ثم أوّل طبقٍ بصورة**.
 *
 * لا عمود جديد ولا رفعٌ آخر: التاجر الذي صوّر أطباقه يجد لكلّ قسمٍ غلافاً
 * تلقائياً، ويغيّره بتمييز طبقٍ آخر. وبلا صورة يُرسم الغلاف (الملصقات) أو
 * يغيب (المجلّة) — لا مربّع فارغ.
 */
export interface SectionCover {
  src: string;
  /** اسم الطبق في الصورة — تعليق المجلّة تحتها. */
  caption: string;
}

export function sectionCover(dishes: Dish[], en: boolean): SectionCover | null {
  const d = dishes.find((x) => x.featured && x.image?.trim()) ?? dishes.find((x) => x.image?.trim());
  if (!d?.image) return null;
  return { src: d.image, caption: en && d.name_en ? d.name_en : d.name };
}

/**
 * صورة المجلّة الافتتاحية بتعليقها. مكوّنٌ لا `SafeImage`: صورةٌ تفشل يجب أن
 * يغيب معها تعليقها، وإلا بقي «في الصورة: …» تحت لا صورة.
 */
function Opener({ cover, en }: { cover: SectionCover; en: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [cover.src]);
  if (failed) return null;
  return (
    <figure className="m-opener mt-5">
      <img
        src={cover.src}
        alt={cover.caption}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="m-img aspect-[21/9] w-full object-cover"
        style={{ background: "var(--m-bg-2)" }}
      />
      <figcaption className="mt-2.5 text-[12px]" style={{ color: "var(--m-muted)" }}>
        {en ? "Pictured: " : "في الصورة: "}
        {cover.caption}
      </figcaption>
    </figure>
  );
}

/** ألوان ملصقات الأقسام بالتناوب — من الطابع لا مكتوبة، فتلبس لون العلامة. */
const POSTER_TONES = ["var(--m-accent-2)", "var(--m-accent)", "var(--m-bg-2)"];

/**
 * عنوان القسم — ثلاثة لواجهة المتجر، وستّة لكلٍّ منها طابعه:
 * `stars` سطر فاتورة منقّط · `letters` حروف لوحةٍ بين قطعتَي رمز · `poster`
 * ملصقٌ بغلاف القسم · `neon` أنبوب يتوهّج · `numeral` رقم القسم كبيراً كأبواب
 * المجلّات (وصورةٌ افتتاحية إن وُجدت) · `cartouche` لوحة حجازية مشطوفة.
 */
export function SectionHeading({
  name,
  style,
  index = 0,
  icon = "plate",
  cover = null,
  en = false,
}: {
  name: string;
  style: HeadingStyle;
  /** ترتيب القسم — للرقم في المجلّة ولتناوب ألوان الملصقات. */
  index?: number;
  /** رمز القسم من `categoryIcon` — قطعتا اللوحة ورسم الملصق. */
  icon?: IconName;
  cover?: SectionCover | null;
  en?: boolean;
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
  if (style === "letters") {
    return (
      <h2
        className="m-h m-letters mb-5 flex items-center justify-center gap-3 text-[1.2rem] font-extrabold"
        style={{ ...dFont, color: ink }}
      >
        <Icon name={icon} size={17} />
        {name}
        <Icon name={icon} size={17} />
      </h2>
    );
  }
  if (style === "poster") {
    // بلا صورة: رمز القسم كبيراً بحدّ الحبر ونجمتان — ملصقٌ مرسوم لا فراغ.
    const art = (
      <span aria-hidden="true" className="m-poster-art absolute inset-0">
        <Icon name={icon} size={92} strokeWidth={1.3} className="m-poster-icon absolute" />
        <Burst className="absolute top-4 start-5 h-8 w-8" style={{ color: "var(--m-surface)" }} />
        <Burst className="absolute bottom-6 end-[38%] h-5 w-5" style={{ color: "var(--m-surface)" }} />
      </span>
    );
    return (
      <div className="m-h m-poster relative mb-5 overflow-hidden" style={{ backgroundColor: POSTER_TONES[index % POSTER_TONES.length] }}>
        {cover ? (
          <SafeImage
            src={cover.src}
            alt=""
            className="m-poster-img absolute inset-0 h-full w-full object-cover"
            wrapperClassName="absolute inset-0"
            fallback={art}
          />
        ) : (
          art
        )}
        <h2 className="m-poster-label" style={dFont}>
          {name}
        </h2>
      </div>
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
        {/* الصورة الافتتاحية — كما تفتح المجلّة بابها بصورةٍ وتعليقٍ تحتها. */}
        {cover && <Opener cover={cover} en={en} />}
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

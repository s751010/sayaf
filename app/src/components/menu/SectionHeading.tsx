/**
 * عنوان القسم — **لكلّ طابعٍ شكله، ولأكثرها غلافٌ من صور القسم**.
 *
 * ═══ لماذا ملفٌّ وحده ═══
 *
 * كان ثلاثة أشكال (خطّ · زخرفة · سطر) في `chrome.tsx`. ثم صار لكلّ طابعٍ
 * عنوانه — فاتورةٌ منقّطة، ولوحة حروف، وملصق، ولافتة نيون، وباب مجلّة، ونافذة
 * روشان، ولوحةٌ مذهّبة، وشريط سدو، وعنوانٌ عريض — فصار أكبر من أن يسكن بين
 * الرقاقة واللوح المنسدل.
 *
 * ═══ الغلاف ═══
 *
 * صورةٌ من أطباق القسم نفسه (`sectionCover`): لا عمود ولا رفع. وكلّ شكلٍ يعرف
 * كيف يبدو **بلا صورة** — مرسوماً (ملصق · نافذة) أو مطبعياً (لوحة · عنوان) —
 * فمنيو التاجر الذي لم يصوّر أطباقه بعد لا يبدو ناقصاً.
 *
 * والحركة كلّها في `menu-skins.css` على أصناف هذا الملفّ.
 */
import { useState, type CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import { Icon, type IconName } from "@/lib/icons";
import { patternImage, PATTERN_SIZE } from "@/lib/patterns";
import { isSoldOut } from "@/lib/soldOut";
import type { HeadingStyle } from "@/lib/themes";
import type { Dish } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Burst } from "./SkinHeads";

/** خطّ العناوين — يسقط إلى خطّ النصّ لكل طابع لا يذكر `--m-display` (§18). */
const dFont: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };
const ink = "var(--m-accent-ink, var(--m-accent))";
const text: CSSProperties = { color: "var(--m-text)" };
const muted: CSSProperties = { color: "var(--m-muted)" };

/**
 * غلاف القسم: صورةٌ من أطباقه — **المميّز أوّلاً ثم أوّل طبقٍ بصورة**.
 * التاجر يغيّر غلاف القسم بتمييز طبقٍ آخر فيه.
 */
export interface SectionCover {
  src: string;
  /** اسم الطبق في الصورة — تعليق المجلّة تحتها. */
  caption: string;
}

export function sectionCover(dishes: Dish[], en: boolean): SectionCover | null {
  // ⚠️ **من المتاح وحده**: غلافٌ بصورة طبقٍ نفد (وتعليق المجلّة باسمه) يعلن عن
  // صنفٍ لا يُطلب اليوم — والمميّز النافد كان سيصير الغلاف لأنه مميّز.
  const shown = dishes.filter((x) => !isSoldOut(x));
  const d = shown.find((x) => x.featured && x.image?.trim()) ?? shown.find((x) => x.image?.trim());
  if (!d?.image) return null;
  return { src: d.image, caption: en && d.name_en ? d.name_en : d.name };
}

/** «5 أصناف» بقاعدة العدد العربية: واحد · مثنّى · ٣–١٠ جمع · ١١+ مفردٌ منصوب. */
export function itemsLabel(n: number, en: boolean): string {
  if (en) return n === 1 ? "1 item" : `${n} items`;
  if (n === 1) return "صنف واحد";
  if (n === 2) return "صنفان";
  if (n <= 10) return `${n} أصناف`;
  return `${n} صنفاً`;
}

/**
 * صورة الغلاف — وإن فشلت سقط العنوان إلى شكله بلا صورة. لا `SafeImage`:
 * الصورة تحمل معها تراكبها وإطارها وتعليقها، وكلّها يجب أن يغيب معها.
 */
function useCoverPhoto(cover: SectionCover | null) {
  const [failed, setFailed] = useState<string | null>(null);
  const photo = cover && failed !== cover.src ? cover : null;
  return { photo, onError: () => cover && setFailed(cover.src) };
}

function CoverImg({
  src,
  onError,
  className,
  style,
}: {
  src: string;
  onError: () => void;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <img
      src={src}
      // زخرفيّة: الطبق نفسه بصورته واسمه في القائمة تحتها.
      alt=""
      loading="lazy"
      decoding="async"
      onError={onError}
      className={cn("m-img block w-full object-cover", className)}
      style={{ background: "var(--m-bg-2)", ...style }}
    />
  );
}

/** ألوان ملصقات الأقسام بالتناوب — من الطابع لا مكتوبة، فتلبس لون العلامة. */
const POSTER_TONES = ["var(--m-accent-2)", "var(--m-accent)", "var(--m-bg-2)"];

/** قوس نافذة الروشان العريض: نصف قطرٍ أفقيّ بنصف العرض، ورأسيّ أقصر منه. */
const WINDOW = "50% 50% 0.9rem 0.9rem / 46% 46% 0.9rem 0.9rem";

export function SectionHeading({
  name,
  style,
  index = 0,
  icon = "plate",
  cover = null,
  count = 0,
  palette,
  en = false,
}: {
  name: string;
  style: HeadingStyle;
  /** ترتيب القسم — للرقم في المجلّة ولتناوب ألوان الملصقات. */
  index?: number;
  /** رمز القسم من `categoryIcon`. */
  icon?: IconName;
  cover?: SectionCover | null;
  /** عدد أصناف القسم الظاهرة. */
  count?: number;
  /** لونا الطابع الفعليّان — الزخارف المرسومة (سدو · مشربية) صورٌ لا تقرأ `var()`. */
  palette?: { accent: string; onAccent: string };
  en?: boolean;
}) {
  const { photo, onError } = useCoverPhoto(cover);
  const items = count > 0 ? itemsLabel(count, en) : null;

  /* ── فاتورة: سطرٌ منقّط، وتحته العدد، وصورةٌ مطبوعة بالأبيض والأسود ── */
  if (style === "stars") {
    return (
      <div className="m-h mb-4">
        <h2 className="flex items-center gap-3 text-[15px] font-black" style={{ ...dFont, ...text }}>
          <span aria-hidden="true" className="m-dots h-2 flex-1" />
          <span className="shrink-0">{name}</span>
          <span aria-hidden="true" className="m-dots h-2 flex-1" />
        </h2>
        {items && (
          <p className="mt-1 text-center text-[11px]" style={muted}>
            {items}
          </p>
        )}
        {photo && <CoverImg src={photo.src} onError={onError} className="mt-3 aspect-[21/9]" />}
      </div>
    );
  }

  /* ── لوحة حروف: الاسم بين قطعتَي رمز ── */
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

  /* ── ملصقات: لوحةٌ عريضة بالصورة، أو مرسومةٌ برمز القسم ── */
  if (style === "poster") {
    const art = (
      <span aria-hidden="true" className="m-poster-art absolute inset-0">
        <Icon name={icon} size={92} strokeWidth={1.3} className="m-poster-icon absolute" />
        <Burst className="absolute top-4 start-5 h-8 w-8" style={{ color: "var(--m-surface)" }} />
        <Burst className="absolute bottom-6 end-[38%] h-5 w-5" style={{ color: "var(--m-surface)" }} />
      </span>
    );
    return (
      <div
        className="m-h m-poster relative mb-5 overflow-hidden"
        style={{ backgroundColor: POSTER_TONES[index % POSTER_TONES.length] }}
      >
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

  /* ── نيون: صورةٌ في إطار أنبوب، ورمز القسم لافتةٌ مضاءة ── */
  if (style === "neon") {
    return (
      <div className="m-h mb-5">
        {photo && (
          <div className="m-neon-frame relative mb-4 overflow-hidden">
            <CoverImg src={photo.src} onError={onError} className="aspect-[16/8]" />
            <span
              aria-hidden="true"
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, transparent 45%, rgba(0,0,0,.55))" }}
            />
          </div>
        )}
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="m-neon-icon shrink-0">
            <Icon name={icon} size={30} strokeWidth={1.6} />
          </span>
          <h2 className="m-neon-2 min-w-0 text-[1.4rem] font-bold leading-snug" style={dFont}>
            {name}
          </h2>
          <span aria-hidden="true" className="m-tube h-[2px] min-w-4 flex-1 rounded-full" />
          {items && (
            <span className="shrink-0 text-xs font-bold" style={muted}>
              {items}
            </span>
          )}
        </div>
      </div>
    );
  }

  /* ── مجلّة: رقم الباب كبيراً، والعدد في آخر السطر، وصورةٌ افتتاحية بتعليقها ── */
  if (style === "numeral") {
    // ⚠️ «01» بالأرقام الغربية في اللغتين: الصفر الهندي «٠» نقطةٌ صغيرة، فكان
    // «٠١» يُقرأ «١» ومعه نقطةٌ شاردة. والأسعار في المنيو كلّه بالغربية أصلاً.
    const n = String(index + 1).padStart(2, "0");
    return (
      <div className="m-h mb-5">
        <div className="flex items-end gap-3">
          <span aria-hidden="true" className="m-numeral text-[3.4rem] font-bold leading-[0.85]" style={{ ...dFont, color: ink }}>
            {n}
          </span>
          <h2 className="min-w-0 pb-1 text-[1.65rem] font-bold leading-tight" style={{ ...dFont, ...text }}>
            {name}
          </h2>
          {items && (
            <span className="ms-auto shrink-0 pb-2 text-[12px]" style={muted}>
              {items}
            </span>
          )}
        </div>
        <span aria-hidden="true" className="m-grow mt-3 block h-[2px]" style={{ background: "var(--m-text)" }} />
        {photo && (
          <figure className="m-opener mt-5">
            <CoverImg src={photo.src} onError={onError} className="aspect-[21/9]" />
            <figcaption className="mt-2.5 text-[12px]" style={muted}>
              {en ? "Pictured: " : "في الصورة: "}
              {photo.caption}
            </figcaption>
          </figure>
        )}
      </div>
    );
  }

  /* ── محمصة: بطاقة منشأ — رقم الدفعة، والاسم، ومسطرةٌ تمتلئ بعدد الأصناف ── */
  if (style === "origin") {
    // رقم الدفعة **ترتيب القسم** لا بيانٌ مختلَق، بأرقامٍ لاتينية كأرقام المجلّة.
    const batch = `#${String(index + 1).padStart(2, "0")}`;
    // المسطرة اثنتا عشرة شرطة، يُملأ منها بعدد أصناف القسم — مقياسٌ لا زينة.
    const fill = Math.min(Math.max(count, 0), 12) / 12;
    return (
      <div className="m-h m-origin mb-5">
        <div className="flex items-baseline gap-3">
          <span aria-hidden="true" className="m-batch m-mono shrink-0 text-[13px] font-bold" style={{ color: ink }}>
            {batch}
          </span>
          <h2 className="min-w-0 text-[1.35rem] font-extrabold leading-tight" style={{ ...dFont, ...text }}>
            {name}
          </h2>
          {items && (
            <span className="ms-auto shrink-0 text-[11px]" style={muted}>
              {items}
            </span>
          )}
        </div>
        <span
          aria-hidden="true"
          className="m-ruler mt-2.5 block"
          style={{ "--m-fill": fill } as CSSProperties}
        />
        {photo && (
          <div className="m-origin-photo relative mt-4">
            <CoverImg src={photo.src} onError={onError} className="aspect-[21/9]" />
            <span aria-hidden="true" className="m-batch-tag m-mono absolute end-2 top-2 px-1.5 py-0.5 text-[11px] font-bold">
              {batch}
            </span>
          </div>
        )}
      </div>
    );
  }

  /* ── روشان: نافذةٌ قوسية (صورةٌ أو مشربية برمز القسم)، واللوحة المشطوفة على عتبتها ── */
  if (style === "cartouche") {
    return (
      <div className="m-h mb-5">
        <div className="m-window relative overflow-hidden" style={{ borderRadius: WINDOW }}>
          {photo ? (
            <CoverImg src={photo.src} onError={onError} className="aspect-[16/9]" />
          ) : (
            <div
              aria-hidden="true"
              className="m-img flex aspect-[16/6] items-center justify-center"
              style={{
                backgroundColor: "var(--m-accent)",
                backgroundImage: palette ? patternImage("mashrabiya", palette.onAccent, 0.22) : undefined,
                backgroundSize: PATTERN_SIZE.mashrabiya,
                color: "var(--m-on-accent)",
              }}
            >
              <Icon name={icon} size={40} strokeWidth={1.5} />
            </div>
          )}
        </div>
        <div className="relative -mt-5 flex justify-center">
          <h2
            className="m-cartouche relative px-8 py-1.5 text-lg font-bold"
            style={{ ...dFont, background: "var(--m-accent)", color: "var(--m-on-accent)" }}
          >
            {name}
          </h2>
        </div>
        {items && (
          <p className="mt-1.5 text-center text-xs" style={muted}>
            {items}
          </p>
        )}
      </div>
    );
  }

  /* ── فاخر: لوحةٌ مذهّبة — صورةٌ سينمائية بإطارٍ ذهبيّ داخلي، أو عنوانٌ بين خطّين ── */
  if (style === "plaque") {
    return (
      <div className="m-h mb-6">
        {photo ? (
          <figure className="m-plaque-photo relative overflow-hidden" style={{ borderRadius: "var(--m-radius)" }}>
            <CoverImg src={photo.src} onError={onError} className="aspect-[16/8]" />
            <span
              aria-hidden="true"
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, rgba(0,0,0,.05) 30%, rgba(0,0,0,.8))" }}
            />
            <span aria-hidden="true" className="m-plaque-frame absolute inset-2.5" />
            <figcaption className="absolute inset-x-0 bottom-0 px-4 pb-5 text-center">
              <span aria-hidden="true" className="block text-sm" style={{ color: ink }}>
                ❖
              </span>
              <h2
                className="mt-1 text-[1.75rem] font-bold leading-tight text-white"
                // تعتيمٌ ثانٍ تحت الحروف نفسها: الأبيض على صورةٍ فاتحة كان يُقرأ
                // بالتدرّج وحده (ملاحظة الجودة ٢٦/١٠).
                style={{ ...dFont, textShadow: "0 1px 2px rgba(0,0,0,.55), 0 2px 18px rgba(0,0,0,.6)" }}
              >
                {name}
              </h2>
              {items && <p className="mt-0.5 text-xs text-white/75">{items}</p>}
            </figcaption>
          </figure>
        ) : (
          <div className="text-center">
            <div aria-hidden="true" className="flex items-center justify-center gap-3">
              <span className="m-plaque-line" />
              <span className="text-sm" style={{ color: ink }}>
                ❖
              </span>
              <span className="m-plaque-line" />
            </div>
            <h2 className="mt-2 text-[1.6rem] font-bold leading-tight" style={{ ...dFont, ...text }}>
              {name}
            </h2>
            {items && (
              <p className="mt-0.5 text-xs" style={muted}>
                {items}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ── تراثي: الاسم في نافذةٍ على شريط سدوٍ منسوج، والصورة فوقه ── */
  if (style === "sadu") {
    return (
      <div className="m-h mb-5">
        {photo && (
          <CoverImg
            src={photo.src}
            onError={onError}
            className="aspect-[16/8]"
            style={{ borderRadius: "var(--m-radius) var(--m-radius) 0 0" }}
          />
        )}
        {/* «طِرمة»: صفّ فتحات التهوية المثلّثة في جدار الطين النجدي فوق الشريط —
            خطافٌ يرسمه `menu-skins.css` (`.m-skin-najdi .m-vents`)، وبالصورة
            تحلّ محلّه الشُّرفات على حافّتها العليا. */}
        {!photo && <span aria-hidden="true" className="m-vents" />}
        <div
          className="m-sadu-band flex items-center justify-center py-2"
          style={{
            backgroundColor: "var(--m-bg-2)",
            backgroundImage: palette ? patternImage("sadu", palette.accent, 1) : undefined,
            backgroundSize: "44px 44px",
            backgroundPosition: "center",
            borderBlock: "2px solid var(--m-accent)",
          }}
        >
          <h2
            className="px-5 py-1 text-[1.15rem] font-bold"
            style={{ ...dFont, ...text, background: "var(--m-bg)", borderRadius: "999px", boxShadow: "0 0 0 2px var(--m-accent)" }}
          >
            {name}
          </h2>
        </div>
        {items && (
          <p className="mt-2 text-center text-xs" style={muted}>
            {items}
          </p>
        )}
      </div>
    );
  }

  /* ── عصري: عنوانٌ طباعيّ على الشبكة — خطٌّ مقيس، ورقم القسم، ومسطرة ──
   *
   * كان «عنواناً عريضاً بعدّاد» أو بطاقة صورةٍ والعنوان أبيض عليها — الشكل الذي
   * في كلّ تطبيق، والأبيض على صورةٍ فاتحة يُقرأ بالتعتيم وحده. الآن كما يُصفّ
   * عنوان بابٍ في منيو مطبوع: خطٌّ أسود بعرض العمود، وتحته رقم القسم في خليّةٍ
   * بلون العلامة ومسطرةٌ تمتدّ إلى العدد، ثم الاسم بأثقل وزن، **والصورة تحته لا
   * تحته الاسم** — فلا نصّ فوق صورةٍ أصلاً. */
  if (style === "bold") {
    const no = String(index + 1).padStart(2, "0");
    return (
      <div className="m-h m-h-type mb-5">
        <div className="m-type-rule flex items-start gap-3">
          <span
            aria-hidden="true"
            className="m-type-no m-o-num inline-flex h-6 min-w-[2rem] shrink-0 items-center justify-center px-1.5 text-xs font-black"
            style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
            dir="ltr"
          >
            {no}
          </span>
          <span aria-hidden="true" className="m-ticks mt-0 flex-1" />
          {items && (
            <span className="shrink-0 pt-1 text-xs font-bold" style={muted}>
              {items}
            </span>
          )}
        </div>
        <h2 className="mt-2 text-[1.75rem] font-black leading-[1.15]" style={{ ...dFont, ...text }}>
          {name}
        </h2>
        {photo && (
          <div className="m-bold-photo mt-3 overflow-hidden" style={{ borderRadius: "calc(var(--m-radius) * .5)" }}>
            <CoverImg src={photo.src} onError={onError} className="aspect-[16/9]" />
          </div>
        )}
      </div>
    );
  }

  /* ── الثلاثة الأولى: لطابع «لون علامتي» المحايد (`buildCustomTheme`) ── */
  if (style === "rule") {
    return (
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px flex-1" style={{ background: "var(--m-border)" }} />
        <h2 className="text-lg font-black" style={{ ...dFont, ...text }}>
          {name}
        </h2>
        <span className="h-px flex-1" style={{ background: "var(--m-border)" }} />
      </div>
    );
  }
  if (style === "ornament") {
    return (
      <h2 className="mb-3 flex items-center gap-2 text-lg font-black" style={{ ...dFont, ...text }}>
        <span aria-hidden="true" style={{ color: ink }}>
          ❖
        </span>
        {name}
        <span
          aria-hidden="true"
          className="h-px flex-1"
          style={{ background: "linear-gradient(90deg, var(--m-accent), transparent)" }}
        />
      </h2>
    );
  }
  return (
    <h2
      className="mb-3 inline-block border-b-2 pb-1 text-lg font-black"
      style={{ ...dFont, borderColor: "var(--m-accent)", ...text }}
    >
      {name}
    </h2>
  );
}

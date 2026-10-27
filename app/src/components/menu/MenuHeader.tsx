/**
 * ترويسة المنيو — **واجهة متجر لا رأس قائمة**.
 *
 * ═══ لماذا أُعيدت (٢٠٢٦/١٠/٢١) ═══
 *
 * كانت شعاراً في الوسط فوق تدرّجٍ مسطّح، وتحتها كومة شرائح وأزرار. فبلا شعار
 * مرفوع (حال أغلب التجّار في أوّل يوم) يظهر **صحنٌ رمادي** مكان هويّة المطعم،
 * والمنيو يبدأ تحت أوّل شاشة. والزبون الذي مسح الكود جاء ليأكل لا ليقرأ.
 *
 * الآن: غلافٌ بلون العلامة، والشعار على حافّته في أوّل السطر، ثم الاسم والحالة
 * — كصفحة متجرٍ في تطبيق. وبلا شعار **حرفٌ من اسم المطعم** بخطّ الطابع ولونه:
 * هويّةٌ تُقرأ، لا مكانٌ فارغ ينتظر صورة.
 */
import type { ComponentType, CSSProperties, ReactNode } from "react";
import { SafeImage } from "@/components/ui";
import { patternImage, PATTERN_SIZE } from "@/lib/patterns";
import { isDarkTheme, type HeaderShape, type MenuTheme } from "@/lib/themes";
import { restaurantTypeLabel } from "@/lib/menuText";
import type { Restaurant } from "@/lib/types";
import { LogoMark } from "./LogoMark";
import { ArcadeHead, AsirHead, BagHead, Corner, DukkanHead, LetterboardHead, MastheadHead, MudHead, PaperHead, PosterHead, SignHead, type HeadProps } from "./SkinHeads";

/** الترويسات التي بنيتها غير واجهة المتجر — لكلٍّ طابعه (`SkinHeads.tsx`). */
const SKIN_HEADS: Partial<Record<HeaderShape, ComponentType<HeadProps>>> = {
  paper: PaperHead,
  letterboard: LetterboardHead,
  poster: PosterHead,
  sign: SignHead,
  masthead: MastheadHead,
  arcade: ArcadeHead,
  mud: MudHead,
  bag: BagHead,
  tin: DukkanHead,
  mural: AsirHead,
};

/** قوس الروشان — لطابعٍ قديم قد يكون مخزَّناً بشكل `arch`. */
const ARCH_PATH = "M0 8 Q25 8 38 2 Q50 -3 62 2 Q75 8 100 8";

function ArchMask() {
  return (
    <svg
      viewBox="0 0 100 12"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="absolute inset-x-0 bottom-0 h-8 w-full"
    >
      <path d={`${ARCH_PATH} L100 12 L0 12 Z`} style={{ fill: "var(--m-bg)" }} />
    </svg>
  );
}

/** شريط السدو المنسوج — الطابع التراثي. */
function SaduBand({ color }: { color: string }) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-0 bottom-0 h-6"
      style={{
        backgroundColor: "var(--m-bg-2)",
        backgroundImage: patternImage("sadu", color, 1),
        backgroundSize: "52px 52px",
        backgroundPosition: "center",
        borderTop: "2px solid var(--m-accent)",
      }}
    />
  );
}

export function MenuHeader({
  restaurant,
  theme,
  en = false,
  tags,
  corner,
  children,
}: {
  restaurant: Restaurant;
  theme: MenuTheme;
  en?: boolean;
  /** أسماء الأقسام — للترويسات التي تعرضها (شريط الملصقات). */
  tags?: string[];
  /** ما يجلس في زاوية الترويسة العليا (مبدّل اللغة). */
  corner?: ReactNode;
  /** الشرائح أسفل الاسم (الحالة · الطاولة · اللغة · الروابط). */
  children?: ReactNode;
}) {
  const { header, pattern, patternOpacity } = theme.design;
  const Skin = SKIN_HEADS[header];
  if (Skin) {
    return (
      <Skin restaurant={restaurant} theme={theme} en={en} tags={tags} corner={corner}>
        {children}
      </Skin>
    );
  }
  // ⚠️ لون التمييز لا `cover_color`: الطابع مصبوغٌ بلون العلامة أصلاً حين يختاره
  // التاجر، و`cover_color` الداكن فوق طابع فاتح كان يرسم **غشاوة رمادية** أعلى المنيو.
  const accent = theme.vars["--m-accent"] ?? "#d4a843";
  const hasBanner = !!restaurant.banner_image?.trim();
  const framed = header === "frame";

  /**
   * الغلاف بلا صورة: **كتلةٌ بلون العلامة** وزخرفة الطابع فوقها بلون نصّها.
   *
   * ⚠️ كان تدرّجاً شفّافاً من لون التمييز فوق أرضية الصفحة — فعلى الطوابع
   * الفاتحة (والتمييز رماديّ أو أخضر) خرج **غشاوةً** لا غلافاً. الكتلة الصريحة
   * هي ما تفعله العلامات المعروفة: لونها أوّل ما يُرى.
   *
   * والاستثناء الطابع الداكن المؤطَّر (فاخر): غلافه داكنٌ بزخرفةٍ ذهبية —
   * كتلةٌ ذهبية بعرض الشاشة تصرخ حيث يجب أن يهمس.
   */
  const darkCover = framed && isDarkTheme(theme);
  const onAccent = theme.vars["--m-on-accent"] ?? "#ffffff";
  const sheen = "linear-gradient(160deg, rgba(255,255,255,.16) 0%, rgba(255,255,255,0) 45%, rgba(0,0,0,.16) 100%)";
  const motif = darkCover
    ? patternImage(pattern, accent, Math.min(patternOpacity + 0.06, 0.12))
    : patternImage(pattern, onAccent, 0.12);
  const cover: CSSProperties = darkCover
    ? {
        backgroundColor: "var(--m-bg-2)",
        backgroundImage: [motif, `radial-gradient(120% 120% at 100% 0%, ${accent}55 0%, transparent 58%)`]
          .filter((v) => v !== "none")
          .join(","),
        backgroundSize: pattern === "none" ? "auto" : `${PATTERN_SIZE[pattern]}, auto`,
      }
    : {
        backgroundColor: accent,
        backgroundImage: [motif, sheen].filter((v) => v !== "none").join(","),
        backgroundSize: pattern === "none" ? "auto" : `${PATTERN_SIZE[pattern]}, auto`,
      };

  /** إطار الشعار: مزدوجٌ مذهّب للطوابع الفاخرة، وحلقةٌ بلون الصفحة لغيرها. */
  const logoBox: CSSProperties = {
    borderRadius: framed ? "0.5rem" : "1.375rem",
    boxShadow: framed
      ? "0 0 0 2px var(--m-accent), 0 0 0 5px var(--m-bg), 0 14px 30px -12px rgba(0,0,0,.55)"
      : "0 0 0 4px var(--m-bg), 0 14px 30px -14px rgba(0,0,0,.45)",
    background: "var(--m-bg-2)",
  };
  const typeLabel = restaurantTypeLabel(restaurant.type);

  return (
    <header className="m-head relative">
      <Corner>{corner}</Corner>
      <div className="m-cover relative h-36 w-full overflow-hidden sm:h-52" style={cover}>
        {hasBanner && (
          <>
            <SafeImage
              src={restaurant.banner_image}
              alt=""
              // أكبر صورة فوق الطيّ — التحميل الكسول يؤخّرها حتى يحسب المتصفّح التخطيط.
              loading="eager"
              className="h-full w-full object-cover"
              wrapperClassName="h-full w-full"
              fallback={<span />}
            />
            {/* تعتيمٌ من الأسفل وحده: الصورة تبقى صورة، والحافّة تذوب في الصفحة. */}
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, transparent 45%, rgba(0,0,0,.28) 100%)" }}
            />
          </>
        )}
        {header === "arch" && <ArchMask />}
        {header === "band" && <SaduBand color={accent} />}
      </div>

      <div className="mx-auto max-w-3xl px-4">
        <div className="relative -mt-10 sm:-mt-12">
          <LogoMark
            restaurant={restaurant}
            size="h-[5.25rem] w-[5.25rem]"
            style={logoBox}
            // على غلافٍ بلون العلامة يُقلَب: حرفٌ بلونها على أرضية الصفحة، وإلا ذاب فيه.
            fallbackStyle={
              darkCover
                ? { background: "var(--m-accent)", color: "var(--m-on-accent)" }
                : { background: "linear-gradient(var(--m-surface), var(--m-surface)), var(--m-bg)", color: "var(--m-accent-ink, var(--m-accent))" }
            }
          />
        </div>

        <h1
          className="m-title mt-3 text-[1.65rem] font-black leading-tight"
          style={{ fontFamily: "var(--m-display, var(--m-font))", color: "var(--m-text)" }}
        >
          {restaurant.name}
        </h1>
        {typeLabel && (
          <p className="mt-1 text-sm" style={{ color: "var(--m-muted)" }}>
            {typeLabel}
          </p>
        )}

        {children && <div className="mt-4 flex flex-wrap items-center gap-2">{children}</div>}
      </div>
    </header>
  );
}

/**
 * ترويسة المنيو — «الخلفية وراء الشعار».
 *
 * كانت تدرّجاً لونياً مسطّحاً بين لونين إن لم يرفع التاجر صورة غلاف، فيبدو
 * المنيو ناقصاً لا مصمَّماً. الآن أربع معالجات حسب طابع الثيم، وكلها تعمل
 * **بلا صورة غلاف** — وهذه حالة أغلب التجّار في أول يوم.
 *
 * أُخرجت من `MenuPage.tsx` لأنها تجاوزت ألف سطر، وهذا القسم وحده يستحق ملفاً.
 */
import type { CSSProperties, ReactNode } from "react";
import { SafeImage } from "@/components/ui";
import { patternImage, PATTERN_SIZE } from "@/lib/patterns";
import type { MenuTheme } from "@/lib/themes";
import type { Restaurant } from "@/lib/types";
import { Icon } from "@/lib/icons";

/** منحنى قوس الروشان — يُستخدم للقصّ وللخط معاً كي لا ينحرفا. */
const ARCH_PATH = "M0 8 Q25 8 38 2 Q50 -3 62 2 Q75 8 100 8";

/**
 * قوس الروشان الحجازي.
 *
 * القصّ وحده لا يُرى: الاقتطاع بلون `--m-bg` بينما البانر يتدرّج إلى نفس اللون
 * ⇒ قوس غير مرئي. لذلك خط بلون التمييز يرسم المنحنى فوق الاقتطاع.
 */
function ArchMask() {
  return (
    <svg
      viewBox="0 0 100 12"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="absolute inset-x-0 bottom-0 h-10 w-full"
    >
      <path d={`${ARCH_PATH} L100 12 L0 12 Z`} style={{ fill: "var(--m-bg)" }} />
      <path
        d={ARCH_PATH}
        fill="none"
        style={{ stroke: "var(--m-accent)", strokeWidth: 0.6 }}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** شريط السدو المنسوج — الطابع النجدي. */
function SaduBand({ color }: { color: string }) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-0 bottom-0 h-7"
      style={{
        // أرضية صريحة تحت النسيج: الزخرفة وحدها فوق تدرّج البانر تخرج باهتة.
        backgroundColor: "var(--m-bg-2)",
        backgroundImage: patternImage("sadu", color, 1),
        backgroundSize: "60px 60px",
        backgroundPosition: "center",
        borderTop: "2px solid var(--m-accent)",
        borderBottom: "2px solid var(--m-accent)",
      }}
    />
  );
}

/** زوايا مزخرفة للإطار الفاخر. */
function FrameCorner({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute h-5 w-5 ${className}`}
      style={{ borderColor: "var(--m-accent)" }}
    />
  );
}

export function MenuHeader({
  restaurant,
  theme,
  children,
}: {
  restaurant: Restaurant;
  theme: MenuTheme;
  /** الشرائح أسفل الاسم (الطاولة، ساعات العمل). */
  children?: ReactNode;
}) {
  const { header, pattern, patternOpacity } = theme.design;
  const accent = theme.vars["--m-accent"] ?? "#d4a843";
  const brand = restaurant.cover_color ?? accent;
  const hasBanner = !!restaurant.banner_image?.trim();

  /** خلفية مصمَّمة تعمل بلا صورة غلاف — تدرّجات متراكبة + زخرفة الطابع. */
  const designedBackdrop: CSSProperties = {
    backgroundImage: [
      patternImage(pattern, accent, patternOpacity + 0.03),
      `radial-gradient(115% 95% at 50% 5%, ${brand}55 0%, transparent 72%)`,
      `radial-gradient(80% 70% at 15% 10%, ${accent}3d 0%, transparent 62%)`,
      `radial-gradient(80% 70% at 85% 20%, ${brand}30 0%, transparent 60%)`,
      // ينتهي عند bg-2 لا bg: التدرّج إلى لون الصفحة نفسه يُذيب حدّ الترويسة
      // ويُخفي قوس الروشان تماماً.
      "linear-gradient(180deg, var(--m-bg-2) 0%, var(--m-bg-2) 100%)",
    ]
      .filter((v) => v !== "none")
      .join(","),
    backgroundSize:
      pattern === "none" ? "auto" : `${PATTERN_SIZE[pattern]}, auto, auto, auto, auto`,
  };

  const bannerHeight = header === "frame" ? "h-28 sm:h-32" : "h-40 sm:h-52";

  return (
    <header className="relative">
      <div className={`relative w-full overflow-hidden ${bannerHeight}`} style={designedBackdrop}>
        {hasBanner && (
          <>
            <SafeImage
              src={restaurant.banner_image}
              alt=""
              className="h-full w-full object-cover"
              wrapperClassName="h-full w-full"
              fallback={<span />}
            />
            {/* تعتيم متدرّج: صورة غلاف فاتحة كانت تبتلع اسم المطعم. */}
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(0,0,0,.15) 0%, rgba(0,0,0,.05) 40%, var(--m-bg) 100%)",
              }}
            />
          </>
        )}
        {header === "arch" && <ArchMask />}
        {header === "band" && <SaduBand color={accent} />}
      </div>

      <div className="mx-auto -mt-12 flex max-w-3xl flex-col items-center px-4 text-center">
        <div className="relative">
          {/* إطار شعري بزوايا مزخرفة — الطابع الفاخر لا يحتاج صورة أصلاً. */}
          {header === "frame" && (
            <>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-3 rounded-sm border"
                style={{ borderColor: "var(--m-border)" }}
              />
              <FrameCorner className="-start-5 -top-5 border-s-2 border-t-2" />
              <FrameCorner className="-end-5 -top-5 border-e-2 border-t-2" />
              <FrameCorner className="-bottom-5 -start-5 border-b-2 border-s-2" />
              <FrameCorner className="-bottom-5 -end-5 border-b-2 border-e-2" />
            </>
          )}
          <SafeImage
            src={restaurant.logo_image}
            alt={restaurant.name}
            className="h-24 w-24 border-2 object-cover shadow-xl"
            wrapperClassName="h-24 w-24"
            style={
              {
                borderColor: "var(--m-accent)",
                background: "var(--m-bg-2)",
                borderRadius: header === "frame" ? "0.25rem" : "1.5rem",
              } as CSSProperties
            }
            fallback={
              <span
                className="flex h-24 w-24 items-center justify-center border-2 text-5xl shadow-xl"
                style={
                  {
                    borderColor: "var(--m-accent)",
                    background: "var(--m-bg-2)",
                    borderRadius: header === "frame" ? "0.25rem" : "1.5rem",
                  } as CSSProperties
                }
              >
                {restaurant.logo || <Icon name="plate" size={30} />}
              </span>
            }
          />
        </div>

        <h1
          className="mt-3 text-2xl font-black"
          style={{ fontFamily: "var(--m-display, var(--m-font))", color: "var(--m-text)" }}
        >
          {restaurant.name}
        </h1>
        {restaurant.type && (
          <p className="text-sm" style={{ color: "var(--m-muted)" }}>
            {restaurant.type}
          </p>
        )}

        {/* فاصل مزخرف صغير — يعطي الترويسة نهاية مقصودة بدل أن تنتهي فجأة. */}
        {theme.design.heading !== "plain" && (
          <span
            aria-hidden="true"
            className="mt-2 inline-block h-px w-24"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--m-accent), transparent)",
            }}
          />
        )}

        {children && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">{children}</div>
        )}
      </div>
    </header>
  );
}

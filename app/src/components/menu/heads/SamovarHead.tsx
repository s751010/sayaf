/**
 * «سماور» — بيت الشاي التراثي (٢٠٢٦/١١/٠٧).
 *
 * - `SamovarHead`    **جلسة بيت الشاي**: سجّادةٌ معلّقة على عصاً فوق جدارٍ بلون النعناع،
 *   ميدانها بلون العلامة وحاشيتها فوّة، **وشعارك في ترنجها** (وسط السجّادة). وأمامها سماورٌ
 *   من نحاسٍ أحمر على رأسه إبريق الخزف والبخار يطلع منه، وحنفيّته تقطر، وعن الجانب الآخر
 *   استكاناتٌ مخصّرة بحافّةٍ مذهّبة على صحونها وعرقُ نعناع — فوق حاشية سجّادٍ على الأرض.
 *   والاسم تحتها بريم كوفي.
 * - `SamovarHeading` عنوان القسم **استكانة**: استكانةُ شايٍ على صحنها ببخارها، ثم الاسم، ثم
 *   حاشية سجّادٍ إلى العدد — والعدد **صحن** الاستكانة.
 *
 * الخامة والحركة في `styles/skins/samovar.css`. ما يتبع العلامة: ميدان السجّادة وحاشية
 * الأرض وحزام الإبريق، والسعر والأزرار. وما لا يتبعها خامة: النحاس والخزف والزجاج والذهب
 * والشاي والنعناع، وفوّة الحاشية — السماور نحاسٌ أيّاً كان لون التاجر.
 *
 * ⚠️ **ومختلفٌ عمداً** عن «دلّة» (رفُّ دلالٍ صفراء وفناجين قهوة)، و«نجدي» (جدار طينٍ وباب)،
 * و«روشان» (أقواسٌ ومشربيّات): لا رفّ ولا جدار طين ولا قوس — السجّادة والسماور هما الترويسة.
 */
import { useId, type CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };

/** فوّة الحاشية — خامةٌ ثابتة (لون الصبغة لا لون العلامة). */
const MADDER = "#a63c27";
const CREAM = "#f3e9d2";

/** مركز الترنج وقطر الشعار بنسبة السجّادة — حيث يجلس الشعار. */
const MEDALLION = { x: 120 / 240, y: 84 / 170, d: 74 / 240 };

/**
 * السجّادة: عصاً بعقدتين، وحاشيةٌ من فوّة بنقش سنٍّ وكريم، وميدانٌ بلون العلامة بشبكةٍ
 * خافتة، وأركانٌ وترنجٌ كريميّ بحلقتين ومتدلّيين — وأهدابٌ في أسفلها.
 */
function Rug({ restaurant }: Pick<HeadProps, "restaurant">) {
  const id = useId().replace(/:/g, "");
  const tooth = `sm-tooth-${id}`;
  const lattice = `sm-lattice-${id}`;
  const shade = `sm-shade-${id}`;
  return (
    <div className="m-sm-rug relative mx-auto" style={{ width: "min(13.5rem, 60%)", aspectRatio: "240 / 170" }}>
      <svg viewBox="0 0 240 170" aria-hidden="true" className="m-sm-rug-svg absolute inset-0 block h-full w-full overflow-visible">
        <defs>
          <pattern id={tooth} width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill={MADDER} />
            <path d="M0 10 5 3 10 10Z" fill={CREAM} />
            <circle cx="5" cy="7.6" r="1.1" fill={MADDER} />
          </pattern>
          <pattern id={lattice} width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M8 1 15 8 8 15 1 8Z" fill="none" stroke="#fff" strokeOpacity=".16" strokeWidth="1" />
            <circle cx="8" cy="8" r="1.3" fill={CREAM} fillOpacity=".35" />
          </pattern>
          <linearGradient id={shade} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#000" stopOpacity=".12" />
            <stop offset=".18" stopColor="#000" stopOpacity="0" />
            <stop offset=".8" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity=".2" />
          </linearGradient>
        </defs>
        {/* العصا وعقدتاها. */}
        <rect x="-10" y="1" width="260" height="6" rx="3" fill="#6b3d1c" />
        <rect x="-10" y="1" width="260" height="2" rx="1" fill="#a8693a" />
        <circle cx="-12" cy="4" r="5" fill="#5a3216" />
        <circle cx="252" cy="4" r="5" fill="#5a3216" />
        {/* الأهداب. */}
        <g stroke={CREAM} strokeWidth="1.3" strokeLinecap="round">
          {Array.from({ length: 30 }, (_, i) => (
            <path key={i} d={`M${6 + i * 7.86} 157v${9 + (i % 3)}`} />
          ))}
        </g>
        {/* الحاشية: فوّةٌ بنقش السنّ بين خيطين كريميّين. */}
        <rect x="0" y="6" width="240" height="152" fill={MADDER} />
        <rect x="8" y="14" width="224" height="136" fill={`url(#${tooth})`} />
        <rect x="8" y="14" width="224" height="136" fill="none" stroke={CREAM} strokeWidth="1.6" />
        <rect x="18" y="24" width="204" height="116" fill="none" stroke={CREAM} strokeWidth="1.6" />
        {/* الميدان بلون العلامة وشبكته. */}
        <rect x="20" y="26" width="200" height="112" style={{ fill: "var(--m-accent)" }} />
        <rect x="20" y="26" width="200" height="112" fill={`url(#${lattice})`} />
        {/* الأركان: أرباعُ ترنجٍ كريميّة بحافّةٍ من فوّة. */}
        {[
          [20, 26, 0],
          [220, 26, 90],
          [220, 138, 180],
          [20, 138, 270],
        ].map(([x, y, r]) => (
          <path
            key={`${x}-${y}`}
            d={`M${x} ${y}h30c0 8-6 13-13 15S${x} ${y + 24} ${x} ${y + 30}Z`}
            transform={`rotate(${r} ${x} ${y})`}
            fill={CREAM}
            stroke={MADDER}
            strokeWidth="1.4"
          />
        ))}
        {/* الترنج: مُعيَّنٌ مدوّر الرؤوس، ومتدلّيان فوقه وتحته. */}
        <path d="M120 34 133 50 120 58 107 50Z" fill={CREAM} stroke={MADDER} strokeWidth="1.4" />
        <path d="M120 134 133 118 120 110 107 118Z" fill={CREAM} stroke={MADDER} strokeWidth="1.4" />
        <path
          d="M120 40C136 52 168 62 172 84 168 106 136 116 120 128 104 116 72 106 68 84 72 62 104 52 120 40Z"
          fill={CREAM}
          stroke={MADDER}
          strokeWidth="2"
        />
        <path
          d="M120 48C134 58 158 66 162 84 158 102 134 110 120 120 106 110 82 102 78 84 82 66 106 58 120 48Z"
          fill="none"
          stroke={MADDER}
          strokeWidth="1"
          strokeDasharray="2 2.4"
        />
        <rect x="0" y="6" width="240" height="152" fill={`url(#${shade})`} />
      </svg>
      <span
        className="m-sm-medallion absolute block rounded-full p-[3px]"
        style={{
          left: `${MEDALLION.x * 100}%`,
          top: `${MEDALLION.y * 100}%`,
          width: `${MEDALLION.d * 100}%`,
          aspectRatio: "1",
          translate: "-50% -50%",
        }}
      >
        <LogoMark
          restaurant={restaurant}
          size="relative h-full w-full"
          style={{ borderRadius: "9999px", background: "var(--m-surface)" }}
          fallbackStyle={{ color: "var(--m-accent-ink, var(--m-accent))" }}
          letterSize="1.8rem"
        />
      </span>
    </div>
  );
}

/**
 * السماور من الأمام: إبريق الخزف على تاجه، والبطن جرّةٌ من نحاسٍ أحمر بحزامين، والأذنان،
 * والحنفيّة بمفتاحها والقطرة تحتها، ثم العنق والقاعدة المربّعة على أربع أرجل.
 */
function Samovar({ className, style }: { className?: string; style?: CSSProperties }) {
  const id = useId().replace(/:/g, "");
  const copper = `sm-copper-${id}`;
  const china = `sm-china-${id}`;
  return (
    // ‏`className` يحمل التموضع (`absolute` من الترويسة) — فلا `relative` هنا يغالبه.
    <span className={`block ${className ?? ""}`} style={{ aspectRatio: "100 / 172", ...style }} aria-hidden="true">
      <svg viewBox="0 0 100 172" className="m-sm-samovar-svg absolute inset-0 block h-full w-full overflow-visible">
        <defs>
          <linearGradient id={copper} x1="0" x2="1">
            <stop offset="0" stopColor="#4a1d08" />
            <stop offset=".18" stopColor="#9a4a1e" />
            <stop offset=".34" stopColor="#ffd1a0" />
            <stop offset=".46" stopColor="#e7965a" />
            <stop offset=".72" stopColor="#b25e2b" />
            <stop offset="1" stopColor="#5a230a" />
          </linearGradient>
          <linearGradient id={china} x1="0" x2="1">
            <stop offset="0" stopColor="#d9d2c4" />
            <stop offset=".35" stopColor="#ffffff" />
            <stop offset="1" stopColor="#cfc6b5" />
          </linearGradient>
        </defs>
        {/* إبريق الخزف: منقاره إلى اليسار وأذنه إلى اليمين، وحزامٌ بلون العلامة. */}
        <path d="M33 30C27 30 22 24 15 16L13 13 17 12C23 18 28 22 35 24Z" fill={`url(#${china})`} stroke="#9c9282" strokeWidth=".7" />
        <path d="M71 18C82 16 85 30 73 34" fill="none" stroke="#b9b0a0" strokeWidth="3" strokeLinecap="round" />
        <path d="M30 38C28 28 36 15 52 15S76 28 74 38Z" fill={`url(#${china})`} stroke="#9c9282" strokeWidth=".7" />
        <path d="M31.5 27H72.5" stroke="var(--m-accent)" strokeWidth="3.4" />
        <path d="M33 31.5H71" stroke="#c9a04a" strokeWidth="1" />
        <ellipse cx="52" cy="15" rx="12" ry="2.6" fill={`url(#${china})`} stroke="#9c9282" strokeWidth=".7" />
        <circle cx="52" cy="10.5" r="3" fill="#c9a04a" />
        {/* التاج: حلقةٌ نحاسية يجلس عليها الإبريق، بفتحات البخار. */}
        <path d="M38 38H66L62 50H42Z" fill={`url(#${copper})`} stroke="#4a1d08" strokeWidth=".7" />
        <g fill="#2a1004">
          <circle cx="47" cy="44" r="1.3" />
          <circle cx="52" cy="44" r="1.3" />
          <circle cx="57" cy="44" r="1.3" />
        </g>
        {/* الأذنان: حلقتان من نحاسٍ داكن على كتفيه. */}
        <path d="M24 60C10 58 6 70 16 80" fill="none" stroke="#5a230a" strokeWidth="3.4" strokeLinecap="round" />
        <path d="M76 60C90 58 94 70 84 80" fill="none" stroke="#5a230a" strokeWidth="3.4" strokeLinecap="round" />
        {/* البطن: جرّةٌ تنتفخ ثم تضيق إلى العنق. */}
        <path d="M30 50H70C76 54 84 64 86 84 88 104 80 120 66 128H34C20 120 12 104 14 84 16 64 24 54 30 50Z" fill={`url(#${copper})`} stroke="#4a1d08" strokeWidth=".8" />
        <g fill="none" stroke="#4a1d08" strokeLinecap="round" opacity=".55">
          <path d="M22 62C38 67 62 67 78 62" strokeWidth="1.2" />
          <path d="M18 112C36 120 64 120 82 112" strokeWidth="1.2" />
          <path d="M21 66C38 71 62 71 79 66" strokeWidth=".7" strokeDasharray="1.4 2.4" />
        </g>
        {/* وسامٌ محفور على البطن. */}
        <circle cx="50" cy="90" r="11" fill="none" stroke="#4a1d08" strokeWidth=".9" opacity=".5" />
        <path d="M50 81 53 90 50 99 47 90Z" fill="#4a1d08" opacity=".35" />
        <ellipse cx="36" cy="86" rx="4" ry="16" fill="#fff" opacity=".22" transform="rotate(8 36 86)" />
        {/* الحنفيّة: تخرج من أسفل البطن إلى اليسار وتنزل، ومفتاحها فوقها. */}
        <path d="M22 108H7V115" fill="none" stroke="#5a230a" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 108H7V115" fill="none" stroke="#e7a065" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity=".7" />
        <path d="M11 104 15 99M15 104 11 99" stroke="#5a230a" strokeWidth="2.2" strokeLinecap="round" />
        <circle className="m-sm-drip" cx="7" cy="121" r="1.8" fill="#c2531f" />
        {/* العنق والقاعدة والأرجل. */}
        <path d="M38 128H62L59 142H41Z" fill={`url(#${copper})`} stroke="#4a1d08" strokeWidth=".7" />
        <path d="M24 142H76L80 158H20Z" fill={`url(#${copper})`} stroke="#4a1d08" strokeWidth=".8" />
        <path d="M22 150H78" stroke="#4a1d08" strokeWidth=".7" opacity=".5" />
        {[24, 40, 60, 76].map((x) => (
          <path key={x} d={`M${x - 3} 158h6l-1 12h-4Z`} fill="#4a1d08" />
        ))}
      </svg>
      {/* البخار من منقار الإبريق ومن فتحات التاج. */}
      <svg viewBox="0 0 100 40" className="m-sm-steam absolute inset-x-0 block w-full" style={{ bottom: "93%" }}>
        {["M15 40c-6-8 6-12 0-20s5-11 1-18", "M47 40c-5-7 5-11 0-18s4-10 1-16", "M58 40c-5-7 5-11 0-18s4-10 1-16"].map((d, i) => (
          <path key={i} className="m-sm-wisp" d={d} fill="none" strokeWidth="2.4" strokeLinecap="round" />
        ))}
      </svg>
    </span>
  );
}

/** الاستكانة من جانبها: زجاجٌ مخصّر بحافّةٍ مذهّبة، والشاي الأحمر فيه، على صحنها. */
export function Istikan({ className, style, spoon }: { className?: string; style?: CSSProperties; spoon?: boolean }) {
  const id = useId().replace(/:/g, "");
  const tea = `sm-tea-${id}`;
  const clip = `sm-clip-${id}`;
  const glass = "M7 5C7 12 11 15.5 11 20 11 25 7.4 29.5 8 36H22C22.6 29.5 19 25 19 20 19 15.5 23 12 23 5Z";
  return (
    <svg viewBox="0 0 30 44" aria-hidden="true" className={className} style={style}>
      <defs>
        <linearGradient id={tea} x1="0" x2="1">
          <stop offset="0" stopColor="#6e1c0b" />
          <stop offset=".42" stopColor="#c9581f" />
          <stop offset="1" stopColor="#7d2410" />
        </linearGradient>
        <clipPath id={clip}>
          <path d={glass} />
        </clipPath>
      </defs>
      {/* الصحن: خزفٌ أبيض بحزامٍ بلون العلامة وحافّةٍ مذهّبة. */}
      <ellipse cx="15" cy="38.6" rx="14" ry="3.8" fill="#fbf8f1" stroke="#c9a04a" strokeWidth="1" />
      <ellipse cx="15" cy="38.2" rx="9.4" ry="2.2" fill="none" stroke="var(--m-accent)" strokeWidth="1.3" />
      {spoon && <path d="M21.5 0.8 15.6 24" stroke="#b9bdc0" strokeWidth="1.3" strokeLinecap="round" />}
      <rect x="0" y="9.5" width="30" height="27" fill={`url(#${tea})`} clipPath={`url(#${clip})`} />
      <path d={glass} fill="rgba(255,255,255,.14)" stroke="rgba(90,70,50,.45)" strokeWidth=".7" />
      <path d="M7.3 6.4H22.7" stroke="#d6a944" strokeWidth="2" />
      <path d="M10.8 20H19.2" stroke="#d6a944" strokeWidth="1" />
      <path d="M9.4 9C10 13 12 15 12.4 19" stroke="#fff" strokeWidth="1" strokeLinecap="round" opacity=".6" fill="none" />
      <ellipse cx="15" cy="5" rx="8" ry="1.1" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth=".6" />
    </svg>
  );
}

/** عرق نعناع: ساقٌ وخمس ورقاتٍ بعروقها. */
function Mint({ className }: { className?: string }) {
  const LEAVES: [number, number, number][] = [
    [15, 6, 0], [9, 12, -40], [21, 12, 40], [8, 20, -60], [22, 20, 60],
  ];
  return (
    <svg viewBox="0 0 30 30" aria-hidden="true" className={className}>
      <path d="M15 29V6" stroke="#2f6b35" strokeWidth="1.4" strokeLinecap="round" />
      {LEAVES.map(([x, y, r]) => (
        <g key={`${x}-${y}`} transform={`rotate(${r} ${x} ${y})`}>
          <path d={`M${x} ${y - 6}C${x + 4.5} ${y - 3} ${x + 4.5} ${y + 3} ${x} ${y + 6}C${x - 4.5} ${y + 3} ${x - 4.5} ${y - 3} ${x} ${y - 6}Z`} fill="#4f9a4a" />
          <path d={`M${x} ${y - 5}V${y + 5}`} stroke="#2f6b35" strokeWidth=".6" />
        </g>
      ))}
    </svg>
  );
}

export function SamovarHead({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  return (
    <header className="m-head m-head-rug relative overflow-hidden pb-1">
      <Corner>{corner}</Corner>
      <div className="m-sm-room relative px-3 pt-12">
        <span aria-hidden="true" className="m-sm-light absolute inset-0 block" />
        <div className="relative mx-auto max-w-[22rem] pb-1">
          <Rug restaurant={restaurant} />
          {/* أمام السجّادة: السماور على اليمين، والاستكانات والنعناع على اليسار. */}
          <Samovar className="m-sm-samovar absolute bottom-0 right-0 z-[2]" style={{ width: "5.4rem" }} />
          <span aria-hidden="true" className="m-sm-tea absolute bottom-0 left-[1%] z-[2] flex items-end">
            <Mint className="m-sm-mint -me-1 mb-1 block h-7 w-7" />
            {[0, 1, 2].map((i) => (
              <span key={i} className="m-sm-cup relative block" style={{ "--i": i } as CSSProperties}>
                <Istikan spoon={i === 1} className="block h-[2.9rem] w-[2rem]" />
              </span>
            ))}
          </span>
        </div>
        <span aria-hidden="true" className="m-sm-floor relative z-[3] -mx-3 block h-[18px]" />
      </div>
      <div className="px-4 text-center">
        <h1 className="m-title mt-4 text-[2.05rem] font-bold leading-[1.45]" style={{ ...display, color: "var(--m-text)" }}>
          {restaurant.name}
        </h1>
        {typeLabel && (
          <p className="text-[13px] font-bold" style={{ color: "var(--m-muted)" }}>
            {typeLabel}
          </p>
        )}
      </div>
      {banner && (
        <div className="px-4">
          <div className="m-sm-window mx-auto mt-5 max-w-sm overflow-hidden">
            <SafeImage
              src={banner}
              alt=""
              loading="eager"
              className="h-28 w-full object-cover"
              wrapperClassName="h-28 w-full"
              fallback={<span />}
            />
          </div>
        </div>
      )}
      {children && (
        <div className="m-chips mt-5 flex flex-wrap items-center justify-center gap-2 px-4">{children}</div>
      )}
    </header>
  );
}

/** الاستكانة وبخارها، ثم الاسم، ثم حاشية السجّاد إلى العدد — والعدد صحنها. */
export function SamovarHeading({ name, items, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-istikan-h mb-4">
      <div className="flex items-end gap-2.5 px-1">
        <span aria-hidden="true" className="m-sm-hcup relative block shrink-0">
          <svg viewBox="0 0 20 18" className="absolute bottom-[86%] left-1/2 block h-4 w-5 -translate-x-1/2">
            <path className="m-sm-wisp" d="M7 17c-3-4 3-6 0-10s3-5 1-7" fill="none" strokeWidth="1.6" strokeLinecap="round" />
            <path className="m-sm-wisp" d="M13 17c-3-4 3-6 0-10s3-5 1-7" fill="none" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <Istikan className="block h-[2.6rem] w-[1.8rem]" />
        </span>
        <h2 className="min-w-0 pb-0.5 text-[1.5rem] font-bold leading-[1.5]" style={{ ...display, color: "var(--m-text)" }}>
          {name}
        </h2>
        <span aria-hidden="true" className="m-sm-band mb-[1.05rem] block h-[10px] min-w-6 flex-1" />
        {items && <span className="m-sm-saucer mb-1 shrink-0 text-[11px] font-bold">{items}</span>}
      </div>
      {photo && <div className="m-sm-photo mt-3">{photo}</div>}
    </div>
  );
}

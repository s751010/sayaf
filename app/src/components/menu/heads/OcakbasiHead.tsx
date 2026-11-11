/**
 * «أوجاق» — مطعم المشاوي التركي والشامي (٢٠٢٦/١١/٠٩، الموجة ٣).
 *
 * - `OcakbasiHead`    **شوّايةٌ مفتوحة** بجمرٍ يتّقد وعليها طماطم وفلفلٌ وبصل، تحت **قبّة نحاسٍ
 *   مطروق** بحزامٍ نحاسيّ ومسامير، و**الدخان يصعد من الجمر إلى القبّة**، وواجهة الشوّاية **بلاطٌ
 *   إزنيقيّ أزرق**. وشعارك **وسامٌ نحاسيّ** على وجه القبّة. **الدخان يشتدّ ما دام يمرّر**، و**حين يُضاف
 *   صنفٌ يرتفع اللهب** إلى القبّة بشرره (`lib/skinMotion.ts`).
 * - `OcakbasiHeading` عنوان القسم **قبّةٌ صغيرة يصعد إليها خيط دخانٍ** حين يدخل القسم، والاسم، وشريط
 *   بلاطٍ إلى العدد على **عملة نحاس**.
 *
 * لا سيخٌ أفقيّ بعرض الشاشة ولا منقل («جمر»): الشوّاية هنا مصطبةٌ مبلّطة والنجم القبّة.
 *
 * الخامة والحركة في `styles/skins/ocakbasi.css`. ما يتبع العلامة: نحاس القبّة (`--m-accent` مخلوطاً)،
 * وعملة العدد، والسعر، والأزرار. وما لا يتبعها خامة: الجمر والدخان والبلاط والخضار.
 */
import { useId, type CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };

/** القبّة: مدخنةٌ ضيّقة فوق، ثم تتّسع إلى حزامها فوق الشوّاية. */
const HOOD = "M118 0H202V16L292 90H28L118 16Z";

/** لسان لهب: قاعدته (cx، by) وعرضه w وارتفاعه h. */
function flame(cx: number, by: number, w: number, h: number): string {
  return `M${cx - w / 2} ${by}C${cx - w / 2} ${by - h * 0.45} ${cx - w * 0.1} ${by - h * 0.6} ${cx} ${by - h}C${cx + w * 0.1} ${by - h * 0.6} ${cx + w / 2} ${by - h * 0.45} ${cx + w / 2} ${by}Z`;
}

/** خيوط الدخان من الجمر إلى القبّة — كلٌّ يميل نحو المدخنة. */
const SMOKE = [
  "M84 142C78 128 96 120 90 108C86 100 98 96 104 92",
  "M140 140C134 126 150 118 144 104C140 96 150 94 154 90",
  "M196 142C204 128 186 118 194 106C198 98 188 94 182 90",
  "M246 140C252 126 236 120 242 108C246 100 232 96 226 92",
];

function Grill() {
  const uid = useId().replace(/:/g, "");
  const id = (k: string) => `m-ok-${k}-${uid}`;
  return (
    <svg viewBox="0 0 320 220" aria-hidden="true" className="absolute inset-0 block h-full w-full overflow-visible">
      <defs>
        <linearGradient id={id("cu")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity=".38" />
          <stop offset=".3" stopColor="#fff" stopOpacity=".18" />
          <stop offset=".46" stopColor="#fff" stopOpacity=".34" />
          <stop offset=".62" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".42" />
        </linearGradient>
        <pattern id={id("dots")} width="9" height="9" patternUnits="userSpaceOnUse">
          <circle cx="2.5" cy="2.5" r="1.5" fill="#fff" fillOpacity=".16" />
          <circle cx="7" cy="7" r="1.6" fill="#000" fillOpacity=".14" />
        </pattern>
        <linearGradient id={id("brass")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3d79a" />
          <stop offset=".5" stopColor="#c99a4a" />
          <stop offset="1" stopColor="#7a5520" />
        </linearGradient>
        <radialGradient id={id("coal")} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#ffd36b" />
          <stop offset=".5" stopColor="#ff6a1a" />
          <stop offset="1" stopColor="#7a1c08" />
        </radialGradient>
        <pattern id={id("tile")} width="22" height="22" patternUnits="userSpaceOnUse">
          <rect width="22" height="22" fill="#f6f2ea" />
          <rect x=".5" y=".5" width="21" height="21" fill="none" stroke="#1d5d8f" strokeOpacity=".35" />
          <path d="M11 3C13 7 13 9 11 11C9 9 9 7 11 3ZM19 11C15 13 13 13 11 11C13 9 15 9 19 11ZM11 19C9 15 9 13 11 11C13 13 13 15 11 19ZM3 11C7 9 9 9 11 11C9 13 7 13 3 11Z" fill="#1d5d8f" />
          <circle cx="11" cy="11" r="1.8" fill="#c8361f" />
          <path d="M0 0L4 0L0 4ZM22 0L18 0L22 4ZM0 22L4 22L0 18ZM22 22L18 22L22 18Z" fill="#2f8a7a" />
        </pattern>
      </defs>

      {/* الدخان: يصعد من الجمر إلى حزام القبّة. */}
      <g className="m-ok-smoke" fill="none" stroke="#9a948c" strokeWidth="5" strokeLinecap="round">
        {SMOKE.map((d, i) => (
          <path key={i} d={d} style={{ "--n": i } as CSSProperties} />
        ))}
      </g>

      {/* القبّة النحاسية: لون العلامة مخلوطاً بالنحاس، مطروقة، بضوءٍ من اليسار. */}
      <path d={HOOD} className="m-ok-copper" />
      <path d={HOOD} fill={`url(#${id("dots")})`} />
      <path d={HOOD} fill={`url(#${id("cu")})`} />
      <path d="M118 16H202" stroke="#3a1a0a" strokeOpacity=".4" />
      {/* الحزام النحاسيّ ومساميره. */}
      <rect x="22" y="88" width="276" height="11" rx="2" fill={`url(#${id("brass")})`} stroke="#5a3a12" strokeWidth=".8" />
      <g fill="#5a3a12">
        {Array.from({ length: 12 }, (_, i) => (
          <circle key={i} cx={34 + i * 23.0} cy="93.5" r="1.6" />
        ))}
      </g>
      {/* إطار الوسام (الشعار فوقه HTML). */}
      <circle cx="160" cy="56" r="23" fill={`url(#${id("brass")})`} stroke="#5a3a12" strokeWidth="1" />
      <circle cx="160" cy="56" r="20.5" fill="none" stroke="#5a3a12" strokeOpacity=".5" strokeDasharray="1.2 2.4" />

      {/* المصطبة: حافّة حجرٍ، ثم الجمر، ثم الشبكة والخضار. */}
      <rect x="20" y="152" width="280" height="8" rx="2" fill="#3a3330" />
      <rect x="28" y="140" width="264" height="14" rx="3" fill="#2a1410" />
      <g className="m-ok-coals">
        {Array.from({ length: 22 }, (_, i) => (
          <circle key={i} cx={36 + i * 11.8} cy={147 + ((i * 5) % 3) - 1} r={5 + ((i * 7) % 3)} fill={`url(#${id("coal")})`} />
        ))}
      </g>
      <g className="m-ok-flames" fill="#ff8a1c">
        {[70, 120, 172, 226, 262].map((x, i) => (
          <path key={x} className="m-ok-flame" d={flame(x, 142, 9, 16 + (i % 2) * 6)} style={{ "--n": i } as CSSProperties} />
        ))}
      </g>
      <path d="M26 139H294" stroke="#5a524c" strokeWidth="2.4" />
      <path d={Array.from({ length: 23 }, (_, i) => `M${30 + i * 12} 136V142`).join("")} stroke="#5a524c" strokeWidth="1.4" />
      {/* الخضار على الشبكة: طماطم وفلفلٌ أخضر وبصل — محروقةٌ قليلاً. */}
      <g>
        <circle cx="62" cy="130" r="9" fill="#d23a22" />
        <path d="M58 122L62 125L66 122" stroke="#2f6a2a" strokeWidth="2" fill="none" />
        <circle cx="236" cy="130" r="9" fill="#c8331d" />
        <path d="M232 122L236 125L240 122" stroke="#2f6a2a" strokeWidth="2" fill="none" />
        <path d="M94 134C100 124 128 122 142 128C146 132 140 136 130 136H98Z" fill="#3f8a2e" />
        <path d="M180 134C186 124 214 122 228 128" fill="none" stroke="#5aa03a" strokeWidth="8" strokeLinecap="round" />
        <ellipse cx="160" cy="131" rx="11" ry="7" fill="#efe2cf" stroke="#b79a7a" />
        <ellipse cx="160" cy="131" rx="6" ry="3.6" fill="none" stroke="#b79a7a" />
        <ellipse cx="270" cy="131" rx="9" ry="6" fill="#efe2cf" stroke="#b79a7a" />
        <g stroke="#2a1410" strokeOpacity=".55" strokeWidth="1.4">
          <path d="M57 128L66 133M101 129L108 133M118 126L125 131M190 126L196 130M231 128L240 133" />
        </g>
      </g>
      {/* الواجهة: بلاطٌ إزنيقيّ بإطار حجر. */}
      <rect x="20" y="160" width="280" height="54" fill={`url(#${id("tile")})`} />
      <rect x="20" y="160" width="280" height="54" fill="none" stroke="#3a3330" strokeWidth="3" />
      {/* اللهب حين يُضاف صنف: يرتفع من الجمر إلى القبّة. */}
      <g className="m-ok-flare">
        <path d={flame(160, 140, 64, 52)} fill="#ff7a1f" fillOpacity=".85" />
        <path d={flame(160, 140, 34, 34)} fill="#ffe08a" />
        <g fill="#ffd36b">
          <circle cx="136" cy="96" r="1.6" />
          <circle cx="178" cy="90" r="1.4" />
          <circle cx="160" cy="80" r="1.2" />
        </g>
      </g>
    </svg>
  );
}

export function OcakbasiHead({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  return (
    <header className="m-head m-head-hood relative overflow-hidden pb-1">
      <Corner>{corner}</Corner>
      <div className="m-ok-wall relative px-3 pt-4">
        <div className="m-ok-scene relative mx-auto aspect-[320/220] w-full max-w-[22rem]">
          <Grill />
          {/* الوسام النحاسيّ على القبّة: مركزه (160، 56) ونصف قطره ١٩. */}
          <span className="m-ok-medal absolute left-1/2 top-[25.5%] z-[2] block aspect-square w-[11.9%] -translate-x-1/2 -translate-y-1/2 rounded-full">
            <LogoMark
              restaurant={restaurant}
              size="relative h-full w-full"
              style={{ borderRadius: "9999px", background: "var(--m-surface)" }}
              fallbackStyle={{ color: "var(--m-accent-ink, var(--m-accent))" }}
              letterSize="1.2rem"
            />
          </span>
        </div>
      </div>
      <div className="px-4 text-center">
        <h1 className="m-title mt-4 text-[2.1rem] leading-[1.6]" style={{ ...display, color: "var(--m-text)" }}>
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
          <div className="m-ok-window mx-auto mt-5 max-w-sm overflow-hidden">
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

/** قبّةٌ صغيرة فوق جمر، وخيط دخانٍ يصعد إليها حين يدخل القسم. */
function Hood() {
  return (
    <svg viewBox="0 0 40 36" aria-hidden="true" className="m-ok-hood block h-9 w-10 shrink-0">
      <path className="m-ok-wisp" d="M20 33C16 28 24 26 20 21C17 18 22 16 20 13" fill="none" stroke="#9a948c" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M15 1H25V5L37 14H3L15 5Z" className="m-ok-copper" />
      <rect x="2" y="13.5" width="36" height="3.5" rx="1" fill="#c99a4a" />
      <rect x="6" y="31" width="28" height="4" rx="1.5" fill="#2a1410" />
      <circle cx="13" cy="32.5" r="2" fill="#ff6a1a" />
      <circle cx="20" cy="32.5" r="2.2" fill="#ffb347" />
      <circle cx="27" cy="32.5" r="2" fill="#ff6a1a" />
    </svg>
  );
}

/** القبّة، ثم الاسم، ثم شريط بلاطٍ إلى عملة النحاس بالعدد. */
export function OcakbasiHeading({ name, items, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-ok-h mb-5">
      <div className="flex items-center gap-3 px-1">
        <Hood />
        <h2 className="min-w-0 text-[1.5rem] leading-[1.6]" style={{ ...display, color: "var(--m-text)" }}>
          {name}
        </h2>
        <span aria-hidden="true" className="m-ok-tiles block h-[10px] min-w-6 flex-1" />
        {items && <span className="m-ok-coin shrink-0 px-2.5 py-1 text-[11px] font-black">{items}</span>}
      </div>
      {photo && <div className="m-ok-photo mt-3">{photo}</div>}
    </div>
  );
}

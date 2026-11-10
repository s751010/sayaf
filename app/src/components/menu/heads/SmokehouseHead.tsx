/**
 * «مدخنة» — سموك هاوس للبريسكت والأضلاع (٢٠٢٦/١١/٠٩، الموجة ٣).
 *
 * - `SmokehouseHead`    **سبّورة طباشير بإطار خشب**: في أعلاها شعارك **موسومٌ بالحديد** — دائرةٌ
 *   محروقة يتوهّج حديدها عند الفتح ثم يبرد — واسمك عليها بالطباشير، وفي أسفلها **مدخّنة برميلٍ**
 *   مرسومةٌ بالطباشير وعلامات عدٍّ. و**الدخان يلفّ السبّورة** ويتأخّر وأنت تمرّر (`--m-scroll-y`). وحين
 *   يُضاف صنفٌ **تُخطّ علامة العدّ الخامسة** بالطباشير وينفث البرميل دخاناً (`lib/skinMotion.ts`).
 * - `SmokehouseHeading` عنوان القسم **يلفّه خيط دخانٍ** حين يدخل، والاسم بالطباشير وخطٌّ مخربشٌ تحته،
 *   والعدد في دائرة طباشير.
 *
 * الخامة والحركة في `styles/skins/smokehouse.css`. ما يتبع العلامة: الوسم المتوهّج، ودائرة العدد،
 * والسعر، والأزرار. وما لا يتبعها خامة: السبّورة والطباشير والخشب والدخان — الطباشير أبيضُ دائماً.
 */
import type { CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };

/** الدخان فوق السبّورة: ثلاث لفّاتٍ تمرّ عرضاً. */
function Smoke() {
  return (
    <svg viewBox="0 0 320 200" preserveAspectRatio="none" aria-hidden="true" className="m-sm-smoke pointer-events-none absolute inset-0 block h-full w-full">
      <g fill="none" stroke="#e9e6df" strokeLinecap="round">
        <path d="M-20 150C30 120 60 170 110 140S190 100 230 128S300 150 340 118" strokeWidth="14" strokeOpacity=".05" />
        <path d="M-10 60C40 30 80 80 130 52S210 18 250 40S310 70 340 44" strokeWidth="10" strokeOpacity=".06" />
        <path d="M290 200C270 170 300 150 280 120S300 80 286 52" strokeWidth="8" strokeOpacity=".07" />
      </g>
    </svg>
  );
}

/** مدخّنة برميلٍ بالطباشير: برميلٌ أفقيّ على أرجل، ومدخنته، وخيط دخانٍ ينفث حين يُضاف صنف. */
function Smoker() {
  return (
    <svg viewBox="0 0 120 70" aria-hidden="true" className="m-sm-smoker block h-full w-full overflow-visible">
      <g fill="none" stroke="#f2f0ea" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity=".85">
        <rect x="18" y="26" width="70" height="26" rx="13" />
        <path d="M24 39H82M53 26V52" strokeOpacity=".5" />
        <path d="M88 34H104V58" />
        <path d="M30 52L24 66M76 52L82 66M104 58L100 66" />
        <path d="M30 26V14H38V26" />
        <circle cx="64" cy="33" r="2.2" />
      </g>
      <path className="m-sm-puff" d="M34 12C30 6 38 4 34 -4C31 -10 38 -12 36 -18" fill="none" stroke="#f2f0ea" strokeWidth="3" strokeLinecap="round" strokeOpacity=".7" />
    </svg>
  );
}

/** علامات العدّ: أربعٌ قائمة وخامسةٌ مائلة تُخطّ حين يُضاف صنف. */
function Tally() {
  return (
    <svg viewBox="0 0 44 30" aria-hidden="true" className="m-sm-tally block h-full w-full overflow-visible">
      <g stroke="#f2f0ea" strokeWidth="2.4" strokeLinecap="round" strokeOpacity=".8">
        <path d="M6 4L7 26M14 3L14 27M22 4L21 26M30 3L31 27" />
        <path className="m-sm-strike" d="M2 22L38 6" pathLength={1} />
      </g>
    </svg>
  );
}

export function SmokehouseHead({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  return (
    <header className="m-head m-head-chalk relative overflow-hidden pb-1">
      <Corner>{corner}</Corner>
      <div className="px-3 pt-14">
        <div className="m-sm-board relative mx-auto max-w-[22rem] overflow-hidden px-5 pb-[5.6rem] pt-5 text-center">
          <Smoke />
          {/* الوسم: دائرةٌ محروقة حول الشعار — حديدها يتوهّج ثم يبرد. */}
          <span className="m-sm-brand relative mx-auto block aspect-square w-[5.25rem] rounded-full p-[9px]">
            <LogoMark
              restaurant={restaurant}
              size="relative h-full w-full"
              style={{ borderRadius: "9999px", background: "#efe3cf" }}
              fallbackStyle={{ color: "#3a1d0c" }}
              letterSize="1.7rem"
            />
          </span>
          <h1 className="m-title m-sm-chalk relative mt-3 text-[2.05rem] font-bold leading-[1.5]" style={{ ...display, color: "var(--m-text)" }}>
            {restaurant.name}
          </h1>
          {typeLabel && (
            <p className="relative text-[13px] font-bold" style={{ color: "var(--m-muted)" }}>
              {typeLabel}
            </p>
          )}
          <span aria-hidden="true" className="m-sm-scribble relative mx-auto mt-2 block h-2 w-32" />
          <span className="absolute bottom-3 start-4 block h-[4.4rem] w-[7.5rem]">
            <Smoker />
          </span>
          <span className="absolute bottom-5 end-5 block h-8 w-12">
            <Tally />
          </span>
        </div>
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

/** خيط الدخان حول العنوان — يُرسم حين يدخل القسم ثم ينجرف. */
function Wrap() {
  return (
    <svg viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden="true" className="m-sm-wrap pointer-events-none absolute -inset-x-1 -inset-y-2 block h-[calc(100%+1rem)] w-[calc(100%+0.5rem)]">
      <path
        d="M290 34C296 12 240 4 170 6S30 6 10 24S40 56 140 54S280 52 292 30"
        fill="none"
        stroke="#e9e6df"
        strokeWidth="5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        pathLength={1}
      />
    </svg>
  );
}

/** الاسم بالطباشير وخطٌّ مخربش تحته، والعدد في دائرة طباشير — والدخان يلفّهما. */
export function SmokehouseHeading({ name, items, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-sm-h mb-5">
      <div className="relative flex items-center gap-3 px-1 py-1">
        <Wrap />
        <div className="relative min-w-0 flex-1">
          <h2 className="m-sm-chalk text-[1.5rem] font-bold leading-[1.5]" style={{ ...display, color: "var(--m-text)" }}>
            {name}
          </h2>
          <span aria-hidden="true" className="m-sm-scribble block h-1.5 w-24" />
        </div>
        {items && <span className="m-sm-count relative shrink-0 px-2.5 py-1 text-[11px] font-black">{items}</span>}
      </div>
      {photo && <div className="m-sm-photo mt-3">{photo}</div>}
    </div>
  );
}

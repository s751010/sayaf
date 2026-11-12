/**
 * «سطل» — محلّ البروست والدجاج المقلي (٢٠٢٦/١١/١١).
 *
 * - `BucketHead`    **سطلٌ مقلّم** (خطوطٌ بيضاء وبلون العلامة) يفيض بقطع البروست الذهبية والبخار يعلو
 *   منها، وشعارك **ملصقٌ مستدير** على وجهه، بين **كوبَي صوص** — ثومٌ أبيض وحارٌّ أحمر — وقطعةٌ واقفة على
 *   حافّة الحارّ. خلفه **أشعّةٌ** بلون العلامة تدور مع التمرير (`--m-scroll-y`، `lib/skinMotion.ts`)،
 *   و**حين يُضاف صنفٌ تنغمس القطعة في الصوص** وتخرج مكسوّةً بالأحمر.
 * - `BucketHeading` عنوان القسم **ملصق علبة الوجبة**: سطلٌ صغير، والاسم على ملصقٍ أبيض بإطارٍ بلون
 *   العلامة يُلصق حين يدخل القسم، وخطّ قصٍّ متقطّع إلى **دائرة العدد** الصفراء.
 *
 * الخامة والحركة في `styles/skins/bucket.css`. ما يتبع العلامة: خطوط السطل والأشعّة وإطار الملصق
 * والأزرار والسعر. وما لا يتبعها خامة: القطع والصوص والكرتون الأبيض ودائرة العدد الصفراء.
 */
import type { CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };
const paint: CSSProperties = { fill: "var(--m-accent)" };

/** قطعة بروست: جسمٌ ذهبيّ مسطّح، وبقعُ قرمشةٍ أغمق، ولمعةٌ أفتح. `bone` لعظمة الدبّوس. */
function Piece({ d, spots, shine, bone }: { d: string; spots: [number, number, number][]; shine: string; bone?: string }) {
  return (
    <g>
      {bone && (
        <g fill="#f6eedb" stroke="#d9c9a6" strokeWidth=".8">
          <path d={bone} />
        </g>
      )}
      <path d={d} fill="#d98a2b" />
      <g fill="#b3621d">
        {spots.map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
        ))}
      </g>
      <path d={shine} fill="none" stroke="#f3bd5c" strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

/** المشهد بإحداثيات 240×200: كوبا الصوص على الجانبين، والسطل في الوسط يفيض بالقطع. */
function Bucket() {
  return (
    <svg viewBox="0 0 240 200" aria-hidden="true" className="absolute inset-0 block h-full w-full overflow-visible">
      <defs>
        <clipPath id="m-bk-body">
          <path d="M60 96H180L169 192H71Z" />
        </clipPath>
      </defs>

      {/* البخار من القطع — ثلاث نفثات. */}
      <g className="m-bk-steam" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeOpacity=".75">
        <path d="M96 40c-6-8 6-12 0-22" />
        <path d="M122 30c-6-8 6-12 0-22" />
        <path d="M148 40c-6-8 6-12 0-22" />
      </g>

      {/* القطع فوق الحافّة: دبّوسان مائلان، وفخذٌ في الوسط، وجناحان أمامها. */}
      <g className="m-bk-pile">
        <Piece
          d="M66 78c-8-14 4-30 20-28c12 2 20 12 18 24c-2 14-18 22-30 16c-4-2-6-6-8-12Z"
          spots={[[78, 62, 2.4], [90, 70, 2], [74, 78, 1.8], [95, 58, 1.6], [86, 82, 2.2]]}
          shine="M74 60c4-5 10-6 15-4"
          bone="M70 84l-14 10a5 5 0 1 1-6-7a5 5 0 1 1 7-6l11-9Z"
        />
        <Piece
          d="M150 74c2-14 18-22 30-16c12 6 12 22 2 30c-10 8-26 8-32-2c-1-4-1-8 0-12Z"
          spots={[[162, 66, 2.2], [174, 72, 2.4], [158, 80, 1.8], [170, 84, 2], [182, 64, 1.6]]}
          shine="M160 62c5-4 12-4 16 0"
          bone="M178 86l13 10a5 5 0 1 0 7-6a5 5 0 1 0-5-8l-12-8Z"
        />
        <Piece
          d="M98 62c4-16 22-24 36-18c14 6 20 22 12 36c-6 10-22 14-34 10c-12-4-16-16-14-28Z"
          spots={[[110, 54, 2.4], [126, 50, 2], [138, 62, 2.6], [116, 70, 2], [130, 76, 2.2], [104, 74, 1.8]]}
          shine="M108 52c6-6 16-8 24-4"
        />
        <Piece
          d="M76 92c2-10 14-14 22-8c6 4 8 10 6 16H78c-2-2-2-5-2-8Z"
          spots={[[86, 90, 2], [96, 94, 1.8]]}
          shine="M82 88c3-3 8-4 12-2"
        />
        <Piece
          d="M136 92c2-10 16-14 24-6c4 4 6 8 4 14H138c-2-2-2-5-2-8Z"
          spots={[[146, 90, 2], [156, 94, 1.8]]}
          shine="M142 88c3-3 8-4 12-2"
        />
      </g>

      {/* السطل: جسمٌ مقلّم بلون العلامة والأبيض، وحافّةٌ بيضاء، وظلٌّ على الطاولة. */}
      <ellipse cx="120" cy="193" rx="58" ry="4.5" fill="#000" fillOpacity=".16" />
      <g clipPath="url(#m-bk-body)">
        <rect x="56" y="94" width="128" height="100" fill="#ffffff" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} d={`M${62 + i * 21} 94h11l-2 100h-11Z`} style={paint} />
        ))}
        <rect x="56" y="180" width="128" height="14" fill="#000" fillOpacity=".08" />
      </g>
      <rect x="55" y="88" width="130" height="11" rx="5.5" fill="#ffffff" />
      <rect x="55" y="96" width="130" height="3" fill="#000" fillOpacity=".07" />

      {/* كوب الثومية يساراً. */}
      <g>
        <path d="M14 162H54L50 188Q49.5 191 46.5 191H21.5Q18.5 191 18 188Z" fill="#ffffff" />
        <path d="M14 162H54L53.4 166H14.6Z" fill="#000" fillOpacity=".07" />
        <ellipse cx="34" cy="162" rx="20" ry="4.5" fill="#f6efdc" />
        <path d="M26 161q8-3 16 0" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        <path d="M14 172H54" stroke="#000" strokeOpacity=".06" />
      </g>
      {/* كوب الحارّ يميناً — والقطعة الواقفة على حافّته تنغمس فيه حين يُضاف صنف. */}
      <g>
        <path d="M186 162H226L222 188Q221.5 191 218.5 191H193.5Q190.5 191 190 188Z" fill="#ffffff" />
        <path d="M186 162H226L225.4 166H186.6Z" fill="#000" fillOpacity=".07" />
        <ellipse className="m-bk-sauce" cx="206" cy="162" rx="20" ry="4.5" fill="#c81d12" />
        <path d="M198 161q8-3 16 0" fill="none" stroke="#ff6a55" strokeWidth="2" strokeLinecap="round" />
      </g>
      <g className="m-bk-dip">
        <path d="M200 150l10-18a5 5 0 1 1 8-2a5 5 0 1 1 1 9l-12 15Z" fill="#f6eedb" stroke="#d9c9a6" strokeWidth=".8" />
        <path d="M188 150c-2-10 6-18 15-15c7 3 9 11 5 17c-4 5-12 6-17 3c-2-1-3-3-3-5Z" fill="#d98a2b" />
        <path className="m-bk-coat" d="M188 150c0 4 4 8 10 8c5 0 9-2 11-6c-6 3-14 3-21-2Z" fill="#c81d12" />
        <g fill="#b3621d">
          <circle cx="195" cy="142" r="1.8" />
          <circle cx="201" cy="148" r="1.6" />
        </g>
      </g>
    </svg>
  );
}

export function BucketHead({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  return (
    <header className="m-head m-head-bucket relative overflow-hidden pb-1">
      <Corner>{corner}</Corner>
      <div className="m-bk-stage relative overflow-hidden pt-14">
        <span aria-hidden="true" className="m-bk-rays absolute left-1/2 top-[58%] block aspect-square w-[150%] max-w-[44rem]" />
        <div className="m-bk-scene relative mx-auto aspect-[6/5] w-full max-w-[19rem]">
          <Bucket />
          {/* ملصق السطل المستدير: شعارك في دائرةٍ بيضاء بإطارٍ أحمر. */}
          <span className="m-bk-seal absolute left-1/2 top-[71%] z-[2] block aspect-square w-[25%] -translate-x-1/2 -translate-y-1/2 rounded-full p-[3px]">
            <LogoMark
              restaurant={restaurant}
              size="relative h-full w-full"
              style={{ borderRadius: "9999px", background: "var(--m-surface)" }}
              fallbackStyle={{ color: "var(--m-accent)" }}
              letterSize="1.5rem"
            />
          </span>
        </div>
      </div>
      <div className="px-4 text-center">
        <h1 className="m-title mt-4 text-[2.1rem] leading-[1.4]" style={{ ...display, color: "var(--m-text)" }}>
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
          <div className="m-bk-window mx-auto mt-5 max-w-sm overflow-hidden">
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

/** سطلٌ صغير بخطوطه — بإحداثيات 0..24 × 0..26. */
function MiniBucket() {
  return (
    <svg viewBox="0 0 24 26" aria-hidden="true" className="m-bk-mini block h-8 w-7 shrink-0 overflow-visible">
      <path d="M5 6c0-4 4-6 7-5c3-1 7 1 7 5Z" fill="#d98a2b" />
      <circle cx="9" cy="4" r=".9" fill="#b3621d" />
      <circle cx="14.5" cy="3.6" r=".9" fill="#b3621d" />
      <path d="M3 8H21L19.4 25H4.6Z" fill="#ffffff" stroke="color-mix(in srgb, var(--m-text) 25%, transparent)" strokeWidth=".6" />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${5.6 + i * 5} 8h2.6l-.4 17h-2.6Z`} style={paint} />
      ))}
      <rect x="2.4" y="6.4" width="19.2" height="2.6" rx="1.3" fill="#ffffff" stroke="color-mix(in srgb, var(--m-text) 25%, transparent)" strokeWidth=".6" />
    </svg>
  );
}

/** سطلٌ صغير، والاسم على ملصق العلبة، وخطّ القصّ إلى دائرة العدد. */
export function BucketHeading({ name, items, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-bk-h mb-5">
      <div className="flex items-center gap-2.5 px-1">
        <MiniBucket />
        <h2 className="m-bk-label min-w-0 px-3 py-0.5 text-[1.4rem] leading-[1.5]" style={{ ...display, color: "var(--m-text)" }}>
          {name}
        </h2>
        <span aria-hidden="true" className="m-bk-cut block h-[2px] min-w-6 flex-1" />
        {items && <span className="m-bk-count shrink-0 px-2.5 py-1 text-[11px] font-bold">{items}</span>}
      </div>
      {photo && <div className="m-bk-photo mt-3">{photo}</div>}
    </div>
  );
}

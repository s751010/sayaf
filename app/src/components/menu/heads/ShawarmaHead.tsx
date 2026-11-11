/**
 * «شاورما» — محلّ الشاورما (٢٠٢٦/١١/٠٩، الموجة ٣).
 *
 * - `ShawarmaHead`    **سيخٌ عموديّ يدور** أمام **لوح لهبٍ** يتوهّج، فوق جدار بلاطٍ أبيض: مخروط
 *   اللحم أعرض من فوق، وطبقاته تمرّ أفقياً **مع التمرير** (`--m-scroll-y` يحرّك خلفيّته — فلا حاجة
 *   إلى باقي قسمة) ودورانٌ بطيء حين يسكن. وفي رأس السيخ **قرصٌ عليه شعارك**. وتحته صينيّةٌ من ستيل:
 *   **حين يُضاف صنفٌ تنزل السكّين على السيخ** وتتساقط الشرائح فيها (`lib/skinMotion.ts`).
 * - `ShawarmaHeading` عنوان القسم **لوحةٌ مضيئة** كلوحات المحلّ: شريطٌ أحمر بمسامير، فيه الاسم،
 *   وبطاقةٌ صفراء بالعدد — تشتعل حين يدخل القسم.
 *
 * الخامة والحركة في `styles/skins/shawarma.css`. ما يتبع العلامة: اللوحة، والسعر، والأزرار، وحلقة
 * القرص. وما لا يتبعها خامة: اللحم واللهب والستيل والبلاط — اللحم لحمٌ أيّاً كان لون التاجر.
 */
import { useId, type CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };

/** لوح اللهب خلف السيخ: شبكةٌ خزفية بأعمدةٍ خمسة، ولكلّ عمودٍ لهبه (`--n` يبدّل مدّته). */
function Burner() {
  const uid = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 120 200" aria-hidden="true" className="absolute inset-0 block h-full w-full">
      <defs>
        <linearGradient id={`m-sw-glow-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffcf5a" />
          <stop offset=".5" stopColor="#ff7a1a" />
          <stop offset="1" stopColor="#d9360f" />
        </linearGradient>
      </defs>
      {/* الإطار المعدني ولوح الخزف. */}
      <rect x="2" y="2" width="116" height="196" rx="6" fill="#3a3633" />
      <rect x="9" y="9" width="102" height="182" rx="3" fill="#1d1210" />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} className="m-sw-col" style={{ "--n": i } as CSSProperties}>
          <rect x={14 + i * 19.4} y="14" width="15" height="172" rx="2" fill={`url(#m-sw-glow-${uid})`} />
          {/* خلايا الخزف: صفوفٌ صغيرة تتوهّج. */}
          <path
            d={Array.from({ length: 14 }, (_, k) => `M${14 + i * 19.4} ${26 + k * 12}h15`).join("")}
            stroke="#5a1c08"
            strokeOpacity=".55"
            strokeWidth="1.4"
          />
        </g>
      ))}
    </svg>
  );
}

/** السكّين الطويلة: نصلٌ مائل ومقبضٌ أسود — تنزل على المخروط حين يُضاف صنف. */
function Knife() {
  return (
    <svg viewBox="0 0 40 120" aria-hidden="true" className="block h-full w-full">
      <rect x="15" y="0" width="10" height="30" rx="3" fill="#1a1716" />
      <circle cx="20" cy="9" r="1.6" fill="#c9c4bd" />
      <circle cx="20" cy="21" r="1.6" fill="#c9c4bd" />
      <rect x="13" y="29" width="14" height="4" rx="1" fill="#8e8a85" />
      <path d="M14 33H27L25 116C25 118 23 120 20 120L14 33Z" fill="#dcdad6" />
      <path d="M14 33H18L19 118" fill="none" stroke="#fff" strokeOpacity=".7" />
    </svg>
  );
}

export function ShawarmaHead({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  return (
    <header className="m-head m-head-spit relative overflow-hidden pb-1">
      <Corner>{corner}</Corner>
      <div className="m-sw-wall relative px-3 pt-9">
        <div className="m-sw-scene relative mx-auto h-[15.5rem] w-full max-w-[20rem]">
          {/* لوح اللهب خلف السيخ. */}
          <div className="m-sw-burner absolute left-1/2 top-[13%] aspect-[3/5] h-[70%] -translate-x-1/2">
            <Burner />
          </div>
          {/* القضيب: من الحامل فوق إلى الصحن تحت. */}
          <span aria-hidden="true" className="m-sw-rod absolute left-1/2 top-[7%] block h-[84%] w-[5px] -translate-x-1/2" />
          {/* المخروط: طبقات اللحم تمرّ أفقياً (خلفيّةٌ تتكرّر)، وظلٌّ أسطوانيّ ثابت فوقها. */}
          <div aria-hidden="true" className="m-sw-cone absolute left-1/2 top-[15%] h-[63%] w-[32%] -translate-x-1/2">
            <span className="m-sw-meat absolute inset-0 block" />
            <span className="m-sw-shade absolute inset-0 block" />
          </div>
          {/* الصحن تحت المخروط، والصينيّة وشرائحها. */}
          <span aria-hidden="true" className="m-sw-plate absolute left-1/2 top-[77%] block h-[4%] w-[30%] -translate-x-1/2" />
          <span aria-hidden="true" className="m-sw-tray absolute left-1/2 top-[88%] block h-[9%] w-[62%] -translate-x-1/2">
            <span className="m-sw-shaved absolute inset-x-[12%] top-[-30%] block h-[60%]" />
          </span>
          <span aria-hidden="true" className="m-sw-fall absolute left-[36%] top-[50%] block h-[30%] w-[12%]">
            <i />
            <i />
            <i />
          </span>
          <span aria-hidden="true" className="m-sw-knife absolute left-[27%] top-[16%] block h-[50%] w-[11%]">
            <Knife />
          </span>
          {/* قرص الشعار في رأس السيخ. */}
          <span className="m-sw-cap absolute left-1/2 top-[0%] z-[2] block aspect-square w-[17%] -translate-x-1/2 rounded-full">
            <LogoMark
              restaurant={restaurant}
              size="relative h-full w-full"
              style={{ borderRadius: "9999px", background: "var(--m-surface)" }}
              fallbackStyle={{ color: "var(--m-accent-ink, var(--m-accent))" }}
              letterSize="1.5rem"
            />
          </span>
        </div>
      </div>
      <div className="px-4 text-center">
        <h1 className="m-title mt-3 text-[2.15rem] leading-[1.4]" style={{ ...display, color: "var(--m-text)" }}>
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
          <div className="m-sw-window mx-auto mt-5 max-w-sm overflow-hidden">
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

/** لوحة المحلّ: شريطٌ أحمر بمسامير ركنيّة، والاسم، والعدد على بطاقةٍ صفراء — بحشوةٍ ثابتة. */
export function ShawarmaHeading({ name, items, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-sw-h mb-5">
      <div className="m-sw-panel relative flex items-center gap-3 px-4 py-2.5">
        <span aria-hidden="true" className="m-sw-screws" />
        <h2 className="min-w-0 flex-1 text-[1.45rem] leading-[1.45]" style={display}>
          {name}
        </h2>
        {items && <span className="m-sw-tag shrink-0 px-2.5 py-1 text-[11px] font-black">{items}</span>}
      </div>
      {photo && <div className="m-sw-photo mt-3">{photo}</div>}
    </div>
  );
}

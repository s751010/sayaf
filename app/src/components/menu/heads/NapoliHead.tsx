/**
 * «نابولي» — المطعم الإيطالي الأنيق (٢٠٢٦/١١/٠٩).
 *
 * - `NapoliHead`    جدارٌ من **بلاطٍ مزجّج أبيض بزهرٍ أخضر وأحمر** (الأحمر لون العلامة)، وعليه
 *   **لافتةٌ مرسومة باليد** بلون العلامة معلّقةٌ بسلسلتين من نحاس: إطارٌ بخيطٍ ذهبيّ مزدوج وزهرةٌ
 *   في كلّ ركن، و**اسمك يُرسم عليها بالفرشاة** عند الفتح وخطُّ زينةٍ ذهبيّ تحته، و**اللافتة تتمايل
 *   وأنت تمرّر**. وتحتها شعارك في **صحنٍ خزفيّ بإكليل غار**.
 * - `NapoliHeading` عنوان القسم **بلاطةٌ مزجّجة برمز القسم**، والاسم بخطّ اللافتات، و**خطّ فرشاةٍ
 *   يُرسم تحته حين يدخل القسم**، والعدد في خرطوشٍ بيضاويّ.
 *
 * الخامة والحركة في `styles/skins/napoli.css`. ما يتبع العلامة: دهان اللافتة وزهر البلاط الأحمر،
 * وخطّ الفرشاة، والسعر، والأزرار. وما لا يتبعها خامة: البلاط الأبيض والذهب والنحاس والغار. والنصّ
 * على اللافتة بـ`--m-on-accent` على `--m-accent` — زوجٌ يحرس تباينه `bestOnAccent` أيّاً كان اللون.
 */
import { useId, type CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };

/** زهرة البلاطة: أربع بتلاتٍ حول قلب — بإحداثيات بلاطةٍ 40×40 مركزها (20، 20). */
const PETALS = "M20 8C23 12 23 16 20 20C17 16 17 12 20 8ZM32 20C28 23 24 23 20 20C24 17 28 17 32 20ZM20 32C17 28 17 24 20 20C23 24 23 28 20 32ZM8 20C12 17 16 17 20 20C16 23 12 23 8 20Z";

/** الجدار: بلاطٌ مكرّر بنقشٍ (`pattern`) يقرأ لون العلامة — الأحمر هو. */
function Tiles() {
  const uid = useId().replace(/:/g, "");
  return (
    <svg aria-hidden="true" className="m-np-tiles absolute inset-0 block h-full w-full">
      <defs>
        <pattern id={`m-np-tile-${uid}`} width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#fbfaf5" />
          <path d={PETALS} style={{ fill: "var(--m-accent-2)" }} fillOpacity=".7" />
          <circle cx="20" cy="20" r="3" style={{ fill: "var(--m-accent)" }} />
          {/* أرباع الزهرة في الأركان: تلتقي ببلاط الجيران فتصير زهرةً ثانية. */}
          {[
            [0, 0],
            [40, 0],
            [0, 40],
            [40, 40],
          ].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="6.5" style={{ fill: "var(--m-accent)" }} fillOpacity=".75" />
          ))}
          <path d="M0 .5H40M.5 0V40" stroke="#d9d3c4" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#m-np-tile-${uid})`} />
    </svg>
  );
}

/** إكليل الغار حول الصحن: ورقٌ على قوسين يلتقيان من تحت. */
function Laurel() {
  const leaves = Array.from({ length: 7 }, (_, i) => {
    const a = (Math.PI * (200 + i * 22)) / 180;
    return [50 + 41 * Math.cos(a), 50 + 41 * Math.sin(a), (a * 180) / Math.PI + 90] as const;
  });
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className="absolute inset-0 block h-full w-full overflow-visible">
      {[1, -1].map((side) => (
        <g key={side} transform={side < 0 ? "translate(100 0) scale(-1 1)" : undefined} fill="#4f7d3a">
          <path d="M50 92Q14 84 12 46" fill="none" stroke="#6b5a2a" strokeWidth="1.2" />
          {leaves.map(([x, y, r], i) => (
            <ellipse key={i} cx={x} cy={y} rx="2.6" ry="6.4" transform={`rotate(${r - 30} ${x} ${y})`} fillOpacity={i % 2 ? 0.85 : 1} />
          ))}
        </g>
      ))}
    </svg>
  );
}

export function NapoliHead({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  return (
    <header className="m-head m-head-signboard relative overflow-hidden pb-1">
      <Corner>{corner}</Corner>
      <div className="m-np-wall relative px-4 pb-7 pt-20">
        <Tiles />
        <span aria-hidden="true" className="m-np-wash absolute inset-0 block" />
        {/* اللافتة معلّقةٌ بسلسلتين من رفٍّ نحاسيّ — وتتمايل حول نقطة تعليقها. */}
        <span aria-hidden="true" className="m-np-rail absolute inset-x-6 top-[3.25rem] block h-[5px]" />
        <div className="m-np-hang relative mx-auto max-w-[21rem]">
          <span aria-hidden="true" className="m-np-chain absolute -top-7 start-[16%] block h-7 w-[3px]" />
          <span aria-hidden="true" className="m-np-chain absolute -top-7 end-[16%] block h-7 w-[3px]" />
          <div className="m-np-sign relative px-6 pb-4 pt-5 text-center">
            <span aria-hidden="true" className="m-np-pin absolute inset-[7px] block" />
            {[0, 1, 2, 3].map((k) => (
              <span key={k} aria-hidden="true" className={`m-np-corner m-np-c${k} absolute block h-4 w-4`} />
            ))}
            <h1
              className="m-title m-np-name relative text-[2.15rem] font-bold leading-[1.5]"
              style={{ ...display, color: "var(--m-on-accent)" }}
            >
              {restaurant.name}
            </h1>
            <svg viewBox="0 0 120 10" aria-hidden="true" className="m-np-flourish relative mx-auto block h-2.5 w-32">
              <path d="M4 6Q30 1 60 5T116 4" fill="none" stroke="#e8c46a" strokeWidth="2" strokeLinecap="round" pathLength={1} />
            </svg>
            {typeLabel && (
              <p className="relative mt-1.5 text-[12.5px] font-bold" style={{ color: "var(--m-on-accent)" }}>
                {typeLabel}
              </p>
            )}
          </div>
        </div>
        <div className="m-np-plate relative mx-auto mt-6 h-[6.5rem] w-[6.5rem] rounded-full">
          <Laurel />
          <span className="absolute inset-[19%] block rounded-full">
            <LogoMark
              restaurant={restaurant}
              size="relative h-full w-full"
              style={{ borderRadius: "9999px", background: "var(--m-surface)" }}
              fallbackStyle={{ color: "var(--m-accent-ink, var(--m-accent))" }}
              letterSize="1.7rem"
            />
          </span>
        </div>
      </div>
      {banner && (
        <div className="px-4">
          <div className="m-np-window mx-auto mt-5 max-w-sm overflow-hidden">
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

/** البلاطة برمز القسم، ثم الاسم وخطّ الفرشاة تحته، ثم الخرطوش بالعدد. */
export function NapoliHeading({ name, items, icon = "plate", photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-np-h mb-5">
      <div className="flex items-center gap-3 px-1">
        <span aria-hidden="true" className="m-np-tile flex h-10 w-10 shrink-0 items-center justify-center">
          <Icon name={icon} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[1.5rem] font-bold leading-[1.45]" style={{ ...display, color: "var(--m-text)" }}>
            {name}
          </h2>
          <svg viewBox="0 0 140 8" preserveAspectRatio="none" aria-hidden="true" className="m-np-stroke block h-2 w-32">
            <path d="M3 5Q36 1.5 70 4.2T137 3.4" fill="none" strokeWidth="3.2" strokeLinecap="round" pathLength={1} />
          </svg>
        </div>
        {items && <span className="m-np-oval shrink-0 px-3 py-0.5 text-[11px] font-bold">{items}</span>}
      </div>
      {photo && <div className="m-np-photo mt-3">{photo}</div>}
    </div>
  );
}

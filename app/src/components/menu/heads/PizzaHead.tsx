/**
 * «ريحان» — بيتزيريا الحيّ (٢٠٢٦/١١/٠٧).
 *
 * - `PizzaHead`    طاولةٌ من رخام، وعليها مفرشُ مربّعاتٍ **ملقىً بزاويته** (معيّنٌ رأسه إلى
 *   الاسم، بحاشية كُرات)، وفوقه بيتزا كاملة من فوق وشعارك في قلبها على قرص موزاريلا،
 *   وشريحةٌ منها مسحوبةٌ والجبن ممدودٌ بينها وبين القرص، وورقتا ريحان على المفرش.
 * - `PizzaHeading` عنوان القسم **غطاء علبة بيتزا**: كرتونٌ أبيض مطبوعٌ بحبرٍ واحد (ورقة
 *   ريحان والاسم، وشريطا مربّعاتٍ على طرفيه)، والعدد لاصقٌ على الغطاء، وتحته حافّة الكرتون
 *   المضلّع. وصورة القسم على المفرش.
 *
 * الخامة والحركة في `styles/skins/pizza.css`. ما يتبع العلامة: مربّعات المفرش وحبر العلبة
 * واللاصق والسعر. وما لا يتبعها خامة: البيتزا والرخام والكرتون والريحان — البيتزا بيتزا.
 */
import { useId, type CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };
const ink = "var(--m-accent-ink, var(--m-accent))";

/** ورقة ريحان: نصلٌ مدبّب الرأس عريضُ القاعدة — للبيتزا والمفرش وحبر العلبة. */
const LEAF = "M0-11C5-8 7-1 5 4C3.6 7.5 1.6 9.3 0 10C-1.6 9.3-3.6 7.5-5 4C-7-1-5-8 0-11Z";

/** نقطةٌ على محيطٍ حول مركز البيتزا (١٠٠،١٠٠) — الزاوية بالدرجات مع عقارب الساعة. */
function at(deg: number, r: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [100 + r * Math.cos(a), 100 + r * Math.sin(a)];
}

/** قطاعٌ من الدائرة بين زاويتين. */
function wedge(from: number, to: number, r = 101): string {
  const [x1, y1] = at(from, r);
  const [x2, y2] = at(to, r);
  return `M100 100L${x1.toFixed(1)} ${y1.toFixed(1)}A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}Z`;
}

/** الشريحة المسحوبة بين ٩٠° و١٥٠° — تُسحب على منصِّفها (١٢٠°) نحو الاسم. */
const SLICE: [number, number] = [90, 150];
const CHAR = [12, 41, 66, 104, 133, 171, 198, 226, 251, 283, 309, 338];
const CHEESE: [number, number, number][] = [
  [60, 62, 16], [140, 58, 15], [154, 112, 17], [120, 152, 15], [70, 146, 16], [44, 102, 13], [100, 33, 12], [100, 100, 20],
];
const BASIL: [number, number][] = [
  [20, 25], [112, -20], [205, 60], [266, 10], [332, -35],
];

/** البيتزا من فوق: قشرةٌ ببقع الفرن، وصلصة، وموزاريلا، وريحان، وستّ قطعات — والشريحة المسحوبة. */
function Pie() {
  const id = useId().replace(/:/g, "");
  const pie = `pz-pie-${id}`;
  const crust = `pz-crust-${id}`;
  const cheese = `pz-cheese-${id}`;
  const rest = `pz-rest-${id}`;
  const cut = `pz-cut-${id}`;
  // منصِّف الشريحة: اتّجاه السحب، وأين ينقطع خيط الجبن.
  const [s1, s2] = [at(SLICE[0], 52), at(SLICE[1], 60)];
  return (
    <svg viewBox="-8 -8 216 216" aria-hidden="true" className="m-pz-pie-svg block h-full w-full overflow-visible">
      <defs>
        <radialGradient id={crust}>
          <stop offset=".8" stopColor="#f2c47e" />
          <stop offset=".9" stopColor="#d99a4e" />
          <stop offset="1" stopColor="#a5622a" />
        </radialGradient>
        <radialGradient id={cheese}>
          <stop offset="0" stopColor="#fffaf0" />
          <stop offset=".7" stopColor="#fbeccb" />
          <stop offset="1" stopColor="#f0d394" />
        </radialGradient>
        <clipPath id={rest}>
          <path d={wedge(SLICE[1], SLICE[0] + 360)} />
        </clipPath>
        <clipPath id={cut}>
          <path d={wedge(SLICE[0], SLICE[1])} />
        </clipPath>
        <g id={pie}>
          <circle cx="100" cy="100" r="99" fill={`url(#${crust})`} />
          {CHAR.map((deg, i) => {
            const [x, y] = at(deg, 91 + (i % 3) * 2);
            return <ellipse key={deg} cx={x} cy={y} rx={2.6 + (i % 4)} ry={1.8 + (i % 2)} fill="#4a2810" opacity=".55" transform={`rotate(${deg + 90} ${x} ${y})`} />;
          })}
          <circle cx="100" cy="100" r="82" fill="#c4361f" />
          <circle cx="100" cy="100" r="82" fill="none" stroke="#9e2812" strokeWidth="2.5" opacity=".55" />
          {CHEESE.map(([x, y, r]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={`url(#${cheese})`} />
          ))}
          {BASIL.map(([deg, rot]) => {
            const [x, y] = at(deg, 64);
            return (
              <g key={deg} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot})`}>
                <path d={LEAF} fill="#2f7a3a" />
                <path d="M0-8V8" stroke="#86bf7c" strokeWidth="1.1" />
              </g>
            );
          })}
          <g stroke="#6e2d0f" strokeWidth="1.4" opacity=".45">
            {[30, 90, 150, 210, 270, 330].map((deg) => {
              const [x, y] = at(deg, 99);
              return <path key={deg} d={`M100 100L${x.toFixed(1)} ${y.toFixed(1)}`} />;
            })}
          </g>
        </g>
      </defs>
      <g clipPath={`url(#${rest})`}>
        <use href={`#${pie}`} />
      </g>
      {/* خيطا الجبن ممدودان بين القرص والشريحة — يظهران مع السحب. */}
      <g className="m-pz-strings" stroke="#fff1cf" strokeWidth="2.6" strokeLinecap="round" fill="none">
        <path d={`M${s1[0].toFixed(1)} ${s1[1].toFixed(1)}q-2 6-6 10`} />
        <path d={`M${s2[0].toFixed(1)} ${s2[1].toFixed(1)}q-3 5-6 10`} />
      </g>
      <g className="m-pz-slice">
        <g clipPath={`url(#${cut})`}>
          <use href={`#${pie}`} />
        </g>
      </g>
    </svg>
  );
}

function Leaf({ className, style }: { className: string; style?: CSSProperties }) {
  return (
    <svg viewBox="-9 -11 18 22" aria-hidden="true" className={className} style={style}>
      <path d={LEAF} fill="currentColor" />
      <path d="M0-8.5V9M0-3l3.4-2.6M0-3l-3.4-2.6M0 2.5l3.6-2.4M0 2.5l-3.6-2.4" stroke="rgba(255,255,255,.5)" strokeWidth="1" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function PizzaHead({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  return (
    <header className="m-head m-head-table relative overflow-hidden pb-1">
      <Corner>{corner}</Corner>
      {/* الطاولة: المفرش معيّنٌ مركزه مركز البيتزا، فتقع البيتزا كلّها عليه. */}
      <div className="m-pz-table relative h-[15.5rem]">
        <span aria-hidden="true" className="m-pz-cloth-at absolute left-1/2 top-[6.25rem] block h-0 w-0">
          <span className="m-pz-cloth absolute block h-[13rem] w-[13rem]" />
        </span>
        <Leaf className="m-pz-loose m-pz-loose-1 absolute block h-7 w-6" />
        <Leaf className="m-pz-loose m-pz-loose-2 absolute block h-6 w-5" />
        <div className="absolute left-1/2 top-[1.25rem] h-[10rem] w-[10rem] -translate-x-1/2">
          <div className="m-pz-pie relative h-full w-full">
            <Pie />
            <span className="m-pz-mozz absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2 rounded-full p-[5px]">
              <LogoMark
                restaurant={restaurant}
                size="relative h-[3.9rem] w-[3.9rem]"
                style={{ borderRadius: "9999px", background: "var(--m-surface)" }}
                fallbackStyle={{ color: "var(--m-accent)" }}
                letterSize="1.8rem"
              />
            </span>
          </div>
        </div>
      </div>
      <div className="px-4 text-center">
        <h1 className="m-title mt-2 text-[2rem] font-bold leading-[1.45]" style={{ ...display, color: "var(--m-text)" }}>
          {restaurant.name}
        </h1>
        {typeLabel && (
          <p className="mt-0.5 text-[13px] font-bold" style={{ color: "var(--m-muted)" }}>
            {typeLabel}
          </p>
        )}
      </div>
      {banner && (
        <div className="m-pz-window mx-auto mt-5 max-w-sm overflow-hidden">
          <SafeImage
            src={banner}
            alt=""
            loading="eager"
            className="h-28 w-full object-cover"
            wrapperClassName="h-28 w-full"
            fallback={<span />}
          />
        </div>
      )}
      {children && (
        <div className="m-chips mt-5 flex flex-wrap items-center justify-center gap-2 px-4">{children}</div>
      )}
    </header>
  );
}

/** غطاء علبة البيتزا: ورقة ريحانٍ والاسم بحبرٍ واحد، والعدد لاصق، وحافّة الكرتون تحته. */
export function PizzaHeading({ name, items, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-box-h mb-4">
      <div className="m-pz-box relative">
        <div className="m-pz-lid relative flex items-center gap-2.5 py-2.5 pe-6 ps-7">
          <Leaf className="m-pz-print-leaf block h-6 w-5 shrink-0" style={{ color: ink }} />
          <h2 className="min-w-0 text-[1.35rem] font-bold leading-[1.5]" style={{ ...display, color: ink }}>
            {name}
          </h2>
          {items && <span className="m-pz-seal ms-auto shrink-0 px-2.5 py-0.5 text-[11px] font-bold">{items}</span>}
        </div>
        <span aria-hidden="true" className="m-pz-flutes mx-1 block h-2" />
      </div>
      {photo && <div className="m-pz-photo mt-3">{photo}</div>}
    </div>
  );
}

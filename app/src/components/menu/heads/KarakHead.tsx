/**
 * «كرك» — كشك الكرك الليلي (٢٠٢٦/١١/٠٧).
 *
 * - `KarakHead`    **عربة كرك في الليل**: حبلُ مصابيح يتدلّى فوقها ويضيء مصباحاً بعد مصباح،
 *   وشبّاكها مرفوعٌ على ضوءٍ دافئ — علبُ الحليب على الرفّ، وبرّادٌ يغلي على نارٍ زرقاء
 *   ويرتجف غطاؤه، وكاساتُ الكرك على الحافّة يطلع بخارها. والعربة مدهونةٌ بلون العلامة،
 *   وشعارك **لوحةٌ مضيئة** على واجهتها تحيط بها المصابيح. والاسم تحتها على الرصيف بالرقعة.
 * - `KarakHeading` عنوان القسم **كاسة**: كاسةُ كركٍ ببخارها، ثم الاسم، ثم سلكٌ بمصابيح صغيرة
 *   يتدلّى إلى العدد — والعدد **بطاقة صفيحٍ** معلّقةٌ بخيط.
 *
 * الخامة والحركة في `styles/skins/karak.css`. ما يتبع العلامة: دهان العربة (الغطاء والإطار
 * والواجهة)، والسعر، والأزرار. وما لا يتبعها خامة: المصابيح والستيل والزجاج والكرك والنار —
 * المصباح دافئٌ أيّاً كان لون التاجر.
 *
 * ⚠️ **ومختلفٌ عمداً** عن «نيون» (أنبوبٌ مضيء على جدار طوب)، و«صاج» (لوح كاونترٍ يسيل منه
 * الجبن)، و«فوّال» (صينيّة نحاسٍ صباحية): لا أنبوب ولا لوح ولا صينيّة — العربة نفسها هي
 * الترويسة، والضوء مصابيحُ حقيقية لا حروفٌ مضيئة.
 */
import { useId, type CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };

/** نقطةٌ على منحنى بيزييه تربيعيّ — مواضع المصابيح على السلك المتدلّي. */
function onQuad(p0: [number, number], p1: [number, number], p2: [number, number], t: number): [number, number] {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
}

/** السلك: تدلّيتان بين ثلاثة مسامير، والمصابيح على كلٍّ منهما. */
const SAGS: [[number, number], [number, number], [number, number]][] = [
  [[-12, 8], [98, 44], [196, 10]],
  [[196, 10], [294, 44], [404, 8]],
];
const WIRE = `M${SAGS[0][0].join(" ")}Q${SAGS[0][1].join(" ")} ${SAGS[0][2].join(" ")}Q${SAGS[1][1].join(" ")} ${SAGS[1][2].join(" ")}`;
const BULBS = SAGS.flatMap(([a, b, c]) => [0.16, 0.38, 0.62, 0.84].map((t) => onQuad(a, b, c, t)));

/** حبل المصابيح فوق العربة — كلّ مصباحٍ يضيء بدوره (`--i`) ثم يبقى مضيئاً. */
function Festoon() {
  const id = useId().replace(/:/g, "");
  const halo = `kr-halo-${id}`;
  return (
    <svg
      viewBox="0 0 392 56"
      preserveAspectRatio="xMidYMin meet"
      aria-hidden="true"
      className="m-kr-festoon pointer-events-none absolute inset-x-0 top-0 block w-full"
    >
      <defs>
        <radialGradient id={halo}>
          <stop offset="0" stopColor="#ffd27a" stopOpacity=".55" />
          <stop offset="1" stopColor="#ffd27a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d={WIRE} fill="none" stroke="#05090d" strokeWidth="1.6" />
      {BULBS.map(([x, y], i) => (
        <g key={i} className="m-kr-bulb" style={{ "--i": i } as CSSProperties}>
          <circle className="m-kr-halo" cx={x} cy={y + 9} r="15" fill={`url(#${halo})`} />
          <rect x={x - 2} y={y} width="4" height="4.5" rx=".8" fill="#2a2f33" />
          <path
            className="m-kr-glow"
            d={`M${x} ${y + 4}c-3.4 0-5 2.6-5 5.2 0 3 2.3 5.4 5 5.4s5-2.4 5-5.4c0-2.6-1.6-5.2-5-5.2Z`}
            fill="#ffe2a0"
          />
          <ellipse cx={x - 1.6} cy={y + 8} rx="1.1" ry="1.8" fill="#fff" opacity=".7" />
        </g>
      ))}
    </svg>
  );
}

/** كاسة الكرك من جانبها: زجاجٌ يضيق إلى قاعدةٍ سميكة، والكرك فيه برغوته. */
export function KarakGlass({ className, style }: { className?: string; style?: CSSProperties }) {
  const id = useId().replace(/:/g, "");
  const tea = `kr-tea-${id}`;
  return (
    <svg viewBox="0 0 24 32" aria-hidden="true" className={className} style={style}>
      <defs>
        <linearGradient id={tea} x1="0" x2="1">
          <stop offset="0" stopColor="#9c5f2b" />
          <stop offset=".4" stopColor="#d9a062" />
          <stop offset="1" stopColor="#a8682f" />
        </linearGradient>
      </defs>
      <path d="M3.4 7.2H20.6L18.9 27.4H5.1Z" fill={`url(#${tea})`} />
      <ellipse cx="12" cy="7.2" rx="8.6" ry="1.4" fill="#f3dfba" />
      <path d="M1.6 1.8H22.4L19.6 29.2Q19.4 31 17.6 31H6.4Q4.6 31 4.4 29.2Z" fill="rgba(255,255,255,.12)" stroke="rgba(255,248,236,.85)" strokeWidth=".8" />
      <path d="M5 27.6H19" stroke="rgba(255,255,255,.55)" strokeWidth="1.6" />
      <path d="M5.6 9.5 6.8 25" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" opacity=".45" />
      <ellipse cx="12" cy="1.8" rx="10.4" ry="1.2" fill="none" stroke="rgba(255,255,255,.8)" strokeWidth=".7" />
    </svg>
  );
}

/** داخل الشبّاك: الرفّ وعلبه، والبرّاد على النار، والكاسات وكوب الطريق على الحافّة. */
function Hatch() {
  const id = useId().replace(/:/g, "");
  const steel = `kr-steel-${id}`;
  const soot = `kr-soot-${id}`;
  const can = `kr-can-${id}`;
  return (
    <svg viewBox="0 0 320 124" aria-hidden="true" className="m-kr-scene relative block w-full">
      <defs>
        <linearGradient id={steel} x1="0" x2="1">
          <stop offset="0" stopColor="#4f565c" />
          <stop offset=".22" stopColor="#c9ced2" />
          <stop offset=".38" stopColor="#f6f8f9" />
          <stop offset=".6" stopColor="#9aa1a7" />
          <stop offset="1" stopColor="#454b51" />
        </linearGradient>
        <linearGradient id={soot} x1="0" x2="0" y1="0" y2="1">
          <stop offset=".55" stopColor="#1a1208" stopOpacity="0" />
          <stop offset="1" stopColor="#1a1208" stopOpacity=".45" />
        </linearGradient>
        <linearGradient id={can} x1="0" x2="1">
          <stop offset="0" stopColor="#b9b2a4" />
          <stop offset=".35" stopColor="#fbf8f2" />
          <stop offset="1" stopColor="#a49c8d" />
        </linearGradient>
      </defs>

      {/* الرفّ الخلفيّ: علب الحليب المبخّر بشريطيها، وبرطمان الشاي، وعلبة الهيل. */}
      <rect x="10" y="44" width="300" height="5" rx="1" fill="#6b4524" />
      <rect x="10" y="44" width="300" height="1.4" fill="#a8743e" />
      {[
        [22, "#c8322a"],
        [44, "#2f63a8"],
        [66, "#c8322a"],
      ].map(([x, band]) => (
        <g key={x as number} className="m-kr-can">
          <rect x={x as number} y="21" width="18" height="23" rx="2" fill={`url(#${can})`} />
          <rect x={x as number} y="27" width="18" height="9" fill={band as string} />
          <path d={`M${(x as number) + 2} 31.5h14`} stroke="#fff" strokeWidth="1.2" opacity=".75" />
          <ellipse cx={(x as number) + 9} cy="21" rx="9" ry="1.8" fill="#d9d4ca" stroke="#8d867a" strokeWidth=".6" />
        </g>
      ))}
      <rect x="92" y="18" width="17" height="26" rx="3" fill="rgba(255,255,255,.28)" stroke="rgba(255,255,255,.6)" strokeWidth=".7" />
      <rect x="93.5" y="28" width="14" height="14.5" rx="2" fill="#3a2410" />
      <rect x="91" y="14.5" width="19" height="4.5" rx="1.4" fill="#2d6b4a" />
      <rect x="116" y="30" width="15" height="14" rx="1.5" fill="#556b2f" />
      <rect x="116" y="30" width="15" height="4" fill="#7f9a46" />

      {/* البرّاد على النار: قاعدة الموقد، وألسنة زرقاء، والبرّاد بأذنه ومنقاره وغطائه. */}
      <rect x="212" y="110" width="84" height="14" rx="2.5" fill="#24282c" />
      <rect x="212" y="110" width="84" height="2" fill="#5d646a" />
      {[226, 236, 246, 256, 266, 276].map((x) => (
        <path key={x} className="m-kr-flame" d={`M${x} 110c-3.2-2.4-3.6-6.6 0-10.4 3.6 3.8 3.2 8 0 10.4Z`} fill="#3d8bff" opacity=".9" />
      ))}
      {[231, 251, 271].map((x) => (
        <path key={x} className="m-kr-flame" d={`M${x} 110c-1.8-1.4-2-3.8 0-6 2 2.2 1.8 4.6 0 6Z`} fill="#bfe0ff" />
      ))}
      <g className="m-kr-kettle">
        {/* المنقار: يخرج من أسفل البطن ويرتفع منحنياً. */}
        <path d="M222 92C210 90 204 76 196 64L190 60 194 58C204 64 210 74 224 80Z" fill={`url(#${steel})`} stroke="#3a4046" strokeWidth=".8" />
        <path d="M220 104C214 104 212 98 212 92 212 78 222 66 254 66S296 78 296 92C296 98 294 104 288 104Z" fill={`url(#${steel})`} stroke="#3a4046" strokeWidth=".8" />
        <path d="M220 104C214 104 212 98 212 92 212 78 222 66 254 66S296 78 296 92C296 98 294 104 288 104Z" fill={`url(#${soot})`} />
        <path d="M218 96C230 99 278 99 290 96" fill="none" stroke="#3a4046" strokeWidth=".8" opacity=".6" />
        {/* الأذن: قوسٌ أسود فوق البرّاد. */}
        <path d="M228 70C228 44 280 44 280 70" fill="none" stroke="#17191b" strokeWidth="4" strokeLinecap="round" />
        <g className="m-kr-lid">
          <ellipse cx="254" cy="66" rx="20" ry="4" fill={`url(#${steel})`} stroke="#3a4046" strokeWidth=".8" />
          <circle cx="254" cy="60.5" r="3.4" fill="#17191b" />
        </g>
        <ellipse cx="236" cy="82" rx="4" ry="9" fill="#fff" opacity=".35" transform="rotate(-18 236 82)" />
      </g>
      {/* البخار من المنقار ومن تحت الغطاء. */}
      <g className="m-kr-steam" fill="none" strokeWidth="2.6" strokeLinecap="round">
        <path className="m-kr-wisp" d="M190 56c-6-8 6-12 0-21s5-12 1-20" />
        <path className="m-kr-wisp" d="M248 58c-5-7 5-11 0-18s4-10 1-16" />
        <path className="m-kr-wisp" d="M262 58c-5-7 5-11 0-18s4-10 1-16" />
      </g>

      {/* كوب الطريق: أكوابٌ ورقية متداخلة بشريطٍ بلون العلامة. */}
      <g className="m-kr-cups">
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <path d={`M172 ${88 + i * 6}H194L192 ${100 + i * 6}H174Z`} fill="#fbf8f2" stroke="#c9c0b0" strokeWidth=".6" />
          </g>
        ))}
        <path d="M174 100H192L190 124H176Z" fill="#fbf8f2" stroke="#c9c0b0" strokeWidth=".6" />
        <rect x="175" y="108" width="16" height="6" style={{ fill: "var(--m-accent)" }} />
      </g>
    </svg>
  );
}

/** لوحة الشعار المضيئة: إطارٌ من ستيل عليه اثنا عشر مصباحاً، والشعار في قرصٍ مضاء. */
function Sign({ restaurant }: Pick<HeadProps, "restaurant">) {
  return (
    <span className="m-kr-sign relative block shrink-0 rounded-full p-[9px]" style={{ width: "6.2rem", height: "6.2rem" }}>
      <svg viewBox="0 0 100 100" aria-hidden="true" className="pointer-events-none absolute inset-0 block h-full w-full">
        {Array.from({ length: 14 }, (_, i) => {
          const a = (i / 14) * Math.PI * 2 - Math.PI / 2;
          return (
            <circle
              key={i}
              className="m-kr-dot"
              style={{ "--i": i } as CSSProperties}
              cx={50 + Math.cos(a) * 45.5}
              cy={50 + Math.sin(a) * 45.5}
              r="2.6"
              fill="#ffe2a0"
            />
          );
        })}
      </svg>
      <LogoMark
        restaurant={restaurant}
        size="relative h-full w-full"
        style={{ borderRadius: "9999px", background: "var(--m-text)" }}
        fallbackStyle={{ color: "var(--m-bg)" }}
        letterSize="2rem"
      />
    </span>
  );
}

export function KarakHead({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  return (
    <header className="m-head m-head-kiosk relative overflow-hidden pb-1">
      <Corner>{corner}</Corner>
      <div className="m-kr-night relative pt-12">
        <Festoon />
        <div className="m-kr-cart relative z-[1] mx-auto w-[min(21.5rem,calc(100%-1.5rem))]">
          {/* الغطاء مرفوعٌ فوق الشبّاك بذراعيه، والشبّاك في إطارٍ مدهون. */}
          <span aria-hidden="true" className="m-kr-flap relative block h-6" />
          <div className="m-kr-frame relative">
            <div className="m-kr-hatch relative overflow-hidden">
              <span aria-hidden="true" className="m-kr-warm absolute inset-0 block" />
              <Hatch />
              <span aria-hidden="true" className="m-kr-glasses absolute bottom-0 left-[5%] flex items-end gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className="m-kr-g relative block" style={{ "--i": i } as CSSProperties}>
                    {i % 2 === 0 && (
                      <svg viewBox="0 0 20 22" className="m-kr-gsteam absolute bottom-[92%] left-1/2 block h-5 w-5 -translate-x-1/2">
                        <path className="m-kr-wisp" d="M7 21c-3-4 3-6 0-10s3-5 1-9" fill="none" strokeWidth="1.6" strokeLinecap="round" />
                        <path className="m-kr-wisp" d="M13 21c-3-4 3-6 0-10s3-5 1-9" fill="none" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    )}
                    <KarakGlass className="block h-[2.15rem] w-[1.6rem]" />
                  </span>
                ))}
              </span>
            </div>
            <span aria-hidden="true" className="m-kr-ledge relative block h-[9px]" />
          </div>
          {/* الواجهة: صفيحٌ مموّج بلون العلامة، واللوحة المضيئة في وسطها، وعجلتا العربة. */}
          <div className="m-kr-front relative flex justify-center pb-3">
            <span className="relative -mt-3">
              <Sign restaurant={restaurant} />
            </span>
            <span aria-hidden="true" className="m-kr-wheel absolute -bottom-3 start-[12%] block h-7 w-7 rounded-full" />
            <span aria-hidden="true" className="m-kr-wheel absolute -bottom-3 end-[12%] block h-7 w-7 rounded-full" />
          </div>
        </div>
        <span aria-hidden="true" className="m-kr-ground relative block h-6" />
      </div>
      <div className="px-4 text-center">
        <h1 className="m-title mt-2 text-[2.3rem] font-bold leading-[1.45]" style={{ ...display, color: "var(--m-text)" }}>
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
          <div className="m-kr-window mx-auto mt-5 max-w-sm overflow-hidden">
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

/** الكاسة وبخارها، ثم الاسم، ثم سلك المصابيح إلى العدد — والعدد بطاقة صفيح. */
export function KarakHeading({ name, items, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-glass-h mb-4">
      <div className="flex items-center gap-2.5 px-1">
        <span aria-hidden="true" className="m-kr-hglass relative block shrink-0">
          <svg viewBox="0 0 20 18" className="absolute bottom-[90%] left-1/2 block h-4 w-5 -translate-x-1/2">
            <path className="m-kr-wisp" d="M7 17c-3-4 3-6 0-10s3-5 1-7" fill="none" strokeWidth="1.6" strokeLinecap="round" />
            <path className="m-kr-wisp" d="M13 17c-3-4 3-6 0-10s3-5 1-7" fill="none" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <KarakGlass className="block h-[2.3rem] w-[1.75rem]" />
        </span>
        <h2 className="min-w-0 text-[1.65rem] font-bold leading-[1.5]" style={{ ...display, color: "var(--m-text)" }}>
          {name}
        </h2>
        <span aria-hidden="true" className="m-kr-wire block h-5 min-w-8 flex-1" />
        {items && <span className="m-kr-tag relative shrink-0 px-2.5 pb-0.5 pt-1.5 text-[11px] font-bold">{items}</span>}
      </div>
      {photo && <div className="m-kr-photo mt-3">{photo}</div>}
    </div>
  );
}

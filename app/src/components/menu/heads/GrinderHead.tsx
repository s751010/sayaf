/**
 * «مطحنة» — زاوية الطحن اليدوي (٢٠٢٦/١١/٠٩).
 *
 * - `GrinderHead`    **مطحنة صندوقٍ من خشب الجوز** على رفّ تحت ضوء مصباحٍ دافئ: وعاءٌ من
 *   نحاسٍ أصفر فيه البنّ، وذراعٌ نحاسيّ بمقبضٍ خشبيّ **يدور مع التمرير** (`--m-scroll-y`، والزاوية
 *   تُرسم مداراً بيضويّاً بـ`cos()`/`sin()` في `skins/grinder.css`)، ويدور دورةً كاملة حين يُضاف
 *   صنف. وشعارك في **إطارٍ نحاسيّ** على وجه الصندوق، ودرجه تحته مدهونٌ بلون العلامة بمقبضٍ نحاسيّ.
 * - `GrinderHeading` عنوان القسم **درجةُ طحن**: قرصُ ضبطٍ نحاسيّ يدور مؤشّره إلى درجة القسم حين
 *   يدخل الشاشة، والاسم، ثم كومةُ بنٍّ مطحون **تصغر حبيباتها قسماً بعد قسم** (خشنٌ ⇐ ناعم) والعدد
 *   على لوحٍ نحاسيّ.
 *
 * الخامة والحركة في `styles/skins/grinder.css`. ما يتبع العلامة: دهان الدرج، وحبر السعر، والأزرار.
 * وما لا يتبعها خامة: الجوز والنحاس والبنّ والكتّان.
 */
import type { CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };

/** درجات الطحن — خمسٌ ثم تعود: القسم الأوّل خشن، والخامس ناعمٌ كالإسبريسو. */
export const GRIND_LEVELS = 5;

/** المطحنة بإحداثيات 320×200: الصندوق والوعاء والذراع. والمحور (160, 40). */
function Mill() {
  return (
    <svg viewBox="0 0 320 200" aria-hidden="true" className="absolute inset-0 block h-full w-full overflow-visible">
      <defs>
        <linearGradient id="m-gr-walnut" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4a2d1a" />
          <stop offset=".18" stopColor="#6b4227" />
          <stop offset=".55" stopColor="#7a4d2e" />
          <stop offset=".85" stopColor="#5c3820" />
          <stop offset="1" stopColor="#3f2615" />
        </linearGradient>
        <linearGradient id="m-gr-brass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8a6a2a" />
          <stop offset=".3" stopColor="#e9cf86" />
          <stop offset=".5" stopColor="#fff1c2" />
          <stop offset=".72" stopColor="#c9a24a" />
          <stop offset="1" stopColor="#7d5e22" />
        </linearGradient>
        <radialGradient id="m-gr-beans" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#5a3820" />
          <stop offset="1" stopColor="#2a170b" />
        </radialGradient>
      </defs>
      {/* ظلّ المطحنة على الرفّ. */}
      <ellipse cx="160" cy="186" rx="70" ry="6" fill="rgba(30,18,8,.32)" />
      {/* القاعدة والصندوق: جوزٌ بعروقه، وزوايا أغمق. */}
      <rect x="98" y="176" width="124" height="9" rx="2.5" fill="#3f2615" />
      <rect x="104" y="86" width="112" height="92" rx="4" fill="url(#m-gr-walnut)" />
      <g stroke="#2a170b" strokeOpacity=".28" fill="none" strokeWidth=".9">
        <path d="M112 90Q118 120 113 150T116 176" />
        <path d="M128 88Q124 118 130 146T126 176" />
        <path d="M192 88Q198 116 191 148T196 176" />
        <path d="M206 90Q202 122 208 152T204 176" />
      </g>
      <rect x="104" y="86" width="112" height="92" rx="4" fill="none" stroke="#2a170b" strokeOpacity=".5" />
      <path d="M106 88H214" stroke="#fff" strokeOpacity=".16" strokeWidth="2" />
      {/* الدرج: مدهونٌ بلون العلامة بإطارٍ غائر، ومقبضه نحاس. */}
      <rect className="m-gr-paint" x="116" y="141" width="88" height="31" rx="2.5" style={{ fill: "var(--m-accent)" }} />
      <rect x="116" y="141" width="88" height="31" rx="2.5" fill="none" stroke="#000" strokeOpacity=".35" />
      <rect x="120" y="145" width="80" height="23" rx="1.5" fill="none" stroke="#fff" strokeOpacity=".22" />
      <circle cx="160" cy="160" r="4.6" fill="url(#m-gr-brass)" stroke="#6b4f1c" strokeWidth=".8" />
      {/* إطار الشعار النحاسيّ على وجه الصندوق. */}
      <circle cx="160" cy="113" r="21.5" fill="url(#m-gr-brass)" stroke="#6b4f1c" strokeWidth=".9" />
      {[0, 1, 2, 3].map((i) => {
        const a = (Math.PI / 4) * (2 * i + 1);
        return <circle key={i} cx={160 + 18.5 * Math.cos(a)} cy={113 + 18.5 * Math.sin(a)} r="1.1" fill="#6b4f1c" />;
      })}
      {/* الطوق والوعاء النحاسيّ: يتّسع إلى فوق، وفيه البنّ. */}
      <rect x="112" y="80" width="96" height="8" rx="2" fill="url(#m-gr-brass)" stroke="#6b4f1c" strokeWidth=".8" />
      <path d="M120 80L114 58Q160 50 206 58L200 80Z" fill="url(#m-gr-brass)" stroke="#6b4f1c" strokeWidth=".8" />
      <path d="M124 64Q160 70 196 64" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="1.6" />
      <ellipse cx="160" cy="57" rx="45" ry="7.5" fill="url(#m-gr-brass)" stroke="#6b4f1c" strokeWidth=".8" />
      <ellipse cx="160" cy="57.5" rx="39" ry="5.4" fill="url(#m-gr-beans)" />
      <g fill="#7a4d2e">
        {[
          [134, 57, 20], [146, 55, -30], [176, 56, 40], [188, 58, -10], [152, 59, 60], [168, 59.5, -50], [140, 59.6, 0], [182, 55, 15],
        ].map(([x, y, r], i) => (
          <ellipse key={i} cx={x} cy={y} rx="3" ry="1.7" transform={`rotate(${r} ${x} ${y})`} />
        ))}
      </g>
      {/* المحور: ساقٌ نحاسيّة من قلب الوعاء إلى صُرّة الذراع. */}
      <rect x="157.5" y="38" width="5" height="20" rx="1.5" fill="url(#m-gr-brass)" />
      {/* الذراع: يدور حول المحور — والمقبض وحده لا ينضغط. */}
      <g className="m-gr-arm">
        <rect x="160" y="37.6" width="62" height="4.8" rx="2.4" fill="url(#m-gr-brass)" stroke="#6b4f1c" strokeWidth=".6" />
      </g>
      <g className="m-gr-knob">
        <rect x="155.5" y="18" width="9" height="22" rx="4.5" fill="url(#m-gr-walnut)" stroke="#2a170b" strokeWidth=".7" />
        <rect x="157" y="21" width="2" height="15" rx="1" fill="#fff" fillOpacity=".22" />
        <ellipse cx="160" cy="40" rx="4.6" ry="1.8" fill="url(#m-gr-brass)" />
      </g>
      <circle cx="160" cy="40" r="5.6" fill="url(#m-gr-brass)" stroke="#6b4f1c" strokeWidth=".8" />
      <circle cx="160" cy="40" r="1.8" fill="#6b4f1c" />
    </svg>
  );
}

export function GrinderHead({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  return (
    <header className="m-head m-head-mill relative overflow-hidden pb-1">
      <Corner>{corner}</Corner>
      <div className="m-gr-wall relative px-3 pt-10">
        <span aria-hidden="true" className="m-gr-lamp absolute inset-0 block" />
        <div className="m-gr-scene relative mx-auto aspect-[16/10] w-full max-w-[21rem]">
          <Mill />
          {/* شعارك في الإطار النحاسيّ على وجه الصندوق. */}
          <span className="m-gr-plaque absolute left-1/2 top-[56.5%] z-[2] block aspect-square w-[11.6%] -translate-x-1/2 -translate-y-1/2 rounded-full p-[2px]">
            <LogoMark
              restaurant={restaurant}
              size="relative h-full w-full"
              style={{ borderRadius: "9999px", background: "var(--m-surface)" }}
              fallbackStyle={{ color: "var(--m-accent)" }}
              letterSize="1.2rem"
            />
          </span>
        </div>
        <span aria-hidden="true" className="m-gr-shelf -mx-3 block h-[16px]" />
      </div>
      <div className="px-4 text-center">
        <h1 className="m-title mt-4 text-[2rem] font-bold leading-[1.6]" style={{ ...display, color: "var(--m-text)" }}>
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
          <div className="m-gr-window mx-auto mt-5 max-w-sm overflow-hidden">
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

/** قرص الضبط: إطارٌ نحاسيّ ووجهٌ كريميّ بخمس شُرَط، والمؤشّر يدور إلى الدرجة (`--lvl`). */
function Dial() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className="m-gr-dial block h-10 w-10 shrink-0">
      {/* بلا تدرّجٍ بمعرّف: القرص في كلّ قسم، ومعرّفٌ يتكرّر في الصفحة لا يصحّ. */}
      <circle cx="20" cy="20" r="19" fill="#c9a24a" stroke="#6b4f1c" strokeWidth=".8" />
      <path d="M5.5 14A15.5 15.5 0 0 1 30 6.5" fill="none" stroke="#fff1c2" strokeOpacity=".8" strokeWidth="3" strokeLinecap="round" />
      <circle cx="20" cy="20" r="14.5" fill="#fbf4e6" stroke="#6b4f1c" strokeOpacity=".4" strokeWidth=".8" />
      <g stroke="#2a2118" strokeLinecap="round">
        {Array.from({ length: GRIND_LEVELS }, (_, i) => {
          const a = ((-150 + i * 30) * Math.PI) / 180;
          return (
            <path
              key={i}
              d={`M${(20 + 10.5 * Math.cos(a)).toFixed(2)} ${(20 + 10.5 * Math.sin(a)).toFixed(2)}L${(20 + 13 * Math.cos(a)).toFixed(2)} ${(20 + 13 * Math.sin(a)).toFixed(2)}`}
              strokeWidth={i === 0 || i === GRIND_LEVELS - 1 ? 1.8 : 1.2}
            />
          );
        })}
      </g>
      <g className="m-gr-pointer">
        <path d="M20 20L20 8.6" stroke="#2a2118" strokeWidth="2" strokeLinecap="round" />
      </g>
      <circle cx="20" cy="20" r="2.6" fill="#d9b866" stroke="#6b4f1c" strokeWidth=".6" />
    </svg>
  );
}

/** القرص، ثم الاسم، ثم خطٌّ إلى كومة البنّ واللوح النحاسيّ بالعدد. */
export function GrinderHeading({ name, items, index, photo }: SkinHeadingProps) {
  const lvl = index % GRIND_LEVELS;
  return (
    <div className="m-h m-gr-h mb-5" style={{ "--lvl": lvl } as CSSProperties}>
      <div className="flex items-center gap-3 px-1">
        <Dial />
        <h2 className="min-w-0 text-[1.45rem] font-bold leading-[1.6]" style={{ ...display, color: "var(--m-text)" }}>
          {name}
        </h2>
        <span aria-hidden="true" className="m-gr-rule block h-px min-w-6 flex-1" />
        <span aria-hidden="true" className="m-gr-mound block shrink-0" />
        {items && <span className="m-gr-brass shrink-0 px-2.5 py-1 text-[11px] font-bold">{items}</span>}
      </div>
      {photo && <div className="m-gr-photo mt-3">{photo}</div>}
    </div>
  );
}

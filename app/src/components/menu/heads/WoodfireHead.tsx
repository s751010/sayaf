/**
 * «حطب» — بيتزيريا فرن الحطب (٢٠٢٦/١١/٠٩).
 *
 * - `WoodfireHead`    **فرن قبّةٍ مكسوٌّ بفسيفساء بلون العلامة** على قاعدةٍ من حجر أمام جدارٍ من
 *   طوبٍ مدخّن، وفي فوهته المقوّسة **نارٌ تتراقص** على الحطب وتوهّجها على حجر القاعدة، والدخان من
 *   مدخنته النحاسية. وشعارك **وسامٌ نحاسيّ** فوق الفوهة. وعلى القاعدة مطرحة: **حين يُضاف صنفٌ
 *   تدخل البيتزا الفرن عليها** وتشتدّ النار ثم تعود المطرحة فارغة (`lib/skinMotion.ts`).
 * - `WoodfireHeading` عنوان القسم **فوهةٌ صغيرة تتّقد حين يدخل القسم**، والاسم، وحطبٌ مرصوص إلى
 *   العدد على بلاطة فخّار بلون العلامة.
 *
 * الخامة والحركة في `styles/skins/woodfire.css`. ما يتبع العلامة: فسيفساء القبّة، وبلاطة العدد،
 * والسعر، والأزرار. وما لا يتبعها خامة: النار والحجر والطوب والنحاس والحطب — النار نارٌ أيّاً
 * كان لون التاجر.
 */
import { useId, type CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };

/** القبّة نصفُ إهليلجٍ قاعدته (160، 168): نصف عرضها ٩٦ وارتفاعها ١٢٤. */
const DOME = { cx: 160, base: 168, a: 96, b: 124 };
const DOME_PATH = `M${DOME.cx - DOME.a} ${DOME.base}C${DOME.cx - DOME.a} 92 108 44 ${DOME.cx} 44C212 44 ${DOME.cx + DOME.a} 92 ${DOME.cx + DOME.a} ${DOME.base}Z`;

/** نصف عرض القبّة على ارتفاع `y`. */
function halfWidth(y: number): number {
  const t = (DOME.base - y) / DOME.b;
  return t >= 1 ? 0 : DOME.a * Math.sqrt(1 - t * t);
}

/** صفوف الفسيفساء: ستّةٌ من القاعدة إلى القمّة، وفي كلّ صفٍّ بلاطٌ بعرضٍ واحد تقريباً. */
const COURSES = [168, 150, 132, 114, 96, 79, 62, 44];

/** بلاط القبّة: خانةٌ بين صفّين، وفي بعضها لمعةٌ أو ظلّ — فسيفساءٌ لا لونٌ مصمت. */
function tiles(): { d: string; tone: number }[] {
  const out: { d: string; tone: number }[] = [];
  for (let k = 0; k < COURSES.length - 1; k++) {
    const y0 = COURSES[k];
    const y1 = COURSES[k + 1];
    const w0 = halfWidth(y0 - 0.01);
    const w1 = halfWidth(y1 + 0.01);
    const n = Math.max(3, Math.round((w0 * 2) / 15));
    const shift = k % 2 ? 0.5 : 0;
    for (let i = -1; i < n + 1; i++) {
      const a = Math.max(0, Math.min(1, (i + shift) / n));
      const b = Math.max(0, Math.min(1, (i + 1 + shift) / n));
      if (b <= a) continue;
      const x = (w: number, t: number) => (DOME.cx - w + 2 * w * t).toFixed(1);
      out.push({
        d: `M${x(w0, a)} ${y0}L${x(w0, b)} ${y0}L${x(w1, b)} ${y1}L${x(w1, a)} ${y1}Z`,
        tone: (i * 7 + k * 3) % 5,
      });
    }
  }
  return out;
}
const TILES = tiles();

/** لسان لهب: قاعدته (cx، by) وعرضه w وارتفاعه h — رأسٌ مدبّب يميل قليلاً. */
function flame(cx: number, by: number, w: number, h: number, lean = 0): string {
  const tx = cx + lean;
  return (
    `M${cx - w / 2} ${by}C${cx - w / 2} ${by - h * 0.42} ${tx - w * 0.12} ${by - h * 0.62} ${tx} ${by - h}` +
    `C${tx + w * 0.12} ${by - h * 0.62} ${cx + w / 2} ${by - h * 0.42} ${cx + w / 2} ${by}Z`
  );
}

/** ألسنة النار من الخلف إلى الأمام — لكلٍّ رقصته (`--n` يبدّل مدّتها في CSS). */
const FLAMES = [
  { cx: 146, w: 16, h: 30, lean: -3 },
  { cx: 172, w: 15, h: 27, lean: 3 },
  { cx: 158, w: 20, h: 38, lean: 1 },
  { cx: 136, w: 11, h: 19, lean: -2 },
  { cx: 182, w: 11, h: 18, lean: 2 },
];

/** الفرن بإحداثيات 320×210: الجدار خلفه HTML، والقبّة والفوهة والقاعدة والمطرحة هنا. */
function Oven() {
  const uid = useId().replace(/:/g, "");
  const id = (k: string) => `m-wf-${k}-${uid}`;
  return (
    <svg viewBox="0 0 320 210" aria-hidden="true" className="absolute inset-0 block h-full w-full overflow-visible">
      <defs>
        <clipPath id={id("dome")}>
          <path d={DOME_PATH} />
        </clipPath>
        <radialGradient id={id("shade")} cx=".36" cy=".3" r=".8">
          <stop offset="0" stopColor="#fff" stopOpacity=".28" />
          <stop offset=".45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".42" />
        </radialGradient>
        <linearGradient id={id("in")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d0704" />
          <stop offset=".6" stopColor="#3a1607" />
          <stop offset="1" stopColor="#7a2c0b" />
        </linearGradient>
        <linearGradient id={id("fo")} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ff5a0f" />
          <stop offset=".55" stopColor="#ff8a1c" />
          <stop offset="1" stopColor="#ffd36b" stopOpacity=".2" />
        </linearGradient>
        <linearGradient id={id("fi")} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#fff2c2" />
          <stop offset=".6" stopColor="#ffc94a" />
          <stop offset="1" stopColor="#ffb02e" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={id("glow")} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#ffb347" stopOpacity=".75" />
          <stop offset="1" stopColor="#ff6a1a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("copper")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7a3f1d" />
          <stop offset=".35" stopColor="#e2a06a" />
          <stop offset=".55" stopColor="#ffd2a6" />
          <stop offset=".8" stopColor="#b8683a" />
          <stop offset="1" stopColor="#6a3417" />
        </linearGradient>
        <linearGradient id={id("wood")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c08a55" />
          <stop offset="1" stopColor="#8a5a30" />
        </linearGradient>
      </defs>

      {/* الدخان من المدخنة — نفثتان تعلوان وتتلاشيان. */}
      <g className="m-wf-smoke" fill="#d9cfc4">
        <circle cx="160" cy="14" r="5" />
        <circle cx="166" cy="6" r="4" />
      </g>
      {/* المدخنة النحاسية فوق القبّة. */}
      <rect x="151" y="20" width="18" height="30" rx="2" fill={`url(#${id("copper")})`} />
      <rect x="147" y="17" width="26" height="6" rx="2" fill={`url(#${id("copper")})`} stroke="#5a2c12" strokeWidth=".6" />

      {/* القبّة: فسيفساء بلون العلامة — بلاطٌ بنبراتٍ خمس، وملاطٌ داكن، وضوءٌ من فوق. */}
      <g clipPath={`url(#${id("dome")})`}>
        <path d={DOME_PATH} style={{ fill: "var(--m-accent)" }} />
        {TILES.map((t, i) => (
          <path
            key={i}
            d={t.d}
            fill={t.tone < 2 ? "#fff" : "#000"}
            fillOpacity={[0.2, 0.08, 0.06, 0.16, 0.26][t.tone]}
            stroke="#1a0f0a"
            strokeOpacity=".55"
            strokeWidth=".9"
          />
        ))}
        <path d={DOME_PATH} fill={`url(#${id("shade")})`} />
      </g>
      <path d={DOME_PATH} fill="none" stroke="#120a06" strokeOpacity=".7" strokeWidth="1.4" />

      {/* القاعدة الحجرية: كتلٌ بملاط، وحافّةٌ فوقها. */}
      <rect x="34" y="166" width="252" height="36" rx="3" fill="#8f8070" />
      <g stroke="#3a3029" strokeOpacity=".55" strokeWidth="1" fill="none">
        <path d="M34 178H286M34 190H286" />
        <path d="M70 166V178M118 166V178M202 166V178M250 166V178M50 178V190M96 178V190M144 178V190M176 178V190M224 178V190M270 178V190M78 190V202M130 190V202M190 190V202M242 190V202" />
      </g>
      <rect x="30" y="163" width="260" height="6" rx="2" fill="#b3a28d" />
      <path d="M30 163H290" stroke="#fff" strokeOpacity=".25" />

      {/* توهّج النار على حجر القاعدة أمام الفوهة. */}
      <ellipse className="m-wf-glow" cx="160" cy="168" rx="70" ry="11" fill={`url(#${id("glow")})`} />

      {/* قوس الحجر حول الفوهة: صنجاتٌ فاتحة. */}
      <path d="M114 168V138A46 46 0 0 1 206 138V168Z" fill="#d6c2a3" stroke="#3a3029" strokeOpacity=".6" />
      <g stroke="#3a3029" strokeOpacity=".5" strokeWidth=".9">
        {Array.from({ length: 9 }, (_, i) => {
          const a = Math.PI + (Math.PI * (i + 0.5)) / 9;
          return (
            <path
              key={i}
              d={`M${(160 + 34 * Math.cos(a)).toFixed(1)} ${(138 + 34 * Math.sin(a)).toFixed(1)}L${(160 + 46 * Math.cos(a)).toFixed(1)} ${(138 + 46 * Math.sin(a)).toFixed(1)}`}
            />
          );
        })}
      </g>

      {/* الفوهة من الداخل: عتمةٌ يحمرّ قاعها، والحطب، والنار. */}
      <path d="M126 168V138A34 34 0 0 1 194 138V168Z" fill={`url(#${id("in")})`} />
      <g className="m-wf-fire">
        <ellipse cx="160" cy="161" rx="30" ry="5" fill="#ff7a1f" opacity=".55" />
        {FLAMES.map((f, i) => (
          <g key={i} className="m-wf-flame" style={{ "--n": i } as CSSProperties}>
            <path d={flame(f.cx, 162, f.w, f.h, f.lean)} fill={`url(#${id("fo")})`} />
            <path d={flame(f.cx, 162, f.w * 0.55, f.h * 0.6, f.lean * 0.5)} fill={`url(#${id("fi")})`} />
          </g>
        ))}
        {/* الحطب: ثلاث قطعٍ متقاطعة بأطرافٍ مقطوعة. */}
        <g>
          <rect x="138" y="158" width="36" height="7" rx="3.5" fill={`url(#${id("wood")})`} transform="rotate(-12 156 161)" />
          <rect x="146" y="158" width="36" height="7" rx="3.5" fill={`url(#${id("wood")})`} transform="rotate(12 164 161)" />
          <circle cx="139" cy="164.5" r="3.2" fill="#e8c08a" stroke="#6a4020" strokeWidth=".6" />
          <circle cx="181" cy="164.5" r="3.2" fill="#e8c08a" stroke="#6a4020" strokeWidth=".6" />
        </g>
        <g className="m-wf-sparks" fill="#ffd36b">
          <circle cx="150" cy="128" r="1" />
          <circle cx="168" cy="122" r=".9" />
          <circle cx="160" cy="116" r=".8" />
        </g>
      </g>

      {/* وسام الشعار النحاسيّ فوق الفوهة. */}
      <circle cx="160" cy="70" r="22" fill={`url(#${id("copper")})`} stroke="#4a2410" strokeWidth=".9" />
      <circle cx="160" cy="70" r="18.6" fill="none" stroke="#4a2410" strokeOpacity=".5" strokeDasharray="1.2 2.2" />

      {/* المطرحة على القاعدة: نصلٌ مستدير ويدٌ طويلة — وعليها البيتزا حين يُضاف صنف. */}
      <g className="m-wf-peel">
        <rect x="226" y="176" width="92" height="5" rx="2.5" fill={`url(#${id("wood")})`} />
        <ellipse cx="226" cy="178.5" rx="22" ry="6.5" fill="#c99a63" stroke="#7a4e26" strokeWidth=".8" />
        <g className="m-wf-pie">
          <ellipse cx="226" cy="177" rx="17" ry="4.6" fill="#e8b46a" />
          <ellipse cx="226" cy="176.6" rx="14" ry="3.6" fill="#c8361f" />
          <g fill="#fff3d6">
            <ellipse cx="220" cy="176.4" rx="3" ry="1.2" />
            <ellipse cx="230" cy="175.8" rx="3.2" ry="1.3" />
            <ellipse cx="226" cy="178" rx="2.6" ry="1" />
          </g>
          <g fill="#2f7a3a">
            <ellipse cx="224" cy="175.6" rx="1.6" ry=".8" />
            <ellipse cx="233" cy="177.4" rx="1.6" ry=".8" />
          </g>
        </g>
      </g>
    </svg>
  );
}

export function WoodfireHead({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  return (
    <header className="m-head m-head-dome relative overflow-hidden pb-1">
      <Corner>{corner}</Corner>
      <div className="m-wf-wall relative px-3 pt-10">
        <div className="m-wf-scene relative mx-auto aspect-[32/21] w-full max-w-[22rem]">
          <Oven />
          {/* شعارك في الوسام النحاسيّ فوق الفوهة: مركزه (160، 70) ونصف قطره ١٧. */}
          <span className="m-wf-medal absolute left-1/2 top-[33.3%] z-[2] block aspect-square w-[10.6%] -translate-x-1/2 -translate-y-1/2 rounded-full">
            <LogoMark
              restaurant={restaurant}
              size="relative h-full w-full"
              style={{ borderRadius: "9999px", background: "var(--m-surface)" }}
              fallbackStyle={{ color: "var(--m-accent-ink, var(--m-accent))" }}
              letterSize="1.15rem"
            />
          </span>
        </div>
      </div>
      <div className="px-4 text-center">
        <h1 className="m-title mt-4 text-[2.05rem] font-black leading-[1.45]" style={{ ...display, color: "var(--m-text)" }}>
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
          <div className="m-wf-window mx-auto mt-5 max-w-sm overflow-hidden">
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

/** فوهةٌ صغيرة بقوسها الحجريّ، والنار فيها تتّقد حين يدخل القسم. */
function Hearth() {
  return (
    <svg viewBox="0 0 40 34" aria-hidden="true" className="m-wf-hearth block h-[34px] w-10 shrink-0">
      <path d="M4 33V18A16 16 0 0 1 36 18V33Z" fill="#d6c2a3" stroke="#3a3029" strokeOpacity=".55" strokeWidth=".8" />
      <path d="M9 33V19A11 11 0 0 1 31 19V33Z" fill="#1a0c05" />
      <g className="m-wf-hfire">
        <path d={flame(16, 31, 7, 12, -1)} fill="#ff7a1f" />
        <path d={flame(24, 31, 7, 11, 1)} fill="#ff7a1f" />
        <path d={flame(20, 31, 9, 16, 0)} fill="#ff9a2a" />
        <path d={flame(20, 31, 4.5, 9, 0)} fill="#ffe08a" />
      </g>
      <rect x="12" y="29" width="16" height="3" rx="1.5" fill="#8a5a30" />
      <path d="M2 33H38" stroke="#8f8070" strokeWidth="2" />
    </svg>
  );
}

/** الفوهة، ثم الاسم، ثم حطبٌ مرصوص إلى بلاطة الفخّار بالعدد. */
export function WoodfireHeading({ name, items, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-wf-h mb-5">
      <div className="flex items-center gap-3 px-1">
        <Hearth />
        <h2 className="min-w-0 text-[1.45rem] font-black leading-[1.5]" style={{ ...display, color: "var(--m-text)" }}>
          {name}
        </h2>
        <span aria-hidden="true" className="m-wf-logs block h-[9px] min-w-6 flex-1" />
        {items && <span className="m-wf-tile shrink-0 px-2.5 py-1 text-[11px] font-black">{items}</span>}
      </div>
      {photo && <div className="m-wf-photo mt-3">{photo}</div>}
    </div>
  );
}

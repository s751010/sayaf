/**
 * «درايف» — كشك القهوة السريع (٢٠٢٦/١١/٠٩).
 *
 * - `DriveHead`    **شبّاك الكشك** مدهونٌ بلون العلامة تحت مظلّةٍ مقلّمة، ولافتته المستديرة
 *   **شعارك**، ومن الشبّاك يدٌ تناول **كوباً بكمّ كرتونٍ مختوم** إلى نافذة سيارةٍ واقفة على
 *   المسار، وسهمٌ وخطٌّ متقطّع على الإسفلت. السيارة تدخل وتقف عند الفتح والكوب يُناوَل، وخطّ
 *   المسار يجري مع التمرير (`--m-scroll-y`، `lib/skinMotion.ts`).
 * - `DriveHeading` عنوان القسم **كوبٌ بكمّه** والختم بلون العلامة، ثم الاسم، ثم خطّ مسارٍ متقطّع
 *   إلى العدد على **لوحة مسار** داكنة.
 *
 * الخامة والحركة في `styles/skins/drive.css`. ما يتبع العلامة: دهان الكشك وختم الكمّ والأزرار
 * والسعر. وما لا يتبعها خامة: الإسفلت والزجاج والكرتون وجسم السيارة.
 */
import type { CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };
const paint: CSSProperties = { fill: "var(--m-accent)" };

/** الكوب الورقيّ بكمّه — بإحداثياته الخاصّة 0..24 × 0..34؛ والختم بلون العلامة. */
function SleevedCup() {
  return (
    <g>
      <path d="M3 8H21L18.6 32.4A1.8 1.8 0 0 1 16.8 34H7.2A1.8 1.8 0 0 1 5.4 32.4Z" fill="#fdfcf9" stroke="#cfc8bc" strokeWidth=".7" />
      <path d="M4 14H20L19 25H5Z" fill="#c9a46e" />
      <path d="M4 14H20L19.8 16H4.2Z" fill="#b08a55" />
      <circle cx="12" cy="19.6" r="3.6" fill="none" style={{ stroke: "var(--m-accent)" }} strokeWidth="1.6" />
      <circle cx="12" cy="19.6" r="1.4" style={paint} />
      <path d="M1.6 5.6A1.6 1.6 0 0 1 3.2 4H20.8A1.6 1.6 0 0 1 22.4 5.6V8.4H1.6Z" fill="#2b2420" />
      <rect x="6" y="1.4" width="12" height="3.2" rx="1.6" fill="#3c332d" />
    </g>
  );
}

/** المشهد بإحداثيات 320×200: الكشك يميناً، والسيارة يساراً، والإسفلت تحتهما. */
function Lane() {
  return (
    <svg viewBox="0 0 320 200" aria-hidden="true" className="absolute inset-0 block h-full w-full overflow-visible">
      <defs>
        <linearGradient id="m-dr-car" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6f7f8" />
          <stop offset=".55" stopColor="#d7dbdf" />
          <stop offset="1" stopColor="#a9b0b6" />
        </linearGradient>
        <linearGradient id="m-dr-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b4650" />
          <stop offset="1" stopColor="#1b2228" />
        </linearGradient>
        <linearGradient id="m-dr-shade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity=".16" />
          <stop offset=".25" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".1" />
        </linearGradient>
        <clipPath id="m-dr-road">
          <rect x="0" y="174" width="320" height="26" />
        </clipPath>
      </defs>

      {/* الإسفلت: داكنٌ بحصاه، وخطّ المسار المتقطّع يجري، وسهمٌ مرسوم. */}
      <rect x="0" y="174" width="320" height="26" fill="#2b2f33" />
      <g clipPath="url(#m-dr-road)">
        <g className="m-dr-dashes">
          {Array.from({ length: 14 }, (_, i) => (
            <rect key={i} x={-40 + i * 32} y="186" width="18" height="3" rx="1" fill="#f4f1e6" fillOpacity=".85" />
          ))}
        </g>
      </g>
      <path d="M232 194H262V190L272 196L262 202V198H232Z" fill="#f4f1e6" fillOpacity=".8" />
      {/* الكشك: جدارٌ مدهون بلون العلامة، ومظلّةٌ مقلّمة، والشبّاك المضاء. */}
      <rect className="m-dr-paint" x="186" y="18" width="134" height="158" style={paint} />
      <rect x="186" y="18" width="134" height="158" fill="url(#m-dr-shade)" />
      <path d="M186 18H320V30H186Z" fill="#000" fillOpacity=".12" />
      <g className="m-dr-awning">
        <path d="M180 66H320V80H180Z" fill="#fdfcf9" />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <path key={i} d={`M${180 + i * 20} 66h10v14h-10Z`} style={paint} />
        ))}
        <path d="M180 80Q185 86 190 80Q195 86 200 80Q205 86 210 80Q215 86 220 80Q225 86 230 80Q235 86 240 80Q245 86 250 80Q255 86 260 80Q265 86 270 80Q275 86 280 80Q285 86 290 80Q295 86 300 80Q305 86 310 80Q315 86 320 80" fill="#fdfcf9" stroke="#000" strokeOpacity=".08" />
      </g>
      <rect x="198" y="90" width="110" height="62" rx="4" fill="#2a2f34" />
      <rect className="m-dr-glow" x="202" y="94" width="102" height="54" rx="2" fill="#ffe9b8" />
      <path d="M202 94H304V110Q253 104 202 116Z" fill="#fff" fillOpacity=".35" />
      {/* رفّ الشبّاك ستيل، والجرس عليه. */}
      <rect x="192" y="150" width="122" height="7" rx="2" fill="#c9ced2" stroke="#8d949a" strokeWidth=".8" />
      <rect x="192" y="150" width="122" height="2" rx="1" fill="#fff" fillOpacity=".7" />

      {/* اليد من الشبّاك: كمٌّ داكن، وكفٌّ تمسك الكوب — تُناوَل نحو السيارة. */}
      <g className="m-dr-hand">
        <path d="M232 120H206Q198 120 196 128L194 134H234Z" fill="#2f3b45" />
        <ellipse cx="190" cy="128" rx="9" ry="7" fill="#c98f62" />
        <g transform="translate(170 108) scale(1.25)">
          <SleevedCup />
        </g>
      </g>

      {/* السيارة: بابٌ أماميّ بنافذةٍ مفتوحة، ومرآة، وعجلة — وجسمٌ لؤلؤيّ (خامة). */}
      <g className="m-dr-car">
        <path d="M-40 96Q-30 70 6 66L116 64Q142 64 158 86L170 108Q176 120 176 134V160Q176 168 168 168H-40Z" fill="url(#m-dr-car)" stroke="#8d949a" strokeWidth="1" />
        <path d="M8 74L112 72Q132 72 146 92L154 106H8Z" fill="url(#m-dr-glass)" />
        {/* النافذة مفتوحة: الزجاج نزل، ويبقى طرفه فوق الباب. */}
        <path d="M14 104H150" stroke="#5a656e" strokeWidth="3" />
        <path d="M30 80Q60 76 92 78" fill="none" stroke="#fff" strokeOpacity=".12" strokeWidth="5" strokeLinecap="round" />
        {/* المقود ويد السائق ممدودة نحو الكوب. */}
        <ellipse cx="54" cy="104" rx="16" ry="5" fill="none" stroke="#11161a" strokeWidth="3.4" />
        <path d="M104 104Q130 100 150 96" fill="none" stroke="#c98f62" strokeWidth="7" strokeLinecap="round" />
        <path d="M-40 120H170" stroke="#8d949a" strokeOpacity=".6" />
        <rect x="118" y="124" width="18" height="4" rx="2" fill="#8d949a" />
        {/* المرآة الجانبية على ساقها. */}
        <path d="M156 92L166 88" stroke="#2b3036" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="170" cy="84" rx="6" ry="8.5" fill="#2b3036" />
        <ellipse cx="170.6" cy="84" rx="4" ry="6.4" fill="#8fa3b0" />
        <circle cx="34" cy="168" r="23" fill="#1b1f23" />
        <g className="m-dr-wheel">
          <circle cx="34" cy="168" r="13" fill="#9aa1a7" />
          <path d="M34 156V180M22 168H46M25.5 159.5L42.5 176.5M42.5 159.5L25.5 176.5" stroke="#5d6268" strokeWidth="2.4" />
          <circle cx="34" cy="168" r="3.6" fill="#d7dbdf" />
        </g>
      </g>

    </svg>
  );
}

export function DriveHead({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  return (
    <header className="m-head m-head-lane relative overflow-hidden pb-1">
      <Corner>{corner}</Corner>
      <div className="m-dr-sky relative pt-9">
        <div className="m-dr-scene relative mx-auto aspect-[16/10] w-full max-w-[24rem]">
          <Lane />
          {/* لافتة الكشك المستديرة فوق المظلّة: شعارك في إطارٍ أبيض مضاء. */}
          <span className="m-dr-sign absolute left-[78.4%] top-[21%] z-[2] block aspect-square w-[17%] -translate-x-1/2 -translate-y-1/2 rounded-full p-[3px]">
            <LogoMark
              restaurant={restaurant}
              size="relative h-full w-full"
              style={{ borderRadius: "9999px", background: "var(--m-surface)" }}
              fallbackStyle={{ color: "var(--m-text)" }}
              letterSize="1.6rem"
            />
          </span>
        </div>
      </div>
      <div className="px-4 text-center">
        <h1 className="m-title mt-4 text-[2.05rem] leading-[1.45]" style={{ ...display, color: "var(--m-text)" }}>
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
          <div className="m-dr-window mx-auto mt-5 max-w-sm overflow-hidden">
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

/** الكوب بكمّه، ثم الاسم، ثم خطّ المسار إلى لوحة المسار بالعدد. */
export function DriveHeading({ name, items, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-dr-h mb-4">
      <div className="flex items-center gap-3 px-1">
        <svg viewBox="-1 0 26 35" aria-hidden="true" className="m-dr-cup block h-[2.7rem] w-8 shrink-0 overflow-visible">
          <SleevedCup />
        </svg>
        <h2 className="min-w-0 text-[1.5rem] leading-[1.5]" style={{ ...display, color: "var(--m-text)" }}>
          {name}
        </h2>
        <span aria-hidden="true" className="m-dr-rule block h-[3px] min-w-6 flex-1" />
        {items && <span className="m-dr-plate shrink-0 px-2.5 py-1 text-[11px] font-bold">{items}</span>}
      </div>
      {photo && <div className="m-dr-photo mt-3">{photo}</div>}
    </div>
  );
}

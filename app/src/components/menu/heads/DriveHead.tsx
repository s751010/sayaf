/**
 * «درايف» — كشك القهوة السريع (٢٠٢٦/١١/٠٩).
 *
 * - `DriveHead`    **الكشك** مدهونٌ بلون العلامة تحت مظلّةٍ مقلّمة، ولافتته المستديرة **شعارك**،
 *   وشبّاكٌ بإطارٍ ورفّ ستيل تمتدّ منه يدٌ تناول **كوباً بكمّ كرتونٍ مختوم** إلى **سيارةٍ كاملة**
 *   واقفة على المسار، ولوحة منيو صغيرة مضيئة، وسهمٌ ومخروط وخطٌّ متقطّع على الإسفلت (أُعيد رسمه
 *   ١١/١١: السيارة كانت مقصوصةً من حافّة الشاشة). السيارة تدخل وتقف عند الفتح والكوب يُناوَل،
 *   وخطّ المسار يجري والعجلات تدور مع التمرير (`--m-scroll-y`، `lib/skinMotion.ts`).
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
/** خطوط المظلّة: لون العلامة أغمق قليلاً — يُقرأ على الأبيض وعلى دهان الكشك معاً. */
const stripe: CSSProperties = { fill: "color-mix(in srgb, var(--m-accent) 78%, #000)" };

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

/**
 * المشهد بإحداثيات 320×200 (أُعيد رسمه ٢٠٢٦/١١/١١، طلب المالك): **سيارةٌ كاملة** داخل الإطار يساراً
 * — جانبيّةٌ بعجلتين وزجاجٍ وظلٍّ على الأرض، والسائق يمدّ يده من نافذته المفتوحة — و**الكشك** يميناً:
 * سقفٌ داكن ولافتة الشعار فوقه، ومظلّةٌ مقلّمة، وشبّاكٌ بإطارٍ ورفّ ستيل تمتدّ منه يدٌ بالكوب، ولوحة
 * منيو صغيرة مضيئة، والرصيف تحته؛ وعلى الإسفلت سهمٌ وخطّ مسارٍ متقطّع ومخروط. مسطّحٌ بلا تدرّجات.
 * والسيارة والإسفلت والزجاج خامة؛ ودهان الكشك وخطوط مظلّته بلون العلامة.
 */
function Lane() {
  return (
    <svg viewBox="0 0 320 200" aria-hidden="true" className="absolute inset-0 block h-full w-full">
      <defs>
        <clipPath id="m-dr-road">
          <rect x="0" y="152" width="320" height="48" />
        </clipPath>
      </defs>

      {/* السماء: شمسٌ وغيمتان مسطّحة. */}
      <circle cx="34" cy="34" r="13" fill="#ffd66b" />
      <g fill="#ffffff">
        <path d="M66 52a9 9 0 0 1 17-4a7 7 0 0 1 11 6H62a5 5 0 0 1 4-2Z" />
        <path d="M138 30a8 8 0 0 1 15-3a6 6 0 0 1 10 5h-28a4.5 4.5 0 0 1 3-2Z" />
      </g>

      {/* الرصيف والإسفلت: حافّة الرصيف، والسهم، وخطّ المسار المتقطّع يجري. */}
      <rect x="0" y="144" width="320" height="8" fill="#d5d8d3" />
      <rect x="0" y="144" width="320" height="2" fill="#ffffff" fillOpacity=".7" />
      <rect x="0" y="152" width="320" height="48" fill="#2e3236" />
      <g clipPath="url(#m-dr-road)">
        <g className="m-dr-dashes">
          {Array.from({ length: 14 }, (_, i) => (
            <rect key={i} x={-40 + i * 32} y="193" width="18" height="3" rx="1.5" fill="#f4f1e6" fillOpacity=".85" />
          ))}
        </g>
      </g>
      <path className="m-dr-arrow" d="M202 163H232V158.5L244 166L232 173.5V169H202Z" fill="#f4f1e6" fillOpacity=".85" />

      {/* المخروط على الإسفلت أمام الكشك. */}
      <g className="m-dr-cone">
        <path d="M296 166L302 166L307 184H291Z" fill="#f26a21" />
        <path d="M294.6 171.5H303.4L304.4 175.5H293.6Z" fill="#ffffff" />
        <rect x="287" y="183" width="24" height="4" rx="1.2" fill="#d4561a" />
      </g>

      {/* الكشك: سقفٌ داكن، وجسمٌ مدهون بلون العلامة، وتنّورةٌ أغمق على الرصيف. */}
      <rect x="196" y="44" width="116" height="10" rx="2" fill="#2b2f33" />
      <rect className="m-dr-paint" x="200" y="54" width="108" height="92" style={paint} />
      <rect x="200" y="136" width="108" height="10" fill="#000" fillOpacity=".14" />
      <rect x="200" y="54" width="4" height="92" fill="#000" fillOpacity=".08" />

      {/* المظلّة: خطوطٌ بيضاء وبلون العلامة الأغمق، وحافّةٌ مموّجة. */}
      <g className="m-dr-awning">
        <rect x="194" y="60" width="120" height="14" fill="#ffffff" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={194 + i * 20} y="60" width="10" height="14" style={stripe} />
        ))}
        <path
          d="M194 74h120v2a5 5 0 0 1-10 0a5 5 0 0 1-10 0a5 5 0 0 1-10 0a5 5 0 0 1-10 0a5 5 0 0 1-10 0a5 5 0 0 1-10 0a5 5 0 0 1-10 0a5 5 0 0 1-10 0a5 5 0 0 1-10 0a5 5 0 0 1-10 0a5 5 0 0 1-10 0a5 5 0 0 1-10 0Z"
          fill="#ffffff"
        />
        <rect x="194" y="74" width="120" height="1.2" fill="#000" fillOpacity=".08" />
      </g>

      {/* الشبّاك: إطارٌ داكن، وزجاجٌ دافئ مضاء بلمعة، ورفّ ستيل. */}
      <rect x="206" y="86" width="60" height="46" rx="3" fill="#23272b" />
      <rect className="m-dr-glow" x="210" y="90" width="52" height="38" rx="1.5" fill="#fff0c7" />
      <path d="M210 90H232L216 128H210Z" fill="#ffffff" fillOpacity=".45" />
      <rect x="235" y="90" width="2" height="38" fill="#23272b" />
      <rect x="202" y="131" width="68" height="5" rx="1.5" fill="#c9ced2" />
      <rect x="202" y="131" width="68" height="1.4" rx=".7" fill="#ffffff" />

      {/* لوحة المنيو الصغيرة المضيئة على وجه الكشك. */}
      <g className="m-dr-board">
        <rect x="274" y="88" width="30" height="42" rx="2.5" fill="#1f2327" />
        <rect x="277" y="91" width="24" height="5" rx="1" style={paint} />
        {[100, 107, 114, 121].map((y) => (
          <g key={y}>
            <rect x="277.5" y={y} width="14" height="2.6" rx="1.3" fill="#fff4d6" />
            <rect x="294.5" y={y} width="6" height="2.6" rx="1.3" fill="#fff4d6" fillOpacity=".6" />
          </g>
        ))}
        <rect x="286" y="130" width="3" height="16" fill="#1f2327" />
      </g>

      {/* اليد من الشبّاك: كمٌّ داكن وكفٌّ تمسك الكوب — تُناوَل إلى نافذة السيارة. */}
      <g className="m-dr-hand">
        <path d="M214 110H190Q184 110 183 116L182 121H214Z" fill="#33414c" />
        <ellipse cx="180" cy="116" rx="6.5" ry="5.5" fill="#c98f62" />
        <g transform="translate(160 97) scale(.95)">
          <SleevedCup />
        </g>
      </g>

      {/* السيارة كاملةً: ظلٌّ على الأرض، وجسمٌ بلونين مسطّحين، وزجاجٌ ونافذةٌ مفتوحة، وعجلتان. */}
      <g className="m-dr-car">
        <ellipse cx="96" cy="186" rx="84" ry="4.5" fill="#000" fillOpacity=".28" />
        <path
          d="M14 166V145Q14 134 25 133L40 131L55 110Q58 106 64 106H118Q124 106 128 110L148 130L166 133Q177 135 177 147V166Q177 174 169 174H22Q14 174 14 166Z"
          fill="#2a8796"
        />
        {/* الكتف الفاتح فوق خطّ الجسم — لونٌ ثانٍ لا تدرّج. */}
        <path d="M14 145Q14 134 25 133L40 131H148L166 133Q177 135 177 145Z" fill="#37a2b1" />
        <rect x="14" y="152" width="163" height="2" fill="#1d6672" />
        {/* الزجاج: خلفيّ، والنافذة الأماميّة مفتوحة يظهر منها السائق. */}
        <path d="M46 129L58 113Q60 110 64 110H90V129Z" fill="#26323b" />
        <path d="M96 110H118Q121 110 124 113L141 129H96Z" fill="#141a1f" />
        <path d="M96 117H133" stroke="#3a4650" strokeWidth="2" />
        <path d="M60 116Q72 112 86 113" fill="none" stroke="#ffffff" strokeOpacity=".22" strokeWidth="3" strokeLinecap="round" />
        <circle cx="112" cy="120" r="6.2" fill="#2a2420" />
        <path d="M120 125Q136 121 153 116" fill="none" stroke="#c98f62" strokeWidth="5" strokeLinecap="round" />
        <rect x="91" y="110" width="5" height="62" fill="#1d6672" />
        {/* المقابض، والمصباح الأماميّ والخلفيّ، والمرآة، والصدّام. */}
        <rect x="76" y="140" width="10" height="2.6" rx="1.3" fill="#1d6672" />
        <rect x="120" y="140" width="10" height="2.6" rx="1.3" fill="#1d6672" />
        <path d="M170 138H177V146H168Z" fill="#fff3c4" />
        <rect x="14" y="137" width="5" height="9" rx="1" fill="#e2412b" />
        <path d="M141 125L149 122Q152 121 152 124V129H143Z" fill="#1d6672" />
        <rect x="12" y="162" width="167" height="5" rx="2.5" fill="#23282c" />
        {/* العجلتان: قوسٌ داكن، وإطار، وجنطٌ يدور. */}
        {[48, 144].map((cx) => (
          <g key={cx}>
            <path d={`M${cx - 18} 174A18 18 0 0 1 ${cx + 18} 174Z`} fill="#1a1e21" />
            <circle cx={cx} cy="170" r="14" fill="#1b1f23" />
            <g className="m-dr-wheel">
              <circle cx={cx} cy="170" r="8" fill="#c9ced2" />
              <path
                d={`M${cx} 163.5V176.5M${cx - 6.5} 170H${cx + 6.5}`}
                stroke="#8d949a"
                strokeWidth="2.2"
              />
              <circle cx={cx} cy="170" r="2.6" fill="#eef0f2" />
            </g>
          </g>
        ))}
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
      <div className="m-dr-sky relative pt-14">
        <div className="m-dr-scene relative mx-auto aspect-[16/10] w-full max-w-[24rem]">
          <Lane />
          {/* لافتة الكشك المستديرة فوق المظلّة: شعارك في إطارٍ أبيض مضاء. */}
          <span className="m-dr-sign absolute left-[79.4%] top-[14%] z-[2] block aspect-square w-[15%] -translate-x-1/2 -translate-y-1/2 rounded-full p-[3px]">
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

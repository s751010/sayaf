/**
 * «مغرفة» — محلّ الآيسكريم والجيلاتو (٢٠٢٦/١١/١١، الموجة ب).
 *
 * - `ScoopHead`    **ثلّاجة عرض**: زجاجٌ مائل فوق أربعة أحواضٍ بنكهاتها (نكهة العلامة · فانيلا · نعناع
 *   وفستق · شوكولاتة)، ولافتةٌ بلون العلامة فوقها **وشعارك في وسطها**، وبجانبها **بسكوتةٌ في حاملها**.
 *   مع التمرير **تنزلق المغرفة فوق الأحواض** والنكهة التي تحتها تُضاء (`--m-scroll-y`، `lib/skinMotion.ts`)،
 *   و**حين يُضاف صنفٌ تغرف المغرفة كرةً تطير إلى البسكوتة** فتستقرّ فوق كرتها.
 * - `ScoopHeading` عنوان القسم **بسكوتةٌ بكرة** يتبدّل لونها لكلّ قسم — أربع درجاتٍ من لون العلامة
 *   (`color-mix`: صافٍ · فاتحٌ بالأبيض · ممزوجٌ بالنعناع · غامقٌ بالحبر)، ورشّاتٌ إلى العدد.
 *
 * الخامة والحركة في `styles/skins/scoop.css`. ما يتبع العلامة: اللافتة وشريط الثلّاجة ونكهتها الأولى وكرة
 * البسكوتة والأقسام والأزرار. وما لا يتبعها خامة: الفانيلا والشوكولاتة والبسكوتة والزجاج والستيل.
 */
import type { CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };

/** الأحواض الأربعة: موضعها ونكهتها (صنفٌ يلوّنه CSS — الأولى بلون العلامة والثالثة بزينته). */
const TUBS = [22, 64, 106, 148] as const;

/** كرة آيسكريم بحافّةٍ متموّجة من تحت (حيث تلتقي بالبسكوتة) ولمعة. */
function Ball({ cx, cy, r, className }: { cx: number; cy: number; r: number; className?: string }) {
  const w = r * 0.34;
  return (
    <g className={className}>
      <path
        d={`M${cx - r} ${cy}a${r} ${r} 0 1 1 ${r * 2} 0q${-w / 2} ${w} ${-w} 0q${-w / 2} ${w} ${-w} 0q${-w / 2} ${w} ${-w} 0q${-w / 2} ${w} ${-w} 0q${-w / 2} ${w} ${-w} 0q${-w / 2} ${w} ${-(r * 2 - w * 5)} 0Z`}
        className="m-sc-cream"
      />
      <path d={`M${cx - r * 0.5} ${cy - r * 0.45}q${r * 0.3} ${-r * 0.35} ${r * 0.75} ${-r * 0.3}`} fill="none" stroke="#ffffff" strokeOpacity=".6" strokeWidth="2.2" strokeLinecap="round" />
    </g>
  );
}

/** المشهد بإحداثيات 240×200: اللافتة أعلى، والثلّاجة تحتها، والبسكوتة في حاملها يميناً. */
function Freezer() {
  return (
    <svg viewBox="0 0 240 200" aria-hidden="true" className="absolute inset-0 block h-full w-full overflow-visible">
      {/* اللافتة: لوحٌ بلون العلامة بإطارٍ أبيض، وحبلاها إلى أعلى. */}
      <g>
        <path d="M78 4V14M162 4V14" stroke="color-mix(in srgb, var(--m-text) 35%, transparent)" strokeWidth="1.6" />
        <rect x="46" y="12" width="148" height="38" rx="12" className="m-sc-sign" />
        <rect x="50" y="16" width="140" height="30" rx="9" fill="none" stroke="#ffffff" strokeOpacity=".75" strokeWidth="1.5" strokeDasharray="1 4" strokeLinecap="round" />
      </g>

      {/* جسم الثلّاجة: أبيض بشريطٍ بلون العلامة، وقاعدةٌ أغمق. */}
      <rect x="10" y="118" width="186" height="72" rx="6" fill="#ffffff" />
      <rect x="10" y="146" width="186" height="11" className="m-sc-band" />
      <rect x="10" y="178" width="186" height="12" rx="4" fill="#000" fillOpacity=".08" />
      <g fill="#000" fillOpacity=".07">
        {[30, 70, 110, 150].map((x) => (
          <rect key={x} x={x} y="165" width="26" height="3" rx="1.5" />
        ))}
      </g>
      <ellipse cx="104" cy="193" rx="96" ry="4" fill="#000" fillOpacity=".12" />

      {/* داخل الثلّاجة: الأرضية الباردة، والأحواض الأربعة بنكهاتها، وضوء النكهة المختارة. */}
      <path d="M16 118L26 70H180L190 118Z" fill="#eef6f8" />
      {TUBS.map((x, i) => (
        <g key={x} className={`m-sc-tub m-sc-t${i}`}>
          <ellipse className="m-sc-lit" cx={x + 19} cy="100" rx="24" ry="17" fill="#ffffff" />
          <path
            d={`M${x + 2} 106Q${x + 5} 89 ${x + 15} 92Q${x + 22} 85 ${x + 29} 91Q${x + 36} 90 ${x + 36} 106Z`}
            className={`m-sc-flavor m-sc-n${i}`}
          />
          <path d={`M${x + 9} 95q5-4 10-2`} fill="none" stroke="#ffffff" strokeOpacity=".55" strokeWidth="2" strokeLinecap="round" />
          <rect x={x} y="104" width="38" height="14" rx="2" fill="#dfe5e8" stroke="#b7c1c6" strokeWidth=".8" />
          <rect x={x + 12} y="108" width="14" height="5" rx="1.5" fill="#ffffff" />
          <rect x={x + 14} y="109.6" width="10" height="1.8" rx=".9" className={`m-sc-tag m-sc-n${i}`} />
        </g>
      ))}

      {/* المغرفة: تنزلق فوق الأحواض مع التمرير (الغلاف)، وتغرف حين يُضاف صنف (الداخل). */}
      <g className="m-sc-scoop">
        <g className="m-sc-dig">
          <path d="M47 92L57 78" stroke="#aab4ba" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M55 81L63 70" className="m-sc-handle" strokeWidth="5" strokeLinecap="round" />
          <path d="M33 92a8 8 0 0 0 16 0Z" fill="#c9d1d6" stroke="#9aa5ab" strokeWidth=".8" />
        </g>
      </g>

      {/* زجاج العرض المائل فوق كلّ شيء: انعكاسان وحافّةٌ بيضاء. */}
      <path d="M10 118L22 66H184L196 118Z" fill="#dff1f7" fillOpacity=".28" />
      <path d="M22 66H184" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
      <path d="M40 112L50 74M56 112L62 86" stroke="#ffffff" strokeOpacity=".7" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M10 118H196" stroke="#ffffff" strokeWidth="3" />

      {/* البسكوتة في حاملها، وكرتها بلون العلامة. */}
      <rect x="211" y="150" width="16" height="40" rx="3" className="m-sc-holder" />
      <rect x="206" y="146" width="26" height="7" rx="3.5" className="m-sc-holder" />
      <g className="m-sc-cone">
        <path d="M207 126H231L219 168Z" fill="#e2a55a" />
        <path d="M210 131L224 148M215 126L228 142M209 138L221 154M223 126L230 134M213 145L218 160" stroke="#b9772f" strokeWidth="1.1" />
        <path d="M228 131L214 148M223 126L210 142M229 138L217 154M215 126L208 134M225 145L220 160" stroke="#b9772f" strokeWidth="1.1" />
        <Ball cx={219} cy={122} r={12} className="m-sc-ball0" />
      </g>
      {/* الكرة الجديدة: مخفيّةٌ حتى يُضاف صنف — تطير من المغرفة وتستقرّ فوق الأولى. */}
      <Ball cx={219} cy={106} r={10.5} className="m-sc-fly" />
    </svg>
  );
}

export function ScoopHead({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  return (
    <header className="m-head m-head-scoop relative overflow-hidden pb-1">
      <Corner>{corner}</Corner>
      <div className="m-sc-stage relative overflow-hidden pt-14">
        <div className="m-sc-scene relative mx-auto aspect-[6/5] w-full max-w-[19rem]">
          <Freezer />
          {/* الشعار في وسط اللافتة: دائرةٌ بيضاء بحلقةٍ بيضاء على لون العلامة. */}
          <span className="m-sc-seal absolute left-1/2 top-[15.5%] z-[2] block aspect-square w-[21%] -translate-x-1/2 -translate-y-1/2 rounded-full p-[2px]">
            <LogoMark
              restaurant={restaurant}
              size="relative h-full w-full"
              style={{ borderRadius: "9999px", background: "var(--m-surface)" }}
              fallbackStyle={{ color: "var(--m-accent)" }}
              letterSize="1.35rem"
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
          <div className="m-sc-window mx-auto mt-5 max-w-sm overflow-hidden">
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

/** بسكوتةٌ صغيرة بكرةٍ — بإحداثيات 0..24 × 0..30. لون الكرة من صنف القسم (`m-sc-f*`). */
function MiniCone() {
  return (
    <svg viewBox="0 0 24 30" aria-hidden="true" className="m-sc-mini block h-9 w-7 shrink-0 overflow-visible">
      <path d="M4.5 13H19.5L12 29Z" fill="#e2a55a" />
      <path d="M7 15.5L15 25M10.5 13L17.5 21M5.5 18L12.5 27M14.5 13L18.5 17" stroke="#b9772f" strokeWidth=".8" />
      <path d="M17 15.5L9 25M13.5 13L6.5 21M18.5 18L11.5 27M9.5 13L5.5 17" stroke="#b9772f" strokeWidth=".8" />
      <g className="m-sc-mini-ball">
        <path d="M4 12a8 8 0 1 1 16 0q-1.3 2.4-2.7 0q-1.3 2.4-2.6 0q-1.4 2.4-2.7 0q-1.3 2.4-2.6 0q-1.4 2.4-2.7 0q-1.3 2.4-2.7 0Z" className="m-sc-cream" />
        <path d="M8 7.5q2-2.2 5-2" fill="none" stroke="#ffffff" strokeOpacity=".65" strokeWidth="1.6" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** بسكوتةٌ بكرةٍ بلون القسم، والاسم، ورشّاتٌ إلى العدد. */
export function ScoopHeading({ name, items, index, photo }: SkinHeadingProps) {
  return (
    <div className={`m-h m-sc-h m-sc-f${index % 4} mb-5`}>
      <div className="flex items-center gap-2.5 px-1">
        <MiniCone />
        <h2 className="min-w-0 text-[1.45rem] leading-[1.5]" style={{ ...display, color: "var(--m-text)" }}>
          {name}
        </h2>
        <span aria-hidden="true" className="m-sc-sprinkles block h-[6px] min-w-6 flex-1" />
        {items && <span className="m-sc-count shrink-0 px-2.5 py-1 text-[11px] font-bold">{items}</span>}
      </div>
      {photo && <div className="m-sc-photo mt-3">{photo}</div>}
    </div>
  );
}

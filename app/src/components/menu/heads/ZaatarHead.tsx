/**
 * «زعتر» — محلّ المناقيش والفطائر (٢٠٢٦/١١/١١، الموجة ب).
 *
 * - `ZaatarHead`    **صاجٌ** محدّبٌ من حديدٍ على حاملٍ ولهبٍ صغير، و**لوحُ خشبٍ** أمامه عليه عجينةٌ تُفرد تحت
 *   الشوبك، ومنقوشة جبنٍ جاهزة، وفطيرةٌ مثلّثة، و**كيسُ ورقٍ** كرافت يساراً **وشعارك ختمٌ عليه**. مع التمرير
 *   **تُفرد العجينة ويُرشّ عليها الزعتر** (`--m-scroll-y`، `lib/skinMotion.ts`)، و**حين يُضاف صنفٌ تقفز المنقوشة
 *   إلى الصاج فتنتفخ** فقاعاتٍ وتخرج إلى اللوح.
 * - `ZaatarHeading` عنوان القسم **رغيف منقوشة** بيضويّ مرشوشٌ بالزعتر **ورمز القسم مختومٌ في وسطه**، والاسم،
 *   ونقاط زعترٍ إلى العدد على ورق الكيس.
 *
 * ⚠️ **لا فوهة نار**: «فرن» فوهة فرنٍ حجريّ ورغيف، و«حطب» فرن قبّة بيتزا — وهنا الصاج واللوح والزعتر.
 *
 * الخامة والحركة في `styles/skins/zaatar.css`. ما يتبع العلامة: الزعتر وختم الكيس وإطار الرغيف والأزرار.
 * وما لا يتبعها خامة: العجين والجبن والخشب والحديد وورق الكيس واللهب.
 */
import type { CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };

/** حبّات الزعتر على العجينة المفرودة — مواضعها ثابتة، وظهورها مع التمرير. */
const SPRINKLE: readonly [number, number][] = [
  [92, 154], [100, 159], [108, 152], [116, 158], [124, 153], [132, 159], [140, 155], [104, 156],
  [120, 161], [128, 150], [96, 150], [136, 151], [112, 149], [146, 157], [88, 157],
];

/** المشهد بإحداثيات 260×190: الكيس يساراً، والصاج يميناً، واللوح أمامهما. */
function Saj() {
  return (
    <svg viewBox="0 0 260 190" aria-hidden="true" className="absolute inset-0 block h-full w-full overflow-visible">
      {/* كيس الورق: جسمٌ كرافت بحافّةٍ مسنّنة وطيّة، وجانبٌ أغمق. */}
      <path d="M14 46L20 40L26 46L32 40L38 46L44 40L50 46L56 40L62 46L68 40L74 46V150H14Z" fill="#cfa772" />
      <path d="M62 46L68 40L74 46V150H62Z" fill="#b88d55" />
      <path d="M14 58H74" stroke="#b88d55" strokeWidth="1.2" />
      <ellipse cx="44" cy="152" rx="34" ry="4" fill="#000" fillOpacity=".12" />

      {/* الصاج: قبّةٌ حديديّة محدّبة على حامل، ولهبٌ صغير تحتها. */}
      <g className="m-za-flame">
        <path d="M168 118q4-10 10-14q6 4 10 14Z" fill="#f2a33a" />
        <path d="M172 118q3-6 6-9q4 3 6 9Z" fill="#fde08a" />
      </g>
      <path d="M150 140L162 116M206 140L194 116" stroke="#4a4744" strokeWidth="3" strokeLinecap="round" />
      <path d="M124 112Q178 52 232 112Z" fill="#3b3936" />
      <path d="M140 96Q170 68 200 74" fill="none" stroke="#ffffff" strokeOpacity=".22" strokeWidth="4" strokeLinecap="round" />
      <path d="M124 112H232" stroke="#26241f" strokeWidth="3" strokeLinecap="round" />
      {/* حرارة الصاج: بخارٌ رقيق يعلو قمّته. */}
      <g className="m-za-heat" fill="none" stroke="#ffffff" strokeOpacity=".7" strokeWidth="2" strokeLinecap="round">
        <path d="M168 66c-4-6 4-8 0-15" />
        <path d="M188 66c-4-6 4-8 0-15" />
      </g>

      {/* اللوح: خشبٌ بعروقه وحافّته. */}
      <rect x="62" y="140" width="190" height="30" rx="6" fill="#c99a5e" />
      <rect x="62" y="164" width="190" height="8" rx="4" fill="#a87a43" />
      <path d="M72 146H150M170 166H240M190 146H244" stroke="#b5864c" strokeWidth="1.2" strokeLinecap="round" />
      <ellipse cx="157" cy="176" rx="96" ry="4" fill="#000" fillOpacity=".12" />

      {/* العجينة تُفرد تحت الشوبك، ويُرشّ عليها الزعتر — مع التمرير. */}
      <g className="m-za-dough">
        <ellipse cx="117" cy="155" rx="34" ry="10" fill="#f1dcaa" />
        <ellipse cx="117" cy="154" rx="30" ry="8" fill="#f6e6bf" />
      </g>
      <g className="m-za-sprinkle">
        {SPRINKLE.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.5" className="m-za-herb" style={{ "--m-za-i": i } as CSSProperties} />
        ))}
      </g>
      <g className="m-za-pin">
        <rect x="76" y="141" width="82" height="7" rx="3.5" fill="#d9b37a" />
        <rect x="66" y="142" width="12" height="5" rx="2.5" fill="#9b6c36" />
        <rect x="156" y="142" width="12" height="5" rx="2.5" fill="#9b6c36" />
      </g>

      {/* الفطيرة المثلّثة. */}
      <path d="M226 160L238 140L250 160Z" fill="#e8c27e" stroke="#c99b55" strokeWidth="1" strokeLinejoin="round" />
      <path d="M232 156L238 146L244 156" fill="none" stroke="#c99b55" strokeWidth=".8" />

      {/* المنقوشة الجاهزة — تقفز إلى الصاج حين يُضاف صنف وتنتفخ. */}
      <g className="m-za-bake">
        <ellipse cx="190" cy="153" rx="28" ry="9" fill="#e6bf74" />
        <ellipse cx="190" cy="152" rx="24" ry="7" fill="#f7efd8" />
        <g fill="#ffffff">
          <circle cx="180" cy="151" r="3" />
          <circle cx="193" cy="149" r="3.4" />
          <circle cx="202" cy="153" r="2.6" />
          <circle cx="187" cy="155" r="2.4" />
        </g>
        <g className="m-za-blister" fill="#c48a3c">
          <circle cx="176" cy="148" r="2" />
          <circle cx="198" cy="147" r="2.4" />
          <circle cx="206" cy="151" r="1.6" />
          <circle cx="184" cy="157" r="1.8" />
        </g>
      </g>
    </svg>
  );
}

export function ZaatarHead({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  return (
    <header className="m-head m-head-zaatar relative overflow-hidden pb-1">
      <Corner>{corner}</Corner>
      <div className="m-za-stage relative overflow-hidden pt-14">
        <div className="m-za-scene relative mx-auto aspect-[260/190] w-full max-w-[20rem]">
          <Saj />
          {/* ختم المحلّ على الكيس: دائرةٌ بحلقةٍ منقّطة بحبر الزعتر. */}
          <span className="m-za-seal absolute left-[16.9%] top-[52%] z-[2] block aspect-square w-[19%] -translate-x-1/2 -translate-y-1/2 rounded-full p-[3px]">
            <LogoMark
              restaurant={restaurant}
              size="relative h-full w-full"
              style={{ borderRadius: "9999px", background: "var(--m-surface)" }}
              fallbackStyle={{ color: "var(--m-accent)" }}
              letterSize="1.3rem"
            />
          </span>
        </div>
      </div>
      <div className="px-4 text-center">
        <h1 className="m-title mt-3 text-[2.15rem] font-bold leading-[1.65]" style={{ ...display, color: "var(--m-text)" }}>
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
          <div className="m-za-window mx-auto mt-5 max-w-sm overflow-hidden">
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

/** الرغيف برمز القسم، ثم الاسم، ثم نقاط الزعتر إلى العدد. */
export function ZaatarHeading({ name, items, icon = "bread", photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-za-h mb-5">
      <div className="flex items-center gap-3 px-1">
        <span aria-hidden="true" className="m-za-loaf flex h-9 w-12 shrink-0 items-center justify-center">
          <Icon name={icon} size={18} />
        </span>
        <h2 className="min-w-0 text-[1.5rem] font-bold leading-[1.5]" style={{ ...display, color: "var(--m-text)" }}>
          {name}
        </h2>
        <span aria-hidden="true" className="m-za-trail block h-[5px] min-w-6 flex-1" />
        {items && <span className="m-za-count shrink-0 px-2.5 py-1 text-[11px] font-bold">{items}</span>}
      </div>
      {photo && <div className="m-za-photo mt-3">{photo}</div>}
    </div>
  );
}

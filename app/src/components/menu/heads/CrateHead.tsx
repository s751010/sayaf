/**
 * «صندوق فواكه» — ملصق صندوق الفواكه القديم (٢٠٢٦/١١/١٥، طوابع «التوقيع»).
 *
 * - `CrateHead`    وجه صندوق خشبٍ بألواحه ومساميره وسهمَي «هذا الجانب للأعلى» بالاستنسل، وفي وسطه **الملصق**:
 *   شمسٌ مشعّة تدور ببطء والشعار في قرصها، ونصفا برتقالةٍ وورقتان، وشريطٌ منحنٍ بالاسم. **شريحة البرتقال تدور
 *   مع التمرير** (`--m-scroll-y`)، وتسقط قطرة عصيرٍ حين يُضاف صنف.
 * - `CrateHeading` عنوان القسم **لوح صندوق** بمسمارين عليه الاسم بالاستنسل، والعدد ملصقٌ مستدير.
 *
 * وكلّ صنفٍ ملصقٌ صغير بشريطٍ ملوّن في رأسه (`styles/skins/crate.css`). ما يتبع العلامة: البرتقاليّ
 * (`--m-accent`) والأخضر (`--m-accent-2`). وما لا يتبعها خامة: الخشب والورق.
 */
import type { CSSProperties } from "react";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };
const RAYS = Array.from({ length: 20 }, (_, i) => i * 18);

/** شريحة برتقالٍ بفصوصها — تدور مع التمرير. */
function Slice({ className }: { className?: string }) {
  return (
    <svg viewBox="-50 -50 100 100" aria-hidden="true" className={className}>
      <circle r="48" className="m-cr-rind" />
      <circle r="42" fill="#fff4d6" />
      <g className="m-cr-pulp">
        {Array.from({ length: 8 }, (_, i) => (
          <path key={i} d="M0-5L11-37Q0-42-11-37Z" transform={`rotate(${i * 45})`} />
        ))}
      </g>
      <circle r="4" fill="#fff4d6" />
    </svg>
  );
}

export function CrateHead({ restaurant, en, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  return (
    <header className="m-head m-head-crate relative overflow-hidden pb-2">
      <Corner>{corner}</Corner>
      <div className="m-cr-wood relative px-5 pb-6 pt-14">
        {/* الاستنسل على الخشب */}
        <span aria-hidden="true" className="m-cr-stencil absolute start-3 top-3 text-[11px] font-black">
          ⇧⇧ {en ? "THIS SIDE UP" : "هذا الجانب للأعلى"}
        </span>
        {/* الملصق */}
        <div className="m-cr-label relative mx-auto max-w-[19rem] overflow-hidden px-4 pb-5 pt-5 text-center">
          <svg viewBox="-100 -100 200 200" aria-hidden="true" className="m-cr-sun absolute left-1/2 top-[3.6rem] h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2">
            <g className="m-cr-rays">
              {RAYS.map((a) => (
                <path key={a} d="M0 0L-8-100L8-100Z" transform={`rotate(${a})`} />
              ))}
            </g>
          </svg>
          <div className="relative mx-auto h-[6.4rem] w-[6.4rem]">
            <span className="m-cr-disc absolute inset-0 block rounded-full p-[6px]">
              <LogoMark
                restaurant={restaurant}
                size="relative h-full w-full"
                style={{ borderRadius: "9999px", background: "#fff8e4" }}
                fallbackStyle={{ color: "var(--m-accent)", fontFamily: "var(--m-display)" }}
                letterSize="2rem"
              />
            </span>
            <Slice className="m-cr-slice absolute -bottom-3 -start-9 h-14 w-14" />
            <Slice className="m-cr-slice m-cr-slice2 absolute -end-8 -top-1 h-10 w-10" />
            {/* ورقتان */}
            <svg viewBox="0 0 40 30" aria-hidden="true" className="m-cr-leaf absolute -end-9 bottom-0 h-8 w-10">
              <path d="M2 26q4-22 34-22q-2 22-34 22Z" />
              <path d="M6 24q12-10 26-16" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="1.5" />
            </svg>
            <span aria-hidden="true" className="m-cr-drop absolute -start-4 bottom-[-0.9rem] block h-3 w-2" />
          </div>
          <h1 className="m-title m-cr-name relative mt-3 text-[2.5rem] leading-[1.35]" style={display}>
            {restaurant.name}
          </h1>
          {typeLabel && <p className="m-cr-banner relative mx-auto mt-2 w-fit px-6 py-1 text-[12.5px] font-extrabold">{typeLabel}</p>}
        </div>
      </div>
      {children && <div className="m-chips mt-5 flex flex-wrap items-center justify-center gap-2 px-4">{children}</div>}
    </header>
  );
}

/** لوح الصندوق بمسمارَيه، والاسم بالاستنسل، والعدد ملصقٌ مستدير. */
export function CrateHeading({ name, items, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-cr-h mb-4">
      <div className="m-cr-plank relative flex items-center justify-between gap-3 px-7 py-1.5">
        <h2 className="m-cr-stencil min-w-0 text-[1.7rem] leading-[1.4]" style={display}>
          {name}
        </h2>
        {items && <span className="m-cr-count shrink-0 px-2.5 py-1 text-[11px] font-black">{items}</span>}
      </div>
      {photo && <div className="m-cr-photo mt-3">{photo}</div>}
    </div>
  );
}

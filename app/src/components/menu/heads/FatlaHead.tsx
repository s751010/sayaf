/**
 * «فتلة» — شاي الفتلة (٢٠٢٦/١١/١٥، طوابع «التوقيع»).
 *
 * - `FatlaHead`    استكانة شايٍ على صحنها يتصاعد بخارها، وكيس الشاي فيها **بخيطه**، و**البطاقة في طرف الخيط
 *   تحمل شعارك** وتتأرجح كالبندول — وتشتدّ ما دام الزبون يمرّر. وبجانبها ورق نعناع ومكعّبا سكّر.
 * - `FatlaHeading` عنوان القسم **بطاقةٌ معلّقة على خيط** ممدود بعرض الصفحة، تتأرجح حين يدخل القسم.
 *
 * وكلّ صنفٍ بطاقة شايٍ مثقوبة بخيطها (`styles/skins/fatla.css`). ما يتبع العلامة: الشاي وحبر البطاقات
 * (`--m-accent`) والنعناع (`--m-accent-2`). وما لا يتبعها خامة: الزجاج والورق والخيط.
 */
import type { CSSProperties } from "react";
import { Icon } from "@/lib/icons";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };

/** المشهد بإحداثيات 300×170: الاستكانة يساراً من الوسط، والنعناع والسكّر حولها. */
function Glass() {
  return (
    <svg viewBox="0 0 300 170" aria-hidden="true" className="absolute inset-0 block h-full w-full overflow-visible">
      {/* الصحن */}
      <ellipse cx="128" cy="150" rx="74" ry="11" fill="#fffdf6" stroke="#cdbb9b" strokeWidth="1.5" />
      <ellipse cx="128" cy="148" rx="50" ry="6" fill="#efe2c8" />
      {/* الشاي داخل الاستكانة */}
      <path className="m-ft-tea" d="M92 62h72q4 26-8 40q10 16 8 34q-2 12-14 12h-44q-12 0-14-12q-2-18 8-34q-12-14-8-40Z" />
      {/* الزجاج: خصرٌ ضيّق ولمعتان */}
      <path d="M88 44h80q6 34-8 58q12 16 10 36q-2 14-16 14h-52q-14 0-16-14q-2-20 10-36q-14-24-8-58Z" fill="#ffffff" fillOpacity=".28" stroke="#ffffff" strokeWidth="2.2" />
      <path d="M88 44h80" stroke="#e9d9a8" strokeWidth="3" strokeLinecap="round" />
      <path d="M100 56q-3 22 6 40M104 112q-6 12-4 24" fill="none" stroke="#ffffff" strokeOpacity=".8" strokeWidth="2.6" strokeLinecap="round" />
      {/* كيس الشاي تحت السطح */}
      <path d="M118 76h22l4 26h-30Z" fill="#f6ead0" fillOpacity=".55" stroke="#ffffff" strokeOpacity=".6" />
      {/* البخار */}
      <g className="m-ft-steam" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round">
        <path d="M112 34c-6-8 6-11 0-21" />
        <path d="M130 30c-6-9 6-12 0-23" />
        <path d="M148 34c-6-8 6-11 0-21" />
      </g>
      {/* ورق النعناع */}
      <g className="m-ft-mint">
        <path d="M32 138q-4-22 16-30q10 20-6 32Z" />
        <path d="M52 146q4-20 24-18q0 18-16 22Z" />
        <path d="M22 150q10-12 26-6q-8 12-22 10Z" />
      </g>
      <path d="M40 134q0-12 6-20M58 144q6-8 14-12" fill="none" stroke="#ffffff" strokeOpacity=".5" strokeWidth="1.2" />
      {/* مكعّبا السكّر */}
      <g stroke="#d8cdb6" strokeWidth="1">
        <path d="M222 138l14-5l12 6l-14 6Z" fill="#ffffff" />
        <path d="M222 138v12l12 7v-12Z" fill="#f1e9d8" />
        <path d="M248 139v12l-14 6v-12Z" fill="#e6dcc6" />
        <path d="M244 122l12-4l10 5l-12 5Z" fill="#ffffff" />
        <path d="M244 122v10l10 6v-10Z" fill="#f1e9d8" />
        <path d="M266 123v10l-12 5v-10Z" fill="#e6dcc6" />
      </g>
    </svg>
  );
}

export function FatlaHead({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  return (
    <header className="m-head m-head-fatla relative overflow-hidden pb-2">
      <Corner>{corner}</Corner>
      <div className="m-ft-stage relative px-4 pt-14">
        <div className="relative mx-auto aspect-[300/170] w-full max-w-[19rem]">
          <Glass />
          {/* الخيط والبطاقة: عنصرٌ واحد يتأرجح من حافّة الاستكانة. */}
          <div className="m-ft-swing absolute left-[52%] top-[25%] h-[62%] w-[26%]">
            <span aria-hidden="true" className="m-ft-string absolute left-0 top-0 block h-[38%] w-full" />
            <span className="m-ft-tag absolute bottom-0 end-0 block aspect-[5/6] w-[78%] p-[7%] pt-[20%]">
              <LogoMark
                restaurant={restaurant}
                size="relative h-full w-full"
                style={{ borderRadius: "6px", background: "transparent" }}
                fallbackStyle={{ color: "var(--m-accent)", fontFamily: "var(--m-display)" }}
                letterSize="1.5rem"
              />
            </span>
          </div>
        </div>
      </div>
      <div className="px-4 text-center">
        <h1 className="m-title mt-3 text-[2.3rem] font-bold leading-[1.5]" style={{ ...display, color: "var(--m-text)" }}>
          {restaurant.name}
        </h1>
        {typeLabel && (
          <p className="m-ft-type mx-auto mt-1 w-fit px-3 text-[13px] font-bold">{typeLabel}</p>
        )}
        {children && <div className="m-chips mt-5 flex flex-wrap items-center justify-center gap-2">{children}</div>}
      </div>
    </header>
  );
}

/** الخيط الممدود، والبطاقة المعلّقة عليه باسم القسم ورمزه، والعدد في طرف الخيط. */
export function FatlaHeading({ name, items, icon = "istikana", photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-ft-h mb-5">
      <div className="m-ft-rope relative flex items-start justify-between gap-3 pt-3">
        <div className="m-ft-label relative flex items-center gap-2 py-2 pe-4 ps-8">
          <Icon name={icon} size={18} />
          <h2 className="min-w-0 text-[1.45rem] font-bold leading-[1.5]" style={display}>
            {name}
          </h2>
        </div>
        {items && <span className="m-ft-count mt-2 shrink-0 px-2.5 py-1 text-[11px] font-bold">{items}</span>}
      </div>
      {photo && <div className="m-ft-photo mt-3">{photo}</div>}
    </div>
  );
}

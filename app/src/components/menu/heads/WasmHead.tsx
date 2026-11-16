/**
 * «وَسْم» — لوح البلّوط المحروق (٢٠٢٦/١١/١٥، طوابع «التوقيع»).
 *
 * - `WasmHead`    لوح بلّوطٍ بعروقه ومساميره الأربعة وسير جلدٍ يحمله، و**ميسمٌ حديديّ** (مقبضه وعصاه) ينزل عند
 *   الفتح فـ**يكوي شعارك** في دائرةٍ متفحّمة الحافّة يتوهّج جمرها ويتصاعد دخانها — ويعود فيكوي حين يُضاف صنف.
 *   والاسم **محروقٌ في الخشب**، وتحته سيخان متقاطعان.
 * - `WasmHeading` عنوان القسم دائرةٌ مكويّة برمز القسم، والاسم محروقاً، وخطّ فحمٍ يتوهّج حين يدخل القسم.
 *
 * الخامة والحركة في `styles/skins/wasm.css`. ما يتبع العلامة: الجمر (`--m-accent`). وما لا يتبعها خامة: الخشب
 * والحديد والجلد وحرق الحروف.
 */
import type { CSSProperties } from "react";
import { Icon } from "@/lib/icons";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };

/** الميسم: مقبض خشبٍ وعصا حديد ورأس الكيّ — بإحداثيات 80×170. */
function Iron() {
  return (
    <svg viewBox="0 0 80 170" aria-hidden="true" className="block h-full w-full overflow-visible">
      <rect x="31" y="0" width="18" height="52" rx="9" fill="#5a3a1c" />
      <path d="M36 6v40M44 6v40" stroke="#3f2812" strokeWidth="1.5" />
      <rect x="29" y="48" width="22" height="8" rx="2" fill="#8d8f94" />
      <rect x="36.5" y="56" width="7" height="74" fill="#3a3b3f" />
      <rect x="36.5" y="56" width="2.5" height="74" fill="#6b6d72" />
      <path d="M40 130L14 146v8h52v-8Z" fill="#2c2d30" />
      <rect className="m-ws-hot" x="12" y="152" width="56" height="9" rx="3" />
    </svg>
  );
}

function Skewers() {
  return (
    <svg viewBox="0 0 200 40" aria-hidden="true" className="m-ws-skewers mx-auto block h-9 w-44">
      <path d="M14 34L186 8" stroke="#3a3b3f" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M14 8l172 26" stroke="#3a3b3f" strokeWidth="2.5" strokeLinecap="round" />
      <g className="m-ws-meat">
        <rect x="52" y="19" width="16" height="12" rx="4" transform="rotate(-9 60 25)" />
        <rect x="92" y="13" width="16" height="12" rx="4" transform="rotate(-9 100 19)" />
        <rect x="132" y="7" width="16" height="12" rx="4" transform="rotate(-9 140 13)" />
      </g>
      <g className="m-ws-veg">
        <rect x="72" y="16" width="14" height="12" rx="5" transform="rotate(-9 79 22)" />
        <rect x="112" y="10" width="14" height="12" rx="5" transform="rotate(-9 119 16)" />
      </g>
    </svg>
  );
}

export function WasmHead({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  return (
    <header className="m-head m-head-wasm relative overflow-hidden pb-3">
      <span aria-hidden="true" className="m-ws-strap absolute left-1/2 top-0 block h-9 w-12 -translate-x-1/2" />
      <span aria-hidden="true" className="m-ws-rivet absolute start-3 top-3 block" />
      <span aria-hidden="true" className="m-ws-rivet absolute end-3 top-3 block" />
      <Corner className="top-10">{corner}</Corner>
      <div className="relative px-5 pt-16 text-center">
        <div className="relative mx-auto h-[7.5rem] w-[7.5rem]">
          <span aria-hidden="true" className="m-ws-burn absolute inset-0 block rounded-full" />
          <span className="absolute inset-[13%] block rounded-full">
            <LogoMark
              restaurant={restaurant}
              size="relative h-full w-full"
              style={{ borderRadius: "9999px", background: "transparent" }}
              fallbackStyle={{ color: "#2e1708", fontFamily: "var(--m-display)" }}
              letterSize="2.1rem"
            />
          </span>
          <svg viewBox="0 0 60 60" aria-hidden="true" className="m-ws-smoke absolute -top-9 left-1/2 h-12 w-12 -translate-x-1/2 overflow-visible">
            <g fill="none" stroke="#2e1708" strokeOpacity=".4" strokeWidth="3" strokeLinecap="round">
              <path d="M20 56c-8-12 8-18 0-32" />
              <path d="M38 56c-8-12 8-18 0-32" />
            </g>
          </svg>
          <span aria-hidden="true" className="m-ws-iron absolute -top-[6.4rem] left-1/2 block h-[8.5rem] w-16">
            <Iron />
          </span>
        </div>
        <h1 className="m-title m-ws-burnt mt-3 text-[2.2rem] font-extrabold leading-[1.5]" style={display}>
          {restaurant.name}
        </h1>
        <Skewers />
        {typeLabel && <p className="m-ws-burnt mt-1 text-[13px] font-extrabold">{typeLabel}</p>}
        {children && <div className="m-chips mt-5 flex flex-wrap items-center justify-center gap-2">{children}</div>}
      </div>
      <span aria-hidden="true" className="m-ws-rivet absolute bottom-2 start-3 block" />
      <span aria-hidden="true" className="m-ws-rivet absolute bottom-2 end-3 block" />
    </header>
  );
}

/** الدائرة المكويّة برمز القسم، والاسم، وخطّ الفحم إلى العدد. */
export function WasmHeading({ name, items, icon = "skewer", photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-ws-h mb-3">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="m-ws-plate flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
          <Icon name={icon} size={20} />
        </span>
        <h2 className="m-ws-burnt min-w-0 text-[1.6rem] font-extrabold leading-[1.5]" style={display}>
          {name}
        </h2>
        <span aria-hidden="true" className="m-ws-coal block h-[5px] min-w-6 flex-1" />
        {items && <span className="m-ws-count shrink-0 px-2.5 py-1 text-[11px] font-extrabold">{items}</span>}
      </div>
      {photo && <div className="m-ws-photo mt-3">{photo}</div>}
    </div>
  );
}

/**
 * «وصفة» — دفتر وصفات المخبز (٢٠٢٦/١١/١٥، طوابع «التوقيع»).
 *
 * - `RecipeHead`    مفرش مربّعاتٍ بحافّة دانتيل، وعليه **بطاقة وصفة** يمسكها **مشبك غسيلٍ خشبيّ** وتستقرّ بعد
 *   أن تتأرجح: الشعار في حلقةٍ منقّطة، والاسم بخطّ اليد، وحوله خربشات المطبخ — مضرب بيضٍ يدور مع التمرير
 *   (`--m-scroll-y`)، وشوبك، وكب كيك، وقلوب.
 * - `RecipeHeading` عنوان القسم على **شريطٍ لاصق ورقيّ** مخطّط يُلصق حين يدخل القسم (`data-m-in`)، والعدد في
 *   دائرةٍ مرسومة.
 *
 * والصفحة ورق دفترٍ مسطّر بهامشه الأحمر، والأصناف أسطرٌ عليه بقلبٍ أمام كلٍّ منها (`styles/skins/recipe.css`).
 * ما يتبع العلامة: التوتيّ (`--m-accent`) والنعناعيّ (`--m-accent-2`). وما لا يتبعها خامة: الورق والخشب والدانتيل.
 */
import type { CSSProperties } from "react";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };

/** خربشات المطبخ حول البطاقة، بإحداثيات 320×250. */
function Doodles() {
  return (
    <svg viewBox="0 0 320 250" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
      <g fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {/* مضرب البيض — يدور مع التمرير */}
        <g className="m-rc-whisk m-rc-ink2">
          <path d="M30 60v34" />
          <path d="M30 94q-14 18 0 40q14-22 0-40Z" />
          <path d="M30 94q-6 20 0 40M30 94q6 20 0 40" />
        </g>
        {/* الشوبك */}
        <g className="m-rc-ink" transform="rotate(-24 286 86)">
          <rect x="262" y="78" width="48" height="16" rx="8" />
          <path d="M262 86h-12M310 86h12" />
        </g>
        {/* كب كيك */}
        <g className="m-rc-ink">
          <path d="M268 206h34l-5 26h-24Z" />
          <path d="M276 208v22M285 208v22M294 208v22" strokeWidth="1.4" />
          <path d="M266 206q-4-12 8-14q0-12 11-12t11 12q12 2 8 14" />
          <circle cx="285" cy="174" r="4" className="m-rc-fill" />
        </g>
        {/* قلوب ونجوم */}
        <path className="m-rc-heart m-rc-fill" d="M40 196q-9-10 0-14q6-2 6 5q0-7 6-5q9 4 0 14l-6 6Z" stroke="none" />
        <path className="m-rc-heart m-rc-fill2" d="M22 222q-6-7 0-10q4-1 4 4q0-5 4-4q6 3 0 10l-4 4Z" stroke="none" />
        <path className="m-rc-ink2" d="M300 130v12M294 136h12" />
        <path className="m-rc-ink2" d="M18 152q8-6 12 4" />
      </g>
    </svg>
  );
}

export function RecipeHead({ restaurant, en, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  return (
    <header className="m-head m-head-recipe relative overflow-hidden pb-2">
      <div aria-hidden="true" className="m-rc-cloth h-16" />
      <Corner>{corner}</Corner>
      <div className="relative mx-auto -mt-9 w-full max-w-[22rem] px-9 pb-1">
        <Doodles />
        {/* البطاقة والمشبك */}
        <div className="m-rc-card relative px-4 pb-5 pt-9 text-center">
          <span aria-hidden="true" className="m-rc-pin absolute left-1/2 top-[-18px] block h-11 w-5 -translate-x-1/2" />
          <p className="m-rc-kicker text-[1.15rem] leading-none" style={display}>
            {en ? "from our kitchen" : "من مطبخنا"}
          </p>
          <span className="m-rc-ring mx-auto mt-3 block h-[4.6rem] w-[4.6rem] rounded-full p-[5px]">
            <LogoMark
              restaurant={restaurant}
              size="relative h-full w-full"
              style={{ borderRadius: "9999px", background: "var(--m-bg-2)" }}
              fallbackStyle={{ color: "var(--m-accent)", fontFamily: "var(--m-display)" }}
              letterSize="1.6rem"
            />
          </span>
          <h1 className="m-title mt-2 text-[2.5rem] font-bold leading-[1.5]" style={{ ...display, color: "var(--m-accent)" }}>
            {restaurant.name}
          </h1>
          {typeLabel && (
            <p className="text-[13px] font-bold" style={{ color: "var(--m-muted)" }}>
              {typeLabel}
            </p>
          )}
        </div>
      </div>
      {children && <div className="m-chips mt-5 flex flex-wrap items-center justify-center gap-2 px-4">{children}</div>}
    </header>
  );
}

/** الشريط اللاصق باسم القسم، والعدد في دائرةٍ مرسومة. */
export function RecipeHeading({ name, items, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-rc-h mb-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-rc-tape min-w-0 px-6 py-1 text-[1.8rem] font-bold leading-[1.5]" style={{ ...display, color: "var(--m-text)" }}>
          {name}
        </h2>
        {items && <span className="m-rc-count shrink-0 px-2.5 py-1 text-[11px] font-bold">{items}</span>}
      </div>
      {photo && <div className="m-rc-photo mt-4">{photo}</div>}
    </div>
  );
}

/**
 * «لفّة ورق» — لفّة الورق المعلّقة على الجدار (٢٠٢٦/١١/١٥، طوابع «التوقيع»).
 *
 * - `RollHead`    حاملٌ حديديّ أسود ببراغيه، و**لفّة ورقٍ** تدور عروقها ما دام الزبون يمرّر (`--m-scroll-y`)،
 *   والورق ينزل منها صفحةً واحدة طويلة هي المنيو. وعلى رأس الورق شعارك في دائرة قلمٍ عريض، والاسم **بقلم
 *   الماركر** وتحته خطّ الألوان الثلاثة، وحوله شريحة بيتزا وورق ريحانٍ وطماطم مرسومة بالقلم.
 * - `RollHeading` عنوان القسم بالماركر العريض وتحته **ضربة الألوان الثلاثة** تُرسم حين يدخل القسم
 *   (`data-m-in`)، والعدد في دائرة قلم.
 *
 * الخامة والحركة في `styles/skins/roll.css`. ما يتبع العلامة: أحمر الطماطم (`--m-accent`) وأخضر الريحان
 * (`--m-accent-2`). وما لا يتبعها خامة: الورق والحديد وحبر الماركر الأسود.
 */
import type { CSSProperties } from "react";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };

/** الحامل واللفّة بإحداثيات 320×64. */
function Holder() {
  return (
    <svg viewBox="0 0 320 64" preserveAspectRatio="none" aria-hidden="true" className="m-rl-holder block h-16 w-full">
      <path d="M14 0v30q0 8 8 8M306 0v30q0 8-8 8" fill="none" stroke="#1c1b19" strokeWidth="6" strokeLinecap="round" />
      <circle cx="14" cy="6" r="3" fill="#6b6964" />
      <circle cx="306" cy="6" r="3" fill="#6b6964" />
      <rect x="20" y="16" width="280" height="42" rx="21" fill="#e6dcc4" />
      <rect x="20" y="16" width="280" height="14" rx="7" fill="#f6efdd" />
      <rect x="20" y="44" width="280" height="14" rx="7" fill="#cfc3a6" />
      <g className="m-rl-grain" stroke="#b9ad90" strokeWidth="1">
        <path d="M60 18v38M120 18v38M180 18v38M240 18v38" />
      </g>
      <ellipse cx="22" cy="37" rx="6" ry="21" fill="#d8ccb0" stroke="#a89c80" strokeWidth="1.5" />
      <ellipse cx="298" cy="37" rx="6" ry="21" fill="#d8ccb0" stroke="#a89c80" strokeWidth="1.5" />
      <ellipse cx="298" cy="37" rx="2" ry="7" fill="#1c1b19" />
      <ellipse cx="22" cy="37" rx="2" ry="7" fill="#1c1b19" />
    </svg>
  );
}

/** رسوم الماركر حول الاسم بإحداثيات 320×120. */
function Sketch() {
  return (
    <svg viewBox="0 0 320 120" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
      <g fill="none" stroke="#191613" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 28q22-14 46 0L46 92Z" className="m-rl-cheese" />
        <path d="M22 28q22-14 46 0" strokeWidth="5" />
        <circle cx="40" cy="42" r="5" className="m-rl-red" />
        <circle cx="52" cy="56" r="4.5" className="m-rl-red" />
        <circle cx="42" cy="68" r="4" className="m-rl-red" />
        <circle cx="286" cy="84" r="15" className="m-rl-red" />
        <path d="M278 71l8 5l8-5M286 76v-7" className="m-rl-greenline" />
        <path d="M270 26q16-18 32 0q-16 18-32 0Z" className="m-rl-green" />
        <path d="M270 26h32" strokeWidth="2" />
      </g>
    </svg>
  );
}

export function RollHead({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  return (
    <header className="m-head m-head-roll relative overflow-hidden pb-2">
      <Holder />
      <Corner className="top-[4.6rem]">{corner}</Corner>
      <div className="relative px-4 pb-1 pt-7 text-center">
        <Sketch />
        <span className="m-rl-ring relative mx-auto block h-[4.4rem] w-[4.4rem] rounded-full p-[5px]">
          <LogoMark
            restaurant={restaurant}
            size="relative h-full w-full"
            style={{ borderRadius: "9999px", background: "var(--m-surface)" }}
            fallbackStyle={{ color: "var(--m-accent)", fontFamily: "var(--m-display)" }}
            letterSize="1.6rem"
          />
        </span>
        <h1 className="m-title relative mt-2 text-[2.7rem] leading-[1.35]" style={{ ...display, color: "var(--m-text)" }}>
          {restaurant.name}
        </h1>
        <span aria-hidden="true" className="m-rl-tri mx-auto mt-1 block h-[7px] w-40" />
        {typeLabel && (
          <p className="relative mx-auto mt-3 max-w-[13rem] text-[13px] font-extrabold" style={{ color: "var(--m-muted)" }}>
            {typeLabel}
          </p>
        )}
        {children && <div className="m-chips relative mt-5 flex flex-wrap items-center justify-center gap-2">{children}</div>}
      </div>
    </header>
  );
}

/** الاسم بالماركر، وضربة الألوان الثلاثة تحته، والعدد في دائرة قلم. */
export function RollHeading({ name, items, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-rl-h mb-3">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[2.1rem] leading-[1.3]" style={{ ...display, color: "var(--m-text)" }}>
            {name}
          </h2>
          <span aria-hidden="true" className="m-rl-tri m-rl-stroke mt-0.5 block h-[7px] w-full min-w-[7rem]" />
        </div>
        {items && <span className="m-rl-count mb-1 shrink-0 px-2.5 py-1 text-[11px] font-extrabold">{items}</span>}
      </div>
      {photo && <div className="m-rl-photo mt-4">{photo}</div>}
    </div>
  );
}

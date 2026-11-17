/**
 * «دعوة» — بطاقة قائمة العشاء المطبوعة (٢٠٢٦/١١/١٥، طوابع «التوقيع»).
 *
 * - `InviteHead`    بطاقةٌ من ورقٍ قطنيّ عاجيّ بإطارين رفيعين مذهّبين وزخارف زوايا، والشعار في **إكليل غارٍ
 *   مذهّب**، و«قائمة الطعام» بحروفٍ متباعدة، والاسم بخطّ أميري، وتحته زخرفة معيّنٍ بجناحين. و**شريطُ حريرٍ**
 *   عنّابيّ يتدلّى من رأس البطاقة ويتمايل مع التمرير (`--m-scroll-y`)، و**ختم شمعٍ** يُكبس على حافّتها السفلى
 *   عند الفتح.
 * - `InviteHeading` عنوان القسم في وسط السطر: نجمةٌ صغيرة، ثم الاسم، ثم زخرفة تُرسم حين يدخل القسم
 *   (`data-m-in`)، ثم العدد بحروفٍ صغيرة.
 *
 * والأصناف **في وسط السطر** كبطاقات قوائم التذوّق: الاسم، فالوصف، فالسعر بين شرطتين (`styles/skins/invite.css`).
 * ما يتبع العلامة: الذهب (`--m-accent`) والشريط والشمع (`--m-accent-2`). وما لا يتبعها خامة: الورق ولمعة الذهب.
 */
import type { CSSProperties } from "react";
import { Icon } from "@/lib/icons";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };

/** ورقات الإكليل: اثنتا عشرة على كلّ جانب، تميل مع القوس. */
const LEAVES = Array.from({ length: 11 }, (_, i) => {
  const a = (Math.PI * (0.62 + i * 0.076)) % (Math.PI * 2);
  const x = 60 + Math.cos(a) * 46;
  const y = 60 + Math.sin(a) * 46;
  return { x, y, r: (a * 180) / Math.PI + 60 };
});

/** إكليل الغار بإحداثيات 120×120 — يسارٌ مرسوم ويمينٌ مرآته، وربطةٌ في أسفله. */
function Wreath() {
  const side = (
    <g>
      <path d="M52 108Q10 92 14 44" fill="none" strokeWidth="1.4" />
      {LEAVES.map((l, i) => (
        <ellipse key={i} cx={l.x} cy={l.y} rx="7.5" ry="3" transform={`rotate(${l.r} ${l.x} ${l.y})`} stroke="none" />
      ))}
    </g>
  );
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className="m-iv-wreath absolute inset-0 h-full w-full overflow-visible">
      <defs>
        <linearGradient id="m-iv-foil" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8a6a1f" />
          <stop offset=".35" stopColor="#e7cd86" />
          <stop offset=".55" stopColor="#a8842c" />
          <stop offset=".78" stopColor="#f1dfa6" />
          <stop offset="1" stopColor="#8a6a1f" />
        </linearGradient>
      </defs>
      <g fill="url(#m-iv-foil)" stroke="url(#m-iv-foil)">
        {side}
        <g transform="translate(120 0) scale(-1 1)">{side}</g>
        {/* الربطة */}
        <path d="M60 106l-9 9l9-3l9 3Z" stroke="none" />
        <circle cx="60" cy="105" r="3" stroke="none" />
      </g>
    </svg>
  );
}

/** زخرفة: معيّنٌ في الوسط وجناحان يلتفّان — تُستعمل تحت الاسم وتحت عنوان القسم. */
function Flourish({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 18" aria-hidden="true" className={className}>
      <g fill="none" strokeWidth="1.3" strokeLinecap="round">
        <path d="M88 9H44q-12 0-16-6q-2 8 8 8" pathLength={1} />
        <path d="M112 9h44q12 0 16-6q2 8-8 8" pathLength={1} />
        <path d="M20 9H4M180 9h16" pathLength={1} />
      </g>
      <path d="M100 2l7 7l-7 7l-7-7Z" stroke="none" />
      <circle cx="84" cy="9" r="1.6" stroke="none" />
      <circle cx="116" cy="9" r="1.6" stroke="none" />
    </svg>
  );
}

/** زخرفة زاوية الإطار — تُدار للزوايا الأربع. */
function CornerOrnament({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 30 30" aria-hidden="true" className={`m-iv-corner absolute h-7 w-7 ${className}`}>
      <path d="M2 28V10q0-8 8-8h18" fill="none" strokeWidth="1.3" />
      <path d="M7 28V13q0-6 6-6h15" fill="none" strokeWidth=".8" />
      <path d="M2 2l5 5" strokeWidth="1.1" />
      <circle cx="2.6" cy="2.6" r="2" stroke="none" />
    </svg>
  );
}

export function InviteHead({ restaurant, en, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  return (
    <header className="m-head m-head-invite relative px-4 pb-12 pt-4">
      <Corner className="top-7 end-7">{corner}</Corner>
      <div className="m-iv-card relative px-5 pb-12 pt-12 text-center">
        <CornerOrnament className="start-1.5 top-1.5 rtl:-scale-x-100" />
        <CornerOrnament className="end-1.5 top-1.5 ltr:-scale-x-100" />
        <CornerOrnament className="bottom-1.5 start-1.5 -scale-y-100 rtl:-scale-x-100" />
        <CornerOrnament className="bottom-1.5 end-1.5 -scale-y-100 ltr:-scale-x-100" />
        {/* شريط الحرير يتدلّى من رأس البطاقة. */}
        <span aria-hidden="true" className="m-iv-ribbon absolute start-7 top-0 block h-[5.5rem] w-[1.15rem]" />
        <div className="relative mx-auto h-[7.4rem] w-[7.4rem]">
          <Wreath />
          <span className="m-iv-crest absolute inset-[22%] block rounded-full p-[2px]">
            <LogoMark
              restaurant={restaurant}
              size="relative h-full w-full"
              style={{ borderRadius: "9999px", background: "var(--m-surface)" }}
              fallbackStyle={{ color: "var(--m-accent)", fontFamily: "var(--m-display)" }}
              letterSize="1.7rem"
            />
          </span>
        </div>
        <p className="m-iv-kicker mt-4 text-[11px] font-bold">{en ? "M E N U" : "قـــائـمـة الـطـعــام"}</p>
        <h1 className="m-title mt-1 text-[2.6rem] font-bold leading-[1.6]" style={{ ...display, color: "var(--m-text)" }}>
          {restaurant.name}
        </h1>
        <Flourish className="m-iv-flourish mx-auto mt-1 block h-[18px] w-[11rem]" />
        {typeLabel && (
          <p className="mt-3 text-[13px]" style={{ color: "var(--m-muted)" }}>
            {typeLabel}
          </p>
        )}
        {children && <div className="m-chips mt-6 flex flex-wrap items-center justify-center gap-2">{children}</div>}
        {/* ختم الشمع على الحافّة السفلى. */}
        <span aria-hidden="true" className="m-iv-seal absolute -bottom-7 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full">
          <Icon name="sparkle" size={22} />
        </span>
      </div>
    </header>
  );
}

/** العنوان في وسط السطر: نجمة، فالاسم، فالزخرفة، فالعدد. */
export function InviteHeading({ name, items, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-iv-h mb-2 text-center">
      <span aria-hidden="true" className="m-iv-star block text-[11px] leading-none">
        ✦
      </span>
      <h2 className="mt-1 text-[2rem] font-bold leading-[1.55]" style={{ ...display, color: "var(--m-text)" }}>
        {name}
      </h2>
      <Flourish className="m-iv-flourish mx-auto block h-[16px] w-[9.5rem]" />
      {items && <p className="m-iv-count mt-2 text-[11px] font-bold">{items}</p>}
      {photo && <div className="m-iv-photo mt-4">{photo}</div>}
    </div>
  );
}

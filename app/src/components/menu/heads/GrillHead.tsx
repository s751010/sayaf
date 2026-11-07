/**
 * «جمر» — منقل الحارة بعد المغرب (٢٠٢٦/١١/٠٧).
 *
 * - `GrillHead`    شريطٌ من ليل الدخان، وفيه **سيخٌ واحدٌ بعرض الشاشة** يمرّ بشعارك
 *   كأنّه قطعةٌ منه بين لحمٍ وبصلٍ وطماطم وفلفل، فوق منقلٍ مدهونٍ بلون العلامة يتّقد
 *   فحمه وتلمع فتحات واجهته، والدخان والشرر يعلوان منه، وهو قائمٌ على كاونترٍ من ستيل.
 *   والاسم تحت الكاونتر بخطّ لافتات المشاوي.
 * - `GrillHeading` عنوان القسم **سيخ**: حلقة المقبض، ثم قطعتان، ثم الاسم، ثم السيخ ممتدٌّ
 *   بقطعه إلى رأسه المدبّب، والعدد جمرةٌ بعده. وصورة القسم في إطارٍ من حديد.
 *
 * الخامة والحركة في `styles/skins/grill.css`. ما يتبع العلامة: دهان المنقل والسعر والأزرار.
 * وما لا يتبعها خامة: الليل والدخان والجمر والستيل وقطع السيخ — الفحم فحمٌ أيّاً كان اللون.
 */
import type { CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };

/** قطع السيخ — خامةٌ لا تتبع العلامة: لحمٌ بعلامات الشوي، وبصل، وطماطم، وفلفل. */
type Piece = "meat" | "onion" | "tomato" | "pepper";

const PIECE: Record<Piece, { fill: string; edge: string }> = {
  meat: { fill: "#8a4320", edge: "#5a2810" },
  onion: { fill: "#efe2c4", edge: "#c9b48a" },
  tomato: { fill: "#c7341c", edge: "#8e2010" },
  pepper: { fill: "#4f7d2a", edge: "#335a17" },
};

/** قطعةٌ واحدة: مكعّبٌ مستدير الحوافّ، وضوء الجمر من تحته، وعلامتا شويٍ على اللحم. */
function Chunk({ kind, size = 1 }: { kind: Piece; size?: number }) {
  const c = PIECE[kind];
  return (
    <svg
      viewBox="0 0 24 28"
      aria-hidden="true"
      className="m-gr-chunk relative block shrink-0"
      style={{ width: `${1.15 * size}rem`, height: `${1.35 * size}rem` }}
    >
      <rect x="1.5" y="1.5" width="21" height="25" rx={kind === "onion" ? 9 : 6} fill={c.fill} stroke={c.edge} strokeWidth="1.5" />
      {/* ضوء الجمر على الحافّة السفلى، ولمعةٌ على الأعلى. */}
      <rect x="3" y="18" width="18" height="7" rx="3.5" fill="#ff8a3d" opacity=".28" />
      <rect x="5" y="4" width="10" height="3" rx="1.5" fill="#fff" opacity=".22" />
      {kind === "meat" && (
        <g stroke="#2a1208" strokeWidth="2.2" strokeLinecap="round" opacity=".7">
          <path d="M6 11l10-4" />
          <path d="M7 19l11-4" />
        </g>
      )}
      {kind === "onion" && <path d="M7 6c-2 6-2 11 0 16M17 6c2 6 2 11 0 16" stroke="#c9b48a" strokeWidth="1.2" fill="none" />}
    </svg>
  );
}

/** ثلاثة خيوط دخانٍ تعلو من الفحم خلف السيخ، وأربع شرارات — مرّتين ثم تسكن. */
function Smoke() {
  return (
    <>
      <svg viewBox="0 0 240 120" preserveAspectRatio="none" aria-hidden="true" className="m-gr-smoke absolute inset-x-0 top-0 block h-[7.5rem] w-full">
        {[
          "M70 120c-14-22 18-34 4-58S86 22 72 0",
          "M124 120c-16-24 20-36 2-62s14-38 0-58",
          "M176 120c-12-20 16-32 2-56s12-40-2-64",
        ].map((d, i) => (
          <path key={i} className="m-gr-wisp" d={d} fill="none" strokeWidth="11" strokeLinecap="round" />
        ))}
      </svg>
      {[18, 36, 63, 81].map((x, i) => (
        <span key={x} aria-hidden="true" className={`m-gr-spark m-gr-spark-${i} absolute block h-[3px] w-[3px] rounded-full`} style={{ left: `${x}%` }} />
      ))}
    </>
  );
}

export function GrillHead({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  return (
    <header className="m-head m-head-brazier relative overflow-hidden pb-1">
      <div className="m-gr-night relative px-3 pt-14">
        <Corner>{corner}</Corner>
        {/* ضوء الفحم على الدخان من تحت — يتنفّس ثلاثاً ثم يستقرّ (`m-gr-breathe`). */}
        <span aria-hidden="true" className="m-gr-glow absolute inset-0 block" />
        <Smoke />
        <div className="relative mx-auto max-w-[23rem]">
          {/* السيخ: حلقةٌ ثم قطعٌ ثم الشعار ثم قطعٌ ثم الرأس — والقضيب خلفها كلّها. */}
          <div className="m-gr-spit relative z-[2] flex items-center justify-center gap-[3px] ps-7 pe-5">
            <span aria-hidden="true" className="m-gr-rod absolute inset-x-0 top-1/2 block" />
            <Chunk kind="tomato" />
            <Chunk kind="meat" />
            <Chunk kind="onion" />
            <Chunk kind="meat" />
            <span className="m-gr-medal relative mx-1 block shrink-0 rounded-full p-[5px]">
              <LogoMark
                restaurant={restaurant}
                size="relative h-[4.25rem] w-[4.25rem]"
                style={{ borderRadius: "9999px", background: "var(--m-surface)" }}
                fallbackStyle={{ color: "var(--m-accent)" }}
                letterSize="2rem"
              />
            </span>
            <Chunk kind="meat" />
            <Chunk kind="pepper" />
            <Chunk kind="meat" />
            <Chunk kind="onion" />
          </div>
          {/* المنقل: فمٌ من جمرٍ تحت السيخ، وواجهةٌ مدهونةٌ بلون العلامة بفتحاتٍ تتّقد. */}
          <div className="m-gr-brazier relative z-[1] mx-5 -mt-5">
            <span aria-hidden="true" className="m-gr-coals block h-6" />
            <span aria-hidden="true" className="m-gr-front relative block h-9">
              <span className="m-gr-vents absolute inset-x-5 top-1/2 block h-2.5 -translate-y-1/2" />
            </span>
            <span aria-hidden="true" className="m-gr-legs mx-3 block h-2.5" />
          </div>
        </div>
        <span aria-hidden="true" className="m-gr-counter -mx-3 block h-2.5" />
      </div>
      <div className="px-4 text-center">
        <h1 className="m-title mt-4 text-[2rem] font-bold leading-[1.5]" style={{ ...display, color: "var(--m-text)" }}>
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
          <div className="m-gr-window mx-auto mt-5 max-w-sm overflow-hidden">
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

/** السيخ: حلقة المقبض وقطعتان، ثم الاسم، ثم السيخ بقطعه إلى رأسه، والعدد جمرةٌ بعده. */
export function GrillHeading({ name, items, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-skewer-h mb-4">
      <div className="m-gr-skewer relative flex items-center">
        <span aria-hidden="true" className="m-gr-rod absolute inset-x-0 top-1/2 block" />
        <span aria-hidden="true" className="m-gr-ring relative block shrink-0" />
        <span aria-hidden="true" className="relative ms-1 flex shrink-0 gap-[2px]">
          <Chunk kind="meat" size={0.8} />
          <Chunk kind="onion" size={0.8} />
        </span>
        <h2
          className="m-gr-label relative min-w-0 px-2.5 text-[1.45rem] font-bold leading-[1.55]"
          style={{ ...display, color: "var(--m-text)" }}
        >
          {name}
        </h2>
        <span aria-hidden="true" className="relative flex min-w-0 flex-1 justify-start gap-[2px] overflow-hidden">
          <Chunk kind="tomato" size={0.8} />
          <Chunk kind="meat" size={0.8} />
          <Chunk kind="pepper" size={0.8} />
        </span>
        <span aria-hidden="true" className="m-gr-tip relative block shrink-0" />
        {items && <span className="m-gr-count relative ms-2 shrink-0 px-2 py-0.5 text-[11px] font-bold">{items}</span>}
      </div>
      {photo && <div className="m-gr-photo mt-3">{photo}</div>}
    </div>
  );
}

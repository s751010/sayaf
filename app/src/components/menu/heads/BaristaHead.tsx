/**
 * «باريستا» — إسبريسو بار (٢٠٢٦/١١/٠٧).
 *
 * - `BaristaHead`    **آلة إسبريسو** من الأمام: جسمٌ مدهونٌ بلون العلامة يلمع، وإطاره ستيل،
 *   وفي قلبه **عدّاد الضغط وشعارك وجهُه** (التدريج على الإطار والمؤشّر يدور عليه — لا يمرّ
 *   فوق الشعار)، ورأسا تحضيرٍ بمقبضيهما والقهوة تنسكب منهما في فنجانين على صينيّة التقطير،
 *   وذراع البخار ينفث، وفناجين تُدفّأ على ظهرها. والآلة على كاونترٍ من خشب السنديان.
 * - `BaristaHeading` عنوان القسم **كوبٌ ورقيّ بختم المحلّ**: غطاءٌ داكن، وختمٌ مستدير بحبّة
 *   بنٍّ بلون العلامة، ثم الاسم، ثم العدد على **تذكرة طلب** كالتي تُلصق على الكوب.
 *
 * الخامة والحركة في `styles/skins/barista.css`. ما يتبع العلامة: دهان الآلة وختم الكوب
 * والسعر والأزرار. وما لا يتبعها خامة: الستيل والخزف والقهوة والسنديان.
 *
 * ⚠️ **ومختلفٌ عمداً** عن «محمصة» (كيس بنٍّ من كرافت بلاصقٍ ومنحنى تحميص — ما قبل الفنجان)
 * وعن «لوحة حروف» (لبّادٌ أسود بحروفٍ بيضاء): هنا الفنجان نفسه يُصنع — آلةٌ ولاتيه وكوب.
 */
import type { CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };

/** تدريج العدّاد: ٢٧ شرطة على قوسٍ من ٢٢٥° إلى -٤٥°، والطويلة كلّ ثلاث. */
function GaugeTicks() {
  const ticks = Array.from({ length: 13 }, (_, i) => {
    const a = ((225 - i * 22.5) * Math.PI) / 180;
    const long = i % 3 === 0;
    const r1 = long ? 40.5 : 43;
    return (
      <path
        key={i}
        d={`M${(50 + r1 * Math.cos(a)).toFixed(2)} ${(50 - r1 * Math.sin(a)).toFixed(2)}L${(50 + 46.5 * Math.cos(a)).toFixed(2)} ${(50 - 46.5 * Math.sin(a)).toFixed(2)}`}
        strokeWidth={long ? 2.2 : 1.3}
      />
    );
  });
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className="absolute inset-0 block h-full w-full">
      <g stroke="#2a2522" strokeLinecap="round">{ticks}</g>
      {/* المنطقة الحمراء في آخر القوس — ضغط الاستخلاص. */}
      <path d="M78.3 78.3A40 40 0 0 0 90 50" fill="none" stroke="#c8321e" strokeWidth="3" opacity=".85" />
    </svg>
  );
}

/** فنجانٌ على صينيّة التقطير من جانبه: خزفٌ أبيض بأذن، والقهوة تصبّ فيه. */
function ShotCup({ className }: { className: string }) {
  return (
    <span aria-hidden="true" className={`m-br-cup absolute block ${className}`}>
      <span className="m-br-stream m-br-stream-1 absolute block" />
      <span className="m-br-stream m-br-stream-2 absolute block" />
      <svg viewBox="0 0 34 24" className="absolute inset-x-0 bottom-0 block h-full w-full overflow-visible">
        <path d="M25 8.5c5 0 6.5 7 0 8.5" fill="none" stroke="#e7e2da" strokeWidth="2.6" />
        <path d="M4 3h22l-2 15.5a3 3 0 0 1-3 2.5H9a3 3 0 0 1-3-2.5Z" fill="#fbfaf7" stroke="#cfc8bc" strokeWidth=".8" />
        <path d="M5.2 6.5h19.6" stroke="#d9d2c6" strokeWidth="1" />
        <ellipse cx="15" cy="3" rx="11" ry="1.6" fill="#7a4524" />
        <path d="M1 22.5h28" stroke="#cfc8bc" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </span>
  );
}

/** رأس التحضير ومقبضه — الستيل خامة، والمقبض خشبٌ داكن يميل إلى الخارج. */
function Group({ side }: { side: "start" | "end" }) {
  return (
    <span aria-hidden="true" className={`m-br-group m-br-group-${side} absolute block`}>
      <span className="m-br-head absolute inset-x-0 top-0 block" />
      <span className="m-br-basket absolute block" />
      <span className="m-br-handle absolute block" />
    </span>
  );
}

export function BaristaHead({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  return (
    <header className="m-head m-head-machine relative overflow-hidden pb-1">
      <Corner>{corner}</Corner>
      <div className="m-br-wall relative px-3 pt-11">
        <span aria-hidden="true" className="m-br-light absolute inset-0 block" />
        <div className="m-br-machine relative mx-auto h-[11.6rem] w-full max-w-[20.5rem]">
          {/* فناجين تُدفّأ على ظهر الآلة — مقلوبةً كما يصفّها الباريستا. */}
          <span aria-hidden="true" className="absolute inset-x-[16%] top-0 flex justify-between">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="m-br-warm block h-[0.95rem] w-[1.35rem]" />
            ))}
          </span>
          <span aria-hidden="true" className="m-br-rail absolute inset-x-[9%] top-[0.9rem] block h-[7px]" />
          <span aria-hidden="true" className="m-br-body absolute inset-x-0 top-[1.3rem] block h-[6.5rem]">
            <span className="m-br-gloss absolute inset-0 block" />
          </span>
          {/* عدّاد الضغط: شعارك وجهه، والتدريج على إطاره، والمؤشّر يدور على الإطار وحده. */}
          <span className="m-br-gauge absolute left-1/2 top-[1.75rem] z-[2] block h-[5.1rem] w-[5.1rem] -translate-x-1/2 rounded-full">
            <GaugeTicks />
            <span aria-hidden="true" className="m-br-needle absolute inset-0 block" />
            <span className="absolute inset-[0.62rem] block rounded-full p-[3px]" style={{ background: "#fbfaf7" }}>
              <LogoMark
                restaurant={restaurant}
                size="relative h-full w-full"
                style={{ borderRadius: "9999px", background: "var(--m-surface)" }}
                fallbackStyle={{ color: "var(--m-accent)" }}
                letterSize="1.8rem"
              />
            </span>
          </span>
          <Group side="start" />
          <Group side="end" />
          <ShotCup className="m-br-cup-start" />
          <ShotCup className="m-br-cup-end" />
          {/* ذراع البخار على جانب الآلة — وطرفه ينفث مرّتين ثم يسكن. */}
          <span aria-hidden="true" className="m-br-wand absolute block">
            {[0, 1, 2].map((i) => (
              <span key={i} className={`m-br-puff m-br-puff-${i} absolute block rounded-full`} />
            ))}
          </span>
          <span aria-hidden="true" className="m-br-tray absolute inset-x-[4%] bottom-[0.35rem] block h-[0.6rem]" />
        </div>
        <span aria-hidden="true" className="m-br-counter -mx-3 block h-[15px]" />
      </div>
      <div className="px-4 text-center">
        <h1 className="m-title mt-4 text-[1.85rem] font-bold leading-[1.55]" style={{ ...display, color: "var(--m-text)" }}>
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
          <div className="m-br-window mx-auto mt-5 max-w-sm overflow-hidden">
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

/**
 * الكوب الورقيّ من جانبه: غطاءٌ داكنٌ بفتحة الشرب، وختمُ المحلّ المستدير بحبّة بنٍّ
 * في قلبه — حبره `currentColor` فيلبس لون العلامة بنسخته المقروءة.
 */
function PaperCup() {
  return (
    <svg viewBox="0 0 30 40" aria-hidden="true" className="m-br-paper block h-[2.6rem] w-[1.95rem] shrink-0">
      <path d="M4.3 10.4H25.7L22.9 37.4A1.6 1.6 0 0 1 21.3 38.8H8.7A1.6 1.6 0 0 1 7.1 37.4Z" fill="#fdfcf9" stroke="#d6cfc4" strokeWidth=".8" />
      <path d="M5.5 13.5H24.5" stroke="#ece6dc" strokeWidth="1" />
      <path d="M6 3.6H24a2 2 0 0 1 2 2V7.4H4V5.6a2 2 0 0 1 2-2Z" fill="#2b2420" />
      <ellipse cx="19.5" cy="5.4" rx="2.2" ry=".8" fill="#5a4e46" />
      <rect x="2.6" y="7.1" width="24.8" height="3.4" rx="1.7" fill="#3c332d" />
      <g fill="none" stroke="currentColor">
        <circle cx="15" cy="24" r="6.4" strokeWidth="1.4" />
        <circle cx="15" cy="24" r="4.7" strokeWidth=".6" strokeDasharray=".9 1.1" />
      </g>
      <g transform="rotate(28 15 24)">
        <ellipse cx="15" cy="24" rx="2" ry="3" fill="currentColor" />
        <path d="M15 21.2c-1 1.6 1 4-0 5.6" fill="none" stroke="#fdfcf9" strokeWidth=".7" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** الكوب الورقيّ بختمه، ثم الاسم، ثم خطٌّ شعريّ إلى تذكرة الطلب بالعدد. */
export function BaristaHeading({ name, items, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-cup-h mb-4">
      <div className="flex items-center gap-3 px-1">
        <span className="m-br-cupwrap shrink-0" style={{ color: "var(--m-accent-ink, var(--m-accent))" }}>
          <PaperCup />
        </span>
        <h2 className="min-w-0 text-[1.35rem] font-bold leading-[1.6]" style={{ ...display, color: "var(--m-text)" }}>
          {name}
        </h2>
        <span aria-hidden="true" className="m-br-rule block h-px min-w-6 flex-1" />
        {items && <span className="m-br-ticket shrink-0 px-2.5 py-1 text-[11px] font-bold">{items}</span>}
      </div>
      {photo && <div className="m-br-photo mt-3">{photo}</div>}
    </div>
  );
}

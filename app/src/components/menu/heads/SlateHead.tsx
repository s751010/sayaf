/**
 * «سبّورة» — سبّورة المقهى (٢٠٢٦/١١/١٥، طوابع «التوقيع»: لكلّ قسمٍ منيو «كأنه فعلي»).
 *
 * - `SlateHead`    لوحٌ أخضر قاتم في **إطار خشب** ببراغيه، والاسم **مكتوبٌ بالطباشير** (رقعة) تحته خطّان
 *   أصفران بيد، وفوقه كوبٌ مرسومٌ بخطوط طباشير يتصاعد بخاره، وحبّات بنّ ونجوم وسهمٌ صغير، والشعار في دائرة
 *   طباشير. وتحت اللوح **رفّ الطباشير**: ثلاث أصابع (أبيض · أصفر · ورديّ) وممسحة لبّاد.
 * - `SlateHeading` عنوان القسم بالطباشير الأصفر، وتحته **خطّ متموّج يُرسم** حين يدخل القسم (`data-m-in`)، ورمز
 *   القسم في دائرة طباشير، والعدد في مربّعٍ ورديّ مرسوم.
 *
 * خشونة الطباشير مرشّح SVG واحد (`#m-sl-chalk`) يُعرَّف هنا ويقرؤه CSS (`styles/skins/slate.css`) للعناوين
 * والرسوم وحدها — أسماء الأصناف نصٌّ نظيف يُقرأ. ما يتبع العلامة: الطباشير الملوّن (الخطّان، الأسعار، العناوين).
 * وما لا يتبعها خامة: اللوح والخشب والطباشير الأبيض واللبّاد.
 */
import type { CSSProperties } from "react";
import { Icon } from "@/lib/icons";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };

/** مرشّح الطباشير: إزاحةٌ خفيفة تخشّن الحافّة، وحبيباتٌ تثقب الخطّ كما يفعل سطح اللوح. */
function ChalkFilter() {
  return (
    <svg aria-hidden="true" width="0" height="0" className="absolute">
      <filter id="m-sl-chalk" x="-5%" y="-10%" width="110%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="1.5" result="d" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -1.25 1.5" result="g" />
        <feComposite in="d" in2="g" operator="in" />
      </filter>
    </svg>
  );
}

/** المشهد بإحداثيات 300×150: كوبٌ بخطوط الطباشير في الوسط، وحوله حبّات بنّ ونجوم وسهم. */
function Doodles() {
  return (
    <svg viewBox="0 0 300 150" aria-hidden="true" className="m-sl-doodles block h-full w-full overflow-visible">
      <g fill="none" stroke="#f4f1e6" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        {/* الصحن */}
        <path d="M96 128q54 12 108 0" />
        <path d="M112 134q38 7 76 0" strokeWidth="2" />
        {/* الكوب ويده */}
        <path d="M108 70h84l-7 42q-3 14-18 14h-34q-15 0-18-14Z" />
        <path d="M191 80q20-3 19 12q-1 14-23 14" />
        {/* سطح القهوة */}
        <path d="M114 78q36 7 72 0" strokeWidth="2" />
        {/* تظليل طباشير مائل على جسم الكوب */}
        <path d="M120 92l10-8M122 104l22-18M130 112l26-22M146 114l22-18M162 114l14-12" strokeWidth="1.6" opacity=".55" />
      </g>
      {/* البخار — ثلاث خيوط تتمايل. */}
      <g className="m-sl-steam" fill="none" stroke="#f4f1e6" strokeWidth="2.4" strokeLinecap="round">
        <path d="M132 58c-7-9 7-13 0-24" />
        <path d="M150 54c-7-10 7-15 0-28" />
        <path d="M168 58c-7-9 7-13 0-24" />
      </g>
      {/* حبّات بنّ بالطباشير الملوّن. */}
      <g className="m-sl-ink2" fill="none" strokeWidth="2.2" strokeLinecap="round">
        <ellipse cx="52" cy="112" rx="10" ry="6.5" transform="rotate(-28 52 112)" />
        <path d="M45 115q7-2 14-7" />
        <ellipse cx="74" cy="128" rx="8" ry="5.4" transform="rotate(22 74 128)" />
        <path d="M68 126q6 1 12 4" />
        <ellipse cx="246" cy="120" rx="10" ry="6.5" transform="rotate(30 246 120)" />
        <path d="M239 116q7 3 14 8" />
      </g>
      {/* نجوم وشرطات بالطباشير الأصفر. */}
      <g className="m-sl-ink" fill="none" strokeWidth="2.2" strokeLinecap="round">
        <path className="m-sl-star" d="M40 44v18M31 53h18M34 47l12 12M46 47L34 59" />
        <path className="m-sl-star" d="M262 34v14M255 41h14M257 36l10 10M267 36l-10 10" />
        <path d="M70 30q6-8 14-4" />
        <path d="M226 78q10-2 12-12" />
        {/* سهمٌ معقوف يشير إلى الكوب */}
        <path d="M276 92q-22 16-52 4" />
        <path d="M232 88l-9 8l11 5" />
      </g>
    </svg>
  );
}

/** رفّ الطباشير: خشبٌ ببراغيه، وثلاث أصابع طباشير، وممسحة لبّاد. */
function Ledge() {
  return (
    <svg viewBox="0 0 320 34" preserveAspectRatio="none" aria-hidden="true" className="m-sl-ledge block h-[34px] w-full">
      <rect x="0" y="12" width="320" height="14" fill="#9a6a38" />
      <rect x="0" y="12" width="320" height="3" fill="#b98548" />
      <rect x="0" y="26" width="320" height="8" fill="#6f4a25" />
      <path d="M10 19h60M96 21h80M210 19h90" stroke="#855a2c" strokeWidth="1" />
      {/* الممسحة */}
      <g>
        <rect x="34" y="1" width="54" height="7" rx="1.5" fill="#7a4f27" />
        <rect x="34" y="7" width="54" height="6" rx="1" fill="#d8d3c4" />
        <path d="M38 10h46" stroke="#b9b3a3" strokeWidth="1" strokeDasharray="2 2" />
      </g>
      {/* الطباشير */}
      <rect x="196" y="6" width="34" height="7" rx="3.5" fill="#f4f1e6" />
      <rect className="m-sl-stick" x="236" y="6" width="26" height="7" rx="3.5" />
      <rect className="m-sl-stick2" x="268" y="6" width="20" height="7" rx="3.5" transform="rotate(-8 278 9)" />
      {/* غبار الطباشير على الرفّ */}
      <path d="M150 12h36M100 12h18" stroke="#f4f1e6" strokeOpacity=".5" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="1 4" />
    </svg>
  );
}

export function SlateHead({ restaurant, en, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  return (
    <header className="m-head m-head-slate relative overflow-hidden">
      <ChalkFilter />
      {/* عارضة الإطار العليا ببرغيَيها. */}
      <div aria-hidden="true" className="m-sl-beam relative h-4">
        <span className="m-sl-screw absolute start-3 top-1/2" />
        <span className="m-sl-screw absolute end-3 top-1/2" />
      </div>
      <Corner className="top-7">{corner}</Corner>
      <div className="relative px-6 pb-4 pt-9 text-center">
        <p className="m-sl-hello m-sl-chalked text-[1.5rem] font-bold leading-[1.4]" style={display}>
          {en ? "~ Welcome ~" : "~ أهلاً بكم ~"}
        </p>
        <div className="relative mx-auto mt-1 aspect-[300/150] w-full max-w-[19rem]">
          <Doodles />
          {/* الشعار في دائرة طباشير على جسم الكوب. */}
          <span className="m-sl-logo absolute left-1/2 top-[63%] block aspect-square w-[17%] -translate-x-1/2 -translate-y-1/2 rounded-full">
            <LogoMark
              restaurant={restaurant}
              size="relative h-full w-full"
              style={{ borderRadius: "9999px", background: "transparent" }}
              fallbackStyle={{ color: "var(--m-accent)", fontFamily: "var(--m-display)" }}
              letterSize="1.25rem"
            />
          </span>
        </div>
        <h1 className="m-title m-sl-chalked m-sl-name mt-1 text-[3.1rem] font-bold leading-[1.45]" style={{ ...display, color: "var(--m-text)" }}>
          {restaurant.name}
        </h1>
        {/* خطّا الطباشير تحت الاسم — يُرسمان عند الفتح. */}
        <svg viewBox="0 0 220 18" aria-hidden="true" className="m-sl-under m-sl-ink mx-auto -mt-1 block h-[18px] w-[62%] max-w-[15rem]">
          <path d="M6 7q52-6 104-1t104-2" fill="none" strokeWidth="3" strokeLinecap="round" pathLength={1} />
          <path d="M30 14q42-4 82-1t78-2" fill="none" strokeWidth="2.2" strokeLinecap="round" pathLength={1} />
        </svg>
        {typeLabel && (
          <p className="m-sl-type mt-2 text-[13px] font-bold tracking-wide">
            <span aria-hidden="true">✦</span> {typeLabel} <span aria-hidden="true">✦</span>
          </p>
        )}
        {children && <div className="m-chips mt-5 flex flex-wrap items-center justify-center gap-2">{children}</div>}
      </div>
      <Ledge />
    </header>
  );
}

/** العنوان بالطباشير الأصفر، وخطٌّ متموّج يُرسم تحته، ورمز القسم في دائرة، والعدد في مربّعٍ مرسوم. */
export function SlateHeading({ name, items, icon = "cup", photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-sl-h mb-4">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="m-sl-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
          <Icon name={icon} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="m-sl-chalked text-[2.15rem] font-bold leading-[1.4]" style={{ ...display, color: "var(--m-accent)" }}>
            {name}
          </h2>
          <svg viewBox="0 0 200 10" preserveAspectRatio="none" aria-hidden="true" className="m-sl-wave m-sl-ink block h-[10px] w-full max-w-[13rem]">
            <path d="M3 6q12-7 24 0t24 0t24 0t24 0t24 0t24 0t24 0t24 0" fill="none" strokeWidth="2.4" strokeLinecap="round" pathLength={1} />
          </svg>
        </div>
        {items && <span className="m-sl-count shrink-0 px-2.5 py-1 text-[11px] font-bold">{items}</span>}
      </div>
      {photo && <div className="m-sl-photo mt-4">{photo}</div>}
    </div>
  );
}

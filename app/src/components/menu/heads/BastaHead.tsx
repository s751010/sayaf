/**
 * «بسطة» — بسطة السمك على الثلج (٢٠٢٦/١١/١٥، طوابع «التوقيع»).
 *
 * - `BastaHead`    سمكةٌ كبيرة ممدّدة على **ثلجٍ مجروش** يلمع، وحولها شرائح ليمون وبقدونس، و**بطاقة سعرٍ
 *   مغروزة في الثلج تحمل شعارك** تتمايل. ذيل السمكة يضرب بين حينٍ وآخر — ويضرب حين يُضاف صنف.
 * - `BastaHeading` عنوان القسم **لوحة مينا زرقاء** ببرغيَيها وحافّتها البيضاء ورمز القسم، والعدد بطاقةٌ حمراء.
 *
 * وكلّ صنفٍ بطاقة سعرٍ بيضاء بحدٍّ أزرق، وسعره **بقلمٍ أزرق عريض** تحته خطّ أحمر (`styles/skins/basta.css`).
 * ما يتبع العلامة: الأزرق (`--m-accent`) والأحمر (`--m-accent-2`). وما لا يتبعها خامة: الثلج والسمكة والليمون.
 */
import type { CSSProperties } from "react";
import { Icon } from "@/lib/icons";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };

/** بريق الثلج: مواضع النجيمات. */
const GLINTS: readonly [number, number, number][] = [
  [30, 96, 5], [84, 132, 4], [150, 140, 5], [214, 128, 4], [266, 104, 5], [118, 104, 3], [188, 100, 3],
];

/** المشهد بإحداثيات 300×150: الثلج في الأسفل، والسمكة فوقه رأسها يساراً. */
function Catch() {
  return (
    <svg viewBox="0 0 300 150" aria-hidden="true" className="absolute inset-0 block h-full w-full overflow-visible">
      {/* كومة الثلج: قطعٌ بأوجه */}
      <path d="M0 150V104l20-10l26 8l22-14l30 10l28-12l30 12l26-10l28 12l26-10l24 8l20-6v58Z" fill="#ffffff" />
      <g fill="#d5e8f3">
        <path d="M20 94l26 8l-12 20Z" />
        <path d="M98 98l28-12l-8 30Z" />
        <path d="M182 88l28 12l-22 16Z" />
        <path d="M236 90l24 8l-18 22Z" />
        <path d="M60 126l30 6l-22 18Z" />
        <path d="M140 122l32 8l-26 20Z" />
      </g>
      <g fill="#bcd9ea">
        <path d="M46 102l22-14l-6 26Z" />
        <path d="M156 98l26-10l-10 26Z" />
        <path d="M210 100l26-10l-4 28Z" />
        <path d="M0 120l22 6l-12 24H0Z" />
        <path d="M262 122l38-8v36h-22Z" />
      </g>
      {/* السمكة */}
      <g>
        <g className="m-bs-tail">
          <path d="M222 78l34-22q4 22-4 28q10 8 8 28Z" fill="#8fb3c7" stroke="#0d2436" strokeWidth="2" strokeLinejoin="round" />
          <path d="M232 76l18-10M234 84l18 12" stroke="#0d2436" strokeOpacity=".5" strokeWidth="1.4" />
        </g>
        <path d="M62 82q30-34 92-30q46 2 72 28q-28 26-74 26q-60 2-90-24Z" fill="#b9d3e2" stroke="#0d2436" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M70 88q34 16 84 14q40-2 68-20q-28 24-72 24q-56 2-80-18Z" fill="#f2f7fa" />
        <path d="M118 56q20-16 46-6l-6 8Z" fill="#8fb3c7" stroke="#0d2436" strokeWidth="2" strokeLinejoin="round" />
        <path d="M140 104l16 12l10-12Z" fill="#8fb3c7" stroke="#0d2436" strokeWidth="2" strokeLinejoin="round" />
        {/* الخيشوم والعين والفم */}
        <path d="M104 62q-10 18 0 36" fill="none" stroke="#0d2436" strokeWidth="2" strokeLinecap="round" />
        <circle cx="84" cy="76" r="6" fill="#fff" stroke="#0d2436" strokeWidth="2" />
        <circle cx="83" cy="76" r="2.4" fill="#0d2436" />
        <path d="M62 82q6 2 10 6" fill="none" stroke="#0d2436" strokeWidth="2" strokeLinecap="round" />
        {/* الحراشف */}
        <g fill="none" stroke="#0d2436" strokeOpacity=".4" strokeWidth="1.4" strokeLinecap="round">
          <path d="M120 70q6 6 0 12M134 66q6 6 0 12M148 68q6 6 0 12M162 66q6 6 0 12M176 70q6 6 0 12M190 72q6 6 0 12M127 82q6 6 0 12M141 80q6 6 0 12M155 82q6 6 0 12M169 80q6 6 0 12M183 84q6 6 0 10" />
        </g>
      </g>
      {/* ليمون وبقدونس */}
      <g>
        <path d="M22 112a20 20 0 0 1 40 0Z" fill="#ffe36b" stroke="#d9b21f" strokeWidth="2" />
        <path d="M42 112V96M42 112l-12-10M42 112l12-10" stroke="#fff7c2" strokeWidth="1.6" />
        <circle cx="258" cy="122" r="15" fill="#ffe36b" stroke="#d9b21f" strokeWidth="2" />
        <path d="M258 108v28M244 122h28M248 112l20 20M268 112l-20 20" stroke="#fff7c2" strokeWidth="1.5" />
        <path className="m-bs-herb" d="M196 122q-6-14 6-18q6 10-2 18ZM210 126q0-14 12-14q2 12-8 16ZM186 130q-10-8-4-16q10 4 8 16Z" />
      </g>
      {/* بريق الثلج */}
      <g className="m-bs-glints" fill="#ffffff" stroke="#9cc8e0" strokeWidth=".6">
        {GLINTS.map(([x, y, r], i) => (
          <path key={i} className="m-bs-glint" style={{ "--m-bs-i": i } as CSSProperties} d={`M${x} ${y - r}l${r * 0.28} ${r * 0.72}l${r * 0.72} ${r * 0.28}l${-r * 0.72} ${r * 0.28}l${-r * 0.28} ${r * 0.72}l${-r * 0.28} ${-r * 0.72}l${-r * 0.72} ${-r * 0.28}l${r * 0.72} ${-r * 0.28}Z`} />
        ))}
      </g>
    </svg>
  );
}

export function BastaHead({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  return (
    <header className="m-head m-head-basta relative overflow-hidden pb-2">
      <Corner>{corner}</Corner>
      <div className="m-bs-stage relative px-4 pt-14">
        <div className="relative mx-auto aspect-[300/150] w-full max-w-[20rem]">
          <Catch />
          {/* بطاقة السعر المغروزة تحمل الشعار */}
          <span className="m-bs-tag absolute left-[4%] top-[-14%] block w-[24%]">
            <span className="m-bs-card block aspect-square w-full p-[9%]">
              <LogoMark
                restaurant={restaurant}
                size="relative h-full w-full"
                style={{ borderRadius: "4px", background: "transparent" }}
                fallbackStyle={{ color: "var(--m-accent)", fontFamily: "var(--m-display)" }}
                letterSize="1.6rem"
              />
            </span>
            <span aria-hidden="true" className="m-bs-spike mx-auto block h-9 w-[3px]" />
          </span>
        </div>
      </div>
      <div className="px-4 text-center">
        <h1 className="m-title mt-2 text-[2.9rem] font-bold leading-[1.45]" style={{ ...display, color: "var(--m-accent)" }}>
          {restaurant.name}
        </h1>
        <span aria-hidden="true" className="m-bs-underline mx-auto block h-[5px] w-36" />
        {typeLabel && (
          <p className="mt-2 text-[13px] font-extrabold" style={{ color: "var(--m-muted)" }}>
            {typeLabel}
          </p>
        )}
        {children && <div className="m-chips mt-5 flex flex-wrap items-center justify-center gap-2">{children}</div>}
      </div>
    </header>
  );
}

/** لوحة المينا الزرقاء برمز القسم واسمه، والعدد بطاقةٌ حمراء. */
export function BastaHeading({ name, items, icon = "fish", photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-bs-h mb-4">
      <div className="flex items-center justify-between gap-3">
        <div className="m-bs-enamel flex min-w-0 items-center gap-2.5 px-5 py-1.5">
          <Icon name={icon} size={20} />
          <h2 className="min-w-0 text-[1.75rem] font-bold leading-[1.45]" style={display}>
            {name}
          </h2>
        </div>
        {items && <span className="m-bs-count shrink-0 px-2.5 py-1 text-[11px] font-extrabold">{items}</span>}
      </div>
      {photo && <div className="m-bs-photo mt-3">{photo}</div>}
    </div>
  );
}

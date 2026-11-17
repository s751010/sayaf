/**
 * «قائمة زمان» — قائمة المطعم الشعبي المغلّفة (٢٠٢٦/١١/١٥، طوابع «التوقيع»).
 *
 * - `ZamanHead`    ورقة مطبعةٍ قديمة بلونين (أحمر وأخضر) مغلّفة بالبلاستيك: شريطٌ أحمر بحافّة مقوّسة و**عروة
 *   معدن** في رأسه، والشعار في وسط **نجمةٍ مشعّة** تدور ببطء، والاسم برقعةٍ حمراء **بظلٍّ أخضر مُزاح** (طباعة
 *   لونين لم يتطابق قالباهما)، وتحته صينيّة مندي وإبريق شاي واستكانة — مرسومةً بخطٍّ أسود وتلوينٍ مُزاحٍ عنه.
 * - `ZamanHeading` عنوان القسم **شريطٌ أخضر بطرفين مشقوقين** ينفرد حين يدخل القسم (`data-m-in`)، ورقم القسم
 *   في دائرة حمراء، والعدد في طرفه.
 *
 * والأصناف **مرقّمة** (عدّاد CSS) بصفوفٍ متناوبة اللون كجدول القائمة المطبوعة، ولمعة التغليف تمرّ على الصفحة
 * (`styles/skins/zaman.css`). ما يتبع العلامة: الأحمر (`--m-accent`) والأخضر (`--m-accent-2`). وما لا يتبعها
 * خامة: الورق والحبر الأسود والمعدن.
 */
import type { CSSProperties } from "react";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };

/** نجمة مشعّة بـ`n` رأساً حول (50,50). */
function burst(n: number, outer: number, inner: number): string {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = (Math.PI * i) / n - Math.PI / 2;
    pts.push(`${(50 + Math.cos(a) * r).toFixed(2)},${(50 + Math.sin(a) * r).toFixed(2)}`);
  }
  return pts.join(" ");
}
const BURST = burst(18, 49, 41);
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const arNum = (n: number) => String(n).padStart(2, "0").replace(/\d/g, (d) => AR_DIGITS[Number(d)]);

/** المائدة بإحداثيات 300×112: إبريقٌ يساراً، وصينيّة المندي وسطاً، واستكانة يميناً. التلوين مُزاحٌ عن الخطّ. */
function Spread() {
  return (
    <svg viewBox="0 0 300 112" aria-hidden="true" className="m-zm-spread block h-full w-full overflow-visible">
      {/* ── التلوين (مُزاحٌ ٢٫٥ بكسل كقالبٍ لم يتطابق) ── */}
      <g transform="translate(2.5 2.5)">
        {/* الصينيّة */}
        <ellipse cx="150" cy="84" rx="92" ry="19" fill="#d8d2c2" />
        {/* الأرزّ */}
        <path d="M74 82Q150 4 226 82Q150 100 74 82Z" fill="#f4dc8a" />
        {/* اللحم */}
        <path className="m-zm-red" d="M122 46q10-16 26-10q8-12 22 0q16 2 14 18q-4 12-22 10q-14 8-28 0q-16-2-12-18Z" />
        {/* الإبريق */}
        <path className="m-zm-red" d="M22 92q-8-30 12-40h22q20 10 12 40Z" />
        {/* الاستكانة */}
        <path d="M254 58h26l-3 30q-1 6-10 6t-10-6Z" fill="#c9793a" />
        {/* الخضرة */}
        <g className="m-zm-green">
          <circle cx="104" cy="74" r="5" />
          <circle cx="198" cy="72" r="5" />
          <circle cx="150" cy="30" r="4.5" />
          <path d="M84 96q10-10 22-2q-10 8-22 2Z" />
          <path d="M196 96q12-10 22 0q-10 8-22 0Z" />
        </g>
      </g>
      {/* ── الخطّ الأسود ── */}
      <g fill="none" stroke="#1d1a14" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="150" cy="84" rx="92" ry="19" />
        <path d="M74 82Q150 4 226 82" />
        <path d="M122 46q10-16 26-10q8-12 22 0q16 2 14 18q-4 12-22 10q-14 8-28 0q-16-2-12-18Z" />
        <path d="M132 50q8 6 18 2M158 44q8 8 18 6" strokeWidth="1.6" />
        {/* حبّات الأرزّ */}
        <path d="M92 76l5-3M106 62l5-3M118 78l5-2M186 78l5-2M196 60l5 3M208 76l5-2M150 72l5-2M136 70l-5-2M172 70l5 2" strokeWidth="1.6" />
        {/* الإبريق: جسمٌ وغطاء وصنبور ويد */}
        <path d="M22 92q-8-30 12-40h22q20 10 12 40Z" />
        <path d="M32 52q13-8 26 0M45 44v-5" />
        <path d="M66 66q14-4 18-18" />
        <path d="M24 62q-14 4-8 22" />
        {/* الاستكانة وصحنها */}
        <path d="M254 58h26l-3 30q-1 6-10 6t-10-6Z" />
        <path d="M246 98q21 6 42 0" />
        <path d="M256 68h22" strokeWidth="1.6" />
      </g>
      {/* البخار */}
      <g className="m-zm-steam" fill="none" stroke="#1d1a14" strokeWidth="1.8" strokeLinecap="round">
        <path d="M82 40c-4-6 4-8 0-15" />
        <path d="M262 50c-4-6 4-8 0-15" />
        <path d="M272 50c-4-6 4-8 0-15" />
      </g>
    </svg>
  );
}

export function ZamanHead({ restaurant, en, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  return (
    <header className="m-head m-head-zaman relative overflow-hidden pb-2">
      {/* الشريط الأحمر بحافّته المقوّسة، والعروة المعدنيّة في رأس الورقة. */}
      <div className="m-zm-band relative flex h-[4.4rem] items-start justify-center pt-3">
        <span aria-hidden="true" className="m-zm-eyelet absolute start-4 top-2.5 block h-5 w-5 rounded-full" />
        <p className="m-zm-kicker text-[1.35rem] font-bold leading-none" style={display}>
          {en ? "✦  Menu  ✦" : "✦  قائمة الطعام  ✦"}
        </p>
      </div>
      <Corner className="top-2.5">{corner}</Corner>
      <div className="relative px-5 text-center">
        {/* الشعار في النجمة المشعّة. */}
        <div className="relative mx-auto -mt-7 h-[6.6rem] w-[6.6rem]">
          <svg viewBox="0 0 100 100" aria-hidden="true" className="m-zm-burst absolute inset-0 h-full w-full">
            <polygon points={BURST} />
          </svg>
          <span className="m-zm-seal absolute inset-[17%] block rounded-full p-[3px]">
            <LogoMark
              restaurant={restaurant}
              size="relative h-full w-full"
              style={{ borderRadius: "9999px", background: "var(--m-surface)" }}
              fallbackStyle={{ color: "var(--m-accent)", fontFamily: "var(--m-display)" }}
              letterSize="1.7rem"
            />
          </span>
        </div>
        <h1 className="m-title m-zm-name mt-1 text-[3rem] font-bold leading-[1.5]" style={display}>
          {restaurant.name}
        </h1>
        {typeLabel && (
          <p className="m-zm-tag mx-auto mt-1 w-fit px-6 py-1 text-[13px] font-extrabold">{typeLabel}</p>
        )}
        <div className="relative mx-auto mt-4 aspect-[300/112] w-full max-w-[19rem]">
          <Spread />
        </div>
        <div aria-hidden="true" className="m-zm-rule mt-3" />
        {children && <div className="m-chips mt-4 flex flex-wrap items-center justify-center gap-2">{children}</div>}
      </div>
    </header>
  );
}

/** الشريط الأخضر بطرفيه المشقوقين: رقم القسم في دائرة حمراء، ثم الاسم، ثم العدد. */
export function ZamanHeading({ name, items, index, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-zm-h mb-3">
      <div className="m-zm-ribbon relative flex items-center gap-3 px-6 py-1.5">
        <span aria-hidden="true" className="m-zm-no flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black">
          {arNum(index + 1)}
        </span>
        <h2 className="min-w-0 flex-1 text-[1.75rem] font-bold leading-[1.5]" style={display}>
          {name}
        </h2>
        {items && <span className="m-zm-count shrink-0 px-2 py-0.5 text-[11px] font-extrabold">{items}</span>}
      </div>
      {photo && <div className="m-zm-photo mt-3">{photo}</div>}
    </div>
  );
}

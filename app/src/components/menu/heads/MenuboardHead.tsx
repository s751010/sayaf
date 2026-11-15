/**
 * «لوحة مضيئة» — لوحة الكاونتر المعلّقة (٢٠٢٦/١١/١٥، طوابع «التوقيع»).
 *
 * - `MenuboardHead`    لوحةٌ معلّقة بقضيبين من السقف، **ثلاثة ألواحٍ مضيئة**: برجرٌ مرسوم يساراً، وبطاطس وكوبٌ
 *   يميناً، وفي الوسط شعارك واسمك. تشتعل عند الفتح **كما يشتعل الفلورسنت** (وميضٌ ثم ثبات). وتحتها **شريط
 *   نقطيّ** يمرّ عليه اسم المحلّ.
 * - `MenuboardHeading` عنوان القسم **صندوق ضوء**: رقم القسم على لوحةٍ حمراء، والاسم على لوحٍ أبيض مضيء يومض
 *   حين يدخل القسم (`data-m-in`).
 *
 * والأصناف ألواحٌ مضيئة **مرقّمة** على جدارٍ داكن (`styles/skins/menuboard.css`). ما يتبع العلامة: الأحمر
 * (`--m-accent`) والأصفر (`--m-accent-2`). وما لا يتبعها خامة: الألواح البيضاء والمعدن.
 */
import type { CSSProperties } from "react";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const arNum = (n: number) => String(n).padStart(2, "0").replace(/\d/g, (d) => AR_DIGITS[Number(d)]);

function Burger() {
  return (
    <svg viewBox="0 0 80 80" aria-hidden="true" className="block h-full w-full">
      <path d="M12 36q0-22 28-22t28 22Z" fill="#e9a23b" />
      <g fill="#fff3d2">
        <ellipse cx="30" cy="24" rx="2.4" ry="1.3" />
        <ellipse cx="42" cy="20" rx="2.4" ry="1.3" />
        <ellipse cx="52" cy="27" rx="2.4" ry="1.3" />
      </g>
      <path d="M9 40q6-5 12 0t12 0t12 0t12 0t12 0v5H9Z" fill="#4c9f38" />
      <rect className="m-mb-red" x="11" y="44" width="58" height="5" rx="2.5" />
      <path d="M10 50h60l-9 7l-8-7l-8 7l-8-7l-8 7l-8-7Z" fill="#ffc629" />
      <rect x="11" y="52" width="58" height="9" rx="4.5" fill="#6b3a1e" />
      <path d="M12 63h56q0 9-10 9H22q-10 0-10-9Z" fill="#e9a23b" />
    </svg>
  );
}

function Fries() {
  return (
    <svg viewBox="0 0 80 80" aria-hidden="true" className="block h-full w-full">
      <g fill="#ffc629" stroke="#e0a100" strokeWidth="1">
        <rect x="14" y="14" width="6" height="34" rx="2" transform="rotate(-10 17 31)" />
        <rect x="22" y="9" width="6" height="38" rx="2" transform="rotate(-3 25 28)" />
        <rect x="30" y="12" width="6" height="36" rx="2" transform="rotate(6 33 30)" />
        <rect x="38" y="16" width="6" height="32" rx="2" transform="rotate(12 41 32)" />
      </g>
      <path className="m-mb-red" d="M9 38h38l-4 34H13Z" />
      <path d="M9 38q19 9 38 0" fill="none" stroke="#fff" strokeWidth="2" strokeOpacity=".7" />
      {/* الكوب */}
      <path d="M52 30h20l-3 42H55Z" fill="#fff" stroke="#d8d8d8" strokeWidth="1.2" />
      <path className="m-mb-red" d="M53 42h18l-1 14H54Z" />
      <rect x="50" y="26" width="24" height="5" rx="2.5" fill="#e9e9e9" />
      <path d="M64 26l4-16" stroke="#ffc629" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function MenuboardHead({ restaurant, en, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const tick = en ? `${restaurant.name}  ●  Order here  ●  ` : `${restaurant.name}  ●  اطلب من هنا  ●  أهلاً بكم  ●  `;
  return (
    <header className="m-head m-head-menuboard relative overflow-hidden pb-2">
      <Corner>{corner}</Corner>
      <div className="relative px-3 pt-12">
        {/* قضيبا التعليق */}
        <span aria-hidden="true" className="m-mb-rod absolute start-[18%] top-0 block h-12 w-1.5" />
        <span aria-hidden="true" className="m-mb-rod absolute end-[18%] top-0 block h-12 w-1.5" />
        <div className="m-mb-frame relative grid grid-cols-[1fr_1.7fr_1fr] gap-1.5 p-1.5">
          <div className="m-mb-panel m-mb-side flex items-center justify-center p-2">
            <Burger />
          </div>
          <div className="m-mb-panel flex min-w-0 flex-col items-center justify-center px-2 py-3 text-center">
            <LogoMark
              restaurant={restaurant}
              size="relative h-12 w-12"
              style={{ borderRadius: "9999px", background: "#fff", boxShadow: "0 0 0 2px var(--m-accent)" }}
              fallbackStyle={{ color: "var(--m-accent)", fontFamily: "var(--m-display)" }}
              letterSize="1.3rem"
            />
            <h1 className="m-title mt-1.5 text-[1.85rem] leading-[1.3]" style={{ ...display, color: "#17181c" }}>
              {restaurant.name}
            </h1>
            {typeLabel && <p className="m-mb-type mt-1 px-2 py-0.5 text-[10.5px] font-extrabold leading-snug">{typeLabel}</p>}
          </div>
          <div className="m-mb-panel m-mb-side flex items-center justify-center p-2">
            <Fries />
          </div>
        </div>
        {/* الشريط النقطيّ */}
        <div aria-hidden="true" className="m-mb-ticker mt-1.5 overflow-hidden whitespace-nowrap py-1.5" dir="ltr">
          <span className="m-mb-tick inline-block text-sm font-black">
            {tick.repeat(4)}
          </span>
        </div>
      </div>
      {children && <div className="m-chips mt-5 flex flex-wrap items-center justify-center gap-2 px-4">{children}</div>}
    </header>
  );
}

/** صندوق الضوء: رقم القسم بالأحمر، والاسم على اللوح المضيء، والعدد بالأصفر. */
export function MenuboardHeading({ name, items, index, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-mb-h mb-4">
      <div className="m-mb-box flex items-stretch overflow-hidden">
        <span aria-hidden="true" className="m-mb-no flex w-12 shrink-0 items-center justify-center text-lg font-black">
          {arNum(index + 1)}
        </span>
        <h2 className="m-mb-lit min-w-0 flex-1 px-3 py-1.5 text-[1.6rem] leading-[1.35]" style={display}>
          {name}
        </h2>
        {items && <span className="m-mb-count flex shrink-0 items-center px-2.5 text-[11px] font-black">{items}</span>}
      </div>
      {photo && <div className="m-mb-photo mt-3">{photo}</div>}
    </div>
  );
}

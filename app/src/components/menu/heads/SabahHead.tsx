/**
 * «صباح الخير» — مفرش ورق الفطور (٢٠٢٦/١١/١٥، طوابع «التوقيع»).
 *
 * - `SabahHead`    سماء صباحٍ وشمسٌ تشرق بأشعّةٍ تدور ببطء، وفوق المفرش **بيضة عيونٍ صفارها شعارك** يهتزّ ما دام
 *   الزبون يمرّر، وخبزتا توست وكوبٌ يتصاعد بخاره. وتحتها حافّة المفرش: شريط مربّعاتٍ وطرفٌ مقوّس.
 * - `SabahHeading` عنوان القسم **شمسٌ تطلع من خلف خطّ الأفق** حين يدخل القسم (`data-m-in`) ورمزه في قرصها.
 *
 * الخامة والحركة في `styles/skins/sabah.css`. ما يتبع العلامة: البرتقاليّ (`--m-accent`) والأزرق
 * (`--m-accent-2`). وما لا يتبعها خامة: الصفار والبياض والخبز والورق.
 */
import type { CSSProperties } from "react";
import { Icon } from "@/lib/icons";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };

/** أشعّة الشمس: أربعة وعشرون مثلّثاً حول المركز. */
const RAYS = Array.from({ length: 24 }, (_, i) => i * 15);

/** المائدة بإحداثيات 300×150: التوست يساراً، والبيضة وسطاً (صفارها يُركَّب فوقها)، والكوب يميناً. */
function Table() {
  return (
    <svg viewBox="0 0 300 150" aria-hidden="true" className="absolute inset-0 block h-full w-full overflow-visible">
      {/* بياض البيضة */}
      <path className="m-sb-white" d="M96 92q-10-30 22-40q14-22 42-10q30-8 40 20q24 14 10 40q-6 26-40 22q-22 16-44 0q-32 4-30-32Z" fill="#fffdf6" stroke="#eadfc4" strokeWidth="2" />
      {/* التوست */}
      <g>
        <path d="M22 84q-8-22 14-22h22q22 0 14 22v36q0 6-6 6H28q-6 0-6-6Z" fill="#e9b872" stroke="#b9823f" strokeWidth="2.4" />
        <path d="M30 86q-4-14 10-14h14q14 0 10 14v28H30Z" fill="#f6dba0" />
        <path d="M38 96l8 8l12-14" fill="none" stroke="#e2a94f" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* الكوب */}
      <g>
        <ellipse cx="252" cy="126" rx="34" ry="6" fill="#ffffff" stroke="#d6cdb8" strokeWidth="1.5" />
        <path d="M230 82h44l-4 34q-1 8-10 8h-16q-9 0-10-8Z" fill="#ffffff" stroke="#d6cdb8" strokeWidth="1.8" />
        <path className="m-sb-band" d="M231 92h42l-1 10h-40Z" />
        <path d="M273 90q14-2 13 9q-1 10-15 10" fill="none" stroke="#d6cdb8" strokeWidth="2.4" />
        <g className="m-sb-steam" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round">
          <path d="M244 72c-5-7 5-10 0-18" />
          <path d="M260 72c-5-7 5-10 0-18" />
        </g>
      </g>
      {/* رشّة فلفل وبقدونس على البياض */}
      <g fill="#2f2415" fillOpacity=".5">
        <circle cx="120" cy="74" r="1.3" />
        <circle cx="186" cy="70" r="1.3" />
        <circle cx="196" cy="108" r="1.3" />
        <circle cx="112" cy="106" r="1.3" />
        <circle cx="150" cy="126" r="1.3" />
      </g>
    </svg>
  );
}

export function SabahHead({ restaurant, en, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  return (
    <header className="m-head m-head-sabah relative overflow-hidden pb-2">
      <Corner>{corner}</Corner>
      <div className="m-sb-sky relative overflow-hidden px-4 pt-12">
        {/* الشمس وأشعّتها خلف المائدة */}
        <svg viewBox="-100 -100 200 200" aria-hidden="true" className="m-sb-sun absolute left-1/2 top-[38%] h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2">
          <g className="m-sb-rays">
            {RAYS.map((a) => (
              <path key={a} d="M0 0L-5.5-98L5.5-98Z" transform={`rotate(${a})`} />
            ))}
          </g>
        </svg>
        <p className="m-sb-hello relative text-center text-[1.9rem] leading-none" style={display}>
          {en ? "Good morning" : "صباح الخير"}
        </p>
        <div className="relative mx-auto mt-2 aspect-[300/150] w-full max-w-[19rem]">
          <Table />
          {/* الصفار: شعار المحلّ */}
          <span className="m-sb-yolk absolute left-1/2 top-[57%] block aspect-square w-[24%] -translate-x-1/2 -translate-y-1/2 rounded-full p-[5px]">
            <LogoMark
              restaurant={restaurant}
              size="relative h-full w-full"
              style={{ borderRadius: "9999px", background: "rgba(255,255,255,.55)" }}
              fallbackStyle={{ color: "#7a3d00", fontFamily: "var(--m-display)" }}
              letterSize="1.5rem"
            />
          </span>
        </div>
      </div>
      <div aria-hidden="true" className="m-sb-edge h-7" />
      <div className="px-4 text-center">
        <h1 className="m-title mt-2 text-[2.4rem] leading-[1.45]" style={{ ...display, color: "var(--m-text)" }}>
          {restaurant.name}
        </h1>
        {typeLabel && (
          <p className="text-[13px] font-bold" style={{ color: "var(--m-muted)" }}>
            {typeLabel}
          </p>
        )}
        {children && <div className="m-chips mt-5 flex flex-wrap items-center justify-center gap-2">{children}</div>}
      </div>
    </header>
  );
}

/** الشمس تطلع من خلف خطّ الأفق برمز القسم، ثم الاسم والعدد. */
export function SabahHeading({ name, items, icon = "egg", photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-sb-h mb-5">
      <div className="m-sb-horizon flex items-end gap-3 pb-1.5">
        <span aria-hidden="true" className="m-sb-rise relative block h-9 w-14 shrink-0 overflow-hidden">
          <span className="m-sb-disc absolute bottom-[-1.55rem] left-1/2 flex h-[3.1rem] w-[3.1rem] -translate-x-1/2 items-start justify-center rounded-full pt-1.5">
            <Icon name={icon} size={17} />
          </span>
        </span>
        <h2 className="min-w-0 flex-1 text-[1.75rem] leading-[1.35]" style={{ ...display, color: "var(--m-text)" }}>
          {name}
        </h2>
        {items && <span className="m-sb-count mb-1 shrink-0 px-2.5 py-1 text-[11px] font-bold">{items}</span>}
      </div>
      {photo && <div className="m-sb-photo mt-3">{photo}</div>}
    </div>
  );
}

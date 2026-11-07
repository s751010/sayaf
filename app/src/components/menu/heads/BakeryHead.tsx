/**
 * «فرن» — فرن الحيّ (٢٠٢٦/١١/٠٧).
 *
 * - `BakeryHead`    فوهةُ فرنٍ حجريّ: قوسٌ من الطوب، وجوفٌ يتّقد جمراً من أرضيّته ولهبان
 *   على جانبيه، والشعار في رغيفٍ مستدير على أرضيّة الفرن، وعتبةُ حجرٍ تحته — ثم اسم
 *   المحلّ **مختومٌ** بحبر الختم كما يُختم كيس الخبز.
 * - `BakeryHeading` عنوان القسم على مِطرحة الخبّاز: الاسم على لوحها الخشب، ويدها ممدودةٌ
 *   إلى ختمٍ صغيرٍ بعدد الأصناف، وصورة القسم على ورق خبز.
 *
 * الخامة والحركة في `styles/skins/bakery.css`. ما يتبع العلامة: حبر الختم (الاسم وإطاره)
 * وختم العدد والسعر. وما لا يتبعها خامة: الطوب والجمر والرغيف وخشب المطرحة وورق الخبز.
 */
import type { CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };
// حبر الختم بنسخته المقروءة: لون علامةٍ فاتح يُغمَّق حتى ٤٫٥ على الدقيق (`withInk`).
const stampInk = "var(--m-accent-ink, var(--m-accent))";

/** لهبان على جانبي الفوهة — والشعار بينهما على أرضيّة الفرن. */
function Flames() {
  return (
    <svg
      viewBox="0 0 200 48"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="m-fr-flames absolute inset-x-0 bottom-0 block h-12 w-full"
    >
      <g className="m-fr-flame">
        <path d="M31 48C27 36 40 30 44 14c3 10 9 13 8 21 4-4 5-9 4-13 7 8 8 19 5 26Z" fill="#e2601d" />
        <path d="M38 48c-2-7 4-11 7-20 2 7 8 10 7 20Z" fill="#ffb648" />
      </g>
      <g className="m-fr-flame m-fr-flame-2">
        <path d="M169 48c4-12-9-18-13-34-3 10-9 13-8 21-4-4-5-9-4-13-7 8-8 19-5 26Z" fill="#e2601d" />
        <path d="M162 48c2-7-4-11-7-20-2 7-8 10-7 20Z" fill="#ffb648" />
      </g>
    </svg>
  );
}

export function BakeryHead({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  return (
    <header className="m-head m-head-oven relative overflow-hidden px-4 pb-1 pt-12">
      <Corner>{corner}</Corner>
      <div className="relative mx-auto w-[15.5rem] max-w-full">
        {/* القوس والجوف: الجمر والّلهب يتّقدان مرّةً (`m-fr-warm`)، والرغيف ساكن. */}
        <div className="m-fr-arch relative h-[8.75rem]">
          <div className="m-fr-mouth absolute inset-x-[18px] bottom-0 top-[18px] overflow-hidden">
            <span aria-hidden="true" className="m-fr-glow absolute inset-0 block" />
            <Flames />
            <div className="absolute inset-x-0 bottom-1.5 flex justify-center">
              <span className="m-fr-loaf block rounded-full p-[6px]">
                <LogoMark
                  restaurant={restaurant}
                  size="relative h-16 w-16"
                  style={{ borderRadius: "9999px", background: "var(--m-surface)" }}
                  fallbackStyle={{ color: "var(--m-accent)" }}
                  letterSize="1.9rem"
                />
              </span>
            </div>
          </div>
        </div>
        <span aria-hidden="true" className="m-fr-sill -mx-3 block h-3" />
      </div>
      {/* الختم: إطاره المزدوج على `::before` بحبيبة الحبر — والاسم نفسه مصمتٌ بلا حبيبة،
          فتباينه تباين `--m-accent-ink` كاملاً. */}
      <div className="mt-6 flex justify-center px-1">
        <div className="m-fr-stamp relative max-w-full px-6 pb-2.5 pt-2 text-center">
          <h1 className="m-title relative text-[1.65rem] font-bold leading-[1.45]" style={{ ...display, color: stampInk }}>
            {restaurant.name}
          </h1>
        </div>
      </div>
      {typeLabel && (
        <p className="mt-2.5 text-center text-[13px] font-bold" style={{ color: "var(--m-muted)" }}>
          {typeLabel}
        </p>
      )}
      {banner && (
        <div className="m-fr-window mx-auto mt-5 max-w-sm overflow-hidden">
          <SafeImage
            src={banner}
            alt=""
            loading="eager"
            className="h-28 w-full object-cover"
            wrapperClassName="h-28 w-full"
            fallback={<span />}
          />
        </div>
      )}
      {children && (
        <div className="m-chips mt-5 flex flex-wrap items-center justify-center gap-2">{children}</div>
      )}
    </header>
  );
}

/** المطرحة: الاسم على لوحها، ويدها ممدودةٌ إلى ختم العدد، والصورة على ورق خبز. */
export function BakeryHeading({ name, items, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-peel-h mb-4">
      <div className="flex items-center">
        <h2
          className="m-fr-blade min-w-0 py-1.5 pe-5 ps-4 text-[1.2rem] font-bold leading-[1.5]"
          style={{ ...display, color: "var(--m-text)" }}
        >
          {name}
        </h2>
        <span aria-hidden="true" className="m-fr-handle block h-2.5 min-w-10 flex-1" />
        {items && (
          <span className="m-fr-count ms-3 shrink-0 px-2 py-0.5 text-[11px] font-bold" style={{ color: stampInk }}>
            {items}
          </span>
        )}
      </div>
      {photo && <div className="m-fr-photo mt-3">{photo}</div>}
    </div>
  );
}

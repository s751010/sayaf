/**
 * «صاج» — محلّ البرجر والوجبات السريعة (٢٠٢٦/١١/٠٧).
 *
 * - `BurgerHead`    لوح الكاونتر: أرضيّته لون التمييز ببرشامٍ في أركانه، والشعار في
 *   ختمٍ مموّج كورق تغليف البرجر، وتحت اللوح جبنُ شيدر يسيل من حافّته.
 * - `BurgerHeading` عنوان القسم: الاسم على صاجٍ حديديّ داكن وعدد الأصناف في حبّةٍ
 *   بلون التمييز، والجبن يسيل من الصاج على صورة القسم (أو على فراغٍ محجوزٍ له).
 *
 * الخامة والحركة في `styles/skins/burger.css`. ما يتبع العلامة: اللوح وحبّة العدد
 * وخطّ الصوص تحت السعر. وما لا يتبعها خامة: الصاج (حديد) والجبن (شيدر) وورق الختم.
 */
import type { CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };
// بلا `opacity` على أيّ نصٍّ فوق اللوح: `--m-on-accent` محسوبٌ ≥ ٤٫٥ بلونه الكامل،
// وتخفيفه يُسقطه تحت AA على ألوان علامةٍ متوسّطة.
const onBoard: CSSProperties = { color: "var(--m-on-accent)" };

export function BurgerHead({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  return (
    <header className="m-head m-head-griddle relative px-4 pb-1 pt-12">
      <Corner>{corner}</Corner>
      <div className="relative mx-auto max-w-sm">
        <div className="m-sj-board relative px-6 pb-6 pt-6 text-center">
          {/* الختم وحده يُضغط (`m-sj-smash`) — الحاوية تتوسّط ولا تتحرّك. */}
          <div className="flex justify-center">
            <span className="m-sj-seal block rounded-full p-[7px]">
              <LogoMark
                restaurant={restaurant}
                size="relative h-[4.5rem] w-[4.5rem]"
                style={{ borderRadius: "9999px", background: "var(--m-surface)" }}
                fallbackStyle={{ color: "var(--m-accent)" }}
                letterSize="2.1rem"
              />
            </span>
          </div>
          <h1 className="m-title relative mt-3 text-[1.75rem] font-extrabold leading-[1.45]" style={{ ...display, ...onBoard }}>
            {restaurant.name}
          </h1>
          {typeLabel && (
            <p className="relative mt-0.5 text-[13px] font-bold" style={onBoard}>
              {typeLabel}
            </p>
          )}
        </div>
        {/* الجبن يسيل من حافّة اللوح — في التدفّق لا فوقه، فلا يغطّي شريحةً تُلمس. */}
        <span aria-hidden="true" className="m-sj-melt m-sj-melt-head mx-5 -mt-px block" />
      </div>
      {banner && (
        <div className="m-sj-window mx-auto mt-3 max-w-sm overflow-hidden">
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
        <div className="m-chips mt-4 flex flex-wrap items-center justify-center gap-2">{children}</div>
      )}
    </header>
  );
}

/** الاسم على الصاج، والعدد في حبّةٍ بلون التمييز، والجبن يسيل على الصورة. */
export function BurgerHeading({ name, items, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-melt-h mb-4">
      <div className="m-sj-bar flex items-center gap-3 px-4 py-2.5">
        <h2 className="m-sj-bar-name min-w-0 flex-1 text-[1.25rem] font-extrabold leading-[1.5]" style={display}>
          {name}
        </h2>
        {items && <span className="m-sj-count shrink-0 px-2.5 py-0.5 text-[11px] font-bold">{items}</span>}
      </div>
      {/* القطرات فوق أعلى الصورة إن كانت، وإلا فوق فراغٍ بطولها — لا فوق أوّل طبق. */}
      <div className="relative">
        <span aria-hidden="true" className="m-sj-melt pointer-events-none absolute inset-x-4 top-0 z-[1] block" />
        {photo ? <div className="m-sj-photo">{photo}</div> : <span aria-hidden="true" className="m-sj-melt-room block" />}
      </div>
    </div>
  );
}

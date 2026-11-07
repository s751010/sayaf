/**
 * «فوّال» — فوّال الحارة عند الفجر (٢٠٢٦/١١/٠٧).
 *
 * - `BreakfastHead`    صينيّةُ نحاسٍ منقوشة تطلع من خلف الكاونتر كما تطلع الشمس، وأشعّتها
 *   خلفها، وشعارك في صحنٍ مبيّض (نحاسٌ مطليٌّ بالقصدير من داخله) على الكاونتر والبخار
 *   يعلو منه، وتحته شريطُ بلاطٍ مزخرف بلون العلامة كبلاط الدكاكين القديمة.
 * - `BreakfastHeading` عنوان القسم: صحنُ نحاسٍ صغير فيه رمز القسم، والاسم بخطّ اللافتة،
 *   وخطٌّ منقّط إلى العدد، وصورة القسم في صينيّةٍ نحاسية.
 *
 * الخامة والحركة في `styles/skins/breakfast.css`. ما يتبع العلامة: البلاط والسعر والأزرار.
 * وما لا يتبعها خامة: النحاس والقصدير وضوء الصبح — صحون الفوّال نحاسٌ أيّاً كان لونه.
 */
import type { CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import { categoryIcon } from "@/lib/categories";
import { Icon } from "@/lib/icons";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };
const muted: CSSProperties = { color: "var(--m-muted)" };

/** ثلاثة خيوط بخارٍ فوق الصحن — تعلو مرّتين ثم تسكن (`m-fw-steam`). */
function Steam() {
  return (
    <svg viewBox="0 0 64 40" aria-hidden="true" className="m-fw-steam-svg absolute inset-x-0 bottom-[3.35rem] z-[11] mx-auto block h-10 w-16">
      {["M18 38c-6-7 6-11 0-18s5-10 2-17", "M32 38c-6-8 7-12 0-20s6-11 2-17", "M46 38c-6-7 6-11 0-18s5-10 2-17"].map((d, i) => (
        <path key={i} className="m-fw-wisp" d={d} fill="none" strokeWidth="2.6" strokeLinecap="round" />
      ))}
    </svg>
  );
}

export function BreakfastHead({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  return (
    <header className="m-head m-head-tray relative overflow-hidden pb-1 pt-9">
      <Corner>{corner}</Corner>
      {/* الأفق: الأشعّة والصينيّة خلفه، والصحن على الكاونتر أمامه. التوسيط بالهوامش لا بـ
          `translate` — الحركة على `transform` فلا تمحوه. */}
      <div className="relative mx-auto h-[9.5rem] w-full max-w-sm">
        {/* الأفق يقصّ ما تحته: الصينيّة تطلع من خلف الكاونتر لا من فوق البلاط. */}
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
          <span className="m-fw-rays absolute inset-0 block" />
          <span className="m-fw-tray absolute inset-x-0 bottom-0 mx-auto block h-[7.5rem] w-[15rem]" />
        </div>
        <Steam />
        <div className="absolute inset-x-0 bottom-[-1.6rem] z-10 flex justify-center">
          <span className="m-fw-plate block rounded-full p-[6px]">
            <LogoMark
              restaurant={restaurant}
              size="relative h-[4.25rem] w-[4.25rem]"
              style={{ borderRadius: "9999px", background: "var(--m-surface)" }}
              fallbackStyle={{ color: "var(--m-accent)" }}
              letterSize="2rem"
            />
          </span>
        </div>
      </div>
      <span aria-hidden="true" className="m-fw-tiles block h-[22px]" />
      <div className="px-4 pt-8 text-center">
        {/* لاله‌زار وزنٌ واحد وهو أسود أصلاً — بلا `font-bold` فلا يُسمَّن صناعياً. */}
        <h1 className="m-title text-[2.05rem] leading-[1.35]" style={{ ...display, color: "var(--m-text)" }}>
          {restaurant.name}
        </h1>
        {typeLabel && (
          <p className="mt-1 text-[13px] font-bold" style={muted}>
            {typeLabel}
          </p>
        )}
      </div>
      {banner && (
        <div className="m-fw-window mx-4 mt-5 overflow-hidden sm:mx-auto sm:max-w-sm">
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
        <div className="m-chips mt-5 flex flex-wrap items-center justify-center gap-2 px-4">{children}</div>
      )}
    </header>
  );
}

/** صحن النحاس برمز القسم، والاسم، وخطٌّ منقّط إلى العدد، والصورة في صينيّة. */
export function BreakfastHeading({ name, items, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-plate-h mb-4">
      <div className="flex items-center gap-3 px-1">
        <span aria-hidden="true" className="m-fw-dish flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
          <span className="m-fw-dish-well flex h-8 w-8 items-center justify-center rounded-full">
            <Icon name={categoryIcon(name)} size={18} strokeWidth={1.6} />
          </span>
        </span>
        <h2 className="min-w-0 text-[1.45rem] leading-[1.45]" style={{ ...display, color: "var(--m-text)" }}>
          {name}
        </h2>
        <span aria-hidden="true" className="m-fw-dots block h-1 min-w-6 flex-1" />
        {items && (
          <span className="shrink-0 text-[11px] font-bold" style={muted}>
            {items}
          </span>
        )}
      </div>
      {photo && <div className="m-fw-photo mt-3">{photo}</div>}
    </div>
  );
}

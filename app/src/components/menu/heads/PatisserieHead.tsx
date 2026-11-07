/**
 * «حلواني» — واجهة محلّ الحلويات (٢٠٢٦/١١/٠٣).
 *
 * - `PatisserieHead`    مظلّةٌ مقلّمة بحافّةٍ مموّجة (لون التمييز والسطح)،
 *   وتحتها بطاقةُ علبة الكيك: حدٌّ مزدوج ودرزةٌ منقّطة كخيط العلبة، والشعار
 *   مثبّتٌ على حافّتها العليا كختم المحلّ.
 * - `PatisserieHeading` عنوان القسم على مفرش دانتيل: بيضاويٌّ بحلقةٍ منقّطة،
 *   والعدد تحته.
 *
 * الخامة والحركة في `styles/skins/patisserie.css`. والمظلّة لون التاجر إن اختاره.
 */
import type { CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };

export function PatisserieHead({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  return (
    <header className="m-head m-head-awning relative pb-1">
      {/* المبدّل على المظلّة لا على حافّة العلبة: كان يقطع حدّها المزدوج فيبدو
          خطأ تخطيط لا بطاقةً معلّقة (تدقيق ٢٠٢٦/١١/٠٧). */}
      <Corner className="top-3">{corner}</Corner>
      <div aria-hidden="true" className="m-awning" />
      <div className="relative mx-auto mt-9 max-w-sm px-4">
        <div className="m-pt-box relative px-6 pb-5 pt-11 text-center">
          <div className="absolute inset-x-0 -top-9 flex justify-center">
            <LogoMark
              restaurant={restaurant}
              size="relative h-[4.5rem] w-[4.5rem]"
              style={{
                borderRadius: "9999px",
                background: "var(--m-surface)",
                boxShadow: "0 0 0 3px var(--m-surface), 0 0 0 5px var(--m-accent), 0 8px 16px -10px rgba(58,29,41,.5)",
              }}
              fallbackStyle={{ color: "var(--m-accent)" }}
              letterSize="2.1rem"
            />
          </div>
          <h1 className="m-title text-[1.9rem] font-bold leading-[1.5]" style={{ ...display, color: "var(--m-text)" }}>
            {restaurant.name}
          </h1>
          {typeLabel && (
            <p className="mt-0.5 text-[13px] font-bold" style={{ color: "var(--m-muted)" }}>
              {typeLabel}
            </p>
          )}
        </div>
      </div>
      {banner && (
        <div className="m-pt-window mx-auto mt-5 max-w-sm overflow-hidden px-4">
          <SafeImage
            src={banner}
            alt=""
            loading="eager"
            className="h-32 w-full object-cover"
            wrapperClassName="h-32 w-full overflow-hidden rounded-[22px]"
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

/** المفرش: الاسم في بيضاويٍّ بحلقة دانتيل، والعدد تحته، والصورة بعده. */
export function PatisserieHeading({ name, items, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-doily-h mb-5 text-center">
      <span className="m-doily relative inline-block px-7 py-2">
        <h2 className="text-[1.45rem] font-bold leading-[1.5]" style={{ ...display, color: "var(--m-text)" }}>
          {name}
        </h2>
      </span>
      {items && (
        // ‏`mt-4`: حلقة الدانتيل تخرج ١٣px خارج البيضاوي (`::before`) فكان العدد تحتها.
        <p className="mt-4 text-[12px] font-bold" style={{ color: "var(--m-muted)" }}>
          {items}
        </p>
      )}
      {photo && <div className="m-pt-photo mt-3">{photo}</div>}
    </div>
  );
}

/**
 * «عسير» — القطّ العسيري (٢٠٢٦/١٠/٢٧).
 *
 * فنٌّ ترسمه نساء عسير على جدران البيت من الداخل: أشرطةٌ أفقية بألوانٍ صريحة
 * يفصلها خطٌّ أسود، وصفوفُ مثلّثات تتدلّى منها أو تقوم عليها. فهنا:
 *
 * - `AsirHead`    الترويسة جدارٌ مرسوم: شريطٌ ثم صفّ مثلّثات، ثم الشعار في حلقاتٍ
 *   ملوّنة والاسم، ثم مثلّثاتٌ قائمة وشريطٌ يغلق الجدار. والمثلّثات تُرسم واحداً
 *   بعد واحد عند الفتح.
 * - `AsirHeading` عنوان القسم إفريزٌ: مثلّثاتٌ صغيرة، ومعيّنٌ والاسم، وشريطٌ تحته.
 *   ولكلّ قسمٍ ترتيب ألوانه (`--q-shift`) كي لا تتكرّر الجدران.
 *
 * الأحمر هو التمييز (لون التاجر إن اختاره)، والأصفر والأزرق والأخضر خامةٌ
 * (`--m-q-*` في `styles/skins/asir.css`) لا تتبع العلامة — كالطوب في «نيون».
 * ولا نصّ يقع على شريطٍ ملوّن: النصوص كلّها على الجصّ.
 */
import type { CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };
const muted: CSSProperties = { color: "var(--m-muted)" };
const ink = "var(--m-accent-ink, var(--m-accent))";

/** حلقات الشعار — من الداخل: جصّ · أحمر · أصفر · أخضر · حبر. */
const RINGS =
  "0 0 0 3px var(--m-surface), 0 0 0 6px var(--m-accent), 0 0 0 9px var(--m-q-yellow), 0 0 0 12px var(--m-q-green), 0 0 0 13.5px var(--m-text)";

export function AsirHead({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  return (
    <header className="m-head m-head-mural relative">
      <Corner>{corner}</Corner>
      <div className="m-mural relative">
        <span aria-hidden="true" className="m-q-stripes block" />
        <span aria-hidden="true" className="m-q-teeth m-q-down block" />
        <div className="relative px-4 pb-7 pt-8 text-center">
          <LogoMark
            restaurant={restaurant}
            size="relative mx-auto h-[4.5rem] w-[4.5rem]"
            style={{ borderRadius: "9999px", background: "var(--m-surface)", boxShadow: RINGS }}
            fallbackStyle={{ color: ink }}
            letterSize="2.2rem"
          />
          <h1 className="m-title mt-7 text-[1.9rem] font-bold leading-tight" style={display}>
            {restaurant.name}
          </h1>
          {typeLabel && (
            <p className="mt-1 text-sm" style={muted}>
              {typeLabel}
            </p>
          )}
          {/* صورة الغلاف نافذةٌ في الجدار المرسوم، بإطارٍ من أشرطته. */}
          {banner && (
            <div className="m-q-window mx-auto mt-6 max-w-sm overflow-hidden">
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
        </div>
        <span aria-hidden="true" className="m-q-teeth m-q-up block" />
        <span aria-hidden="true" className="m-q-stripes m-q-flip block" />
      </div>
      {children && (
        <div className="m-chips mt-4 flex flex-wrap items-center justify-center gap-2 px-4">{children}</div>
      )}
    </header>
  );
}

/** الإفريز: مثلّثاتٌ صغيرة، ومعيّنٌ والاسم والعدد، وشريطٌ تحته — والصورة فوقها بإطارٍ مرسوم. */
export function AsirHeading({ name, items, index, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-frieze mb-5" style={{ "--q-shift": index % 4 } as CSSProperties}>
      {photo && <div className="m-q-frame mb-5">{photo}</div>}
      <span aria-hidden="true" className="m-q-teeth m-q-down m-q-sm block" />
      <div className="flex items-center gap-3 py-2.5">
        <span aria-hidden="true" className="m-q-diamond shrink-0" />
        <h2 className="min-w-0 text-[1.4rem] font-bold leading-tight" style={{ ...display, color: "var(--m-text)" }}>
          {name}
        </h2>
        {items && (
          <span className="ms-auto shrink-0 text-[12px]" style={muted}>
            {items}
          </span>
        )}
      </div>
      <span aria-hidden="true" className="m-q-stripes m-q-sm block" />
    </div>
  );
}

/**
 * «دكّان» — بقالة الحارة القديمة (٢٠٢٦/١٠/٢٧).
 *
 * - `DukkanHead`    لوحة صفيحٍ مدهونة باليد، معلّقةٌ بسلكين فوق الباب: أرضيّتها
 *   لون التمييز (أزرق المينا، أو لون التاجر)، وحولها إطارٌ مدهون ومساميرُ في
 *   زواياها، والاسم بخطّ الرقعة كما يكتبه خطّاط اللوحات. وتحت الشرائح رفٌّ خشب.
 * - `DukkanHeading` عنوان القسم رفٌّ: الاسم فوقه، وعدد الأصناف على لوح طباشير
 *   صغير، وصورة القسم (إن وُجدت) **موضوعةٌ على الرفّ**.
 *
 * الخامة والحركة في `styles/skins/dukkan.css` — CSS خالص، ولا حركة إلا لمن
 * يقبلها. وكلّ لونٍ هنا `--m-*`: اللوحة تلبس لون علامة التاجر.
 */
import type { CSSProperties, ReactNode } from "react";
import { SafeImage } from "@/components/ui";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };
const onSign: CSSProperties = { color: "var(--m-on-accent)" };

export function DukkanHead({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  return (
    <header className="m-head m-head-tin relative px-4 pb-1 pt-14">
      <Corner>{corner}</Corner>
      <div className="m-tin-hang relative mx-auto max-w-sm">
        {/* سلكان من أعلى الترويسة إلى عروتَي اللوحة — زخرفةٌ لا محتوى. */}
        <span aria-hidden="true" className="m-wire m-wire-start" />
        <span aria-hidden="true" className="m-wire m-wire-end" />
        <div className="m-tin relative px-6 pb-5 pt-5 text-center">
          <LogoMark
            restaurant={restaurant}
            size="relative mx-auto h-16 w-16"
            style={{
              borderRadius: "9999px",
              background: "var(--m-surface)",
              boxShadow:
                "0 0 0 2px var(--m-on-accent), 0 0 0 4px var(--m-accent), 0 0 0 5px color-mix(in srgb, var(--m-on-accent) 55%, transparent)",
            }}
            fallbackStyle={{ color: "var(--m-text)" }}
            letterSize="2rem"
          />
          <h1 className="m-title relative mt-3 text-[1.85rem] font-bold leading-[1.45]" style={{ ...display, ...onSign }}>
            {restaurant.name}
          </h1>
          {typeLabel && (
            <p className="relative mt-0.5 text-[13px] font-bold" style={onSign}>
              {typeLabel}
            </p>
          )}
        </div>
      </div>
      {/* صورة الغلاف واجهةُ الدكّان الزجاجية تحت اللوحة، بإطار خشب. */}
      {banner && (
        <div className="m-dk-window mx-auto mt-5 max-w-sm overflow-hidden">
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
      <span aria-hidden="true" className="m-plank mt-3 block" />
    </header>
  );
}

export interface SkinHeadingProps {
  name: string;
  /** «5 أصناف» — أو `null` حين لا عدد. */
  items: string | null;
  /** ترتيب القسم. */
  index: number;
  /** صورة الغلاف جاهزةً (`CoverImg` من `SectionHeading`)، أو `null`. */
  photo: ReactNode;
}

/** الرفّ: الاسم ولوح الطباشير فوقه، والصورة عليه، والخشب تحتها. */
export function DukkanHeading({ name, items, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-shelf-h mb-5">
      <div className="flex items-end justify-between gap-3 px-1">
        <h2 className="min-w-0 text-[1.45rem] font-bold leading-[1.45]" style={{ ...display, color: "var(--m-text)" }}>
          {name}
        </h2>
        {items && <span className="m-chalk mb-1.5 shrink-0 px-2 py-0.5 text-[11px] font-bold">{items}</span>}
      </div>
      {photo && <div className="m-dk-photo mt-2">{photo}</div>}
      <span aria-hidden="true" className="m-plank block" />
    </div>
  );
}

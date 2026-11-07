/**
 * «عصّارة» — محلّ العصير (٢٠٢٦/١١/٠٣).
 *
 * - `JuiceHead`    شريحةُ برتقالٍ كبيرة (قشرٌ بلون التمييز، وفصوصٌ بلبّه) خلف
 *   الشعار، والاسم بخطٍّ عريضٍ مرح تحتها.
 * - `JuiceHeading` عنوان القسم بلاطةٌ بيضاء، وعليها شريحةُ فاكهةٍ يتبدّل لونها
 *   مع ترتيب القسم (برتقال · ليم · توت · مانجو) كلوحات العصّارات.
 *
 * ألوان الفواكه خامةٌ لا علامة (`--m-fruit-*` في `styles/skins/juice.css`)،
 * والقشر والسعر لون التاجر إن اختاره.
 */
import type { CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };

/** أربع فواكه تتناوب على أقسام المنيو — الترتيب لا المعنى. */
export const FRUITS = 4;

export function JuiceHead({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  return (
    <header className="m-head m-head-slice relative overflow-hidden px-4 pb-2 pt-12 text-center">
      <Corner>{corner}</Corner>
      <div className="relative mx-auto grid h-40 w-40 place-items-center">
        <span aria-hidden="true" className="m-slice absolute inset-0 rounded-full" />
        <LogoMark
          restaurant={restaurant}
          size="relative h-[4.75rem] w-[4.75rem]"
          style={{
            borderRadius: "9999px",
            background: "var(--m-surface)",
            boxShadow: "0 0 0 4px var(--m-surface), 0 6px 14px -6px rgba(29,42,23,.45)",
          }}
          fallbackStyle={{ color: "var(--m-accent)" }}
          letterSize="2.2rem"
        />
      </div>
      <h1 className="m-title mt-5 text-[2.2rem] leading-[1.35]" style={{ ...display, color: "var(--m-text)" }}>
        {restaurant.name}
      </h1>
      {typeLabel && (
        <p className="mt-1 text-[13px] font-bold" style={{ color: "var(--m-muted)" }}>
          {typeLabel}
        </p>
      )}
      {banner && (
        <div className="m-jc-window mx-auto mt-5 max-w-sm overflow-hidden">
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

/** البلاطة: مربّع الفاكهة، والاسم والعدد على بلاطةٍ بيضاء، والصورة تحتهما. */
export function JuiceHeading({ name, items, index, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-tile-h mb-4">
      {/* الفاكهة شريحةٌ على البلاطة لا شريطٌ بجانبها: الشريط الرفيع جعل العنوان
          بطاقةَ تطبيقٍ عامّة لا لوحة عصّارة (تدقيق ٢٠٢٦/١١/٠٧). والشريحة نفسها
          التي خلف الشعار — قشرٌ وفصوص — بلون فاكهة القسم. */}
      <div className="m-tile flex min-w-0 items-center gap-3 py-2 pe-3.5 ps-2">
        <span aria-hidden="true" className="m-tile-swatch block h-11 w-11 shrink-0 rounded-full" data-fruit={index % FRUITS} />
        <h2 className="min-w-0 flex-1 text-[1.35rem] leading-[1.45]" style={{ ...display, color: "var(--m-text)" }}>
          {name}
        </h2>
        {items && (
          <span className="shrink-0 text-[11px] font-bold" style={{ color: "var(--m-muted)" }}>
            {items}
          </span>
        )}
      </div>
      {photo && <div className="m-jc-photo mt-2.5">{photo}</div>}
    </div>
  );
}

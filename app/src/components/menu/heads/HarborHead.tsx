/**
 * «مرفأ» — سوق السمك على المرفأ (٢٠٢٦/١١/٠٣).
 *
 * - `HarborHead`    لوحُ المرفأ: أرضيّته لون التمييز داخل إطارٍ من حبلٍ مجدول،
 *   والشعار في طوقِ نجاةٍ برتقاليّ أبيض يطفو فوق اللوح، وتحته موجٌ بلون البحر.
 * - `HarborHeading` عنوان القسم: مرساةٌ صغيرة، والاسم، وحبلٌ ممدود إلى بطاقة
 *   سوقٍ مثقوبة عليها عدد الأصناف.
 *
 * الخامة والحركة في `styles/skins/harbor.css`. كلّ لونٍ يتبع العلامة `--m-*`؛
 * والحبل خامةٌ لا لون (لا يُصبغ بلون التاجر).
 */
import type { CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };
const onBoard: CSSProperties = { color: "var(--m-on-accent)" };

export function HarborHead({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  return (
    <header className="m-head m-head-harbor relative px-4 pb-1 pt-14">
      <Corner>{corner}</Corner>
      <div className="m-hb-frame relative mx-auto max-w-sm">
        {/* طوق النجاة فوق اللوح — الحاوية تتوسّط، والطوق وحده يتمايل. */}
        <div className="absolute inset-x-0 -top-11 z-10 flex justify-center">
          <span className="m-hb-buoy block rounded-full p-[7px]">
            <LogoMark
              restaurant={restaurant}
              size="relative h-[4.25rem] w-[4.25rem]"
              style={{ borderRadius: "9999px", background: "var(--m-surface)" }}
              fallbackStyle={{ color: "var(--m-accent)" }}
              letterSize="2rem"
            />
          </span>
        </div>
        <div className="m-hb-board relative px-6 pb-5 pt-12 text-center">
          <h1 className="m-title relative text-[1.7rem] font-bold leading-[1.45]" style={{ ...display, ...onBoard }}>
            {restaurant.name}
          </h1>
          {typeLabel && (
            <p className="relative mt-1 text-[13px] font-bold opacity-90" style={onBoard}>
              {typeLabel}
            </p>
          )}
        </div>
      </div>
      {banner && (
        <div className="m-hb-window mx-auto mt-5 max-w-sm overflow-hidden">
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
      <span aria-hidden="true" className="m-waves mt-4 block" />
    </header>
  );
}

/** مرساةٌ بخطٍّ واحد — حلقةٌ وساقٌ وعارضةٌ وذراعان. */
function Anchor() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" className="shrink-0">
      <path
        d="M12 2.5a2 2 0 1 0 0 4 2 2 0 1 0 0-4ZM12 6.5V21M8 10h8M4 13.5c.4 4.2 3.8 7.5 8 7.5s7.6-3.3 8-7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** المرساة، والاسم، وحبلٌ ممدود إلى بطاقة السوق. */
export function HarborHeading({ name, items, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-rope-h mb-4">
      <div className="flex items-center gap-2.5 px-1">
        <span style={{ color: "var(--m-accent)" }}>
          <Anchor />
        </span>
        <h2 className="min-w-0 text-[1.3rem] font-bold leading-[1.5]" style={{ ...display, color: "var(--m-text)" }}>
          {name}
        </h2>
        <span aria-hidden="true" className="m-rope min-w-6 flex-1" />
        {items && <span className="m-hb-tag shrink-0 py-0.5 pe-2 ps-4 text-[11px] font-bold">{items}</span>}
      </div>
      {photo && <div className="m-hb-photo mt-3">{photo}</div>}
    </div>
  );
}

/**
 * «طبق اليوم» — بطاقة واحدة بارزة للطبق المميّز الأول.
 *
 * كان مكانها شريط أفقي من بطاقات صغيرة، وبطاقته الأخيرة تظهر **مقطوعة** عند
 * حافة الشاشة فتبدو خللاً لا تمريراً — أوضح مصدر للإحساس بأن المنيو «غير
 * مرتّب». بطاقة واحدة كاملة أنظف بصرياً وأقوى تسويقياً: عنصر واحد يقول
 * «ابدأ من هنا» بدل ستة تتزاحم.
 *
 * يقرأ `dishes.featured` الموجود — لا عمود جديد.
 */
import type { CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import type { Dish } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { Icon, DishGlyph } from "@/lib/icons";

const mFont: CSSProperties = { fontFamily: "var(--m-font)" };

export function DishOfTheDay({
  dish,
  en,
  onOpen,
}: {
  dish: Dish;
  en: boolean;
  onOpen: () => void;
}) {
  const name = en && dish.name_en ? dish.name_en : dish.name;
  const desc = en && dish.description_en ? dish.description_en : dish.description;

  return (
    <button
      onClick={onOpen}
      className="flex w-full items-stretch overflow-hidden border text-start transition-transform hover:-translate-y-0.5"
      style={{
        background: "var(--m-surface)",
        borderColor: "var(--m-accent)",
        borderRadius: "var(--m-radius)",
      }}
    >
      <SafeImage
        src={dish.image}
        alt={name}
        className="h-28 w-28 shrink-0 object-cover sm:h-40 sm:w-40"
        wrapperClassName="h-28 w-28 shrink-0 text-4xl sm:h-40 sm:w-40"
        style={{ background: "var(--m-bg-2)" } as CSSProperties}
        fallback={
          <div
            className="flex h-28 w-28 items-center justify-center text-4xl sm:h-40 sm:w-40"
            style={{ background: "var(--m-bg-2)" } as CSSProperties}
          >
            <DishGlyph value={dish.emoji} size={34} />
          </div>
        }
      />

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-3.5">
        <span
          className="inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-black"
          style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
        >
          <Icon name="star" size={13} /> {en ? "Today's pick" : "طبق اليوم"}
        </span>
        <p
          className="mt-0.5 truncate text-lg font-black"
          style={{ color: "var(--m-text)", ...mFont }}
        >
          {name}
        </p>
        {desc && (
          <p className="line-clamp-2 text-xs leading-relaxed" style={{ color: "var(--m-muted)" }}>
            {desc}
          </p>
        )}
        <p className="mt-1 text-base font-black" style={{ color: "var(--m-accent)" }} dir="ltr">
          {formatPrice(dish.price ?? 0)} <span className="text-[10px] font-bold">ر.س</span>
        </p>
      </div>
    </button>
  );
}

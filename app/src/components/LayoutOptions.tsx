/**
 * شكل عرض الأطباق في مُنتقي اللوحة — خياراته ورسمها المصغّر.
 *
 * ⚠️ كان معرَّفاً **مرّتين** حرفياً (صفحة التصميم وصفحة القوائم)، فإضافة شكلٍ
 * جديد (`deck`) كانت تعني تذكّر الملفّين معاً — ومن ينسَ أحدهما يرَ التاجرُ
 * خياراً في صفحة ولا يجده في الأخرى.
 */
import { Icon } from "@/lib/icons";
import type { DishLayout } from "@/lib/themes";
import { cn } from "@/lib/utils";

/**
 * خيارات شكل العرض. `null` = «اترك افتراضي الطابع» — وهو خيار حقيقي لا غياب
 * خيار: التاجر الذي جرّب ثم ندم يعود لأصل الطابع بضغطة واحدة.
 */
export const LAYOUT_OPTIONS: { value: DishLayout | null; label: string; hint: string }[] = [
  { value: null, label: "افتراضي الطابع", hint: "كما صُمّم" },
  { value: "grid", label: "مربّعات", hint: "بطاقتان بالصف" },
  { value: "list", label: "قائمة", hint: "أنيقة بلا صور كبيرة" },
  { value: "showcase", label: "صور كبيرة", hint: "للكافيهات" },
  { value: "deck", label: "سحب أفقي", hint: "بطاقة تتوسّط الشاشة" },
];

/** رسم مصغّر لشكل العرض — الاختيار بالعين لا بقراءة الاسم. */
export function LayoutGlyph({ value }: { value: DishLayout | null }) {
  const box = "rounded-[3px] bg-dim/35";
  if (value === null)
    return (
      <span className="flex h-6 items-center justify-center text-dim">
        <Icon name="sparkle" size={18} />
      </span>
    );
  if (value === "list")
    return (
      <span className="mx-auto flex h-6 w-16 flex-col justify-center gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cn(box, "h-1")} />
        ))}
      </span>
    );
  if (value === "showcase") return <span className={cn(box, "mx-auto block h-6 w-16")} />;
  if (value === "deck")
    return (
      <span className="mx-auto flex h-6 w-16 items-center justify-center gap-1">
        <span className={cn(box, "h-4 w-2.5 opacity-60")} />
        <span className={cn(box, "h-6 w-9")} />
        <span className={cn(box, "h-4 w-2.5 opacity-60")} />
      </span>
    );
  return (
    <span className="mx-auto grid h-6 w-16 grid-cols-2 gap-1">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className={cn(box, "h-[10px]")} />
      ))}
    </span>
  );
}

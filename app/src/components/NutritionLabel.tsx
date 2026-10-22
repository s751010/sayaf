/**
 * ملصق القيم الغذائية — الشكل الذي يعرفه المفتّش والزبون.
 *
 * يُرسم من أرقام الحاسبة (`NutritionResult`) أو من طبقٍ محفوظ (حيث الدهون
 * والسكر غير مخزّنَين بعد — فتُحذف صفوفهما بدل أن تُعرض أصفاراً كاذبة).
 *
 * الحركة: كل رقم يحمل مفتاحه قيمتَه، فيُعاد تركيبه عند التغيّر فيومض صعوداً
 * (`.num-flip`) — التاجر يرى **أيّ رقم تغيّر** حين يضيف سطراً لوصفته.
 */
import { displayAllergens } from "@/lib/allergens";
import { cn } from "@/lib/utils";
import { DAILY_CAFFEINE_MAX_MG, DAILY_KCAL } from "@/lib/nutrition";

export type LabelValues = {
  kcal: number | null;
  fat?: number | null;
  satFat?: number | null;
  sugar?: number | null;
  sodium: number | null;
  caffeine: number | null;
  burnMinutes: number | null;
  highSodium: boolean;
  allergens: string[];
  servingGrams?: number | null;
};

/** في `lib/nutrition` كي يقرأها المنيو العامّ بلا حزمة هذا المكوّن. */
export { DAILY_CAFFEINE_MAX_MG, DAILY_KCAL };

function Num({ value, unit }: { value: number | null | undefined; unit?: string }) {
  if (value === null || value === undefined) return <span className="text-faint">—</span>;
  return (
    <span className="inline-flex items-baseline gap-1">
      <span key={value} className="num-flip inline-block font-bold">
        {value.toLocaleString("ar-SA-u-nu-latn")}
      </span>
      {unit && <span className="text-xs text-dim">{unit}</span>}
    </span>
  );
}

export function NutritionLabel({
  values,
  className,
  title = "القيم الغذائية",
}: {
  values: LabelValues;
  className?: string;
  title?: string;
}) {
  const allergens = displayAllergens(values.allergens, false);
  const has = (v: number | null | undefined) => v !== null && v !== undefined;

  return (
    <div className={cn("nlabel", className)} aria-label={title}>
      <p className="font-display text-xl font-bold leading-tight">{title}</p>
      <p className="mt-0.5 text-xs text-dim">
        لكل حصّة{values.servingGrams ? ` (${values.servingGrams} غ)` : ""}
      </p>
      <div className="nlabel-rule" />

      <div className="flex items-baseline justify-between gap-3">
        <span className="text-base font-bold">السعرات الحرارية</span>
        <span className="font-display text-4xl font-bold leading-none">
          {has(values.kcal) ? (
            <span key={values.kcal} className="num-flip inline-block">
              {values.kcal}
            </span>
          ) : (
            <span className="text-faint">—</span>
          )}
        </span>
      </div>
      <div className="nlabel-rule" />

      {has(values.fat) && (
        <div className="nlabel-row">
          <span className="font-semibold">الدهون</span>
          <Num value={values.fat} unit="غ" />
        </div>
      )}
      {has(values.satFat) && (
        <div className="nlabel-row ps-4 text-sm">
          <span>منها مشبعة</span>
          <Num value={values.satFat} unit="غ" />
        </div>
      )}
      {has(values.sugar) && (
        <div className="nlabel-row">
          <span className="font-semibold">السكريات</span>
          <Num value={values.sugar} unit="غ" />
        </div>
      )}
      <div className="nlabel-row">
        <span className="font-semibold">الصوديوم</span>
        <span className="inline-flex items-center gap-2">
          {values.highSodium && (
            <span className="rounded-[4px] bg-bad px-1.5 py-0.5 text-[10px] font-bold text-white">مرتفع</span>
          )}
          <Num value={values.sodium} unit="ملغم" />
        </span>
      </div>
      <div className="nlabel-row">
        <span className="font-semibold">الكافيين</span>
        <Num value={values.caffeine} unit="ملغم" />
      </div>

      <div className="nlabel-rule" style={{ height: 3 }} />
      <div className="nlabel-row text-sm">
        <span>دقائق مشي لحرقها</span>
        <Num value={values.burnMinutes} unit="دقيقة" />
      </div>
      <div className="pt-1.5 text-sm">
        <span className="font-semibold">مسبّبات الحساسية: </span>
        {allergens.length ? (
          <span>{allergens.map((a) => `${a.emoji} ${a.label}`).join(" · ")}</span>
        ) : (
          <span className="text-dim">لا شيء من المكوّنات المعروفة</span>
        )}
      </div>
      <div className="nlabel-hair mt-2.5" />
      <p className="mt-2 text-[11px] leading-relaxed text-dim">
        يحتاج البالغ في المتوسّط إلى {DAILY_KCAL.toLocaleString("ar-SA-u-nu-latn")} سعرة حرارية يومياً.
        {(values.caffeine ?? 0) > 0 && ` والحدّ الأعلى اليومي من الكافيين للبالغ ${DAILY_CAFFEINE_MAX_MG} ملغم.`}
      </p>
    </div>
  );
}

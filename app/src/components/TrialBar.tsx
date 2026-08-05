/**
 * شريط انتهاء التجربة — في لوحة التاجر، فوق كل شيء.
 *
 * ═══ لماذا وُجد ═══
 *
 * صفحة «الاشتراك» فيها عدّاد تجربة بالفعل — لكن **التاجر لا يزور الاشتراك**.
 * يزور «منيوي» و«الطباعة». فكان بإمكان تجربته أن تنتهي وهو لا يدري، ويكتشف
 * الأمر **من زبونه** حين يمسح كوداً فيجد منيواً مقفلاً. اكتشافُ التاجر لعطلٍ
 * من زبونه أسوأ من العطل نفسه.
 *
 * وفي القاعدة اليوم: **ثمانية عشر اشتراكاً كلّها تنتهي في اليوم نفسه**، فهذا
 * ليس احتمالاً نظرياً بل موعد.
 *
 * ═══ صفر استعلام جديد ═══
 *
 * `ent.trial` و`ent.trialDaysLeft` محسوبتان أصلاً في `lib/entitlements.ts`
 * ويحملهما سياق اللوحة. الشريط قراءة محضة.
 */
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Icon } from "@/lib/icons";
import type { Entitlements } from "@/lib/entitlements";

/** يبدأ التنبيه قبل أسبوع — وقتٌ يكفي لقرار دفع، ولا يزعج طوال التجربة. */
const WARN_AT = 7;
/** ويشتدّ في اليومين الأخيرين. */
const URGENT_AT = 2;

export function TrialBar({ ent }: { ent: Entitlements }) {
  // ⚠️ `loading` تُستثنى: لا نُنذر تاجراً قبل أن تُحسم حالة اشتراكه أصلاً.
  if (ent.loading || !ent.trial) return null;
  const days = ent.trialDaysLeft;
  if (days > WARN_AT) return null;

  const urgent = days <= URGENT_AT;
  const title =
    days <= 0
      ? "انتهت تجربتك المجانية"
      : days === 1
        ? "تجربتك تنتهي اليوم"
        : `باقٍ ${days} أيام من تجربتك المجانية`;

  return (
    <div
      // `status` لا `alert`: الأخير يقاطع قارئ الشاشة فوراً، وهذا إشعارٌ
      // مهمّ لا طارئ.
      role="status"
      className={cn(
        "mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border px-4 py-3",
        urgent ? "border-bad/40 bg-bad/[.06]" : "border-line-gold bg-gold/[.06]"
      )}
    >
      <Icon
        name="clock"
        size={18}
        className={cn("shrink-0", urgent ? "text-bad" : "text-gold")}
      />
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-black text-ink">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-dim">
          {days <= 0
            ? "اشترك ليعود منيوك متاحاً لزبائنك — أطباقك وصورك وبياناتك محفوظة كما هي."
            : "اشترك قبل انتهائها ليبقى منيوك متاحاً لزبائنك بلا انقطاع."}
        </p>
      </div>
      <Link
        to="/dashboard/billing"
        className={cn(
          "inline-flex min-h-11 shrink-0 items-center rounded-xl px-4 text-sm font-bold",
          urgent
            ? "bg-bad text-white hover:opacity-90"
            : "bg-gold text-on-gold hover:bg-gold2"
        )}
      >
        اشترك الآن
      </Link>
    </div>
  );
}

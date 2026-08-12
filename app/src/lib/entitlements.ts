/**
 * صلاحيات المستخدم.
 *
 * ═══ ما تغيّر، ولماذا ═══
 *
 * كانت القاعدة: كل المزايا مفتوحة للجميع، وما يتوقّف بلا اشتراك هو **نشر**
 * المنيو. أي أن المقابل كان **ظهور** التاجر أمام زبائنه.
 *
 * وهذا انقلب. السوق فيه منيو QR مجاني بأصناف غير محدودة وثنائي اللغة، فجدارٌ
 * على المنيو نفسه لا يحمي إيراداً بل يمنع الدخول. والأخطر أن إطفاء منيو مطعم
 * عامل فعلٌ رهينة تنتشر سمعته.
 *
 * فصار المقابل **الأدوات لا الظهور**: من لا اشتراك له يبقى منيوه يعمل للأبد
 * (`FREE_LIMITS`)، ويفقد السلّة والدفع والولاء والكاشير والتحليلات وبطاقة
 * الطباعة والـAPI.
 *
 * ⚠️ وعليه فقفل النشر (`enforce_publishing`) **لا يُشغَّل أبداً** — لم يعد
 * احتياطاً مؤقّتاً بل صار تشغيله نقضاً لنموذج العمل نفسه.
 */
import { getActiveSubscription } from "./data";
import { FREE_LIMITS, PLAN, type PlanLimits } from "./plans";

export type Entitlements = PlanLimits & {
  planId: string;
  planName: string;
  /** هل يملك المستخدم اشتراكاً نشطاً غير منتهٍ؟ */
  active: boolean;
  /** الاشتراك النشط هو تجربة مجانية لا اشتراك مدفوع. */
  trial: boolean;
  /** الأيام المتبقية في التجربة (0 إن لم تكن تجربة). */
  trialDaysLeft: number;
  /**
   * الصلاحيات لم تُحسم بعد (الطلب جارٍ).
   * بدونها كان التاجر يرى «بدون اشتراك» لحظةً في كل تحميل.
   */
  loading: boolean;
};

/** اسم الطبقة المجانية كما يراه التاجر — مصدر واحد. */
export const FREE_PLAN_NAME = "المنيو المجاني";

/**
 * الحالة الابتدائية **مجانية لا مدفوعة**.
 *
 * كانت تنسخ `PLAN.limits` (كل المزايا)، فيرى التاجر أثناء التحميل أدواتٍ
 * مفتوحة ثم تُغلق أمامه حين تُحسم الصلاحيات — وميضُ صلاحية أسوأ من انتظار.
 * والاتجاه الصحيح للسقوط هنا هو الأقلّ: لا نمنح ما لم يُدفع ثمنه.
 */
export const DEFAULT_ENTITLEMENTS: Entitlements = {
  ...FREE_LIMITS,
  planId: "free",
  planName: FREE_PLAN_NAME,
  active: false,
  trial: false,
  trialDaysLeft: 0,
  loading: true,
};

/**
 * نص حالة الاشتراك كما يُعرض للتاجر — مصدر واحد فلا تختلف الشارات بين الصفحات.
 */
export function planLabel(ent: Entitlements): string {
  if (ent.loading) return "…";
  // «بدون اشتراك» كانت تصف نقصاً؛ والمجاني الآن **طبقة قائمة بذاتها** ومنيوه
  // يعمل للأبد. الفرق ليس تجميلاً: التاجر يقرأ الأولى إنذاراً والثانية حالة.
  if (!ent.active) return FREE_PLAN_NAME;
  if (ent.trial) {
    return ent.trialDaysLeft <= 1
      ? "التجربة تنتهي اليوم"
      : `تجربة مجانية · ${ent.trialDaysLeft} يوماً`;
  }
  return `باقة ${ent.planName}`;
}

/** أيام كاملة متبقية حتى `endDate` (٠ إن مضى الموعد). */
function daysLeft(endDate: string | null): number {
  if (!endDate) return 0;
  const ms = new Date(endDate).getTime() - Date.now();
  return ms > 0 ? Math.ceil(ms / 86400_000) : 0;
}

export async function fetchEntitlements(userId: string): Promise<Entitlements> {
  let active = false;
  let trial = false;
  let trialDaysLeft = 0;
  try {
    const sub = await getActiveSubscription(userId);
    active = !!sub;
    // التجربة تفتح كل شيء كالاشتراك المدفوع؛ الفرق في ما نعرضه للتاجر فقط.
    trial = sub?.plan_id === "trial";
    trialDaysLeft = trial ? daysLeft(sub?.end_date ?? null) : 0;
  } catch {
    /* فشل القراءة ⇒ نفترض عدم الاشتراك (لا نمنح نشراً بالخطأ) */
  }
  // الاشتراك النشط (أو التجربة) يفتح كل شيء؛ وبدونه تبقى الطبقة المجانية.
  return {
    ...(active ? PLAN.limits : FREE_LIMITS),
    planId: active ? PLAN.id : "free",
    planName: active ? PLAN.name : FREE_PLAN_NAME,
    active,
    trial,
    trialDaysLeft,
    loading: false,
  };
}

/**
 * جدول الأسعار الموثوق — **من جهة الخادم**.
 *
 * ⚠️ لا يُقبل أي مبلغ قادم من المتصفح إطلاقاً. العميل يرسل `plan_id` و`cycle`
 * فقط، والمبلغ يُشتقّ هنا. هذا ما يمنع تكرار خلل النسخة القديمة الذي كان يعرض
 * سعراً ويخصم آخر.
 *
 * ═══ يجب أن يبقى مطابقاً لـ`app/src/lib/plans.ts` ═══
 *
 * وقد كان **غير مطابق**: هنا `standard` اسمها «الأساسية»، وفي الواجهة باقة
 * واحدة اسمها «كلاود منيو». فكانت كل دفعة تُسجَّل في `revenue_log.plan_name`
 * باسم باقة **لا وجود لها في المنتج** — وهو ما يحذّر منه §4 في `CLAUDE.md`.
 *
 * وحُذفت `premium`: الواجهة لم تعد تبيعها منذ توحيد الباقات، لكنها بقيت هنا
 * **قابلة للدفع** — فطلب مصنوع بـ`plan_id:"premium"` كان يُنشئ فاتورة ١٩٩ ر.س
 * لباقة غير موجودة. سطحٌ ميّت يُغلق لا يُترك.
 */

export type Cycle = "monthly" | "yearly";

/**
 * ⚠️ السنوي **رقم صريح لا مشتقّ**.
 *
 * كان `monthly * 11`، فكان تغييرُ الشهري يحرّك السنوي بلا قرار. والسنوي الآن
 * قرار تسعير مستقلّ (٥٩٩ ≈ ٥٠ شهرياً) — ولو بقي مشتقّاً لأعطى ٦٤٩، أي أن
 * الخادم كان **سيحصّل مبلغاً غير الذي عُرض على التاجر**.
 *
 * ⚠️ والشهري صار **٩٩** في ٢٣ أغسطس ٢٠٢٦ (كان ٥٩). هذا الملفّ مصدر المبلغ
 * المحصَّل فعلاً، فأي تعديل هنا يجب أن يقابله مثله في `app/src/lib/plans.ts`
 * في **نفس الدفعة** — والسنوي لم يتحرّك معه عمداً.
 */
export const PLAN_CATALOG = {
  standard: { name: "كلاود منيو", monthly: 99, yearly: 599 },
} as const;

export type PlanId = keyof typeof PLAN_CATALOG;

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && value in PLAN_CATALOG;
}

export function isCycle(value: unknown): value is Cycle {
  return value === "monthly" || value === "yearly";
}

export function planName(planId: PlanId): string {
  return PLAN_CATALOG[planId].name;
}

/** السعر القائم (قبل أي خصم) بالريال السعودي. */
export function listPrice(planId: PlanId, cycle: Cycle): number {
  const plan = PLAN_CATALOG[planId];
  return cycle === "yearly" ? plan.yearly : plan.monthly;
}

/** مدة الاشتراك بالأيام. */
export function cycleDays(cycle: Cycle): number {
  return cycle === "yearly" ? 365 : 30;
}

/* ── ترميز رقم الطلب ──────────────────────────────────────────────────
 * PayLink تُعيد `merchantOrderNumber` كما أرسلناه، ونستخدمه لربط الدفعة
 * بالمستخدم والباقة دون الحاجة لجدول طلبات جديد. الترميز ليس سرّاً ولا
 * يُعتمد عليه وحده: الويبهوك يتحقق من الفاتورة عبر PayLink بمفاتيحنا،
 * ويقارن رقم الطلب المخزَّن في الفاتورة نفسها بما وصله.
 */

const SEP = "~";
const PREFIX = "cm";

/** أكواد الخصم تُقلَّم لحروف وأرقام فقط حتى لا تكسر الفاصل. */
export function sanitizePromo(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 24);
}

export function buildOrderNumber(
  userId: string,
  planId: PlanId,
  cycle: Cycle,
  promoCode?: string | null
): string {
  const parts = [PREFIX, userId, planId, cycle, Date.now().toString(36)];
  const promo = promoCode ? sanitizePromo(promoCode) : "";
  if (promo) parts.push(promo);
  return parts.join(SEP);
}

export type ParsedOrder = {
  userId: string;
  planId: PlanId;
  cycle: Cycle;
  promoCode: string | null;
};

/**
 * ⚠️ **الطلبات القديمة تبقى مقروءة.** أي فاتورة أُنشئت قبل حذف `premium`
 * وما زالت معلّقة يجب أن يُفعَّل اشتراكها عند الدفع، وإلا ضاع مال دُفع فعلاً.
 * فالتحليل يقبل `premium` تاريخياً ويردّها `standard` — بينما `isPlanId`
 * (التي تحرس **إنشاء** فاتورة جديدة) لم تعد تقبلها.
 */
const LEGACY_PLAN_IDS = new Set(["basic", "premium"]);

export function parseOrderNumber(orderNumber: string): ParsedOrder | null {
  const parts = (orderNumber ?? "").split(SEP);
  if (parts.length < 5 || parts.length > 6 || parts[0] !== PREFIX) return null;
  const [, userId, rawPlan, cycle] = parts;
  if (!userId || !isCycle(cycle)) return null;
  const planId: PlanId | null = isPlanId(rawPlan)
    ? rawPlan
    : LEGACY_PLAN_IDS.has(rawPlan)
      ? "standard"
      : null;
  if (!planId) return null;
  return { userId, planId, cycle, promoCode: parts[5] || null };
}

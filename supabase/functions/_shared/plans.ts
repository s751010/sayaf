/**
 * جدول الأسعار الموثوق — **من جهة الخادم**.
 *
 * ⚠️ لا يُقبل أي مبلغ قادم من المتصفح إطلاقاً. العميل يرسل `plan_id` و`cycle`
 * فقط، والمبلغ يُشتقّ هنا. هذا ما يمنع تكرار خلل النسخة القديمة الذي كان يعرض
 * سعراً ويخصم آخر.
 *
 * يجب أن يبقى مطابقاً لـ `web/src/lib/plans.ts` و`app/src/lib/plans.ts`
 * (شهري × 11 = سنوي، أي شهر مجاني).
 */

export type Cycle = "monthly" | "yearly";

const YEARLY_MONTHS = 11;

export const PLAN_CATALOG = {
  standard: { name: "الأساسية", monthly: 99 },
  premium: { name: "الاحترافية", monthly: 199 },
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
  const monthly = PLAN_CATALOG[planId].monthly;
  return cycle === "yearly" ? monthly * YEARLY_MONTHS : monthly;
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

export function parseOrderNumber(orderNumber: string): ParsedOrder | null {
  const parts = (orderNumber ?? "").split(SEP);
  if (parts.length < 5 || parts.length > 6 || parts[0] !== PREFIX) return null;
  const [, userId, planId, cycle] = parts;
  if (!userId || !isPlanId(planId) || !isCycle(cycle)) return null;
  return { userId, planId, cycle, promoCode: parts[5] || null };
}

/**
 * مسار الطلب عند التاجر — **جدولٌ واحد لشاشتين**.
 *
 * كان في `Orders.tsx` وحدها؛ وشاشة الكاشير (`Kitchen.tsx`) تنقل الطلب نفسه
 * بالأزرار نفسها. ونسختان مكتوبتان باليد لحكمٍ واحد تتباعدان (الدرس ٧ و٨):
 * زرٌّ يقول «جاهز» هنا و«انتهى» هناك، والزبون يرى واحداً منهما.
 *
 * ═══ المعنى نفسه عند الزبون ═══
 *
 * صفحة المتابعة (`OrderStatus.tsx`) تعرض المراحل `new ← preparing ← ready ←
 * picked_up` بأسماء «وصل المطعم · قيد التحضير · جاهز للاستلام · تم الاستلام».
 * وأزرار التاجر هنا هي **أفعال** تلك المراحل نفسها بترتيبها — فحين يضغط
 * الكاشير «جاهز للاستلام» يقرأ الزبون «طلبك جاهز! توجّه للكاشير». والفحص
 * `order-alerts.test.ts` يقرأ مراحل الزبون من ملفّها ويطابقها بهذا الجدول.
 */
import type { MerchantOrder, OrderStatus } from "./data";

/** الحالة التالية وزرّها. `null` = الطلب انتهى. */
export const NEXT: Record<string, { to: OrderStatus; label: string } | null> = {
  new: { to: "preparing", label: "ابدأ التحضير" },
  preparing: { to: "ready", label: "جاهز للاستلام" },
  ready: { to: "picked_up", label: "سلّمته للزبون" },
  picked_up: null,
  cancelled: null,
};

export const LABEL: Record<
  string,
  { text: string; variant: "gold" | "green" | "red" | "neutral" }
> = {
  new: { text: "جديد", variant: "gold" },
  preparing: { text: "قيد التحضير", variant: "gold" },
  ready: { text: "جاهز للاستلام", variant: "green" },
  picked_up: { text: "سُلّم", variant: "neutral" },
  cancelled: { text: "ملغي", variant: "red" },
};

/** ما زال على الكاونتر — بترتيب المسار. */
export const OPEN: OrderStatus[] = ["new", "preparing", "ready"];

/** المسار من أوّله بالأزرار وحدها — ما يطابقه الفحص بمراحل الزبون. */
export function flowFrom(start: OrderStatus = "new"): OrderStatus[] {
  const out: OrderStatus[] = [start];
  let step = NEXT[start];
  while (step && out.length < 10) {
    out.push(step.to);
    step = NEXT[step.to];
  }
  return out;
}

/** هل تجاوز الطلب وعدَه للزبون؟ */
export function isLate(order: Pick<MerchantOrder, "ready_eta" | "status">, now = Date.now()): boolean {
  if (!order.ready_eta || order.status === "ready") return false;
  return new Date(order.ready_eta).getTime() < now;
}

export function since(iso: string, now = Date.now()): string {
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "الآن";
  if (mins < 60) return `قبل ${mins} د`;
  const hours = Math.round(mins / 60);
  return `قبل ${hours} س`;
}

/**
 * ساعة الطلب بتوقيت الرياض — `HH:MM` بأرقام لاتينية (الدرس ١٣).
 *
 * التوقيت صريح لا من الجهاز: لوح الكاونتر قد يُضبط على منطقة أخرى، والزبون
 * يقول «طلبت الساعة ٨:١٠» بتوقيته هو.
 */
export function clockTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Riyadh",
  }).format(d);
}

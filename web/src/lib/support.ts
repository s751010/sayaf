/**
 * تصنيفات تذاكر الدعم.
 *
 * ⚠️ تعيش هنا لا في `app/dashboard/support/actions.ts`: ملفات `"use server"`
 * لا يجوز أن تُصدِّر إلا دوالّ async. حين كانت هذه المصفوفة تُصدَّر من هناك،
 * حوّلها المُجمِّع إلى مرجع server action، فصار `TICKET_CATEGORIES.map` على
 * العميل «ليس دالة» وسقطت صفحة الدعم كاملة بخطأ 500.
 */
export const TICKET_CATEGORIES = [
  { id: "technical", label: "مشكلة تقنية" },
  { id: "billing", label: "الفوترة والاشتراك" },
  { id: "feature", label: "اقتراح ميزة" },
  { id: "other", label: "أخرى" },
] as const;

export type TicketCategoryId = (typeof TICKET_CATEGORIES)[number]["id"];

/**
 * متى يُفتح الطلب — **شرطان لا شرط**.
 *
 * ═══ العطل ═══
 *
 * الشريط كان يقرأ `accepting_orders` وحده، فمطعمٌ ترويسته تقول «يفتح ١٣:٠٠»
 * يعرض تحتها «ادفع واطلب» فوق وعدٍ نصّه «يجهز خلال ٢٠ دقيقة». أي أن زبوناً
 * في الثالثة فجراً يدفع لمطعم لا أحد فيه.
 *
 * ⚠️ **والفشل مفتوح**: أكثر المطاعم لم تضبط ساعاتها (`working_hours` نصّ حرّ
 * وبعضه غير مقروء). فإغلاق الطلب عند الشكّ كان يُطفئ الميزة لمن لم يملأ
 * حقلاً — وهو ضرر أوسع من الذي نتّقيه.
 */
import { describe, expect, it } from "vitest";
import { openState, parseWeek } from "@/lib/hours";

/** نفس تركيب `MenuPage`: مفتاح التاجر **و** ساعاته، مع سقوط آمن. */
function ordersOpen(accepting: boolean, hours: string | null, now: Date): boolean {
  const week = parseWeek(hours);
  const live = week ? openState(week, false, now) : null;
  return accepting && (live?.open ?? true);
}

const week = (from: string, to: string) =>
  JSON.stringify(
    Object.fromEntries(
      ["sat", "sun", "mon", "tue", "wed", "thu", "fri"].map((d) => [d, { open: true, from, to }])
    )
  );

/** ٢٠٢٦-٠٨-٢١ الساعة ٠٣:٠٠ بتوقيت الرياض = ٠٠:٠٠ UTC. */
const NIGHT = new Date("2026-08-21T00:00:00Z");
/** ١٥:٠٠ بتوقيت الرياض. */
const NOON = new Date("2026-08-21T12:00:00Z");

describe("فتح الطلب", () => {
  it("مغلق بالساعات ⇒ لا طلب ولو كان المفتاح مرفوعاً", () => {
    expect(ordersOpen(true, week("13:00", "23:00"), NIGHT)).toBe(false);
  });

  it("داخل الساعات ⇒ طلب", () => {
    expect(ordersOpen(true, week("13:00", "23:00"), NOON)).toBe(true);
  });

  it("مفتاح التاجر يغلب ولو كان الوقت مناسباً", () => {
    expect(ordersOpen(false, week("13:00", "23:00"), NOON)).toBe(false);
  });

  it("⚠️ بلا ساعات ⇒ **مفتوح**: لا نُطفئ الميزة لمن لم يملأ حقلاً", () => {
    expect(ordersOpen(true, null, NIGHT)).toBe(true);
    expect(ordersOpen(true, "", NIGHT)).toBe(true);
  });

  it("⚠️ ساعات غير مقروءة ⇒ **مفتوح** — النصّ الحرّ شائع في الإنتاج", () => {
    expect(ordersOpen(true, "من العصر إلى الفجر", NIGHT)).toBe(true);
    expect(ordersOpen(true, "{ليس JSON", NIGHT)).toBe(true);
  });

  it("فترة تعبر منتصف الليل تبقى مفتوحة بعده", () => {
    // ١٧:٠٠ → ٠٤:٠٠، والوقت ٠٣:٠٠ رياض.
    expect(ordersOpen(true, week("17:00", "04:00"), NIGHT)).toBe(true);
  });
});

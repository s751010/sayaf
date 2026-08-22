/**
 * أشكال معرّفات بكسلات التتبّع — `app/src/lib/pixels.ts`.
 *
 * ═══ لماذا فحصٌ لشكل نصّ ═══
 *
 * لأن المعرّف يدخل **رابط سكربت يُحمَّل على نطاق المنصّة**. و`GTM-` تحديداً
 * تجعل قوقل تُشغّل ما وضعه صاحب الحاوية فيها — جافاسكربت حرّة على صفحةٍ فيها
 * جلسات تجّار في `localStorage`. فهذا الفحص يحرس حدّاً أمنياً لا شكلاً جميلاً.
 *
 * ⚠️ والقيد الحقيقي في القاعدة (`restaurants_ga_id_shape`) لأن API التاجر
 * (§14) يتجاوز الواجهة. الاختبار هنا يحرس **تطابق** الطبقتين: تباعدهما يعني
 * معرّفاً يُحفظ ولا يُحقن أو العكس.
 */
import { describe, expect, it } from "vitest";
import { validPixelId } from "@/lib/pixels";

describe("GTM — الشكل الذي وُجد الفحص من أجله", () => {
  for (const id of ["GTM-ABCD", "GTM-5X7QK2", "gtm-abcd", " GTM-ABCD "]) {
    it(`يُرفض: ${id}`, () => expect(validPixelId("ga", id)).toBeNull());
  }
});

describe("ga — يُقبل معرّف القياس/الإعلان وحده", () => {
  for (const id of ["G-ABC123", "G-1A2B3C4D5E", "AW-9876543", "GT-XYZ99"]) {
    it(`يُقبل: ${id}`, () => expect(validPixelId("ga", id)).toBe(id));
  }
  for (const id of ["", "  ", "G-abc", "G-AB", "X-ABC123", "G-ABC123<script>", "G-ABC 123"]) {
    it(`يُرفض: ${id || "(فارغ)"}`, () => expect(validPixelId("ga", id)).toBeNull());
  }
  it("يُرفض العدم", () => expect(validPixelId("ga", null)).toBeNull());
  it("يقصّ المسافات قبل الفحص", () => expect(validPixelId("ga", "  G-ABC123  ")).toBe("G-ABC123"));
});

describe("meta — أرقام فقط", () => {
  for (const id of ["123456", "1234567890123456"]) {
    it(`يُقبل: ${id}`, () => expect(validPixelId("meta", id)).toBe(id));
  }
  for (const id of ["12345", "abc123", "123456; alert(1)", "12 3456"]) {
    it(`يُرفض: ${id}`, () => expect(validPixelId("meta", id)).toBeNull());
  }
});

describe("snap — صيغة UUID", () => {
  const ok = "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d";
  it(`يُقبل: ${ok}`, () => expect(validPixelId("snap", ok)).toBe(ok));
  it("يُقبل بحروف كبيرة", () =>
    expect(validPixelId("snap", ok.toUpperCase())).toBe(ok.toUpperCase()));
  for (const id of ["1a2b3c4d", "not-a-uuid", `${ok}x`]) {
    it(`يُرفض: ${id}`, () => expect(validPixelId("snap", id)).toBeNull());
  }
});

describe("تكافؤ الطبقتين: الواجهة ⇄ قيود القاعدة", () => {
  /**
   * التعابير مكتوبة مرّتين — هنا وفي `20260822_security_round_2*.sql`. ونصّها
   * في الهجرة يُقرأ من ملفّها لا يُعاد كتابته، فأي تعديل في أحدهما يُسقط CI.
   */
  it("تعبير `ga` في الهجرة هو نفسه في الشيفرة", async () => {
    const { readFileSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const sql = readFileSync(
      fileURLToPath(new URL("../../supabase/migrations/20260822_security_round_2.sql", import.meta.url)),
      "utf8",
    );
    const src = readFileSync(
      fileURLToPath(new URL("../src/lib/pixels.ts", import.meta.url)),
      "utf8",
    );
    expect(sql).toContain("^(G|AW|GT)-[A-Z0-9]{4,20}$");
    expect(src).toContain("^(G|AW|GT)-[A-Z0-9]{4,20}$");
    expect(sql).toContain("^[0-9]{6,20}$");
    expect(src).toContain("^[0-9]{6,20}$");
  });
});

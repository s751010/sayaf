/**
 * واجهة API لا تُخرج نصّ Postgres (مراجعة الأمن ٢٠٢٦/١١/٠٩، البند ١٢).
 * النصّ يحمل أسماء القيود والأعمدة؛ والرمز وحده يكفي ليصلح المطوّر طلبه.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { publicDbError } from "../../supabase/functions/_shared/db-error";

describe("publicDbError", () => {
  it.each(["23505", "23503", "23502", "23514", "22P02", "22001", "22003", "22007", "23P01"])(
    "%s ⇒ ٤٠٠ برسالة عربية ثابتة",
    (code) => {
      const out = publicDbError(code);
      expect(out.status).toBe(400);
      expect(out.message).toMatch(/[؀-ۿ]/);
      expect(out.message).not.toMatch(/[a-z_]{4,}/i);
    }
  );

  it("ما عدا ‎22 و23 ⇒ ٥٠٠ عامّة", () => {
    for (const code of ["42501", "42703", "PGRST116", "", undefined]) {
      expect(publicDbError(code)).toEqual({ status: 500, message: "تعذّر تنفيذ الطلب." });
    }
  });

  it("‏`api` لا تمرّر `e.message` في ردّ — تمرّ بـ`publicDbError`", () => {
    const src = readFileSync(
      new URL("../../supabase/functions/api/index.ts", import.meta.url),
      "utf8"
    );
    const body = src.slice(src.indexOf("const dbErr"), src.indexOf("const RATE_LIMIT"));
    expect(body).toContain("publicDbError(e.code)");
    expect(body).not.toMatch(/err\(\s*e\.message/);
  });
});

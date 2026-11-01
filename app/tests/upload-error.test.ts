import { describe, expect, it } from "vitest";
import { uploadErrorMessage } from "../src/lib/image";

/** لا رسالة إنجليزية تصل التاجر من رافع الصور — مهما كان شكل الخطأ. */
describe("uploadErrorMessage", () => {
  const arabic = /[؀-ۿ]/;
  const err = (status: number, message: string) => Object.assign(new Error(message), { status });

  it("الجلسة المنتهية تُسمّى", () => {
    expect(uploadErrorMessage(err(401, "jwt expired"))).toContain("انتهت الجلسة");
  });

  it("الحجم يُسمّى", () => {
    expect(uploadErrorMessage(err(413, "upload 413"))).toContain("كبيرة");
  });

  it("انقطاع الشبكة يُسمّى", () => {
    expect(uploadErrorMessage(new TypeError("Failed to fetch"))).toContain("انقطع الاتصال");
  });

  it("أي خطأ آخر: جملة عربية ثابتة لا نصّ الخادم", () => {
    for (const e of [err(500, "upload 500"), new Error("Payload too large"), "x", null, undefined]) {
      const msg = uploadErrorMessage(e);
      expect(msg).toMatch(arabic);
      expect(msg).not.toMatch(/upload|Payload|fetch/i);
    }
  });
});

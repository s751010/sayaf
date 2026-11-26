/**
 * بعد النشر: قطعةٌ قديمة ⇐ تحديثٌ واحد (`lib/chunkReload.ts`). الرسالة الأولى
 * أدناه منسوخة حرفياً من `client_errors` الحيّ.
 */
import { describe, expect, it } from "vitest";
import { isChunkLoadError, mayReload } from "../src/lib/chunkReload";

describe("تمييز قطعةٍ قديمة", () => {
  it("يعرف رسائل المتصفّحات الثلاثة وما سجّلناه فعلاً", () => {
    for (const m of [
      "'text/html' is not a valid JavaScript MIME type.",
      "Failed to fetch dynamically imported module: https://x/assets/Dishes-abc.js",
      "error loading dynamically imported module",
      "Importing a module script failed.",
      "Unable to preload CSS for /assets/a.css",
    ]) {
      expect(isChunkLoadError(new Error(m))).toBe(true);
    }
  });

  it("لا يلتقط أعطال الشيفرة العادية", () => {
    for (const m of ["Cannot read properties of undefined", "Minified React error #310", ""]) {
      expect(isChunkLoadError(new Error(m))).toBe(false);
    }
    expect(isChunkLoadError(null)).toBe(false);
  });
});

describe("حارس الحلقة", () => {
  it("مرّة كل دقيقة على الأكثر", () => {
    const now = 1_000_000;
    expect(mayReload(null, now)).toBe(true);
    expect(mayReload(String(now - 30_000), now)).toBe(false);
    expect(mayReload(String(now - 61_000), now)).toBe(true);
    expect(mayReload("garbage", now)).toBe(true);
  });
});

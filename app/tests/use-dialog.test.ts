/**
 * سلوك النوافذ في مكانٍ واحد (`lib/useDialog.ts` — تدقيق ٢٠٢٦/١١/٠٩، البندان ١ و٢).
 *
 * جذر هروب التركيز من نافذة الطبق كان **التكرار**: ثلاث نسخ من «Esc» وقفل
 * التمرير، واحدة منها تحبس «Tab». فالفحص يحرس أن النوافذ الثلاث تنادي الخطّاف
 * نفسه ولا تعيد كتابة مستمع `keydown` بيدها — والمتصفّح يقيس الحبس في e2e.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { hasDialog, withDialog } from "@/lib/useDialog";

const src = (p: string) => readFileSync(resolve(__dirname, "../src", p), "utf8");

describe("حالة السجلّ", () => {
  it("تحفظ حالة الراوتر كما هي وتضيف النافذة", () => {
    const s = withDialog({ idx: 3, key: "k", usr: { a: 1 } }, "d1");
    expect(s).toMatchObject({ idx: 3, key: "k", usr: { a: 1 } });
    expect(hasDialog(s, "d1")).toBe(true);
  });

  it("نافذة فوق نافذة: انسحاب الداخلية يُبقي الخارجية", () => {
    const outer = withDialog(null, "a");
    const inner = withDialog(outer, "b");
    expect(hasDialog(inner, "a") && hasDialog(inner, "b")).toBe(true);
    // بعد «رجوع» نعود إلى `outer`: «b» غابت و«a» باقية.
    expect(hasDialog(outer, "b")).toBe(false);
    expect(hasDialog(outer, "a")).toBe(true);
  });

  it("لا تكرّر النافذة نفسها — StrictMode يركّب مرّتين", () => {
    const s = withDialog(withDialog(null, "a"), "a");
    expect(s.cmDialogs).toEqual(["a"]);
  });

  it("حالةٌ فارغة أو غريبة لا تكسر شيئاً", () => {
    expect(hasDialog(null, "a")).toBe(false);
    expect(hasDialog(undefined, "a")).toBe(false);
    expect(hasDialog({ cmDialogs: "x" }, "a")).toBe(false);
  });
});

describe("النوافذ الثلاث تنادي الخطّاف نفسه", () => {
  for (const file of ["components/menu/DishModal.tsx", "components/menu/chrome.tsx", "components/ui.tsx"]) {
    it(file, () => {
      const s = src(file);
      expect(s).toMatch(/useDialog\(/);
      // لا مستمع «Esc» مكتوبٌ بيد بجانب الخطّاف — هكذا ضاع الحبس أوّل مرّة.
      expect(s).not.toMatch(/addEventListener\("keydown"/);
    });
  }
});

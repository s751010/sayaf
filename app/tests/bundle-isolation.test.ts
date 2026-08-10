/**
 * حدود الحزم — `motion` لا تتسرّب إلى مسار الزبون.
 *
 * ═══ لماذا وُجد هذا الفحص ═══
 *
 * `App.tsx` أخرج `Landing` من الحزمة الرئيسية عمداً: ألفٌ وخمسمئة سطر من شيفرة
 * تسويق **ينزّلها كل زائر منيو ولا يفتحها أبداً**. وصفحة المنيو تُفتح من كود
 * QR مطبوع على طاولة مطعم، بجوّال، على بيانات — فكل كيلوبايت في الحزمة
 * الرئيسية يدفعه زبون واقفٌ ينتظر.
 *
 * ثم أُضيفت `motion` لحركة اللاندنق. استيرادها من `lib/` أو `components/ui.tsx`
 * أو `components/menu/` أو `MenuPage` يسحبها إلى الحزمة الرئيسية فوراً —
 * ويُبطل ذلك القرار **بسطر واحد لا ينتبه إليه أحد في المراجعة**.
 *
 * التعليق لا يمنع ذلك. هذا الفحص يمنعه.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SRC = fileURLToPath(new URL("../src", import.meta.url));

/** المجلّد الوحيد المسموح له باستيراد `motion` — شيفرة الهبوط الكسولة. */
const ALLOWED = join("components", "landing");

/** يلتقط `from "motion"` و`from "motion/react"` وأي مسار فرعي، بعلامتَي اقتباس. */
const MOTION_IMPORT = /\bfrom\s+["']motion(?:\/[\w./-]+)?["']/;

/** ويلتقط `import("motion/react")` الديناميكي — يسحب المكتبة كذلك. */
const MOTION_DYNAMIC = /\bimport\s*\(\s*["']motion(?:\/[\w./-]+)?["']\s*\)/;

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...sourceFiles(full));
    } else if (/\.tsx?$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe("عزل الحزمة: motion لا تدخل مسار الزبون", () => {
  const files = sourceFiles(SRC);

  it("يجد ملفّات المصدر أصلاً (حارس الحارس)", () => {
    // لو انكسر المسار لمرّ الفحص التالي على مجموعة فارغة ونجح كذباً.
    expect(files.length).toBeGreaterThan(30);
  });

  it("لا ملفّ خارج components/landing/ يستورد motion", () => {
    const offenders = files
      .filter((file) => {
        const code = readFileSync(file, "utf8");
        return MOTION_IMPORT.test(code) || MOTION_DYNAMIC.test(code);
      })
      .map((file) => relative(SRC, file))
      .filter((rel) => !rel.startsWith(ALLOWED + sep));

    expect(
      offenders,
      `استيراد motion خارج components/landing/ يسحبها إلى الحزمة الرئيسية ` +
        `التي تخدم صفحة المنيو. انقل الحركة إلى مكوّن هبوط، أو استعمل ` +
        `طبقة CSS في global.css (‏.reveal · .lift · .word-in · scroll-timeline).\n` +
        `المخالفون: ${offenders.join(" · ")}`
    ).toEqual([]);
  });

  it("MenuPage نفسها نظيفة من motion", () => {
    // فحص صريح للأهمّ، كي تسمّي رسالة الفشل الصفحة لا مجرّد مسار.
    const menuPage = readFileSync(join(SRC, "pages", "MenuPage.tsx"), "utf8");
    expect(MOTION_IMPORT.test(menuPage)).toBe(false);
    expect(MOTION_DYNAMIC.test(menuPage)).toBe(false);
  });
});

/**
 * CSP في `public/_headers` — كتلة `/*` للموقع كلّه، وكتلٌ أضيق للّوحة ولوحة
 * المؤسّس (مراجعة الأمن ٢٠٢٦/١١/٠٩، البند ٨).
 *
 * المتصفّح يفرض السياستين معاً (تقاطعهما)، فالكتلة الثانية لا تضيف إذناً —
 * لكنها تُسقط نطاقات البكسلات حيث جلسة التاجر وسرّ المؤسّس. والفحص يحرس:
 *   · أن الكتل موجودة لكلا الشكلين (`/dashboard` و`/dashboard/*`)،
 *   · وأن لا فيسبوك ولا قوقل ولا سناب فيها،
 *   · وأن ما تحتاجه اللوحة فعلاً باقٍ (Supabase · PayLink · إطار المعاينة · blob:)،
 *   · وأن كل مصدرٍ فيها موجودٌ في `/*` أصلاً — وإلا حجبه التقاطع بصمت.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const file = readFileSync(resolve(__dirname, "../public/_headers"), "utf8");

/** يقسم الملفّ إلى كتل: مسار ⇐ رؤوسه (بلا التعليقات). */
function blocks(text: string): Map<string, Map<string, string>> {
  const out = new Map<string, Map<string, string>>();
  let current: Map<string, string> | null = null;
  for (const line of text.split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    if (!/^\s/.test(line)) {
      current = new Map();
      out.set(line.trim(), current);
      continue;
    }
    const m = line.trim().match(/^([A-Za-z-]+):\s*(.+)$/);
    if (m && current) current.set(m[1], m[2]);
  }
  return out;
}

function directives(csp: string): Map<string, string[]> {
  return new Map(
    csp
      .split(";")
      .map((d) => d.trim().split(/\s+/))
      .filter((p) => p[0])
      .map(([name, ...vals]) => [name, vals])
  );
}

const all = blocks(file);
const cspOf = (path: string) => directives(all.get(path)?.get("Content-Security-Policy") ?? "");
const global = cspOf("/*");
const TRACKERS = /facebook|google|snapchat|sc-static/i;

describe("كتلة `/*`", () => {
  it("‏`frame-src 'self'` صراحةً — بطل الهبوط يضع `/demo` في إطار", () => {
    expect(global.get("frame-src")).toEqual(["'self'"]);
  });

  it("‏`Cross-Origin-Opener-Policy: same-origin`", () => {
    expect(all.get("/*")?.get("Cross-Origin-Opener-Policy")).toBe("same-origin");
  });
});

describe.each(["/dashboard", "/dashboard/*", "/founder", "/founder/*"])("كتلة %s", (path) => {
  const csp = cspOf(path);

  it("موجودة بـCSP", () => {
    expect(csp.size).toBeGreaterThan(5);
  });

  it("بلا نطاق فيسبوك ولا قوقل ولا سناب", () => {
    for (const [, vals] of csp) for (const v of vals) expect(v).not.toMatch(TRACKERS);
  });

  it("‏Supabase مسموح في `connect-src` — وإلا انطفأت اللوحة", () => {
    expect(csp.get("connect-src")).toContain("https://wxrukupcyfypnqnotmxv.supabase.co");
  });

  it("كل مصدرٍ فيها مسموحٌ في `/*` — التقاطع لا يُسقطه بصمت", () => {
    for (const [name, vals] of csp) {
      const outer = global.get(name) ?? global.get("default-src") ?? [];
      for (const v of vals) {
        if (v === "'none'") continue;
        // `img-src https:` في `/*` يغطّي أيّ نطاق https.
        const covered = outer.includes(v) || (outer.includes("https:") && v.startsWith("https://"));
        expect(covered, `${path} ${name} ${v}`).toBe(true);
      }
    }
  });

  it("‏`img-src` يقبل `blob:` و`data:` — الضغط والمعاينة والطباعة", () => {
    expect(csp.get("img-src")).toEqual(expect.arrayContaining(["'self'", "data:", "blob:"]));
  });
});

describe("ما تحتاجه لوحة التاجر فعلاً", () => {
  const dash = cspOf("/dashboard/*");
  it("‏`frame-src 'self'` — معاينة المنيو في خطوة النشر", () => {
    expect(dash.get("frame-src")).toEqual(["'self'"]);
  });
  it("‏`form-action` يقبل PayLink — الاشتراك تحويل", () => {
    expect(dash.get("form-action")).toContain("https://*.paylink.sa");
  });
  it("‏`manifest-src` يقبل `blob:`", () => {
    expect(dash.get("manifest-src")).toEqual(["'self'", "blob:"]);
  });
  it("الكتلتان متطابقتان", () => {
    expect(all.get("/dashboard")).toEqual(all.get("/dashboard/*"));
    expect(all.get("/founder")).toEqual(all.get("/founder/*"));
  });
});

describe("لوحة المؤسّس أضيق", () => {
  it("‏`frame-src 'none'` و`script-src 'self'` وحده", () => {
    const f = cspOf("/founder/*");
    expect(f.get("frame-src")).toEqual(["'none'"]);
    expect(f.get("script-src")).toEqual(["'self'"]);
  });
});

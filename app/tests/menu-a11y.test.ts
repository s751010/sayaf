/**
 * منيو الزبون: أهداف اللمس وحبس التركيز في النوافذ السفلية وبيان الشاشة الرئيسية.
 *
 * ═══ ما يحرسه ═══
 *
 * - **حبس «Tab»** (`trapStep`): من آخر عنصرٍ إلى أوّله وبالعكس، ومن النافذة
 *   نفسها إلى طرفها، ولا خروج من نافذةٍ بلا عناصر.
 * - **أهداف اللمس ≥ 44**: `m-hit` في CSS يمدّ ما يُلمس إلى 44 ولا يقصّ شكل
 *   الطابع، ومبدّل اللغة والشرائح والتبويبات تحمله — ومبدّل اللغة بلا
 *   `overflow-hidden` يقصّ امتداده. (القياس الفعلي في `e2e/menu.spec.ts`.)
 * - **البيان** (`menuManifest`): باسم المطعم ورابطه من `menuUrl`، وعناوينه
 *   مطلقة (عنوان `blob:` لا يصلح أساساً)، وأيقوناته مطابقة للملفّ الثابت،
 *   و`manifest-src` في CSP يقبل `blob:` وإلا رُفض البيان بصمت.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { trapStep } from "@/lib/focusTrap";
import { PLATFORM_ICONS, menuManifest } from "@/lib/menuManifest";
import { menuUrl } from "@/lib/menuUrl";
import { menuSkinsCss } from "./skin-css";

const src = (p: string) => readFileSync(fileURLToPath(new URL(`../${p}`, import.meta.url)), "utf8");

describe("trapStep — «Tab» لا يخرج من النافذة", () => {
  it("من الآخر إلى الأوّل، ومن الأوّل بـShift إلى الآخر", () => {
    expect(trapStep(3, 2, false)).toBe(0);
    expect(trapStep(3, 0, true)).toBe(2);
  });

  it("داخل النافذة يُترك للمتصفّح", () => {
    expect(trapStep(3, 0, false)).toBeNull();
    expect(trapStep(3, 1, false)).toBeNull();
    expect(trapStep(3, 2, true)).toBeNull();
  });

  it("من النافذة نفسها (أو خارجها) إلى طرفها", () => {
    expect(trapStep(3, -1, false)).toBe(0);
    expect(trapStep(3, -1, true)).toBe(2);
    expect(trapStep(3, 7, false)).toBe(0);
  });

  it("نافذةٌ بلا عناصر: التركيز يبقى عليها", () => {
    expect(trapStep(0, -1, false)).toBe(-1);
    expect(trapStep(0, -1, true)).toBe(-1);
  });

  it("عنصرٌ واحد: يبقى عليه في الاتجاهين", () => {
    expect(trapStep(1, 0, false)).toBe(0);
    expect(trapStep(1, 0, true)).toBe(0);
  });

  it("‏`MenuSheet` يحبس ويعيد التركيز", () => {
    const chrome = src("src/components/menu/chrome.tsx");
    const sheet = chrome.slice(chrome.indexOf("export function MenuSheet"));
    // الحبس والإعادة في خطّافٍ واحد للنوافذ كلّها (`lib/useDialog.ts`) —
    // كانت نسخةً في كل نافذة، ونسخة نافذة الطبق بلا حبس (تدقيق ٢٠٢٦/١١/٠٩).
    expect(sheet).toMatch(/useDialog\(sheetRef, onClose/);
    expect(sheet).toMatch(/tabIndex=\{-1\}/);
    const hook = src("src/lib/useDialog.ts");
    expect(hook).toMatch(/trapTab\(e, ref\.current\)/);
    expect(hook).toMatch(/prev\.focus\(/);
  });
});

describe("أهداف اللمس ≥ 44", () => {
  const css = menuSkinsCss();

  it("‏`.m-hit::after` يمتدّ إلى 44 ولا يتقلّص", () => {
    const rule = css.match(/\.m-hit::after\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(rule).toMatch(/content:\s*""/);
    expect(rule).toMatch(/position:\s*absolute/);
    expect(rule).toMatch(/inset-block:\s*min\(0px,\s*calc\(\(100% - 44px\) \/ 2\)\)/);
    expect(rule).toMatch(/inset-inline:\s*min\(0px,\s*calc\(\(100% - 44px\) \/ 2\)\)/);
    expect(css).toMatch(/\.m-hit\s*\{\s*position:\s*relative;?\s*\}/);
  });

  it("لا طابع يرسم على `::after` الشرائح أو التبويبات", () => {
    expect(css).not.toMatch(/\.m-(tab|chips)[^{,]*::after/);
  });

  it("مبدّل اللغة: ٤٤ عرضاً، و`m-hit` للارتفاع، وبلا قصّ", () => {
    const chrome = src("src/components/menu/chrome.tsx");
    const toggle = chrome.slice(chrome.indexOf("export function LangToggle"), chrome.indexOf("export function MenuSheet"));
    expect(toggle).not.toMatch(/overflow-hidden/);
    expect(toggle).toMatch(/className="m-hit min-w-11 /);
  });

  it("شرائح الترويسة والتبويبات تحمل `m-hit`، والشريط المتمرِّر يترك له مكانه", () => {
    const page = src("src/pages/MenuPage.tsx");
    expect(page).toMatch(/const pill = "m-hit /);
    expect(page).toMatch(/className="m-tab m-hit /);
    expect(page).toMatch(/-my-0\.5 [^"]*overflow-x-auto py-0\.5/);
  });
});

describe("بيان «أضف إلى الشاشة الرئيسية»", () => {
  const ORIGIN = "https://cloudsmenu.netlify.app";
  const start = menuUrl("e2e-cafe", "", ORIGIN)!;
  const m = menuManifest({ name: "  مقهى الفحص ", startUrl: start, color: "#101820", origin: ORIGIN });

  it("باسم المطعم ورابطه ولون طابعه", () => {
    expect(m.name).toBe("مقهى الفحص");
    expect(m.short_name).toBe("مقهى الفحص");
    expect(m.start_url).toBe(start);
    expect(m.id).toBe(start);
    expect(m.start_url).toMatch(/^https:\/\//);
    expect(m.theme_color).toBe("#101820");
    expect(m.background_color).toBe("#101820");
    expect(m.display).toBe("standalone");
  });

  it("اسمٌ فارغ لا يخرج بياناً بلا اسم", () => {
    expect(menuManifest({ name: " ", startUrl: start, color: "#000", origin: ORIGIN }).name).toBe("المنيو");
  });

  it("الأيقونات مطلقة ومطابقة للملفّ الثابت", () => {
    for (const i of m.icons) expect(i.src.startsWith(`${ORIGIN}/`)).toBe(true);
    const file = JSON.parse(src("public/manifest.webmanifest")) as { icons: typeof PLATFORM_ICONS };
    expect(PLATFORM_ICONS).toEqual(file.icons);
  });

  it("‏`manifest-src` يقبل `blob:` — وإلا رفض المتصفّح البيان بصمت", () => {
    const csp = src("public/_headers").match(/Content-Security-Policy:([^\n]+)/)?.[1] ?? "";
    const manifest = csp.match(/manifest-src([^;]+)/)?.[1] ?? "";
    expect(manifest.trim().split(/\s+/)).toEqual(["'self'", "blob:"]);
  });

  it("الصفحة تبني الرابط من `menuUrl` لا بيد", () => {
    const page = src("src/pages/MenuPage.tsx");
    expect(page).toMatch(/const manifestStart = manifestName \? menuUrl\(slug\) : null;/);
  });
});

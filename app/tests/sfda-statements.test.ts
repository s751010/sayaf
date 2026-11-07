/**
 * عبارتا الهيئة في ذيل المنيو — `lib/sfdaStatements.ts`.
 *
 * ═══ ما يحرسه ═══
 *
 * ١. **النصّ الرسمي حرفاً**: لائحة الملح ودليل السعرات (البند 06) — والإنجليزية
 *    حاضرة لزبون EN.
 * ٢. **الشرط**: عبارة الملح متى وُجد صنفٌ بعلامة الملح (`isHighSodium` نفسها)،
 *    و«متاحة عند الطلب» متى وُجد صنفٌ بسعرات — وتغيب بغيابهما.
 * ٣. **مصدرٌ واحد**: ملفّ التفتيش وقائمة المفتّش يقرآن النصّ والشرط من هنا،
 *    والمنيو الرقمي والمطبوع لا يحملان نسخةً بيد.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  MORE_INFO_STATEMENT,
  SALT_STATEMENT,
  needsMoreInfoStatement,
  needsSaltStatement,
  statementText,
} from "@/lib/sfdaStatements";
import { isHighSodium } from "@/lib/nutrition";
import { buildComplianceFile, type ComplianceDish } from "@/lib/complianceFile";
import { sfdaChecklist } from "@/lib/sfdaChecklist";

const src = (p: string) => readFileSync(fileURLToPath(new URL(`../src/${p}`, import.meta.url)), "utf8");

describe("النصّ الرسمي", () => {
  it("لائحة الملح: الجملتان بكلماتهما", () => {
    expect(SALT_STATEMENT.ar).toContain("الصنف يحتوي على كمية ملح أعلى من الكمية الموصى بها يوميًا");
    expect(SALT_STATEMENT.ar).toContain("يُوصى بألا يزيد استهلاك الفرد اليومي من الملح على 5 جرام (2000 ملجم صوديوم)");
  });
  it("دليل السعرات، البند 06", () => {
    expect(MORE_INFO_STATEMENT.ar).toBe("البيانات التغذوية الإضافية متاحة عند الطلب.");
  });
  it("الإنجليزية لزبون EN، والعربية لغيره", () => {
    expect(statementText(SALT_STATEMENT, true)).toMatch(/salt/i);
    expect(statementText(SALT_STATEMENT, true)).toContain("5 g");
    expect(statementText(MORE_INFO_STATEMENT, true)).toMatch(/on request/i);
    expect(statementText(MORE_INFO_STATEMENT, false)).toBe(MORE_INFO_STATEMENT.ar);
    for (const s of [SALT_STATEMENT, MORE_INFO_STATEMENT]) expect(s.en).not.toMatch(/[؀-ۿ]/);
  });
});

describe("عبارة الملح — شرطها علامة الملح نفسها", () => {
  it("يظهر: صنفٌ واحد فوق العتبة يكفي", () => {
    expect(needsSaltStatement([{ sodium_mg: 120 }, { sodium_mg: 950 }])).toBe(true);
  });
  it("لا يظهر: لا صنف عليه العلامة — ولا صوديوم مُدخَل، ولا منيو فارغ", () => {
    expect(needsSaltStatement([{ sodium_mg: 120 }, { sodium_mg: null }])).toBe(false);
    expect(needsSaltStatement([{ sodium_mg: null }, {}])).toBe(false);
    expect(needsSaltStatement([])).toBe(false);
  });
  it("العتبة من `isHighSodium` لا رقمٌ ثانٍ: على حدّها تماماً يتبعها", () => {
    for (const mg of [599, 600, 601, 1999, 2000, 2001]) {
      expect(needsSaltStatement([{ sodium_mg: mg }]), String(mg)).toBe(isHighSodium(mg));
    }
  });
});

describe("«متاحة عند الطلب» — شرطها صنفٌ بسعرات", () => {
  it("يظهر: صنفٌ بسعرات — والصفر سعراتٌ مُدخَلة", () => {
    expect(needsMoreInfoStatement([{ calories: null }, { calories: 310 }])).toBe(true);
    expect(needsMoreInfoStatement([{ calories: 0 }])).toBe(true);
  });
  it("لا يظهر: لا صنف بسعرات، أو منيو فارغ", () => {
    expect(needsMoreInfoStatement([{ calories: null }, {}])).toBe(false);
    expect(needsMoreInfoStatement([])).toBe(false);
  });
});

const ACTIVE = { id: "m1", active: true };
const dish = (id: string, extra: Partial<ComplianceDish> = {}): ComplianceDish => ({
  id,
  name: `طبق ${id}`,
  category: "رئيسية",
  menu_id: "m1",
  calories: null,
  sodium_mg: null,
  caffeine_mg: null,
  allergens: null,
  ...extra,
});

describe("ملفّ التفتيش يحمل العبارتين بشرطهما", () => {
  it("يظهران: صنفٌ بسعرات وملحٍ مرتفع", () => {
    const f = buildComplianceFile([dish("a", { calories: 640, sodium_mg: 1200 })], [ACTIVE], []);
    expect(f.statements).toContain(MORE_INFO_STATEMENT.ar);
    expect(f.statements).toContain(SALT_STATEMENT.ar);
  });
  it("لا يظهران: لا سعرات ولا علامة ملح — وما قبلهما في موضعه", () => {
    const f = buildComplianceFile([dish("a", { sodium_mg: 200, caffeine_mg: 64 })], [ACTIVE], []);
    expect(f.statements).not.toContain(MORE_INFO_STATEMENT.ar);
    expect(f.statements).not.toContain(SALT_STATEMENT.ar);
    expect(f.statements).toHaveLength(2);
  });
  it("صنفٌ في قائمةٍ مطفأة لا يُظهر عبارة الملح", () => {
    const f = buildComplianceFile([dish("a", { menu_id: "m2", sodium_mg: 1200 })], [ACTIVE, { id: "m2", active: false }], []);
    expect(f.statements).not.toContain(SALT_STATEMENT.ar);
  });
});

type D = { name: string; category: string | null; calories: number | null; sodium_mg: number | null; caffeine_mg: number | null };
const cd = (calories: number | null, sodium: number | null): D => ({
  name: "شاورما",
  category: "رئيسية",
  calories,
  sodium_mg: sodium,
  caffeine_mg: null,
});
const byId = (items: ReturnType<typeof sfdaChecklist>) => Object.fromEntries(items.map((i) => [i.id, i]));

describe("لو دخل المفتّش اليوم: بندٌ لكلّ عبارة، جاهزٌ لأن المنصّة تكتبها", () => {
  it("يظهران الآن ⇒ البندان «تلقائي» بسطر «تظهر أسفل منيوك»", () => {
    const items = byId(sfdaChecklist([cd(640, 1200)], { allergens_text: "x" }));
    expect(items.onRequest.state).toBe("auto");
    expect(items.saltNote.state).toBe("auto");
    expect(items.onRequest.detail).toContain("تظهر تلقائياً أسفل منيوك");
    expect(items.saltNote.detail).toContain("بجانب علامة الملح");
  });
  it("لا يظهران الآن ⇒ يبقيان جاهزين، والسطر يقول متى يظهران لا أنهما ظاهران", () => {
    const items = byId(sfdaChecklist([cd(null, 200)], { allergens_text: "x" }));
    expect(items.onRequest.state).toBe("auto");
    expect(items.saltNote.state).toBe("auto");
    expect(items.onRequest.detail).toContain("متى أدخلت سعرات");
    expect(items.saltNote.detail).toContain("لا صنف بعلامة الملح الآن");
    expect(items.onRequest.fix).toBeUndefined();
    expect(items.saltNote.fix).toBeUndefined();
  });
});

describe("مصدرٌ واحد — لا نسخة بيد", () => {
  const files = ["pages/MenuPage.tsx", "pages/dashboard/PrintMenu.tsx", "lib/complianceFile.ts", "lib/sfdaChecklist.ts"];
  it.each(files)("%s يقرأ من `sfdaStatements` ولا يكتب النصّ بنفسه", (p) => {
    const code = src(p);
    expect(code).toMatch(/from "(@\/lib|\.)\/sfdaStatements"/);
    expect(code).not.toContain("البيانات التغذوية الإضافية");
    expect(code).not.toContain("كمية ملح أعلى");
  });
});

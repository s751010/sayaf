/**
 * ملفّ البيانات الغذائية للتفتيش — `lib/complianceFile.ts`.
 *
 * ═══ ما يحرسه ═══
 *
 * ١. **لا حكم**: لا «ممتثل» ولا «معتمد» ولا «مطابق» في أي نصّ يُطبع — الورقة
 *    أمام مفتّش، والأرقام تقديرية يحسبها التاجر (`company/legal-risk.md`).
 *    والإقرار بأنها تقديرية راجعها التاجر حاضرٌ دائماً.
 * ٢. **الغائب يُسمّى**: «غير مُدخَل» لا فراغ ولا صفر — والصفر رقمٌ صحيح.
 * ٣. **ما يراه الزبون**: القوائم المفعّلة وحدها، والنافد اليوم داخلها.
 * ٤. **التاريخ ميلادي**: `ar-SA` وحدها هجرية.
 * ٥. **عبارات الهيئة** من ثوابت `lib/nutrition.ts` نفسها.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildComplianceFile,
  ESTIMATE_NOTE,
  NOT_ENTERED_NOTE,
  FILE_TITLE,
  fileDate,
  NOT_ENTERED,
  type ComplianceDish,
} from "@/lib/complianceFile";
import { DAILY_CAFFEINE_MAX_MG, DAILY_KCAL } from "@/lib/nutrition";

const ACTIVE = { id: "m1", active: true };
const OFF = { id: "m2", active: false };

function dish(id: string, extra: Partial<ComplianceDish> = {}): ComplianceDish {
  return {
    id,
    name: `طبق ${id}`,
    category: "رئيسية",
    menu_id: "m1",
    calories: null,
    sodium_mg: null,
    caffeine_mg: null,
    allergens: null,
    ...extra,
  };
}

/** كلّ نصٍّ تطبعه الورقة من هذا الملفّ — للفحص اللفظي. */
function printedText(f: ReturnType<typeof buildComplianceFile>): string {
  return [
    FILE_TITLE,
    ESTIMATE_NOTE,
    ...f.statements,
    ...f.sections.flatMap((s) => [s.name, ...s.rows.flatMap((r) => Object.values(r).map(String))]),
  ].join("\n");
}

describe("لا حكم على الأطباق — والإقرار حاضر", () => {
  const f = buildComplianceFile(
    [dish("a", { calories: 300, sodium_mg: 400 }), dish("b")],
    [ACTIVE],
    []
  );
  const text = printedText(f);

  it.each(["ممتثل", "امتثال", "معتمد", "اعتماد", "مطابق", "مُعتمد", "موافق عليه", "compliant", "approved", "certified"])(
    "لا «%s» في نصّ الورقة",
    (w) => {
      expect(text.toLowerCase()).not.toContain(w.toLowerCase());
    }
  );

  it("الإقرار يقول إنها تقديرية، والمراجعة يُقرّ بها الموقّع لا نحن عنه", () => {
    expect(ESTIMATE_NOTE).toContain("تقديرية");
    expect(ESTIMATE_NOTE).toContain("على المنشأة");
    expect(ESTIMATE_NOTE).toContain("يُقرّ بمراجعتها الموقّع");
    // مراجعة الأمن: «وراجعها» كانت تشهد نيابةً عن التاجر بما لا نعرفه.
    expect(ESTIMATE_NOTE).not.toContain("وراجعها");
    expect(NOT_ENTERED_NOTE).toContain("ليس معناها صفراً");
    expect(NOT_ENTERED_NOTE).toContain("مسبّبات الحساسية");
  });

  it("اسم ملفّ PDF المقترح بلا «امتثال» ولا اسم المنصّة", () => {
    const page = readFileSync(
      fileURLToPath(new URL("../src/pages/dashboard/ComplianceFile.tsx", import.meta.url)),
      "utf8",
    );
    const title = page.match(/document\.title = ([^;]+);/)?.[1] ?? "";
    expect(title).toContain("FILE_TITLE");
    expect(title).not.toMatch(/امتثال|كلاود/);
  });

  it("الصفحة نفسها تطبع الإقرار والعنوان من المصدر لا نسخةً بيد", () => {
    const page = readFileSync(
      fileURLToPath(new URL("../src/pages/dashboard/ComplianceFile.tsx", import.meta.url)),
      "utf8"
    );
    expect(page).toContain("{ESTIMATE_NOTE}");
    expect(page).toContain("{FILE_TITLE}");
    // ولا كلمة حكم في نصّ JSX المطبوع (التعليقات تُستثنى).
    const stripped = page.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    const sheet = stripped.slice(stripped.indexOf("print-root"));
    // يثبت أولاً أنه وجد الورقة: الإقرار داخل ما يُفحص.
    expect(sheet).toContain("{ESTIMATE_NOTE}");
    for (const w of ["ممتثل", "امتثال", "معتمد", "مطابق"]) expect(sheet).not.toContain(w);
  });
});

describe("الغائب يُسمّى «غير مُدخَل»", () => {
  const f = buildComplianceFile(
    [
      dish("a"),
      dish("b", { calories: 0, sodium_mg: 0, caffeine_mg: 0, allergens: [] }),
      dish("c", { calories: 250, sodium_mg: 700, caffeine_mg: 95, allergens: ["milk", "gluten"] }),
    ],
    [ACTIVE],
    []
  );
  const rows = Object.fromEntries(f.sections.flatMap((s) => s.rows).map((r) => [r.id, r]));

  it("بلا أرقام ⇒ «غير مُدخَل» في كل عمود", () => {
    expect(rows.a).toMatchObject({ calories: NOT_ENTERED, sodium: NOT_ENTERED, caffeine: NOT_ENTERED, allergens: NOT_ENTERED });
  });
  it("الصفر رقمٌ لا غياب", () => {
    expect(rows.b).toMatchObject({ calories: "0", sodium: "0", caffeine: "0" });
  });
  it("حساسيةٌ فارغة ليست «لا يوجد» — غياب البيانات ليس إثبات خلوّ", () => {
    expect(rows.b.allergens).toBe(NOT_ENTERED);
  });
  it("الأرقام كما أُدخلت، والحساسية بأسمائها، والصوديوم المرتفع معلَّم", () => {
    expect(rows.c).toMatchObject({ calories: "250", sodium: "700", caffeine: "95", highSodium: true });
    expect(rows.c.allergens).toContain("حليب");
    expect(rows.a.highSodium).toBe(false);
  });
  it("العدّ أرقامٌ لا حكم", () => {
    expect(f).toMatchObject({ total: 3, withCalories: 2, withSodium: 2 });
  });
});

describe("ما يراه الزبون وحده", () => {
  const f = buildComplianceFile(
    [
      dish("shown"),
      dish("off", { menu_id: "m2" }),
      dish("orphan", { menu_id: null }),
      // النافد باقٍ في المنيو بشارته — فهو في الورقة.
      { ...dish("soldout"), available: false } as ComplianceDish,
    ],
    [ACTIVE, OFF],
    []
  );
  const ids = f.sections.flatMap((s) => s.rows.map((r) => r.id));
  it("القوائم المفعّلة وحدها، بلا يتيم", () => expect(ids.sort()).toEqual(["shown", "soldout"]));
});

describe("الأقسام بترتيب التاجر", () => {
  it("المحفوظ يُحترم، وبلا قسم في الآخر", () => {
    const f = buildComplianceFile(
      [dish("a", { category: "حلويات" }), dish("b", { category: "مشروبات" }), dish("c", { category: null })],
      [ACTIVE],
      ["مشروبات", "حلويات"]
    );
    expect(f.sections.map((s) => s.name)).toEqual(["مشروبات", "حلويات", "أطباق"]);
  });
});

describe("عبارات الهيئة", () => {
  it("الاحتياج اليومي دائماً، من الثابت نفسه", () => {
    const f = buildComplianceFile([dish("a")], [ACTIVE], []);
    expect(f.statements).toHaveLength(1);
    expect(f.statements[0]).toContain(DAILY_KCAL.toLocaleString("ar-SA-u-nu-latn"));
  });
  it("وعبارة الكافيين متى وُجد صنفٌ بكافيين", () => {
    const f = buildComplianceFile([dish("a", { caffeine_mg: 64 })], [ACTIVE], []);
    expect(f.statements[1]).toContain(String(DAILY_CAFFEINE_MAX_MG));
  });
});

describe("التاريخ", () => {
  it("ميلادي بأرقام لاتينية وبتوقيت الرياض", () => {
    // ٢١:٣٠ بتوقيت غرينتش = ٠٠:٣٠ من اليوم التالي في الرياض.
    const s = fileDate(new Date("2026-10-26T21:30:00Z"));
    expect(s).toContain("2026");
    expect(s).toContain("27");
    expect(s).not.toMatch(/[٠-٩]/);
    expect(s).not.toContain("هـ");
  });
  it("تاريخٌ تالف ⇒ فراغ لا «Invalid Date»", () => expect(fileDate("not-a-date")).toBe(""));
  it("عمود «آخر تحديث» يظهر فقط إن حمل طبقٌ تاريخاً", () => {
    expect(buildComplianceFile([dish("a")], [ACTIVE], []).hasUpdated).toBe(false);
    const f = buildComplianceFile([dish("a", { updated_at: "2026-10-20T10:00:00Z" }), dish("b")], [ACTIVE], []);
    expect(f.hasUpdated).toBe(true);
    const rows = f.sections[0].rows;
    expect(rows.find((r) => r.id === "a")?.updated).toContain("2026");
    expect(rows.find((r) => r.id === "b")?.updated).toBeNull();
  });
});

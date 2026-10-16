/**
 * أقسام المنيو المطبوع — `groupByCategory` في `lib/categories.ts`.
 *
 * ⚠️ العطل الذي يمنعه: الأقسام كانت تُدمج بـ`categoryKey` («مشروبات» =
 * «المشروبات»)، والأطباق تُفرز بالاسم الخام. فطبقٌ في «المشروبات» لا يطابق
 * القسم المدموج «مشروبات» ولا يُعدّ «بلا قسم» — **فيختفي من الورقة ومن ملف
 * التوصيل** بلا أي تنبيه. والورقة تُطبع وتُوزَّع.
 */
import { describe, expect, it } from "vitest";
import { groupByCategory } from "@/lib/categories";

const dish = (id: string, category: string | null) => ({ id, category });

describe("كل طبقٍ في قسمٍ واحد بالضبط", () => {
  const dishes = [
    dish("a", "مشروبات"),
    dish("b", "المشروبات"),
    dish("c", " مشروبات "),
    dish("d", "مشاوي"),
    dish("e", null),
    dish("f", "  "),
  ];
  const sections = groupByCategory(dishes, [], "أطباق");

  it("لا يسقط طبق ولا يتكرّر", () => {
    const ids = sections.flatMap((s) => s.items.map((d) => d.id)).sort();
    expect(ids).toEqual(["a", "b", "c", "d", "e", "f"]);
  });

  it("الأسماء المتقاربة قسمٌ واحد باسم أوّل ظهور", () => {
    const drinks = sections.find((s) => s.name === "مشروبات");
    expect(drinks?.items.map((d) => d.id)).toEqual(["a", "b", "c"]);
  });

  it("بلا قسم ⇒ القسم الاحتياطي في الآخر", () => {
    const last = sections[sections.length - 1];
    expect(last.name).toBe("أطباق");
    expect(last.items.map((d) => d.id)).toEqual(["e", "f"]);
  });

  it("الترتيب المحفوظ يُحترم ولو كُتب بصيغة أخرى", () => {
    const ordered = groupByCategory(dishes, ["مشاوي", "المشروبات"], "أطباق");
    expect(ordered.map((s) => s.name)).toEqual(["مشاوي", "مشروبات", "أطباق"]);
  });
});

/**
 * ترتيب الطوابع حسب نوع النشاط (`lib/themeSuggest.ts`) — قواعد النمو (٢٠٢٦/١٠/٢٦).
 *
 * الجدولان (الشارات على كل طابع، والثلاثة الأولى لكل نوع) **نسختان بيد** لنفس
 * الحكم: «هذا الطابع لهذا المكان». فإن تباعدتا ظهرت على بطاقةٍ شارةٌ لنوعٍ لا
 * يراها أوّلاً، أو اقترحنا أوّلاً طابعاً لا يقول إنه يناسبه.
 */
import { describe, expect, it } from "vitest";
import { ALL_THEMES } from "@/lib/themes";
import { STARTER_TYPES } from "@/lib/starterMenus";
import { BAKERY, BREAKFAST, GRILL, PIZZA, POPULAR_CAFE, SUGGESTED, badgeTypeOf, cafeFlavor, rankThemes, suggestionKey } from "@/lib/themeSuggest";

const byId = new Map(ALL_THEMES.map((t) => [t.id, t]));

describe("مفردات واحدة مع `aliasType`", () => {
  it("مفاتيح الجدول = أنواع `STARTERS` + الكافيه الشعبي + المخبز والفطور والمشاوي والبيتزا", () => {
    const extra = [POPULAR_CAFE, BAKERY, BREAKFAST, GRILL, PIZZA];
    const keys = Object.keys(SUGGESTED).filter((k) => !extra.includes(k)).sort();
    expect(keys).toEqual([...STARTER_TYPES].sort());
    for (const k of extra) expect(SUGGESTED[k], k).toBeDefined();
    // الصفّ الفرعيّ ليس نوعاً: لا يُكتب في `restaurants.type` ولا يظهر في قائمة الأنواع.
    for (const k of extra) expect(STARTER_TYPES).not.toContain(k);
  });

  it.each(ALL_THEMES.map((t) => [t.id, t] as const))("«%s»: شاراته من المفردات نفسها، ولا تزيد على اثنتين", (_, t) => {
    expect(t.suits?.length ?? 0).toBeGreaterThan(0);
    expect(t.suits!.length).toBeLessThanOrEqual(2);
    for (const s of t.suits!) expect(STARTER_TYPES).toContain(s);
  });

  it("كلّ معرّفٍ في الجدول طابعٌ موجود، وبلا تكرار في الصفّ", () => {
    for (const row of Object.values(SUGGESTED)) {
      expect(new Set(row).size).toBe(3);
      for (const id of row) expect(byId.has(id), id).toBe(true);
    }
  });
});

describe("قاعدتا الاتّساق", () => {
  it.each(Object.keys(SUGGESTED))("١. أوّل «%s» يحمل شارته", (key) => {
    const first = byId.get(SUGGESTED[key][0])!;
    expect(first.suits).toContain(badgeTypeOf(key));
  });

  it.each(ALL_THEMES.map((t) => [t.id, t] as const))("٢. كلّ شارةٍ على «%s» تعني أنه بين الثلاثة الأولى", (id, t) => {
    for (const s of t.suits!) expect(SUGGESTED[s], `${id} ⇐ ${s}`).toContain(id);
  });

  it("لا طابع يتيم: كلّ طابعٍ بين الثلاثة الأولى لنوعٍ ما", () => {
    const seen = new Set(Object.values(SUGGESTED).flat());
    for (const t of ALL_THEMES) expect(seen.has(t.id), t.id).toBe(true);
  });
});

describe("الكافيه: مختصّ أم شعبي — تلميحٌ من النصّ", () => {
  it.each([
    ["كافيه", "specialty"],
    ["محمصة قهوة مختصة", "specialty"],
    ["Coffee", "specialty"],
    ["مقهى شعبي", "popular"],
    ["قهوة عربية", "popular"],
    ["مجلس قهوة", "popular"],
    ["كافيه تراثي", "popular"],
    ["شاي على الجمر", "popular"],
    [null, "specialty"],
  ] as const)("«%s» ⇒ %s", (raw, flavor) => {
    expect(cafeFlavor(raw)).toBe(flavor);
  });

  it("«مقهى شعبي» يبقى كافيهاً في `aliasType`، والتلميح وحده يفرّقه", () => {
    expect(suggestionKey("مقهى شعبي")).toBe(POPULAR_CAFE);
    expect(suggestionKey("كافيه")).toBe("كافيه");
    // زرّ التاجر يغلب التلميح في الاتّجاهين.
    expect(suggestionKey("مقهى شعبي", "specialty")).toBe("كافيه");
    expect(suggestionKey("كافيه", "popular")).toBe(POPULAR_CAFE);
  });
});

describe("الصفّان الفرعيّان: المخبز والفطور", () => {
  it("الاسم المجرّد للنوع يبقى على صفّه — «مخبز وحلويات» من القائمة يبدأ بـ«حلواني»", () => {
    expect(suggestionKey("مخبز وحلويات")).toBe("مخبز وحلويات");
    expect(rankThemes(ALL_THEMES, "مخبز وحلويات").suggested).toBe("patisserie");
    expect(suggestionKey("شعبي")).toBe("شعبي");
    expect(suggestionKey("حلويات")).toBe("مخبز وحلويات");
  });

  it("«فرن» كلمةً لا جزءَ كلمة — «مطعم فرنسي» مطعم", () => {
    expect(suggestionKey("مطعم فرنسي")).toBe("مطعم");
    expect(suggestionKey("أفران الحيّ")).toBe(BAKERY);
  });

  it("الكافيه يبقى كافيهاً ولو ذكر الفطور، والمندي شعبيٌّ لا فطور", () => {
    expect(suggestionKey("كافيه وفطور")).toBe("كافيه");
    expect(suggestionKey("مطعم شعبي")).toBe("شعبي");
    expect(suggestionKey("مندي ومظبي")).toBe("مطعم");
  });

  it("شارة الصفّ الفرعيّ من المفردات القائمة", () => {
    expect(badgeTypeOf(BAKERY)).toBe("مخبز وحلويات");
    expect(badgeTypeOf(BREAKFAST)).toBe("شعبي");
    expect(badgeTypeOf(GRILL)).toBe("مشويات");
    expect(badgeTypeOf(PIZZA)).toBe("مطعم");
  });
});

describe("والصفّان بعدهما: المشاوي والبيتزا (٠٧/١١)", () => {
  it("داخل «مطعم» و«مطعم سريع» وحدهما — «مطعم مشويات» على صفّ نوعه", () => {
    expect(suggestionKey("مطعم مشويات")).toBe("مشويات");
    expect(suggestionKey("شاورما")).toBe(GRILL);
    expect(suggestionKey("شاورما وبرجر")).toBe(GRILL);
    expect(suggestionKey("بيتزا")).toBe(PIZZA);
    expect(suggestionKey("مطعم إيطالي")).toBe(PIZZA);
    // المخبز يبقى مخبزاً ولو خبز البيتزا، والبرجر برجراً.
    expect(suggestionKey("مخبز وبيتزا")).toBe(BAKERY);
    expect(suggestionKey("برجر")).toBe("مطعم سريع");
  });

  it("«جمر» كلمةً، و«شيشة» مقهى لا مشوى", () => {
    expect(suggestionKey("مطعم الجمر")).toBe(GRILL);
    expect(suggestionKey("كافيه وشيشة")).toBe("كافيه");
    expect(suggestionKey("مندي ومظبي")).toBe("مطعم");
  });

  it("المشاوي قبل البيتزا حين يذكرهما النصّ معاً", () => {
    expect(suggestionKey("بيتزا وشاورما")).toBe(GRILL);
  });
});

describe("`rankThemes` يرتّب ولا يحذف", () => {
  it.each([
    ["كافيه", "roastery", true],
    ["مقهى شعبي", "najdi", true],
    ["مطعم شعبي", "najdi", false],
    // ٠٧/١١: للمشاوي طابعها («جمر») — و«فاخر» ثانيه بشارته.
    ["مشاوي", "grill", false],
    ["مشويات على الفحم", "grill", false],
    ["شاورما", "grill", false],
    ["كباب وتكّة", "grill", false],
    ["دجاج مشوي", "grill", false],
    // ٠٧/١١: وللبيتزا والمطبخ الإيطالي «ريحان».
    ["بيتزا", "pizza", false],
    ["بيتزا نابولية ومعكرونة", "pizza", false],
    ["مطعم إيطالي", "pizza", false],
    ["Pizza House", "pizza", false],
    // ٠٣/١١: للبحري طابعه («مرفأ») — وروشان ثانيه.
    ["أسماك", "harbor", false],
    ["حلويات", "patisserie", false],
    ["عصيرات", "juice", false],
    // ٠٧/١١: للبرجر والوجبات السريعة طابعهما («صاج») — ونيون ثانيه.
    ["برجر", "burger", false],
    ["وجبات سريعة", "burger", false],
    ["Burger House", "burger", false],
    // ٠٧/١١: المخبز والفطور الشعبي — صفّان فرعيّان من نصّ النوع.
    ["مخبز", "bakery", false],
    ["مخبز تميس", "bakery", false],
    ["فطائر ومعجّنات", "bakery", false],
    ["فرن الحارة", "bakery", false],
    ["Bakery", "bakery", false],
    ["فول وتميس", "breakfast", false],
    ["فطور شعبي", "breakfast", false],
    ["مطعم فوّال", "breakfast", false],
    ["مطبّق ومعصوب", "breakfast", false],
    ["أخرى", "dark-gold", false],
    [null, "dark-gold", false],
  ] as const)("«%s» ⇒ «%s» أوّلاً", (raw, first, cafe) => {
    const r = rankThemes(ALL_THEMES, raw);
    expect(r.suggested).toBe(first);
    expect(r.ordered[0].id).toBe(first);
    expect(r.isCafe).toBe(cafe);
    expect(r.ordered.map((t) => t.id).sort()).toEqual(ALL_THEMES.map((t) => t.id).sort());
  });

  it("ما ليس بين الثلاثة يبقى بترتيبه الأصلي", () => {
    const r = rankThemes(ALL_THEMES, "كافيه");
    const top = new Set(SUGGESTED["كافيه"]);
    const rest = r.ordered.slice(3).map((t) => t.id);
    expect(rest).toEqual(ALL_THEMES.map((t) => t.id).filter((id) => !top.has(id)));
  });
});

describe("سطر الطابع", () => {
  it.each(ALL_THEMES.map((t) => [t.id, t.tagline] as const))("«%s»: ≤ ٦٠ حرفاً وبلا «للـ…»", (_, line) => {
    expect([...line].length).toBeLessThanOrEqual(60);
    expect(line.startsWith("لل")).toBe(false);
  });
});

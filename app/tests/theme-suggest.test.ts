/**
 * ترتيب الطوابع حسب نوع النشاط (`lib/themeSuggest.ts`) — قواعد النمو (٢٠٢٦/١٠/٢٦).
 *
 * الجدولان (الشارات على كل طابع، والثلاثة الأولى لكل نوع) **نسختان بيد** لنفس
 * الحكم: «هذا الطابع لهذا المكان». فإن تباعدتا ظهرت على بطاقةٍ شارةٌ لنوعٍ لا
 * يراها أوّلاً، أو اقترحنا أوّلاً طابعاً لا يقول إنه يناسبه.
 */
import { describe, expect, it } from "vitest";
import { ALL_THEMES } from "@/lib/themes";
import { STARTER_TYPES, aliasType } from "@/lib/starterMenus";
import {
  ARABIC_COFFEE, BAKERY, BREAKFAST, GRILL, PIZZA, POPULAR_CAFE, ROW_SIZE, SPECIALTY, SUGGESTED, TEA_HOUSE,
  badgeTypeOf, cafeFlavor, rankThemes, suggestionKey,
} from "@/lib/themeSuggest";

const byId = new Map(ALL_THEMES.map((t) => [t.id, t]));

describe("مفردات واحدة مع `aliasType`", () => {
  it("مفاتيح الجدول = أنواع `STARTERS` + الكافيه الشعبي + المخبز والفطور والمشاوي والبيتزا والقهوة وبيت الشاي", () => {
    const extra = [POPULAR_CAFE, BAKERY, BREAKFAST, GRILL, PIZZA, ARABIC_COFFEE, SPECIALTY, TEA_HOUSE];
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

  it("كلّ معرّفٍ في الجدول طابعٌ موجود، وبلا تكرار في الصفّ — والصفّ أربعة", () => {
    expect(ROW_SIZE).toBe(4);
    for (const row of Object.values(SUGGESTED)) {
      expect(row).toHaveLength(ROW_SIZE);
      expect(new Set(row).size).toBe(ROW_SIZE);
      for (const id of row) expect(byId.has(id), id).toBe(true);
    }
  });
});

describe("قاعدتا الاتّساق", () => {
  it.each(Object.keys(SUGGESTED))("١. أوّل «%s» يحمل شارته", (key) => {
    const first = byId.get(SUGGESTED[key][0])!;
    expect(first.suits).toContain(badgeTypeOf(key));
  });

  it.each(ALL_THEMES.map((t) => [t.id, t] as const))("٢. كلّ شارةٍ على «%s» تعني أنه بين الأربعة الأولى", (id, t) => {
    for (const s of t.suits!) expect(SUGGESTED[s], `${id} ⇐ ${s}`).toContain(id);
  });

  it("لا طابع يتيم: كلّ طابعٍ بين الأربعة الأولى لنوعٍ ما", () => {
    const seen = new Set(Object.values(SUGGESTED).flat());
    for (const t of ALL_THEMES) expect(seen.has(t.id), t.id).toBe(true);
  });

  it("الحدّ أربعة (٠٧/١١، بقرار المالك): لا يحمل شارةَ نوعٍ أكثرُ من أربعة طوابع", () => {
    // كانت ثلاثة، فامتلأت المقاعد عند الطابع الرابع والعشرين وصارت كلّ إضافةٍ تُخرج شارةً
    // طبيعية من طابعٍ قائم. هذا الفحص يقول صريحاً أيّ نوعٍ امتلأ — قبل أن تسقط قاعدة ٢ على
    // طابعٍ بعيد — والحاملون كلّهم في صفّ نوعهم.
    for (const type of STARTER_TYPES) {
      const holders = ALL_THEMES.filter((t) => t.suits?.includes(type)).map((t) => t.id);
      expect(holders.length, `${type}: ${holders.join(" · ")}`).toBeLessThanOrEqual(ROW_SIZE);
      for (const id of holders) expect(SUGGESTED[type], `${type} ⇐ ${id}`).toContain(id);
    }
    const badges = ALL_THEMES.reduce((n, t) => n + (t.suits?.length ?? 0), 0);
    expect(badges).toBeLessThanOrEqual(STARTER_TYPES.length * ROW_SIZE);
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
    // ٠٧/١١: الخولاني بنّ القهوة السعودية — والدلّة دلّة.
    ["قهوة خولاني", "popular"],
    ["قهوة سعودية", "popular"],
    ["كافيه مختص", "specialty"],
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

describe("صفّا القهوة (٠٧/١١، «دلّة» و«باريستا»)", () => {
  it("من نصّ النوع — والكافيه العامّ يبقى على صفّه («محمصة» أوّلاً)", () => {
    expect(suggestionKey("كافيه")).toBe("كافيه");
    expect(suggestionKey("قهوة عربية")).toBe(ARABIC_COFFEE);
    expect(suggestionKey("قهوة سعودية وتمور")).toBe(ARABIC_COFFEE);
    expect(suggestionKey("محل قهوة خولاني")).toBe(ARABIC_COFFEE);
    // ‏«خولاني» و«إسبريسو» وحدهما لا كلمة لهما في `aliasType` فهما «مطعم» — والصفّ يلتقطهما.
    expect(suggestionKey("خولاني")).toBe(ARABIC_COFFEE);
    expect(suggestionKey("إسبريسو بار")).toBe(SPECIALTY);
    expect(suggestionKey("سبيشلتي")).toBe(SPECIALTY);
    expect(suggestionKey("كافيه مختص")).toBe(SPECIALTY);
    expect(suggestionKey("قهوة مختصة")).toBe(SPECIALTY);
  });

  it("المحمصة محمصة، و«مطعم مختص» مطعم، و«تسهيلات» ليست هيلاً", () => {
    expect(suggestionKey("محمصة قهوة مختصة")).toBe("كافيه");
    expect(suggestionKey("مطعم مختص بالكبسة")).toBe("مطعم");
    expect(suggestionKey("مطعم تسهيلات")).toBe("مطعم");
  });

  it("زرّ «مختصّ أم شعبي؟» يغلب النصّ في الاتّجاهين", () => {
    expect(suggestionKey("قهوة عربية", "specialty")).toBe("كافيه");
    expect(suggestionKey("كافيه مختص", "popular")).toBe(POPULAR_CAFE);
    expect(suggestionKey("قهوة عربية", "popular")).toBe(ARABIC_COFFEE);
    expect(suggestionKey("كافيه مختص", "specialty")).toBe(SPECIALTY);
  });

  it("شارتهما «كافيه» — والكافيه الشعبي معهما", () => {
    for (const k of [ARABIC_COFFEE, SPECIALTY, POPULAR_CAFE]) expect(badgeTypeOf(k)).toBe("كافيه");
    expect(SUGGESTED["كافيه"]).toEqual(["roastery", "barista", "dallah", "letterboard"]);
  });
});

describe("الشاي نوعٌ تاسع (٠٧/١١، «كرك» و«سماور» — بقرار المالك)", () => {
  it("«شاي» في `aliasType` من كلماته — والشاي قبل الكافيه", () => {
    expect(STARTER_TYPES).toContain("شاي");
    for (const raw of ["شاي", "شاهي", "كرك", "شاي كرك", "كشك كرك وشاي", "Karak Chai", "سماور", "مقهى شاي", "كافيه كرك", "قهوة وشاي", "الشاي العدني"]) {
      expect(aliasType(raw), raw).toBe("شاي");
    }
  });

  it("كلماتٌ كاملة: «الشايع» و«شاهين» و«كركم» و«Steak» ليست شاياً", () => {
    expect(aliasType("مطعم الشايع")).toBe("مطعم");
    expect(aliasType("مطعم شاهين")).toBe("مطعم");
    expect(aliasType("مطعم كركم")).toBe("مطعم");
    expect(aliasType("Steak House")).toBe("مطعم");
    expect(aliasType("مقهى")).toBe("كافيه");
  });

  it("الصفّ: النوع يبدأ بـ«كرك»، وبيت الشاي التراثي بـ«سماور»، ومجلس القهوة بـ«دلّة»", () => {
    expect(suggestionKey("كرك")).toBe("شاي");
    expect(suggestionKey("شاهي")).toBe("شاي");
    expect(suggestionKey("مقهى شاي")).toBe("شاي");
    expect(suggestionKey("سماور")).toBe(TEA_HOUSE);
    expect(suggestionKey("بيت شاي تراثي")).toBe(TEA_HOUSE);
    expect(suggestionKey("شاي على الجمر")).toBe(TEA_HOUSE);
    expect(suggestionKey("قهوة عربية وشاي")).toBe(ARABIC_COFFEE);
    // «مطعم الجمر» مشاوٍ كما كان، و«حليب» وحده ليس كركاً.
    expect(suggestionKey("مطعم الجمر")).toBe(GRILL);
    expect(suggestionKey("حليب بالزنجبيل")).toBe("مطعم");
  });

  it("الشارة «شاي» على «كرك» و«سماور» و«ملصقات» — وبيت الشاي «شاي» أيضاً", () => {
    expect(badgeTypeOf(TEA_HOUSE)).toBe("شاي");
    for (const id of ["karak", "samovar", "sticker"]) expect(byId.get(id)!.suits, id).toContain("شاي");
    expect(SUGGESTED["شاي"][0]).toBe("karak");
  });
});

describe("`rankThemes` يرتّب ولا يحذف", () => {
  it.each([
    ["كافيه", "roastery", true],
    // ٠٧/١١: الكافيه الشعبي يبدأ بـ«دلّة» — كان «نجدي».
    ["مقهى شعبي", "dallah", true],
    ["قهوة عربية", "dallah", true],
    ["خولاني", "dallah", false],
    ["كافيه مختص", "barista", true],
    ["Espresso Bar", "barista", false],
    // ٠٧/١١: الشاي نوعٌ تاسع — الكشك أوّلُه، والبيت التراثي أوّلُه «سماور». ولا سؤال «مختصّ أم شعبي؟».
    ["كرك", "karak", false],
    ["كافيه كرك", "karak", false],
    ["شاهي", "karak", false],
    ["بيت شاي تراثي", "samovar", false],
    ["مقهى شاي", "karak", false],
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

  it("ما ليس بين الأربعة يبقى بترتيبه الأصلي", () => {
    const r = rankThemes(ALL_THEMES, "كافيه");
    const top = new Set(SUGGESTED["كافيه"]);
    const rest = r.ordered.slice(ROW_SIZE).map((t) => t.id);
    expect(rest).toEqual(ALL_THEMES.map((t) => t.id).filter((id) => !top.has(id)));
  });
});

describe("سطر الطابع", () => {
  it.each(ALL_THEMES.map((t) => [t.id, t.tagline] as const))("«%s»: ≤ ٦٠ حرفاً وبلا «للـ…»", (_, line) => {
    expect([...line].length).toBeLessThanOrEqual(60);
    expect(line.startsWith("لل")).toBe(false);
  });
});

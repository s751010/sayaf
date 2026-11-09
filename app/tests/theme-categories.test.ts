/**
 * أقسام الطوابع (`lib/themeCategories.ts`) — اختيار المالك ٢٠٢٦/١١/٠٧.
 *
 * الأقسام جدولٌ بيد فوق جدولٍ بيد (`DESIGN_THEMES`)، فتتباعد بصمت: طابعٌ يُضاف ولا
 * يقف على رفّ لا يراه إلا من فتح «الكل»، ومعرّفٌ يُخطأ في كتابته يُسقطه `themesOf`
 * فيصير القسم بطابعين. وهذا الفحص يحرس الاثنين، ويحرس أن قسم التاجر من مفردات
 * `themeSuggest` لا من قاموسٍ ثانٍ.
 */
import { describe, expect, it } from "vitest";
import { ALL_THEMES, DESIGN_THEMES } from "@/lib/themes";
import { DEMO_KINDS, demoData, demoKindForSuits, isDemoKind } from "@/lib/demoMenus";
import { GLYPHS } from "@/lib/icons";
import { SUGGESTED, rankThemes, suggestionKey } from "@/lib/themeSuggest";
import {
  CATEGORY_BY_KEY,
  MIN_PER_CATEGORY,
  THEME_CATEGORIES,
  categoryById,
  categoryForType,
  demoCategoryOf,
  fillColumns,
  themesOf,
} from "@/lib/themeCategories";

const ids = new Set(ALL_THEMES.map((t) => t.id));

describe("الأقسام والطوابع", () => {
  it.each(THEME_CATEGORIES.map((c) => [c.name, c] as const))("«%s»: معرّفاته موجودة، ٣ فأكثر، بلا تكرار", (_, c) => {
    for (const id of c.themes) expect(ids.has(id), `${c.id} ⇐ ${id}`).toBe(true);
    expect(c.themes.length).toBeGreaterThanOrEqual(MIN_PER_CATEGORY);
    expect(new Set(c.themes).size).toBe(c.themes.length);
  });

  it.each(ALL_THEMES.map((t) => [t.id, t.name] as const))("«%s» (%s) على رفٍّ واحدٍ على الأقل", (id) => {
    // طابعٌ جديد بلا قسم يسقط هنا: لا يراه إلا من فتح «الكل».
    expect(THEME_CATEGORIES.some((c) => c.themes.includes(id)), `«${id}» بلا قسم في THEME_CATEGORIES`).toBe(true);
  });

  it("المعرّفات والأسماء فريدة، ولكلّ قسمٍ اسمان وأيقونةٌ مرسومة", () => {
    expect(new Set(THEME_CATEGORIES.map((c) => c.id)).size).toBe(THEME_CATEGORIES.length);
    expect(new Set(THEME_CATEGORIES.map((c) => c.name)).size).toBe(THEME_CATEGORIES.length);
    for (const c of THEME_CATEGORIES) {
      expect(c.name.trim(), c.id).not.toBe("");
      expect(c.nameEn.trim(), c.id).not.toBe("");
      expect(GLYPHS[c.icon], `${c.id} ⇐ ${c.icon}`).toBeDefined();
      // لا إيموجي في الاسم: الأيقونة هي الرمز.
      expect(/\p{Extended_Pictographic}/u.test(c.name + c.nameEn), c.id).toBe(false);
    }
  });

  it("كلّ `kind` موجود، ومنيوه يُبنى، ومنيو القسم يلبس أوّل طوابعه", () => {
    for (const c of THEME_CATEGORIES) {
      expect(isDemoKind(c.kind), `${c.id} ⇐ ${c.kind}`).toBe(true);
      expect(DEMO_KINDS).toContain(c.kind);
      // الشريط في `/demo` يفتح القسم بـ`kind` وأوّل طابع — فالمنيو بلباسه نفسه.
      expect(demoData(c.kind).menus[0].theme, c.id).toBe(c.themes[0]);
    }
    // نوعٌ واحد لقسمٍ واحد: وإلا لم يُعرف من `?kind=` أيّ رفٍّ يُضاء.
    expect(new Set(THEME_CATEGORIES.map((c) => c.kind)).size).toBe(THEME_CATEGORIES.length);
  });

  it("`themesOf` يحفظ ترتيب المالك، و«الكل» يعيد الكلّ كما هو", () => {
    // ٠٩/١١: المقاهي ثمانية أشكالٍ للقهوة — وخرجت «مجلّة» و«عصري» (باقيتان على رفوفٍ أخرى).
    expect(themesOf("cafe", DESIGN_THEMES).map((t) => t.id)).toEqual(["roastery", "v60", "latte", "barista", "grinder", "drive", "dallah", "letterboard"]);
    // ٠٧/١١: قسم الشاي — الكشك ثم البيت ثم «دلّة» ثم «ملصقات».
    expect(themesOf("tea", DESIGN_THEMES).map((t) => t.id)).toEqual(["karak", "samovar", "dallah", "sticker"]);
    // ٠٩/١١: «بيتزا وإيطالي» ستّة — ريحان بيته، ثم أشكال البيتزا الأربعة، و«مجلّة».
    expect(themesOf("pizza", DESIGN_THEMES).map((t) => t.id)).toEqual(["pizza", "woodfire", "napoli", "pizzabox", "slices", "editorial"]);
    expect(themesOf(null, DESIGN_THEMES)).toEqual(DESIGN_THEMES);
    expect(categoryById("nope")).toBeNull();
  });
});

describe("قسم التاجر من نوع نشاطه — مفردات `themeSuggest` نفسها", () => {
  it("كلّ مفتاحٍ في `SUGGESTED` له سطرٌ صريح (و«مطعم» وحده بلا قسم)", () => {
    expect(Object.keys(CATEGORY_BY_KEY).sort()).toEqual(Object.keys(SUGGESTED).sort());
    for (const [key, cat] of Object.entries(CATEGORY_BY_KEY)) {
      if (key === "مطعم") expect(cat).toBeNull();
      else expect(categoryById(cat), key).not.toBeNull();
    }
  });

  it.each(Object.keys(SUGGESTED).filter((k) => k !== "مطعم"))("«%s»: المقترح بشارته داخل القسم الذي ينفتح", (key) => {
    // الشارة «يناسب نوع نشاطك» تقع على `SUGGESTED[key][0]` — فيجب أن تُرى أوّل ما يُفتح.
    const cat = categoryById(CATEGORY_BY_KEY[key])!;
    expect(cat.themes, `${key} ⇒ ${cat.id}`).toContain(SUGGESTED[key][0]);
  });

  it.each([
    ["كافيه", "cafe"],
    ["محمصة قهوة مختصة", "cafe"],
    ["مقهى شعبي", "shaabi"],
    // ٠٧/١١: صفّا القهوة على رفّ المقاهي.
    ["قهوة عربية", "cafe"],
    ["خولاني", "cafe"],
    ["إسبريسو بار", "cafe"],
    // ٠٩/١١: بار التقطير وكشك القهوة السريع على رفّ المقاهي.
    ["كافيه V60", "cafe"],
    ["كشك قهوة", "cafe"],
    ["كوفي درايف ثرو", "cafe"],
    // ٠٧/١١: الشاي — نوعاً («شاي» في `aliasType`) أو بيتَ شاي — على رفّ الشاي.
    ["شاي", "tea"],
    ["كرك", "tea"],
    ["كشك كرك وشاي", "tea"],
    ["شاهي", "tea"],
    ["بيت شاي تراثي", "tea"],
    ["مقهى شاي", "tea"],
    ["مخبز وحلويات", "bakery"],
    ["مخبز تميس", "bakery"],
    ["فول وتميس", "breakfast"],
    ["مطعم برجر", "fast"],
    ["بيتزا", "pizza"],
    ["مطعم إيطالي", "pizza"],
    ["شاورما", "grill"],
    ["مشويات", "grill"],
    ["شعبي", "shaabi"],
    ["مطعم أسماك", "seafood"],
    ["عصائر", "juice"],
    // لا نعرف نشاطه ⇒ «الكل».
    ["مطعم", null],
    ["general", null],
    ["مأكولات سعودية وعالمية", null],
    ["", null],
    [null, null],
  ] as const)("«%s» ⇒ %s", (raw, cat) => {
    expect(categoryForType(raw)).toBe(cat);
  });

  it("زرّ «مختصّ أم شعبي؟» يبدّل القسم كما يبدّل الترتيب", () => {
    expect(categoryForType("كافيه", "popular")).toBe("shaabi");
    expect(categoryForType("مقهى شعبي", "specialty")).toBe("cafe");
    // والمقترح في الترتيب داخل القسم الجديد.
    const order = rankThemes(DESIGN_THEMES, "كافيه", "popular");
    expect(categoryById(categoryForType("كافيه", "popular"))!.themes).toContain(order.suggested);
    expect(suggestionKey("كافيه", "popular")).toBe("كافيه شعبي");
  });
});

describe("`/demo`: القسم من `?kind=` و`?theme=` — ولا يغيّر ما يعرضانه", () => {
  it.each([
    // ما يكتبه الشريط نفسه.
    ["seafood", "modern", "seafood"],
    ["cafe", "latte", "cafe"],
    ["restaurant", "dark-gold", "upscale"],
    // `?theme=` وحده: النوع من `demoKindForSuits` كما كان.
    [demoKindForSuits(ALL_THEMES.find((t) => t.id === "harbor")!.suits, "harbor"), "harbor", "seafood"],
    [demoKindForSuits(ALL_THEMES.find((t) => t.id === "letterboard")!.suits, "letterboard"), "letterboard", "cafe"],
    // `?kind=` وحده: طابع منيو النوع.
    ["sweets", "patisserie", "bakery"],
    ["truck", "neon", "fast"],
    // ٠٧/١١: طابعا القهوة على منيويهما ⇒ رفّ المقاهي.
    [demoKindForSuits(ALL_THEMES.find((t) => t.id === "dallah")!.suits, "dallah"), "dallah", "cafe"],
    [demoKindForSuits(ALL_THEMES.find((t) => t.id === "barista")!.suits, "barista"), "barista", "cafe"],
    // ٠٧/١١: طابعا الشاي على منيويهما ⇒ رفّ الشاي (الكرك بيته، وسماور أوّل رفٍّ يقف عليه).
    [demoKindForSuits(ALL_THEMES.find((t) => t.id === "karak")!.suits, "karak"), "karak", "tea"],
    [demoKindForSuits(ALL_THEMES.find((t) => t.id === "samovar")!.suits, "samovar"), "samovar", "tea"],
    // ٠٩/١١: طوابع القهوة الأربعة على منيوَي القهوة القائمين ⇒ رفّ المقاهي (و«لاتيه» و«درايف» على
    // رفّين آخرين أيضاً — المقاهي أوّلهما).
    [demoKindForSuits(ALL_THEMES.find((t) => t.id === "v60")!.suits, "v60"), "v60", "cafe"],
    [demoKindForSuits(ALL_THEMES.find((t) => t.id === "latte")!.suits, "latte"), "latte", "cafe"],
    [demoKindForSuits(ALL_THEMES.find((t) => t.id === "grinder")!.suits, "grinder"), "grinder", "cafe"],
    [demoKindForSuits(ALL_THEMES.find((t) => t.id === "drive")!.suits, "drive"), "drive", "cafe"],
    ["karak", null, "tea"],
    // ٠٩/١١: طوابع البيتزا الأربعة على منيو البيتزا القائم ⇒ رفّ البيتزا (و«شريحة» و«علبة» على رفّ
    // الوجبات السريعة أيضاً، و«نابولي» على الراقي — البيتزا أوّل ما يُضاء بمنيوه).
    [demoKindForSuits(ALL_THEMES.find((t) => t.id === "woodfire")!.suits, "woodfire"), "woodfire", "pizza"],
    [demoKindForSuits(ALL_THEMES.find((t) => t.id === "pizzabox")!.suits, "pizzabox"), "pizzabox", "pizza"],
    [demoKindForSuits(ALL_THEMES.find((t) => t.id === "slices")!.suits, "slices"), "slices", "pizza"],
    [demoKindForSuits(ALL_THEMES.find((t) => t.id === "napoli")!.suits, "napoli"), "napoli", "pizza"],
  ] as const)("kind=%s theme=%s ⇒ %s", (kind, theme, cat) => {
    expect(demoCategoryOf(kind, theme)).toBe(cat);
  });

  it("كلّ طابعٍ يُعاين وحده (`?theme=`) يُضيء قسماً فيه هو", () => {
    for (const t of ALL_THEMES) {
      const cat = categoryById(demoCategoryOf(demoKindForSuits(t.suits, t.id), t.id));
      expect(cat?.themes, t.id).toContain(t.id);
    }
  });

  it("بلا معاملٍ لا قسم", () => {
    expect(demoCategoryOf(null, null)).toBeNull();
  });
});

describe("الأعمدة تمتلئ بلا بطاقةٍ وحيدة", () => {
  it.each([
    [20, [4, 3], 4],
    [4, [4, 3], 4],
    [3, [4, 3], 3],
    [20, [2, 3], 2],
    [4, [2, 3], 2],
    [3, [2, 3], 3],
    [3, [3, 2], 3],
    [4, [3, 2], 2],
    [20, [3, 2], 3],
  ] as const)("%d بطاقة من %j ⇒ %d", (n, choices, cols) => {
    expect(fillColumns(n, choices)).toBe(cols);
  });

  it.each(THEME_CATEGORIES.map((c) => [c.name, c.themes.length] as const))("«%s» (%d) لا يترك طابعاً وحيداً على الحاسوب", (_, n) => {
    expect(n % fillColumns(n, [4, 3])).not.toBe(1);
  });
});

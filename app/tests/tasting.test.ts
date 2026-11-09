/**
 * بطاقة التذوّق (`lib/tasting.ts`) لطابع «تقطير» — **من البيانات الموجودة وحدها**.
 *
 * المنشأ يُقرأ من الاسم والوصف ولا يُخمَّن، والنكهات لا تُلصق على وصفٍ ليس نكهات.
 */
import { describe, expect, it } from "vitest";
import { coffeeOrigin, hasTasting, splitNotes, tastingOf } from "@/lib/tasting";

describe("المنشأ", () => {
  it.each([
    ["شوتين إسبريسو من محصول إثيوبي مع ٢٠٠ مل حليب.", "إثيوبيا"],
    ["V60 — يرغاتشيفي", "إثيوبيا"],
    ["محصول كولومبي مغسول", "كولومبيا"],
    ["من البرازيل", "البرازيل"],
    ["بنّ يمني حرازي", "اليمن"],
    ["قهوة خولاني من جبال فيفا", "جازان"],
    ["كوستاريكا — هني", "كوستاريكا"],
    ["Ethiopia Guji, natural", "إثيوبيا"],
    // أوّل ما يُذكر: الخلطة «إثيوبي وبرازيلي» منشؤها الأوّل.
    ["خلطة البيت: إثيوبي وبرازيلي.", "إثيوبيا"],
  ])("«%s» ⇒ %s", (text, origin) => {
    expect(coffeeOrigin(text)).toBe(origin);
  });

  it("بالإنجليزية للزبون الإنجليزي", () => {
    expect(coffeeOrigin("محصول كيني", true)).toBe("Kenya");
  });

  it.each([
    "شوتين إسبريسو مع كمية مساوية من الحليب المبخّر.",
    "مطعم بيروت",
    "شاي هندي بالحليب",
    "كيكة الفانيلا",
    "",
  ])("«%s» ⇒ بلا منشأ (لا تخمين)", (text) => {
    expect(coffeeOrigin(text)).toBeNull();
  });
});

describe("النكهات", () => {
  it("بكلمتها، حتى آخر الجملة، وما قبلها وصفٌ يبقى", () => {
    expect(splitNotes("تقطير يدوي ٣٠٠ مل — نوتات: ياسمين، ليمون، شاي أسود. يُقدَّم ساخناً.")).toEqual({
      notes: ["ياسمين", "ليمون", "شاي أسود"],
      rest: "تقطير يدوي ٣٠٠ مل. يُقدَّم ساخناً.",
    });
    expect(splitNotes("Tasting notes: cherry, cocoa").notes).toEqual(["cherry", "cocoa"]);
  });

  it("حتى أربع، ولا نكهة بطول جملة", () => {
    const { notes } = splitNotes("نكهات: توت، كاكاو، كراميل، برتقال، ورد");
    expect(notes).toHaveLength(4);
    expect(splitNotes("نكهات: هذا نصٌّ طويلٌ جداً لا يمكن أن يكون نكهة واحدة على البطاقة").notes).toEqual([]);
  });

  it("وصفٌ بلا كلمة النكهات يبقى وصفاً — لا «نكهات» على «حليب مبخّر»", () => {
    expect(splitNotes("شوتين إسبريسو مع حليب مبخّر.")).toEqual({ notes: [], rest: "شوتين إسبريسو مع حليب مبخّر." });
    expect(splitNotes(null)).toEqual({ notes: [], rest: null });
  });
});

describe("البطاقة", () => {
  const dish = (description: string | null, name = "V60") => ({ name, description, name_en: null, description_en: null });

  it("المنشأ من الاسم أو الوصف، والنكهات من الوصف", () => {
    const t = tastingOf(dish("محصول إثيوبي — نوتات: ياسمين، ليمون"), false);
    expect(t).toEqual({ origin: "إثيوبيا", notes: ["ياسمين", "ليمون"], rest: "محصول إثيوبي" });
    expect(tastingOf(dish(null, "كينيا AA"), false).origin).toBe("كينيا");
  });

  it("لا شيء يُكتب ⇒ بلا بطاقة، والكافيين وحده يكفي", () => {
    const empty = tastingOf(dish("كرواسون بالزبدة"), false);
    expect(hasTasting(empty, null)).toBe(false);
    expect(hasTasting(empty, 126)).toBe(true);
    expect(hasTasting(empty, 0)).toBe(true);
  });
});

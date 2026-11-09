/**
 * بطاقة التذوّق — «المنشأ · النكهات · الكافيين» لطابع «تقطير» (٢٠٢٦/١١/٠٩).
 *
 * ═══ من البيانات الموجودة وحدها ═══
 *
 * لا عمود للمنشأ ولا للنكهات (القاعدة أ: الحقل الجديد أربعة أماكن، وهذا وصفٌ لا حقل).
 * فالمنشأ **يُقرأ** من اسم الصنف ووصفه حين يذكر التاجر بلداً أو منطقةً معروفة
 * («محصول إثيوبي» ⇐ إثيوبيا)، والنكهات من الوصف حين يقدّمها بكلمتها («نوتات: ياسمين،
 * ليمون»)، والكافيين من `caffeine_mg` نفسه. **وما لا يُذكر لا يُعرض**: لا منشأ يُخمَّن،
 * ولا «نكهات» تُلصق على وصفٍ ليس نكهات («شوتين إسبريسو مع حليب»).
 *
 * كلماتٌ كاملة لا احتواء: «بيروت» ليست بيرو، و«هندي» ليست هندوراس.
 * دوالّ خالصة — `tasting.test.ts`.
 */
import { norm } from "./starterMenus";

interface Origin {
  ar: string;
  en: string;
  /** كلماتٌ بعد `norm` — وتُقبل بـ«ال» و«و» و«من» ملتصقة. */
  words: readonly string[];
}

/** بلدان القهوة ومناطقها الأشهر — المنطقة تُعرض ببلدها. */
const ORIGINS: readonly Origin[] = [
  {
    ar: "إثيوبيا",
    en: "Ethiopia",
    words: ["اثيوبيا", "اثيوبي", "اثيوبيه", "ethiopia", "ethiopian", "يرغاتشيفي", "يرقاتشيفي", "يرغاشيفي", "yirgacheffe", "سيدامو", "sidamo", "غوجي", "قوجي", "guji", "هرر", "harrar", "harar"],
  },
  { ar: "كولومبيا", en: "Colombia", words: ["كولومبيا", "كولومبي", "كولومبيه", "colombia", "colombian", "هويلا", "huila"] },
  { ar: "كينيا", en: "Kenya", words: ["كينيا", "كيني", "كينيه", "kenya", "kenyan"] },
  { ar: "البرازيل", en: "Brazil", words: ["برازيل", "برازيلي", "برازيليه", "brazil", "brazilian"] },
  { ar: "اليمن", en: "Yemen", words: ["يمن", "يمني", "يمنيه", "yemen", "yemeni", "حرازي", "haraz", "مطري", "mattari"] },
  { ar: "جازان", en: "Jazan", words: ["جازان", "جيزان", "خولاني", "jazan", "khawlani"] },
  { ar: "غواتيمالا", en: "Guatemala", words: ["غواتيمالا", "جواتيمالا", "guatemala"] },
  { ar: "بنما", en: "Panama", words: ["بنما", "بنمي", "panama"] },
  { ar: "رواندا", en: "Rwanda", words: ["رواندا", "رواندي", "rwanda"] },
  { ar: "بوروندي", en: "Burundi", words: ["بوروندي", "burundi"] },
  { ar: "هندوراس", en: "Honduras", words: ["هندوراس", "honduras"] },
  { ar: "السلفادور", en: "El Salvador", words: ["سلفادور", "salvador"] },
  { ar: "كوستاريكا", en: "Costa Rica", words: ["كوستاريكا", "costarica"] },
  { ar: "بيرو", en: "Peru", words: ["بيرو", "بيروفي", "peru", "peruvian"] },
  { ar: "نيكاراغوا", en: "Nicaragua", words: ["نيكاراغوا", "نيكاراجوا", "nicaragua"] },
  { ar: "المكسيك", en: "Mexico", words: ["مكسيك", "مكسيكي", "mexico", "mexican"] },
  { ar: "إندونيسيا", en: "Indonesia", words: ["اندونيسيا", "اندونيسي", "سومطره", "sumatra", "indonesia"] },
  { ar: "تنزانيا", en: "Tanzania", words: ["تنزانيا", "تنزاني", "tanzania"] },
  { ar: "أوغندا", en: "Uganda", words: ["اوغندا", "اوغندي", "uganda"] },
];

/** كلمات النصّ بعد `norm`، مجرّدةً من «و» و«ال» و«من» في أوّلها. */
function wordsOf(text: string): string[] {
  const v = norm(text).replace(/costa rica/g, "costarica");
  return v
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .flatMap((w) => {
      const out = [w];
      for (const pre of ["وال", "ال", "و", "من", "بال"]) if (w.startsWith(pre) && w.length > pre.length + 2) out.push(w.slice(pre.length));
      return out;
    });
}

/** منشأ القهوة إن ذكره النصّ — أوّل بلدٍ يُذكر، وإلا `null`. */
export function coffeeOrigin(text: string | null | undefined, en = false): string | null {
  if (!text?.trim()) return null;
  const words = wordsOf(text);
  let best: { o: Origin; at: number } | null = null;
  for (const o of ORIGINS) {
    const at = words.findIndex((w) => o.words.includes(w));
    if (at >= 0 && (!best || at < best.at)) best = { o, at };
  }
  return best ? (en ? best.o.en : best.o.ar) : null;
}

/** كلمة النكهات: بعدها القائمة حتى آخر الجملة. */
const NOTES_MARK = /(?:^|[\s(،,.—–-])(?:ب?نوتات|ب?نكهات|ب?نكهة|tasting notes|notes)\s*[:：]?\s*/iu;

export interface Tasting {
  origin: string | null;
  /** النكهات كما كتبها التاجر — حتى أربع. */
  notes: string[];
  /** الوصف بلا جملة النكهات — يُعرض تحتها كما هو. */
  rest: string | null;
}

/** يقرأ الوصف: النكهات المقدَّمة بكلمتها، وما قبلها وصفٌ يبقى. */
export function splitNotes(desc: string | null | undefined): { notes: string[]; rest: string | null } {
  const text = desc?.trim() ?? "";
  if (!text) return { notes: [], rest: null };
  const m = NOTES_MARK.exec(text);
  if (!m) return { notes: [], rest: text };
  const start = m.index + m[0].length;
  const tail = text.slice(start);
  const stop = tail.search(/[.؛;!؟?]/);
  const list = stop >= 0 ? tail.slice(0, stop) : tail;
  const notes = list
    .split(/\s*[،,·/|]\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && [...s].length <= 28)
    .slice(0, 4);
  if (!notes.length) return { notes: [], rest: text };
  const before = text.slice(0, m.index).replace(/[\s،,—–-]+$/u, "").trim();
  const after = stop >= 0 ? tail.slice(stop + 1).trim() : "";
  const rest = [before, after].filter(Boolean).join(before && !/[.؛!؟?]$/.test(before) ? ". " : " ").trim();
  return { notes, rest: rest || null };
}

/** بطاقة التذوّق لصنفٍ ما — بلغة الزبون. */
export function tastingOf(
  dish: { name: string; name_en?: string | null; description: string | null; description_en?: string | null },
  en: boolean
): Tasting {
  const desc = en && dish.description_en ? dish.description_en : dish.description;
  const origin =
    coffeeOrigin(`${dish.name} ${dish.description ?? ""}`, en) ??
    (dish.name_en || dish.description_en ? coffeeOrigin(`${dish.name_en ?? ""} ${dish.description_en ?? ""}`, en) : null);
  const { notes, rest } = splitNotes(desc);
  return { origin, notes, rest };
}

/** هل في الصنف ما يُكتب على بطاقة التذوّق؟ (لحجز سطرها في القسم كلّه.) */
export function hasTasting(t: Tasting, caffeine: number | null | undefined): boolean {
  return !!t.origin || t.notes.length > 0 || caffeine != null;
}

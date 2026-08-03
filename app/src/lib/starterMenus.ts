/**
 * قوائم بداية جاهزة حسب نوع المطعم.
 *
 * التاجر قال: «الفرق بين شاشة فاضية وشاشة فيها بداية = الفرق بين اشتراك
 * وانسحاب.» فبدل أن يهبط على منيو فارغ، يختار ما يشبه مطعمه ويعدّل.
 *
 * ⚠️ الأسعار **مقترحة** بأرقام سوقية سعودية تقريبية، والواجهة تقول ذلك صراحةً.
 * الغرض ألا يبدأ من صفر، لا أن نسعّر له مطعمه.
 *
 * المفاتيح تطابق `RESTAURANT_TYPES` في Dashboard.tsx.
 *
 * ⚠️ **أسماء التصنيفات هنا من `CANON` وحدها.** كانت هذه الملفّات تُخرج ٢٦ اسم
 * تصنيف: ثمانية للمشروبات (`المشروبات` · `مشروبات أخرى` · `قهوة ساخنة` ·
 * `قهوة باردة` · `عصائر طازجة` · `كوكتيلات` · `ميلك شيك` · `سموذي`)، وخمسة
 * للحلى، وبلا اتّساق في «ال» التعريف (`المقبلات` بها · `مخبوزات` بلا). أي أن
 * **مصدر فوضى التصنيفات عند التاجر كان نحن**. صارت ١٧ اسماً، كلها قانونية.
 */
import type { IconName } from "./icons";
export type StarterDish = {
  name: string;
  price: number;
  /** اسم من `CANON` في `lib/categories.ts` — لا نصّ حرّ. */
  category: string;
  /** رمز من `lib/icons.tsx`؛ يُخزَّن في `dishes.emoji` بادئةً `cm:`. */
  icon: IconName;
};

const CAFE: StarterDish[] = [
  { name: "قهوة سعودية", price: 12, category: "القهوة الساخنة", icon: "dallah" },
  { name: "إسبريسو", price: 10, category: "القهوة الساخنة", icon: "cup" },
  { name: "أمريكانو", price: 13, category: "القهوة الساخنة", icon: "cup" },
  { name: "لاتيه", price: 16, category: "القهوة الساخنة", icon: "cup" },
  { name: "كابتشينو", price: 16, category: "القهوة الساخنة", icon: "cup" },
  { name: "فلات وايت", price: 17, category: "القهوة الساخنة", icon: "cup" },
  { name: "آيس لاتيه", price: 18, category: "القهوة الباردة", icon: "cup" },
  { name: "آيس سبانيش لاتيه", price: 21, category: "القهوة الباردة", icon: "cup" },
  { name: "كولد برو", price: 19, category: "القهوة الباردة", icon: "icedcup" },
  { name: "شاي كرك", price: 8, category: "المشروبات", icon: "istikana" },
  { name: "ماتشا لاتيه", price: 22, category: "المشروبات", icon: "cup" },
  { name: "موهيتو فراولة", price: 20, category: "المشروبات", icon: "juice" },
  { name: "كروسان سادة", price: 12, category: "المخبوزات والمعجنات", icon: "croissant" },
  { name: "كوكيز شوكولاتة", price: 14, category: "المخبوزات والمعجنات", icon: "cake" },
  { name: "تشيز كيك", price: 24, category: "الحلويات", icon: "cake" },
];

const STARTERS: Record<string, StarterDish[]> = {
  مطعم: [
    { name: "حمص بالطحينة", price: 18, category: "المقبلات", icon: "mezze" },
    { name: "متبل باذنجان", price: 18, category: "المقبلات", icon: "mezze" },
    { name: "سلطة فتوش", price: 22, category: "المقبلات", icon: "salad" },
    { name: "سلطة تبولة", price: 22, category: "المقبلات", icon: "salad" },
    { name: "شوربة عدس", price: 15, category: "الشوربات", icon: "pot" },
    { name: "كبسة دجاج", price: 45, category: "الأطباق الرئيسية", icon: "kabsa" },
    { name: "كبسة لحم", price: 65, category: "الأطباق الرئيسية", icon: "kabsa" },
    { name: "مندي دجاج", price: 48, category: "الأطباق الرئيسية", icon: "kabsa" },
    { name: "برياني لحم", price: 58, category: "الأطباق الرئيسية", icon: "kabsa" },
    { name: "مظبي دجاج", price: 50, category: "الأطباق الرئيسية", icon: "kabsa" },
    { name: "أرز أبيض", price: 12, category: "الإضافات", icon: "kabsa" },
    { name: "خبز تنور", price: 5, category: "الإضافات", icon: "bread" },
    { name: "كنافة", price: 26, category: "الحلويات", icon: "cake" },
    { name: "عصير برتقال طازج", price: 15, category: "المشروبات", icon: "juice" },
    { name: "مياه", price: 3, category: "المشروبات", icon: "juice" },
  ],
  كافيه: CAFE,
  عصائر: [
    { name: "عصير برتقال طازج", price: 15, category: "العصائر الطازجة", icon: "juice" },
    { name: "عصير مانجو", price: 17, category: "العصائر الطازجة", icon: "juice" },
    { name: "عصير رمان", price: 20, category: "العصائر الطازجة", icon: "juice" },
    { name: "ليمون نعناع", price: 16, category: "العصائر الطازجة", icon: "juice" },
    { name: "أفوكادو بالعسل", price: 24, category: "العصائر الطازجة", icon: "juice" },
    { name: "كوكتيل فواكه", price: 26, category: "المشروبات", icon: "juice" },
    { name: "موهيتو فراولة", price: 20, category: "المشروبات", icon: "juice" },
    { name: "موهيتو باشون", price: 21, category: "المشروبات", icon: "juice" },
    { name: "سموذي فراولة", price: 22, category: "المشروبات", icon: "juice" },
    { name: "سموذي مانجو", price: 22, category: "المشروبات", icon: "juice" },
    { name: "ميلك شيك شوكولاتة", price: 24, category: "المشروبات", icon: "icedcup" },
    { name: "ميلك شيك فانيلا", price: 23, category: "المشروبات", icon: "icedcup" },
    { name: "آيس كريم مشكّل", price: 18, category: "الحلويات", icon: "icedcup" },
  ],
  "مطعم سريع": [
    { name: "برجر لحم كلاسيك", price: 28, category: "البرجر", icon: "burger" },
    { name: "برجر دجاج مقرمش", price: 26, category: "البرجر", icon: "burger" },
    { name: "دبل تشيز برجر", price: 38, category: "البرجر", icon: "burger" },
    { name: "برجر حار", price: 30, category: "البرجر", icon: "burger" },
    { name: "شاورما دجاج", price: 15, category: "السندويتشات", icon: "sandwich" },
    { name: "شاورما لحم", price: 18, category: "السندويتشات", icon: "sandwich" },
    { name: "صحن شاورما", price: 32, category: "السندويتشات", icon: "sandwich" },
    { name: "بروست دجاج ٤ قطع", price: 29, category: "البروست والمقليات", icon: "fries" },
    { name: "بروست دجاج ٨ قطع", price: 52, category: "البروست والمقليات", icon: "fries" },
    { name: "بطاطس مقلية", price: 10, category: "الإضافات", icon: "fries" },
    { name: "بطاطس بالجبن", price: 15, category: "الإضافات", icon: "fries" },
    { name: "أصابع موزاريلا", price: 18, category: "الإضافات", icon: "sides" },
    { name: "مشروب غازي", price: 6, category: "المشروبات", icon: "juice" },
    { name: "مياه", price: 3, category: "المشروبات", icon: "juice" },
  ],
  مشويات: [
    { name: "حمص بالطحينة", price: 18, category: "المقبلات", icon: "mezze" },
    { name: "سلطة فتوش", price: 22, category: "المقبلات", icon: "salad" },
    { name: "كبة مقلية", price: 25, category: "المقبلات", icon: "mezze" },
    { name: "شيش طاووق", price: 45, category: "المشاوي", icon: "skewer" },
    { name: "كباب لحم", price: 55, category: "المشاوي", icon: "skewer" },
    { name: "ريش غنم", price: 85, category: "المشاوي", icon: "skewer" },
    { name: "تكة لحم", price: 60, category: "المشاوي", icon: "skewer" },
    { name: "مشاوي مشكّلة", price: 89, category: "المشاوي", icon: "skewer" },
    { name: "نصف دجاجة مشوية", price: 38, category: "المشاوي", icon: "kabsa" },
    { name: "أرز بخاري", price: 14, category: "الإضافات", icon: "kabsa" },
    { name: "خبز تنور", price: 5, category: "الإضافات", icon: "bread" },
    { name: "بطاطس مقلية", price: 12, category: "الإضافات", icon: "fries" },
    { name: "كنافة", price: 26, category: "الحلويات", icon: "cake" },
    { name: "مشروب غازي", price: 6, category: "المشروبات", icon: "juice" },
  ],
  شعبي: [
    { name: "فول مدمس", price: 12, category: "الإفطار", icon: "pot" },
    { name: "فول بالزيت", price: 14, category: "الإفطار", icon: "pot" },
    { name: "شكشوكة", price: 18, category: "الإفطار", icon: "egg" },
    { name: "بيض بالطماطم", price: 16, category: "الإفطار", icon: "egg" },
    { name: "تميس بالجبن", price: 10, category: "الإفطار", icon: "bread" },
    { name: "معصوب", price: 22, category: "الإفطار", icon: "cake" },
    { name: "مرقوق", price: 35, category: "الأطباق الشعبية", icon: "pot" },
    { name: "جريش", price: 32, category: "الأطباق الشعبية", icon: "skewer" },
    { name: "قرصان", price: 38, category: "الأطباق الشعبية", icon: "pot" },
    { name: "مطازيز", price: 40, category: "الأطباق الشعبية", icon: "pot" },
    { name: "كبسة دجاج", price: 42, category: "الأطباق الشعبية", icon: "kabsa" },
    { name: "قهوة سعودية", price: 10, category: "المشروبات", icon: "dallah" },
    { name: "شاي أحمر", price: 5, category: "المشروبات", icon: "istikana" },
  ],
  بحري: [
    { name: "سلطة بحرية", price: 32, category: "المقبلات", icon: "salad" },
    { name: "شوربة سي فود", price: 28, category: "المقبلات", icon: "pot" },
    { name: "سمك هامور مشوي", price: 95, category: "الأسماك والبحريات", icon: "fish" },
    { name: "سمك هامور مقلي", price: 90, category: "الأسماك والبحريات", icon: "fish" },
    { name: "سمك ناجل صيادية", price: 110, category: "الأسماك والبحريات", icon: "fish" },
    { name: "سمك زبيدي مقلي", price: 85, category: "الأسماك والبحريات", icon: "fish" },
    { name: "روبيان مشوي", price: 78, category: "الأسماك والبحريات", icon: "fish" },
    { name: "روبيان مقرمش", price: 72, category: "الأسماك والبحريات", icon: "fish" },
    { name: "كبسة روبيان", price: 68, category: "الأسماك والبحريات", icon: "fish" },
    { name: "أرز صيادية", price: 15, category: "الإضافات", icon: "kabsa" },
    { name: "خبز تنور", price: 5, category: "الإضافات", icon: "bread" },
    { name: "ليمون نعناع", price: 16, category: "المشروبات", icon: "juice" },
  ],
  "مخبز وحلويات": [
    { name: "كروسان سادة", price: 12, category: "المخبوزات والمعجنات", icon: "croissant" },
    { name: "كروسان بالجبن", price: 15, category: "المخبوزات والمعجنات", icon: "croissant" },
    { name: "فطيرة زعتر", price: 8, category: "المخبوزات والمعجنات", icon: "croissant" },
    { name: "فطيرة جبن", price: 10, category: "المخبوزات والمعجنات", icon: "croissant" },
    { name: "خبز فرنسي", price: 7, category: "المخبوزات والمعجنات", icon: "bread" },
    { name: "تشيز كيك", price: 24, category: "الحلويات", icon: "cake" },
    { name: "كيكة شوكولاتة", price: 22, category: "الحلويات", icon: "cake" },
    { name: "ريد فيلفيت", price: 25, category: "الحلويات", icon: "cake" },
    { name: "كنافة بالقشطة", price: 26, category: "الحلويات", icon: "cake" },
    { name: "بسبوسة", price: 15, category: "الحلويات", icon: "cake" },
    { name: "معمول بالتمر", price: 18, category: "الحلويات", icon: "cake" },
    { name: "دونات شوكولاتة", price: 12, category: "الحلويات", icon: "cake" },
    { name: "كوكيز شوكولاتة", price: 14, category: "الحلويات", icon: "cake" },
    { name: "قهوة سعودية", price: 12, category: "المشروبات", icon: "dallah" },
  ],
};

/** القوالب المتاحة — يعرضها المُنتقي كي لا نعتمد على تخمين النوع وحده. */
export const STARTER_TYPES = Object.keys(STARTERS);

/**
 * تطبيع نصّ عربي/لاتيني للمقارنة: تجريد التشكيل وتوحيد الألف والياء والتاء
 * المربوطة، وخفض اللاتيني. بدونه «كافيه » و«كافية» و«Cafe» ثلاثة أشياء.
 */
function norm(v: string): string {
  return v
    .trim()
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ");
}

/**
 * كلمات تدلّ على قالب — تُفحص بالاحتواء لا بالمطابقة.
 *
 * ⚠️ **الترتيب جزء من المنطق**: الأخصّ أولاً والأعمّ أخيراً، فأول تطابق يفوز.
 * «مطعم مشويات» يحتوي «مطعم» و«مشويات» معاً — ولولا أن المشاوي تسبق لخرج
 * بقالب المطاعم العامّ. لذلك `مطعم` و`general` في آخر القائمة.
 *
 * ⚠️ **هذا ليس ترفاً**: `starterFor` كانت تطابق `restaurants.type` حرفياً
 * بمفاتيح `STARTERS`، وفي الإنتاج **١٦ من ١٩ مطعماً يحملون قيمة لا تطابق أي
 * مفتاح**: `general` لأربعة عشر (قيمة قديمة من نسخة سابقة)، و`cafe` بالإنجليزية،
 * و«مأكولات سعودية وعالمية» لأن حقل النوع في الإعدادات **نصّ حرّ**. فكانت
 * `hasStarter` تعيد `false` فلا يُعرض قالب لأحد تقريباً — وهذه هي النقطة التي
 * توقّف عندها ١٣ من ١٩ عند صفر طبق.
 */
const HINTS: [string, string][] = [
  ["كافيه", "كافيه"], ["كوفي", "كافيه"], ["قهوه", "كافيه"], ["مقهي", "كافيه"],
  ["cafe", "كافيه"], ["coffee", "كافيه"],
  ["مخبز", "مخبز وحلويات"], ["حلويات", "مخبز وحلويات"], ["حلا", "مخبز وحلويات"],
  ["bakery", "مخبز وحلويات"], ["dessert", "مخبز وحلويات"],
  ["عصير", "عصائر"], ["عصائر", "عصائر"], ["juice", "عصائر"],
  ["مشاوي", "مشويات"], ["مشويات", "مشويات"], ["grill", "مشويات"],
  ["بحري", "بحري"], ["سمك", "بحري"], ["اسماك", "بحري"], ["seafood", "بحري"],
  ["سريع", "مطعم سريع"], ["برجر", "مطعم سريع"], ["بيتزا", "مطعم سريع"],
  ["fast", "مطعم سريع"], ["burger", "مطعم سريع"], ["pizza", "مطعم سريع"],
  ["شعبي", "شعبي"], ["شعبيه", "شعبي"],
  ["مطعم", "مطعم"], ["general", "مطعم"], ["restaurant", "مطعم"],
];

/**
 * أقرب قالب لنوع النشاط — **ولا يعيد فراغاً أبداً**.
 *
 * التخمين هنا اقتراح لا حكم: `StarterMenu` تعرض القالب المُختار في مُنتقٍ
 * يبدّله التاجر بضغطة. فخطأ التخمين يكلّف نقرة، وغيابُ قالبٍ كلّف منيوهات كاملة.
 */
export function aliasType(type: string | null | undefined): string {
  const v = norm(type ?? "");
  if (!v) return "مطعم";
  for (const key of STARTER_TYPES) if (norm(key) === v) return key;
  for (const [hint, key] of HINTS) if (v.includes(hint)) return key;
  return "مطعم";
}

/** قائمة البداية لنوع المطعم — عبر `aliasType`, فلا تعود فارغة. */
export function starterFor(type: string | null | undefined): StarterDish[] {
  return STARTERS[aliasType(type)] ?? [];
}

export function hasStarter(type: string | null | undefined): boolean {
  return starterFor(type).length > 0;
}

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
 */
export type StarterDish = {
  name: string;
  price: number;
  category: string;
  emoji: string;
};

const CAFE: StarterDish[] = [
  { name: "قهوة سعودية", price: 12, category: "قهوة ساخنة", emoji: "☕" },
  { name: "إسبريسو", price: 10, category: "قهوة ساخنة", emoji: "☕" },
  { name: "أمريكانو", price: 13, category: "قهوة ساخنة", emoji: "☕" },
  { name: "لاتيه", price: 16, category: "قهوة ساخنة", emoji: "☕" },
  { name: "كابتشينو", price: 16, category: "قهوة ساخنة", emoji: "☕" },
  { name: "فلات وايت", price: 17, category: "قهوة ساخنة", emoji: "☕" },
  { name: "آيس لاتيه", price: 18, category: "قهوة باردة", emoji: "🧋" },
  { name: "آيس سبانيش لاتيه", price: 21, category: "قهوة باردة", emoji: "🧋" },
  { name: "كولد برو", price: 19, category: "قهوة باردة", emoji: "🧋" },
  { name: "شاي كرك", price: 8, category: "مشروبات أخرى", emoji: "🧋" },
  { name: "ماتشا لاتيه", price: 22, category: "مشروبات أخرى", emoji: "🧋" },
  { name: "موهيتو فراولة", price: 20, category: "مشروبات أخرى", emoji: "🍹" },
  { name: "كروسان سادة", price: 12, category: "مخبوزات", emoji: "🥐" },
  { name: "كوكيز شوكولاتة", price: 14, category: "مخبوزات", emoji: "🍩" },
  { name: "تشيز كيك", price: 24, category: "حلويات", emoji: "🍰" },
];

const STARTERS: Record<string, StarterDish[]> = {
  مطعم: [
    { name: "حمص بالطحينة", price: 18, category: "المقبلات", emoji: "🧆" },
    { name: "متبل باذنجان", price: 18, category: "المقبلات", emoji: "🍆" },
    { name: "سلطة فتوش", price: 22, category: "المقبلات", emoji: "🥗" },
    { name: "سلطة تبولة", price: 22, category: "المقبلات", emoji: "🥗" },
    { name: "شوربة عدس", price: 15, category: "الشوربات", emoji: "🍲" },
    { name: "كبسة دجاج", price: 45, category: "الأطباق الرئيسية", emoji: "🍚" },
    { name: "كبسة لحم", price: 65, category: "الأطباق الرئيسية", emoji: "🍚" },
    { name: "مندي دجاج", price: 48, category: "الأطباق الرئيسية", emoji: "🍚" },
    { name: "برياني لحم", price: 58, category: "الأطباق الرئيسية", emoji: "🍚" },
    { name: "مظبي دجاج", price: 50, category: "الأطباق الرئيسية", emoji: "🍗" },
    { name: "أرز أبيض", price: 12, category: "الإضافات", emoji: "🍚" },
    { name: "خبز تنور", price: 5, category: "الإضافات", emoji: "🫓" },
    { name: "كنافة", price: 26, category: "الحلويات", emoji: "🍰" },
    { name: "عصير برتقال طازج", price: 15, category: "المشروبات", emoji: "🥤" },
    { name: "مياه", price: 3, category: "المشروبات", emoji: "🥤" },
  ],
  كافيه: CAFE,
  عصائر: [
    { name: "عصير برتقال طازج", price: 15, category: "عصائر طازجة", emoji: "🥤" },
    { name: "عصير مانجو", price: 17, category: "عصائر طازجة", emoji: "🥤" },
    { name: "عصير رمان", price: 20, category: "عصائر طازجة", emoji: "🥤" },
    { name: "ليمون نعناع", price: 16, category: "عصائر طازجة", emoji: "🥤" },
    { name: "أفوكادو بالعسل", price: 24, category: "عصائر طازجة", emoji: "🥤" },
    { name: "كوكتيل فواكه", price: 26, category: "كوكتيلات", emoji: "🍹" },
    { name: "موهيتو فراولة", price: 20, category: "كوكتيلات", emoji: "🍹" },
    { name: "موهيتو باشون", price: 21, category: "كوكتيلات", emoji: "🍹" },
    { name: "سموذي فراولة", price: 22, category: "سموذي", emoji: "🍹" },
    { name: "سموذي مانجو", price: 22, category: "سموذي", emoji: "🍹" },
    { name: "ميلك شيك شوكولاتة", price: 24, category: "ميلك شيك", emoji: "🧋" },
    { name: "ميلك شيك فانيلا", price: 23, category: "ميلك شيك", emoji: "🧋" },
    { name: "آيس كريم مشكّل", price: 18, category: "حلويات", emoji: "🍨" },
  ],
  "مطعم سريع": [
    { name: "برجر لحم كلاسيك", price: 28, category: "برجر", emoji: "🍔" },
    { name: "برجر دجاج مقرمش", price: 26, category: "برجر", emoji: "🍔" },
    { name: "دبل تشيز برجر", price: 38, category: "برجر", emoji: "🍔" },
    { name: "برجر حار", price: 30, category: "برجر", emoji: "🍔" },
    { name: "شاورما دجاج", price: 15, category: "شاورما", emoji: "🌯" },
    { name: "شاورما لحم", price: 18, category: "شاورما", emoji: "🌯" },
    { name: "صحن شاورما", price: 32, category: "شاورما", emoji: "🌯" },
    { name: "بروست دجاج ٤ قطع", price: 29, category: "بروست", emoji: "🍗" },
    { name: "بروست دجاج ٨ قطع", price: 52, category: "بروست", emoji: "🍗" },
    { name: "بطاطس مقلية", price: 10, category: "الإضافات", emoji: "🍟" },
    { name: "بطاطس بالجبن", price: 15, category: "الإضافات", emoji: "🍟" },
    { name: "أصابع موزاريلا", price: 18, category: "الإضافات", emoji: "🧀" },
    { name: "مشروب غازي", price: 6, category: "المشروبات", emoji: "🥤" },
    { name: "مياه", price: 3, category: "المشروبات", emoji: "🥤" },
  ],
  مشويات: [
    { name: "حمص بالطحينة", price: 18, category: "المقبلات", emoji: "🧆" },
    { name: "سلطة فتوش", price: 22, category: "المقبلات", emoji: "🥗" },
    { name: "كبة مقلية", price: 25, category: "المقبلات", emoji: "🧆" },
    { name: "شيش طاووق", price: 45, category: "المشاوي", emoji: "🍗" },
    { name: "كباب لحم", price: 55, category: "المشاوي", emoji: "🥩" },
    { name: "ريش غنم", price: 85, category: "المشاوي", emoji: "🥩" },
    { name: "تكة لحم", price: 60, category: "المشاوي", emoji: "🥩" },
    { name: "مشاوي مشكّلة", price: 89, category: "المشاوي", emoji: "🥩" },
    { name: "نصف دجاجة مشوية", price: 38, category: "المشاوي", emoji: "🍗" },
    { name: "أرز بخاري", price: 14, category: "الإضافات", emoji: "🍚" },
    { name: "خبز تنور", price: 5, category: "الإضافات", emoji: "🫓" },
    { name: "بطاطس مقلية", price: 12, category: "الإضافات", emoji: "🍟" },
    { name: "كنافة", price: 26, category: "الحلويات", emoji: "🍰" },
    { name: "مشروب غازي", price: 6, category: "المشروبات", emoji: "🥤" },
  ],
  شعبي: [
    { name: "فول مدمس", price: 12, category: "الإفطار", emoji: "🫘" },
    { name: "فول بالزيت", price: 14, category: "الإفطار", emoji: "🫘" },
    { name: "شكشوكة", price: 18, category: "الإفطار", emoji: "🍳" },
    { name: "بيض بالطماطم", price: 16, category: "الإفطار", emoji: "🍳" },
    { name: "تميس بالجبن", price: 10, category: "الإفطار", emoji: "🫓" },
    { name: "معصوب", price: 22, category: "الإفطار", emoji: "🍌" },
    { name: "مرقوق", price: 35, category: "الأطباق الشعبية", emoji: "🍲" },
    { name: "جريش", price: 32, category: "الأطباق الشعبية", emoji: "🍲" },
    { name: "قرصان", price: 38, category: "الأطباق الشعبية", emoji: "🍲" },
    { name: "مطازيز", price: 40, category: "الأطباق الشعبية", emoji: "🍲" },
    { name: "كبسة دجاج", price: 42, category: "الأطباق الشعبية", emoji: "🍚" },
    { name: "قهوة سعودية", price: 10, category: "المشروبات", emoji: "☕" },
    { name: "شاي أحمر", price: 5, category: "المشروبات", emoji: "🍵" },
  ],
  بحري: [
    { name: "سلطة بحرية", price: 32, category: "المقبلات", emoji: "🥗" },
    { name: "شوربة سي فود", price: 28, category: "المقبلات", emoji: "🍲" },
    { name: "سمك هامور مشوي", price: 95, category: "الأسماك", emoji: "🐟" },
    { name: "سمك هامور مقلي", price: 90, category: "الأسماك", emoji: "🐟" },
    { name: "سمك ناجل صيادية", price: 110, category: "الأسماك", emoji: "🐟" },
    { name: "سمك زبيدي مقلي", price: 85, category: "الأسماك", emoji: "🐟" },
    { name: "روبيان مشوي", price: 78, category: "الروبيان", emoji: "🍤" },
    { name: "روبيان مقرمش", price: 72, category: "الروبيان", emoji: "🍤" },
    { name: "كبسة روبيان", price: 68, category: "الروبيان", emoji: "🍤" },
    { name: "أرز صيادية", price: 15, category: "الإضافات", emoji: "🍚" },
    { name: "خبز تنور", price: 5, category: "الإضافات", emoji: "🫓" },
    { name: "ليمون نعناع", price: 16, category: "المشروبات", emoji: "🥤" },
  ],
  "مخبز وحلويات": [
    { name: "كروسان سادة", price: 12, category: "مخبوزات", emoji: "🥐" },
    { name: "كروسان بالجبن", price: 15, category: "مخبوزات", emoji: "🥐" },
    { name: "فطيرة زعتر", price: 8, category: "مخبوزات", emoji: "🫓" },
    { name: "فطيرة جبن", price: 10, category: "مخبوزات", emoji: "🫓" },
    { name: "خبز فرنسي", price: 7, category: "مخبوزات", emoji: "🥖" },
    { name: "تشيز كيك", price: 24, category: "كيك", emoji: "🍰" },
    { name: "كيكة شوكولاتة", price: 22, category: "كيك", emoji: "🍰" },
    { name: "ريد فيلفيت", price: 25, category: "كيك", emoji: "🍰" },
    { name: "كنافة بالقشطة", price: 26, category: "حلويات شرقية", emoji: "🍮" },
    { name: "بسبوسة", price: 15, category: "حلويات شرقية", emoji: "🍮" },
    { name: "معمول بالتمر", price: 18, category: "حلويات شرقية", emoji: "🍪" },
    { name: "دونات شوكولاتة", price: 12, category: "دونات وكوكيز", emoji: "🍩" },
    { name: "كوكيز شوكولاتة", price: 14, category: "دونات وكوكيز", emoji: "🍩" },
    { name: "قهوة سعودية", price: 12, category: "المشروبات", emoji: "☕" },
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

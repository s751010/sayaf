/**
 * قاعدة المكوّنات المرجعية — **لكل ١٠٠ غرام**.
 *
 * ═══ المصدر ═══
 *
 * القيم أرقامٌ مرجعية تقريبية من USDA FoodData Central (SR Legacy)، وهي ملكٌ
 * عامّ. ما لا مقابل له هناك (القهوة السعودية، الثومية، اللبنة…) **تقديرٌ**
 * مُعلَّم بـ`estimate`، والواجهة تقول ذلك للتاجر صراحةً بجانب الرقم.
 *
 * ⚠️ **هذه ليست تحاليل مخبرية.** الهيئة تقبل الحساب من قواعد بيانات أو برامج
 * إلى جانب التحليل، لكن المسؤولية على المنشأة، فكل شاشة تعرض هذه الأرقام تحمل
 * تنبيهاً بمراجعتها. ولا تُكتب هنا قيمةٌ بلا مصدر أو بلا علامة تقدير.
 *
 * ═══ الغموض يُحسم نحو الأعلى ═══
 *
 * «زبدة» بلا وصف = **مملّحة**، و«حليب» = **كامل الدسم**: تقدير الصوديوم
 * والسعرات بالزيادة يُطلق تنبيهاً لا داعي له، وتقديرهما بالنقصان يُخفي تنبيهاً
 * واجباً. الأوّل خطأ يُصحَّح، والثاني مخالفة.
 *
 * ⚠️ **و«نيء أم مطبوخ» ليس غموضاً من هذا النوع.** الوصفة تُوزن نيئة في المطبخ،
 * فـ«دجاج 200 غ» قيمُه نيئة — وهذا ما تفعله طريقة USDA نفسها في حساب الوصفات.
 * والمطبوخ له مرادفه الصريح («دجاج مشوي» · «دجاج مقلي»). أمّا حين يكون
 * المكوّن **غير** ما يطابقه اسمه، فالمرادف الأطول يُضاف ولا يُترك للقصير:
 * «فول سوداني» كان يطابق «فول» فيسقط مسبّب حساسيته، و«جوز هند» كان يطابق
 * «جوز» (عين جمل) فيُعلَن مسبّباً غير موجود.
 */

/** معرّفات `lib/allergens.ts` — المخزَّنة في `dishes.allergens`. */
export type AllergenId =
  | "gluten" | "crustaceans" | "eggs" | "fish" | "peanuts" | "soy" | "milk"
  | "nuts" | "celery" | "mustard" | "sesame" | "sulphites" | "lupin" | "molluscs";

/** القيم الغذائية لكل ١٠٠ غرام. */
export type Per100 = {
  kcal: number;
  fat: number;
  satFat: number;
  sugar: number;
  /** ملغم */
  sodium: number;
  /** ملغم */
  caffeine: number;
};

/** أوزان الوحدات بالغرام لهذا المكوّن تحديداً (تتجاوز التحويل الحجمي العامّ). */
export type UnitGrams = Partial<Record<"piece" | "shot" | "cup" | "tbsp" | "tsp" | "slice" | "clove", number>>;

export type Ingredient = {
  id: string;
  /** الاسم المعروض أوّلاً، ثم المرادفات التي يطابقها المحلّل. */
  ar: string[];
  en: string;
  per100: Per100;
  allergens: AllergenId[];
  /** غرام لكل مل — للسوائل والزيوت والشراب. الافتراض ١. */
  density?: number;
  units?: UnitGrams;
  /** لا مقابل مباشر في المرجع — القيمة تقدير. */
  estimate?: boolean;
  group: IngredientGroup;
};

export type IngredientGroup =
  | "coffee" | "dairy" | "sweet" | "bakery" | "protein" | "produce" | "nuts" | "fats" | "pantry";

export const GROUP_LABEL: Record<IngredientGroup, string> = {
  coffee: "قهوة ومشروبات",
  dairy: "ألبان وبيض",
  sweet: "سكريات وصوصات حلوة",
  bakery: "مخبوزات وحبوب",
  protein: "لحوم وبقوليات",
  produce: "خضار وفواكه",
  nuts: "مكسرات وبذور",
  fats: "زيوت وصلصات",
  pantry: "توابل ومتفرقات",
};

/** صفٌّ مضغوط: [سعرات، دهون، مشبعة، سكر، صوديوم ملغم، كافيين ملغم]. */
type Row = [number, number, number, number, number, number];

function ing(
  group: IngredientGroup,
  id: string,
  ar: string[],
  en: string,
  row: Row,
  allergens: AllergenId[] = [],
  extra: Pick<Ingredient, "density" | "units" | "estimate"> = {}
): Ingredient {
  const [kcal, fat, satFat, sugar, sodium, caffeine] = row;
  return { id, ar, en, group, allergens, per100: { kcal, fat, satFat, sugar, sodium, caffeine }, ...extra };
}

export const INGREDIENTS: readonly Ingredient[] = [
  // ── قهوة ومشروبات ──────────────────────────────────────────────
  ing("coffee", "espresso", ["إسبريسو", "اسبريسو", "اسبرسو", "شوت إسبريسو"], "Espresso", [9, 0.2, 0.1, 0, 14, 212], [], { units: { shot: 30 } }),
  ing("coffee", "brewed-coffee", ["قهوة مقطرة", "أمريكانو", "امريكانو", "قهوة سوداء", "قهوة"], "Brewed coffee", [1, 0, 0, 0, 2, 40], [], { units: { cup: 240 } }),
  ing("coffee", "saudi-coffee", ["قهوة سعودية", "قهوة عربية", "قهوة شقراء"], "Saudi (Arabic) coffee", [2, 0, 0, 0, 2, 35], [], { estimate: true, units: { cup: 60 } }),
  ing("coffee", "black-tea", ["شاي أحمر", "شاي", "شاي أسود"], "Black tea, brewed", [1, 0, 0, 0, 3, 20], [], { units: { cup: 240 } }),
  ing("coffee", "green-tea", ["شاي أخضر"], "Green tea, brewed", [1, 0, 0, 0, 1, 12], [], { units: { cup: 240 } }),
  ing("coffee", "matcha", ["ماتشا", "ماتشا بودرة"], "Matcha powder", [324, 5.3, 1, 0, 6, 3000], [], { units: { tsp: 2, tbsp: 6 } }),
  ing("coffee", "cocoa", ["كاكاو", "بودرة كاكاو", "كاكاو خام"], "Cocoa powder, unsweetened", [228, 13.7, 8.1, 1.8, 21, 230], [], { units: { tbsp: 5.4, tsp: 1.8 } }),
  ing("coffee", "cola", ["كولا", "مشروب غازي", "بيبسي"], "Cola", [42, 0, 0, 10.6, 4, 10], [], { units: { cup: 240 } }),
  ing("coffee", "energy-drink", ["مشروب طاقة", "ريد بل"], "Energy drink", [45, 0, 0, 11, 80, 32], [], { units: { cup: 250 } }),
  ing("coffee", "orange-juice", ["عصير برتقال", "برتقال معصور"], "Orange juice", [45, 0.2, 0, 8.4, 1, 0], [], { units: { cup: 248 } }),
  ing("coffee", "lemon-juice", ["عصير ليمون", "ليمون معصور"], "Lemon juice", [22, 0.2, 0, 2.5, 1, 0], [], { units: { tbsp: 15 } }),
  ing("coffee", "water", ["ماء", "موية", "مويه", "ثلج", "مكعبات ثلج"], "Water / ice", [0, 0, 0, 0, 0, 0]),
  ing("coffee", "soda-water", ["ماء فوار", "صودا", "مياه غازية"], "Soda water", [0, 0, 0, 0, 21, 0]),

  // ── ألبان وبيض ─────────────────────────────────────────────────
  ing("dairy", "milk-whole", ["حليب كامل الدسم", "حليب كامل", "حليب طازج", "حليب"], "Whole milk", [61, 3.3, 1.9, 5.1, 43, 0], ["milk"], { density: 1.03, units: { cup: 244 } }),
  ing("dairy", "milk-low", ["حليب قليل الدسم", "حليب لايت"], "Reduced-fat milk (2%)", [50, 2, 1.3, 5.1, 47, 0], ["milk"], { density: 1.03, units: { cup: 244 } }),
  ing("dairy", "milk-skim", ["حليب خالي الدسم", "حليب منزوع الدسم"], "Skim milk", [34, 0.1, 0.1, 5.1, 42, 0], ["milk"], { density: 1.03, units: { cup: 245 } }),
  ing("dairy", "oat-milk", ["حليب شوفان", "حليب الشوفان"], "Oat milk", [48, 2.8, 0.3, 3.2, 42, 0], ["gluten"], { density: 1.03, units: { cup: 240 } }),
  ing("dairy", "almond-milk", ["حليب لوز", "حليب اللوز"], "Almond milk, unsweetened", [15, 1.1, 0.1, 0, 72, 0], ["nuts"], { units: { cup: 240 } }),
  ing("dairy", "coconut-milk", ["حليب جوز الهند", "حليب جوز هند"], "Coconut milk beverage", [31, 2.1, 2, 2.9, 19, 0], [], { units: { cup: 240 } }),
  ing("dairy", "condensed-milk", ["حليب مكثف محلى", "حليب مكثف", "حليب محلى"], "Sweetened condensed milk", [321, 8.7, 5.5, 54.4, 127, 0], ["milk"], { density: 1.3, units: { tbsp: 19 } }),
  ing("dairy", "evaporated-milk", ["حليب مبخر", "حليب بودرة سائل"], "Evaporated milk", [134, 7.6, 4.6, 10, 106, 0], ["milk"], { density: 1.06 }),
  ing("dairy", "heavy-cream", ["كريمة طبخ", "كريمة سائلة", "قشطة سائلة", "كريمة"], "Heavy cream", [340, 36, 23, 2.9, 27, 0], ["milk"], { density: 1.0, units: { tbsp: 15 } }),
  ing("dairy", "whipped-cream", ["كريمة مخفوقة", "كريمة خفق", "ويب كريم"], "Whipped cream", [257, 22.2, 13.8, 8, 130, 0], ["milk"], { units: { tbsp: 4 } }),
  ing("dairy", "butter", ["زبدة مملحة", "زبدة", "زبده"], "Butter, salted", [717, 81, 51, 0.1, 643, 0], ["milk"], { units: { tbsp: 14, tsp: 5 } }),
  ing("dairy", "butter-unsalted", ["زبدة غير مملحة", "زبدة بدون ملح"], "Butter, unsalted", [717, 81, 51, 0.1, 11, 0], ["milk"], { units: { tbsp: 14, tsp: 5 } }),
  ing("dairy", "ghee", ["سمن بلدي", "سمن", "سمنة"], "Ghee", [876, 99.5, 62, 0, 2, 0], ["milk"], { units: { tbsp: 13, tsp: 4.3 } }),
  ing("dairy", "yogurt", ["زبادي", "لبن زبادي", "روب"], "Plain yogurt, whole", [61, 3.3, 2.1, 4.7, 46, 0], ["milk"], { units: { cup: 245, tbsp: 15 } }),
  ing("dairy", "laban", ["لبن", "لبن رائب", "شنينة"], "Laban (cultured milk)", [40, 0.9, 0.6, 4.8, 105, 0], ["milk"], { density: 1.03, units: { cup: 245 } }),
  ing("dairy", "labneh", ["لبنة"], "Labneh", [180, 15, 9, 3, 300, 0], ["milk"], { estimate: true, units: { tbsp: 15 } }),
  ing("dairy", "cream-cheese", ["جبنة كريمية", "جبن كريمي", "كريم تشيز", "جبنة فيلادلفيا"], "Cream cheese", [342, 34, 19, 3.2, 321, 0], ["milk"], { units: { tbsp: 14.5 } }),
  ing("dairy", "cheddar", ["جبنة شيدر", "شيدر", "جبن شيدر"], "Cheddar cheese", [403, 33, 21, 0.5, 621, 0], ["milk"], { units: { slice: 21 } }),
  ing("dairy", "mozzarella", ["جبنة موزاريلا", "موزاريلا", "موزريلا"], "Mozzarella", [300, 22.4, 13.2, 1, 627, 0], ["milk"], { units: { slice: 28 } }),
  ing("dairy", "feta", ["جبنة فيتا", "فيتا", "جبنة بيضاء"], "Feta", [264, 21.3, 14.9, 4.1, 1116, 0], ["milk"]),
  ing("dairy", "halloumi", ["حلوم", "جبنة حلوم", "حلومي"], "Halloumi", [321, 25, 17, 1.5, 1100, 0], ["milk"], { estimate: true, units: { slice: 25 } }),
  ing("dairy", "parmesan", ["جبنة بارميزان", "بارميزان", "بارميجان"], "Parmesan", [392, 25.8, 16.4, 0.9, 1376, 0], ["milk"], { units: { tbsp: 5 } }),
  ing("dairy", "ice-cream", ["آيس كريم", "ايس كريم", "بوظة", "آيسكريم فانيلا"], "Vanilla ice cream", [207, 11, 6.8, 21.2, 80, 0], ["milk", "eggs"], { units: { cup: 132 } }),
  ing("dairy", "egg", ["بيضة", "بيض"], "Egg, whole", [143, 9.5, 3.1, 0.4, 142, 0], ["eggs"], { units: { piece: 50 } }),
  ing("dairy", "egg-white", ["بياض بيض", "بياض البيض"], "Egg white", [52, 0.2, 0, 0.7, 166, 0], ["eggs"], { units: { piece: 33 } }),

  // ── سكريات وصوصات حلوة ─────────────────────────────────────────
  ing("sweet", "sugar", ["سكر أبيض", "سكر"], "White sugar", [387, 0, 0, 100, 1, 0], [], { units: { tsp: 4.2, tbsp: 12.5, cup: 200 } }),
  ing("sweet", "brown-sugar", ["سكر بني"], "Brown sugar", [380, 0, 0, 97, 28, 0], [], { units: { tsp: 4.6, tbsp: 13.8, cup: 220 } }),
  ing("sweet", "honey", ["عسل"], "Honey", [304, 0, 0, 82.1, 4, 0], [], { density: 1.42, units: { tbsp: 21, tsp: 7 } }),
  ing("sweet", "date-syrup", ["دبس التمر", "دبس تمر", "دبس"], "Date syrup", [290, 0, 0, 70, 10, 0], [], { estimate: true, density: 1.35, units: { tbsp: 20 } }),
  ing("sweet", "flavor-syrup", ["شراب نكهة", "سيرب نكهة", "سيرب", "شراب فانيلا", "سيرب فانيلا", "سيرب كراميل", "شراب كراميل", "سيرب بندق"], "Flavored coffee syrup", [253, 0, 0, 62, 3, 0], [], { density: 1.32, units: { tbsp: 20, shot: 30 } }),
  ing("sweet", "simple-syrup", ["شيرة", "قطر", "شراب سكر"], "Simple syrup (1:1)", [194, 0, 0, 50, 1, 0], [], { density: 1.23, units: { tbsp: 18 } }),
  ing("sweet", "caramel-sauce", ["صوص كراميل", "صلصة كراميل", "كراميل"], "Caramel sauce", [321, 2, 1.3, 60, 300, 0], ["milk"], { estimate: true, density: 1.3, units: { tbsp: 20 } }),
  ing("sweet", "chocolate-sauce", ["صوص شوكولاتة", "صلصة شوكولاتة", "صوص شوكلت"], "Chocolate syrup", [279, 1.1, 0.6, 49.9, 72, 6], [], { density: 1.3, units: { tbsp: 19 } }),
  ing("sweet", "hazelnut-spread", ["نوتيلا", "شوكولاتة بالبندق", "كريمة بندق"], "Hazelnut cocoa spread", [539, 30.9, 10.6, 56.3, 41, 5], ["nuts", "milk", "soy"], { units: { tbsp: 18.5 } }),
  ing("sweet", "dark-chocolate", ["شوكولاتة داكنة", "شوكولاتة سوداء", "دارك تشوكلت"], "Dark chocolate (70–85%)", [598, 42.6, 24.5, 24, 20, 80], ["soy"]),
  ing("sweet", "milk-chocolate", ["شوكولاتة بالحليب", "شوكولاتة", "شوكلت"], "Milk chocolate", [535, 29.7, 18.5, 51.5, 79, 20], ["milk", "soy"]),
  ing("sweet", "jam", ["مربى", "مربّى"], "Jam", [278, 0.1, 0, 48.5, 32, 0], [], { units: { tbsp: 20 } }),
  ing("sweet", "lotus-biscuit", ["بسكويت لوتس", "لوتس", "بسكويت"], "Caramelised biscuit", [484, 19, 8, 38, 400, 0], ["gluten", "soy"], { estimate: true, units: { piece: 7.8 } }),

  // ── مخبوزات وحبوب ──────────────────────────────────────────────
  ing("bakery", "flour", ["دقيق أبيض", "دقيق", "طحين"], "Wheat flour, white", [364, 1, 0.2, 0.3, 2, 0], ["gluten"], { units: { cup: 125, tbsp: 7.8 } }),
  ing("bakery", "white-bread", ["خبز توست", "توست", "خبز أبيض"], "White bread", [266, 3.3, 0.7, 5, 491, 0], ["gluten"], { units: { slice: 25 } }),
  ing("bakery", "pita", ["خبز عربي", "خبز بر", "خبز تميس", "صامولي", "خبز"], "Pita / Arabic bread", [275, 1.2, 0.2, 1.3, 536, 0], ["gluten"], { units: { piece: 60 } }),
  ing("bakery", "burger-bun", ["خبز برجر", "خبزة برجر", "بن برجر"], "Hamburger bun", [279, 3.9, 0.8, 5.2, 492, 0], ["gluten"], { units: { piece: 60 } }),
  ing("bakery", "croissant", ["كرواسون", "كرواسان"], "Butter croissant", [406, 21, 11.7, 11.3, 469, 0], ["gluten", "milk", "eggs"], { units: { piece: 57 } }),
  ing("bakery", "tortilla", ["تورتيلا", "خبز تورتيلا", "خبز صاج"], "Flour tortilla", [304, 7.5, 2.2, 2.2, 600, 0], ["gluten"], { estimate: true, units: { piece: 45 } }),
  ing("bakery", "pasta-cooked", ["مكرونة مطبوخة", "باستا مطبوخة", "مكرونة", "باستا"], "Pasta, cooked", [158, 0.9, 0.2, 0.6, 1, 0], ["gluten"], { units: { cup: 140 } }),
  ing("bakery", "rice-cooked", ["رز مطبوخ", "أرز مطبوخ", "رز بسمتي مطبوخ", "رز", "أرز"], "White rice, cooked", [130, 0.3, 0.1, 0.1, 1, 0], [], { units: { cup: 158 } }),
  ing("bakery", "rice-raw", ["رز نيء", "أرز نيء", "رز غير مطبوخ"], "White rice, raw", [365, 0.7, 0.2, 0.1, 5, 0], [], { units: { cup: 185 } }),
  ing("bakery", "bulgur", ["برغل مطبوخ", "برغل", "جريش"], "Bulgur, cooked", [83, 0.2, 0, 0.1, 5, 0], ["gluten"], { units: { cup: 182 } }),
  ing("bakery", "oats", ["شوفان"], "Rolled oats, dry", [379, 6.5, 1.1, 1, 6, 0], ["gluten"], { units: { cup: 81, tbsp: 5 } }),
  ing("bakery", "quinoa", ["كينوا مطبوخة", "كينوا", "كينوا"], "Quinoa, cooked", [120, 1.9, 0.2, 0.9, 7, 0], [], { units: { cup: 185 } }),
  ing("bakery", "puff-pastry", ["عجينة البف", "عجينة بف باستري", "بف باستري"], "Puff pastry", [551, 38, 9.6, 0.8, 253, 0], ["gluten"]),
  ing("bakery", "phyllo", ["عجينة فيلو", "عجينة كنافة", "عجينة الكنافة", "كنافة"], "Phyllo / kataifi dough", [299, 6, 1.5, 0.2, 483, 0], ["gluten"]),
  ing("bakery", "sponge-cake", ["كيك إسفنجي", "كيكة", "كيك"], "Sponge cake", [297, 4.3, 1.3, 36.6, 250, 0], ["gluten", "eggs", "milk"]),

  // ── لحوم وبقوليات ──────────────────────────────────────────────
  ing("protein", "chicken-breast", ["صدر دجاج نيء", "صدر دجاج", "دجاج"], "Chicken breast, raw", [120, 2.6, 0.6, 0, 45, 0], []),
  ing("protein", "chicken-breast-cooked", ["صدر دجاج مشوي", "دجاج مشوي", "شاورما دجاج"], "Chicken breast, roasted", [165, 3.6, 1, 0, 74, 0], []),
  ing("protein", "chicken-fried", ["دجاج مقلي", "دجاج مقرمش", "بروستد", "دجاج بروستد", "تشكن ستربس"], "Chicken breast with skin, fried, batter", [260, 13.2, 3.5, 0, 275, 0], ["gluten", "eggs", "milk"], { estimate: true }),
  ing("protein", "chicken-whole-roasted", ["دجاج بالجلد", "دجاج مندي", "دجاج كامل"], "Chicken with skin, roasted", [239, 13.6, 3.8, 0, 82, 0], []),
  ing("protein", "lamb", ["لحم غنم نيء", "لحم غنم", "لحم ضأن", "لحم حاشي", "لحم"], "Lamb, raw", [282, 23.4, 10.2, 0, 59, 0], []),
  ing("protein", "lamb-cooked", ["لحم غنم مطبوخ", "لحم مطبوخ", "لحم مندي"], "Lamb, cooked", [294, 20.9, 8.8, 0, 72, 0], []),
  ing("protein", "beef-ground", ["لحم بقري مفروم", "لحم مفروم", "مفروم"], "Ground beef 80/20, raw", [254, 20, 7.6, 0, 66, 0], []),
  ing("protein", "burger-patty", ["شريحة برجر", "قطعة برجر", "برجر لحم"], "Beef patty, cooked", [271, 18, 7, 0, 75, 0], [], { units: { piece: 113 } }),
  ing("protein", "shrimp", ["روبيان", "جمبري", "ربيان"], "Shrimp, raw", [85, 0.5, 0.1, 0, 119, 0], ["crustaceans"]),
  ing("protein", "salmon", ["سلمون", "سالمون"], "Salmon, raw", [208, 13.4, 3.1, 0, 59, 0], ["fish"]),
  ing("protein", "hammour", ["هامور", "سمك هامور", "سمك"], "Grouper, raw", [92, 1, 0.2, 0, 53, 0], ["fish"]),
  ing("protein", "tuna", ["تونة", "تونا"], "Tuna, canned in water", [116, 0.8, 0.2, 0, 338, 0], ["fish"]),
  ing("protein", "falafel", ["فلافل", "طعمية"], "Falafel", [333, 17.8, 2.4, 0, 294, 0], [], { units: { piece: 17 } }),
  ing("protein", "hummus", ["حمص بطحينة", "حمص"], "Hummus", [166, 9.6, 1.4, 0.3, 379, 0], ["sesame"], { units: { tbsp: 15 } }),
  ing("protein", "foul", ["فول مدمس", "فول"], "Fava beans, canned", [71, 0.2, 0, 0, 453, 0], []),
  ing("protein", "lentils", ["عدس مطبوخ", "عدس", "شوربة عدس"], "Lentils, cooked", [116, 0.4, 0.1, 1.8, 2, 0], [], { units: { cup: 198 } }),
  ing("protein", "chickpeas", ["حمص حب", "حمص مطبوخ", "حمص مسلوق"], "Chickpeas, cooked", [164, 2.6, 0.3, 4.8, 7, 0], [], { units: { cup: 164 } }),

  // ── خضار وفواكه ───────────────────────────────────────────────
  ing("produce", "tomato", ["طماطم", "بندورة"], "Tomato", [18, 0.2, 0, 2.6, 5, 0], [], { units: { piece: 120, slice: 20 } }),
  ing("produce", "onion", ["بصل"], "Onion", [40, 0.1, 0, 4.2, 4, 0], [], { units: { piece: 110 } }),
  ing("produce", "garlic", ["ثوم"], "Garlic", [149, 0.5, 0.1, 1, 17, 0], [], { units: { clove: 3 } }),
  ing("produce", "potato", ["بطاطس", "بطاطا"], "Potato, raw", [77, 0.1, 0, 0.8, 6, 0], [], { units: { piece: 170 } }),
  ing("produce", "fries", ["بطاطس مقلية", "فرايز", "بطاطا مقلية"], "French fries, fried", [312, 14.7, 2.3, 0.3, 210, 0], []),
  ing("produce", "lettuce", ["خس"], "Lettuce", [15, 0.2, 0, 0.8, 28, 0]),
  ing("produce", "cucumber", ["خيار"], "Cucumber", [15, 0.1, 0, 1.7, 2, 0], [], { units: { piece: 200 } }),
  ing("produce", "carrot", ["جزر"], "Carrot", [41, 0.2, 0, 4.7, 69, 0], [], { units: { piece: 61 } }),
  ing("produce", "bell-pepper", ["فلفل رومي", "فلفل ألوان", "فلفل حلو"], "Bell pepper", [31, 0.3, 0, 4.2, 4, 0], [], { units: { piece: 120 } }),
  ing("produce", "parsley", ["بقدونس", "معدنوس", "كزبرة"], "Parsley / coriander", [36, 0.8, 0.1, 0.9, 56, 0]),
  ing("produce", "mint", ["نعناع"], "Mint, fresh", [44, 0.7, 0.2, 0, 31, 0]),
  ing("produce", "eggplant", ["باذنجان"], "Eggplant", [25, 0.2, 0, 3.5, 2, 0]),
  ing("produce", "mushroom", ["فطر", "مشروم"], "Mushrooms", [22, 0.3, 0, 2, 5, 0]),
  ing("produce", "spinach", ["سبانخ"], "Spinach", [23, 0.4, 0.1, 0.4, 79, 0]),
  ing("produce", "corn", ["ذرة"], "Sweet corn", [86, 1.4, 0.3, 6.3, 15, 0], [], { units: { cup: 145 } }),
  ing("produce", "olives", ["زيتون"], "Olives, canned", [145, 15.3, 2, 0.5, 1556, 0], [], { units: { piece: 4 } }),
  ing("produce", "pickles", ["مخلل", "مخللات", "خيار مخلل"], "Pickles", [11, 0.2, 0, 1.3, 808, 0]),
  ing("produce", "avocado", ["أفوكادو", "افوكادو"], "Avocado", [160, 14.7, 2.1, 0.7, 7, 0], [], { units: { piece: 150 } }),
  ing("produce", "banana", ["موز"], "Banana", [89, 0.3, 0.1, 12.2, 1, 0], [], { units: { piece: 118 } }),
  ing("produce", "strawberry", ["فراولة", "فراوله"], "Strawberries", [32, 0.3, 0, 4.9, 1, 0], [], { units: { piece: 12, cup: 152 } }),
  ing("produce", "mango", ["مانجو", "منجا"], "Mango", [60, 0.4, 0.1, 13.7, 1, 0], [], { units: { cup: 165 } }),
  ing("produce", "blueberry", ["توت أزرق", "بلوبيري"], "Blueberries", [57, 0.3, 0, 10, 1, 0], [], { units: { cup: 148 } }),
  ing("produce", "dates", ["تمر", "تمور", "تمرة"], "Dates", [280, 0.3, 0, 65, 2, 0], [], { units: { piece: 10 } }),

  // ── مكسرات وبذور ──────────────────────────────────────────────
  ing("nuts", "pistachio", ["فستق حلبي", "فستق", "بستاشيو"], "Pistachios", [560, 45.3, 5.9, 7.7, 1, 0], ["nuts"], { units: { tbsp: 8 } }),
  ing("nuts", "almonds", ["لوز"], "Almonds", [579, 49.9, 3.8, 4.4, 1, 0], ["nuts"], { units: { tbsp: 9 } }),
  ing("nuts", "peanuts", ["فول سوداني", "فستق سوداني", "فول سوداني محمص"], "Peanuts", [567, 49.2, 6.3, 4.7, 18, 0], ["peanuts"], { units: { tbsp: 9 } }),
  // جوز الهند **ليس** من المكسّرات في قائمة الهيئة (Codex) — فلا مسبّب هنا.
  ing("nuts", "coconut-desiccated", ["جوز هند", "جوز الهند", "جوز هند مبشور", "هند مبشور"], "Coconut, desiccated, unsweetened", [660, 64.5, 57.2, 7.4, 37, 0], [], { units: { tbsp: 5 } }),
  ing("nuts", "walnuts", ["جوز", "عين جمل"], "Walnuts", [654, 65.2, 6.1, 2.6, 2, 0], ["nuts"], { units: { tbsp: 7.5 } }),
  ing("nuts", "cashews", ["كاجو"], "Cashews", [553, 43.9, 7.8, 5.9, 12, 0], ["nuts"], { units: { tbsp: 9 } }),
  ing("nuts", "peanut-butter", ["زبدة فول سوداني", "زبدة الفول السوداني", "بينت بتر"], "Peanut butter", [588, 50, 10.3, 9.2, 459, 0], ["peanuts"], { units: { tbsp: 16 } }),
  ing("nuts", "tahini", ["طحينة", "طحينية"], "Tahini", [595, 53.8, 7.5, 0.5, 115, 0], ["sesame"], { units: { tbsp: 15 } }),
  ing("nuts", "sesame", ["سمسم", "بذور سمسم"], "Sesame seeds", [573, 49.7, 7, 0.3, 11, 0], ["sesame"], { units: { tbsp: 9, tsp: 3 } }),

  // ── زيوت وصلصات ───────────────────────────────────────────────
  ing("fats", "olive-oil", ["زيت زيتون", "زيت الزيتون"], "Olive oil", [884, 100, 13.8, 0, 2, 0], [], { density: 0.91, units: { tbsp: 13.5, tsp: 4.5 } }),
  ing("fats", "veg-oil", ["زيت نباتي", "زيت دوار الشمس", "زيت ذرة", "زيت قلي", "زيت"], "Vegetable oil", [884, 100, 9, 0, 0, 0], [], { density: 0.92, units: { tbsp: 13.6, tsp: 4.5 } }),
  ing("fats", "mayonnaise", ["مايونيز", "مايونيزة"], "Mayonnaise", [680, 75, 11.7, 0.6, 635, 0], ["eggs"], { units: { tbsp: 14 } }),
  ing("fats", "toum", ["ثومية", "صوص ثوم", "صلصة ثوم"], "Toum (garlic sauce)", [690, 75, 6, 1, 800, 0], [], { estimate: true, units: { tbsp: 14 } }),
  ing("fats", "tahini-sauce", ["صلصة طحينة", "طحينة متبلة", "صوص طحينة"], "Tahini sauce", [280, 25, 3.5, 1, 400, 0], ["sesame"], { estimate: true, units: { tbsp: 15 } }),
  ing("fats", "tomato-sauce", ["صلصة طماطم", "صوص طماطم"], "Tomato sauce, canned", [24, 0.3, 0, 3.6, 474, 0], [], { estimate: true, density: 1.03, units: { tbsp: 15 } }),
  ing("fats", "ketchup", ["كاتشب", "كاتشاب"], "Ketchup", [101, 0.1, 0, 21.3, 907, 0], [], { units: { tbsp: 17 } }),
  ing("fats", "mustard", ["خردل", "مستردة", "ماسترد"], "Yellow mustard", [60, 3.3, 0.2, 0.9, 1104, 0], ["mustard"], { units: { tbsp: 15, tsp: 5 } }),
  ing("fats", "soy-sauce", ["صويا صوص", "صلصة الصويا", "صوص صويا"], "Soy sauce", [53, 0.6, 0.1, 0.4, 5493, 0], ["soy", "gluten"], { units: { tbsp: 16, tsp: 5.3 } }),

  // ── توابل ومتفرقات ────────────────────────────────────────────
  ing("pantry", "salt", ["ملح"], "Salt", [0, 0, 0, 0, 38758, 0], [], { units: { tsp: 6, tbsp: 18 } }),
  ing("pantry", "spice-mix", ["بهارات مشكلة", "بهارات", "بهار كبسة", "بهارات مندي"], "Mixed spices", [300, 10, 1.5, 2, 50, 0], [], { estimate: true, units: { tsp: 2.5, tbsp: 7.5 } }),
  ing("pantry", "cardamom", ["هيل", "حبهان"], "Cardamom", [311, 6.7, 0.7, 0, 18, 0], [], { units: { tsp: 2, tbsp: 6 } }),
  ing("pantry", "saffron", ["زعفران"], "Saffron", [310, 5.9, 1.6, 0, 148, 0], [], { units: { tsp: 0.7 } }),
  ing("pantry", "cinnamon", ["قرفة", "دارسين"], "Cinnamon", [247, 1.2, 0.3, 2.2, 10, 0], [], { units: { tsp: 2.6, tbsp: 7.8 } }),
];

const BY_ID = new Map(INGREDIENTS.map((i) => [i.id, i]));

export function ingredientById(id: string): Ingredient | undefined {
  return BY_ID.get(id);
}

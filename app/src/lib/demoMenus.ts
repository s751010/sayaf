/**
 * بيانات المنيو التجريبي — **منيو لكل نوع نشاط**.
 *
 * ═══ لماذا خرجت من `Demo.tsx` ═══
 *
 * كان للمنيو التجريبي مطعمٌ واحد («مطعم الديوان» بستيك واقيو)، وصفحة «للكافيه
 * المختصّ» تفتحه في جوّالها — أي أن صاحب المقهى يقرأ صفحةً كُتبت له وجوّالها
 * يعرض منيو مطعم ستيك. والزائر يحكم بما يراه في الجوّال قبل ما يقرؤه حوله.
 *
 * فصار لكل شريحة منيوها (`?kind=` في `/demo`)، و«الديوان» يبقى الافتراض للهبوط
 * ولـ`/demo` بلا معامل — و`e2e/smoke.spec.ts` يقرأ أصنافه بأسمائها.
 *
 * ⚠️ **الأرقام الغذائية تقريبية لأصنافٍ نموذجية** — منيو عرضٍ لا منيو منشأة.
 * لكنها معقولة عمداً (لاتيه ٢ شوت + ٢٠٠ مل حليب = ١٢٧ سعرة، كما يحسبها
 * `recipe.test.ts`): رقمٌ شاذّ في منيو تجريبي يقول للتاجر إن الحاسبة لا تُصدَّق.
 * والأعمدة المحسوبة تُحسب بصيغ القاعدة نفسها (`lib/nutrition.ts`) لا تُكتب بيد.
 */
import type { Dish, Menu, Restaurant } from "./types";
import { burnMinutes, isHighSodium, isSfdaCompliant } from "./nutrition";

export type DemoKind =
  | "restaurant" | "cafe" | "shaabi" | "truck" | "seafood" | "sweets" | "juice" | "burger"
  | "bakery" | "breakfast";

export const DEMO_KINDS: readonly DemoKind[] = [
  "restaurant", "cafe", "shaabi", "truck", "seafood", "sweets", "juice", "burger", "bakery", "breakfast",
];

export function isDemoKind(v: string | null | undefined): v is DemoKind {
  return !!v && (DEMO_KINDS as readonly string[]).includes(v);
}

export type DemoData = { restaurant: Restaurant; menus: Menu[]; dishes: Dish[] };

const DEMO_TS = "2026-01-01T00:00:00.000Z";

const WEEK = (from: string, to: string, late = to) =>
  JSON.stringify({
    sat: { open: true, from, to },
    sun: { open: true, from, to },
    mon: { open: true, from, to },
    tue: { open: true, from, to },
    wed: { open: true, from, to },
    thu: { open: true, from, to: late },
    fri: { open: true, from: "13:00", to: late },
  });

function restaurantOf(id: string, patch: Partial<Restaurant> & Pick<Restaurant, "name">): Restaurant {
  return {
    id,
    user_id: "demo-user",
    type: null,
    phone: null,
    address: "الرياض",
    logo: "🍽️",
    cover_color: "#1d1a14",
    logo_image: null,
    banner_image: null,
    created_at: DEMO_TS,
    slug: "demo",
    slug_changed_at: null,
    google_review_url: "https://www.google.com/maps",
    allergens_text: null,
    working_hours: WEEK("12:00", "01:00", "02:00"),
    social_instagram: "https://instagram.com",
    social_twitter: null,
    social_tiktok: null,
    social_snapchat: null,
    social_whatsapp: "966500000000",
    social_maps: "https://maps.google.com",
    english_enabled: true,
    loyalty_enabled: true,
    loyalty_goal: 6,
    loyalty_reward: "مشروب مجاناً",
    prices_include_vat: true,
    vat_number: "300000000000003",
    season: null,
    category_order: null,
    reviews_enabled: true,
    online_payment_enabled: false,
    api_enabled: false,
    meta_pixel_id: null,
    ga_measurement_id: null,
    snap_pixel_id: null,
    // الديمو يعرض المسار الجديد: الرقم وهمي، والزرّ يُظهر الطلب كما يصل التاجر.
    whatsapp_orders_enabled: true,
    accepting_orders: true,
    prep_minutes: 20,
    min_order_amount: 0,
    ...patch,
  };
}

function menuOf(restaurantId: string, menuId: string, theme: string): Menu {
  return {
    id: menuId,
    restaurant_id: restaurantId,
    user_id: "demo-user",
    name: "القائمة الرئيسية",
    description: null,
    theme,
    active: true,
    views: 0,
    created_at: DEMO_TS,
    language: null,
    cover_image: null,
    window_from: null,
    window_to: null,
  };
}

/** يبني طبقاً كاملاً بأقل تكرار — البقية افتراضات معقولة. */
function dishMaker(restaurantId: string, menuId: string) {
  return (
    id: string,
    name: string,
    name_en: string,
    category: string,
    price: number,
    emoji: string,
    extra: Partial<Dish> = {}
  ): Dish => ({
    id,
    menu_id: menuId,
    restaurant_id: restaurantId,
    user_id: "demo-user",
    name,
    name_en,
    description: null,
    description_en: null,
    price,
    category,
    emoji,
    image: null,
    featured: false,
    available: true,
    sort_order: 0,
    views: 0,
    created_at: DEMO_TS,
    calories: null,
    sodium_mg: null,
    caffeine_mg: null,
    allergens: null,
    options: null,
    ...extra,
    burn_minutes: burnMinutes(extra.calories ?? null),
    is_high_sodium: extra.sodium_mg == null ? null : isHighSodium(extra.sodium_mg),
    sfda_compliant: isSfdaCompliant(extra.calories ?? null, extra.sodium_mg ?? null),
  });
}

/* ── مطعم الديوان — الافتراض (الهبوط و`/demo`) ───────────────────────── */

function diwan(): DemoData {
  const R = "demo-restaurant";
  const M = "demo-menu";
  const dish = dishMaker(R, M);
  return {
    restaurant: restaurantOf(R, {
      name: "مطعم الديوان",
      type: "مأكولات سعودية معاصرة",
      address: "الرياض — حي الملقا",
      allergens_text: "تُحضَّر أطباقنا في مطبخ يحتوي على مكسرات وجلوتين.",
      loyalty_reward: "قهوة سعودية مجاناً",
      // ترتيب التاجر — المقبلات أولاً لا المشاوي لمجرّد أن أول طبق مضاف كان ستيك.
      category_order: JSON.stringify(["الإفطار", "المقبلات", "المشاوي", "الأطباق الرئيسية", "الحلويات", "المشروبات"]),
    }),
    menus: [menuOf(R, M, "dark-gold")],
    dishes: [
      dish("d1", "ستيك واقيو مشوي", "Grilled Wagyu Steak", "المشاوي", 189, "🥩", {
        description: "قطعة واقيو درجة A5 على الفحم، مع زبدة الأعشاب وبطاطس مهروسة.",
        description_en: "A5 Wagyu over charcoal, herb butter and truffle mash.",
        featured: true,
        calories: 620,
        sodium_mg: 780,
        allergens: ["حليب"],
        options: JSON.stringify([
          { name: "إضافة كمأة", price: 25 },
          { name: "صوص الفلفل الأسود", price: 8 },
          { name: "درجة استواء ويل دن" },
        ]),
      }),
      dish("d2", "روبيان مقرمش بالعسل", "Crispy Honey Shrimp", "المقبلات", 78, "🍤", {
        description: "روبيان مقرمش بصوص العسل والسمسم.",
        featured: true,
        calories: 540,
        sodium_mg: 920,
        allergens: ["قشريات", "سمسم", "جلوتين"],
        options: JSON.stringify([{ name: "حار إضافي", price: 0 }, { name: "صوص جانبي", price: 6 }]),
      }),
      dish("d3", "سلطة البرّاتا والرمان", "Burrata & Pomegranate", "المقبلات", 52, "🥗", {
        description: "برّاتا طازجة مع الرمان والجرجير وزيت الزيتون البكر.",
        calories: 310,
        sodium_mg: 340,
        allergens: ["حليب"],
      }),
      dish("d4", "كبسة لحم الديوان", "Diwan Lamb Kabsa", "الأطباق الرئيسية", 95, "🍚", {
        description: "أرز بسمتي بالبهارات السعودية مع لحم ضأن طري ومكسرات.",
        featured: true,
        calories: 880,
        sodium_mg: 1150,
        allergens: ["مكسرات"],
        options: JSON.stringify([
          { name: "نصف وجبة", price: 0 },
          { name: "لحم إضافي", price: 30 },
        ]),
      }),
      dish("d5", "مندي دجاج", "Chicken Mandi", "الأطباق الرئيسية", 68, "🍗", {
        description: "دجاج مدخّن في التنور مع أرز المندي وصلصة الدقوس.",
        calories: 720,
        sodium_mg: 980,
      }),
      dish("d6", "شكشوكة الصباح", "Morning Shakshuka", "الإفطار", 38, "🍳", {
        description: "بيض في صلصة الطماطم والفلفل، مع خبز التنور.",
        calories: 420,
        sodium_mg: 610,
        allergens: ["بيض", "جلوتين"],
      }),
      // نافدٌ اليوم — كي يرى الزائر «نفد اليوم» كما يراها زبونه: في آخر قسمه بعد
      // التمر (وهو قبله في القائمة)، وبلا زرّ إضافة. و`e2e/smoke.spec.ts` يقرؤه.
      dish("d7", "كنافة بالقشطة", "Kunafa with Cream", "الحلويات", 42, "🍰", {
        description: "كنافة ناعمة بالقشطة الطازجة والفستق الحلبي.",
        calories: 560,
        sodium_mg: 290,
        allergens: ["حليب", "مكسرات", "جلوتين"],
        available: false,
      }),
      dish("d8", "قهوة سعودية بالهيل", "Saudi Coffee", "المشروبات", 18, "☕", {
        description: "قهوة سعودية شقراء بالهيل والزعفران، تُقدَّم مع التمر.",
        calories: 15,
        sodium_mg: 5,
        caffeine_mg: 95,
      }),
      dish("d9", "ليمون ونعناع", "Mint Lemonade", "المشروبات", 24, "🍹", {
        description: "عصير ليمون طازج مع النعناع والثلج المجروش.",
        calories: 130,
        sodium_mg: 10,
      }),
      dish("d10", "تمر مع جبن قشقوان", "Dates & Cheese", "الحلويات", 29, "🌰", {
        description: "تمر سكري محشو بالجبن، طبق سعودي بسيط.",
        calories: 240,
        sodium_mg: 180,
        allergens: ["حليب"],
      }),
      dish("d11", "فول بالطحينة", "Fava Beans with Tahini", "الإفطار", 22, "🫘", {
        description: "فول مدمّس بالطحينة وزيت الزيتون والكمّون، مع خبز التميس.",
        calories: 450,
        sodium_mg: 720,
        allergens: ["سمسم", "جلوتين"],
      }),
      dish("d12", "مشاوي مشكّلة", "Mixed Grill", "المشاوي", 115, "🍢", {
        description: "كباب وشيش طاووق وريش غنم على الفحم، مع خبز الصاج والثومية.",
        calories: 980,
        sodium_mg: 1320,
        allergens: ["حليب", "جلوتين"],
      }),
      dish("d13", "شاي أحمر بالنعناع", "Mint Tea", "المشروبات", 12, "🫖", {
        description: "شاي أحمر مخدّر مع أوراق النعناع الطازج.",
        calories: 35,
        sodium_mg: 5,
        caffeine_mg: 40,
      }),
    ],
  };
}

/* ── مقهى مختصّ ──────────────────────────────────────────────────────── */

function cafe(): DemoData {
  const R = "demo-cafe";
  const M = "demo-cafe-menu";
  const dish = dishMaker(R, M);
  const MILK = JSON.stringify([
    { name: "حليب شوفان", price: 4, kcal: 25 },
    { name: "حليب لوز", price: 4 },
    { name: "شوت إضافي", price: 5, kcal: 3 },
  ]);
  return {
    restaurant: restaurantOf(R, {
      name: "محمصة نخلة",
      type: "قهوة مختصّة ومخبوزات يومية",
      address: "الرياض — حي حطّين",
      logo: "☕",
      allergens_text: "نستخدم الحليب والمكسرات والجلوتين في المخبوزات؛ اسأل الباريستا عن البدائل.",
      working_hours: WEEK("06:30", "00:00", "01:00"),
      loyalty_goal: 8,
      loyalty_reward: "كوب لاتيه مجاناً",
      prep_minutes: 8,
      category_order: JSON.stringify(["إسبريسو وحليب", "تقطير", "باردة", "مخبوزات", "حلى"]),
    }),
    menus: [menuOf(R, M, "roastery")],
    dishes: [
      dish("c1", "لاتيه", "Latte", "إسبريسو وحليب", 18, "☕", {
        description: "شوتين إسبريسو من محصول إثيوبي مع ٢٠٠ مل حليب طازج.",
        featured: true,
        calories: 127,
        sodium_mg: 95,
        caffeine_mg: 126,
        allergens: ["حليب"],
        options: MILK,
      }),
      dish("c2", "سبانش لاتيه", "Spanish Latte", "إسبريسو وحليب", 21, "🥛", {
        description: "لاتيه بالحليب المكثّف المحلّى، يُقدَّم ساخناً أو بارداً.",
        calories: 240,
        sodium_mg: 120,
        caffeine_mg: 126,
        allergens: ["حليب"],
        options: MILK,
      }),
      dish("c3", "كورتادو", "Cortado", "إسبريسو وحليب", 15, "☕", {
        description: "شوتين إسبريسو مع كمية مساوية من الحليب المبخّر.",
        calories: 60,
        sodium_mg: 45,
        caffeine_mg: 126,
        allergens: ["حليب"],
      }),
      dish("c4", "ماتشا لاتيه", "Matcha Latte", "إسبريسو وحليب", 23, "🍵", {
        description: "ماتشا يابانية درجة الطقوس مع حليب طازج.",
        calories: 190,
        sodium_mg: 100,
        caffeine_mg: 70,
        allergens: ["حليب"],
        options: MILK,
      }),
      dish("c5", "V60 — محصول اليوم", "V60 Pour-over", "تقطير", 19, "🫖", {
        description: "تقطير يدوي ٣٠٠ مل. اسأل عن محصول اليوم ونوتاته.",
        featured: true,
        calories: 3,
        sodium_mg: 5,
        caffeine_mg: 150,
      }),
      dish("c6", "كيمكس للمشاركة", "Chemex for Two", "تقطير", 32, "⚗️", {
        description: "٥٠٠ مل تكفي شخصين، من محصول تختاره.",
        calories: 5,
        sodium_mg: 10,
        caffeine_mg: 250,
      }),
      dish("c7", "كولد برو", "Cold Brew", "باردة", 20, "🧊", {
        description: "منقوع ١٨ ساعة، ٣٥٠ مل على الثلج.",
        calories: 5,
        sodium_mg: 10,
        caffeine_mg: 200,
      }),
      dish("c8", "آيس لاتيه", "Iced Latte", "باردة", 19, "🥤", {
        description: "شوتين إسبريسو وحليب بارد على الثلج.",
        calories: 120,
        sodium_mg: 90,
        caffeine_mg: 126,
        allergens: ["حليب"],
        options: MILK,
      }),
      dish("c9", "كرواسون زبدة", "Butter Croissant", "مخبوزات", 12, "🥐", {
        description: "يُخبز كل صباح بزبدة فرنسية.",
        calories: 310,
        sodium_mg: 380,
        allergens: ["حليب", "جلوتين", "بيض"],
      }),
      dish("c10", "ساندويتش حلّومي", "Halloumi Sandwich", "مخبوزات", 26, "🥪", {
        description: "حلّومي مشوي مع طماطم وزعتر في خبز الساوردو.",
        calories: 480,
        sodium_mg: 920,
        allergens: ["حليب", "جلوتين"],
      }),
      dish("c11", "سان سيباستيان", "San Sebastián Cheesecake", "حلى", 24, "🍰", {
        description: "تشيز كيك محروق الوجه، قوامه كريمي.",
        featured: true,
        calories: 450,
        sodium_mg: 280,
        allergens: ["حليب", "بيض", "جلوتين"],
      }),
      // نافدٌ اليوم — المحصول ينتهي، و«نفد اليوم» أصدق من أن يختفي الصنف.
      dish("c12", "كوكيز بالشوكولاتة", "Chocolate Cookie", "حلى", 9, "🍪", {
        description: "كوكيز طرية بقطع الشوكولاتة الداكنة.",
        calories: 220,
        sodium_mg: 160,
        allergens: ["حليب", "بيض", "جلوتين"],
        available: false,
      }),
    ],
  };
}

/* ── مطعم شعبي ───────────────────────────────────────────────────────── */

function shaabi(): DemoData {
  const R = "demo-shaabi";
  const M = "demo-shaabi-menu";
  const dish = dishMaker(R, M);
  return {
    restaurant: restaurantOf(R, {
      name: "مطعم بيت الحارة",
      type: "مندي ومظبي وفطور شعبي",
      address: "الرياض — حي النسيم",
      logo: "🍚",
      allergens_text: "أطباقنا قد تحتوي على مكسرات وسمسم وجلوتين.",
      working_hours: WEEK("05:30", "00:00", "01:00"),
      loyalty_goal: 10,
      loyalty_reward: "نفر مندي مجاناً",
      prep_minutes: 25,
      category_order: JSON.stringify(["الفطور", "المندي والمظبي", "الإيدامات", "المشروبات", "الحلا"]),
    }),
    menus: [menuOf(R, M, "najdi")],
    dishes: [
      dish("s1", "فول بالسمن", "Fava Beans with Ghee", "الفطور", 12, "🫘", {
        description: "فول مدمّس بالسمن البري والكمّون، مع تميس حار.",
        calories: 420,
        sodium_mg: 890,
        allergens: ["حليب"],
      }),
      dish("s2", "شكشوكة", "Shakshuka", "الفطور", 14, "🍳", {
        description: "بيض بالطماطم والبصل والفلفل.",
        calories: 360,
        sodium_mg: 620,
        allergens: ["بيض"],
      }),
      dish("s3", "تميس", "Tamees Bread", "الفطور", 3, "🫓", {
        description: "خبز تميس من التنور، حبّة واحدة.",
        calories: 435,
        sodium_mg: 780,
        allergens: ["جلوتين", "سمسم"],
      }),
      dish("s4", "مندي لحم — نفر", "Lamb Mandi", "المندي والمظبي", 55, "🍖", {
        description: "لحم حاشي أو غنم في الحفرة، مع أرز المندي والسلطة والدقوس.",
        featured: true,
        calories: 950,
        sodium_mg: 1400,
        options: JSON.stringify([
          { name: "ربع حاشي", price: 0 },
          { name: "لحم غنم", price: 10 },
          { name: "أرز إضافي", price: 8, kcal: 350 },
        ]),
      }),
      dish("s5", "مظبي دجاج — نص", "Madhbi Chicken", "المندي والمظبي", 32, "🍗", {
        description: "نص دجاجة على الحجر، مع أرز ودقوس.",
        calories: 780,
        sodium_mg: 1100,
      }),
      dish("s6", "كبسة دجاج", "Chicken Kabsa", "المندي والمظبي", 30, "🍚", {
        description: "أرز بالبهارات مع نص دجاجة ومكسرات وزبيب.",
        calories: 820,
        sodium_mg: 1180,
        allergens: ["مكسرات"],
      }),
      dish("s7", "مقلقل لحم", "Lamb Muqalqal", "الإيدامات", 38, "🥘", {
        description: "لحم مقطّع بالبصل والطماطم والبهارات، يُقدَّم مع الخبز.",
        calories: 610,
        sodium_mg: 1050,
      }),
      dish("s8", "مرقوق", "Marqooq", "الإيدامات", 28, "🍲", {
        description: "عجين رقيق مطبوخ في مرق اللحم والخضار.",
        calories: 540,
        sodium_mg: 980,
        allergens: ["جلوتين"],
      }),
      dish("s9", "شاي حليب", "Milk Tea", "المشروبات", 4, "🫖", {
        description: "شاي بالحليب والهيل.",
        calories: 120,
        sodium_mg: 60,
        caffeine_mg: 40,
        allergens: ["حليب"],
      }),
      dish("s10", "لبن", "Laban", "المشروبات", 3, "🥛", {
        description: "لبن بارد ٢٠٠ مل.",
        calories: 90,
        sodium_mg: 120,
        allergens: ["حليب"],
      }),
      dish("s11", "لقيمات بالدبس", "Luqaimat", "الحلا", 15, "🍯", {
        description: "لقيمات مقرمشة بدبس التمر والسمسم.",
        calories: 380,
        sodium_mg: 150,
        allergens: ["جلوتين", "سمسم"],
      }),
    ],
  };
}

/* ── عربة طعام ──────────────────────────────────────────────────────── */

function truck(): DemoData {
  const R = "demo-truck";
  const M = "demo-truck-menu";
  const dish = dishMaker(R, M);
  return {
    restaurant: restaurantOf(R, {
      name: "عربة دخّان",
      type: "برجر مدخّن — نتنقّل بين الفعاليات",
      address: "الرياض — بوليفارد سيتي (هذا الأسبوع)",
      logo: "🍔",
      allergens_text: "خبزنا يحتوي على جلوتين وسمسم، وصوصاتنا على بيض وخردل.",
      working_hours: WEEK("16:00", "01:00", "02:00"),
      loyalty_goal: 6,
      loyalty_reward: "برجر مجاناً",
      prep_minutes: 10,
      category_order: JSON.stringify(["البرجر", "الجانبية", "المشروبات"]),
    }),
    menus: [menuOf(R, M, "neon")],
    dishes: [
      dish("t1", "برجر دخّان", "Smoke Burger", "البرجر", 34, "🍔", {
        description: "لحم أنقس مدخّن على خشب الهيكوري، شيدر، وصوص الدخان.",
        featured: true,
        calories: 720,
        sodium_mg: 1150,
        allergens: ["جلوتين", "حليب", "بيض", "سمسم"],
        options: JSON.stringify([
          { name: "دبل لحم", price: 12, kcal: 290 },
          { name: "بدون جبن", price: 0 },
        ]),
      }),
      dish("t2", "برجر دجاج مقرمش", "Crispy Chicken Burger", "البرجر", 29, "🍗", {
        description: "صدر دجاج مقرمش بصوص الحار والمخلل.",
        calories: 680,
        sodium_mg: 1300,
        allergens: ["جلوتين", "بيض", "سمسم"],
      }),
      dish("t3", "برجر فطر سويسري", "Mushroom Swiss", "البرجر", 32, "🍄", {
        description: "لحم مع فطر مشوي وجبن سويسري.",
        calories: 690,
        sodium_mg: 1020,
        allergens: ["جلوتين", "حليب", "سمسم"],
      }),
      dish("t4", "بطاطس بالجبن والهالبينو", "Loaded Fries", "الجانبية", 18, "🍟", {
        description: "بطاطس مقلية مع صوص الجبن والهالبينو.",
        calories: 520,
        sodium_mg: 980,
        allergens: ["حليب"],
      }),
      dish("t5", "حلقات بصل", "Onion Rings", "الجانبية", 14, "🧅", {
        description: "حلقات بصل مقرمشة مع صوص الرانش.",
        calories: 410,
        sodium_mg: 640,
        allergens: ["جلوتين", "بيض", "حليب"],
      }),
      dish("t6", "كرك", "Karak Tea", "المشروبات", 6, "🫖", {
        description: "شاي كرك بالحليب المبخّر والهيل.",
        calories: 150,
        sodium_mg: 70,
        caffeine_mg: 45,
        allergens: ["حليب"],
      }),
      dish("t7", "ليمون بالنعناع", "Mint Lemonade", "المشروبات", 10, "🍋", {
        description: "ليمون طازج بالنعناع والثلج.",
        calories: 130,
        sodium_mg: 10,
      }),
      dish("t8", "مياه", "Water", "المشروبات", 2, "💧", {
        description: "٣٣٠ مل.",
        calories: 0,
        sodium_mg: 5,
      }),
    ],
  };
}

/* ── مطعم أسماك — لطابع «مرفأ» (٢٠٢٦/١١/٠٣) ─────────────────────────────── */

function seafood(): DemoData {
  const R = "demo-seafood";
  const M = "demo-seafood-menu";
  const dish = dishMaker(R, M);
  return {
    restaurant: restaurantOf(R, {
      name: "مطعم شاطئ النورس",
      type: "أسماك طازجة من سوق اليوم",
      address: "جدة — الكورنيش الشمالي",
      logo: "🐟",
      allergens_text: "أطباقنا تحتوي على أسماك وقشريات، وقد تحتوي على جلوتين وسمسم.",
      working_hours: WEEK("13:00", "00:30", "01:30"),
      loyalty_goal: 8,
      loyalty_reward: "طبق صيادية مجاناً",
      prep_minutes: 30,
      category_order: JSON.stringify(["المقبلات", "الأسماك", "القشريات", "الأرز", "المشروبات"]),
    }),
    menus: [menuOf(R, M, "harbor")],
    dishes: [
      dish("f1", "سلطة الحمّص بالطحينة", "Hummus", "المقبلات", 16, "🥣", {
        description: "حمّص ناعم بالطحينة وزيت الزيتون.",
        calories: 330,
        sodium_mg: 520,
        allergens: ["سمسم"],
      }),
      dish("f2", "شوربة سمك", "Fish Soup", "المقبلات", 22, "🍲", {
        description: "مرق السمك بالكزبرة والليمون وقطع الهامور.",
        calories: 210,
        sodium_mg: 760,
        allergens: ["سمك"],
      }),
      dish("f3", "هامور مشوي — كيلو", "Grilled Hammour (1kg)", "الأسماك", 145, "🐟", {
        description: "هامور من سوق اليوم مشوي على الفحم بالبهارات البحرية، مع أرز صيادية وسلطة.",
        featured: true,
        calories: 1180,
        sodium_mg: 1650,
        allergens: ["سمك"],
        options: JSON.stringify([
          { name: "نصف كيلو", price: 0 },
          { name: "مقلي بدل مشوي", price: 0, kcal: 260 },
        ]),
      }),
      dish("f4", "سمك سلمون بالليمون", "Lemon Salmon", "الأسماك", 78, "🍣", {
        description: "شريحة سلمون بزبدة الليمون والأعشاب، مع خضار سوتيه.",
        calories: 540,
        sodium_mg: 610,
        allergens: ["سمك", "حليب"],
      }),
      dish("f5", "روبيان جامبو مشوي", "Grilled Jumbo Shrimp", "القشريات", 95, "🦐", {
        description: "روبيان جامبو بالثوم والزبدة الحارّة.",
        featured: true,
        calories: 420,
        sodium_mg: 980,
        allergens: ["قشريات", "حليب"],
      }),
      dish("f6", "سلطعون بالبهارات", "Spiced Crab", "القشريات", 88, "🦀", {
        description: "سلطعون أزرق بصلصة البهارات الحارّة.",
        calories: 380,
        sodium_mg: 1240,
        allergens: ["قشريات"],
        available: false,
      }),
      dish("f7", "أرز صيادية", "Sayadieh Rice", "الأرز", 18, "🍚", {
        description: "أرز بالبصل المكرمل ومرق السمك.",
        calories: 360,
        sodium_mg: 540,
        allergens: ["سمك"],
      }),
      dish("f8", "ليمون بالنعناع", "Mint Lemonade", "المشروبات", 14, "🍋", {
        description: "ليمون طازج بالنعناع والثلج.",
        calories: 130,
        sodium_mg: 10,
      }),
      dish("f9", "شاي أحمر", "Black Tea", "المشروبات", 6, "🫖", {
        description: "شاي مخدّر بالنعناع.",
        calories: 30,
        sodium_mg: 5,
        caffeine_mg: 40,
      }),
    ],
  };
}

/* ── محلّ حلويات — لطابع «حلواني» ─────────────────────────────────────── */

function sweets(): DemoData {
  const R = "demo-sweets";
  const M = "demo-sweets-menu";
  const dish = dishMaker(R, M);
  return {
    restaurant: restaurantOf(R, {
      name: "حلويات بيت السكّر",
      type: "كيك وحلويات شرقية تُخبز كل صباح",
      address: "الرياض — حي الياسمين",
      logo: "🎂",
      allergens_text: "منتجاتنا تحتوي على جلوتين وحليب وبيض، وقد تحتوي على مكسرات.",
      working_hours: WEEK("09:00", "00:00", "01:00"),
      loyalty_goal: 8,
      loyalty_reward: "قطعة كيك مجاناً",
      prep_minutes: 10,
      category_order: JSON.stringify(["الكيك", "الحلويات الشرقية", "المعجّنات", "المشروبات"]),
    }),
    menus: [menuOf(R, M, "patisserie")],
    dishes: [
      dish("w1", "كيك الفستق بالورد", "Pistachio Rose Cake", "الكيك", 26, "🍰", {
        description: "إسفنج بالفستق الحلبي وكريمة الورد — قطعة.",
        featured: true,
        calories: 460,
        sodium_mg: 220,
        allergens: ["حليب", "بيض", "جلوتين", "مكسرات"],
      }),
      dish("w2", "تشيز كيك التوت", "Berry Cheesecake", "الكيك", 24, "🍓", {
        description: "تشيز كيك نيويورك بصوص التوت المشكّل.",
        calories: 430,
        sodium_mg: 310,
        allergens: ["حليب", "بيض", "جلوتين"],
      }),
      dish("w3", "كيكة التمر بالدبس", "Date Cake", "الكيك", 19, "🌰", {
        description: "كيكة تمر سكري بصوص دبس التمر.",
        calories: 390,
        sodium_mg: 260,
        allergens: ["حليب", "بيض", "جلوتين"],
      }),
      dish("w4", "كنافة نابلسية", "Knafeh", "الحلويات الشرقية", 28, "🧀", {
        description: "كنافة بالجبن الطازج والقطر — طبق فردي.",
        featured: true,
        calories: 520,
        sodium_mg: 380,
        allergens: ["حليب", "جلوتين"],
      }),
      dish("w5", "بسبوسة بالقشطة", "Basbousa", "الحلويات الشرقية", 15, "🍯", {
        description: "بسبوسة بالسميد محشوّة بالقشطة.",
        calories: 410,
        sodium_mg: 190,
        allergens: ["حليب", "جلوتين"],
      }),
      dish("w6", "معمول تمر — ٣ حبّات", "Date Maamoul", "الحلويات الشرقية", 12, "🍪", {
        description: "معمول بالسميد والتمر.",
        calories: 360,
        sodium_mg: 90,
        allergens: ["جلوتين", "حليب"],
        available: false,
      }),
      dish("w7", "كرواسون بالزعتر", "Zaatar Croissant", "المعجّنات", 11, "🥐", {
        description: "كرواسون بالزبدة والزعتر وزيت الزيتون.",
        calories: 330,
        sodium_mg: 450,
        allergens: ["حليب", "جلوتين", "بيض", "سمسم"],
      }),
      dish("w8", "قهوة سعودية", "Saudi Coffee", "المشروبات", 10, "☕", {
        description: "دلّة صغيرة بالهيل والزعفران.",
        calories: 15,
        sodium_mg: 5,
        caffeine_mg: 95,
      }),
      dish("w9", "حليب بالزعفران", "Saffron Milk", "المشروبات", 16, "🥛", {
        description: "حليب دافئ بالزعفران والهيل.",
        calories: 190,
        sodium_mg: 105,
        allergens: ["حليب"],
      }),
    ],
  };
}

/* ── محلّ عصير — لطابع «عصّارة» ──────────────────────────────────────── */

function juice(): DemoData {
  const R = "demo-juice";
  const M = "demo-juice-menu";
  const dish = dishMaker(R, M);
  return {
    restaurant: restaurantOf(R, {
      name: "عصيرات ليمونة",
      type: "عصير طازج وسموذي وسلطات",
      address: "الدمام — حي الشاطئ",
      logo: "🍊",
      allergens_text: "نحضّر في مكانٍ واحد مع الحليب والمكسرات.",
      working_hours: WEEK("10:00", "01:00", "02:00"),
      loyalty_goal: 6,
      loyalty_reward: "عصير مجاناً",
      prep_minutes: 7,
      category_order: JSON.stringify(["عصير طازج", "سموذي", "كوكتيلات", "سلطات"]),
    }),
    menus: [menuOf(R, M, "juice")],
    dishes: [
      dish("j1", "برتقال طازج", "Fresh Orange", "عصير طازج", 12, "🍊", {
        description: "برتقال معصور أمامك، ٤٠٠ مل بلا سكر مضاف.",
        featured: true,
        calories: 180,
        sodium_mg: 5,
      }),
      dish("j2", "ليمون بالنعناع", "Mint Lemonade", "عصير طازج", 11, "🍋", {
        description: "ليمون ونعناع وثلج مجروش.",
        calories: 130,
        sodium_mg: 10,
      }),
      dish("j3", "رمان طازج", "Fresh Pomegranate", "عصير طازج", 18, "🍷", {
        description: "رمان طائفي معصور، ٣٥٠ مل.",
        calories: 230,
        sodium_mg: 15,
      }),
      dish("j4", "سموذي مانجو وباشن", "Mango Passion Smoothie", "سموذي", 19, "🥭", {
        description: "مانجو وباشن فروت وزبادي.",
        calories: 290,
        sodium_mg: 70,
        allergens: ["حليب"],
        options: JSON.stringify([{ name: "بدون زبادي", price: 0 }, { name: "بروتين", price: 6, kcal: 120 }]),
      }),
      dish("j5", "سموذي توت وموز", "Berry Banana Smoothie", "سموذي", 19, "🫐", {
        description: "توت مشكّل وموز وحليب لوز.",
        calories: 260,
        sodium_mg: 90,
        allergens: ["مكسرات"],
      }),
      dish("j6", "كوكتيل ليمونة", "Laymouna Cocktail", "كوكتيلات", 21, "🍹", {
        description: "طبقات مانجو وفراولة وأفوكادو، بالقشطة والعسل والمكسرات.",
        featured: true,
        calories: 520,
        sodium_mg: 85,
        allergens: ["حليب", "مكسرات"],
      }),
      dish("j7", "أفوكادو بالعسل", "Avocado Honey", "كوكتيلات", 20, "🥑", {
        description: "أفوكادو بالحليب والعسل.",
        calories: 450,
        sodium_mg: 95,
        allergens: ["حليب"],
        available: false,
      }),
      dish("j8", "سلطة كينوا", "Quinoa Salad", "سلطات", 24, "🥗", {
        description: "كينوا وخضار وجبنة فيتا وصوص ليمون.",
        calories: 380,
        sodium_mg: 540,
        allergens: ["حليب"],
      }),
    ],
  };
}

/* ── محلّ برجر ووجبات سريعة — لطابع «صاج» (٢٠٢٦/١١/٠٧) ──────────────────────
 * غير «عربة دخّان»: تلك عربةٌ تتنقّل بثلاثة أقسام، وهذا محلّ سماش بوجباتٍ (برجر +
 * بطاطس + مشروب) — والوجبة سعرها أقلّ من مجموع أجزائها، وسعراتها مجموعها. */

function burger(): DemoData {
  const R = "demo-burger";
  const M = "demo-burger-menu";
  const dish = dishMaker(R, M);
  return {
    restaurant: restaurantOf(R, {
      name: "برجر الحارة",
      type: "سماش برجر ووجبات سريعة",
      address: "الخبر — شارع الأمير تركي",
      logo: "🍔",
      allergens_text: "خبزنا يحتوي على جلوتين وسمسم، وصوصاتنا على بيض وخردل، والمقليات كلّها في زيتٍ واحد.",
      working_hours: WEEK("12:00", "02:00", "03:00"),
      loyalty_goal: 7,
      loyalty_reward: "وجبة سماش مجاناً",
      prep_minutes: 12,
      category_order: JSON.stringify(["البرجر", "الوجبات", "الدجاج", "الجانبية", "المشروبات"]),
    }),
    menus: [menuOf(R, M, "burger")],
    dishes: [
      dish("b1", "سماش كلاسيك", "Classic Smash", "البرجر", 19, "🍔", {
        description: "قرص لحم مكبوس على الصاج، شيدر، بصل، مخلل، وصوص الحارة.",
        calories: 480,
        sodium_mg: 860,
        allergens: ["جلوتين", "حليب", "بيض", "سمسم", "خردل"],
        options: JSON.stringify([
          { name: "قرص لحم إضافي", price: 7, kcal: 220 },
          { name: "بدون بصل", price: 0 },
        ]),
      }),
      dish("b2", "دبل سماش بالجبن", "Double Cheese Smash", "البرجر", 27, "🍔", {
        description: "قرصان مكبوسان وشريحتا شيدر ذائب، بخبز البطاطس المحمّص بالزبدة.",
        featured: true,
        calories: 760,
        sodium_mg: 1340,
        allergens: ["جلوتين", "حليب", "بيض", "سمسم", "خردل"],
      }),
      dish("b3", "برجر الصاج الحار", "Spicy Griddle Burger", "البرجر", 26, "🌶️", {
        description: "لحم مع هالبينو مشوي، وجبن بيبرجاك، وصوص الشطّة.",
        calories: 690,
        sodium_mg: 1290,
        allergens: ["جلوتين", "حليب", "بيض", "سمسم"],
      }),
      dish("b4", "برجر الفطر والترافل", "Truffle Mushroom Burger", "البرجر", 32, "🍄", {
        description: "لحم أنقس، فطر مكرمل، جبن سويسري، ومايونيز الترافل.",
        calories: 780,
        sodium_mg: 1220,
        allergens: ["جلوتين", "حليب", "بيض", "سمسم"],
      }),
      dish("b5", "وجبة سماش", "Smash Combo", "الوجبات", 29, "🍟", {
        description: "سماش كلاسيك مع بطاطس وسط ومشروب غازي.",
        featured: true,
        // ٤٨٠ برجر + ٣٤٠ بطاطس + ١٤٠ مشروب — والصوديوم مجموعها كذلك.
        calories: 960,
        sodium_mg: 1310,
        allergens: ["جلوتين", "حليب", "بيض", "سمسم", "خردل"],
        options: JSON.stringify([
          { name: "كبّر البطاطس", price: 4, kcal: 140 },
          { name: "ميلك شيك بدل المشروب", price: 9, kcal: 380 },
        ]),
      }),
      dish("b6", "وجبة دبل", "Double Combo", "الوجبات", 36, "🍟", {
        description: "دبل سماش بالجبن مع بطاطس وسط ومشروب غازي.",
        calories: 1240,
        sodium_mg: 1790,
        allergens: ["جلوتين", "حليب", "بيض", "سمسم", "خردل"],
      }),
      dish("b7", "ساندويتش دجاج سبايسي", "Spicy Chicken Sandwich", "الدجاج", 22, "🍗", {
        description: "صدر دجاج متبّل ومقلي، كولسلو، ومخلل.",
        calories: 610,
        sodium_mg: 1250,
        allergens: ["جلوتين", "بيض", "حليب"],
      }),
      dish("b8", "تندر دجاج — ٥ قطع", "Chicken Tenders (5 pcs)", "الدجاج", 24, "🍗", {
        description: "قطع صدر مقرمشة مع صوص العسل والخردل.",
        calories: 540,
        sodium_mg: 1180,
        allergens: ["جلوتين", "بيض", "خردل"],
      }),
      dish("b9", "بطاطس مقلية", "Fries", "الجانبية", 9, "🍟", {
        description: "حجم وسط، بملح البحر.",
        calories: 340,
        sodium_mg: 420,
      }),
      dish("b10", "بطاطس بالجبن واللحم", "Loaded Fries", "الجانبية", 16, "🍟", {
        description: "بطاطس مع صوص الشيدر وقطع اللحم والهالبينو.",
        calories: 610,
        sodium_mg: 1080,
        allergens: ["حليب"],
        available: false,
      }),
      dish("b11", "ميلك شيك فانيلا", "Vanilla Shake", "المشروبات", 16, "🥤", {
        description: "آيس كريم فانيلا وحليب كامل الدسم — ٤٠٠ مل.",
        calories: 520,
        sodium_mg: 260,
        allergens: ["حليب"],
      }),
      dish("b12", "مشروب غازي", "Soft Drink", "المشروبات", 6, "🥤", {
        description: "٣٣٠ مل.",
        calories: 140,
        sodium_mg: 30,
      }),
      dish("b13", "مياه", "Water", "المشروبات", 2, "💧", {
        description: "٣٣٠ مل.",
        calories: 0,
        sodium_mg: 5,
      }),
    ],
  };
}

/* ── مخبز ومعجّنات — لطابع «فرن» (٢٠٢٦/١١/٠٧) ─────────────────────────────
 * غير «حلويات بيت السكّر»: ذاك كيكٌ وحلا شرقيّ بالقطعة، وهذا فرنُ حيٍّ قصيميّ —
 * فطائر بالقطعة بسعر الفرن (٤–٦ ريال)، وكرواسون، وخبزٌ من الفرن، وكليجا. و«الصينيّة»
 * أرخص من قطعها الاثنتي عشرة، وسعراتها وصوديومها مجموعها (يحرسه `demo-menus.test.ts`). */

function bakery(): DemoData {
  const R = "demo-bakery";
  const M = "demo-bakery-menu";
  const dish = dishMaker(R, M);
  return {
    restaurant: restaurantOf(R, {
      name: "مخبز السنابل",
      type: "فطائر ومعجّنات وكرواسون من الفرن كل صباح",
      address: "بريدة — حي الريان",
      logo: "🥐",
      allergens_text: "كلّ مخبوزاتنا فيها جلوتين، وأغلبها حليب وبيض وسمسم — ونخبز كلّها في فرنٍ واحد.",
      working_hours: WEEK("05:30", "23:30", "00:30"),
      loyalty_goal: 10,
      loyalty_reward: "كرواسون بالزبدة مجاناً",
      prep_minutes: 8,
      category_order: JSON.stringify(["الفطائر", "الكرواسون", "من الفرن", "حلا الفرن", "المشروبات"]),
    }),
    menus: [menuOf(R, M, "bakery")],
    dishes: [
      dish("k1", "فطيرة زعتر", "Zaatar Fatayer", "الفطائر", 4, "🥐", {
        description: "عجينة الفرن بالزعتر البلدي وزيت الزيتون والسمسم.",
        featured: true,
        calories: 260,
        sodium_mg: 430,
        allergens: ["جلوتين", "سمسم"],
      }),
      dish("k2", "فطيرة جبن", "Cheese Fatayer", "الفطائر", 5, "🧀", {
        description: "جبنة عكّاوي وموزاريلا على عجينةٍ مفتوحة.",
        calories: 310,
        sodium_mg: 560,
        allergens: ["جلوتين", "حليب"],
        options: JSON.stringify([
          { name: "زيادة جبن", price: 2, kcal: 80 },
          { name: "مع زعتر", price: 1, kcal: 30 },
        ]),
      }),
      dish("k3", "فطيرة سبانخ", "Spinach Fatayer", "الفطائر", 4, "🥬", {
        description: "سبانخ بالبصل والسمّاق والليمون، مثلّثةٌ كما تُخبز في البيت.",
        calories: 230,
        sodium_mg: 390,
        allergens: ["جلوتين"],
      }),
      dish("k4", "فطيرة لحم", "Meat Fatayer", "الفطائر", 6, "🥩", {
        description: "لحم مفروم بالطماطم والبصل والبهارات.",
        calories: 300,
        sodium_mg: 520,
        allergens: ["جلوتين"],
      }),
      dish("k5", "صينيّة فطائر — ١٢ حبّة", "Fatayer Tray (12 pcs)", "الفطائر", 45, "🥐", {
        description: "أربع زعتر وأربع جبن وأربع سبانخ — للعائلة والضيوف.",
        // ٤ × (٢٦٠ + ٣١٠ + ٢٣٠) — والصوديوم كذلك: للصينيّة كلّها لا للحبّة.
        calories: 3200,
        sodium_mg: 5520,
        allergens: ["جلوتين", "حليب", "سمسم"],
      }),
      dish("k6", "كرواسون بالزبدة", "Butter Croissant", "الكرواسون", 7, "🥐", {
        description: "سبعٌ وعشرون طبقة بالزبدة، يُخبز كل ساعتين.",
        featured: true,
        calories: 280,
        sodium_mg: 320,
        allergens: ["جلوتين", "حليب", "بيض"],
        options: JSON.stringify([{ name: "سخّنه", price: 0 }]),
      }),
      dish("k7", "كرواسون زعتر وجبنة", "Zaatar & Cheese Croissant", "الكرواسون", 9, "🥐", {
        description: "كرواسون بالزبدة محشوّ جبنةً بيضاء وزعتراً.",
        calories: 370,
        sodium_mg: 560,
        allergens: ["جلوتين", "حليب", "بيض", "سمسم"],
      }),
      dish("k8", "كرواسون بالشوكولاتة", "Chocolate Croissant", "الكرواسون", 9, "🍫", {
        description: "عودا شوكولاتة داكنة داخل العجينة.",
        calories: 390,
        sodium_mg: 280,
        allergens: ["جلوتين", "حليب", "بيض"],
        available: false,
      }),
      dish("k9", "شريك بالسمسم", "Sesame Shurayk", "من الفرن", 3, "🥯", {
        description: "حلقة الشريك بالسمسم والحبّة السوداء، طريّةٌ من الفرن.",
        calories: 290,
        sodium_mg: 330,
        allergens: ["جلوتين", "سمسم", "حليب"],
      }),
      dish("k10", "خبز بُرّ", "Whole Wheat Bread", "من الفرن", 2, "🍞", {
        description: "رغيف بُرّ قصيمي من الفرن الحجري.",
        calories: 240,
        sodium_mg: 380,
        allergens: ["جلوتين"],
      }),
      dish("k11", "كليجا — ٤ حبّات", "Kleija (4 pcs)", "حلا الفرن", 10, "🍪", {
        description: "كليجا القصيم بالتمر والهيل والقرفة.",
        calories: 440,
        sodium_mg: 190,
        allergens: ["جلوتين", "حليب", "بيض"],
      }),
      dish("k12", "كعك بالسمسم", "Sesame Kaak", "حلا الفرن", 6, "🥨", {
        description: "كعك هشّ بالسمسم والمحلب — خمس حلقات.",
        calories: 320,
        sodium_mg: 210,
        allergens: ["جلوتين", "سمسم", "حليب"],
      }),
      dish("k13", "كرك", "Karak", "المشروبات", 4, "☕", {
        description: "شاي بالحليب والهيل والزعفران، يُغلى على مهل.",
        calories: 150,
        sodium_mg: 60,
        caffeine_mg: 45,
        allergens: ["حليب"],
      }),
      dish("k14", "لبن بارد", "Cold Laban", "المشروبات", 4, "🥛", {
        description: "٢٥٠ مل.",
        calories: 120,
        sodium_mg: 140,
        allergens: ["حليب"],
      }),
    ],
  };
}

/* ── فطور شعبي — لطابع «فوّال» (٢٠٢٦/١١/٠٧) ────────────────────────────────
 * غير «بيت الحارة»: ذاك مندي ومظبي وفطورٌ قسمٌ بينها، وهذا فوّالٌ من الفجر — فول
 * وتميس وبيض ومطبّق وشاهي. و«صحن الحارة» فولٌ وتميسٌ وشاهي حليب، أرخص من أجزائه
 * وسعراته وصوديومه مجموعها (يحرسه `demo-menus.test.ts`). */

function breakfast(): DemoData {
  const R = "demo-breakfast";
  const M = "demo-breakfast-menu";
  const dish = dishMaker(R, M);
  // من الفجر إلى ما بعد العشاء، كلّ الأيام — فول العشاء عادةُ جدّة أيضاً.
  const hours = JSON.stringify(
    Object.fromEntries(["sat", "sun", "mon", "tue", "wed", "thu", "fri"].map((d) => [d, { open: true, from: "05:00", to: "01:00" }]))
  );
  return {
    restaurant: restaurantOf(R, {
      name: "فوّال باب مكة",
      type: "فول وتميس ومطبّق وشاهي حليب — من الفجر",
      address: "جدة — البلد، باب مكة",
      logo: "🫘",
      allergens_text: "التميس والمطبّق فيهما جلوتين وسمسم، والسمن البلدي من الحليب.",
      working_hours: hours,
      loyalty_goal: 8,
      loyalty_reward: "صحن الحارة مجاناً",
      prep_minutes: 6,
      category_order: JSON.stringify(["الفول", "التميس", "البيض", "المطبّق", "الشاهي"]),
    }),
    menus: [menuOf(R, M, "breakfast")],
    dishes: [
      dish("q1", "فول بالسمن", "Foul with Ghee", "الفول", 9, "🫘", {
        description: "فول مدمّس من القدرة، بالسمن البلدي والكمّون والشطّة.",
        calories: 380,
        sodium_mg: 640,
        allergens: ["حليب"],
        options: JSON.stringify([
          { name: "زيادة سمن", price: 2, kcal: 90 },
          { name: "بدون شطّة", price: 0 },
        ]),
      }),
      dish("q2", "فول بزيت الزيتون", "Foul with Olive Oil", "الفول", 8, "🫒", {
        description: "فول بزيت الزيتون والليمون والطماطم المقطّعة.",
        calories: 350,
        sodium_mg: 580,
      }),
      dish("q3", "فول بالطحينة", "Foul with Tahini", "الفول", 10, "🫘", {
        description: "فول بالطحينة والثوم والبقدونس.",
        calories: 450,
        sodium_mg: 620,
        allergens: ["سمسم"],
      }),
      dish("q4", "صحن الحارة", "Hara Breakfast Plate", "الفول", 12, "🫘", {
        description: "فول بالسمن وتميس كامل وشاهي حليب — فطورٌ واحد بسعرٍ واحد.",
        featured: true,
        // ٣٨٠ فول + ٤٣٠ تميس + ١١٠ شاهي — والصوديوم مجموعها كذلك.
        calories: 920,
        sodium_mg: 1290,
        allergens: ["حليب", "جلوتين", "سمسم"],
      }),
      dish("q5", "تميس", "Tamees", "التميس", 2, "🫓", {
        description: "تميس حارّ من التنّور بالسمسم والحبّة السوداء.",
        calories: 430,
        sodium_mg: 600,
        allergens: ["جلوتين", "سمسم"],
      }),
      dish("q6", "تميس بالجبن والعسل", "Tamees with Cheese & Honey", "التميس", 7, "🍯", {
        description: "تميس مفتوح بالجبنة البيضاء والعسل السدر.",
        featured: true,
        calories: 610,
        sodium_mg: 760,
        allergens: ["جلوتين", "سمسم", "حليب"],
      }),
      dish("q7", "شكشوكة", "Shakshuka", "البيض", 12, "🍳", {
        description: "بيض بالطماطم والفلفل والبصل في المقلاة.",
        calories: 330,
        sodium_mg: 780,
        allergens: ["بيض"],
      }),
      dish("q8", "بيض عيون بالسمن", "Fried Eggs in Ghee", "البيض", 9, "🍳", {
        description: "بيضتان بالسمن البلدي والفلفل الأسود.",
        calories: 280,
        sodium_mg: 360,
        allergens: ["بيض", "حليب"],
      }),
      dish("q9", "مطبّق لحم", "Meat Mutabbaq", "المطبّق", 14, "🥟", {
        description: "عجينة رقيقة محشوّة لحماً وبيضاً وكرّاثاً، على الصاج.",
        calories: 680,
        sodium_mg: 1120,
        allergens: ["جلوتين", "بيض"],
      }),
      dish("q10", "مطبّق موز", "Banana Mutabbaq", "المطبّق", 12, "🍌", {
        description: "موز وحليب مكثّف وعسل.",
        calories: 590,
        sodium_mg: 240,
        allergens: ["جلوتين", "حليب", "بيض"],
      }),
      dish("q11", "مطبّق جبن", "Cheese Mutabbaq", "المطبّق", 12, "🧀", {
        description: "جبنة بيضاء وموزاريلا وبيض.",
        calories: 620,
        sodium_mg: 880,
        allergens: ["جلوتين", "حليب", "بيض"],
        available: false,
      }),
      dish("q12", "شاهي حليب", "Milk Tea", "الشاهي", 3, "🫖", {
        description: "شاهي مخدّر بالحليب والهيل في استكانة.",
        calories: 110,
        sodium_mg: 50,
        caffeine_mg: 40,
        allergens: ["حليب"],
        options: JSON.stringify([
          { name: "استكانة كبيرة", price: 1, kcal: 55 },
          { name: "بدون سكر", price: 0 },
        ]),
      }),
      dish("q13", "شاهي أحمر بالنعناع", "Mint Tea", "الشاهي", 2, "🫖", {
        description: "شاهي أحمر بالنعناع الحساوي.",
        calories: 35,
        sodium_mg: 5,
        caffeine_mg: 35,
      }),
      dish("q14", "حليب بالزنجبيل", "Ginger Milk", "الشاهي", 4, "🥛", {
        description: "حليب ساخن بالزنجبيل والقرفة.",
        calories: 150,
        sodium_mg: 95,
        allergens: ["حليب"],
      }),
    ],
  };
}

/**
 * المنيو الذي يُعاين به طابعٌ ما وحده (`/demo?theme=…` من «عاينه كاملاً»):
 * منيوه إن كان له (`KIND_BY_THEME`)، وإلا أوّل نوعٍ في `suits` ⇒ منيو ذلك النوع.
 * فـ«مرفأ» يُعاين على مطعم أسماك لا على ستيك واقيو، و«حلواني» على حلويات. وما لا
 * نوع له ⇒ «الديوان».
 *
 * و«مطعم سريع» ⇒ محلّ البرجر لا العربة (٠٧/١١): أوّل طوابع النوع صار «صاج»،
 * فمنيو النوع منيوه. والعربة باقيةٌ لصفحة عربات الطعام (`segments.ts`) و`?kind=truck`.
 */
const KIND_BY_TYPE: Record<string, DemoKind> = {
  كافيه: "cafe",
  شعبي: "shaabi",
  "مطعم سريع": "burger",
  بحري: "seafood",
  "مخبز وحلويات": "sweets",
  عصائر: "juice",
};

/**
 * طابعٌ منيوه غير منيو نوعه الأوّل (٠٧/١١): «فرن» و«فوّال» شارتاهما «مخبز وحلويات»
 * و«شعبي» — ومنيو النوعين لـ«حلواني» و«نجدي». و«عسير» خرج من الشعبي وبقي يُعاين على
 * منيوه (المندي والإيدامات أقرب إليه من ستيك الديوان).
 */
const KIND_BY_THEME: Readonly<Record<string, DemoKind>> = {
  bakery: "bakery",
  breakfast: "breakfast",
  asir: "shaabi",
};

export function demoKindForSuits(suits: readonly string[] | undefined, themeId?: string | null): DemoKind {
  return (themeId ? KIND_BY_THEME[themeId] : undefined) ?? KIND_BY_TYPE[suits?.[0] ?? ""] ?? "restaurant";
}

const BUILDERS: Record<DemoKind, () => DemoData> = {
  restaurant: diwan,
  cafe,
  shaabi,
  truck,
  seafood,
  sweets,
  juice,
  burger,
  bakery,
  breakfast,
};

/** المنيو التجريبي لنوعٍ ما — والمجهول يسقط إلى «الديوان». */
export function demoData(kind: string | null | undefined): DemoData {
  return BUILDERS[isDemoKind(kind) ? kind : "restaurant"]();
}

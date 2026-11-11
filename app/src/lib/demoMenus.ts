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
  | "bakery" | "breakfast"
  | "grill" | "pizza"
  | "qahwa" | "espresso"
  | "karak" | "teahouse"
  | "broast";

export const DEMO_KINDS: readonly DemoKind[] = [
  "restaurant", "cafe", "shaabi", "truck", "seafood", "sweets", "juice", "burger", "bakery", "breakfast", "grill", "pizza",
  "qahwa", "espresso", "karak", "teahouse", "broast",
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
        description: "تقطير يدوي ٣٠٠ مل من محصول إثيوبي (يرغاتشيفي) — نوتات: ياسمين، ليمون، شاي أسود.",
        featured: true,
        calories: 3,
        sodium_mg: 5,
        caffeine_mg: 150,
      }),
      dish("c6", "كيمكس للمشاركة", "Chemex for Two", "تقطير", 32, "⚗️", {
        description: "٥٠٠ مل تكفي شخصين، من محصول كولومبي — نوتات: كراميل، تفّاح أحمر.",
        calories: 5,
        sodium_mg: 10,
        caffeine_mg: 250,
      }),
      dish("c7", "كولد برو", "Cold Brew", "باردة", 20, "🧊", {
        description: "منقوع ١٨ ساعة من محصول برازيلي، ٣٥٠ مل على الثلج — نوتات: كاكاو، بندق.",
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

/* ── مشويات وشاورما على الفحم — لطابع «جمر» (٢٠٢٦/١١/٠٧) ─────────────────────
 * غير «الديوان» (ستيكٌ وعشاءٌ فاخر) وغير «بيت الحارة» (مندي ومظبي): منقلُ حيٍّ في
 * الرياض — أسياخٌ بالحصّة (سيخان)، وشاورما بسعر الشارع، ومقبلات. و«المشكّل» حصّةٌ
 * من كلّ سيخ، أرخص من الثلاث وسعراته وصوديومه مجموعها (يحرسه `demo-menus.test.ts`)
 * — وصوديومه فوق حدّ الهيئة، فتظهر علامة الملح على صنفٍ حقيقيّ لا مصطنع. */

function grill(): DemoData {
  const R = "demo-grill";
  const M = "demo-grill-menu";
  const dish = dishMaker(R, M);
  return {
    restaurant: restaurantOf(R, {
      name: "مشويات المنقل",
      type: "مشويات وشاورما على الفحم",
      address: "الرياض — حي النسيم",
      logo: "🔥",
      allergens_text: "الخبز فيه جلوتين، والطحينة سمسم، وتتبيلة الطاووق فيها لبن — ونشوي كلّ الأسياخ على المنقل نفسه.",
      working_hours: WEEK("16:00", "01:00", "02:00"),
      loyalty_goal: 8,
      loyalty_reward: "سيخ كباب مجاناً",
      prep_minutes: 18,
      category_order: JSON.stringify(["المشويات", "الشاورما", "المقبلات", "المشروبات"]),
    }),
    menus: [menuOf(R, M, "grill")],
    dishes: [
      dish("g1", "كباب لحم", "Lamb Kebab", "المشويات", 32, "🍢", {
        description: "سيخان من لحم الغنم المفروم بالبصل والبقدونس، على الفحم، مع خبز وبصل بالسمّاق.",
        featured: true,
        calories: 620,
        sodium_mg: 980,
        allergens: ["جلوتين"],
        options: JSON.stringify([
          { name: "سيخ إضافي", price: 14, kcal: 260 },
          { name: "حار", price: 0 },
        ]),
      }),
      dish("g2", "شيش طاووق", "Shish Tawook", "المشويات", 28, "🍢", {
        description: "صدر دجاج متبّل باللبن والثوم والليمون، سيخان مع ثومية.",
        calories: 540,
        sodium_mg: 1100,
        allergens: ["حليب", "جلوتين"],
        options: JSON.stringify([{ name: "ثومية إضافية", price: 2, kcal: 90 }]),
      }),
      dish("g3", "تكّة لحم", "Lamb Tikka", "المشويات", 38, "🥩", {
        description: "مكعّبات لحم غنم متبّلة بالبهارات والبصل، سيخان.",
        calories: 580,
        sodium_mg: 760,
        allergens: ["جلوتين"],
      }),
      dish("g4", "ريش غنم", "Lamb Chops", "المشويات", 65, "🍖", {
        description: "ستّ ريشات على الفحم بالملح والفلفل الأسود.",
        calories: 720,
        sodium_mg: 640,
        available: false,
      }),
      dish("g5", "مشكّل مشاوي — لشخصين", "Mixed Grill for Two", "المشويات", 85, "🔥", {
        description: "حصّة كباب وحصّة طاووق وحصّة تكّة، مع خبز وطماطم وبصل مشوي.",
        // ٦٢٠ + ٥٤٠ + ٥٨٠ — والصوديوم ٩٨٠ + ١١٠٠ + ٧٦٠: فوق حدّ الهيئة (٢٠٠٠).
        calories: 1740,
        sodium_mg: 2840,
        allergens: ["جلوتين", "حليب"],
      }),
      dish("g6", "دجاج مشوي على الفحم", "Charcoal Chicken", "المشويات", 26, "🍗", {
        description: "نصف دجاجة متبّلة بالليمون والثوم، مع بطاطس وثومية.",
        calories: 680,
        sodium_mg: 1150,
        options: JSON.stringify([{ name: "حبّة كاملة", price: 22, kcal: 680 }]),
      }),
      dish("g16", "ستيك ريب آي على الفحم", "Charcoal Ribeye Steak", "المشويات", 79, "🥩", {
        description: "٣٠٠ غ من الريب آي على الفحم، بالملح والفلفل، مع بطاطس مشوية.",
        calories: 860,
        sodium_mg: 720,
      }),
      dish("g7", "شاورما لحم", "Meat Shawarma", "الشاورما", 12, "🌯", {
        description: "لحم من السيخ بالطحينة والبصل والبقدونس في خبز صاج.",
        featured: true,
        calories: 520,
        sodium_mg: 1250,
        allergens: ["جلوتين", "سمسم"],
      }),
      dish("g8", "شاورما دجاج", "Chicken Shawarma", "الشاورما", 10, "🌯", {
        description: "دجاج من السيخ بالثومية والمخلّل والبطاطس.",
        calories: 480,
        sodium_mg: 1180,
        allergens: ["جلوتين"],
        options: JSON.stringify([
          { name: "دبل لحم", price: 5, kcal: 180 },
          { name: "بدون مخلّل", price: 0 },
        ]),
      }),
      dish("g9", "صحن شاورما عربي", "Arabic Shawarma Plate", "الشاورما", 24, "🥙", {
        description: "شاورما دجاج مقطّعة مع بطاطس وثومية ومخلّل.",
        calories: 980,
        sodium_mg: 1960,
        allergens: ["جلوتين"],
      }),
      dish("g10", "حمّص", "Hummus", "المقبلات", 9, "🧆", {
        description: "حمّص بالطحينة وزيت الزيتون.",
        calories: 250,
        sodium_mg: 420,
        allergens: ["سمسم"],
      }),
      dish("g11", "متبّل", "Moutabal", "المقبلات", 10, "🍆", {
        description: "باذنجان مشوي على الفحم بالطحينة والليمون.",
        calories: 220,
        sodium_mg: 380,
        allergens: ["سمسم"],
      }),
      dish("g12", "سلطة بصل بالسمّاق", "Sumac Onion Salad", "المقبلات", 5, "🧅", {
        description: "بصل وبقدونس بالسمّاق ودبس الرمّان — رفيق كلّ سيخ.",
        calories: 60,
        sodium_mg: 290,
      }),
      dish("g13", "لبن", "Laban", "المشروبات", 4, "🥛", {
        description: "٢٥٠ مل.",
        calories: 120,
        sodium_mg: 140,
        allergens: ["حليب"],
      }),
      dish("g14", "ليمون بالنعناع", "Lemon Mint", "المشروبات", 9, "🍋", {
        description: "ليمون طازج بالنعناع والثلج.",
        calories: 150,
        sodium_mg: 10,
      }),
      dish("g15", "مشروب غازي", "Soft Drink", "المشروبات", 4, "🥤", {
        description: "علبة ٣٣٠ مل.",
        calories: 140,
        sodium_mg: 30,
      }),
    ],
  };
}

/* ── بيتزيريا — لطابع «ريحان» (٢٠٢٦/١١/٠٧) ───────────────────────────────────
 * غير «برجر الحارة»: بيتزا نابولية ١٢ إنش بسعر بيتزيريا حيٍّ في الخبر، ومعكرونة،
 * ومقبلات وحلى. و«عرض الاثنين» مارغريتا وأرابياتا وخبزٌ بالثوم، أرخص من الثلاثة
 * وسعراته وصوديومه مجموعها (يحرسه `demo-menus.test.ts`). وأسماء البيتزا تبدأ بـ
 * «بيتزا» حين يضلّل غيرها رمزَ الرسم («دجاج بيستو» دجاجٌ مقليّ في `foodGlyph`). */

function pizza(): DemoData {
  const R = "demo-pizza";
  const M = "demo-pizza-menu";
  const dish = dishMaker(R, M);
  return {
    restaurant: restaurantOf(R, {
      name: "بيتزيريا ريحانة",
      type: "بيتزا نابولية ومعكرونة طازجة",
      address: "الخبر — حي العقربية",
      logo: "🍕",
      allergens_text: "العجينة والمعكرونة فيهما جلوتين، وأغلب أصنافنا حليب — والبيستو فيه صنوبر.",
      working_hours: WEEK("13:00", "00:00", "01:00"),
      loyalty_goal: 8,
      loyalty_reward: "بيتزا مارغريتا مجاناً",
      prep_minutes: 15,
      category_order: JSON.stringify(["البيتزا", "المعكرونة", "المقبلات", "الحلى", "المشروبات"]),
    }),
    menus: [menuOf(R, M, "pizza")],
    dishes: [
      dish("p1", "مارغريتا", "Margherita", "البيتزا", 32, "🍕", {
        description: "صلصة طماطم وموزاريلا طازجة وريحان وزيت زيتون — ١٢ إنش.",
        featured: true,
        calories: 860,
        sodium_mg: 1650,
        allergens: ["جلوتين", "حليب"],
        options: JSON.stringify([
          { name: "موزاريلا مضاعفة", price: 8, kcal: 180 },
          { name: "فلفل حار", price: 2, kcal: 10 },
        ]),
      }),
      dish("p2", "بيبروني بقري", "Beef Pepperoni", "البيتزا", 42, "🍕", {
        description: "بيبروني بقري مدخّن على موزاريلا وصلصة طماطم.",
        calories: 1080,
        sodium_mg: 2350,
        allergens: ["جلوتين", "حليب"],
      }),
      dish("p3", "بيتزا الخضار المشوية", "Grilled Veggie Pizza", "البيتزا", 38, "🍕", {
        description: "كوسا وباذنجان وفلفل مشوي وزيتون أسود.",
        calories: 820,
        sodium_mg: 1380,
        allergens: ["جلوتين", "حليب"],
      }),
      dish("p4", "أربع أجبان", "Quattro Formaggi", "البيتزا", 46, "🍕", {
        description: "موزاريلا وغورغونزولا وبارميزان وريكوتا، بلا صلصة.",
        calories: 1180,
        sodium_mg: 1940,
        allergens: ["جلوتين", "حليب"],
      }),
      dish("p5", "بيتزا دجاج بيستو", "Chicken Pesto Pizza", "البيتزا", 44, "🍕", {
        description: "دجاج مشوي وبيستو الريحان وطماطم كرزية.",
        calories: 1020,
        sodium_mg: 1720,
        allergens: ["جلوتين", "حليب", "مكسرات"],
      }),
      dish("p6", "عرض الاثنين", "Pizza for Two", "البيتزا", 69, "🍕", {
        description: "مارغريتا وبيني أرابياتا وخبز بالثوم.",
        // ٨٦٠ + ٦٤٠ + ٣٨٠ — والصوديوم ١٦٥٠ + ٩٨٠ + ٥٢٠.
        calories: 1880,
        sodium_mg: 3150,
        allergens: ["جلوتين", "حليب"],
      }),
      dish("p7", "بيني أرابياتا", "Penne Arrabbiata", "المعكرونة", 34, "🍝", {
        description: "صلصة طماطم حارّة بالثوم والبقدونس.",
        calories: 640,
        sodium_mg: 980,
        allergens: ["جلوتين"],
      }),
      dish("p8", "فيتوتشيني ألفريدو بالدجاج", "Chicken Fettuccine Alfredo", "المعكرونة", 42, "🍝", {
        description: "كريمة وبارميزان وفطر ودجاج مشوي.",
        calories: 1050,
        sodium_mg: 1300,
        allergens: ["جلوتين", "حليب", "بيض"],
      }),
      dish("p9", "لازانيا لحم", "Beef Lasagna", "المعكرونة", 45, "🍝", {
        description: "طبقات لحم بقري بالصلصة وبشاميل وموزاريلا، من الفرن.",
        calories: 780,
        sodium_mg: 1250,
        allergens: ["جلوتين", "حليب", "بيض"],
        available: false,
      }),
      dish("p10", "خبز بالثوم", "Garlic Bread", "المقبلات", 14, "🥖", {
        description: "عجينة البيتزا بالزبدة والثوم والبقدونس.",
        calories: 380,
        sodium_mg: 520,
        allergens: ["جلوتين", "حليب"],
        options: JSON.stringify([{ name: "مع موزاريلا", price: 5, kcal: 140 }]),
      }),
      dish("p11", "سلطة كابريزي", "Caprese Salad", "المقبلات", 26, "🥗", {
        description: "طماطم وموزاريلا طازجة وريحان وزيت زيتون.",
        calories: 340,
        sodium_mg: 420,
        allergens: ["حليب"],
      }),
      dish("p12", "تيراميسو", "Tiramisu", "الحلى", 22, "🍰", {
        description: "بسكويت بالقهوة وكريمة ماسكاربوني وكاكاو.",
        calories: 420,
        sodium_mg: 110,
        caffeine_mg: 30,
        allergens: ["حليب", "بيض", "جلوتين"],
      }),
      dish("p13", "بانا كوتا بالتوت", "Berry Panna Cotta", "الحلى", 19, "🍮", {
        description: "كريمة مطبوخة بالفانيلا وصوص توت.",
        calories: 360,
        sodium_mg: 70,
        allergens: ["حليب"],
      }),
      dish("p14", "ليمونادة بالريحان", "Basil Lemonade", "المشروبات", 12, "🍋", {
        description: "ليمون طازج وريحان وثلج.",
        calories: 140,
        sodium_mg: 10,
      }),
      dish("p15", "إسبريسو", "Espresso", "المشروبات", 9, "☕", {
        description: "شوت واحد.",
        calories: 5,
        sodium_mg: 5,
        caffeine_mg: 63,
      }),
      dish("p16", "مياه فوّارة", "Sparkling Water", "المشروبات", 7, "💧", {
        description: "٥٠٠ مل.",
        calories: 0,
        sodium_mg: 15,
      }),
    ],
  };
}

/* ── قهوة سعودية وتمور — لطابع «دلّة» (٢٠٢٦/١١/٠٧) ──────────────────────────────
 * محلّ قهوةٍ في عنيزة: الدلّة بالحجم (٥٠٠ مل ولتر) والكوب للطريق، وخولاني جازان، وتمور
 * القصيم والأحساء، ولقيمات وكليجا. والكافيين تقديرٌ لتحميصٍ أشقر (≈ ٣٤٠ ملغم في اللتر —
 * أخفّ من الإسبريسو لكلّ مل وأكثر في الدلّة كلّها). و«ضيافة المجلس» دلّةٌ صغيرة وتمرٌ
 * ولقيمات، أرخص من الثلاثة وسعراتها وصوديومها مجموعها (`demo-menus.test.ts`). */

function qahwa(): DemoData {
  const R = "demo-qahwa";
  const M = "demo-qahwa-menu";
  const dish = dishMaker(R, M);
  const DALLAH = JSON.stringify([
    { name: "هيل زيادة", price: 0 },
    { name: "زعفران زيادة", price: 4 },
    { name: "قرنفل", price: 0 },
  ]);
  return {
    restaurant: restaurantOf(R, {
      name: "قهوة سعفة",
      type: "قهوة سعودية وتمور القصيم",
      address: "عنيزة — حي الملك فهد",
      logo: "☕",
      allergens_text: "الحلى فيها جلوتين وسمسم وحليب، والتمر المحشي فيه مكسرات — اسألنا قبل الطلب.",
      working_hours: WEEK("06:00", "00:00", "01:00"),
      loyalty_goal: 7,
      loyalty_reward: "دلّة صغيرة مجاناً",
      prep_minutes: 7,
      category_order: JSON.stringify(["القهوة السعودية", "التمور", "الحلى", "مشروبات أخرى"]),
    }),
    menus: [menuOf(R, M, "dallah")],
    dishes: [
      dish("a1", "دلّة قهوة سعودية — صغيرة", "Saudi Coffee Dallah — Small", "القهوة السعودية", 25, "☕", {
        description: "٥٠٠ مل تكفي ثلاثة أو أربعة، تحميصٌ أشقر بالهيل والزعفران، مع فناجينها.",
        featured: true,
        calories: 10,
        sodium_mg: 25,
        caffeine_mg: 170,
        options: DALLAH,
      }),
      dish("a2", "دلّة قهوة سعودية — كبيرة", "Saudi Coffee Dallah — Large", "القهوة السعودية", 45, "☕", {
        description: "لترٌ يكفي سبعةً أو ثمانية — للمجلس والعزايم.",
        calories: 20,
        sodium_mg: 50,
        caffeine_mg: 340,
        options: DALLAH,
      }),
      dish("a3", "قهوة خولاني", "Khawlani Coffee", "القهوة السعودية", 35, "☕", {
        description: "دلّة ٥٠٠ مل من بنّ خولاني جازان، تحميصٌ متوسّط بالهيل.",
        calories: 10,
        sodium_mg: 25,
        caffeine_mg: 190,
      }),
      dish("a4", "كوب قهوة سعودية", "Saudi Coffee Cup", "القهوة السعودية", 9, "☕", {
        description: "٢٥٠ مل للطريق، بالهيل.",
        calories: 5,
        sodium_mg: 12,
        caffeine_mg: 85,
      }),
      // نافدةٌ اليوم — الزعفران ينتهي، و«نفد اليوم» أصدق من أن يختفي الصنف.
      dish("a5", "قهوة بالزعفران", "Saffron Coffee", "القهوة السعودية", 30, "☕", {
        description: "دلّة ٥٠٠ مل بزعفرانٍ أكثر من المعتاد.",
        calories: 12,
        sodium_mg: 25,
        caffeine_mg: 170,
        available: false,
      }),
      dish("a6", "ضيافة المجلس", "Majlis Set", "القهوة السعودية", 42, "☕", {
        description: "دلّة صغيرة وصحن سكري ولقيمات بالدبس — لثلاثة أو أربعة.",
        featured: true,
        // ١٠ + ٢٨٠ + ٣٨٠ — والصوديوم ٢٥ + ٥ + ٢٠٠.
        calories: 670,
        sodium_mg: 230,
        caffeine_mg: 170,
        allergens: ["جلوتين", "سمسم"],
      }),
      dish("a7", "تمر سكري — صحن", "Sukkari Dates", "التمور", 12, "🌴", {
        description: "١٠٠ غ من سكري القصيم المفتّل.",
        calories: 280,
        sodium_mg: 5,
      }),
      dish("a8", "خلاص محشي بالمكسّرات", "Stuffed Khalas Dates", "التمور", 18, "🌰", {
        description: "١٠٠ غ خلاص الأحساء محشيٌّ باللوز والجوز.",
        calories: 380,
        sodium_mg: 5,
        allergens: ["مكسرات"],
      }),
      dish("a9", "تمر بالقشطة", "Dates with Cream", "التمور", 16, "🌴", {
        description: "سكري بالقشطة الطازجة والفستق.",
        calories: 340,
        sodium_mg: 45,
        allergens: ["حليب", "مكسرات"],
      }),
      dish("a10", "لقيمات بالدبس", "Luqaimat with Date Syrup", "الحلى", 14, "🍯", {
        description: "عشر لقيمات مقرمشة بدبس التمر والسمسم.",
        calories: 380,
        sodium_mg: 200,
        allergens: ["جلوتين", "سمسم"],
      }),
      dish("a11", "كليجا القصيم", "Kleicha", "الحلى", 10, "🍪", {
        description: "ثلاث حبّات بالتمر والهيل.",
        calories: 330,
        sodium_mg: 180,
        allergens: ["جلوتين", "حليب"],
      }),
      dish("a12", "معمول تمر", "Date Maamoul", "الحلى", 9, "🍪", {
        description: "حبّتان بالسمن البلدي.",
        calories: 260,
        sodium_mg: 90,
        allergens: ["جلوتين", "حليب"],
      }),
      dish("a13", "شاي بالنعناع — براد", "Mint Tea Pot", "مشروبات أخرى", 15, "🫖", {
        description: "٥٠٠ مل شاي أحمر بنعناع المدينة، والسكّر جانباً.",
        calories: 5,
        sodium_mg: 10,
        caffeine_mg: 90,
      }),
      dish("a14", "حليب بالزنجبيل", "Ginger Milk", "مشروبات أخرى", 10, "🥛", {
        description: "٢٥٠ مل حليب ساخن بالزنجبيل والهيل.",
        calories: 160,
        sodium_mg: 105,
        allergens: ["حليب"],
      }),
      dish("a15", "مياه", "Water", "مشروبات أخرى", 2, "💧", {
        description: "٣٣٠ مل.",
        calories: 0,
        sodium_mg: 5,
      }),
    ],
  };
}

/* ── إسبريسو بار — لطابع «باريستا» (٢٠٢٦/١١/٠٧) ─────────────────────────────────
 * غير «محمصة نخلة» (تقطيرٌ ومحاصيل وكيس بنّ): بارٌ في جدّة يبيع ما تصنعه الآلة — الشوت
 * وما يُبنى عليه من حليب. والكافيين **من الشوت**: ٦٣ ملغم للواحد و١٢٦ للدبل، والموكا
 * أكثر قليلاً بالشوكولاتة. واللاتيه ١٢٧ سعرة كما تحسبه الحاسبة (`recipe.test.ts`). و«عرض
 * الصباح» فلات وايت وكوكيز، أرخص من الاثنين وسعراته وصوديومه مجموعها. */

function espresso(): DemoData {
  const R = "demo-espresso";
  const M = "demo-espresso-menu";
  const dish = dishMaker(R, M);
  const MILK = JSON.stringify([
    { name: "حليب شوفان", price: 4, kcal: 25 },
    { name: "حليب لوز", price: 4 },
    { name: "شوت إضافي", price: 5, kcal: 3 },
  ]);
  return {
    restaurant: restaurantOf(R, {
      name: "رغوة",
      type: "إسبريسو بار — قهوة مختصّة",
      address: "جدة — حي الشاطئ",
      logo: "☕",
      allergens_text: "الحليب في أغلب مشروباتنا، والمخبوزات فيها جلوتين وبيض — وعندنا شوفان ولوز بديلاً.",
      working_hours: WEEK("07:00", "00:00", "01:00"),
      loyalty_goal: 9,
      loyalty_reward: "فلات وايت مجاناً",
      prep_minutes: 6,
      category_order: JSON.stringify(["إسبريسو", "بالحليب", "باردة", "مخبوزات"]),
    }),
    menus: [menuOf(R, M, "barista")],
    dishes: [
      dish("e1", "إسبريسو", "Espresso", "إسبريسو", 10, "☕", {
        description: "شوت ٣٠ مل من خلطة البيت: إثيوبي وبرازيلي.",
        calories: 2,
        sodium_mg: 5,
        caffeine_mg: 63,
      }),
      dish("e2", "دبل إسبريسو", "Doppio", "إسبريسو", 13, "☕", {
        description: "شوتان ٦٠ مل.",
        calories: 4,
        sodium_mg: 10,
        caffeine_mg: 126,
      }),
      dish("e3", "ماكياتو", "Macchiato", "إسبريسو", 14, "☕", {
        description: "دبل إسبريسو بلمسة رغوة.",
        calories: 15,
        sodium_mg: 18,
        caffeine_mg: 126,
        allergens: ["حليب"],
      }),
      dish("e4", "كورتادو", "Cortado", "إسبريسو", 15, "☕", {
        description: "دبل إسبريسو و٦٠ مل حليب مبخّر.",
        calories: 40,
        sodium_mg: 35,
        caffeine_mg: 126,
        allergens: ["حليب"],
      }),
      dish("e5", "فلات وايت", "Flat White", "بالحليب", 17, "☕", {
        description: "دبل ريستريتو و١٢٠ مل حليب مخمليّ — ورسمة توليب.",
        featured: true,
        calories: 80,
        sodium_mg: 60,
        caffeine_mg: 126,
        allergens: ["حليب"],
        options: MILK,
      }),
      dish("e6", "كابتشينو", "Cappuccino", "بالحليب", 17, "☕", {
        description: "دبل إسبريسو و١٥٠ مل حليب برغوةٍ كثيفة.",
        calories: 95,
        sodium_mg: 75,
        caffeine_mg: 126,
        allergens: ["حليب"],
        options: MILK,
      }),
      dish("e7", "لاتيه", "Latte", "بالحليب", 18, "☕", {
        description: "دبل إسبريسو و٢٠٠ مل حليب.",
        calories: 127,
        sodium_mg: 95,
        caffeine_mg: 126,
        allergens: ["حليب"],
        options: MILK,
      }),
      dish("e8", "موكا", "Mocha", "بالحليب", 21, "☕", {
        description: "لاتيه بصوص الشوكولاتة الداكنة.",
        calories: 230,
        sodium_mg: 130,
        caffeine_mg: 136,
        allergens: ["حليب"],
        options: MILK,
      }),
      dish("e9", "آيس لاتيه", "Iced Latte", "باردة", 19, "🧊", {
        description: "دبل إسبريسو وحليب بارد على الثلج.",
        calories: 120,
        sodium_mg: 90,
        caffeine_mg: 126,
        allergens: ["حليب"],
        options: MILK,
      }),
      dish("e10", "إسبريسو تونك", "Espresso Tonic", "باردة", 22, "🧊", {
        description: "دبل إسبريسو على مياه تونك وقشر برتقال.",
        calories: 60,
        sodium_mg: 20,
        caffeine_mg: 126,
      }),
      dish("e11", "آيس أمريكانو", "Iced Americano", "باردة", 15, "🧊", {
        description: "دبل إسبريسو وماء بارد على الثلج.",
        calories: 10,
        sodium_mg: 10,
        caffeine_mg: 126,
      }),
      dish("e12", "كوكيز بالشوكولاتة", "Chocolate Cookie", "مخبوزات", 9, "🍪", {
        description: "كوكيز طرية بقطع الشوكولاتة الداكنة.",
        calories: 220,
        sodium_mg: 160,
        allergens: ["حليب", "بيض", "جلوتين"],
      }),
      // نافدٌ اليوم — يُخبز صباحاً وينتهي قبل الظهر.
      dish("e13", "بان أو شوكولا", "Pain au Chocolat", "مخبوزات", 14, "🥐", {
        description: "معجّنات زبدة بعودين من الشوكولاتة.",
        calories: 300,
        sodium_mg: 250,
        allergens: ["حليب", "جلوتين", "بيض"],
        available: false,
      }),
      dish("e14", "باسك تشيز كيك", "Basque Cheesecake", "مخبوزات", 24, "🍰", {
        description: "تشيز كيك محروق الوجه، قوامه كريمي.",
        calories: 450,
        sodium_mg: 280,
        allergens: ["حليب", "بيض", "جلوتين"],
      }),
      dish("e15", "عرض الصباح: فلات وايت وكوكيز", "Morning Deal: Flat White & Cookie", "مخبوزات", 22, "☕", {
        description: "فلات وايت وكوكيز بالشوكولاتة.",
        // ٨٠ + ٢٢٠ — والصوديوم ٦٠ + ١٦٠.
        calories: 300,
        sodium_mg: 220,
        caffeine_mg: 126,
        allergens: ["حليب", "بيض", "جلوتين"],
      }),
    ],
  };
}

/* ── كشك كرك — لطابع «كرك» (٢٠٢٦/١١/٠٧) ─────────────────────────────────────────
 * عربة كركٍ على كورنيش الخبر تفتح العصر وتسهر: الكاسة ١٥٠ مل والكوب ٢٥٠ للطريق، والبراتا
 * والفطائر معها. والسعرات تقديرٌ لشايٍ أسود مغليّ بحليبٍ مبخّر (≈ ٤٠ مل في الكاسة) وملعقتي
 * سكّر: ≈ ٩٥ سعرة، والصوديوم من الحليب. والكافيين لشايٍ مغليٍّ ثقيل (≈ ٣٠ ملغم لكلّ ١٠٠ مل).
 * و«عرض السهرة» كاستان وبراتا بالجبن، أرخص من الثلاثة وسعراته وصوديومه مجموعها. */

function karak(): DemoData {
  const R = "demo-karak";
  const M = "demo-karak-menu";
  const dish = dishMaker(R, M);
  const KARAK = JSON.stringify([
    { name: "زعفران زيادة", price: 2 },
    { name: "هيل زيادة", price: 0 },
    { name: "حليب مكثّف محلّى", price: 1, kcal: 60 },
  ]);
  return {
    restaurant: restaurantOf(R, {
      name: "كرك سهر",
      type: "كشك كرك وشاي",
      address: "الخبر — الكورنيش",
      logo: "☕",
      allergens_text: "الكرك بالحليب، والبراتا والفطائر فيها جلوتين، وبعضها بيض وسمسم — اسألنا قبل الطلب.",
      working_hours: WEEK("16:00", "03:00", "04:00"),
      loyalty_goal: 10,
      loyalty_reward: "كاسة كرك مجاناً",
      prep_minutes: 4,
      category_order: JSON.stringify(["الكرك", "شاي وأعشاب", "البراتا والفطائر", "الحلى"]),
    }),
    menus: [menuOf(R, M, "karak")],
    dishes: [
      dish("k1", "كرك — كاسة", "Karak — Glass", "الكرك", 3, "🫖", {
        description: "١٥٠ مل شاي مغليّ بالحليب والهيل والزعفران، كما يُصبّ من البرّاد.",
        featured: true,
        calories: 95,
        sodium_mg: 45,
        caffeine_mg: 45,
        allergens: ["حليب"],
        options: KARAK,
      }),
      dish("k2", "كرك — كوب كبير", "Karak — Large Cup", "الكرك", 6, "🫖", {
        description: "٢٥٠ مل في كوب للطريق.",
        calories: 160,
        sodium_mg: 75,
        caffeine_mg: 75,
        allergens: ["حليب"],
        options: KARAK,
      }),
      dish("k3", "كرك زعفران", "Saffron Karak", "الكرك", 5, "🫖", {
        description: "كاسة ١٥٠ مل بزعفرانٍ أكثر.",
        calories: 100,
        sodium_mg: 45,
        caffeine_mg: 45,
        allergens: ["حليب"],
      }),
      dish("k4", "كرك زنجبيل", "Ginger Karak", "الكرك", 4, "🫖", {
        description: "كاسة ١٥٠ مل بالزنجبيل الطازج.",
        calories: 100,
        sodium_mg: 45,
        caffeine_mg: 45,
        allergens: ["حليب"],
      }),
      dish("k5", "كرك بدون سكر", "Karak, No Sugar", "الكرك", 3, "🫖", {
        description: "كاسة ١٥٠ مل، والسكّر جانباً لمن أراد.",
        calories: 60,
        sodium_mg: 45,
        caffeine_mg: 45,
        allergens: ["حليب"],
      }),
      // نافدٌ الليلة — الحليب المكثّف ينتهي، و«نفد اليوم» أصدق من أن يختفي الصنف.
      dish("k6", "كرك بالحليب المكثّف", "Condensed-Milk Karak", "الكرك", 4, "🫖", {
        description: "كاسة ١٥٠ مل، أحلى وأثقل.",
        calories: 150,
        sodium_mg: 60,
        caffeine_mg: 45,
        allergens: ["حليب"],
        available: false,
      }),
      dish("k8", "ترمس كرك — لتر", "Karak Thermos — 1 L", "الكرك", 18, "🫖", {
        description: "لترٌ في ترمس يكفي ستّة — للجلسة على البحر.",
        calories: 630,
        sodium_mg: 300,
        caffeine_mg: 300,
        allergens: ["حليب"],
      }),
      dish("k7", "عرض السهرة", "Late-Night Deal", "الكرك", 10, "🫖", {
        description: "كاستا كرك وبراتا بالجبن.",
        featured: true,
        // ٩٥ × ٢ + ٣٨٠ — والصوديوم ٤٥ × ٢ + ٥٦٠.
        calories: 570,
        sodium_mg: 650,
        caffeine_mg: 90,
        allergens: ["حليب", "جلوتين"],
      }),
      dish("t1", "شاي أحمر — كاسة", "Black Tea — Glass", "شاي وأعشاب", 2, "🫖", {
        description: "١٥٠ مل بملعقتي سكّر.",
        calories: 30,
        sodium_mg: 5,
        caffeine_mg: 30,
      }),
      dish("t2", "شاي بالنعناع", "Mint Tea", "شاي وأعشاب", 3, "🫖", {
        description: "كاسة ١٥٠ مل بنعناعٍ طازج.",
        calories: 30,
        sodium_mg: 5,
        caffeine_mg: 30,
      }),
      dish("t3", "شاي عدني", "Adeni Tea", "شاي وأعشاب", 4, "🫖", {
        description: "شاي بالحليب والهيل والقرنفل، كاسة ١٥٠ مل.",
        calories: 110,
        sodium_mg: 50,
        caffeine_mg: 40,
        allergens: ["حليب"],
      }),
      dish("t4", "زنجبيل بالليمون", "Ginger & Lemon", "شاي وأعشاب", 4, "🍋", {
        description: "٢٠٠ مل ساخن بالعسل — بلا كافيين.",
        calories: 45,
        sodium_mg: 5,
        caffeine_mg: 0,
      }),
      dish("b1", "براتا بالجبن", "Cheese Paratha", "البراتا والفطائر", 6, "🫓", {
        description: "براتا مقرمشة بجبنةٍ كريمية، مطويّة في ورق.",
        calories: 380,
        sodium_mg: 560,
        allergens: ["جلوتين", "حليب"],
      }),
      dish("b2", "براتا بالبيض", "Egg Paratha", "البراتا والفطائر", 6, "🫓", {
        description: "براتا ببيضةٍ وفلفل.",
        calories: 400,
        sodium_mg: 520,
        allergens: ["جلوتين", "بيض"],
      }),
      dish("b3", "براتا بالعسل", "Honey Paratha", "البراتا والفطائر", 5, "🫓", {
        description: "براتا ساخنة بالعسل والسمن.",
        calories: 360,
        sodium_mg: 380,
        allergens: ["جلوتين", "حليب"],
      }),
      dish("b4", "فطيرة زعتر", "Zaatar Pie", "البراتا والفطائر", 4, "🥙", {
        description: "زعتر بزيت الزيتون والسمسم.",
        calories: 300,
        sodium_mg: 480,
        allergens: ["جلوتين", "سمسم"],
      }),
      dish("b5", "سمبوسة خضار — ٣ حبّات", "Vegetable Samosa (3)", "البراتا والفطائر", 5, "🥟", {
        description: "بطاطس وبازلاء وبهارات.",
        calories: 270,
        sodium_mg: 420,
        allergens: ["جلوتين"],
      }),
      dish("s1", "كيك الشاي", "Tea Cake", "الحلى", 4, "🍰", {
        description: "شريحة كيك بالهيل والزعفران.",
        calories: 290,
        sodium_mg: 210,
        allergens: ["جلوتين", "بيض", "حليب"],
      }),
      dish("s2", "بسكويت شاي", "Tea Biscuits", "الحلى", 2, "🍪", {
        description: "خمس حبّات تُغمّس في الكرك.",
        calories: 140,
        sodium_mg: 90,
        allergens: ["جلوتين", "حليب"],
      }),
    ],
  };
}

/* ── بيت شاي تراثي — لطابع «سماور» (٢٠٢٦/١١/٠٧) ───────────────────────────────────
 * بيت شاي في المدينة المنورة: الاستكانة ١٠٠ مل بالسكّر، والإبريق ستّ استكانات والسكّر جانباً،
 * والنعناع والحبق من مزارع قباء، والحلى بقصم وحلاوة وغُريبة. والكافيين لشايٍ أسود مخدّر (≈ ٢٥
 * ملغم للاستكانة)، والأعشاب بلا كافيين — صفرٌ مكتوب لا خانةٌ فارغة. و«جلسة الشاي» إبريقٌ
 * وبقصم وحلاوة، أرخص من الثلاثة وسعراتها وصوديومها مجموعها. */

function teahouse(): DemoData {
  const R = "demo-teahouse";
  const M = "demo-teahouse-menu";
  const dish = dishMaker(R, M);
  const HERB = JSON.stringify([
    { name: "نعناع المدينة", price: 0 },
    { name: "حبق", price: 0 },
    { name: "هيل", price: 0 },
    { name: "زعفران", price: 3 },
  ]);
  return {
    restaurant: restaurantOf(R, {
      name: "بيت شاي الحبق",
      type: "بيت شاي تراثي",
      address: "المدينة المنورة — قباء",
      logo: "🫖",
      allergens_text: "الحلى فيها جلوتين وسمسم وحليب، والمكسّرات مكسّرات — اسألنا قبل الطلب.",
      working_hours: WEEK("15:00", "01:00", "02:00"),
      loyalty_goal: 8,
      loyalty_reward: "إبريق شاي مجاناً",
      prep_minutes: 5,
      category_order: JSON.stringify(["الشاي", "أعشاب ومشروبات", "الحلى والمكسّرات"]),
    }),
    menus: [menuOf(R, M, "samovar")],
    dishes: [
      dish("h1", "استكانة شاي", "Istikan of Tea", "الشاي", 2, "🫖", {
        description: "١٠٠ مل شاي مخدّر من السماور بملعقةٍ ونصف سكّر.",
        featured: true,
        calories: 25,
        sodium_mg: 3,
        caffeine_mg: 25,
        options: HERB,
      }),
      dish("h2", "إبريق شاي — ستّ استكانات", "Teapot — Six Glasses", "الشاي", 14, "🫖", {
        description: "٦٠٠ مل للجلسة، والسكّر جانباً.",
        calories: 5,
        sodium_mg: 15,
        caffeine_mg: 150,
        options: HERB,
      }),
      dish("h3", "شاي مخدّر", "Slow-Steeped Tea", "الشاي", 3, "🫖", {
        description: "استكانة يُترك شايها على السماور حتى يحمرّ.",
        calories: 25,
        sodium_mg: 3,
        caffeine_mg: 35,
      }),
      dish("h4", "شاي بالحبق", "Basil-Mint Tea", "الشاي", 3, "🌿", {
        description: "استكانة بحبق المدينة.",
        calories: 25,
        sodium_mg: 3,
        caffeine_mg: 25,
      }),
      // نافدٌ الآن — الجمر يُوقد بعد المغرب، و«نفد اليوم» أصدق من أن يختفي الصنف.
      dish("h5", "شاي على الجمر", "Ember-Brewed Tea", "الشاي", 4, "🫖", {
        description: "يغلي في برّادٍ على الفحم فيأخذ دخانه.",
        calories: 25,
        sodium_mg: 3,
        caffeine_mg: 30,
        available: false,
      }),
      dish("h6", "شاي زعفران", "Saffron Tea", "الشاي", 5, "🫖", {
        description: "استكانة بخيوط زعفران.",
        calories: 27,
        sodium_mg: 3,
        caffeine_mg: 25,
      }),
      dish("h7", "شاي أخضر بالنعناع", "Green Tea with Mint", "الشاي", 3, "🍵", {
        description: "استكانة شاي أخضر بالنعناع وملعقة سكّر.",
        calories: 18,
        sodium_mg: 2,
        caffeine_mg: 20,
      }),
      dish("e1", "بابونج", "Chamomile", "أعشاب ومشروبات", 6, "🌼", {
        description: "إبريق صغير ٢٠٠ مل بالعسل جانباً — بلا كافيين.",
        calories: 2,
        sodium_mg: 2,
        caffeine_mg: 0,
      }),
      dish("e2", "زنجبيل وقرفة", "Ginger & Cinnamon", "أعشاب ومشروبات", 6, "🫚", {
        description: "٢٠٠ مل — بلا كافيين.",
        calories: 4,
        sodium_mg: 3,
        caffeine_mg: 0,
      }),
      dish("e3", "سحلب", "Sahlab", "أعشاب ومشروبات", 9, "🥛", {
        description: "٢٥٠ مل حليب بالسحلب والقرفة والفستق.",
        calories: 220,
        sodium_mg: 110,
        allergens: ["حليب", "مكسرات"],
      }),
      dish("d1", "بقصم المدينة — ٤ حبّات", "Madinah Buqsum (4)", "الحلى والمكسّرات", 6, "🥨", {
        description: "كعكٌ مقرمش بالسمسم يُغمّس في الشاي.",
        calories: 220,
        sodium_mg: 160,
        allergens: ["جلوتين", "سمسم"],
      }),
      dish("d2", "حلاوة طحينية", "Tahini Halva", "الحلى والمكسّرات", 7, "🍯", {
        description: "٥٠ غ حلاوة بالفستق.",
        calories: 260,
        sodium_mg: 95,
        allergens: ["سمسم", "مكسرات"],
      }),
      dish("d3", "غُريبة — ٣ حبّات", "Ghraybeh (3)", "الحلى والمكسّرات", 6, "🍪", {
        description: "بالسمن البلدي والهيل.",
        calories: 270,
        sodium_mg: 60,
        allergens: ["جلوتين", "حليب"],
      }),
      dish("d4", "مكسّرات مشكّلة", "Mixed Nuts", "الحلى والمكسّرات", 8, "🌰", {
        description: "٥٠ غ لوز وكاجو وفستق محمّص.",
        calories: 300,
        sodium_mg: 180,
        allergens: ["مكسرات"],
      }),
      dish("x1", "جلسة الشاي", "Tea Majlis Set", "الشاي", 24, "🫖", {
        description: "إبريق شاي وبقصم وحلاوة طحينية — لثلاثة أو أربعة.",
        featured: true,
        // ٥ + ٢٢٠ + ٢٦٠ — والصوديوم ١٥ + ١٦٠ + ٩٥.
        calories: 485,
        sodium_mg: 270,
        caffeine_mg: 150,
        allergens: ["جلوتين", "سمسم", "مكسرات"],
      }),
    ],
  };
}

/* ── بروست ودجاج مقلي — لطابع «سطل» (٢٠٢٦/١١/١١) ─────────────────────────────
 * محلّ بروست في الحيّ: القطع بالعدد والحرّاق بدرجاته، ووجباتٌ بالبطاطس والصوص، وساندويتشات، والصوصات
 * تُشترى وحدها مع الإضافات (أقسامٌ يعرف `CANON` رموزها — «الحرّاق» و«الصوصات» بلا رمز طعام).
 * و«وجبة ٤ قطع» أرخص من أجزائها، وسعراتها وصوديومها مجموعها (يحرسه `demo-menus.test.ts`). */

function broast(): DemoData {
  const R = "demo-broast";
  const M = "demo-broast-menu";
  const dish = dishMaker(R, M);
  return {
    restaurant: restaurantOf(R, {
      name: "قرمشة",
      type: "بروست ودجاج مقلي",
      address: "الدمام — حي الشاطئ",
      logo: "🍗",
      allergens_text: "التتبيلة والطحين فيهما جلوتين وحليب، والصوصات فيها بيض وخردل — ونقلي كلّ شيءٍ في الزيت نفسه.",
      working_hours: WEEK("12:00", "01:00", "02:00"),
      loyalty_goal: 6,
      loyalty_reward: "وجبة ٤ قطع مجاناً",
      prep_minutes: 10,
      category_order: JSON.stringify(["البروست", "الوجبات", "الساندويتشات", "الإضافات", "المشروبات"]),
    }),
    menus: [menuOf(R, M, "bucket")],
    dishes: [
      dish("k1", "بروست ٤ قطع", "Broast — 4 pcs", "البروست", 24, "🍗", {
        description: "أربع قطع دجاج متبّلة ١٢ ساعة، مقرمشة من الخارج وطريّة من الداخل.",
        featured: true,
        calories: 920,
        sodium_mg: 1680,
        allergens: ["جلوتين", "حليب"],
        options: JSON.stringify([
          { name: "صدر بدل فخذ", price: 3, kcal: 40 },
          { name: "خبز إضافي", price: 1, kcal: 160 },
        ]),
      }),
      dish("k2", "بروست ٨ قطع — عائلي", "Family Broast — 8 pcs", "البروست", 44, "🍗", {
        description: "ثماني قطع مع خبز وثومية — تكفي ثلاثة.",
        calories: 1840,
        sodium_mg: 3360,
        allergens: ["جلوتين", "حليب", "بيض"],
      }),
      dish("k3", "ستربس — ٥ قطع", "Strips — 5 pcs", "البروست", 22, "🍗", {
        description: "شرائح صدر بلا عظم بطبقة كرسبي.",
        calories: 610,
        sodium_mg: 1240,
        allergens: ["جلوتين", "حليب", "بيض"],
      }),
      dish("k4", "بروست حرّاق ٤ قطع", "Hot Broast — 4 pcs", "البروست", 26, "🌶️", {
        description: "القطع نفسها بتتبيلة الشطّة والفلفل الأحمر — حرارةٌ متوسّطة.",
        calories: 940,
        sodium_mg: 1790,
        allergens: ["جلوتين", "حليب"],
        options: JSON.stringify([
          { name: "حرّاق نار", price: 0 },
          { name: "حرّاق خفيف", price: 0 },
        ]),
      }),
      dish("k5", "أجنحة حارّة — ٨ قطع", "Hot Wings — 8 pcs", "البروست", 21, "🌶️", {
        description: "أجنحة مقلية مغموسة بصوص الحارّ والعسل.",
        calories: 720,
        sodium_mg: 1520,
        allergens: ["جلوتين"],
      }),
      dish("k6", "وجبة ٤ قطع", "4-pc Meal", "الوجبات", 31, "🍟", {
        description: "بروست ٤ قطع مع بطاطس وسط وثومية ومشروب غازي.",
        featured: true,
        // ٩٢٠ بروست + ٣٤٠ بطاطس + ٩٠ ثومية + ١٤٠ مشروب — والصوديوم كذلك.
        calories: 1490,
        sodium_mg: 2300,
        allergens: ["جلوتين", "حليب", "بيض"],
      }),
      dish("k7", "ساندويتش بروست", "Broast Sandwich", "الساندويتشات", 14, "🥪", {
        description: "قطعتا صدر في خبز صامولي مع كولسلو ومخلل.",
        calories: 560,
        sodium_mg: 1180,
        allergens: ["جلوتين", "حليب", "بيض"],
      }),
      dish("k13", "لفافة بروست حرّاق", "Hot Broast Wrap", "الساندويتشات", 15, "🌯", {
        description: "ستربس حرّاق في خبز تورتيلا مع خسّ وصوص حارّ ومخلل.",
        calories: 590,
        sodium_mg: 1320,
        allergens: ["جلوتين", "حليب", "بيض"],
      }),
      dish("k8", "بطاطس مقلية", "Fries", "الإضافات", 7, "🍟", {
        description: "حجم وسط بملح البحر والبابريكا.",
        calories: 340,
        sodium_mg: 420,
      }),
      dish("k9", "ثومية", "Garlic Dip", "الإضافات", 2, "🧄", {
        description: "ثومية بيضاء كثيفة — ٥٠ مل.",
        calories: 90,
        sodium_mg: 180,
        allergens: ["بيض"],
      }),
      dish("k10", "صوص حارّ", "Hot Sauce", "الإضافات", 2, "🌶️", {
        description: "شطّة حمراء بالخلّ والثوم — ٥٠ مل.",
        calories: 25,
        sodium_mg: 410,
      }),
      dish("k11", "صوص عسل وخردل", "Honey Mustard", "الإضافات", 3, "🍯", {
        description: "عسل وخردل حبوب — ٥٠ مل.",
        calories: 110,
        sodium_mg: 160,
        allergens: ["خردل"],
        available: false,
      }),
      dish("k12", "مشروب غازي", "Soft Drink", "المشروبات", 4, "🥤", {
        description: "٣٣٠ مل.",
        calories: 140,
        sodium_mg: 20,
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
  // ٠٧/١١: النوع التاسع — منيوه كشك الكرك، طابعُه «كرك» أوّلُ صفّه.
  شاي: "karak",
};

/**
 * طابعٌ منيوه غير منيو نوعه الأوّل (٠٧/١١): «فرن» و«فوّال» شارتاهما «مخبز وحلويات»
 * و«شعبي» — ومنيو النوعين لـ«حلواني» و«نجدي». و«عسير» خرج من الشعبي وبقي يُعاين على
 * منيوه (المندي والإيدامات أقرب إليه من ستيك الديوان).
 *
 * و«جمر» و«ريحان» شارتاهما «مشويات» و«مطعم» — ولا منيو لنوعيهما (فيعاينهما «الديوان»).
 * و«مشويات» **لا** تُضاف إلى `KIND_BY_TYPE`: «فاخر» شارته الأولى «مشويات»، فيصير
 * منيوه منيو المنقل لا ستيك الديوان.
 *
 * و«دلّة» و«باريستا» (٠٧/١١) شارتهما «كافيه» ومنيو الكافيه لـ«محمصة» — فلكلٍّ منيوه. و«لوحة
 * حروف» و«عصري» تبدّلت شارتاهما معهما (`themeSuggest`) وبقي كلٌّ يُعاين على منيوه كما كان.
 *
 * و«كرك» و«سماور» (٠٧/١١) شارتهما «شاي»، ومنيو النوع (`KIND_BY_TYPE`) كشك الكرك — فـ«كرك» يُعاين
 * عليه بلا سطرٍ هنا، و«سماور» على بيت الشاي.
 *
 * و«دلّة» و«لوحة حروف» تبدّلت شارتاهما (٠٩/١١: «شعبي» و«عصائر») وبقي كلٌّ على منيوه بسطره.
 */
const KIND_BY_THEME: Readonly<Record<string, DemoKind>> = {
  bakery: "bakery",
  breakfast: "breakfast",
  asir: "shaabi",
  grill: "grill",
  pizza: "pizza",
  dallah: "qahwa",
  barista: "espresso",
  letterboard: "cafe",
  modern: "juice",
  samovar: "teahouse",
  // ٠٩/١١: طوابع القهوة الأربعة على منيوَي القهوة القائمين — بلا منيو جديد: «تقطير» و«مطحنة»
  // على المحمصة (قسم التقطير ومحاصيله)، و«لاتيه» و«درايف» على «رغوة» (الشوت وما يُبنى عليه).
  v60: "cafe",
  grinder: "cafe",
  latte: "espresso",
  drive: "espresso",
  // ٠٩/١١: طوابع البيتزا الأربعة على منيو البيتزا القائم — بلا منيو جديد. و«نيون» و«ملصقات» تبدّلت
  // شارتاهما (`themeSuggest`) وبقي كلٌّ يُعاين على منيوه كما كان: البرجر والعصير.
  woodfire: "pizza",
  pizzabox: "pizza",
  slices: "pizza",
  napoli: "pizza",
  neon: "burger",
  sticker: "juice",
  // ٠٩/١١ (الموجة ٣): «شاورما» على منيو المشاوي القائم. (وأُضيف إليه يومها «ستيك ريب آي على الفحم» و«بريسكت
  // مدخّن» لـ«ستيك» و«مدخنة»؛ وحُذف الطابعان ١١/١١ فسقط البريسكت وبقي الريب آي — على الفحم، يخدم «جمر».)
  shawarma: "grill",
  // ١١/١١: «سطل» على منيو البروست — نوعٌ جديد بأقلّ ما يلزم (بروست وحرّاق · وجبات · ساندويتشات · صوصات).
  bucket: "broast",
  // ١١/١١: «سماش» على منيو البرجر القائم («برجر الحارة» سماشٌ أصلاً) — شارته «برجر» لا نوعٌ له منيو.
  smash: "burger",
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
  grill,
  pizza,
  qahwa,
  espresso,
  karak,
  teahouse,
  broast,
};

/** المنيو التجريبي لنوعٍ ما — والمجهول يسقط إلى «الديوان». */
export function demoData(kind: string | null | undefined): DemoData {
  return BUILDERS[isDemoKind(kind) ? kind : "restaurant"]();
}

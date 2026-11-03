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

export type DemoKind = "restaurant" | "cafe" | "shaabi" | "truck" | "seafood" | "sweets" | "juice";

export const DEMO_KINDS: readonly DemoKind[] = ["restaurant", "cafe", "shaabi", "truck", "seafood", "sweets", "juice"];

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

/**
 * المنيو الذي يُعاين به طابعٌ ما وحده (`/demo?theme=…` من «عاينه كاملاً»):
 * أوّل نوعٍ في `suits` ⇒ منيو ذلك النوع. فـ«مرفأ» يُعاين على مطعم أسماك لا على
 * ستيك واقيو، و«حلواني» على حلويات. وما لا نوع له ⇒ «الديوان».
 */
const KIND_BY_TYPE: Record<string, DemoKind> = {
  كافيه: "cafe",
  شعبي: "shaabi",
  "مطعم سريع": "truck",
  بحري: "seafood",
  "مخبز وحلويات": "sweets",
  عصائر: "juice",
};

export function demoKindForSuits(suits: readonly string[] | undefined): DemoKind {
  return KIND_BY_TYPE[suits?.[0] ?? ""] ?? "restaurant";
}

const BUILDERS: Record<DemoKind, () => DemoData> = { restaurant: diwan, cafe, shaabi, truck, seafood, sweets, juice };

/** المنيو التجريبي لنوعٍ ما — والمجهول يسقط إلى «الديوان». */
export function demoData(kind: string | null | undefined): DemoData {
  return BUILDERS[isDemoKind(kind) ? kind : "restaurant"]();
}

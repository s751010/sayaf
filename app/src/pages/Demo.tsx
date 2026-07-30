/**
 * منيو تجريبي حيّ على `/demo`.
 *
 * يعيد استخدام `MenuPage` نفسها ببيانات محقونة — لا شبكة، ولا تتبّع مشاهدات،
 * ولا صف في قاعدة البيانات. العميل المحتمل يجرّب التجربة الحقيقية كاملة (بحث،
 * تصنيفات، تفاصيل الطبق، الإضافات، بطاقة الولاء) قبل أن يسجّل.
 */
import { Link } from "react-router-dom";
import { useEffect } from "react";
import MenuPage, { type MenuData } from "./MenuPage";
import type { Dish, Menu, Restaurant } from "@/lib/types";

const DEMO_TS = "2026-01-01T00:00:00.000Z";
const RESTAURANT_ID = "demo-restaurant";
const MENU_ID = "demo-menu";

const restaurant: Restaurant = {
  id: RESTAURANT_ID,
  user_id: "demo-user",
  name: "مطعم الديوان",
  type: "مأكولات سعودية معاصرة",
  phone: null,
  address: "الرياض — حي الملقا",
  logo: "🍽️",
  cover_color: "#1d1a14",
  logo_image: null,
  banner_image: null,
  created_at: DEMO_TS,
  slug: "demo",
  payment_gateway: null,
  payment_key: null,
  google_review_url: "https://www.google.com/maps",
  allergens_text: "تُحضَّر أطباقنا في مطبخ يحتوي على مكسرات وجلوتين.",
  // جدول مهيكل كي يُظهر الديمو حالة «مفتوح الآن» وشاشة الساعات كاملة.
  working_hours: JSON.stringify({
    sat: { open: true, from: "12:00", to: "01:00" },
    sun: { open: true, from: "12:00", to: "01:00" },
    mon: { open: true, from: "12:00", to: "01:00" },
    tue: { open: true, from: "12:00", to: "01:00" },
    wed: { open: true, from: "12:00", to: "01:00" },
    thu: { open: true, from: "12:00", to: "02:00" },
    fri: { open: true, from: "13:00", to: "02:00" },
  }),
  social_instagram: "https://instagram.com",
  social_twitter: null,
  social_tiktok: null,
  social_snapchat: null,
  social_whatsapp: "966500000000",
  social_maps: "https://maps.google.com",
  english_enabled: true,
  loyalty_enabled: true,
  loyalty_goal: 6,
  loyalty_reward: "قهوة سعودية مجاناً",
  reviews_enabled: true,
  online_payment_enabled: false,
};

const menus: Menu[] = [
  {
    id: MENU_ID,
    restaurant_id: RESTAURANT_ID,
    user_id: "demo-user",
    name: "القائمة الرئيسية",
    description: null,
    theme: "royal",
    active: true,
    views: 0,
    created_at: DEMO_TS,
    language: null,
    cover_image: null,
  },
];

/** يبني طبقاً كاملاً بأقل تكرار — البقية افتراضات معقولة. */
function dish(
  id: string,
  name: string,
  name_en: string,
  category: string,
  price: number,
  emoji: string,
  extra: Partial<Dish> = {}
): Dish {
  return {
    id,
    menu_id: MENU_ID,
    restaurant_id: RESTAURANT_ID,
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
    views: 0,
    created_at: DEMO_TS,
    calories: null,
    sodium_mg: null,
    caffeine_mg: null,
    burn_minutes: null,
    is_high_sodium: null,
    allergens: null,
    sfda_compliant: null,
    options: null,
    ...extra,
  };
}

const dishes: Dish[] = [
  dish("d1", "ستيك واقيو مشوي", "Grilled Wagyu Steak", "المشاوي", 189, "🥩", {
    description: "قطعة واقيو درجة A5 على الفحم، مع زبدة الأعشاب وبطاطس مهروسة.",
    description_en: "A5 Wagyu over charcoal, herb butter and truffle mash.",
    featured: true,
    calories: 620,
    sodium_mg: 780,
    burn_minutes: 95,
    allergens: ["حليب"],
    sfda_compliant: true,
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
    burn_minutes: 82,
    allergens: ["قشريات", "سمسم", "جلوتين"],
    options: JSON.stringify([{ name: "حار إضافي", price: 0 }, { name: "صوص جانبي", price: 6 }]),
  }),
  dish("d3", "سلطة البرّاتا والرمان", "Burrata & Pomegranate", "المقبلات", 52, "🥗", {
    description: "برّاتا طازجة مع الرمان والجرجير وزيت الزيتون البكر.",
    calories: 310,
    allergens: ["حليب"],
  }),
  dish("d4", "كبسة لحم الديوان", "Diwan Lamb Kabsa", "الأطباق الرئيسية", 95, "🍚", {
    description: "أرز بسمتي بالبهارات السعودية مع لحم ضأن طري ومكسرات.",
    featured: true,
    calories: 880,
    sodium_mg: 1150,
    burn_minutes: 132,
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
    burn_minutes: 108,
  }),
  dish("d6", "شكشوكة الصباح", "Morning Shakshuka", "الإفطار", 38, "🍳", {
    description: "بيض في صلصة الطماطم والفلفل، مع خبز التنور.",
    calories: 420,
    allergens: ["بيض", "جلوتين"],
  }),
  dish("d7", "كنافة بالقشطة", "Kunafa with Cream", "الحلويات", 42, "🍰", {
    description: "كنافة ناعمة بالقشطة الطازجة والفستق الحلبي.",
    calories: 560,
    allergens: ["حليب", "مكسرات", "جلوتين"],
  }),
  dish("d8", "قهوة سعودية بالهيل", "Saudi Coffee", "المشروبات", 18, "☕", {
    description: "قهوة عربية محمّصة فاتحة بالهيل والزعفران، تُقدَّم مع التمر.",
    calories: 15,
    caffeine_mg: 95,
    sfda_compliant: true,
  }),
  dish("d9", "ليمون ونعناع", "Mint Lemonade", "المشروبات", 24, "🍹", {
    description: "عصير ليمون طازج مع النعناع والثلج المجروش.",
    calories: 130,
  }),
  dish("d10", "تمر مع جبن قشقوان", "Dates & Cheese", "الحلويات", 29, "🌰", {
    description: "تمر سكري محشو بالجبن، طبق سعودي بسيط.",
    calories: 240,
    allergens: ["حليب"],
    available: true,
  }),
];

const DEMO: MenuData = { restaurant, menus, dishes };

export default function Demo() {
  useEffect(() => {
    document.title = "منيو تجريبي — كلاود منيو";
  }, []);

  return (
    <div className="relative">
      {/* شريط علوي يوضّح أن هذا عرض تجريبي ويعيد الزائر إلى التسجيل. */}
      <div className="sticky top-0 z-40 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-line bg-panel/95 px-4 py-2 text-center backdrop-blur">
        <span className="text-xs font-bold text-dim">
          👋 هذا منيو تجريبي — جرّبه كما يراه زبونك تماماً.
        </span>
        <Link
          to="/login?mode=signup"
          className="text-xs font-black text-gold hover:underline"
        >
          أنشئ منيوك مجاناً →
        </Link>
      </div>

      <MenuPage demo={DEMO} />
    </div>
  );
}

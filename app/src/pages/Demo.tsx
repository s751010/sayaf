/**
 * منيو تجريبي حيّ على `/demo`.
 *
 * يعيد استخدام `MenuPage` نفسها ببيانات محقونة — لا شبكة، ولا تتبّع مشاهدات،
 * ولا صف في قاعدة البيانات. العميل المحتمل يجرّب التجربة الحقيقية كاملة (بحث،
 * تصنيفات، تفاصيل الطبق، الإضافات، بطاقة الولاء) قبل أن يسجّل.
 */
import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { isHex, splitThemeId, themeIdOf } from "@/lib/themes";
import MenuPage, { type MenuData } from "./MenuPage";
import type { Dish, Menu, Restaurant } from "@/lib/types";
import { CTA_PRIMARY } from "@/lib/facts";
import { burnMinutes, isHighSodium, isSfdaCompliant } from "@/lib/nutrition";

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
  slug_changed_at: null,
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
  prices_include_vat: true,
  vat_number: "300000000000003",
  season: null,
  // ترتيب التاجر — يعرضه الديمو كما يراه الزبون (المقبلات أولاً لا المشاوي
  // لمجرّد أن أول طبق مضاف كان ستيك).
  category_order: JSON.stringify([
    "الإفطار",
    "المقبلات",
    "المشاوي",
    "الأطباق الرئيسية",
    "الحلويات",
    "المشروبات",
  ]),
  reviews_enabled: true,
  online_payment_enabled: false,
  api_enabled: false,
  meta_pixel_id: null,
  ga_measurement_id: null,
  snap_pixel_id: null,
  // الديمو يعرض المسار الجديد: الرقم أعلاه وهمي، والزرّ يُظهر الطلب كما يصل التاجر.
  whatsapp_orders_enabled: true,
  accepting_orders: true,
  prep_minutes: 20,
  min_order_amount: 0,
};

const menus: Menu[] = [
  {
    id: MENU_ID,
    restaurant_id: RESTAURANT_ID,
    user_id: "demo-user",
    name: "القائمة الرئيسية",
    description: null,
    theme: "dark-gold",
    active: true,
    views: 0,
    created_at: DEMO_TS,
    language: null,
    cover_image: null,
    window_from: null,
    window_to: null,
  },
];

/**
 * يبني طبقاً كاملاً بأقل تكرار — البقية افتراضات معقولة.
 *
 * ⚠️ **الأعمدة المحسوبة تُحسب هنا بصيغ القاعدة نفسها** (`lib/nutrition.ts`) لا
 * تُكتب بيد: كانت مكتوبة، فستيك بـ620 سعرة يقول «95 دقيقة مشي» والصيغة 155، وقهوة
 * بلا صوديوم موسومة «مكتملة البيانات» — أي أن المنيو التجريبي كان يخالف قاعدة
 * المنتج الذي يعرضه.
 */
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
  };
}

const dishes: Dish[] = [
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
    allergens: ["بيض", "جلوتين"],
  }),
  // نافدٌ اليوم — كي يرى الزائر «نفد اليوم» كما يراها زبونه: في آخر قسمه بعد
  // التمر (وهو قبله في القائمة)، وبلا زرّ إضافة. و`e2e/smoke.spec.ts` يقرؤه.
  dish("d7", "كنافة بالقشطة", "Kunafa with Cream", "الحلويات", 42, "🍰", {
    description: "كنافة ناعمة بالقشطة الطازجة والفستق الحلبي.",
    calories: 560,
    allergens: ["حليب", "مكسرات", "جلوتين"],
    available: false,
  }),
  dish("d8", "قهوة سعودية بالهيل", "Saudi Coffee", "المشروبات", 18, "☕", {
    description: "قهوة سعودية شقراء بالهيل والزعفران، تُقدَّم مع التمر.",
    calories: 15,
    caffeine_mg: 95,
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
  const [params] = useSearchParams();
  useEffect(() => {
    document.title = "منيو تجريبي — كلاود منيو";
  }, []);

  /**
   * `?theme=` يعاين أي طابع على منيو كامل.
   *
   * مُنتقي الطوابع في اللوحة يعرض بطاقة مصغّرة، وهي تكفي للمفاضلة السريعة لكنها
   * لا تُري التاجر منيواً حقيقياً بذلك الطابع قبل أن يطبّقه على منيوه أمام
   * زبائنه. القيمة تمرّ على `getTheme` كأي قيمة مخزَّنة، فالمعرّف المجهول يسقط
   * إلى الافتراضي ولا يكسر شيئاً.
   */
  const theme = params.get("theme")?.trim();

  /**
   * هوية الزائر من صفحة الهبوط — اسمه وشعاره ولونه وطابعه، **من نفس الأصل وحده**.
   *
   * ⚠️ رسائل من أصلٍ آخر تُرمى: الإطار يقبل التعليمات من صفحتنا لا من أي
   * موقع يؤطّره. والشعار رابط `blob:` أنشأته الصفحة الأمّ من ملفٍّ على جهاز
   * الزائر — لا يُرفع إلى أي مكان، ولا يُقبل غيره (لا روابط خارجية تُحمَّل هنا).
   */
  const [brand, setBrand] = useState<{ name?: string; color?: string; theme?: string; logo?: string }>({});
  const embeddedParam = params.get("embed") === "1";
  useEffect(() => {
    if (!embeddedParam) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const d = e.data as Record<string, unknown> | null;
      if (!d || d.type !== "cm-brand") return;
      setBrand({
        name: typeof d.name === "string" ? d.name.trim().slice(0, 40) : undefined,
        color: typeof d.color === "string" && isHex(d.color) ? d.color : undefined,
        theme: typeof d.theme === "string" ? d.theme.slice(0, 24) : undefined,
        logo: typeof d.logo === "string" && d.logo.startsWith("blob:") ? d.logo : undefined,
      });
    };
    window.addEventListener("message", onMessage);
    // الأمّ لا تعرف متى صار الإطار جاهزاً للاستماع — فيُعلنها هو.
    window.parent?.postMessage({ type: "cm-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, [embeddedParam]);

  const data: MenuData = useMemo(() => {
    const base = brand.theme ?? theme;
    if (!base && !brand.color && !brand.name && !brand.logo) return DEMO;
    return {
      ...DEMO,
      restaurant: {
        ...DEMO.restaurant,
        name: brand.name || DEMO.restaurant.name,
        // «مأكولات سعودية معاصرة» تحت «برجر البيت» تكذب — فتُخفى مع اسم الزائر.
        type: brand.name ? null : DEMO.restaurant.type,
        logo_image: brand.logo ?? DEMO.restaurant.logo_image,
      },
      menus: DEMO.menus.map((m) => ({
        ...m,
        theme: themeIdOf(splitThemeId(base ?? m.theme).base ?? "dark-gold", brand.color ?? splitThemeId(base).hex),
      })),
    };
  }, [brand, theme]);

  /**
   * `?embed=1` — الديمو معروضاً داخل إطار جوّال في صفحة الهبوط.
   *
   * الشريط العلوي يشرح للزائر المستقلّ أن هذا عرض تجريبي ويعيده إلى التسجيل.
   * وداخل الإطار **يصير ضجيجاً**: القسم المحيط يقول إنه ديمو أصلاً، والشريط
   * يسرق ارتفاعاً من شاشة ضيّقة ويضع دعوةً ثانية تنافس دعوة الصفحة. فيُكبح،
   * ويبقى المنيو وحده — وهو المقصود بالعرض.
   */
  const embedded = embeddedParam;

  return (
    <div className="relative">
      {!embedded && (
        /* شريط علوي يوضّح أن هذا عرض تجريبي ويعيد الزائر إلى التسجيل.
           ⚠️ غير لاصق: شريط التصنيفات لاصقٌ على `top-0` أيضاً، فكان هذا يغطّيه
           طوال التصفّح — والزائر يرى منيواً بلا تصنيفات. */
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-line bg-panel px-4 py-2 text-center">
          <span className="text-xs font-bold text-dim">
            👋 هذا منيو تجريبي — جرّبه كما يراه زبونك تماماً.
          </span>
          <Link
            to="/login?mode=signup"
            className="inline-flex min-h-11 items-center text-xs font-black text-gold hover:underline"
          >
            {CTA_PRIMARY} →
          </Link>
        </div>
      )}

      <MenuPage demo={data} />
    </div>
  );
}

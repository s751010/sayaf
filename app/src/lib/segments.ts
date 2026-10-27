/**
 * صفحات الشرائح — الكافيه المختصّ · المطعم الشعبي · عربات الطعام (بند ٩ من الخطّة).
 *
 * ═══ القاعدة: لا وعد بلا شيفرة ═══
 *
 * كل سطرٍ يَعِد التاجر بشيء يحمل **دليله**: ملفّاً تحت `app/src` ونصّاً فيه
 * (`proof`). و`segments.test.ts` يفتح الملفّ ويبحث عن النصّ — فإن حُذفت الميزة
 * أو أُعيدت تسميتها سقط الفحص قبل أن يقرأ التاجر وعداً لم يعد قائماً (درس ٢٥).
 *
 * ═══ الطوابع لا تُنسخ هنا ═══
 *
 * الشريحة تحمل **نوع النشاط** كما يختاره التاجر عند إنشاء مطعمه (`typeKey` —
 * قيمةٌ من `STARTER_TYPES`)، والطوابع تُقرأ من `SUGGESTED` عبر `suggestionKey`
 * نفسها التي يرتّب بها المُنتقي في اللوحة. فما تعرضه الصفحة هو ما سيراه
 * التاجر أوّلاً حين يختار ذلك النوع — لا قائمةٌ ثانية تتباعد.
 *
 * ⚠️ عربة الطعام ليست نوعاً في القائمة: أقرب نوعٍ إليها «مطعم سريع» (وهو ما
 * يقوله تعليق `SUGGESTED`)، والصفحة تقول للتاجر أن يختاره صراحةً.
 *
 * ═══ ما لا يُقال ═══
 *
 * - لا أسعار مكتوبة: السعر من `lib/plans.ts` في الصفحة.
 * - لا «ممتثل» ولا «معتمد»: الأرقام الغذائية **تقدير** يراجعه التاجر (§26).
 * - جرس الطلبات وشاشة الكاشير **لطلبات الدفع الإلكتروني وحدها** — طلب واتساب
 *   لا يمرّ بالقاعدة فلا يرنّ (`OrderAlerts.tsx`). فيُقال ذلك بشرطه.
 * - لا أرقام سوق ولا شهادات تجّار ولا اسم منافس.
 */
import type { IconName } from "./icons";
import { ALL_THEMES, type MenuTheme } from "./themes";
import { SUGGESTED, suggestionKey } from "./themeSuggest";
import { SEGMENT_LINKS, type SegmentSlug } from "./segmentLinks";

/** دليل الوعد: ملفٌّ نسبةً إلى `app/src`، ونصٌّ يجب أن يكون فيه. */
export interface Proof {
  file: string;
  needle: string;
}

export interface SegmentFeature {
  icon: IconName;
  title: string;
  desc: string;
  proof: Proof[];
}

export interface Segment {
  slug: SegmentSlug;
  /** نوع النشاط في نموذج إنشاء المطعم — قيمةٌ من `STARTER_TYPES` حرفياً. */
  typeKey: string;
  /** الشارة فوق العنوان، ونصّ الرابط في الذيل (`SEGMENT_LINKS`). */
  label: string;
  /** اسم الشريحة داخل الجملة: «ما يهمّ {audience}». */
  audience: string;
  seoTitle: string;
  seoDescription: string;
  headline: string;
  lede: string;
  features: SegmentFeature[];
  /** مقالات ثابتة من `content/articles.json` — slug كلٍّ منها. */
  articles: string[];
}

/* ── أدلّة مشتركة ─────────────────────────────────────────────────── */

const SOLD_OUT: SegmentFeature = {
  icon: "tag",
  title: "«نفد اليوم» بدل أن يختفي",
  desc: "خلص الصنف؟ أطفئه بضغطة من قائمة أصنافك، فيبقى في المنيو بعلامة «نفد اليوم» بشكل طابعك ولا يُطلب.",
  proof: [
    { file: "components/menu/DishCard.tsx", needle: "نفد اليوم" },
    { file: "lib/data.ts", needle: "export async function toggleDishAvailability" },
  ],
};

const WHATSAPP_ORDERS: SegmentFeature = {
  icon: "chat",
  title: "طلبات على واتساب، والدفع عندك",
  desc: "يبني الزبون طلبه من المنيو فيصلك نصّاً مرتّباً بأصنافه وكمياته، وتؤكّده وتستلم ثمنه عندك كالمعتاد — بلا بوّابة دفع.",
  proof: [
    { file: "pages/dashboard/Settings.tsx", needle: "استقبال الطلبات على واتساب" },
    { file: "components/menu/CartReview.tsx", needle: "أرسل الطلب على واتساب" },
  ],
};

/* ── الشرائح ──────────────────────────────────────────────────────── */

export const SEGMENTS: readonly Segment[] = [
  {
    slug: "specialty-coffee",
    typeKey: "كافيه",
    label: "للكافيه المختصّ",
    audience: "الكافيه المختصّ",
    seoTitle: "منيو QR للكافيه المختصّ — الكافيين على كل مشروب",
    seoDescription:
      "منيو رقمي للكافيه المختصّ: الكافيين بالملّيغرام لكل مشروب، والحليب والإضافات بأسعارها وسعراتها، و«نفد اليوم» حين ينتهي المحصول، وبطاقة ولاء بالأختام.",
    headline: "منيو يقول لزبونك كم كافيين في كوبه",
    lede:
      "زبون المختصّ يقرأ قبل أن يطلب. أعطه ما يقرؤه: الكافيين بالملّيغرام لكل مشروب، والحليب والإضافات بأسعارها وسعراتها — في طابعٍ يشبه محمصتك.",
    features: [
      {
        icon: "cup",
        title: "الكافيين على كل مشروب",
        desc: "اكتبه أو احسبه من الوصفة، فيظهر في نافذة المشروب بالملّيغرام. وفي طابع «محمصة» يظهر مقياسه على سطر المشروب نفسه.",
        proof: [
          { file: "components/menu/DishModal.tsx", needle: "caffeine_mg" },
          { file: "components/menu/DishCard.tsx", needle: "function CaffeineGauge" },
        ],
      },
      {
        icon: "sliders",
        title: "الحليب والإضافات بأسعارها",
        desc: "شوت إضافي، حليب شوفان، حجم أكبر — لكل إضافة سعرها، وسعراتها إن كتبتها، ويختارها الزبون من نافذة المشروب.",
        proof: [
          { file: "components/menu/DishModal.tsx", needle: "o.kcal" },
          { file: "lib/options.ts", needle: "kcal" },
        ],
      },
      {
        icon: "flame",
        title: "السعرات محسوبة من وصفتك",
        desc: "اكتب وصفة اللاتيه كما تحضّرها، فنقدّر سعراتها وكافيينها وسكّرها وصوديومها — وتراجعها قبل النشر، وتطبع منها ملفّاً للتفتيش.",
        proof: [
          { file: "lib/recipe.ts", needle: "sum.caffeine" },
          { file: "pages/dashboard/ComplianceFile.tsx", needle: "PDF" },
        ],
      },
      {
        icon: "heart",
        title: "بطاقة ولاء بالأختام",
        desc: "زبونك الدائم يجمع أختامه داخل المنيو بلا تطبيق، والكاشير يختم برمزٍ من جواله لا يفتح غير الختم.",
        proof: [
          { file: "components/menu/LoyaltyCard.tsx", needle: "export function LoyaltyCard" },
          { file: "pages/Stamp.tsx", needle: "staff_stamp" },
        ],
      },
      {
        icon: "shield",
        title: "مسبّبات الحساسية لكل صنف",
        desc: "الحليب والمكسّرات والجلوتين وغيرها — تختارها لكل صنف بالضغط، فتظهر للزبون مع الصنف.",
        proof: [
          { file: "components/AllergenPicker.tsx", needle: "export function AllergenPicker" },
          { file: "components/menu/DishModal.tsx", needle: "allergens" },
        ],
      },
      SOLD_OUT,
    ],
    articles: ["cafe-caffeine-guide", "cafe-menu-structure", "calories-from-recipe"],
  },
  {
    slug: "traditional-restaurants",
    typeKey: "شعبي",
    label: "للمطعم الشعبي",
    audience: "المطعم الشعبي",
    seoTitle: "منيو QR للمطعم الشعبي — من صورة منيوك الحالي",
    seoDescription:
      "منيو رقمي للمطعم الشعبي بطابعٍ من روح المكان: صوّر منيوك الحالي ونقرأ أصنافه وأسعاره، وطلبات على واتساب والدفع عندك، و«قيّمنا على قوقل» أعلى المنيو.",
    headline: "منيو بروح مكانك، وأسعاره تتعدّل بضغطة",
    lede:
      "صوّر منيوك المطبوع ونقرأ منه الأقسام والأصناف والأسعار، وتراجعها قبل الحفظ. ثم اختر طابعاً من روح المكان، وزبونك يطلب على واتساب ويدفع عندك.",
    features: [
      {
        icon: "image",
        title: "من صورة منيوك إلى منيو",
        desc: "صوّر منيوك المطبوع، ونقرأ منه الأقسام والأصناف والأسعار — وتراجعها وتعدّلها قبل أن تُحفظ.",
        proof: [
          { file: "lib/setup.ts", needle: "صوّر منيوك المطبوع" },
          { file: "lib/data.ts", needle: '("menu-scan"' },
        ],
      },
      WHATSAPP_ORDERS,
      {
        icon: "star",
        title: "«قيّمنا على قوقل» و«موقعنا» أعلى المنيو",
        desc: "ضع رابط تقييمك ورابط موقعك على قوقل ماب، فيظهران للزبون أوّل ما يفتح المنيو — لا في آخره.",
        proof: [
          { file: "pages/MenuPage.tsx", needle: "قيّمنا على قوقل" },
          { file: "pages/MenuPage.tsx", needle: "social_maps" },
        ],
      },
      {
        icon: "edit",
        title: "سعرٌ تغيّر؟ عدّله من مكانه",
        desc: "تعدّل السعر من صفّ الصنف مباشرة فيراه زبونك في لحظته، والكود الملصق على الطاولة كما هو.",
        proof: [{ file: "lib/data.ts", needle: "export async function updateDishPrice" }],
      },
      {
        icon: "printer",
        title: "ومنيو مطبوع بالأرقام نفسها",
        desc: "لمن يحبّ الورق: ورقة A4 من أصنافك وأسعارك نفسها، تطبعها أو تحفظها PDF.",
        proof: [{ file: "pages/dashboard/PrintMenu.tsx", needle: "A4" }],
      },
      SOLD_OUT,
    ],
    articles: ["paper-menu-to-digital", "whatsapp-orders", "google-maps-menu-link"],
  },
  {
    slug: "food-trucks",
    typeKey: "مطعم سريع",
    label: "لعربات الطعام",
    audience: "عربة الطعام",
    seoTitle: "منيو QR لعربات الطعام — العربة تتنقّل والكود ثابت",
    seoDescription:
      "منيو رقمي لعربة الطعام: كود واحد على العربة، وموقعك وساعاتك تعدّلها من جوالك، وطلبات على واتساب أو دفع إلكتروني بجرس طلبات وشاشة للكاشير.",
    headline: "العربة تتنقّل، والكود ثابت",
    lede:
      "كود QR واحد على العربة، وتحته منيو يعرف أين أنت ومتى تفتح: موقعك وساعاتك تعدّلها من جوالك، وزبونك يطلب ويستلم من الشبّاك.",
    features: [
      {
        icon: "pin",
        title: "«موقعنا» يتبعك",
        desc: "انتقلت؟ غيّر رابط موقعك على قوقل ماب من الإعدادات، فيتغيّر زرّ «موقعنا» في المنيو — والكود الملصق على العربة لا يتغيّر.",
        proof: [
          { file: "pages/dashboard/Settings.tsx", needle: "social_maps" },
          { file: "pages/MenuPage.tsx", needle: "social_maps" },
        ],
      },
      {
        icon: "clock",
        title: "«مفتوح الآن» من ساعاتك",
        desc: "اكتب ساعات عملك يوماً بيوم، فيرى الزبون أعلى المنيو هل أنت مفتوح الآن.",
        proof: [
          { file: "lib/hours.ts", needle: "مفتوح الآن" },
          { file: "components/HoursEditor.tsx", needle: "export function HoursEditor" },
        ],
      },
      {
        icon: "bell",
        title: "جرس طلبات وشاشة للكاشير",
        desc: "حين تربط حسابك في PayLink: يدفع الزبون من جواله، ويرنّ الطلب في لوحتك، ويظهر على شاشة الكاشير «جديد ← قيد التحضير ← جاهز»، ويتابع الزبون حالته من رابطه.",
        proof: [
          { file: "components/OrderAlerts.tsx", needle: "chime" },
          { file: "pages/dashboard/Kitchen.tsx", needle: "جاهز للاستلام" },
          { file: "pages/OrderStatus.tsx", needle: "export default" },
        ],
      },
      {
        icon: "ticket",
        title: "وقت التحضير أمام الزبون",
        desc: "اكتب كم دقيقة يأخذ الطلب فيراه الزبون على زرّ الطلب، وأغلق الاستقبال بضغطة حين يزدحم الشبّاك.",
        proof: [
          { file: "components/menu/Cart.tsx", needle: "prepMinutes" },
          { file: "pages/dashboard/Orders.tsx", needle: "accepting_orders" },
        ],
      },
      WHATSAPP_ORDERS,
      SOLD_OUT,
    ],
    articles: ["whatsapp-orders", "share-menu-link", "qr-table-guide"],
  },
];

export function segmentBySlug(slug: string | undefined): Segment | null {
  return SEGMENTS.find((s) => s.slug === slug) ?? null;
}

/** معرّفات الطوابع الثلاثة التي يضعها المُنتقي أوّلاً لنوع الشريحة. */
export function segmentThemeIds(seg: Segment): readonly string[] {
  return SUGGESTED[suggestionKey(seg.typeKey)];
}

/** الطوابع نفسها بترتيب الاقتراح — والمعرّف المجهول يسقط ولا يكسر الصفحة. */
export function segmentThemes(seg: Segment): MenuTheme[] {
  return segmentThemeIds(seg)
    .map((id) => ALL_THEMES.find((t) => t.id === id))
    .filter((t): t is MenuTheme => !!t);
}

/** نصّ الرابط في الذيل هو نفسه شارة الصفحة — مصدرٌ واحد يحرسه الفحص. */
export function linkLabel(slug: SegmentSlug): string {
  return SEGMENT_LINKS.find((l) => l.slug === slug)?.label ?? "";
}

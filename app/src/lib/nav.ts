/**
 * شريط لوحة التاجر — **نموذجٌ خالص، خارج الصفحة**.
 *
 * ═══ لماذا خرج من `Dashboard.tsx` ═══
 *
 * لأن تركيب هذا الشريط قرارُ منتجٍ لا تفصيلُ عرض: عنصرٌ يغيب منه = شاشةٌ
 * تختفي من أمام التاجر. وقد وقع ذلك فعلاً — «الطلبات» كانت **تحلّ محلّ**
 * «التحليلات» عند ربط بوّابة الدفع، فيفقد التاجر شاشة الأرقام… **وشاشة
 * الولاء معها**، لأن الولاء لا يُبلَغ إلا من تبويبات التحليلات
 * (`InsightTabs` في `pages/dashboard/Tabs.tsx`).
 *
 * أي أن ربط بوّابة دفع كان يُطفئ شاشتين بلا أن يطلب أحد ذلك، وبلا خطأ يظهر.
 * ودالّةٌ خالصة يحرسها فحص تجعل تكرار ذلك مستحيلاً بالبناء لا بالانتباه.
 */
import type { IconName } from "@/lib/icons";

export type NavItem = {
  to: string;
  label: string;
  icon: IconName;
  /** مطابقة تامّة للمسار (للرئيسية وحدها، وإلا بقيت نشطة في كل الأقسام). */
  end?: boolean;
};

/**
 * الأساس — ستّة عناصر مقيسة على ٣٩٠px.
 *
 * «التحليلات» بابُ قسمٍ لا شاشة: تحته «الأرقام» و«الولاء».
 * و«الطباعة» كذلك: بطاقة الكاشير وأكواد QR فعلٌ واحد عند التاجر.
 */
export const DASHBOARD_NAV: readonly NavItem[] = [
  { to: "/dashboard", label: "الرئيسية", icon: "home", end: true },
  { to: "/dashboard/dishes", label: "منيوي", icon: "plate" },
  { to: "/dashboard/design", label: "التصميم", icon: "palette" },
  { to: "/dashboard/cards", label: "الطباعة", icon: "printer" },
  { to: "/dashboard/analytics", label: "التحليلات", icon: "bars" },
  { to: "/dashboard/settings", label: "الإعدادات", icon: "sliders" },
];

/** يظهر لمن ربط بوّابة دفع: مطعمٌ بلا بوّابة لا طلبات له، وشاشةٌ فارغة وعدٌ لا يُوفى. */
export const ORDERS_ITEM: NavItem = {
  to: "/dashboard/orders",
  label: "الطلبات",
  icon: "ticket",
};

/** لا يراه إلا صاحب المنصّة — والقرار من القاعدة (`is_founder()`) لا من الواجهة. */
export const FOUNDER_ITEM: NavItem = {
  to: "/founder",
  label: "لوحة المؤسس",
  icon: "shield",
};

/**
 * يبني الشريط لحالة التاجر.
 *
 * ⚠️ **يُضاف ولا يُبدَّل.** الفيض عن عرض الشاشة معالَجٌ في `ScrollRow` (تمرير
 * أفقي بتدرّجٍ يقول «خلفي المزيد» عند وجوده فعلاً)، وهو يعمل اليوم لكل مؤسّس
 * — أي أن سبعة عناصر حالةٌ قائمة ومُختبَرة لا افتراض.
 */
export function buildDashboardNav(opts: {
  ordersOn: boolean;
  /** `null` = لم يُحسم بعد؛ فلا نومض بالعنصر ثم نخفيه. */
  founder: boolean | null;
}): NavItem[] {
  const items = opts.ordersOn
    ? DASHBOARD_NAV.flatMap((n) =>
        n.to === "/dashboard/analytics" ? [n, ORDERS_ITEM] : [n]
      )
    : [...DASHBOARD_NAV];
  return opts.founder === true ? [...items, FOUNDER_ITEM] : items;
}

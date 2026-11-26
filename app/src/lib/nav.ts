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
import { badgeText } from "@/lib/orderAlerts";

export type NavItem = {
  to: string;
  label: string;
  icon: IconName;
  /** مطابقة تامّة للمسار (للرئيسية وحدها، وإلا بقيت نشطة في كل الأقسام). */
  end?: boolean;
  /** شارة عدد على العنصر («3» · «9+») — `undefined` = لا شارة. */
  badge?: string;
  /**
   * مسارات أخرى يُضاء فيها العنصر: «التحليلات» و«الطباعة» بابا قسمين لهما
   * تبويبات (`Tabs.tsx`)، فمن كان في «الأسبوع» أو «أكواد QR» لا يرى الشريط
   * بلا عنصرٍ مُضاء كأنه خرج من اللوحة.
   */
  also?: readonly string[];
};

/**
 * الأساس — ستّة عناصر مقيسة على ٣٩٠px.
 *
 * «التحليلات» بابُ قسمٍ لا شاشة: تحته «الأرقام» و«الولاء».
 * و«الطباعة» كذلك: بطاقة الكاشير وأكواد QR فعلٌ واحد عند التاجر.
 */
export const DASHBOARD_NAV: readonly NavItem[] = [
  { to: "/dashboard", label: "الرئيسية", icon: "home", end: true },
  { to: "/dashboard/dishes", label: "منيوي", icon: "plate", also: ["/dashboard/menus"] },
  // ثاني عنصر عمداً: هو سبب الاشتراك منذ إعادة التموضع (٢٠٢٦/١٠) — حساب
  // أرقام الهيئة من الوصفة. والسابع على الجوال يفيض فيمرّر (`ScrollRow`).
  { to: "/dashboard/nutrition", label: "الامتثال", icon: "flame" },
  { to: "/dashboard/design", label: "التصميم", icon: "palette" },
  {
    to: "/dashboard/cards",
    label: "الطباعة",
    icon: "printer",
    also: ["/dashboard/qr", "/dashboard/print", "/dashboard/kit"],
  },
  {
    to: "/dashboard/analytics",
    label: "التحليلات",
    icon: "bars",
    also: ["/dashboard/report", "/dashboard/loyalty"],
  },
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
  /**
   * طلبات جديدة لم يرها التاجر (`OrderAlertsProvider`). الشارة على «الطلبات»
   * وحدها، فتظهر أينما كان في اللوحة — والصفر لا يرسم شيئاً.
   */
  newOrders?: number;
}): NavItem[] {
  const badge = badgeText(opts.newOrders ?? 0) ?? undefined;
  const orders: NavItem = badge ? { ...ORDERS_ITEM, badge } : ORDERS_ITEM;
  // والشرط بوّابة الدفع عمداً (لا طلبات بلا بوّابة)؛ لكن طلباً جديداً لم يُرَ
  // يُظهر العنصر حتى لو أُطفئت البوّابة بعده — وإلا بقي طلبٌ مدفوع بلا طريقٍ
  // إليه من القائمة (تدقيق ٢٠٢٦/١١/٠٩، البند ١٧).
  const items = opts.ordersOn || badge
    ? DASHBOARD_NAV.flatMap((n) =>
        n.to === "/dashboard/analytics" ? [n, orders] : [n]
      )
    : [...DASHBOARD_NAV];
  return opts.founder === true ? [...items, FOUNDER_ITEM] : items;
}

/**
 * هل العنصر مُضاء في هذا المسار؟ مساره نفسه (تامّاً لـ`end`) أو أحد `also`
 * أو ما تحتها. خالصة ليحرسها فحص — `NavLink` وحده لا يعرف أبواب الأقسام.
 */
export function isNavActive(item: NavItem, pathname: string): boolean {
  const under = (base: string) => pathname === base || pathname.startsWith(`${base}/`);
  if (item.end ? pathname === item.to : under(item.to)) return true;
  return (item.also ?? []).some(under);
}

/* ── الجوال: شريطٌ سفلي بأربعة + «المزيد» (٢٠٢٦/١١/٢٦) ─────────────── */

/**
 * ترتيب الأولوية على الشريط السفلي. «الطلبات» ثالثة **حين تظهر**: من ربط
 * بوّابة دفع يعيش فيها وقت الذروة، وشارتها يجب أن تُرى بلا فتح «المزيد».
 */
const MOBILE_PRIORITY = [
  "/dashboard",
  "/dashboard/dishes",
  "/dashboard/orders",
  "/dashboard/design",
  "/dashboard/cards",
] as const;

export const MOBILE_SLOTS = 4;

/**
 * يقسم الشريط: أربعة في الأسفل، والباقي في «المزيد».
 *
 * ⚠️ **لا يُسقط عنصراً**: كلّ ما لم يدخل الأربعة في «المزيد» — نفس قاعدة
 * «تفعيل ميزة يزيد ولا ينقص» (`dashboard-nav.test.ts`). وشارة عنصرٍ مخفيّ
 * تنتقل إلى زرّ «المزيد» كي لا يختبئ طلبٌ جديد.
 */
export function splitMobileNav(nav: readonly NavItem[]): {
  primary: NavItem[];
  more: NavItem[];
  moreBadge?: string;
} {
  const rank = (n: NavItem) => {
    const i = (MOBILE_PRIORITY as readonly string[]).indexOf(n.to);
    return i === -1 ? Infinity : i;
  };
  const primary = [...nav]
    .filter((n) => rank(n) !== Infinity)
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, MOBILE_SLOTS);
  const keep = new Set(primary.map((n) => n.to));
  const more = nav.filter((n) => !keep.has(n.to));
  return { primary, more, moreBadge: more.find((n) => n.badge)?.badge };
}

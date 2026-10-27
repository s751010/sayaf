/**
 * أشرطة التبويب داخل عناصر القائمة المدموجة.
 *
 * القائمة نزلت من ثمانية عناصر إلى ستة بدمج ما هو فعلٌ واحد عند التاجر. لكن
 * الدمج بلا شريط تبويب = **إخفاء**: من أزال عنصر «أكواد QR» بلا هذا الشريط لم
 * يعد أحد يصل إليها. فكل دمج يقابله شريط يُظهر ما دُمج.
 *
 * كان `PrintTabs` مكوّناً خاصّاً بالطباعة، فلمّا صار الدمج ثلاثة عُمّم هنا —
 * وبقي `PrintTabs` يُصدَّر باسمه كي لا تتغيّر استدعاءات صفحتين لسبب شكلي.
 */
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/lib/icons";

export interface Tab {
  to: string;
  label: string;
  icon: IconName;
  /** يطابق المسار تماماً — للتبويب الذي مساره أب لغيره. */
  end?: boolean;
}

export function Tabs({ tabs }: { tabs: Tab[] }) {
  return (
    // `flex-wrap`: تبويبات الطباعة صارت أربعاً (عدّة الطباعة، ٢٠٢٦/١٠/٢٧)، والرابع
    // يمدّ الصفحة على 320 — فتنزل التبويبات سطراً ثانياً بدل أن تفيض.
    <div className="mt-5 inline-flex max-w-full flex-wrap rounded-xl border border-line bg-panel p-1">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) =>
            cn(
              // `px-3` تحت `sm`: تبويبات الطباعة الثلاثة كانت تمدّ الصفحة على
              // 320 إلى 323px (مقيس بـe2e «اللوحة على ٣٢٠px»).
              "rounded-lg px-3 py-2 text-sm font-bold transition-colors sm:px-4",
              "inline-flex items-center gap-1.5 sm:gap-2",
              isActive ? "bg-gold text-on-gold" : "text-dim hover:text-ink"
            )
          }
        >
          <Icon name={t.icon} size={16} />
          {t.label}
        </NavLink>
      ))}
    </div>
  );
}

/** الطباعة: ما يُجهَّز ثم يوضع على الطاولة. */
export function PrintTabs() {
  return (
    <Tabs
      tabs={[
        { to: "/dashboard/print", label: "المنيو المطبوع", icon: "doc" },
        { to: "/dashboard/kit", label: "عدّة الطباعة", icon: "printer" },
        { to: "/dashboard/cards", label: "بطاقات الكاشير", icon: "card" },
        { to: "/dashboard/qr", label: "أكواد QR", icon: "qr" },
      ]}
    />
  );
}

/** منيوي: محتوى المنيو — الأصناف وحاوياتها. */
export function MenuTabs() {
  return (
    <Tabs
      tabs={[
        { to: "/dashboard/dishes", label: "الأطباق", icon: "plate" },
        { to: "/dashboard/menus", label: "القوائم", icon: "doc" },
      ]}
    />
  );
}

/** التحليلات: أرقام المنيو · تقرير الأسبوع · زبائنه. */
export function InsightTabs() {
  return (
    <Tabs
      tabs={[
        { to: "/dashboard/analytics", label: "الأرقام", icon: "bars" },
        // تبويبٌ لا عنصر شريط: الشريط سبعة عناصر مقيسة، والتقرير قراءةٌ ثانية
        // للأرقام نفسها — بابه «التحليلات» كالولاء (`dashboard-nav.test.ts`).
        { to: "/dashboard/report", label: "الأسبوع", icon: "pulse" },
        { to: "/dashboard/loyalty", label: "الولاء", icon: "heart" },
      ]}
    />
  );
}

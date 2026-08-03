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

export interface Tab {
  to: string;
  label: string;
  /** يطابق المسار تماماً — للتبويب الذي مساره أب لغيره. */
  end?: boolean;
}

export function Tabs({ tabs }: { tabs: Tab[] }) {
  return (
    <div className="mt-5 inline-flex rounded-xl border border-line bg-panel p-1">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) =>
            cn(
              "rounded-lg px-4 py-2 text-sm font-bold transition-colors",
              isActive ? "bg-gold text-on-gold" : "text-dim hover:text-ink"
            )
          }
        >
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
        { to: "/dashboard/cards", label: "🪧 بطاقات الكاشير" },
        { to: "/dashboard/qr", label: "🔳 أكواد QR" },
      ]}
    />
  );
}

/** منيوي: محتوى المنيو — الأصناف وحاوياتها. */
export function MenuTabs() {
  return (
    <Tabs
      tabs={[
        { to: "/dashboard/dishes", label: "🍽️ الأطباق" },
        { to: "/dashboard/menus", label: "📋 القوائم" },
      ]}
    />
  );
}

/** التحليلات: أرقام المنيو وزبائنه. */
export function InsightTabs() {
  return (
    <Tabs
      tabs={[
        { to: "/dashboard/analytics", label: "📊 الأرقام" },
        { to: "/dashboard/loyalty", label: "💛 الولاء" },
      ]}
    />
  );
}

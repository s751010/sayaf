/**
 * تبويبا قسم الطباعة: البطاقات وأكواد QR.
 *
 * الاثنان فعلٌ واحد عند التاجر («أجهّز ما أطبعه ثم أضعه على الطاولة»)، وعنصران
 * منفصلان في القائمة كانا سيرفعانها إلى تسعة على شريط جوال ضيّق. فصارا عنصراً
 * واحداً بتبويبين — ولولا هذا الشريط لَما وصل أحد إلى صفحة الأكواد إطلاقاً بعد
 * إزالة عنصرها.
 */
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/dashboard/cards", label: "🪧 بطاقات الكاشير" },
  { to: "/dashboard/qr", label: "🔳 أكواد QR" },
];

export function PrintTabs() {
  return (
    <div className="mt-5 inline-flex rounded-xl border border-line bg-panel p-1">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
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

/**
 * بطاقة «ماذا أفعل الآن؟» — التوصيات المشتقّة من أرقام التاجر.
 * كل سطر يحمل زره إلى مكان الإصلاح: التوصية بلا وجهة تبقى ملاحظة لا فعلاً.
 */
import { Link } from "react-router-dom";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Insight } from "@/lib/insights";
import { Icon } from "@/lib/icons";

export function Insights({
  items,
  limit,
  title = "ماذا أفعل الآن؟",
  moreTo,
}: {
  items: Insight[];
  limit?: number;
  title?: string;
  /** رابط «المزيد» حين نعرض جزءاً فقط. */
  moreTo?: string;
}) {
  if (!items.length) return null;
  const shown = limit ? items.slice(0, limit) : items;
  const hidden = items.length - shown.length;

  return (
    <Card className="flex flex-col gap-3 border-gold/25 bg-gold/[.03]">
      <h2 className="inline-flex items-center gap-2 font-display text-lg font-extrabold text-ink">
          <Icon name="sparkle" size={17} className="shrink-0 text-gold" />{" "}
          {title}</h2>
      <ul className="flex flex-col gap-2">
        {shown.map((i) => (
          <li
            key={i.id}
            className={cn(
              "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-3.5 py-3",
              i.severity === "high"
                ? "border-gold/30 bg-gold/[.06]"
                : "border-line bg-panel2"
            )}
          >
            <span className="text-lg" aria-hidden="true">
              <Icon name={i.icon} size={18} />
            </span>
            <p className="min-w-0 flex-1 text-sm leading-relaxed text-ink">{i.text}</p>
            {i.action && (
              <Link
                to={i.action.to}
                className="shrink-0 rounded-xl border border-line-gold px-3 py-1.5 text-xs font-bold text-ink hover:bg-gold/10"
              >
                {i.action.label} ←
              </Link>
            )}
          </li>
        ))}
      </ul>
      {hidden > 0 && moreTo && (
        <Link to={moreTo} className="self-start text-xs font-bold text-gold hover:underline">
          و{hidden} توصية أخرى ←
        </Link>
      )}
    </Card>
  );
}

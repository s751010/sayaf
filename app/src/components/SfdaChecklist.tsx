/**
 * «لو دخل المفتّش اليوم» — بنود اشتراطات المنيو بحالتها وطريق إكمالها.
 * المنطق كلّه في `lib/sfdaChecklist.ts`؛ هنا العرض وحده.
 */
import { Link } from "react-router-dom";
import { Card } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { checklistTodo, type CheckItem } from "@/lib/sfdaChecklist";

/** `here`: مسار الصفحة المعروضة فيها — رابطٌ يعيد إلى الصفحة نفسها لا يُعرض. */
export function SfdaChecklist({ items, here }: { items: readonly CheckItem[]; here?: string }) {
  const todo = checklistTodo(items);
  return (
    <Card className="grid gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-ink">لو دخل المفتّش اليوم</h2>
        <p className={cn("text-sm font-bold", todo ? "text-gold" : "text-good")}>
          {todo ? `${todo} ${todo === 1 ? "بند ينقصك" : "بنود تنقصك"}` : "كل البنود جاهزة"}
        </p>
      </div>
      <ul className="grid gap-2.5">
        {items.map((it) => (
          <li key={it.id} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className={cn(
                "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black",
                it.state === "todo" ? "bg-gold/15 text-gold" : "bg-good/15 text-good"
              )}
            >
              {it.state === "todo" ? "!" : "✓"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">
                <span className="sr-only">{it.state === "todo" ? "ناقص: " : "جاهز: "}</span>
                {it.label}
              </p>
              <p className="text-xs text-dim">{it.detail}</p>
            </div>
            {it.fix && it.fix.to !== here && (
              <Link
                to={it.fix.to}
                className="inline-flex min-h-9 shrink-0 items-center gap-1 text-xs font-bold text-gold hover:underline"
              >
                {it.fix.label} <Icon name="chevron" size={12} />
              </Link>
            )}
          </li>
        ))}
      </ul>
      <p className="text-xs text-faint">
        نحسب الأرقام ونعرضها كما يطلبها الاشتراط؛ ودقّة الوصفة والمسؤولية النظامية على المنشأة.
      </p>
    </Card>
  );
}

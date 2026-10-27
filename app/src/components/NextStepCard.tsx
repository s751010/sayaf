/**
 * «خطوتك التالية» — فعلٌ واحد وما بقي مطويّ (`lib/nextStep.ts`).
 *
 * خرجت من `Overview.tsx` حين احتاجها التقرير الأسبوعي: الخطوة نفسها في
 * الشاشتين، من السلّم نفسه، بالشكل نفسه — لا نصيحتان مختلفتان لسؤالٍ واحد.
 */
import { Link } from "react-router-dom";
import { Card } from "@/components/ui";
import { Icon } from "@/lib/icons";
import type { NextStep } from "@/lib/nextStep";

export function NextStepCard({ next }: { next: NextStep }) {
  if (!next.action) return null;
  return (
    <Card className="mt-5 border-gold/30 bg-gold/[.04]">
      <p className="text-xs font-bold text-gold">خطوتك التالية</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-3">
        <span className="text-2xl" aria-hidden="true">
          <Icon name={next.action.icon} size={22} />
        </span>
        <p className="min-w-0 flex-1 text-sm leading-relaxed text-ink">
          {next.action.text}
        </p>
        {next.action.action && (
          <Link
            to={next.action.action.to}
            className="shrink-0 rounded-xl bg-gold px-4 py-2 text-sm font-bold text-on-gold hover:bg-gold2"
          >
            {next.action.action.label} ←
          </Link>
        )}
      </div>
      {next.rest.length > 0 && (
        <details className="mt-3 border-t border-gold/15 pt-3">
          <summary className="cursor-pointer text-xs font-bold text-dim hover:text-ink">
            و{next.rest.length} خطوة أخرى
          </summary>
          <ul className="mt-3 flex flex-col gap-2">
            {next.rest.map((i) => (
              <li
                key={i.id}
                className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm"
              >
                <Icon name={i.icon} size={16} className="mt-0.5 shrink-0" />
                <span className="min-w-0 flex-1 text-dim">{i.text}</span>
                {i.action && (
                  <Link
                    to={i.action.to}
                    className="text-xs font-bold text-gold hover:underline"
                  >
                    {i.action.label} ←
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  );
}

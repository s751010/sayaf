/** قطع مسار «إعداد منيوك» المشتركة: شريط التقدّم وشريط الأفعال أسفل الخطوة. */
import type { ReactNode } from "react";
import { Button } from "@/components/ui";
import {
  SETUP_STEPS,
  isResolved,
  progressPercent,
  stepIndex,
  type SetupProgress,
  type SetupStepId,
} from "@/lib/setup";
import { cn } from "@/lib/utils";

/**
 * الشريط والخطوات الأربع تحته — والخطوة زرٌّ: من تخطّى الشعار يعود إليه بلمسة.
 *
 * ⚠️ مقيسٌ على ٣٢٠: أربعة أعمدة في ٢٨٨px، فالتسمية كلمةٌ واحدة («أصنافك» أطولها)
 * والعنوان الكامل في رأس الخطوة لا هنا. والأرقام لاتينية (الدرس ١٣).
 */
export function SetupProgressBar({
  progress,
  onGo,
}: {
  progress: SetupProgress;
  onGo: (id: SetupStepId) => void;
}) {
  const pct = progressPercent(progress);
  const at = stepIndex(progress.step);
  return (
    <nav aria-label="خطوات الإعداد" className="mt-5">
      <div className="flex items-center justify-between gap-3 text-xs font-bold">
        <span className="text-ink">
          الخطوة <span className="tabular-nums">{at + 1}</span> من{" "}
          <span className="tabular-nums">{SETUP_STEPS.length}</span>
        </span>
        <span className="text-dim tabular-nums" dir="ltr">{pct}%</span>
      </div>
      <div
        role="progressbar"
        aria-label="تقدّم الإعداد"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="mt-2 h-2 overflow-hidden rounded-full bg-ink/8"
      >
        <div
          className="h-full rounded-full bg-gold transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ol className="mt-3 grid grid-cols-4 gap-1">
        {SETUP_STEPS.map((s, i) => {
          const current = s.id === progress.step;
          const done = progress.done.includes(s.id);
          const skipped = !done && isResolved(progress, s.id);
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onGo(s.id)}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "flex min-h-11 w-full flex-col items-center gap-1 rounded-[10px] px-1 py-1.5 text-[11px] font-bold transition-colors",
                  current ? "bg-gold/10 text-ink" : "text-dim hover:bg-ink/5 hover:text-ink"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid h-6 w-6 place-items-center rounded-full border text-[11px] tabular-nums",
                    done
                      ? "border-good bg-good text-page"
                      : current
                        ? "border-gold text-gold"
                        : "border-line"
                  )}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span className="truncate">{s.label}</span>
                {/* الحالة لقارئ الشاشة جملةً — الرمز وحده لا يُقرأ. */}
                <span className="sr-only">
                  {done ? "، منجزة" : skipped ? "، تُخطّيت" : current ? "، الحالية" : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * شريط الأفعال — لاصقٌ أسفل الشاشة: خطوة الطوابع عشر بطاقات، وزرّ «طبّق» في
 * قاعها كان سيُطلب بالتمرير. والهوامش السالبة تطابق حشوة `main` (`px-4 sm:px-6`).
 */
export function StepFooter({
  skipLabel = "تخطَّ هذه الخطوة",
  onSkip,
  busy,
  children,
}: {
  skipLabel?: string;
  onSkip?: () => void;
  busy?: boolean;
  /** الفعل الأساسي — زرٌّ واحد. */
  children?: ReactNode;
}) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-line bg-page/92 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
      <div className="flex items-center justify-between gap-2">
        {onSkip ? (
          <Button variant="ghost" onClick={onSkip} disabled={busy} className="px-2.5">
            {skipLabel}
          </Button>
        ) : (
          <span />
        )}
        {children}
      </div>
    </div>
  );
}

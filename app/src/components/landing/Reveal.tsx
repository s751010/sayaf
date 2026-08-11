/**
 * غلاف الكشف عند التمرير — مشترك بين أقسام الهبوط.
 *
 * كان معرّفاً داخل `Landing.tsx`، فاستُخرج حين احتاجته أقسام في ملفّات أخرى.
 * النسخة واحدة عمداً: نسختان تتباعدان، والتباعد هنا يعني قسماً يظهر بإيقاع
 * وقسماً بآخر.
 *
 * `delay` بالمللي ثانية لتتابع الأبناء: ظهور ثلاث بطاقات دفعةً واحدة يبدو
 * وميضاً، وظهورها بفارق ٩٠ مللي يبدو ترتيباً مقصوداً.
 *
 * ⚠️ الحالة الافتراضية **مكشوفة**: `.reveal` في `global.css` يبدأ ظاهراً،
 * والإخفاء لا يقع إلا داخل `@media (prefers-reduced-motion: no-preference)`.
 * وعليه فمن طلب تقليل الحركة يرى المحتوى فوراً، ولا يبقى عنصرٌ عالقاً عند
 * `opacity: 0` ينتظر حركةً أُوقفت.
 */
import type { ReactNode } from "react";
import { useReveal } from "@/lib/reveal";
import { cn } from "@/lib/utils";

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, shown } = useReveal();
  return (
    <div
      ref={ref}
      className={cn("reveal", shown && "is-shown", className)}
      style={shown ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

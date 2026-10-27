/**
 * شارة الفرق مقابل الفترة السابقة — «الأرقام» (`Analytics.tsx`) و«تقرير
 * الأسبوع» (`WeeklyReport.tsx`) معاً.
 *
 * كانت `Delta` داخل `Analytics.tsx` تحسب النسبة وترسمها، فلا يُفحص الحساب.
 * الحساب الآن في `deltaOf` (`lib/weeklyReport.ts`، مفحوصٌ بالقسمة على صفر)،
 * وهنا الرسم وحده. و«لا شيء مقابل لا شيء» لا يُرسم: صفرٌ وصفر ليس خبراً.
 */
import { Badge } from "@/components/ui";
import type { Delta } from "@/lib/weeklyReport";

export function DeltaBadge({ delta }: { delta: Delta }) {
  switch (delta.kind) {
    case "none":
      return null;
    case "first":
      return <Badge variant="neutral">أوّل أسبوع</Badge>;
    case "new":
      return <Badge variant="green">جديد</Badge>;
    case "same":
      return <Badge variant="neutral">= مستقر</Badge>;
    default:
      return (
        <Badge variant={delta.kind === "up" ? "green" : "red"}>
          {delta.kind === "up" ? "▲" : "▼"} {delta.pct}%
        </Badge>
      );
  }
}

/**
 * محرّر ساعات العمل — يوم بيوم، مع أيام إجازة.
 *
 * كان الحقل نصاً حراً واحداً، ومع ذلك كانت بيانات الإنتاج تحمل JSON مهيكلاً
 * (من نسخة سابقة)، فكان تعديل الإعدادات يستبدل الجدول المهيكل بنصّ ويُفقده.
 */
import { useState } from "react";
import {
  DAYS,
  DEFAULT_DAY,
  defaultWeek,
  normalizeTime,
  openState,
  parseWeek,
  serializeWeek,
  type DayId,
  type WeekHours,
} from "@/lib/hours";
import { cn } from "@/lib/utils";
import { Badge, Switch } from "@/components/ui";

export function HoursEditor({
  value,
  onChange,
}: {
  /** القيمة المخزَّنة كما هي في `restaurants.working_hours`. */
  value: string;
  onChange: (next: string) => void;
}) {
  const parsed = parseWeek(value);
  // نصّ حر موجود ⇒ لا نمسحه تلقائياً؛ نطلب من التاجر التحويل صراحةً.
  const [week, setWeek] = useState<WeekHours | null>(parsed);
  const legacyText = parsed === null ? value.trim() : "";

  function push(next: WeekHours) {
    setWeek(next);
    onChange(serializeWeek(next));
  }

  function setDay(id: DayId, patch: Partial<WeekHours[DayId]>) {
    if (!week) return;
    push({ ...week, [id]: { ...week[id], ...patch } });
  }

  function copyToAll(id: DayId) {
    if (!week) return;
    const src = week[id];
    push(
      DAYS.reduce((acc, d) => {
        acc[d.id] = { ...src };
        return acc;
      }, {} as WeekHours)
    );
  }

  if (!week) {
    return (
      <div className="space-y-2">
        <span className="block text-sm font-bold text-ink">ساعات العمل</span>
        {legacyText ? (
          <div className="rounded-xl border border-line bg-panel2 px-4 py-3">
            <p className="text-xs text-faint">القيمة الحالية (نص حر):</p>
            <p className="mt-1 text-sm text-ink">{legacyText}</p>
          </div>
        ) : (
          <p className="text-xs text-faint">لم تُحدَّد ساعات عمل بعد.</p>
        )}
        <button
          type="button"
          onClick={() => push(defaultWeek())}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line-gold px-3 py-1.5 text-xs font-bold text-ink transition-colors hover:bg-gold/10"
        >
          🕐 {legacyText ? "تحويل إلى جدول يومي" : "حدّد ساعات العمل"}
        </button>
        {legacyText && (
          <p className="text-xs text-faint">
            الجدول اليومي يظهر للزبون مع حالة «مفتوح الآن / مغلق» تلقائياً.
          </p>
        )}
      </div>
    );
  }

  const state = openState(week);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-bold text-ink">ساعات العمل</span>
        <Badge variant={state.open ? "green" : "neutral"}>
          {state.open ? "🟢" : "⚪"} {state.label}
        </Badge>
      </div>

      <div className="space-y-1.5">
        {DAYS.map((d) => {
          const day = week[d.id];
          return (
            <div
              key={d.id}
              className={cn(
                "flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2",
                day.open ? "border-line bg-panel2/60" : "border-line bg-panel2/30"
              )}
            >
              <span className="w-16 shrink-0 text-sm font-bold text-ink">{d.ar}</span>
              <Switch
                checked={day.open}
                onChange={(v) => setDay(d.id, { open: v })}
                label={`${d.ar} مفتوح`}
              />
              {day.open ? (
                <>
                  <input
                    type="time"
                    value={day.from}
                    aria-label={`${d.ar} من`}
                    onChange={(e) => setDay(d.id, { from: normalizeTime(e.target.value || DEFAULT_DAY.from) })}
                    className="rounded-lg border border-line bg-panel px-2 py-1.5 text-sm text-ink"
                  />
                  <span className="text-xs text-faint">إلى</span>
                  <input
                    type="time"
                    value={day.to}
                    aria-label={`${d.ar} إلى`}
                    onChange={(e) => setDay(d.id, { to: normalizeTime(e.target.value || DEFAULT_DAY.to) })}
                    className="rounded-lg border border-line bg-panel px-2 py-1.5 text-sm text-ink"
                  />
                  <button
                    type="button"
                    onClick={() => copyToAll(d.id)}
                    title="طبّق هذا التوقيت على كل الأيام"
                    className="ms-auto rounded-lg px-2 py-1 text-xs font-bold text-dim transition-colors hover:bg-ink/5 hover:text-gold"
                  >
                    ⇊ للكل
                  </button>
                </>
              ) : (
                <span className="text-xs font-bold text-faint">إجازة</span>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-faint">
        توقيت الرياض. التوقيت الذي يعبر منتصف الليل مدعوم (مثال: ٧:٠٠ ص → ١:٠٠ ص).
      </p>
    </div>
  );
}

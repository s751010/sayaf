/**
 * أعمدة يومية لسلسلة واحدة — منحنى النمو والفتحات في «لوحتي».
 *
 * سلسلة واحدة فلا مفتاح ألوان (العنوان يسمّيها)، ولونها رمز الرسوم المُدقَّق `--c-chart`
 * لا لونٌ مخترع. أعمدة رفيعة بفاصل ٢px وطرفٍ مدوّر عند القمّة فقط، وخطّ أساس
 * هادئ. التمرير/اللمس يُظهر اليوم وقيمته فوق الرسم، ونسخةٌ نصّية لقارئ الشاشة.
 */
import { useState } from "react";
import type { DayPoint } from "@/lib/founderInsights";

const fmtDay = new Intl.DateTimeFormat("ar-SA-u-nu-latn", { day: "numeric", month: "short", timeZone: "UTC" });

function label(day: string): string {
  return fmtDay.format(new Date(`${day}T12:00:00Z`));
}

export function Bars({
  points,
  unit,
  height = 96,
}: {
  points: DayPoint[];
  /** وحدة القيمة في التلميح — «مطعم» · «فتحة»… */
  unit: string;
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...points.map((p) => p.n));
  const n = points.length;
  const W = 100; // عرض نسبي — الـSVG يتمدّد بعرض البطاقة
  const gap = 0.6;
  const bw = W / n - gap;
  // بلا تمرير لا يُعرض يومٌ بعينه: قيمة «اليوم» (غالباً صفر) بجانب مجموعٍ أكبر
  // تُقرأ تناقضاً.
  const shown = hover !== null ? points[hover] : null;

  return (
    <div>
      <p className="h-5 text-xs text-dim" aria-live="polite">
        {shown ? (
          <>
            <span className="font-black text-ink">{shown.n}</span> {unit} · {label(shown.day)}
          </>
        ) : (
          <span className="text-faint">المس عموداً لتشوف يومه</span>
        )}
      </p>
      {/* الأيام من اليمين إلى اليسار كقراءة السطر العربي: الأقدم يميناً */}
      <svg
        viewBox={`0 0 ${W} ${height}`}
        preserveAspectRatio="none"
        className="mt-1 block w-full -scale-x-100"
        style={{ height }}
        role="img"
        aria-label={`${unit} يومياً لآخر ${n} يوم`}
        onMouseLeave={() => setHover(null)}
      >
        <line x1="0" x2={W} y1={height - 0.5} y2={height - 0.5} stroke="var(--c-line)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => {
          const h = p.n === 0 ? 0 : Math.max(2, (p.n / max) * (height - 6));
          const x = i * (W / n) + gap / 2;
          return (
            <g key={p.day} onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)}>
              {/* هدف لمسٍ بطول العمود كاملاً — أكبر من العلامة */}
              <rect x={x - gap / 2} y={0} width={W / n} height={height} fill="transparent" />
              {h > 0 && (
                <rect
                  x={x}
                  y={height - h - 1}
                  width={bw}
                  height={h}
                  rx={Math.min(bw / 2, 1.2)}
                  fill="var(--c-chart)"
                  opacity={hover === null || hover === i ? 1 : 0.45}
                />
              )}
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-faint">
        <span>{label(points[0]?.day ?? "")}</span>
        <span>اليوم</span>
      </div>
      <ul className="sr-only">
        {points.map((p) => (
          <li key={p.day}>
            {label(p.day)}: {p.n} {unit}
          </li>
        ))}
      </ul>
    </div>
  );
}

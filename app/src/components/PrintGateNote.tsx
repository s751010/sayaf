/**
 * «الطباعة تنتظر النطاق النهائي» — **نصٌّ واحد** لكل شاشةٍ تُصدِّر كوداً
 * يُطبَع: عدّة الطباعة وأكواد QR وبطاقات الكاشير.
 *
 * الشرط من `printGate` (`lib/printKit.ts`) والنصّ من هنا؛ والأزرار المقفلة
 * تشير إليه بـ`aria-describedby={PRINT_GATE_NOTE_ID}` فيسمع قارئ الشاشة
 * **لماذا** هي معطّلة. كانت «أكواد QR» و«البطاقات» تنزّلان وتطبعان كوداً على
 * نطاقٍ مؤقّت — والمطبوع لا يُحدَّث (أمن ٢٠٢٦/١١/٠٩، البند ٧؛ قرار المالك).
 */
import type { PrintGate } from "@/lib/printKit";
import { Icon } from "@/lib/icons";

export const PRINT_GATE_NOTE_ID = "print-gate-note";

export function PrintGateNote({ gate, className = "mt-6" }: { gate: PrintGate; className?: string }) {
  if (gate.ready) return null;
  return (
    <div
      id={PRINT_GATE_NOTE_ID}
      role="note"
      className={`${className} flex items-start gap-3 rounded-xl border border-line-gold bg-gold/10 p-4`}
    >
      <Icon name="lock" size={20} className="mt-0.5 shrink-0 text-gold" />
      <div className="min-w-0">
        <p className="text-sm font-bold text-ink">الطباعة تنتظر النطاق النهائي</p>
        <p className="mt-1 text-sm leading-relaxed text-dim">
          {gate.note} جرّب الكود على الشاشة الآن؛ التنزيل والطباعة يُفتحان مع النطاق.
        </p>
        {gate.host && (
          <p className="mt-2 text-xs text-faint">
            الكود اليوم يشير إلى{" "}
            <bdi dir="ltr" className="break-all font-mono text-dim">
              {gate.host}
            </bdi>
          </p>
        )}
      </div>
    </div>
  );
}

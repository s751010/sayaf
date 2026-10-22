/**
 * سؤال الزبون قبل تحميل أدوات تتبّع التاجر الإعلانية (ميتا · قوقل · سناب).
 *
 * ⚠️ **لماذا السؤال لا الإشعار**: البكسل يرسل إلى طرفٍ ثالث معرّفاتٍ تربط
 * الزائر بحسابه الإعلاني — وهي معالجة لغرض تسويقي، أساسها في نظام حماية
 * البيانات الشخصية **الموافقة** لا مصلحة المنصّة. فلا يُحمَّل بايتٌ قبل «موافق»،
 * والرفض نهائيّ على هذا الجهاز (`K.PIXEL_CONSENT`).
 *
 * يُرسم بمتغيّرات الطابع (`--m-*`) كبقية المنيو: نافذةٌ بشكل المنصّة فوق منيو
 * التاجر تبدو إعلاناً دخيلاً.
 */
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function PixelConsent({
  en,
  raised,
  onAnswer,
}: {
  en: boolean;
  /** يرتفع فوق شريط السلة حين يظهر. */
  raised: boolean;
  onAnswer: (yes: boolean) => void;
}) {
  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={en ? "Tracking consent" : "موافقة التتبّع"}
      className={cn(
        "fixed inset-x-3 z-50 mx-auto max-w-md rounded-2xl border p-4 shadow-xl sm:inset-x-auto sm:start-5",
        raised ? "bottom-24" : "bottom-4"
      )}
      style={{
        // `--m-bg-2` لا `--m-surface`: الأخير شفّافٌ في بعض الطوابع فتظهر البطاقة خلفه.
        background: "var(--m-bg-2, var(--m-bg))",
        color: "var(--m-text)",
        borderColor: "var(--m-border)",
        fontFamily: "var(--m-font)",
      }}
    >
      <p className="text-sm leading-relaxed">
        {en
          ? "This restaurant uses ad measurement tools (Meta, Google, Snap) to know which ads bring visitors. Allow them?"
          : "يستعمل هذا المطعم أدوات قياس إعلانية (ميتا، قوقل، سناب) ليعرف أي إعلاناته تجلب الزوّار. تسمح بها؟"}{" "}
        <Link to="/privacy" className="underline underline-offset-2" style={{ color: "var(--m-accent-ink)" }}>
          {en ? "Privacy" : "الخصوصية"}
        </Link>
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onAnswer(true)}
          className="min-h-11 flex-1 rounded-xl px-4 text-sm font-bold"
          style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
        >
          {en ? "Allow" : "موافق"}
        </button>
        {/* الرفض بنفس وزن القبول بصرياً: زرٌّ باهت للرفض يصنع موافقةً لا يقصدها أحد. */}
        <button
          type="button"
          onClick={() => onAnswer(false)}
          className="min-h-11 flex-1 rounded-xl border px-4 text-sm font-bold"
          style={{ borderColor: "var(--m-border)", color: "var(--m-text)" }}
        >
          {en ? "Decline" : "لا، شكراً"}
        </button>
      </div>
    </div>
  );
}

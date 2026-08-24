/**
 * تقدّم بطاقة الولاء — كما يراه الزبون **لحظة الدفع**.
 *
 * ═══ لماذا هنا تحديداً ═══
 *
 * الختم صار تلقائياً عند كل دفعة (`mark_order_paid`)، لكنه كان يقع في صمت:
 * الزبون يدفع ويمضي ولا يعرف أنه اقترب من مكافأة. **وبرنامج ولاء لا يراه
 * صاحبه ليس برنامج ولاء — هو حقلٌ في جدول.**
 *
 * وأعلى لحظةِ انتباهٍ في رحلته كلّها هي شاشة ما بعد الدفع: يقف أمامها ينتظر
 * رقم استلامه. فهنا يُقال له ما ربحه، وكم بقي.
 *
 * ═══ لماذا نقاطٌ لا رقم ═══
 *
 * «٣ من ٥» يُقرأ حساباً. وخمس نقاط ثلاثٌ منها مملوءة تُقرأ **مسافةً قصيرة
 * بقيت** — وهذا هو أثر «التقدّم الموهوم» (endowed progress): الشوط الذي بدأ
 * فعلاً يُكمَل أكثر ممّا يُبدأ شوطٌ من الصفر.
 *
 * ولا تُرسم أكثر من عشر نقاط: بعدها يصير الصفّ زحاماً لا يُعدّ بنظرة، فيسقط
 * إلى «٧ من ١٢» بالأرقام — والحدّ الأعلى للهدف عشرون (`staff_stamp`).
 *
 * ═══ ولماذا كل لون بقيمة احتياطية ═══
 *
 * تُستعمَل في موضعين لا واحد: تذكرة الاستلام **داخل المنيو** (حيث تُعرَّف
 * `--m-*` بطابع التاجر، §18)، وصفحة متابعة الطلب `/o/:id` وهي **خارجه** —
 * لا طابع فيها ولا `--m-*`. فلولا الاحتياط لظهرت النقاط بلا لون على الثانية:
 * `var()` بمتغيّر غير معرَّف تسقط إلى «لا شيء» لا إلى الافتراض.
 */
import { mFont } from "@/components/menu/chrome";
import type { OrderLoyalty } from "@/lib/data";

export function LoyaltyProgress({ loyalty, en }: { loyalty: OrderLoyalty; en: boolean }) {
  const goal = Math.max(1, loyalty.goal);
  const stamps = Math.max(0, loyalty.stamps);
  /** المكتمل يبقى مكتملاً: أختامٌ فوق الهدف لا تُظهر شريطاً ناقصاً. */
  const filled = Math.min(stamps, goal);
  const left = Math.max(0, goal - stamps);
  const done = left === 0;
  const reward = (loyalty.reward ?? "").trim();

  return (
    <div
      className="mt-3 border-t pt-3"
      style={{ borderColor: "var(--m-border, var(--c-line))" }}
      // القارئ الصوتي يقرأ الجملة لا النقاط.
      aria-label={
        done
          ? en
            ? "Your loyalty card is complete"
            : "بطاقة ولائك مكتملة"
          : en
            ? `${stamps} of ${goal} stamps`
            : `${stamps} من ${goal} أختام`
      }
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-black" style={{ color: "var(--m-text, var(--c-ink))", ...mFont }}>
          {done
            ? en ? "🎉 Your card is full!" : "🎉 بطاقتك اكتملت!"
            : en ? "You earned a stamp" : "ربحت ختماً بهذا الطلب"}
        </p>
        {!done && (
          <p className="shrink-0 text-[11px] tabular-nums" style={{ color: "var(--m-muted, var(--c-dim))" }}>
            {stamps}/{goal}
          </p>
        )}
      </div>

      {/* النقاط — أو الأرقام حين يكبر الهدف فتصير النقاط زحاماً. */}
      {goal <= 10 ? (
        <div className="mt-2 flex flex-wrap gap-1.5" aria-hidden="true">
          {Array.from({ length: goal }, (_, i) => (
            <span
              key={i}
              className="h-4 w-4 rounded-full border transition-colors"
              style={{
                borderColor: "var(--m-accent, var(--c-gold))",
                background: i < filled ? "var(--m-accent, var(--c-gold))" : "transparent",
                // الختم الأخير الذي رُبح للتوّ يُبرَز بحلقة خفيفة.
                boxShadow: i === filled - 1 ? "0 0 0 3px color-mix(in srgb, var(--m-accent, var(--c-gold)) 25%, transparent)" : undefined,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--m-border, var(--c-line))" }} aria-hidden="true">
          <div
            className="h-full rounded-full"
            style={{ width: `${(filled / goal) * 100}%`, background: "var(--m-accent, var(--c-gold))" }}
          />
        </div>
      )}

      <p className="mt-2 text-[11px] leading-relaxed" style={{ color: "var(--m-muted, var(--c-dim))" }}>
        {done ? (
          reward
            ? en
              ? <>Ask the staff for your reward: <b style={{ color: "var(--m-text, var(--c-ink))" }}>{reward}</b></>
              : <>اطلب مكافأتك عند الاستلام: <b style={{ color: "var(--m-text, var(--c-ink))" }}>{reward}</b></>
            : en
              ? "Ask the staff for your reward."
              : "اطلب مكافأتك عند الاستلام."
        ) : reward ? (
          en ? (
            <>
              <b style={{ color: "var(--m-text, var(--c-ink))" }}>{left}</b> more {left === 1 ? "visit" : "visits"} and{" "}
              <b style={{ color: "var(--m-text, var(--c-ink))" }}>{reward}</b> is yours.
            </>
          ) : (
            <>
              بقي <b style={{ color: "var(--m-text, var(--c-ink))" }}>{left}</b>{" "}
              {left === 1 ? "طلب واحد" : left === 2 ? "طلبان" : `${left} طلبات`} و
              <b style={{ color: "var(--m-text, var(--c-ink))" }}>{reward}</b> لك.
            </>
          )
        ) : en ? (
          <>
            <b style={{ color: "var(--m-text, var(--c-ink))" }}>{left}</b> more to complete your card.
          </>
        ) : (
          <>
            بقي <b style={{ color: "var(--m-text, var(--c-ink))" }}>{left}</b> لإكمال بطاقتك.
          </>
        )}
      </p>

      {loyalty.card_code && (
        <p className="mt-1.5 text-[11px]" style={{ color: "var(--m-muted, var(--c-dim))" }}>
          {en ? "Card code" : "رمز بطاقتك"}:{" "}
          <b className="tracking-[0.12em]" style={{ color: "var(--m-text, var(--c-ink))", direction: "ltr", unicodeBidi: "isolate" }}>
            {loyalty.card_code}
          </b>
        </p>
      )}
    </div>
  );
}

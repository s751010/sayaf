/**
 * صفحة الهبوط — واجهة المنصة التسويقية.
 *
 * الحركة هنا مبنيّة على `lib/reveal.ts` (مراقب تقاطع + حرّاس تقليل الحركة) لا
 * على مكتبة حركة: الحزمة الرئيسية تخدم **صفحة المنيو** التي تُفتح من كود QR على
 * بيانات جوال، فكل كيلوبايت يُضاف لتسويقنا يدفعه زبون التاجر.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Navbar, Footer } from "@/components/site";
import { Badge, Card } from "@/components/ui";
import { CURRENCY, PLANS, effectiveMonthly, planPrice, type BillingCycle } from "@/lib/plans";
import { prefersReducedMotion, useCountUp, useReveal, useTilt } from "@/lib/reveal";
import { cn, formatPrice } from "@/lib/utils";

/* ── معاينة هاتف حيّة (عرض تسويقي ثابت) ────────────────────────────── */
const DEMO_DISHES = [
  { emoji: "🥩", name: "ستيك واقيو مشوي", price: 189, cal: 620 },
  { emoji: "🍤", name: "روبيان مقرمش بالعسل", price: 78, cal: 540 },
  { emoji: "🥗", name: "سلطة البرّاتا والرمان", price: 52, cal: 310 },
  { emoji: "☕", name: "قهوة سعودية بالهيل", price: 18, cal: 15 },
];

function PhonePreview() {
  const tilt = useTilt<HTMLAnchorElement>(10);
  return (
    // المعاينة تفتح المنيو التجريبي الحقيقي — كانت صورة ثابتة لا تؤدي لشيء.
    <Link
      ref={tilt}
      to="/demo"
      aria-label="افتح المنيو التجريبي"
      className="tilt anim-float relative mx-auto block w-[270px] select-none"
    >
      <div className="rounded-[2.6rem] border border-line-gold bg-[#141210] p-2.5 shadow-[0_40px_80px_-30px_rgba(0,0,0,.6)]">
        <div className="overflow-hidden rounded-[2rem] bg-[#1b1813] pb-4">
          <div className="flex flex-col items-center gap-1.5 bg-gradient-to-b from-[#2a2318] to-transparent px-4 pb-4 pt-7 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d4a843]/15 text-2xl">🍽️</span>
            <p className="font-display text-sm font-black text-[#faf6ee]">مطعم الديوان</p>
            <span className="rounded-full bg-[#d4a843]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#d4a843]">
              طاولة ٥ · منيو رقمي
            </span>
          </div>
          <div className="flex gap-1.5 overflow-hidden px-3 pb-3">
            {["المشاوي", "المقبلات", "الحلويات", "المشروبات"].map((c, i) => (
              <span
                key={c}
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold",
                  i === 0 ? "bg-[#d4a843] text-[#141210]" : "bg-white/5 text-[#9a8f7c]"
                )}
              >
                {c}
              </span>
            ))}
          </div>
          <div className="flex flex-col gap-2 px-3">
            {DEMO_DISHES.map((d) => (
              <div key={d.name} className="flex items-center gap-2.5 rounded-xl bg-white/[.045] p-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-lg">
                  {d.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-bold text-[#faf6ee]">{d.name}</p>
                  <p className="text-[9px] text-[#9a8f7c]">{d.cal} سعرة حرارية</p>
                </div>
                <span className="text-[11px] font-black text-[#d4a843]">{d.price} ر.س</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <span className="absolute -left-5 top-16 rounded-2xl border border-line-gold bg-panel px-3 py-2 text-xs font-bold shadow-xl">
        ⭐ تقييم قوقل
      </span>
      <span className="absolute -right-4 bottom-24 rounded-2xl border border-line-gold bg-panel px-3 py-2 text-xs font-bold text-gold shadow-xl">
        اضغط للتجربة ←
      </span>
    </Link>
  );
}


/* ── حركة ───────────────────────────────────────────────────────────── */

/**
 * غلاف الكشف عند التمرير.
 *
 * `delay` بالمللي ثانية لتتابع الأبناء: ظهور ثمانِ بطاقات دفعةً واحدة يبدو
 * وميضاً، وظهورها بفارق ٦٠ مللي يبدو ترتيباً مقصوداً.
 */
function Reveal({
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

/** رقم يعدّ عند ظهوره — الأرقام الثابتة لا تُقرأ، والمتحرّكة تُلاحَظ. */
function Stat({ to, suffix, label }: { to: number; suffix?: string; label: string }) {
  const { ref, shown } = useReveal<HTMLDivElement>();
  const n = useCountUp(to, shown);
  return (
    <div ref={ref} className="text-center">
      <p className="font-display text-4xl font-black text-gold-grad" dir="ltr">
        {n}
        {suffix}
      </p>
      <p className="mt-1 text-sm text-dim">{label}</p>
    </div>
  );
}

/**
 * معاينة بطاقة الكاشير — تُرسم بـ`renderCard()` **نفسها** التي تُنتج ملف
 * التاجر، فما يراه الزائر هو المُخرَج الحقيقي لا صورة تسويقية مُجمَّلة.
 *
 * الوحدة تُستورد ديناميكياً: `lib/cards.ts` تجرّ معها `qrcode` والطوابع
 * والزخارف، ولا داعي لأن يحملها زائر لا يمرّر إلى هذا القسم أصلاً.
 */
/** يقلّب على **النمط والتخطيط معاً** — الفرق الحقيقي في التخطيط لا في اللون. */
const SHOWCASE = [
  { style: "dark", layout: "centered" },
  { style: "heritage", layout: "split" },
  { style: "brand", layout: "framed" },
  { style: "night", layout: "banner" },
] as const;

function CardShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { ref, shown } = useReveal<HTMLDivElement>();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!shown) return;
    let alive = true;
    void (async () => {
      const { renderCard } = await import("@/lib/cards");
      if (!alive || !canvasRef.current) return;
      await renderCard(
        canvasRef.current,
        {
          size: "counter",
          style: SHOWCASE[i].style,
          layout: SHOWCASE[i].layout,
          name: "مطعم الديوان",
          logo: null,
          emoji: "🍽️",
          themeId: "najdi",
          brandHex: null,
          url: `${window.location.origin}/demo`,
          table: "5",
          promo: "قهوتك الثانية مجاناً ☕",
        },
        0.4
      );
    })();
    return () => {
      alive = false;
    };
  }, [i, shown]);

  useEffect(() => {
    // التقليب حركة مستمرة، فمن يطلب تقليلها يرى نمطاً واحداً ثابتاً.
    if (!shown || prefersReducedMotion()) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % SHOWCASE.length), 3200);
    return () => window.clearInterval(t);
  }, [shown]);

  return (
    <div ref={ref} className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        aria-label="معاينة بطاقة الكاشير"
        className="anim-float w-[230px] rounded-2xl shadow-[0_40px_80px_-30px_rgba(0,0,0,.65)] sm:w-[260px]"
      />
      <div className="flex gap-1.5">
        {SHOWCASE.map((s, n) => (
          <button
            key={s.style}
            onClick={() => setI(n)}
            aria-label={`نمط ${n + 1}`}
            className={cn(
              "h-1.5 rounded-full transition-all",
              n === i ? "w-6 bg-gold" : "w-1.5 bg-ink/20 hover:bg-ink/35"
            )}
          />
        ))}
      </div>
    </div>
  );
}

/* ── الأقسام ───────────────────────────────────────────────────────── */
const FEATURES = [
  { emoji: "📱", title: "منيو QR فوري", desc: "زبونك يمسح الكود ويتصفح المنيو في ثانية — بلا تطبيق، بلا انتظار، وبثيمات فاخرة تناسب هوية مطعمك." },
  { emoji: "🎨", title: "ثيمات + لون علامتك", desc: "اثنا عشر ثيماً فاخراً بينها طوابع تراثية سعودية، أو اختر لون مشروعك وسنبني منه ثيماً كاملاً متناسقاً." },
  { emoji: "📊", title: "إحصائيات مباشرة", desc: "اعرف أكثر الأطباق مشاهدةً وأوقات الذروة يوماً بيوم، وخذ قراراتك بالأرقام لا بالتخمين." },
  { emoji: "🍎", title: "معلومات غذائية وSFDA", desc: "سعرات، صوديوم، كافيين، ومسببات الحساسية لكل طبق — التزام كامل بمتطلبات هيئة الغذاء والدواء." },
  { emoji: "💛", title: "بطاقة ولاء رقمية", desc: "كافئ زبائنك المتكررين بنظام نقاط مدمج في المنيو نفسه — بلا بطاقات ورقية تضيع." },
  { emoji: "🕐", title: "ساعات عمل ذكية", desc: "حدّد ساعات كل يوم وأيام الإجازة، ويرى الزبون «مفتوح الآن» أو موعد الافتتاح تلقائياً بتوقيت الرياض." },
  { emoji: "🌐", title: "ثنائي اللغة", desc: "منيو عربي/إنجليزي بضغطة زر لضيوفك من كل مكان." },
  { emoji: "⚡", title: "تحديث لحظي", desc: "غيّر سعراً أو أخفِ طبقاً نفد — يظهر التغيير عند الزبون فوراً دون إعادة طباعة أي شيء." },
];

const STEPS = [
  { n: "١", title: "سجّل وأنشئ مطعمك", desc: "حساب جديد ورابط خاص بمطعمك في أقل من دقيقة." },
  { n: "٢", title: "أضف أطباقك", desc: "أصناف، صور، أسعار، ومعلومات غذائية — من لوحة تحكم عربية سهلة." },
  { n: "٣", title: "نزّل بطاقتك واطبعها", desc: "بطاقة كاشير جاهزة بهوية مطعمك — أو كوداً لكل طاولة. ضعها على الطاولة وخلاص." },
];

/** أرقام من المنتج نفسه لا ادّعاءات سوق — كلٌّ منها يقابله شيء يراه الزائر. */
const STATS: { to: number; suffix?: string; label: string }[] = [
  { to: 12, label: "ثيماً فاخراً للمنيو" },
  { to: 4, label: "أشكال بطاقة كاشير" },
  { to: 300, suffix: " DPI", label: "دقة ملف الطباعة" },
  { to: 0, label: "تطبيقات يحمّلها زبونك" },
];

const CARD_POINTS = [
  { t: "شعار مطعمك واسمه", d: "يُسحبان من حسابك تلقائياً — ويظهر شعارك داخل الكود نفسه." },
  { t: "ألوان هويتك وثيم منيوك", d: "البطاقة تأخذ ألوانها من ثيم منيوك، فتتطابق مع ما يراه الزبون بعد المسح." },
  { t: "رقم الطاولة وعرض ترويجي", d: "سطران اختياريان: الكود يفتح المنيو على الطاولة، والعرض يظهر تحته." },
];

const FAQS = [
  { q: "هل يحتاج الزبون تحميل تطبيق؟", a: "أبداً. يمسح كود QR بكاميرا جواله ويفتح المنيو في المتصفح مباشرة — يعمل على كل الأجهزة." },
  { q: "هل أقدر أعدّل الأسعار بنفسي؟", a: "نعم، من لوحة تحكم عربية بالكامل. أي تعديل يظهر للزبائن لحظياً." },
  { q: "كيف تُحسب الطاولات؟", a: "تولّد كود QR خاصاً لكل طاولة (طاولة ١، طاولة ٢…) ويظهر رقم الطاولة تلقائياً عند فتح المنيو." },
  { q: "ما طرق الدفع المتاحة للاشتراك؟", a: "مدى، البطاقات الائتمانية وApple Pay عبر بوّابة PayLink السعودية. تُحوَّل إلى صفحة الدفع الآمنة، وبيانات بطاقتك لا تمرّ بنا ولا نحتفظ بها." },
  { q: "هل بياناتي آمنة؟", a: "بياناتك محفوظة في قواعد بيانات سحابية مشفّرة مع صلاحيات وصول صارمة، ونسخ احتياطي مستمر." },
  { q: "هل هناك باقات متعددة؟", a: "لا — باقة واحدة بـ99 ر.س شهرياً تفتح كل المزايا بلا حدود: قوائم وأصناف غير محدودة، ثنائي اللغة، بطاقة ولاء، تحليلات، ودعم فني. أو 1089 ر.س سنوياً (شهر مجاني)." },
];

export function PricingCards({
  cycle,
  onSelect,
  selectLabel = "اشترك الآن",
}: {
  cycle: BillingCycle;
  onSelect?: (planId: string) => void;
  selectLabel?: string;
}) {
  const yearly = cycle === "yearly";
  return (
    <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2">
      {PLANS.map((p, i) => (
        <Card
          key={p.id}
          className={cn(
            "anim-fade-up relative flex flex-col",
            p.featured && "border-gold/40 bg-gold/[.04] shadow-[0_0_50px_-18px_var(--c-glow)]"
          )}
        >
          {p.featured && (
            <Badge className="absolute -top-3 right-5">الأكثر اختياراً</Badge>
          )}
          <h3 className={cn("font-display text-xl font-extrabold text-ink", i === 0 && "mt-0")}>
            {p.name}
          </h3>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-4xl font-black text-gold">
              {formatPrice(planPrice(p, cycle))}
            </span>
            <span className="text-sm text-dim">
              {CURRENCY} / {yearly ? "سنوياً" : "شهرياً"}
            </span>
          </div>
          <p className="mt-1 h-4 text-xs text-faint">
            {yearly ? `يعادل ${formatPrice(effectiveMonthly(p, cycle))} ${CURRENCY}/شهر` : ""}
          </p>
          <ul className="mt-5 flex flex-1 flex-col gap-2.5">
            {p.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-ink">
                <span className="text-good">✓</span> {f}
              </li>
            ))}
          </ul>
          {onSelect ? (
            <button
              onClick={() => onSelect(p.id)}
              className={cn(
                "mt-6 w-full rounded-xl py-2.5 text-sm font-bold transition-colors",
                p.featured
                  ? "bg-gold text-on-gold hover:bg-gold2"
                  : "border border-line-gold text-ink hover:bg-gold/10"
              )}
            >
              {selectLabel}
            </button>
          ) : (
            <Link
              to="/login?mode=signup"
              className={cn(
                "mt-6 w-full rounded-xl py-2.5 text-center text-sm font-bold transition-colors",
                p.featured
                  ? "bg-gold text-on-gold hover:bg-gold2"
                  : "border border-line-gold text-ink hover:bg-gold/10"
              )}
            >
              {selectLabel}
            </Link>
          )}
        </Card>
      ))}
    </div>
  );
}

export default function Landing() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />

      {/* البطل */}
      <section className="glow-bg">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-14 lg:grid-cols-2 lg:pt-20">
          <div className="anim-fade-up text-center lg:text-right">
            <Badge className="mb-5">🇸🇦 صُنع للمطاعم السعودية</Badge>
            <h1 className="font-display text-4xl font-black leading-[1.2] text-ink sm:text-5xl">
              منيو مطعمك…
              <br />
              <span className="text-gold-grad">تجربة رقمية فاخرة</span>
            </h1>
            <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-dim lg:mx-0">
              كود QR واحد يفتح لزبائنك منيو أنيقاً بثيمات فاخرة، ويعطيك إحصائيات مباشرة،
              وولاءً رقمياً — كل ذلك بلا تطبيقات وبلا تعقيد.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link
                to="/login?mode=signup"
                className="rounded-xl bg-gold px-6 py-3 font-bold text-on-gold shadow-[0_8px_30px_-8px_var(--c-glow)] transition-transform hover:bg-gold2 active:scale-[.98]"
              >
                ابدأ الآن مجاناً
              </Link>
              {/* تجربة المنتج الحقيقية أقوى من قائمة مزايا — نضعها ثاني زر. */}
              <Link
                to="/demo"
                className="rounded-xl border border-line-gold px-6 py-3 font-bold text-ink hover:bg-gold/10"
              >
                👀 جرّب منيو تجريبي
              </Link>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-xs text-faint lg:justify-start">
              <span>⚡ تجهيز في دقائق</span>
              <span>💳 مدى وApple Pay</span>
              <span>🛡️ متوافق مع SFDA</span>
            </div>
          </div>
          <PhonePreview />
        </div>
      </section>

      {/* أرقام المنتج */}
      <section className="border-y border-line bg-panel/40">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-5 py-10 sm:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 80}>
              <Stat to={s.to} suffix={s.suffix} label={s.label} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* المزايا */}
      <section id="features" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-16">
        <Reveal className="mb-10 text-center">
          <h2 className="font-display text-3xl font-black text-ink">
            كل ما يحتاجه مطعمك… <span className="text-gold">في مكان واحد</span>
          </h2>
          <p className="mt-2 text-dim">منصة متكاملة، وليست مجرد منيو.</p>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            // التتابع بمضاعفات الصف لا بالفهرس: ثمانِ بطاقات × ٦٠ = نصف ثانية
            // انتظار لآخرها، والزائر يكون قد مرّ عليها.
            <Reveal key={f.title} delay={(i % 4) * 70} className="h-full">
              <Card className="lift h-full">
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gold/12 text-2xl">
                  {f.emoji}
                </span>
                <h3 className="font-display font-extrabold text-ink">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-dim">{f.desc}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* كيف تعمل */}
      <section className="border-y border-line bg-panel/50">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <Reveal>
            <h2 className="mb-10 text-center font-display text-3xl font-black text-ink">
              ثلاث خطوات <span className="text-gold">وتنطلق</span>
            </h2>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 110}>
                <div className="text-center">
                  <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-line-gold bg-gold/10 font-display text-2xl font-black text-gold">
                    {s.n}
                  </span>
                  <h3 className="font-display font-extrabold text-ink">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-dim">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* بطاقة الكاشير */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <Badge className="mb-5">🪧 جديد</Badge>
            <h2 className="font-display text-3xl font-black leading-[1.25] text-ink">
              بطاقة كاشير <span className="text-gold-grad">بهويتك أنت</span>
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-dim">
              لا تفتح كانفا ولا تبحث عن مصمّم: نجهّز لك البطاقة من بيانات مطعمك،
              وتنزّلها ملفّ PNG بدقة ٣٠٠ DPI يقبله أي مطبعة — أو تطبعها بنفسك على
              ورقة A4 بخطوط قصّ جاهزة.
            </p>
            <ul className="mt-6 flex flex-col gap-3.5">
              {CARD_POINTS.map((p) => (
                <li key={p.t} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-good/15 text-[11px] font-black text-good">
                    ✓
                  </span>
                  <span>
                    <b className="block text-sm font-bold text-ink">{p.t}</b>
                    <span className="text-sm leading-relaxed text-dim">{p.d}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/login?mode=signup"
                className="rounded-xl bg-gold px-6 py-3 font-bold text-on-gold shadow-[0_8px_30px_-8px_var(--c-glow)] transition-transform hover:bg-gold2 active:scale-[.98]"
              >
                جهّز بطاقتك مجاناً
              </Link>
              <span className="text-xs text-faint">متاحة لكل تاجر — بما فيهم أيام التجربة.</span>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <CardShowcase />
          </Reveal>
        </div>
      </section>

      {/* الأسعار */}
      <section id="pricing" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-16">
        <Reveal className="mb-8 text-center">
          <h2 className="font-display text-3xl font-black text-ink">
            أسعار <span className="text-gold">واضحة وعادلة</span>
          </h2>
          <p className="mt-2 text-dim">بدون رسوم خفية — ألغِ في أي وقت.</p>
        </Reveal>
        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-xl border border-line bg-panel p-1">
            {(["monthly", "yearly"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-bold transition-colors",
                  cycle === c ? "bg-gold text-on-gold" : "text-dim hover:text-ink"
                )}
              >
                {c === "monthly" ? "شهري" : "سنوي"}
                {c === "yearly" && (
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[11px]",
                    cycle === "yearly" ? "bg-on-gold/15 text-on-gold" : "bg-good/15 text-good"
                  )}>
                    شهر مجاني
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        <PricingCards cycle={cycle} selectLabel="ابدأ الآن" />
      </section>

      {/* الأسئلة الشائعة */}
      <section className="mx-auto w-full max-w-3xl px-5 pb-20">
        <Reveal>
          <h2 className="mb-8 text-center font-display text-3xl font-black text-ink">
            أسئلة <span className="text-gold">شائعة</span>
          </h2>
        </Reveal>
        <div className="flex flex-col gap-3">
          {FAQS.map((f, i) => (
            <Card key={f.q} className="cursor-pointer p-0">
              <button
                className="flex w-full items-center justify-between gap-4 p-5 text-right"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
              >
                <span className="font-bold text-ink">{f.q}</span>
                <span className={cn("text-gold transition-transform", openFaq === i && "rotate-45")}>＋</span>
              </button>
              {openFaq === i && (
                <p className="anim-fade-up px-5 pb-5 text-sm leading-relaxed text-dim">{f.a}</p>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* دعوة أخيرة */}
      <section className="glow-bg border-t border-line">
        <Reveal className="mx-auto max-w-3xl px-5 py-16 text-center">
          <h2 className="font-display text-3xl font-black text-ink">
            جاهز ترقّي تجربة <span className="text-gold-grad">مطعمك؟</span>
          </h2>
          <p className="mt-3 text-dim">انضم لمطاعم اختارت المنيو الرقمي — واجعل كل طاولة تبيع أكثر.</p>
          <Link
            to="/login?mode=signup"
            className="mt-7 inline-block rounded-xl bg-gold px-8 py-3.5 font-bold text-on-gold shadow-[0_8px_30px_-8px_var(--c-glow)] hover:bg-gold2"
          >
            أنشئ منيوك الآن
          </Link>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}

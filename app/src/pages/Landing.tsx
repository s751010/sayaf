/** صفحة الهبوط — واجهة المنصة التسويقية. */
import { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar, Footer } from "@/components/site";
import { Badge, Card } from "@/components/ui";
import { CURRENCY, PLANS, effectiveMonthly, planPrice, type BillingCycle } from "@/lib/plans";
import { cn, formatPrice } from "@/lib/utils";

/* ── معاينة هاتف حيّة (عرض تسويقي ثابت) ────────────────────────────── */
const DEMO_DISHES = [
  { emoji: "🥩", name: "ستيك واقيو مشوي", price: 189, cal: 620 },
  { emoji: "🍤", name: "روبيان مقرمش بالعسل", price: 78, cal: 540 },
  { emoji: "🥗", name: "سلطة البرّاتا والرمان", price: 52, cal: 310 },
  { emoji: "☕", name: "قهوة سعودية بالهيل", price: 18, cal: 15 },
];

function PhonePreview() {
  return (
    <div className="anim-float relative mx-auto w-[270px] select-none">
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
        📈 ‎+38% مبيعات
      </span>
      <span className="absolute -right-4 bottom-24 rounded-2xl border border-line-gold bg-panel px-3 py-2 text-xs font-bold shadow-xl">
        ⭐ تقييم قوقل
      </span>
    </div>
  );
}

/* ── الأقسام ───────────────────────────────────────────────────────── */
const FEATURES = [
  { emoji: "📱", title: "منيو QR فوري", desc: "زبونك يمسح الكود ويتصفح المنيو في ثانية — بلا تطبيق، بلا انتظار، وبثيمات فاخرة تناسب هوية مطعمك." },
  { emoji: "🎨", title: "٨ ثيمات فاخرة", desc: "ليلي ذهبي، زمردي، ملكي، مينيمال… بدّل مظهر منيوك بضغطة واحدة ليطابق أجواء مطعمك." },
  { emoji: "📊", title: "إحصائيات مباشرة", desc: "اعرف أكثر الأطباق مشاهدةً وأوقات الذروة يوماً بيوم، وخذ قراراتك بالأرقام لا بالتخمين." },
  { emoji: "🍎", title: "معلومات غذائية وSFDA", desc: "سعرات، صوديوم، كافيين، ومسببات الحساسية لكل طبق — التزام كامل بمتطلبات هيئة الغذاء والدواء." },
  { emoji: "💛", title: "بطاقة ولاء رقمية", desc: "كافئ زبائنك المتكررين بنظام نقاط مدمج في المنيو نفسه — بلا بطاقات ورقية تضيع." },
  { emoji: "🤖", title: "مستشار ذكي", desc: "مجلس استشاري بالذكاء الاصطناعي: تسويق، تسعير، نمو، وتقنية — إجابات عملية لمطعمك على مدار الساعة." },
  { emoji: "🌐", title: "ثنائي اللغة", desc: "منيو عربي/إنجليزي بضغطة زر لضيوفك من كل مكان." },
  { emoji: "⚡", title: "تحديث لحظي", desc: "غيّر سعراً أو أخفِ طبقاً نفد — يظهر التغيير عند الزبون فوراً دون إعادة طباعة أي شيء." },
];

const STEPS = [
  { n: "١", title: "سجّل وأنشئ مطعمك", desc: "حساب جديد ورابط خاص بمطعمك في أقل من دقيقة." },
  { n: "٢", title: "أضف أطباقك", desc: "أصناف، صور، أسعار، ومعلومات غذائية — من لوحة تحكم عربية سهلة." },
  { n: "٣", title: "اطبع كود QR", desc: "نزّل أكواداً لكل طاولة وضعها على الطاولات — وخلاص، منيوك صار رقمياً." },
];

const FAQS = [
  { q: "هل يحتاج الزبون تحميل تطبيق؟", a: "أبداً. يمسح كود QR بكاميرا جواله ويفتح المنيو في المتصفح مباشرة — يعمل على كل الأجهزة." },
  { q: "هل أقدر أعدّل الأسعار بنفسي؟", a: "نعم، من لوحة تحكم عربية بالكامل. أي تعديل يظهر للزبائن لحظياً." },
  { q: "كيف تُحسب الطاولات؟", a: "تولّد كود QR خاصاً لكل طاولة (طاولة ١، طاولة ٢…) ويظهر رقم الطاولة تلقائياً عند فتح المنيو." },
  { q: "ما طرق الدفع المتاحة للاشتراك؟", a: "مدى، البطاقات الائتمانية، Apple Pay وSTC Pay عبر بوابة Moyasar السعودية الآمنة." },
  { q: "هل بياناتي آمنة؟", a: "بياناتك محفوظة في قواعد بيانات سحابية مشفّرة مع صلاحيات وصول صارمة، ونسخ احتياطي مستمر." },
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
              وولاءً رقمياً، ومستشاراً ذكياً — كل ذلك بلا تطبيقات وبلا تعقيد.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link
                to="/login?mode=signup"
                className="rounded-xl bg-gold px-6 py-3 font-bold text-on-gold shadow-[0_8px_30px_-8px_var(--c-glow)] transition-transform hover:bg-gold2 active:scale-[.98]"
              >
                ابدأ الآن مجاناً
              </Link>
              <a
                href="#features"
                className="rounded-xl border border-line-gold px-6 py-3 font-bold text-ink hover:bg-gold/10"
              >
                اكتشف المزايا
              </a>
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

      {/* المزايا */}
      <section id="features" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-16">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-black text-ink">
            كل ما يحتاجه مطعمك… <span className="text-gold">في مكان واحد</span>
          </h2>
          <p className="mt-2 text-dim">منصة متكاملة، وليست مجرد منيو.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Card key={f.title} className="transition-transform hover:-translate-y-1 hover:border-gold/30">
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gold/12 text-2xl">
                {f.emoji}
              </span>
              <h3 className="font-display font-extrabold text-ink">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-dim">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* كيف تعمل */}
      <section className="border-y border-line bg-panel/50">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <h2 className="mb-10 text-center font-display text-3xl font-black text-ink">
            ثلاث خطوات <span className="text-gold">وتنطلق</span>
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="text-center">
                <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-line-gold bg-gold/10 font-display text-2xl font-black text-gold">
                  {s.n}
                </span>
                <h3 className="font-display font-extrabold text-ink">{s.title}</h3>
                <p className="mt-1.5 text-sm text-dim">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* الأسعار */}
      <section id="pricing" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-16">
        <div className="mb-8 text-center">
          <h2 className="font-display text-3xl font-black text-ink">
            أسعار <span className="text-gold">واضحة وعادلة</span>
          </h2>
          <p className="mt-2 text-dim">بدون رسوم خفية — ألغِ في أي وقت.</p>
        </div>
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
        <h2 className="mb-8 text-center font-display text-3xl font-black text-ink">
          أسئلة <span className="text-gold">شائعة</span>
        </h2>
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
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
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
        </div>
      </section>

      <Footer />
    </div>
  );
}

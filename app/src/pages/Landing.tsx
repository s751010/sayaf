/**
 * صفحة الهبوط — **«منيو يشبه مطعمك، ويبيع عنك»**.
 *
 * ═══ البنية (٢٠٢٦/١٠/٢١) ═══
 *
 *   ١. البطل: الوعد، وتحته **منيو الزائر نفسه** — يكتب اسم مطعمه ويرفع شعاره
 *      ويختار لونه وطابعه، فيتبدّل المنيو الحقيقي في الجوّال أمامه.
 *   ٢. لماذا يبيع: أربع نتائج لا أربع مزايا.
 *   ٣. كيف يعمل: ثلاث خطوات.   ٤. الطوابع الستّة: لكلّ نوع مطعم واحد.
 *   ٥. الحاسبة: «سعراتك محسوبة، لا مكتوبة».   ٦. وفوقها.
 *   ٧. السعر.  ٨. الأسئلة.  ٩. الدعوة الأخيرة.
 *
 * ⚠️ كان البطل الحاسبة: «سعراتك محسوبة، لا مكتوبة». وهي ميزةٌ حقيقية تحلّ
 * إلزاماً نظامياً — لكنّها **ميزة**، والتاجر لا يشتري ميزة: يشتري منيواً
 * يجعل مطعمه يبدو أفضل ويبيع أكثر. فصار البطل جواب سؤاله الأوّل («كيف سيبدو
 * منيوي؟»)، ونزلت الحاسبة قسماً يقنع من وصل إليه.
 *
 * الحركة: `lib/reveal.ts` للأقسام، و`motion` في الحاسبة الكسولة وحدها — الحزمة
 * الرئيسية تخدم **صفحة المنيو** التي تُفتح من كود QR على بيانات جوال.
 */
import { Fragment, Suspense, lazy, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Navbar, Footer } from "@/components/site";
import { Card } from "@/components/ui";
import { Reveal } from "@/components/landing/Reveal";
import { BrandControls, DEFAULT_BRAND, PhoneMenu, type Brand } from "@/components/landing/LiveMenu";
import { PricingCards, daysLabel, useTrialDays } from "@/components/landing/PricingCards";
import { ThemePreview } from "@/components/menu/ThemePreview";
import { CURRENCY, CURRENCY_CODE, PLAN, PLANS, effectiveMonthly, type BillingCycle } from "@/lib/plans";
import { cn, formatPrice } from "@/lib/utils";
import { Icon, type IconName } from "@/lib/icons";
import { ALL_THEMES } from "@/lib/themes";
import { CTA_PRIMARY, CTA_SECONDARY, PRINT_DPI, THEMES_LABEL } from "@/lib/facts";
import { absoluteUrl, useJsonLd, useSeo } from "@/lib/seo";

/**
 * الحاسبة كسولةٌ عمداً: تحمل `motion` ومحرّك الوصفة وجدول المكوّنات، وهي قسمٌ
 * تحت البطل. ومكانها محجوزٌ بارتفاعها (`CALC_MIN_H`) فلا تقفز الصفحة.
 */
const HeroCalculator = lazy(() =>
  import("@/components/landing/HeroCalculator").then((m) => ({ default: m.HeroCalculator }))
);
const CALC_MIN_H = "min-h-[850px] md:min-h-[480px]";

/**
 * عنوان يتجمّع كلمةً كلمة — بالكلمة لا بالحرف (التقسيم الحرفي يكسر وصل
 * الحروف العربية)، و`aria-label` يحمل الجملة كاملة لقارئ الشاشة.
 */
function Words({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <span className={cn("word-in", className)} aria-label={text}>
      {/* ⚠️ **المسافة خارج الكلمة لا داخلها**: الكلمة `inline-block` (لتتحرّك)،
          والمسافة في آخر صندوقٍ كهذا تُطوى — فخرج العنوان بالمراعي
          «سعراتكمحسوبة» كلمةً واحدة. */}
      {words.map((w, i) => (
        <Fragment key={`${w}-${i}`}>
          <span className="word" style={{ "--w": i } as CSSProperties} aria-hidden="true">
            {w}
          </span>
          {i < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </span>
  );
}

/* ── المحتوى ───────────────────────────────────────────────────────── */

/**
 * ما يكسبه التاجر — **نتائج لا مزايا**. كلٌّ منها شيءٌ يفعله المنتج اليوم:
 * «طبق اليوم» و«الأكثر طلباً» (`popular_dishes` من طلبات حقيقية)، والطلب
 * والدفع (§13)، وبطاقة الولاء، والحاسبة (§26).
 */
const OUTCOMES: { icon: IconName; title: string; desc: string }[] = [
  { icon: "star", title: "يعرض أطباقك كما تستحق", desc: "صورٌ كبيرة، و«طبق اليوم»، و«الأكثر طلباً» من طلبات زبائنك الفعلية — فيختار الزبون ما تريد أن تبيعه." },
  { icon: "money", title: "يطلب ويدفع من الطاولة", desc: "طلبات واتساب، أو دفعٌ بمدى وApple Pay يصل حسابك مباشرة — بلا عمولة منّا." },
  { icon: "heart", title: "يرجّع لك الزبون", desc: "بطاقة ولاء بالأختام داخل المنيو — بلا تطبيق، ولا بطاقة ورقية تضيع." },
  // ⚠️ كانت «نظاميّ من أول يوم… كما تطلب الهيئة»: وعدُ امتثالٍ تنقضه الشروط
  // («وسيلة عرض لا جهة اعتماد»). الحاسبة تقدير من جدول USDA، والمسؤولية على التاجر.
  { icon: "shield", title: "جاهز لاشتراطات الهيئة", desc: "السعرات والكافيين والصوديوم ومسبّبات الحساسية تُقدَّر من وصفاتك، وتُعرض بالصيغة التي تطلبها الهيئة — وتراجعها أنت قبل النشر." },
];

/** ثلاث خطوات — كلٌّ منها يفعله المنتج اليوم: قراءة الصورة، والطوابع، والنشر. */
const STEPS: { icon: IconName; title: string; desc: string }[] = [
  { icon: "image", title: "صوّر منيوك الحالي", desc: "نقرأ الأقسام والأصناف والأسعار من الصورة، وتراجعها قبل الحفظ." },
  { icon: "palette", title: "اختر طابعك وارفع شعارك", desc: `${THEMES_LABEL}، لكلّ نوع مطعم واحد — بلون علامتك.` },
  { icon: "qr", title: "اطبع كود الطاولة", desc: "كود QR لكل طاولة، وورقة A4 بالأرقام نفسها، وملف لتطبيقات التوصيل." },
];

/**
 * ستّ مزايا بسطرٍ لكلٍّ — الهويّة والطلب والولاء والحساب قيلت فوقها، فهنا ما
 * **فوقها**. والفقرات الطويلة صارت أسطراً: الزائر يمسح العناوين ولا يقرأ.
 */
const FEATURES: { icon: IconName; title: string; desc: string }[] = [
  { icon: "money", title: "طلبات ودفع من الطاولة", desc: "يدفع زبونك ويصلك المال مباشرة — بلا عمولة." },
  { icon: "qr", title: "كود لكل طاولة", desc: "ويظهر رقم الطاولة مع الطلب تلقائياً." },
  { icon: "card", title: `بطاقة كاشير — ${PRINT_DPI} DPI`, desc: "بشعارك وكودك، ملفٌّ تقبله أي مطبعة." },
  { icon: "heart", title: "بطاقة ولاء", desc: "زبونك يجمع أختامه بلا تطبيق." },
  { icon: "pulse", title: "تحليلات", desc: "أكثر الأطباق مشاهدةً، وساعات الذروة." },
  { icon: "edit", title: "تعديل فوري", desc: "سعرٌ تغيّر أو صنفٌ نفد — يظهر للزبون في لحظته." },
];

/** خمسة أسئلة: ما يمنع الاشتراك فعلاً، لا كل ما يمكن أن يُسأل. */
const FAQS = [
  { q: "من أين تأتي الأرقام الغذائية؟", a: "نحسبها من وصفتك: كل مكوّن بوزنه، من قيم مرجعية عامّة (USDA FoodData Central) لكل ١٠٠ غرام، ثم نقسمها على عدد الحصص. والمكوّن الذي لا مرجع مباشر له (كالقهوة السعودية) نعلّمه «تقديري» أمامك." },
  { q: "هل تغني عن أخصائي التغذية؟", a: "تختصر عليك الحساب، لكن المسؤولية النظامية تبقى على المنشأة. ننصح بمراجعة الأرقام مع أخصائي تغذية قبل الطباعة — وتعطيه وصفاتك وأرقامها جاهزة بدل أن يبدأ من الصفر." },
  { q: "هل يحتاج الزبون تحميل تطبيق؟", a: "لا. يمسح كود QR بكاميرا جواله ويفتح المنيو في المتصفح مباشرة." },
  { q: "عندي منيو على منصة أخرى — هل أبدأ من الصفر؟", a: "لا. صوّر منيوك الحالي ونقرأ أصنافه وأسعاره، أو الصقها نصّاً أو ملف Excel. وتقدر تحسب الأرقام هنا وتستعملها في أي منيو آخر." },
  { q: "كم السعر؟", a: `باقة واحدة بـ${PLAN.monthly} ر.س شهرياً تفتح كل شيء، أو ${PLAN.yearly} ر.س سنوياً — ما يعادل ${effectiveMonthly(PLAN, "yearly")} ر.س في الشهر. الدفع بمدى أو البطاقة أو Apple Pay عبر PayLink، وتلغي متى شئت.` },
];

/**
 * هل غادر هذا القسم الشاشة إلى الأعلى؟ حارس ظهور الشريط اللاصق.
 *
 * ⚠️ يُراقَب القسم كاملاً لا مرساة رفيعة: المرساة بكسلٌ واحد تقفز فوق الشاشة
 * بلا تقاطع حين يقفز التمرير، فلا يُبلَّغ شيء ويبقى الشريط غائباً.
 */
function usePassed<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => setPassed(!!e && !e.isIntersecting && e.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, passed };
}

/** رأس قسم موحّد — عنوانٌ وسطرٌ واحد، بالإيقاع نفسه في كل الصفحة. */
function SectionHead({ title, sub }: { title: ReactNode; sub?: string }) {
  return (
    <Reveal className="mx-auto mb-10 max-w-2xl text-center">
      <span aria-hidden="true" className="mx-auto mb-4 block h-1.5 w-12 bg-[linear-gradient(to_left,var(--c-rule)_70%,var(--c-sadu)_70%)]" />
      <h2 className="font-display text-3xl font-bold leading-[1.3] text-ink sm:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-lg leading-relaxed text-dim">{sub}</p>}
    </Reveal>
  );
}

export default function Landing() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [brand, setBrand] = useState<Brand>(DEFAULT_BRAND);
  const hero = usePassed<HTMLElement>();
  const builder = useRef<HTMLDivElement>(null);
  const trialDaysLabel = daysLabel(useTrialDays());

  useSeo({
    title: "منيو يشبه مطعمك ويبيع عنك",
    description: `منيو QR باسم مطعمك وشعاره وألوانه: يطلب الزبون ويدفع من الطاولة، ويجمع أختام الولاء، والسعرات التي تطلبها الهيئة محسوبة من وصفاتك. ${THEMES_LABEL}، ومنيو مطبوع A4.`,
    path: "/",
    image: "/og.png",
  });

  /**
   * ⚠️ الأسئلة تُبثّ من `FAQS` نفسها التي تُعرَض: مخطّط `FAQPage` يخالف نصّ
   * الصفحة محتوىً مخفيٌّ في إرشادات قوقل، وقد يُسقط النتيجة الغنيّة كلها.
   */
  useJsonLd("landing", {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "كلاود منيو",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: absoluteUrl("/"),
        inLanguage: "ar",
        description:
          "منيو QR ومطبوع للمطاعم والمقاهي السعودية باسم المطعم وشعاره وألوانه: طلب ودفع من الطاولة، وبطاقة ولاء، وسعرات وحساسية محسوبة من الوصفة.",
        offers: {
          "@type": "Offer",
          price: PLANS[0]?.monthly ?? 99,
          priceCurrency: CURRENCY_CODE,
          // بلا تقييمات مُختلَقة: `aggregateRating` بلا مراجعات حقيقية مخالفة صريحة.
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  });

  /** من معرض الطوابع: يُلبَس الطابع لمنيو الزائر ويُعاد إلى الجوّال. */
  const tryTheme = (id: string) => {
    setBrand((b) => ({ ...b, theme: id }));
    builder.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <span aria-hidden="true" className="scroll-rail" />

      <Navbar />

      {/* ١. البطل — الوعد، ومنيو الزائر نفسه يتبدّل أمامه. */}
      <section ref={hero.ref} className="glow-bg relative overflow-hidden">
        {/* الترتيب على الجوّال: الوعد ⇒ الجوّال ⇒ الأدوات ⇒ الزرّان — يرى الزائر
            المنيو قبل أن يُطلب منه شيء. وعلى الشاشة العريضة عمودان: النصّ
            والأدوات، والجوّال بجانبهما يتبدّل وهو يكتب. */}
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 pb-16 pt-10 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-x-14 lg:gap-y-6">
          <div className="min-w-0 text-center lg:col-start-1 lg:row-start-1 lg:text-start">
            <p className="anim-fade-up mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-panel/70 px-3.5 py-1.5 text-xs font-semibold text-dim">
              <span className="h-1.5 w-1.5 rounded-full bg-sadu" aria-hidden="true" />
              منيو QR للمطاعم والمقاهي السعودية
            </p>
            <h1 className="font-display text-[2.5rem] font-bold leading-[1.2] text-ink sm:text-[3.4rem]">
              <Words text="منيو يشبه مطعمك،" />
              <br />
              <Words text="ويبيع عنك." className="text-gold-grad" />
            </h1>
            <p className="anim-fade-up mx-auto mt-5 max-w-[46ch] text-lg leading-[1.8] text-dim lg:mx-0">
              موقع منيو باسمك وشعارك وألوانك — يفتحه زبونك من كود الطاولة، يطلب ويدفع، ويرجع لك ببطاقة
              الولاء. والسعرات التي تطلبها الهيئة محسوبة من وصفاتك.
            </p>
          </div>

          <div className="min-w-0 lg:col-start-2 lg:row-span-3 lg:row-start-1">
            <PhoneMenu brand={brand} />
            <p className="mt-4 text-center text-xs text-faint">منيوٌ حقيقي — مرّره وافتح أي طبق.</p>
          </div>

          <div ref={builder} className="anim-fade-up mx-auto w-full min-w-0 max-w-xl lg:col-start-1 lg:row-start-2 lg:mx-0">
            <BrandControls brand={brand} onChange={setBrand} />
          </div>

          <div className="min-w-0 text-center lg:col-start-1 lg:row-start-3 lg:text-start">
            <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link
                to="/login?mode=signup"
                className="press inline-flex min-h-12 items-center rounded-[12px] bg-gold px-7 font-bold text-on-gold shadow-[0_10px_30px_-10px_var(--c-glow)] hover:bg-gold2"
              >
                {CTA_PRIMARY}
              </Link>
              <Link
                to="/demo"
                className="press inline-flex min-h-12 items-center rounded-[12px] border border-line bg-panel px-6 font-bold text-ink hover:border-ink/35"
              >
                {CTA_SECONDARY}
              </Link>
            </div>
            {/* المجانيّ هو التجربة وحدها — تحت الزرّ لا على وجهه (`landing-cta.test.ts`). */}
            <p className="mt-3 text-sm text-dim">{trialDaysLabel} مجاناً — بلا بطاقة بنكية.</p>
          </div>
        </div>
      </section>

      {/* ٢. لماذا يبيع — نتائج لا مزايا. */}
      <section className="border-y border-line bg-panel/60">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionHead
            title="موظّف مبيعات على كل طاولة"
            sub="ليس قائمة أسعار: هذا ما يفعله المنيو لمطعمك من أوّل مسحٍ للكود إلى عودة الزبون."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {OUTCOMES.map((o, i) => (
              <Reveal key={o.title} delay={i * 70} className="h-full">
                <div className="flex h-full flex-col rounded-[18px] border border-line bg-panel p-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-gold/12 text-gold">
                    <Icon name={o.icon} size={21} />
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-ink">{o.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-dim">{o.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ٣. كيف يعمل — ثلاث خطوات. */}
      <section id="how" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-20">
        <SectionHead title="ثلاث خطوات ومنيوك جاهز" sub="من صورة منيوك الحالي إلى كودٍ على طاولاتك — في جلسة واحدة." />
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 90} className="h-full">
              <li className="relative flex h-full flex-col rounded-[18px] border border-line bg-panel p-5">
                <span className="flex items-center gap-3">
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-ink text-page">
                    <Icon name={s.icon} size={21} />
                  </span>
                  <span className="text-sm font-bold text-faint">{["٠١", "٠٢", "٠٣"][i]}</span>
                </span>
                <h3 className="mt-4 text-lg font-bold text-ink">{s.title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-dim">{s.desc}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* ٤. الطوابع — لكلّ نوع مطعم واحد، بلون علامتك. */}
      <section className="border-y border-line bg-panel/60">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionHead
            title={`${THEMES_LABEL} — لكلّ نوع مطعم واحد`}
            sub="كلٌّ منها تصميمٌ كامل يلبس شعارك ولون علامتك. اضغط أيّها لتراه على منيوك أعلاه."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ALL_THEMES.map((t, i) => (
              <Reveal key={t.id} delay={(i % 3) * 70}>
                <button
                  type="button"
                  onClick={() => tryTheme(t.id)}
                  className={cn(
                    "press group block w-full overflow-hidden rounded-[18px] border bg-panel text-start transition-colors",
                    brand.theme === t.id ? "border-ink" : "border-line hover:border-ink/35"
                  )}
                >
                  <ThemePreview theme={t} />
                  <div className="flex items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="font-bold text-ink">{t.name}</p>
                      <p className="mt-1 text-sm leading-relaxed text-dim">{t.tagline}</p>
                    </div>
                    <span className="mt-0.5 shrink-0 text-xs font-bold text-gold group-hover:underline">جرّبه ↑</span>
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ٥. الحاسبة — الإلزام النظامي محلولاً، بلا تسجيل. */}
      <section id="calories" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-20">
        <SectionHead
          title={
            <>
              سعراتك محسوبة، <span className="text-gold-grad">لا مكتوبة.</span>
            </>
          }
          sub="اكتب وصفة الصنف كما تقولها، ونحسب الأرقام التي تطلبها هيئة الغذاء — جرّبها هنا قبل أن تسجّل."
        />
        <div className={cn("min-w-0", CALC_MIN_H)}>
          <Suspense fallback={<div className={cn("skeleton mx-auto max-w-4xl rounded-[20px]", CALC_MIN_H)} />}>
            <HeroCalculator />
          </Suspense>
        </div>
      </section>

      {/* ٦. وفوقها — المزايا. */}
      <section id="features" className="scroll-mt-20 border-y border-line bg-panel/60">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionHead title="وفوقها كل ما يحتاجه مطعمك" />
          <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 70}>
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-line bg-panel text-ink">
                    <Icon name={f.icon} size={20} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-bold text-ink">{f.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-dim">{f.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ٧. السعر — يلي المزايا ويسبق الأسئلة (`landing-cta.test.ts`). */}
      <section id="pricing" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-20">
        <SectionHead title="سعرٌ واحد، كل شيء داخله" sub="بدون رسوم خفية — ألغِ في أي وقت." />
        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-[12px] border border-line bg-panel p-1">
            {(["monthly", "yearly"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className={cn(
                  "press flex min-h-11 items-center gap-2 rounded-[9px] px-5 py-2 text-sm font-bold transition-colors",
                  cycle === c ? "bg-ink text-page" : "text-dim hover:text-ink"
                )}
              >
                {c === "monthly" ? "شهري" : "سنوي"}
                {c === "yearly" && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px]",
                      cycle === "yearly" ? "bg-page/15 text-page" : "bg-good/15 text-good"
                    )}
                  >
                    وفّر {PLAN.monthly * 12 - PLAN.yearly} ر.س
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        <PricingCards cycle={cycle} selectLabel={CTA_PRIMARY} />
      </section>

      {/* ٨. الأسئلة الشائعة */}
      <section className="mx-auto w-full max-w-3xl px-5 pb-20">
        <SectionHead title="الأسئلة الشائعة" />
        <div className="flex flex-col gap-3">
          {FAQS.map((f, i) => (
            <Card key={f.q} className="p-0">
              <button
                className="flex min-h-14 w-full items-center justify-between gap-4 p-5 text-right"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
              >
                <span className="font-bold text-ink">{f.q}</span>
                <span
                  aria-hidden="true"
                  className={cn("text-xl leading-none text-gold transition-transform", openFaq === i && "rotate-45")}
                >
                  ＋
                </span>
              </button>
              {openFaq === i && <p className="anim-fade-up px-5 pb-5 text-[15px] leading-[1.8] text-dim">{f.a}</p>}
            </Card>
          ))}
        </div>
      </section>

      {/* ٩. الدعوة الأخيرة — شريطٌ بالحبر، جملةٌ وزرّ. */}
      <section className="bg-ink text-page">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center">
          <Reveal>
            <div className="sadu-band mx-auto mb-7 w-32 opacity-90" aria-hidden="true" />
            <h2 className="font-display text-3xl font-bold leading-[1.3] sm:text-4xl">منيوك باسمك — جاهز اليوم</h2>
            <p className="mx-auto mt-4 max-w-[42ch] text-lg leading-relaxed opacity-80">
              صوّر منيوك، اختر طابعك وارفع شعارك، واطبع الكود — في جلسة واحدة.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/login?mode=signup"
                className="press inline-flex min-h-12 items-center rounded-[12px] bg-gold px-8 font-bold text-on-gold hover:bg-gold2"
              >
                {CTA_PRIMARY}
              </Link>
              <Link
                to="/demo"
                className="press inline-flex min-h-12 items-center rounded-[12px] border border-page/30 px-6 font-bold hover:bg-page/10"
              >
                {CTA_SECONDARY}
              </Link>
            </div>
            <p className="mt-4 text-sm opacity-70">
              {trialDaysLabel} مجاناً · ثم {formatPrice(PLANS[0]?.monthly ?? 99)} {CURRENCY} شهرياً · ألغِ متى شئت
            </p>
          </Reveal>
        </div>
      </section>

      <Footer />

      {/* شريط الدعوة اللاصق — على الجوال وحده، بعد أن يغادر البطل الشاشة. */}
      <div className={cn("cta-dock lg:hidden", hero.passed && "is-up")} aria-hidden={!hero.passed}>
        <div className="flex items-center gap-2 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <Link
            to="/login?mode=signup"
            tabIndex={hero.passed ? undefined : -1}
            className="flex min-h-12 flex-1 items-center justify-center rounded-[12px] bg-gold px-4 font-bold text-on-gold active:scale-[.98]"
          >
            {CTA_PRIMARY}
          </Link>
          <Link
            to="/demo"
            tabIndex={hero.passed ? undefined : -1}
            className="flex min-h-12 items-center justify-center rounded-[12px] border border-line bg-panel px-4 font-bold text-ink"
          >
            {CTA_SECONDARY}
          </Link>
        </div>
      </div>
    </div>
  );
}

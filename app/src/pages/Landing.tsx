/**
 * صفحة الهبوط — **فكرةٌ واحدة تُفهم في خمس ثوانٍ**.
 *
 * ═══ البنية (٢٠٢٦/١٠/١٦) ═══
 *
 * سبعة أقسام، كلٌّ منها جملةٌ واحدة:
 *   ١. البطل: **جرّبها الآن** — الحاسبة نفسها، بلا تسجيل.
 *   ٢. كيف يعمل: ثلاث خطوات.
 *   ٣. بهوية مطعمك: الطوابع.
 *   ٤. وفوقها: ستّ مزايا بسطرٍ لكلٍّ.
 *   ٥. السعر.  ٦. الأسئلة.  ٧. الدعوة الأخيرة.
 *
 * ⚠️ كانت تسعة أقسام (عرض قراءة الصورة · منيو حيّ · كلفة الانتقال · ستّ بطاقات
 * بفقرات · ثماني أسئلة…). كلٌّ منها صحيح، ومجموعها صفحةٌ يمرّ عليها الزائر
 * ولا يخرج بجملة. والمقارنة التي حسمت القرار: منافسٌ مجاني يقول فكرته في شاشة
 * — «ارفع صورة منيوك» — وزرّاً واحداً. فصار البطل عندنا **فعلاً** لا وصفاً:
 * يكتب الزائر وصفةً ويرى أرقامها قبل أن يُسأل عن بريده.
 *
 * الحركة: `lib/reveal.ts` للأقسام، و`motion` في البطل الكسول وحده — الحزمة
 * الرئيسية تخدم **صفحة المنيو** التي تُفتح من كود QR على بيانات جوال.
 */
import { Suspense, lazy, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Navbar, Footer } from "@/components/site";
import { Card } from "@/components/ui";
import { Reveal } from "@/components/landing/Reveal";
import { PhonePreview } from "@/components/landing/PhonePreview";
import { PricingCards, daysLabel, useTrialDays } from "@/components/landing/PricingCards";
import { CURRENCY, CURRENCY_CODE, PLAN, PLANS, effectiveMonthly, type BillingCycle } from "@/lib/plans";
import { prefersReducedMotion } from "@/lib/reveal";
import { cn, formatPrice } from "@/lib/utils";
import { Icon, type IconName } from "@/lib/icons";
import { ALL_THEMES, getTheme } from "@/lib/themes";
import { CTA_PRIMARY, CTA_SECONDARY, PRINT_DPI, THEME_COUNT } from "@/lib/facts";
import { absoluteUrl, useJsonLd, useSeo } from "@/lib/seo";

/**
 * البطل كسولٌ عمداً: يحمل `motion` ومحرّك الوصفة وجدول المكوّنات، والعنوان
 * والزرّان لا يحتاجون شيئاً منها ليُرسموا. فيظهر النصّ فوراً، ومكان الحاسبة
 * محجوزٌ بارتفاعها (`CALC_MIN_H`، مقيسٌ على ٣٩٠ و١٤٤٠) فلا تقفز الصفحة.
 */
const HeroCalculator = lazy(() =>
  import("@/components/landing/HeroCalculator").then((m) => ({ default: m.HeroCalculator }))
);
const CALC_MIN_H = "min-h-[850px] md:min-h-[480px]";

/* ── شريط الطوابع ───────────────────────────────────────────────────── */

/**
 * الطوابع التي يقلّبها العرض التلقائي — **خمسة لا كلّها**: في كل خطوة يتبدّل
 * **محورٌ بنيوي** لا لون (سدو ⇒ رواشين ⇒ بلا زخرفة ⇒ رقعة ⇒ الافتراضي).
 */
const REEL = ["najdi", "hijazi", "modern", "luxe", "dark-gold"];
const DEFAULT_ID = "dark-gold";

/**
 * شريط اختيار الطابع — الشريحة **ثلاث نقاط** (أرضية · تمييز · نصّ) لا مربّع
 * لون: الطابع ليس لوناً، فلا ينقض عنصرُ التحكّم الجملةَ التي تبيع المنتج.
 */
function ThemeRail({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const rail = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  /**
   * ⚠️ **يُمرَّر الشريط وحده — لا `scrollIntoView`**: تلك تحرّك كل سلفٍ قابل
   * للتمرير حتى المستند، فكانت تقفز بالصفحة كلّها على الجوال.
   */
  useEffect(() => {
    const el = rail.current;
    const chip = el?.querySelector<HTMLElement>('[data-on="1"]');
    if (!el || !chip) return;
    const box = el.getBoundingClientRect();
    const c = chip.getBoundingClientRect();
    el.scrollBy({
      left: c.left - box.left - (box.width - c.width) / 2,
      behavior: first.current || prefersReducedMotion() ? "auto" : "smooth",
    });
    first.current = false;
  }, [value]);

  return (
    // ⚠️ `min-w-0`: حاوية تمريرٍ أفقي داخل شبكة تساهم بعرض محتواها الأقصى
    // (٢٠٣١px) ما لم يُصفَّر حدّها الأدنى — فكان العمود يتمدّد خارج الشاشة.
    <div className="mt-6 min-w-0">
      <div
        ref={rail}
        role="tablist"
        aria-label="طوابع المنيو"
        className="theme-rail flex min-w-0 snap-x gap-2 overflow-x-auto pb-2"
      >
        {ALL_THEMES.map((t) => {
          const on = t.id === value;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              data-on={on ? "1" : "0"}
              onClick={() => onChange(t.id)}
              title={t.tagline}
              className={cn(
                "press flex min-h-12 shrink-0 snap-center items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold transition-colors",
                on ? "border-ink bg-ink text-page" : "border-line bg-panel text-dim hover:text-ink"
              )}
            >
              <span aria-hidden="true" className="flex">
                {(["--m-bg", "--m-accent", "--m-text"] as const).map((k, i) => (
                  <span
                    key={k}
                    className="h-3.5 w-3.5 rounded-full border border-black/25"
                    style={{ background: t.vars[k], marginInlineStart: i ? "-5px" : undefined }}
                  />
                ))}
              </span>
              {t.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * عنوان يتجمّع كلمةً كلمة — بالكلمة لا بالحرف (التقسيم الحرفي يكسر وصل
 * الحروف العربية)، و`aria-label` يحمل الجملة كاملة لقارئ الشاشة.
 */
function Words({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <span className={cn("word-in", className)} aria-label={text}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} className="word" style={{ "--w": i } as CSSProperties} aria-hidden="true">
          {w}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}

/* ── المحتوى ───────────────────────────────────────────────────────── */

/**
 * ⚠️ **الخطوات الثلاث عادت بقرار (٢٠٢٦/١٠/١٦)** — وكانت محذوفة بقرارٍ مكتوب
 * في `landing-cta.test.ts` لأنها أخذت شاشةً كاملة بقيمة ضئيلة.
 *
 * ما تغيّر: لم يكن في الصفحة بعدها ما يقول **كيف** يصير المنيو جاهزاً، فكان
 * الزائر يخمّن. والآن ثلاثة أسطر في قسمٍ واحد قصير — لا شاشة رسوم.
 * وكل خطوة شيءٌ يفعله المنتج اليوم: قراءة الصورة (`MenuScan`)، والحاسبة،
 * والنشر بالكود والورقة وملف التوصيل.
 */
const STEPS: { icon: IconName; title: string; desc: string }[] = [
  { icon: "image", title: "صوّر منيوك", desc: "نقرأ الأقسام والأصناف والأسعار من الصورة، وتراجعها قبل الحفظ." },
  { icon: "flame", title: "اكتب وصفات أصنافك", desc: "سطرٌ لكل مكوّن، ونحسب السعرات والكافيين والصوديوم والحساسية." },
  { icon: "qr", title: "انشر في كل مكان", desc: "كود QR للطاولات، وورقة A4 للطباعة، وملف لتطبيقات التوصيل — بالأرقام نفسها." },
];

/**
 * ستّ مزايا بسطرٍ لكلٍّ — الحساب والمطبوع قيلا في البطل والخطوات، فهنا ما
 * **فوقهما**. والفقرات الطويلة صارت أسطراً: الزائر يمسح العناوين ولا يقرأ.
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

  /**
   * الطابع المعروض في قسم الهوية. `picked` = اختار الزائر بيده، فيتوقّف
   * التقليب التلقائي **نهائياً**.
   */
  const [themeId, setThemeId] = useState(DEFAULT_ID);
  const [picked, setPicked] = useState(false);
  const theme = getTheme(themeId);
  const hero = usePassed<HTMLElement>();
  const trialDaysLabel = daysLabel(useTrialDays());

  useSeo({
    title: "سعرات المنيو محسوبة من الوصفة",
    description: `اكتب وصفة الصنف ونحسب السعرات والكافيين والصوديوم والحساسية، وننشرها على منيو QR ومنيو مطبوع بـ${THEME_COUNT} طابعاً.`,
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
          "منيو رقمي ومطبوع للمطاعم والمقاهي السعودية: حاسبة سعرات وكافيين وصوديوم ومسبّبات حساسية من الوصفة، وطوابع بهوية سعودية.",
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

  /** دورة واحدة على الطوابع ثم سكون — وتتوقّف نهائياً عند أوّل اختيار. */
  useEffect(() => {
    if (picked || prefersReducedMotion()) return;
    let i = -1;
    let tick = 0;
    const start = window.setTimeout(() => {
      tick = window.setInterval(() => {
        i += 1;
        if (i >= REEL.length) {
          window.clearInterval(tick);
          return;
        }
        setThemeId(REEL[i] ?? DEFAULT_ID);
      }, 2600);
    }, 7200);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(tick);
    };
  }, [picked]);

  const pick = (id: string) => {
    setPicked(true);
    setThemeId(id);
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <span aria-hidden="true" className="scroll-rail" />

      <Navbar />

      {/* ١. البطل — الحاسبة نفسها، بلا تسجيل. */}
      <section ref={hero.ref} className="glow-bg relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-12 text-center sm:pt-16">
          <p className="anim-fade-up mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-panel/70 px-3.5 py-1.5 text-xs font-semibold text-dim">
            <span className="h-1.5 w-1.5 rounded-full bg-sadu" aria-hidden="true" />
            للمطاعم والمقاهي السعودية
          </p>
          <h1 className="font-display text-[2.6rem] font-bold leading-[1.2] text-ink sm:text-6xl">
            <Words text="سعراتك محسوبة،" />
            <br />
            <Words text="لا مكتوبة." className="text-gold-grad" />
          </h1>
          <p className="anim-fade-up mx-auto mt-5 max-w-[40ch] text-lg leading-[1.8] text-dim">
            اكتب وصفة الصنف كما تقولها، ونحسب الأرقام التي تطلبها هيئة الغذاء — جرّبها هنا قبل أن
            تسجّل.
          </p>

          <div className={cn("mt-10 min-w-0", CALC_MIN_H)}>
            <Suspense fallback={<div className={cn("skeleton mx-auto max-w-4xl rounded-[20px]", CALC_MIN_H)} />}>
              <HeroCalculator />
            </Suspense>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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
      </section>

      {/* ٢. كيف يعمل — ثلاث خطوات. */}
      <section id="how" className="scroll-mt-20 border-y border-line bg-panel/60">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionHead title="ثلاث خطوات ومنيوك جاهز" sub="من صورة منيوك الحالي إلى منيو بأرقامه — في جلسة واحدة." />
          <ol className="mx-auto grid max-w-2xl gap-0">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 90}>
                <li className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-5">
                  <div className="flex flex-col items-center">
                    <span className="relative flex h-13 w-13 items-center justify-center rounded-full bg-ink text-page shadow-[0_10px_24px_-14px_rgba(0,0,0,0.6)]">
                      <Icon name={s.icon} size={22} />
                      <span className="tabular absolute -top-1 -start-1 flex h-5 w-5 items-center justify-center rounded-full bg-sadu text-[11px] font-bold text-white">
                        {i + 1}
                      </span>
                    </span>
                    {i < STEPS.length - 1 && <span aria-hidden="true" className="my-2 w-px flex-1 bg-line" />}
                  </div>
                  <div className={cn("pt-2", i < STEPS.length - 1 && "pb-10")}>
                    <h3 className="text-xl font-bold text-ink">{s.title}</h3>
                    <p className="mt-1.5 text-base leading-relaxed text-dim">{s.desc}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ٣. بهوية مطعمك — الطوابع. */}
      <section className="mx-auto w-full max-w-6xl px-5 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Reveal className="text-center lg:text-right">
            <div className="sadu-band mx-auto mb-6 w-32 lg:mx-0" aria-hidden="true" />
            <h2 className="font-display text-3xl font-bold leading-[1.3] text-ink sm:text-4xl">بهوية مطعمك</h2>
            <p className="mx-auto mt-4 max-w-[40ch] text-lg leading-[1.8] text-dim lg:mx-0">
              {THEME_COUNT} طابعاً بهوية محلية — نجدي بنسيج السدو، وحجازي بأقواس الرواشين — أو لون علامتك.
              والأرقام نفسها تلبس طابعك على الطاولة وعلى الورق.
            </p>
            <p className="mt-4 text-sm text-dim">
              <b className="text-ink">{theme.name}</b> — {theme.tagline}
            </p>
          </Reveal>
          <Reveal delay={90} className="min-w-0">
            <PhonePreview theme={theme} animate />
            <ThemeRail value={themeId} onChange={pick} />
          </Reveal>
        </div>
      </section>

      {/* ٤. وفوقها — المزايا. */}
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

      {/* ٥. السعر — يلي المزايا ويسبق الأسئلة (`landing-cta.test.ts`). */}
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

      {/* ٦. الأسئلة الشائعة */}
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

      {/* ٧. الدعوة الأخيرة — شريطٌ بالحبر، جملةٌ وزرّ. */}
      <section className="bg-ink text-page">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center">
          <Reveal>
            <div className="sadu-band mx-auto mb-7 w-32 opacity-90" aria-hidden="true" />
            <h2 className="font-display text-3xl font-bold leading-[1.3] sm:text-4xl">منيوك بأرقامه الصحيحة — جاهز اليوم</h2>
            <p className="mx-auto mt-4 max-w-[42ch] text-lg leading-relaxed opacity-80">
              صوّر منيوك، اكتب وصفاتك، وانشر الكود والورقة في جلسة واحدة.
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

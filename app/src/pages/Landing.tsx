/**
 * صفحة الهبوط — **«منيو يشبه مطعمك، ويبيع عنك»** · عرضٌ حيّ للمنتج.
 *
 * ═══ البنية (٢٠٢٦/١١/١١، اتّجاهٌ اختاره المالك — §22) ═══
 *
 *   ١. البطل: الوعد، و«وش نوع مطعمك؟» (أقسام `themeCategories` — مصدرٌ واحد)،
 *      والجوّال يتحوّل فوراً لمنيو نوعه بطابعه المتحرّك. زرّا التجربة فوق الطيّ
 *      على ٣٩٠×٨٤٤ و١٢٨٠×٨٠٠. واسمه وشعاره ولونه وطوابع نوعه مطويّة تحت «خصّصه».
 *      ويدور الجوّال بين أربعة أنواع حتى أوّل لمسة (ولا يدور مع تقليل الحركة).
 *   ٢. القصّة (`#how`): جوّالٌ ثابت والنصّ يمرّ — يعرض أطباقك ⇐ يطلب ويدفع ⇐
 *      يرجّع الزبون ⇐ جاهز للهيئة. حلّت محلّ «موظّف مبيعات» و«ثلاث خطوات».
 *   ٣. الحاسبة (`#calories`): تكمل المحطّة الرابعة — «جرّبها بنفسك».
 *   ٤. قبل وبعد: منيو PDF مقابل منيو كلاود منيو بسحبة.
 *   ٥. الطوابع: رفٌّ يُسحب لنوع الزائر، و«شوف الكلّ».
 *   ٦. وفوقها · ٧. السعر · ٨. الأسئلة · ٩. الخاتمة (والخطوات الثلاث فيها).
 *   وشريط تجربة ثابت على الجوّال.
 *
 * ⚠️ **لماذا الحاسبة بعد القصّة لا قبل «قبل وبعد»**: محطّة القصّة الأخيرة
 * «جاهز لاشتراطات الهيئة» تنتهي حيث تبدأ الحاسبة، فتصير القصّة والحاسبة جملةً
 * واحدة. و«قبل وبعد» استراحةٌ بصرية قبل المعرض. (كانت الحاسبة ثانيةً لأنها سبب
 * الدفع — وما زالت أوّل ما يلي القصّة، ومحطّة الهيئة تقدّمها.)
 *
 * ═══ الأداء (#64 قيدٌ لا يتراجع) ═══
 *
 * إطار `/demo` **واحدٌ في الصفحة** (البطل). والقصّة والحاسبة و«قبل وبعد» والمعرض
 * حزمٌ كسولة تُجلب حين تقترب (`useNearViewport`)، ومكانها محجوزٌ بأبعادها. والنصّ
 * كلّه — العناوين والفقرات — مرسومٌ هنا لا في الحزم الكسولة. ولا مستمع تمرير:
 * المحطّة النشطة من `IntersectionObserver` واحد، والالتصاق `position: sticky`.
 *
 * والحركة: `styles/landing.css` داخل `no-preference`، و`motion` في الحاسبة الكسولة وحدها.
 */
import "@/styles/landing.css";
import { Fragment, Suspense, lazy, useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Navbar, Footer } from "@/components/site";
import { Card } from "@/components/ui";
import { Reveal } from "@/components/landing/Reveal";
import { BrandControls, PhoneMenu, type Brand } from "@/components/landing/LiveMenu";
import { PricingCards, daysLabel, useTrialDays } from "@/components/landing/PricingCards";
import { CURRENCY, CURRENCY_CODE, PLAN, PLANS, effectiveMonthly, type BillingCycle } from "@/lib/plans";
import { cn, formatPrice } from "@/lib/utils";
import { useNearViewport } from "@/lib/useNearViewport";
import { Icon, type IconName } from "@/lib/icons";
import { ALL_THEMES, getTheme } from "@/lib/themes";
import { wantsMotion } from "@/lib/skinMotion";
import { THEME_CATEGORIES, categoryById, themesOf, type ThemeCategory, type ThemeCategoryId } from "@/lib/themeCategories";
import { ThemeCategoryTabs } from "@/components/ThemeCategoryTabs";
import { CTA_PRIMARY, CTA_SECONDARY, PRINT_DPI, THEMES_LABEL } from "@/lib/facts";
import { absoluteUrl, useJsonLd, useSeo } from "@/lib/seo";
import { SEGMENT_LINKS, segmentPath } from "@/lib/segmentLinks";

/**
 * الحزم الكسولة — كلٌّ يُجلب حين يقترب قسمه لا عند الإقلاع (`lazy()` وحده يجلب
 * لحظة رسم مكانه). ومكان كلٍّ محجوزٌ بأبعاده فلا تقفز الصفحة (CLS).
 */
const HeroCalculator = lazy(() =>
  import("@/components/landing/HeroCalculator").then((m) => ({ default: m.HeroCalculator }))
);
const StoryPhone = lazy(() => import("@/components/landing/StoryPhone"));
const BeforeAfter = lazy(() => import("@/components/landing/BeforeAfter").then((m) => ({ default: m.BeforeAfter })));
const ThemeGallery = lazy(() => import("@/components/landing/ThemeGallery").then((m) => ({ default: m.ThemeGallery })));
const CALC_MIN_H = "min-h-[850px] md:min-h-[480px]";
/** «قبل وبعد»: الجوّال ٥٤٠ + الإطار ١٨ + التعليق ٤٨. */
const BA_MIN_H = "min-h-[610px]";
/** المعرض: الشريط (بطاقة ~٣٤٠) + الأقسام + «شوف الكلّ». */
const GALLERY_MIN_H = "min-h-[560px]";

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
 * محطّات القصّة — **نتائج لا مزايا**، وكلٌّ منها يُرى يشتغل في الجوّال
 * (`StoryPhone`): «الأكثر طلباً» (`popular_dishes` من طلبات حقيقية)، والطلب
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

/**
 * ثلاث خطوات — كلٌّ منها يفعله المنتج اليوم: قراءة الصورة، والطوابع، والنشر.
 * (أُعيدت بقرار ٢٠٢٦/١٠/١٦؛ وصارت ١١/١١ سطور الخاتمة لا قسماً: القصّة تُري
 * «ماذا يفعل»، والخاتمة تقول «كيف تبدأ» حيث يُضغط الزرّ.)
 */
const STEPS: { icon: IconName; title: string; desc: string }[] = [
  { icon: "image", title: "صوّر منيوك الحالي", desc: "نقرأ الأقسام والأصناف والأسعار من الصورة، وتراجعها قبل الحفظ." },
  { icon: "palette", title: "اختر طابعك وارفع شعارك", desc: `${THEMES_LABEL}، اختر منها ما يشبه مكانك — بلون علامتك.` },
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

/* ── البطل: النوع وطابعه وجولته ────────────────────────────────────── */

/**
 * طابع النوع في البطل: **أوّل طوابع القسم المتحرّكة** (`MOTION_SKINS`) — الجوّال
 * يلفت بطابعٍ يتحرّك («تقطير» للمقاهي، «سماش» للسريعة…)، لا ببيت القسم الساكن.
 * وقسمٌ بلا طابعٍ متحرّك يفتح على بيته.
 */
function heroThemeOf(cat: ThemeCategory): string {
  return cat.themes.find((id) => wantsMotion(getTheme(id).design.skin)) ?? cat.themes[0] ?? "dark-gold";
}

/** جولة البطل: أربعة أنواع بأوضح ما بينها من فرق — قهوة · سريعة · بيتزا · حلويات. */
const TOUR: readonly ThemeCategoryId[] = ["cafe", "fast", "pizza", "bakery"];
const TOUR_MS = 5200;
const FIRST: ThemeCategory = categoryById(TOUR[0]) ?? THEME_CATEGORIES[0];

const reducedMotion = () =>
  typeof window === "undefined" || !window.matchMedia || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** هل غادر هذا العنصر الشاشة إلى الأعلى؟ ومعه: هل هو ظاهرٌ الآن؟ */
function useViewport<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [state, setState] = useState({ passed: false, visible: false });
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => e && setState({ visible: e.isIntersecting, passed: !e.isIntersecting && e.boundingClientRect.top < 0 }),
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, ...state };
}

/** رأس قسم موحّد — عنوانٌ وسطرٌ واحد، بالإيقاع نفسه في كل الصفحة. */
function SectionHead({ title, sub, id }: { title: ReactNode; sub?: string; id?: string }) {
  return (
    <Reveal className="mx-auto mb-10 max-w-2xl text-center">
      <span aria-hidden="true" className="mx-auto mb-4 block h-1.5 w-12 bg-[linear-gradient(to_left,var(--c-rule)_70%,var(--c-sadu)_70%)]" />
      <h2 id={id} className="font-display text-3xl font-bold leading-[1.3] text-ink sm:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-lg leading-relaxed text-dim">{sub}</p>}
    </Reveal>
  );
}

export default function Landing() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [kindCat, setKindCat] = useState<ThemeCategoryId>(FIRST.id);
  const [brand, setBrand] = useState<Brand>(() => ({
    name: "",
    color: null,
    logo: null,
    kind: FIRST.kind,
    theme: heroThemeOf(FIRST),
  }));
  const [customize, setCustomize] = useState(false);
  const cat = categoryById(kindCat) ?? FIRST;
  const shownTheme = getTheme(brand.theme);
  const trialDaysLabel = daysLabel(useTrialDays());

  /* ── جولة البطل ── */
  const [phoneReady, setPhoneReady] = useState(false);
  const [touched, setTouched] = useState(() => reducedMotion());
  const [peek, setPeek] = useState(0);
  const hero = useViewport<HTMLElement>();
  const cta = useViewport<HTMLDivElement>();
  const onReady = useCallback(() => setPhoneReady(true), []);

  const applyKind = useCallback((id: ThemeCategoryId) => {
    const c = categoryById(id);
    if (!c) return;
    setKindCat(id);
    setBrand((b) => ({ ...b, kind: c.kind, theme: heroThemeOf(c) }));
  }, []);

  // تدور حتى أوّل لمسة أو مفتاح — في أيّ مكان من الصفحة — ولا تستأنف أبداً.
  useEffect(() => {
    if (touched) return;
    const stop = () => setTouched(true);
    window.addEventListener("pointerdown", stop, { once: true, passive: true });
    window.addEventListener("keydown", stop, { once: true });
    return () => {
      window.removeEventListener("pointerdown", stop);
      window.removeEventListener("keydown", stop);
    };
  }, [touched]);

  // نوعٌ كلّ ٥٫٢ث والبطل ظاهر والجوّال جاهز — لا على هيكلٍ فارغ ولا خلف الزائر.
  useEffect(() => {
    if (touched || !phoneReady || !hero.visible) return;
    const t = window.setTimeout(() => {
      const next = TOUR[(TOUR.indexOf(kindCat) + 1) % TOUR.length] ?? TOUR[0];
      applyKind(next);
      setPeek((n) => n + 1);
    }, TOUR_MS);
    return () => window.clearTimeout(t);
  }, [touched, phoneReady, hero.visible, kindCat, applyKind]);

  const touring = !touched && phoneReady;

  /* ── القصّة ── */
  const [station, setStation] = useState(0);
  const storyRef = useRef<HTMLDivElement>(null);
  // ‏٣٠٠px لا أكثر و`afterLoad`: القصّة تبدأ تحت البطل بشاشةٍ واحدة على الجوّال، وهامشٌ
  // أوسع كان يجلبها مع الإقلاع (قياس ١١/١١: ‏TBT ‏٠ ⇐ ‏٣٨٠ms).
  const storyNear = useNearViewport(storyRef, { rootMargin: "300px", afterLoad: true });
  useEffect(() => {
    const root = storyRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    // شريطٌ رفيع عند ٥٥٪ من الشاشة: المحطّة التي يعبرها هي النشطة.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setStation(Number((e.target as HTMLElement).dataset.step ?? 0));
        }
      },
      { rootMargin: "-54% 0px -45% 0px" }
    );
    root.querySelectorAll("[data-step]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  /* ── الكسولات ── */
  const calcRef = useRef<HTMLDivElement>(null);
  const calcNear = useNearViewport(calcRef, { rootMargin: "600px" });
  const baRef = useRef<HTMLDivElement>(null);
  const baNear = useNearViewport(baRef, { rootMargin: "600px" });
  const galRef = useRef<HTMLDivElement>(null);
  const galNear = useNearViewport(galRef, { rootMargin: "600px" });
  // رفّ المعرض يتبع نوع الزائر في البطل حتى يختار هنا غيره.
  const [galleryCat, setGalleryCat] = useState<ThemeCategoryId | null>(null);

  /* ── شريط التجربة الثابت (الجوّال) ── */
  const closing = useViewport<HTMLDivElement>();
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    const field = (t: EventTarget | null) =>
      t instanceof HTMLElement && (t.matches("input, textarea, select") || t.isContentEditable);
    const on = (e: FocusEvent) => field(e.target) && setTyping(true);
    const off = (e: FocusEvent) => field(e.target) && setTyping(false);
    document.addEventListener("focusin", on);
    document.addEventListener("focusout", off);
    return () => {
      document.removeEventListener("focusin", on);
      document.removeEventListener("focusout", off);
    };
  }, []);
  const dock = cta.passed && !typing && !closing.visible;

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

  const phoneBox = useRef<HTMLDivElement>(null);
  /** من المعرض: يُلبَس الطابع لجوّال البطل ويُعاد إليه. */
  const tryTheme = (id: string) => {
    setTouched(true);
    setBrand((b) => ({ ...b, theme: id }));
    phoneBox.current?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "center" });
  };

  return (
    <div className="flex min-h-dvh flex-col pb-[calc(76px+env(safe-area-inset-bottom))] lg:pb-0">
      <span aria-hidden="true" className="scroll-rail" />

      <Navbar />

      {/* ١. البطل — «وش نوع مطعمك؟» والجوّال يتحوّل أمامه. */}
      <section ref={hero.ref} className="glow-bg relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-x-14 gap-y-8 px-5 pb-16 pt-6 sm:pt-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:pb-14 lg:pt-8">
          <div className="min-w-0 text-center lg:text-start">
            <p className="anim-fade-up mb-4 hidden items-center gap-2 rounded-full border border-line bg-panel/70 px-3.5 py-1.5 text-xs font-semibold text-dim sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-sadu" aria-hidden="true" />
              منيو QR للمطاعم والمقاهي السعودية
            </p>
            <h1 className="font-display text-[2.2rem] font-bold leading-[1.2] text-ink sm:text-[3.3rem]">
              <Words text="منيو يشبه مطعمك،" />
              <br />
              <Words text="ويبيع عنك." className="text-gold-grad" />
            </h1>
            <p className="anim-fade-up mx-auto mt-3 max-w-[44ch] text-base leading-[1.75] text-dim sm:mt-4 sm:text-lg lg:mx-0">
              منيو باسمك وشعارك: يطلب منه زبونك ويدفع من الطاولة، ويرجع لك ببطاقة الولاء — والسعرات محسوبة من وصفاتك.
            </p>

            {/* «وش نوع مطعمك؟» — أقسام `themeCategories` نفسها التي في اللوحة و`/demo`. */}
            <div className="anim-fade-up mt-5">
              <p id="kind-q" className="mb-2 h-5 truncate text-sm font-bold leading-5 text-ink">
                وش نوع مطعمك؟ <span className="font-normal text-dim">— شوف منيوه في الجوّال</span>
              </p>
              {/* الارتفاع محجوز (٤٤ + ٨): الشريط كان يُرسم ٤٩ ثم ٥٢ فيهتزّ الجوّال تحته (CLS). */}
              <div className="h-[52px] sm:h-auto">
              <ThemeCategoryTabs
                value={kindCat}
                onChange={(id) => {
                  if (!id) return;
                  setTouched(true);
                  applyKind(id);
                }}
                withAll={false}
                label="وش نوع مطعمك؟"
                panelId="hero-phone"
                className="-mx-5 sm:mx-0"
                listClassName="px-5 sm:px-0 sm:justify-center lg:justify-start"
              />
              </div>
            </div>

            <div ref={cta.ref} className="mt-5 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
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
            <p className="mt-2.5 text-sm text-dim">{trialDaysLabel} مجاناً — بلا بطاقة بنكية.</p>

            <button
              type="button"
              onClick={() => {
                setTouched(true);
                setCustomize((v) => !v);
              }}
              aria-expanded={customize}
              aria-controls="hero-customize"
              className="press mt-3 inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-sm font-bold text-ink underline decoration-line-gold decoration-2 underline-offset-[6px] hover:decoration-gold"
            >
              <Icon name="sparkle" size={15} className="text-gold" />
              خصّصه: غيّر الطابع واكتب اسم مطعمك
            </button>
            <div id="hero-customize" hidden={!customize} className="mx-auto mt-3 max-w-xl lg:mx-0">
              {customize && (
                <BrandControls
                  brand={brand}
                  onChange={setBrand}
                  themes={themesOf(kindCat, ALL_THEMES)}
                  themesLabel={`طوابع ${cat.name}`}
                />
              )}
            </div>
          </div>

          <div ref={phoneBox} id="hero-phone" role="tabpanel" aria-labelledby="kind-q" className="min-w-0">
            <div className="hero-stage mx-auto w-fit">
              <span className="live-tag inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-xs font-black" aria-hidden="true">
                <span className="live-dot h-2 w-2 rounded-full" />
                منيو حيّ
              </span>
              <PhoneMenu brand={brand} onReady={onReady} peek={peek} />
            </div>
            <p className="mt-4 text-center text-xs text-faint" aria-live={touched ? "polite" : "off"}>
              منيو {cat.name} بطابع «{shownTheme.name}» — مرّره وافتح أي طبق.
            </p>
            {touring && (
              <div className="mx-auto mt-3 flex max-w-[290px] items-center gap-2">
                <ol className="flex flex-1 gap-1.5" aria-label="جولة الأنواع">
                  {TOUR.map((id) => (
                    <li key={id} className="h-1 flex-1 overflow-hidden rounded-full bg-line">
                      {id === kindCat && (
                        <span
                          key={`${id}-${peek}`}
                          className="tour-fill block h-full bg-gold"
                          style={{ "--tour-ms": `${TOUR_MS}ms` } as CSSProperties}
                        />
                      )}
                    </li>
                  ))}
                </ol>
                <button
                  type="button"
                  onClick={() => setTouched(true)}
                  className="press hit min-h-8 rounded-full border border-line bg-panel px-3 text-xs font-bold text-dim hover:text-ink"
                >
                  أوقف الجولة
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ٢. القصّة — جوّالٌ ثابت والنصّ يمرّ. حلّت محلّ «موظّف مبيعات» و«ثلاث خطوات». */}
      <section id="how" className="scroll-mt-20 border-y border-line bg-panel/60">
        <div className="mx-auto max-w-6xl px-5 pt-20">
          <SectionHead
            title="موظّف مبيعات على كل طاولة"
            sub="من أوّل مسحٍ للكود إلى عودة الزبون — هذا ما يفعله المنيو، يشتغل أمامك."
          />
          <div ref={storyRef} className="relative grid lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-x-16">
            {/* الجوّال: أوّلاً في الشجرة (يلتصق فوق البطاقات على الجوّال)، وعلى الحاسوب في العمود الثاني. */}
            {/* على الجوّال: الجوّال مصغّراً ملتصقٌ أعلى الشاشة، وبطاقة كلّ محطّة ملتصقةٌ تحته
                (`top` = الشريط ٦٨ + الجوّال ٣٦٠ + ١٦) — فلا تغطّيه إلا وهي تغادر. */}
            <div className="sticky top-[68px] z-0 h-[368px] lg:col-start-2 lg:row-start-1 lg:top-24 lg:h-auto lg:self-start lg:py-6">
              <div className="mx-auto w-fit origin-top scale-[.62] lg:scale-100">
                <div className="phone-shell relative rounded-[44px] bg-[#0d0d0f] p-[9px] shadow-[0_40px_80px_-34px_rgba(0,0,0,.5),inset_0_0_0_1px_rgba(255,255,255,.08)]">
                  <div className="relative h-[560px] w-[272px] overflow-hidden rounded-[35px] bg-[#141210]">
                    {storyNear ? (
                      <Suspense fallback={<div className="skeleton absolute inset-0" />}>
                        <StoryPhone active={station} themeId={brand.theme} kind={brand.kind ?? FIRST.kind} />
                      </Suspense>
                    ) : (
                      <div className="skeleton absolute inset-0" aria-hidden="true" />
                    )}
                    <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-2 h-[20px] w-[78px] -translate-x-1/2 rounded-full bg-[#0d0d0f]" />
                  </div>
                </div>
              </div>
            </div>

            <ol className="relative z-10 flex flex-col pb-[6vh] lg:col-start-1 lg:row-start-1 lg:pb-[18vh] lg:pt-[8vh]">
              {OUTCOMES.map((o, i) => (
                <li key={o.title} data-step={i} className="min-h-[66vh] lg:flex lg:min-h-[74vh] lg:items-center">
                  <div
                    className="story-step sticky top-[452px] rounded-[18px] border border-line bg-panel p-4 shadow-[0_24px_48px_-30px_rgba(0,0,0,.45)] sm:p-6 lg:static"
                    data-on={station === i || undefined}
                  >
                    <span className="flex items-center gap-3">
                      <span className="story-num flex h-11 w-11 items-center justify-center rounded-[12px] bg-gold/12 text-gold">
                        <Icon name={o.icon} size={21} />
                      </span>
                      <span className="text-sm font-bold text-faint">{["٠١", "٠٢", "٠٣", "٠٤"][i]} / ٠٤</span>
                    </span>
                    <h3 className="mt-3 text-lg font-bold text-ink sm:mt-4 sm:text-2xl">{o.title}</h3>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-dim sm:mt-2 sm:text-base">{o.desc}</p>
                    {i === OUTCOMES.length - 1 && (
                      <a href="#calories" className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-gold hover:underline">
                        جرّب الحاسبة بنفسك ↓
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ٣. الحاسبة — الإلزام النظامي محلولاً، بلا تسجيل. تكمل محطّة القصّة الأخيرة. */}
      <section id="calories" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-20">
        <SectionHead
          title={
            <>
              سعراتك محسوبة، <span className="text-gold-grad">لا مكتوبة.</span>
            </>
          }
          sub="هيئة الغذاء تطلب السعرات والصوديوم والكافيين في المنيو الرقمي والمطبوع وتطبيقات التوصيل. اكتب وصفة الصنف كما تقولها، ونحسبها لك — جرّبها هنا قبل أن تسجّل."
        />
        <div ref={calcRef} className={cn("min-w-0", CALC_MIN_H)}>
          {calcNear ? (
            <Suspense fallback={<div className={cn("skeleton mx-auto max-w-4xl rounded-[20px]", CALC_MIN_H)} />}>
              <HeroCalculator />
            </Suspense>
          ) : (
            <div className={cn("skeleton mx-auto max-w-4xl rounded-[20px]", CALC_MIN_H)} aria-hidden="true" />
          )}
        </div>
      </section>

      {/* ٤. قبل وبعد — منيو PDF ومنيو كلاود منيو في الجهاز نفسه. */}
      <section className="border-y border-line bg-panel/60">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
          <div className="text-center lg:text-start">
            <span aria-hidden="true" className="mx-auto mb-4 block h-1.5 w-12 bg-[linear-gradient(to_left,var(--c-rule)_70%,var(--c-sadu)_70%)] lg:mx-0" />
            <h2 className="font-display text-3xl font-bold leading-[1.3] text-ink sm:text-4xl">
              منيوك اليوم ملفّ PDF؟ <span className="text-gold-grad">اسحب وشوف الفرق.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-[46ch] text-lg leading-relaxed text-dim lg:mx-0">
              صفحة A4 في شاشة جوال: يكبّر الزبون ويسحب ويضيع بين الأسطر. ومنيو كلاود منيو مصمّم للجوال من أوّله —
              أصنافٌ تُقرأ، وصورٌ، وسعرٌ واضح، وزرّ طلب.
            </p>
            <ul className="mx-auto mt-6 grid max-w-md gap-2 text-start text-[15px] text-ink lg:mx-0">
              {["خطٌّ يُقرأ بلا تكبير", "تعديل السعر يظهر في لحظته — بلا إعادة طباعة", "طلبٌ ودفع من الصفحة نفسها"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Icon name="check" size={16} className="shrink-0 text-good" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div ref={baRef} className={cn("min-w-0", BA_MIN_H)}>
            {baNear ? (
              <Suspense fallback={<div className="skeleton mx-auto h-[558px] w-[280px] rounded-[42px]" />}>
                <BeforeAfter themeId={brand.theme} />
              </Suspense>
            ) : (
              <div className="skeleton mx-auto h-[558px] w-[280px] rounded-[42px]" aria-hidden="true" />
            )}
          </div>
        </div>
      </section>

      {/* ٥. الطوابع — رفٌّ لنوع الزائر، و«شوف الكلّ». */}
      <section className="mx-auto w-full max-w-6xl px-5 py-20">
        <SectionHead
          title={`${THEMES_LABEL} — اختر ما يشبه مكانك`}
          sub="كلٌّ منها تصميمٌ كامل يلبس شعارك ولون علامتك. اسحب الرفّ، وقف على أيّها ليتحرّك، واضغطه لتراه على منيوك أعلاه."
        />
        <div ref={galRef} className={cn("min-w-0", GALLERY_MIN_H)}>
          {galNear ? (
            <Suspense fallback={<div className={cn("skeleton rounded-[20px]", GALLERY_MIN_H)} />}>
              <ThemeGallery
                category={galleryCat ?? kindCat}
                onCategory={setGalleryCat}
                current={brand.theme}
                onTry={tryTheme}
              />
            </Suspense>
          ) : (
            <div className={cn("skeleton rounded-[20px]", GALLERY_MIN_H)} aria-hidden="true" />
          )}
        </div>
        {/* صفحة لكل شريحة — سطرٌ لا قسم: الهبوط يبقى فكرةً واحدة (§27). */}
        <p className="mt-8 text-center text-sm text-dim">
          منيو لنوع مكانك:{" "}
          {SEGMENT_LINKS.map((l, i) => (
            <Fragment key={l.slug}>
              {i > 0 && " · "}
              <Link to={segmentPath(l.slug)} className="inline-flex min-h-11 items-center font-bold text-ink underline-offset-4 hover:underline">
                {l.label}
              </Link>
            </Fragment>
          ))}
        </p>
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

      {/* ٩. الدعوة الأخيرة — شريطٌ بالحبر: الخطوات الثلاث، ثم الزرّ. */}
      <section className="bg-ink text-page">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center">
          <Reveal>
            <div className="sadu-band mx-auto mb-7 w-32 opacity-90" aria-hidden="true" />
            <h2 className="font-display text-3xl font-bold leading-[1.3] sm:text-4xl">منيوك باسمك — جاهز اليوم</h2>
            <p className="mx-auto mt-4 max-w-[42ch] text-lg leading-relaxed opacity-80">ثلاث خطوات في جلسة واحدة:</p>
            <ol className="mx-auto mt-8 grid max-w-3xl gap-3 text-start sm:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="rounded-[16px] border border-page/15 p-4">
                  <span className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-page text-ink">
                      <Icon name={s.icon} size={17} />
                    </span>
                    <span className="text-sm font-bold opacity-70">{["٠١", "٠٢", "٠٣"][i]}</span>
                  </span>
                  <h3 className="mt-3 font-bold">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed opacity-80">{s.desc}</p>
                </li>
              ))}
            </ol>
            <div ref={closing.ref} className="mt-9 flex flex-wrap items-center justify-center gap-3">
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

      {/* شريط التجربة الثابت — على الجوّال وحده: بعد تجاوز زرّ البطل، ويغيب عند
          الكتابة في حقل وحين يظهر زرّ الخاتمة. والصفحة محشوّة أسفلها بارتفاعه. */}
      <div className={cn("cta-dock lg:hidden", dock && "is-up")} aria-hidden={!dock} data-testid="cta-dock">
        <div className="flex items-center gap-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <Link
            to="/login?mode=signup"
            tabIndex={dock ? undefined : -1}
            className="flex min-h-12 flex-1 items-center justify-center rounded-[12px] bg-gold px-4 font-bold text-on-gold active:scale-[.98]"
          >
            {CTA_PRIMARY}
          </Link>
          <p className="shrink-0 text-xs font-bold leading-tight text-dim">
            {trialDaysLabel} مجاناً
            <br />
            بلا بطاقة بنكية
          </p>
        </div>
      </div>
    </div>
  );
}

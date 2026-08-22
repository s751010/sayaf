/**
 * صفحة الهبوط — واجهة المنصة التسويقية.
 *
 * الحركة هنا مبنيّة على `lib/reveal.ts` (مراقب تقاطع + حرّاس تقليل الحركة) لا
 * على مكتبة حركة: الحزمة الرئيسية تخدم **صفحة المنيو** التي تُفتح من كود QR على
 * بيانات جوال، فكل كيلوبايت يُضاف لتسويقنا يدفعه زبون التاجر.
 */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Navbar, Footer } from "@/components/site";
import { Badge, Card } from "@/components/ui";
import { Reveal } from "@/components/landing/Reveal";
import { LiveDemo } from "@/components/landing/LiveDemo";
import { SwitchCost } from "@/components/landing/SwitchCost";
import { ScanDemo } from "@/components/landing/ScanDemo";
import { PhonePreview } from "@/components/landing/PhonePreview";
import { PricingCards, daysLabel, useTrialDays } from "@/components/landing/PricingCards";
import {
  CURRENCY,
  CURRENCY_CODE,
  PLAN,
  PLANS,
  effectiveMonthly,
  type BillingCycle,
} from "@/lib/plans";
import { prefersReducedMotion } from "@/lib/reveal";
import { cn, formatPrice } from "@/lib/utils";
import { Icon, type IconName } from "@/lib/icons";
import { ALL_THEMES, getTheme } from "@/lib/themes";
import { CTA_PRIMARY, CTA_SECONDARY, PRINT_DPI, THEME_COUNT } from "@/lib/facts";
import { absoluteUrl, useJsonLd, useSeo } from "@/lib/seo";

/* ── شريط الطوابع ───────────────────────────────────────────────────── */

/**
 * الطوابع التي يقلّبها العرض التلقائي — **خمسة لا كلّها**.
 *
 * تقليب الـ١٩ تلقائياً بمعدّل ٢٫٦ ثانية = خمسون ثانية عرضٍ لا يحتملها زائر.
 * والخمسة مختارة كي يتبدّل في كل خطوة **محورٌ بنيوي** لا لون: سدو بترويسة
 * شريطية ⇒ أقواس رواشين ⇒ بلا زخرفة بتخطيط عرض ⇒ قائمة بخطّ رقعة وحدّ مذهّب
 * ⇒ الافتراضي الذي يراه من لم يختر.
 */
const REEL = ["najdi", "hijazi", "modern", "luxe", "dark-gold"];
const DEFAULT_ID = "dark-gold";

/**
 * شريط اختيار الطابع.
 *
 * الشريحة تحمل **ثلاث نقاط** (أرضية · تمييز · نصّ) لا مربّع لون واحد: الطابع
 * ليس لوناً — وهي الجملة التي تبيع المنتج، فلا يجوز أن ينقضها عنصر التحكّم
 * نفسه بأن يعرضه لوناً.
 */
function ThemeRail({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const rail = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  /**
   * ⚠️ **يُمرَّر الشريط وحده — لا `scrollIntoView`.**
   *
   * تلك تحرّك **كل سلف قابل للتمرير** حتى نافذة المستند، والشريط أسفل الطيّة
   * على الجوال، فكانت **تقفز بالصفحة كلّها** ويهبط الزائر في منتصف البطل بلا
   * أن يلمس شيئاً. وحارس «لا تمرّر عند أوّل تركيب» **لا يكفي**: `StrictMode`
   * يستدعي الأثر مرّتين في التطوير فيسقط الحارس عند الثانية — وحارسٌ يعتمد على
   * عدد مرّات الاستدعاء ليس حارساً. أمّا `scrollBy` على الحاوية فلا يملك الوصول
   * إلى سلفٍ أصلاً.
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
    // ⚠️ `min-w-0` ليست زينة: حاوية تمرير أفقي داخل شبكة تساهم بعرض **محتواها
    // الأقصى** في تحجيم العمود ما لم يُصفَّر حدّها الأدنى. وشرائح الطوابع كلّها =
    // ٢٠٣١px، فكان عمود البطل يتمدّد إليها ويُدفع النصّ والأزرار والجهاز خارج
    // الشاشة على الجوال — صفحة بطلٍ **فارغة تماماً**، بلا خطأ ولا تمرير أفقي
    // لأن الفائض مقصوص. رُصد باللقطة على ٣٩٠px.
    <div className="theme-plane mt-6 min-w-0">
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
                // ⚠️ ٤٨px لا ٤٤: الشريط مائل ٦° في العمق، و**مساحة اللمس هي
                // المسقط** لا الارتفاع المُعلَن — فـ٤٤ تصير ٤٣٫٨ وتنزل تحت
                // الحدّ. رُصد بالقياس على ٣٩٠px لا بالحساب.
                "theme-chip flex min-h-12 shrink-0 snap-center items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors",
                on
                  ? "border-line-gold bg-gold/12 text-ink"
                  : "border-line bg-panel/60 text-dim hover:text-ink"
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

/* ── حركة ───────────────────────────────────────────────────────────── */

/**
 * غلاف الكشف عند التمرير.
 *
 * `delay` بالمللي ثانية لتتابع الأبناء: ظهور ثمانِ بطاقات دفعةً واحدة يبدو
 * وميضاً، وظهورها بفارق ٦٠ مللي يبدو ترتيباً مقصوداً.
 */
/* استُخرج إلى `components/landing/Reveal.tsx` حين احتاجته أقسام في ملفّات
   أخرى — نسخة واحدة كي لا يظهر قسمٌ بإيقاع وقسمٌ بآخر. */

/** رقم يعدّ عند ظهوره — الأرقام الثابتة لا تُقرأ، والمتحرّكة تُلاحَظ. */
const TRUST: { icon: IconName; label: string }[] = [
  { icon: "sparkle", label: "تجهيز في دقائق" },
  { icon: "money", label: "بلا عمولة على الطلبات" },
  { icon: "shield", label: "متوافق مع SFDA" },
];

/**
 * عنوان يتجمّع كلمةً كلمة.
 *
 * بالكلمة لا بالحرف: التقسيم الحرفي يكسر وصل الحروف العربية فتخرج الكلمة
 * مفكّكة، ويُنشئ عنصراً لكل محرف بلا مقابل. و`aria-label` يحمل النصّ كاملاً
 * كي يقرأه قارئ الشاشة جملةً واحدة لا كلمات متناثرة.
 */
function Words({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <span className={cn("word-in", className)} aria-label={text}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} className="word" style={{ "--w": i } as CSSProperties} aria-hidden="true">
          {w}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}

/* ── الأقسام ───────────────────────────────────────────────────────── */
/**
 * ⚠️ **ستّ بطاقات لا ثمانٍ — والترتيب هو الرسالة.**
 *
 * كانت ثمانياً تفتتحها «منيو QR فوري»، وهي **تعريف الصنف** الذي يقوله كل
 * منافس — أي أن أوّل ما يقرؤه التاجر ليس سبباً للاختيار. وصدارتها الآن لما
 * هو **إلزامي** (SFDA) ولما **يُعيد الزبون** (الولاء).
 *
 * وحُذف منها ما يقوله البطل أصلاً (المنيو الفوري) وما هو تفصيل تشغيلي تحمله
 * قائمة الباقة (ساعات العمل · ثنائي اللغة · التحديث اللحظي). وابتلعت بدلها
 * قسمين كاملين حُذفا: بطاقة الكاشير، ومسرح الطوابع.
 */
const FEATURES = [
  { emoji: "🍎", title: "معلومات غذائية وSFDA", desc: "سعرات وصوديوم وكافيين ومسبّبات حساسية لكل طبق — التزامٌ مطلوب من هيئة الغذاء والدواء، جاهزٌ في المنيو لا مشروع تعمله لاحقاً." },
  { emoji: "💛", title: "بطاقة ولاء رقمية", desc: "زبونك يجمع أختامه داخل المنيو نفسه ويعود — بلا بطاقة ورقية تضيع وبلا تطبيق يحمّله." },
  { emoji: "📊", title: "إحصائيات مباشرة", desc: "أكثر الأطباق مشاهدةً وساعات الذروة يوماً بيوم — تقرّر بالأرقام لا بالتخمين." },
  { emoji: "🪧", title: `بطاقة كاشير بهويتك — ${PRINT_DPI} DPI`, desc: "لا تفتح كانفا ولا تبحث عن مصمّم: نجهّزها من بيانات مطعمك بشعارك داخل الكود، وتنزّلها ملفّاً يقبله أي مطبعة." },
  { emoji: "🎨", title: `${THEME_COUNT} طابعاً + لون علامتك`, desc: "كل طابع شخصية كاملة — زخرفة وترويسة وخطّ وتخطيط، بينها طوابع تراثية سعودية. أو اختر لون مشروعك ونبني منه طابعاً متناسقاً." },
  { emoji: "💳", title: "دفع إلكتروني — إلى حسابك أنت", desc: "تربط بوّابتك الخاصّة، فيدفع زبونك وهو على الطاولة ويصلك المال مباشرة. لا نمرّ بالمال ولا نأخذ منه شيئاً." },
];

const FAQS = [
  { q: "هل يحتاج الزبون تحميل تطبيق؟", a: "أبداً. يمسح كود QR بكاميرا جواله ويفتح المنيو في المتصفح مباشرة — يعمل على كل الأجهزة." },
  { q: "هل أقدر أعدّل الأسعار بنفسي؟", a: "نعم، من لوحة تحكم عربية بالكامل. أي تعديل يظهر للزبائن لحظياً." },
  { q: "كيف تُحسب الطاولات؟", a: "تولّد كود QR خاصاً لكل طاولة (طاولة ١، طاولة ٢…) ويظهر رقم الطاولة تلقائياً عند فتح المنيو." },
  { q: "ما طرق الدفع المتاحة للاشتراك؟", a: "مدى، البطاقات الائتمانية وApple Pay عبر بوّابة PayLink السعودية. تُحوَّل إلى صفحة الدفع الآمنة، وبيانات بطاقتك لا تمرّ بنا ولا نحتفظ بها." },
  { q: "هل بياناتي آمنة؟", a: "بياناتك محفوظة في قواعد بيانات سحابية مشفّرة مع صلاحيات وصول صارمة، ونسخ احتياطي مستمر." },
  { q: "هل هناك باقات متعددة؟", a: `لا — باقة واحدة بـ${PLAN.monthly} ر.س شهرياً تفتح كل شيء بلا حدود: قوائم وأصناف غير محدودة، طلبات واتساب، ثنائي اللغة، بطاقة ولاء، تحليلات، وبطاقة كاشير للطباعة. أو ${PLAN.yearly} ر.س سنوياً — أي ما يعادل ${effectiveMonthly(PLAN, "yearly")} ر.س في الشهر.` },
];

/**
 * مدّة التجربة كما تفرضها القاعدة لا كما يظنّها العميل.
 *
 * القيمة الحقيقية في `site_settings.billing.trial_days`، ويقرأها التريجر
 * نفسه. فتغييرها من لوحة المؤسّس يغيّر ما يُمنح **وما يُعرض** معاً — ولا
 * يبقى رقمٌ في الواجهة يَعِد بما لا تعطيه القاعدة.
 * `TRIAL_DAYS` هو رسمة أولى فقط حتى تصل الإعدادات.
 */
/* ── شريط الدعوة اللاصق ─────────────────────────────────────────────── */

/**
 * هل غادر هذا القسم الشاشة إلى الأعلى؟ حارس ظهور الشريط اللاصق.
 *
 * ⚠️ **يُراقَب القسم كاملاً لا مرساة رفيعة عند نهايته.** المرساة بارتفاع بكسل
 * تنتقل من «تحت الشاشة» إلى «فوقها» بلا أن تتقاطع معها قطّ حين يقفز التمرير
 * (رابط داخلي، أو نقرة على شريط التمرير، أو دفعة سريعة) — فلا تُبلَّغ أي نقلةِ
 * حالة ويبقى الشريط غائباً. رُصد فعلاً: نداءٌ واحد يتيم عند التركيب ثم صمت.
 * والقسم الطويل متقاطعٌ عند التحميل يقيناً، فأي خروج بعده يُبلَّغ حتماً.
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

export default function Landing() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  /**
   * الطابع المعروض في البطل — وهو نفسه الذي تلبسه الدعوة الأخيرة.
   *
   * `picked` تعني «اختار الزائر بيده»: عندها يتوقّف التقليب التلقائي **نهائياً**
   * ولا يعود. عرضٌ يستأنف نفسه بعد أن يتدخّل المستخدم يُقرأ عصياناً لا حياة.
   */
  const [themeId, setThemeId] = useState(DEFAULT_ID);
  const [picked, setPicked] = useState(false);
  const theme = getTheme(themeId);
  const hero = usePassed<HTMLElement>();
  const trialDaysLabel = daysLabel(useTrialDays());

  useSeo({
    title: "منيو رقمي QR لمطعمك",
    /* `clampDescription` يقصّ عند ١٦٠ محرفاً، والوصف السابق كان ~١٦٥ فيُبتر
       عند «٣٠٠ DPI». وهذا أقصر، ويقود بالمجاني وبطلبات واتساب — وهما ما
       يعمل اليوم — لا بالسعر ولا بميزة غير مُفعَّلة. */
    description:
      `منيو QR لمطعمك بـ${THEME_COUNT} طابعاً: طلبات واتساب بلا عمولة، دفع إلكتروني، عربي وإنجليزي، بلا تطبيق يحمّله زبونك.`,
    path: "/",
    image: "/og.png",
  });

  /**
   * ⚠️ **الأسئلة تُبثّ من `FAQS` نفسها التي تُعرَض** لا من نسخة مكتوبة بيد.
   *
   * مخطّط `FAQPage` يخالف نصّ الصفحة يُعدّ محتوىً مخفياً في إرشادات قوقل، وقد
   * يُسقِط النتيجة الغنيّة كلها. والمصدر الواحد يجعل ذلك مستحيلاً بالبناء:
   * أي سؤال يُعدَّل في الصفحة يتغيّر في المخطّط في اللحظة نفسها.
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
          "منصّة منيو رقمي QR للمطاعم السعودية: طوابع فاخرة، إحصائيات، بطاقة ولاء، وبطاقة كاشير جاهزة للطباعة.",
        offers: {
          "@type": "Offer",
          price: PLANS[0]?.monthly ?? 99,
          priceCurrency: CURRENCY_CODE,
          // بلا تقييمات مُختلَقة: `aggregateRating` بلا مراجعات حقيقية مخالفة
          // صريحة لإرشادات قوقل، وعقوبتها إسقاط النتيجة الغنيّة لا تحسينها.
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

  /**
   * دورة واحدة ثم سكون — **بعد أن يستقرّ مشهد الاستعمال**.
   *
   * `lib/phoneDemo.ts` يمثّل ستّ ثوانٍ ونصفاً (إصبع، تمرير، لوح، سلّة). لو بدأ
   * تقليب الطوابع فوقه لتصادم عرضان على جهاز واحد: يتبدّل الجلد والإصبع في
   * منتصف ضغطة، فلا يُقرأ أيّهما. فالترتيب: **يُستعمَل الجهاز، ثم يبدّل جلده.**
   */
  useEffect(() => {
    if (picked || prefersReducedMotion()) return;
    // يبدأ من ‎−1 كي تكون أوّل نقلة هي `REEL[0]`: الحالة الابتدائية هي الطابع
    // الافتراضي (ما يراه تاجرٌ لم يختر)، والدورة تمرّ ثم **تعود إليه** وتقف.
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
      {/* شريط تقدّم القراءة — مربوط بتمرير الجذر، بلا مستمع تمرير. */}
      <span aria-hidden="true" className="scroll-rail" />

      <Navbar />

      {/* البطل */}
      <section ref={hero.ref} className="glow-bg relative overflow-hidden">
        {/* طبقة زخرفية وحدها تنجرف مع التمرير. الباراlaكس على القسم نفسه كان
            سيجرّ العنوان والأزرار معه — وإزاحة النصّ تُتعب القراءة. */}
        <span
          aria-hidden="true"
          className="par-fast pointer-events-none absolute -top-24 inset-x-0 -z-10 mx-auto h-[36rem] w-[36rem] max-w-full rounded-full opacity-[.07] blur-3xl"
          style={{ background: "radial-gradient(circle, var(--c-gold), transparent 65%)" }}
        />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-14 lg:grid-cols-2 lg:pt-20">
          <div className="anim-fade-up text-center lg:text-right">
            <Badge className="mb-5">🇸🇦 صُنع للمطاعم السعودية</Badge>
            {/* ⚠️ **العنوان يقود بالميزة لا بتعريف الفئة.**
                كان «زبونك يمسح الكود… والطلب يصلك على واتساب» — وهي جملة
                صادقة، لكن **كل منافس يقولها**: هي تعريف الصنف لا سببُ اختيارنا.
                فكان البطل يفتتح بما يشترك فيه الجميع، ويترك ما لا يقلّده أحدٌ
                الأسبوع القادم إلى القسم التالي.

                وقراءة المنيو من صورة هي جواب **الاعتراض الأوّل** لكل صاحب مطعم
                («ما عندي وقت أدخل ستّين صنفاً») — وهو بالضبط ما يمنع الاشتراك.
                فصارت هي الوعد، وبقي الطلب على واتساب في الجملة المساندة. */}
            <h1 className="font-display text-4xl font-black leading-[1.2] text-ink sm:text-5xl">
              <Words text="صوّر منيوك المطبوع…" />
              <br />
              <Words text="ويرجع لك منيو QR" className="text-gold-grad" />
            </h1>
            <p className="mx-auto mt-5 max-w-[46ch] text-lg leading-[1.85] text-dim lg:mx-0">
              صورة واحدة — نقرأ الأصناف والأسعار ونرتّبها في تصنيفاتها،
              <span className="font-bold text-ink"> وتراجعها قبل أن تُحفظ</span>. ثم
              يمسح زبونك الكود فيصلك طلبه على واتساب بلا عمولة، أو يدفعه في المنيو
              نفسه ببوّابتك أنت.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link
                to="/login?mode=signup"
                className="rounded-xl bg-gold px-6 py-3 font-bold text-on-gold shadow-[0_8px_30px_-8px_var(--c-glow)] transition-transform hover:bg-gold2 active:scale-[.98]"
              >
                {CTA_PRIMARY}
              </Link>
              {/* ⚠️ الزرّ الثاني يتبع الطابع الذي يقلّبه الزائر في السكّة —
                  فيفتح ما يراه لا عيّنة عامّة. وكان هنا رابطٌ ثالث منفصل
                  («افتح هذا الطابع منيواً كاملاً») يؤدّي نفس الفعل بلفظ ثالث. */}
              <Link
                to={`/demo?theme=${theme.id}`}
                className="rounded-xl border border-line-gold px-6 py-3 font-bold text-ink hover:bg-gold/10"
              >
                👀 {CTA_SECONDARY}
              </Link>
            </div>
            {/* المجانيّ هو التجربة وحدها — تحت الزرّ لا على وجهه.
                و`text-dim` لا `text-faint`: هذا السطر يحمل الوعد الذي يجعل
                الزائر يضغط، وأضعف تدرّج (3.76:1) دون حدّ AA. */}
            <p className="mt-3 text-xs text-dim">
              {trialDaysLabel} مجاناً — بلا بطاقة بنكية.
            </p>
            {/* شرائح الثقة الثلاث — تدخل متعاقبة ثم تتنفّس، فتُقرأ إشاراتٍ
                حيّة لا سطر نصّ رمادي. الرمز يرث لون الشريحة عبر
                `currentColor`، بخلاف الإيموجي الذي كان يفرض لونه. */}
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              {TRUST.map((t, i) => (
                <li
                  key={t.label}
                  className="trust-chip inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-panel/60 px-3 py-1.5 text-xs font-bold text-dim"
                  style={{ "--t": i } as CSSProperties}
                >
                  <Icon name={t.icon} size={14} className="text-gold" />
                  {t.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0">
            <PhonePreview theme={theme} animate />
            <ThemeRail value={themeId} onChange={pick} />
            {/* سطر الطابع الحيّ — اسمه وسطره التعريفيّان يأتيان من `themes.ts`
                نفسها التي يقرأها التاجر في لوحته، فلا وصف تسويقي ثانٍ ينحرف. */}
            <p className="mt-2 text-center text-xs text-faint">
              <b className="text-dim">{theme.name}</b> — {theme.tagline}
            </p>
          </div>
        </div>
      </section>

      {/* «جرّبه الآن» — الدليل الوحيد المتاح.
          لا شهادات ولا شعارات ولا عدّاد مستخدمين: لا يوجد عميل واحد بعد،
          وكل حساب في القاعدة يخصّ المالك. فالمنتج نفسه هو البرهان. */}
      <ScanDemo />

      <LiveDemo theme={theme} />

      {/* ⚠️ **الاعتراض قبل السعر ومباشرةً بعد البرهان.**
          كان بعد مسرح الطوابع وشريط الأرقام — أي أن الزائر يقرأ عن الزخرفة
          ثم يُسأل عن كلفة الانتقال. والترتيب الآن: أرِه أنه يعمل (`ScanDemo`)،
          دعه يلمسه (`LiveDemo`)، ثم أزِل ما يمنعه (`SwitchCost`)، ثم قل الثمن.

          وحُذف من هنا: مسرح الطوابع (خمس شاشات عن الزخرفة — والسكّة في البطل
          تحمل الطوابع كلّها حيّةً)، وشريط الأرقام، وقسم الخطوات الثلاث (صار
          `ScanDemo` هو الخطوات مرئيّةً)، وقسم بطاقة الكاشير. أرقامها كلّها
          باقية في قائمة الباقة — سطراً لا شاشة. */}
      <SwitchCost />

      {/* المزايا */}
      <section id="features" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-16">
        <Reveal className="mb-10 text-center">
          <h2 className="font-display text-3xl font-black text-ink">
            كل ما يحتاجه مطعمك… <span className="text-gold">في مكان واحد</span>
          </h2>
          <p className="mt-2 text-dim">منصة متكاملة، وليست مجرد منيو.</p>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            // التتابع بمضاعفات الصف لا بالفهرس: ستّ بطاقات × ٧٠ = انتظارٌ لآخرها
            // والزائر يكون قد مرّ عليها.
            <Reveal key={f.title} delay={(i % 3) * 70} className="h-full">
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
                  "flex min-h-11 items-center gap-2 rounded-lg px-5 py-2 text-sm font-bold transition-colors",
                  cycle === c ? "bg-gold text-on-gold" : "text-dim hover:text-ink"
                )}
              >
                {c === "monthly" ? "شهري" : "سنوي"}
                {c === "yearly" && (
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[11px]",
                    cycle === "yearly" ? "bg-on-gold/15 text-on-gold" : "bg-good/15 text-good"
                  )}>
                    وفّر {PLAN.monthly * 12 - PLAN.yearly} ر.س
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        <PricingCards cycle={cycle} selectLabel={CTA_PRIMARY} />
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

      {/* دعوة أخيرة — تلبس الطابع الذي اختاره الزائر فعلاً أعلى الصفحة، فيرى
          منيوه هو لا عيّنة عامّة. وهذا ما يجعل الزرّ خطوةً تالية لا إعلاناً. */}
      <section className="glow-bg border-t border-line">
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-5 py-16 lg:grid-cols-[1fr_auto]">
          <Reveal className="text-center lg:text-right">
            <h2 className="font-display text-3xl font-black leading-[1.25] text-ink">
              منيوك بطابع <span className="text-gold-grad">{theme.name}</span> — جاهز الآن
            </h2>
            <p className="mt-3 max-w-md leading-relaxed text-dim lg:mx-0">
              أنشئ حسابك، أضف أطباقك، ونزّل بطاقتك. تبديل الطابع لاحقاً ضغطةٌ واحدة —
              وكل ما تراه هنا داخل الباقة بلا إضافات.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link
                to="/login?mode=signup"
                className="inline-flex min-h-11 items-center rounded-xl bg-gold px-8 py-3.5 font-bold text-on-gold shadow-[0_8px_30px_-8px_var(--c-glow)] transition-transform hover:bg-gold2 active:scale-[.98]"
              >
                {CTA_PRIMARY}
              </Link>
              <Link
                to={`/demo?theme=${theme.id}`}
                className="inline-flex min-h-11 items-center rounded-xl border border-line-gold px-6 py-3 font-bold text-ink hover:bg-gold/10"
              >
                👀 {CTA_SECONDARY}
              </Link>
            </div>
            <p className="mt-4 text-xs text-faint">
              {formatPrice(PLANS[0]?.monthly ?? 99)} {CURRENCY} شهرياً · بلا رسوم خفية · ألغِ متى شئت
            </p>
          </Reveal>
          <Reveal delay={120} className="hidden lg:block">
            <PhonePreview theme={theme} width="w-[220px]" />
          </Reveal>
        </div>
      </section>

      <Footer />

      {/* شريط الدعوة اللاصق — على الجوال وحده: هناك تغادر أزرار البطل الشاشة
          بعد شاشة واحدة، وعلى الحاسوب تبقى الترويسة ظاهرة أصلاً. */}
      <div
        className={cn("cta-dock lg:hidden", hero.passed && "is-up")}
        aria-hidden={!hero.passed}
      >
        <div className="flex items-center gap-2 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <Link
            to="/login?mode=signup"
            tabIndex={hero.passed ? undefined : -1}
            className="flex min-h-12 flex-1 items-center justify-center rounded-xl bg-gold px-4 font-bold text-on-gold active:scale-[.98]"
          >
            {CTA_PRIMARY}
          </Link>
          <Link
            to={`/demo?theme=${theme.id}`}
            tabIndex={hero.passed ? undefined : -1}
            className="flex min-h-12 items-center justify-center rounded-xl border border-line-gold px-4 font-bold text-ink"
          >
            {CTA_SECONDARY}
          </Link>
        </div>
      </div>
    </div>
  );
}

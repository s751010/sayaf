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
import { PhonePreview } from "@/components/landing/PhonePreview";
import { PricingCards } from "@/components/landing/PricingCards";
import {
  CURRENCY,
  CURRENCY_CODE,
  PLAN,
  PLANS,
  effectiveMonthly,
  type BillingCycle,
} from "@/lib/plans";
import { prefersReducedMotion, useCountUp, useReveal } from "@/lib/reveal";
import { cn, formatPrice } from "@/lib/utils";
import { Icon, type IconName } from "@/lib/icons";
import { ALL_THEMES, getTheme } from "@/lib/themes";
import { CARD_LAYOUT_COUNT, PRINT_DPI, THEME_COUNT } from "@/lib/facts";
import { absoluteUrl, useJsonLd, useSeo } from "@/lib/seo";

/* ── شريط الطوابع ───────────────────────────────────────────────────── */

/**
 * الطوابع التي يقلّبها العرض التلقائي — **خمسة لا تسعة عشر**.
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
    // الأقصى** في تحجيم العمود ما لم يُصفَّر حدّها الأدنى. وتسعة عشر شريحة =
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
      {/* النقطة تبقى ٦px بصرياً، والزرّ حولها ٤٤px: هدف اللمس لا يُقاس
          بالحبر المرسوم بل بالمساحة القابلة للنقر. كانت ٦×٦ فعلياً. */}
      <div className="flex">
        {SHOWCASE.map((s, n) => (
          <button
            key={s.style}
            onClick={() => setI(n)}
            aria-label={`نمط ${n + 1}`}
            aria-current={n === i}
            className="flex h-11 items-center px-1.5"
          >
            <span
              className={cn(
                "block h-1.5 rounded-full transition-all",
                n === i ? "w-6 bg-gold" : "w-1.5 bg-ink/20 hover:bg-ink/35"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * إشارات الثقة الثلاث في البطل — ما يطمئن التاجر قبل أن يقرأ ميزة واحدة.
 *
 * ⚠️ **لا شريحة تعِد بالدفع الإلكتروني.** كانت هنا «مدى · Apple Pay»، والمسار
 * مبنيّ **وغير مُفعَّل** — فشريحةٌ وُضعت لتطمئن كانت تعِد بما لا يجده التاجر،
 * وتهدم الثقة التي وُضعت لتبنيها. تعود يوم يعمل المسار لا قبله.
 *
 * ⚠️ ولا `card` لأي شريحة مالية: رمز `card` في مجموعتنا هو **الستاند المثلّث**
 * الذي يطبعه التاجر (موثَّق فوق تعريفه في `lib/icons.tsx`) لا بطاقة بنكية —
 * وبقياس ١٤px كان يُقرأ مثلّث تحذير.
 */
const TRUST: { icon: IconName; label: string }[] = [
  { icon: "sparkle", label: "تجهيز في دقائق" },
  { icon: "money", label: "مجاناً للأبد" },
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
const FEATURES = [
  { emoji: "📱", title: "منيو QR فوري", desc: "زبونك يمسح الكود ويتصفح المنيو في ثانية — بلا تطبيق، بلا انتظار، وبثيمات فاخرة تناسب هوية مطعمك." },
  { emoji: "🎨", title: "طوابع + لون علامتك", desc: "تسعة عشر طابعاً كاملاً بينها طوابع تراثية سعودية — زخرفة وترويسة وتخطيط وخطّ، أو اختر لون مشروعك وسنبني منه طابعاً متناسقاً." },
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

/**
 * أرقام من المنتج نفسه لا ادّعاءات سوق — كلٌّ منها يقابله شيء يراه الزائر.
 * والقيم من `lib/facts.ts` لا مكتوبة هنا: بقي «١٢» بعد إضافة سبعة طوابع مرّة،
 * وصفحة «من نحن» تعرض الأرقام نفسها فيصير للرقم موضعان يتباعدان.
 */
const STATS: { to: number; suffix?: string; label: string }[] = [
  { to: THEME_COUNT, label: "طابعاً كاملاً للمنيو" },
  { to: CARD_LAYOUT_COUNT, label: "أشكال بطاقة كاشير" },
  { to: PRINT_DPI, suffix: " DPI", label: "دقة ملف الطباعة" },
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
/* ── مسرح الطوابع ───────────────────────────────────────────────────── */

/**
 * أربع نقلات، كلٌّ تسمّي **محوراً** وتُريه على الجهاز نفسه.
 *
 * الطابع في كل نقلة مختار لأنه أقصى ما يُظهر محورها: `najdi` أعلى زخرفة،
 * و`hijazi` وحده بأقواس الرواشين، و`modern` بلا زخرفة إطلاقاً وبتخطيط عرض
 * (فالنقلة تُقرأ قفزةً لا تدرّجاً)، و`luxe` يجمع الحدّ المذهّب واللمعة الذهبية
 * وخطّ الرقعة للعناوين معاً.
 */
const BEATS = [
  {
    id: "najdi",
    title: "زخرفة، لا خلفية ملوّنة",
    desc: "نسيج السدو محكمٌ خلف المنيو كلّه، ورأس القائمة شريطٌ منسوج بين خطّين. سبع زخارف أصلية موثّقة المصدر — لا صور جاهزة.",
  },
  {
    id: "hijazi",
    title: "ترويسة بشكلها",
    desc: "قوس الرواشين الحجازية يفصل رأس المنيو عن أطباقه. أربعة أشكال ترويسة: قوس، وشريط، وإطار مزدوج، وحافّة ناعمة.",
  },
  {
    id: "modern",
    title: "تخطيط الأطباق نفسه",
    desc: "شبكة، أو قائمة رأسية، أو «عرض» ببطاقات كبيرة تتصدّرها الصورة. هذا وحده يقلب شكل المنيو قبل أن يتغيّر لون واحد.",
  },
  {
    id: "luxe",
    title: "خامة وخطّ",
    desc: "عمق الأسطح ولمعة الذهب وحدّ الحافّة، وخطّ رقعة للعناوين مع خطّ قراءة للأصناف. تسعة عشر طابعاً — لا اثنان منها متشابهان.",
  },
] as const;

/**
 * الكتلة التي تعبر منتصف الشاشة هي الفعّالة.
 *
 * بمراقب تقاطع بهامش يقصّ الشاشة إلى شريط رفيع في وسطها — لا بمستمع تمرير:
 * الأخير يقيس مواضع العناصر في كل إطار فيتقطّع التمرير على الجوال المتوسّط،
 * وهو أغلب من يفتح صفحتنا (نفس علّة `lib/reveal.ts`).
 */
function useMidBeat() {
  const refs = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || prefersReducedMotion()) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = Number((e.target as HTMLElement).dataset.beat);
          if (Number.isFinite(i)) setActive(i);
        }
      },
      { rootMargin: "-48% 0px -48% 0px" }
    );
    for (const el of refs.current) if (el) io.observe(el);
    return () => io.disconnect();
  }, []);

  return { refs, active };
}

function ThemeStage() {
  const { refs, active } = useMidBeat();
  const beat = BEATS[active] ?? BEATS[0];
  const theme = getTheme(beat.id);

  return (
    <section id="themes" className="scroll-mt-20 border-y border-line bg-panel/40">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <Reveal className="mb-12 text-center">
          <Badge className="mb-5">🎨 تسعة عشر طابعاً</Badge>
          <h2 className="font-display text-3xl font-black leading-[1.25] text-ink">
            الطابع <span className="text-gold-grad">ليس لوناً</span>
          </h2>
          <p className="mx-auto mt-3 max-w-lg leading-relaxed text-dim">
            كل طابع يغيّر الزخرفة وشكل الترويسة وتخطيط الأطباق والخطّ وخامة الأسطح.
            انزل ببطء — الجهاز يتبدّل معك.
          </p>
        </Reveal>

        <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
          {/* ⚠️ التثبيت على الشاشات الواسعة وحدها: سينما تمرير مثبّتة على جوال
              ضيّق تسرق الشاشة كاملةً ويصير الخروج من القسم صراعاً. على الجوال
              يسبق الجهازُ الكتلَ مرّة واحدة، وهي بطاقات تُقرأ بلا تثبيت. */}
          <div className="order-1 lg:sticky lg:top-[max(5rem,calc(50dvh-17rem))]">
            <PhonePreview theme={theme} width="w-[250px]" />
          </div>

          <ol className="order-2 flex flex-col gap-6 lg:gap-[42vh] lg:py-[26vh]">
            {BEATS.map((b, i) => (
              <li
                key={b.id}
                data-beat={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                className={cn(
                  "rounded-2xl border p-5 transition-colors duration-300 lg:border-0 lg:bg-transparent lg:p-0",
                  i === active
                    ? "border-line-gold bg-gold/[.06] lg:opacity-100"
                    : "border-line bg-panel/50 lg:opacity-45"
                )}
              >
                <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line-gold bg-gold/10 font-display text-sm font-black text-gold">
                  {i + 1}
                </span>
                <h3 className="font-display text-xl font-black text-ink lg:text-2xl">{b.title}</h3>
                <p className="mt-2 max-w-md leading-relaxed text-dim">{b.desc}</p>
                {/* على الجوال لا تثبيت، فكل كتلة تحمل مدخلها إلى طابعها. */}
                <Link
                  to={`/demo?theme=${b.id}`}
                  className="mt-3 inline-flex min-h-11 items-center text-sm font-black text-gold hover:underline lg:hidden"
                >
                  افتح هذا الطابع ←
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

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

  useSeo({
    title: "منيو رقمي QR لمطعمك — مجاناً",
    /* `clampDescription` يقصّ عند ١٦٠ محرفاً، والوصف السابق كان ~١٦٥ فيُبتر
       عند «٣٠٠ DPI». وهذا أقصر، ويقود بالمجاني وبطلبات واتساب — وهما ما
       يعمل اليوم — لا بالسعر ولا بميزة غير مُفعَّلة. */
    description:
      "منيو QR مجاني للأبد لمطعمك: طلبات واتساب بلا عمولة، تسعة عشر طابعاً، عربي وإنجليزي، بلا تطبيق يحمّله زبونك.",
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
            {/* العنوان يعِد بنتيجة لا بصفة.
                كان «تجربة رقمية فاخرة» — وهي لغة تبيع الجَمال، والتاجر يقارننا
                بمنيو مجاني فيقرأ الفخامة ثمناً زائداً. والوعد الصادق الوحيد
                الذي يعمل اليوم: يمسح، فيصلك طلبه على واتساب. */}
            <h1 className="font-display text-4xl font-black leading-[1.2] text-ink sm:text-5xl">
              <Words text="زبونك يمسح الكود…" />
              <br />
              <Words text="والطلب يصلك على واتساب" className="text-gold-grad" />
            </h1>
            <p className="mx-auto mt-5 max-w-[46ch] text-lg leading-[1.85] text-dim lg:mx-0">
              منيو QR كامل بـ{THEME_COUNT} طابعاً، عربي وإنجليزي، يعمل{" "}
              <span className="font-bold text-ink">مجاناً للأبد</span> — والطلب يصل
              واتساب مطعمك مباشرة بلا عمولة، وبلا تطبيق يحمّله زبونك.
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
            <div className="mt-4 flex justify-center">
              <Link
                to={`/demo?theme=${theme.id}`}
                className="inline-flex min-h-11 items-center rounded-xl border border-line-gold px-5 py-2.5 text-sm font-bold text-ink hover:bg-gold/10"
              >
                افتح هذا الطابع منيواً كاملاً ←
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* «جرّبه الآن» — الدليل الوحيد المتاح.
          لا شهادات ولا شعارات ولا عدّاد مستخدمين: لا يوجد عميل واحد بعد،
          وكل حساب في القاعدة يخصّ المالك. فالمنتج نفسه هو البرهان. */}
      <LiveDemo theme={theme} />

      <ThemeStage />

      {/* كلفة التحويل — الاعتراضان اللذان يمنعان الاشتراك، قبل السعر لا بعده. */}
      <SwitchCost />

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
                أنشئ منيوك الآن
              </Link>
              <Link
                to={`/demo?theme=${theme.id}`}
                className="inline-flex min-h-11 items-center rounded-xl border border-line-gold px-6 py-3 font-bold text-ink hover:bg-gold/10"
              >
                👀 شوفه أولاً
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
            ابدأ مجاناً
          </Link>
          <Link
            to={`/demo?theme=${theme.id}`}
            tabIndex={hero.passed ? undefined : -1}
            className="flex min-h-12 items-center justify-center rounded-xl border border-line-gold px-4 font-bold text-ink"
          >
            جرّب المنيو
          </Link>
        </div>
      </div>
    </div>
  );
}

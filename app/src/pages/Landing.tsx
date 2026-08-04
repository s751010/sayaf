/**
 * صفحة الهبوط — واجهة المنصة التسويقية.
 *
 * الحركة هنا مبنيّة على `lib/reveal.ts` (مراقب تقاطع + حرّاس تقليل الحركة) لا
 * على مكتبة حركة: الحزمة الرئيسية تخدم **صفحة المنيو** التي تُفتح من كود QR على
 * بيانات جوال، فكل كيلوبايت يُضاف لتسويقنا يدفعه زبون التاجر.
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Navbar, Footer } from "@/components/site";
import { Badge, Card } from "@/components/ui";
import { CURRENCY, PLANS, effectiveMonthly, planPrice, type BillingCycle } from "@/lib/plans";
import { prefersReducedMotion, useCountUp, useReveal, useTilt } from "@/lib/reveal";
import { cn, formatPrice } from "@/lib/utils";
import { Icon, type IconName } from "@/lib/icons";
import { getTheme } from "@/lib/themes";

/* ── معاينة هاتف حيّة (عرض تسويقي ثابت) ────────────────────────────── */
const DEMO_DISHES = [
  { emoji: "🥩", name: "ستيك واقيو مشوي", price: 189, cal: 620 },
  { emoji: "🍤", name: "روبيان مقرمش بالعسل", price: 78, cal: 540 },
  { emoji: "🥗", name: "سلطة البرّاتا والرمان", price: 52, cal: 310 },
  { emoji: "☕", name: "قهوة سعودية بالهيل", price: 18, cal: 15 },
  { emoji: "🍗", name: "دجاج مشوي بالليمون", price: 64, cal: 480 },
  { emoji: "🍚", name: "كبسة لحم حاشي", price: 95, cal: 710 },
];

/** أطباق التصنيف الثاني — التمثيل يبدّل القائمة عند ضغط شريحة «المقبلات». */
const DEMO_MEZZE = [
  { emoji: "🥙", name: "متبّل باذنجان مدخّن", price: 26, cal: 180 },
  { emoji: "🧆", name: "كبّة مقلية بالصنوبر", price: 34, cal: 290 },
  { emoji: "🫓", name: "فتّة حمّص بالسمن", price: 29, cal: 240 },
  { emoji: "🥒", name: "تبّولة بالرمّان", price: 24, cal: 120 },
  { emoji: "🧀", name: "جبنة حلوم مشوية", price: 32, cal: 260 },
  { emoji: "🍆", name: "بابا غنّوج بالطحينة", price: 27, cal: 200 },
];

/**
 * رموز شريط حالة iOS — **مضمَّنة هنا لا في `lib/icons.tsx`**.
 *
 * قاعدة §20 («مصدر رسم واحد للـDOM وللـcanvas») تخصّ أيقونات المنتج التي
 * تُرسم في الحالتين. وهذه رموز نظام تشغيل تُحاكى داخل ماكيت، لا تُرسم على
 * canvas أبداً، وهي **أشكال مصمتة** لا خطوط بسماكة ١٫٧٥ — فإدخالها في مجموعة
 * المنتج كان سيلوّثها بأشكال لا تتبع شبكتها.
 */
function StatusGlyphs() {
  return (
    <span className="flex items-center gap-[3px]" style={{ color: "var(--m-text)" }}>
      {/* شبكة: أربعة أعمدة متدرّجة */}
      <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor" aria-hidden="true">
        <rect x="0" y="7" width="2.5" height="3" rx="0.6" />
        <rect x="3.8" y="5" width="2.5" height="5" rx="0.6" />
        <rect x="7.6" y="2.8" width="2.5" height="7.2" rx="0.6" />
        <rect x="11.4" y="0" width="2.5" height="10" rx="0.6" />
      </svg>
      {/* واي‑فاي: ثلاثة أقواس ونقطة */}
      <svg width="12" height="10" viewBox="0 0 12 10" fill="none" stroke="currentColor" aria-hidden="true">
        <path d="M1 3.4a7.4 7.4 0 0 1 10 0" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M3 5.7a4.4 4.4 0 0 1 6 0" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="6" cy="8.4" r="1.1" fill="currentColor" stroke="none" />
      </svg>
      {/* بطارية: غلاف وطرف وحشوة */}
      <svg width="19" height="10" viewBox="0 0 19 10" aria-hidden="true">
        <rect x="0.5" y="0.5" width="15" height="9" rx="2.6" fill="none" stroke="currentColor" strokeOpacity="0.45" />
        <rect x="2" y="2" width="10.5" height="6" rx="1.4" fill="currentColor" />
        <path d="M17 3.6v2.8a1.9 1.9 0 0 0 0-2.8Z" fill="currentColor" fillOpacity="0.45" />
      </svg>
    </span>
  );
}

function DishRow({ d, i }: { d: (typeof DEMO_DISHES)[number]; i: number }) {
  return (
    <div
      className="ph-row flex items-center gap-2.5 rounded-xl p-2.5"
      style={{ background: "var(--m-surface)", "--i": i } as CSSProperties}
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-lg text-lg"
        style={{ background: "var(--m-bg-2)" }}
      >
        {d.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-bold" style={{ color: "var(--m-text)" }}>
          {d.name}
        </p>
        <p className="text-[9px]" style={{ color: "var(--m-muted)" }}>
          {d.cal} سعرة حرارية
        </p>
      </div>
      <span className="text-[11px] font-black" style={{ color: "var(--m-accent)" }} dir="ltr">
        {d.price} ر.س
      </span>
    </div>
  );
}

/**
 * الهاتف البطل — **منتج يُستعمَل أمام الزائر** لا صورة له.
 *
 * الشاشة تُلوَّن بمتغيّرات `--m-*` الحقيقية لطابع `dark-gold` (الطابع الافتراضي)،
 * فما يراه الزائر هنا هو جلد المنتج نفسه: من ضغط «جرّب منيو تجريبي» بعدها يجد
 * الشيء ذاته لا شيئاً آخر.
 *
 * القشرة هنا **ساكنة وكاملة**: تُقرأ صحيحة بلا جافاسكربت إطلاقاً. أما محرّك
 * التمثيل (`lib/phoneDemo.ts`) فيُستورد **ديناميكياً** عند ظهور البطل — لأن
 * `Landing` في الحزمة الرئيسية مع `MenuPage`، فأي بايت يُضاف هنا يحمّله زبون
 * المطعم وهو يمسح كود QR.
 */
function PhonePreview() {
  const tilt = useTilt<HTMLAnchorElement>(14);
  const stage = useRef<HTMLDivElement>(null);
  const { ref: seen, shown } = useReveal<HTMLDivElement>("-20%");
  const vars = getTheme("dark-gold").vars as CSSProperties;
  const clock = new Date().toLocaleTimeString("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  useEffect(() => {
    // من طلب تقليل الحركة لا يُنزّل المحرّك أصلاً: القشرة الساكنة هي المشهد
    // المستقرّ كاملاً، فلا قطعة تُحمَّل ولا مؤقّت يعمل بلا أثر يُرى.
    if (!shown || !stage.current || prefersReducedMotion()) return;
    let stop: (() => void) | undefined;
    let alive = true;
    void (async () => {
      const { playPhoneDemo } = await import("@/lib/phoneDemo");
      if (!alive || !stage.current) return;
      stop = playPhoneDemo(stage.current);
    })();
    return () => {
      alive = false;
      stop?.();
    };
  }, [shown]);

  return (
    // ⚠️ الطفو والإمالة **لا يجتمعان على عنصر واحد**: كلاهما يكتب `transform`،
    // وحركة CSS تغلب النمط المضمَّن في التتالي — فكانت `useTilt` تكتب ميلها
    // ثم تدهسه `anim-float` في كل إطار، أي أن الإمالة لم تكن تعمل إطلاقاً.
    <div ref={seen} className="anim-float mx-auto w-[270px]">
      <Link
        ref={tilt}
        to="/demo"
        aria-label="افتح المنيو التجريبي"
        className="tilt relative block w-full select-none"
      >
        <div
          ref={stage}
          className="ph relative rounded-[2.6rem] p-2.5"
          style={vars}
        >
          {/* أزرار الجانب — العقدتان الوحيدتان المضافتان؛ الباقي عناصر زائفة
              كي لا تنمو الحزمة التي يحملها زبون المنيو. */}
          <span aria-hidden="true" className="ph-btn ph-btn-vol" />
          <span aria-hidden="true" className="ph-btn ph-btn-pwr" />
          {/* ⚠️ `overflow-hidden` هنا **يُسطّح** سياق 3D، فلا شيء داخل الشاشة
              يستطيع أن يأخذ عمقاً. لذلك كل طبقات العمق على مستوى `.ph` لا هنا. */}
          <div
            className="ph-glass relative overflow-hidden rounded-[2rem] pb-4"
            style={{ background: "var(--m-bg)" }}
          >
            {/* شريط الحالة بارتفاع ٥٤ نقطة (٣٤px)، والساعة والرموز **بجانبي**
                الجزيرة لا تحتها — كما في الجهاز الحقيقي. */}
            <div
              className="ph-status relative z-40 flex items-center justify-between px-5 text-[10px] font-bold"
              style={{ color: "var(--m-text)" }}
            >
              <span dir="ltr" className="tabular-nums">{clock}</span>
              <StatusGlyphs />
            </div>
            {/* الجزيرة: سوداء صرفة ٨٠×٢٣ على بعد ٧ — كانت بنّية ٦٤×١٦ تعلو
                تدرّج الترويسة فتُقرأ لطخة فاتحة فوق اسم المطعم. */}
            <span aria-hidden="true" className="ph-island" />

            {/* ما يمرّ: الترويسة والقائمة معاً — التمرير يزيح هذه الكتلة. */}
            <div className="ph-scroll">
              <div
                className="flex flex-col items-center gap-1.5 px-4 pb-4 pt-3 text-center"
                style={{ background: "linear-gradient(to bottom, var(--m-bg-2), transparent)" }}
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                  style={{ background: "color-mix(in srgb, var(--m-accent) 15%, transparent)" }}
                >
                  🍽️
                </span>
                <p
                  className="font-display text-sm font-black"
                  style={{ color: "var(--m-text)" }}
                >
                  مطعم الديوان
                </p>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                  style={{
                    background: "color-mix(in srgb, var(--m-accent) 15%, transparent)",
                    color: "var(--m-accent)",
                  }}
                >
                  طاولة ٥ · منيو رقمي
                </span>
              </div>

              <div className="flex gap-1.5 overflow-hidden px-3 pb-3">
                {["المشاوي", "المقبلات", "الحلويات", "المشروبات"].map((c, i) => (
                  <span
                    key={c}
                    data-chip={i}
                    className={cn(
                      "ph-chip shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold",
                      // الشريحة الأولى فعّالة ابتداءً، والمحرّك ينقل الحالة إلى
                      // الثانية. الوسم هنا لا في CSS: `:first-of-type` يسبق
                      // `.is-on` في ترتيب المستند فلا يستطيع محدِّد شقيق إلغاءه.
                      i === 0 && "is-on"
                    )}
                    style={{ color: "var(--m-muted)", background: "var(--m-surface)" }}
                  >
                    {c}
                  </span>
                ))}
              </div>

              <div className="relative px-3">
                <div data-list="0" className="ph-list flex flex-col gap-2">
                  {DEMO_DISHES.map((d, i) => (
                    <DishRow key={d.name} d={d} i={i} />
                  ))}
                </div>
                <div
                  data-list="1"
                  className="ph-list ph-list-off absolute inset-x-3 top-0 flex flex-col gap-2"
                >
                  {DEMO_MEZZE.map((d, i) => (
                    <DishRow key={d.name} d={d} i={i} />
                  ))}
                </div>
              </div>
            </div>

            {/* لوح الطبق — يصعد بـease-out ويهبط بـease-in أسرع. */}
            <div
              data-sheet
              className="ph-sheet absolute inset-x-0 bottom-0 z-30 rounded-t-2xl border-t p-3.5"
              style={{ background: "var(--m-bg-2)", borderColor: "var(--m-border)" }}
            >
              <span
                aria-hidden="true"
                className="mx-auto mb-2.5 block h-1 w-9 rounded-full"
                style={{ background: "var(--m-border)" }}
              />
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                  style={{ background: "var(--m-surface)" }}
                >
                  🧆
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-black" style={{ color: "var(--m-text)" }}>
                    كبّة مقلية بالصنوبر
                  </p>
                  <p className="text-[9px]" style={{ color: "var(--m-muted)" }}>
                    ٢٩٠ سعرة · تحتوي مكسّرات
                  </p>
                </div>
              </div>
              <div
                data-add
                className="ph-add mt-3 flex items-center justify-between rounded-xl px-3 py-2 text-[11px] font-black"
                style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
              >
                <span>أضِف للطلب</span>
                <span dir="ltr">٣٤ ر.س</span>
              </div>
            </div>

            {/* شريط السلة — الحالة التي يستقرّ عليها المشهد. */}
            <div
              data-cart
              className="ph-cart absolute inset-x-2 bottom-2 z-40 flex items-center justify-between rounded-xl px-3 py-2 text-[10px] font-black shadow-lg"
              style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
            >
              <span>عرض الطلب · صنف واحد</span>
              <span dir="ltr">٣٤ ر.س</span>
            </div>

            {/* شريط المنزل — ١٤٠×٥ نقطة على بعد ٨. */}
            <span aria-hidden="true" className="ph-home" />
          </div>

          {/* انعكاس الزجاج — يمرّ مرّة مع بداية المشهد. */}
          <span aria-hidden="true" className="ph-glare pointer-events-none absolute inset-0 rounded-[2.6rem]" />

          {/* الإصبع — لا يستقبل مؤشّراً ولا يُقرأ. */}
          <span aria-hidden="true" data-finger className="ph-finger pointer-events-none absolute" />
        </div>

        <span className="ph-badge absolute -left-5 top-28 rounded-2xl border border-line-gold bg-panel px-3 py-2 text-xs font-bold shadow-xl">
          ⭐ تقييم قوقل
        </span>
        <span className="ph-badge absolute -right-4 top-44 rounded-2xl border border-line-gold bg-panel px-3 py-2 text-xs font-bold text-gold shadow-xl">
          اضغط للتجربة ←
        </span>
      </Link>
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

/** إشارات الثقة الثلاث في البطل — ما يطمئن التاجر قبل أن يقرأ ميزة واحدة. */
const TRUST: { icon: IconName; label: string }[] = [
  { icon: "sparkle", label: "تجهيز في دقائق" },
  { icon: "card", label: "مدى وApple Pay" },
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
                "mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl py-2.5 text-sm font-bold transition-colors",
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
                "mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl py-2.5 text-center text-sm font-bold transition-colors",
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
      {/* شريط تقدّم القراءة — مربوط بتمرير الجذر، بلا مستمع تمرير. */}
      <span aria-hidden="true" className="scroll-rail" />

      <Navbar />

      {/* البطل */}
      <section className="glow-bg relative overflow-hidden">
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
            <h1 className="font-display text-4xl font-black leading-[1.2] text-ink sm:text-5xl">
              <Words text="منيو مطعمك…" />
              <br />
              <Words text="تجربة رقمية فاخرة" className="text-gold-grad" />
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

/**
 * معاينة الهاتف الحيّة في صفحة الهبوط — منيو **مصغَّر يعمل فعلاً** بالطابع
 * المختار: زخرفته وخطّه وترويسته وإيقاع مسافاته.
 *
 * ═══ لماذا نسخة تسويقية لا `MenuPage` ═══
 *
 * المعاينة تركب بيانات ثابتة بلا شبكة ولا سلّة ولا تتبّع، فتُرسَم فوراً وسط
 * صفحة الهبوط. واستدعاء الصفحة الحقيقية هنا كان سيجرّ معه استعلامات المطعم
 * ومنطق الطلب إلى حزمة لا يحتاجها زائرٌ لم يسجّل بعد.
 *
 * ⚠️ **تقرأ نفس `getTheme`/`skinClass`/`patternImage`** التي يقرؤها المنيو —
 * فما يراه التاجر هنا هو ما سيراه زبونه، لا رسماً مشابهاً.
 */
import { useEffect, useRef, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { prefersReducedMotion, useReveal, useTilt } from "@/lib/reveal";
import { cn } from "@/lib/utils";
import { skinClass, type MenuTheme } from "@/lib/themes";
import { PATTERN_SIZE, patternImage } from "@/lib/patterns";
import { loadThemeFont } from "@/lib/fonts";

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

type DemoDish = (typeof DEMO_DISHES)[number];

/* ── الشاشة تلبس الطابع ─────────────────────────────────────────────── */

/**
 * ⚠️ **لا قيمة لون واحدة تُكتب في هذا الملف.**
 *
 * كل ما تحت هذا السطر يقرأ `theme.vars` حرفياً (`--m-bg` · `--m-accent` …).
 * وهذا ليس أناقة بل حفظُ ثابت §18 بالبناء: ثمانية مطاعم حقيقية تعمل على هذه
 * القيم، ولونٌ يُكتب هنا «ليطابق» طابعاً هو نسخة ثانية تنحرف عنه بصمت.
 */
const IMG_SHAPE = { rounded: "rounded-lg", square: "rounded-none", circle: "rounded-full" };

/** ثلاث صيغ للسعر — الطابع يغيّر كيف يُقدَّم الرقم لا لونه فقط. */
function Price({ theme, value }: { theme: MenuTheme; value: number }) {
  const v = theme.vars;
  const num = (
    <span className="shrink-0 text-[10px] font-black" style={{ color: v["--m-accent"] }} dir="ltr">
      {value} ر.س
    </span>
  );

  if (theme.design.priceStyle === "badge")
    return (
      <span
        className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black"
        style={{
          background: `color-mix(in srgb, ${v["--m-accent"]} 16%, transparent)`,
          color: v["--m-accent"],
        }}
        dir="ltr"
      >
        {value} ر.س
      </span>
    );

  if (theme.design.priceStyle === "leader")
    return (
      <span className="flex min-w-0 flex-1 items-end gap-1.5">
        <span
          aria-hidden="true"
          className="mb-1 h-0 flex-1 border-b border-dotted"
          style={{ borderColor: v["--m-border"] }}
        />
        {num}
      </span>
    );

  return num;
}

/**
 * بطاقة الطبق بثلاثة تخطيطات.
 *
 * هذا **جوهر العرض**: زائر يرى نفس الأطباق تتحوّل من شبكة إلى قائمة إلى عرض
 * يفهم في ثانية أن الطابع ليس لوناً — وهي الجملة التي كتبناها في §18 ولم
 * تظهر على الصفحة قطّ.
 */
function DishCard({ theme, d, i }: { theme: MenuTheme; d: DemoDish; i: number }) {
  const v = theme.vars;
  const { layout, imageShape, divider } = theme.design;
  const img = IMG_SHAPE[imageShape];
  const name = { color: v["--m-text"], fontFamily: v["--m-font"] } as CSSProperties;
  const seq = { "--i": i } as CSSProperties;

  if (layout === "showcase")
    return (
      <div
        className="ph-row m-surface overflow-hidden border"
        style={{
          background: v["--m-surface"],
          borderColor: v["--m-border"],
          borderRadius: v["--m-radius"],
          ...seq,
        }}
      >
        <div
          className="flex h-14 items-center justify-center text-3xl"
          style={{ background: v["--m-bg-2"] }}
        >
          {d.emoji}
        </div>
        <div className="flex items-center gap-2 p-2">
          <p className="min-w-0 flex-1 truncate text-[11px] font-bold" style={name}>
            {d.name}
          </p>
          <Price theme={theme} value={d.price} />
        </div>
      </div>
    );

  if (layout === "grid")
    return (
      <div
        className="ph-row m-surface border p-1.5"
        style={{
          background: v["--m-surface"],
          borderColor: v["--m-border"],
          borderRadius: v["--m-radius"],
          ...seq,
        }}
      >
        <div
          className={cn("mb-1.5 flex h-10 items-center justify-center text-xl", img)}
          style={{ background: v["--m-bg-2"] }}
        >
          {d.emoji}
        </div>
        <p className="truncate text-[10px] font-bold" style={name}>
          {d.name}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <Price theme={theme} value={d.price} />
        </div>
      </div>
    );

  /* قائمة رأسية. الفاصل `none` يعني بطاقةً بسطح، وغيره يعني صفّاً بخيط تحته —
     وهذا ما يفرّق منيو «حصري فاخر» عن «مينيمال» وكلاهما قائمة. */
  const carded = divider === "none";
  return (
    <div
      className={cn("ph-row flex items-center gap-2.5 p-2.5", carded ? "m-surface" : "m-row border-b")}
      style={{
        background: carded ? v["--m-surface"] : undefined,
        borderColor: v["--m-border"],
        borderBottomStyle: divider === "dots" ? "dotted" : "solid",
        borderRadius: carded ? v["--m-radius"] : undefined,
        ...seq,
      }}
    >
      <span
        className={cn("flex h-9 w-9 shrink-0 items-center justify-center text-lg", img)}
        style={{ background: v["--m-bg-2"] }}
      >
        {d.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-bold" style={name}>
          {d.name}
        </p>
        <p className="text-[9px]" style={{ color: v["--m-muted"] }}>
          {d.cal} سعرة حرارية
        </p>
      </div>
      <Price theme={theme} value={d.price} />
    </div>
  );
}

/**
 * قائمة الأطباق داخل الشاشة.
 *
 * ⚠️ الجذر يحمل `data-list` وأبناؤه المباشرون هي البطاقات — لأن
 * `lib/phoneDemo.ts` يصوّب الإصبع إلى `listB.children[1]`. أي غلاف إضافي هنا
 * يجعل الإصبع يضغط الهواء **بلا أن يفشل شيء ظاهر**.
 *
 * و«عرض» يُقصّ إلى ثلاثة: بطاقاته بارتفاع مضاعف، وستّ منها تخرج عن الشاشة
 * فيبدو التخطيط مكسوراً لا فسيحاً.
 */
function DishBoard({
  theme,
  dishes,
  index,
  off,
}: {
  theme: MenuTheme;
  dishes: readonly DemoDish[];
  index: 0 | 1;
  off?: boolean;
}) {
  const { layout } = theme.design;
  const items = layout === "showcase" ? dishes.slice(0, 3) : dishes;
  return (
    <div
      data-list={index}
      className={cn(
        "ph-list",
        layout === "grid" ? "grid grid-cols-2 gap-1.5" : "flex flex-col gap-2",
        off && "ph-list-off absolute inset-x-3 top-0"
      )}
    >
      {items.map((d, i) => (
        <DishCard key={d.name} theme={theme} d={d} i={i} />
      ))}
    </div>
  );
}

/**
 * ترويسة المنيو بأشكالها الأربعة.
 *
 * المنطق **مقتبس** من `ThemePreview` لا مستورد منها: تلك مربّع ٩٦px في مُنتقي
 * اللوحة، وهذه شاشة أيفون كاملة. توحيدهما كان سيفرض على الاثنتين مقاساً واحداً
 * يخذلهما معاً.
 */
function PhoneHeader({ theme }: { theme: MenuTheme }) {
  const v = theme.vars;
  const { header } = theme.design;
  const accent = v["--m-accent"];

  return (
    <div
      className="relative flex flex-col items-center gap-1.5 px-4 pb-5 pt-3 text-center"
      style={{
        background: `linear-gradient(to bottom, ${v["--m-bg-2"]}, transparent)`,
        borderRadius: header === "soft" ? "0 0 1.5rem 1.5rem" : undefined,
      }}
    >
      {/* إطار مزدوج — الحدّ والمخطّط بإزاحة، فيصير خطّين لا واحداً. */}
      {header === "frame" && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-4 inset-y-2"
          style={{
            border: `1px solid ${accent}`,
            outline: `1px solid ${accent}`,
            outlineOffset: "3px",
            opacity: 0.5,
          }}
        />
      )}

      <span
        className="flex h-12 w-12 items-center justify-center text-2xl"
        style={{
          background: `color-mix(in srgb, ${accent} 15%, transparent)`,
          borderRadius: header === "frame" ? "2px" : header === "arch" ? "9999px" : "1rem",
        }}
      >
        🍽️
      </span>
      <p
        className="text-sm font-black"
        style={{ color: v["--m-text"], fontFamily: v["--m-display"] || v["--m-font"] }}
      >
        مطعم الديوان
      </p>
      <span
        className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
        style={{ background: `color-mix(in srgb, ${accent} 15%, transparent)`, color: accent }}
      >
        طاولة ٥ · منيو رقمي
      </span>

      {/* شريط سدو محكم النسج على الحافة السفلى (§7). */}
      {header === "band" && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-2.5"
          style={{
            backgroundImage: patternImage("sadu", accent, 1),
            backgroundSize: "20px 20px",
            borderTop: `1px solid ${accent}`,
            borderBottom: `1px solid ${accent}`,
          }}
        />
      )}
      {header === "arch" && (
        <svg
          viewBox="0 0 100 12"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-4 w-full"
        >
          <path d="M0 8 Q25 8 38 2 Q50 -3 62 2 Q75 8 100 8 L100 12 L0 12 Z" style={{ fill: v["--m-bg"] }} />
          <path
            d="M0 8 Q25 8 38 2 Q50 -3 62 2 Q75 8 100 8"
            fill="none"
            style={{ stroke: accent, strokeWidth: 1 }}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
    </div>
  );
}

/**
 * الهاتف البطل — **منتج يُستعمَل أمام الزائر** لا صورة له.
 *
 * الشاشة تُلوَّن بمتغيّرات `--m-*` الحقيقية للطابع المعروض، فما يراه الزائر هنا
 * هو جلد المنتج نفسه: من ضغط «افتح هذا الطابع» بعدها يجد الشيء ذاته لا غيره.
 *
 * القشرة هنا **ساكنة وكاملة**: تُقرأ صحيحة بلا جافاسكربت إطلاقاً. أما محرّك
 * التمثيل (`lib/phoneDemo.ts`) فيُستورد **ديناميكياً** عند ظهور البطل — لأن
 * `Landing` في الحزمة الرئيسية مع `MenuPage`، فأي بايت يُضاف هنا يحمّله زبون
 * المطعم وهو يمسح كود QR.
 *
 * ⚠️ **`entranceClass` لا يُستعمَل هنا** رغم أنه أحد محاور الطابع: دخول البطاقات
 * مربوط بـ`animation-timeline: view()` أي بتمرير **الصفحة**، بينما داخل الهاتف
 * محرّكُ تمثيلٍ يكتب `transform`/`opacity` على الصفوف نفسها. اجتماعهما يعني
 * حركتين تتنازعان على خاصّية واحدة. المحاور الباقية كلّها ظاهرة.
 */
export function PhonePreview({
  theme,
  animate = false,
  width = "w-[270px]",
}: {
  theme: MenuTheme;
  /** يشغّل محرّك التمثيل (إصبع، تمرير، لوح، سلّة). البطل وحده. */
  animate?: boolean;
  width?: string;
}) {
  const tilt = useTilt<HTMLAnchorElement>(14);
  const stage = useRef<HTMLDivElement>(null);
  const turn = useRef<HTMLDivElement>(null);
  const { ref: seen, shown } = useReveal<HTMLDivElement>("-20%");
  const v = theme.vars;
  const { pattern, patternOpacity } = theme.design;
  const clock = new Date().toLocaleTimeString("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // خطّ الطابع عند اختياره لا مقدّماً: تحميل خطوط الطوابع التسعة عشر على الهبوط
  // ينقض كامل مكسب `lib/fonts.ts` (§18) — وأغلبها لن يُرى أصلاً.
  useEffect(() => {
    void loadThemeFont(v["--m-font"]);
    void loadThemeFont(v["--m-display"]);
  }, [v]);

  /**
   * تبديل الطابع **حركةٌ مادّية**: الجهاز يُدار قليلاً فيظهر جلده الجديد.
   *
   * على غلاف مستقلّ (`.ph-turn`) لا على `.ph` ولا على `.tilt`: الأولى تحمل حركة
   * الهبوط، والثانية يكتب عليها `useTilt` نمطاً مضمَّناً تغلبه حركة CSS —
   * وهو العطل نفسه الذي عطّل الإمالة سابقاً. وإعادة التدفّق سطرٌ مقصود: بدونه
   * لا تُعاد الحركة من بدايتها عند تبديل ثانٍ.
   */
  const first = useRef(true);
  useEffect(() => {
    const el = turn.current;
    if (first.current) {
      first.current = false;
      return;
    }
    if (!el) return;

    /**
     * ⚠️ **إعادة الشاشة إلى رأس المنيو مع كل طابع.**
     *
     * محرّك التمثيل يمرّر القائمة ١٠٤px ويتركها هناك، وهو يعمل **مرّة واحدة**.
     * فبعد أوّل تمثيل كانت ترويسة المنيو تبقى مدفونة تحت شريط الحالة إلى الأبد —
     * أي أن **شكل الترويسة، وهو أحد المحاور الأربعة التي يبيعها هذا القسم، لا
     * يُرى في ثمانية عشر طابعاً من تسعة عشر**. كُشف بالنظر إلى اللقطة لا بقراءة
     * الشيفرة: المشهد يعمل، والذي يُعرض ناقص.
     */
    const sc = stage.current?.querySelector<HTMLElement>(".ph-scroll");
    if (sc) sc.style.transform = "";

    if (prefersReducedMotion()) return;
    el.classList.remove("is-turn");
    void el.offsetWidth;
    el.classList.add("is-turn");
    const t = window.setTimeout(() => el.classList.remove("is-turn"), 420);
    return () => window.clearTimeout(t);
  }, [theme.id]);

  useEffect(() => {
    // من طلب تقليل الحركة لا يُنزّل المحرّك أصلاً: القشرة الساكنة هي المشهد
    // المستقرّ كاملاً، فلا قطعة تُحمَّل ولا مؤقّت يعمل بلا أثر يُرى.
    if (!animate || !shown || !stage.current || prefersReducedMotion()) return;
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
  }, [animate, shown]);

  return (
    // ⚠️ الطفو والإمالة **لا يجتمعان على عنصر واحد**: كلاهما يكتب `transform`،
    // وحركة CSS تغلب النمط المضمَّن في التتالي — فكانت `useTilt` تكتب ميلها
    // ثم تدهسه `anim-float` في كل إطار، أي أن الإمالة لم تكن تعمل إطلاقاً.
    <div ref={seen} className={cn("anim-float mx-auto", width)}>
      <Link
        ref={tilt}
        to={`/demo?theme=${theme.id}`}
        aria-label={`افتح المنيو التجريبي بطابع ${theme.name}`}
        className="tilt relative block w-full select-none"
      >
        <div ref={turn} className="ph-turn">
        <div
          ref={stage}
          className="ph relative rounded-[2.6rem] p-2.5"
          style={v as CSSProperties}
        >
          {/* أزرار الجانب — العقدتان الوحيدتان المضافتان؛ الباقي عناصر زائفة
              كي لا تنمو الحزمة التي يحملها زبون المنيو. */}
          <span aria-hidden="true" className="ph-btn ph-btn-vol" />
          <span aria-hidden="true" className="ph-btn ph-btn-pwr" />
          {/* ⚠️ `overflow-hidden` هنا **يُسطّح** سياق 3D، فلا شيء داخل الشاشة
              يستطيع أن يأخذ عمقاً. لذلك كل طبقات العمق على مستوى `.ph` لا هنا.
              وأصناف الخامة (`skinClass`) هنا كي ترثها البطاقات في الداخل. */}
          <div
            className={cn(
              "ph-glass relative overflow-hidden rounded-[2rem] pb-4",
              skinClass(theme.design)
            )}
            style={{
              backgroundColor: v["--m-bg"],
              backgroundImage: patternImage(pattern, v["--m-accent"], patternOpacity),
              backgroundSize: PATTERN_SIZE[pattern],
              fontFamily: v["--m-font"],
            }}
          >
            {/* شريط الحالة بارتفاع ٥٤ نقطة (٣٤px)، والساعة والرموز **بجانبي**
                الجزيرة لا تحتها — كما في الجهاز الحقيقي. */}
            <div
              className="ph-status relative z-40 flex items-center justify-between px-5 text-[10px] font-bold"
              style={{ color: v["--m-text"] }}
            >
              <span dir="ltr" className="tabular-nums">{clock}</span>
              <StatusGlyphs />
            </div>
            {/* الجزيرة: سوداء صرفة ٨٠×٢٣ على بعد ٧ — كانت بنّية ٦٤×١٦ تعلو
                تدرّج الترويسة فتُقرأ لطخة فاتحة فوق اسم المطعم. */}
            <span aria-hidden="true" className="ph-island" />

            {/* ما يمرّ: الترويسة والقائمة معاً — التمرير يزيح هذه الكتلة. */}
            <div className="ph-scroll">
              <PhoneHeader theme={theme} />

              <div className="flex gap-1.5 overflow-hidden px-3 pb-3 pt-3">
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
                    style={{ color: v["--m-muted"], background: v["--m-surface"] }}
                  >
                    {c}
                  </span>
                ))}
              </div>

              <div className="relative px-3">
                <DishBoard theme={theme} dishes={DEMO_DISHES} index={0} />
                <DishBoard theme={theme} dishes={DEMO_MEZZE} index={1} off />
              </div>
            </div>

            {/* لوح الطبق — يصعد بـease-out ويهبط بـease-in أسرع. */}
            <div
              data-sheet
              className="ph-sheet absolute inset-x-0 bottom-0 z-30 rounded-t-2xl border-t p-3.5"
              style={{ background: v["--m-bg-2"], borderColor: v["--m-border"] }}
            >
              <span
                aria-hidden="true"
                className="mx-auto mb-2.5 block h-1 w-9 rounded-full"
                style={{ background: v["--m-border"] }}
              />
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                  style={{ background: v["--m-surface"] }}
                >
                  🧆
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-black" style={{ color: v["--m-text"] }}>
                    كبّة مقلية بالصنوبر
                  </p>
                  <p className="text-[9px]" style={{ color: v["--m-muted"] }}>
                    ٢٩٠ سعرة · تحتوي مكسّرات
                  </p>
                </div>
              </div>
              {/* `m-shine` هو ما تعبره لمعة الطابع (`sheen`) — على سطح التمييز
                  وحده، فلا تمرّ اللمعة على نصّ يُقرأ. */}
              <div
                data-add
                className="ph-add m-shine mt-3 flex items-center justify-between rounded-xl px-3 py-2 text-[11px] font-black"
                style={{ background: v["--m-accent"], color: v["--m-on-accent"] }}
              >
                <span>أضِف للطلب</span>
                <span dir="ltr">٣٤ ر.س</span>
              </div>
            </div>

            {/* شريط السلة — الحالة التي يستقرّ عليها المشهد. */}
            <div
              data-cart
              className="ph-cart m-shine absolute inset-x-2 bottom-2 z-40 flex items-center justify-between rounded-xl px-3 py-2 text-[10px] font-black shadow-lg"
              style={{ background: v["--m-accent"], color: v["--m-on-accent"] }}
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
        </div>

        {/* ⚠️ **الشارتان الطافيتان حُذفتا.** كانتا تعلوان الشاشة فتحجبان صفّاً
            وسعره — وذلك مقبولٌ حين يكون الهاتف صورةً تسويقية، ومرفوضٌ بعد أن
            صار **معروضاً** يُفترض أن يُقرأ كاملاً. ووعداهما موجودان أصلاً:
            «اضغط للتجربة» صار زرّاً صريحاً تحت الشريط، وتقييم قوقل ميزة في
            قسم المزايا. */}
      </Link>
    </div>
  );
}

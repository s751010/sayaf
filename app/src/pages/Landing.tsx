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
import { ALL_THEMES, getTheme, skinClass, type MenuTheme } from "@/lib/themes";
import { PATTERN_SIZE, patternImage } from "@/lib/patterns";
import { loadThemeFont } from "@/lib/fonts";

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
function PhonePreview({
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
/**
 * ⚠️ `money` لا `card` لشريحة الدفع: رمز `card` في مجموعتنا هو **الستاند
 * المثلّث** الذي يطبعه التاجر (موثَّق فوق تعريفه في `lib/icons.tsx`) — لا بطاقة
 * بنكية. وبقياس ١٤px بجانب كلمة «مدى» كان يُقرأ **مثلّث تحذير**، أي أن الشريحة
 * التي وُضعت لتطمئن كانت تُنذر.
 */
const TRUST: { icon: IconName; label: string }[] = [
  { icon: "sparkle", label: "تجهيز في دقائق" },
  { icon: "money", label: "مدى وApple Pay" },
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

/** أرقام من المنتج نفسه لا ادّعاءات سوق — كلٌّ منها يقابله شيء يراه الزائر. */
const STATS: { to: number; suffix?: string; label: string }[] = [
  { to: 19, label: "طابعاً كاملاً للمنيو" },
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

      <ThemeStage />

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

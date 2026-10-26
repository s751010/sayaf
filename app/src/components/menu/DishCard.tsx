/**
 * بطاقة الطبق بثلاثة تخطيطات — هذا ما يجعل الفرق بين الطوابع **يُرى** لا يُقرأ.
 *
 * - `grid`     الشبكة الأصلية (عمودان/ثلاثة).
 * - `list`     صف بعرض الشاشة مع خط نقطي يقود إلى السعر، كمنيوهات المطاعم
 *              الراقية. بلا صورة ⇒ بلا مربّع فارغ: منيو التاجر الذي لم يرفع
 *              صوراً يبدو أنيقاً لا ناقصاً.
 * - `showcase` عمود واحد بصورة كبيرة — للكافيهات التي تبيع بالصورة.
 * - `deck`     البطاقة نفسها بصورتها الكبيرة، في صفٍّ يُسحب أفقياً لكل قسم
 *              (العرض والتمركز في `menu-skins.css`).
 *
 * والأصناف `m-card` · `m-img` · `m-name` · `m-desc` · `m-price` **خطاطيف
 * لا أنماط**: لا تفعل شيئاً إلا في طابعٍ يقرؤها (`m-skin-*`).
 *
 * رموز مسببات الحساسية والسعرات موجودة في التخطيطات الثلاثة: ميزة قائمة لا
 * يجوز أن تختفي لأن التاجر بدّل شكل منيوه.
 */
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import { displayAllergens } from "@/lib/allergens";
import type { ImageShape, MenuDesign, PriceStyle } from "@/lib/themes";
import type { Dish } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";
import { Icon } from "@/lib/icons";
import { DishArtwork } from "./DishArtwork";
// ⚠️ يُستورد لا يُكتب: كان معرَّفاً هنا نسخةً ثانية من ثابت `chrome.tsx` نفسه.
import { nameFont } from "./chrome";

/**
 * قوس نافذة روشان: نصف دائرةٍ فوق مستطيل. نصف القطر الأفقي نصف العرض، والرأسي
 * ٤٠٪ من الارتفاع — وفي صورةٍ ٤:٥ يتساويان فيخرج القوس دائرياً لا بيضاوياً.
 */
const ARCH = "50% 50% calc(var(--m-radius) * .5) calc(var(--m-radius) * .5) / 40% 40% calc(var(--m-radius) * .5) calc(var(--m-radius) * .5)";

/** نصف قطر صورة الطبق حسب شكل الطابع. */
function imageRadius(shape: ImageShape): string {
  if (shape === "square") return "0";
  if (shape === "circle") return "9999px";
  if (shape === "arch") return ARCH;
  return "var(--m-radius)";
}

/** نسبة صورة الشبكة: الدائرة مربّعة، والقوس نافذةٌ أطول، والباقي ٤:٣. */
function gridAspect(shape: ImageShape): string {
  if (shape === "circle") return "aspect-square";
  if (shape === "arch") return "aspect-[4/5]";
  return "aspect-[4/3]";
}

function name(d: Dish, en: boolean): string {
  return en && d.name_en ? d.name_en : d.name;
}

/**
 * الاسم ونجمة «المميّز» — **النجمة مربوطةٌ بآخر كلمة**.
 *
 * كانت رمزاً مضمَّناً بعد النصّ، فإذا امتلأ السطر انكسرت وحدها إلى سطرٍ ثانٍ
 * («ستيك واقيو مشوي» ثم ☆ وحدها تحته — ظهر في «فاخر» على 390). فآخر كلمةٍ
 * والنجمة في `nowrap` واحد: إن انكسرا انكسرا معاً.
 */
function NameText({ dish, en, star, className }: { dish: Dish; en: boolean; star: boolean; className: string }) {
  const text = name(dish, en);
  if (!star) return <>{text}</>;
  const cut = text.trimEnd().lastIndexOf(" ");
  const head = cut > 0 ? text.slice(0, cut + 1) : "";
  const last = cut > 0 ? text.slice(cut + 1) : text;
  return (
    <>
      {head}
      <span className="whitespace-nowrap">
        {last}
        <Icon name="star" size={12} className={className} />
      </span>
    </>
  );
}
function desc(d: Dish, en: boolean): string | null {
  return en && d.description_en ? d.description_en : d.description;
}

/**
 * السعر — نصّاً أو شارة.
 *
 * `leader` ليس شكلاً للسعر نفسه بل للمسافة قبله (الخطّ المنقّط)، فيُرسم كـ
 * `plain` هنا ويتكفّل تخطيط القائمة بالخطّ.
 */
function Price({ dish, big, style, en }: { dish: Dish; big?: boolean; style: PriceStyle; en: boolean }) {
  // «0 ر.س» يقرؤه الزبون «مجاناً» — صنفٌ بلا سعر (حسب الوزن، أو يُسأل عنه) بلا سعر معروض.
  if (!((dish.price ?? 0) > 0)) return null;
  const text = (
    <>
      {formatPrice(dish.price ?? 0)} <span className="text-[10px] font-bold">{en ? "SAR" : "ر.س"}</span>
    </>
  );
  if (style === "badge") {
    return (
      <span
        className={cn(
          // `m-shine` سطحُ لمعة: يعمل فقط في الطوابع التي تحمل `sheen`،
          // ولا يفعل شيئاً في غيرها ولا مع تقليل الحركة.
          "m-price m-shine whitespace-nowrap rounded-full px-2.5 py-0.5 font-black",
          big ? "text-sm" : "text-xs"
        )}
        style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
        dir="ltr"
      >
        {text}
      </span>
    );
  }
  return (
    <span
      className={cn("m-price whitespace-nowrap font-black", big ? "text-base" : "text-sm")}
      // `--m-accent-ink` لا التمييز نفسه: لون علامةٍ أصفر على طابعٍ أبيض كان
      // يكتب السعر بتباين 2.2:1 (انظر `readableOn`).
      style={{ color: "var(--m-price, var(--m-accent-ink, var(--m-accent)))" }}
      dir="ltr"
    >
      {text}
    </span>
  );
}

function chip(a: { key: string; label: string; emoji: string }, hidden = false) {
  return (
    <span
      key={a.key}
      title={a.label}
      className={cn("shrink-0 rounded-md px-1 text-[11px]", hidden && "invisible")}
      // `order`: ما لا يتّسع يُدفع خلف الشارة والسعرات (انظر `MetaRow`).
      style={{ background: "var(--m-bg-2)", order: hidden ? 3 : 0 }}
    >
      {a.emoji}
    </span>
  );
}

/** رموز الحساسية **ملتفّة** — للقائمة الرأسية حيث لا ارتفاع ثابت. */
function Allergens({ dish, en }: { dish: Dish; en: boolean }) {
  const icons = displayAllergens(dish.allergens, en);
  if (!icons.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1" aria-label={en ? "Allergens" : "مسببات الحساسية"}>
      {icons.map((a) => chip(a))}
    </div>
  );
}

function Calories({ dish, en, className, style }: { dish: Dish; en: boolean; className?: string; style?: CSSProperties }) {
  if (dish.calories == null) return null;
  return (
    // `inline-flex` لا نصٌّ بجانب SVG: الرمز المضمَّن يجلس على خطّ القاعدة فيعلو
    // سطره، وسطر التفاصيل بارتفاعٍ ثابت (`h-4`) فكان يقصّ رأس اللهب أثراً فوق الرقم.
    <span
      data-cal=""
      className={cn("inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs", className)}
      style={{ color: "var(--m-muted)", ...style }}
    >
      <Icon name="flame" size={12} /> {dish.calories} {en ? "cal" : "سعرة"}
    </span>
  );
}

/**
 * سطر التفاصيل الثانوية — **بارتفاع ثابت لا يتبع محتواه**.
 *
 * كان مع السعر في صفٍّ واحد، فبطاقة تحمل حساسية وسعرات معاً تفيض عن عرض
 * البطاقة على الجوال فيلتفّ نصّ السعرات سطرين — وهذا وحده كان يجعل بطاقات
 * الشبكة تختلف ٢٠ بكسل بلا سبب ظاهر للتاجر. `h-4` مع `overflow-hidden`
 * و`flex-nowrap` تجعل الارتفاع ثابتاً مهما كان المحتوى.
 *
 * ⚠️ **ولا يُقصّ رمز حساسية بصمت.** كانت الرموز تلتفّ داخل هذا الارتفاع الثابت
 * فيقصّ `overflow-hidden` ما التفّ — وعلى ٣٢٠ بالعربي كان الالتفاف يرفع الكتلة
 * فيقصّ **السطرين معاً**: صفر رمز من ثلاثة (روبيان: قشريات · سمسم · جلوتين)
 * في ستّة طوابع (قيس ٢٠٢٦/١٠/٢٥). وحساسيةٌ مخفيّة بلا علامة خطرُ سلامة لا عيب
 * شكل. فالآن سطرٌ واحد يُقاس: ما يتّسع من الرموز، ثم شارة «+N» تسمّي الباقي في
 * `title` و`aria-label`، ثم السعرات — والنافذة تعرضها كلّها.
 *
 * - كل الرموز تبقى في الشجرة: ما لا يتّسع `invisible` ومدفوعٌ بـ`order` إلى
 *   آخر الصفّ المقصوص، فعرضه يبقى مقيساً حين يتّسع المكان ثانيةً.
 * - `w-0 min-w-full` لا `w-full`: صفٌّ لا يلتفّ يرفع **العرض الأدنى** لعمود
 *   الشبكة بمجموع رموزه، فكانت بطاقة بستّ حساسيات تتّسع من ١٣٤px إلى ٢٤٩px
 *   وتختلّ الشبكة. العرض الصفري يُسقط إسهامه، والحدّ الأدنى ١٠٠٪ يردّ عرضه.
 * - **بلا `opacity`**: كان السطر كلّه `opacity-80` فوق `--m-muted`، فنزلت السعرات
 *   تحت AA في خمسة طوابع (أسوؤها «تراثي» 3.52). الخافت محسوبٌ ≥ ٤٫٥ أصلاً
 *   (`invariants.test.ts`)، وأيّ تخفيفٍ فوقه يُسقطه.
 */
function MetaRow({ dish, en, reserve }: { dish: Dish; en: boolean; reserve: boolean }) {
  const icons = displayAllergens(dish.allergens, en);
  const row = useRef<HTMLSpanElement>(null);
  const [fits, setFits] = useState(icons.length);

  useLayoutEffect(() => {
    const el = row.current;
    if (!el || !icons.length) return;
    const measure = () => {
      // ⚠️ عرض التخطيط الكسري — لا `offsetWidth` ولا `getBoundingClientRect`:
      // الأوّل يقرّب فيجمع ٤٨ لمحتوى عرضه ٤٧٫٤ فيُخفي رمزاً ثم يعيده — تذبذبٌ
      // لا يستقرّ. والثاني يقيس الصندوق **بعد** التحويل، وبطاقات `sticker` مائلة
      // فينتفخ كل عرض. و`border-box` من preflight، فالعرض المحسوب يشمل الحاشية.
      const cs = (n: Element) => getComputedStyle(n);
      const width = (n: Element) => parseFloat(cs(n).width) || 0;
      const gap = parseFloat(cs(el).columnGap) || 0;
      const cal = el.querySelector<HTMLElement>("[data-cal]");
      const more = el.querySelector<HTMLElement>("[data-more]");
      const chips = [...el.children].filter((k) => !k.hasAttribute("data-more") && !k.hasAttribute("data-cal"));
      let room = width(el) + 0.5;
      if (cal) room -= width(cal) + gap + (parseFloat(cs(cal).marginInlineStart) || 0);
      // الشارة تُقاس حتى وهي مخفيّة («+9» أعرض رقم غالباً).
      const moreW = (more ? width(more) : 22) + gap;
      let used = 0;
      let k = 0;
      for (; k < chips.length; k++) {
        const w = width(chips[k]) + (k ? gap : 0);
        if (used + w + (k + 1 < chips.length ? moreW : 0) > room) break;
        used += w;
      }
      setFits(k);
    };
    measure();
    // الصفّ نفسه (تغيّر العرض) والسعرات وأوّل رمز (وصول الخطّ يغيّر عرضيهما).
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const cal = el.querySelector("[data-cal]");
    if (cal) ro.observe(cal);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, [icons.length, dish.calories, en]);

  const has = !!icons.length || dish.calories != null;
  if (!has && !reserve) return null;
  const k = Math.min(fits, icons.length);
  const hidden = icons.slice(k);
  const hiddenNames = hidden.map((a) => a.label).join(en ? ", " : "، ");
  return (
    <span
      ref={row}
      className="flex h-4 w-0 min-w-full flex-nowrap items-center gap-1 overflow-hidden"
      aria-label={icons.length ? (en ? "Allergens" : "مسببات الحساسية") : undefined}
    >
      {icons.map((a, i) => chip(a, i >= k))}
      {icons.length > 0 && (
        <span
          data-more=""
          title={hidden.length ? hiddenNames : undefined}
          aria-label={hidden.length ? `${en ? "and" : "و"} ${hiddenNames}` : undefined}
          aria-hidden={hidden.length ? undefined : true}
          className={cn(
            "inline-flex shrink-0 items-center gap-0.5 rounded-md px-1 text-[10px] font-black leading-4",
            !hidden.length && "invisible"
          )}
          style={{
            order: hidden.length ? 1 : 4,
            background: "var(--m-bg-2)",
            color: "var(--m-text)",
          }}
          dir="ltr"
        >
          {/* لا رمز ظاهر ⇒ «+٣» وحدها لا تُقرأ؛ علامة التحذير تقول «حساسية: ٣». */}
          {k === 0 && hidden.length ? <Icon name="warn" size={10} /> : "+"}
          {hidden.length || 9}
        </span>
      )}
      {/* السعرات بعد آخر رمزٍ ظاهر مباشرةً — وفجوتها ٦px كما كانت. */}
      <Calories dish={dish} en={en} className="ms-0.5" style={{ order: 2 }} />
    </span>
  );
}

/**
 * ارتفاعات محجوزة — سببها انضباط الشبكة لا التجميل.
 *
 * البطاقات في الصف الواحد تتساوى تلقائياً (grid + `h-full`)، لكن **الصفوف
 * تختلف**: صف أطباقه بلا وصف يقصر عن صف أطباقه بوصف سطرين، فتظهر الأسعار على
 * خطوط مختلفة وتُقرأ الشبكة مهزوزة. حجز سطرين للاسم وسطرين للوصف يجعل كل
 * البطاقات في الصفحة بارتفاع واحد.
 *
 * القيم بـ`em` (نسبة إلى حجم خط العنصر نفسه) = عدد الأسطر × `line-height`:
 * الاسم `text-sm` بـ`leading-snug` (1.375) ⇒ 2.75em · الوصف `text-xs` بـ
 * `leading-relaxed` (1.625) ⇒ 3.25em.
 */
const NAME_2_LINES = "line-clamp-2 min-h-[2.75em]";
const DESC_2_LINES = "line-clamp-2 min-h-[3.25em]";

/**
 * ما يجب حجز مكانه في **كل** بطاقات القسم.
 *
 * تحسبها `MenuPage` مرة لكل قسم: إن حمل أي طبق وصفاً حُجز سطرا الوصف للجميع،
 * وإن حمل أي طبق حساسية أو سعرات حُجز سطرها للجميع. وقسمٌ لا شيء فيه من ذلك
 * (المشروبات غالباً) يبقى مضغوطاً بلا فراغ محجوز لا شيء فيه.
 */
export interface CardReserve {
  desc: boolean;
  meta: boolean;
}

export function DishCard({
  dish,
  en,
  design,
  reserve,
  popular = false,
  addSlot = false,
  onOpen,
}: {
  dish: Dish;
  en: boolean;
  design: MenuDesign;
  reserve?: CardReserve;
  /** ضمن الأكثر طلباً فعلياً — من `popular_dishes` لا من تخمين. */
  popular?: boolean;
  /** زرّ «أضِف» فوق البطاقة — يُحجز له مكانه في القائمة الرأسية كي لا يغطّي نصّاً. */
  addSlot?: boolean;
  onOpen: () => void;
}) {
  const { layout, imageShape, priceStyle, divider } = design;

  /**
   * شارة «الأكثر طلباً».
   *
   * ⚠️ لا تجتمع مع «مميّز» في مكان واحد: «مميّز» اختيارُ التاجر و«الأكثر
   * طلباً» حكمُ الزبائن، وعرضهما معاً على بطاقة واحدة يُفقد الثانية معناها —
   * فالأولى تُصبح ادّعاءً بجانب دليل. فحين يجتمعان يظهر الدليل وحده.
   */
  const badge = popular ? (
    <span
      className="m-badge pointer-events-none absolute z-[1] inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black shadow-sm"
      style={{
        background: "var(--m-accent)",
        color: "var(--m-on-accent)",
        insetInlineStart: layout === "list" ? undefined : "0.5rem",
        insetInlineEnd: layout === "list" ? "0.25rem" : undefined,
        top: layout === "list" ? "0.25rem" : "0.5rem",
      }}
    >
      <Icon name="flame" size={11} /> {en ? "Popular" : "الأكثر طلباً"}
    </span>
  ) : null;
  const surface: CSSProperties = {
    background: "var(--m-surface)",
    borderColor: "var(--m-border)",
    borderRadius: "var(--m-radius)",
  };
  const radius = imageRadius(imageShape);

  /* ── قائمة رأسية أنيقة ─────────────────────────────────────────────── */
  /*
   * النصّ أوّلاً والصورة في آخر السطر — كما في تطبيقات الطلب التي يعرفها
   * الزبون. وطبقٌ بلا صورة يبقى سطراً طباعياً نظيفاً **بلا مربّع بديل**: منيو
   * المطاعم الراقية بلا صور أصلاً، والمربّع الفارغ هو ما يجعل القائمة تبدو ناقصة.
   */
  if (layout === "list") {
    const hasImage = !!dish.image?.trim();
    const listRadius =
      imageShape === "square" ? "0" : imageShape === "arch" ? ARCH : "calc(var(--m-radius) * .9)";
    return (
      <button
        onClick={onOpen}
        className={cn(
          "m-card m-row flex w-full items-start gap-4 py-4 text-start transition-opacity hover:opacity-80",
          divider === "rule" && "border-b",
          divider === "dots" && "border-b border-dashed"
        )}
        style={{ borderColor: "var(--m-border)", position: "relative" }}
      >
        {badge}
        {/* ‏`@container`: السطر يقيس عموده لا الشاشة. وحين يضيق العمود (صورةٌ في
            آخر السطر على 320، أو ورقة الفاتورة) ينزل السعر وخطّه المنقّط إلى سطرٍ
            تحت الاسم — كان الاسم يُعصر إلى ٢٩ بكسل فيصير كلمةً في كل سطر (١٤ سطراً
            في الفاتورة ولوحة الحروف بطبقٍ اسمه ٨٤ حرفاً، قياس الجودة ٢٠٢٦/١٠/٢٦). */}
        <span className="@container min-w-0 flex-1">
          <span className="flex items-baseline gap-x-2 gap-y-1 @max-[16rem]:flex-wrap">
            <span
              className="m-name min-w-0 text-base font-bold leading-snug @max-[16rem]:basis-full"
              style={{ color: "var(--m-text)", ...nameFont }}
            >
              <NameText dish={dish} en={en} star={!!dish.featured && !popular} className="ms-1 inline-block align-[-1px]" />
            </span>
            {/* الخط النقطي يقود العين من الاسم إلى السعر — تقليد المنيوهات الراقية.
                ولونه من `--m-muted` لا `--m-border`: الحدود على الطوابع الداكنة
                شفافة جداً فكان الخطّ يختفي ويضيع الغرض منه. */}
            <span
              aria-hidden="true"
              className={cn(
                "min-w-4 flex-1 translate-y-[-3px]",
                priceStyle === "leader" && "border-b border-dotted opacity-45"
              )}
              style={{ borderColor: "var(--m-muted)" }}
            />
            <Price dish={dish} big style={priceStyle} en={en} />
          </span>
          {desc(dish, en) && (
            // الحجز على الوصف أيضاً لا على سطر التفاصيل وحده: وصفٌ من سطرين
            // كان سطره الثاني يمتدّ تحت زرّ الإضافة فتختفي كلماته الأخيرة.
            <span
              className={cn("m-desc mt-1 line-clamp-2 block text-[13px] leading-relaxed", addSlot && !hasImage && "pe-12")}
              style={{ color: "var(--m-muted)" }}
            >
              {desc(dish, en)}
            </span>
          )}
          <span className={cn("mt-2 flex items-center gap-2", addSlot && !hasImage && "pe-12")}>
            <Allergens dish={dish} en={en} />
            <Calories dish={dish} en={en} />
          </span>
        </span>
        {/* الغلاف `m-thumb` لما لا تحمله `<img>` (إطار الصورة المدسوسة في لوحة الحروف). */}
        {hasImage && (
          <span className="m-thumb relative shrink-0">
            <SafeImage
              src={dish.image}
              alt={name(dish, en)}
              className="m-img h-24 w-24 object-cover"
              wrapperClassName="h-24 w-24"
              style={{ borderRadius: listRadius, background: "var(--m-bg-2)" } as CSSProperties}
              fallback={
                <DishArtwork
                  name={dish.name}
                  emoji={dish.emoji}
                  glyphSize={22}
                  className="m-img h-24 w-24"
                  style={{ borderRadius: listRadius }}
                />
              }
            />
          </span>
        )}
      </button>
    );
  }

  const showDesc = !!desc(dish, en) || !!reserve?.desc;
  const meta = <MetaRow dish={dish} en={en} reserve={!!reserve?.meta} />;

  /* ── عرض بصورة كبيرة (وبطاقات السحب الأفقي بالشكل نفسه) ──────────── */
  if (layout === "showcase" || layout === "deck") {
    return (
      <button
        onClick={onOpen}
        className="m-card m-surface group relative flex h-full w-full flex-col overflow-hidden border text-start transition-transform hover:-translate-y-0.5"
        style={surface}
      >
        {badge}
        {/* الصورة العريضة لا تأخذ `imageShape`: قصّها دائرةً يقطع الطبق نفسه،
            وهذا التخطيط قائم على الصورة الكبيرة. */}
        <SafeImage
          src={dish.image}
          alt={name(dish, en)}
          className="m-img aspect-[16/10] w-full object-cover"
          wrapperClassName="aspect-[16/10] w-full text-6xl"
          style={{ background: "var(--m-bg-2)" } as CSSProperties}
          fallback={
            <DishArtwork
              name={dish.name}
              emoji={dish.emoji}
              glyphSize={44}
              className="m-img aspect-[16/10] w-full"
            />
          }
        />
        <div className="flex flex-1 flex-col gap-1.5 p-4">
          {/* الاسم والسعر ليسا في صفٍّ بمحاذاة خط القاعدة: اسم يلتفّ سطرين
              يزيح خط القاعدة فينزل معه السعر، فتختلف مواضع الأسعار بين
              البطاقات. الاسم كتلة محجوزة، والسعر على سطر أسفل ثابت. */}
          <p
            className={cn(NAME_2_LINES, "m-name text-base font-bold leading-snug")}
            style={{ color: "var(--m-text)", ...nameFont }}
          >
            <NameText dish={dish} en={en} star={!!dish.featured && !popular} className="ms-0.5 mb-0.5 inline-block align-middle" />
          </p>
          {showDesc && (
            <p className={cn(DESC_2_LINES, "m-desc text-xs leading-relaxed")} style={{ color: "var(--m-muted)" }}>
              {desc(dish, en)}
            </p>
          )}
          <div className="mt-auto flex items-center justify-between gap-3 pt-1">
            <span className="min-w-0 flex-1">{meta}</span>
            <Price dish={dish} big style={priceStyle} en={en} />
          </div>
        </div>
      </button>
    );
  }

  /* ── الشبكة (الافتراضي) ────────────────────────────────────────────── */
  /* ‏`w-full`: الزرّ عنصرٌ سطريّ في الأصل، فبطاقةٌ بلا صورة ولا وصف كانت تنكمش إلى
     عرض اسمها (٧٠ من ١٧٣ بكسل في «عصري») وزرّ «＋» يطفو خارجها — في كل طابعٍ
     تخطيطه شبكة، ومنها الافتراضي. */
  return (
    <button
      onClick={onOpen}
      className="m-card m-surface group relative flex h-full w-full flex-col overflow-hidden border text-start transition-transform hover:-translate-y-0.5"
      style={surface}
    >
      {badge}
      {/* نسبةٌ واحدة لكل الصور (٤:٣): صور التجّار تأتي بأبعاد شتّى، و`object-cover`
          يجعلها كلها بحجم واحد. وكانت مربّعاً فتطول البطاقة على الجوال حتى لا
          يُرى منها في الشاشة إلا صفّان. و`circle` تحتاج حشوةً وإلا لامست الحافّة. */}
      <div className={cn("w-full", (imageShape === "circle" || imageShape === "arch") && "p-3 pb-0")}>
        <SafeImage
          src={dish.image}
          alt={name(dish, en)}
          className={cn("m-img w-full object-cover", gridAspect(imageShape))}
          wrapperClassName={cn("w-full", gridAspect(imageShape))}
          style={{ background: "var(--m-bg-2)", borderRadius: radius } as CSSProperties}
          fallback={
            <DishArtwork
              name={dish.name}
              emoji={dish.emoji}
              glyphSize={30}
              className={cn("m-img w-full", gridAspect(imageShape))}
              style={{ borderRadius: radius } as CSSProperties}
            />
          }
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p
          className={cn(NAME_2_LINES, "m-name text-sm font-bold leading-snug")}
          style={{ color: "var(--m-text)", ...nameFont }}
        >
          <NameText dish={dish} en={en} star={!!dish.featured && !popular} className="ms-0.5 mb-0.5 inline-block align-middle" />
        </p>
        {showDesc && (
          <p className={cn(DESC_2_LINES, "m-desc text-xs leading-relaxed")} style={{ color: "var(--m-muted)" }}>
            {desc(dish, en)}
          </p>
        )}
        {/* التفاصيل الثانوية ثم السعر — سطران بارتفاع محسوم لا يتبع المحتوى.
            كانا في صفّ واحد فيفيض عن عرض البطاقة على الجوال ويلتفّ، والسعر
            وحده على سطره أسهل مسحاً بالعين نزولاً في عمود واحد. */}
        <div className="mt-auto flex flex-col items-start gap-1.5 pt-2">
          {meta}
          <Price dish={dish} style={priceStyle} en={en} />
        </div>
      </div>
    </button>
  );
}

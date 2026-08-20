/**
 * بطاقة الطبق بثلاثة تخطيطات — هذا ما يجعل الفرق بين الطوابع **يُرى** لا يُقرأ.
 *
 * - `grid`     الشبكة الأصلية (عمودان/ثلاثة).
 * - `list`     صف بعرض الشاشة مع خط نقطي يقود إلى السعر، كمنيوهات المطاعم
 *              الراقية. بلا صورة ⇒ بلا مربّع فارغ: منيو التاجر الذي لم يرفع
 *              صوراً يبدو أنيقاً لا ناقصاً.
 * - `showcase` عمود واحد بصورة كبيرة — للكافيهات التي تبيع بالصورة.
 *
 * رموز مسببات الحساسية والسعرات موجودة في التخطيطات الثلاثة: ميزة قائمة لا
 * يجوز أن تختفي لأن التاجر بدّل شكل منيوه.
 */
import type { CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import { displayAllergens } from "@/lib/allergens";
import type { ImageShape, MenuDesign, PriceStyle } from "@/lib/themes";
import type { Dish } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";
import { Icon } from "@/lib/icons";
import { DishArtwork } from "./DishArtwork";

const mFont: CSSProperties = { fontFamily: "var(--m-font)" };

/** نصف قطر صورة الطبق حسب شكل الطابع. */
function imageRadius(shape: ImageShape): string {
  if (shape === "square") return "0";
  if (shape === "circle") return "9999px";
  return "var(--m-radius)";
}

function name(d: Dish, en: boolean): string {
  return en && d.name_en ? d.name_en : d.name;
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
function Price({ dish, big, style }: { dish: Dish; big?: boolean; style: PriceStyle }) {
  const text = (
    <>
      {formatPrice(dish.price ?? 0)} <span className="text-[10px] font-bold">ر.س</span>
    </>
  );
  if (style === "badge") {
    return (
      <span
        className={cn(
          // `m-shine` سطحُ لمعة: يعمل فقط في الطوابع التي تحمل `sheen`،
          // ولا يفعل شيئاً في غيرها ولا مع تقليل الحركة.
          "m-shine whitespace-nowrap rounded-full px-2.5 py-0.5 font-black",
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
      className={big ? "text-base font-black" : "text-sm font-black"}
      style={{ color: "var(--m-accent)" }}
      dir="ltr"
    >
      {text}
    </span>
  );
}

function Allergens({ dish, en }: { dish: Dish; en: boolean }) {
  const icons = displayAllergens(dish.allergens, en);
  if (!icons.length) return null;
  return (
    <div
      className="flex flex-wrap items-center gap-1"
      aria-label={en ? "Allergens" : "مسببات الحساسية"}
    >
      {icons.map((a) => (
        <span
          key={a.key}
          title={a.label}
          className="rounded-md px-1 text-[11px]"
          style={{ background: "var(--m-bg-2)" }}
        >
          {a.emoji}
        </span>
      ))}
    </div>
  );
}

function Calories({ dish, en }: { dish: Dish; en: boolean }) {
  if (dish.calories == null) return null;
  return (
    <span className="whitespace-nowrap text-xs" style={{ color: "var(--m-muted)" }}>
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
 */
function MetaRow({ dish, en, reserve }: { dish: Dish; en: boolean; reserve: boolean }) {
  const has = !!displayAllergens(dish.allergens, en).length || dish.calories != null;
  if (!has && !reserve) return null;
  return (
    <span className="flex h-4 flex-nowrap items-center gap-1.5 overflow-hidden opacity-80">
      <Allergens dish={dish} en={en} />
      <Calories dish={dish} en={en} />
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
  onOpen,
}: {
  dish: Dish;
  en: boolean;
  design: MenuDesign;
  reserve?: CardReserve;
  /** ضمن الأكثر طلباً فعلياً — من `popular_dishes` لا من تخمين. */
  popular?: boolean;
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
      className="pointer-events-none absolute z-[1] inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black shadow-sm"
      style={{
        background: "var(--m-accent)",
        color: "var(--m-on-accent)",
        insetInlineStart: layout === "list" ? undefined : "0.5rem",
        insetInlineEnd: layout === "list" ? "0.25rem" : undefined,
        top: layout === "list" ? "0.25rem" : "0.5rem",
      }}
    >
      🔥 {en ? "Popular" : "الأكثر طلباً"}
    </span>
  ) : null;
  const surface: CSSProperties = {
    background: "var(--m-surface)",
    borderColor: "var(--m-border)",
    borderRadius: "var(--m-radius)",
  };
  const radius = imageRadius(imageShape);

  /* ── قائمة رأسية أنيقة ─────────────────────────────────────────────── */
  if (layout === "list") {
    const hasImage = !!dish.image?.trim();
    return (
      <button
        onClick={onOpen}
        className={cn(
          "m-row flex w-full items-start gap-3 px-1 py-4 text-start transition-opacity hover:opacity-80",
          divider === "rule" && "border-b",
          divider === "dots" && "border-b border-dashed"
        )}
        style={{ borderColor: "var(--m-border)", position: "relative" }}
      >
        {badge}
        {/* ⚠️ كان `hasImage &&` وحده: طبقٌ بلا صورة لا يرسم شيئاً، فيبدو الصفّ
            ناقصاً لا بسيطاً. والواقع أن ١٥ من ٢١ طبقاً بلا صورة. */}
        {hasImage ? (
          <SafeImage
            src={dish.image}
            alt={name(dish, en)}
            className="h-16 w-16 shrink-0 object-cover"
            wrapperClassName="h-16 w-16 shrink-0"
            style={{ borderRadius: radius, background: "var(--m-bg-2)" } as CSSProperties}
            fallback={
              <DishArtwork
                name={dish.name}
                emoji={dish.emoji}
                glyphSize={26}
                className="h-16 w-16 shrink-0"
                style={{ borderRadius: radius }}
              />
            }
          />
        ) : (
          <DishArtwork
            name={dish.name}
            emoji={dish.emoji}
            glyphSize={26}
            className="h-16 w-16 shrink-0"
            style={{ borderRadius: radius }}
          />
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span
              className="shrink-0 text-base font-bold leading-snug"
              style={{ color: "var(--m-text)", ...mFont }}
            >
              {name(dish, en)}
              {dish.featured && !popular && (
              <Icon name="star" size={12} className="mb-0.5 inline-block align-middle" />
            )}
            </span>
            {/* الخط النقطي يقود العين من الاسم إلى السعر — تقليد المنيوهات الراقية.
                وهو خيار طابع الآن: منيو مينيمال يريد المسافة فارغة لا منقّطة.
                ولونه من `--m-muted` لا `--m-border`: الحدود على الطوابع الداكنة
                شفافة جداً (‏.20 مثلاً) فكان الخطّ يختفي تماماً ويضيع الغرض منه. */}
            <span
              aria-hidden="true"
              className={cn(
                "mx-1 min-w-4 flex-1 translate-y-[-3px]",
                priceStyle === "leader" && "border-b border-dotted opacity-45"
              )}
              style={{ borderColor: "var(--m-muted)" }}
            />
            <Price dish={dish} big style={priceStyle} />
          </span>
          {desc(dish, en) && (
            <span
              className="mt-1 block text-xs leading-relaxed"
              style={{ color: "var(--m-muted)" }}
            >
              {desc(dish, en)}
            </span>
          )}
          <span className="mt-1.5 flex items-center gap-2">
            <Allergens dish={dish} en={en} />
            <Calories dish={dish} en={en} />
          </span>
        </span>
      </button>
    );
  }

  const showDesc = !!desc(dish, en) || !!reserve?.desc;
  const meta = <MetaRow dish={dish} en={en} reserve={!!reserve?.meta} />;

  /* ── عرض بصورة كبيرة ───────────────────────────────────────────────── */
  if (layout === "showcase") {
    return (
      <button
        onClick={onOpen}
        className="m-surface group relative flex h-full w-full flex-col overflow-hidden border text-start transition-transform hover:-translate-y-0.5"
        style={surface}
      >
        {badge}
        {/* الصورة العريضة لا تأخذ `imageShape`: قصّها دائرةً يقطع الطبق نفسه،
            وهذا التخطيط قائم على الصورة الكبيرة. */}
        <SafeImage
          src={dish.image}
          alt={name(dish, en)}
          className="aspect-[16/10] w-full object-cover"
          wrapperClassName="aspect-[16/10] w-full text-6xl"
          style={{ background: "var(--m-bg-2)" } as CSSProperties}
          fallback={
            <DishArtwork
              name={dish.name}
              emoji={dish.emoji}
              glyphSize={44}
              className="aspect-[16/10] w-full"
            />
          }
        />
        <div className="flex flex-1 flex-col gap-1.5 p-4">
          {/* الاسم والسعر ليسا في صفٍّ بمحاذاة خط القاعدة: اسم يلتفّ سطرين
              يزيح خط القاعدة فينزل معه السعر، فتختلف مواضع الأسعار بين
              البطاقات. الاسم كتلة محجوزة، والسعر على سطر أسفل ثابت. */}
          <p
            className={cn(NAME_2_LINES, "text-base font-bold leading-snug")}
            style={{ color: "var(--m-text)", ...mFont }}
          >
            {name(dish, en)}
            {dish.featured && !popular && (
              <Icon name="star" size={12} className="mb-0.5 inline-block align-middle" />
            )}
          </p>
          {showDesc && (
            <p className={cn(DESC_2_LINES, "text-xs leading-relaxed")} style={{ color: "var(--m-muted)" }}>
              {desc(dish, en)}
            </p>
          )}
          <div className="mt-auto flex items-center justify-between gap-3 pt-1">
            <span className="min-w-0 flex-1">{meta}</span>
            <Price dish={dish} big style={priceStyle} />
          </div>
        </div>
      </button>
    );
  }

  /* ── الشبكة (الافتراضي) ────────────────────────────────────────────── */
  return (
    <button
      onClick={onOpen}
      className="m-surface group relative flex h-full flex-col overflow-hidden border text-start transition-transform hover:-translate-y-0.5"
      style={surface}
    >
      {badge}
      {/* مربّع تماماً: صور التجّار تأتي بأبعاد شتّى، و`object-cover` على نسبة
          واحدة يجعلها كلها بحجم واحد. الرافع يضغط بـ`square` أصلاً.
          و`circle` تحتاج حشوة حولها وإلا لامست الدائرةُ حوافَّ البطاقة. */}
      <div className={cn("w-full", imageShape === "circle" && "p-3 pb-0")}>
        <SafeImage
          src={dish.image}
          alt={name(dish, en)}
          className="aspect-square w-full object-cover"
          wrapperClassName="aspect-square w-full text-5xl"
          style={{ background: "var(--m-bg-2)", borderRadius: radius } as CSSProperties}
          fallback={
            <DishArtwork
              name={dish.name}
              emoji={dish.emoji}
              glyphSize={38}
              className="aspect-square w-full"
              style={{ borderRadius: radius } as CSSProperties}
            />
          }
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p
          className={cn(NAME_2_LINES, "text-sm font-bold leading-snug")}
          style={{ color: "var(--m-text)", ...mFont }}
        >
          {name(dish, en)}
          {dish.featured && !popular && (
              <Icon name="star" size={12} className="mb-0.5 inline-block align-middle" />
            )}
        </p>
        {showDesc && (
          <p className={cn(DESC_2_LINES, "text-xs leading-relaxed")} style={{ color: "var(--m-muted)" }}>
            {desc(dish, en)}
          </p>
        )}
        {/* التفاصيل الثانوية ثم السعر — سطران بارتفاع محسوم لا يتبع المحتوى.
            كانا في صفّ واحد فيفيض عن عرض البطاقة على الجوال ويلتفّ، والسعر
            وحده على سطره أسهل مسحاً بالعين نزولاً في عمود واحد. */}
        <div className="mt-auto flex flex-col gap-1 pt-2">
          {meta}
          <Price dish={dish} style={priceStyle} />
        </div>
      </div>
    </button>
  );
}

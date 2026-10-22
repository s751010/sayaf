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
import type { CSSProperties } from "react";
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
    // `inline-flex` لا نصٌّ بجانب SVG: الرمز المضمَّن يجلس على خطّ القاعدة فيعلو
    // سطره، وسطر التفاصيل بارتفاعٍ ثابت (`h-4`) فكان يقصّ رأس اللهب أثراً فوق الرقم.
    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs" style={{ color: "var(--m-muted)" }}>
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
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span
              className="m-name min-w-0 text-base font-bold leading-snug"
              style={{ color: "var(--m-text)", ...nameFont }}
            >
              {name(dish, en)}
              {dish.featured && !popular && (
                <Icon name="star" size={12} className="ms-1 inline-block align-[-1px]" />
              )}
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
            {name(dish, en)}
            {dish.featured && !popular && (
              <Icon name="star" size={12} className="mb-0.5 inline-block align-middle" />
            )}
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
  return (
    <button
      onClick={onOpen}
      className="m-card m-surface group relative flex h-full flex-col overflow-hidden border text-start transition-transform hover:-translate-y-0.5"
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
          {name(dish, en)}
          {dish.featured && !popular && (
              <Icon name="star" size={12} className="mb-0.5 inline-block align-middle" />
            )}
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

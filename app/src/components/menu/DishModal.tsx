/**
 * نافذة تفاصيل الطبق — **نقطة الإضافة الوحيدة التي تسمح باختيار الإضافات**.
 * زرّ «＋» على البطاقة يضيف الطبق أساسياً بلا إضافات، ومن أراد «حار» أو
 * «جبن زيادة» يفتح الطبق من هنا.
 *
 * والشكل بلغة الطابع (٢٠٢٦/١٠/٢٦): الخيارات والكمية وزرّ الإضافة يلبسون
 * خطاطيف `m-o-*` نفسها التي تلبسها السلّة (`menu-skins.css`) — فالنافذة والسلّة
 * من نسيجٍ واحد. ولون العلامة على زرّ الإضافة والخيار المختار وحدهما.
 */
import { useEffect, useRef, useState } from "react";
import { SafeImage } from "@/components/ui";
import { DishArtwork } from "@/components/menu/DishArtwork";
import { unitPrice, type Cart } from "@/components/menu/Cart";
import { parseOptions } from "@/lib/options";
import { displayAllergens } from "@/lib/allergens";
import { dishDesc, dishName } from "@/lib/menuText";
import { formatPrice } from "@/lib/utils";
import { Icon, type IconName } from "@/lib/icons";
import type { Dish } from "@/lib/types";
import { isSoldOut, soldOutLabel } from "@/lib/soldOut";

/**
 * هذه هي نقطة الإضافة الوحيدة التي تسمح باختيار الإضافات — زرّ «＋» على البطاقة
 * يضيف الطبق أساسياً بلا إضافات، ومن أراد «حار» أو «جبن زيادة» يفتح الطبق.
 */
export function DishModal({
  dish,
  en,
  cart,
  popular = false,
  onClose,
}: {
  dish: Dish;
  en: boolean;
  cart: Cart | null;
  /** ضمن الأكثر طلباً فعلياً — تُمرَّر من نفس مصدر شارة البطاقة. */
  popular?: boolean;
  onClose: () => void;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const dialogRef = useRef<HTMLDivElement>(null);
  /**
   * التركيز يدخل النافذة ويعود إلى البطاقة التي فتحتها: كان يبقى على البطاقة
   * خلف الغطاء، فقارئ الشاشة يقرأ المنيو لا الطبق، و«Tab» يتجوّل خلف النافذة.
   */
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    // النافذة نفسها لا زرّ الإغلاق: قارئ الشاشة يبدأ من اسم الطبق، ولا تظهر
    // حلقة تركيز على الزرّ لمن فتح بلمسة.
    dialogRef.current?.focus({ preventScroll: true });
    return () => prev?.focus?.({ preventScroll: true });
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const options = parseOptions(dish.options);
  /**
   * نفد اليوم: التاجر أطفأ الطبق (`available === false`). يبقى ظاهراً ليعرف
   * الزبون أنه موجود عادةً، لكن لا يُضاف — والزرّ يقول السبب بدل أن يختفي.
   * والحكم من `isSoldOut` (`false` الصريحة وحدها — `null` صفٌّ قديم متاح).
   */
  const soldOut = isSoldOut(dish);
  // طبق بلا سعر ترفضه دالة الحافة («بلا سعر»)، فلا نعرض له زرّ إضافة أصلاً.
  const sellable = !!cart?.enabled && Number(dish.price ?? 0) > 0;
  const orderable = sellable && !soldOut;
  const allergens = displayAllergens(dish.allergens, en);
  const nutrition = [
    dish.calories != null && { label: en ? "Calories" : "سعرات", value: dish.calories, icon: "flame" },
    dish.sodium_mg != null && { label: en ? "Sodium" : "صوديوم", value: `${dish.sodium_mg} ${en ? "mg" : "ملغم"}`, icon: "salt" },
    dish.caffeine_mg != null && { label: en ? "Caffeine" : "كافيين", value: `${dish.caffeine_mg} ${en ? "mg" : "ملغم"}`, icon: "cup" },
    dish.burn_minutes != null && { label: en ? "Burn (walk)" : "دقائق حرق", value: `${dish.burn_minutes} ${en ? "min" : "د"}`, icon: "clock" },
  ].filter(Boolean) as { label: string; value: string | number; icon: IconName }[];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dish-modal-title"
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="m-sheet anim-fade-up relative outline-none max-h-[92dvh] w-full max-w-lg overflow-y-auto border"
        style={{
          // ‏`backgroundColor` لا `background`: الاختصار المضمَّن يُعيد
          // `background-image` إلى لا شيء فيغلب خامة الطابع (كرافت المحمصة).
          backgroundColor: "var(--m-bg-2)",
          borderColor: "var(--m-line, var(--m-border))",
          borderRadius: "calc(var(--m-radius) * 1.4)",
        }}
      >
        <SafeImage
          src={dish.image}
          alt=""
          className="h-56 w-full object-cover"
          style={soldOut ? { filter: "grayscale(0.85)" } : undefined}
          fallback={
            <DishArtwork name={dish.name} emoji={dish.emoji} glyphSize={48} className="h-44 w-full" />
          }
        />

        {/* ⚠️ زرّ إغلاق ظاهر: كان الإغلاق بالنقر خارج النافذة أو Escape —
            و**لا Escape على الجوال**، والنقر خارجها ليس بديهياً لكل زبون.
            نافذة بلا مخرج مرئي تحبس من لا يعرف العُرف. */}
        <button
          onClick={onClose}
          aria-label={en ? "Close" : "إغلاق"}
          className="absolute end-3 top-3 flex h-11 w-11 items-center justify-center rounded-full shadow-md"
          style={{ background: "var(--m-bg-2)", color: "var(--m-text)" }}
        >
          <Icon name="close" size={16} />
        </button>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 id="dish-modal-title" className="m-o-title text-xl font-black" style={{ color: "var(--m-text)" }}>
              {dishName(dish, en)}
              {popular && (
                <span
                  className="m-o-chip ms-2 inline-flex translate-y-[-2px] items-center gap-1 px-2 py-0.5 align-middle text-[10px] font-black"
                  style={{ color: "var(--m-text)", fontFamily: "var(--m-font)" }}
                >
                  <span style={{ color: "var(--m-accent-ink, var(--m-accent))" }}>
                    <Icon name="flame" size={12} />
                  </span>
                  {en ? "Popular" : "الأكثر طلباً"}
                </span>
              )}
            </h3>
            {(dish.price ?? 0) > 0 && (
              <span
                dir="ltr"
                className="m-o-num shrink-0 text-lg font-black"
                style={{ color: soldOut ? "var(--m-muted)" : "var(--m-text)", textDecoration: soldOut ? "line-through" : undefined }}
              >
                {formatPrice(dish.price ?? 0)} {en ? "SAR" : "ر.س"}
              </span>
            )}
          </div>
          {dishDesc(dish, en) && (
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--m-muted)" }}>
              {dishDesc(dish, en)}
            </p>
          )}

          {nutrition.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {nutrition.map((n) => (
                <div
                  key={n.label}
                  className="m-o-card m-o-fact flex items-center gap-2 px-3 py-2 text-xs font-bold"
                  style={{ color: "var(--m-text)" }}
                >
                  <span className="shrink-0" style={{ color: "var(--m-muted)" }}>
                    <Icon name={n.icon} size={15} />
                  </span>
                  <span className="min-w-0">
                    {n.label}: <span className="m-o-num">{n.value}</span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* تنبيه الصوديوم المرتفع — عمود محسوب في قاعدة البيانات
              (sodium_mg > 600) لم يكن يُعرض للزبون إطلاقاً. */}
          {dish.is_high_sodium && (
            <p className="m-o-card m-o-fact mt-2 flex items-center gap-2 px-3 py-2 text-xs font-bold" style={{ color: "var(--m-text)" }}>
              <span className="shrink-0" style={{ color: "var(--m-accent-ink, var(--m-accent))" }}>
                <Icon name="warn" size={15} />
              </span>
              {en ? "High in sodium" : "غني بالصوديوم"}
            </p>
          )}

          {allergens.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold" style={{ color: "var(--m-muted)" }}>
                <Icon name="warn" size={13} /> {en ? "Allergens" : "مسببات الحساسية"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {allergens.map((a) => (
                  <span key={a.key} className="m-o-chip px-2.5 py-0.5 text-xs" style={{ color: "var(--m-text)" }}>
                    {a.emoji} {a.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {options.length > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 text-xs font-bold" style={{ color: "var(--m-muted)" }}>
                {en ? "Options" : "الخيارات والإضافات"}
              </p>
              <div className="flex flex-col gap-1.5">
                {options.map((o, i) => {
                  // المعرّف هو **الموضع**: نفس ما تقرؤه دالة الحافة من العمود.
                  const id = String(i);
                  const on = picked.includes(id);
                  const row = (
                    <>
                      <span className="flex min-w-0 items-center gap-2.5">
                        {/* المربّع مرسومٌ لا رمز نصّي («☐ ☑»): يرث حبر الطابع، والمختار
                            يمتلئ بلون العلامة وعليه علامة بلونها المقروء. */}
                        {orderable && (
                          <span aria-hidden="true" className="m-o-tick">
                            {on && <Icon name="check" size={13} />}
                          </span>
                        )}
                        <span className="min-w-0">{o.name}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {/* سعرات الإضافة بجانبها — كما تطلب الهيئة للإضافات الجانبية. */}
                        {o.kcal != null && o.kcal > 0 && (
                          <span className="text-xs" style={{ color: "var(--m-muted)" }}>
                            <span className="m-o-num">{o.kcal}</span> {en ? "kcal" : "سعرة"}
                          </span>
                        )}
                        {/* «+0 ر.س» ضجيج: إضافة بلا سعر (حار، بلا بصل) اسمها يكفي. */}
                        {o.price != null && o.price > 0 && (
                          <span dir="ltr" className="m-o-num font-bold" style={{ color: "var(--m-text)" }}>
                            +{formatPrice(o.price)} {en ? "SAR" : "ر.س"}
                          </span>
                        )}
                      </span>
                    </>
                  );
                  const cls = "m-o-opt flex min-h-11 items-center justify-between gap-3 px-3 py-2 text-start text-sm";
                  return orderable ? (
                    <button
                      key={`${o.name}-${i}`}
                      onClick={() =>
                        setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
                      }
                      aria-pressed={on}
                      className={cls}
                      style={{ color: "var(--m-text)" }}
                    >
                      {row}
                    </button>
                  ) : (
                    <div key={`${o.name}-${i}`} className={cls} style={{ color: "var(--m-text)" }}>
                      {row}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {dish.sfda_compliant && (
            <p
              className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs"
              style={{ color: "var(--m-muted)" }}
            >
              <Icon name="check" size={13} />
              {/* ⚠️ «مُعلنة» لا «متوافقة مع الهيئة»: اكتمال السعرات والصوديوم شرطٌ
                  من شروطها لا شهادةٌ منها، والمسؤولية النظامية على المنشأة. */}
              {en ? "Nutrition declared by the restaurant" : "القيم الغذائية مُعلنة من المطعم"}
            </p>
          )}

          {orderable ? (
            <div className="m-o-dock mt-5 flex items-center gap-2">
              <div className="m-o-step flex shrink-0 items-center">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label={en ? "Decrease" : "إنقاص"}
                  disabled={qty === 1}
                  className="flex h-11 w-11 items-center justify-center disabled:opacity-40"
                  style={{ color: "var(--m-text)" }}
                >
                  <Icon name="minus" size={16} />
                </button>
                <span className="m-o-num w-6 text-center text-sm font-black" style={{ color: "var(--m-text)" }}>
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => Math.min(99, q + 1))}
                  aria-label={en ? "Increase" : "زيادة"}
                  className="flex h-11 w-11 items-center justify-center"
                  style={{ color: "var(--m-text)" }}
                >
                  <Icon name="plus" size={16} />
                </button>
              </div>
              <button
                onClick={() => {
                  cart!.add(dish.id, picked, qty);
                  onClose();
                }}
                className="m-o-cta flex min-h-12 flex-1 items-center justify-between gap-2 px-4 py-2.5 text-sm font-black"
              >
                <span>{en ? "Add to order" : "أضِف للطلب"}</span>
                <span dir="ltr" className="m-o-num">
                  {formatPrice(unitPrice(dish, picked) * qty)} {en ? "SAR" : "ر.س"}
                </span>
              </button>
            </div>
          ) : soldOut ? (
            // نفد: زرٌّ معطّل يقول السبب — لا زرّ يختفي فيظنّ الزبون أن الطلب
            // متعطّل، ولا زرّ يضيف ثم ترفضه الدالّة عند الدفع.
            <button
              disabled
              aria-disabled="true"
              className="m-o-soldout mt-5 flex min-h-12 w-full items-center justify-center gap-2 py-2.5 text-sm font-black"
            >
              <Icon name="clock" size={16} />
              {soldOutLabel(en)}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="m-o-ghost mt-5 min-h-12 w-full py-2.5 text-sm font-black"
            >
              {en ? "Close" : "إغلاق"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── بطاقة الولاء (زبون) ──────────────────────────────────────────── */

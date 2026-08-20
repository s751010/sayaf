/**
 * نافذة تفاصيل الطبق — **نقطة الإضافة الوحيدة التي تسمح باختيار الإضافات**.
 * زرّ «＋» على البطاقة يضيف الطبق أساسياً بلا إضافات، ومن أراد «حار» أو
 * «جبن زيادة» يفتح الطبق من هنا.
 */
import { useEffect, useState } from "react";
import { SafeImage } from "@/components/ui";
import { DishArtwork } from "@/components/menu/DishArtwork";
import { unitPrice, type Cart } from "@/components/menu/Cart";
import { mFont } from "@/components/menu/chrome";
import { parseOptions } from "@/lib/options";
import { displayAllergens } from "@/lib/allergens";
import { dishDesc, dishName } from "@/lib/menuText";
import { formatPrice } from "@/lib/utils";
import { Icon } from "@/lib/icons";
import type { Dish } from "@/lib/types";

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
  // طبق بلا سعر ترفضه دالة الحافة («بلا سعر»)، فلا نعرض له زرّ إضافة أصلاً.
  const orderable = !!cart?.enabled && Number(dish.price ?? 0) > 0;
  const allergens = displayAllergens(dish.allergens, en);
  const nutrition = [
    dish.calories != null && { label: en ? "Calories" : "سعرات", value: dish.calories, icon: "🔥" },
    dish.sodium_mg != null && { label: en ? "Sodium" : "صوديوم", value: `${dish.sodium_mg} ملغم`, icon: "🧂" },
    dish.caffeine_mg != null && { label: en ? "Caffeine" : "كافيين", value: `${dish.caffeine_mg} ملغم`, icon: "☕" },
    dish.burn_minutes != null && { label: en ? "Burn (walk)" : "دقائق حرق", value: `${dish.burn_minutes} د`, icon: "🚶" },
  ].filter(Boolean) as { label: string; value: string | number; icon: string }[];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="anim-fade-up relative max-h-[92dvh] w-full max-w-lg overflow-y-auto border"
        style={{
          background: "var(--m-bg-2)",
          borderColor: "var(--m-border)",
          borderRadius: "calc(var(--m-radius) * 1.4)",
        }}
      >
        <SafeImage
          src={dish.image}
          alt=""
          className="h-56 w-full object-cover"
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
          className="absolute end-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-sm font-black shadow-md"
          style={{ background: "var(--m-bg-2)", color: "var(--m-text)" }}
        >
          ✕
        </button>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xl font-black" style={{ color: "var(--m-text)", ...mFont }}>
              {dishName(dish, en)}
              {popular && (
                <span
                  className="ms-2 inline-flex translate-y-[-2px] items-center gap-1 rounded-full px-2 py-0.5 align-middle text-[10px] font-black"
                  style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
                >
                  🔥 {en ? "Popular" : "الأكثر طلباً"}
                </span>
              )}
            </h3>
            <span className="shrink-0 text-lg font-black" style={{ color: "var(--m-accent)" }}>
              {formatPrice(dish.price ?? 0)} ر.س
            </span>
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
                  className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold"
                  style={{ borderColor: "var(--m-border)", background: "var(--m-surface)", color: "var(--m-text)" }}
                >
                  <span>{n.icon}</span> {n.label}: {n.value}
                </div>
              ))}
            </div>
          )}

          {/* تنبيه الصوديوم المرتفع — عمود محسوب في قاعدة البيانات
              (sodium_mg > 600) لم يكن يُعرض للزبون إطلاقاً. */}
          {dish.is_high_sodium && (
            <p
              className="mt-3 rounded-xl border px-3 py-2 text-xs font-bold"
              style={{ borderColor: "var(--m-border)", color: "var(--m-text)", background: "var(--m-surface)" }}
            >
              🧂 {en ? "High in sodium" : "غني بالصوديوم"}
            </p>
          )}

          {allergens.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-xs font-bold" style={{ color: "var(--m-muted)" }}>
                ⚠️ {en ? "Allergens" : "مسببات الحساسية"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {allergens.map((a) => (
                  <span
                    key={a.key}
                    className="rounded-full border px-2.5 py-0.5 text-xs"
                    style={{ borderColor: "var(--m-border)", color: "var(--m-text)" }}
                  >
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
                      <span>
                        {orderable && (
                          <span aria-hidden="true" style={{ color: on ? "var(--m-accent)" : "var(--m-muted)" }}>
                            {on ? "☑ " : "☐ "}
                          </span>
                        )}
                        {o.name}
                      </span>
                      {/* «+0 ر.س» ضجيج: إضافة بلا سعر (حار، بلا بصل) اسمها يكفي. */}
                      {o.price != null && o.price > 0 && (
                        <span style={{ color: "var(--m-accent)" }}>
                          +{formatPrice(o.price)} {en ? "SAR" : "ر.س"}
                        </span>
                      )}
                    </>
                  );
                  const cls =
                    "flex min-h-11 items-center justify-between rounded-xl border px-3 py-2 text-start text-sm";
                  const style = {
                    borderColor: on ? "var(--m-accent)" : "var(--m-border)",
                    color: "var(--m-text)",
                  };
                  return orderable ? (
                    <button
                      key={`${o.name}-${i}`}
                      onClick={() =>
                        setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
                      }
                      aria-pressed={on}
                      className={cls}
                      style={style}
                    >
                      {row}
                    </button>
                  ) : (
                    <div key={`${o.name}-${i}`} className={cls} style={style}>
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
              {en ? "SFDA-compliant nutrition info" : "معلومات غذائية متوافقة مع هيئة الغذاء والدواء"}
            </p>
          )}

          {orderable ? (
            <div className="mt-5 flex items-center gap-2">
              <div
                className="flex shrink-0 items-center rounded-xl border"
                style={{ borderColor: "var(--m-border)" }}
              >
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label={en ? "Decrease" : "إنقاص"}
                  className="h-11 w-11 text-lg font-black"
                  style={{ color: "var(--m-muted)" }}
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-black" style={{ color: "var(--m-text)" }}>
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => Math.min(99, q + 1))}
                  aria-label={en ? "Increase" : "زيادة"}
                  className="h-11 w-11 text-lg font-black"
                  style={{ color: "var(--m-accent)" }}
                >
                  ＋
                </button>
              </div>
              <button
                onClick={() => {
                  cart!.add(dish.id, picked, qty);
                  onClose();
                }}
                className="flex min-h-11 flex-1 items-center justify-between gap-2 rounded-xl px-4 py-2.5 text-sm font-black"
                style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
              >
                <span>{en ? "Add to order" : "أضِف للطلب"}</span>
                <span dir="ltr">
                  {formatPrice(unitPrice(dish, picked) * qty)} {en ? "SAR" : "ر.س"}
                </span>
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="mt-5 min-h-11 w-full rounded-xl py-2.5 text-sm font-black"
              style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
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

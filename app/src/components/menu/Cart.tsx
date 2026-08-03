/**
 * سلة الزبون داخل المنيو + الدفع الإلكتروني لحساب المطعم.
 *
 * ⚠️ **المبدأ الحاكم: السلة لا تعرف مبلغاً مُلزِماً.** ما تراه هنا عرض للزبون
 * فقط؛ الطلب المُرسَل يحمل نيّةً لا مالاً — `{dish_id, qty, option_ids}` — و
 * `paylink-order-create` تعيد قراءة الأسعار من جدول `dishes` وتُسعّر الإضافات
 * من خيارات الطبق المخزَّنة. لولا ذلك لاستطاع أي زائر يعبث بجسم الطلب أن يدفع
 * ريالاً مقابل طلب بمئات.
 *
 * و`option_ids` هي **مواضع** الإضافات في `parseOptions(dish.options)` — الطرفان
 * (هذا الملف ودالة الحافة) يحلّلان العمود بنفس المنطق، فالموضع يعني الشيء نفسه
 * عندهما. أي تغيير في `lib/options.ts` يوجب تغييراً مطابقاً في الدالة.
 */
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { parseOptions } from "@/lib/options";
import { createOrder } from "@/lib/data";
import { K, getJSON, removeItem, setJSON } from "@/lib/storage";
import { formatPrice } from "@/lib/utils";
import type { Dish } from "@/lib/types";

const mFont: CSSProperties = { fontFamily: "var(--m-font)" };

export type CartLine = { dish_id: string; option_ids: string[]; qty: number };

/** طبق واحد بإضافات مختلفة = سطران مستقلّان، فالمفتاح يجمع الاثنين. */
function keyOf(dishId: string, optionIds: string[]): string {
  return `${dishId}|${[...optionIds].sort((a, b) => Number(a) - Number(b)).join(",")}`;
}

/** سعر الوحدة للعرض — الخادم يحسب الحقيقي، وهذا لطمأنة الزبون قبل التحويل. */
export function unitPrice(dish: Dish, optionIds: string[]): number {
  const options = parseOptions(dish.options);
  const extra = optionIds.reduce((sum, id) => sum + (options[Number(id)]?.price ?? 0), 0);
  return Number(dish.price ?? 0) + extra;
}

export type Cart = ReturnType<typeof useCart>;

export function useCart(restaurantId: string, enabled: boolean) {
  const storeKey = `${K.CART}_${restaurantId}`;
  const [lines, setLines] = useState<CartLine[]>([]);

  // التحميل من الجلسة عند معرفة المطعم — الصفحة تُركَّب قبل وصول بياناته.
  useEffect(() => {
    if (!restaurantId || !enabled) return;
    setLines(getJSON<CartLine[]>(storeKey, true) ?? []);
  }, [restaurantId, storeKey, enabled]);

  /**
   * الحفظ داخل المُحدِّث لا في `useEffect`: تأثير حفظ يعمل على أول تركيب كان
   * سيكتب سلة فارغة **فوق** المحفوظ قبل أن يصل تأثير التحميل.
   */
  const update = useCallback(
    (next: (prev: CartLine[]) => CartLine[]) => {
      setLines((prev) => {
        const value = next(prev);
        if (restaurantId) setJSON(storeKey, value, true);
        return value;
      });
    },
    [restaurantId, storeKey]
  );

  const add = useCallback(
    (dishId: string, optionIds: string[] = [], qty = 1) => {
      const key = keyOf(dishId, optionIds);
      update((prev) => {
        const at = prev.findIndex((l) => keyOf(l.dish_id, l.option_ids) === key);
        if (at === -1) {
          return [...prev, { dish_id: dishId, option_ids: [...optionIds], qty }];
        }
        // ٩٩ حدّ دالة الحافة أيضاً — نتوقّف هنا بدل أن يُرفض الطلب عند الدفع.
        const copy = [...prev];
        copy[at] = { ...copy[at], qty: Math.min(99, copy[at].qty + qty) };
        return copy;
      });
    },
    [update]
  );

  const setQty = useCallback(
    (index: number, qty: number) => {
      update((prev) =>
        qty <= 0
          ? prev.filter((_, i) => i !== index)
          : prev.map((l, i) => (i === index ? { ...l, qty: Math.min(99, qty) } : l))
      );
    },
    [update]
  );

  const clear = useCallback(() => {
    if (restaurantId) removeItem(storeKey, true);
    setLines([]);
  }, [restaurantId, storeKey]);

  const count = useMemo(() => lines.reduce((n, l) => n + l.qty, 0), [lines]);

  return { lines, add, setQty, clear, count, enabled: enabled && !!restaurantId };
}

/* ── زر الإضافة على بطاقة الطبق ───────────────────────────────────── */

/**
 * يُركَّب **فوق** البطاقة لا داخلها: جذر `DishCard` عنصر `<button>`، وزرّ داخل
 * زرّ HTML غير صالح ويُسقط تفاعل الطبق كله في بعض المتصفحات.
 */
export function AddToCartButton({
  onAdd,
  label,
  className,
}: {
  onAdd: () => void;
  label: string;
  className: string;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onAdd();
      }}
      aria-label={label}
      title={label}
      className={`absolute z-10 flex h-8 w-8 items-center justify-center rounded-full text-lg font-black shadow-md transition-transform hover:scale-110 active:scale-95 ${className}`}
      style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
    >
      ＋
    </button>
  );
}

/* ── الشريط السفلي ────────────────────────────────────────────────── */

export function CartBar({
  count,
  total,
  en,
  onOpen,
}: {
  count: number;
  total: number;
  en: boolean;
  onOpen: () => void;
}) {
  if (count === 0) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-3">
      <button
        onClick={onOpen}
        className="anim-fade-up mx-auto flex w-full max-w-md items-center justify-between gap-3 px-5 py-3.5 text-sm font-black shadow-2xl transition-transform hover:scale-[1.01]"
        style={{
          background: "var(--m-accent)",
          color: "var(--m-on-accent)",
          borderRadius: "calc(var(--m-radius) * 1.2)",
        }}
      >
        <span className="flex items-center gap-2">
          <span
            className="flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs"
            style={{ background: "var(--m-on-accent)", color: "var(--m-accent)" }}
          >
            {count}
          </span>
          {en ? "View order" : "مراجعة الطلب"}
        </span>
        <span dir="ltr">
          {formatPrice(total)} {en ? "SAR" : "ر.س"}
        </span>
      </button>
    </div>
  );
}

/* ── شاشة المراجعة والدفع ─────────────────────────────────────────── */

export function CartReview({
  cart,
  dishById,
  en,
  restaurantId,
  table,
  onClose,
}: {
  cart: Cart;
  dishById: Map<string, Dish>;
  en: boolean;
  restaurantId: string;
  table: string | null;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const rows = cart.lines.map((line, index) => {
    const dish = dishById.get(line.dish_id);
    const options = dish ? parseOptions(dish.options) : [];
    return {
      index,
      line,
      dish,
      labels: line.option_ids.map((id) => options[Number(id)]?.name).filter(Boolean) as string[],
      total: dish ? unitPrice(dish, line.option_ids) * line.qty : 0,
    };
  });
  const total = rows.reduce((sum, r) => sum + r.total, 0);
  // طبق حُذف أو نفد بعد وضعه في السلة — الدالة سترفض الطلب كله، فنمنع الضغط.
  const missing = rows.some((r) => !r.dish);

  async function pay() {
    setBusy(true);
    setError("");
    try {
      const { url } = await createOrder({
        restaurant_id: restaurantId,
        items: cart.lines.map((l) => ({
          dish_id: l.dish_id,
          qty: l.qty,
          option_ids: l.option_ids,
        })),
        table,
        customer: { name: name.trim(), mobile: mobile.trim() },
      });
      // السلة تبقى حتى يعود الزبون بـ`?order=paid` — لو ألغى الدفع وجدها كما هي.
      window.location.href = url;
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : en
            ? "Couldn't start payment. Try again."
            : "تعذّر بدء الدفع. حاول مجدداً."
      );
      setBusy(false);
    }
  }

  const field: CSSProperties = {
    borderColor: "var(--m-border)",
    background: "var(--m-bg)",
    color: "var(--m-text)",
  };

  return (
    <div className="flex flex-col gap-3">
      {rows.length === 0 && (
        <p className="py-6 text-center text-sm" style={{ color: "var(--m-muted)" }}>
          {en ? "Your order is empty." : "طلبك فارغ."}
        </p>
      )}

      {rows.map((r) => (
        <div
          key={`${r.line.dish_id}-${r.index}`}
          className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
          style={{ borderColor: "var(--m-border)", background: "var(--m-surface)" }}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold" style={{ color: "var(--m-text)" }}>
              {r.dish ? (en && r.dish.name_en ? r.dish.name_en : r.dish.name) : en ? "Unavailable item" : "صنف لم يعد متاحاً"}
            </p>
            {r.labels.length > 0 && (
              <p className="truncate text-xs" style={{ color: "var(--m-muted)" }}>
                {r.labels.join("، ")}
              </p>
            )}
          </div>
          <div
            className="flex shrink-0 items-center gap-1 rounded-full border"
            style={{ borderColor: "var(--m-border)" }}
          >
            <button
              onClick={() => cart.setQty(r.index, r.line.qty - 1)}
              aria-label={en ? "Decrease" : "إنقاص"}
              className="h-7 w-7 text-sm font-black"
              style={{ color: "var(--m-muted)" }}
            >
              −
            </button>
            <span className="w-5 text-center text-sm font-black" style={{ color: "var(--m-text)" }}>
              {r.line.qty}
            </span>
            <button
              onClick={() => cart.setQty(r.index, r.line.qty + 1)}
              aria-label={en ? "Increase" : "زيادة"}
              className="h-7 w-7 text-sm font-black"
              style={{ color: "var(--m-accent)" }}
            >
              ＋
            </button>
          </div>
          <span
            dir="ltr"
            className="w-16 shrink-0 text-end text-sm font-black"
            style={{ color: "var(--m-accent)" }}
          >
            {formatPrice(r.total)}
          </span>
        </div>
      ))}

      {rows.length > 0 && (
        <>
          <div
            className="flex items-center justify-between border-t pt-3 text-base font-black"
            style={{ borderColor: "var(--m-border)", color: "var(--m-text)", ...mFont }}
          >
            <span>{en ? "Total" : "الإجمالي"}</span>
            <span dir="ltr" style={{ color: "var(--m-accent)" }}>
              {formatPrice(total)} {en ? "SAR" : "ر.س"}
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={en ? "Your name (optional)" : "اسمك (اختياري)"}
              className="rounded-xl border px-3.5 py-2.5 text-sm"
              style={field}
            />
            <input
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/[^\d+]/g, ""))}
              placeholder={en ? "Mobile (optional)" : "جوالك (اختياري)"}
              dir="ltr"
              inputMode="tel"
              className="rounded-xl border px-3.5 py-2.5 text-sm"
              style={field}
            />
          </div>

          {table && (
            <p className="text-center text-xs" style={{ color: "var(--m-muted)" }}>
              🪑 {en ? `Table ${table}` : `طاولة ${table}`}
            </p>
          )}

          {missing && (
            <p className="text-center text-xs font-bold" style={{ color: "var(--m-accent)" }}>
              {en
                ? "An item is no longer available — remove it to continue."
                : "أحد الأصناف لم يعد متاحاً — احذفه لتُكمل."}
            </p>
          )}
          {error && (
            <p className="text-center text-xs font-bold" style={{ color: "var(--m-accent)" }}>
              {error}
            </p>
          )}

          <button
            onClick={pay}
            disabled={busy || missing}
            className="w-full rounded-xl py-3 text-sm font-black disabled:opacity-50"
            style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
          >
            {busy ? "…" : en ? "Pay now" : "الدفع الآن"}
          </button>
          <button
            onClick={() => {
              cart.clear();
              onClose();
            }}
            className="text-center text-xs font-bold underline underline-offset-2"
            style={{ color: "var(--m-muted)" }}
          >
            {en ? "Empty the order" : "إفراغ الطلب"}
          </button>
          <p className="text-center text-xs leading-relaxed" style={{ color: "var(--m-muted)" }}>
            {en
              ? "Payment is made directly to the restaurant through a secure gateway."
              : "الدفع يتم مباشرة لحساب المطعم عبر بوابة دفع آمنة."}
          </p>
        </>
      )}
    </div>
  );
}

/* ── رسالة العودة من بوابة الدفع ──────────────────────────────────── */

export function OrderResult({
  status,
  en,
  onDismiss,
}: {
  status: "paid" | "cancelled";
  en: boolean;
  onDismiss: () => void;
}) {
  const paid = status === "paid";
  return (
    <div
      className="anim-fade-up mx-auto mt-5 flex max-w-md items-start gap-3 border px-4 py-3"
      style={{
        borderColor: "var(--m-accent)",
        background: "var(--m-surface)",
        borderRadius: "var(--m-radius)",
      }}
    >
      <span className="text-2xl">{paid ? "✅" : "↩️"}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black" style={{ color: "var(--m-text)", ...mFont }}>
          {paid
            ? en
              ? "Payment received — thank you!"
              : "تم استلام الدفع — شكراً لك!"
            : en
              ? "Payment cancelled"
              : "أُلغيت عملية الدفع"}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--m-muted)" }}>
          {paid
            ? en
              ? "Show this screen to the staff so they bring your order."
              : "أرِ هذه الشاشة لموظف المطعم ليُحضِر طلبك."
            : en
              ? "Your order is still here — you can pay whenever you're ready."
              : "طلبك ما زال موجوداً — تقدر تدفع متى ما جهزت."}
        </p>
      </div>
      <button
        onClick={onDismiss}
        aria-label={en ? "Dismiss" : "إخفاء"}
        className="shrink-0 text-sm"
        style={{ color: "var(--m-muted)" }}
      >
        ✕
      </button>
    </div>
  );
}

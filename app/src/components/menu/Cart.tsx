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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseOptions } from "@/lib/options";
import { getOrderStatus, type PublicOrder } from "@/lib/data";
import { K, getJSON, removeItem, setJSON } from "@/lib/storage";
import { formatPrice } from "@/lib/utils";
import type { Dish } from "@/lib/types";

// ثابت الخطّ مشترك مع بقيّة قطع المنيو — نسخةٌ ثانية هنا تعني طابعاً
// يتغيّر في البطاقة ولا يتغيّر في السلّة.
import { mFont } from "@/components/menu/chrome";

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
      className={`absolute z-10 flex h-11 w-11 items-center justify-center rounded-full text-lg font-black shadow-md transition-transform hover:scale-110 active:scale-95 ${className}`}
      style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
    >
      ＋
    </button>
  );
}

/* ── الشريط السفلي ────────────────────────────────────────────────── */

/**
 * الشريط السفلي للطلب.
 *
 * ⚠️ **كان يختفي كلياً حين تفرغ السلة** (`if (count === 0) return null`) — أي
 * أن من يفتح منيو مطعمٍ يستقبل طلبات لا يرى **أي إشارة** أن الطلب ممكن
 * أصلاً، ويُفترض به أن يخمّن. وهذه أغلى فجوة في المسار كلّه: ميزةٌ مبنيّة
 * بالكامل ولا أحد يعلم بوجودها.
 *
 * فالشريط الآن حالتان: دعوةٌ حين تفرغ السلة، ومراجعةٌ حين تمتلئ. وحين يكون
 * المطعم مغلقاً يقول ذلك بوضوح بدل أن يقبل طلباً لن يُحضَّر.
 */
export function CartBar({
  count,
  total,
  en,
  onOpen,
  open = true,
  prepMinutes = null,
}: {
  count: number;
  total: number;
  en: boolean;
  onOpen: () => void;
  /** هل يستقبل المطعم طلبات الآن؟ */
  open?: boolean;
  /** وقت التحضير المعلَن — يُحوّل الدعوة من مبهمة إلى وعد. */
  prepMinutes?: number | null;
}) {
  const empty = count === 0;

  /**
   * نبضة عند تغيّر العدد.
   *
   * الزبون يضيف الطبق من أعلى الصفحة والشريط في أسفلها — خارج بؤرة نظره.
   * النبضة هي إيصال الاستلام: «وصلت إضافتك». تُعاد بإزالة الصنف ثم إعادة
   * الصنف الفوري (`requestAnimationFrame`) كي يعيد المتصفح تشغيل الحركة،
   * وتُتجاهَل أول قيمة كي لا ينبض الشريط لمجرّد فتح الصفحة بسلة محفوظة.
   */
  const [pop, setPop] = useState(false);
  const prevCount = useRef(count);
  useEffect(() => {
    if (prevCount.current !== count && count > 0) {
      setPop(false);
      requestAnimationFrame(() => setPop(true));
    }
    prevCount.current = count;
  }, [count]);

  if (!open) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-40 p-3">
        <div
          className="mx-auto flex w-full max-w-md items-center justify-center gap-2 px-5 py-3 text-xs font-bold shadow-xl"
          style={{
            background: "var(--m-surface)",
            color: "var(--m-muted)",
            border: "1px solid var(--m-border)",
            borderRadius: "calc(var(--m-radius) * 1.2)",
          }}
        >
          {en ? "Not accepting orders right now" : "المطعم لا يستقبل طلبات حالياً"}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-3">
      <button
        onClick={onOpen}
        disabled={empty}
        className={`anim-fade-up mx-auto flex w-full max-w-md items-center justify-between gap-3 px-5 py-3.5 text-sm font-black shadow-2xl transition-transform enabled:hover:scale-[1.01] ${pop ? "anim-cart-pop" : ""}`}
        style={{
          background: empty ? "var(--m-surface)" : "var(--m-accent)",
          color: empty ? "var(--m-text)" : "var(--m-on-accent)",
          border: empty ? "1px solid var(--m-accent)" : "1px solid transparent",
          borderRadius: "calc(var(--m-radius) * 1.2)",
        }}
      >
        {empty ? (
          <>
            <span className="flex items-center gap-2">
              🛍️ {en ? "Order for pickup" : "اطلب واستلم من الفرع"}
            </span>
            {prepMinutes ? (
              <span className="text-xs font-bold" style={{ opacity: 0.7 }}>
                {en ? `~${prepMinutes} min` : `~${prepMinutes} دقيقة`}
              </span>
            ) : null}
          </>
        ) : (
          <>
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
          </>
        )}
      </button>
    </div>
  );
}

/**
 * شريط «استلام من الفرع» أعلى المنيو.
 *
 * الزبون في تطبيقات الطلب يبحث أولاً عن سؤالين: **أستلم أم يُوصَّل؟** و**متى
 * يجهز؟** فيُجابان قبل أن يسأل، ومرّةً واحدة أعلى الصفحة — لا استلامٌ مخبوء
 * في شاشة الدفع بعد أن يبني الزبون سلّته كلّها.
 */
export function PickupBanner({
  open,
  prepMinutes,
  minOrder,
  en,
}: {
  open: boolean;
  prepMinutes: number | null;
  minOrder: number;
  en: boolean;
}) {
  return (
    <div
      className="mx-auto mt-4 flex max-w-md flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2.5 text-xs font-bold"
      style={{
        background: open ? "var(--m-surface)" : "var(--m-bg-2)",
        border: `1px solid ${open ? "var(--m-accent)" : "var(--m-border)"}`,
        borderRadius: "var(--m-radius)",
        color: open ? "var(--m-text)" : "var(--m-muted)",
      }}
    >
      <span style={{ color: open ? "var(--m-accent)" : "var(--m-muted)" }}>
        🛍️ {en ? "Pickup only" : "استلام من الفرع"}
      </span>
      {open ? (
        <>
          {prepMinutes ? (
            <span style={{ color: "var(--m-muted)" }}>
              ⏱ {en ? `Ready in ~${prepMinutes} min` : `يجهز خلال ~${prepMinutes} دقيقة`}
            </span>
          ) : null}
          {minOrder > 0 ? (
            <span style={{ color: "var(--m-muted)" }}>
              {en ? `Min ${formatPrice(minOrder)} SAR` : `أقل طلب ${formatPrice(minOrder)} ر.س`}
            </span>
          ) : null}
        </>
      ) : (
        <span>{en ? "Closed for orders now" : "مغلق للطلبات الآن"}</span>
      )}
    </div>
  );
}

/* ── شريط الطلب الجاري ─────────────────────────────────────────────── */

/**
 * الزبون الذي طلب ثم عاد للمنيو.
 *
 * بعد الدفع يغلق الزبون جواله وينتظر، ثم يفتح المنيو مرّة أخرى ليتصفّح أو
 * ليطمئنّ — فيجد الصفحة كما لو أنه لم يطلب شيئاً قطّ. هذا الشريط يتذكّر له:
 * يقرأ آخر طلب من التخزين المحلّي، ويختفي وحده حين يُسلَّم أو يُلغى.
 */
export function ActiveOrderStrip({ en }: { en: boolean }) {
  const [order, setOrder] = useState<{ id: string; view: PublicOrder } | null>(null);

  useEffect(() => {
    const id = getJSON<string>(K.LAST_ORDER);
    if (!id) return;
    let alive = true;
    getOrderStatus(id)
      .then((view) => {
        if (!alive || !view) return;
        // طلبٌ انتهى ليس «جارياً» — ونُنسي المتصفّح إيّاه كي لا يعود غداً.
        if (view.status === "picked_up" || view.status === "cancelled") {
          removeItem(K.LAST_ORDER);
          return;
        }
        setOrder({ id, view });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!order) return null;
  const ready = order.view.status === "ready";

  return (
    <a
      href={`/o/${order.id}`}
      className="anim-fade-up mx-auto mt-4 flex max-w-md items-center gap-3 px-4 py-3"
      style={{
        background: ready ? "var(--m-accent)" : "var(--m-surface)",
        color: ready ? "var(--m-on-accent)" : "var(--m-text)",
        border: `1px solid var(--m-accent)`,
        borderRadius: "var(--m-radius)",
      }}
    >
      <span
        className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl text-lg font-black tabular-nums"
        style={{
          background: ready ? "var(--m-on-accent)" : "var(--m-accent)",
          color: ready ? "var(--m-accent)" : "var(--m-on-accent)",
        }}
      >
        {order.view.code}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black" style={mFont}>
          {ready
            ? en
              ? "Your order is ready!"
              : "طلبك جاهز للاستلام!"
            : en
              ? "Your order is on the way"
              : "طلبك قيد التنفيذ"}
        </span>
        <span className="block text-xs" style={{ opacity: 0.75 }}>
          {en ? "Tap to track" : "اضغط للمتابعة"}
        </span>
      </span>
      <span className="shrink-0 text-lg">‹</span>
    </a>
  );
}

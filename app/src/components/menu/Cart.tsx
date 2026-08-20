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
import { createOrder, verifyOrder, type PublicOrder } from "@/lib/data";
import { K, getJSON, removeItem, setJSON } from "@/lib/storage";
import { formatPrice, whatsappUrl } from "@/lib/utils";
import type { Dish } from "@/lib/types";
import { Icon } from "@/lib/icons";

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
      className={`absolute z-10 flex h-11 w-11 items-center justify-center rounded-full text-lg font-black shadow-md transition-transform hover:scale-110 active:scale-95 ${className}`}
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

/**
 * نصّ الطلب المُرسَل إلى واتساب المطعم.
 *
 * ⚠️ **قاعدة §13 «لا مبلغ من العميل» لا تنطبق هنا — وهذا ليس تساهلاً.**
 * تلك القاعدة وُجدت لأن المال يمرّ عبر بوّابة: جسمٌ مزوَّر كان يعني دفع ريال
 * مقابل طلب بمئات، فتُعاد قراءة الأسعار على الخادم. وفي هذا المسار **لا يمرّ
 * مال عندنا إطلاقاً**: الرسالة نصٌّ يقرؤه موظّف المطعم ويؤكّده، والسعر النهائي
 * منه. فحساب الإجمالي في المتصفّح خارجُ نطاق القاعدة لا نقضٌ لها.
 *
 * ولهذا يقول السطر «تقديري» صراحةً: وعدُ سعرٍ نهائي لا نملك تثبيته يصنع خلافاً
 * على الطاولة.
 *
 * وأثرٌ في صالح الخصوصية: النصّ يُركَّب هنا ويُفتح على `wa.me` مباشرة — لا اسم
 * الزبون ولا جوّاله يمرّان بخوادمنا ولا يُخزَّنان.
 */
function orderText(args: {
  restaurantName: string;
  rows: { dish?: Dish; labels: string[]; line: CartLine; total: number }[];
  total: number;
  table: string | null;
  name: string;
  mobile: string;
  en: boolean;
}): string {
  const { restaurantName, rows, total, table, name, mobile, en } = args;
  const L: string[] = [];
  L.push(en ? `New order · ${restaurantName}` : `طلب جديد · ${restaurantName}`);
  if (table) L.push(en ? `Table: ${table}` : `الطاولة: ${table}`);
  L.push("");
  for (const r of rows) {
    if (!r.dish) continue;
    const dishName = en && r.dish.name_en ? r.dish.name_en : r.dish.name;
    const extras = r.labels.length ? ` — ${r.labels.join("، ")}` : "";
    L.push(`${r.line.qty}× ${dishName}${extras}  ${formatPrice(r.total)} ${en ? "SAR" : "ر.س"}`);
  }
  L.push("");
  L.push(
    en
      ? `Estimated total: ${formatPrice(total)} SAR`
      : `الإجمالي التقديري: ${formatPrice(total)} ر.س`
  );
  if (name) L.push(en ? `Name: ${name}` : `الاسم: ${name}`);
  if (mobile) L.push(en ? `Mobile: ${mobile}` : `الجوال: ${mobile}`);
  return L.join("\n");
}

export function CartReview({
  cart,
  dishById,
  en,
  restaurantId,
  restaurantName,
  table,
  payOn,
  whatsapp,
  onClose,
}: {
  cart: Cart;
  dishById: Map<string, Dish>;
  en: boolean;
  restaurantId: string;
  restaurantName: string;
  table: string | null;
  /** بوّابة الدفع مفتوحة لهذا المطعم. */
  payOn: boolean;
  /** رقم واتساب المطعم — `null` إن لم يُفعّل المسار أو لم يُحفظ رقم. */
  whatsapp: string | null;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  // ملاحظة الطلب: حساسية أو طلب خاص. تُقصّ إلى ٥٠٠ محرف في القاعدة، ونقصّها
  // هنا أيضاً كي لا يكتب الزبون رسالةً تُبتر بلا إنذار.
  const [note, setNote] = useState("");
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
      const { url, order_id } = await createOrder({
        restaurant_id: restaurantId,
        items: cart.lines.map((l) => ({
          dish_id: l.dish_id,
          qty: l.qty,
          option_ids: l.option_ids,
        })),
        table,
        note: note.trim() || null,
        customer: { name: name.trim(), mobile: mobile.trim() },
      });
      // معرّف الطلب يُحفظ محلياً أيضاً: رابط العودة قد يُقصّ أو يُفتح في تبويب
      // آخر، والزبون الذي دفع يستحقّ أن يجد رقم استلامه في الحالتين. مفتاح
      // واحد لا مفتاح لكل مطعم: الزبون يدفع طلباً واحداً في اللحظة، والأحدث
      // هو ما يعنيه.
      setJSON(K.LAST_ORDER, order_id);
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
              className="h-11 w-11 text-sm font-black"
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
              className="h-11 w-11 text-sm font-black"
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

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 500))}
            rows={2}
            placeholder={
              en
                ? "Order note — allergies or special requests (optional)"
                : "ملاحظة للطلب — حساسية أو طلب خاص (اختياري)"
            }
            className="w-full resize-none rounded-xl border px-3.5 py-2.5 text-sm"
            style={field}
          />

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

          {/* المساران معاً أو أيّهما وُجد. من أطفأ الاثنين لا تظهر له سلّة أصلاً. */}
          {whatsapp && (
            <a
              href={
                missing
                  ? "#"
                  : whatsappUrl(
                      whatsapp,
                      orderText({ restaurantName, rows, total, table, name, mobile, en })
                    )
              }
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={missing}
              onClick={(e) => missing && e.preventDefault()}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-black aria-disabled:opacity-50"
              style={
                payOn
                  ? { border: "1px solid var(--m-accent)", color: "var(--m-accent)" }
                  : { background: "var(--m-accent)", color: "var(--m-on-accent)" }
              }
            >
              <Icon name="share" size={15} />
              {en ? "Send order on WhatsApp" : "أرسل الطلب على واتساب"}
            </a>
          )}
          {payOn && (
            <button
              onClick={pay}
              disabled={busy || missing}
              className="min-h-11 w-full rounded-xl py-3 text-sm font-black disabled:opacity-50"
              style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
            >
              {busy ? "…" : en ? "Pay now" : "الدفع الآن"}
            </button>
          )}
          <button
            onClick={() => {
              cart.clear();
              onClose();
            }}
            className="mx-auto inline-flex min-h-9 items-center text-center text-xs font-bold underline underline-offset-2"
            style={{ color: "var(--m-muted)" }}
          >
            {en ? "Empty the order" : "إفراغ الطلب"}
          </button>
          <p className="text-center text-xs leading-relaxed" style={{ color: "var(--m-muted)" }}>
            {payOn
              ? en
                ? "Payment is made directly to the restaurant through a secure gateway."
                : "الدفع يتم مباشرة لحساب المطعم عبر بوابة دفع آمنة."
              : en
                ? "Your order is sent to the restaurant on WhatsApp. They confirm the final price."
                : "يصل طلبك للمطعم على واتساب، وهو من يؤكّد السعر النهائي."}
          </p>
        </>
      )}
    </div>
  );
}

/* ── تذكرة الاستلام ────────────────────────────────────────────────── */

/** الحالات كما يقرؤها الزبون — لا أسماء تقنية. */
const STATUS_VIEW: Record<
  string,
  { ar: string; en: string; hint_ar: string; hint_en: string; icon: string }
> = {
  new: {
    ar: "وصل طلبك للمطعم",
    en: "Order received",
    hint_ar: "سيبدأ التحضير بعد قليل.",
    hint_en: "Preparation starts shortly.",
    icon: "🧾",
  },
  preparing: {
    ar: "طلبك قيد التحضير",
    en: "Preparing your order",
    hint_ar: "لحظات ويجهز.",
    hint_en: "Almost there.",
    icon: "👨‍🍳",
  },
  ready: {
    ar: "طلبك جاهز للاستلام",
    en: "Ready for pickup",
    hint_ar: "توجّه للكاشير وأرِه الرقم.",
    hint_en: "Head to the counter and show your number.",
    icon: "✅",
  },
  picked_up: {
    ar: "تم الاستلام",
    en: "Picked up",
    hint_ar: "بالهناء والشفاء 🌿",
    hint_en: "Enjoy your meal 🌿",
    icon: "🎉",
  },
  cancelled: {
    ar: "أُلغي الطلب",
    en: "Order cancelled",
    hint_ar: "راجع المطعم إن خُصم المبلغ.",
    hint_en: "Contact the restaurant if you were charged.",
    icon: "⛔",
  },
};

/**
 * ما يراه الزبون بعد الدفع — **رقم الاستلام أولاً**.
 *
 * ═══ لماذا رقمٌ ضخم لا رسالة شكر ═══
 *
 * كانت هذه الشاشة تقول «تم استلام الدفع» وتنتهي — بلا رقم ولا حالة، لأن
 * الطلب لم يكن يُحفظ أصلاً. والزبون الواقف أمام الكاشير لا يحتاج شكراً؛
 * يحتاج رقماً يُنطق. فالرقم هو أكبر عنصر في الشاشة، وما عداه تفصيل.
 *
 * ═══ التأكيد يقع هنا لا في الويبهوك ═══
 *
 * `verifyOrder` تسأل PayLink بمفاتيح المطعم وتؤكّد الطلب. فحتى لو لم يضبط
 * التاجر أي ويبهوك في حسابه — وأغلبهم لن يفعل — يصل الطلب للوحته لحظة عودة
 * الزبون. والنداء متكافئ فتحديث الصفحة لا يُكرّر شيئاً.
 */
export function PickupTicket({
  orderId,
  status,
  en,
  onDismiss,
  onConfirmed,
}: {
  orderId: string | null;
  status: "paid" | "cancelled";
  en: boolean;
  onDismiss: () => void;
  onConfirmed: () => void;
}) {
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "pending" | "error">(
    status === "paid" && orderId ? "loading" : "ok"
  );

  useEffect(() => {
    if (status !== "paid" || !orderId) return;
    let alive = true;
    let timer: number | undefined;

    const check = async () => {
      try {
        const result = await verifyOrder(orderId);
        if (!alive) return;
        if ("pending" in result) {
          setState("pending");
          // البوّابة قد تتأخّر ثوانيَ في تسجيل الدفعة — نعيد السؤال مرّة.
          timer = window.setTimeout(check, 4000);
          return;
        }
        setOrder(result);
        setState("ok");
        onConfirmed();
      } catch {
        if (alive) setState("error");
      }
    };
    check();
    return () => {
      alive = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [orderId, status, onConfirmed]);

  const card: CSSProperties = {
    borderColor: "var(--m-accent)",
    background: "var(--m-surface)",
    borderRadius: "var(--m-radius)",
  };

  if (status === "cancelled") {
    return (
      <div className="anim-fade-up mx-auto mt-5 flex max-w-md items-start gap-3 border px-4 py-3" style={card}>
        <span className="text-2xl">↩️</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black" style={{ color: "var(--m-text)", ...mFont }}>
            {en ? "Payment cancelled" : "أُلغيت عملية الدفع"}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--m-muted)" }}>
            {en
              ? "Your order is still here — you can pay whenever you're ready."
              : "طلبك ما زال موجوداً — تقدر تدفع متى ما جهزت."}
          </p>
        </div>
        <button onClick={onDismiss} aria-label={en ? "Dismiss" : "إخفاء"} className="shrink-0 text-sm" style={{ color: "var(--m-muted)" }}>
          ✕
        </button>
      </div>
    );
  }

  if (state === "loading" || state === "pending") {
    return (
      <div className="anim-fade-up mx-auto mt-5 max-w-md border px-4 py-5 text-center" style={card}>
        <p className="text-sm font-bold" style={{ color: "var(--m-text)", ...mFont }}>
          {en ? "Confirming your payment…" : "نؤكّد دفعتك…"}
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--m-muted)" }}>
          {en ? "This takes a few seconds." : "ثوانٍ قليلة، لا تغلق الصفحة."}
        </p>
      </div>
    );
  }

  if (state === "error" || !order) {
    return (
      <div className="anim-fade-up mx-auto mt-5 max-w-md border px-4 py-4 text-center" style={card}>
        <p className="text-sm font-bold" style={{ color: "var(--m-text)", ...mFont }}>
          {en ? "Couldn't confirm the order" : "تعذّر تأكيد الطلب"}
        </p>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--m-muted)" }}>
          {en
            ? "If you were charged, show this screen to the staff — your payment is recorded."
            : "إن خُصم المبلغ فأرِ هذه الشاشة للموظف — دفعتك مسجّلة عندنا."}
        </p>
        <button onClick={onDismiss} className="mt-3 text-xs underline" style={{ color: "var(--m-muted)" }}>
          {en ? "Dismiss" : "إخفاء"}
        </button>
      </div>
    );
  }

  const view = STATUS_VIEW[order.status] ?? STATUS_VIEW.new;

  return (
    <div className="anim-fade-up mx-auto mt-5 max-w-md overflow-hidden border" style={card}>
      {/* رقم الاستلام — أكبر شيء في الشاشة عمداً. */}
      <div className="px-4 py-5 text-center" style={{ background: "var(--m-accent)" }}>
        <p className="text-xs font-bold" style={{ color: "var(--m-on-accent, #fff)", opacity: 0.85 }}>
          {en ? "Your pickup number" : "رقم استلامك"}
        </p>
        <p
          className="mt-1 text-6xl font-black tabular-nums leading-none"
          style={{ color: "var(--m-on-accent, #fff)", ...mFont }}
        >
          {order.code}
        </p>
        <p className="mt-2 text-xs" style={{ color: "var(--m-on-accent, #fff)", opacity: 0.85 }}>
          {order.restaurant}
        </p>
      </div>

      <div className="px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{view.icon}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black" style={{ color: "var(--m-text)", ...mFont }}>
              {en ? view.en : view.ar}
            </p>
            <p className="text-xs" style={{ color: "var(--m-muted)" }}>
              {en ? view.hint_en : view.hint_ar}
            </p>
          </div>
        </div>

        <ul className="mt-3 flex flex-col gap-1 border-t pt-3" style={{ borderColor: "var(--m-border)" }}>
          {order.items.map((item, i) => (
            <li key={i} className="flex items-baseline justify-between gap-3 text-xs" style={{ color: "var(--m-muted)" }}>
              <span className="min-w-0 flex-1 truncate">
                {item.qty} × {item.name}
                {item.options ? ` — ${item.options}` : ""}
              </span>
              <span className="tabular-nums">{formatPrice(item.line_total)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex items-baseline justify-between border-t pt-3" style={{ borderColor: "var(--m-border)" }}>
          <span className="text-sm font-black" style={{ color: "var(--m-text)", ...mFont }}>
            {en ? "Total" : "الإجمالي"}
          </span>
          <span className="text-sm font-black tabular-nums" style={{ color: "var(--m-text)" }}>
            {formatPrice(order.total)}
          </span>
        </div>
        <p className="mt-1 text-[11px]" style={{ color: "var(--m-muted)" }}>
          {order.vat_included
            ? en
              ? "VAT (15%) included"
              : "شامل ضريبة القيمة المضافة ١٥٪"
            : en
              ? "VAT (15%) not included"
              : "غير شامل ضريبة القيمة المضافة ١٥٪"}
        </p>

        <button onClick={onDismiss} className="mt-3 w-full text-xs underline" style={{ color: "var(--m-muted)" }}>
          {en ? "Back to menu" : "العودة للمنيو"}
        </button>
      </div>
    </div>
  );
}

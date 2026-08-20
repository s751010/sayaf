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
import { createOrder, getOrderStatus, verifyOrder, type PublicOrder } from "@/lib/data";
import { K, getJSON, removeItem, setJSON } from "@/lib/storage";
import { formatPrice, whatsappUrl } from "@/lib/utils";
import type { Dish } from "@/lib/types";
import { Icon } from "@/lib/icons";
import { DishArtwork } from "./DishArtwork";

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
        className="anim-fade-up mx-auto flex w-full max-w-md items-center justify-between gap-3 px-5 py-3.5 text-sm font-black shadow-2xl transition-transform enabled:hover:scale-[1.01]"
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
  acceptingOrders = true,
  prepMinutes = null,
  minOrder = 0,
  vatIncluded = true,
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
  acceptingOrders?: boolean;
  prepMinutes?: number | null;
  minOrder?: number;
  vatIncluded?: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  // ملاحظة الطلب: حساسية أو طلب خاص. تُقصّ إلى ٥٠٠ محرف في القاعدة، ونقصّها
  // هنا أيضاً كي لا يكتب الزبون رسالةً تُبتر بلا إنذار.
  const [note, setNote] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
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
  const count = rows.reduce((sum, r) => sum + r.line.qty, 0);
  // طبق حُذف أو نفد بعد وضعه في السلة — الدالة سترفض الطلب كله، فنمنع الضغط.
  const missing = rows.some((r) => !r.dish);
  const belowMin = minOrder > 0 && total < minOrder;
  const blocked = missing || belowMin || !acceptingOrders;

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
      // واحد لا مفتاح لكل مطعم: الزبون يدفع طلباً واحداً في اللحظة.
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
  const card: CSSProperties = {
    borderColor: "var(--m-border)",
    background: "var(--m-surface)",
    borderRadius: "var(--m-radius)",
  };

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <span className="text-4xl">🛍️</span>
        <p className="text-sm font-black" style={{ color: "var(--m-text)", ...mFont }}>
          {en ? "Your order is empty" : "طلبك فارغ"}
        </p>
        <p className="text-xs" style={{ color: "var(--m-muted)" }}>
          {en ? "Add items from the menu to get started." : "أضِف أصنافاً من المنيو لتبدأ."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 pb-2">
      {/* ── طريقة الاستلام ─────────────────────────────────────────────
          الزبون يجب أن يعرف **كيف يصله طلبه** قبل أن يدفع، لا بعده. وهي
          حقيقة ثابتة هنا (استلام فقط) فتُعلَن لا تُسأل. */}
      <div
        className="flex items-center gap-3 border px-3.5 py-3"
        style={{ ...card, borderColor: "var(--m-accent)" }}
      >
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
          style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
        >
          🛍️
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-black" style={{ color: "var(--m-text)", ...mFont }}>
            {en ? "Pickup from branch" : "استلام من الفرع"}
          </span>
          <span className="block truncate text-xs" style={{ color: "var(--m-muted)" }}>
            {restaurantName}
            {prepMinutes ? (en ? ` · ready in ~${prepMinutes} min` : ` · يجهز خلال ~${prepMinutes} دقيقة`) : ""}
          </span>
        </span>
        {table && (
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black"
            style={{ background: "var(--m-bg-2)", color: "var(--m-muted)" }}
          >
            {en ? `Table ${table}` : `طاولة ${table}`}
          </span>
        )}
      </div>

      {/* ── الأصناف ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-0.5">
        <span className="text-xs font-black" style={{ color: "var(--m-muted)" }}>
          {en ? `Items (${count})` : `الأصناف (${count})`}
        </span>
        <button
          onClick={() => {
            cart.clear();
            onClose();
          }}
          className="text-[11px] font-bold underline underline-offset-2"
          style={{ color: "var(--m-muted)" }}
        >
          {en ? "Clear all" : "إفراغ السلة"}
        </button>
      </div>

      {rows.map((r) => {
        const gone = !r.dish;
        return (
          <div
            key={`${r.line.dish_id}-${r.index}`}
            className="flex items-center gap-3 border px-3 py-2.5"
            style={{ ...card, opacity: gone ? 0.6 : 1 }}
          >
            {/* الصورة تجعل المراجعة بصرية: الزبون يتعرّف على ما طلبه بلمحة. */}
            {r.dish?.image?.trim() ? (
              <img
                src={r.dish.image}
                alt=""
                loading="lazy"
                className="h-14 w-14 shrink-0 object-cover"
                style={{ borderRadius: "calc(var(--m-radius) * 0.7)" }}
              />
            ) : (
              // نفس الصورة المولَّدة التي في المنيو: الزبون يرى ما رآه هناك،
              // فلا تنقلب البطاقة إلى مربّع رمادي عند المراجعة.
              <DishArtwork
                name={r.dish?.name ?? ""}
                emoji={r.dish?.emoji}
                glyphSize={24}
                className="h-14 w-14 shrink-0"
                style={{ borderRadius: "calc(var(--m-radius) * 0.7)" }}
              />
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black" style={{ color: "var(--m-text)" }}>
                {gone
                  ? en
                    ? "Item no longer available"
                    : "صنف لم يعد متاحاً"
                  : en && r.dish!.name_en
                    ? r.dish!.name_en
                    : r.dish!.name}
              </p>
              {r.labels.length > 0 && (
                <p className="truncate text-xs" style={{ color: "var(--m-muted)" }}>
                  {r.labels.join("، ")}
                </p>
              )}
              <p
                dir="ltr"
                className="mt-0.5 text-sm font-black tabular-nums"
                style={{ color: "var(--m-accent)", textAlign: "start" }}
              >
                {formatPrice(r.total)} {en ? "SAR" : "ر.س"}
              </p>
            </div>

            <div
              className="flex shrink-0 items-center gap-0.5 rounded-full border"
              style={{ borderColor: "var(--m-border)" }}
            >
              {/* الكمية ١ ⇐ الزرّ سلّة مهملات لا «ناقص»: الإنقاص من واحد حذفٌ،
                  وإظهاره كإنقاص يجعل الزبون يضغط ويتساءل ماذا حدث. */}
              <button
                onClick={() => cart.setQty(r.index, r.line.qty - 1)}
                aria-label={r.line.qty === 1 ? (en ? "Remove" : "حذف") : en ? "Decrease" : "إنقاص"}
                className="h-10 w-10 text-sm font-black"
                style={{ color: r.line.qty === 1 ? "var(--m-muted)" : "var(--m-text)" }}
              >
                {r.line.qty === 1 ? "🗑" : "−"}
              </button>
              <span
                className="w-5 text-center text-sm font-black tabular-nums"
                style={{ color: "var(--m-text)" }}
              >
                {r.line.qty}
              </span>
              <button
                onClick={() => cart.setQty(r.index, r.line.qty + 1)}
                aria-label={en ? "Increase" : "زيادة"}
                disabled={gone}
                className="h-10 w-10 text-sm font-black disabled:opacity-40"
                style={{ color: "var(--m-accent)" }}
              >
                ＋
              </button>
            </div>
          </div>
        );
      })}

      {/* ── ملاحظة الطلب ──────────────────────────────────────────────
          مطويّة افتراضاً: أغلب الطلبات بلا ملاحظة، وحقلٌ فارغ دائم الظهور
          يُطيل الشاشة بلا مقابل. ومن يحتاجها يجدها بسطر واحد. */}
      <div className="border px-3.5 py-2.5" style={card}>
        <button
          onClick={() => setNoteOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 text-start"
        >
          <span className="min-w-0">
            <span className="block text-sm font-bold" style={{ color: "var(--m-text)" }}>
              📝 {en ? "Add a note" : "أضِف ملاحظة للطلب"}
            </span>
            <span className="block truncate text-[11px]" style={{ color: "var(--m-muted)" }}>
              {note.trim()
                ? note
                : en
                  ? "Allergies or special requests"
                  : "حساسية، أو طلب خاص"}
            </span>
          </span>
          <span style={{ color: "var(--m-muted)" }}>{noteOpen ? "▴" : "▾"}</span>
        </button>
        {noteOpen && (
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 500))}
            rows={2}
            autoFocus
            placeholder={en ? "e.g. no onions, extra spicy" : "مثلاً: بدون بصل، حار زيادة"}
            className="mt-2 w-full resize-none rounded-xl border px-3 py-2 text-sm"
            style={field}
          />
        )}
      </div>

      {/* ── بيانات المستلِم ───────────────────────────────────────────
          «اختياري» في مطعم استلام مضلّل: الكاشير ينادي باسم، والمطعم يتصل
          حين يطول الانتظار. فالحقلان مطلوبان بلا نجمة تخيف — والنصّ يشرح
          لماذا بدل أن يأمر. */}
      <div className="border px-3.5 py-3" style={card}>
        <p className="text-sm font-black" style={{ color: "var(--m-text)", ...mFont }}>
          {en ? "Who's picking up?" : "من سيستلم الطلب؟"}
        </p>
        <p className="mt-0.5 text-[11px]" style={{ color: "var(--m-muted)" }}>
          {en
            ? "So the cashier can call your name if needed."
            : "ليناديك الكاشير، ويتصل بك إن طال الانتظار."}
        </p>
        <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={en ? "Your name" : "اسمك"}
            autoComplete="name"
            className="min-h-11 rounded-xl border px-3.5 py-2.5 text-sm"
            style={field}
          />
          <input
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/[^\d+]/g, ""))}
            placeholder={en ? "Mobile" : "جوالك"}
            dir="ltr"
            inputMode="tel"
            autoComplete="tel"
            className="min-h-11 rounded-xl border px-3.5 py-2.5 text-sm"
            style={field}
          />
        </div>
      </div>

      {/* ── الفاتورة ──────────────────────────────────────────────────
          سطر واحد «الإجمالي» كان يترك الزبون يسأل: هل الضريبة فوقه؟ فصار
          الإفصاح جزءاً من الفاتورة لا هامشاً تحتها. */}
      <div className="border px-3.5 py-3" style={card}>
        <div className="flex items-center justify-between text-sm" style={{ color: "var(--m-muted)" }}>
          <span>{en ? "Subtotal" : "الإجمالي الفرعي"}</span>
          <span dir="ltr" className="tabular-nums">
            {formatPrice(total)}
          </span>
        </div>
        <div
          className="mt-2 flex items-center justify-between border-t pt-2 text-base font-black"
          style={{ borderColor: "var(--m-border)", color: "var(--m-text)", ...mFont }}
        >
          <span>{en ? "Total" : "الإجمالي"}</span>
          <span dir="ltr" className="tabular-nums" style={{ color: "var(--m-accent)" }}>
            {formatPrice(total)} {en ? "SAR" : "ر.س"}
          </span>
        </div>
        <p className="mt-1 text-[11px]" style={{ color: "var(--m-muted)" }}>
          {vatIncluded
            ? en
              ? "VAT (15%) included"
              : "شامل ضريبة القيمة المضافة ١٥٪"
            : en
              ? "VAT (15%) not included"
              : "غير شامل ضريبة القيمة المضافة ١٥٪"}
        </p>
      </div>

      {/* ── ما يمنع الإتمام، مشروحاً قبل الضغط لا بعده ─────────────── */}
      {!acceptingOrders && (
        <p
          className="border px-3.5 py-2.5 text-xs font-bold"
          style={{ ...card, borderColor: "var(--m-accent)", color: "var(--m-accent)" }}
        >
          {en
            ? "The restaurant isn't accepting orders right now."
            : "المطعم لا يستقبل طلبات حالياً — جرّب لاحقاً."}
        </p>
      )}
      {belowMin && (
        <p
          className="border px-3.5 py-2.5 text-xs font-bold"
          style={{ ...card, borderColor: "var(--m-accent)", color: "var(--m-accent)" }}
        >
          {en
            ? `Minimum order is ${formatPrice(minOrder)} SAR — add ${formatPrice(minOrder - total)} more.`
            : `أقل مبلغ للطلب ${formatPrice(minOrder)} ر.س — أضِف ${formatPrice(minOrder - total)} ر.س.`}
        </p>
      )}
      {missing && (
        <p
          className="border px-3.5 py-2.5 text-xs font-bold"
          style={{ ...card, borderColor: "var(--m-accent)", color: "var(--m-accent)" }}
        >
          {en
            ? "An item is no longer available — remove it to continue."
            : "أحد الأصناف لم يعد متاحاً — احذفه لتُكمل."}
        </p>
      )}
      {error && (
        <p
          className="border px-3.5 py-2.5 text-xs font-bold"
          style={{ ...card, borderColor: "var(--m-accent)", color: "var(--m-accent)" }}
        >
          {error}
        </p>
      )}

      {/* ── الإتمام ───────────────────────────────────────────────────
          الزرّ يحمل **المبلغ**: من يضغط «الدفع الآن» وحدها يضغط على المجهول،
          ومن يرى الرقم على الزرّ يضغط وهو مطمئن. */}
      {payOn && (
        <button
          onClick={pay}
          disabled={busy || blocked}
          className="flex min-h-14 w-full items-center justify-between gap-3 px-5 text-sm font-black shadow-lg transition-transform enabled:active:scale-[.99] disabled:opacity-50"
          style={{
            background: "var(--m-accent)",
            color: "var(--m-on-accent)",
            borderRadius: "calc(var(--m-radius) * 1.2)",
          }}
        >
          <span className="flex items-center gap-2">
            <Icon name="lock" size={15} />
            {busy
              ? en
                ? "Opening payment…"
                : "نفتح صفحة الدفع…"
              : en
                ? "Pay & order for pickup"
                : "ادفع واطلب للاستلام"}
          </span>
          <span dir="ltr" className="tabular-nums">
            {formatPrice(total)} {en ? "SAR" : "ر.س"}
          </span>
        </button>
      )}

      {whatsapp && (
        <a
          href={
            blocked
              ? "#"
              : whatsappUrl(
                  whatsapp,
                  orderText({ restaurantName, rows, total, table, name, mobile, en })
                )
          }
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={blocked}
          onClick={(e) => blocked && e.preventDefault()}
          className="flex min-h-12 w-full items-center justify-center gap-2 py-3 text-sm font-black aria-disabled:opacity-50"
          style={
            payOn
              ? {
                  border: "1px solid var(--m-border)",
                  color: "var(--m-text)",
                  borderRadius: "calc(var(--m-radius) * 1.2)",
                }
              : {
                  background: "var(--m-accent)",
                  color: "var(--m-on-accent)",
                  borderRadius: "calc(var(--m-radius) * 1.2)",
                }
          }
        >
          <Icon name="share" size={15} />
          {en ? "Send order on WhatsApp" : "أرسل الطلب على واتساب"}
        </a>
      )}

      {payOn && (
        <p className="text-center text-[11px]" style={{ color: "var(--m-muted)" }}>
          🔒{" "}
          {en
            ? "Card details are entered on the payment gateway — never on this page."
            : "بيانات بطاقتك تُدخَل في صفحة بوّابة الدفع، ولا تمرّ بهذه الصفحة إطلاقاً."}
        </p>
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

        {/* ⚠️ هذا الرابط ليس زينة: بدونه تبقى صفحة المتابعة يتيمة لا يصلها
            أحد. الزبون يقفل جواله وينتظر، والتذكرة داخل المنيو تختفي بأول
            تحديث — فالرابط هو ما يعيده إلى طلبه. */}
        <a
          href={`/o/${orderId}`}
          className="mt-3 flex w-full items-center justify-center gap-1.5 py-2.5 text-sm font-black"
          style={{
            background: "var(--m-bg-2)",
            color: "var(--m-text)",
            border: "1px solid var(--m-border)",
            borderRadius: "var(--m-radius)",
          }}
        >
          📲 {en ? "Track my order" : "تابع طلبك — احفظ الرابط"}
        </a>

        <button onClick={onDismiss} className="mt-2 w-full text-xs underline" style={{ color: "var(--m-muted)" }}>
          {en ? "Back to menu" : "العودة للمنيو"}
        </button>
      </div>
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

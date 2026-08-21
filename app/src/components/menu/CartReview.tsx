/**
 * شاشة مراجعة الطلب والدفع — آخر شاشة قبل أن يدفع الزبون.
 *
 * ⚠️ **لا تحمل مبلغاً مُلزِماً**: ما يُعرض هنا للزبون فقط، والطلب المُرسَل
 * نيّةٌ لا مال — `{dish_id, qty, option_ids}` — تُعيد `paylink-order-create`
 * تسعيره من القاعدة. المبدأ كاملاً في رأس `Cart.tsx`.
 *
 * فُصلت عن `Cart.tsx` لأنها أطول أجزائها وأكثرها استقلالاً: تأخذ السلّة
 * جاهزة وتتصرّف في العرض والإرسال، ولا يشاركها بقيّة الملفّ حالةً.
 */
import { useState, type CSSProperties } from "react";
import { unitPrice, type Cart, type CartLine } from "@/components/menu/Cart";
import { mFont } from "@/components/menu/chrome";
import { DishArtwork } from "@/components/menu/DishArtwork";
import { createOrder } from "@/lib/data";
import { parseOptions } from "@/lib/options";
import { K, setJSON } from "@/lib/storage";
import { dishName } from "@/lib/menuText";
import { formatMoney, formatPrice, whatsappUrl } from "@/lib/utils";
import type { Dish } from "@/lib/types";
import { Icon } from "@/lib/icons";

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
    const extras = r.labels.length ? ` — ${r.labels.join("، ")}` : "";
    L.push(
      `${r.line.qty}× ${dishName(r.dish, en)}${extras}  ${formatPrice(r.total)} ${en ? "SAR" : "ر.س"}`
    );
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
            {formatMoney(total, en)}
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

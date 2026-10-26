/**
 * شاشة مراجعة الطلب والدفع — آخر شاشة قبل أن يدفع الزبون.
 *
 * ⚠️ **لا تحمل مبلغاً مُلزِماً**: ما يُعرض هنا للزبون فقط، والطلب المُرسَل
 * نيّةٌ لا مال — `{dish_id, qty, option_ids}` — تُعيد `paylink-order-create`
 * تسعيره من القاعدة. المبدأ كاملاً في رأس `Cart.tsx`.
 *
 * فُصلت عن `Cart.tsx` لأنها أطول أجزائها وأكثرها استقلالاً: تأخذ السلّة
 * جاهزة وتتصرّف في العرض والإرسال، ولا يشاركها بقيّة الملفّ حالةً.
 *
 * ═══ الشكل: تلبس الطابع لا «نموذجاً» (٢٠٢٦/١٠/٢٦) ═══
 *
 * كانت كلّ حدودها وأزرارها بـ`--m-border` و`--m-accent` — وكلاهما **لون علامة
 * التاجر** حين يختار لوناً (`tintTheme`)، فتصير السلّة في «محمصة» بأزرق التاجر
 * استمارةً زرقاء لا جزءاً من المنيو. الآن الأسطح والحدود محايدة من حبر الطابع
 * (`--m-line` في `menu-skins.css`)، ولون العلامة على **زرّ الإتمام والمختار**
 * وحدهما، وكلّ طابعٍ يلبسها بخامته عبر خطاطيف `m-o-*`. المنطق والمُرسَل لم يتغيّرا.
 */
import { Link } from "react-router-dom";
import { isVatNumber } from "@/lib/legal";
import { useState, type ReactNode } from "react";
import { unitPrice, type Cart, type CartLine } from "@/components/menu/Cart";
import { DishArtwork } from "@/components/menu/DishArtwork";
import { createOrder } from "@/lib/data";
import { parseOptions } from "@/lib/options";
import { orderTotals } from "@/lib/vat";
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
  /** ضريبةٌ تُضاف فوق الأسعار غير الشاملة — `0` حين تكون شاملة. */
  vatAdded: number;
  table: string | null;
  name: string;
  mobile: string;
  en: boolean;
}): string {
  const { restaurantName, rows, total, vatAdded, table, name, mobile, en } = args;
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
  if (vatAdded > 0) L.push(en ? `VAT 15%: ${formatPrice(vatAdded)} SAR` : `ضريبة القيمة المضافة 15%: ${formatPrice(vatAdded)} ر.س`);
  L.push(
    en
      ? `Estimated total: ${formatPrice(total)} SAR`
      : `الإجمالي التقديري: ${formatPrice(total)} ر.س`
  );
  if (name) L.push(en ? `Name: ${name}` : `الاسم: ${name}`);
  if (mobile) L.push(en ? `Mobile: ${mobile}` : `الجوال: ${mobile}`);
  return L.join("\n");
}

/** ما يمنع الإتمام — بطاقةٌ محايدة بعلامة تنبيه، لا كتلةٌ بلون العلامة. */
function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="m-o-card flex items-start gap-2 px-3.5 py-2.5 text-xs font-bold" style={{ color: "var(--m-text)" }}>
      <span className="mt-px shrink-0" style={{ color: "var(--m-accent-ink, var(--m-accent))" }}>
        <Icon name="warn" size={15} />
      </span>
      <span className="min-w-0">{children}</span>
    </p>
  );
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
  vatNumber = null,
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
  /** «شامل الضريبة» ادّعاء بضريبة — لا يُقال إلا لمطعمٍ له رقم ضريبي. */
  vatNumber?: string | null;
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
  // الأسعار غير الشاملة تُضاف إليها الضريبة هنا وفي الخادم بالصيغة نفسها
  // (`lib/vat.ts` ⟷ `_shared/vat.ts`) — فما يراه الزبون هو ما يُحصَّل.
  const totals = orderTotals(total, vatIncluded);
  const vatAdded = vatIncluded ? 0 : totals.vat;
  const count = rows.reduce((sum, r) => sum + r.line.qty, 0);
  // طبق حُذف أو نفد بعد وضعه في السلة — الدالة سترفض الطلب كله، فنمنع الضغط.
  const missing = rows.some((r) => !r.dish);
  const belowMin = minOrder > 0 && total < minOrder;
  const blocked = missing || belowMin || !acceptingOrders;
  /**
   * طلبٌ على الطاولة: كودها ممسوح (`?table=`) والطلب يُرسَل على واتساب.
   * ⚠️ كانت الترويسة «استلام من الفرع» دائماً — فالزبون الجالس يقرأ «استلام»
   * فوق «طاولة 7». والدفع الإلكتروني وحده استلامٌ بطبيعته (`paylink-order-create`
   * لا يعرف التوصيل إلى طاولة)، فيبقى على «استلام».
   */
  const dineIn = !!table && !payOn;

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

  const sar = en ? "SAR" : "ر.س";

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <span
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: "color-mix(in srgb, var(--m-text) 7%, transparent)", color: "var(--m-muted)" }}
        >
          <Icon name="bag" size={26} />
        </span>
        <p className="m-o-title text-sm font-black" style={{ color: "var(--m-text)" }}>
          {en ? "Your order is empty" : "طلبك فارغ"}
        </p>
        <p className="text-xs" style={{ color: "var(--m-muted)" }}>
          {en ? "Add items from the menu to get started." : "أضِف أصنافاً من المنيو لتبدأ."}
        </p>
      </div>
    );
  }

  return (
    <div className="m-order flex flex-col gap-3 pb-1">
      {/* ── طريقة الاستلام ─────────────────────────────────────────────
          الزبون يجب أن يعرف **كيف يصله طلبه** قبل أن يدفع، لا بعده. وهي
          حقيقة ثابتة هنا (استلام فقط) فتُعلَن لا تُسأل. محايدةٌ اللون: معلومة
          لا زرّ — ولون العلامة محفوظٌ لما يُضغط. */}
      <div className="m-o-card flex items-center gap-3 px-3.5 py-3">
        <span className="m-o-badge flex h-10 w-10 shrink-0 items-center justify-center">
          <Icon name={dineIn ? "plate" : "bag"} size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="m-o-title block text-sm font-black" style={{ color: "var(--m-text)" }}>
            {dineIn
              ? en
                ? `Order for table ${table}`
                : `طلب للطاولة ${table}`
              : en
                ? "Pickup from branch"
                : "استلام من الفرع"}
          </span>
          <span className="block truncate text-xs" style={{ color: "var(--m-muted)" }}>
            {restaurantName}
            {prepMinutes ? (en ? ` · ready in ~${prepMinutes} min` : ` · يجهز خلال ~${prepMinutes} دقيقة`) : ""}
          </span>
        </span>
        {table && !dineIn && (
          <span
            className="m-o-chip shrink-0 px-2.5 py-1 text-[11px] font-black"
            style={{ color: "var(--m-text)" }}
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
          className="min-h-8 text-[11px] font-bold underline underline-offset-2"
          style={{ color: "var(--m-muted)" }}
        >
          {en ? "Clear all" : "إفراغ السلة"}
        </button>
      </div>

      <ul className="m-o-lines flex flex-col gap-2">
        {rows.map((r) => {
          const gone = !r.dish;
          return (
            <li
              key={`${r.line.dish_id}-${r.index}`}
              className="m-o-card m-o-line flex items-center gap-3 px-3 py-2.5"
              style={{ opacity: gone ? 0.6 : 1 }}
            >
              {/* الصورة تجعل المراجعة بصرية: الزبون يتعرّف على ما طلبه بلمحة. */}
              {r.dish?.image?.trim() ? (
                <img src={r.dish.image} alt="" loading="lazy" className="m-o-thumb h-14 w-14 shrink-0 object-cover" />
              ) : (
                // نفس الصورة المولَّدة التي في المنيو: الزبون يرى ما رآه هناك،
                // فلا تنقلب البطاقة إلى مربّع رمادي عند المراجعة.
                <DishArtwork
                  name={r.dish?.name ?? ""}
                  emoji={r.dish?.emoji}
                  glyphSize={24}
                  className="m-o-thumb h-14 w-14 shrink-0"
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
                <p dir="ltr" className="m-o-num mt-0.5 text-sm font-bold" style={{ color: "var(--m-text)", textAlign: "start" }}>
                  {formatPrice(r.total)} {sar}
                </p>
              </div>

              <div className="m-o-step flex shrink-0 items-center">
                {/* الكمية ١ ⇐ الزرّ سلّة مهملات لا «ناقص»: الإنقاص من واحد حذفٌ،
                    وإظهاره كإنقاص يجعل الزبون يضغط ويتساءل ماذا حدث. */}
                <button
                  onClick={() => cart.setQty(r.index, r.line.qty - 1)}
                  aria-label={r.line.qty === 1 ? (en ? "Remove" : "حذف") : en ? "Decrease" : "إنقاص"}
                  className="flex h-10 w-10 items-center justify-center"
                  style={{ color: r.line.qty === 1 ? "var(--m-muted)" : "var(--m-text)" }}
                >
                  <Icon name={r.line.qty === 1 ? "trash" : "minus"} size={16} />
                </button>
                <span className="m-o-num w-5 text-center text-sm font-black" style={{ color: "var(--m-text)" }}>
                  {r.line.qty}
                </span>
                <button
                  onClick={() => cart.setQty(r.index, r.line.qty + 1)}
                  aria-label={en ? "Increase" : "زيادة"}
                  disabled={gone}
                  className="flex h-10 w-10 items-center justify-center disabled:opacity-40"
                  style={{ color: "var(--m-text)" }}
                >
                  <Icon name="plus" size={16} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* ── ملاحظة الطلب ──────────────────────────────────────────────
          مطويّة افتراضاً: أغلب الطلبات بلا ملاحظة، وحقلٌ فارغ دائم الظهور
          يُطيل الشاشة بلا مقابل. ومن يحتاجها يجدها بسطر واحد. */}
      <div className="m-o-card px-3.5 py-2.5">
        <button
          onClick={() => setNoteOpen((v) => !v)}
          aria-expanded={noteOpen}
          className="flex min-h-10 w-full items-center gap-2.5 text-start"
        >
          <span className="shrink-0" style={{ color: "var(--m-muted)" }}>
            <Icon name="edit" size={16} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold" style={{ color: "var(--m-text)" }}>
              {en ? "Add a note" : "أضِف ملاحظة للطلب"}
            </span>
            <span className="block truncate text-[11px]" style={{ color: "var(--m-muted)" }}>
              {note.trim()
                ? note
                : en
                  ? "Allergies or special requests"
                  : "حساسية، أو طلب خاص"}
            </span>
          </span>
          <span className="m-o-caret shrink-0" style={{ color: "var(--m-muted)" }}>
            <Icon name="chevron" size={16} />
          </span>
        </button>
        {noteOpen && (
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 500))}
            rows={2}
            autoFocus
            placeholder={en ? "e.g. no onions, extra spicy" : "مثلاً: بدون بصل، حار زيادة"}
            className="m-o-field mt-2 w-full resize-none px-3 py-2 text-sm"
          />
        )}
      </div>

      {/* ── بيانات المستلِم ───────────────────────────────────────────
          «اختياري» في مطعم استلام مضلّل: الكاشير ينادي باسم، والمطعم يتصل
          حين يطول الانتظار. فالحقلان مطلوبان بلا نجمة تخيف — والنصّ يشرح
          لماذا بدل أن يأمر. */}
      <div className="m-o-card px-3.5 py-3">
        <p className="m-o-title text-sm font-black" style={{ color: "var(--m-text)" }}>
          {dineIn ? (en ? "Who's ordering?" : "باسم من الطلب؟") : en ? "Who's picking up?" : "من سيستلم الطلب؟"}
        </p>
        <p className="mt-0.5 text-[11px]" style={{ color: "var(--m-muted)" }}>
          {dineIn
            ? en
              ? "So the staff can confirm your order."
              : "ليؤكّد لك المطعم طلبك."
            : en
              ? "So the cashier can call your name if needed."
              : "ليناديك الكاشير، ويتصل بك إن طال الانتظار."}
        </p>
        <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={en ? "Your name" : "اسمك"}
            aria-label={en ? "Your name" : "اسمك"}
            autoComplete="name"
            className="m-o-field min-h-11 px-3.5 py-2.5 text-sm"
          />
          <input
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/[^\d+]/g, ""))}
            placeholder={en ? "Mobile" : "جوالك"}
            aria-label={en ? "Mobile" : "جوالك"}
            dir="ltr"
            inputMode="tel"
            autoComplete="tel"
            className="m-o-field min-h-11 px-3.5 py-2.5 text-sm"
          />
        </div>
      </div>

      {/* ── الفاتورة ──────────────────────────────────────────────────
          الإجمالي الفرعي **حين يختلف** عن الإجمالي وحده: كان يُعرض دائماً،
          فيقرأ الزبون الرقم نفسه مرّتين ويسأل أين الفرق. والفرق الوحيد الممكن
          ضريبةٌ تُضاف فوق أسعارٍ غير شاملة — فحين تُضاف يظهر السطران فوقها. */}
      <div className="m-o-card m-o-bill px-3.5 py-3">
        {vatAdded > 0 && (
          <>
            <div className="flex items-center justify-between text-sm" style={{ color: "var(--m-muted)" }}>
              <span>{en ? "Subtotal" : "الإجمالي الفرعي"}</span>
              <span dir="ltr" className="m-o-num">
                {formatMoney(total, en)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm" style={{ color: "var(--m-muted)" }}>
              <span>{en ? "VAT (15%)" : "ضريبة القيمة المضافة ١٥٪"}</span>
              <span dir="ltr" className="m-o-num">
                {formatMoney(vatAdded, en)}
              </span>
            </div>
          </>
        )}
        <div
          className={`m-o-total flex items-center justify-between text-base font-black ${vatAdded > 0 ? "mt-2 pt-2" : ""}`}
          style={{ color: "var(--m-text)" }}
        >
          <span className="m-o-title">{en ? "Total" : "الإجمالي"}</span>
          <span dir="ltr" className="m-o-num">
            {formatPrice(totals.total)} {sar}
          </span>
        </div>
        {(!vatIncluded || isVatNumber(vatNumber)) && (
          <p className="mt-1 text-[11px]" style={{ color: "var(--m-muted)" }}>
            {vatIncluded
              ? en
                ? "VAT (15%) included"
                : "شامل ضريبة القيمة المضافة ١٥٪"
              : en
                ? "Prices exclude VAT — added above"
                : "الأسعار غير شاملة — أُضيفت الضريبة أعلاه"}
          </p>
        )}
      </div>

      {/* ── ما يمنع الإتمام، مشروحاً قبل الضغط لا بعده ─────────────── */}
      {!acceptingOrders && (
        <Notice>
          {en
            ? "The restaurant isn't accepting orders right now."
            : "المطعم لا يستقبل طلبات حالياً — جرّب لاحقاً."}
        </Notice>
      )}
      {belowMin && (
        <Notice>
          {en
            ? `Minimum order is ${formatPrice(minOrder)} SAR — add ${formatPrice(minOrder - total)} more.`
            : `أقل مبلغ للطلب ${formatPrice(minOrder)} ر.س — أضِف ${formatPrice(minOrder - total)} ر.س.`}
        </Notice>
      )}
      {missing && (
        <Notice>
          {en
            ? "An item is no longer available — remove it to continue."
            : "أحد الأصناف لم يعد متاحاً — احذفه لتُكمل."}
        </Notice>
      )}
      {error && <Notice>{error}</Notice>}

      {/* ── الإتمام ───────────────────────────────────────────────────
          الزرّ يحمل **المبلغ**: من يضغط «الدفع الآن» وحدها يضغط على المجهول،
          ومن يرى الرقم على الزرّ يضغط وهو مطمئن. وهو وحده بلون العلامة. */}
      {payOn && (
        <button
          onClick={pay}
          disabled={busy || blocked}
          className="m-o-cta flex min-h-14 w-full items-center justify-between gap-3 px-5 text-sm font-black disabled:opacity-50"
        >
          <span className="flex items-center gap-2">
            <Icon name="lock" size={16} />
            {busy
              ? en
                ? "Opening payment…"
                : "نفتح صفحة الدفع…"
              : en
                ? "Pay & order for pickup"
                : "ادفع واطلب للاستلام"}
          </span>
          <span dir="ltr" className="m-o-num">
            {formatPrice(totals.total)} {sar}
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
                  orderText({ restaurantName, rows, total: totals.total, vatAdded, table, name, mobile, en })
                )
          }
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={blocked}
          onClick={(e) => blocked && e.preventDefault()}
          className={`${payOn ? "m-o-ghost min-h-12" : "m-o-cta min-h-14"} flex w-full items-center justify-center gap-2 py-3 text-sm font-black aria-disabled:opacity-50`}
        >
          <Icon name="chat" size={16} />
          {en ? "Send order on WhatsApp" : "أرسل الطلب على واتساب"}
        </a>
      )}

      {/* ── هوامش الإتمام: سطران قصيران تحت الزرّ لا فقرةٌ وسط النموذج ──
          إشعار الجمع عند نقطة الجمع — نظام حماية البيانات يطلبه هنا لا في
          صفحة بعيدة، وهو يُقرأ قبل الضغط لأنه تحت الزرّ مباشرة. **المعنى نفسه
          بلا نقص**: الاسم والجوال إلى المطعم لتنفيذ الطلب، وإلى بوّابة الدفع إن
          دُفع إلكترونياً، والختم التلقائي (`mark_order_paid`) يُذكر صراحةً —
          إضافة رقم الزبون إلى بطاقة ولاء بلا علمه معالجةٌ لم يُخبَر بها. */}
      <div className="flex flex-col gap-1 px-1 text-center text-[11px] leading-relaxed" style={{ color: "var(--m-muted)" }}>
        {payOn && (
          <p className="flex items-center justify-center gap-1.5">
            <Icon name="lock" size={12} />
            {en ? "Card details go to the payment gateway only." : "بيانات بطاقتك في صفحة بوّابة الدفع وحدها."}
          </p>
        )}
        <p>
          {en
            ? "Your name and mobile go to the restaurant for your order (and to the payment gateway if you pay online); if it runs a loyalty card, paying stamps your number. "
            : "اسمك وجوالك للمطعم لتنفيذ طلبك (ولبوّابة الدفع إن دفعت إلكترونياً)، وإن كان للمطعم بطاقة ولاء خُتم لرقمك عند الدفع. "}
          <Link to="/privacy" className="underline underline-offset-2" style={{ color: "var(--m-text)" }}>
            {en ? "Privacy" : "الخصوصية"}
          </Link>
        </p>
      </div>
    </div>
  );
}

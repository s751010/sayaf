/**
 * paylink-order-create — دفع طلب زبون **لحساب المطعم نفسه**.
 *
 * ينشر بـ verify_jwt = false: الزبون في صفحة المنيو ليس مسجَّلاً.
 *
 * العقد:
 *   POST { restaurant_id, items: [{ dish_id, qty, option_ids }], table?, customer? }
 *   → 200 { url, transactionNo, amount }
 *
 * المبادئ الأمنية:
 *   1. **الأسعار تُعاد قراءتها من جدول `dishes`** — لا يُقبل أي سعر من العميل.
 *      هذا أهم فرق عن أي تنفيذ ساذج: بدونه يستطيع أي زائر تعديل جسم الطلب
 *      ودفع ريال واحد مقابل طلب بمئات.
 *   2. **بيانات اعتماد المطعم لا تُقرأ إلا هنا** بمفتاح الخدمة. جدول
 *      `restaurant_payment_settings` بلا أي سياسة قراءة لدور anon، والنسخة
 *      القديمة كانت ستضع المفتاح في `restaurants` المقروء علناً.
 *   3. الأصناف المطلوبة يجب أن تنتمي فعلاً لهذا المطعم وتكون متاحة.
 *
 * ═══ الطلب يُحفظ قبل أن يُدفع ═══
 *
 * كانت الدالة تُنشئ فاتورة وتنتهي — فالمال يصل حساب المطعم والطلب يضيع، ولا
 * يعرف التاجر أن أحداً طلب. الآن يُكتب صفّ `orders` بحالة `pending_payment`
 * **قبل** إنشاء الفاتورة، ويحمل لقطةً للأسماء والأسعار وقت الطلب. فحتى لو
 * انقطع الاتصال بعد الدفع، الطلب موجود و`order-verify` تُكمله.
 */
import { createClient } from "jsr:@supabase/supabase-js@2";
import { addInvoice, PAYLINK_MIN_AMOUNT } from "../_shared/paylink.ts";
// ⚠️ التحليل مستخرَج إلى ملفّ مشترك ليستورده فحص التكافؤ مع نسخة الواجهة
// (`app/src/lib/options.ts`). كان مكتوباً هنا بيد، وتباعدَ فعلاً في معالجة
// السعر النصّي — انظر رأس الملفّ المشترك.
import { parseDishOptions, type DishOption } from "../_shared/options.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json", ...extra },
  });
}

/** حد أقصى معقول لعدد الأسطر والكميات — يمنع طلبات عبثية ضخمة. */
const MAX_LINES = 50;
const MAX_QTY = 99;

type RequestedItem = { dish_id: string; qty: number; option_ids: string[] };

function parseItems(raw: unknown): RequestedItem[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_LINES) return null;
  const items: RequestedItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") return null;
    const { dish_id, qty, option_ids } = entry as Record<string, unknown>;
    if (typeof dish_id !== "string" || !dish_id) return null;
    const quantity = Number(qty);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY) return null;

    const ids = Array.isArray(option_ids)
      ? option_ids.filter((v): v is string => typeof v === "string")
      : [];
    if (ids.length > 30) return null;
    items.push({ dish_id, qty: quantity, option_ids: ids });
  }
  return items;
}

/**
 * سعر الإضافات المختارة، محسوباً من خيارات الطبق المخزَّنة لا من العميل.
 * أي معرّف لا يطابق خياراً حقيقياً في هذا الطبق يُرفض الطلب بسببه، فلا يمكن
 * حقن إضافة بسعر سالب أو اختلاق خيار.
 */
function optionsSurcharge(
  rawOptions: string | null,
  selectedIds: string[]
): { extra: number; labels: string[] } | null {
  if (selectedIds.length === 0) return { extra: 0, labels: [] };
  if (!rawOptions) return null;

  const options = parseDishOptions(rawOptions);
  if (options.length === 0) return null;

  let extra = 0;
  const labels: string[] = [];
  const seen = new Set<string>();
  for (const id of selectedIds) {
    if (seen.has(id)) return null; // نفس الإضافة مرتين = طلب مُلفَّق
    seen.add(id);

    const index = Number(id);
    if (!Number.isInteger(index) || index < 0 || index >= options.length) return null;

    const option = options[index];
    if (option.price < 0) return null;
    extra += option.price;
    labels.push(option.name);
  }
  return { extra, labels };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST فقط." }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "جسم الطلب غير صالح." }, 400);
  }

  const restaurantId = String(body.restaurant_id ?? "").trim();
  // ⚠️ يُفحص الشكل قبل أي استعلام: `order_rate_hit` تستقبل `uuid`، فنصّ مشوّه
  // يرفع خطأ داخلها فيخرج ٥٠٣ («عطل عندنا») بدل ٤٠٠ («طلبك خاطئ») — ويستهلك
  // رحلة قاعدة بيانات على مدخَل مرفوض أصلاً.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(restaurantId)) {
    return json({ error: "مطعم غير معروف." }, 400);
  }

  const items = parseItems(body.items);
  if (!items) return json({ error: "سلة غير صالحة." }, 400);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  /**
   * ── حدّ المعدّل ─────────────────────────────────────────────────────
   *
   * ⚠️ هذه الدالة **مجهولة تماماً** (`verify_jwt = false`) — وهذا صحيح: زبون
   * المطعم لا حساب له. لكنها كانت **بلا أي حدّ**، وكل نداء ناجح يُنشئ فاتورة
   * PayLink حقيقية على **حساب التاجر** لا حسابنا. أي أن حلقة واحدة تُغرق لوحة
   * تاجر بفواتير وهمية وتستهلك حصّته عند البوّابة.
   *
   * المفتاح **المطعم** لا الزائر: الزائر مجهول بالتصميم ولا مرساة له نثق بها
   * (الترويسات تُزوَّر)، والمتضرّر هو التاجر — فالسقف يحمي حسابه هو.
   *
   * والحدّ **قبل قراءة بيانات الاعتماد**: لا يجوز أن يُجبر مُغرِقٌ الخادمَ على
   * لمس `secret_key` أصلاً.
   *
   * ٣٠ في الدقيقة للمطعم الواحد: أعلى بمراحل من ذروة مطعم ممتلئ يطلب زبائنه
   * إلكترونياً، وأخفض بمراحل مما يبلغه سكربت.
   */
  const { data: allowed, error: rateErr } = await admin.rpc("order_rate_hit", {
    p_restaurant: restaurantId,
    p_limit: 30,
  });
  if (rateErr) {
    // فشل العدّاد لا يفتح الباب: هذه نقطة تُنشئ التزاماً مالياً، فالإغلاق
    // عند الشكّ أرخص من الفتح عنده.
    console.error("order_rate_hit:", rateErr.message);
    return json({ error: "تعذّر إنشاء الطلب الآن. حاول بعد قليل." }, 503);
  }
  if (allowed === false) {
    return json({ error: "طلبات كثيرة على هذا المطعم — حاول بعد دقيقة." }, 429, {
      "Retry-After": "60",
    });
  }

  // ── بيانات اعتماد المطعم (لا تغادر الخادم أبداً) ──────────────────────
  const { data: settingsRows } = await admin
    .from("restaurant_payment_settings")
    .select("api_id, secret_key, enabled")
    .eq("restaurant_id", restaurantId)
    .limit(1);

  const settings = settingsRows?.[0] as
    | { api_id: string | null; secret_key: string | null; enabled: boolean }
    | undefined;

  if (!settings?.enabled || !settings.api_id || !settings.secret_key) {
    return json({ error: "الدفع الإلكتروني غير مفعّل لهذا المطعم." }, 409);
  }

  // ── الأسعار من قاعدة البيانات، لا من العميل ──────────────────────
  const { data: dishRows } = await admin
    .from("dishes")
    .select("id, name, price, available, options, restaurant_id")
    .in("id", items.map((i) => i.dish_id))
    .eq("restaurant_id", restaurantId);

  const dishes = (dishRows ?? []) as {
    id: string;
    name: string;
    price: number | null;
    available: boolean | null;
    options: string | null;
  }[];
  const byId = new Map(dishes.map((d) => [d.id, d]));

  const products: { title: string; price: number; qty: number }[] = [];
  let amount = 0;
  for (const item of items) {
    const dish = byId.get(item.dish_id);
    if (!dish) return json({ error: "أحد الأصناف لم يعد متاحاً." }, 409);
    if (dish.available === false) {
      return json({ error: `«${dish.name}» لم يعد متاحاً.` }, 409);
    }
    const base = Number(dish.price ?? 0);
    if (!(base > 0)) return json({ error: `«${dish.name}» بلا سعر.` }, 409);

    const options = optionsSurcharge(dish.options, item.option_ids);
    if (!options) return json({ error: `خيارات «${dish.name}» غير صالحة.` }, 409);

    const unitPrice = Math.round((base + options.extra) * 100) / 100;
    const title = options.labels.length
      ? `${dish.name} (${options.labels.join("، ")})`
      : dish.name;

    products.push({ title, price: unitPrice, qty: item.qty });
    amount += unitPrice * item.qty;
  }

  amount = Math.round(amount * 100) / 100;
  if (amount < PAYLINK_MIN_AMOUNT) {
    return json(
      { error: `أقل مبلغ للدفع الإلكتروني ${PAYLINK_MIN_AMOUNT} ر.س.` },
      400
    );
  }

  const { data: restRows } = await admin
    .from("restaurants")
    .select("name, slug, prices_include_vat")
    .eq("id", restaurantId)
    .limit(1);
  const restaurant = restRows?.[0] as
    | { name: string; slug: string | null; prices_include_vat: boolean | null }
    | undefined;

  const table = String(body.table ?? "").replace(/\D/g, "").slice(0, 3);
  const customer = (body.customer ?? {}) as Record<string, unknown>;
  const clientName = String(customer.name ?? "").trim().slice(0, 60) || "زبون";
  const clientMobile =
    String(customer.mobile ?? "").replace(/\D/g, "").slice(0, 15) || "0500000000";
  const note = String(body.note ?? "").trim().slice(0, 500) || null;

  // ── الطلب يُحفظ أولاً ────────────────────────────────────────────────
  // `place_order` تولّد رقم الاستلام تحت قفل استشاري على المطعم، فطلبان
  // متزامنان لا يأخذان الرقم نفسه — وهو خطأ لا يظهر إلا في الذروة.
  const { data: placed, error: placeErr } = await admin.rpc("place_order", {
    p_restaurant: restaurantId,
    p_items: products.map((line, i) => ({
      dish_id: items[i].dish_id,
      name: line.title,
      options_label: null,
      unit_price: line.price,
      qty: line.qty,
    })),
    p_subtotal: amount,
    p_total: amount,
    p_vat_included: restaurant?.prices_include_vat !== false,
    p_name: String(customer.name ?? "").trim().slice(0, 60) || null,
    p_phone: String(customer.mobile ?? "").replace(/\D/g, "").slice(0, 20) || null,
    p_note: note,
  });

  const order = placed as { id: string; code: number } | null;
  if (placeErr || !order?.id) {
    console.error("place_order:", placeErr?.message ?? "لم يُعَد صفّ");
    return json({ error: "تعذّر تسجيل الطلب. حاول مجدداً." }, 500);
  }

  const siteUrl = (Deno.env.get("SITE_URL") ?? "").replace(/\/+$/, "");
  const menuPath = restaurant?.slug ? `/${restaurant.slug}` : "/";

  try {
    const invoice = await addInvoice(
      {
        // رقم طلب مستقل عن ترميز الاشتراكات — هذه دفعة لحساب المطعم لا للمنصّة.
        // معرّف الطلب داخل رقم الفاتورة: يربط الدفعة بالصفّ بلا جدول وسيط،
        // ويجعل كشف حساب PayLink مقروءاً عند مطابقة الحسابات.
        orderNumber: `cmo~${order.id}`,
        amount,
        callBackUrl: `${siteUrl}${menuPath}?order=paid&o=${order.id}`,
        cancelUrl: `${siteUrl}${menuPath}?order=cancelled&o=${order.id}`,
        clientName,
        clientMobile,
        products,
        note: table ? `طاولة ${table}` : undefined,
      },
      { apiId: settings.api_id, secretKey: settings.secret_key }
    );

    // ربط العملية بالصفّ فوراً: `order-verify` تقرأ `payment_ref` من هنا،
    // فلا تحتاج أن يعيد المتصفح رقماً قد لا يعود به أصلاً.
    await admin
      .from("orders")
      .update({ payment_ref: invoice.transactionNo })
      .eq("id", order.id);

    return json({
      url: invoice.url,
      transactionNo: invoice.transactionNo,
      amount,
      order_id: order.id,
      code: order.code,
    });
  } catch (err) {
    console.error("paylink-order-create:", err instanceof Error ? err.message : err);
    // الفاتورة لم تُنشأ ⇒ الطلب المعلَّق لا معنى له. حذفه أنظف من تركه يتراكم.
    await admin.from("orders").delete().eq("id", order.id).eq("status", "pending_payment");
    return json({ error: "تعذّر بدء الدفع. جرّب مرة أخرى أو اطلب عبر واتساب." }, 502);
  }
});

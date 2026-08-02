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
 */
import { createClient } from "jsr:@supabase/supabase-js@2";
import { addInvoice, PAYLINK_MIN_AMOUNT } from "../_shared/paylink.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
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

type DishOption = { name: string; price: number };

/**
 * قراءة `dishes.options` **بنفس منطق `app/src/lib/options.ts` حرفياً**.
 *
 * ⚠️ هذا ليس تفصيلاً: المعرّف الذي يرسله العميل هو **موضع** الخيار في المصفوفة
 * الناتجة، فلو اختلف التحليل بين الطرفين لأشار الرقم إلى خيار آخر — أو رُفض
 * الطلب كله. النسخة الأولى من هذه الدالة افترضت شكلاً مُجمَّعاً
 * (`[{ items: [{ id, … }] }]`) لا يكتبه أحد، فكان أي طلب بإضافة يُرفض دائماً.
 *
 * الصيغة المعتمدة: JSON `[{name, price?}]`، مع تسامح مع النص الحر المفصول
 * بأسطر/فواصل لأن صفوفاً قديمة كُتبت هكذا.
 */
function parseDishOptions(raw: string | null): DishOption[] {
  if (!raw?.trim()) return [];
  try {
    const v: unknown = JSON.parse(raw);
    if (Array.isArray(v)) {
      return v
        .map((o): DishOption | null => {
          if (typeof o === "string") {
            return o.trim() ? { name: o.trim(), price: 0 } : null;
          }
          if (o && typeof o === "object") {
            const rec = o as Record<string, unknown>;
            const name = typeof rec.name === "string" ? rec.name.trim() : "";
            if (!name) return null;
            const price = Number(rec.price);
            return { name, price: Number.isFinite(price) ? price : 0 };
          }
          return null;
        })
        .filter((o): o is DishOption => o !== null);
    }
  } catch {
    /* ليس JSON — نعامله كنص حر */
  }
  return raw
    .split(/[\n,،]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => ({ name, price: 0 }));
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
  if (!restaurantId) return json({ error: "مطعم غير معروف." }, 400);

  const items = parseItems(body.items);
  if (!items) return json({ error: "سلة غير صالحة." }, 400);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

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
    .select("name, slug")
    .eq("id", restaurantId)
    .limit(1);
  const restaurant = restRows?.[0] as { name: string; slug: string | null } | undefined;

  const table = String(body.table ?? "").replace(/\D/g, "").slice(0, 3);
  const customer = (body.customer ?? {}) as Record<string, unknown>;
  const clientName = String(customer.name ?? "").trim().slice(0, 60) || "زبون";
  const clientMobile =
    String(customer.mobile ?? "").replace(/\D/g, "").slice(0, 15) || "0500000000";

  const siteUrl = (Deno.env.get("SITE_URL") ?? "").replace(/\/+$/, "");
  const menuPath = restaurant?.slug ? `/${restaurant.slug}` : "/";

  try {
    const invoice = await addInvoice(
      {
        // رقم طلب مستقل عن ترميز الاشتراكات — هذه دفعة لحساب المطعم لا للمنصّة.
        orderNumber: `order-${restaurantId.slice(0, 8)}-${Date.now().toString(36)}`,
        amount,
        callBackUrl: `${siteUrl}${menuPath}?order=paid`,
        cancelUrl: `${siteUrl}${menuPath}?order=cancelled`,
        clientName,
        clientMobile,
        products,
        note: table ? `طاولة ${table}` : undefined,
      },
      { apiId: settings.api_id, secretKey: settings.secret_key }
    );

    return json({
      url: invoice.url,
      transactionNo: invoice.transactionNo,
      amount,
    });
  } catch (err) {
    console.error("paylink-order-create:", err instanceof Error ? err.message : err);
    return json({ error: "تعذّر بدء الدفع. جرّب مرة أخرى أو اطلب عبر واتساب." }, 502);
  }
});

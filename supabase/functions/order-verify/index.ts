/**
 * order-verify — تحويل دفعة زبون إلى طلبٍ مؤكَّد.
 *
 * ينشر بـ verify_jwt = false: الزبون في صفحة المنيو ليس مسجَّلاً.
 *
 * العقد:
 *   POST { order_id }  →  200 { code, status, total, items, restaurant }
 *
 * ═══ لماذا دالة تحقّق لا ويبهوك ═══
 *
 * فاتورة الاشتراك تُنشأ على حساب **المنصّة**، فويبهوك واحد يخدمها كلّها.
 * أما فاتورة طلب الزبون فتُنشأ على حساب **المطعم** — ولا يعرف عنها حساب
 * المنصّة شيئاً. فالويبهوك كان سيلزم كل تاجر بضبط رابط في لوحة PayLink
 * الخاصة به، وأغلبهم لن يفعل، وطلبات من لم يفعل تبقى معلّقة إلى الأبد.
 *
 * فالسؤال يُقلب: بدل انتظار PayLink أن تخبرنا، نسأل نحن — بمفاتيح **ذلك
 * المطعم** — حين يعود الزبون، وحين يفتح التاجر لوحة الطلبات.
 *
 * ═══ المبادئ ═══
 *
 *   1. **لا يُصدَّق العميل في شيء.** يرسل `order_id` فقط؛ ورقم العملية
 *      والمبلغ والمطعم كلّها تُقرأ من الصفّ المحفوظ، والحالة من PayLink.
 *   2. **متكافئة.** `mark_order_paid` تشترط `pending_payment`، فالنداء
 *      الثاني لا يُغيّر شيئاً — والزبون قد يحدّث الصفحة عشر مرات.
 *   3. **لا تكشف شيئاً عن طلب لم يُدفع.** فمن يجرّب معرّفات عشوائية لا يحصد
 *      إلا 404.
 */
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getInvoice, isPaid } from "../_shared/paylink.ts";

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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST فقط." }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "جسم الطلب غير صالح." }, 400);
  }

  const orderId = String(body.order_id ?? "").trim();
  if (!UUID.test(orderId)) return json({ error: "طلب غير معروف." }, 400);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const { data: rows } = await admin
    .from("orders")
    .select("id, restaurant_id, status, payment_ref")
    .eq("id", orderId)
    .limit(1);

  const order = rows?.[0] as
    | { id: string; restaurant_id: string; status: string; payment_ref: string | null }
    | undefined;
  if (!order) return json({ error: "طلب غير معروف." }, 404);

  // دُفع سابقاً (أو أُلغي): نُرجع الحالة كما هي بلا سؤال PayLink مجدداً.
  if (order.status !== "pending_payment") {
    const { data: view } = await admin.rpc("order_public_status", { p_order: orderId });
    return json(view ?? { error: "طلب غير معروف." }, view ? 200 : 404);
  }

  if (!order.payment_ref) return json({ error: "لم تبدأ عملية دفع لهذا الطلب." }, 409);

  // ── مفاتيح المطعم — لا تغادر الخادم ────────────────────────────────
  const { data: credRows } = await admin
    .from("restaurant_payment_settings")
    .select("api_id, secret_key")
    .eq("restaurant_id", order.restaurant_id)
    .limit(1);

  const creds = credRows?.[0] as { api_id: string | null; secret_key: string | null } | undefined;
  if (!creds?.api_id || !creds.secret_key) {
    console.error("order-verify: بيانات اعتماد المطعم غير مضبوطة", order.restaurant_id);
    return json({ error: "تعذّر التحقق من الدفع. راجع المطعم." }, 409);
  }

  let invoice;
  try {
    invoice = await getInvoice(order.payment_ref, {
      apiId: creds.api_id,
      secretKey: creds.secret_key,
    });
  } catch (err) {
    console.error("order-verify getInvoice:", err instanceof Error ? err.message : err);
    return json({ error: "تعذّر التحقق من الدفع الآن. حدّث الصفحة بعد قليل." }, 502);
  }

  if (!isPaid(invoice.orderStatus)) {
    // لم يُدفع بعد — ليس خطأ: الزبون قد يكون ألغى أو ما زال في البوّابة.
    return json({ pending: true, status: "pending_payment" }, 200);
  }

  const { error: markErr } = await admin.rpc("mark_order_paid", {
    p_order: orderId,
    p_ref: order.payment_ref,
  });
  if (markErr) {
    console.error("mark_order_paid:", markErr.message);
    return json({ error: "تعذّر تأكيد الطلب. راسل المطعم برقم العملية." }, 500);
  }

  const { data: view } = await admin.rpc("order_public_status", { p_order: orderId });
  return json(view ?? { error: "طلب غير معروف." }, view ? 200 : 404);
});

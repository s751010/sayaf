/**
 * paylink-webhook — المكان **الوحيد** الذي يُفعَّل فيه اشتراك.
 *
 * ينشر بـ verify_jwt = false (PayLink تستدعيه بلا رمز مستخدم).
 *
 * ⚠️ ويبهوك PayLink بلا توقيع ولا هاش — أي جهة تقدر تستدعي هذا الرابط بجسم
 * مزوَّر. لذلك **لا يُصدَّق جسم الطلب إطلاقاً**؛ يُؤخذ منه `transactionNo`
 * فقط كمؤشّر، ثم تُسأل PayLink بمفاتيحنا الخاصة عن حالة الفاتورة الحقيقية،
 * ويُقارَن رقم الطلب المحفوظ داخل الفاتورة نفسها بما وصلنا. الفاتورة لا يمكن
 * إنشاؤها تحت حسابنا بلا `PAYLINK_SECRET_KEY`، وهذا هو أساس الثقة.
 *
 * ⚠️ **مصدر هذا الملفّ كان مفقوداً من المستودع.** الدالة منشورة وتعمل منذ
 * ٢٦ يوليو، لكن مصدرها عاش على فرع `web/` وحده — أي أن حذفها من لوحة
 * Supabase كان يعني ضياع الشيفرة التي تُفعِّل كل اشتراك. أُعيد هنا.
 *
 * كما أن الدالة **متكافئة (idempotent)**: PayLink تعيد المحاولة حتى ١٠ مرات،
 * فنتحقق من `payment_ref` قبل إنشاء أي صف.
 */
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getInvoice, isPaid, PAYLINK_MIN_AMOUNT } from "../_shared/paylink.ts";
import { cycleDays, listPrice, parseOrderNumber, planName } from "../_shared/plans.ts";

/** نردّ 200 دائماً على الحالات المفهومة حتى لا تُعيد PayLink المحاولة بلا داعٍ. */
function ok(note: string): Response {
  return new Response(JSON.stringify({ received: true, note }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("POST only", { status: 405 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response("bad body", { status: 400 });
  }

  const transactionNo = String(body.transactionNo ?? "").trim();
  if (!transactionNo) return new Response("missing transactionNo", { status: 400 });

  // ── التحقق الموثوق: نسأل PayLink بأنفسنا ─────────────────────────────
  let invoice;
  try {
    invoice = await getInvoice(transactionNo);
  } catch (err) {
    console.error("getInvoice:", err instanceof Error ? err.message : err);
    // خطأ عابر من جهتنا — نرجع 500 ليعيد PayLink المحاولة.
    return new Response("verify failed", { status: 500 });
  }

  if (!isPaid(invoice.orderStatus)) {
    return ok(`تُجوهلت: حالة الفاتورة ${invoice.orderStatus}`);
  }

  // رقم الطلب يُؤخذ من الفاتورة الحقيقية، لا من جسم الويبهوك.
  const invoiceOrderNumber = invoice.gatewayOrderRequest?.orderNumber ?? "";
  const claimedOrderNumber = String(body.merchantOrderNumber ?? "");
  if (claimedOrderNumber && invoiceOrderNumber && claimedOrderNumber !== invoiceOrderNumber) {
    console.error("order number mismatch", { transactionNo });
    return ok("تُجوهلت: عدم تطابق رقم الطلب");
  }

  const parsed = parseOrderNumber(invoiceOrderNumber || claimedOrderNumber);
  if (!parsed) return ok("تُجوهلت: رقم طلب من خارج كلاود منيو");

  const { userId, planId, cycle, promoCode } = parsed;
  const amount = Number(invoice.amount ?? invoice.gatewayOrderRequest?.amount ?? 0);

  // ── حارس المبلغ ──────────────────────────────────────────────────────
  //
  // ⚠️ **لا تُطابَق المساواة التامّة عمداً.** المبلغ المشروع ليس رقماً واحداً:
  // `paylink-create` يخصم نسبة كود الخصم وقت الإنشاء، والكود قد يُبطَل أو
  // تتغيّر نسبته أو ينتهي بين الإنشاء والدفع — فمطابقةُ السعر القائم كانت
  // سترفض فاتورة صحيحة دُفعت فعلاً (وهذا بالضبط ما كان `moyasar-webhook`
  // يفعله بجدول أسعار قديم: يرفض كل دفعة صحيحة).
  //
  // فالمقبول **مدى**: من الحدّ الأدنى الذي يقبله PayLink (وهو أرضية
  // `paylink-create` عند خصم ١٠٠٪) إلى السعر القائم بلا خصم. وما فوق السعر
  // القائم ليس دفعةً لهذه الباقة — أيّاً كان مصدره.
  //
  // والحارس دفاعٌ بعمق لا خطّ أوّل: الفاتورة لا تُنشأ بلا `PAYLINK_SECRET_KEY`،
  // والمبلغ يُحسب في الخادم. لكن شبكة الأمان تُوضع قبل أن تُحتاج.
  const ceiling = listPrice(planId, cycle);
  if (!Number.isFinite(amount) || amount < PAYLINK_MIN_AMOUNT || amount > ceiling) {
    console.error("amount out of range", { transactionNo, amount, ceiling });
    return ok("تُجوهلت: مبلغ خارج المدى المقبول للباقة");
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  // ── تكافؤ: هل عُولجت هذه العملية سابقاً؟ ─────────────────────────────
  const { data: existing } = await admin
    .from("subscriptions")
    .select("id")
    .eq("payment_ref", transactionNo)
    .limit(1);
  if (existing?.length) return ok("عُولجت سابقاً");

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + cycleDays(cycle));

  // اشتراك جديد يُلغي السابق النشط لنفس المستخدم (ترقية أو تجديد).
  const { error: deactivateErr } = await admin
    .from("subscriptions")
    .update({ active: false })
    .eq("user_id", userId)
    .eq("active", true);
  if (deactivateErr) console.error("deactivate:", deactivateErr.message);

  const { error: subErr } = await admin.from("subscriptions").insert({
    user_id: userId,
    plan_id: planId,
    payment_ref: transactionNo,
    end_date: endDate.toISOString(),
    active: true,
  });
  if (subErr) {
    console.error("insert subscription:", subErr.message);
    return new Response("insert failed", { status: 500 });
  }

  // ── سجل الإيراد (أفضل جهد — لا يُفشل التفعيل) ────────────────────────
  const { data: rest } = await admin
    .from("restaurants")
    .select("name")
    .eq("user_id", userId)
    .limit(1);

  const { error: revErr } = await admin.from("revenue_log").insert({
    user_id: userId,
    user_name: rest?.[0]?.name ?? null,
    plan_id: planId,
    plan_name: planName(planId),
    amount,
    payment_ref: transactionNo,
    action: "subscribe",
  });
  if (revErr) console.error("revenue_log:", revErr.message);

  // ── احتساب استخدام كود الخصم بعد نجاح الدفع فقط ──────────────────────
  //
  // ⚠️ الزيادة **ذرّية عبر `promo_use`** لا قراءةً ثمّ كتابة. كانت الدالة
  // تقرأ `uses` ثم تكتب `uses + 1`: دفعتان تصلان معاً تقرآن الرقم نفسه
  // فتكتبانه نفسه، فيُحتسب استخدام واحد لاثنين — و`max_uses` يُتجاوَز بصمت.
  // وPayLink تعيد المحاولة حتى ١٠ مرات، فالتزامن هنا ليس فرضاً نظرياً.
  if (promoCode) {
    const { data: promoRows } = await admin
      .from("promo_codes")
      .select("id")
      .ilike("code", promoCode)
      .limit(1);
    const promo = promoRows?.[0] as { id: string } | undefined;
    if (promo) {
      const { error: promoErr } = await admin.rpc("promo_use", { p_id: promo.id });
      if (promoErr) console.error("promo_use:", promoErr.message);
    }
  }

  return ok("فُعِّل الاشتراك");
});

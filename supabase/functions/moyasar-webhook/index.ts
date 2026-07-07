// ════════════════════════════════════════════════════════════
//  Edge Function: moyasar-webhook (v3 — مقوّاة)
//  شبكة أمان لحالة إغلاق العميل التبويب قبل صفحة الرجوع:
//  عند نجاح دفعة في Moyasar → تفعيل idempotent للاشتراك.
//
//  الأمان (v3):
//  1) رفض أي طلب لا يحمل secret_token المطابق لسر MOYASAR_WEBHOOK_SECRET
//     (يُضبط نفسه في لوحة Moyasar → Webhooks).
//  2) دفاع بعمق: لا نثق بحمولة الطلب — نعيد جلب الدفعة من Moyasar API
//     بالمفتاح السرّي ونعتمد ردّه فقط (الحالة/المبلغ/الـmetadata).
//  3) idempotency: الفهرس الفريد على subscriptions.payment_ref يمنع
//     التفعيل المزدوج (webhook + verify في دالة payments).
//
//  يُنشر بـ verify_jwt=false لأن Moyasar لا يرسل JWT — المصادقة تتم
//  عبر secret_token أعلاه (النمط القياسي للـwebhooks).
//
//  التسعير يطابق web/src/lib/plans.ts (قاعدة CLAUDE.md).
//  المسار: supabase/functions/moyasar-webhook/index.ts — يُنشر عبر MCP.
// ════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const YEARLY_MONTHS = 11; // الاشتراك السنوي = 11 شهراً مدفوعة (شهر مجاني)
const PRICES: Record<string, { monthly: number; yearly: number }> = {
  standard: { monthly: 99, yearly: 99 * YEARLY_MONTHS },
  premium: { monthly: 199, yearly: 199 * YEARLY_MONTHS },
};
const PLAN_NAMES: Record<string, string> = {
  standard: "الأساسية",
  premium: "الاحترافية",
};

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const WEBHOOK_SECRET = Deno.env.get("MOYASAR_WEBHOOK_SECRET");
    const MOYASAR_SK = Deno.env.get("MOYASAR_SK");
    if (!WEBHOOK_SECRET || !MOYASAR_SK) {
      // بدون السرّين لا يمكن التحقق — نرفض كل شيء (تدهور آمن)
      return json({ error: "webhook_unconfigured" }, 503);
    }

    const event = (await req.json()) as Record<string, unknown>;

    // 1) مصادقة الرمز السرّي المضبوط في لوحة Moyasar
    if (event.secret_token !== WEBHOOK_SECRET) {
      return json({ error: "unauthorized" }, 401);
    }

    const payload = (event.data ?? event) as Record<string, unknown>;
    const paymentId = String(payload.id ?? "");
    if (!paymentId) return json({ error: "payment_id_missing" }, 400);

    // 2) لا نثق بالحمولة — نعيد جلب الدفعة من Moyasar API
    const res = await fetch(
      `https://api.moyasar.com/v1/payments/${encodeURIComponent(paymentId)}`,
      { headers: { Authorization: `Basic ${btoa(`${MOYASAR_SK}:`)}` } }
    );
    if (!res.ok) return json({ error: `moyasar_fetch_failed:${res.status}` }, 502);
    const payment = (await res.json()) as Record<string, unknown>;

    if (payment.status !== "paid") {
      return json({ ok: true, skipped: "الدفعة غير مكتملة" });
    }

    const meta = (payment.metadata ?? {}) as Record<string, string>;
    const userId = meta.user_id;
    const planId = meta.plan_id;
    const cycle = meta.cycle === "yearly" ? "yearly" : "monthly";
    if (!userId || !PRICES[planId]) {
      return json({ error: "metadata_invalid" }, 400);
    }

    // مطابقة المبلغ المؤكد من ميسر (بالهللات) مع السعر المتوقع
    const amountSar = Number(payment.amount) / 100;
    if (Math.round(amountSar) !== PRICES[planId][cycle]) {
      return json({ error: "amount_mismatch" }, 400);
    }

    const supa = createClient(SUPABASE_URL, SERVICE_KEY);
    const now = new Date();
    const end = new Date(now);
    if (cycle === "yearly") end.setFullYear(end.getFullYear() + 1);
    else end.setMonth(end.getMonth() + 1);

    // 3) تفعيل idempotent — نفس payment_ref الذي تستخدمه دالة payments
    const { data: inserted, error } = await supa
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan_id: planId,
        end_date: end.toISOString(),
        active: true,
        payment_ref: `moyasar:${paymentId}`,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") return json({ ok: true, already: true });
      return json({ error: `subscription_insert_failed:${error.message}` }, 500);
    }

    await supa
      .from("subscriptions")
      .update({ active: false, cancelled_at: now.toISOString() })
      .eq("user_id", userId)
      .eq("active", true)
      .neq("id", inserted.id);

    const monthly = PRICES[planId].monthly;
    await supa.from("revenue_log").insert({
      user_id: userId,
      user_name: meta.user_name ?? "",
      plan_id: planId,
      plan_name: PLAN_NAMES[planId] ?? planId,
      amount: cycle === "yearly" ? monthly * YEARLY_MONTHS : monthly,
      payment_ref: `moyasar:${paymentId}`,
      action: cycle === "yearly" ? "subscribe_yearly" : "subscribe",
    });

    return json({ ok: true, activated: true });
  } catch (e) {
    console.error("moyasar-webhook error:", e);
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});

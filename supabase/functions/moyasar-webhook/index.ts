/**
 * `moyasar-webhook` — شبكة أمان لبوّابة Moyasar.
 *
 * ⚠️ **لم يكن لهذه الدالة مصدر في المستودع** حتى ٢٢/٠٨/٢٠٢٦. أُنزلت من لوحة
 * Supabase ليصير تغييرها قابلاً للمراجعة — وأوّل ما كشفته المراجعة أدناه.
 *
 * ═══ ⚠️ جدول أسعار قديم: كانت تحصّل ٩٩ والموقع يعرض ٥٩ ═══
 *
 * كانت تحمل نسختها الخاصّة من الأسعار (`standard` بـ٩٩ شهرياً و١٠٨٩ سنوياً،
 * و`premium` بـ١٩٩) — وهي أرقام **ما قبل** توحيد الباقات على ٥٩/٥٩٩. وأثر
 * ذلك ليس تجميلياً:
 *
 *   • فحص المبلغ `round(amount) !== PRICES[plan][cycle]` كان **يرفض كل دفعة
 *     صحيحة**: زبونٌ يدفع ٥٩ فتردّ الدالة `amount_mismatch` ولا يُفعَّل
 *     اشتراكه. أي أن شبكة الأمان كانت تُسقط ما جاءت لتلتقطه.
 *   • و`revenue_log.amount` كان سيُسجَّل ٩٩ لا ما دُفع فعلاً.
 *   • و`premium` بقيت **قابلة للدفع** رغم اختفائها من الواجهة.
 *
 * فالأسعار الآن من `_shared/plans.ts` وحده — نفس المصدر الذي يقرؤه
 * `paylink-create` و`paylink-webhook` (المسار الحيّ اليوم)، و`parity.test.ts`
 * يحرس تطابقه مع `app/src/lib/plans.ts`.
 *
 * ═══ الأمان ═══
 *
 * 1. رفض أي طلب لا يحمل `secret_token` المطابق لـ`MOYASAR_WEBHOOK_SECRET`،
 *    **بمقارنة زمن ثابت** (كانت `!==` — والمعيار في بقيّة الدوالّ `safeEqual`).
 * 2. دفاع بعمق: لا نثق بحمولة الطلب — نعيد جلب الدفعة من Moyasar API
 *    بالمفتاح السرّي ونعتمد ردّه وحده (الحالة/المبلغ/الـmetadata).
 * 3. تكافؤ: فهرس فريد على `subscriptions.payment_ref` يمنع التفعيل المزدوج.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isPlanId, listPrice, planName, type Cycle } from "../_shared/plans.ts";
import { safeEqual } from "../_shared/safe-equal.ts";

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
      // بدون السرّين لا يمكن التحقق — نرفض كل شيء (تدهور آمن).
      return json({ error: "webhook_unconfigured" }, 503);
    }

    const event = (await req.json()) as Record<string, unknown>;

    // 1) مصادقة الرمز السرّي المضبوط في لوحة Moyasar — بزمن ثابت.
    if (!safeEqual(String(event.secret_token ?? ""), WEBHOOK_SECRET)) {
      return json({ error: "unauthorized" }, 401);
    }

    const payload = (event.data ?? event) as Record<string, unknown>;
    const paymentId = String(payload.id ?? "");
    if (!paymentId) return json({ error: "payment_id_missing" }, 400);

    // 2) لا نثق بالحمولة — نعيد جلب الدفعة من Moyasar API.
    const res = await fetch(
      `https://api.moyasar.com/v1/payments/${encodeURIComponent(paymentId)}`,
      { headers: { Authorization: `Basic ${btoa(`${MOYASAR_SK}:`)}` } }
    );
    if (!res.ok) {
      console.error("moyasar getPayment:", res.status);
      return json({ error: "verify_failed" }, 502);
    }
    const payment = (await res.json()) as Record<string, unknown>;

    if (payment.status !== "paid") {
      return json({ ok: true, skipped: "الدفعة غير مكتملة" });
    }

    const meta = (payment.metadata ?? {}) as Record<string, string>;
    const userId = meta.user_id;
    const planId = meta.plan_id;
    const cycle: Cycle = meta.cycle === "yearly" ? "yearly" : "monthly";
    if (!userId || !isPlanId(planId)) {
      return json({ error: "metadata_invalid" }, 400);
    }

    // مطابقة المبلغ المؤكد من ميسر (بالهللات) مع السعر المتوقع من المصدر الواحد.
    const amountSar = Number(payment.amount) / 100;
    if (Math.round(amountSar) !== listPrice(planId, cycle)) {
      return json({ error: "amount_mismatch" }, 400);
    }

    const supa = createClient(SUPABASE_URL, SERVICE_KEY);
    const now = new Date();
    const end = new Date(now);
    if (cycle === "yearly") end.setFullYear(end.getFullYear() + 1);
    else end.setMonth(end.getMonth() + 1);

    // 3) تفعيل idempotent — نفس `payment_ref` الذي يستخدمه مسار التحقّق.
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
      console.error("subscription insert:", error.message);
      return json({ error: "activation_failed" }, 500);
    }

    await supa
      .from("subscriptions")
      .update({ active: false, cancelled_at: now.toISOString() })
      .eq("user_id", userId)
      .eq("active", true)
      .neq("id", inserted.id);

    // الإيراد المسجَّل = **المبلغ المدفوع فعلاً** كما أكّدته البوّابة.
    await supa.from("revenue_log").insert({
      user_id: userId,
      user_name: meta.user_name ?? "",
      plan_id: planId,
      plan_name: planName(planId),
      amount: amountSar,
      payment_ref: `moyasar:${paymentId}`,
      action: cycle === "yearly" ? "subscribe_yearly" : "subscribe",
    });

    return json({ ok: true, activated: true });
  } catch (e) {
    // ⚠️ التفصيل إلى السجلّ لا إلى العميل: كان يُعاد `String(e.message)` خاماً.
    console.error("moyasar-webhook:", e instanceof Error ? e.message : e);
    return json({ error: "internal" }, 500);
  }
});

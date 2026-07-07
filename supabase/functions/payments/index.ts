// ════════════════════════════════════════════════════════════
//  Edge Function: payments — المسار الوحيد لتفعيل الاشتراكات
//
//  op=create : ينشئ صفحة دفع مستضافة لدى البوابة النشطة
//              (من site_settings.features.payment_provider)
//              ويرجع رابط التحويل. السعر يُحسب سيرفرياً.
//  op=verify : يتحقق من الدفعة سيرفر-لسيرفر بالمفتاح السرّي ثم
//              يفعّل الاشتراك ويسجّل الإيراد بشكل idempotent
//              (فهرس فريد على subscriptions.payment_ref).
//
//  لا شيء يُرسل من العميل يُعتمد عليه للتفعيل: الخطة والمستخدم
//  والدورة تُقرأ من orderRef الذي رمّزناه سيرفرياً وقت الإنشاء
//  وترجعه البوابة نفسها (أو من metadata ميسر المؤكدة من API).
//
//  المسار: supabase/functions/payments/index.ts — يُنشر عبر MCP.
// ════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  createPayment,
  moyasarVerify,
  verifyPayment,
  UnconfiguredError,
  type ProviderId,
} from "./providers.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// التسعير الموحّد — يجب أن يطابق web/src/lib/plans.ts حرفياً (قاعدة CLAUDE.md)
const YEARLY_MONTHS = 11; // الاشتراك السنوي = 11 شهراً مدفوعة (شهر مجاني)
const PRICES: Record<string, { monthly: number; yearly: number }> = {
  standard: { monthly: 99, yearly: 99 * YEARLY_MONTHS },
  premium: { monthly: 199, yearly: 199 * YEARLY_MONTHS },
};
const PLAN_NAMES: Record<string, string> = {
  standard: "الأساسية",
  premium: "الاحترافية",
};

const PROVIDERS: ProviderId[] = ["moyasar", "paylink", "paytabs", "myfatoorah"];

type Cycle = "monthly" | "yearly";

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

/** orderRef: cm_<user_id>_<plan_id>_<cycle>_<ts> — الـuuid لا يحتوي "_" */
function parseOrderRef(
  ref: string | null
): { userId: string; planId: string; cycle: Cycle } | null {
  if (!ref) return null;
  const parts = ref.split("_");
  if (parts.length !== 5 || parts[0] !== "cm") return null;
  const [, userId, planId, cycle] = parts;
  if (!PRICES[planId]) return null;
  if (cycle !== "monthly" && cycle !== "yearly") return null;
  return { userId, planId, cycle };
}

/**
 * التفعيل الـidempotent: إدراج الاشتراك (الفهرس الفريد على payment_ref
 * يمنع التكرار)، ثم إيقاف الاشتراكات السابقة وتسجيل الإيراد.
 */
async function activateSubscription(
  supa: ReturnType<typeof createClient>,
  opts: {
    userId: string;
    planId: string;
    cycle: Cycle;
    userName: string;
    paymentRef: string;
  }
): Promise<{ already: boolean }> {
  const now = new Date();
  const end = new Date(now);
  if (opts.cycle === "yearly") end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);

  const { data: inserted, error } = await supa
    .from("subscriptions")
    .insert({
      user_id: opts.userId,
      plan_id: opts.planId,
      end_date: end.toISOString(),
      active: true,
      payment_ref: opts.paymentRef,
    })
    .select("id")
    .single();

  if (error) {
    // 23505 = تعارض الفهرس الفريد → الدفعة فُعّلت من قبل (webhook أو verify سابق)
    if (error.code === "23505") return { already: true };
    throw new Error(`subscription_insert_failed:${error.message}`);
  }

  await supa
    .from("subscriptions")
    .update({ active: false, cancelled_at: now.toISOString() })
    .eq("user_id", opts.userId)
    .eq("active", true)
    .neq("id", inserted.id);

  const monthly = PRICES[opts.planId].monthly;
  await supa.from("revenue_log").insert({
    user_id: opts.userId,
    user_name: opts.userName,
    plan_id: opts.planId,
    plan_name: PLAN_NAMES[opts.planId] ?? opts.planId,
    amount: opts.cycle === "yearly" ? monthly * YEARLY_MONTHS : monthly,
    payment_ref: opts.paymentRef,
    action: opts.cycle === "yearly" ? "subscribe_yearly" : "subscribe",
  });

  return { already: false };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const APP_BASE_URL =
      Deno.env.get("APP_BASE_URL") ?? "https://cloudsmenu.netlify.app";

    // هوية المستدعي من ترويسة Authorization (جلسة Supabase Auth حقيقية)
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) return json({ ok: false, error: "unauthorized" }, 401);

    // عميل service role للإعدادات والتفعيل (يتجاوز RLS بأمان داخل الدالة فقط)
    const supa = createClient(SUPABASE_URL, SERVICE_KEY);

    const body = (await req.json()) as Record<string, unknown>;
    const op = body.op as string;

    // ── إنشاء دفعة ──────────────────────────────────────────────
    if (op === "create") {
      const planId = String(body.plan_id ?? "");
      const cycle = String(body.cycle ?? "monthly") as Cycle;
      if (!PRICES[planId] || (cycle !== "monthly" && cycle !== "yearly")) {
        return json({ ok: false, error: "invalid_plan" }, 400);
      }

      const { data: settingsRow } = await supa
        .from("site_settings")
        .select("value")
        .eq("key", "features")
        .maybeSingle();
      const features = (settingsRow?.value ?? {}) as Record<string, unknown>;
      const provider = (features.payment_provider ?? "moyasar") as ProviderId;
      if (!PROVIDERS.includes(provider)) {
        return json({ ok: false, error: "invalid_provider" }, 400);
      }
      if (provider === "moyasar") {
        // ميسر يستخدم النموذج المدمج في المتصفح، لا مسار إنشاء هنا
        return json({ ok: false, error: "embedded_provider" }, 400);
      }

      const { data: restaurant } = await supa
        .from("restaurants")
        .select("name, phone")
        .eq("user_id", user.id)
        .maybeSingle();

      const orderRef = `cm_${user.id}_${planId}_${cycle}_${Date.now()}`;
      const callbackUrl =
        provider === "paytabs"
          ? `${APP_BASE_URL}/api/payments/paytabs-return`
          : `${APP_BASE_URL}/dashboard/billing/callback?provider=${provider}`;

      try {
        const created = await createPayment(provider, {
          amountSar: PRICES[planId][cycle],
          orderRef,
          description: `اشتراك كلاود منيو — باقة ${PLAN_NAMES[planId]} (${
            cycle === "yearly" ? "سنوي" : "شهري"
          })`,
          callbackUrl,
          errorUrl: `${APP_BASE_URL}/dashboard/billing`,
          customerName: restaurant?.name || user.email || "عميل كلاود منيو",
          customerMobile: restaurant?.phone || "0500000000",
          customerEmail: user.email ?? "",
        });
        return json({
          ok: true,
          provider,
          redirect_url: created.redirectUrl,
          ref: created.ref,
        });
      } catch (e) {
        if (e instanceof UnconfiguredError) {
          return json({ ok: false, error: "provider_unconfigured" }, 503);
        }
        throw e;
      }
    }

    // ── التحقق والتفعيل ─────────────────────────────────────────
    if (op === "verify") {
      const provider = String(body.provider ?? "") as ProviderId;
      const ref = String(body.ref ?? "");
      if (!PROVIDERS.includes(provider) || !ref) {
        return json({ ok: false, error: "invalid_request" }, 400);
      }

      let parsed: { userId: string; planId: string; cycle: Cycle } | null;
      let paid = false;
      let pending = false;
      let amountSar: number | null = null;

      try {
        if (provider === "moyasar") {
          const result = await moyasarVerify(ref);
          paid = result.paid;
          pending = result.pending;
          amountSar = result.amountSar;
          // بيانات ميسر تأتي من metadata الدفعة المؤكدة من API ميسر نفسه
          const meta = result.metadata;
          const cycle = meta.cycle === "yearly" ? "yearly" : "monthly";
          parsed =
            meta.user_id && PRICES[meta.plan_id]
              ? { userId: meta.user_id, planId: meta.plan_id, cycle }
              : null;
        } else {
          const result = await verifyPayment(provider, ref);
          paid = result.paid;
          pending = result.pending;
          amountSar = result.amountSar;
          parsed = parseOrderRef(result.orderRef);
        }
      } catch (e) {
        if (e instanceof UnconfiguredError) {
          return json({ ok: false, error: "provider_unconfigured" }, 503);
        }
        throw e;
      }

      if (pending) return json({ ok: false, status: "pending" });
      if (!paid) return json({ ok: false, status: "failed" });
      if (!parsed) return json({ ok: false, status: "mismatch" }, 400);

      // الدفعة تخص المستدعي نفسه فقط
      if (parsed.userId !== user.id) {
        return json({ ok: false, status: "mismatch" }, 403);
      }
      // مطابقة المبلغ المؤكد من البوابة مع السعر المتوقع
      const expected = PRICES[parsed.planId][parsed.cycle];
      if (amountSar !== null && Math.round(amountSar) !== expected) {
        return json({ ok: false, status: "mismatch" }, 400);
      }

      const { already } = await activateSubscription(supa, {
        userId: parsed.userId,
        planId: parsed.planId,
        cycle: parsed.cycle,
        userName:
          (user.user_metadata as { name?: string } | null)?.name ||
          user.email ||
          "",
        paymentRef: `${provider}:${ref}`,
      });

      return json({
        ok: true,
        status: "paid",
        plan_id: parsed.planId,
        ...(already ? { already: true } : {}),
      });
    }

    return json({ ok: false, error: "unknown_op" }, 400);
  } catch (e) {
    console.error("payments error:", e);
    return json({ ok: false, error: String((e as Error)?.message || e) }, 500);
  }
});

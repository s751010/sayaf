/**
 * `payments` — مسار الاشتراك **القديم** (Moyasar وبوّابات متعدّدة).
 *
 * ⚠️ **لم يكن لهذه الدالة مصدر في المستودع** حتى ٢٢/٠٨/٢٠٢٦. أُنزلت من لوحة
 * Supabase ليصير تغييرها قابلاً للمراجعة — وأوّل ما كشفته المراجعة أدناه.
 *
 * ⚠️ **وهي اليوم مسار خامل لا حيّ**: مسار الاشتراك العامل صار
 * `paylink-create` ⇐ `paylink-webhook`. تبقى هذه لطلبٍ قديم قيد الطريق،
 * و`op=create` يردّ `embedded_provider` ما دام المزوّد الافتراضي `moyasar`.
 * خمولُها سبب لتضييقها لا لتركها: نقطةٌ تعمل بمفتاح الخدمة ولا يراقبها أحد.
 *
 * ═══ ⚠️ جدول أسعار قديم: كانت تحصّل ٩٩ والموقع يعرض ٥٩ ═══
 *
 * كانت تحمل نسختها الخاصّة من الأسعار (`standard` بـ٩٩ شهرياً و٩٩×١١ سنوياً،
 * و`premium` بـ١٩٩) وأسماء باقات لا وجود لها («الأساسية» · «الاحترافية»).
 * وأثر ذلك ليس تجميلياً:
 *
 *   • فحص المبلغ في `op=verify` كان **يرفض كل دفعة صحيحة**: زبونٌ يدفع ٥٩
 *     فتردّ الدالة `mismatch` ولا يُفعَّل اشتراكه.
 *   • و`revenue_log.amount` كان يُسجَّل ٩٩ لا ما دُفع فعلاً، و`plan_name`
 *     باسم باقة غير موجودة.
 *   • و`premium` بقيت **قابلة للدفع** رغم اختفائها من الواجهة.
 *
 * فالأسعار الآن من `_shared/plans.ts` وحده — نفس المصدر الذي يقرؤه
 * `paylink-create` و`paylink-webhook` و`moyasar-webhook`، و`parity.test.ts`
 * يحرس تطابقه مع `app/src/lib/plans.ts` ويُسقط CI عند أي سعر مكتوب بيد.
 *
 * ═══ العقد ═══
 *
 *   op=create : ينشئ صفحة دفع مستضافة لدى البوّابة النشطة
 *               (من `site_settings.features.payment_provider`) ويعيد رابط
 *               التحويل. **السعر يُحسب في الخادم.**
 *   op=verify : يتحقق من الدفعة خادماً-لخادم بالمفتاح السرّي ثم يفعّل
 *               الاشتراك ويسجّل الإيراد بشكل متكافئ (فهرس فريد على
 *               `subscriptions.payment_ref`).
 *
 * لا شيء يُرسل من العميل يُعتمد عليه للتفعيل: الباقة والمستخدم والدورة تُقرأ
 * من `orderRef` المرمَّز في الخادم وقت الإنشاء وتعيده البوّابة نفسها (أو من
 * `metadata` ميسر المؤكَّدة من API).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  isCycle,
  isPlanId,
  listPrice,
  planName,
  type Cycle,
  type PlanId,
} from "../_shared/plans.ts";
import {
  createPayment,
  moyasarVerify,
  verifyPayment,
  UnconfiguredError,
  type ProviderId,
} from "./providers.ts";

/**
 * ⚠️ **CORS محصور بعد أن كان `*`.**
 *
 * نقطةٌ تفعّل اشتراكات بمفتاح الخدمة لا تُعلن نفسها لكل أصل. الهوية هنا رأس
 * `Authorization` صريح لا كوكي، فالخطر ليس CSRF كلاسيكياً — لكن `*` على
 * واجهة دفع دعوةٌ مفتوحة لكل صفحة تجرّب. نفس قائمة `founder-admin`.
 */
const ALLOWED_ORIGINS = new Set([
  "https://cloudsmenu.netlify.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...(Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map((o) => o.trim()).filter(Boolean),
]);
/** معاينات Netlify (`deploy-preview-12--cloudsmenu.netlify.app`). */
const PREVIEW_RE = /^https:\/\/[a-z0-9-]+--cloudsmenu\.netlify\.app$/;
const isAllowedOrigin = (o: string) => ALLOWED_ORIGINS.has(o) || PREVIEW_RE.test(o);

function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  return {
    // أصلٌ غير معروف ⇒ لا يُعكس: المتصفّح يمنع القراءة، والنداء من خادم
    // (بلا Origin) يمرّ كما كان — الجلسة هي الحارس لا CORS.
    ...(isAllowedOrigin(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
    Vary: "Origin",
    "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

const PROVIDERS: ProviderId[] = ["moyasar", "paylink", "paytabs", "myfatoorah"];

function json(req: Request, obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors(req), "Content-Type": "application/json" },
  });
}

/**
 * `orderRef`: `cm_<user_id>_<plan_id>_<cycle>_<ts>` — الـuuid لا يحتوي `_`.
 *
 * ⚠️ تنسيق **مستقلّ** عن `buildOrderNumber` في `_shared/plans.ts` (فاصله `~`):
 * هذا ترميز هذه الدالة القديمة، وفواتيرها المعلّقة تحمله. لا يُوحَّد الترميزان
 * وإلا صارت فاتورة قديمة غير مقروءة — أي مالٌ دُفع ولا اشتراك يقابله.
 */
function parseOrderRef(
  ref: string | null
): { userId: string; planId: PlanId; cycle: Cycle } | null {
  if (!ref) return null;
  const parts = ref.split("_");
  if (parts.length !== 5 || parts[0] !== "cm") return null;
  const [, userId, planId, cycle] = parts;
  if (!userId || !isPlanId(planId) || !isCycle(cycle)) return null;
  return { userId, planId, cycle };
}

/**
 * التفعيل المتكافئ: إدراج الاشتراك (الفهرس الفريد على `payment_ref` يمنع
 * التكرار)، ثم إيقاف الاشتراكات السابقة وتسجيل الإيراد.
 */
async function activateSubscription(
  supa: ReturnType<typeof createClient>,
  opts: {
    userId: string;
    planId: PlanId;
    cycle: Cycle;
    userName: string;
    paymentRef: string;
    /** ما أكّدته البوّابة فعلاً — لا سعر الجدول. */
    amountSar: number;
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

  await supa.from("revenue_log").insert({
    user_id: opts.userId,
    user_name: opts.userName,
    plan_id: opts.planId,
    plan_name: planName(opts.planId),
    // ⚠️ ما دُفع فعلاً لا سعر الجدول: الخصم يجعلهما مختلفين، وسجلّ الإيراد
    // الذي يُسجّل السعر القائم يعطي المؤسّس رقماً لم يدخل حسابه قطّ.
    amount: opts.amountSar,
    payment_ref: opts.paymentRef,
    action: opts.cycle === "yearly" ? "subscribe_yearly" : "subscribe",
  });

  return { already: false };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, { ok: false, error: "method_not_allowed" }, 405);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const APP_BASE_URL =
      Deno.env.get("APP_BASE_URL") ?? "https://cloudsmenu.netlify.app";

    // هوية المستدعي من ترويسة Authorization (جلسة Supabase Auth حقيقية).
    // ⚠️ `verify_jwt: true` لا تكفي: مفتاح `anon` جواز صالح عندها، وهو منشور
    // في حزمة كل زائر. `getUser()` هو الفحص الحقيقي — يردّ فارغاً لمفتاح anon.
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) return json(req, { ok: false, error: "unauthorized" }, 401);

    // عميل service role للإعدادات والتفعيل (يتجاوز RLS بأمان داخل الدالة فقط)
    const supa = createClient(SUPABASE_URL, SERVICE_KEY);

    const body = (await req.json()) as Record<string, unknown>;
    const op = body.op as string;

    // ── إنشاء دفعة ──────────────────────────────────────────────
    if (op === "create") {
      const planId = body.plan_id;
      const cycle = body.cycle ?? "monthly";
      if (!isPlanId(planId) || !isCycle(cycle)) {
        return json(req, { ok: false, error: "invalid_plan" }, 400);
      }

      const { data: settingsRow } = await supa
        .from("site_settings")
        .select("value")
        .eq("key", "features")
        .maybeSingle();
      const features = (settingsRow?.value ?? {}) as Record<string, unknown>;
      const provider = (features.payment_provider ?? "moyasar") as ProviderId;
      if (!PROVIDERS.includes(provider)) {
        return json(req, { ok: false, error: "invalid_provider" }, 400);
      }
      if (provider === "moyasar") {
        // ميسر يستخدم النموذج المدمج في المتصفح، لا مسار إنشاء هنا
        return json(req, { ok: false, error: "embedded_provider" }, 400);
      }

      const { data: restaurant } = await supa
        .from("restaurants")
        .select("name, phone")
        .eq("user_id", user.id)
        .maybeSingle();

      const amountSar = listPrice(planId, cycle);
      const orderRef = `cm_${user.id}_${planId}_${cycle}_${Date.now()}`;
      const callbackUrl =
        provider === "paytabs"
          ? `${APP_BASE_URL}/api/payments/paytabs-return`
          : `${APP_BASE_URL}/dashboard/billing/callback?provider=${provider}`;

      try {
        const created = await createPayment(provider, {
          amountSar,
          orderRef,
          description: `اشتراك كلاود منيو — باقة ${planName(planId)} (${
            cycle === "yearly" ? "سنوي" : "شهري"
          })`,
          callbackUrl,
          errorUrl: `${APP_BASE_URL}/dashboard/billing`,
          customerName: restaurant?.name || user.email || "عميل كلاود منيو",
          customerMobile: restaurant?.phone || "0500000000",
          customerEmail: user.email ?? "",
        });
        return json(req, {
          ok: true,
          provider,
          redirect_url: created.redirectUrl,
          ref: created.ref,
        });
      } catch (e) {
        if (e instanceof UnconfiguredError) {
          return json(req, { ok: false, error: "provider_unconfigured" }, 503);
        }
        throw e;
      }
    }

    // ── التحقق والتفعيل ─────────────────────────────────────────
    if (op === "verify") {
      const provider = String(body.provider ?? "") as ProviderId;
      const ref = String(body.ref ?? "");
      if (!PROVIDERS.includes(provider) || !ref) {
        return json(req, { ok: false, error: "invalid_request" }, 400);
      }

      let parsed: { userId: string; planId: PlanId; cycle: Cycle } | null;
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
            meta.user_id && isPlanId(meta.plan_id)
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
          return json(req, { ok: false, error: "provider_unconfigured" }, 503);
        }
        throw e;
      }

      if (pending) return json(req, { ok: false, status: "pending" });
      if (!paid) return json(req, { ok: false, status: "failed" });
      if (!parsed) return json(req, { ok: false, status: "mismatch" }, 400);

      // الدفعة تخص المستدعي نفسه فقط
      if (parsed.userId !== user.id) {
        return json(req, { ok: false, status: "mismatch" }, 403);
      }

      /**
       * ⚠️ حارس المبلغ **مدىً لا مساواةً تامّة** — نفس منطق `paylink-webhook`:
       * أكواد الخصم تجعل المدفوع أقلّ من السعر القائم بلا خلل، فمطابقة
       * المساواة كانت سترفض دفعة صحيحة. المرفوض ما **يتجاوز** السعر القائم
       * أو يقلّ عن ريال واحد.
       */
      const ceiling = listPrice(parsed.planId, parsed.cycle);
      if (amountSar !== null && (amountSar < 1 || Math.round(amountSar) > ceiling)) {
        return json(req, { ok: false, status: "mismatch" }, 400);
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
        amountSar: amountSar ?? ceiling,
      });

      return json(req, {
        ok: true,
        status: "paid",
        plan_id: parsed.planId,
        ...(already ? { already: true } : {}),
      });
    }

    return json(req, { ok: false, error: "unknown_op" }, 400);
  } catch (e) {
    /**
     * ⚠️ **التفصيل إلى السجلّ لا إلى العميل.** كان الردّ يحمل
     * `String(e.message)` حرفياً — أي أسماء جداول وأعمدة ورسائل Postgres
     * ونصوص أخطاء البوّابات، لمن يستطيع بلوغ هذه النقطة بأي جلسة.
     */
    console.error("payments error:", e);
    return json(req, { ok: false, error: "internal" }, 500);
  }
});

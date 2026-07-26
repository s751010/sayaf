/**
 * paylink-create — إنشاء فاتورة PayLink وإرجاع رابط الدفع.
 *
 * ينشر بـ verify_jwt = true: لا يصل الطلب أصلاً بلا رمز مستخدم صالح.
 *
 * العقد:
 *   POST { plan_id: "standard"|"premium", cycle: "monthly"|"yearly", promo_code?: string }
 *   → 200 { url, transactionNo, amount, discount, plan_name }
 *
 * المبادئ الأمنية:
 *   1. **المبلغ يُحسب هنا** من `plan_id` + `cycle` — لا يُقبل مبلغ من العميل.
 *   2. هوية المشتري تُؤخذ من رمز الجلسة المتحقَّق منه، لا من جسم الطلب.
 *   3. كود الخصم يُتحقَّق منه مقابل جدول `promo_codes` بمفتاح الخدمة،
 *      لا من تخزين المتصفح (خلل النسخة القديمة).
 *   4. لا يُنشأ أي اشتراك هنا — التفعيل حصراً في `paylink-webhook` بعد
 *      تأكيد الدفع من PayLink نفسها.
 */
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { addInvoice, PAYLINK_MIN_AMOUNT } from "../_shared/paylink.ts";
import {
  buildOrderNumber,
  isCycle,
  isPlanId,
  listPrice,
  planName,
} from "../_shared/plans.ts";

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

type PromoRow = {
  code: string;
  discount: number | null;
  active: boolean | null;
  uses: number | null;
  max_uses: number | null;
  expiry_date: string | null;
};

/** يعيد نسبة الخصم (0–100) إن كان الكود صالحاً، وإلا 0. */
async function resolveDiscount(
  admin: SupabaseClient,
  rawCode: string
): Promise<{ percent: number; code: string } | null> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return null;

  const { data, error } = await admin
    .from("promo_codes")
    .select("code, discount, active, uses, max_uses, expiry_date")
    .ilike("code", code)
    .limit(1);

  if (error || !data?.length) return null;
  const promo = data[0] as PromoRow;

  if (promo.active === false) return null;
  if (promo.expiry_date && new Date(promo.expiry_date) < new Date()) return null;
  if (promo.max_uses != null && (promo.uses ?? 0) >= promo.max_uses) return null;

  const percent = Math.min(Math.max(Number(promo.discount) || 0, 0), 100);
  if (percent <= 0) return null;
  return { percent, code: promo.code };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST فقط." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const siteUrl = (Deno.env.get("SITE_URL") ?? "").replace(/\/+$/, "");

  // هوية المشتري من الرمز المرفق — لا من جسم الطلب.
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  const user = userData?.user;
  if (userErr || !user) return json({ error: "جلسة غير صالحة." }, 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "جسم الطلب غير صالح." }, 400);
  }

  const planId = body.plan_id;
  const cycle = body.cycle;
  if (!isPlanId(planId)) return json({ error: "باقة غير معروفة." }, 400);
  if (!isCycle(cycle)) return json({ error: "دورة فوترة غير معروفة." }, 400);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const base = listPrice(planId, cycle);
  const promo =
    typeof body.promo_code === "string" && body.promo_code.trim()
      ? await resolveDiscount(admin, body.promo_code)
      : null;

  const discount = promo ? Math.round((base * promo.percent) / 100) : 0;
  const amount = Math.max(base - discount, PAYLINK_MIN_AMOUNT);

  const cycleLabel = cycle === "yearly" ? "سنوي" : "شهري";
  const label = `اشتراك كلاود منيو — باقة ${planName(planId)} (${cycleLabel})`;
  const orderNumber = buildOrderNumber(user.id, planId, cycle, promo?.code);

  // PayLink تشترط رقم جوال. نأخذه من بيانات المستخدم إن وُجد، وإلا رقماً
  // محايداً — الفوترة تتم بالبريد والحساب، والرقم حقل إلزامي شكلي فقط.
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const clientMobile =
    (typeof meta.phone === "string" && meta.phone.trim()) || user.phone || "0500000000";
  const clientName =
    (typeof meta.name === "string" && meta.name.trim()) || user.email || "عميل كلاود منيو";

  try {
    const invoice = await addInvoice({
      orderNumber,
      amount,
      // PayLink تُعيد العميل لهذا الرابط بعد الدفع؛ التفعيل الفعلي يتم بالويبهوك.
      callBackUrl: `${siteUrl}/dashboard/billing?payment=done`,
      cancelUrl: `${siteUrl}/dashboard/billing?payment=cancelled`,
      clientName,
      clientEmail: user.email ?? undefined,
      clientMobile,
      products: [{ title: label, price: amount, qty: 1 }],
      note: promo ? `كود خصم: ${promo.code} (${promo.percent}%)` : undefined,
    });

    return json({
      url: invoice.url,
      transactionNo: invoice.transactionNo,
      amount,
      discount,
      promo_code: promo?.code ?? null,
      plan_name: planName(planId),
    });
  } catch (err) {
    console.error("paylink-create:", err instanceof Error ? err.message : err);
    return json({ error: "تعذّر إنشاء عملية الدفع. حاول مجدداً." }, 502);
  }
});

/**
 * `notify-support` — يرسل بريداً للمؤسّس عند وصول تذكرة دعم جديدة.
 *
 * ينشر بـ`verify_jwt = false` ويحرس نفسه بسرّ مشترك في `internal_secrets`.
 *
 * ═══ ⚠️ ثغرتان كانتا هنا (فحص ٢٠٢٦/٠٨/٢٢) ═══
 *
 * ١. **بلا أي فحص صلاحية.** كانت `verify_jwt: true` وحدها — وهي **لا تعني
 *    «مستخدم مسجَّل»**: تقبل أي JWT موقَّع بمفتاح المشروع، ومفتاح `anon`
 *    منشور في حزمة كل زائر. أي أن أي أحد يُغرق صندوق المالك ويستنزف حصّة
 *    Resend بنداء متكرّر.
 *
 * ٢. **حقن HTML.** `restaurant_name` و`user_name` و`email` و`subject` كانت
 *    تُحقن في القالب بلا تهريب، و`message` مهرَّبة جزئياً (`<` فقط). فتاجرٌ
 *    يسمّي مطعمه `<a href="…">` يزرع تصيّداً في صندوق المالك بمظهر بريد رسمي
 *    من منصّته.
 *
 * ═══ ولماذا لم تكن تعمل أصلاً ═══
 *
 * لا تريجر في القاعدة ولا سطر في `app/src` يناديها — أي أن تذاكر الدعم لم
 * تكن تُشعر أحداً منذ نقل المشروع. فالتوصيل صار من القاعدة نفسها: تريجر
 * `AFTER INSERT` على `support_tickets` ⇒ `notify_support_ticket()` ⇒
 * `net.http_post` بالسرّ في الترويسة. **نفس نمط `webhook-dispatch`** — لا
 * خطوة يدوية في لوحة Supabase تُنسى فتتوقّف الإشعارات بصمت.
 */
import { escapeHtml } from "../_shared/escape-html.ts";
import { safeEqual } from "../_shared/safe-equal.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

type Ticket = {
  restaurant_name?: string | null;
  user_name?: string | null;
  email?: string | null;
  subject?: string | null;
  message?: string | null;
};

/** «—» بدل الفراغ: صفٌّ فارغ في البريد يوهم بأن الحقل ضاع. */
const or = (...vals: (string | null | undefined)[]) =>
  escapeHtml(vals.find((v) => v && String(v).trim()) ?? "—");

function template(t: Ticket): string {
  return `
  <div style="font-family:Tahoma,Arial,sans-serif;direction:rtl;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #eee">
    <div style="background:linear-gradient(135deg,#D4A843,#A8842F);padding:20px 24px;color:#14110A">
      <h2 style="margin:0;font-size:18px">🔔 تذكرة دعم جديدة</h2>
    </div>
    <div style="padding:24px">
      <p style="margin:0 0 6px"><b>من:</b> ${or(t.restaurant_name, t.user_name)}</p>
      <p style="margin:0 0 6px"><b>البريد:</b> ${or(t.email)}</p>
      <p style="margin:0 0 6px"><b>الموضوع:</b> ${or(t.subject)}</p>
      <div style="background:#f7f7f7;border-radius:8px;padding:14px;margin-top:12px;line-height:1.8;color:#333;white-space:pre-wrap">${escapeHtml(t.message ?? "")}</div>
      <a href="https://cloudsmenu.netlify.app/founder/comms" style="display:inline-block;margin-top:18px;background:#D4A843;color:#14110A;text-decoration:none;padding:10px 22px;border-radius:8px;font-weight:bold">افتح لوحة المؤسّس للرد</a>
    </div>
  </div>`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST فقط." }, 405);

  // ── البوّابة: سرّ مشترك من القاعدة، لا متغيّر بيئة ────────────────────
  // الجهة التي توقظنا تريجر **داخل القاعدة**، فوضع السرّ فيها يجعل الطرفين
  // يقرآن مصدراً واحداً. والجدول محجوب عن كل جلسة مستخدم (RLS بلا سياسات).
  const secretRes = await fetch(
    `${SUPABASE_URL}/rest/v1/internal_secrets?key=eq.support_notify_secret&select=value`,
    { headers: { apikey: SERVICE_KEY, authorization: `Bearer ${SERVICE_KEY}` } },
  );
  const rows = secretRes.ok ? await secretRes.json() : null;
  const expected = (Array.isArray(rows) ? rows[0]?.value : null) ?? "";

  // بلا سرّ لا تعمل الدالة إطلاقاً: الأسوأ من فقدان إشعار أن يستطيع أي أحد
  // إغراق صندوق المالك بمحتوى يكتبه هو.
  if (!expected) return json({ error: "not_configured" }, 503);
  if (!safeEqual(req.headers.get("x-notify-secret") ?? "", expected)) {
    return json({ error: "forbidden" }, 403);
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "onboarding@resend.dev";
  if (!RESEND_API_KEY) return json({ error: "mail_unconfigured" }, 503);

  // بريد المؤسّس من القاعدة لا من متغيّر بيئة — نفس مصدر `is_founder()`.
  const emailRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/founder_email`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      authorization: `Bearer ${SERVICE_KEY}`,
      "content-type": "application/json",
    },
    body: "{}",
  });
  const founderEmail = emailRes.ok ? String(await emailRes.json() ?? "").trim() : "";
  if (!founderEmail) return json({ error: "founder_email_unavailable" }, 503);

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }
  // التريجر يرسل الصفّ في `record` (نفس شكل Database Webhook).
  const t = ((payload.record ?? payload) ?? {}) as Ticket;

  const who = String(t.restaurant_name || t.user_name || "عميل").slice(0, 80);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `كلاود منيو <${FROM_EMAIL}>`,
      to: [founderEmail],
      // العنوان يمرّ كنصّ في JSON لا كترويسة SMTP نبنيها، لكن يبقى مقصوصاً:
      // عنوانٌ بطول ألف محرف يكسر عرض الصندوق.
      subject: `🔔 تذكرة دعم جديدة — ${who}`,
      html: template(t),
    }),
  });

  if (!res.ok) {
    // ⚠️ التفصيل إلى السجلّ لا إلى العميل: رسالة Resend قد تحمل حالة الحساب.
    console.error("resend:", res.status, (await res.text()).slice(0, 300));
    return json({ error: "send_failed" }, 502);
  }
  const data = await res.json().catch(() => ({}));
  return json({ ok: true, id: (data as { id?: string }).id ?? null });
});

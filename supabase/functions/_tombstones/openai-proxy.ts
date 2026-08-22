/**
 * شاهدة قبر — `openai-proxy` مُعطّلة عمداً (2026-08-22).
 *
 * وسيط OpenAI ثانٍ: يقبل **أي مستخدم مسجَّل** بلا فحص دور ولا ملكية، ويمرّر
 * جسم الطلب كاملاً. كان عاجزاً **بالصدفة لا بالتصميم** — جداوله الثلاثة
 * (`platform_secrets` · `ai_usage` · `founder_config`) غير موجودة في هذا
 * المشروع فيردّ 503. صفٌّ واحد يُدرَج ⇒ يصير حيّاً.
 *
 * تخصّ منصّة HSE.
 *
 * لا تقرأ سرّاً، ولا تنادي شبكة، ولا تقرأ جسم الطلب.
 *
 * المصدر الأصلي محفوظ في المستودع:
 *   `supabase/functions/_archive/openai-proxy.index.ts.txt`
 *
 * ✅ للمالك: احذفها نهائياً من لوحة Supabase ← Edge Functions.
 */

Deno.serve(() =>
  new Response(
    JSON.stringify({
      error: "هذه الدالة مُعطّلة ولم تعد متاحة.",
      gone_at: "2026-08-22",
    }),
    { status: 410, headers: { "Content-Type": "application/json" } }
  )
);

/**
 * webhook-dispatch — يُفرغ صندوق `webhook_events` إلى خوادم التجّار.
 *
 * ينشر بـ`verify_jwt = false` ويحرس نفسه بسرّ مشترك في `internal_secrets`:
 * يوقظه `pg_cron` كل دقيقة عبر `pg_net`، وليس له متصل بشري.
 *
 * ═══ لماذا دالة حافة لا `pg_net` مباشرة من SQL ═══
 *
 * `pg_net` غير متزامنة: تضع الطلب في طابور وتعود فوراً، ولمعرفة النتيجة يجب
 * استطلاع `net._http_response` في تمريرة لاحقة والربط بـ`request_id`. أي منطق
 * إعادة محاولة مبني عليها يصير آلة حالة موزّعة عبر جدولين. الدالة هنا **تنتظر
 * الرد الحقيقي** فتضبط `attempts` و`last_error` و`delivered_at` في نفس الدورة.
 *
 * ═══ التوقيع ═══
 *
 * `X-CloudMenu-Signature: sha256=<hex>` — HMAC-SHA256 لجسم الطلب بسرّ التاجر،
 * ومعه `X-CloudMenu-Timestamp` مضمَّن في المُوقَّع (`<ts>.<body>`) كي لا يُعاد
 * تشغيل طلب قديم. هذا ما يجعل خادم التاجر يثق أن الحدث منّا لا من أي جهة تعرف
 * رابطه.
 */
import { createClient } from "jsr:@supabase/supabase-js@2";
import { checkWebhookUrl, classifyFetchError } from "../_shared/url-guard.ts";
import { safeEqual } from "../_shared/safe-equal.ts";

/** حد المحاولات — بعده يُترك الصف بخطئه الأخير ليراه التاجر في لوحته. */
const MAX_ATTEMPTS = 6;
/** دفعة واحدة في كل إيقاظ: تكفي الدقيقة ولا تُطيل عمر الدالة. */
const BATCH = 40;
const TIMEOUT_MS = 8000;

type Row = {
  id: number;
  restaurant_id: string;
  event: string;
  payload: Record<string, unknown>;
  attempts: number;
};

type Hook = { id: string; url: string; secret: string; events: string[] };

async function sign(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  /**
   * السرّ من `internal_secrets` لا من متغيّر بيئة.
   *
   * الجهة التي توقظنا هي `pg_cron` **داخل القاعدة**، فوضع السرّ في القاعدة يجعل
   * الطرفين يقرآن مصدراً واحداً بلا خطوة يدوية في لوحة Supabase تُنسى فتتوقّف
   * كل الويبهوكات بصمت. والجدول محجوب عن كل جلسة مستخدم (RLS بلا سياسات).
   */
  const { data: secretRow } = await admin
    .from("internal_secrets")
    .select("value")
    .eq("key", "webhook_cron_secret")
    .maybeSingle();
  const expected = (secretRow as { value: string } | null)?.value ?? "";

  // بلا سرّ لا تعمل الدالة إطلاقاً: الأسوأ من عدم التسليم أن يستطيع أي أحد
  // إغراق خوادم التجّار بإعادة تشغيلها.
  if (!expected) return new Response("not configured", { status: 503 });
  if (!safeEqual(req.headers.get("x-cron-secret") ?? "", expected)) {
    return new Response("forbidden", { status: 403 });
  }

  const { data: rows } = await admin
    .from("webhook_events")
    .select("id, restaurant_id, event, payload, attempts")
    .is("delivered_at", null)
    .lt("attempts", MAX_ATTEMPTS)
    .order("created_at", { ascending: true })
    .limit(BATCH);

  const pending = (rows ?? []) as Row[];
  if (pending.length === 0) return Response.json({ delivered: 0, failed: 0, pending: 0 });

  // وجهات كل المطاعم المعنيّة في نداء واحد — لا استعلام لكل حدث.
  const restaurantIds = [...new Set(pending.map((r) => r.restaurant_id))];
  const { data: hookRows } = await admin
    .from("webhooks")
    .select("id, restaurant_id, url, secret, events")
    .in("restaurant_id", restaurantIds)
    .eq("enabled", true);

  const byRestaurant = new Map<string, Hook[]>();
  for (const h of (hookRows ?? []) as (Hook & { restaurant_id: string })[]) {
    byRestaurant.set(h.restaurant_id, [...(byRestaurant.get(h.restaurant_id) ?? []), h]);
  }

  let delivered = 0;
  let failed = 0;

  await Promise.all(
    pending.map(async (row) => {
      const hooks = (byRestaurant.get(row.restaurant_id) ?? []).filter((h) =>
        h.events.includes(row.event)
      );

      // لا وجهة (حُذفت أو أُطفئت بعد وضع الحدث) ⇒ يُغلق الصفّ بدل أن يُعاد أبداً.
      if (hooks.length === 0) {
        await admin
          .from("webhook_events")
          .update({ delivered_at: new Date().toISOString(), last_error: "لا وجهة مشتركة" })
          .eq("id", row.id);
        return;
      }

      const ts = Math.floor(Date.now() / 1000).toString();
      const body = JSON.stringify({
        event: row.event,
        restaurant_id: row.restaurant_id,
        data: row.payload,
        sent_at: new Date().toISOString(),
      });

      const results = await Promise.all(
        hooks.map(async (h) => {
          /**
           * ⚠️ **الفحص عند الإرسال لا عند الحفظ وحده.** قيد القاعدة يمنع أوضح
           * الأشكال، لكن الصفوف المحفوظة قبله لم تمرّ به — ووجهةٌ حُفظت أمس
           * تُرسَل اليوم. الحارس هنا هو الأخير قبل `fetch` بمفتاح الخدمة.
           */
          const bad = checkWebhookUrl(h.url);
          if (bad) return `blocked_${bad}`;

          try {
            const signature = await sign(h.secret, `${ts}.${body}`);
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
            const res = await fetch(h.url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-CloudMenu-Event": row.event,
                "X-CloudMenu-Timestamp": ts,
                "X-CloudMenu-Signature": `sha256=${signature}`,
                "User-Agent": "CloudMenu-Webhook/1",
              },
              body,
              signal: ctrl.signal,
            }).finally(() => clearTimeout(timer));
            return res.ok ? null : `http_${res.status}`;
          } catch (e) {
            /**
             * ⚠️ **صنف لا نصّ.** `last_error` يظهر في لوحة التاجر، ونصّ الخطأ
             * الخام يميّز «رُفض الاتصال» من «انتهت المهلة» من «فشل TLS» — أي
             * يجيب عن «هل المنفذ مفتوح؟» طلباً بعد طلب.
             */
            return classifyFetchError(e);
          }
        })
      );

      const errors = results.filter((r): r is string => r !== null);
      if (errors.length === 0) {
        delivered++;
        await admin
          .from("webhook_events")
          .update({ delivered_at: new Date().toISOString(), attempts: row.attempts + 1, last_error: null })
          .eq("id", row.id);
      } else {
        failed++;
        await admin
          .from("webhook_events")
          .update({ attempts: row.attempts + 1, last_error: errors.join(" · ").slice(0, 500) })
          .eq("id", row.id);
      }
    })
  );

  return Response.json({ delivered, failed, processed: pending.length });
});

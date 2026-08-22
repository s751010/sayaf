/**
 * Webhooks في إعدادات التاجر — إشعار خادمه بما يحدث في منيوه لحظياً.
 *
 * تظهر مع بوّابة API نفسها (`api_enabled`): من يستقبل ويبهوكات لديه خادم، ومن
 * لديه خادم يريد الـAPI أيضاً — وفتحُ الاثنين ببوّابة واحدة أبسط للتاجر وللمؤسس
 * من مفتاحين منفصلين لا يُستخدم أحدهما بلا الآخر.
 *
 * ⚠️ سرّ التوقيع يُعرض **مرة واحدة** عند الإنشاء: العمود محجوب عن `SELECT` في
 * القاعدة، فلا يستطيع من يصل للوحة لاحقاً انتحال توقيعنا تجاه خادم التاجر.
 */
import { useCallback, useEffect, useState } from "react";
// ⚠️ نفس الحارس الذي تستعمله `webhook-dispatch` — لا نسخة ثانية بيد.
import { checkWebhookUrl } from "../../../supabase/functions/_shared/url-guard";
import { Badge, Button, Card, ErrorNote, Field, Input, useToast } from "@/components/ui";
import {
  createWebhook,
  deleteWebhook,
  getWebhookDeliveries,
  getWebhooks,
  setWebhookEnabled,
  WEBHOOK_EVENTS,
  type Webhook,
  type WebhookDelivery,
} from "@/lib/data";
import { cn, formatDate } from "@/lib/utils";
import type { Restaurant } from "@/lib/types";
import { Icon } from "@/lib/icons";

/**
 * رسائل عربية لأصناف الرفض. الحارس نفسه في `_shared/url-guard.ts` — نسخة
 * واحدة يستوردها المتصفّح والحافة معاً، فلا قائمتان تتباعدان.
 */
const URL_ERRORS: Record<NonNullable<ReturnType<typeof checkWebhookUrl>>, string> = {
  malformed: "هذا ليس رابطاً صالحاً.",
  not_https: "الرابط يجب أن يبدأ بـ https:// — نرسل بيانات طلبات، وhttp مكشوف.",
  bad_port: "المنفذ يجب أن يكون 443 (الافتراضي لـhttps).",
  ip_literal: "اكتب اسم نطاق لا عنوان IP.",
  internal_host: "هذا عنوان داخلي لا يصله خادمنا — اكتب نطاقاً عامّاً.",
};

export function WebhooksCard({
  restaurant,
  userId,
}: {
  restaurant: Restaurant;
  userId: string;
}) {
  const toast = useToast();
  const [hooks, setHooks] = useState<Webhook[] | null>(null);
  const [log, setLog] = useState<WebhookDelivery[] | null>(null);
  const [url, setUrl] = useState("");
  const [picked, setPicked] = useState<string[]>(WEBHOOK_EVENTS.map((e) => e.id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fresh, setFresh] = useState<string | null>(null);

  const load = useCallback(() => {
    getWebhooks(restaurant.id).then(setHooks).catch(() => setHooks([]));
    getWebhookDeliveries(restaurant.id).then(setLog).catch(() => setLog([]));
  }, [restaurant.id]);

  useEffect(load, [load]);

  async function add() {
    const clean = url.trim();
    // نفحصه هنا أيضاً رغم قيدَي `CHECK` في القاعدة وحارس الدالّة: رسالة واضحة
    // قبل الإرسال خير من خطأ Postgres خام. والقيدان هما الحارس الحقيقي —
    // هذا لطفٌ بالتاجر لا حاجز أمني.
    const why = checkWebhookUrl(clean);
    if (why) return setError(URL_ERRORS[why]);
    if (picked.length === 0) return setError("اختر حدثاً واحداً على الأقل.");
    setBusy(true);
    setError("");
    try {
      const { hook, secret } = await createWebhook({
        restaurant_id: restaurant.id,
        user_id: userId,
        url: clean,
        events: picked,
      });
      setHooks((prev) => [hook, ...(prev ?? [])]);
      setFresh(secret);
      setUrl("");
      toast("أُضيفت الوجهة ✓");
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "تعذّرت الإضافة.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(h: Webhook) {
    const next = !h.enabled;
    setHooks((p) => p?.map((x) => (x.id === h.id ? { ...x, enabled: next } : x)) ?? null);
    try {
      await setWebhookEnabled(h.id, next);
    } catch {
      setHooks((p) => p?.map((x) => (x.id === h.id ? { ...x, enabled: !next } : x)) ?? null);
      toast("تعذّر التحديث", "err");
    }
  }

  async function remove(h: Webhook) {
    if (!confirm("حذف هذه الوجهة؟ لن تصلها أحداث بعدها.")) return;
    const before = hooks;
    setHooks((p) => p?.filter((x) => x.id !== h.id) ?? null);
    try {
      await deleteWebhook(h.id);
      toast("حُذفت الوجهة ✓");
    } catch {
      setHooks(before);
      toast("تعذّر الحذف", "err");
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="inline-flex items-center gap-2 font-display text-lg font-extrabold text-ink">
          <Icon name="bell" size={17} className="shrink-0 text-gold" />{" "}
          إشعارات لخادمك (Webhooks)</h2>
        <p className="mt-1 text-sm text-dim">
          نرسل طلب <code dir="ltr">POST</code> إلى رابطك لحظة وقوع الحدث — لتزامن
          نقطة البيع أو تُشعِل تنبيهاً عندك.
        </p>
      </div>

      {fresh && (
        <div className="rounded-xl border border-gold bg-gold/10 p-4">
          <p className="inline-flex items-center gap-2 text-sm font-black text-ink">
          <Icon name="warn" size={17} className="shrink-0 text-gold" />{" "}
          سرّ التوقيع — انسخه الآن، لن يظهر ثانية.</p>
          <p className="mt-1 text-xs text-dim">
            خادمك يتحقّق به أن الطلب منّا: احسب{" "}
            <code dir="ltr">HMAC-SHA256(&quot;&lt;timestamp&gt;.&lt;body&gt;&quot;)</code> بهذا السرّ
            وقارنه بترويسة <code dir="ltr">X-CloudMenu-Signature</code>.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code dir="ltr" className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-panel2 px-3 py-2 text-xs text-ink">
              {fresh}
            </code>
            <Button
              variant="outline"
              onClick={() =>
                navigator.clipboard?.writeText(fresh).then(
                  () => toast("نُسخ ✓"),
                  () => toast("تعذّر النسخ", "err")
                )
              }
            >
              <Icon name="copy" size={15} /> نسخ
            </Button>
          </div>
          <button
            onClick={() => setFresh(null)}
            className="mt-2 text-xs font-bold text-dim underline underline-offset-2"
          >
            نسختُه — أخفِه
          </button>
        </div>
      )}

      <Field label="رابط خادمك" hint="https فقط — نرسل بيانات طلبات">
        <Input
          dir="ltr"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://api.example.com/cloudmenu"
        />
      </Field>

      <div>
        <p className="mb-2 text-xs font-bold text-dim">الأحداث</p>
        <div className="flex flex-col gap-2">
          {WEBHOOK_EVENTS.map((e) => {
            const on = picked.includes(e.id);
            return (
              <button
                key={e.id}
                type="button"
                onClick={() =>
                  setPicked((p) => (p.includes(e.id) ? p.filter((x) => x !== e.id) : [...p, e.id]))
                }
                aria-pressed={on}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-start",
                  on ? "border-gold bg-gold/8" : "border-line"
                )}
              >
                <span className={on ? "text-gold" : "text-faint"}>{on ? "☑" : "☐"}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-ink">{e.label}</span>
                  <span className="block text-xs text-faint">{e.hint}</span>
                </span>
                <code dir="ltr" className="ms-auto shrink-0 text-[11px] text-faint">
                  {e.id}
                </code>
              </button>
            );
          })}
        </div>
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}
      <Button onClick={add} disabled={busy} className="sm:self-start">
        {busy ? "…" : "أضِف وجهة"}
      </Button>

      {hooks && hooks.length > 0 && (
        <ul className="flex flex-col gap-2 border-t border-line pt-4">
          {hooks.map((h) => (
            <li
              key={h.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-line px-3 py-2.5"
            >
              <code dir="ltr" className="min-w-0 flex-1 truncate text-xs text-ink">
                {h.url}
              </code>
              <Badge variant={h.enabled ? "green" : "neutral"}>
                {h.enabled ? "يعمل" : "متوقّف"}
              </Badge>
              <span className="text-[11px] text-faint">{h.events.length} أحداث</span>
              <button onClick={() => toggle(h)} className="text-xs font-bold text-gold hover:underline">
                {h.enabled ? "إيقاف" : "تشغيل"}
              </button>
              <button onClick={() => remove(h)} className="text-xs font-bold text-bad hover:underline">
                حذف
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* سجل التسليم — يجيب «لماذا لم يصلني شيء؟» بلا مراسلة الدعم. */}
      {log && log.length > 0 && (
        <div className="border-t border-line pt-4">
          <p className="mb-2 text-xs font-bold text-dim">آخر التسليمات</p>
          <ul className="flex flex-col gap-1.5">
            {log.map((d) => (
              <li key={d.id} className="flex flex-wrap items-baseline gap-x-2 text-xs">
                <span className={d.delivered_at ? "text-good" : "text-bad"}>
                  {d.delivered_at ? "✓" : "✕"}
                </span>
                <code dir="ltr" className="text-ink">{d.event}</code>
                <span className="text-faint">{formatDate(d.created_at)}</span>
                {d.attempts > 1 && <span className="text-faint">· {d.attempts} محاولات</span>}
                {d.last_error && (
                  <span className="w-full truncate text-bad" title={d.last_error}>
                    {d.last_error}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <button onClick={load} className="mt-2 text-xs font-bold text-gold hover:underline">
            ↻ تحديث
          </button>
        </div>
      )}

      <p className="text-xs leading-relaxed text-faint">
        نعيد المحاولة حتى ست مرات إن كان خادمك معطّلاً، ولا يتأثّر منيوك بذلك
        إطلاقاً. وحدث الولاء يحمل عدد الأختام فقط — لا اسم زبونك ولا جواله.
      </p>
    </Card>
  );
}

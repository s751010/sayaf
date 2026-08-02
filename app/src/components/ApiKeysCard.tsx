/**
 * مفاتيح API في إعدادات التاجر.
 *
 * النموذج (قرار المالك): **المؤسس يفتح الباب، والتاجر يولّد مفتاحه بنفسه.**
 * فالسرّ لا يمرّ في واتساب ولا يمرّ بالمؤسس، ويبقى المؤسس هو البوّابة —
 * يفتحها ويغلقها من بطاقة التاجر في لوحته.
 *
 * البطاقة **لا تظهر أصلاً** لمن لم تُفتح له البوّابة: عرض قسم معطَّل لكل تاجر
 * ضجيج في شاشة إعدادات مزدحمة أصلاً.
 *
 * ⚠️ السرّ يُعرض **مرة واحدة** ولا سبيل لاستعادته — القاعدة لا تحمل إلا هاشه
 * (`lib/apiKeys.ts`). هذا مقصود: مفتاح يمكن استرجاعه من اللوحة هو مفتاح يسرقه
 * من يصل للوحة.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, ErrorNote, Field, Input, Switch, useToast } from "@/components/ui";
import { createApiKey, getApiKeys, revokeApiKey, type ApiKey } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import type { Restaurant } from "@/lib/types";

export function ApiKeysCard({
  restaurant,
  userId,
}: {
  restaurant: Restaurant;
  userId: string;
}) {
  const toast = useToast();
  /** `null` = يُحمَّل · `[]` = لا مفاتيح (القاعدة ج: لا تخلط الاثنين). */
  const [keys, setKeys] = useState<ApiKey[] | null>(null);
  const [name, setName] = useState("");
  const [canWrite, setCanWrite] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  /** السرّ المعروض لتوّه — يختفي بمجرّد مغادرة الصفحة. */
  const [fresh, setFresh] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getApiKeys(restaurant.id)
      .then((rows) => !cancelled && setKeys(rows))
      .catch(() => !cancelled && setKeys([]));
    return () => {
      cancelled = true;
    };
  }, [restaurant.id]);

  const live = (keys ?? []).filter((k) => !k.revoked_at);

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const { key, secret } = await createApiKey({
        restaurant_id: restaurant.id,
        user_id: userId,
        name,
        canWrite,
      });
      setKeys((prev) => [key, ...(prev ?? [])]);
      setFresh(secret);
      setName("");
      toast("أُنشئ المفتاح — انسخه الآن ✓");
    } catch (e) {
      // رسالة القاعدة أدقّ من أي نصّ عام: تقول «الحدّ خمسة مفاتيح» بالحرف.
      setError(e instanceof Error && e.message ? e.message : "تعذّر إنشاء المفتاح.");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(k: ApiKey) {
    if (!confirm(`إبطال «${k.name}»؟ أي نظام يستخدمه سيتوقّف فوراً.`)) return;
    const at = new Date().toISOString();
    setKeys((prev) => prev?.map((x) => (x.id === k.id ? { ...x, revoked_at: at } : x)) ?? null);
    try {
      await revokeApiKey(k.id);
      toast("أُبطل المفتاح ✓");
    } catch {
      setKeys((prev) => prev?.map((x) => (x.id === k.id ? { ...x, revoked_at: null } : x)) ?? null);
      toast("تعذّر الإبطال", "err");
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-lg font-extrabold text-ink">🔌 واجهة API</h2>
        <p className="mt-1 text-sm text-dim">
          اربط منيوك بنظام نقاط البيع أو موقعك أو أي أتمتة.{" "}
          <Link to="/docs/api" className="font-bold text-gold hover:underline">
            دليل الاستخدام ↗
          </Link>
        </p>
      </div>

      {/* السرّ الطازج — أبرز شيء في البطاقة لأنه لن يُعرض ثانية. */}
      {fresh && (
        <div className="rounded-xl border border-gold bg-gold/10 p-4">
          <p className="text-sm font-black text-ink">
            ⚠️ انسخ المفتاح الآن — لن يظهر مرة أخرى أبداً.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code
              dir="ltr"
              className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-panel2 px-3 py-2 text-xs text-ink"
            >
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
              📋 نسخ
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

      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field label="اسم المفتاح" hint="ليميّزه عن غيره لاحقاً — «نقطة البيع»، «موقعنا»…">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 40))}
            placeholder="نقطة البيع"
          />
        </Field>
        <Button onClick={generate} disabled={busy || live.length >= 5}>
          {busy ? "…" : "أنشئ مفتاحاً"}
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-panel2 px-4 py-3">
        <div>
          <p className="text-sm font-bold text-ink">✏️ يسمح بالتعديل</p>
          <p className="text-xs text-faint">
            {canWrite
              ? "يقدر يضيف ويعدّل ويحذف أطباقك — لنقطة بيع تُزامن منيوك."
              : "قراءة فقط — الأنسب لموقعك أو تطبيق يعرض المنيو."}
          </p>
        </div>
        <Switch checked={canWrite} onChange={setCanWrite} label="السماح بالتعديل" />
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}
      {live.length >= 5 && (
        <p className="text-xs text-faint">
          بلغتَ الحدّ (خمسة مفاتيح حيّة). أبطِل واحداً قديماً لتُنشئ جديداً.
        </p>
      )}

      {keys === null ? (
        <p className="text-sm text-faint">جارٍ التحميل…</p>
      ) : keys.length === 0 ? (
        <p className="text-sm text-faint">لا مفاتيح بعد.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {keys.map((k) => (
            <li
              key={k.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-line px-3 py-2.5"
            >
              <span className="font-bold text-ink">{k.name}</span>
              <code dir="ltr" className="text-xs text-faint">
                {k.prefix}…
              </code>
              <Badge>{k.scopes.includes("write") ? "قراءة وتعديل" : "قراءة"}</Badge>
              {k.revoked_at ? (
                <Badge variant="red">مُبطَل</Badge>
              ) : (
                <span className="text-xs text-faint">
                  {k.last_used_at ? `آخر استخدام ${formatDate(k.last_used_at)}` : "لم يُستخدم بعد"}
                </span>
              )}
              {!k.revoked_at && (
                <button
                  onClick={() => revoke(k)}
                  className="ms-auto text-xs font-bold text-bad hover:underline"
                >
                  إبطال
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs leading-relaxed text-faint">
        كل مفتاح يرى مطعمك وحده — لا يمكنه الوصول لأي مطعم آخر مهما كان الطلب.
        والحدّ ٦٠ طلباً في الدقيقة لكل مفتاح.
      </p>
    </Card>
  );
}

/**
 * بطاقة «الدفع الإلكتروني» في إعدادات التاجر — ربط حساب PayLink الخاص به.
 *
 * ⚠️ **المفتاح السرّي لا يُقرأ هنا ولا في أي مكان في الواجهة.** الحقل كتابةٌ
 * فقط، وما يُعرض هو العمود المحسوب `has_secret` (بوليان). سبب ذلك عملي لا
 * شكلي: المفتاح يخوّل حاملَه إصدار فواتير باسم المطعم وقبض أمواله، ولا شيء في
 * اللوحة يحتاج قيمته — الجهة الوحيدة التي تحتاجها هي `paylink-order-create`
 * على الخادم بمفتاح الخدمة.
 *
 * خارج فورم الإعدادات عمداً: يحفظ جدولين (`restaurant_payment_settings`
 * و`restaurants.online_payment_enabled`) بضغطة واحدة، وتشابك الإرسال مع فورم
 * الإعدادات كان سيجعل كل حفظ إعدادات يحمل بيانات بوابة لم تتغيّر.
 */
import { useEffect, useState } from "react";
import { Button, Card, ErrorNote, Field, Input, Switch, useToast } from "@/components/ui";
import {
  getPaymentSettings,
  savePaymentSettings,
  updateOnlinePayment,
  type PaymentSettings,
} from "@/lib/data";
import { strOrNull } from "@/lib/utils";
import type { Restaurant } from "@/lib/types";

export function PaymentSettingsCard({
  restaurant,
  userId,
  onToggled,
}: {
  restaurant: Restaurant;
  userId: string;
  /** يُبلِّغ اللوحة بالحالة الجديدة كي لا تعرض قيمة قديمة بعد الحفظ. */
  onToggled: (enabled: boolean) => void;
}) {
  const toast = useToast();
  /** `null` = يُحمَّل الآن · `undefined` تعني «لا صف بعد» فنُميّزها بـ`loaded`. */
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [apiId, setApiId] = useState("");
  const [secret, setSecret] = useState("");
  const [enabled, setEnabled] = useState(restaurant.online_payment_enabled === true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getPaymentSettings(restaurant.id)
      .then((row) => {
        if (cancelled) return;
        setSettings(row);
        setApiId(row?.api_id ?? "");
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [restaurant.id]);

  const hasSecret = !!settings?.has_secret || secret.trim().length > 0;
  const ready = apiId.trim().length > 0 && hasSecret;

  async function save() {
    // التشغيل بلا بيانات اعتماد يجعل كل طلب زبون يرتدّ بـ«الدفع غير مفعّل» —
    // نمنعه هنا بدل أن يكتشفه التاجر من زبون غاضب.
    if (enabled && !ready) {
      return setError("أدخل مُعرّف الحساب والمفتاح السرّي قبل تشغيل الدفع.");
    }
    setBusy(true);
    setError("");
    try {
      await savePaymentSettings({
        restaurant_id: restaurant.id,
        user_id: userId,
        api_id: strOrNull(apiId),
        // `null` = أبقِ المفتاح المحفوظ كما هو (لا نملك قيمته لنعيد إرسالها).
        secret_key: secret.trim() ? secret.trim() : null,
        enabled,
      });
      await updateOnlinePayment(restaurant.id, enabled);
      onToggled(enabled);
      setSettings((s) =>
        s
          ? { ...s, api_id: strOrNull(apiId), enabled, has_secret: hasSecret }
          : {
              restaurant_id: restaurant.id,
              provider: "paylink",
              api_id: strOrNull(apiId),
              enabled,
              has_secret: hasSecret,
            }
      );
      setSecret("");
      toast("حُفظت إعدادات الدفع ✓");
    } catch {
      setError("تعذّر الحفظ. تأكد من اتصالك وحاول مجدداً.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-lg font-extrabold text-ink">💳 الدفع الإلكتروني</h2>
        <p className="mt-1 text-sm text-dim">
          يطلب زبونك من المنيو ويدفع مباشرة <b className="text-ink">لحسابك أنت</b> —
          كلاود منيو لا تمرّ بها أموالك ولا تأخذ عمولة عليها.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-panel2 px-4 py-3">
        <div>
          <p className="text-sm font-bold text-ink">🛒 سلة الطلب في المنيو</p>
          <p className="text-xs text-faint">
            {enabled
              ? "زبونك يرى زرّ الإضافة وشريط الطلب أسفل منيوك."
              : "مطفأة — منيوك للعرض فقط."}
          </p>
        </div>
        <Switch checked={enabled} onChange={setEnabled} label="الدفع الإلكتروني" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="مُعرّف الحساب (API ID)" hint="من لوحة PayLink ← الإعدادات ← مفاتيح API">
          <Input
            dir="ltr"
            value={apiId}
            onChange={(e) => setApiId(e.target.value.trim())}
            placeholder={loaded ? "APP_ID_…" : "…"}
            autoComplete="off"
          />
        </Field>
        <Field
          label="المفتاح السرّي (Secret Key)"
          hint={
            settings?.has_secret
              ? "محفوظ ✓ — اتركه فارغاً ليبقى كما هو، أو اكتب مفتاحاً جديداً ليحلّ محلّه."
              : "يُحفظ مشفَّراً على الخادم ولا يُعرض بعدها أبداً."
          }
        >
          <Input
            dir="ltr"
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder={settings?.has_secret ? "••••••••  (محفوظ)" : ""}
            autoComplete="new-password"
          />
        </Field>
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={busy || !loaded}>
          {busy ? "جارٍ الحفظ…" : "حفظ إعدادات الدفع"}
        </Button>
        <a
          href="https://paylink.sa"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-bold text-gold hover:underline"
        >
          ليس لديك حساب PayLink؟ ↗
        </a>
      </div>

      <p className="text-xs leading-relaxed text-faint">
        الأسعار تُحسب من منيوك على الخادم لا من جهاز الزبون، فلا يستطيع أحد تعديل
        المبلغ. وحدّ PayLink الأدنى للفاتورة ٥ ر.س.
      </p>
    </Card>
  );
}

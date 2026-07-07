"use client";

import { useActionState } from "react";
import { saveSiteSettings } from "@/app/founder/actions";
import type { ActionState } from "@/app/dashboard/actions";
import type { SiteSettings } from "@/lib/settings";
import { PAYMENT_PROVIDERS } from "@/lib/payments";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function Toggle({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line-dim bg-white/5 p-4">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-1 h-4 w-4 accent-gold"
      />
      <span>
        <span className="block font-semibold text-cream">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
    </label>
  );
}

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    saveSiteSettings,
    {}
  );

  return (
    <Card>
      <form action={action} className="flex flex-col gap-6">
        <div>
          <h2 className="font-display text-lg font-bold text-cream">أعلام الميزات</h2>
          <p className="mt-1 text-sm text-warm">تحكّم عام بميزات المنصّة كلها.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Toggle
              name="orders_enabled"
              label="سلة الطلبات"
              hint="إظهار سلة الطلب في المنيو العام."
              defaultChecked={settings.features.orders_enabled}
            />
            <Toggle
              name="payment_enabled"
              label="الدفع والترقية"
              hint="إظهار أزرار الدفع/الاشتراك للتجار."
              defaultChecked={settings.features.payment_enabled}
            />
          </div>
        </div>

        <div className="border-t border-line-dim pt-6">
          <h2 className="font-display text-lg font-bold text-cream">بوابة الدفع</h2>
          <p className="mt-1 text-sm text-warm">
            البوابة المستخدمة لاشتراكات التجار. تأكد من ضبط مفاتيح البوابة في
            أسرار Supabase (Edge Functions → Secrets) قبل التفعيل.
          </p>
          <div className="mt-4">
            <Field label="البوابة النشطة" htmlFor="payment_provider">
              <select
                id="payment_provider"
                name="payment_provider"
                defaultValue={settings.features.payment_provider}
                className="w-full rounded-xl border border-line-dim bg-white/5 px-4 py-2.5 text-sm text-cream focus:border-gold focus:outline-none"
              >
                {PAYMENT_PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id} className="bg-charcoal">
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <div className="border-t border-line-dim pt-6">
          <h2 className="font-display text-lg font-bold text-cream">تذييل الموقع</h2>
          <p className="mt-1 text-sm text-warm">النص الظاهر أسفل كل الصفحات العامة.</p>
          <div className="mt-4 flex flex-col gap-4">
            <Field label="نبذة" htmlFor="about">
              <Textarea id="about" name="about" defaultValue={settings.footer.about} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="رابط/نص الشروط" htmlFor="terms">
                <Input id="terms" name="terms" defaultValue={settings.footer.terms} />
              </Field>
              <Field label="رابط/نص الخصوصية" htmlFor="privacy">
                <Input id="privacy" name="privacy" defaultValue={settings.footer.privacy} />
              </Field>
            </div>
          </div>
        </div>

        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        {state.message && <p className="text-sm text-success">{state.message}</p>}

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
        </Button>
      </form>
    </Card>
  );
}

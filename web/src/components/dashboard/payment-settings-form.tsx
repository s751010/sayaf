"use client";

import { useActionState } from "react";
import { ShieldCheck, Trash2 } from "lucide-react";
import {
  deletePaymentSettings,
  savePaymentSettings,
} from "@/app/dashboard/payments/actions";
import type { ActionState } from "@/app/dashboard/actions";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function PaymentSettingsForm({
  restaurantId,
  configured,
  enabled,
  apiId,
}: {
  restaurantId: string;
  configured: boolean;
  enabled: boolean;
  apiId: string | null;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    savePaymentSettings,
    {}
  );

  return (
    <Card>
      <form action={action} className="flex flex-col gap-5">
        <input type="hidden" name="restaurant_id" value={restaurantId} />

        <div className="flex items-center gap-2 text-sm">
          <ShieldCheck
            size={16}
            className={configured ? "text-success" : "text-muted"}
          />
          <span className={configured ? "text-success" : "text-warm"}>
            {configured ? "البيانات مضبوطة" : "لم تُضبط بيانات الاعتماد بعد"}
          </span>
        </div>

        <Field label="PayLink API ID" htmlFor="api_id">
          <Input
            id="api_id"
            name="api_id"
            dir="ltr"
            defaultValue={apiId ?? ""}
            placeholder="APP_ID_1123453311"
            className="font-mono text-sm"
          />
        </Field>

        <Field label="PayLink Secret Key" htmlFor="secret_key">
          <Input
            id="secret_key"
            name="secret_key"
            type="password"
            dir="ltr"
            autoComplete="off"
            placeholder={configured ? "محفوظ — اتركه فارغاً للإبقاء عليه" : "0662abb5-13c7-…"}
            className="font-mono text-sm"
          />
        </Field>
        <p className="-mt-3 text-xs text-muted">
          لا يُعرض المفتاح المحفوظ مرة أخرى. لتغييره الصق مفتاحاً جديداً، ولإبقائه
          كما هو اترك الخانة فارغة.
        </p>

        <label className="flex items-start gap-3 rounded-xl border border-line-dim bg-white/5 p-4">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={enabled}
            className="mt-1 h-4 w-4 accent-gold"
          />
          <span>
            <span className="block font-semibold text-cream">
              تفعيل زر «ادفع الآن» في منيوي
            </span>
            <span className="block text-xs text-muted">
              يظهر للزبون بعد إضافة أصناف للسلة، ويحوّله لصفحة دفع باسم مطعمك.
            </span>
          </span>
        </label>

        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        {state.message && <p className="text-sm text-success">{state.message}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "جارٍ الحفظ..." : "حفظ"}
          </Button>
          {configured && (
            <Button
              type="submit"
              variant="outline"
              formAction={deletePaymentSettings}
              className="text-danger"
            >
              <Trash2 size={14} />
              حذف البيانات
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}

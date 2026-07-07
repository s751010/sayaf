"use client";

import { useActionState } from "react";
import { createPromo } from "@/app/founder/actions";
import type { ActionState } from "@/app/dashboard/actions";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function PromoForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    createPromo,
    {}
  );

  return (
    <Card>
      <form action={action} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="الكود" htmlFor="code" hint="يُحفظ بأحرف كبيرة تلقائياً">
            <Input id="code" name="code" required dir="ltr" placeholder="WELCOME20" />
          </Field>
          <Field label="نسبة الخصم (%)" htmlFor="discount">
            <Input id="discount" name="discount" type="number" min="1" max="100" required dir="ltr" />
          </Field>
          <Field label="تاريخ الانتهاء (اختياري)" htmlFor="expiry_date">
            <Input id="expiry_date" name="expiry_date" type="date" dir="ltr" />
          </Field>
          <Field label="أقصى استخدامات (اختياري)" htmlFor="max_uses">
            <Input id="max_uses" name="max_uses" type="number" min="1" dir="ltr" />
          </Field>
        </div>
        <Field label="الوصف (اختياري)" htmlFor="description">
          <Input id="description" name="description" placeholder="خصم ترحيبي للمشتركين الجدد" />
        </Field>

        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        {state.message && <p className="text-sm text-success">{state.message}</p>}

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "جارٍ الإنشاء..." : "إنشاء الكود"}
        </Button>
      </form>
    </Card>
  );
}

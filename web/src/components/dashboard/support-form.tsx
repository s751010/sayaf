"use client";

import { useActionState } from "react";
import {
  createSupportTicket,
  TICKET_CATEGORIES,
} from "@/app/dashboard/support/actions";
import type { ActionState } from "@/app/dashboard/actions";
import { Field, Input, Textarea, fieldClass } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function SupportForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    createSupportTicket,
    {}
  );

  return (
    <Card>
      <form action={action} className="flex flex-col gap-4">
        <Field label="التصنيف" htmlFor="category">
          <select id="category" name="category" className={fieldClass}>
            {TICKET_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id} className="bg-charcoal-2">
                {c.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="الموضوع" htmlFor="subject">
          <Input id="subject" name="subject" required placeholder="ملخص المشكلة أو الطلب" />
        </Field>

        <Field label="الرسالة" htmlFor="message">
          <Textarea id="message" name="message" required className="min-h-32" placeholder="اشرح التفاصيل..." />
        </Field>

        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        {state.message && <p className="text-sm text-success">{state.message}</p>}

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "جارٍ الإرسال..." : "إرسال التذكرة"}
        </Button>
      </form>
    </Card>
  );
}

"use client";

import { useActionState } from "react";
import { saveAnnouncement } from "@/app/founder/actions";
import type { ActionState } from "@/app/dashboard/actions";
import { Field, Input, Textarea, fieldClass } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function AnnouncementForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    saveAnnouncement,
    {}
  );

  return (
    <Card>
      <form action={action} className="flex flex-col gap-4">
        <Field label="عنوان الإعلان" htmlFor="title">
          <Input id="title" name="title" required />
        </Field>
        <Field label="نص الإعلان" htmlFor="body">
          <Textarea id="body" name="body" required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="النوع" htmlFor="type">
            <select id="type" name="type" className={fieldClass}>
              <option value="info" className="bg-charcoal-2">معلومة</option>
              <option value="update" className="bg-charcoal-2">تحديث</option>
              <option value="warning" className="bg-charcoal-2">تنبيه</option>
              <option value="promo" className="bg-charcoal-2">عرض</option>
            </select>
          </Field>
          <Field label="الجمهور" htmlFor="audience">
            <select id="audience" name="audience" className={fieldClass}>
              <option value="all" className="bg-charcoal-2">جميع التجار</option>
              <option value="standard" className="bg-charcoal-2">باقة الأساسية</option>
              <option value="premium" className="bg-charcoal-2">باقة الاحترافية</option>
            </select>
          </Field>
        </div>

        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        {state.message && <p className="text-sm text-success">{state.message}</p>}

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "جارٍ النشر..." : "نشر الإعلان"}
        </Button>
      </form>
    </Card>
  );
}

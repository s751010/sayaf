"use client";

import { useActionState } from "react";
import { grantSubscription, cancelSubscription } from "@/app/founder/actions";
import type { ActionState } from "@/app/dashboard/actions";
import { Field, fieldClass } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function SubscriptionControls({
  userId,
  currentPlan,
}: {
  userId: string | null;
  currentPlan: string | null;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    grantSubscription,
    {}
  );

  if (!userId) {
    return (
      <Card className="text-sm text-warm">
        هذا المطعم غير مرتبط بحساب مستخدم، فلا يمكن إدارة اشتراكه.
      </Card>
    );
  }

  return (
    <Card>
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="user_id" value={userId} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="الباقة" htmlFor="plan_id">
            <select
              id="plan_id"
              name="plan_id"
              defaultValue={currentPlan === "premium" ? "premium" : "standard"}
              className={fieldClass}
            >
              <option value="standard" className="bg-charcoal-2">الأساسية</option>
              <option value="premium" className="bg-charcoal-2">الاحترافية</option>
            </select>
          </Field>
          <Field label="المدة (أشهر)" htmlFor="months">
            <select id="months" name="months" defaultValue="1" className={fieldClass}>
              <option value="1" className="bg-charcoal-2">شهر</option>
              <option value="3" className="bg-charcoal-2">3 أشهر</option>
              <option value="6" className="bg-charcoal-2">6 أشهر</option>
              <option value="12" className="bg-charcoal-2">سنة</option>
            </select>
          </Field>
        </div>

        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        {state.message && <p className="text-sm text-success">{state.message}</p>}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "جارٍ التفعيل..." : "تفعيل / تمديد الاشتراك"}
          </Button>
        </div>
      </form>

      <form action={cancelSubscription} className="mt-3 border-t border-line-dim pt-3">
        <input type="hidden" name="user_id" value={userId} />
        <Button type="submit" variant="ghost" size="sm" className="text-danger">
          إلغاء الاشتراك النشط
        </Button>
      </form>
    </Card>
  );
}

"use client";

import { useActionState } from "react";
import { createRestaurant, type ActionState } from "@/app/dashboard/actions";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SITE_URL } from "@/lib/site";

const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");

export function RestaurantOnboarding() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    createRestaurant,
    {}
  );

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-2xl font-bold text-cream">
        لننشئ مطعمك أولاً 🎉
      </h1>
      <p className="mt-1 text-warm">
        هذه المعلومات الأساسية لصفحة منيو مطعمك العامة.
      </p>

      <Card className="mt-6">
        <form action={action} className="flex flex-col gap-4">
          <Field label="اسم المطعم" htmlFor="name">
            <Input id="name" name="name" required placeholder="مثال: مطعم الذواقة" />
          </Field>
          <Field
            label="رابط المطعم (slug)"
            htmlFor="slug"
            hint={`سيظهر في الرابط: ${SITE_HOST}/your-slug`}
          >
            <Input id="slug" name="slug" dir="ltr" placeholder="al-thawaqa" />
          </Field>
          <Field label="نوع المطعم" htmlFor="type">
            <Input id="type" name="type" placeholder="مشاوي، قهوة، حلويات..." />
          </Field>

          {state.error && <p className="text-sm text-danger">{state.error}</p>}

          <Button type="submit" disabled={pending} className="mt-2">
            {pending ? "جارٍ الإنشاء..." : "إنشاء المطعم"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

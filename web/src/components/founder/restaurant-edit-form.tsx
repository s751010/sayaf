"use client";

import { useActionState } from "react";
import { updateRestaurantFounder } from "@/app/founder/actions";
import type { ActionState } from "@/app/dashboard/actions";
import type { Restaurant } from "@/lib/types";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function RestaurantEditForm({ restaurant }: { restaurant: Restaurant }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    updateRestaurantFounder,
    {}
  );

  return (
    <Card>
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={restaurant.id} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="اسم المطعم" htmlFor="name">
            <Input id="name" name="name" defaultValue={restaurant.name} required />
          </Field>
          <Field label="النوع" htmlFor="type">
            <Input id="type" name="type" defaultValue={restaurant.type ?? ""} />
          </Field>
          <Field label="الرابط (slug)" htmlFor="slug" hint="يظهر في عنوان صفحة المنيو">
            <Input id="slug" name="slug" defaultValue={restaurant.slug ?? ""} dir="ltr" />
          </Field>
          <Field label="الجوال" htmlFor="phone">
            <Input id="phone" name="phone" defaultValue={restaurant.phone ?? ""} dir="ltr" />
          </Field>
          <Field label="العنوان" htmlFor="address">
            <Input id="address" name="address" defaultValue={restaurant.address ?? ""} />
          </Field>
          <Field label="رابط تقييم قوقل" htmlFor="google_review_url">
            <Input
              id="google_review_url"
              name="google_review_url"
              defaultValue={restaurant.google_review_url ?? ""}
              dir="ltr"
            />
          </Field>
          <Field label="واتساب" htmlFor="social_whatsapp">
            <Input
              id="social_whatsapp"
              name="social_whatsapp"
              defaultValue={restaurant.social_whatsapp ?? ""}
              dir="ltr"
            />
          </Field>
          <Field label="إنستقرام" htmlFor="social_instagram">
            <Input
              id="social_instagram"
              name="social_instagram"
              defaultValue={restaurant.social_instagram ?? ""}
              dir="ltr"
            />
          </Field>
        </div>

        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        {state.message && <p className="text-sm text-success">{state.message}</p>}

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "جارٍ الحفظ..." : "حفظ بيانات المطعم"}
        </Button>
      </form>
    </Card>
  );
}

"use client";

import { useActionState } from "react";
import { saveDish, type ActionState } from "@/app/dashboard/actions";
import { Field, Input, Textarea, fieldClass } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Dish, Menu } from "@/lib/types";

export function DishForm({ menus, dish }: { menus: Menu[]; dish?: Dish }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    saveDish,
    {}
  );

  return (
    <Card>
      <form action={action} className="flex flex-col gap-4">
        {dish && <input type="hidden" name="id" value={dish.id} />}

        <Field label="القائمة" htmlFor="menu_id">
          <select
            id="menu_id"
            name="menu_id"
            required
            defaultValue={dish?.menu_id ?? menus[0]?.id ?? ""}
            className={fieldClass}
          >
            {menus.map((m) => (
              <option key={m.id} value={m.id} className="bg-charcoal-2">
                {m.name || "قائمة"}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <Field label="اسم الصنف" htmlFor="name">
            <Input id="name" name="name" required defaultValue={dish?.name ?? ""} />
          </Field>
          <Field label="إيموجي" htmlFor="emoji">
            <Input
              id="emoji"
              name="emoji"
              maxLength={4}
              className="w-20 text-center"
              defaultValue={dish?.emoji ?? "🍽"}
            />
          </Field>
        </div>

        <Field label="الوصف" htmlFor="description">
          <Textarea
            id="description"
            name="description"
            defaultValue={dish?.description ?? ""}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="السعر (ر.س)" htmlFor="price">
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={dish?.price ?? ""}
            />
          </Field>
          <Field label="القسم" htmlFor="category">
            <Input
              id="category"
              name="category"
              placeholder="المقبلات، الأطباق الرئيسية..."
              defaultValue={dish?.category ?? ""}
            />
          </Field>
        </div>

        <Field label="رابط الصورة" htmlFor="image" hint="رابط صورة الصنف (اختياري)">
          <Input id="image" name="image" dir="ltr" defaultValue={dish?.image ?? ""} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="السعرات" htmlFor="calories">
            <Input id="calories" name="calories" type="number" min="0" defaultValue={dish?.calories ?? ""} />
          </Field>
          <Field label="الصوديوم (mg)" htmlFor="sodium_mg">
            <Input id="sodium_mg" name="sodium_mg" type="number" min="0" defaultValue={dish?.sodium_mg ?? ""} />
          </Field>
          <Field label="الكافيين (mg)" htmlFor="caffeine_mg">
            <Input id="caffeine_mg" name="caffeine_mg" type="number" min="0" defaultValue={dish?.caffeine_mg ?? ""} />
          </Field>
        </div>

        <div className="flex flex-wrap gap-6 pt-1">
          <label className="flex items-center gap-2 text-sm text-cream">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={dish?.featured ?? false}
              className="h-4 w-4 accent-gold"
            />
            صنف مميز
          </label>
          <label className="flex items-center gap-2 text-sm text-cream">
            <input
              type="checkbox"
              name="available"
              defaultChecked={dish?.available ?? true}
              className="h-4 w-4 accent-gold"
            />
            متاح للعرض
          </label>
        </div>

        {state.error && <p className="text-sm text-danger">{state.error}</p>}

        <Button type="submit" disabled={pending} className="mt-2 self-start">
          {pending ? "جارٍ الحفظ..." : dish ? "حفظ التعديلات" : "إضافة الصنف"}
        </Button>
      </form>
    </Card>
  );
}

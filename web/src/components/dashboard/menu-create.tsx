"use client";

import { useActionState } from "react";
import { createMenu, type ActionState } from "@/app/dashboard/actions";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function MenuCreate() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    createMenu,
    {}
  );

  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <div className="flex-1">
        <Input name="name" required placeholder="اسم القائمة الجديدة (مثال: قائمة الإفطار)" />
        {state.error && <p className="mt-1 text-sm text-danger">{state.error}</p>}
        {state.message && (
          <p className="mt-1 text-sm text-success">{state.message}</p>
        )}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "..." : "إضافة قائمة"}
      </Button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { Copy } from "lucide-react";
import { duplicateMenu } from "@/app/dashboard/actions";
import type { ActionState } from "@/app/dashboard/actions";

/** زر «نسخ» لقائمة واحدة — ينسخ القائمة بكل أصنافها في عملية واحدة. */
export function MenuDuplicate({ menuId }: { menuId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    duplicateMenu,
    {}
  );

  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="menu_id" value={menuId} />
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1.5 rounded-lg border border-line-dim px-3 py-1.5 text-xs font-semibold text-warm transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
      >
        <Copy size={13} />
        {pending ? "جارٍ النسخ…" : "نسخ"}
      </button>
      {state.error && <span className="text-xs text-danger">{state.error}</span>}
      {state.message && <span className="text-xs text-success">{state.message}</span>}
    </form>
  );
}

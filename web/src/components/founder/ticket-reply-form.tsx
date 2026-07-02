"use client";

import { useActionState } from "react";
import { replyTicket } from "@/app/founder/actions";
import type { ActionState } from "@/app/dashboard/actions";
import { Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function TicketReplyForm({
  ticketId,
  initialReply,
}: {
  ticketId: string;
  initialReply?: string | null;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    replyTicket,
    {}
  );

  return (
    <form action={action} className="mt-3 flex flex-col gap-2">
      <input type="hidden" name="id" value={ticketId} />
      <input type="hidden" name="status" value="resolved" />
      <Textarea
        name="admin_reply"
        required
        defaultValue={initialReply ?? ""}
        placeholder="اكتب ردّك على التاجر..."
        className="min-h-20 text-sm"
      />
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
      {state.message && <p className="text-xs text-success">{state.message}</p>}
      <Button type="submit" size="sm" disabled={pending} className="self-start">
        {pending ? "جارٍ الإرسال..." : "إرسال الرد وإغلاق"}
      </Button>
    </form>
  );
}

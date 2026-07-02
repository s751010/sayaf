import { createServerSupabase } from "@/lib/supabase/server";
import { isFounder } from "@/lib/founder";
import { setTicketStatus } from "@/app/founder/actions";
import { FounderNav } from "@/components/founder/founder-nav";
import { FounderDenied } from "@/components/founder/denied";
import { TicketReplyForm } from "@/components/founder/ticket-reply-form";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type Ticket = {
  id: string;
  user_name: string | null;
  email: string | null;
  restaurant_name: string | null;
  subject: string | null;
  message: string | null;
  status: string | null;
  admin_read: boolean | null;
  admin_reply: string | null;
  created_at: string;
};

export default async function FounderSupportPage() {
  if (!(await isFounder())) return <FounderDenied />;

  const supabase = await createServerSupabase();
  const { data } = await supabase!
    .from("support_tickets")
    .select("*")
    .order("created_at", { ascending: false });
  const tickets = (data ?? []) as Ticket[];
  const openCount = tickets.filter((t) => t.status === "open").length;

  return (
    <main className="flex-1 px-[var(--page-px,clamp(16px,5vw,60px))] py-10">
      <div className="mx-auto max-w-4xl">
        <FounderNav />
        <h1 className="font-display text-2xl font-bold text-cream">💬 تذاكر الدعم</h1>
        <p className="mt-1 text-warm">
          {tickets.length} تذكرة — {openCount} مفتوحة
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {tickets.length === 0 && (
            <Card className="text-center text-warm">لا توجد تذاكر.</Card>
          )}
          {tickets.map((t) => (
            <Card key={t.id}>
              <div className="flex flex-wrap items-center gap-2">
                <p className="flex-1 font-bold text-cream">{t.subject}</p>
                {!t.admin_read && <Badge variant="gold">جديدة</Badge>}
                <Badge variant={t.status === "open" ? "red" : "green"}>
                  {t.status === "open" ? "مفتوحة" : t.status === "resolved" ? "تم الحل" : "مغلقة"}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted">
                {t.user_name}
                {t.restaurant_name && ` · ${t.restaurant_name}`}
                {t.email && (
                  <span dir="ltr"> · {t.email}</span>
                )}{" "}
                · {new Date(t.created_at).toLocaleDateString("ar-SA")}
              </p>
              {t.message && <p className="mt-3 text-sm text-warm">{t.message}</p>}

              {t.admin_reply && (
                <div className="mt-3 rounded-xl border border-gold/25 bg-gold/8 p-3">
                  <p className="text-xs font-bold text-gold">ردّك:</p>
                  <p className="mt-1 text-sm text-cream">{t.admin_reply}</p>
                </div>
              )}

              {t.status === "open" ? (
                <TicketReplyForm ticketId={t.id} initialReply={t.admin_reply} />
              ) : (
                <form action={setTicketStatus} className="mt-3">
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="status" value="open" />
                  <Button type="submit" variant="ghost" size="sm">
                    إعادة فتح
                  </Button>
                </form>
              )}
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}

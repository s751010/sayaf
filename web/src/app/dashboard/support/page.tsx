import { createServerSupabase, getCurrentUser } from "@/lib/supabase/server";
import { SupportForm } from "@/components/dashboard/support-form";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

type Ticket = {
  id: string;
  subject: string | null;
  message: string | null;
  status: string | null;
  admin_reply: string | null;
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  open: "مفتوحة",
  closed: "مغلقة",
  resolved: "تم الحل",
};

export default async function SupportPage() {
  const supabase = await createServerSupabase();
  const user = await getCurrentUser();

  let tickets: Ticket[] = [];
  if (supabase && user) {
    const { data } = await supabase
      .from("support_tickets")
      .select("id, subject, message, status, admin_reply, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    tickets = (data ?? []) as Ticket[];
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-bold text-cream">الدعم الفني</h1>
      <p className="mt-1 text-warm">أرسل تذكرة وسيرد عليك فريق كلاود منيو.</p>

      <div className="mt-8">
        <SupportForm />
      </div>

      {tickets.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 font-display text-lg font-bold text-cream">تذاكرك السابقة</h2>
          <div className="flex flex-col gap-3">
            {tickets.map((t) => (
              <Card key={t.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-cream">{t.subject}</p>
                  <Badge variant={t.status === "open" ? "gold" : "green"}>
                    {STATUS_LABEL[t.status ?? "open"] ?? t.status}
                  </Badge>
                </div>
                {t.message && <p className="mt-2 text-sm text-warm">{t.message}</p>}
                {t.admin_reply && (
                  <div className="mt-3 rounded-xl border border-gold/25 bg-gold/8 p-3">
                    <p className="text-xs font-bold text-gold">رد الدعم:</p>
                    <p className="mt-1 text-sm text-cream">{t.admin_reply}</p>
                  </div>
                )}
                <p className="mt-2 text-xs text-muted">
                  {new Date(t.created_at).toLocaleDateString("ar-SA")}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { createServerSupabase } from "@/lib/supabase/server";
import { isFounder } from "@/lib/founder";
import { toggleAnnouncement, deleteAnnouncement } from "@/app/founder/actions";
import { FounderNav } from "@/components/founder/founder-nav";
import { FounderDenied } from "@/components/founder/denied";
import { AnnouncementForm } from "@/components/founder/announcement-form";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type Announcement = {
  id: string;
  title: string | null;
  body: string | null;
  type: string | null;
  audience: string | null;
  status: string | null;
  created_at: string;
};

const AUDIENCE_LABEL: Record<string, string> = {
  all: "الجميع",
  standard: "الأساسية",
  premium: "الاحترافية",
  basic: "الأساسية (قديم)",
};

export default async function FounderAnnouncementsPage() {
  if (!(await isFounder())) return <FounderDenied />;

  const supabase = await createServerSupabase();
  const { data } = await supabase!
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });
  const items = (data ?? []) as Announcement[];

  return (
    <main className="flex-1 px-[var(--page-px,clamp(16px,5vw,60px))] py-10">
      <div className="mx-auto max-w-4xl">
        <FounderNav />
        <h1 className="font-display text-2xl font-bold text-cream">📢 إعلانات المنصة</h1>
        <p className="mt-1 text-warm">تظهر للتجار في لوحة التحكم حسب الجمهور المستهدف.</p>

        <div className="mt-6">
          <AnnouncementForm />
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {items.map((a) => (
            <Card key={a.id}>
              <div className="flex flex-wrap items-center gap-2">
                <p className="flex-1 font-bold text-cream">{a.title}</p>
                <Badge variant={a.status === "active" ? "green" : "neutral"}>
                  {a.status === "active" ? "نشط" : "موقوف"}
                </Badge>
                <Badge variant="neutral">
                  {AUDIENCE_LABEL[a.audience ?? "all"] ?? a.audience}
                </Badge>
              </div>
              {a.body && <p className="mt-2 text-sm text-warm">{a.body}</p>}
              <div className="mt-3 flex gap-2">
                <form action={toggleAnnouncement}>
                  <input type="hidden" name="id" value={a.id} />
                  <input
                    type="hidden"
                    name="next"
                    value={a.status === "active" ? "paused" : "active"}
                  />
                  <Button type="submit" variant="ghost" size="sm">
                    {a.status === "active" ? "⏸ إيقاف" : "▶ تفعيل"}
                  </Button>
                </form>
                <form action={deleteAnnouncement}>
                  <input type="hidden" name="id" value={a.id} />
                  <Button type="submit" variant="ghost" size="sm" className="text-danger">
                    🗑 حذف
                  </Button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}

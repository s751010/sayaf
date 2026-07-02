import { Megaphone } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import { getMyEntitlements } from "@/lib/entitlements";

type Announcement = {
  id: string;
  title: string | null;
  body: string | null;
  type: string | null;
  audience: string | null;
};

/**
 * إعلانات المنصة للتجار — تُعرض النشطة الموجّهة للجميع (all) أو لباقة
 * التاجر الحالية، بنفس منطق النسخة القديمة.
 */
export async function Announcements() {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const [{ data }, ent] = await Promise.all([
    supabase
      .from("announcements")
      .select("id, title, body, type, audience")
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    getMyEntitlements(),
  ]);

  const items = ((data ?? []) as Announcement[]).filter(
    (a) => !a.audience || a.audience === "all" || a.audience === ent.planId
  );
  if (items.length === 0) return null;

  return (
    <div className="mb-6 flex flex-col gap-3">
      {items.map((a) => (
        <div
          key={a.id}
          className="flex items-start gap-3 rounded-2xl border border-gold/25 bg-gold/8 p-4"
        >
          <span className="mt-0.5 shrink-0 text-gold">
            <Megaphone size={18} />
          </span>
          <div>
            {a.title && <p className="font-bold text-cream">{a.title}</p>}
            {a.body && <p className="mt-0.5 text-sm text-warm">{a.body}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

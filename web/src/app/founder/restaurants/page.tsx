import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { isFounder } from "@/lib/founder";
import { FounderNav } from "@/components/founder/founder-nav";
import { FounderDenied } from "@/components/founder/denied";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resolvePlan } from "@/lib/plans";

export const dynamic = "force-dynamic";

type RestaurantRow = {
  id: string;
  user_id: string | null;
  name: string;
  slug: string | null;
  type: string | null;
  phone: string | null;
  created_at: string;
};

type SubRow = {
  user_id: string | null;
  plan_id: string | null;
  end_date: string | null;
  active: boolean | null;
  created_at: string;
};

const DAY = 24 * 60 * 60 * 1000;

type SubBadge = { label: string; variant: "neutral" | "red" | "green" };

/** حالة اشتراك مطعم كبادج (تُحسب خارج المكوّن لثبات القيمة أثناء الرندر). */
function subBadge(r: RestaurantRow, subsByUser: Map<string, SubRow>): SubBadge {
  const s = r.user_id ? subsByUser.get(r.user_id) : undefined;
  if (!s || !s.active) return { label: "بدون اشتراك", variant: "neutral" };
  const now = Date.now();
  const ends = s.end_date ? new Date(s.end_date).getTime() : null;
  const planName = resolvePlan(s.plan_id).name;
  if (ends !== null && ends < now)
    return { label: `${planName} — منتهٍ`, variant: "red" };
  if (ends !== null && ends - now < 7 * DAY)
    return {
      label: `${planName} — ينتهي ${new Date(ends).toLocaleDateString("ar-SA")}`,
      variant: "red",
    };
  return {
    label: planName + (ends ? ` حتى ${new Date(ends).toLocaleDateString("ar-SA")}` : ""),
    variant: "green",
  };
}

export default async function FounderRestaurantsPage() {
  if (!(await isFounder())) return <FounderDenied />;

  const supabase = await createServerSupabase();
  const [{ data: restaurants }, { data: subs }] = await Promise.all([
    supabase!
      .from("restaurants")
      .select("id, user_id, name, slug, type, phone, created_at")
      .order("created_at", { ascending: false }),
    supabase!
      .from("subscriptions")
      .select("user_id, plan_id, end_date, active, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const rows = (restaurants ?? []) as RestaurantRow[];
  const subsByUser = new Map<string, SubRow>();
  for (const s of (subs ?? []) as SubRow[]) {
    // أحدث اشتراك لكل مستخدم (القائمة مرتبة تنازلياً).
    if (s.user_id && !subsByUser.has(s.user_id)) subsByUser.set(s.user_id, s);
  }

  const badges = new Map(rows.map((r) => [r.id, subBadge(r, subsByUser)]));
  const expiringSoon = [...badges.values()].filter((b) => b.variant === "red").length;

  return (
    <main className="flex-1 px-[var(--page-px,clamp(16px,5vw,60px))] py-10">
      <div className="mx-auto max-w-5xl">
        <FounderNav />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-cream">المطاعم والاشتراكات</h1>
            <p className="mt-1 text-warm">
              {rows.length} مطعم مسجّل
              {expiringSoon > 0 && (
                <span className="text-danger"> — ⚠️ {expiringSoon} اشتراك منتهٍ أو ينتهي قريباً</span>
              )}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {rows.length === 0 && (
            <Card className="text-center text-warm">لا توجد مطاعم مسجّلة بعد.</Card>
          )}
          {rows.map((r) => {
            const s = badges.get(r.id)!;
            return (
              <Card key={r.id} className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-cream">{r.name}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {r.type && <span>{r.type} · </span>}
                    {r.slug && (
                      <a
                        href={`/${r.slug}`}
                        target="_blank"
                        className="text-gold hover:underline"
                        dir="ltr"
                      >
                        /{r.slug}
                      </a>
                    )}
                    {r.phone && <span dir="ltr"> · {r.phone}</span>}
                  </p>
                </div>
                <Badge variant={s.variant}>{s.label}</Badge>
                <span className="text-xs text-muted">
                  انضم {new Date(r.created_at).toLocaleDateString("ar-SA")}
                </span>
                <Link href={`/founder/restaurants/${r.id}`}>
                  <Button variant="outline" size="sm">
                    إدارة
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}

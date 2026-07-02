import { Wallet, Users, LifeBuoy, Store, Eye, UtensilsCrossed } from "lucide-react";
import { createServerSupabase, getCurrentUser } from "@/lib/supabase/server";
import { isFounder } from "@/lib/founder";
import { FounderNav } from "@/components/founder/founder-nav";
import { FounderDenied } from "@/components/founder/denied";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function FounderPage() {
  const user = await getCurrentUser();
  if (!user) return <FounderDenied message="سجّل الدخول بحساب المؤسس للوصول." />;
  if (!process.env.FOUNDER_EMAIL)
    return <FounderDenied message="لم يُضبط FOUNDER_EMAIL في إعدادات البيئة بعد." />;
  if (!(await isFounder())) return <FounderDenied />;

  const supabase = await createServerSupabase();
  const [
    { data: revenue },
    { count: activeSubs },
    { count: openTickets },
    { count: restaurants },
    { count: dishes },
    { data: menuViews },
  ] = await Promise.all([
    supabase!.from("revenue_log").select("amount"),
    supabase!
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("active", true),
    supabase!
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase!
      .from("restaurants")
      .select("id", { count: "exact", head: true }),
    supabase!.from("dishes").select("id", { count: "exact", head: true }),
    supabase!.from("menus").select("views"),
  ]);

  const totalRevenue = (revenue ?? []).reduce(
    (s: number, r: { amount: number | null }) => s + (r.amount ?? 0),
    0
  );
  const totalViews = ((menuViews ?? []) as { views: number | null }[]).reduce(
    (s, r) => s + (r.views ?? 0),
    0
  );

  const stats = [
    { label: "إجمالي الإيراد", value: `${formatPrice(totalRevenue)} ر.س`, icon: Wallet },
    { label: "اشتراكات نشطة", value: activeSubs ?? 0, icon: Users },
    { label: "مطاعم مسجّلة", value: restaurants ?? 0, icon: Store },
    { label: "أصناف منشورة", value: dishes ?? 0, icon: UtensilsCrossed },
    { label: "مشاهدات المنيوهات", value: formatPrice(totalViews), icon: Eye },
    { label: "تذاكر مفتوحة", value: openTickets ?? 0, icon: LifeBuoy },
  ];

  return (
    <main className="flex-1 px-[var(--page-px,clamp(16px,5vw,60px))] py-10">
      <div className="mx-auto max-w-5xl">
        <FounderNav />
        <h1 className="font-display text-2xl font-bold text-cream">لوحة المؤسس</h1>
        <p className="mt-1 text-warm">نظرة عامة على أداء المنصة.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((s) => (
            <Card key={s.label} className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/12 text-gold">
                <s.icon size={22} />
              </span>
              <div>
                <p className="text-sm text-warm">{s.label}</p>
                <p className="font-display text-2xl font-black text-cream">
                  {s.value}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}

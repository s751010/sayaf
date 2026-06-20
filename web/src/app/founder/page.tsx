import { ShieldAlert, Wallet, Users, LifeBuoy } from "lucide-react";
import { createServerSupabase, getCurrentUser } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/site/logo";
import { formatPrice } from "@/lib/utils";

function Denied({ message }: { message: string }) {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <Card className="flex flex-col items-center gap-3">
          <ShieldAlert className="text-gold" size={28} />
          <h1 className="font-bold text-cream">لوحة المؤسس</h1>
          <p className="text-sm text-warm">{message}</p>
        </Card>
      </div>
    </main>
  );
}

export default async function FounderPage() {
  const founderEmail = process.env.FOUNDER_EMAIL;
  const user = await getCurrentUser();

  if (!user) return <Denied message="سجّل الدخول بحساب المؤسس للوصول." />;
  if (!founderEmail)
    return <Denied message="لم يُضبط FOUNDER_EMAIL في إعدادات البيئة بعد." />;
  if (user.email?.toLowerCase() !== founderEmail.toLowerCase())
    return <Denied message="هذه المنطقة مخصّصة للمؤسس فقط." />;

  const supabase = await createServerSupabase();
  const [{ data: revenue }, { count: activeSubs }, { count: openTickets }] =
    await Promise.all([
      supabase!.from("revenue_log").select("amount"),
      supabase!
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("active", true),
      supabase!
        .from("support_tickets")
        .select("id", { count: "exact", head: true })
        .eq("status", "open"),
    ]);

  const totalRevenue = (revenue ?? []).reduce(
    (s: number, r: { amount: number | null }) => s + (r.amount ?? 0),
    0
  );

  const stats = [
    { label: "إجمالي الإيراد", value: `${formatPrice(totalRevenue)} ر.س`, icon: Wallet },
    { label: "اشتراكات نشطة", value: activeSubs ?? 0, icon: Users },
    { label: "تذاكر مفتوحة", value: openTickets ?? 0, icon: LifeBuoy },
  ];

  return (
    <main className="flex-1 px-[var(--page-px,clamp(16px,5vw,60px))] py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-2xl font-bold text-cream">لوحة المؤسس</h1>
        <p className="mt-1 text-warm">نظرة عامة على أداء المنصة.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
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

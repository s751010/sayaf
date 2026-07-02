import { createServerSupabase } from "@/lib/supabase/server";
import { isFounder } from "@/lib/founder";
import { togglePromo, deletePromo } from "@/app/founder/actions";
import { FounderNav } from "@/components/founder/founder-nav";
import { FounderDenied } from "@/components/founder/denied";
import { PromoForm } from "@/components/founder/promo-form";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

/** حالة الكود (خارج المكوّن — قاعدة نقاء الرندر تمنع Date.now داخله). */
function promoState(p: { expiry_date: string | null; max_uses: number | null; uses: number | null; active: boolean | null }) {
  const expired =
    !!p.expiry_date && new Date(p.expiry_date).getTime() < Date.now();
  const exhausted = p.max_uses != null && (p.uses ?? 0) >= p.max_uses;
  return { expired, exhausted };
}

type Promo = {
  id: string;
  code: string | null;
  description: string | null;
  discount: number | null;
  expiry_date: string | null;
  max_uses: number | null;
  uses: number | null;
  active: boolean | null;
  created_at: string;
};

export default async function FounderPromosPage() {
  if (!(await isFounder())) return <FounderDenied />;

  const supabase = await createServerSupabase();
  const { data } = await supabase!
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });
  const promos = (data ?? []) as Promo[];

  return (
    <main className="flex-1 px-[var(--page-px,clamp(16px,5vw,60px))] py-10">
      <div className="mx-auto max-w-4xl">
        <FounderNav />
        <h1 className="font-display text-2xl font-bold text-cream">🎟 أكواد الخصم</h1>
        <p className="mt-1 text-warm">أكواد خصم على الاشتراكات.</p>

        <div className="mt-6">
          <PromoForm />
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {promos.map((p) => {
            const { expired, exhausted } = promoState(p);
            return (
              <Card key={p.id} className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono font-bold text-cream" dir="ltr">
                    {p.code} <span className="text-gold">−{p.discount}%</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {p.description && <span>{p.description} · </span>}
                    استخدامات: {p.uses ?? 0}
                    {p.max_uses != null && ` / ${p.max_uses}`}
                    {p.expiry_date &&
                      ` · ينتهي ${new Date(p.expiry_date).toLocaleDateString("ar-SA")}`}
                  </p>
                </div>
                <Badge
                  variant={p.active && !expired && !exhausted ? "green" : "neutral"}
                >
                  {expired
                    ? "منتهٍ"
                    : exhausted
                      ? "استُنفد"
                      : p.active
                        ? "فعّال"
                        : "معطّل"}
                </Badge>
                <form action={togglePromo}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="next" value={String(!p.active)} />
                  <Button type="submit" variant="ghost" size="sm">
                    {p.active ? "تعطيل" : "تفعيل"}
                  </Button>
                </form>
                <form action={deletePromo}>
                  <input type="hidden" name="id" value={p.id} />
                  <Button type="submit" variant="ghost" size="sm" className="text-danger">
                    حذف
                  </Button>
                </form>
              </Card>
            );
          })}
          {promos.length === 0 && (
            <Card className="text-center text-warm">لا توجد أكواد بعد.</Card>
          )}
        </div>
      </div>
    </main>
  );
}

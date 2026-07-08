/** الولاء (لوحة التاجر): قائمة العملاء + ختم الزيارات + صرف المكافآت. */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, EmptyState, Input, Skeleton, useToast } from "@/components/ui";
import { getLoyaltyCustomers, redeemLoyalty, stampLoyalty } from "@/lib/data";
import type { LoyaltyCustomer } from "@/lib/types";
import { useDashboard, UpgradeGate } from "./Dashboard";

export default function Loyalty() {
  const { restaurant, ent } = useDashboard();
  const toast = useToast();
  const [customers, setCustomers] = useState<LoyaltyCustomer[] | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    document.title = "الولاء — كلاود منيو";
    if (ent.loyalty) {
      getLoyaltyCustomers(restaurant.id).then(setCustomers).catch(() => setCustomers([]));
    }
  }, [restaurant.id, ent.loyalty]);

  const goal = restaurant.loyalty_goal ?? 5;

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return customers ?? [];
    return (customers ?? []).filter((c) =>
      [c.name, c.phone, c.card_code].filter(Boolean).some((v) => v!.toLowerCase().includes(s))
    );
  }, [customers, q]);

  if (!ent.loyalty) {
    return (
      <div>
        <h1 className="font-display text-2xl font-black text-ink">الولاء</h1>
        <UpgradeGate
          title="بطاقة الولاء متاحة في باقة الاحترافية"
          desc="فعّل برنامج الولاء لمكافأة عملائك المتكررين وزيادة معدّل عودتهم لمطعمك."
        />
      </div>
    );
  }

  async function stamp(c: LoyaltyCustomer) {
    try {
      const updated = await stampLoyalty(c);
      if (updated) {
        setCustomers((cs) => cs?.map((x) => (x.id === c.id ? updated : x)) ?? null);
        toast(`ختم لـ${updated.name ?? "العميل"} — ${updated.stamps}/${goal} ✓`);
      }
    } catch {
      toast("تعذّر الختم.", "err");
    }
  }

  async function redeem(c: LoyaltyCustomer) {
    if (!window.confirm(`صرف مكافأة «${restaurant.loyalty_reward ?? "المكافأة"}» لـ${c.name ?? "العميل"}؟ ستُصفَّر أختامه.`)) return;
    try {
      const updated = await redeemLoyalty(c);
      if (updated) {
        setCustomers((cs) => cs?.map((x) => (x.id === c.id ? updated : x)) ?? null);
        toast("🎉 صُرفت المكافأة!");
      }
    } catch {
      toast("تعذّر الصرف.", "err");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-ink">الولاء</h1>
          <p className="mt-1 text-sm text-dim">{customers?.length ?? "…"} عميل في البرنامج</p>
        </div>
        <Badge variant={restaurant.loyalty_enabled ? "green" : "neutral"}>
          {restaurant.loyalty_enabled ? "مفعّل للزبائن" : "غير مفعّل"}
        </Badge>
      </div>

      <Card className="mt-5 text-sm text-dim">
        المكافأة بعد <span className="font-bold text-gold">{goal}</span> زيارات:{" "}
        <span className="font-bold text-ink">{restaurant.loyalty_reward ?? "غير محددة"}</span>.{" "}
        <Link to="/dashboard/settings" className="font-bold text-gold hover:underline">
          تعديل الإعدادات
        </Link>
        {!restaurant.loyalty_enabled && (
          <span className="mt-1 block text-xs text-bad">
            ⚠️ البرنامج غير ظاهر للزبائن — فعّله من الإعدادات.
          </span>
        )}
      </Card>

      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="🔍 ابحث بالاسم أو الجوال أو رمز البطاقة…"
        className="mt-5"
      />

      {customers === null ? (
        <div className="mt-5 flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            emoji="💛"
            title={q ? "لا نتائج" : "لا يوجد عملاء بعد"}
            desc={q ? undefined : "الزبائن ينضمون من صفحة المنيو — عند كل زيارة اختم بطاقتهم من هنا."}
          />
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-2.5">
          {filtered.map((c) => {
            const stamps = c.stamps ?? 0;
            const complete = stamps >= goal;
            return (
              <Card key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                <div className="min-w-0">
                  <p className="font-bold text-ink">
                    {c.name ?? "عميل"}{" "}
                    {c.card_code && (
                      <span className="text-xs font-normal text-faint" dir="ltr">#{c.card_code}</span>
                    )}
                  </p>
                  <p className="text-xs text-faint" dir="ltr">{c.phone}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={complete ? "gold" : "neutral"}>
                    {complete ? "🎁 يستحق المكافأة" : `${stamps}/${goal} ختم`}
                  </Badge>
                  <span className="text-xs text-faint">إجمالي {c.total_visits ?? 0} زيارة</span>
                  {complete ? (
                    <Button className="px-3 py-1.5 text-xs" onClick={() => redeem(c)}>
                      صرف المكافأة
                    </Button>
                  ) : (
                    <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => stamp(c)}>
                      ＋ ختم زيارة
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

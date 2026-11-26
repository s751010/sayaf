/**
 * «الاشتراكات» — كل اشتراك في المنصّة في مكانٍ واحد، بحالته وأيامه الباقية،
 * وتمديدٌ بضغطة (يُسجَّل في التدقيق قبل تنفيذه).
 *
 * كانت الاشتراكات تُرى تاجراً تاجراً في بطاقته فقط. والسؤال اليومي للمالك
 * «مين يخلص قريب؟» لا يُجاب من بطاقات متفرّقة.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, ErrorNote, Skeleton, useToast } from "@/components/ui";
import {
  extendSubscription,
  getAllSubscriptions,
  getMerchants,
  logAudit,
  type FounderMerchant,
  type Subscription,
} from "@/lib/founder";
import { SUB_STATE_LABEL, daysLeft, subState, type SubState } from "@/lib/founderInsights";
import { cn, formatDate } from "@/lib/utils";

type Filter = "all" | SubState;

const BADGE: Record<SubState, "green" | "gold" | "red" | "neutral"> = {
  active: "green",
  trial: "gold",
  expiring: "red",
  expired: "neutral",
  cancelled: "neutral",
};

export default function Subscriptions() {
  const toast = useToast();
  const [subs, setSubs] = useState<Subscription[] | null>(null);
  const [merchants, setMerchants] = useState<FounderMerchant[]>([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [s, m] = await Promise.all([getAllSubscriptions(), getMerchants()]);
      setSubs(s);
      setMerchants(m);
    } catch {
      setError("تعذّر تحميل الاشتراكات.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const byOwner = useMemo(() => new Map(merchants.map((m) => [m.owner_id, m])), [merchants]);

  // الأحدث لكل تاجر أوّلاً، والقديم المنتهي بعده — نفس الترتيب الذي يقرأ به المالك.
  const rows = useMemo(
    () =>
      (subs ?? [])
        .map((s) => ({ s, state: subState(s), m: s.user_id ? byOwner.get(s.user_id) : undefined }))
        .sort((a, b) => a.s.end_date.localeCompare(b.s.end_date)),
    [subs, byOwner]
  );

  async function extend(s: Subscription, days: number, name?: string) {
    setBusyId(s.id);
    try {
      await logAudit(`تمديد اشتراك ${days} يوم`, { table: "subscriptions", id: s.id, name: name ?? null, details: { days } });
      await extendSubscription(s, days);
      await load();
      toast(`مُدّد ${days} يوم ✓`);
    } catch {
      toast("تعذّر التمديد.", "err");
    } finally {
      setBusyId(null);
    }
  }

  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (subs === null) return <Skeleton className="h-64" />;

  const count = (f: SubState) => rows.filter((r) => r.state === f).length;
  const shown = filter === "all" ? rows : rows.filter((r) => r.state === filter);
  const filters: [Filter, string][] = [
    ["all", `الكل (${rows.length})`],
    ["expiring", `تنتهي قريب (${count("expiring")})`],
    ["trial", `تجربة (${count("trial")})`],
    ["active", `مدفوع (${count("active")})`],
    ["expired", `منتهي (${count("expired")})`],
    ["cancelled", `ملغى (${count("cancelled")})`],
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-black text-ink">الاشتراكات</h1>
      <p className="mt-1 text-sm text-dim">كل اشتراك وحالته. التمديد يبدأ من نهايته إن كانت قادمة، ومن اليوم إن كانت فاتت.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={cn(
              "min-h-9 rounded-full border px-3.5 text-xs font-bold",
              filter === id ? "border-gold bg-gold/12 text-gold" : "border-line text-dim hover:text-ink"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <Card className="mt-4 text-center text-sm text-dim">ما فيه شي هنا.</Card>
      ) : (
        <ul className="mt-4 overflow-hidden rounded-[14px] border border-line bg-panel">
          {shown.map(({ s, state, m }) => {
            const left = daysLeft(s.end_date);
            return (
              <li key={s.id} className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 last:border-0">
                <div className="min-w-0 flex-1">
                  {m ? (
                    <Link to={`/founder/merchants/${m.id}`} className="text-sm font-bold text-ink hover:underline">
                      {m.name}
                    </Link>
                  ) : (
                    <span className="text-sm font-bold text-dim">حساب بلا مطعم</span>
                  )}
                  <p className="text-[11px] text-faint">
                    {s.plan_id === "trial" ? "تجربة" : s.plan_id} · ينتهي {formatDate(s.end_date)}
                    {state !== "cancelled" && (
                      <> · {left >= 0 ? `باقي ${left} يوم` : `فات ${-left} يوم`}</>
                    )}
                  </p>
                </div>
                <Badge variant={BADGE[state]}>{SUB_STATE_LABEL[state]}</Badge>
                {state !== "cancelled" && (
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" busy={busyId === s.id} busyText="…" onClick={() => extend(s, 7, m?.name)}>
                      مدّد أسبوع
                    </Button>
                    <Button size="sm" variant="outline" busy={busyId === s.id} busyText="…" onClick={() => extend(s, 30, m?.name)}>
                      مدّد شهر
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

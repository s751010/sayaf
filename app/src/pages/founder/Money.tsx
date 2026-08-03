/**
 * المال والنمو.
 *
 * **قمع التحويل أولاً لا الإيراد** — الإيراد يقول كم دخل، والقمع يقول أين
 * تخسر. وفي بياناتك اليوم الفرق صارخ: ١٨ أنشأوا مطعماً و٥ فقط أضافوا طبقاً،
 * أي أن ٧٢٪ يتوقّفون عند أول خطوة حقيقية. رقم الإيراد وحده كان سيخفي ذلك.
 *
 * وصفوف الإيراد بلا اشتراك مقابل تُعرض صراحةً بدل أن تُبتلع في المجموع.
 */
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Badge,
  Button,
  Card,
  ErrorNote,
  Field,
  Input,
  Skeleton,
  useToast,
} from "@/components/ui";
import {
  createPromo,
  deletePromo,
  getFunnel,
  getMonthlyRevenue,
  getOverview,
  getPromos,
  getRevenueOrphans,
  logAudit,
  setPromoActive,
  type FounderOverview,
  type FunnelStep,
  type MonthRevenue,
  type PromoCode,
  type RevenueOrphan,
} from "@/lib/founder";
import { formatDate, formatPrice } from "@/lib/utils";
import { Icon } from "@/lib/icons";

export default function Money() {
  const toast = useToast();
  const [stats, setStats] = useState<FounderOverview | null>(null);
  const [funnel, setFunnel] = useState<FunnelStep[] | null>(null);
  const [months, setMonths] = useState<MonthRevenue[] | null>(null);
  const [orphans, setOrphans] = useState<RevenueOrphan[] | null>(null);
  const [promos, setPromos] = useState<PromoCode[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("20");
  const [maxUses, setMaxUses] = useState("");
  const [expiry, setExpiry] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [o, f, m, orp, p] = await Promise.all([
        getOverview(),
        getFunnel(),
        getMonthlyRevenue(24),
        getRevenueOrphans(),
        getPromos(),
      ]);
      setStats(o);
      setFunnel(f);
      setMonths(m);
      setOrphans(orp);
      setPromos(p);
    } catch {
      setError("تعذّر تحميل بيانات المال والنمو.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function addPromo(e: FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    const d = Number(discount);
    if (!c) return toast("اكتب الكود.", "err");
    if (!Number.isFinite(d) || d < 1 || d > 100) return toast("الخصم بين 1 و100.", "err");
    setBusy(true);
    try {
      await logAudit("إنشاء كود خصم", { table: "promo_codes", name: c, details: { discount: d } });
      await createPromo({
        code: c,
        discount: d,
        max_uses: maxUses.trim() ? Number(maxUses) : null,
        expiry_date: expiry || null,
        description: null,
      });
      setCode("");
      setMaxUses("");
      setExpiry("");
      await load();
      toast("أُنشئ الكود ✓");
    } catch {
      toast("تعذّر الإنشاء — قد يكون الكود مستخدماً.", "err");
    } finally {
      setBusy(false);
    }
  }

  async function togglePromo(p: PromoCode) {
    try {
      await logAudit(p.active ? "إيقاف كود خصم" : "تفعيل كود خصم", {
        table: "promo_codes",
        id: p.id,
        name: p.code,
      });
      await setPromoActive(p.id, !p.active);
      await load();
    } catch {
      toast("تعذّر التحديث.", "err");
    }
  }

  async function removePromo(p: PromoCode) {
    if (!window.confirm(`حذف الكود «${p.code}» نهائياً؟`)) return;
    try {
      await logAudit("حذف كود خصم", { table: "promo_codes", id: p.id, name: p.code });
      await deletePromo(p.id);
      await load();
      toast("حُذف الكود.");
    } catch {
      toast("تعذّر الحذف.", "err");
    }
  }

  if (error) return <ErrorNote>{error}</ErrorNote>;

  const peak = months?.reduce((m, x) => Math.max(m, Number(x.total)), 0) ?? 0;
  const top = funnel?.[0]?.n ?? 0;
  const orphanTotal = orphans?.reduce((s, o) => s + Number(o.amount ?? 0), 0) ?? 0;

  return (
    <div>
      <h1 className="font-display text-2xl font-black text-ink">المال والنمو</h1>

      {/* قمع التحويل — أول ما يُرى عمداً */}
      <section className="mt-6">
        <h2 className="inline-flex items-center gap-2 mb-3 font-display text-lg font-extrabold text-ink">
          <Icon name="bars" size={17} className="shrink-0 text-gold" />{" "}
          أين يتسرّب التجّار</h2>
        {funnel === null ? (
          <Skeleton className="h-56" />
        ) : (
          <Card>
            <div className="flex flex-col gap-3">
              {funnel.map((s, i) => {
                const prev = i > 0 ? funnel[i - 1].n : s.n;
                const pct = top ? Math.round((s.n / top) * 100) : 0;
                const drop = prev > 0 ? Math.round(((prev - s.n) / prev) * 100) : 0;
                return (
                  <div key={s.ord}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-sm font-bold text-ink">
                        {s.ord}. {s.step}
                      </span>
                      <span className="text-sm text-dim">
                        <span className="font-black text-ink">{s.n}</span>
                        <span className="text-xs"> · {pct}%</span>
                        {i > 0 && drop > 0 && (
                          <span className={drop >= 50 ? "text-xs text-bad" : "text-xs text-faint"}>
                            {" "}
                            (فقدتَ {drop}%)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink/8">
                      <div
                        className={drop >= 50 && i > 0 ? "h-full bg-bad" : "h-full bg-gold"}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-faint">
              الخطوة الحمراء هي أكبر تسرّب عندك — وهي المكان الوحيد الذي يستحق مجهودك التالي.
            </p>
          </Card>
        )}
      </section>

      {/* الإيراد */}
      <section className="mt-10">
        <h2 className="inline-flex items-center gap-2 mb-3 font-display text-lg font-extrabold text-ink">
          <Icon name="money" size={17} className="shrink-0 text-gold" />{" "}
          الإيراد</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { l: "الإجمالي", v: `${formatPrice(stats?.revenue_total ?? 0)} ر.س` },
            { l: "آخر ٣٠ يوماً", v: `${formatPrice(stats?.revenue_30d ?? 0)} ر.س` },
            {
              l: "اشتراكات مدفوعة نشطة",
              v: stats ? `${stats.subs_paid}` : "…",
            },
          ].map((c) => (
            <Card key={c.l}>
              <p className="text-xs text-dim">{c.l}</p>
              <p className="font-display text-xl font-black text-ink">{c.v}</p>
            </Card>
          ))}
        </div>

        {months === null ? (
          <Skeleton className="mt-4 h-40" />
        ) : months.length === 0 ? (
          <Card className="mt-4 text-center text-sm text-dim">لا توجد دفعات مسجَّلة.</Card>
        ) : (
          <Card className="mt-4">
            <div className="flex items-end gap-2 overflow-x-auto pb-1" style={{ height: 160 }}>
              {months.map((m) => (
                <div key={m.month} className="flex min-w-14 flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-dim">{formatPrice(Number(m.total))}</span>
                  <div
                    className="w-full rounded-t-lg bg-gold/70"
                    style={{ height: `${peak ? (Number(m.total) / peak) * 110 : 0}px` }}
                    title={`${m.n} دفعة`}
                  />
                  <span className="text-[10px] text-faint" dir="ltr">
                    {m.month}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>

      {/* التناقض */}
      {orphans !== null && orphans.length > 0 && (
        <section className="mt-10">
          <h2 className="inline-flex items-center gap-2 mb-3 font-display text-lg font-extrabold text-ink">
          <Icon name="warn" size={17} className="shrink-0 text-gold" />{" "}
          إيراد بلا اشتراك يقابله
          </h2>
          <Card className="border-bad/30">
            <p className="text-sm text-dim">
              {orphans.length} دفعة بمجموع{" "}
              <span className="font-black text-ink">{formatPrice(orphanTotal)} ر.س</span> لا يقابلها
              أي صف اشتراك مدفوع. غالباً دفعات من تسعيرة سابقة لم يُنشأ لها اشتراك — لاحظ أسماء
              الباقات أدناه ومقارنتها بباقتك الحالية.
            </p>
            <ul className="mt-3 flex flex-col gap-1.5">
              {orphans.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="neutral">{formatPrice(Number(o.amount ?? 0))} ر.س</Badge>
                  <span className="font-bold text-ink">{o.plan_name ?? "—"}</span>
                  <span className="text-faint" dir="ltr">
                    {o.owner_email ?? o.user_name ?? "—"}
                  </span>
                  <span className="text-faint">{formatDate(o.created_at)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      {/* أكواد الخصم */}
      <section className="mt-10">
        <h2 className="inline-flex items-center gap-2 mb-3 font-display text-lg font-extrabold text-ink">
          <Icon name="tag" size={17} className="shrink-0 text-gold" />{" "}
          أكواد الخصم</h2>
        <Card>
          <form onSubmit={addPromo} className="flex flex-wrap items-end gap-3">
            <Field label="الكود" className="w-40">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="RAMADAN30"
                dir="ltr"
              />
            </Field>
            <Field label="الخصم %" className="w-28">
              <Input
                type="number"
                min={1}
                max={100}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                dir="ltr"
              />
            </Field>
            <Field label="حد الاستخدام" className="w-32" hint="فارغ = بلا حد">
              <Input
                type="number"
                min={1}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                dir="ltr"
              />
            </Field>
            <Field label="ينتهي في" className="w-40">
              <Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} dir="ltr" />
            </Field>
            <Button type="submit" disabled={busy}>
              ＋ أنشئ
            </Button>
          </form>
        </Card>

        {promos === null ? (
          <Skeleton className="mt-4 h-24" />
        ) : promos.length === 0 ? (
          <Card className="mt-4 text-center text-sm text-dim">لا توجد أكواد بعد.</Card>
        ) : (
          <div className="mt-4 flex flex-col gap-2.5">
            {promos.map((p) => {
              const expired = p.expiry_date ? new Date(p.expiry_date) < new Date() : false;
              const spent = p.max_uses != null && (p.uses ?? 0) >= p.max_uses;
              return (
                <Card key={p.id} className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-ink" dir="ltr">
                      {p.code}{" "}
                      <span className="text-sm font-bold text-gold">−{p.discount}%</span>
                    </p>
                    <p className="mt-0.5 text-xs text-dim">
                      استُخدم {p.uses ?? 0}
                      {p.max_uses != null ? ` من ${p.max_uses}` : " (بلا حد)"}
                      {p.expiry_date && ` · ينتهي ${formatDate(p.expiry_date)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.active && !expired && !spent ? "green" : "neutral"}>
                      {!p.active ? "موقوف" : expired ? "منتهٍ" : spent ? "استُنفد" : "فعّال"}
                    </Badge>
                    <Button
                      variant="outline"
                      className="px-3 py-1.5 text-xs"
                      onClick={() => togglePromo(p)}
                    >
                      {p.active ? "إيقاف" : "تفعيل"}
                    </Button>
                    <Button
                      variant="danger"
                      className="px-3 py-1.5 text-xs"
                      onClick={() => removePromo(p)}
                    >
                      حذف
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
        <p className="inline-flex items-center gap-2 mt-3 text-xs text-faint">
          <Icon name="warn" size={17} className="shrink-0 text-gold" />{" "}
          الأكواد تُحفظ وتُدار هنا، لكن صفحة الاشتراك عند التاجر لا تطلبها بعد — ربطها بمسار
          الدفع خطوة تالية تحتاج تعديل بوابة الدفع.
        </p>
      </section>
    </div>
  );
}

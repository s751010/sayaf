/**
 * الفلوس: الاستلام (PayLink) · الإيراد شهرياً · إيراد بلا اشتراك.
 *
 * (القمع وأكواد الخصم انتقلا إلى «التسويق» — `parts/Funnel.tsx` و
 * `parts/PromoCodes.tsx` — ٢٠٢٦/١١/٢٦. وما يلي تاريخ قرار القمع.)
 *
 * **قمع التحويل أولاً لا الإيراد** — الإيراد يقول كم دخل، والقمع يقول أين
 * تخسر. وفي بياناتك اليوم الفرق صارخ: ١٨ أنشأوا مطعماً و٥ فقط أضافوا طبقاً،
 * أي أن ٧٢٪ يتوقّفون عند أول خطوة حقيقية. رقم الإيراد وحده كان سيخفي ذلك.
 *
 * وصفوف الإيراد بلا اشتراك مقابل تُعرض صراحةً بدل أن تُبتلع في المجموع.
 */
import { useCallback, useEffect, useState } from "react";
import { Badge, Card, ErrorNote, Skeleton } from "@/components/ui";
import {
  getMonthlyRevenue,
  getOverview,
  getRevenueOrphans,
  type FounderOverview,
  type MonthRevenue,
  type RevenueOrphan,
} from "@/lib/founder";
import { getSiteSettings, type SiteSetting } from "@/lib/founder";
import { formatDate, formatPrice } from "@/lib/utils";
import { Icon } from "@/lib/icons";
import { BillingConsole } from "./BillingConsole";
import { reportSilentFailure } from "@/lib/data";

export default function Money() {
  const [stats, setStats] = useState<FounderOverview | null>(null);
  const [months, setMonths] = useState<MonthRevenue[] | null>(null);
  const [orphans, setOrphans] = useState<RevenueOrphan[] | null>(null);
  const [settings, setSettings] = useState<SiteSetting[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [o, m, orp, st] = await Promise.all([
        getOverview(),
        getMonthlyRevenue(24),
        getRevenueOrphans(),
        getSiteSettings(),
      ]);
      setStats(o);
      setMonths(m);
      setOrphans(orp);
      setSettings(st);
    } catch {
      setError("تعذّر تحميل بيانات الفلوس.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorNote>{error}</ErrorNote>;

  const peak = months?.reduce((m, x) => Math.max(m, Number(x.total)), 0) ?? 0;
  const orphanTotal = orphans?.reduce((s, o) => s + Number(o.amount ?? 0), 0) ?? 0;

  return (
    <div>
      <h1 className="font-display text-2xl font-black text-ink">الفلوس</h1>

      {/* ⚠️ الاستلام **قبل** النمو: عرض قمع تحويل فوق بوّابة مقطوعة يُطمئن
          كذباً — لا معنى لتحسين التحويل إن كان الدفع لا يصل أصلاً. */}
      <BillingConsole
        settings={settings}
        onSettingsChange={() =>
          void getSiteSettings()
            .then(setSettings)
            .catch((e) => reportSilentFailure("getSiteSettings:money", e))
        }
      />

      <div className="my-10 border-t border-line" />

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

    </div>
  );
}

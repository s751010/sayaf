/**
 * «اليوم» — أوّل ما يراه المالك: ما ينتظره، ثم أرقام المنصّة، ثم آخر من سجّل.
 *
 * كلّ قراءة مستقلّة (`allSettled`): فشل إحداها يُخفي جزءها وحده لا الصفحة.
 * وقائمة «ينتظرك» دالّةٌ خالصة في `lib/founderToday.ts`.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Card, Skeleton } from "@/components/ui";
import {
  getAllSubscriptions,
  getAudit,
  getClientErrors,
  getHealth,
  getMerchants,
  getOrdersSince,
  getOverview,
  getRecentRevenue,
  getRecentTickets,
  getSiteSettings,
  getViewsSince,
  type ClientErrorGroup,
  type FounderMerchant,
  type FounderOverview,
  type HealthItem,
} from "@/lib/founder";
import {
  activityFeed,
  ago,
  dailyCounts,
  dailySums,
  total,
  type Activity,
  type ActivityKind,
  type DayPoint,
} from "@/lib/founderInsights";
import { Bars } from "./parts/Bars";
import { buildQueue, greeting, type QueueTone } from "@/lib/founderToday";
import { TODO_SETTING_KEY, parseTodoState, remainingCount } from "@/lib/ownerTasks";
import { SITE_URL } from "@/lib/config";
import { Icon, type IconName } from "@/lib/icons";
import { cn, formatDate, formatMoney } from "@/lib/utils";

const KIND_ICON: Record<ActivityKind, IconName> = {
  signup: "store",
  subscription: "star",
  payment: "money",
  ticket: "chat",
  audit: "shield",
  order: "bag",
};

const TONE: Record<QueueTone, string> = {
  bad: "bg-bad text-white",
  warn: "bg-gold text-on-gold",
  calm: "bg-ink/10 text-ink",
};

export default function Today() {
  const [overview, setOverview] = useState<FounderOverview | null>(null);
  const [health, setHealth] = useState<HealthItem[] | null>(null);
  const [errors, setErrors] = useState<ClientErrorGroup[] | null>(null);
  const [tasksLeft, setTasksLeft] = useState<number | null>(null);
  const [latest, setLatest] = useState<FounderMerchant[] | null>(null);
  const [feed, setFeed] = useState<Activity[] | null>(null);
  const [signups, setSignups] = useState<DayPoint[] | null>(null);
  const [views, setViews] = useState<DayPoint[] | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.allSettled([getOverview(), getHealth(), getClientErrors(200), getSiteSettings(), getMerchants()]).then(
      ([o, h, e, s, m]) => {
        if (!alive) return;
        if (o.status === "fulfilled") setOverview(o.value);
        if (h.status === "fulfilled") setHealth(h.value);
        if (e.status === "fulfilled") setErrors(e.value);
        if (s.status === "fulfilled")
          setTasksLeft(remainingCount(parseTodoState(s.value.find((x) => x.key === TODO_SETTING_KEY)?.value)));
        if (m.status === "fulfilled") {
          setLatest([...m.value].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5));
          setSignups(dailyCounts(m.value.map((x) => x.created_at), 14));
        }
        setFailed(o.status === "rejected");
        setLoaded(true);

        // الخيط والمنحنيات بعد الأساس — لا تؤخّر «ينتظرك».
        const merchants = m.status === "fulfilled" ? m.value : [];
        const val = <T,>(r: PromiseSettledResult<T>): T | null => (r.status === "fulfilled" ? r.value : null);
        Promise.allSettled([
          getAllSubscriptions(),
          getRecentRevenue(15),
          getRecentTickets(15),
          getAudit(15),
          getOrdersSince(7),
          getViewsSince(14),
        ]).then(([subs, rev, tix, aud, ord, vw]) => {
          if (!alive) return;
          setFeed(
            activityFeed(
              { merchants, subs: val(subs), revenue: val(rev), tickets: val(tix), audit: val(aud), orders: val(ord) },
              10
            )
          );
          const v = val(vw);
          setViews(v ? dailySums(v.map((r) => ({ date: r.date, value: r.views })), 14) : []);
        });
      }
    );
    return () => {
      alive = false;
    };
  }, []);

  const queue = buildQueue({ overview, health, errors, tasksLeft });
  const o = overview;

  const tiles = [
    { label: "دخل آخر ٣٠ يوم", value: o ? formatMoney(o.revenue_30d) : "…", sub: o ? `الإجمالي ${formatMoney(o.revenue_total)}` : "" },
    { label: "مشتركين يدفعون", value: o ? `${o.subs_paid}` : "…", sub: o ? `${o.subs_trial} في التجربة` : "" },
    { label: "المطاعم", value: o ? `${o.restaurants_total}` : "…", sub: o ? `+${o.restaurants_new_7d} هالأسبوع` : "" },
    { label: "فتحات المنيو ٣٠ يوم", value: o ? `${o.views_30d}` : "…", sub: o ? `${o.views_7d} هالأسبوع` : "" },
  ];

  return (
    <div>
      <p className="text-sm font-bold text-dim">{greeting()}</p>
      <h1 className="mt-1 font-display text-2xl font-black text-ink sm:text-3xl">وش ينتظرك اليوم</h1>

      {/* ينتظرك */}
      <section className="mt-5">
        {!loaded ? (
          <Skeleton className="h-28" />
        ) : failed ? (
          <Card className="text-sm text-dim">تعذّر تحميل أرقام المنصّة — حدّث الصفحة.</Card>
        ) : queue.length === 0 ? (
          <Card className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-good/12 text-good">
              <Icon name="check" size={20} />
            </span>
            <p className="text-sm font-bold text-ink">ما فيه شي ينتظرك الحين ✓</p>
          </Card>
        ) : (
          <ul className="overflow-hidden rounded-[14px] border border-line bg-panel">
            {queue.map((q) => (
              <li key={q.id} className="border-b border-line last:border-0">
                <Link
                  to={q.to}
                  className="flex min-h-14 items-center gap-3 px-4 py-3 transition-colors hover:bg-ink/[.03]"
                >
                  <span
                    className={cn(
                      "flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-black",
                      TONE[q.tone]
                    )}
                  >
                    {q.n}
                  </span>
                  <span className="flex-1 text-sm font-bold text-ink">{q.text}</span>
                  <Icon name="chevron" size={16} className="text-faint rtl:rotate-180" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* الأرقام */}
      <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label} className="p-4">
            <p className="text-xs font-bold text-dim">{t.label}</p>
            <p className="mt-1 font-display text-xl font-black text-ink sm:text-2xl">{t.value}</p>
            {t.sub && <p className="mt-0.5 text-[11px] text-faint">{t.sub}</p>}
          </Card>
        ))}
      </section>

      {/* منحنيان صغيران — التفصيل في «التسويق» */}
      <section className="mt-4 grid gap-3 md:grid-cols-2">
        <MiniSeries title="تسجيلات — ١٤ يوم" unit="مطعم" points={signups} />
        <MiniSeries title="فتحات المنيو — ١٤ يوم" unit="فتحة" points={views} />
      </section>

      {/* آخر ما حصل */}
      <section className="mt-8">
        <h2 className="mb-3 font-display text-lg font-extrabold text-ink">آخر ما حصل</h2>
        {feed === null ? (
          <Skeleton className="h-40" />
        ) : feed.length === 0 ? (
          <Card className="text-center text-sm text-dim">ما فيه نشاط بعد.</Card>
        ) : (
          <ul className="overflow-hidden rounded-[14px] border border-line bg-panel">
            {feed.map((a, i) => {
              const body = (
                <>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/6 text-dim">
                    <Icon name={KIND_ICON[a.kind]} size={15} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">{a.text}</span>
                  <span className="shrink-0 text-[11px] text-faint">{ago(a.at)}</span>
                </>
              );
              return (
                <li key={`${a.kind}-${a.at}-${i}`} className="border-b border-line last:border-0">
                  {a.to ? (
                    <Link to={a.to} className="flex min-h-12 items-center gap-3 px-4 py-2.5 hover:bg-ink/[.03]">
                      {body}
                    </Link>
                  ) : (
                    <div className="flex min-h-12 items-center gap-3 px-4 py-2.5">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* آخر من سجّل */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-extrabold text-ink">آخر المطاعم</h2>
          <Link to="/founder/merchants" className="text-xs font-black text-gold hover:underline">
            كل التجّار ←
          </Link>
        </div>
        {latest === null ? (
          <Skeleton className="h-40" />
        ) : latest.length === 0 ? (
          <Card className="text-center text-sm text-dim">ما سجّل أحد بعد.</Card>
        ) : (
          <ul className="overflow-hidden rounded-[14px] border border-line bg-panel">
            {latest.map((m) => (
              <li key={m.id} className="border-b border-line last:border-0">
                <Link
                  to={`/founder/merchants/${m.id}`}
                  className="flex min-h-14 items-center gap-3 px-4 py-3 hover:bg-ink/[.03]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">{m.name}</span>
                    <span className="block text-[11px] text-faint">
                      {formatDate(m.created_at)} · {m.dishes_count} طبق · {m.views_30d} فتحة
                    </span>
                  </span>
                  <Badge variant={m.sub_active ? (m.sub_plan === "trial" ? "gold" : "green") : "neutral"}>
                    {m.sub_active ? (m.sub_plan === "trial" ? "تجربة" : "مشترك") : "بلا اشتراك"}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* اختصارات */}
      <section className="mt-8 flex flex-wrap gap-2">
        <a
          href={SITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line bg-panel px-3 text-xs font-bold text-dim hover:text-ink"
        >
          <Icon name="external" size={14} /> افتح الموقع
        </a>
        <a
          href={`${SITE_URL}/demo`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line bg-panel px-3 text-xs font-bold text-dim hover:text-ink"
        >
          <Icon name="qr" size={14} /> المنيو التجريبي
        </a>
      </section>
    </div>
  );
}

function MiniSeries({ title, unit, points }: { title: string; unit: string; points: DayPoint[] | null }) {
  return (
    <Card className="p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs font-bold text-dim">{title}</h2>
        <span className="font-display text-base font-black text-ink">{points ? total(points) : "…"}</span>
      </div>
      {points === null ? <Skeleton className="mt-2 h-16" /> : <Bars points={points} unit={unit} height={56} />}
    </Card>
  );
}

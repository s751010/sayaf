/**
 * التحليلات.
 *
 * كل التوقيتات بتوقيت الرياض (UTC+3). الصفوف تُكتب بتوقيت الرياض منذ توسيع
 * التتبّع (انظر `analyticsRow` في lib/data)؛ صفوف قديمة قليلة كُتبت بـUTC فقد
 * تظهر منزاحة ثلاث ساعات — لا نُصلحها بأثر رجعي لأنها بيانات تاريخية.
 *
 * سلسلة واحدة بلون `--c-chart` (مُدقَّق بمدقّق dataviz على السطحين).
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, Skeleton } from "@/components/ui";
import { Insights } from "@/components/Insights";
import { ShareMenu } from "@/components/ShareMenu";
import { getMyAnalytics, getMyDishes } from "@/lib/data";
import { buildInsights } from "@/lib/insights";
import { cn, formatPrice } from "@/lib/utils";
import type { AnalyticsRow, Dish } from "@/lib/types";
import { useDashboard } from "./Dashboard";
import { InsightTabs } from "./Tabs";
import { Icon, DishGlyph } from "@/lib/icons";

const DOW_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const RANGE_DAYS = 30;

/** يوم بتوقيت الرياض كـ`YYYY-MM-DD`، بإزاحة أيام للخلف. */
function riyadhDayKey(daysAgo: number): { iso: string; label: string; dow: number } {
  const d = new Date(Date.now() + 3 * 3600_000 - daysAgo * 86400_000);
  return {
    iso: d.toISOString().slice(0, 10),
    label: `${d.getUTCDate()}/${d.getUTCMonth() + 1}`,
    dow: d.getUTCDay(),
  };
}

/** رسم أعمدة SVG بسيط: أعمدة رفيعة بنهاية مدوّرة، فجوة 2px، تلميح عند المرور. */
function BarChart({
  points,
  ariaLabel,
}: {
  points: { label: string; views: number; sub?: string }[];
  ariaLabel: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = 180;
  const PAD = 6;
  const max = Math.max(1, ...points.map((p) => p.views));
  const bw = (W - PAD * 2) / points.length;

  return (
    <div className="relative" role="img" aria-label={ariaLabel}>
      {/* قيمة أعلى عمود — الشبكة كانت بلا تسميات فيتعذّر قراءة أي مقدار. */}
      <p className="mb-1 text-xs text-faint">الأعلى: {max}</p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-pan-y"
        onMouseLeave={() => setHover(null)}
      >
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={PAD}
            x2={W - PAD}
            y1={H - 22 - (H - 34) * f}
            y2={H - 22 - (H - 34) * f}
            stroke="var(--c-line)"
            strokeWidth="1"
          />
        ))}
        <line x1={PAD} x2={W - PAD} y1={H - 22} y2={H - 22} stroke="var(--c-line)" strokeWidth="1" />
        {points.map((p, i) => {
          const h = Math.max(p.views > 0 ? 3 : 0, ((H - 34) * p.views) / max);
          const x = PAD + i * bw + 1;
          return (
            <g key={i}>
              {/* هدف تحويم/لمس أعرض من العمود (اللوحة تُستخدم على الجوال أساساً) */}
              <rect
                x={PAD + i * bw}
                y={0}
                width={bw}
                height={H - 22}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onTouchStart={() => setHover(i)}
              />
              {h > 0 && (
                <path
                  d={`M${x},${H - 22} v${-(h - Math.min(4, h))} q0,-${Math.min(4, h)} ${Math.min(4, bw - 2)},-${Math.min(4, h)} h${Math.max(0, bw - 2 - Math.min(4, bw - 2) * 2)} q${Math.min(4, bw - 2)},0 ${Math.min(4, bw - 2)},${Math.min(4, h)} v${h - Math.min(4, h)} Z`}
                  fill="var(--c-chart)"
                  opacity={hover === null || hover === i ? 1 : 0.45}
                />
              )}
              {(i % Math.ceil(points.length / 6) === 0 || i === points.length - 1) && (
                <text
                  x={PAD + i * bw + bw / 2}
                  y={H - 7}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--c-faint)"
                >
                  {p.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute -top-1 rounded-lg border border-line bg-panel2 px-2.5 py-1.5 text-xs font-bold text-ink shadow-lg"
          style={{ right: `${(hover / points.length) * 100}%`, transform: "translateX(30%)" }}
        >
          {points[hover].sub ?? points[hover].label}: {points[hover].views} مشاهدة
        </div>
      )}
    </div>
  );
}

/** فرق نسبي مقابل الفترة السابقة. */
function Delta({ now, prev }: { now: number; prev: number }) {
  if (prev === 0) {
    return now > 0 ? <Badge variant="green">جديد</Badge> : null;
  }
  const pct = Math.round(((now - prev) / prev) * 100);
  if (pct === 0) return <Badge variant="neutral">= مستقر</Badge>;
  return (
    <Badge variant={pct > 0 ? "green" : "red"}>
      {pct > 0 ? "▲" : "▼"} {Math.abs(pct)}%
    </Badge>
  );
}

export default function Analytics() {
  const { user, restaurant } = useDashboard();
  const [rows, setRows] = useState<AnalyticsRow[] | null>(null);
  const [dishes, setDishes] = useState<Dish[] | null>(null);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    document.title = "التحليلات — كلاود منيو";
    // ٦٠ يوماً كي تُمكن المقارنة بالفترة السابقة (٣٠ + ٣٠).
    getMyAnalytics(user.id, RANGE_DAYS * 2).then(setRows).catch(() => setRows([]));
    getMyDishes(restaurant.id).then(setDishes).catch(() => setDishes([]));
  }, [user.id, restaurant.id]);

  const stats = useMemo(() => {
    const all = rows ?? [];
    // مشاهدات المنيو = الصفوف بلا dish_id. فتح الأطباق = الصفوف التي تحمله.
    const menuRows = all.filter((r) => !r.dish_id);
    const dishRows = all.filter((r) => r.dish_id);

    const byDate = new Map<string, number>();
    for (const r of menuRows) {
      if (r.date) byDate.set(r.date, (byDate.get(r.date) ?? 0) + (r.views ?? 0));
    }

    const days = [];
    for (let i = RANGE_DAYS - 1; i >= 0; i--) {
      const k = riyadhDayKey(i);
      days.push({ ...k, views: byDate.get(k.iso) ?? 0 });
    }
    const prevDays = [];
    for (let i = RANGE_DAYS * 2 - 1; i >= RANGE_DAYS; i--) {
      const k = riyadhDayKey(i);
      prevDays.push(byDate.get(k.iso) ?? 0);
    }

    const total = days.reduce((s, d) => s + d.views, 0);
    const prevTotal = prevDays.reduce((s, v) => s + v, 0);
    // متوسط على الأيام التي فيها بيانات فعلاً، لا على ٣٠ ثابتة.
    const activeDays = days.filter((d) => d.views > 0).length || 1;
    const best = [...days].sort((a, b) => b.views - a.views)[0];

    const inRange = new Set(days.map((d) => d.iso));
    const hours = new Array<number>(24).fill(0);
    const dow = new Array<number>(7).fill(0);
    const tables = new Map<string, number>();
    let en = 0;
    let ar = 0;

    for (const r of menuRows) {
      if (!r.date || !inRange.has(r.date)) continue;
      const v = r.views ?? 0;
      if (r.hour != null && Number.isInteger(r.hour) && r.hour >= 0 && r.hour <= 23) hours[r.hour] += v;
      const d = days.find((x) => x.iso === r.date);
      if (d) dow[d.dow] += v;
      if (r.table_no) tables.set(r.table_no, (tables.get(r.table_no) ?? 0) + v);
      if (r.lang === "en") en += v;
      else ar += v;
    }

    // فتح الأطباق داخل الفترة، مرتّبة.
    const dishHits = new Map<string, number>();
    for (const r of dishRows) {
      if (!r.date || !inRange.has(r.date) || !r.dish_id) continue;
      dishHits.set(r.dish_id, (dishHits.get(r.dish_id) ?? 0) + (r.views ?? 0));
    }
    const dishOpens = [...dishHits.values()].reduce((s, v) => s + v, 0);

    const ranked = (dishes ?? [])
      .map((d) => ({ dish: d, hits: dishHits.get(d.id) ?? 0 }))
      .sort((a, b) => b.hits - a.hits);
    const zero = ranked.filter((r) => r.hits === 0);

    return {
      days,
      total,
      prevTotal,
      avg: Math.round(total / activeDays),
      best: best?.views ? best : null,
      hours: hours.map((v, h) => ({ label: `${h}`, sub: `الساعة ${h}:00`, views: v })),
      dow: dow.map((v, i) => ({ label: DOW_AR[i].slice(0, 3), sub: DOW_AR[i], views: v })),
      tables: [...tables.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
      langSplit: { ar, en },
      dishOpens,
      ranked,
      zero,
      // نسبة من فتح طبقاً بعد فتح المنيو — أهم رقم تحويل متاح.
      openRate: total > 0 ? Math.round((dishOpens / total) * 100) : 0,
    };
  }, [rows, dishes]);

  const insights = useMemo(
    () => (rows && dishes ? buildInsights(dishes, rows, restaurant) : []),
    [rows, dishes, restaurant]
  );

  function exportCsv() {
    const lines = [
      "التاريخ,اليوم,المشاهدات",
      ...stats.days.map((d) => `${d.iso},${DOW_AR[d.dow]},${d.views}`),
      "",
      "الطبق,مرات الفتح,السعر",
      ...stats.ranked.map(
        (r) => `"${r.dish.name.replace(/"/g, '""')}",${r.hits},${r.dish.price ?? 0}`
      ),
    ];
    // BOM كي يفتح Excel العربية بترميز صحيح.
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cloudmenu-analytics-${riyadhDayKey(0).iso}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  const loading = rows === null || dishes === null;

  const tiles = [
    { label: `مشاهدات المنيو (${RANGE_DAYS} يوماً)`, value: stats.total, delta: stats.prevTotal },
    { label: "متوسط اليوم النشط", value: stats.avg },
    { label: "فتح الأطباق", value: stats.dishOpens },
    { label: "نسبة من فتح طبقاً", value: `${stats.openRate}%` },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-ink">التحليلات</h1>
          <p className="mt-1 text-sm text-dim">
            آخر {RANGE_DAYS} يوماً · بتوقيت الرياض · مقارنةً بالفترة السابقة.
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={loading}>
          <Icon name="download" size={15} /> تصدير CSV
        </Button>
      </div>

      <InsightTabs />

      {loading ? (
        <div className="mt-6 flex flex-col gap-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      ) : stats.total === 0 && stats.dishOpens === 0 ? (
        /* ١٧ من ١٩ تاجراً يهبطون هنا. الشاشة كانت تقول «شارك كود QR» بلا أي
           طريقة لفعل ذلك — نصيحة بلا زر هي طريق مسدود. الآن الفعلان حاضران. */
        <Card className="mt-6 flex flex-col items-center gap-3 py-12 text-center">
          <span className="text-4xl">📊</span>
          <p className="font-bold text-ink">لا مشاهدات بعد</p>
          <p className="max-w-sm text-sm text-dim">
            الأرقام تبدأ من أول زبون يفتح منيوك. أسرع طريقتين: كود QR على
            الطاولات، ورابط منيوك في واتساب وحالة إنستقرام.
          </p>
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            <Link
              to="/dashboard/qr"
              className="rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-on-gold hover:bg-gold2"
            >
              🔳 اطبع كود QR
            </Link>
          </div>
          {restaurant.slug && (
            <div className="mt-2">
              <ShareMenu
                name={restaurant.name}
                url={`${window.location.origin}/${restaurant.slug}`}
              />
            </div>
          )}
        </Card>
      ) : (
        <>
          {/* التوصية قبل الرقم: «١٢٠ مشاهدة» لا تقول للتاجر ماذا يفعل. */}
          {insights.length > 0 && (
            <div className="mt-5">
              <Insights items={insights} />
            </div>
          )}

          {/* أرقام سريعة */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tiles.map((t) => (
              <Card key={t.label}>
                <p className="text-xs text-dim">{t.label}</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="font-display text-2xl font-black text-ink">{t.value}</p>
                  {t.delta !== undefined && <Delta now={stats.total} prev={t.delta} />}
                </div>
              </Card>
            ))}
          </div>

          {/* المشاهدات اليومية */}
          <Card className="mt-5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="inline-flex items-center gap-2 font-display font-extrabold text-ink">
          <Icon name="pulse" size={17} className="shrink-0 text-gold" />{" "}
          المشاهدات اليومية</h2>
              <button
                onClick={() => setShowTable((v) => !v)}
                className="inline-flex min-h-9 items-center text-xs font-bold text-gold hover:underline"
              >
                {showTable ? "عرض الرسم" : "عرض كجدول"}
              </button>
            </div>
            {showTable ? (
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-panel text-xs text-dim">
                    <tr>
                      <th className="py-2 text-start">التاريخ</th>
                      <th className="py-2 text-start">اليوم</th>
                      <th className="py-2 text-start">المشاهدات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...stats.days].reverse().map((d) => (
                      <tr key={d.iso} className="border-t border-line">
                        <td className="py-1.5 text-ink" dir="ltr">{d.iso}</td>
                        <td className="py-1.5 text-dim">{DOW_AR[d.dow]}</td>
                        <td className="py-1.5 font-bold text-ink">{d.views}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <BarChart points={stats.days} ariaLabel="المشاهدات اليومية" />
            )}
          </Card>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {/* أيام الأسبوع */}
            <Card>
              <h2 className="inline-flex items-center gap-2 mb-2 font-display font-extrabold text-ink">
          <Icon name="clock" size={17} className="shrink-0 text-gold" />{" "}
          أيام الأسبوع</h2>
              <p className="mb-2 text-xs text-dim">أي أيام الأسبوع أكثر زيارةً — مفيد للعروض والجدولة.</p>
              <BarChart points={stats.dow} ariaLabel="المشاهدات حسب يوم الأسبوع" />
            </Card>

            {/* ساعات الذروة */}
            <Card>
              <h2 className="inline-flex items-center gap-2 mb-2 font-display font-extrabold text-ink">
          <Icon name="clock" size={17} className="shrink-0 text-gold" />{" "}
          ساعات الذروة</h2>
              <p className="mb-2 text-xs text-dim">بتوقيت الرياض.</p>
              <BarChart points={stats.hours} ariaLabel="المشاهدات حسب الساعة" />
            </Card>
          </div>

          {/* الأطباق */}
          <Card className="mt-5">
            <h2 className="inline-flex items-center gap-2 font-display font-extrabold text-ink">
          <Icon name="plate" size={17} className="shrink-0 text-gold" />{" "}
          الأطباق الأكثر فتحاً</h2>
            <p className="mt-1 text-xs text-dim">
              خلال آخر {RANGE_DAYS} يوماً — يُقاس عند فتح الزبون تفاصيل الطبق.
            </p>
            {stats.ranked.length === 0 ? (
              <p className="mt-3 text-sm text-faint">لا توجد أطباق بعد.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-1.5">
                {stats.ranked.slice(0, 10).map((r, i) => (
                  <li
                    key={r.dish.id}
                    className="flex items-center gap-3 rounded-xl border border-line bg-panel2 px-3 py-2"
                  >
                    <span className="w-5 text-center font-display font-black text-faint">{i + 1}</span>
                    <DishGlyph value={r.dish.emoji} size={20} className="text-dim" />
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">
                      {r.dish.name}
                    </span>
                    <span className="text-xs text-dim">{formatPrice(r.dish.price ?? 0)} ر.س</span>
                    <span className="w-12 text-end text-sm font-black text-gold">{r.hits}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* أطباق بلا مشاهدة — السؤال الأكثر قابلية للتنفيذ في هندسة المنيو */}
            {stats.zero.length > 0 && (
              <div className="mt-4 rounded-xl border border-line bg-panel2/60 px-4 py-3">
                <p className="text-sm font-bold text-ink">
                  🕳️ {stats.zero.length} طبقاً لم يفتحه أحد
                </p>
                <p className="mt-1 text-xs leading-relaxed text-dim">
                  {stats.zero.slice(0, 12).map((r) => r.dish.name).join(" · ")}
                  {stats.zero.length > 12 && " …"}
                </p>
                <p className="mt-1.5 text-xs text-faint">
                  فكّر في صورة أفضل، أو وصف أشهى، أو نقله لتصنيف أقرب — أو حذفه.
                </p>
              </div>
            )}
          </Card>

          {/* الطاولات واللغة */}
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Card>
              <h2 className="inline-flex items-center gap-2 mb-2 font-display font-extrabold text-ink">
          <Icon name="tag" size={17} className="shrink-0 text-gold" />{" "}
          أكثر الطاولات</h2>
              {stats.tables.length === 0 ? (
                <p className="text-xs text-faint">
                  لا بيانات طاولات بعد — استخدم أكواد QR المرقّمة لكل طاولة من صفحة «أكواد QR».
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {stats.tables.map(([t, v]) => (
                    <li key={t} className="flex items-center justify-between rounded-lg border border-line px-3 py-1.5 text-sm">
                      <span className="text-ink">طاولة {t}</span>
                      <span className="font-bold text-gold">{v}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <h2 className="inline-flex items-center gap-2 mb-2 font-display font-extrabold text-ink">
          <Icon name="link" size={17} className="shrink-0 text-gold" />{" "}
          لغة العرض</h2>
              {stats.langSplit.ar + stats.langSplit.en === 0 ? (
                <p className="text-xs text-faint">لا بيانات بعد.</p>
              ) : (
                <>
                  <div className="flex h-3 overflow-hidden rounded-full bg-ink/8">
                    <div
                      className="bg-gold"
                      style={{
                        width: `${(stats.langSplit.ar / (stats.langSplit.ar + stats.langSplit.en)) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-xs">
                    <span className="text-ink">العربية: {stats.langSplit.ar}</span>
                    <span className="text-dim">English: {stats.langSplit.en}</span>
                  </div>
                  <p className="mt-2 text-xs text-faint">
                    يساعدك على معرفة هل يستحق المنيو الإنجليزي جهد الترجمة.
                  </p>
                </>
              )}
            </Card>
          </div>

          {stats.best && (
            <p className={cn("mt-5 text-center text-xs text-faint")}>
              أفضل يوم في الفترة: {stats.best.label} بـ{stats.best.views} مشاهدة.
            </p>
          )}
        </>
      )}
    </div>
  );
}

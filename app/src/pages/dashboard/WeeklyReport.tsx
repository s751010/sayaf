/**
 * تقرير الأسبوع — «كيف كان منيوي هذا الأسبوع مقارنةً بالذي قبله؟».
 *
 * شاشةٌ واحدة تُقرأ في دقيقة، تحت «التحليلات» تبويباً بين «الأرقام» و«الولاء»:
 * «الأرقام» ثلاثون يوماً لمن يريد أن يحفر، وهذا ما تغيّر منذ الأحد وما العمل.
 * والحساب كلّه في `lib/weeklyReport.ts` (دوالّ خالصة مفحوصة)، والخطوة التالية
 * من سلّم `lib/nextStep.ts` نفسه الذي في الرئيسية — لا منطق توصيةٍ ثانٍ.
 *
 * البريد لاحقاً: يحتاج دالّة حافة ينشرها المالك، والحساب جاهزٌ لها خالصاً.
 *
 * ⚠️ **الفشل ليس أسبوعاً فارغاً** (الدرس ٣٢): «لا زيارة هذا الأسبوع» لتاجرٍ
 * سقطت شبكته كذبةٌ تُقلقه على منيوٍ يعمل. فالفشل حالةٌ مستقلّة بزرّ «أعد
 * المحاولة»، و`null` يُحمَّل، والفراغ لا يُعرض إلا بعد جلبٍ نجح.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, EmptyState, Skeleton } from "@/components/ui";
import { DeltaBadge } from "@/components/DeltaBadge";
import { NextStepCard } from "@/components/NextStepCard";
import { ShareMenu } from "@/components/ShareMenu";
import { getMyAnalytics, getMyDishes, getOrdersSince } from "@/lib/data";
import { buildNextStep } from "@/lib/nextStep";
import {
  DOW_AR,
  buildWeeklyReport,
  dayLabel,
  deltaOf,
  reportSince,
  type Metric,
  type OrderLite,
  type WeekMode,
  type WeeklyReport as Report,
} from "@/lib/weeklyReport";
import { DishGlyph, Icon, type IconName } from "@/lib/icons";
import { menuUrl } from "@/lib/menuUrl";
import { cn, formatPrice } from "@/lib/utils";
import type { AnalyticsRow, Dish } from "@/lib/types";
import { useDashboard, FeatureGate } from "./Dashboard";
import { InsightTabs } from "./Tabs";

/** الجدار في غلاف لا داخل المكوّن — كـ`Analytics` (خطّافات الابن كاملةً أو لا شيء). */
export default function WeeklyReport() {
  return (
    <FeatureGate
      feature="analytics"
      title="تقرير الأسبوع يُفتح بالاشتراك"
      desc="كل أحد: كم زبوناً فتح منيوك، وأيّ أطباقك صعد وأيّها لم يفتحه أحد، ومتى يزورك الناس — وما الخطوة التالية. فعّل اشتراكك لتراه."
    >
      <WeeklyReportInner />
    </FeatureGate>
  );
}

const MODES: { id: WeekMode; label: string }[] = [
  { id: "current", label: "هذا الأسبوع" },
  { id: "last", label: "الأسبوع الماضي" },
];

function WeeklyReportInner() {
  const { user, restaurant, menus } = useDashboard();
  const ordersOn = Boolean(restaurant.online_payment_enabled);
  const [rows, setRows] = useState<AnalyticsRow[] | null>(null);
  const [dishes, setDishes] = useState<Dish[] | null>(null);
  const [orders, setOrders] = useState<OrderLite[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [mode, setMode] = useState<WeekMode>("current");
  // «الآن» يُثبَّت عند الجلب: لا يقفز حدّ الأسبوع بين رسمتين لو عبرت الساعة
  // منتصف الليل والشاشة مفتوحة — والأرقام جُلبت لـ«آنٍ» واحد.
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    document.title = "تقرير الأسبوع — كلاود منيو";
    let alive = true;
    const now = Date.now();
    setFailed(false);
    setNowMs(now);
    Promise.all([
      // ٣٠ يوماً كالرئيسية: تكفي الأسبوعين وما قبلهما (أبعد حدٍّ ٢٠ يوماً)،
      // وتجعل «خطوتك التالية» هنا هي نفسها هناك.
      getMyAnalytics(user.id),
      getMyDishes(restaurant.id),
      // بلا بوّابة لا طلبات أصلاً — و`null` يقول «لا قسم» لا «صفر طلب».
      ordersOn ? getOrdersSince(restaurant.id, reportSince(now)) : Promise.resolve(null),
    ])
      .then(([r, d, o]) => {
        if (!alive) return;
        setRows(r);
        setDishes(d);
        setOrders(o);
      })
      .catch(() => {
        // الفشل ظاهرٌ للتاجر بزرّه، فلا يُبلَّغ (`reportSilentFailure` لما يختفي).
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [user.id, restaurant.id, ordersOn, attempt]);

  const report = useMemo(
    () =>
      rows && dishes
        ? buildWeeklyReport({ nowMs, mode, rows, dishes, orders, restaurantCreatedAt: restaurant.created_at })
        : null,
    [nowMs, mode, rows, dishes, orders, restaurant.created_at]
  );

  const next = useMemo(
    () => buildNextStep(dishes, menus, rows, restaurant),
    [dishes, menus, rows, restaurant]
  );

  const publicUrl = menuUrl(restaurant.slug);

  return (
    <div>
      <div>
        <h1 className="font-display text-2xl font-black text-ink">تقرير الأسبوع</h1>
        <p className="mt-1 text-sm text-dim">
          الأسبوع من الأحد إلى السبت · بتوقيت الرياض · مقارنةً بالذي قبله.
        </p>
      </div>

      <InsightTabs />

      <div role="group" aria-label="أيّ أسبوع" className="mt-4 flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={mode === m.id}
            onClick={() => setMode(m.id)}
            className={cn(
              "press min-h-11 rounded-[10px] border px-4 text-sm font-bold",
              mode === m.id ? "border-ink bg-ink text-page" : "border-line text-dim hover:text-ink"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {failed ? (
        <div className="mt-5">
          <EmptyState
            icon="warn"
            title="تعذّر تحميل التقرير"
            desc="لم نصل إلى أرقامك — غالباً انقطاعٌ في الاتصال. منيوك يعمل كما هو."
            action={<Button onClick={() => setAttempt((n) => n + 1)}>أعد المحاولة</Button>}
          />
        </div>
      ) : !report ? (
        <div className="mt-5 flex flex-col gap-4" aria-busy="true">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      ) : (
        <>
          <WeekHeading report={report} />
          {report.weekCoverage === "none" ? (
            <div className="mt-5">
              <EmptyState
                icon="clock"
                title="منيوك أحدث من هذا الأسبوع"
                desc="بدأت بعد نهايته — تقريرك الأوّل هو «هذا الأسبوع»."
                action={<Button onClick={() => setMode("current")}>اعرض هذا الأسبوع</Button>}
              />
            </div>
          ) : report.empty ? (
            /* الفعلان حاضران كما في «الأرقام»: نصيحةٌ بلا زرّ طريقٌ مسدود. */
            <Card className="mt-5 flex flex-col items-center gap-3 py-10 text-center">
              <Icon name="eye" size={34} className="text-faint" strokeWidth={1.4} />
              <p className="font-bold text-ink">
                {report.inProgress ? "لا زيارة لمنيوك منذ الأحد بعد" : "لم يفتح منيوك أحدٌ ذلك الأسبوع"}
              </p>
              <p className="max-w-sm text-sm text-dim">
                الأرقام تبدأ من أوّل زبون يفتح منيوك: كود QR على الطاولة، ورابطك في واتساب وحالة إنستقرام.
              </p>
              <div className="mt-1 flex flex-wrap justify-center gap-2">
                <Link
                  to="/dashboard/qr"
                  className="inline-flex min-h-11 items-center rounded-xl bg-gold px-5 text-sm font-bold text-on-gold hover:bg-gold2"
                >
                  اطبع كود QR
                </Link>
                {report.inProgress && (
                  <Button variant="outline" onClick={() => setMode("last")}>
                    اعرض الأسبوع الماضي
                  </Button>
                )}
              </div>
              {publicUrl && (
                <div className="mt-2">
                  <ShareMenu name={restaurant.name} url={publicUrl} />
                </div>
              )}
            </Card>
          ) : (
            <ReportBody report={report} />
          )}

          <NextStepCard next={next} />
        </>
      )}
    </div>
  );
}

/** النطاق بالتاريخ، وما يُقارَن به، وما يجعل المقارنة ناقصة. */
function WeekHeading({ report }: { report: Report }) {
  const { week, prev } = report;
  const range = `${DOW_AR[0]} ${dayLabel(week.start)} — ${
    report.inProgress ? `اليوم ${dayLabel(week.end)}` : `${DOW_AR[6]} ${dayLabel(week.end)}`
  }`;
  const against =
    prev.cutHour !== null
      ? `${dayLabel(prev.start)} — ${dayLabel(prev.end)} حتى الساعة ${prev.cutHour}:59`
      : `${dayLabel(prev.start)} — ${dayLabel(prev.end)}`;
  return (
    <div className="mt-4 text-sm">
      <p className="font-bold text-ink">{range}</p>
      <p className="mt-0.5 text-xs text-dim">
        {report.prevCoverage === "none" ? "لا أسبوع قبله نقارن به." : `مقارنةً بـ ${against}`}
        {report.prevCoverage === "partial" && report.createdIso && (
          <> — بدأ منيوك {dayLabel(report.createdIso)}، فالأسبوع السابق ناقص والمقارنة تقريبية.</>
        )}
      </p>
      {report.weekCoverage === "partial" && report.createdIso && (
        <p className="mt-1 text-xs font-bold text-gold">
          أسبوعك الأوّل — بدأ منيوك يوم {DOW_AR[new Date(`${report.createdIso}T00:00:00Z`).getUTCDay()]}{" "}
          {dayLabel(report.createdIso)}.
        </p>
      )}
    </div>
  );
}

function Tile({ label, icon, value, metric }: { label: string; icon: IconName; value: string; metric?: Metric }) {
  return (
    <Card className="min-w-0 p-4">
      {/* مجموعةٌ مسمّاة: قارئ الشاشة يقرأ الرقم وفرقه باسم البطاقة. */}
      <div role="group" aria-label={label}>
        <p className="inline-flex items-center gap-1.5 text-xs text-dim">
          <Icon name={icon} size={14} className="shrink-0 text-gold" />
          {label}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="font-display text-2xl font-black tabular-nums text-ink">{value}</p>
          {metric && <DeltaBadge delta={metric.delta} />}
        </div>
        {metric && metric.delta.kind !== "first" && (
          <p className="mt-1 text-xs text-faint">قبله: {formatPrice(metric.prev)}</p>
        )}
      </div>
    </Card>
  );
}

function ReportBody({ report }: { report: Report }) {
  const { views, dishOpens, orders } = report;
  const dayMax = Math.max(1, ...report.byDay.map((d) => d.views));
  return (
    <>
      {/* ثلاثة أعمدة لا أربعة: ثلاث بطاقات بلا طلبات، وخمسٌ بها — لا يتيم في صفّ. */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Tile label="فتح المنيو" icon="eye" value={String(views.now)} metric={views} />
        <Tile label="فتح الأطباق" icon="plate" value={String(dishOpens.now)} metric={dishOpens} />
        <Tile
          label="نسبة من فتح طبقاً"
          icon="pulse"
          value={report.openRate === null ? "—" : `${report.openRate}%`}
        />
        {orders && (
          <>
            <Tile label="الطلبات" icon="ticket" value={String(orders.count.now)} metric={orders.count} />
            <Tile
              label="الإيراد (ر.س)"
              icon="money"
              value={formatPrice(orders.revenue.now)}
              metric={orders.revenue}
            />
          </>
        )}
      </div>

      {/*
        * الأيام السبعة — أشرطةٌ أفقية لا أعمدة `BarChart`.
        *
        * أعمدة «الأرقام» SVG بعرض ٦٤٠ وحدة يُصغَّر: تسميتها ١٠ وحدات تصير
        * قرابة ٤px على ٣٢٠ — أيام الأسبوع لا تُقرأ (مقيسٌ في لقطة 320)، وأوّلها
        * على اليسار في صفحةٍ تُقرأ من اليمين. وسبعة صفوف «يوم · شريط · رقم»
        * تُقرأ بأيّ عرض، كشريط «لغة العرض» في الصفحة نفسها، وبلون `--c-chart`.
        */}
      <Card className="mt-4">
        <h2 className="mb-3 inline-flex items-center gap-2 font-display font-extrabold text-ink">
          <Icon name="bars" size={17} className="shrink-0 text-gold" /> يوماً بيوم
        </h2>
        <ul aria-label="فتح المنيو في كل يوم" className="flex flex-col gap-1.5">
          {report.byDay.map((d) => {
            const best = report.busiestDay?.iso === d.iso;
            return (
              <li key={d.iso} className="flex items-center gap-2 text-sm">
                <span className={cn("w-[5.5rem] shrink-0", best ? "font-bold text-ink" : "text-dim")}>
                  {DOW_AR[d.dow]} <span className="text-xs text-faint">{dayLabel(d.iso)}</span>
                </span>
                <span className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-ink/8">
                  {d.views > 0 && (
                    <span
                      className="block h-full rounded-full"
                      style={{ width: `${(d.views / dayMax) * 100}%`, background: "var(--c-chart)" }}
                    />
                  )}
                </span>
                {/* اليوم الذي لم يأتِ «—» لا «0»: الصفر خبرٌ عن يومٍ مضى. */}
                <span className="w-9 shrink-0 text-end font-bold tabular-nums text-ink">
                  {d.future ? <span className="font-normal text-faint">—</span> : d.views}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="mt-4">
        <h2 className="mb-3 inline-flex items-center gap-2 font-display font-extrabold text-ink">
          <Icon name="clock" size={17} className="shrink-0 text-gold" /> متى يزورونك
        </h2>
        {report.busiestDay || report.busiestHour ? (
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {report.busiestDay && (
              <div className="rounded-xl border border-line bg-panel2 px-3 py-2">
                <dt className="text-xs text-dim">أنشط يوم</dt>
                <dd className="mt-0.5 font-bold text-ink">
                  {DOW_AR[report.busiestDay.dow]} {dayLabel(report.busiestDay.iso)} · الزيارات:{" "}
                  <span className="tabular-nums">{report.busiestDay.views}</span>
                </dd>
              </div>
            )}
            {report.busiestHour && (
              <div className="rounded-xl border border-line bg-panel2 px-3 py-2">
                <dt className="text-xs text-dim">أنشط ساعة (بتوقيت الرياض)</dt>
                <dd className="mt-0.5 font-bold text-ink">
                  <span dir="ltr" className="tabular-nums">
                    {report.busiestHour.hour}:00
                  </span>{" "}
                  · الزيارات: <span className="tabular-nums">{report.busiestHour.views}</span>
                </dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="text-xs text-faint">لا فتح للمنيو هذا الأسبوع بعد.</p>
        )}
      </Card>

      <Card className="mt-4">
        <h2 className="inline-flex items-center gap-2 font-display font-extrabold text-ink">
          <Icon name="flame" size={17} className="shrink-0 text-gold" /> الأكثر فتحاً
        </h2>
        <p className="mt-1 text-xs text-dim">يُقاس حين يفتح الزبون تفاصيل الطبق.</p>
        {report.topDishes.length === 0 ? (
          <p className="mt-3 text-sm text-faint">لم يفتح أحدٌ طبقاً هذا الأسبوع.</p>
        ) : (
          <ul aria-label="الأكثر فتحاً هذا الأسبوع" className="mt-3 flex flex-col gap-1.5">
            {report.topDishes.map((t, i) => (
              <li
                key={t.dish.id}
                className="flex items-center gap-2.5 rounded-xl border border-line bg-panel2 px-3 py-2"
              >
                <span className="w-4 shrink-0 text-center font-display font-black text-faint">{i + 1}</span>
                <DishGlyph value={t.dish.emoji} size={20} className="shrink-0 text-dim" />
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{t.dish.name}</span>
                {/* تحت ٦٤٠px تأكل الشارة اسم الطبق — والرقم يكفي هناك. */}
                <span className="hidden shrink-0 sm:inline-flex">
                  <DeltaBadge delta={deltaOf(t.opens, t.prev, report.prevCoverage)} />
                </span>
                <span className="w-8 shrink-0 text-end text-sm font-black tabular-nums text-gold">{t.opens}</span>
              </li>
            ))}
          </ul>
        )}

        {/* السؤال الأكثر قابليةً للتنفيذ في هندسة المنيو — كما في «الأرقام». */}
        {report.zeroDishes.length > 0 && (
          <div className="mt-4 rounded-xl border border-line bg-panel2/60 px-4 py-3">
            <p className="text-sm font-bold text-ink">
              {report.zeroDishes.length} طبقاً لم يفتحه أحد هذا الأسبوع
            </p>
            <p className="mt-1 break-words text-xs leading-relaxed text-dim">
              {report.zeroDishes
                .slice(0, 12)
                .map((d) => d.name)
                .join(" · ")}
              {report.zeroDishes.length > 12 && " …"}
            </p>
            <p className="mt-1.5 text-xs text-faint">
              صورةٌ أوضح، أو وصفٌ أشهى، أو تصنيفٌ أقرب — أو أخفِه ليبرز الباقي.
            </p>
          </div>
        )}
      </Card>
    </>
  );
}

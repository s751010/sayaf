/**
 * الرئيسية — خمس كتل بدل تسع.
 *
 * ترحيب · رابط المنيو ومشاركته · **خطوتك التالية** · نبض الأسبوع · الأكثر
 * مشاهدة. وأربع بطاقات كانت تتنافس على سؤال «وش أسوي الحين؟» صارت واحدة يبنيها
 * `lib/nextStep.ts` — انظر رأسه.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Card, Skeleton } from "@/components/ui";
import { PreviewMenuButton } from "@/components/site";
import { ShareMenu } from "@/components/ShareMenu";
import { NextStepCard } from "@/components/NextStepCard";
import { getMyAnalytics, getMyDishes, getOrdersToday, type OrdersToday } from "@/lib/data";
import { buildNextStep } from "@/lib/nextStep";
import { buildWeeklyReport } from "@/lib/weeklyReport";
import { planLabel } from "@/lib/entitlements";
import { formatPrice } from "@/lib/utils";
import type { AnalyticsRow, Dish } from "@/lib/types";
import { useDashboard } from "./Dashboard";
import { DishGlyph } from "@/lib/icons";
import { Icon } from "@/lib/icons";
import { menuUrl, urlAffixes } from "@/lib/menuUrl";
import {
  SETUP_STEPS,
  dismissSetup,
  parseProgress,
  progressPercent,
  setupKey,
  setupPending,
  type SetupProgress,
} from "@/lib/setup";
import { getJSON, setJSON } from "@/lib/storage";

export default function Overview() {
  const { user, restaurant, menus, ent } = useDashboard();
  const [dishes, setDishes] = useState<Dish[] | null>(null);
  const [rows, setRows] = useState<AnalyticsRow[] | null>(null);
  const [today, setToday] = useState<OrdersToday | null>(null);
  /** تقدّم «إعداد منيوك» على هذا الجهاز — `null` = لم يبدأه هنا. */
  const [setup, setSetup] = useState<SetupProgress | null>(() =>
    parseProgress(getJSON(setupKey(restaurant.id)))
  );

  useEffect(() => {
    document.title = "لوحة التحكم — كلاود منيو";
    getMyDishes(restaurant.id).then(setDishes).catch(() => setDishes([]));
    getMyAnalytics(user.id).then(setRows).catch(() => setRows([]));
    // الطلبات تُجلب لمن ربط بوّابة فقط: نداءٌ لا معنى له عند البقيّة.
    if (restaurant.online_payment_enabled) {
      getOrdersToday(restaurant.id).then(setToday).catch(() => setToday(null));
    }
  }, [restaurant.id, user.id]);

  // مشاهدات المنيو فقط — الصفوف التي تحمل dish_id هي فتح أطباق لا مشاهدات.
  const views30 = rows === null ? null : rows.reduce((s, r) => s + (r.dish_id ? 0 : r.views ?? 0), 0);

  const next = useMemo(
    () => buildNextStep(dishes, menus, rows, restaurant),
    [dishes, menus, rows, restaurant]
  );

  const publicUrl = menuUrl(restaurant.slug);
  const top = [...(dishes ?? [])].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 5);

  /**
   * نبض الأسبوع — سبب العودة إلى اللوحة.
   *
   * يُحسب من نفس صفوف التحليلات المجلوبة أصلاً، فلا استعلام إضافي. وبعد رفع
   * المنيو لم يكن في اللوحة ما يستدعي فتحها مرة ثانية؛ رقمٌ يتحرّك أسبوعياً
   * ومقارنة بالأسبوع الذي قبله هو أبسط ما يستدعيها.
   */
  //
  // ⚠️ **من `lib/weeklyReport.ts` لا حسابٌ هنا** (٢٠٢٦/١٠/٢٧): كان «آخر سبعة
  // أيام» بتواريخ UTC، والتقرير الأسبوعي من الأحد بتوقيت الرياض — فيقول
  // البطاقة رقماً والتقرير الذي تقود إليه رقماً آخر للأسبوع نفسه. والأسبوع
  // الجاري يُقارَن بالمدّة نفسها من الماضي، لا بسبعة أيام كاملة.
  const week = useMemo(() => {
    if (!rows) return null;
    const r = buildWeeklyReport({
      nowMs: Date.now(),
      mode: "current",
      rows,
      dishes: dishes ?? [],
      orders: null,
      restaurantCreatedAt: restaurant.created_at,
    });
    return { now: r.views.now, prev: r.views.prev, delta: r.views.delta, top: r.topDishes[0]?.dish ?? null };
  }, [rows, dishes, restaurant.created_at]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-ink">
            أهلاً، {restaurant.name} 👋
          </h1>
          <p className="mt-1 text-sm text-dim">هذه نبضة مطعمك اليوم.</p>
        </div>
        <Badge
          variant={
            ent.loading || !ent.active ? "neutral" : ent.trialDaysLeft === 1 ? "red" : "gold"
          }
        >
          {planLabel(ent)}
        </Badge>
      </div>

      {/* رابط المنيو ومشاركته — «نسخ» وحده كان يترك التاجر يبحث عن واتساب بنفسه. */}
      <Card className="mt-6 border-gold/25 bg-gold/[.04]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink">رابط منيوك العام</p>
            <p className="truncate text-sm text-gold" dir="ltr">
              {publicUrl?.replace("https://", "") ?? `${urlAffixes().before}…`}
            </p>
          </div>
          {publicUrl && (
            <PreviewMenuButton
              slug={restaurant.slug}
              className="border-transparent bg-gold text-on-gold hover:bg-gold2"
            />
          )}
        </div>
        {publicUrl && (
          <div className="mt-3 border-t border-gold/15 pt-3">
            <ShareMenu name={restaurant.name} url={publicUrl} />
          </div>
        )}
      </Card>

      {/* «أكمل إعداد منيوك» — لمن خرج من المسار قبل آخره. وتُقرأ من الجهاز
          بلا شبكة، فلا تومض ولا تنتظر. والإخفاء نهائي لهذا المطعم. */}
      {setupPending(setup) && setup && (
        <Card className="mt-5 border-line-gold">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-display text-base font-black text-ink">أكمل إعداد منيوك</p>
              <p className="mt-0.5 text-sm text-dim">
                توقّفت عند «{SETUP_STEPS.find((s) => s.id === setup.step)?.title}» — كل ما فعلته محفوظ.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = dismissSetup(setup);
                setJSON(setupKey(restaurant.id), next);
                setSetup(next);
              }}
              aria-label="إخفاء بطاقة الإعداد"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-dim hover:bg-ink/5 hover:text-ink"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-ink/8"
            role="progressbar"
            aria-label="تقدّم الإعداد"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent(setup)}
          >
            <div className="h-full rounded-full bg-gold" style={{ width: `${progressPercent(setup)}%` }} />
          </div>
          <Link
            to="/dashboard/setup"
            className="mt-3 inline-flex min-h-11 items-center rounded-[10px] bg-gold px-4 text-sm font-bold text-on-gold hover:bg-gold2"
          >
            أكمل من حيث توقّفت ←
          </Link>
        </Card>
      )}

      {/**
        * بطاقة واحدة تجيب «وش أسوي الحين؟».
        *
        * كانت أربع بطاقات تتنافس على السؤال نفسه (التوصيات · دليل الخطوات ·
        * اكتمال المنيو · المنيو الراكد)، واثنتان منها محجوبتان عن بعضهما
        * بتعليق يقول «شريطا تقدّم متجاوران يُربكان». السلّم كلّه صار في
        * `lib/nextStep.ts`، وهنا فعلٌ واحد وما بقي مطويّ.
        */}
      <NextStepCard next={next} />

      {/* نبض الأسبوع — لا يظهر إلا بعد أول مشاهدة، فالتاجر الجديد لا يواجه
          رقماً صفرياً محبِطاً. والأرقام الثلاثة صارت سطراً هنا بدل ثلاث بطاقات:
          «٣ قوائم» ليست خبراً يستحق بطاقة بحجم بطاقة المشاهدات. */}
      {/* الشرط على الثلاثين يوماً لا على الأسبوع: صباح الأحد أسبوعٌ جارٍ بلا
          مشاهدة بعد، وإخفاء البطاقة حينها يُخفي رابط تقرير الأسبوع المنصرم. */}
      {week && (views30 ?? 0) > 0 && (
        <Card className="mt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="inline-flex items-center gap-2 font-display font-extrabold text-ink">
            <Icon name="pulse" size={17} className="text-gold" /> هذا الأسبوع
          </p>
            <Link to="/dashboard/report" className="text-xs font-bold text-gold hover:underline">
              تقرير الأسبوع ←
            </Link>
          </div>
          <p className="mt-2 text-sm text-dim">
            منيوك شوهد <span className="font-display text-xl font-black text-ink">{week.now}</span>{" "}
            مرة
            {(week.delta.kind === "up" || week.delta.kind === "down") && (
              <span className={week.delta.kind === "up" ? "font-bold text-good" : "font-bold text-bad"}>
                {" "}
                ({week.delta.kind === "up" ? "+" : "−"}
                {week.delta.pct}% عن المدّة نفسها الأسبوع الماضي)
              </span>
            )}
            {/* من فتح هذا الأسبوع لا من عدّاد `dishes.views` التراكمي — جملةٌ
                تحت «هذا الأسبوع» تتكلّم عن هذا الأسبوع. */}
            {week.top && (
              <>
                {" · "}أكثر طبق فُتح: <span className="font-bold text-ink">{week.top.name}</span>
              </>
            )}
          </p>
          <p className="mt-2 border-t border-line pt-2 text-xs text-faint">
            👁️ {views30 ?? 0} مشاهدة في ٣٠ يوماً · 🍽️ {dishes?.length ?? 0} طبقاً ·
            📋 {menus?.length ?? 0} قائمة
          </p>
        </Card>
      )}

      {/* طلبات اليوم — أول ما يسأل عنه من يستقبل طلبات، فأول ما يراه. */}
      {today !== null && (
        <Card className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 font-display text-base font-extrabold text-ink">
              <Icon name="ticket" size={16} /> طلبات اليوم
            </h2>
            <Link to="/dashboard/orders" className="text-xs font-bold text-gold underline">
              فتح اللوحة
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div>
              <p className="text-2xl font-black tabular-nums text-ink">{today.count}</p>
              <p className="text-xs text-faint">طلب</p>
            </div>
            <div>
              <p className="text-2xl font-black tabular-nums text-ink">
                {formatPrice(today.revenue)}
              </p>
              <p className="text-xs text-faint">ريال</p>
            </div>
            <div>
              <p
                className={`text-2xl font-black tabular-nums ${
                  today.open > 0 ? "text-gold" : "text-ink"
                }`}
              >
                {today.open}
              </p>
              <p className="text-xs text-faint">قيد التنفيذ</p>
            </div>
          </div>
          {today.open > 0 && (
            <p className="mt-3 rounded-xl bg-gold/10 px-3 py-2 text-xs font-bold text-gold">
              ⏳ عندك {today.open} طلباً ينتظر — افتح اللوحة.
            </p>
          )}
        </Card>
      )}

      {/* أفضل الأطباق */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="inline-flex items-center gap-2 font-display text-lg font-extrabold text-ink">
          <Icon name="flame" size={17} className="shrink-0 text-gold" />{" "}
          الأكثر مشاهدة</h2>
          <Link to="/dashboard/dishes" className="text-sm font-bold text-gold hover:underline">
            كل الأطباق ←
          </Link>
        </div>
        {dishes === null ? (
          <Skeleton className="h-40" />
        ) : top.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="text-4xl">🍽️</span>
            <p className="font-bold text-ink">أضف أول طبق لمنيوك</p>
            <Link
              to="/dashboard/dishes"
              className="rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-on-gold hover:bg-gold2"
            >
              ＋ إضافة طبق
            </Link>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {top.map((d, i) => (
              <Card key={d.id} className="flex items-center gap-3 py-3">
                <span className="w-6 text-center font-display font-black text-faint">{i + 1}</span>
                <DishGlyph value={d.emoji} size={24} className="text-dim" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ink">{d.name}</p>
                  <p className="text-xs text-faint">{d.category ?? "بدون تصنيف"}</p>
                </div>
                <span className="text-sm text-dim">👁️ {d.views ?? 0}</span>
                <span className="font-bold text-gold">{formatPrice(d.price ?? 0)} ر.س</span>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

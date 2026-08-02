/** نظرة عامة: أرقام سريعة + أفضل الأطباق + رابط المنيو. */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Card, Skeleton } from "@/components/ui";
import { PreviewMenuButton } from "@/components/site";
import { Insights } from "@/components/Insights";
import { ShareMenu } from "@/components/ShareMenu";
import { getMyAnalytics, getMyDishes } from "@/lib/data";
import { buildInsights } from "@/lib/insights";
import { planLabel } from "@/lib/entitlements";
import { formatPrice } from "@/lib/utils";
import { SITE_URL } from "@/lib/config";
import type { AnalyticsRow, Dish } from "@/lib/types";
import { useDashboard } from "./Dashboard";

export default function Overview() {
  const { user, restaurant, menus, ent } = useDashboard();
  const [dishes, setDishes] = useState<Dish[] | null>(null);
  const [rows, setRows] = useState<AnalyticsRow[] | null>(null);

  useEffect(() => {
    document.title = "لوحة التحكم — كلاود منيو";
    getMyDishes(restaurant.id).then(setDishes).catch(() => setDishes([]));
    getMyAnalytics(user.id).then(setRows).catch(() => setRows([]));
  }, [restaurant.id, user.id]);

  // مشاهدات المنيو فقط — الصفوف التي تحمل dish_id هي فتح أطباق لا مشاهدات.
  const views30 = rows === null ? null : rows.reduce((s, r) => s + (r.dish_id ? 0 : r.views ?? 0), 0);

  const insights = useMemo(
    () => (rows && dishes ? buildInsights(dishes, rows, restaurant) : []),
    [rows, dishes, restaurant]
  );

  const menuUrl = `${window.location.origin}/${restaurant.slug}`;
  const publicUrl = restaurant.slug ? menuUrl : null;
  const top = [...(dishes ?? [])].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 5);

  /**
   * نبض الأسبوع — سبب العودة إلى اللوحة.
   *
   * يُحسب من نفس صفوف التحليلات المجلوبة أصلاً، فلا استعلام إضافي. وبعد رفع
   * المنيو لم يكن في اللوحة ما يستدعي فتحها مرة ثانية؛ رقمٌ يتحرّك أسبوعياً
   * ومقارنة بالأسبوع الذي قبله هو أبسط ما يستدعيها.
   */
  const week = useMemo(() => {
    if (!rows) return null;
    const day = 86400_000;
    const since = (n: number) => new Date(Date.now() - n * day).toISOString().slice(0, 10);
    const d7 = since(7);
    const d14 = since(14);
    let now = 0;
    let prev = 0;
    for (const r of rows) {
      if (r.dish_id || !r.date) continue; // فتح طبق لا مشاهدة منيو
      if (r.date >= d7) now += r.views ?? 0;
      else if (r.date >= d14) prev += r.views ?? 0;
    }
    const delta = prev > 0 ? Math.round(((now - prev) / prev) * 100) : null;
    return { now, prev, delta };
  }, [rows]);

  /** منذ متى لم يُضف طبق؟ منيو راكد يفقد سبب مسحه مرة ثانية. */
  const staleDays = useMemo(() => {
    if (!dishes?.length) return null;
    const newest = Math.max(...dishes.map((d) => +new Date(d.created_at ?? 0)));
    if (!Number.isFinite(newest) || newest <= 0) return null;
    return Math.floor((Date.now() - newest) / 86400_000);
  }, [dishes]);

  const steps = [
    { label: "أنشئ قائمة", done: (menus?.length ?? 0) > 0, to: "/dashboard/menus", cta: "القوائم" },
    { label: "أضف ٣ أطباق على الأقل", done: (dishes?.length ?? 0) >= 3, to: "/dashboard/dishes", cta: "الأطباق" },
    { label: "ارفع صورة لطبق واحد", done: (dishes ?? []).some((d) => !!d.image), to: "/dashboard/dishes", cta: "الأطباق" },
    { label: "اطبع كود QR للطاولات", done: (views30 ?? 0) > 0, to: "/dashboard/qr", cta: "كود QR" },
  ];
  const STEP_COUNT = steps.length;
  const doneCount = steps.filter((s) => s.done).length;
  // لا نُظهر الدليل قبل أن تُحسم البيانات — وإلا ظهر «لم تكمل شيئاً» أثناء التحميل.
  const settled = dishes !== null && menus !== null && views30 !== null;
  const allDone = !settled || doneCount === STEP_COUNT;

  /**
   * اكتمال المنيو — يخلف دليل الخطوات لا ينافسه.
   *
   * دليل الخطوات يسأل «هل بدأت؟»، وهذا يسأل «هل منيوك يستحق أن يُمسح؟». والفرق
   * ليس شكلياً: أنشط تاجر عندنا أكمل الخطوات الأربع كلها وعنده ١٢ طبقاً
   * و**صفر صورة**. فبعد اختفاء الدليل لم يبق ما يقول له أن شيئاً ناقص.
   *
   * البنود بنسبة لا ببوليان حيث يصحّ ذلك: «٣ من ١٢ طبقاً بصورة» ليست «تمّ».
   */
  const quality = useMemo(() => {
    if (!dishes || !settled) return null;
    const n = dishes.length;
    if (n === 0) return null;
    const withImage = dishes.filter((d) => d.image?.trim()).length;
    const withDesc = dishes.filter((d) => d.description?.trim()).length;
    const items = [
      {
        label: "شعار مطعمك",
        ratio: restaurant.logo_image?.trim() ? 1 : 0,
        hint: "أول ما يراه الزبون أعلى المنيو",
        to: "/dashboard/settings",
      },
      {
        label: "ساعات العمل",
        ratio: restaurant.working_hours?.trim() ? 1 : 0,
        hint: "يعرف الزبون «مفتوح الآن» بلا اتصال",
        to: "/dashboard/settings",
      },
      {
        label: `صور الأطباق (${withImage}/${n})`,
        ratio: withImage / n,
        hint: "الصورة أكثر ما يرفع الطلب",
        to: "/dashboard/dishes",
      },
      {
        label: `أوصاف الأطباق (${withDesc}/${n})`,
        ratio: withDesc / n,
        hint: "الوصف يُغني عن سؤال الموظف",
        to: "/dashboard/dishes",
      },
      {
        label: "رابط تقييم قوقل",
        ratio: restaurant.google_review_url?.trim() ? 1 : 0,
        hint: "أرخص قناة نمو لمطعمك",
        to: "/dashboard/settings",
      },
      {
        label: "موقعك على الخريطة",
        ratio: restaurant.social_maps?.trim() ? 1 : 0,
        hint: "يوصلك زبون جديد بضغطة",
        to: "/dashboard/settings",
      },
    ];
    const pct = Math.round((items.reduce((s, i) => s + i.ratio, 0) / items.length) * 100);
    return { pct, missing: items.filter((i) => i.ratio < 1) };
  }, [dishes, settled, restaurant]);

  const stats = [
    { label: "مشاهدات ٣٠ يوماً", value: views30, icon: "👁️" },
    { label: "الأطباق", value: dishes?.length ?? null, icon: "🍽️" },
    { label: "القوائم", value: menus?.length ?? null, icon: "📋" },
  ];

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
              {publicUrl ?? `${SITE_URL}/…`}
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


      {/* أهم ثلاث توصيات — التفاصيل كاملة في التحليلات. */}
      {insights.length > 0 && (
        <div className="mt-5">
          <Insights items={insights} limit={3} moreTo="/dashboard/analytics" />
        </div>
      )}

      {/* دليل الخطوات الأولى — يختفي تلقائياً عند إكمالها كلها.
          كان التاجر يهبط على ثلاثة أصفار بلا أي خطوة تالية واضحة. */}
      {!allDone && (
        <Card className="mt-5">
          <p className="font-display font-extrabold text-ink">🚀 أكمل تجهيز منيوك</p>
          <p className="mt-1 text-xs text-dim">
            {doneCount} من {STEP_COUNT} خطوات مكتملة
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/8">
            <div
              className="h-full rounded-full bg-gold transition-all"
              style={{ width: `${(doneCount / STEP_COUNT) * 100}%` }}
            />
          </div>
          <ul className="mt-4 flex flex-col gap-2">
            {steps.map((s) => (
              <li key={s.label} className="flex items-center gap-2.5 text-sm">
                <span
                  className={
                    s.done
                      ? "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-good/15 text-xs text-good"
                      : "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line text-xs text-faint"
                  }
                >
                  {s.done ? "✓" : ""}
                </span>
                <span className={s.done ? "text-faint line-through" : "text-ink"}>{s.label}</span>
                {!s.done && (
                  <Link to={s.to} className="ms-auto text-xs font-bold text-gold hover:underline">
                    {s.cta} ←
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* اكتمال المنيو — بعد الدليل لا معه: شريطا تقدّم متجاوران يُربكان. */}
      {allDone && quality && quality.missing.length > 0 && (
        <Card className="mt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-display font-extrabold text-ink">✨ اكتمال منيوك</p>
            <span className="font-display text-2xl font-black text-gold">
              {quality.pct}%
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/8">
            <div
              className="h-full rounded-full bg-gold transition-all"
              style={{ width: `${quality.pct}%` }}
            />
          </div>
          <ul className="mt-4 flex flex-col gap-2.5">
            {quality.missing.map((m) => (
              <li key={m.label} className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-sm">
                <span className="text-ink">{m.label}</span>
                <span className="text-xs text-faint">— {m.hint}</span>
                <Link to={m.to} className="ms-auto text-xs font-bold text-gold hover:underline">
                  أكمله ←
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* نبض الأسبوع — لا يظهر إلا بعد أول مشاهدة، فالتاجر الجديد يبقى مع
          دليل الخطوات بدل رقمٍ صفريّ محبِط. */}
      {week && week.now + week.prev > 0 && (
        <Card className="mt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-display font-extrabold text-ink">📈 هذا الأسبوع</p>
            <Link to="/dashboard/analytics" className="text-xs font-bold text-gold hover:underline">
              التفاصيل ←
            </Link>
          </div>
          <p className="mt-2 text-sm text-dim">
            منيوك شوهد <span className="font-display text-xl font-black text-ink">{week.now}</span>{" "}
            مرة
            {week.delta !== null && (
              <span className={week.delta >= 0 ? "font-bold text-good" : "font-bold text-bad"}>
                {" "}
                ({week.delta >= 0 ? "+" : ""}
                {week.delta}% عن الأسبوع الماضي)
              </span>
            )}
            {top[0] && (top[0].views ?? 0) > 0 && (
              <>
                {" · "}أكثر طبق فُتح: <span className="font-bold text-ink">{top[0].name}</span>
              </>
            )}
          </p>
        </Card>
      )}

      {/* منيو راكد — تذكير لطيف بفعل صغير يُبقيه حيّاً. */}
      {staleDays !== null && staleDays >= 21 && (
        <Card className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-dim">
            لم تضف طبقاً منذ <span className="font-bold text-ink">{staleDays} يوماً</span> — طبق
            جديد أو عرض اليوم يعطي زبونك سبباً ليمسح الكود مرة ثانية.
          </p>
          <Link
            to="/dashboard/dishes"
            className="rounded-xl border border-line-gold px-4 py-2 text-sm font-bold text-ink hover:bg-gold/10"
          >
            ＋ أضف طبقاً
          </Link>
        </Card>
      )}

      {/* أرقام */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/12 text-xl">
              {s.icon}
            </span>
            <div>
              <p className="text-xs text-dim">{s.label}</p>
              {s.value === null ? (
                <Skeleton className="mt-1 h-6 w-14" />
              ) : (
                <p className="font-display text-2xl font-black text-ink">{s.value}</p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* مدخل الطابع — أجمل ما في المنتج كان مدفوناً في صفحة «القوائم» التي لا
          يعود إليها صاحب القائمة الواحدة. المُنتقي يبقى مكانه؛ هذا مدخل إليه. */}
      <Link
        to="/dashboard/menus"
        className="mt-5 flex items-center gap-3 rounded-2xl border border-line bg-panel px-4 py-3 transition-colors hover:border-gold/40"
      >
        <span className="text-2xl">🎨</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-ink">صمّم منيوك</span>
          <span className="block text-xs text-dim">
            أربعة طوابع كاملة — زخرفة وترويسة وشكل عرض، بلونك أنت.
          </span>
        </span>
        <span className="text-sm font-bold text-gold">اختر ←</span>
      </Link>

      {/* أفضل الأطباق */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-extrabold text-ink">🔥 الأكثر مشاهدة</h2>
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
                <span className="text-2xl">{d.emoji ?? "🍽"}</span>
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

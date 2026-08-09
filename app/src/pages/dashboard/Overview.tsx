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
import { getMyAnalytics, getMyDishes } from "@/lib/data";
import { buildNextStep } from "@/lib/nextStep";
import { planLabel } from "@/lib/entitlements";
import { formatPrice } from "@/lib/utils";
import type { AnalyticsRow, Dish } from "@/lib/types";
import { useDashboard } from "./Dashboard";
import { DishGlyph } from "@/lib/icons";
import { Icon } from "@/lib/icons";
import { MENU_DOMAIN, menuUrl } from "@/lib/menuUrl";

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
              {publicUrl?.replace("https://", "") ?? `${MENU_DOMAIN}/…`}
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


      {/**
        * بطاقة واحدة تجيب «وش أسوي الحين؟».
        *
        * كانت أربع بطاقات تتنافس على السؤال نفسه (التوصيات · دليل الخطوات ·
        * اكتمال المنيو · المنيو الراكد)، واثنتان منها محجوبتان عن بعضهما
        * بتعليق يقول «شريطا تقدّم متجاوران يُربكان». السلّم كلّه صار في
        * `lib/nextStep.ts`، وهنا فعلٌ واحد وما بقي مطويّ.
        */}
      {next.action && (
        <Card className="mt-5 border-gold/30 bg-gold/[.04]">
          <p className="text-xs font-bold text-gold">خطوتك التالية</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-3">
            <span className="text-2xl" aria-hidden="true">
              <Icon name={next.action.icon} size={22} />
            </span>
            <p className="min-w-0 flex-1 text-sm leading-relaxed text-ink">
              {next.action.text}
            </p>
            {next.action.action && (
              <Link
                to={next.action.action.to}
                className="shrink-0 rounded-xl bg-gold px-4 py-2 text-sm font-bold text-on-gold hover:bg-gold2"
              >
                {next.action.action.label} ←
              </Link>
            )}
          </div>
          {next.rest.length > 0 && (
            <details className="mt-3 border-t border-gold/15 pt-3">
              <summary className="cursor-pointer text-xs font-bold text-dim hover:text-ink">
                و{next.rest.length} خطوة أخرى
              </summary>
              <ul className="mt-3 flex flex-col gap-2">
                {next.rest.map((i) => (
                  <li
                    key={i.id}
                    className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm"
                  >
                    <Icon name={i.icon} size={16} className="mt-0.5 shrink-0" />
                    <span className="min-w-0 flex-1 text-dim">{i.text}</span>
                    {i.action && (
                      <Link
                        to={i.action.to}
                        className="text-xs font-bold text-gold hover:underline"
                      >
                        {i.action.label} ←
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </Card>
      )}

      {/* نبض الأسبوع — لا يظهر إلا بعد أول مشاهدة، فالتاجر الجديد لا يواجه
          رقماً صفرياً محبِطاً. والأرقام الثلاثة صارت سطراً هنا بدل ثلاث بطاقات:
          «٣ قوائم» ليست خبراً يستحق بطاقة بحجم بطاقة المشاهدات. */}
      {week && week.now + week.prev > 0 && (
        <Card className="mt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="inline-flex items-center gap-2 font-display font-extrabold text-ink">
            <Icon name="pulse" size={17} className="text-gold" /> هذا الأسبوع
          </p>
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
          <p className="mt-2 border-t border-line pt-2 text-xs text-faint">
            👁️ {views30 ?? 0} مشاهدة في ٣٠ يوماً · 🍽️ {dishes?.length ?? 0} طبقاً ·
            📋 {menus?.length ?? 0} قائمة
          </p>
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

/** نظرة عامة: أرقام سريعة + أفضل الأطباق + رابط المنيو. */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Card, Skeleton, useToast } from "@/components/ui";
import { getMyAnalytics, getMyDishes } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import { SITE_URL } from "@/lib/config";
import type { Dish } from "@/lib/types";
import { useDashboard } from "./Dashboard";

export default function Overview() {
  const { user, restaurant, menus, ent } = useDashboard();
  const toast = useToast();
  const [dishes, setDishes] = useState<Dish[] | null>(null);
  const [views30, setViews30] = useState<number | null>(null);

  useEffect(() => {
    document.title = "لوحة التحكم — كلاود منيو";
    getMyDishes(restaurant.id).then(setDishes).catch(() => setDishes([]));
    getMyAnalytics(user.id)
      .then((rows) => setViews30(rows.reduce((s, r) => s + (r.views ?? 0), 0)))
      .catch(() => setViews30(0));
  }, [restaurant.id, user.id]);

  const menuUrl = `${window.location.origin}/${restaurant.slug}`;
  const publicUrl = restaurant.slug ? menuUrl : null;
  const top = [...(dishes ?? [])].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 5);

  const stats = [
    { label: "مشاهدات ٣٠ يوماً", value: views30, icon: "👁️" },
    { label: "الأطباق", value: dishes?.length ?? null, icon: "🍽️" },
    { label: "القوائم", value: menus.length, icon: "📋" },
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
        <Badge variant={ent.active ? "gold" : "neutral"}>
          {ent.active ? `باقة ${ent.planName}` : "بدون اشتراك فعّال"}
        </Badge>
      </div>

      {/* رابط المنيو */}
      <Card className="mt-6 flex flex-wrap items-center justify-between gap-3 border-gold/25 bg-gold/[.04]">
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink">رابط منيوك العام</p>
          <p className="truncate text-sm text-gold" dir="ltr">
            {publicUrl ?? `${SITE_URL}/…`}
          </p>
        </div>
        <div className="flex gap-2">
          {publicUrl && (
            <>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(publicUrl).then(
                    () => toast("نُسخ الرابط ✓"),
                    () => toast("تعذّر النسخ", "err")
                  );
                }}
                className="rounded-xl border border-line-gold px-4 py-2 text-sm font-bold text-ink hover:bg-gold/10"
              >
                📋 نسخ
              </button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-gold px-4 py-2 text-sm font-bold text-on-gold hover:bg-gold2"
              >
                فتح المنيو ↗
              </a>
            </>
          )}
        </div>
      </Card>

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

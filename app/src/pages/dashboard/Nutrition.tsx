/**
 * الامتثال الغذائي — شاشة سبب الاشتراك.
 *
 * سؤالٌ واحد يجيب عنه رأسها: **كم طبقاً من منيوي جاهزٌ لمفتّش الهيئة؟** ثم
 * القائمة كلها مرتّبة بما ينقصها، ولكل طبق زرّ «احسب من الوصفة».
 *
 * تعريف «مكتمل» هو عمود القاعدة نفسه (`sfda_compliant` = سعرات وصوديوم) عبر
 * `lib/nutrition.ts`. والمشروب الذي لا كافيين مُدخلاً له يُنبَّه عليه منفصلاً:
 * الكافيين إلزامي للمشروبات، وصفرٌ قيمةٌ صحيحة (عصير) بخلاف «لم يُكتب».
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, EmptyState, Modal, Skeleton, useToast } from "@/components/ui";
import { RecipeCalculator } from "@/components/RecipeCalculator";
import { useDashboard } from "./Dashboard";
import { getMyDishes, updateDishNutrition } from "@/lib/data";
import { isSfdaCompliant, burnMinutes } from "@/lib/nutrition";
import { displayAllergens } from "@/lib/allergens";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { Dish } from "@/lib/types";
import { isDrinkText, nutritionPatch, type NutritionResult } from "@/lib/recipe";

type Status = "done" | "caffeine" | "sodium" | "empty";

const drinkOf = (d: Pick<Dish, "category" | "name">) => isDrinkText(`${d.category ?? ""} ${d.name}`);

export function dishStatus(d: Pick<Dish, "calories" | "sodium_mg" | "caffeine_mg" | "category" | "name">): Status {
  if (d.calories === null) return "empty";
  if (!isSfdaCompliant(d.calories, d.sodium_mg)) return "sodium";
  if (drinkOf(d) && d.caffeine_mg === null) return "caffeine";
  return "done";
}

const STATUS: Record<Status, { label: string; variant: "green" | "gold" | "red" | "neutral"; order: number }> = {
  empty: { label: "بلا أرقام", variant: "red", order: 0 },
  sodium: { label: "ينقص الصوديوم", variant: "gold", order: 1 },
  caffeine: { label: "ينقص الكافيين", variant: "gold", order: 2 },
  done: { label: "مكتمل", variant: "green", order: 3 },
};

export default function Nutrition() {
  const { restaurant, readOnly } = useDashboard();
  const toast = useToast();
  /** `null` = يُحمَّل · `[]` = لا أطباق فعلاً (القاعدة «ج»). */
  const [dishes, setDishes] = useState<Dish[] | null>(null);
  const [editing, setEditing] = useState<Dish | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<Status | "all">("all");
  /**
   * فشل التحميل حالةٌ ثالثة لا `[]`: «لا أطباق بعد» لتاجرٍ له أربعون طبقاً
   * وانقطع اتصاله تقول له شيئاً كاذباً (القاعدة «ج»).
   */
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      setDishes(await getMyDishes(restaurant.id));
    } catch {
      setFailed(true);
    }
  }, [restaurant.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => {
    if (!dishes) return null;
    return dishes
      .map((d) => ({ d, s: dishStatus(d) }))
      .sort((a, b) => STATUS[a.s].order - STATUS[b.s].order || a.d.name.localeCompare(b.d.name, "ar"));
  }, [dishes]);

  const counts = useMemo(() => {
    const c: Record<Status, number> = { empty: 0, sodium: 0, caffeine: 0, done: 0 };
    for (const r of rows ?? []) c[r.s] += 1;
    return c;
  }, [rows]);

  const total = rows?.length ?? 0;
  const pct = total ? Math.round((counts.done / total) * 100) : 0;

  const apply = async (r: NutritionResult) => {
    if (!editing) return;
    setSaving(true);
    try {
      await updateDishNutrition(editing.id, nutritionPatch(r, editing, drinkOf(editing)));
      toast(`حُفظت أرقام «${editing.name}»`);
      setEditing(null);
      await load();
    } catch {
      toast("لم يُحفظ — تحقّق من الاتصال وحاول مجدداً", "err");
    } finally {
      setSaving(false);
    }
  };

  const shown = rows?.filter((r) => filter === "all" || r.s === filter) ?? null;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-ink">الامتثال الغذائي</h1>
          <p className="mt-1 text-sm text-dim">
            أرقام هيئة الغذاء لكل طبق: السعرات والصوديوم والكافيين ومسبّبات الحساسية — محسوبةٌ من الوصفة.
          </p>
        </div>
        {/* الورقة التي تُوضع أمام المفتّش — متاحةٌ ولو نقصت أرقام: «غير مُدخَل»
            فيها صادقة، وحجبُها حتى يكتمل كل طبق يحرم التاجر منها يوم التفتيش. */}
        {total > 0 && (
          <Link to="/dashboard/nutrition/file">
            <Button variant="outline">
              <Icon name="printer" size={16} /> ملفّ الامتثال (PDF)
            </Button>
          </Link>
        )}
      </div>

      {/* الرأس: نسبة الجاهزية — رقمٌ واحد كبير وشريطٌ مقسوم بحالاته. */}
      {rows === null ? (
        failed ? null : <Skeleton className="h-36" />
      ) : total > 0 ? (
        <Card className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-8">
          <div>
            <p className="font-display text-6xl font-bold leading-none text-ink tabular">
              {pct}
              <span className="text-3xl text-dim">٪</span>
            </p>
            <p className="mt-2 text-sm text-dim">
              {counts.done} من {total} طبقاً جاهز
            </p>
          </div>
          <div className="grid gap-3">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-panel2" role="img" aria-label={`${counts.done} مكتمل من ${total}`}>
              {(["done", "caffeine", "sodium", "empty"] as Status[]).map((s) =>
                counts[s] ? (
                  <span
                    key={s}
                    className={cn(
                      "bar-grow h-full border-s-2 border-panel first:border-s-0",
                      s === "done" ? "bg-good" : s === "empty" ? "bg-bad" : "bg-gold"
                    )}
                    style={{ width: `${(counts[s] / total) * 100}%` }}
                  />
                ) : null
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", "empty", "sodium", "caffeine", "done"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilter(s)}
                  className={cn(
                    "press rounded-full border px-3 py-1 text-xs font-semibold",
                    filter === s ? "border-ink bg-ink text-page" : "border-line text-dim hover:text-ink"
                  )}
                >
                  {s === "all" ? `الكل · ${total}` : `${STATUS[s].label} · ${counts[s]}`}
                </button>
              ))}
            </div>
          </div>
        </Card>
      ) : null}

      {failed ? (
        <EmptyState
          icon="warn"
          title="تعذّر تحميل الأطباق"
          desc="تحقّق من الاتصال ثم أعد المحاولة — لم يتغيّر شيء في أطباقك."
          action={<Button onClick={() => void load()}>أعد المحاولة</Button>}
        />
      ) : shown === null ? (
        <div className="grid gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : total === 0 ? (
        <EmptyState
          icon="plate"
          title="لا أطباق بعد"
          desc="أضف أطباقك أوّلاً — أو صوّر منيوك المطبوع — ثم احسب أرقام كل طبق هنا."
          action={
            <Link to="/dashboard/dishes">
              <Button>اذهب إلى الأطباق</Button>
            </Link>
          }
        />
      ) : (
        <ul className="stagger grid gap-2">
          {shown.map(({ d, s }, i) => {
            const allergens = displayAllergens(d.allergens, false);
            return (
              <li key={d.id} style={{ ["--i" as string]: Math.min(i, 8) }}>
                <Card className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-ink">{d.name}</p>
                      <Badge variant={STATUS[s].variant}>{STATUS[s].label}</Badge>
                    </div>
                    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-dim tabular">
                      <span>{d.calories !== null ? `${d.calories} سعرة` : "سعرات —"}</span>
                      <span>{d.sodium_mg !== null ? `${d.sodium_mg} ملغم صوديوم` : "صوديوم —"}</span>
                      {d.caffeine_mg !== null && <span>{d.caffeine_mg} ملغم كافيين</span>}
                      {d.calories !== null && <span>{burnMinutes(d.calories)} د مشي</span>}
                      {allergens.length > 0 && <span>{allergens.map((a) => a.emoji).join(" ")}</span>}
                    </p>
                  </div>
                  <Button
                    variant={s === "done" ? "outline" : "gold"}
                    size="sm"
                    disabled={readOnly}
                    onClick={() => setEditing(d)}
                  >
                    <Icon name="flame" size={14} />
                    {s === "done" ? "أعد الحساب" : "احسب من الوصفة"}
                  </Button>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Modal open={!!editing} onClose={() => !saving && setEditing(null)} title="حاسبة الوصفة" xl>
        {editing && (
          <RecipeCalculator
            key={editing.id}
            dishId={editing.id}
            dishName={editing.name}
            busy={saving}
            onApply={(r) => void apply(r)}
          />
        )}
      </Modal>
    </div>
  );
}

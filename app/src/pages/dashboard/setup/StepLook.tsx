/**
 * الخطوة ٢ — شكل منيوك: المُنتقي مرتّباً حسب نوع النشاط، **ولا يطبّق باللمس**.
 *
 * قرار ٢٥/١٠: «أيّ معاينة للطابع تحذف التطبيق الفوري». فاللمسة هنا **تختار
 * وتعاين** فقط، والكتابة بزرّ «طبّق» وحده — والفحص يعدّ طلبات الكتابة إلى
 * `menus` قبل الضغط فيجدها صفراً (الدرس ٤٨). والترتيب والشارة من
 * `useThemeOrder` نفسه الذي في «التصميم» و«القوائم» — لا جدول ثانٍ.
 */
import { useState } from "react";
import { Button, ErrorNote } from "@/components/ui";
import { ThemePreview } from "@/components/menu/ThemePreview";
import { SuggestBadge, SuitsLine, ThemeOrderNote, useThemeOrder } from "@/components/ThemeSuggest";
import { applyThemeToAllMenus } from "@/lib/data";
import { getTheme, splitThemeId, themeBaseOf, themeIdOf } from "@/lib/themes";
import { cn } from "@/lib/utils";
import { useDashboard } from "../Dashboard";
import { StepFooter } from "./parts";
import { ensureMenuId } from "./ensureMenu";

export function StepLook({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const { user, restaurant, menus, refreshMenus } = useDashboard();
  const themeOrder = useThemeOrder(restaurant.type);
  const activeThemeId = menus?.find((m) => m.theme)?.theme ?? null;
  // يُبقى لون العلامة وشكل العرض إن كانا مضبوطين: الطابع يتبدّل وحده.
  const parsed = splitThemeId(activeThemeId);
  const current = themeBaseOf(activeThemeId);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const chosen = selected ? getTheme(selected) : null;

  async function apply() {
    if (!selected) return;
    // اختار طابعه الحالي ⇒ لا كتابة: «أبقِ» لا تحتاج طلباً.
    if (selected === current) return onDone();
    setBusy(true);
    setError("");
    try {
      await ensureMenuId({ restaurantId: restaurant.id, userId: user.id, menus, refreshMenus });
      await applyThemeToAllMenus(restaurant.id, themeIdOf(selected, parsed.hex, parsed.layout));
      await refreshMenus();
      onDone();
    } catch {
      setError("تعذّر تطبيق الطابع — تحقّق من اتصالك واضغط «طبّق» مرّة أخرى.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <ThemeOrderNote
        typeLabel={themeOrder.typeLabel}
        isCafe={themeOrder.isCafe}
        flavor={themeOrder.flavor}
        setFlavor={themeOrder.setFlavor}
      />
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3" data-setup-themes>
        {themeOrder.ordered.map((t) => {
          const on = selected === t.id;
          const id = themeIdOf(t.id, parsed.hex, parsed.layout);
          return (
            <div key={t.id} className="flex min-w-0 flex-col">
              <button
                type="button"
                aria-pressed={on}
                onClick={() => setSelected(t.id)}
                className={cn(
                  "overflow-hidden rounded-2xl border-2 text-start transition-transform hover:scale-[1.02] motion-reduce:hover:scale-100",
                  on ? "border-gold" : "border-line"
                )}
              >
                <ThemePreview theme={getTheme(id)} />
                <div className={cn("px-2.5 py-2", on ? "bg-gold/10" : "bg-panel")}>
                  <SuggestBadge on={t.id === themeOrder.suggested} />
                  <p className={cn("text-xs font-bold", on ? "text-gold" : "text-ink")}>
                    {t.name} {on && "✓"}
                    {t.id === current && <span className="ms-1 text-[10px] font-normal text-faint">· الحالي</span>}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-faint">{t.tagline}</p>
                  <SuitsLine theme={t} />
                </div>
              </button>
              {/* المعاينة الكاملة بلا التزام — المنيو التجريبي بهذا الطابع. */}
              <a
                href={`/demo?theme=${encodeURIComponent(t.id)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 inline-flex min-h-9 items-center justify-center text-[11px] font-bold text-dim hover:text-gold"
              >
                عاينه كاملاً ↗
              </a>
            </div>
          );
        })}
      </div>

      {error && <div className="mt-3" role="alert"><ErrorNote>{error}</ErrorNote></div>}

      <StepFooter onSkip={onSkip} busy={busy} skipLabel="أبقِ الحالي">
        <Button onClick={apply} disabled={busy || !chosen} className="min-w-0">
          <span className="truncate">
            {busy
              ? "جارٍ التطبيق…"
              : !chosen
                ? "اختر طابعاً"
                : selected === current
                  ? `أبقِ «${chosen.name}»`
                  : `طبّق «${chosen.name}»`}
          </span>
        </Button>
      </StepFooter>
    </div>
  );
}

/**
 * الخطوة ٣ — شعارك ولونك (اختيارية).
 *
 * كلٌّ منهما يُحفظ **لحظة اختياره** لا بزرٍّ في القاع: الشعار حين يكتمل رفعه،
 * واللون بزرّ «طبّق» بجواره — فمن غادر بعد أحدهما لا يخسره. واللون يُصبغ به
 * **الطابع المختار** ولا يستبدله (`themeIdOf`)، والنصّ فوقه يختاره
 * `bestOnAccent` داخل `getTheme` (القاعدة ز) — فالمعاينة هي ما سيُرسم.
 */
import { useState } from "react";
import { Button, ErrorNote } from "@/components/ui";
import { ImageUploader } from "@/components/ImageUploader";
import { ThemePreview } from "@/components/menu/ThemePreview";
import {
  applyThemeToAllMenus,
  reportSilentFailure,
  updateBrandColor,
  updateRestaurantFields,
} from "@/lib/data";
import { getTheme, isHex, splitThemeId, themeBaseOf, themeIdOf } from "@/lib/themes";
import { cn } from "@/lib/utils";
import { useDashboard } from "../Dashboard";
import { StepFooter } from "./parts";
import { ensureMenuId } from "./ensureMenu";

/** ألوان شائعة في علامات المطاعم — نفس صفّ معاينة الهبوط، ثم المخصّص. */
const SWATCHES = ["#c8102e", "#ff5a1f", "#e0a526", "#1f7a72", "#2f6b3f", "#1d4ed8", "#111113"];

type Save = "idle" | "saving" | "saved" | "error";

export function StepBrand({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const { user, restaurant, setRestaurant, menus, refreshMenus } = useDashboard();
  const activeThemeId = menus?.find((m) => m.theme)?.theme ?? null;
  const parsed = splitThemeId(activeThemeId);
  const base = themeBaseOf(activeThemeId);

  const [logo, setLogo] = useState(restaurant.logo_image ?? "");
  const [logoSave, setLogoSave] = useState<Save>("idle");
  /** `null` = ألوان الطابع نفسه بلا صبغة. */
  const [hex, setHex] = useState<string | null>(parsed.hex);
  const [colorSave, setColorSave] = useState<Save>("idle");
  const [colorNote, setColorNote] = useState("");

  const applied = parsed.hex;
  const colorDirty = (hex ?? null) !== (applied ?? null);
  const savedSomething = logoSave === "saved" || colorSave === "saved";

  async function saveLogo(url: string) {
    setLogo(url);
    setLogoSave("saving");
    const value = url.trim() || null;
    try {
      await updateRestaurantFields(restaurant.id, { logo_image: value });
      setRestaurant({ ...restaurant, logo_image: value });
      setLogoSave("saved");
    } catch {
      setLogoSave("error");
    }
  }

  async function applyColor() {
    if (hex !== null && !isHex(hex)) return;
    setColorSave("saving");
    setColorNote("");
    try {
      await ensureMenuId({ restaurantId: restaurant.id, userId: user.id, menus, refreshMenus });
      await applyThemeToAllMenus(restaurant.id, themeIdOf(base, hex, parsed.layout));
      // نجاحٌ جزئي لا يُعرض كاملاً — نفس درس `pickTheme` في «التصميم»: اللون
      // في الطابع، و`cover_color` (تدرّج الترويسة) كتابةٌ ثانية قد تسقط وحدها.
      if (hex) {
        try {
          await updateBrandColor(restaurant.id, hex);
          setRestaurant({ ...restaurant, cover_color: hex });
        } catch (e) {
          reportSilentFailure("setup:updateBrandColor", e);
          setColorNote("طُبّق اللون على الطابع — وتعذّر حفظه للترويسة، اضغط «طبّق» مرّة أخرى.");
        }
      }
      await refreshMenus();
      setColorSave("saved");
    } catch {
      setColorSave("error");
    }
  }

  const previewId = themeIdOf(base, hex, parsed.layout);

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-[14px] border border-line bg-panel p-4">
        <ImageUploader
          label="شعار مطعمك"
          value={logo}
          onChange={(url) => void saveLogo(url)}
          bucket="restaurant-images"
          pathPrefix={`${restaurant.id}/logo`}
          shape="square"
        />
        <p className="mt-2 min-h-5 text-xs font-bold" aria-live="polite">
          {logoSave === "saving" && <span className="text-dim">نحفظ الشعار…</span>}
          {logoSave === "saved" && <span className="text-good">حُفظ الشعار ✓ — ظاهرٌ في منيوك الآن.</span>}
        </p>
        {logoSave === "error" && (
          <div role="alert" className="flex flex-col gap-2">
            <ErrorNote>رُفعت الصورة وتعذّر ربطها بمطعمك — تحقّق من اتصالك.</ErrorNote>
            <Button variant="outline" onClick={() => void saveLogo(logo)}>
              أعد حفظ الشعار
            </Button>
          </div>
        )}
      </section>

      <section className="rounded-[14px] border border-line bg-panel p-4">
        <p className="text-sm font-bold text-ink">لون علامتك</p>
        <p className="mt-1 text-xs text-dim">
          يُصبغ به طابع «{getTheme(base).name}» وتبقى زخرفته وخطّه.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2" role="radiogroup" aria-label="لون علامتك">
          <button
            type="button"
            role="radio"
            aria-checked={hex === null}
            onClick={() => setHex(null)}
            className={cn(
              "min-h-9 rounded-full border px-3 text-xs font-bold",
              hex === null ? "border-gold bg-gold/10 text-gold" : "border-line text-dim hover:text-ink"
            )}
          >
            ألوان الطابع
          </button>
          {SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={hex === c}
              aria-label={c}
              onClick={() => setHex(c)}
              className={cn(
                "h-9 w-9 rounded-full transition-transform hover:scale-105 motion-reduce:hover:scale-100",
                hex === c && "ring-2 ring-ink ring-offset-2 ring-offset-panel"
              )}
              style={{ background: c, boxShadow: "inset 0 0 0 1px rgba(0,0,0,.12)" }}
            />
          ))}
          <label
            className={cn(
              "relative h-9 w-9 cursor-pointer overflow-hidden rounded-full",
              hex && !SWATCHES.includes(hex) && "ring-2 ring-ink ring-offset-2 ring-offset-panel"
            )}
            style={{ background: "conic-gradient(#ef4444,#f59e0b,#22c55e,#06b6d4,#6366f1,#d946ef,#ef4444)" }}
            title="لون آخر"
          >
            <span className="sr-only">لون آخر</span>
            <input
              type="color"
              value={hex && isHex(hex) ? hex : "#d4a843"}
              onChange={(e) => setHex(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-line">
          <ThemePreview theme={getTheme(previewId)} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={() => void applyColor()}
            disabled={!colorDirty || colorSave === "saving"}
          >
            {colorSave === "saving" ? "جارٍ التطبيق…" : "طبّق اللون"}
          </Button>
          <span className="text-xs font-bold" aria-live="polite">
            {colorSave === "saved" && !colorDirty && <span className="text-good">طُبّق ✓</span>}
          </span>
        </div>
        {colorNote && <p className="mt-2 text-xs text-bad">{colorNote}</p>}
        {colorSave === "error" && (
          <div className="mt-2" role="alert">
            <ErrorNote>تعذّر تطبيق اللون — تحقّق من اتصالك واضغط «طبّق اللون» مرّة أخرى.</ErrorNote>
          </div>
        )}
      </section>

      <StepFooter onSkip={onSkip} skipLabel="تخطَّ">
        {/* «التالي» بلا شيءٍ محفوظ تخطٍّ صادق لا إنجاز — فالقمع لا يعدّه شعاراً. */}
        <Button onClick={savedSomething ? onDone : onSkip}>التالي: النشر ←</Button>
      </StepFooter>
    </div>
  );
}

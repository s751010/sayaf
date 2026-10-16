/**
 * مشهد البطل — الوعد كلّه في حركةٍ واحدة: **وصفة ← ملصق ← كل مكان**.
 *
 * ليس رسماً متحرّكاً لأرقام مكتوبة: السطور تُحلَّل والأرقام تُحسب بمحرّك
 * المنتج نفسه (`lib/recipe.ts`) في متصفّح الزائر. فما يراه في البطل هو بالضبط
 * ما سيحصل عليه في لوحته — والرقم الذي يظهر على «المنيو المطبوع» و«منيو
 * الطاولة» هو نفس رقم الملصق، لأنه نفس الحساب.
 *
 * الإيقاع: كل سطرٍ يُكتب فيقفز الملصق إلى رقمه الجديد، ثم تنبثق الوجهات
 * الثلاث وتلتقط الرقم، ثم وقفة، ثم يُعاد. ومن طلب تقليل الحركة يرى الحالة
 * الأخيرة ثابتة كاملة — بلا انتظار.
 *
 * ⚠️ `motion` مسموحة هنا وحدها (`bundle-isolation.test.ts`): هذا الملفّ في
 * `components/landing/`، وحزمة الهبوط منفصلة عن حزمة زائر المنيو.
 */
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { NutritionLabel } from "@/components/NutritionLabel";
import { ingredientById } from "@/lib/ingredients";
import { computeNutrition, parseRecipe } from "@/lib/recipe";
import { Icon } from "@/lib/icons";

/** لاتيه كراميل — صنفٌ يعرفه كل مقهى، وفيه كل ما يُلزَم به: سعرات وكافيين وحساسية. */
const RECIPE = ["شوتين إسبريسو", "حليب كامل الدسم 200 مل", "سيرب كراميل ملعقة كبيرة", "كريمة مخفوقة ملعقتين كبار"];
const DISH = "لاتيه كراميل";

const LINE_MS = 900;
const HOLD_MS = 4200;

const spring = { type: "spring", stiffness: 260, damping: 26 } as const;

export function ComplianceScene() {
  const calm = useReducedMotion() ?? false;
  const lines = useMemo(() => parseRecipe(RECIPE.join("\n")), []);
  const total = lines.length;
  /** كم سطراً كُتب — و`total + 1` = الوجهات ظاهرة. */
  const [step, setStep] = useState(calm ? total + 1 : 0);

  useEffect(() => {
    if (calm) {
      setStep(total + 1);
      return;
    }
    const delay = step <= total ? LINE_MS : HOLD_MS;
    const t = window.setTimeout(() => setStep((s) => (s > total ? 0 : s + 1)), step === 0 ? 500 : delay);
    return () => window.clearTimeout(t);
  }, [step, total, calm]);

  const shown = lines.slice(0, Math.min(step, total));
  const result = computeNutrition(shown);
  const done = step > total;

  return (
    <div className="relative mx-auto grid w-full max-w-[560px] gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* الوصفة — بطاقةٌ بيضاء كورقة المطبخ. */}
      <div className="min-w-0 rounded-[14px] border border-line bg-panel p-4 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)] sm:col-start-1 sm:row-start-1">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold text-dim">الوصفة</p>
          <p className="font-display text-base font-bold text-ink">{DISH}</p>
        </div>
        <ul className="grid gap-1.5" aria-label={`وصفة ${DISH}`}>
          {lines.map((line, i) => {
            const on = i < step;
            const ing = line.ingredientId ? ingredientById(line.ingredientId) : undefined;
            return (
              <motion.li
                key={line.raw}
                initial={false}
                animate={{ opacity: on ? 1 : 0.18, x: on ? 0 : 10 }}
                transition={spring}
                className="flex items-center justify-between gap-3 rounded-[8px] border border-line/70 bg-panel2/50 px-2.5 py-1.5 text-[13px]"
              >
                <span className="min-w-0 truncate text-ink">{line.raw}</span>
                <span className="tabular shrink-0 text-xs font-semibold text-dim">
                  {on && ing ? `${line.grams} غ` : "…"}
                </span>
              </motion.li>
            );
          })}
        </ul>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-dim">
          <motion.span
            className="inline-block h-2 w-2 rounded-full bg-good"
            animate={calm || done ? { scale: 1 } : { scale: [1, 1.6, 1] }}
            transition={{ duration: 0.9, repeat: calm || done ? 0 : Infinity }}
          />
          {done ? "حُسبت من قيم مرجعية" : "نحسب سطراً سطراً…"}
        </div>
      </div>

      {/* الملصق — يقفز رقمه مع كل سطر (`.num-flip` داخل المكوّن). */}
      <motion.div layout transition={spring} className="min-w-0 sm:col-start-2 sm:row-span-2 sm:row-start-1">
        <NutritionLabel values={result} className="shadow-[0_24px_60px_-34px_rgba(0,0,0,0.55)]" />
      </motion.div>

      {/* الوجهات الثلاث — نفس الرقم في كل مكان. */}
      <div className="grid min-w-0 content-start gap-2 sm:col-start-1 sm:row-start-2">
        <AnimatePresence>
          {done &&
            DESTINATIONS.map((d, i) => (
              <motion.div
                key={d.label}
                initial={{ opacity: 0, y: 14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                transition={{ ...spring, delay: calm ? 0 : i * 0.14 }}
                className="flex min-w-0 items-center gap-3 overflow-hidden rounded-[12px] border border-line bg-panel px-3 py-2.5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-ink text-page">
                  <Icon name={d.icon} size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-dim">{d.label}</span>
                  {/* بلا اسم الصنف: عرض البطاقة ~١٥٠px، والاسم كان يقصّ الكافيين — وهو في رأس الوصفة أصلاً. */}
                  <span className="tabular block truncate text-[13px] font-semibold text-ink">
                    {result.kcal} سعرة · {result.caffeine} ملغم كافيين
                  </span>
                </span>
                <Icon name="check" size={16} className="shrink-0 text-good" />
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

const DESTINATIONS = [
  { label: "منيو الطاولة (QR)", icon: "qr" },
  { label: "المنيو المطبوع A4", icon: "printer" },
  { label: "ملف تطبيقات التوصيل", icon: "share" },
] as const;

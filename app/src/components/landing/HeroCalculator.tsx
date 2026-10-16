/**
 * البطل التفاعلي — **جرّبها الآن، بلا تسجيل**.
 *
 * الصفحة الأولى لا تَصِف المنتج: تُشغّله. الزائر يكتب وصفة أي صنف فيرى الملصق
 * يتكوّن، والأرقام يحسبها محرّك المنتج نفسه (`lib/recipe.ts`) في متصفّحه — بلا
 * شبكة ولا حساب. فما يراه هنا هو بالضبط ما سيحصل عليه في لوحته.
 *
 * ═══ قبل أن يلمسها ═══
 *
 * تكتب الأمثلة الثلاثة بنفسها حرفاً حرفاً، ويقفز الملصق مع كل **سطرٍ مكتمل**
 * (لا مع كل حرف: «حليب 2» قبل «200» رقمٌ كاذب يومض). وأوّل لمسة — تركيز في
 * الحقل أو ضغط مثال — تُسلّمه الحاسبة كاملة ويتوقّف العرض نهائياً: عرضٌ يستأنف
 * نفسه بعد أن يتدخّل الزائر يُقرأ عصياناً لا حياة.
 *
 * ⚠️ **يتوقّف خارج الشاشة** (`IntersectionObserver`): كان مشهد البطل السابق
 * يدور مؤقّته والزائر في آخر الصفحة أو في تبويب آخر — هدرٌ بلا ناظر.
 * ومن طلب تقليل الحركة يرى المثال الأوّل كاملاً بلا كتابة.
 *
 * `motion` مسموحة هنا وحدها (`bundle-isolation.test.ts`): الملفّ كسول في
 * `components/landing/`، وحزمة الهبوط منفصلة عن حزمة زائر المنيو.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { NutritionLabel } from "@/components/NutritionLabel";
import { computeNutrition, parseRecipe } from "@/lib/recipe";
import { RECIPE_EXAMPLES } from "@/lib/recipeExamples";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";

const TYPE_MS = 34;
const LINE_MS = 420;
const HOLD_MS = 5200;

const exampleText = (i: number) => RECIPE_EXAMPLES[i]?.text ?? "";

export function HeroCalculator() {
  const calm = useReducedMotion() ?? false;
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState(() => (calm ? exampleText(0) : ""));
  /** `true` = العرض يكتب بنفسه · `false` = الحاسبة بيد الزائر، نهائياً. */
  const [auto, setAuto] = useState(!calm);
  const [onScreen, setOnScreen] = useState(true);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setOnScreen(!!e?.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!auto || !onScreen) return;
    const target = exampleText(idx);
    const t =
      text.length < target.length
        ? window.setTimeout(
            () => setText(target.slice(0, text.length + 1)),
            target[text.length] === "\n" ? LINE_MS : TYPE_MS
          )
        : window.setTimeout(() => {
            setIdx((i) => (i + 1) % RECIPE_EXAMPLES.length);
            setText("");
          }, HOLD_MS);
    return () => window.clearTimeout(t);
  }, [auto, onScreen, text, idx]);

  // أثناء الكتابة الآلية تُحسب الأسطر المكتملة وحدها؛ وبيد الزائر يُحسب كل ما كتب.
  const typing = auto && text.length < exampleText(idx).length;
  const settled = typing ? text.slice(0, Math.max(0, text.lastIndexOf("\n"))) : text;
  const lines = useMemo(() => parseRecipe(settled), [settled]);
  const result = useMemo(() => computeNutrition(lines), [lines]);

  const active = auto ? idx : RECIPE_EXAMPLES.findIndex((e) => e.text === text);

  /** أوّل لمسة: يُكمَل المثال الجاري فيبدأ الزائر من وصفة تامّة لا نصف سطر. */
  const takeOver = () => {
    if (!auto) return;
    setAuto(false);
    setText(exampleText(idx));
  };

  const choose = (i: number) => {
    setAuto(false);
    setIdx(i);
    setText(exampleText(i));
  };

  return (
    <div
      ref={root}
      className="mx-auto w-full max-w-4xl rounded-[20px] border border-line bg-panel p-2.5 text-right shadow-[0_30px_80px_-48px_rgba(0,0,0,0.55)] sm:p-3"
    >
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
        <div className="flex min-w-0 flex-col gap-3 rounded-[14px] border border-dashed border-line-gold bg-panel2/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="hero-recipe" className="flex items-center gap-2 text-sm font-bold text-ink">
              <Icon name="flame" size={16} className="text-gold" />
              اكتب وصفة أي صنف
            </label>
            <div role="group" aria-label="أمثلة جاهزة" className="flex flex-wrap gap-1">
              {RECIPE_EXAMPLES.map((e, i) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => choose(i)}
                  aria-pressed={active === i}
                  className={cn(
                    "press relative min-h-9 rounded-full px-3 text-xs font-semibold transition-colors",
                    active === i ? "text-page" : "text-dim hover:text-ink"
                  )}
                >
                  {active === i && (
                    <motion.span
                      layoutId="hero-example"
                      className="absolute inset-0 rounded-full bg-ink"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative">{e.name}</span>
                </button>
              ))}
            </div>
          </div>

          <textarea
            id="hero-recipe"
            dir="rtl"
            rows={5}
            value={text}
            onFocus={takeOver}
            onPointerDown={takeOver}
            onChange={(e) => {
              setAuto(false);
              setText(e.target.value);
            }}
            placeholder={"حليب 200 مل\nشوتين إسبريسو"}
            spellCheck={false}
            className="min-h-[10.5rem] w-full flex-1 resize-none rounded-[10px] border border-line bg-panel px-3.5 py-2.5 text-[15px] leading-8 text-ink placeholder:text-faint focus:border-ink/40 focus:outline-none"
          />

          <p className="flex min-h-5 items-start gap-1.5 text-xs leading-relaxed" aria-live="polite">
            {lines.length === 0 ? (
              <span className="text-dim">سطرٌ لكل مكوّن: الاسم والكمية — غ، مل، كوب، ملعقة، حبة، شوت.</span>
            ) : result.unresolved.length === 0 ? (
              <span className="flex items-center gap-1.5 font-semibold text-good">
                <Icon name="check" size={14} />
                {lines.length === 1 ? "فهمنا المكوّن" : `فهمنا ${lines.length} مكوّنات كلّها`}
              </span>
            ) : (
              <span className="text-bad">
                لم نفهم «{result.unresolved[0]}» — في لوحتك تختار مكوّنه من قائمة.
              </span>
            )}
          </p>
        </div>

        <NutritionLabel values={result} className="min-w-0 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.5)]" />
      </div>

      <p className="px-3 pb-1.5 pt-3 text-center text-xs leading-relaxed text-dim">
        الأرقام نفسها تُطبع على منيو الطاولة والورقة وملف تطبيقات التوصيل. محسوبة من قيم مرجعية
        عامّة (USDA)، وتراجعها قبل النشر.
      </p>
    </div>
  );
}

/**
 * حاسبة الوصفة — يكتب التاجر وصفته كما يتكلّم، فيرى الملصق يتكوّن أمامه.
 *
 * ثلاثة أعمدة في عرضٍ واحد: النصّ ← ما فهمناه منه سطراً سطراً ← الملصق.
 * والسطر الذي لم يُفهم لا يُخمَّن: يظهر أحمر ومعه قائمة يختار منها مكوّنه.
 *
 * ⚠️ لا تحفظ شيئاً بنفسها: `onApply` يقرّر — فورم الطبق يملأ حقوله، وشاشة
 * الامتثال تحفظ مباشرة. والوصفة نفسها تُحفظ على هذا الجهاز فقط (لا عمود لها
 * في القاعدة بعد)، فيجدها التاجر حين يعود ليعدّل.
 */
import { useMemo, useState } from "react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { NutritionLabel } from "@/components/NutritionLabel";
import { GROUP_LABEL, INGREDIENTS, ingredientById, type IngredientGroup } from "@/lib/ingredients";
import {
  computeNutrition,
  parseRecipe,
  unitToGrams,
  UNIT_LABEL,
  type NutritionResult,
  type RecipeLine,
} from "@/lib/recipe";
import { getItem, K, setItem } from "@/lib/storage";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";

const EXAMPLE = "شوتين إسبريسو\nحليب كامل الدسم 200 مل\nسيرب كراميل ملعقة كبيرة";

/** مفتاح الوصفة المحفوظة على الجهاز — بنمط `cm2_loyalty_<id>` القائم. */
const recipeKey = (dishId: string) => `${K.RECIPE}_${dishId}`;

const GROUPS = Object.keys(GROUP_LABEL) as IngredientGroup[];

export function RecipeCalculator({
  dishId,
  dishName,
  onApply,
  applyLabel = "طبّق على الطبق",
  busy = false,
}: {
  dishId?: string;
  dishName?: string;
  onApply: (result: NutritionResult) => void;
  applyLabel?: string;
  busy?: boolean;
}) {
  const [text, setText] = useState(() => (dishId ? getItem(recipeKey(dishId)) : null) ?? "");
  const [servings, setServings] = useState("1");
  /** اختيار التاجر لسطرٍ لم يُفهم: رقم السطر ← معرّف المكوّن. */
  const [picks, setPicks] = useState<Record<number, string>>({});

  const lines: RecipeLine[] = useMemo(() => {
    return parseRecipe(text).map((line, i) => {
      const picked = picks[i];
      if (!picked || line.ingredientId) return line;
      const ing = ingredientById(picked);
      const grams = ing ? unitToGrams(ing, line.qty, line.unit) : null;
      return { ...line, ingredientId: picked, grams: grams === null ? null : Math.round(grams * 10) / 10 };
    });
  }, [text, picks]);

  const n = Math.max(1, Math.round(Number(servings) || 1));
  const result = useMemo(() => computeNutrition(lines, n), [lines, n]);
  const usable = lines.length > 0 && result.unresolved.length < lines.length;

  const apply = () => {
    if (dishId) setItem(recipeKey(dishId), text);
    onApply(result);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div className="grid content-start gap-4">
        <Field
          label={dishName ? `وصفة «${dishName}»` : "الوصفة"}
          hint="سطرٌ لكل مكوّن: الاسم والكمية والوحدة — غ، مل، كوب، ملعقة، حبة، شوت."
        >
          <Textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setPicks({});
            }}
            placeholder={EXAMPLE}
            className="min-h-40 leading-8"
            dir="rtl"
          />
        </Field>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="عدد الحصص" className="w-32">
            <Input type="number" min="1" inputMode="numeric" dir="ltr" value={servings} onChange={(e) => setServings(e.target.value)} />
          </Field>
          {!text && (
            <Button variant="outline" size="sm" type="button" onClick={() => setText(EXAMPLE)}>
              جرّب مثالاً
            </Button>
          )}
        </div>

        {lines.length > 0 && (
          <div className="overflow-hidden rounded-[12px] border border-line">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] bg-panel2/70 px-3 py-2 text-xs font-semibold text-dim">
              <span>ما فهمناه</span>
              <span>الوزن</span>
            </div>
            <ul className="divide-y divide-line">
              {lines.map((line, i) => {
                const ing = line.ingredientId ? ingredientById(line.ingredientId) : undefined;
                const bad = !ing || line.grams === null;
                return (
                  <li key={`${i}-${line.raw}`} className={cn("grid gap-2 px-3 py-2.5 text-sm", bad && "bg-bad/5")}>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                      <span className="min-w-0">
                        <span className={cn("font-semibold", bad ? "text-bad" : "text-ink")}>
                          {ing ? ing.ar[0] : "لم نتعرّف على المكوّن"}
                        </span>
                        <span className="block truncate text-xs text-faint">{line.raw}</span>
                      </span>
                      <span className="tabular text-end text-sm font-semibold text-ink">
                        {line.grams !== null ? `${line.grams} غ` : "—"}
                        {ing?.estimate && (
                          <span className="ms-1.5 rounded-[4px] bg-gold/12 px-1 py-0.5 text-[10px] text-gold">تقديري</span>
                        )}
                      </span>
                    </div>
                    {!ing && (
                      <Select
                        aria-label={`اختر مكوّن «${line.raw}»`}
                        value={picks[i] ?? ""}
                        onChange={(e) => setPicks((p) => ({ ...p, [i]: e.target.value }))}
                        className="min-h-9 py-1.5 text-xs"
                      >
                        <option value="">اختر المكوّن…</option>
                        {GROUPS.map((g) => (
                          <optgroup key={g} label={GROUP_LABEL[g]}>
                            {INGREDIENTS.filter((x) => x.group === g).map((x) => (
                              <option key={x.id} value={x.id}>
                                {x.ar[0]}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </Select>
                    )}
                    {ing && line.grams === null && (
                      <p className="text-xs text-bad">
                        اكتب الكمية بالغرام أو المل — لا نعرف وزن «{UNIT_LABEL[line.unit]}» من هذا المكوّن.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <div className="grid content-start gap-3 lg:sticky lg:top-4">
        <NutritionLabel values={result} />
        {result.unresolved.length > 0 && (
          <p className="flex items-start gap-2 rounded-[10px] bg-bad/8 px-3 py-2 text-xs text-bad">
            <Icon name="warn" size={15} className="mt-0.5 shrink-0" />
            {result.unresolved.length} سطر خارج الحساب حتى تختار مكوّنه أو تكتب وزنه.
          </p>
        )}
        <p className="text-[11px] leading-relaxed text-dim">
          أرقامٌ محسوبة من قيم مرجعية عامّة (USDA FoodData Central)
          {result.hasEstimates ? "، وبعض المكوّنات تقديرية" : ""}. المسؤولية النظامية على المنشأة:
          راجعها مع أخصائي تغذية قبل الطباعة.
        </p>
        <Button type="button" onClick={apply} disabled={!usable || busy}>
          <Icon name="check" size={16} />
          {busy ? "جارٍ الحفظ…" : applyLabel}
        </Button>
        <p className="text-[11px] text-faint">
          يُحفظ للطبق: السعرات والصوديوم والكافيين والحساسية. الدهون والسكر تُعرض هنا وتُحفظ مع
          تحديث القاعدة القادم.
        </p>
      </div>
    </div>
  );
}

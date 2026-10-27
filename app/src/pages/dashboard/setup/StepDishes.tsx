/**
 * الخطوة ١ — أصنافك: ثلاثة مداخل وجدول مراجعةٍ واحد.
 *
 * الصورة (`MenuScan`) والقائمة الجاهزة (`starterMenus`) واليد كلّها تنتهي إلى
 * **جدول المراجعة نفسه** ثم `createDishes` نفسها — بلا مسار حفظ ثانٍ. ولا يصل
 * زبوناً صنفٌ لم يره التاجر: القراءة الآلية تُزحزح الأسعار بين صنفين في المنيو
 * ذي العمودين (انظر رأس `MenuScan`)، والقائمة الجاهزة أسعارها تقديرية.
 */
import { useEffect, useMemo, useState } from "react";
import { Button, ErrorNote, Field, Input, Select } from "@/components/ui";
import { MenuScan } from "@/components/MenuScan";
import { createDishes } from "@/lib/data";
import { rowToPayload } from "@/lib/import";
import { categoriesOf } from "@/lib/categories";
import { aliasType, STARTER_TYPES } from "@/lib/starterMenus";
import {
  blankRow,
  checkReview,
  chunk,
  draftKey,
  parseDraft,
  starterRows,
  toReviewRows,
  type ReviewRow,
  type SetupDraft,
} from "@/lib/setup";
import { getJSON, removeItem, setJSON } from "@/lib/storage";
import { track } from "@/lib/track";
import { cn, numOrNull } from "@/lib/utils";
import { Icon, type IconName } from "@/lib/icons";
import type { Dish } from "@/lib/types";
import { useDashboard } from "../Dashboard";
import { StepFooter } from "./parts";
import { ensureMenuId } from "./ensureMenu";

/** دفعة الإدراج — حدّ `createDishes` نفسه؛ وكل دفعة تُحذف من المسوّدة حين تُحفظ. */
const SAVE_CHUNK = 50;

const ENTRIES: { id: "scan" | "starter" | "manual"; icon: IconName; title: string; desc: string }[] = [
  { id: "scan", icon: "image", title: "صوّر منيوك", desc: "صورة للمنيو المطبوع — نقرأ الأصناف والأسعار." },
  { id: "starter", icon: "doc", title: "قائمة جاهزة لنوعك", desc: "أصنافٌ شائعة بأسعار مقترحة — شِل ما لا تبيعه." },
  { id: "manual", icon: "edit", title: "أضِف بيدك", desc: "اسم وسعر لكل صنف — يكفي ثلاثة لتبدأ." },
];

export function StepDishes({
  dishes,
  onSaved,
  onDone,
  onSkip,
}: {
  /** أصناف المطعم الآن — محسومة (الصفحة لا تعرض الخطوة قبل حسمها). */
  dishes: Dish[];
  onSaved: (created: Dish[]) => void;
  onDone: () => void;
  onSkip: () => void;
}) {
  const { user, restaurant, menus, refreshMenus } = useDashboard();
  const storeKey = draftKey(restaurant.id);
  const [draft, setDraft] = useState<SetupDraft | null>(() => parseDraft(getJSON(storeKey)));
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // كل تعديلٍ يُحفظ على الجهاز فوراً — والمسح عند الحفظ أو «ابدأ من جديد».
  useEffect(() => {
    if (draft) setJSON(storeKey, draft);
    else removeItem(storeKey);
  }, [draft, storeKey]);

  const knownCategories = useMemo(() => categoriesOf(dishes), [dishes]);
  const existing = useMemo(
    () => new Set(dishes.map((d) => d.name.trim().toLowerCase())),
    [dishes]
  );
  const check = draft ? checkReview(draft.rows) : null;

  function choose(id: (typeof ENTRIES)[number]["id"]) {
    setError("");
    if (id === "scan") return setScanning(true);
    if (id === "starter") {
      const template = aliasType(restaurant.type);
      return setDraft({ v: 1, source: "starter", template, rows: starterRows(template) });
    }
    setDraft({ v: 1, source: "manual", template: null, rows: [1, 2, 3].map(blankRow) });
  }

  function restart() {
    setDraft(null);
    setScanning(false);
    setError("");
  }

  // التعديل يمحو رسالة المنع: «بلا سعر» لا تبقى تحت صنفٍ كُتب سعره للتوّ.
  const edit = (i: number, patch: Partial<ReviewRow>) => {
    setError("");
    setDraft((d) => (d ? { ...d, rows: d.rows.map((r, x) => (x === i ? { ...r, ...patch } : r)) } : d));
  };

  async function save() {
    if (!draft || !check) return;
    if (check.error) return setError(check.error);
    setBusy(true);
    setError("");
    const created: Dish[] = [];
    try {
      const menuId = await ensureMenuId({
        restaurantId: restaurant.id,
        userId: user.id,
        menus,
        refreshMenus,
      });
      for (const batch of chunk(check.chosen, SAVE_CHUNK)) {
        const rows = await createDishes(batch.map(rowToPayload), {
          menu_id: menuId,
          restaurant_id: restaurant.id,
          user_id: user.id,
          sort_order: dishes.length + created.length,
        });
        created.push(...rows);
        // المحفوظ يخرج من المسوّدة **دفعةً دفعة**: إن سقطت الثانية فالضغط ثانيةً
        // لا يُكرّر الأولى في منيو التاجر.
        setDraft((d) => (d ? { ...d, rows: d.rows.filter((r) => !batch.includes(r)) } : d));
      }
      // نقطة التفعيل في القمع — مرّةً واحدة، حين يصير للمنيو أوّل صنف.
      if (dishes.length === 0 && created.length) track("first_dish_added");
      setDraft(null);
      setScanning(false);
      onSaved(created);
      onDone();
    } catch {
      if (created.length) onSaved(created);
      setError(
        created.length
          ? `حُفظ ${created.length} صنفاً وتعذّر الباقي — تحقّق من اتصالك واضغط «احفظ» مرّة أخرى.`
          : "تعذّر الحفظ — تحقّق من اتصالك واضغط «احفظ» مرّة أخرى. أصنافك ما زالت هنا."
      );
    } finally {
      setBusy(false);
    }
  }

  /* ── المراجعة ── */
  if (draft) {
    const n = check?.chosen.length ?? 0;
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-ink">
            راجع قبل الحفظ — <span className="tabular-nums">{n}</span> صنفاً
          </p>
          <button
            type="button"
            onClick={restart}
            disabled={busy}
            className="inline-flex min-h-11 items-center text-xs font-bold text-dim hover:text-ink"
          >
            ↺ ابدأ من جديد
          </button>
        </div>

        {draft.source === "starter" && (
          <div className="mt-3 flex flex-col gap-3">
            <Field label="القالب">
              <Select
                value={draft.template ?? aliasType(restaurant.type)}
                onChange={(e) =>
                  setDraft({ v: 1, source: "starter", template: e.target.value, rows: starterRows(e.target.value) })
                }
              >
                {STARTER_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </Field>
            <Note>الأسعار مقترحة تقريبية — اكتب أسعارك قبل الحفظ، وشِل ما لا تبيعه.</Note>
          </div>
        )}
        {draft.source === "scan" && (
          <Note className="mt-3">
            <b>راجع الأسعار.</b> القراءة الآلية قد تُزحزح سعراً بين صنفين — والرقم يبدو سليماً وهو لغيره.
          </Note>
        )}

        <ul className="mt-3 flex flex-col gap-2">
          {draft.rows.map((r, i) => {
            const duplicate = !!r.name.trim() && existing.has(r.name.trim().toLowerCase());
            const unpriced = r.include && !!r.name.trim() && r.price === null;
            return (
              <li
                key={i}
                className={cn(
                  "rounded-xl border bg-panel p-2.5",
                  r.include ? "border-line" : "border-line/60 opacity-60"
                )}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={r.include}
                    onChange={(e) => edit(i, { include: e.target.checked })}
                    aria-label={`أضِف ${r.name || `الصنف ${i + 1}`}`}
                    className="h-5 w-5 shrink-0 accent-[var(--c-gold)]"
                  />
                  <Input
                    value={r.name}
                    onChange={(e) => edit(i, { name: e.target.value })}
                    placeholder="اسم الصنف"
                    aria-label={`اسم الصنف ${i + 1}`}
                  />
                </div>
                <div className="mt-2 flex gap-2 ps-7">
                  <div className="w-24 shrink-0">
                    <Input
                      value={r.price === null ? "" : String(r.price)}
                      onChange={(e) => edit(i, { price: numOrNull(e.target.value) })}
                      inputMode="decimal"
                      placeholder="السعر"
                      aria-label={`سعر الصنف ${i + 1}`}
                      aria-invalid={unpriced}
                      className={unpriced ? "border-bad" : undefined}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Input
                      value={r.category ?? ""}
                      onChange={(e) => edit(i, { category: e.target.value || null })}
                      list="cm-setup-categories"
                      placeholder="التصنيف"
                      aria-label={`تصنيف الصنف ${i + 1}`}
                    />
                  </div>
                </div>
                {duplicate && (
                  <p className="mt-1.5 ps-7 text-xs text-gold">في منيوك صنفٌ بهذا الاسم.</p>
                )}
              </li>
            );
          })}
        </ul>
        <datalist id="cm-setup-categories">
          {knownCategories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>

        <Button
          variant="outline"
          className="mt-3 w-full"
          disabled={busy}
          onClick={() =>
            setDraft((d) => (d ? { ...d, rows: [...d.rows, blankRow(d.rows.length + 1)] } : d))
          }
        >
          ＋ أضِف صنفاً
        </Button>

        {error && <div className="mt-3" role="alert"><ErrorNote>{error}</ErrorNote></div>}

        <StepFooter onSkip={onSkip} busy={busy} skipLabel="لاحقاً">
          <Button onClick={save} disabled={busy || n === 0}>
            {busy ? "جارٍ الحفظ…" : `احفظ ${n} صنفاً`}
          </Button>
        </StepFooter>
      </div>
    );
  }

  /* ── القراءة من صورة ── */
  if (scanning) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setScanning(false)}
          className="mb-2 inline-flex min-h-11 items-center text-sm font-bold text-dim hover:text-ink"
        >
          → كل الخيارات
        </button>
        <MenuScan
          restaurantId={restaurant.id}
          knownCategories={knownCategories}
          onRows={(rows) => setDraft({ v: 1, source: "scan", template: null, rows: toReviewRows(rows) })}
        />
        <StepFooter onSkip={onSkip} skipLabel="لاحقاً" />
      </div>
    );
  }

  /* ── الاختيار ── */
  return (
    <div>
      {dishes.length > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-good/30 bg-good/10 px-4 py-3">
          <Icon name="check" size={18} className="shrink-0 text-good" />
          <p className="text-sm font-bold text-ink">
            في منيوك <span className="tabular-nums">{dishes.length}</span> صنفاً — تقدر تضيف المزيد أو تكمل.
          </p>
        </div>
      )}
      <div className="grid gap-2.5 sm:grid-cols-3">
        {ENTRIES.map((e, i) => (
          <button
            key={e.id}
            type="button"
            onClick={() => choose(e.id)}
            className={cn(
              "press flex items-start gap-3 rounded-[14px] border bg-panel p-4 text-start transition-colors hover:border-ink/35 sm:flex-col",
              i === 0 ? "border-line-gold" : "border-line"
            )}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/12 text-gold">
              <Icon name={e.icon} size={20} />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-base font-black text-ink">{e.title}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-dim">{e.desc}</span>
              {i === 0 && (
                <span className="mt-1.5 inline-flex rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-bold text-gold">
                  الأسرع
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      <StepFooter onSkip={onSkip} skipLabel="لاحقاً">
        {dishes.length > 0 && <Button onClick={onDone}>التالي: الطابع ←</Button>}
      </StepFooter>
    </div>
  );
}

function Note({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-xl border border-gold/30 bg-gold/[.06] px-3.5 py-2.5 text-xs leading-relaxed text-ink",
        className
      )}
    >
      <Icon name="warn" size={16} className="mt-px shrink-0 text-gold" />
      <span>{children}</span>
    </p>
  );
}

/**
 * «منيوك جاهز في ٥ دقائق» — يملأ قائمة بداية حسب نوع المطعم.
 *
 * التاجر يهبط على شاشة فاضية فيؤجّل «لبكرة» ولا يعود. هنا يرى منيواً مبدئياً
 * يشبه مطعمه، يشيل ما لا يبيعه، ويحفظ. الأسعار مقترحة والواجهة تقولها صراحةً
 * كي لا ينشر أسعاراً ليست أسعاره.
 */
import { useMemo, useState } from "react";
import { Button, ErrorNote, Field, Modal, Select } from "@/components/ui";
import { aliasType, starterFor, STARTER_TYPES, type StarterDish } from "@/lib/starterMenus";
import { formatPrice } from "@/lib/utils";
import type { Menu } from "@/lib/types";

export function StarterMenu({
  open,
  onClose,
  type,
  menus,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  /** نوع المطعم من الإعدادات — يحدّد القالب. */
  type: string | null;
  menus: Menu[] | null;
  onApply: (dishes: StarterDish[], menuId: string) => Promise<void>;
}) {
  /**
   * القالب **يُختار** ولا يُفرَض.
   *
   * كان يُشتقّ من `type` وحده، وهو عمود نصّ حرّ يحمل في الإنتاج قيماً لا تطابق
   * أي قالب (`general` لأربعة عشر مطعماً). فالتخمين يبدأ من `aliasType` والتاجر
   * يبدّله بضغطة — خطأ التخمين يكلّف نقرة، وغيابُ القالب كان يكلّف المنيو كلّه.
   */
  const [template, setTemplate] = useState(() => aliasType(type));
  const all = useMemo(() => starterFor(template), [template]);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [menuId, setMenuId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const chosen = all.filter((d) => !skipped.has(d.name));
  const effectiveMenu = menuId || menus?.[0]?.id || "";

  const groups = useMemo(() => {
    const byCat = new Map<string, StarterDish[]>();
    for (const d of all) byCat.set(d.category, [...(byCat.get(d.category) ?? []), d]);
    return [...byCat.entries()];
  }, [all]);

  function toggle(name: string) {
    setSkipped((s) => {
      const next = new Set(s);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function apply() {
    if (!effectiveMenu) return setError("أنشئ قائمة أولاً.");
    if (!chosen.length) return setError("لم تختر أي صنف.");
    setBusy(true);
    setError("");
    try {
      await onApply(chosen, effectiveMenu);
      onClose();
    } catch {
      setError("تعذّر الحفظ. حاول مجدداً.");
    } finally {
      setBusy(false);
    }
  }

  if (!all.length) return null;

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title="ابدأ بقائمة جاهزة" wide>
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed text-dim">
          اختر القالب الأقرب لمطعمك، شِل ما لا تبيعه، ثم احفظ — وعدّل الأسعار
          والصور على راحتك بعدها.
        </p>
        <p className="rounded-xl border border-gold/30 bg-gold/[.06] px-4 py-2.5 text-xs font-bold text-ink">
          ⚠️ الأسعار مقترحة تقريبية — راجعها قبل نشر منيوك.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="القالب">
            <Select
              value={template}
              onChange={(e) => {
                setTemplate(e.target.value);
                setSkipped(new Set()); // قالب جديد ⇒ استثناءات القالب السابق لا معنى لها
              }}
            >
              {STARTER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          {menus && menus.length > 1 && (
            <Field label="القائمة">
              <Select value={effectiveMenu} onChange={(e) => setMenuId(e.target.value)}>
                {menus.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </div>

        <div className="max-h-[46dvh] overflow-y-auto rounded-2xl border border-line p-3">
          {groups.map(([cat, items]) => (
            <div key={cat} className="mb-3 last:mb-0">
              <p className="mb-1.5 text-xs font-extrabold text-dim">{cat}</p>
              <div className="flex flex-col gap-1">
                {items.map((d) => {
                  const on = !skipped.has(d.name);
                  return (
                    <label
                      key={d.name}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-ink/5"
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(d.name)}
                        className="h-4 w-4 accent-[var(--c-gold)]"
                      />
                      <span className="text-lg">{d.emoji}</span>
                      <span className={on ? "flex-1 text-sm text-ink" : "flex-1 text-sm text-faint line-through"}>
                        {d.name}
                      </span>
                      <span className="text-sm font-bold text-gold">
                        {formatPrice(d.price)} ر.س
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {error && <ErrorNote>{error}</ErrorNote>}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-dim">
            سيُضاف <span className="font-black text-ink">{chosen.length}</span> صنفاً
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={busy}>
              ابدأ بمنيو فارغ
            </Button>
            <Button onClick={apply} disabled={busy || !chosen.length}>
              {busy ? "جارٍ الإضافة…" : `أضِف ${chosen.length} صنفاً`}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/**
 * استيراد أصناف دفعة واحدة: لصق نصّ أو ملف CSV، ثم مراجعة قبل الحفظ.
 *
 * لا يُحفظ شيء قبل أن يرى التاجر جدول المراجعة ويعدّله — الاستيراد الأعمى
 * الذي ينتج ٦٠ صنفاً خاطئاً أسوأ من الإدخال اليدوي.
 */
import { useMemo, useState } from "react";
import {
  Button,
  ErrorNote,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
} from "@/components/ui";
import { normalizeCategory, parseMenuCsv, parseMenuText, type ParsedRow } from "@/lib/import";
import { numOrNull } from "@/lib/utils";
import type { Menu } from "@/lib/types";

const SAMPLE = `مقبلات
حمص بالطحينة 18
سلطة فتوش 22

المشاوي
كبسة دجاج 45 ر.س
مشاوي مشكّلة | 89 | المشاوي | يكفي شخصين`;

type Draft = ParsedRow & { include: boolean };

export function DishImport({
  open,
  onClose,
  menus,
  knownCategories,
  existingNames,
  remaining,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  /** `null` = القوائم ما زالت تُحمَّل. */
  menus: Menu[] | null;
  knownCategories: string[];
  /** أسماء الأطباق الحالية — للتحذير من التكرار (لا لمنعه). */
  existingNames: string[];
  /** المتبقّي من حدّ الباقة، أو `null` = بلا حد. */
  remaining: number | null;
  onImport: (rows: ParsedRow[], menuId: string) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [menuId, setMenuId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const existing = useMemo(
    () => new Set(existingNames.map((n) => n.trim().toLowerCase())),
    [existingNames]
  );

  function reset() {
    setText("");
    setDrafts(null);
    setError("");
  }

  function close() {
    if (busy) return;
    reset();
    onClose();
  }

  function review(rows: ParsedRow[]) {
    if (!rows.length) {
      return setError("لم نتعرّف على أي صنف. تأكد أن كل سطر فيه اسم وسعر.");
    }
    setError("");
    setDrafts(rows.map((r) => ({ ...r, include: true })));
    setMenuId((id) => id || menus?.[0]?.id || "");
  }

  function readText() {
    review(parseMenuText(text, knownCategories));
  }

  async function readFile(file: File) {
    try {
      review(parseMenuCsv(await file.text(), knownCategories));
    } catch {
      setError("تعذّرت قراءة الملف. صدّره بصيغة CSV وحاول مجدداً.");
    }
  }

  const edit = (i: number, patch: Partial<Draft>) =>
    setDrafts((ds) => ds?.map((d, x) => (x === i ? { ...d, ...patch } : d)) ?? null);

  const chosen = (drafts ?? []).filter((d) => d.include);
  const missingPrice = chosen.filter((d) => d.price === null).length;
  const overLimit = remaining !== null && chosen.length > remaining;

  async function save() {
    if (!menuId) return setError("اختر القائمة التي ستُضاف إليها الأصناف.");
    if (!chosen.length) return setError("لم تختر أي صنف.");
    if (missingPrice) return setError(`${missingPrice} صنفاً بلا سعر — اكتب سعره أو استبعده.`);
    if (overLimit) return setError(`باقتك تتّسع لـ${remaining} صنفاً إضافياً فقط.`);
    setBusy(true);
    setError("");
    try {
      await onImport(chosen, menuId);
      reset();
      onClose();
    } catch {
      setError("تعذّر الحفظ. تحقّق من اتصالك وحاول مجدداً.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={close} title="استيراد أصناف" wide>
      {drafts === null ? (
        <div className="flex flex-col gap-4">
          <Field
            label="الصق قائمتك"
            hint="سطر لكل صنف. السطر بلا سعر يصبح عنوان تصنيف لما بعده. تنسخ من Excel؟ الصق مباشرة."
          >
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={9}
              placeholder={SAMPLE}
            />
          </Field>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={readText} disabled={!text.trim()}>
              تعرّف على الأصناف ←
            </Button>
            <span className="text-xs text-faint">أو</span>
            <label className="cursor-pointer rounded-xl border border-line-gold px-4 py-2.5 text-sm font-bold text-ink hover:bg-gold/10">
              📄 ارفع ملف CSV
              <input
                type="file"
                accept=".csv,text/csv,text/plain"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  // تصفير القيمة يسمح بإعادة اختيار نفس الملف بعد تعديله.
                  e.target.value = "";
                  if (f) readFile(f);
                }}
              />
            </label>
          </div>

          <p className="text-xs leading-relaxed text-faint">
            ملفات Excel: صدّرها بصيغة CSV، أو انسخ الخلايا والصقها في الصندوق أعلاه.
          </p>
          {error && <ErrorNote>{error}</ErrorNote>}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold text-ink">
              تعرّفنا على {drafts.length} صنفاً — راجعها قبل الحفظ.
            </p>
            <button
              onClick={reset}
              className="text-xs font-bold text-gold hover:underline"
            >
              ↺ ابدأ من جديد
            </button>
          </div>

          <Field label="أضِفها إلى القائمة">
            <Select value={menuId} onChange={(e) => setMenuId(e.target.value)}>
              {menus === null && <option value="">…</option>}
              {(menus ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>

          <div className="max-h-[46dvh] overflow-y-auto rounded-2xl border border-line">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-panel2 text-xs text-dim">
                <tr>
                  <th className="p-2 font-bold"> </th>
                  <th className="p-2 text-start font-bold">الاسم</th>
                  <th className="p-2 text-start font-bold">السعر</th>
                  <th className="p-2 text-start font-bold">التصنيف</th>
                </tr>
              </thead>
              <tbody>
                {drafts.map((d, i) => {
                  const duplicate = existing.has(d.name.trim().toLowerCase());
                  return (
                    <tr key={i} className="border-t border-line align-top">
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={d.include}
                          onChange={(e) => edit(i, { include: e.target.checked })}
                          aria-label={`أضِف ${d.name}`}
                          className="h-4 w-4 accent-[var(--c-gold)]"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={d.name}
                          onChange={(e) => edit(i, { name: e.target.value })}
                        />
                        {duplicate && (
                          <p className="mt-1 text-xs text-gold">⚠️ لديك صنف بهذا الاسم</p>
                        )}
                      </td>
                      <td className="p-2 w-24">
                        <Input
                          value={d.price === null ? "" : String(d.price)}
                          onChange={(e) => edit(i, { price: numOrNull(e.target.value) })}
                          inputMode="decimal"
                          placeholder="—"
                          className={d.price === null && d.include ? "border-bad" : undefined}
                        />
                      </td>
                      <td className="p-2 w-40">
                        <Input
                          value={d.category ?? ""}
                          onChange={(e) => edit(i, { category: e.target.value || null })}
                          onBlur={(e) =>
                            edit(i, {
                              category:
                                normalizeCategory(e.target.value, knownCategories) || null,
                            })
                          }
                          list="cm-known-categories"
                          placeholder="بدون تصنيف"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <datalist id="cm-known-categories">
              {knownCategories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          {error && <ErrorNote>{error}</ErrorNote>}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-dim">
              سيُضاف <span className="font-black text-ink">{chosen.length}</span> صنفاً
              {missingPrice > 0 && (
                <span className="text-bad"> · {missingPrice} بلا سعر</span>
              )}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={close} disabled={busy}>
                إلغاء
              </Button>
              <Button onClick={save} disabled={busy || !chosen.length}>
                {busy ? "جارٍ الحفظ…" : `احفظ ${chosen.length} صنفاً`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

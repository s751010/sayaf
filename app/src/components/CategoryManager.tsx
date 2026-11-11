/**
 * إدارة التصنيفات: الترتيب الذي يراه الزبون، وإعادة التسمية والدمج.
 *
 * التصنيف حقل نصّي حر، فينتج «مشاوي» و«المشاوي» تصنيفين. الدمج هنا هو علاج ما
 * تراكم، و`<Select>` في فورم الطبق هو منع ما سيأتي.
 */
import { useState } from "react";
import { Button, ErrorNote, Input, Modal } from "@/components/ui";
import { ReorderList } from "@/components/Reorder";
import { matchKnownCategory, moveItem } from "@/lib/categories";
import { Icon } from "@/lib/icons";

export function CategoryManager({
  open,
  onClose,
  categories,
  countOf,
  onSaveOrder,
  onRename,
}: {
  open: boolean;
  onClose: () => void;
  /** التصنيفات بترتيبها الحالي. */
  categories: string[];
  countOf: (name: string) => number;
  onSaveOrder: (order: string[]) => Promise<void>;
  /** إعادة تسمية؛ الاسم الموجود مسبقاً يعني دمجاً. */
  onRename: (from: string, to: string) => Promise<void>;
}) {
  const [order, setOrder] = useState(categories);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // إعادة المزامنة عند كل فتح — التصنيفات تتغيّر من صفحة الأطباق.
  const [seed, setSeed] = useState(categories);
  if (seed !== categories) {
    setSeed(categories);
    setOrder(categories);
  }

  const dirty = order.join(" ") !== categories.join(" ");

  async function saveOrder() {
    setBusy(true);
    setError("");
    try {
      await onSaveOrder(order);
      onClose();
    } catch {
      setError("تعذّر حفظ الترتيب.");
    } finally {
      setBusy(false);
    }
  }

  async function commitRename() {
    if (!editing) return;
    const to = draft.trim();
    if (!to) return setError("اكتب اسماً للتصنيف.");
    if (to === editing) return setEditing(null);
    const merge = matchKnownCategory(to, order.filter((c) => c !== editing));
    if (
      merge &&
      !window.confirm(
        `«${editing}» و«${merge}» سيصيران تصنيفاً واحداً باسم «${merge}». متابعة؟`
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onRename(editing, merge ?? to);
      setEditing(null);
      setDraft("");
    } catch {
      setError("تعذّرت إعادة التسمية.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="التصنيفات وترتيبها">
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed text-dim">
          هذا هو ترتيب الأقسام كما يراه الزبون في منيوك. اسحب أو استخدم ▲▼.
        </p>

        {order.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-faint">
            لا توجد تصنيفات بعد — أضف تصنيفاً لأي طبق وسيظهر هنا.
          </p>
        ) : (
          <ReorderList
            items={order}
            keyOf={(c) => c}
            onReorder={(from, to) => setOrder((o) => moveItem(o, from, to))}
            render={(c) =>
              editing === c ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void commitRename();
                      if (e.key === "Escape") setEditing(null);
                    }}
                  />
                  <Button onClick={() => void commitRename()} disabled={busy} className="px-3 py-1.5">
                    ✓
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setEditing(null)}
                    className="px-2 py-1.5"
                  >
                    <Icon name="close" size={14} />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-bold text-ink">
                    {c}{" "}
                    <span className="font-normal text-faint">· {countOf(c)} صنفاً</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(c);
                      setDraft(c);
                      setError("");
                    }}
                    className="shrink-0 text-xs font-bold text-gold hover:underline"
                  >
                    إعادة تسمية
                  </button>
                </div>
              )
            }
          />
        )}

        <p className="inline-flex items-center gap-2 text-xs leading-relaxed text-faint">
          <Icon name="sparkle" size={17} className="shrink-0 text-gold" />{" "}
          لدمج تصنيفين مكرّرين («مشاوي» و«المشاوي») أعِد تسمية أحدهما باسم الآخر.
        </p>

        {error && <ErrorNote>{error}</ErrorNote>}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            إغلاق
          </Button>
          <Button busy={busy} onClick={saveOrder} disabled={busy || !dirty}>
            احفظ الترتيب
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * إعادة الترتيب بالسحب — بلا أي مكتبة خارجية (HTML5 drag & drop الأصلية).
 *
 * السحب وحده لا يكفي: لا يعمل باللمس على أغلب متصفحات الجوال ولا بلوحة
 * المفاتيح، والتاجر يدير منيوه من جواله. لذلك أزرار ▲▼ ليست زينة بل المسار
 * الأساسي على الجوال، والسحب تسريع على سطح المكتب.
 */
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ReorderList<T>({
  items,
  keyOf,
  onReorder,
  render,
  className,
}: {
  items: T[];
  keyOf: (item: T) => string;
  onReorder: (from: number, to: number) => void;
  render: (item: T, index: number) => ReactNode;
  className?: string;
}) {
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    onReorder(from, to);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {items.map((item, i) => (
        <div
          key={keyOf(item)}
          draggable
          onDragStart={() => setDragging(i)}
          onDragEnd={() => {
            setDragging(null);
            setOver(null);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(i);
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (dragging !== null) move(dragging, i);
            setDragging(null);
            setOver(null);
          }}
          className={cn(
            "flex items-center gap-2 rounded-xl border border-line bg-panel px-2 py-1.5 transition-colors",
            dragging === i && "opacity-40",
            over === i && dragging !== null && dragging !== i && "border-gold bg-gold/[.06]"
          )}
        >
          <span
            aria-hidden="true"
            className="cursor-grab select-none px-1 text-faint active:cursor-grabbing"
            title="اسحب لإعادة الترتيب"
          >
            ⠿
          </span>
          <div className="min-w-0 flex-1">{render(item, i)}</div>
          {/* المسار الذي يعمل على الجوال وبلوحة المفاتيح. */}
          <div className="flex shrink-0 flex-col">
            <button
              type="button"
              onClick={() => move(i, i - 1)}
              disabled={i === 0}
              aria-label="حرّك لأعلى"
              className="rounded px-1.5 text-xs text-dim hover:bg-ink/6 hover:text-ink disabled:opacity-30"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => move(i, i + 1)}
              disabled={i === items.length - 1}
              aria-label="حرّك لأسفل"
              className="rounded px-1.5 text-xs text-dim hover:bg-ink/6 hover:text-ink disabled:opacity-30"
            >
              ▼
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

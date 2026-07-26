/**
 * محرّر خيارات الطبق — مجموعات (حجم، إضافات…) لكل منها خيارات بأسعار.
 *
 * يقرأ ويكتب نفس النص المخزَّن في `dishes.options` بالشكل المعتمد، فتبقى
 * المعرّفات ثابتة ويستطيع الخادم إعادة حساب سعر الإضافات عند الدفع الإلكتروني.
 * القيمة تبقى حقلاً نصياً واحداً في payload الطبق (القاعدة أ بلا تغيير).
 */
import { useMemo } from "react";
import { Button, Input, Select } from "@/components/ui";
import {
  newOptionId,
  parseDishOptions,
  serializeDishOptions,
  type DishOptionGroup,
} from "@/lib/options";

export function OptionsEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const groups = useMemo(() => parseDishOptions(value), [value]);

  const commit = (next: DishOptionGroup[]) => onChange(serializeDishOptions(next) ?? "");

  const patchGroup = (gi: number, patch: Partial<DishOptionGroup>) =>
    commit(groups.map((g, i) => (i === gi ? { ...g, ...patch } : g)));

  const addGroup = () =>
    commit([
      ...groups,
      {
        id: newOptionId("g"),
        name: "",
        name_en: null,
        type: "single",
        required: false,
        items: [{ id: newOptionId("o"), name: "", price: 0 }],
      },
    ]);

  return (
    <div className="flex flex-col gap-3">
      {groups.map((g, gi) => (
        <div key={g.id} className="rounded-xl border border-line bg-panel2 p-3.5">
          <div className="flex flex-wrap items-end gap-2">
            <label className="min-w-40 flex-1">
              <span className="mb-1 block text-xs font-bold text-dim">اسم المجموعة</span>
              <Input
                value={g.name}
                onChange={(e) => patchGroup(gi, { name: e.target.value })}
                placeholder="الحجم"
              />
            </label>
            <label className="w-32">
              <span className="mb-1 block text-xs font-bold text-dim">الاختيار</span>
              <Select
                value={g.type}
                onChange={(e) =>
                  patchGroup(gi, { type: e.target.value === "multi" ? "multi" : "single" })
                }
              >
                <option value="single">واحد فقط</option>
                <option value="multi">متعدد</option>
              </Select>
            </label>
            <label className="flex items-center gap-2 py-2.5 text-xs font-bold text-dim">
              <input
                type="checkbox"
                checked={g.required}
                onChange={(e) => patchGroup(gi, { required: e.target.checked })}
                className="h-4 w-4 accent-[var(--c-gold)]"
              />
              إلزامية
            </label>
            <button
              type="button"
              onClick={() => commit(groups.filter((_, i) => i !== gi))}
              className="rounded-xl border border-bad/40 px-3 py-2.5 text-xs font-bold text-bad hover:bg-bad/10"
            >
              حذف المجموعة
            </button>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            {g.items.map((it, ii) => (
              <div key={it.id} className="flex flex-wrap items-center gap-2">
                <Input
                  className="min-w-36 flex-1"
                  value={it.name}
                  onChange={(e) =>
                    patchGroup(gi, {
                      items: g.items.map((x, i) =>
                        i === ii ? { ...x, name: e.target.value } : x
                      ),
                    })
                  }
                  placeholder="وسط"
                />
                <Input
                  className="w-28"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.5"
                  dir="ltr"
                  value={String(it.price)}
                  onChange={(e) =>
                    patchGroup(gi, {
                      items: g.items.map((x, i) =>
                        i === ii ? { ...x, price: Number(e.target.value) || 0 } : x
                      ),
                    })
                  }
                  placeholder="0"
                />
                <span className="text-xs text-faint">ر.س</span>
                <button
                  type="button"
                  onClick={() =>
                    patchGroup(gi, { items: g.items.filter((_, i) => i !== ii) })
                  }
                  aria-label="حذف الخيار"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-dim hover:text-bad"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                patchGroup(gi, {
                  items: [...g.items, { id: newOptionId("o"), name: "", price: 0 }],
                })
              }
              className="self-start text-xs font-bold text-gold hover:underline"
            >
              ＋ إضافة خيار
            </button>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addGroup} className="self-start">
        ＋ مجموعة خيارات
      </Button>
      <p className="text-xs text-faint">
        مثال: مجموعة «الحجم» (واحد فقط) بخيارات وسط ٠ وكبير ٥ — تُحسب الإضافة على سعر الطبق.
      </p>
    </div>
  );
}

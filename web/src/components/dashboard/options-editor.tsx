"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { fieldClass } from "@/components/ui/field";
import {
  parseDishOptions,
  serializeDishOptions,
  type DishOptionGroup,
} from "@/lib/options";

let seq = 0;
const uid = (p: string) => `${p}${Date.now().toString(36)}${(seq++).toString(36)}`;

/**
 * محرر «خيارات وإضافات الطبق» — مجموعات (حجم/إضافات…) لكل منها عناصر بسعر
 * إضافي. يكتب الناتج JSON في حقل مخفي name="options" داخل نفس الفورم.
 */
export function OptionsEditor({ initial }: { initial: string | null }) {
  const [groups, setGroups] = useState<DishOptionGroup[]>(() =>
    parseDishOptions(initial)
  );

  const set = (next: DishOptionGroup[]) => setGroups(next);

  const addGroup = () =>
    set([
      ...groups,
      { id: uid("g"), name: "", type: "single", required: true, items: [{ id: uid("o"), name: "", price: 0 }] },
    ]);

  const patchGroup = (gi: number, patch: Partial<DishOptionGroup>) => {
    const next = [...groups];
    next[gi] = { ...next[gi], ...patch };
    set(next);
  };

  const patchItem = (gi: number, ii: number, patch: { name?: string; price?: number }) => {
    const next = [...groups];
    const items = [...next[gi].items];
    items[ii] = { ...items[ii], ...patch };
    next[gi] = { ...next[gi], items };
    set(next);
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line-dim p-4">
      <input type="hidden" name="options" value={serializeDishOptions(groups) ?? ""} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-cream">🧩 خيارات وإضافات الطبق</p>
          <p className="mt-0.5 text-xs text-muted">
            مثل: الحجم (إجباري) أو إضافات (اختيارية) — يظهر للزبون عند إضافة الطبق للطلب
          </p>
        </div>
        <button
          type="button"
          onClick={addGroup}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-gold px-3 py-1.5 text-xs font-bold text-charcoal transition-opacity hover:opacity-90"
        >
          <Plus size={14} /> مجموعة
        </button>
      </div>

      {groups.map((g, gi) => (
        <div key={g.id} className="rounded-xl border border-line-dim bg-white/[.03] p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <input
              value={g.name}
              onChange={(e) => patchGroup(gi, { name: e.target.value })}
              placeholder="اسم المجموعة (مثل: الحجم)"
              className={`${fieldClass} flex-1 py-1.5 text-sm`}
            />
            <select
              value={g.type}
              onChange={(e) => patchGroup(gi, { type: e.target.value === "multi" ? "multi" : "single" })}
              className={`${fieldClass} w-auto py-1.5 text-sm`}
            >
              <option value="single" className="bg-charcoal-2">اختيار واحد</option>
              <option value="multi" className="bg-charcoal-2">عدة اختيارات</option>
            </select>
            <label className="flex items-center gap-1.5 text-xs text-cream">
              <input
                type="checkbox"
                checked={g.required}
                onChange={(e) => patchGroup(gi, { required: e.target.checked })}
                className="h-3.5 w-3.5 accent-gold"
              />
              إجباري
            </label>
            <button
              type="button"
              onClick={() => set(groups.filter((_, i) => i !== gi))}
              className="text-danger transition-opacity hover:opacity-75"
              aria-label="حذف المجموعة"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {g.items.map((it, ii) => (
              <div key={it.id} className="flex items-center gap-2">
                <input
                  value={it.name}
                  onChange={(e) => patchItem(gi, ii, { name: e.target.value })}
                  placeholder="اسم الخيار (مثل: وسط)"
                  className={`${fieldClass} flex-1 py-1.5 text-sm`}
                />
                <input
                  type="number"
                  min={0}
                  step="0.5"
                  value={it.price === 0 ? "" : it.price}
                  onChange={(e) => patchItem(gi, ii, { price: parseFloat(e.target.value) || 0 })}
                  placeholder="+ سعر"
                  className={`${fieldClass} w-24 py-1.5 text-sm`}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() =>
                    patchGroup(gi, { items: g.items.filter((_, i) => i !== ii) })
                  }
                  className="text-muted transition-colors hover:text-danger"
                  aria-label="حذف الخيار"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                patchGroup(gi, { items: [...g.items, { id: uid("o"), name: "", price: 0 }] })
              }
              className="self-start text-xs font-semibold text-gold transition-opacity hover:opacity-80"
            >
              + خيار
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

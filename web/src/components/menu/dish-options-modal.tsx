"use client";

import { useMemo, useState } from "react";
import { formatPrice } from "@/lib/utils";
import type { DishOptionGroup } from "@/lib/options";
import type { Dish } from "@/lib/types";

/** ملخص اختيار جاهز للسلة: سطر وصفي + السعر النهائي للوحدة. */
export interface OptionsSelection {
  label: string;
  unitPrice: number;
}

/**
 * نافذة اختيار «خيارات وإضافات الطبق» للزبون — تطابق سلوك النسخة القديمة:
 * مجموعات single (زر واحد) أو multi، الإجباري يمنع الإضافة حتى يُختار.
 */
export function DishOptionsModal({
  dish,
  groups,
  lang = "ar",
  onAdd,
  onClose,
}: {
  dish: Dish;
  groups: DishOptionGroup[];
  lang?: "ar" | "en";
  onAdd: (selection: OptionsSelection) => void;
  onClose: () => void;
}) {
  const en = lang === "en";
  const [sel, setSel] = useState<Record<string, string[]>>({});

  const toggle = (g: DishOptionGroup, itemId: string) => {
    setSel((prev) => {
      const cur = prev[g.id] ?? [];
      if (g.type === "single") return { ...prev, [g.id]: cur[0] === itemId ? [] : [itemId] };
      return {
        ...prev,
        [g.id]: cur.includes(itemId) ? cur.filter((i) => i !== itemId) : [...cur, itemId],
      };
    });
  };

  const valid = groups.every((g) => !g.required || (sel[g.id] ?? []).length > 0);

  const { total, label } = useMemo(() => {
    let extra = 0;
    const parts: string[] = [];
    for (const g of groups) {
      for (const id of sel[g.id] ?? []) {
        const it = g.items.find((i) => i.id === id);
        if (!it) continue;
        extra += it.price;
        parts.push(en && it.name_en ? it.name_en : it.name);
      }
    }
    return { total: (dish.price ?? 0) + extra, label: parts.join("، ") };
  }, [groups, sel, dish.price, en]);

  return (
    <div
      className="fixed inset-0 z-[999] flex items-end justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl shadow-2xl"
        style={{ background: "var(--m-surface)", color: "var(--m-text)" }}
        onClick={(e) => e.stopPropagation()}
        dir={en ? "ltr" : "rtl"}
      >
        <div
          className="flex items-start justify-between gap-3 border-b px-5 pb-3.5 pt-4"
          style={{ borderColor: "var(--m-border)" }}
        >
          <div>
            <p className="text-lg font-extrabold" style={{ fontFamily: "var(--m-font)" }}>
              {en && dish.name_en ? dish.name_en : dish.name}
            </p>
            {dish.description && (
              <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--m-muted)" }}>
                {en && dish.description_en ? dish.description_en : dish.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 text-2xl leading-none"
            style={{ color: "var(--m-muted)" }}
            aria-label={en ? "Close" : "إغلاق"}
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {groups.map((g) => (
            <div key={g.id} className="mb-5">
              <div className="mb-2.5 flex items-center gap-2">
                <span className="text-sm font-extrabold">{en && g.name_en ? g.name_en : g.name}</span>
                {g.required && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ background: "var(--m-bg-2)", color: "var(--m-accent)" }}
                  >
                    {en ? "Required" : "إجباري"}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {g.items.map((it) => {
                  const checked = (sel[g.id] ?? []).includes(it.id);
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => toggle(g, it.id)}
                      className="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-start transition-colors"
                      style={{
                        borderColor: checked ? "var(--m-accent)" : "var(--m-border)",
                        background: checked ? "var(--m-bg-2)" : "transparent",
                      }}
                    >
                      <span className="flex items-center gap-2.5">
                        <span
                          className="flex h-5 w-5 items-center justify-center border-2 text-[11px] font-black"
                          style={{
                            borderRadius: g.type === "single" ? "50%" : 6,
                            borderColor: checked ? "var(--m-accent)" : "var(--m-border)",
                            background: checked ? "var(--m-accent)" : "transparent",
                            color: "var(--m-on-accent)",
                          }}
                        >
                          {checked ? "✓" : ""}
                        </span>
                        <span className="text-sm font-semibold">
                          {en && it.name_en ? it.name_en : it.name}
                        </span>
                      </span>
                      {it.price > 0 && (
                        <span className="text-[13px] font-bold" style={{ color: "var(--m-accent)" }}>
                          +{formatPrice(it.price)} {en ? "SAR" : "ر.س"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t px-5 pb-6 pt-3.5" style={{ borderColor: "var(--m-border)" }}>
          <button
            type="button"
            disabled={!valid}
            onClick={() => onAdd({ label, unitPrice: total })}
            className="w-full rounded-2xl py-3.5 text-base font-extrabold transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
          >
            {valid
              ? en
                ? `Add — ${formatPrice(total)} SAR`
                : `أضف للطلب — ${formatPrice(total)} ر.س`
              : en
                ? "Select required options"
                : "اختر الخيارات الإجبارية"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, type CSSProperties } from "react";
import { DishCard } from "@/components/menu/dish-card";
import { CategoryNav } from "@/components/menu/category-nav";
import { DishOptionsModal, type OptionsSelection } from "@/components/menu/dish-options-modal";
import { CartBar, type CartLine } from "@/components/menu/cart";
import { categoryId as slugId } from "@/lib/utils";
import { parseDishOptions } from "@/lib/options";
import type { Dish } from "@/lib/types";

type Category = { name: string; dishes: Dish[] };

export function MenuBody({
  featured,
  categories,
  englishEnabled = false,
  orderingEnabled = false,
  whatsapp,
  phone,
}: {
  featured: Dish[];
  categories: Category[];
  englishEnabled?: boolean;
  /** تفعيل سلة الطلب (زر الإضافة + شريط السلة). */
  orderingEnabled?: boolean;
  whatsapp?: string | null;
  phone?: string | null;
}) {
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [lines, setLines] = useState<CartLine[]>([]);
  const [optDish, setOptDish] = useState<Dish | null>(null);
  const en = lang === "en";
  const display = { fontFamily: "var(--m-font)" } as CSSProperties;

  const addLine = (key: string, name: string, unitPrice: number, label?: string) =>
    setLines((prev) => {
      const i = prev.findIndex((l) => l.key === key);
      if (i === -1) return [...prev, { key, name, label, unitPrice, qty: 1 }];
      const next = [...prev];
      next[i] = { ...next[i], qty: next[i].qty + 1 };
      return next;
    });

  const changeQty = (key: string, delta: number) =>
    setLines((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0)
    );

  const handleAdd = (dish: Dish) => {
    if (parseDishOptions(dish.options).length > 0) {
      setOptDish(dish);
      return;
    }
    const name = en && dish.name_en ? dish.name_en : dish.name;
    addLine(dish.id, name, dish.price ?? 0);
  };

  const handleAddWithOptions = (dish: Dish, sel: OptionsSelection) => {
    const name = en && dish.name_en ? dish.name_en : dish.name;
    addLine(`${dish.id}::${sel.label}`, name, sel.unitPrice, sel.label);
    setOptDish(null);
  };

  if (categories.length === 0) {
    return (
      <p className="py-20 text-center" style={{ color: "var(--m-muted)" }}>
        {en ? "No items available." : "لا توجد أصناف متاحة حالياً."}
      </p>
    );
  }

  const onAdd = orderingEnabled ? handleAdd : undefined;

  return (
    <>
      {englishEnabled && (
        <div className="mb-6 flex justify-center">
          <div
            className="inline-flex rounded-full border p-1"
            style={{ borderColor: "var(--m-border)", background: "var(--m-surface)" }}
          >
            {(["ar", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className="rounded-full px-4 py-1 text-sm font-bold transition-colors"
                style={
                  lang === l
                    ? { background: "var(--m-accent)", color: "var(--m-on-accent)" }
                    : { color: "var(--m-muted)" }
                }
              >
                {l === "ar" ? "العربية" : "English"}
              </button>
            ))}
          </div>
        </div>
      )}

      {featured.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold" style={display}>
            <span style={{ color: "var(--m-accent)" }}>★</span>{" "}
            {en ? "Featured" : "الأكثر تميّزاً"}
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {featured.map((dish) => (
              <div key={dish.id} className="w-56 shrink-0">
                <DishCard dish={dish} lang={lang} onAdd={onAdd} />
              </div>
            ))}
          </div>
        </section>
      )}

      <CategoryNav categories={categories.map((c) => c.name)} />

      {categories.map((cat) => (
        <section key={cat.name} id={slugId(cat.name)} className="scroll-mt-20 pt-6">
          <h2
            className="mb-4 inline-block border-b-2 pb-1 text-xl font-bold"
            style={{ ...display, color: "var(--m-text)", borderColor: "var(--m-accent)" }}
          >
            {cat.name}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {cat.dishes.map((dish) => (
              <DishCard key={dish.id} dish={dish} lang={lang} onAdd={onAdd} />
            ))}
          </div>
        </section>
      ))}

      {orderingEnabled && (
        <>
          {optDish && (
            <DishOptionsModal
              dish={optDish}
              groups={parseDishOptions(optDish.options)}
              lang={lang}
              onAdd={(sel) => handleAddWithOptions(optDish, sel)}
              onClose={() => setOptDish(null)}
            />
          )}
          <CartBar
            lines={lines}
            lang={lang}
            whatsapp={whatsapp}
            phone={phone}
            onChangeQty={changeQty}
          />
        </>
      )}
    </>
  );
}

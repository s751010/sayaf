"use client";

import { useState, type CSSProperties } from "react";
import { DishCard } from "@/components/menu/dish-card";
import { CategoryNav } from "@/components/menu/category-nav";
import { categoryId as slugId } from "@/lib/utils";
import type { Dish } from "@/lib/types";

type Category = { name: string; dishes: Dish[] };

export function MenuBody({
  featured,
  categories,
  englishEnabled = false,
}: {
  featured: Dish[];
  categories: Category[];
  englishEnabled?: boolean;
}) {
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const en = lang === "en";
  const display = { fontFamily: "var(--m-font)" } as CSSProperties;

  if (categories.length === 0) {
    return (
      <p className="py-20 text-center" style={{ color: "var(--m-muted)" }}>
        {en ? "No items available." : "لا توجد أصناف متاحة حالياً."}
      </p>
    );
  }

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
                <DishCard dish={dish} lang={lang} />
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
              <DishCard key={dish.id} dish={dish} lang={lang} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

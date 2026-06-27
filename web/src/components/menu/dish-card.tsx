"use client";

import { Flame, Star } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Dish } from "@/lib/types";

export function DishCard({
  dish,
  lang = "ar",
}: {
  dish: Dish;
  lang?: "ar" | "en";
}) {
  const hasImg = Boolean(dish.image);
  const en = lang === "en";
  const name = en && dish.name_en ? dish.name_en : dish.name;
  const description =
    en && dish.description_en ? dish.description_en : dish.description;
  const allergens = dish.allergens ?? [];

  return (
    <article
      className="group flex flex-col overflow-hidden border transition-all duration-300 hover:-translate-y-1"
      style={{
        background: "var(--m-surface)",
        borderColor: "var(--m-border)",
        borderRadius: "var(--m-radius)",
      }}
    >
      <div
        className="relative aspect-[4/3] w-full overflow-hidden"
        style={{ background: "var(--m-bg-2)" }}
      >
        {hasImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dish.image!}
            alt={name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-6xl opacity-90">
            {dish.emoji || "🍽"}
          </div>
        )}
        {dish.featured && (
          <span
            className="absolute end-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm"
            style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
          >
            <Star size={11} className="fill-current" /> {en ? "Featured" : "مميز"}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4" dir={en ? "ltr" : "rtl"}>
        <div className="flex items-start justify-between gap-3">
          <h3
            className="font-bold leading-snug"
            style={{ color: "var(--m-text)", fontFamily: "var(--m-font)" }}
          >
            {hasImg && dish.emoji ? `${dish.emoji} ` : ""}
            {name}
          </h3>
          <span
            className="shrink-0 whitespace-nowrap text-lg font-black"
            style={{ color: "var(--m-accent)", fontFamily: "var(--m-font)" }}
          >
            {dish.price != null ? formatPrice(dish.price) : "—"}
            <span className="ms-1 text-xs font-medium opacity-70">
              {en ? "SAR" : "ر.س"}
            </span>
          </span>
        </div>

        {description && (
          <p
            className="line-clamp-2 text-sm leading-relaxed"
            style={{ color: "var(--m-muted)" }}
          >
            {description}
          </p>
        )}

        {(dish.calories != null ||
          (dish.sodium_mg ?? 0) > 600 ||
          allergens.length > 0) && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {dish.calories != null && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{ background: "var(--m-bg-2)", color: "var(--m-muted)" }}
              >
                <Flame size={10} /> {dish.calories} {en ? "cal" : "سعرة"}
              </span>
            )}
            {(dish.sodium_mg ?? 0) > 600 && (
              <span className="inline-flex items-center rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-semibold text-red-400">
                {en ? "High sodium" : "صوديوم عالٍ"}
              </span>
            )}
            {allergens.map((a) => (
              <span
                key={a}
                className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-500"
              >
                {a}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

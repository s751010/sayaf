import { Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import type { Dish } from "@/lib/types";

export function DishCard({ dish }: { dish: Dish }) {
  return (
    <Card className="flex flex-col gap-3 p-0 overflow-hidden">
      {dish.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dish.image}
          alt={dish.name}
          loading="lazy"
          decoding="async"
          className="aspect-[4/3] w-full object-cover"
        />
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center bg-charcoal-3 text-5xl">
          {dish.emoji || "🍽"}
        </div>
      )}

      <div className="flex flex-col gap-2 p-4 pt-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold leading-snug text-cream">
            {dish.emoji && !dish.image ? "" : `${dish.emoji ?? ""} `}
            {dish.name}
          </h3>
          {dish.featured && <Badge variant="gold">مميز</Badge>}
        </div>

        {dish.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-warm">
            {dish.description}
          </p>
        )}

        <div className="mt-1 flex items-center justify-between">
          <span className="font-display text-lg font-black text-gold">
            {formatPrice(dish.price)}{" "}
            <span className="text-xs font-medium text-warm">ر.س</span>
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            {typeof dish.calories === "number" && (
              <Badge variant="neutral">
                <Flame size={11} /> {dish.calories} سعرة
              </Badge>
            )}
            {typeof dish.sodium_mg === "number" && dish.sodium_mg > 0 && (
              <Badge variant={dish.sodium_mg > 600 ? "red" : "neutral"}>
                صوديوم {dish.sodium_mg}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

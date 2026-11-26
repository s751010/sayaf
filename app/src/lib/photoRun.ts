/**
 * «صوّر أطباقك» — ترتيب الطابور، خالص (`photo-run.test.ts`).
 *
 * التاجر يصوّر ما يراه زبونه أوّلاً: المميّز (★) ثم الأكثر فتحاً ثم الباقي
 * بترتيب المنيو. فإن توقّف بعد خمس صور، تكون الخمس الأهمّ.
 */
import type { Dish } from "./types";

export function photoQueue(dishes: Dish[]): Dish[] {
  return dishes
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => !d.image?.trim())
    .sort(
      (a, b) =>
        Number(!!b.d.featured) - Number(!!a.d.featured) ||
        (b.d.views ?? 0) - (a.d.views ?? 0) ||
        a.i - b.i
    )
    .map(({ d }) => d);
}

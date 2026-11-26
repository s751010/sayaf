/**
 * «صوّر أطباقك»: الطابور الأهمّ فالأهمّ، وما له صورة لا يدخله (`lib/photoRun.ts`).
 */
import { describe, expect, it } from "vitest";
import { photoQueue } from "../src/lib/photoRun";
import type { Dish } from "../src/lib/types";

const dish = (o: Partial<Dish>): Dish => ({ id: "x", name: "طبق", image: null, featured: false, views: 0, ...o }) as Dish;

describe("طابور التصوير", () => {
  it("المميّز ثم الأكثر فتحاً ثم ترتيب المنيو، وبلا ما له صورة", () => {
    const q = photoQueue([
      dish({ id: "a" }),
      dish({ id: "b", views: 9 }),
      dish({ id: "c", image: "https://x/y.webp", featured: true }),
      dish({ id: "d", featured: true }),
      dish({ id: "e", image: "  " }),
      dish({ id: "f" }),
    ]);
    expect(q.map((d) => d.id)).toEqual(["d", "b", "a", "e", "f"]);
  });

  it("فارغ حين لكل الأطباق صور", () => {
    expect(photoQueue([dish({ image: "https://x/1.webp" })])).toEqual([]);
  });
});

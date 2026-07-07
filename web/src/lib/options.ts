/**
 * Dish option groups — stored as JSON text in `dishes.options`.
 * The shape matches the legacy app exactly so both apps read the same data:
 * [{ id, name, name_en?, type: "single"|"multi", required, items: [{ id, name, name_en?, price }] }]
 */

export interface DishOptionItem {
  id: string;
  name: string;
  name_en?: string | null;
  price: number;
}

export interface DishOptionGroup {
  id: string;
  name: string;
  name_en?: string | null;
  type: "single" | "multi";
  required: boolean;
  items: DishOptionItem[];
}

/** قراءة آمنة لحقل options — أي قيمة تالفة تعود مصفوفة فارغة. */
export function parseDishOptions(raw: string | null | undefined): DishOptionGroup[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (g): g is Record<string, unknown> =>
          typeof g === "object" && g !== null && Array.isArray((g as { items?: unknown }).items)
      )
      .map((g, gi) => ({
        id: String(g.id ?? `g${gi}`),
        name: String(g.name ?? ""),
        name_en: g.name_en == null ? null : String(g.name_en),
        type: (g.type === "multi" ? "multi" : "single") as "single" | "multi",
        required: Boolean(g.required),
        items: (g.items as unknown[])
          .filter((it): it is Record<string, unknown> => typeof it === "object" && it !== null)
          .map((it, ii) => ({
            id: String(it.id ?? `o${gi}-${ii}`),
            name: String(it.name ?? ""),
            name_en: it.name_en == null ? null : String(it.name_en),
            price: Number(it.price) || 0,
          })),
      }))
      .filter((g) => g.name.trim() !== "" && g.items.some((it) => it.name.trim() !== ""));
  } catch {
    return [];
  }
}

/** تنظيف + تحويل المجموعات إلى نص للتخزين (null إذا لا توجد مجموعات صالحة). */
export function serializeDishOptions(groups: DishOptionGroup[]): string | null {
  const clean = groups
    .map((g) => ({
      ...g,
      name: g.name.trim(),
      items: g.items
        .map((it) => ({ ...it, name: it.name.trim(), price: Number(it.price) || 0 }))
        .filter((it) => it.name !== ""),
    }))
    .filter((g) => g.name !== "" && g.items.length > 0);
  return clean.length > 0 ? JSON.stringify(clean) : null;
}

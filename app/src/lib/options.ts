/**
 * خيارات الطبق وإضافاته — تُخزَّن نصاً JSON في `dishes.options`.
 *
 * الشكل المعتمد مطابق تماماً لـ`web/src/lib/options.ts` ولما تتوقعه دالة
 * `paylink-order-create`، فالنسختان تقرآن نفس البيانات ويحسب الخادم الإضافات
 * من نفس المعرّفات:
 *   [{ id, name, name_en?, type: "single"|"multi", required, items: [{ id, name, name_en?, price }] }]
 *
 * ⚠️ المعرّفات (`id`) ليست تجميلاً: الخادم يطابق `option_ids` القادمة من السلة
 * بالخيارات المخزَّنة ليعيد حساب السعر بنفسه. أي خيار بلا معرّف ثابت يعني
 * طلباً مرفوضاً عند الدفع الإلكتروني.
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

/**
 * قراءة آمنة لحقل options — أي قيمة تالفة تعود مصفوفة فارغة.
 *
 * تقبل أيضاً الأشكال القديمة (نص حر سطراً بسطر، أو مصفوفة مسطّحة
 * `[{name, price}]`) وتحوّلها لمجموعة واحدة بمعرّفات مولَّدة، حتى لا تختفي
 * خيارات أُدخلت قبل اعتماد الشكل المعتمد.
 */
export function parseDishOptions(raw: string | null | undefined): DishOptionGroup[] {
  if (!raw?.trim()) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return legacyGroup(freeTextItems(raw));
  }

  if (!Array.isArray(parsed)) return [];

  // الشكل المعتمد: عناصر تحتوي مصفوفة items.
  const grouped = parsed.filter(
    (g): g is Record<string, unknown> =>
      typeof g === "object" && g !== null && Array.isArray((g as { items?: unknown }).items)
  );

  if (grouped.length === 0) return legacyGroup(flatItems(parsed));

  return grouped
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
}

/** مصفوفة مسطّحة قديمة: ["جبن"] أو [{name, price}]. */
function flatItems(parsed: unknown[]): DishOptionItem[] {
  return parsed
    .map((o, i): DishOptionItem | null => {
      if (typeof o === "string" && o.trim()) return { id: `o0-${i}`, name: o.trim(), price: 0 };
      if (o && typeof o === "object") {
        const name = String((o as { name?: unknown }).name ?? "").trim();
        if (name) return { id: `o0-${i}`, name, price: Number((o as { price?: unknown }).price) || 0 };
      }
      return null;
    })
    .filter((o): o is DishOptionItem => o !== null);
}

/** نص حر: سطر (أو فاصلة) لكل خيار. */
function freeTextItems(raw: string): DishOptionItem[] {
  return raw
    .split(/[\n,،]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name, i) => ({ id: `o0-${i}`, name, price: 0 }));
}

function legacyGroup(items: DishOptionItem[]): DishOptionGroup[] {
  if (items.length === 0) return [];
  return [{ id: "g0", name: "الإضافات", name_en: "Add-ons", type: "multi", required: false, items }];
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

/** معرّف فريد قصير لمجموعة/خيار جديد في المحرّر. */
export function newOptionId(prefix: "g" | "o"): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * خيارات وإضافات الطبق.
 *
 * تُخزَّن في عمود نصّي واحد (`dishes.options`). الصيغة المعتمدة الآن هي JSON
 * `[{name, price?}]`، لكن القارئ يتسامح مع النص الحر المفصول بأسطر/فواصل لأن
 * صفوفاً قديمة كُتبت بهذه الطريقة — لا تُسقط بيانات تاجر لأن صيغتها قديمة.
 */
export type DishOption = { name: string; price?: number };

export function parseOptions(raw: string | null | undefined): DishOption[] {
  if (!raw?.trim()) return [];
  try {
    const v: unknown = JSON.parse(raw);
    if (Array.isArray(v)) {
      return v
        .map((o): DishOption | null => {
          if (typeof o === "string") return o.trim() ? { name: o.trim() } : null;
          if (o && typeof o === "object" && typeof (o as DishOption).name === "string") {
            const { name, price } = o as DishOption;
            if (!name.trim()) return null;
            return typeof price === "number" && Number.isFinite(price)
              ? { name: name.trim(), price }
              : { name: name.trim() };
          }
          return null;
        })
        .filter((o): o is DishOption => o !== null);
    }
  } catch {
    /* ليس JSON — نعامله كنص حر */
  }
  return raw
    .split(/[\n,،]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => ({ name }));
}

/** يُرجع `null` للقائمة الفارغة كي يبقى العمود فارغاً بدل `"[]"`. */
export function serializeOptions(options: DishOption[]): string | null {
  const clean = options
    .map((o) => ({ name: o.name.trim(), price: o.price }))
    .filter((o) => o.name.length > 0)
    .map((o) =>
      typeof o.price === "number" && Number.isFinite(o.price) && o.price > 0
        ? { name: o.name, price: o.price }
        : { name: o.name }
    );
  return clean.length ? JSON.stringify(clean) : null;
}

/**
 * خيارات وإضافات الطبق.
 *
 * تُخزَّن في عمود نصّي واحد (`dishes.options`). الصيغة المعتمدة الآن هي JSON
 * `[{name, price?}]`، لكن القارئ يتسامح مع النص الحر المفصول بأسطر/فواصل لأن
 * صفوفاً قديمة كُتبت بهذه الطريقة — لا تُسقط بيانات تاجر لأن صيغتها قديمة.
 */
export type DishOption = { name: string; price?: number };

/**
 * ⚠️ **القاعدة نفسها في `supabase/functions/_shared/options.ts`** — رقم أو
 * نصّ رقمي ⇐ عدد، وما عداه ⇐ صفر.
 *
 * كانت هذه النسخة ترفض `"5"` (`typeof price === "number"`) بينما نسخة الخادم
 * تقبله (`Number(price)`) — فإضافةٌ سعرها نصّ تُعرض للزبون **بلا سعر** ثم
 * تُحصَّل منه. لا صفّ في الإنتاج بهذا الشكل، لكن API التاجر (§١٤) يقبل
 * `options` كما تُرسَل. و`options-parity.test.ts` يحرس التطابق الآن.
 */
function normalizePrice(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function parseOptions(raw: string | null | undefined): DishOption[] {
  if (!raw?.trim()) return [];
  try {
    const v: unknown = JSON.parse(raw);
    if (Array.isArray(v)) {
      return v
        .map((o): DishOption | null => {
          if (typeof o === "string") return o.trim() ? { name: o.trim() } : null;
          if (o && typeof o === "object") {
            const rec = o as Record<string, unknown>;
            const name = typeof rec.name === "string" ? rec.name.trim() : "";
            if (!name) return null;
            // `price` يُحذف عند الصفر كي لا تعرض الواجهة «+٠ ر.س» على خيار
            // بلا فرق سعر — والقيمة الرقمية تبقى مطابقة لنسخة الخادم.
            const price = normalizePrice(rec.price);
            return price ? { name, price } : { name };
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

/**
 * قراءة `dishes.options` — **نسخة الخادم**، ونظيرتها `app/src/lib/options.ts`.
 *
 * ═══ ⚠️ لماذا نسختان أصلاً ═══
 *
 * الواجهة تُبنى بـVite داخل `app/`، ودوالّ الحافة تُنشر إلى Deno من
 * `supabase/functions/` — وحدتا نشر لا تتشاركان حزمة. فالخيار كان: استيراد
 * عابر للحدود يكسر إحدى البيئتين، أو نسختان **يحرسهما فحص**. اخترنا الثاني،
 * و`options-parity.test.ts` يقارنهما على جدول حالات ويُسقط CI عند التباعد.
 *
 * ═══ ⚠️ ولماذا التطابق مسألة مال ═══
 *
 * المعرّف الذي يرسله العميل هو **موضع** الخيار في المصفوفة الناتجة. فاختلاف
 * التحليل يجعل الرقم يشير إلى إضافة أخرى — أو يُرفض الطلب كلّه. (النسخة
 * الأولى من هذه الدالة افترضت شكلاً مُجمَّعاً `[{items:[{id,…}]}]` لا يكتبه
 * أحد، فكان **كل** طلب بإضافة يُرفض.)
 *
 * ═══ ⚠️ السعر النصّي — تباعد كان قائماً ═══
 *
 * كانت هذه النسخة تقبل `"5"` (بـ`Number()`) والواجهة ترفضه (بـ`typeof`).
 * والنتيجة: إضافة تُعرض للزبون **بلا سعر** ثم تُحصَّل منه خمسة ريالات.
 * لا صفّ في الإنتاج اليوم بهذا الشكل، لكن API التاجر (§١٤) يقبل `options`
 * كما يرسلها، فنظام نقاط بيع يكتب الأسعار نصّاً كان يفتح الباب.
 * القاعدة الآن واحدة في الملفّين: `normalizePrice`.
 */
export type DishOption = { name: string; price: number };

/**
 * رقم أو نصّ رقمي ⇐ عدد. وما عداه ⇐ صفر (لا إضافة سعر).
 * الصفر هو الافتراضي الآمن: خيار لا نفهم سعره لا يُحصَّل عنه شيء.
 */
export function normalizePrice(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function parseDishOptions(raw: string | null | undefined): DishOption[] {
  if (!raw?.trim()) return [];
  try {
    const v: unknown = JSON.parse(raw);
    if (Array.isArray(v)) {
      return v
        .map((o): DishOption | null => {
          if (typeof o === "string") {
            return o.trim() ? { name: o.trim(), price: 0 } : null;
          }
          if (o && typeof o === "object") {
            const rec = o as Record<string, unknown>;
            const name = typeof rec.name === "string" ? rec.name.trim() : "";
            if (!name) return null;
            return { name, price: normalizePrice(rec.price) };
          }
          return null;
        })
        .filter((o): o is DishOption => o !== null);
    }
  } catch {
    /* ليس JSON — نعامله كنص حر */
  }
  // صفوف قديمة كُتبت نصّاً حراً مفصولاً بأسطر أو فواصل. لا تُسقط بيانات تاجر
  // لأن صيغتها أقدم من الصيغة المعتمدة.
  return raw
    .split(/[\n,،]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => ({ name, price: 0 }));
}

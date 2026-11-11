/**
 * رسالة خطأ القاعدة كما تخرج لحامل مفتاح API — **من الرمز وحده، لا من النصّ**.
 *
 * ═══ لماذا (مراجعة الأمن ٢٠٢٦/١١/٠٩، البند ١٢) ═══
 *
 * كانت `api` تُمرّر نصّ Postgres للصنفين ‎22 و23 كما هو، بحجّة أنه ما يحتاجه
 * المطوّر ليصلح طلبه. لكن النصّ يحمل **أسماء القيود والفهارس والأعمدة**
 * (`restaurants_cover_color_hex`، `dishes_pkey`…) — خريطة للبنية لا يحتاجها
 * أحد ليصلح قيمة. فالرمز يُترجَم إلى جملة عامّة ثابتة، والنصّ يُسجَّل عندنا.
 *
 * خالصة بلا Deno — يقرؤها `app/tests/db-error.test.ts`.
 */
export type PublicDbError = { status: number; message: string };

const BY_CODE: Record<string, string> = {
  "23505": "القيمة مكرّرة: يوجد سجلّ بها من قبل.",
  "23503": "الطلب يشير إلى سجلّ غير موجود.",
  "23502": "حقلٌ مطلوب ناقص.",
  "23514": "قيمة غير مقبولة لأحد الحقول.",
  "22P02": "قيمة بصيغة غير صالحة لأحد الحقول.",
  "22001": "نصٌّ أطول من المسموح لأحد الحقول.",
  "22003": "رقمٌ خارج المدى المسموح لأحد الحقول.",
};

export function publicDbError(code: string | undefined): PublicDbError {
  const c = code ?? "";
  if (BY_CODE[c]) return { status: 400, message: BY_CODE[c] };
  if (c.startsWith("22")) return { status: 400, message: "قيمة غير صالحة لأحد الحقول." };
  if (c.startsWith("23")) return { status: 400, message: "الطلب يخالف قيداً في البيانات." };
  return { status: 500, message: "تعذّر تنفيذ الطلب." };
}

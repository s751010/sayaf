/**
 * ضغط الصور في المتصفح قبل رفعها إلى Supabase Storage.
 *
 * مشترك بين رافع الصورة الواحدة (`ImageUploader`) والرفع الدفعي
 * (`BulkImages`) — منطق الضغط يُكتب مرة واحدة فقط.
 */

/** أقصى بُعد بالبكسل حسب شكل الصورة — أكبر من ذلك هدر خالص على شاشة جوال. */
export const MAX_EDGE = { square: 900, wide: 1400 } as const;
export type ImageShape = keyof typeof MAX_EDGE;

export const TARGET_KB = 300;
export const ACCEPT = "image/jpeg,image/png,image/webp";
/** سقف أوّلي قبل الضغط — يمنع تعليق المتصفح على ملف ضخم. */
export const MAX_FILE_BYTES = 15 * 1024 * 1024;

/** يصغّر الصورة ويضغطها، ويختار بين webp و jpeg أيهما أصغر. */
export async function compress(file: File, shape: ImageShape): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("تعذّرت قراءة الصورة."));
      el.src = url;
    });

    const max = MAX_EDGE[shape];
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("تعذّرت معالجة الصورة في هذا المتصفح.");
    ctx.drawImage(img, 0, 0, w, h);

    const encode = (type: string, q: number) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, q));

    // نخفّض الجودة تدريجياً حتى نقترب من الحجم الهدف.
    let best: Blob | null = null;
    for (const q of [0.82, 0.7, 0.6, 0.5]) {
      const [webp, jpeg] = await Promise.all([encode("image/webp", q), encode("image/jpeg", q)]);
      const candidates = [webp, jpeg].filter((b): b is Blob => !!b);
      if (!candidates.length) break;
      best = candidates.reduce((a, b) => (a.size <= b.size ? a : b));
      if (best.size <= TARGET_KB * 1024) break;
    }
    if (!best) throw new Error("تعذّر ضغط الصورة.");
    return best;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function extFor(blob: Blob): string {
  return blob.type === "image/webp" ? "webp" : "jpg";
}

/**
 * اسم ملف فريد داخل الحاوية.
 * `uploadImage` لا تستخدم upsert، فرفع مسار موجود يفشل — والعشوائية تمنع ذلك.
 */
export function uniqueName(blob: Blob): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extFor(blob)}`;
}

/**
 * يتحقق من الملف قبل الضغط ويعيد رسالة الخطأ، أو `null` إن كان صالحاً.
 * مشترك ليتطابق التحقق بين المسارين.
 */
export function imageFileError(file: File): string | null {
  if (!file.type.startsWith("image/")) return "اختر ملف صورة (JPG أو PNG أو WebP).";
  if (file.size > MAX_FILE_BYTES) return "الصورة كبيرة جداً (أكثر من 15 ميغابايت).";
  return null;
}

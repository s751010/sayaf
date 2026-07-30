/**
 * رافع الصور — يستبدل حقل «الصق رابط https://».
 *
 * صاحب المطعم يختار صورة من جهازه؛ نصغّرها ونضغطها في المتصفح قبل الرفع إلى
 * Supabase Storage، فلا يحمّل الزبون صورة 12 ميغابايت على بيانات الجوال.
 * ما يُحفظ في قاعدة البيانات هو الرابط العام الناتج — نفس عمود النص السابق،
 * فلا تغيير في المخطط.
 */
import { useRef, useState } from "react";
import { uploadImage, type Bucket } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui";

/** أقصى بُعد بالبكسل حسب شكل الصورة — أكبر من ذلك هدر خالص على شاشة جوال. */
const MAX_EDGE = { square: 900, wide: 1400 } as const;
const TARGET_KB = 300;
const ACCEPT = "image/jpeg,image/png,image/webp";

/** يصغّر الصورة ويضغطها، ويختار بين webp و jpeg أيهما أصغر. */
async function compress(file: File, shape: keyof typeof MAX_EDGE): Promise<Blob> {
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

function extFor(blob: Blob) {
  return blob.type === "image/webp" ? "webp" : "jpg";
}

export function ImageUploader({
  value,
  onChange,
  bucket,
  pathPrefix,
  shape = "square",
  label,
}: {
  value: string;
  onChange: (url: string) => void;
  bucket: Bucket;
  /** بادئة مسار داخل الحاوية، مثل `<restaurantId>/dishes`. */
  pathPrefix: string;
  shape?: keyof typeof MAX_EDGE;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);

  async function pick(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("اختر ملف صورة (JPG أو PNG أو WebP).");
      return;
    }
    // سقف أوّلي قبل الضغط — يمنع تعليق المتصفح على ملف ضخم.
    if (file.size > 15 * 1024 * 1024) {
      setError("الصورة كبيرة جداً (أكثر من 15 ميغابايت).");
      return;
    }
    setBusy(true);
    try {
      const blob = await compress(file, shape);
      const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extFor(blob)}`;
      const url = await uploadImage(bucket, `${pathPrefix}/${name}`, blob);
      setBroken(false);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر رفع الصورة.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const previewBox = shape === "wide" ? "h-24 w-40" : "h-24 w-24";

  return (
    <div className="space-y-2">
      {label && <span className="block text-sm font-bold text-ink">{label}</span>}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-panel2",
            previewBox
          )}
        >
          {busy ? (
            <Spinner />
          ) : value && !broken ? (
            <img
              src={value}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setBroken(true)}
            />
          ) : (
            <span className="text-2xl text-faint">{broken ? "⚠️" : "🖼️"}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => void pick(e.target.files?.[0])}
          />
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line-gold px-3 py-1.5 text-xs font-bold text-ink transition-colors hover:bg-gold/10 disabled:opacity-50"
            >
              {busy ? "جارٍ الرفع…" : value ? "استبدال الصورة" : "📤 رفع صورة"}
            </button>
            {value && !busy && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setBroken(false);
                  setError(null);
                }}
                className="rounded-lg px-3 py-1.5 text-xs font-bold text-dim transition-colors hover:bg-ink/5 hover:text-ink"
              >
                إزالة
              </button>
            )}
          </div>
          <span className="text-xs text-faint">
            JPG أو PNG أو WebP — تُضغط تلقائياً (~{TARGET_KB}KB) قبل الرفع.
          </span>
        </div>
      </div>

      {broken && value && (
        <p className="text-xs text-bad">تعذّر عرض الصورة — الرابط المحفوظ قد يكون معطوباً.</p>
      )}
      {error && <p className="text-xs text-bad">{error}</p>}
    </div>
  );
}

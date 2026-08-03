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
import {
  ACCEPT,
  TARGET_KB,
  compress,
  imageFileError,
  uniqueName,
  type ImageShape,
} from "@/lib/image";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui";

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
  shape?: ImageShape;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);

  async function pick(file: File | undefined) {
    if (!file) return;
    setError(null);
    const invalid = imageFileError(file);
    if (invalid) return setError(invalid);
    setBusy(true);
    try {
      const blob = await compress(file, shape);
      const url = await uploadImage(bucket, `${pathPrefix}/${uniqueName(blob)}`, blob);
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
              {busy ? "جارٍ الرفع…" : value ? "استبدال الصورة" : "رفع صورة"}
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

/**
 * رفع صور دفعة واحدة وربط كل صورة بطبقها.
 *
 * التاجر عنده ٤٠ صورة في جواله. رفعها واحدة واحدة من داخل محرر كل طبق يعني
 * ٤٠ فتحة وإغلاقاً — فنرفعها كلها، ثم نقترح الربط بمطابقة اسم الملف باسم الطبق،
 * ويصحّح هو ما أخطأنا فيه.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, ErrorNote, Modal, SafeImage, Select } from "@/components/ui";
import { uploadImage } from "@/lib/api";
import { ACCEPT, compress, imageFileError, uniqueName } from "@/lib/image";
import type { Dish } from "@/lib/types";
import { Icon } from "@/lib/icons";

/** كم صورة تُرفع في وقت واحد — أعلى من ذلك يخنق شبكة الجوال. */
const CONCURRENCY = 3;

type Item = {
  fileName: string;
  /** معاينة محلية فورية؛ تُحرَّر عند الإغلاق. */
  objectUrl: string;
  status: "pending" | "done" | "error";
  /** الرابط العام بعد الرفع. */
  url: string | null;
  error: string | null;
  /** الطبق المختار للربط، أو "" = لا تربط. */
  dishId: string;
};

/** مفتاح مقارنة لاسم ملف أو اسم طبق: بلا امتداد ولا فواصل ولا أرقام. */
function matchKey(raw: string): string {
  return raw
    .replace(/\.[a-z0-9]+$/i, "")
    .toLowerCase()
    .replace(/[_\-.()[\]]+/g, " ")
    .replace(/\d+/g, " ")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

/** يخمّن الطبق من اسم الملف — `IMG_2931.jpg` لن يطابق شيئاً وهذا مقصود. */
function guessDish(fileName: string, dishes: Dish[]): string {
  const key = matchKey(fileName);
  if (key.length < 3) return "";
  const hit = dishes.find((d) => {
    const dk = matchKey(d.name);
    return dk.length >= 3 && (dk.includes(key) || key.includes(dk));
  });
  return hit?.id ?? "";
}

export function BulkImages({
  open,
  onClose,
  dishes,
  restaurantId,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  dishes: Dish[];
  restaurantId: string;
  /** يحفظ الروابط المربوطة؛ يعيد عدد ما حُفظ فعلاً. */
  onSave: (links: { dishId: string; url: string }[]) => Promise<void>;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // الأطباق بلا صورة أولاً — هي الغرض من هذه الشاشة.
  const options = useMemo(
    () => [...dishes].sort((a, b) => Number(!!a.image) - Number(!!b.image)),
    [dishes]
  );

  /**
   * معاينات blob تبقى في ذاكرة المتصفح حتى تُحرَّر صراحةً. نحتفظ بها في ref
   * ليصل إليها التنظيف عند التفكيك (الحالة نفسها تكون قد أُغلق عليها).
   */
  const urls = useRef<string[]>([]);
  useEffect(() => () => urls.current.forEach(URL.revokeObjectURL), []);

  function track(url: string) {
    urls.current.push(url);
    return url;
  }

  function reset() {
    urls.current.forEach(URL.revokeObjectURL);
    urls.current = [];
    setItems([]);
    setError("");
  }

  function close() {
    if (uploading || saving) return;
    reset();
    onClose();
  }

  const patch = (i: number, p: Partial<Item>) =>
    setItems((its) => its.map((it, x) => (x === i ? { ...it, ...p } : it)));

  async function pick(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    const picked = [...files];
    const start = items.length;

    setItems((its) => [
      ...its,
      ...picked.map<Item>((f) => ({
        fileName: f.name,
        objectUrl: track(URL.createObjectURL(f)),
        status: "pending",
        url: null,
        error: null,
        dishId: guessDish(f.name, options),
      })),
    ]);

    setUploading(true);
    // مؤشّر مشترك: كل عامل يسحب الملف التالي، فتبقى CONCURRENCY رفعات جارية.
    let next = 0;
    const worker = async () => {
      for (;;) {
        const i = next++;
        if (i >= picked.length) return;
        const file = picked[i];
        const at = start + i;
        const invalid = imageFileError(file);
        if (invalid) {
          patch(at, { status: "error", error: invalid });
          continue;
        }
        try {
          const blob = await compress(file, "square");
          const url = await uploadImage(
            "dish-images",
            `${restaurantId}/dishes/${uniqueName(blob)}`,
            blob
          );
          patch(at, { status: "done", url });
        } catch {
          // فشل صورة واحدة لا يُسقط الدفعة.
          patch(at, { status: "error", error: "تعذّر الرفع" });
        }
      }
    };
    await Promise.all([...Array(Math.min(CONCURRENCY, picked.length))].map(worker));
    setUploading(false);
  }

  const linked = items.filter((it) => it.status === "done" && it.url && it.dishId);
  const failed = items.filter((it) => it.status === "error").length;

  async function save() {
    if (!linked.length) return setError("لم تربط أي صورة بطبق.");
    setSaving(true);
    setError("");
    try {
      await onSave(linked.map((it) => ({ dishId: it.dishId, url: it.url! })));
      reset();
      onClose();
    } catch {
      setError("تعذّر الحفظ. حاول مجدداً.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={close} title="صور دفعة واحدة" wide>
      <div className="flex flex-col gap-4">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            void pick(e.target.files);
            e.target.value = "";
          }}
        />

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line py-10 text-center">
            <span className="text-4xl">🖼️</span>
            <p className="text-sm text-dim">
              اختر صور أطباقك كلها مرة واحدة — نضغطها ونرفعها، ثم تربط كل صورة بطبقها.
            </p>
            <Button onClick={() => inputRef.current?.click()}><Icon name="upload" size={16} /> اختر الصور</Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className="text-dim">
                {uploading
                  ? `جارٍ الرفع… ${items.filter((i) => i.status !== "pending").length} من ${items.length}`
                  : `${items.length} صورة · ${linked.length} مربوطة`}
                {failed > 0 && <span className="text-bad"> · {failed} فشلت</span>}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                  className="text-xs font-bold text-gold hover:underline disabled:opacity-50"
                >
                  ＋ أضِف صوراً
                </button>
                <button
                  onClick={reset}
                  disabled={uploading}
                  className="text-xs font-bold text-dim hover:text-ink disabled:opacity-50"
                >
                  ↺ ابدأ من جديد
                </button>
              </div>
            </div>

            <div className="grid max-h-[50dvh] gap-2 overflow-y-auto">
              {items.map((it, i) => (
                <div
                  key={`${it.fileName}-${i}`}
                  className="flex items-center gap-3 rounded-xl border border-line p-2"
                >
                  <SafeImage
                    src={it.objectUrl}
                    alt=""
                    className="h-14 w-14 rounded-lg object-cover"
                    wrapperClassName="h-14 w-14 shrink-0 rounded-lg bg-panel2 text-xl"
                    fallback="🖼️"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-faint" dir="ltr">
                      {it.fileName}
                    </p>
                    {it.status === "pending" ? (
                      <p className="mt-1 text-xs text-dim">⏳ جارٍ الرفع…</p>
                    ) : it.status === "error" ? (
                      <p className="inline-flex items-center gap-2 mt-1 text-xs text-bad">
          <Icon name="warn" size={17} className="shrink-0 text-gold" />{" "}
          {it.error}</p>
                    ) : (
                      <Select
                        value={it.dishId}
                        onChange={(e) => patch(i, { dishId: e.target.value })}
                        className="mt-1"
                        aria-label={`الطبق لصورة ${it.fileName}`}
                      >
                        <option value="">— لا تربطها —</option>
                        {options.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.image ? "🖼 " : "○ "}
                            {d.name}
                          </option>
                        ))}
                      </Select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {error && <ErrorNote>{error}</ErrorNote>}

        {items.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-faint">
              الصور المربوطة فقط تُحفظ؛ الباقي يُهمَل. الصورة تحلّ محلّ صورة الطبق الحالية.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={close} disabled={uploading || saving}>
                إلغاء
              </Button>
              <Button onClick={save} disabled={uploading || saving || !linked.length}>
                {saving ? "جارٍ الحفظ…" : `اربط ${linked.length} صورة`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

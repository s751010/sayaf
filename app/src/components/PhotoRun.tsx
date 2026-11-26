/**
 * «صوّر أطباقك» — طبقٌ واحد في كل مرّة، والكاميرا تنفتح مباشرة.
 *
 * ═══ لماذا ═══
 *
 * ٣ أطباق من ٦٥ في القاعدة كلّها لها صورة (٢٠٢٦/١١/٢٦). والرفع الدفعي
 * (`BulkImages`) يفترض صوراً جاهزة في الجوال — والتاجر غالباً لم يصوّر بعد.
 * هنا يقف أمام الطبق: يضغط، يصوّر، تُضغط الصورة وتُحفظ، وينتقل للتالي.
 *
 * كلّ صورة تُحفظ **وحدها فور رفعها** (`setDishImage`) — من يغلق بعد ثلاث صور
 * لا يخسر الثلاث. والترتيب الأهمّ فالأهمّ (`lib/photoRun.ts`).
 */
import { useMemo, useRef, useState } from "react";
import { Button, Modal, useToast } from "@/components/ui";
import { uploadImage } from "@/lib/api";
import { setDishImage } from "@/lib/data";
import { ACCEPT, compress, imageFileError, uniqueName, uploadErrorMessage } from "@/lib/image";
import { photoQueue } from "@/lib/photoRun";
import { Icon } from "@/lib/icons";
import { formatPrice } from "@/lib/utils";
import type { Dish } from "@/lib/types";

export function PhotoRun({
  open,
  onClose,
  dishes,
  restaurantId,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  dishes: Dish[];
  restaurantId: string;
  onSaved: (dishId: string, url: string) => void;
}) {
  // الطابور يُثبَّت عند الفتح: حفظ صورةٍ يُخرج طبقها من «بلا صورة»، ولو أُعيد
  // حسابه مع كل حفظ لقفز المؤشّر فوق طبقٍ لم يُصوَّر.
  // (`dishes` خارج الاعتماديات عمداً للسبب نفسه.)
  const queue = useMemo(() => (open ? photoQueue(dishes) : []), [open]);
  if (!open) return null;
  return (
    <Modal open onClose={onClose} title="صوّر أطباقك">
      <Run queue={queue} restaurantId={restaurantId} onSaved={onSaved} onClose={onClose} />
    </Modal>
  );
}

function Run({
  queue,
  restaurantId,
  onSaved,
  onClose,
}: {
  queue: Dish[];
  restaurantId: string;
  onSaved: (dishId: string, url: string) => void;
  onClose: () => void;
}) {
  const toast = useToast();
  const [i, setI] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [done, setDone] = useState(0);
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);

  const dish = queue[i];

  function next() {
    setError("");
    setPreview((p) => {
      if (p) URL.revokeObjectURL(p);
      return null;
    });
    setI((x) => x + 1);
  }

  async function onFile(file: File | undefined) {
    if (!file || !dish) return;
    const invalid = imageFileError(file);
    if (invalid) return setError(invalid);
    setBusy(true);
    setError("");
    try {
      const blob = await compress(file, "square");
      setPreview(URL.createObjectURL(blob));
      const url = await uploadImage("dish-images", `${restaurantId}/dishes/${uniqueName(blob)}`, blob);
      await setDishImage(dish.id, url);
      onSaved(dish.id, url);
      setDone((n) => n + 1);
      toast(`صورة «${dish.name}» انحفظت ✓`);
      window.setTimeout(next, 700);
    } catch (e) {
      setPreview(null);
      setError(uploadErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (queue.length === 0) {
    return (
      <div className="py-6 text-center">
        <Icon name="check" size={32} className="mx-auto text-good" />
        <p className="mt-2 font-bold text-ink">كل أطباقك لها صور 👌</p>
        <Button className="mt-4" onClick={onClose}>
          تمام
        </Button>
      </div>
    );
  }

  if (!dish) {
    return (
      <div className="py-6 text-center">
        <Icon name="check" size={32} className="mx-auto text-good" />
        <p className="mt-2 font-display text-lg font-black text-ink">
          {done === 0 ? "ما صوّرت شي هالمرة" : `خلصت — ${done} صورة انضافت لمنيوك`}
        </p>
        <p className="mt-1 text-sm text-dim">الصور تظهر لزبائنك الحين.</p>
        <Button className="mt-4" onClick={onClose}>
          تمام
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/8">
          <div className="h-full rounded-full bg-good transition-[width]" style={{ width: `${(i / queue.length) * 100}%` }} />
        </div>
        <span className="text-xs font-bold text-dim">
          {i + 1} من {queue.length}
        </span>
      </div>

      <div className="mt-5 flex flex-col items-center text-center">
        <div className="flex h-44 w-44 items-center justify-center overflow-hidden rounded-2xl border border-line bg-panel2">
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <Icon name="image" size={40} className="text-faint" />
          )}
        </div>
        <p className="mt-4 font-display text-xl font-black text-ink">{dish.name}</p>
        <p className="text-xs text-faint">
          {dish.category ?? "بدون تصنيف"} · {formatPrice(dish.price ?? 0)} ر.س
        </p>
        <p className="mt-2 text-[11px] text-faint">نصيحة: ضوء نهار، والطبق يملأ الصورة من فوق.</p>
      </div>

      {error && <p className="mt-3 text-center text-sm font-bold text-bad">{error}</p>}

      <div className="mt-5 flex flex-col gap-2">
        <input
          ref={camera}
          type="file"
          accept={ACCEPT}
          capture="environment"
          className="hidden"
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <input
          ref={gallery}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <Button className="w-full" busy={busy} busyText="يرفع…" onClick={() => camera.current?.click()}>
          <Icon name="image" size={17} /> صوّر الطبق
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" disabled={busy} onClick={() => gallery.current?.click()}>
            من الصور
          </Button>
          <Button variant="ghost" disabled={busy} onClick={next}>
            تخطّ ←
          </Button>
        </div>
      </div>
    </div>
  );
}

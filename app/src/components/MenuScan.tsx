/**
 * قراءة المنيو من صورة — **المدخل الثالث** إلى نفس أنبوب الاستيراد.
 *
 * ═══ لماذا لا يحفظ شيئاً بنفسه ═══
 *
 * ينتهي عمله عند `onRows()` فتتسلّمها شاشة المراجعة في `DishImport`. فلا
 * مسار حفظ جديد ولا تحقّق جديد — والنموذج مهما أخطأ لا يصل زبوناً قبل أن
 * يرى التاجر الصفّ ويقرّه.
 *
 * ⚠️ **ولهذا سببٌ مقاس لا مبدأ عام**: في قياسنا خلط `gemini-2.5-flash`
 * ثمانية أسعار **بين الأطباق** في منيو ذي عمودين — أعطى البرجر سعر المندي
 * والموهيتو سعر البرجر. كل رقم معقول، ولا شيء يبدو غلطاً. ذلك النوع من
 * الخطأ لا يمسكه إلا إنسان ينظر.
 *
 * ═══ ولماذا الحركة ═══
 *
 * القراءة تستغرق ثلاث ثوانٍ. ودوّارةٌ صامتة ثلاث ثوانٍ تُشعر أن شيئاً
 * تعطّل. فالشريط الماسح يقول «أنا أقرأ الآن»، والأصناف تظهر واحداً بعد
 * واحد فيرى التاجر **الشيء يُبنى** لا نتيجةً تهبط فجأة.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, ErrorNote } from "@/components/ui";
import { scanMenuImage, type ScannedItem } from "@/lib/data";
import { compress, imageFileError } from "@/lib/image";
import { normalizeCategory, suggestIcon, type ParsedRow } from "@/lib/import";
import { Icon, DishGlyph } from "@/lib/icons";

type Phase = "idle" | "reading" | "done" | "error";

export function MenuScan({
  restaurantId,
  knownCategories,
  onRows,
}: {
  restaurantId: string;
  knownCategories: string[];
  /** يسلّم الصفوف إلى شاشة المراجعة — ولا يحفظ شيئاً هنا. */
  onRows: (rows: ParsedRow[]) => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [found, setFound] = useState<ScannedItem[]>([]);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const timer = useRef<number | null>(null);

  // معاينة الصورة تعيش في الذاكرة — تُحرَّر كي لا تتراكم عبر محاولات.
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); }, []);

  const run = useCallback(
    async (file: File) => {
      const bad = imageFileError(file);
      if (bad) { setError(bad); setPhase("error"); return; }

      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(file));
      setFound([]);
      setError("");
      setPhase("reading");
      setElapsed(0);
      timer.current = window.setInterval(() => setElapsed((e) => e + 1), 1000);

      try {
        // نضغط قبل الرفع: صورة الجوال ٤ ميغابايت لا تُضيف دقّة وتُبطئ الرحلة.
        const blob = await compress(file, "wide");
        const items = await scanMenuImage(restaurantId, blob);
        if (timer.current) window.clearInterval(timer.current);

        if (!items.length) {
          setError("لم نتعرّف على أي صنف. صوّر المنيو كاملاً بإضاءة جيدة وبلا انعكاس.");
          setPhase("error");
          return;
        }
        // تظهر واحداً بعد واحد — التاجر يرى القراءة تُبنى لا تهبط.
        setPhase("done");
        items.forEach((it, i) =>
          window.setTimeout(() => setFound((f) => [...f, it]), Math.min(i * 55, 1800)),
        );
      } catch (e) {
        if (timer.current) window.clearInterval(timer.current);
        setError(
          e instanceof Error && e.message ? e.message : "تعذّرت القراءة. حاول مجدداً.",
        );
        setPhase("error");
      }
    },
    [preview, restaurantId],
  );

  /** يحوّل مخرَج النموذج إلى صفوف المراجعة — بنفس تطبيع التصنيفات. */
  function handOver() {
    const rows: ParsedRow[] = found.map((it, i) => {
      const category = it.category ? normalizeCategory(it.category, knownCategories) : null;
      return {
        name: it.name,
        price: it.price,
        category,
        description: it.description,
        emoji: suggestIcon(it.name),
        line: i + 1,
      };
    });
    onRows(rows);
  }

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = ""; // يسمح بإعادة اختيار نفس الملفّ بعد تعديله
    if (f) void run(f);
  };

  const missingPrice = found.filter((f) => f.price === null).length;

  return (
    <div className="flex flex-col gap-4">
      {/* ── منطقة الرفع ── */}
      {phase === "idle" || phase === "error" ? (
        <div className="rounded-2xl border border-dashed border-line-gold bg-gold/[0.04] p-6 text-center">
          <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/15 text-gold">
            <Icon name="sparkle" size={26} />
          </span>
          <p className="font-display text-lg font-black text-ink">صوّر منيوك وسنقرأه</p>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-muted">
            صورة للمنيو المطبوع — نستخرج الأصناف والأسعار والتصنيفات،
            وتراجعها قبل الحفظ.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-line bg-card px-4 py-3.5 text-sm font-bold text-ink transition-colors hover:border-line-gold">
              <Icon name="image" size={20} className="text-gold" />
              صوّر الآن
              <span className="text-[11px] font-normal text-faint">من كاميرا جوالك</span>
              {/* `capture` يفتح الكاميرا على الجوال ويُتجاهَل على سطح المكتب. */}
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={pick} />
            </label>
            <label className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-line bg-card px-4 py-3.5 text-sm font-bold text-ink transition-colors hover:border-line-gold">
              <Icon name="image" size={20} className="text-gold" />
              اختر صورة
              <span className="text-[11px] font-normal text-faint">من ملفّاتك</span>
              <input type="file" accept="image/*" className="hidden" onChange={pick} />
            </label>
          </div>
        </div>
      ) : null}

      {/* ── القراءة: الصورة يمسحها شريط، والعدّاد يطمئن ── */}
      {phase === "reading" && preview ? (
        <div className="flex flex-col items-center gap-3">
          <div className="scan-frame relative w-full max-w-xs overflow-hidden rounded-2xl border border-line-gold">
            <img src={preview} alt="" className="block w-full opacity-90" />
            <span className="scan-beam" aria-hidden="true" />
          </div>
          <p className="flex items-center gap-2 text-sm font-bold text-ink" role="status">
            <span className="scan-dot" aria-hidden="true" />
            نقرأ منيوك…
          </p>
          {/* بعد خمس ثوانٍ يبدأ الشكّ — نسبقه بكلمة بدل صمت. */}
          <p className="text-xs text-faint">
            {elapsed < 5 ? "عادةً أقل من خمس ثوانٍ" : "الخدمة مزدحمة قليلاً — ننتظر…"}
          </p>
        </div>
      ) : null}

      {/* ── الحصيلة ── */}
      {phase === "done" ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-base font-black text-ink">
              وجدنا <span className="text-gold">{found.length}</span> صنفاً
            </p>
            <button
              onClick={() => { setPhase("idle"); setFound([]); }}
              className="text-xs font-bold text-muted underline underline-offset-2 hover:text-ink"
            >
              صورة أخرى
            </button>
          </div>

          <ul className="max-h-64 overflow-y-auto rounded-xl border border-line">
            {found.map((f, i) => (
              <li
                key={i}
                className="anim-fade-up flex items-center gap-3 border-b border-line/60 px-3 py-2 last:border-0"
                style={{ animationDelay: `${Math.min(i * 40, 900)}ms` }}
              >
                <span className="w-6 shrink-0 text-center" aria-hidden="true">
                  <DishGlyph value={suggestIcon(f.name)} size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-ink">{f.name}</span>
                  {f.category && <span className="text-[11px] text-faint">{f.category}</span>}
                </span>
                <span
                  className={`shrink-0 text-sm font-black tabular-nums ${
                    f.price === null ? "text-red" : "text-ink"
                  }`}
                >
                  {f.price === null ? "بلا سعر" : `${f.price} ر.س`}
                </span>
              </li>
            ))}
          </ul>

          {/* ⚠️ التحذير مقصود وثابت: خطأ السعر في قياسنا كان **صامتاً
              ومعقولاً** — سعرُ طبقٍ آخر في مكان خاطئ. */}
          <p className="rounded-xl border border-line-gold bg-gold/[0.06] px-3.5 py-2.5 text-xs leading-relaxed text-ink">
            ⚠️ <b>راجع الأسعار قبل الحفظ.</b> القراءة الآلية قد تُزحزح سعراً بين
            صنفين في المنيوهات ذات العمودين — والرقم يبدو سليماً وهو لغيره.
            {missingPrice > 0 && ` و${missingPrice} صنفاً بلا سعر يحتاج تعبئة.`}
          </p>

          <Button onClick={handOver} disabled={!found.length}>
            راجع الأصناف ←
          </Button>
        </div>
      ) : null}

      {error ? <ErrorNote>{error}</ErrorNote> : null}
    </div>
  );
}

/**
 * استوديو بطاقات الكاشير — البطاقة جاهزة بهوية المطعم بدل أن يصمّمها التاجر.
 *
 * المشكلة التي يحلّها: صفحة الأكواد تعطي التاجر كوداً عارياً، ثم عليه أن يفتح
 * Canva أو يذهب لمصمّم ليضعه في ستاند يليق بمطعمه. كثيرون لا يقطعون تلك الخطوة
 * فيبقى الكود على ورقة A4 بيضاء على الطاولة — وهذا يضرّ صورة المطعم وصورتنا معاً.
 *
 * ⚠️ لا شيء يُخزَّن: البطاقة تُشتق كلياً من بيانات المطعم القائمة (الاسم،
 * الشعار، لون العلامة، طابع المنيو). فتغيير الشعار ينعكس على البطاقة فوراً بلا
 * إعادة توليد — ولا عمود جديد ولا ترحيل.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card, ErrorNote, Field, Input, useToast } from "@/components/ui";
import { PreviewMenuButton } from "@/components/site";
import {
  CARD_SIZES,
  CARD_STYLES,
  cardFileName,
  mmToPx,
  renderCard,
  sizeOf,
  type CardInput,
  type CardSizeId,
  type CardStyleId,
} from "@/lib/cards";
import { splitThemeId } from "@/lib/themes";
import { getMyMenus } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useDashboard } from "./Dashboard";
import { PrintTabs } from "./PrintTabs";

export default function Cards() {
  const { restaurant } = useDashboard();
  const toast = useToast();
  const previewRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<CardSizeId>("counter");
  const [style, setStyle] = useState<CardStyleId>("dark");
  const [table, setTable] = useState("");
  const [promo, setPromo] = useState("");
  const [headline, setHeadline] = useState("");
  const [busy, setBusy] = useState(false);
  const [drawing, setDrawing] = useState(true);
  /** طابع منيو التاجر — لنمط «ألوان منيوك». */
  const [themeId, setThemeId] = useState<string | null>(null);

  const slug = restaurant.slug?.trim() || null;
  const url = slug ? `${window.location.origin}/${slug}` : null;

  useEffect(() => {
    document.title = "بطاقاتي — كلاود منيو";
    // الطابع يعيش في `menus.theme` لا في المطعم، فنقرأ أول قائمة تحمل طابعاً.
    getMyMenus(restaurant.id)
      .then((ms) => setThemeId(splitThemeId(ms.find((m) => m.theme)?.theme ?? null).base))
      .catch(() => setThemeId(null));
  }, [restaurant.id]);

  const input: CardInput | null = url
    ? {
        size,
        style,
        name: restaurant.name,
        logo: restaurant.logo_image?.trim() || null,
        emoji: restaurant.logo?.trim() || null,
        themeId,
        brandHex: restaurant.cover_color,
        url,
        table: table.trim() || null,
        promo: promo.trim() || null,
        headline: headline.trim() || undefined,
      }
    : null;

  /** المعاينة والملف يُرسمان بنفس الدالة — معاينة بمنطق آخر تكذب على التاجر. */
  const draw = useCallback(async () => {
    const canvas = previewRef.current;
    if (!canvas || !input) return;
    setDrawing(true);
    try {
      // عامل تصغير يبقي المعاينة حادّة على الشاشة بلا رسم 1181×1772 لكل تغيير.
      await renderCard(canvas, input, 0.34);
    } finally {
      setDrawing(false);
    }
  }, [
    input?.size, input?.style, input?.name, input?.logo, input?.emoji,
    input?.themeId, input?.brandHex, input?.url, input?.table, input?.promo,
    input?.headline,
  ]);

  useEffect(() => {
    void draw();
  }, [draw]);

  async function downloadPng() {
    if (!input) return;
    setBusy(true);
    try {
      const canvas = document.createElement("canvas");
      await renderCard(canvas, input); // بدقة الطباعة الكاملة
      const href = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = href;
      a.download = cardFileName(slug, size, style);
      a.click();
      toast("نُزّلت البطاقة بدقة الطباعة ✓");
    } catch {
      toast("تعذّر التوليد. حاول مجدداً.", "err");
    } finally {
      setBusy(false);
    }
  }

  /** ورقة A4 جاهزة للقصّ — لمن يطبع بنفسه بدل الذهاب لمطبعة. */
  async function printSheet() {
    if (!input) return;
    setBusy(true);
    try {
      const meta = sizeOf(size);
      const canvas = document.createElement("canvas");
      await renderCard(canvas, input);
      const png = canvas.toDataURL("image/png");
      const w = window.open("", "_blank");
      if (!w) throw new Error("popup");
      const copies = [...Array(meta.perSheet)]
        .map(() => `<img src="${png}" alt="">`)
        .join("");
      w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<title>بطاقات للطباعة</title><style>
  @page{size:A4;margin:8mm}
  body{margin:0;display:flex;flex-wrap:wrap;gap:6mm;align-content:flex-start;justify-content:center}
  img{width:${meta.mm[0]}mm;height:${meta.mm[1]}mm;object-fit:contain;
      outline:1px dashed #ccc;outline-offset:2mm;break-inside:avoid}
</style></head><body>${copies}</body></html>`);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 500);
    } catch {
      toast("تعذّر فتح صفحة الطباعة — اسمح بالنوافذ المنبثقة.", "err");
    } finally {
      setBusy(false);
    }
  }

  const meta = sizeOf(size);
  const printPx = `${mmToPx(meta.mm[0])}×${mmToPx(meta.mm[1])}`;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-ink">بطاقاتي</h1>
          <p className="mt-1 text-sm text-dim">
            بطاقة كاشير جاهزة بهوية مطعمك — نزّلها واطبعها، بلا مصمّم.
          </p>
        </div>
        <PreviewMenuButton slug={slug} label="عاين منيوك" />
      </div>

      <PrintTabs />

      {!slug ? (
        <div className="mt-6">
          <ErrorNote>
            منيوك بلا رابط بعد — اضبطه من صفحة الإعدادات لتتمكّن من توليد بطاقتك.
          </ErrorNote>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_auto]">
          {/* عناصر التحكّم */}
          <div className="flex flex-col gap-5">
            <Card className="flex flex-col gap-3">
              <h2 className="font-display text-base font-extrabold text-ink">١. الشكل</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {CARD_SIZES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSize(s.id)}
                    aria-pressed={size === s.id}
                    className={cn(
                      "rounded-xl border px-3.5 py-3 text-start transition-colors",
                      size === s.id
                        ? "border-gold bg-gold/10"
                        : "border-line hover:border-line-gold"
                    )}
                  >
                    <span className="block text-sm font-bold text-ink">{s.name}</span>
                    <span className="mt-0.5 block text-xs text-faint">{s.desc}</span>
                    <span className="mt-1 block text-[11px] text-faint" dir="ltr">
                      {s.mm[0]}×{s.mm[1]} mm
                    </span>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="flex flex-col gap-3">
              <h2 className="font-display text-base font-extrabold text-ink">٢. النمط</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {CARD_STYLES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStyle(s.id)}
                    aria-pressed={style === s.id}
                    className={cn(
                      "rounded-xl border px-3.5 py-3 text-start transition-colors",
                      style === s.id
                        ? "border-gold bg-gold/10"
                        : "border-line hover:border-line-gold"
                    )}
                  >
                    <span className="block text-sm font-bold text-ink">{s.name}</span>
                    <span className="mt-0.5 block text-xs text-faint">{s.desc}</span>
                  </button>
                ))}
              </div>
              {!restaurant.logo_image?.trim() && (
                <p className="text-xs text-faint">
                  💡 ارفع شعار مطعمك من الإعدادات ليظهر على البطاقة وداخل الكود.
                </p>
              )}
            </Card>

            <Card className="grid gap-4 sm:grid-cols-2">
              <h2 className="font-display text-base font-extrabold text-ink sm:col-span-2">
                ٣. لمسات اختيارية
              </h2>
              <Field label="رقم الطاولة" hint="يفتح المنيو على هذه الطاولة">
                <Input
                  value={table}
                  onChange={(e) => setTable(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  inputMode="numeric"
                  placeholder="مثال: 5"
                />
              </Field>
              <Field label="سطر الدعوة" hint="يظهر فوق الكود">
                <Input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value.slice(0, 34))}
                  placeholder="امسح وتصفّح المنيو"
                />
              </Field>
              <Field label="عرض ترويجي" hint="اتركه فارغاً إن لم يكن لديك عرض" className="sm:col-span-2">
                <Input
                  value={promo}
                  onChange={(e) => setPromo(e.target.value.slice(0, 40))}
                  placeholder="قهوتك الثانية مجاناً ☕"
                />
              </Field>
            </Card>
          </div>

          {/* المعاينة */}
          <div className="lg:w-[340px]">
            <div className="lg:sticky lg:top-4">
              <Card className="flex flex-col items-center gap-4">
                <div className="relative">
                  <canvas
                    ref={previewRef}
                    className={cn(
                      "max-h-[62vh] w-auto max-w-full rounded-xl shadow-2xl transition-opacity",
                      drawing && "opacity-60"
                    )}
                    aria-label="معاينة البطاقة"
                  />
                </div>
                <div className="flex w-full flex-col gap-2">
                  <Button onClick={downloadPng} disabled={busy} className="w-full py-3">
                    {busy ? "جارٍ التجهيز…" : "⬇️ نزّل البطاقة"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={printSheet}
                    disabled={busy}
                    className="w-full"
                  >
                    🖨️ اطبع ورقة ({meta.perSheet} في A4)
                  </Button>
                </div>
                {/* المطبعة تسأل عن الدقة، فنكتبها بدل أن يخمّنها التاجر. */}
                <p className="text-center text-xs leading-relaxed text-faint">
                  ملف PNG بدقة <b className="text-dim">300 DPI</b> ({printPx} بكسل) —
                  يقبله أي مطبعة. اطلب طباعته على ورق مقوّى أو ستاند أكريليك.
                </p>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

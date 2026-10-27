/**
 * عدّة الطباعة بالطابع — ستاند الطاولة · ملصقات QR · بطاقة الكاونتر.
 *
 * ثلاث قطع جاهزة تلبس طابع المنيو كاملاً (ألوانه محلولةَ التباين، وخطّ عرضه،
 * وزخرفته، وحافّته المطبوعة) فوق محرّك الاستوديو نفسه (`renderCard`) — فما
 * يُعايَن هو ما يُطبع (§١٧). المنطق الخالص في `lib/printKit.ts`.
 *
 * ⚠️ **لا طباعة قبل النطاق** (قرار المالك ٢٠٢٦/١٠/٢٥): تُبنى القطع وتُعايَن
 * الآن، وزرّا التنزيل والطباعة مطفآن حتى يصير مضيف المنيو نطاقاً نهائياً
 * (`printGate`). الكود المطبوع لا يُحدَّث.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, ErrorNote, useToast } from "@/components/ui";
import { PreviewMenuButton } from "@/components/site";
import { mmToPx, renderCard, sizeOf, type CardInput } from "@/lib/cards";
import { KIT_PIECES, kitFileName, printGate, sheetHtml, type KitPiece } from "@/lib/printKit";
import { getTheme } from "@/lib/themes";
import { getMyMenus } from "@/lib/data";
import { MENU_DOMAIN, menuUrl } from "@/lib/menuUrl";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useDashboard, FeatureGate } from "./Dashboard";
import { PrintTabs } from "./Tabs";

/** الجدار في غلاف — كما في `Cards.tsx` (`hook-order.test.ts`). */
export default function PrintKit() {
  return (
    <FeatureGate
      feature="cards"
      title="عدّة الطباعة تُفتح بالاشتراك"
      desc="ستاند الطاولة وملصقات QR وبطاقة الكاونتر بطابع منيوك — جاهزة بدقّة 300 DPI. فعّل اشتراكك لتجهّزها."
    >
      <PrintKitInner />
    </FeatureGate>
  );
}

function PrintKitInner() {
  const { restaurant } = useDashboard();
  /**
   * طابع المنيو **كاملاً** بلونه (`طابع:#لون`) لا أساسه وحده: المنيو يلبس لون
   * العلامة من هنا، فالقطعة تلبسه من هنا أيضاً. `undefined` = يُحمَّل بعد.
   */
  const [theme, setTheme] = useState<string | null | undefined>(undefined);
  const [bleed, setBleed] = useState(false);

  const slug = restaurant.slug?.trim() || null;
  // ⚠️ رابط الكود من مصدره وحده — `location.origin` مضيف اللوحة لا المنيو.
  const url = menuUrl(slug);
  const gate = printGate(MENU_DOMAIN, url);

  useEffect(() => {
    document.title = "عدّة الطباعة — كلاود منيو";
    getMyMenus(restaurant.id)
      .then((ms) => setTheme(ms.find((m) => m.theme)?.theme ?? null))
      .catch(() => setTheme(null));
  }, [restaurant.id]);

  const themeName = theme === undefined ? null : getTheme(theme).name;

  const base = useMemo<Omit<CardInput, "size" | "layout"> | null>(
    () =>
      url && theme !== undefined
        ? {
            style: "brand",
            kit: true,
            name: restaurant.name,
            logo: restaurant.logo_image?.trim() || null,
            emoji: restaurant.logo?.trim() || null,
            themeId: theme,
            brandHex: null,
            url,
          }
        : null,
    [url, theme, restaurant.name, restaurant.logo_image, restaurant.logo]
  );

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-black text-ink">عدّة الطباعة</h1>
          <p className="mt-1 text-sm text-dim">
            ستاند الطاولة وملصقات QR وبطاقة الكاونتر — بطابع منيوك
            {themeName ? <> «{themeName}»</> : null} وشعارك، بلا مصمّم.
          </p>
        </div>
        <PreviewMenuButton slug={slug} label="عاين منيوك" />
      </div>

      <PrintTabs />

      {!slug ? (
        <div className="mt-6">
          <ErrorNote>منيوك بلا رابط بعد — اضبطه من صفحة الإعدادات لتتمكّن من تجهيز العدّة.</ErrorNote>
        </div>
      ) : (
        <>
          {!gate.ready && (
            <div
              id="kit-gate-note"
              role="note"
              className="mt-6 flex items-start gap-3 rounded-xl border border-line-gold bg-gold/10 p-4"
            >
              <Icon name="lock" size={20} className="mt-0.5 shrink-0 text-gold" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink">الطباعة تنتظر النطاق النهائي</p>
                <p className="mt-1 text-sm leading-relaxed text-dim">{gate.note}</p>
                {gate.host && (
                  <p className="mt-2 text-xs text-faint">
                    الكود اليوم يشير إلى{" "}
                    <bdi dir="ltr" className="break-all font-mono text-dim">
                      {gate.host}
                    </bdi>
                  </p>
                )}
              </div>
            </div>
          )}

          <label className="mt-5 flex cursor-pointer items-start gap-2.5 rounded-xl border border-line p-3">
            <input
              type="checkbox"
              checked={bleed}
              onChange={(e) => setBleed(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--c-gold)]"
            />
            <span>
              <span className="block text-sm font-bold text-ink">حدود قصّ للمطبعة (3mm)</span>
              <span className="mt-0.5 block text-xs text-faint">
                للملفّ الذي ترسله لمطبعة تقصّ بسكّين. ورقة «اطبع» على طابعة المكتب بلا حدود دائماً.
              </span>
            </span>
          </label>

          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {KIT_PIECES.map((piece) => (
              <PieceCard key={piece.id} piece={piece} base={base} bleed={bleed} ready={gate.ready} slug={slug} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PieceCard({
  piece,
  base,
  bleed,
  ready,
  slug,
}: {
  piece: KitPiece;
  base: Omit<CardInput, "size" | "layout"> | null;
  bleed: boolean;
  ready: boolean;
  slug: string;
}) {
  const toast = useToast();
  const ref = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(true);
  const [busy, setBusy] = useState(false);
  const meta = sizeOf(piece.size);
  const input: CardInput | null = base ? { ...base, size: piece.size, layout: piece.layout } : null;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !input) return;
    let live = true;
    setDrawing(true);
    // نفس الدالّة بعامل تصغير — المعاينة لا تكذب على التاجر (§١٧).
    renderCard(canvas, input, 0.3)
      .catch(() => undefined)
      .finally(() => live && setDrawing(false));
    return () => {
      live = false;
    };
    // `input` يُبنى كلّ رسمة؛ ما يغيّر الرسم هو `base` والقطعة.
  }, [base, piece.id]);

  async function full(withBleed: boolean): Promise<string> {
    const canvas = document.createElement("canvas");
    await renderCard(canvas, { ...input!, bleed: withBleed });
    return canvas.toDataURL("image/png");
  }

  async function download() {
    if (!input || !ready) return;
    setBusy(true);
    try {
      const a = document.createElement("a");
      a.href = await full(bleed);
      a.download = kitFileName(slug, piece.id, bleed);
      a.click();
    } catch {
      toast("تعذّر التوليد. حاول مجدداً.", "err");
    } finally {
      setBusy(false);
    }
  }

  async function print() {
    if (!input || !ready) return;
    setBusy(true);
    try {
      // طابعة المكتب لا تقصّ بسكّين — فلا حدود قصّ هنا (§١٧ النقطة ٩).
      const png = await full(false);
      const w = window.open("", "_blank");
      if (!w) throw new Error("popup");
      w.document.write(sheetHtml(png, meta.mm, piece.sheet ? meta.perSheet : 1, piece.name));
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 500);
    } catch {
      toast("تعذّر فتح صفحة الطباعة — اسمح بالنوافذ المنبثقة.", "err");
    } finally {
      setBusy(false);
    }
  }

  const sheetNote = piece.sheet ? `${meta.perSheet} في ورقة A4` : piece.size === "tent-a5" ? "يُطوى من المنتصف" : "واحدة في A4";

  return (
    <section data-kit-piece={piece.id} aria-label={piece.name}>
    <Card className="flex h-full flex-col gap-3">
      <div>
        <h2 className="font-display text-base font-extrabold text-ink">{piece.name}</h2>
        <p className="mt-0.5 text-xs text-faint">{piece.desc}</p>
        <p className="mt-1 text-[11px] text-faint">
          <span dir="ltr">
            {meta.mm[0]}×{meta.mm[1]} mm · {mmToPx(meta.mm[0])}×{mmToPx(meta.mm[1])} px · 300 DPI
          </span>{" "}
          · {sheetNote}
        </p>
      </div>

      <div className="relative flex justify-center rounded-xl bg-panel2 p-3">
        <canvas
          ref={ref}
          aria-label={`معاينة ${piece.name}`}
          className={cn(
            "h-auto max-h-[52vh] w-auto max-w-full rounded-md shadow-xl transition-opacity",
            drawing && "opacity-60"
          )}
        />
        {!ready && (
          <span className="pointer-events-none absolute end-4 top-4 rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold text-page">
            معاينة
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          className="flex-1"
          onClick={download}
          disabled={!ready || busy || !input}
          aria-describedby={ready ? undefined : "kit-gate-note"}
        >
          <Icon name="download" size={15} /> نزّل PNG
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={print}
          disabled={!ready || busy || !input}
          aria-describedby={ready ? undefined : "kit-gate-note"}
        >
          <Icon name="printer" size={15} /> اطبع
        </Button>
      </div>
    </Card>
    </section>
  );
}

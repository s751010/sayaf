/** استوديو QR — توليد أكواد للمنيو ولكل طاولة، وتنزيل PNG/SVG. */
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { qrDataUrl } from "@/lib/qr";
import { Button, Card, ErrorNote, Field, Input, Switch, useToast } from "@/components/ui";
import { PreviewMenuButton } from "@/components/site";
import { track } from "@/lib/track";
import { useDashboard } from "./Dashboard";
import { PrintTabs } from "./Tabs";
import { Icon } from "@/lib/icons";

function download(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
}

/**
 * اسم المطعم نص حر يكتبه التاجر ويُدرَج في مستند طباعة جديد؛ بدون تهريب، اسم
 * يحتوي < أو " يفسد الصفحة (أو أسوأ). ضرر ذاتي فقط، لكن لا سبب لتركه.
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default function Qr() {
  const { restaurant } = useDashboard();
  const toast = useToast();
  const [table, setTable] = useState("");
  const [dataUrl, setDataUrl] = useState("");
  const [batchBusy, setBatchBusy] = useState(false);
  const [tablesCount, setTablesCount] = useState("10");
  const [withLogo, setWithLogo] = useState(true);

  // slug قد يكون null نظرياً؛ توليد كود يشير إلى «/null» أسوأ من عدم توليده.
  const slug = restaurant.slug?.trim() || null;
  const url = useMemo(() => {
    if (!slug) return null;
    const base = `${window.location.origin}/${slug}`;
    return table.trim() ? `${base}?table=${encodeURIComponent(table.trim())}` : base;
  }, [slug, table]);

  useEffect(() => {
    document.title = "أكواد QR — كلاود منيو";
  }, []);

  const logo = withLogo ? (restaurant.logo_image?.trim() || null) : null;

  useEffect(() => {
    if (!url) return setDataUrl("");
    let active = true;
    qrDataUrl(url, logo)
      .then((d) => active && setDataUrl(d))
      .catch(() => active && setDataUrl(""));
    return () => {
      active = false;
    };
  }, [url, logo]);

  async function downloadSvg() {
    if (!url) return;
    let objectUrl: string | null = null;
    try {
      const svg = await QRCode.toString(url, { type: "svg", margin: 2 });
      const blob = new Blob([svg], { type: "image/svg+xml" });
      objectUrl = URL.createObjectURL(blob);
      download(objectUrl, `qr-${slug}${table ? `-table-${table}` : ""}.svg`);
      // نزّل كوداً ⇒ نيّة وضعه على طاولة. أقرب إشارة عندنا إلى «سيُستعمَل فعلاً».
      track("qr_downloaded");
    } catch {
      toast("تعذّر التوليد.", "err");
    } finally {
      // بدون تحرير، يبقى الـblob في الذاكرة حتى إغلاق التبويب.
      if (objectUrl) setTimeout(() => URL.revokeObjectURL(objectUrl!), 10_000);
    }
  }

  /** يولّد كود كل طاولة في صفحة طباعة واحدة (اطبعها وقصّها). */
  async function printBatch() {
    if (!url) return;
    const n = Math.min(Math.max(parseInt(tablesCount) || 0, 1), 100);
    setBatchBusy(true);
    try {
      const name = escapeHtml(restaurant.name);
      const cards = await Promise.all(
        [...Array(n)].map(async (_, i) => {
          const t = i + 1;
          const d = await qrDataUrl(`${window.location.origin}/${slug}?table=${t}`, logo, 480);
          return `<div class="card">
  <p class="brand">${name}</p>
  <img src="${d}" alt="">
  <p class="cta">امسح الكود لعرض المنيو</p>
  <p class="table">طاولة <b>${t}</b></p>
</div>`;
        })
      );
      const w = window.open("", "_blank");
      if (!w) throw new Error("popup blocked");
      /* بطاقة طاولة تُوضع أمام الزبون لا شبكةُ أكواد عارية: الاسم فوق ليعرف
         أنه في المكان الصحيح، وجملة تقول له ماذا يفعل (كثير من الزبائن لا
         يعرفون أن الكاميرا وحدها تكفي)، ورقم الطاولة أسفل ليقرأه الموظف.
         عمودان لا ثلاثة: البطاقة تُقصّ وتُوقَف على الطاولة فتحتاج حجماً. */
      w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>بطاقات الطاولات — ${name}</title>
<style>
  @page{margin:10mm}
  body{font-family:Tahoma,Arial,sans-serif;margin:0;display:grid;grid-template-columns:repeat(2,1fr);gap:8mm}
  .card{border:1.5px dashed #b9b2a4;border-radius:18px;padding:8mm 6mm;text-align:center;
        break-inside:avoid;display:flex;flex-direction:column;align-items:center;gap:3mm}
  .brand{font-size:17px;font-weight:900;margin:0;color:#141210;letter-spacing:.2px}
  .card img{width:100%;max-width:46mm;display:block}
  .cta{font-size:12px;margin:0;color:#5b5347}
  .table{font-size:13px;margin:0;color:#141210;border-top:1px solid #e6e1d8;padding-top:2.5mm;width:100%}
  .table b{font-size:20px;font-weight:900}
  @media print{.card{border-color:#ddd}}
</style></head><body>${cards.join("")}</body></html>`);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 400);
    } catch {
      toast("تعذّر فتح صفحة الطباعة — اسمح بالنوافذ المنبثقة.", "err");
    } finally {
      setBatchBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-ink">أكواد QR</h1>
          <p className="mt-1 text-sm text-dim">ولّد كود منيوك، أو كوداً خاصاً لكل طاولة.</p>
        </div>
        {/* عاين قبل الطباعة لا بعدها — الطباعة خطوة لا رجعة فيها عملياً. */}
        <PreviewMenuButton slug={slug} label="عاين قبل الطباعة" />
      </div>

      <PrintTabs />

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <Field
            label="رقم الطاولة (اختياري)"
            hint="يفتح المنيو مع تحديد رقم الطاولة تلقائياً"
          >
            <Input
              value={table}
              onChange={(e) => setTable(e.target.value.replace(/\D/g, "").slice(0, 3))}
              inputMode="numeric"
              placeholder="مثال: 5"
            />
          </Field>
          <Field label="الرابط">
            <Input
              value={url ?? ""}
              readOnly
              dir="ltr"
              placeholder="اضبط رابط المنيو من الإعدادات أولاً"
              onFocus={(e) => e.currentTarget.select()}
            />
          </Field>
          {!slug && (
            <ErrorNote>
              منيوك بلا رابط بعد — اضبطه من صفحة الإعدادات ليصبح توليد كود QR
              ممكناً.
            </ErrorNote>
          )}
          {restaurant.logo_image?.trim() && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-panel2 px-4 py-3">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-bold text-ink">
          <Icon name="tag" size={17} className="shrink-0 text-gold" />{" "}
          شعارك داخل الكود</p>
                <p className="text-xs text-faint">
                  يميّز كودك ويطمئن الزبون أنه كود مطعمك.
                </p>
              </div>
              <Switch checked={withLogo} onChange={setWithLogo} label="الشعار في الكود" />
            </div>
          )}
          {dataUrl && (
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() =>
                  download(dataUrl, `qr-${slug}${table ? `-table-${table}` : ""}.png`)
                }
              >
                <Icon name="download" size={15} /> PNG
              </Button>
              <Button variant="outline" className="flex-1" onClick={downloadSvg}>
                ⬇️ SVG
              </Button>
            </div>
          )}
          {dataUrl && logo && (
            <div>
              {/* SVG متجه للطباعة الكبيرة (لوحة، ستاند) ولا يحمل الشعار: دمج
                  صورة نقطية داخله يُفقده ميزته الوحيدة. نقولها بدل أن يكتشفها
                  التاجر بعد الطباعة. */}
              <p className="text-xs text-faint">
                ملاحظة: ملف SVG (للطباعة الكبيرة) يُصدَّر بلا شعار — استخدم PNG
                إن أردت الشعار داخل الكود.
              </p>
            </div>
          )}
        </Card>

        <Card className="flex items-center justify-center bg-white p-6">
          {dataUrl ? (
            <img src={dataUrl} alt="QR" className="h-auto w-full max-w-60" />
          ) : (
            <p className="text-sm text-faint">جارٍ التوليد…</p>
          )}
        </Card>
      </div>

      <Card className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <Field label="أكواد كل الطاولات دفعة واحدة" hint="صفحة طباعة جاهزة — اطبعها وقصّها" className="flex-1">
          <Input
            value={tablesCount}
            onChange={(e) => setTablesCount(e.target.value.replace(/\D/g, "").slice(0, 3))}
            inputMode="numeric"
            placeholder="عدد الطاولات"
            className="max-w-40"
          />
        </Field>
        <Button onClick={printBatch} disabled={batchBusy}>
          {batchBusy ? "جارٍ التجهيز…" : "طباعة الكل"}
        </Button>
      </Card>
    </div>
  );
}

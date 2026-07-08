/** استوديو QR — توليد أكواد للمنيو ولكل طاولة، وتنزيل PNG/SVG. */
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Button, Card, Field, Input, useToast } from "@/components/ui";
import { useDashboard } from "./Dashboard";

function download(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
}

export default function Qr() {
  const { restaurant } = useDashboard();
  const toast = useToast();
  const [table, setTable] = useState("");
  const [dataUrl, setDataUrl] = useState("");
  const [batchBusy, setBatchBusy] = useState(false);
  const [tablesCount, setTablesCount] = useState("10");

  const url = useMemo(() => {
    const base = `${window.location.origin}/${restaurant.slug}`;
    return table.trim() ? `${base}?table=${encodeURIComponent(table.trim())}` : base;
  }, [restaurant.slug, table]);

  useEffect(() => {
    document.title = "أكواد QR — كلاود منيو";
  }, []);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(url, {
      width: 640,
      margin: 2,
      color: { dark: "#141210", light: "#ffffff" },
    })
      .then((d) => active && setDataUrl(d))
      .catch(() => active && setDataUrl(""));
    return () => {
      active = false;
    };
  }, [url]);

  async function downloadSvg() {
    try {
      const svg = await QRCode.toString(url, { type: "svg", margin: 2 });
      const blob = new Blob([svg], { type: "image/svg+xml" });
      download(URL.createObjectURL(blob), `qr-${restaurant.slug}${table ? `-table-${table}` : ""}.svg`);
    } catch {
      toast("تعذّر التوليد.", "err");
    }
  }

  /** يولّد كود كل طاولة في صفحة طباعة واحدة (اطبعها وقصّها). */
  async function printBatch() {
    const n = Math.min(Math.max(parseInt(tablesCount) || 0, 1), 100);
    setBatchBusy(true);
    try {
      const cards = await Promise.all(
        [...Array(n)].map(async (_, i) => {
          const t = i + 1;
          const d = await QRCode.toDataURL(
            `${window.location.origin}/${restaurant.slug}?table=${t}`,
            { width: 480, margin: 2, color: { dark: "#141210", light: "#ffffff" } }
          );
          return `<div class="card"><img src="${d}"><p class="t">طاولة ${t}</p><p class="r">${restaurant.name}</p></div>`;
        })
      );
      const w = window.open("", "_blank");
      if (!w) throw new Error("popup blocked");
      w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>أكواد QR — ${restaurant.name}</title>
<style>
  body{font-family:Tahoma,Arial,sans-serif;margin:24px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
  .card{border:2px dashed #999;border-radius:16px;padding:14px;text-align:center;break-inside:avoid}
  .card img{width:100%;max-width:220px}
  .t{font-size:20px;font-weight:900;margin:6px 0 0}
  .r{font-size:12px;color:#666;margin:2px 0 0}
  @media print{.card{border-color:#ccc}}
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
      <h1 className="font-display text-2xl font-black text-ink">أكواد QR</h1>
      <p className="mt-1 text-sm text-dim">ولّد كود منيوك، أو كوداً خاصاً لكل طاولة.</p>

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
            <Input value={url} readOnly dir="ltr" onFocus={(e) => e.currentTarget.select()} />
          </Field>
          {dataUrl && (
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() =>
                  download(dataUrl, `qr-${restaurant.slug}${table ? `-table-${table}` : ""}.png`)
                }
              >
                ⬇️ PNG
              </Button>
              <Button variant="outline" className="flex-1" onClick={downloadSvg}>
                ⬇️ SVG
              </Button>
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
          {batchBusy ? "جارٍ التجهيز…" : "🖨️ طباعة الكل"}
        </Button>
      </Card>
    </div>
  );
}

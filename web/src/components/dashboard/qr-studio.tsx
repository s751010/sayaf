"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SITE_URL } from "@/lib/site";

export function QrStudio({ slug }: { slug: string }) {
  const [table, setTable] = useState("");
  const [dataUrl, setDataUrl] = useState("");

  const url = useMemo(() => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : SITE_URL;
    const base = `${origin}/${slug}`;
    return table.trim() ? `${base}?table=${encodeURIComponent(table.trim())}` : base;
  }, [slug, table]);

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

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="flex flex-col gap-4">
        <Field
          label="رقم الطاولة (اختياري)"
          htmlFor="table"
          hint="يفتح المنيو مع تحديد رقم الطاولة تلقائياً"
        >
          <Input
            id="table"
            value={table}
            onChange={(e) => setTable(e.target.value.replace(/\D/g, "").slice(0, 3))}
            inputMode="numeric"
            placeholder="مثال: 5"
          />
        </Field>

        <Field label="الرابط" htmlFor="url">
          <Input id="url" value={url} readOnly dir="ltr" />
        </Field>

        {dataUrl && (
          <a href={dataUrl} download={`qr-${slug}${table ? `-table-${table}` : ""}.png`}>
            <Button className="w-full">
              <Download size={16} /> تنزيل الكود (PNG)
            </Button>
          </a>
        )}
      </Card>

      <Card className="flex items-center justify-center bg-white p-6">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt="QR" className="h-auto w-full max-w-xs" />
        ) : (
          <p className="text-muted">جارٍ التوليد...</p>
        )}
      </Card>
    </div>
  );
}

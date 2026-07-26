"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { CreditCard, ShoppingCart } from "lucide-react";
import { formatPrice } from "@/lib/utils";

/** سطر في سلة الطلب — الطبق نفسه بخيارات مختلفة يظهر كسطرين مستقلين. */
export interface CartLine {
  key: string;
  /** معرّف الطبق — يُرسل للخادم ليعيد حساب السعر من قاعدة البيانات. */
  dishId: string;
  name: string;
  label?: string;
  unitPrice: number;
  qty: number;
  /** معرّفات الإضافات المختارة (فارغة لطبق بلا خيارات). */
  optionIds?: string[];
}

/** يطبّع رقم الجوال السعودي لصيغة wa.me (مطابق لمنطق النسخة القديمة). */
function waNumber(raw: string): string {
  let t = String(raw).replace(/\D/g, "");
  if (t.startsWith("00")) t = t.slice(2);
  return t.startsWith("966") ? t : "966" + t.replace(/^0/, "");
}

/** رقم الطاولة: من ?table= في الرابط، ويُحفظ في sessionStorage (مفتاح cm_table). */
export function useTableNumber(): string | null {
  const table = useSyncExternalStore(
    () => () => {},
    () =>
      new URLSearchParams(window.location.search).get("table") ||
      sessionStorage.getItem("cm_table"),
    () => null
  );
  useEffect(() => {
    if (table) sessionStorage.setItem("cm_table", table);
  }, [table]);
  return table;
}

function orderMessage(lines: CartLine[], total: number, table: string | null): string {
  const sep = "─".repeat(18);
  const head = `🛎️ *طلب جديد*` + (table ? ` — 🪑 طاولة ${table}` : "") + `\n${sep}\n`;
  const items = lines
    .map(
      (l, ix) =>
        `${ix + 1}. ${l.name}${l.label ? ` (${l.label})` : ""}\n    الكمية: ${l.qty} × ${l.unitPrice} = *${(l.unitPrice * l.qty).toFixed(1)} ر*`
    )
    .join("\n");
  return head + items + `\n${sep}\n💵 *الإجمالي: ${total.toFixed(1)} ريال*`;
}

export function CartBar({
  lines,
  lang = "ar",
  whatsapp,
  phone,
  restaurantId,
  onlinePayment = false,
  onChangeQty,
}: {
  lines: CartLine[];
  lang?: "ar" | "en";
  /** رقم واتساب المطعم (أولوية) ثم الهاتف. */
  whatsapp?: string | null;
  phone?: string | null;
  restaurantId: string;
  /** يظهر زر «ادفع الآن» فقط عندما يربط المطعم حساب PayLink ويفعّله. */
  onlinePayment?: boolean;
  onChangeQty: (key: string, delta: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const table = useTableNumber();
  const en = lang === "en";

  /**
   * لا يُرسل أي سعر — الخادم يعيد حساب الإجمالي من جدول الأصناف وخياراتها.
   * أي تلاعب بالسلة في المتصفح لا يغيّر المبلغ المطلوب.
   */
  async function payOnline() {
    setPaying(true);
    setPayError("");
    try {
      const res = await fetch("/api/order/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          table,
          items: lines.map((l) => ({
            dish_id: l.dishId,
            qty: l.qty,
            option_ids: l.optionIds ?? [],
          })),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.url) {
        setPayError(data.error ?? (en ? "Payment failed to start." : "تعذّر بدء الدفع."));
        setPaying(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setPayError(en ? "Connection problem." : "تعذّر الاتصال.");
      setPaying(false);
    }
  }

  const count = lines.reduce((s, l) => s + l.qty, 0);
  const total = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  if (count === 0) return null;

  const target = whatsapp || phone;
  const waHref = target
    ? `https://wa.me/${waNumber(target)}?text=${encodeURIComponent(orderMessage(lines, total, table))}`
    : null;

  return (
    <>
      {/* الشريط العائم */}
      <div className="fixed inset-x-0 bottom-4 z-[900] flex justify-center px-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full max-w-md items-center justify-between rounded-2xl px-5 py-3.5 font-bold shadow-2xl transition-transform hover:scale-[1.02]"
          style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
        >
          <span className="flex items-center gap-2">
            <ShoppingCart size={18} />
            {en ? "View order" : "عرض الطلب"}
            <span
              className="rounded-full px-2 py-0.5 text-xs font-black"
              style={{ background: "var(--m-on-accent)", color: "var(--m-accent)" }}
            >
              {count}
            </span>
          </span>
          <span className="font-black">
            {formatPrice(total)} {en ? "SAR" : "ر.س"}
          </span>
        </button>
      </div>

      {/* لوحة السلة */}
      {open && (
        <div
          className="fixed inset-0 z-[950] flex items-end justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-t-3xl p-5 pb-8"
            style={{ background: "var(--m-surface)", color: "var(--m-text)" }}
            onClick={(e) => e.stopPropagation()}
            dir={en ? "ltr" : "rtl"}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-extrabold" style={{ fontFamily: "var(--m-font)" }}>
                🛒 {en ? "Your order" : "سلة الطلب"}
                {table && (
                  <span className="ms-2 text-xs font-bold" style={{ color: "var(--m-muted)" }}>
                    🪑 {en ? "Table" : "طاولة"} {table}
                  </span>
                )}
              </p>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
                style={{ background: "var(--m-bg-2)", color: "var(--m-text)" }}
                aria-label={en ? "Close" : "إغلاق"}
              >
                ×
              </button>
            </div>

            {lines.map((l) => (
              <div
                key={l.key}
                className="flex items-center gap-3 border-b py-2.5 last:border-0"
                style={{ borderColor: "var(--m-border)" }}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{l.name}</p>
                  {l.label && (
                    <p className="truncate text-xs" style={{ color: "var(--m-muted)" }}>
                      {l.label}
                    </p>
                  )}
                  <p className="text-xs font-semibold" style={{ color: "var(--m-accent)" }}>
                    {formatPrice(l.unitPrice)} {en ? "SAR" : "ر.س"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onChangeQty(l.key, -1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-base"
                    style={{ background: "var(--m-bg-2)", color: "var(--m-text)" }}
                    aria-label="-"
                  >
                    −
                  </button>
                  <span className="min-w-5 text-center text-sm font-bold">{l.qty}</span>
                  <button
                    type="button"
                    onClick={() => onChangeQty(l.key, 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-base"
                    style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
                    aria-label="+"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}

            <div
              className="mt-3 flex items-center justify-between border-t pt-3.5"
              style={{ borderColor: "var(--m-border)" }}
            >
              <span className="text-sm font-bold">{en ? "Total" : "الإجمالي"}</span>
              <span className="text-xl font-black" style={{ color: "var(--m-accent)" }}>
                {formatPrice(total)} {en ? "SAR" : "ريال"}
              </span>
            </div>

            {onlinePayment && (
              <>
                <button
                  type="button"
                  onClick={payOnline}
                  disabled={paying}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-bold shadow-lg transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
                >
                  <CreditCard size={17} />
                  {paying
                    ? en
                      ? "Redirecting…"
                      : "جارٍ التحويل…"
                    : en
                      ? "Pay now"
                      : "ادفع الآن"}
                </button>
                {payError && (
                  <p className="mt-2 text-center text-xs" style={{ color: "#ef5350" }}>
                    {payError}
                  </p>
                )}
              </>
            )}

            {waHref ? (
              <a
                href={waHref}
                target="_blank"
                rel="noreferrer"
                className="mt-3 block w-full rounded-2xl bg-[#25D366] py-3.5 text-center text-[15px] font-bold text-white shadow-lg transition-opacity hover:opacity-90"
              >
                📲 {en ? "Send order on WhatsApp" : "أرسل الطلب على واتساب"}
              </a>
            ) : (
              !onlinePayment && (
                <p className="mt-4 text-center text-xs" style={{ color: "var(--m-muted)" }}>
                  {en
                    ? "Show this order to the staff to confirm."
                    : "أظهر هذا الطلب للموظف لتأكيده."}
                </p>
              )
            )}
          </div>
        </div>
      )}
    </>
  );
}

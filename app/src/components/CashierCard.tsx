/**
 * بطاقة «رمز الكاشير» في لوحة التاجر.
 *
 * تولّد رمزاً وتعرضه **مرة واحدة فقط** — لا نخزّن إلا هاشه، فلا سبيل لإظهاره
 * لاحقاً. من نسيه يولّد غيره، والقديم يبطل فوراً.
 */
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Badge, Button, Card, ErrorNote, useToast } from "@/components/ui";
import {
  deleteStaffPin,
  getStaffPin,
  newStaffPin,
  setStaffPin,
  type StaffPinRow,
} from "@/lib/data";
import { formatDate } from "@/lib/utils";
import type { Restaurant } from "@/lib/types";
import { Icon } from "@/lib/icons";

export function CashierCard({ restaurant }: { restaurant: Restaurant }) {
  const toast = useToast();
  const [row, setRow] = useState<StaffPinRow | null | undefined>(undefined);
  const [fresh, setFresh] = useState<string | null>(null);
  const [qr, setQr] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const url = restaurant.slug
    ? `${window.location.origin}/stamp?m=${encodeURIComponent(restaurant.slug)}`
    : null;

  useEffect(() => {
    getStaffPin(restaurant.id)
      .then(setRow)
      .catch(() => setRow(null));
  }, [restaurant.id]);

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, { width: 420, margin: 2, color: { dark: "#141210", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(""));
  }, [url]);

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const pin = newStaffPin();
      await setStaffPin(restaurant.id, pin);
      setFresh(pin);
      setRow(await getStaffPin(restaurant.id));
      toast("أُنشئ رمز الكاشير ✓");
    } catch {
      setError("تعذّر إنشاء الرمز. حاول مجدداً.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    if (!window.confirm("تعطيل رمز الكاشير؟ لن يستطيع أحد الختم حتى تنشئ رمزاً جديداً.")) return;
    setBusy(true);
    try {
      await deleteStaffPin(restaurant.id);
      setRow(null);
      setFresh(null);
      toast("عُطّل رمز الكاشير.");
    } catch {
      setError("تعذّر التعطيل.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mt-5 flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="inline-flex items-center gap-2 font-display text-lg font-extrabold text-ink">
          <Icon name="card" size={17} className="shrink-0 text-gold" />{" "}
          رمز الكاشير</h2>
          <p className="mt-1 text-sm leading-relaxed text-dim">
            يفتح الكاشير صفحة الختم برمز خاص، فيبحث عن الزبون ويختم بطاقته — بلا
            وصول لأطباقك أو إعداداتك أو قائمة زبائنك.
          </p>
        </div>
        {row !== undefined && (
          <Badge variant={row ? "green" : "neutral"}>{row ? "مفعّل" : "غير مفعّل"}</Badge>
        )}
      </div>

      {!restaurant.slug && (
        <ErrorNote>اضبط رابط منيوك أولاً من الإعدادات ليعمل وضع الكاشير.</ErrorNote>
      )}

      {/* الرمز يظهر مرة واحدة — لا نخزّن إلا هاشه. */}
      {fresh && (
        <div className="rounded-2xl border border-gold/40 bg-gold/[.06] p-4 text-center">
          <p className="text-xs font-bold text-dim">الرمز — اكتبه الآن، لن يظهر مرة أخرى</p>
          <p className="mt-2 font-display text-3xl font-black tracking-[0.25em] text-gold" dir="ltr">
            {fresh}
          </p>
          <button
            onClick={() =>
              navigator.clipboard?.writeText(fresh).then(
                () => toast("نُسخ الرمز ✓"),
                () => toast("تعذّر النسخ", "err")
              )
            }
            className="mt-3 rounded-xl border border-line-gold px-4 py-2 text-xs font-bold text-ink hover:bg-gold/10"
          >
            <Icon name="copy" size={15} /> نسخ الرمز
          </button>
        </div>
      )}

      {row && url && (
        <div className="flex flex-wrap items-center gap-4">
          {qr && (
            <img
              src={qr}
              alt="كود صفحة الكاشير"
              className="h-28 w-28 rounded-xl border border-line bg-white p-1"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-dim">رابط صفحة الكاشير</p>
            <p className="truncate text-sm text-gold" dir="ltr">
              {url}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() =>
                  navigator.clipboard?.writeText(url).then(
                    () => toast("نُسخ الرابط ✓"),
                    () => toast("تعذّر النسخ", "err")
                  )
                }
                className="rounded-xl border border-line-gold px-3 py-1.5 text-xs font-bold text-ink hover:bg-gold/10"
              >
                <Icon name="copy" size={15} /> نسخ الرابط
              </button>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-line px-3 py-1.5 text-xs font-bold text-dim hover:text-ink"
              >
                فتح ↗
              </a>
            </div>
            <p className="mt-2 text-xs text-faint">
              {row.last_used_at
                ? `آخر استخدام: ${formatDate(row.last_used_at)}`
                : "لم يُستخدم بعد"}
              {row.locked_until && new Date(row.locked_until) > new Date() && (
                <span className="text-bad"> · مقفل مؤقتاً بعد محاولات خاطئة</span>
              )}
            </p>
          </div>
        </div>
      )}

      {error && <ErrorNote>{error}</ErrorNote>}

      <div className="flex flex-wrap gap-2">
        <Button onClick={generate} disabled={busy || !restaurant.slug}>
          {row ? "🔄 رمز جديد" : "＋ أنشئ رمز الكاشير"}
        </Button>
        {row && (
          <Button variant="ghost" onClick={disable} disabled={busy}>
            تعطيل
          </Button>
        )}
      </div>
      {row && (
        <p className="text-xs text-faint">
          الرمز الجديد يُبطل السابق فوراً — استخدمه إن ترك أحد الموظفين العمل.
        </p>
      )}
    </Card>
  );
}

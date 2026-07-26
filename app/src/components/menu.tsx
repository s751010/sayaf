/**
 * مكوّنات صفحة المنيو العامة (ما يراه الزبون من كود QR):
 * استبيان التقييم، اختيار خيارات الطبق، وسلة الطلب.
 *
 * كلها تُلوَّن بمتغيرات ثيم القائمة `--m-*` ولا تستخدم نظام ألوان اللوحة،
 * لأن المطعم يختار ثيمه بنفسه.
 */
import { useEffect, useMemo, useState } from "react";
import { createOrderInvoice } from "@/lib/api";
import { submitSurvey } from "@/lib/data";
import { parseDishOptions, type DishOptionGroup } from "@/lib/options";
import { SCORE_MAX, SURVEY_QUESTIONS } from "@/lib/survey";
import type { Dish } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

/** يقفل تمرير الصفحة خلف أي نافذة منبثقة ويغلقها بمفتاح Escape. */
function useModalChrome(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
}

function Sheet({
  onClose,
  children,
  label,
}: {
  onClose: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div
      className="fixed inset-0 z-[950] flex items-end justify-center bg-black/65 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        className="anim-fade-up max-h-[92dvh] w-full max-w-lg overflow-y-auto border p-5"
        style={{
          background: "var(--m-bg-2)",
          borderColor: "var(--m-border)",
          borderRadius: "calc(var(--m-radius) * 1.4)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── استبيان رضا الزبون ───────────────────────────────────────────── */

/**
 * زر «قيّم تجربتك» + نافذة الاستبيان.
 *
 * بخلاف النسخة القديمة: لا تُعرض «تم الإرسال» إلا بعد نجاح فعلي، والفشل يظهر
 * للزبون مع إمكانية إعادة المحاولة بدل ابتلاعه بصمت.
 */
export function SurveyButton({ restaurantId, en }: { restaurantId: string; en: boolean }) {
  const [open, setOpen] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useModalChrome(open, () => setOpen(false));

  async function send() {
    setBusy(true);
    setError("");
    try {
      await submitSurvey({ restaurantId, answers: scores, note });
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error && /تقييم|ملاحظة/.test(err.message)
          ? err.message
          : en
            ? "Couldn't send your rating. Try again."
            : "تعذّر إرسال التقييم. حاول مرة أخرى."
      );
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-bold transition-transform hover:scale-[1.03]"
        style={{
          borderColor: "var(--m-border)",
          background: "var(--m-surface)",
          color: "var(--m-text)",
        }}
      >
        <span style={{ color: "var(--m-accent)" }}>★</span>
        {en ? "Rate your visit" : "قيّم تجربتك"}
      </button>
    );
  }

  const answered = Object.keys(scores).length;

  return (
    <Sheet onClose={() => setOpen(false)} label={en ? "Rate your visit" : "تقييم التجربة"}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="text-lg font-black" style={{ color: "var(--m-text)", fontFamily: "var(--m-font)" }}>
          {done
            ? en ? "Thank you!" : "شكراً لك!"
            : en ? "How was your visit?" : "كيف كانت تجربتك؟"}
        </h3>
        <button
          onClick={() => setOpen(false)}
          aria-label={en ? "Close" : "إغلاق"}
          className="text-xl leading-none"
          style={{ color: "var(--m-muted)" }}
        >
          ✕
        </button>
      </div>

      {done ? (
        <div className="py-8 text-center">
          <span className="text-5xl">🎉</span>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--m-muted)" }}>
            {en
              ? "Your feedback reached the restaurant. We appreciate it."
              : "وصل تقييمك للمطعم. نقدّر لك وقتك."}
          </p>
          <button
            onClick={() => setOpen(false)}
            className="mt-6 w-full rounded-xl py-3 text-sm font-black"
            style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
          >
            {en ? "Done" : "تم"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {SURVEY_QUESTIONS.map((q) => (
            <div key={q.id}>
              <p className="mb-2 text-sm font-bold" style={{ color: "var(--m-text)" }}>
                {q.icon} {en ? q.labelEn : q.label}
              </p>
              <div className="flex gap-1.5" role="group" aria-label={en ? q.labelEn : q.label}>
                {Array.from({ length: SCORE_MAX }, (_, i) => i + 1).map((value) => {
                  const active = (scores[q.id] ?? 0) >= value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-label={`${value}`}
                      aria-pressed={active}
                      onClick={() => setScores((s) => ({ ...s, [q.id]: value }))}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border text-base transition-transform hover:scale-110"
                      style={{
                        borderColor: active ? "var(--m-accent)" : "var(--m-border)",
                        background: active ? "color-mix(in srgb, var(--m-accent) 15%, transparent)" : "transparent",
                        color: active ? "var(--m-accent)" : "var(--m-muted)",
                      }}
                    >
                      ★
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <label className="block">
            <span className="mb-1.5 block text-sm font-bold" style={{ color: "var(--m-text)" }}>
              {en ? "Anything to add? (optional)" : "ملاحظة إضافية؟ (اختياري)"}
            </span>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border p-3 text-sm outline-none"
              style={{
                background: "var(--m-bg)",
                borderColor: "var(--m-border)",
                color: "var(--m-text)",
              }}
            />
          </label>

          {error && (
            <p className="rounded-xl px-3 py-2 text-sm" style={{ background: "#ef535022", color: "#ef5350" }}>
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={send}
            disabled={busy || answered === 0}
            className="w-full rounded-xl py-3 text-sm font-black disabled:opacity-50"
            style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
          >
            {busy
              ? en ? "Sending…" : "جارٍ الإرسال…"
              : en ? "Send rating" : "إرسال التقييم"}
          </button>
        </div>
      )}
    </Sheet>
  );
}

/* ── سلة الطلب ────────────────────────────────────────────────────── */

/** سطر في السلة — نفس الطبق بخيارات مختلفة يظهر كسطرين مستقلين. */
export interface CartLine {
  key: string;
  dishId: string;
  name: string;
  label?: string;
  unitPrice: number;
  qty: number;
  optionIds: string[];
}

/** يطبّع رقم الجوال السعودي لصيغة wa.me (مطابق لمنطق النسخة القديمة). */
function waNumber(raw: string): string {
  let t = String(raw).replace(/\D/g, "");
  if (t.startsWith("00")) t = t.slice(2);
  return t.startsWith("966") ? t : "966" + t.replace(/^0/, "");
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

/** نافذة اختيار خيارات الطبق قبل إضافته للسلة. */
export function DishOptionsSheet({
  dish,
  en,
  onClose,
  onAdd,
}: {
  dish: Dish;
  en: boolean;
  onClose: () => void;
  onAdd: (line: Omit<CartLine, "qty">) => void;
}) {
  const groups = useMemo(() => parseDishOptions(dish.options), [dish.options]);
  const [picked, setPicked] = useState<Record<string, string[]>>(() => defaultPicks(groups));

  useModalChrome(true, onClose);

  const chosen = groups.flatMap((g) =>
    g.items.filter((it) => (picked[g.id] ?? []).includes(it.id))
  );
  const extra = chosen.reduce((s, it) => s + it.price, 0);
  const unitPrice = (dish.price ?? 0) + extra;
  const missing = groups.filter((g) => g.required && (picked[g.id] ?? []).length === 0);

  function toggle(group: DishOptionGroup, itemId: string) {
    setPicked((state) => {
      const current = state[group.id] ?? [];
      if (group.type === "single") return { ...state, [group.id]: [itemId] };
      return {
        ...state,
        [group.id]: current.includes(itemId)
          ? current.filter((id) => id !== itemId)
          : [...current, itemId],
      };
    });
  }

  function add() {
    const optionIds = chosen.map((it) => it.id);
    onAdd({
      key: [dish.id, ...optionIds].join("|"),
      dishId: dish.id,
      name: en && dish.name_en ? dish.name_en : dish.name,
      label: chosen.map((it) => (en && it.name_en ? it.name_en : it.name)).join("، ") || undefined,
      unitPrice,
      optionIds,
    });
    onClose();
  }

  return (
    <Sheet onClose={onClose} label={en ? "Choose options" : "اختر الإضافات"}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="text-lg font-black" style={{ color: "var(--m-text)", fontFamily: "var(--m-font)" }}>
          {en && dish.name_en ? dish.name_en : dish.name}
        </h3>
        <button onClick={onClose} aria-label={en ? "Close" : "إغلاق"} className="text-xl leading-none" style={{ color: "var(--m-muted)" }}>
          ✕
        </button>
      </div>

      <div className="flex flex-col gap-5">
        {groups.map((g) => (
          <div key={g.id}>
            <p className="mb-2 text-sm font-bold" style={{ color: "var(--m-text)" }}>
              {en && g.name_en ? g.name_en : g.name}
              {g.required && <span style={{ color: "var(--m-accent)" }}> *</span>}
              <span className="ms-2 text-xs font-normal" style={{ color: "var(--m-muted)" }}>
                {g.type === "single" ? (en ? "choose one" : "اختر واحداً") : en ? "multiple" : "متعدد"}
              </span>
            </p>
            <div className="flex flex-col gap-1.5">
              {g.items.map((it) => {
                const active = (picked[g.id] ?? []).includes(it.id);
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => toggle(g, it.id)}
                    aria-pressed={active}
                    className="flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm transition-colors"
                    style={{
                      borderColor: active ? "var(--m-accent)" : "var(--m-border)",
                      background: active ? "color-mix(in srgb, var(--m-accent) 12%, transparent)" : "transparent",
                      color: "var(--m-text)",
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="flex h-4 w-4 items-center justify-center rounded-full border text-[10px]"
                        style={{ borderColor: active ? "var(--m-accent)" : "var(--m-border)", color: "var(--m-accent)" }}
                      >
                        {active ? "✓" : ""}
                      </span>
                      {en && it.name_en ? it.name_en : it.name}
                    </span>
                    {it.price > 0 && (
                      <span style={{ color: "var(--m-accent)" }}>+{formatPrice(it.price)} {en ? "SAR" : "ر.س"}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        disabled={missing.length > 0}
        className="mt-6 flex w-full items-center justify-between rounded-xl px-5 py-3 text-sm font-black disabled:opacity-50"
        style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
      >
        <span>
          {missing.length > 0
            ? en ? "Choose required options" : "اختر الخيارات المطلوبة"
            : en ? "Add to order" : "أضف للطلب"}
        </span>
        <span>{formatPrice(unitPrice)} {en ? "SAR" : "ر.س"}</span>
      </button>
    </Sheet>
  );
}

function defaultPicks(groups: DishOptionGroup[]): Record<string, string[]> {
  const picks: Record<string, string[]> = {};
  for (const g of groups) {
    // المجموعة المطلوبة أحادية الاختيار تبدأ بأول خيار حتى لا يعلق الزبون.
    if (g.required && g.type === "single" && g.items[0]) picks[g.id] = [g.items[0].id];
  }
  return picks;
}

/** الشريط العائم + لوحة السلة + إرسال الطلب (واتساب أو دفع إلكتروني). */
export function CartBar({
  lines,
  en,
  whatsapp,
  phone,
  restaurantId,
  onlinePayment,
  table,
  onChangeQty,
  onClear,
}: {
  lines: CartLine[];
  en: boolean;
  whatsapp: string | null;
  phone: string | null;
  restaurantId: string;
  onlinePayment: boolean;
  table: string | null;
  onChangeQty: (key: string, delta: number) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  useModalChrome(open, () => setOpen(false));

  const count = lines.reduce((s, l) => s + l.qty, 0);
  const total = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  if (count === 0) return null;

  const target = whatsapp || phone;
  const waHref = target
    ? `https://wa.me/${waNumber(target)}?text=${encodeURIComponent(orderMessage(lines, total, table))}`
    : null;

  async function payOnline() {
    setPaying(true);
    setPayError("");
    try {
      const { url } = await createOrderInvoice({
        restaurantId,
        table,
        items: lines.map((l) => ({ dish_id: l.dishId, qty: l.qty, option_ids: l.optionIds })),
      });
      window.location.href = url;
    } catch (err) {
      setPayError(
        err instanceof Error && err.message
          ? err.message
          : en ? "Payment failed to start." : "تعذّر بدء الدفع."
      );
      setPaying(false);
    }
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-4 z-[900] flex justify-center px-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full max-w-md items-center justify-between rounded-2xl px-5 py-3.5 font-bold shadow-2xl transition-transform hover:scale-[1.02]"
          style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
        >
          <span className="flex items-center gap-2">
            🛒 {en ? "View order" : "عرض الطلب"}
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

      {open && (
        <div
          className="fixed inset-0 z-[950] flex items-end justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="max-h-[80dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl p-5 pb-8"
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
                ✕
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
                  className="mt-4 w-full rounded-2xl py-3.5 text-[15px] font-bold shadow-lg transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
                >
                  💳 {paying ? (en ? "Redirecting…" : "جارٍ التحويل…") : en ? "Pay now" : "ادفع الآن"}
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

            <button
              type="button"
              onClick={() => {
                onClear();
                setOpen(false);
              }}
              className="mt-3 w-full py-2 text-xs font-bold underline"
              style={{ color: "var(--m-muted)" }}
            >
              {en ? "Clear order" : "تفريغ السلة"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

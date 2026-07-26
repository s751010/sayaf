/** تذاكر الدعم — قراءة، ردّ، وتغيير الحالة. */
import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  ErrorNote,
  Field,
  Skeleton,
  Textarea,
  useToast,
} from "@/components/ui";
import { founderAdmin } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { SupportTicket } from "@/lib/types";

const FILTERS = [
  { id: "open", label: "مفتوحة" },
  { id: "all", label: "الكل" },
  { id: "closed", label: "مغلقة" },
] as const;

export default function FounderTickets() {
  const toast = useToast();
  const [rows, setRows] = useState<SupportTicket[] | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("open");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setRows(
      await founderAdmin<SupportTicket[]>("support_tickets?select=*&order=created_at.desc&limit=200")
    );
  }, []);

  useEffect(() => {
    load().catch(() => setRows([]));
  }, [load]);

  const visible = (rows ?? []).filter((t) =>
    filter === "all" ? true : filter === "open" ? t.status === "open" : t.status !== "open"
  );

  async function patch(t: SupportTicket, body: Record<string, unknown>, msg: string) {
    setBusy(true);
    setError("");
    try {
      await founderAdmin(`support_tickets?id=eq.${t.id}`, { method: "PATCH", body });
      await load();
      toast(msg);
      setReplyTo(null);
      setReply("");
    } catch {
      setError("تعذّر تحديث التذكرة.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-black text-ink">تذاكر الدعم</h1>
        <div className="flex rounded-xl border border-line bg-panel2 p-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-bold transition-colors ${
                filter === f.id ? "bg-gold text-on-gold" : "text-dim hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}

      {rows === null ? (
        <Skeleton className="mt-6 h-64" />
      ) : visible.length === 0 ? (
        <Card className="mt-6 py-10 text-center text-sm text-dim">لا توجد تذاكر هنا.</Card>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {visible.map((t) => (
            <Card key={t.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-ink">{t.subject}</p>
                  <p className="mt-0.5 text-xs text-faint">
                    {t.restaurant_name && <>{t.restaurant_name} · </>}
                    {t.email && <span dir="ltr">{t.email} · </span>}
                    {formatDate(t.created_at)}
                  </p>
                </div>
                <Badge variant={t.status === "open" ? "red" : "green"}>
                  {t.status === "open" ? "مفتوحة" : "مغلقة"}
                </Badge>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-dim">{t.message}</p>

              {t.admin_reply && (
                <div className="mt-3 rounded-xl border border-gold/25 bg-gold/[.06] p-3">
                  <p className="text-xs font-black text-gold">ردّك</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                    {t.admin_reply}
                  </p>
                </div>
              )}

              {replyTo === t.id ? (
                <div className="mt-4">
                  <Field label="الردّ على التاجر">
                    <Textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="اكتب ردّك…"
                      autoFocus
                    />
                  </Field>
                  <div className="mt-2 flex gap-2">
                    <Button
                      disabled={busy || !reply.trim()}
                      onClick={() =>
                        patch(
                          t,
                          {
                            admin_reply: reply.trim(),
                            admin_read: true,
                            status: "closed",
                            updated_at: new Date().toISOString(),
                          },
                          "أُرسل الردّ وأُغلقت التذكرة ✓"
                        )
                      }
                    >
                      إرسال وإغلاق
                    </Button>
                    <Button variant="ghost" onClick={() => setReplyTo(null)}>إلغاء</Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="px-3 py-1.5 text-xs"
                    onClick={() => {
                      setReplyTo(t.id);
                      setReply(t.admin_reply ?? "");
                    }}
                  >
                    ✍️ {t.admin_reply ? "تعديل الردّ" : "ردّ"}
                  </Button>
                  <Button
                    variant="ghost"
                    className="px-3 py-1.5 text-xs"
                    disabled={busy}
                    onClick={() =>
                      patch(
                        t,
                        {
                          status: t.status === "open" ? "closed" : "open",
                          updated_at: new Date().toISOString(),
                        },
                        t.status === "open" ? "أُغلقت التذكرة." : "أُعيد فتح التذكرة."
                      )
                    }
                  >
                    {t.status === "open" ? "إغلاق" : "إعادة فتح"}
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

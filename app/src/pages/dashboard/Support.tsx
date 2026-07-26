/** الدعم الفني — إرسال تذكرة للمؤسس ومتابعة الردّ عليها. */
import { useEffect, useState, type FormEvent } from "react";
import {
  Badge,
  Button,
  Card,
  ErrorNote,
  Field,
  Input,
  Skeleton,
  Textarea,
  useToast,
} from "@/components/ui";
import { createSupportTicket, getMyTickets } from "@/lib/data";
import { formatDate, strOrNull } from "@/lib/utils";
import type { SupportTicket } from "@/lib/types";
import { useDashboard } from "./Dashboard";

const STATUS_LABEL: Record<string, { text: string; variant: "gold" | "green" | "neutral" }> = {
  open: { text: "مفتوحة", variant: "gold" },
  closed: { text: "مغلقة", variant: "neutral" },
  resolved: { text: "تم الحل", variant: "green" },
};

export default function Support() {
  const { user, restaurant } = useDashboard();
  const toast = useToast();
  const [tickets, setTickets] = useState<SupportTicket[] | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "الدعم الفني — كلاود منيو";
    getMyTickets(user.id).then(setTickets).catch(() => setTickets([]));
  }, [user.id]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return setError("اكتب الموضوع والرسالة.");
    setBusy(true);
    setError("");
    try {
      await createSupportTicket({
        user_id: user.id,
        user_name: strOrNull(String(user.user_metadata?.name ?? "")),
        email: user.email,
        restaurant_name: restaurant.name,
        subject: subject.trim(),
        message: message.trim(),
      });
      setSubject("");
      setMessage("");
      setTickets(await getMyTickets(user.id));
      toast("وصلت تذكرتك ✓ سنردّ عليك قريباً.");
    } catch {
      setError("تعذّر الإرسال. حاول مجدداً.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-black text-ink">الدعم الفني</h1>
      <p className="mt-1 text-sm text-dim">أي مشكلة أو اقتراح — اكتبها هنا ونصلك بالرد.</p>

      <Card className="mt-6">
        <form onSubmit={send} className="flex flex-col gap-4">
          <Field label="الموضوع">
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="مثال: لا تظهر صور الأطباق"
              maxLength={140}
              required
            />
          </Field>
          <Field label="تفاصيل المشكلة">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-32"
              placeholder="اشرح ما حدث بالتفصيل — كلما زادت التفاصيل أسرع الحل."
              maxLength={4000}
              required
            />
          </Field>
          {error && <ErrorNote>{error}</ErrorNote>}
          <Button type="submit" disabled={busy} className="w-full py-3 sm:w-auto sm:self-start sm:px-10">
            {busy ? "جارٍ الإرسال…" : "إرسال التذكرة"}
          </Button>
        </form>
      </Card>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-lg font-extrabold text-ink">تذاكري السابقة</h2>
        {tickets === null ? (
          <Skeleton className="h-28" />
        ) : tickets.length === 0 ? (
          <Card className="py-10 text-center">
            <span className="text-4xl">📮</span>
            <p className="mt-3 font-bold text-ink">لا توجد تذاكر بعد</p>
            <p className="mt-1 text-sm text-dim">أول تذكرة ترسلها ستظهر هنا مع ردّ الفريق.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {tickets.map((t) => {
              const status = STATUS_LABEL[t.status ?? "open"] ?? STATUS_LABEL.open;
              return (
                <Card key={t.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-ink">{t.subject}</p>
                    <Badge variant={status.variant}>{status.text}</Badge>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-dim">
                    {t.message}
                  </p>
                  {t.admin_reply && (
                    <div className="mt-3 rounded-xl border border-gold/25 bg-gold/[.06] p-3">
                      <p className="text-xs font-black text-gold">ردّ فريق كلاود منيو</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                        {t.admin_reply}
                      </p>
                    </div>
                  )}
                  <p className="mt-3 text-xs text-faint">{formatDate(t.created_at)}</p>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

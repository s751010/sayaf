/**
 * الدعم الفني من داخل اللوحة.
 *
 * جدول `support_tickets` وسياساته كانت جاهزة، لكن لا واجهة تُنشئ تذكرة — فكان
 * صندوق المؤسس بلا مصدر من التطبيق، وكان التاجر يُحال إلى بريد mailto فقط.
 * التذكرة تصل لوحة المؤسس مباشرة، وردّه (`admin_reply`) يظهر للتاجر هنا.
 */
import { useEffect, useState, type FormEvent } from "react";
import {
  createSupportTicket,
  getMySupportTickets,
  type SupportTicket,
} from "@/lib/data";
import { formatDate } from "@/lib/utils";
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

export function SupportBox({
  userId,
  email,
  restaurantName,
}: {
  userId: string;
  email: string | null;
  restaurantName: string | null;
}) {
  const toast = useToast();
  const [tickets, setTickets] = useState<SupportTicket[] | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getMySupportTickets(userId)
      .then(setTickets)
      .catch(() => setTickets([]));
  }, [userId]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!subject.trim()) return setError("اكتب موضوع الطلب.");
    if (!message.trim()) return setError("اكتب تفاصيل المشكلة أو الطلب.");
    setBusy(true);
    setError("");
    try {
      const created = await createSupportTicket({
        user_id: userId,
        user_name: restaurantName,
        email,
        restaurant_name: restaurantName,
        subject: subject.trim(),
        message: message.trim(),
      });
      setTickets((t) => [created, ...(t ?? [])]);
      setSubject("");
      setMessage("");
      toast("وصل طلبك — سنردّ عليك قريباً ✓");
    } catch {
      setError("تعذّر إرسال الطلب. حاول مجدداً.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-lg font-extrabold text-ink">🎧 الدعم الفني</h2>
        <p className="mt-1 text-sm text-dim">
          اكتب مشكلتك أو طلبك وسيصل مباشرة لفريق كلاود منيو — وستجد الرد هنا.
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <Field label="الموضوع">
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="مثال: لا تظهر صورة طبق"
            maxLength={120}
          />
        </Field>
        <Field label="التفاصيل">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اشرح ما حدث وما توقّعته…"
            maxLength={2000}
          />
        </Field>
        {error && <ErrorNote>{error}</ErrorNote>}
        <Button type="submit" disabled={busy} className="self-start">
          {busy ? "جارٍ الإرسال…" : "إرسال الطلب"}
        </Button>
      </form>

      <div className="border-t border-line pt-4">
        <p className="mb-2 text-sm font-bold text-ink">طلباتك السابقة</p>
        {tickets === null ? (
          <Skeleton className="h-16 rounded-xl" />
        ) : tickets.length === 0 ? (
          <p className="text-xs text-faint">لا توجد طلبات بعد.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {tickets.map((t) => (
              <li key={t.id} className="rounded-xl border border-line bg-panel2 px-3.5 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-ink">{t.subject}</p>
                  <Badge variant={t.status === "open" ? "gold" : "green"}>
                    {t.status === "open" ? "قيد المعالجة" : "مغلق"}
                  </Badge>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-dim">
                  {t.message}
                </p>
                {t.admin_reply && (
                  <div className="mt-2 rounded-lg border border-gold/30 bg-gold/[.06] px-3 py-2">
                    <p className="text-xs font-bold text-gold">ردّ الفريق</p>
                    <p className="mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-ink">
                      {t.admin_reply}
                    </p>
                  </div>
                )}
                <p className="mt-1.5 text-[11px] text-faint">{formatDate(t.created_at)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

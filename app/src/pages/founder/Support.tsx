/**
 * «الدعم» — تذاكر التجّار، ثم الإعلانات والمدونة في تبويبٍ ثانٍ.
 *
 * كانت التذاكر في ذيل «نظرة عامة» والردّ بـ`window.prompt` (مربّع نظام بسطرٍ
 * واحد، يُغلق بلمسة خطأ على الجوال فيضيع الردّ). صار الردّ حقلاً تحت التذكرة.
 */
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Badge, Button, Card, ErrorNote, Skeleton, Textarea, useToast } from "@/components/ui";
import { rest } from "@/lib/api";
import { logAudit } from "@/lib/founder";
import { formatDate, cn } from "@/lib/utils";
import Comms from "./Comms";

type Ticket = {
  id: string;
  subject: string | null;
  message: string | null;
  email: string | null;
  restaurant_name: string | null;
  status: string | null;
  admin_reply: string | null;
  admin_read: boolean | null;
  created_at: string;
};

type Tab = "tickets" | "comms";
type Filter = "open" | "all";

export default function Support() {
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get("tab") === "comms" ? "comms" : "tickets";

  return (
    <div>
      <h1 className="font-display text-2xl font-black text-ink">الدعم والتواصل</h1>
      <div role="tablist" className="mt-4 inline-flex rounded-xl border border-line bg-panel p-1">
        {(
          [
            ["tickets", "التذاكر"],
            ["comms", "الإعلانات والمدونة"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setParams(id === "tickets" ? {} : { tab: id }, { replace: true })}
            className={cn(
              "min-h-10 rounded-lg px-4 text-sm font-bold transition-colors",
              tab === id ? "bg-gold/12 text-gold" : "text-dim hover:text-ink"
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-6">{tab === "tickets" ? <Tickets /> : <Comms />}</div>
    </div>
  );
}

function Tickets() {
  const toast = useToast();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("open");

  const load = useCallback(async () => {
    setError("");
    try {
      setTickets(await rest<Ticket[]>("support_tickets?select=*&order=created_at.desc&limit=100"));
    } catch {
      setError("تعذّر تحميل التذاكر.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function patchLocal(id: string, patch: Partial<Ticket>) {
    setTickets((rows) => rows?.map((x) => (x.id === id ? { ...x, ...patch } : x)) ?? null);
  }

  async function reply(t: Ticket, text: string): Promise<boolean> {
    try {
      await logAudit("رد على تذكرة", { table: "support_tickets", id: t.id, name: t.subject, details: { reply: text } });
      await rest(`support_tickets?id=eq.${t.id}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: { admin_reply: text, admin_read: true },
      });
      patchLocal(t.id, { admin_reply: text, admin_read: true });
      toast("وصل ردّك للتاجر ✓");
      return true;
    } catch {
      toast("تعذّر إرسال الرد.", "err");
      return false;
    }
  }

  async function setStatus(t: Ticket, status: "open" | "closed") {
    try {
      await logAudit(status === "open" ? "إعادة فتح تذكرة" : "إغلاق تذكرة", {
        table: "support_tickets",
        id: t.id,
        name: t.subject,
      });
      await rest(`support_tickets?id=eq.${t.id}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: { status, admin_read: true },
      });
      patchLocal(t.id, { status, admin_read: true });
    } catch {
      toast("تعذّر التحديث.", "err");
    }
  }

  async function markRead(t: Ticket) {
    if (t.admin_read) return;
    patchLocal(t.id, { admin_read: true });
    await rest(`support_tickets?id=eq.${t.id}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: { admin_read: true },
    }).catch(() => patchLocal(t.id, { admin_read: false }));
  }

  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (tickets === null) return <Skeleton className="h-48" />;

  const shown = filter === "open" ? tickets.filter((t) => t.status === "open") : tickets;
  const openCount = tickets.filter((t) => t.status === "open").length;

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(
          [
            ["open", `المفتوحة (${openCount})`],
            ["all", `الكل (${tickets.length})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={cn(
              "min-h-9 rounded-full border px-3.5 text-xs font-bold",
              filter === id ? "border-gold bg-gold/12 text-gold" : "border-line text-dim hover:text-ink"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <Card className="text-center text-sm text-dim">
          {filter === "open" ? "ما فيه تذاكر مفتوحة ✓" : "ما وصلت أي تذكرة بعد."}
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map((t) => (
            <TicketCard
              key={t.id}
              t={t}
              onReply={(text) => reply(t, text)}
              onStatus={(s) => setStatus(t, s)}
              onOpen={() => markRead(t)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TicketCard({
  t,
  onReply,
  onStatus,
  onOpen,
}: {
  t: Ticket;
  onReply: (text: string) => Promise<boolean>;
  onStatus: (s: "open" | "closed") => void;
  onOpen: () => void;
}) {
  const [draft, setDraft] = useState(t.admin_reply ?? "");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const isOpen = t.status === "open";

  return (
    <Card className={cn("p-4", !t.admin_read && "border-gold/50")}>
      <button
        className="flex w-full items-start gap-3 text-start"
        onClick={() => {
          setOpen((v) => !v);
          onOpen();
        }}
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <p className="font-bold text-ink">
            {t.subject ?? "بلا موضوع"}
            {!t.admin_read && <span className="ms-2 text-xs font-black text-gold">● جديدة</span>}
          </p>
          <p className="mt-0.5 text-xs text-faint">
            {t.restaurant_name && <span>{t.restaurant_name} · </span>}
            {formatDate(t.created_at)}
          </p>
          {!open && t.message && <p className="mt-1 line-clamp-1 text-sm text-dim">{t.message}</p>}
        </div>
        <Badge variant={isOpen ? "red" : "green"}>{isOpen ? "مفتوحة" : "مغلقة"}</Badge>
      </button>

      {open && (
        <div className="mt-3 border-t border-line pt-3">
          {t.message && <p className="whitespace-pre-wrap text-sm text-ink">{t.message}</p>}
          {t.email && (
            <a href={`mailto:${t.email}`} dir="ltr" className="mt-2 inline-block text-xs font-bold text-gold underline">
              {t.email}
            </a>
          )}
          <Textarea
            className="mt-3"
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="اكتب ردّك — يظهر للتاجر في لوحته"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              size="sm"
              busy={busy}
              busyText="يرسل…"
              disabled={!draft.trim() || draft.trim() === (t.admin_reply ?? "")}
              onClick={async () => {
                setBusy(true);
                await onReply(draft.trim());
                setBusy(false);
              }}
            >
              {t.admin_reply ? "حدّث الرد" : "أرسل الرد"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onStatus(isOpen ? "closed" : "open")}>
              {isOpen ? "أغلقها" : "أعد فتحها"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

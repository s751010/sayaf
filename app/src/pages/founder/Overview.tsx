/**
 * نظرة عامة على المنصة.
 *
 * ليست لوحة أرقام للزينة: الصفّ الأول أرقام الحالة، ويليه **ما يحتاج انتباهك**
 * — مشتقّ من نفس الأرقام لا من استعلام ثانٍ. الرقم وحده لا يقول ماذا أفعل،
 * وهذا ما جعل اللوحة القديمة بلا قيمة عملية.
 */
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, ErrorNote, Skeleton, useToast } from "@/components/ui";
import { rest } from "@/lib/api";
import { getOverview, logAudit, type FounderOverview } from "@/lib/founder";
import { formatDate, formatPrice } from "@/lib/utils";

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

/** بند «يحتاج انتباهك» — يظهر فقط إن كان عدده أكبر من صفر. */
type Attention = { n: number; text: string; to?: string; tone: "bad" | "warn" };

export default function Overview() {
  const toast = useToast();
  const [stats, setStats] = useState<FounderOverview | null>(null);
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [o, t] = await Promise.all([
        getOverview(),
        rest<Ticket[]>("support_tickets?select=*&order=created_at.desc&limit=30"),
      ]);
      setStats(o);
      setTickets(t);
    } catch {
      setError("تعذّر تحميل بيانات اللوحة.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function replyTicket(t: Ticket) {
    const reply = window.prompt(`الرد على «${t.subject ?? "التذكرة"}»:`, t.admin_reply ?? "")?.trim();
    if (!reply) return;
    try {
      await logAudit("رد على تذكرة", {
        table: "support_tickets",
        id: t.id,
        name: t.subject,
        details: { reply },
      });
      await rest(`support_tickets?id=eq.${t.id}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: { admin_reply: reply, admin_read: true },
      });
      setTickets((rows) =>
        rows?.map((x) => (x.id === t.id ? { ...x, admin_reply: reply, admin_read: true } : x)) ?? null
      );
      toast("أُرسل الرد للتاجر ✓");
    } catch {
      toast("تعذّر إرسال الرد.", "err");
    }
  }

  async function setStatus(t: Ticket, status: string) {
    try {
      await logAudit(status === "open" ? "إعادة فتح تذكرة" : "إغلاق تذكرة", {
        table: "support_tickets",
        id: t.id,
        name: t.subject,
      });
      await rest(`support_tickets?id=eq.${t.id}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: { status },
      });
      setTickets((rows) => rows?.map((x) => (x.id === t.id ? { ...x, status } : x)) ?? null);
      toast("تم تحديث التذكرة.");
    } catch {
      toast("تعذّر التحديث.", "err");
    }
  }

  if (error) return <ErrorNote>{error}</ErrorNote>;

  const cards = [
    { label: "إجمالي الإيراد", value: `${formatPrice(stats?.revenue_total ?? 0)} ر.س`, icon: "💰" },
    { label: "اشتراكات نشطة", value: stats ? `${stats.subs_active}` : "…", icon: "📦",
      sub: stats ? `${stats.subs_paid} مدفوع · ${stats.subs_trial} تجربة` : "" },
    { label: "المطاعم", value: stats ? `${stats.restaurants_total}` : "…", icon: "🍽️",
      sub: stats ? `+${stats.restaurants_new_7d} هذا الأسبوع` : "" },
    { label: "مشاهدات ٣٠ يوماً", value: stats ? `${stats.views_30d}` : "…", icon: "👀",
      sub: stats ? `${stats.views_7d} هذا الأسبوع` : "" },
  ];

  // البنود مشتقّة من نفس الأرقام أعلاه — لا استعلام إضافي ولا رقم من مصدر ثانٍ.
  const attention: Attention[] = stats
    ? ([
        {
          n: stats.restaurants_no_dish,
          text: "مطعماً بلا طبق واحد — سجّلوا ثم توقّفوا",
          to: "/founder/merchants?filter=no-dishes",
          tone: "bad",
        },
        {
          n: stats.tickets_unread,
          text: "تذكرة دعم لم تُقرأ بعد",
          tone: "bad",
        },
        {
          n: stats.subs_expiring_7d,
          text: "اشتراكاً ينتهي خلال ٧ أيام",
          to: "/founder/merchants?filter=expiring",
          tone: "warn",
        },
        {
          n: stats.revenue_total > 0 && stats.subs_paid === 0 ? 1 : 0,
          text: "يوجد إيراد مسجَّل بلا أي اشتراك مدفوع نشط يقابله",
          tone: "warn",
        },
      ] satisfies Attention[]).filter((a) => a.n > 0)
    : [];

  return (
    <div>
      <h1 className="font-display text-2xl font-black text-ink">نظرة عامة على المنصة</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/12 text-xl">
              {c.icon}
            </span>
            <div className="min-w-0">
              <p className="text-xs text-dim">{c.label}</p>
              <p className="font-display text-xl font-black text-ink">{c.value}</p>
              {c.sub && <p className="text-[11px] text-faint">{c.sub}</p>}
            </div>
          </Card>
        ))}
      </div>

      {stats === null ? (
        <Skeleton className="mt-6 h-24" />
      ) : attention.length > 0 ? (
        <Card className="mt-6">
          <h2 className="font-display text-base font-extrabold text-ink">⚠️ يحتاج انتباهك</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {attention.map((a) => (
              <li key={a.text} className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant={a.tone === "bad" ? "red" : "gold"}>{a.n}</Badge>
                <span className="text-dim">{a.text}</span>
                {a.to && (
                  <Link to={a.to} className="text-xs font-black text-gold hover:underline">
                    اعرضهم ←
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card className="mt-6 text-center text-sm text-dim">لا شيء يحتاج انتباهك الآن ✓</Card>
      )}

      <section className="mt-10">
        <h2 className="mb-4 font-display text-lg font-extrabold text-ink">🎫 تذاكر الدعم</h2>
        {tickets === null ? (
          <Skeleton className="h-40" />
        ) : tickets.length === 0 ? (
          <Card className="text-center text-sm text-dim">لا توجد تذاكر.</Card>
        ) : (
          <div className="flex flex-col gap-3">
            {tickets.map((t) => (
              <Card key={t.id} className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-ink">
                    {t.subject ?? "بلا موضوع"}
                    {!t.admin_read && <span className="ms-2 text-xs font-black text-gold">● جديدة</span>}
                  </p>
                  {t.message && <p className="mt-0.5 line-clamp-2 text-sm text-dim">{t.message}</p>}
                  <p className="mt-1 text-xs text-faint">
                    {t.restaurant_name && <span>{t.restaurant_name} · </span>}
                    {t.email && <span dir="ltr">{t.email} · </span>}
                    {formatDate(t.created_at)}
                  </p>
                  {t.admin_reply && (
                    <p className="mt-1.5 rounded-lg border border-gold/30 bg-gold/[.06] px-2.5 py-1.5 text-xs text-ink">
                      ردّك: {t.admin_reply}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => replyTicket(t)}>
                    {t.admin_reply ? "تعديل الرد" : "ردّ"}
                  </Button>
                  <Badge variant={t.status === "open" ? "red" : "green"}>
                    {t.status === "open" ? "مفتوحة" : "مغلقة"}
                  </Badge>
                  <Button
                    variant="outline"
                    className="px-3 py-1.5 text-xs"
                    onClick={() => setStatus(t, t.status === "open" ? "closed" : "open")}
                  >
                    {t.status === "open" ? "إغلاق" : "إعادة فتح"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

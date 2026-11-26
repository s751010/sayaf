/**
 * «التسويق» — النمو، والقمع، وحملات واتساب جاهزة لكل شريحة، والأكواد،
 * والإعلانات والمدونة. ثلاثة تبويبات كي لا تصير صفحةً بلا نهاية على الجوال.
 *
 * الحملات لا تُرسل شيئاً بنفسها: كلّ زرّ يفتح محادثة واتساب **من جوالك**
 * برسالةٍ مكتوبة تعدّلها قبل الإرسال. لا خدمة رسائل، ولا رقمٌ يُرسل باسمك.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Badge, Button, Card, Skeleton, Textarea, useToast } from "@/components/ui";
import {
  getMerchantContacts,
  getMerchants,
  getSignupDates,
  getViewsSince,
  type FounderMerchant,
  type MerchantContact,
} from "@/lib/founder";
import {
  SEGMENTS,
  dailyCounts,
  dailySums,
  groupSegments,
  normalizeSaPhone,
  total,
  trend,
  waLink,
  type DayPoint,
  type SegmentId,
} from "@/lib/founderInsights";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Bars } from "./parts/Bars";
import { Funnel } from "./parts/Funnel";
import { PromoCodes } from "./parts/PromoCodes";
import Comms from "./Comms";

type Tab = "growth" | "promos" | "content";

const TABS: [Tab, string][] = [
  ["growth", "النمو والحملات"],
  ["promos", "أكواد الخصم"],
  ["content", "الإعلانات والمدونة"],
];

export default function Marketing() {
  const [params, setParams] = useSearchParams();
  const raw = params.get("tab");
  const tab: Tab = raw === "promos" || raw === "content" ? raw : "growth";

  return (
    <div>
      <h1 className="font-display text-2xl font-black text-ink">التسويق</h1>
      <div role="tablist" className="mt-4 flex gap-1 overflow-x-auto rounded-xl border border-line bg-panel p-1">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setParams(id === "growth" ? {} : { tab: id }, { replace: true })}
            className={cn(
              "min-h-10 shrink-0 rounded-lg px-4 text-sm font-bold transition-colors",
              tab === id ? "bg-gold/12 text-gold" : "text-dim hover:text-ink"
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tab === "growth" ? <Growth /> : tab === "promos" ? <PromoCodes /> : <Comms />}
      </div>
    </div>
  );
}

function Growth() {
  const [signups, setSignups] = useState<DayPoint[] | null>(null);
  const [views, setViews] = useState<DayPoint[] | null>(null);
  const [merchants, setMerchants] = useState<FounderMerchant[] | null>(null);
  const [contacts, setContacts] = useState<MerchantContact[]>([]);

  useEffect(() => {
    getSignupDates(30)
      .then((d) => setSignups(dailyCounts(d, 30)))
      .catch(() => setSignups([]));
    getViewsSince(30)
      .then((rows) => setViews(dailySums(rows.map((r) => ({ date: r.date, value: r.views })), 30)))
      .catch(() => setViews([]));
    getMerchants()
      .then(setMerchants)
      .catch(() => setMerchants([]));
    getMerchantContacts()
      .then(setContacts)
      .catch(() => setContacts([]));
  }, []);

  const top = useMemo(
    () => [...(merchants ?? [])].sort((a, b) => b.views_30d - a.views_30d).slice(0, 5),
    [merchants]
  );

  return (
    <div className="flex flex-col gap-10">
      <section className="grid gap-4 md:grid-cols-2">
        <SeriesCard title="تسجيلات جديدة — آخر ٣٠ يوم" unit="مطعم" points={signups} />
        <SeriesCard title="فتحات المنيو — آخر ٣٠ يوم" unit="فتحة" points={views} />
      </section>

      <Funnel />

      <Campaigns merchants={merchants} contacts={contacts} />

      <section>
        <h2 className="mb-3 font-display text-lg font-extrabold text-ink">الأكثر زيارة — آخر ٣٠ يوم</h2>
        {merchants === null ? (
          <Skeleton className="h-32" />
        ) : top.length === 0 ? (
          <Card className="text-center text-sm text-dim">ما فيه مطاعم بعد.</Card>
        ) : (
          <ol className="overflow-hidden rounded-[14px] border border-line bg-panel">
            {top.map((m, i) => {
              const peak = top[0].views_30d || 1;
              return (
                <li key={m.id} className="border-b border-line last:border-0">
                  <Link to={`/founder/merchants/${m.id}`} className="block px-4 py-3 hover:bg-ink/[.03]">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-bold text-ink">
                        {i + 1}. {m.name}
                      </span>
                      <span className="font-black text-ink">{m.views_30d}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/8">
                      <div className="h-full rounded-full" style={{ width: `${(m.views_30d / peak) * 100}%`, background: "var(--c-chart)" }} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}

function SeriesCard({ title, unit, points }: { title: string; unit: string; points: DayPoint[] | null }) {
  const t = points && points.length ? trend(points) : null;
  return (
    <Card>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold text-dim">{title}</h2>
        {t !== null && (
          <span className={cn("text-xs font-black", t >= 0 ? "text-good" : "text-bad")} dir="ltr">
            {t >= 0 ? "+" : ""}
            {t}%
          </span>
        )}
      </div>
      {points === null ? (
        <Skeleton className="mt-3 h-28" />
      ) : points.length === 0 ? (
        <p className="mt-3 text-sm text-dim">تعذّر التحميل.</p>
      ) : (
        <>
          <p className="mt-1 font-display text-2xl font-black text-ink">{total(points)}</p>
          <Bars points={points} unit={unit} />
        </>
      )}
    </Card>
  );
}

/* ── حملات واتساب ─────────────────────────────────────────────────── */

function Campaigns({ merchants, contacts }: { merchants: FounderMerchant[] | null; contacts: MerchantContact[] }) {
  const toast = useToast();
  const groups = useMemo(() => (merchants ? groupSegments(merchants) : null), [merchants]);
  const first = SEGMENTS.find((s) => (groups?.[s.id].length ?? 0) > 0)?.id ?? "trial-ending";
  const [picked, setPicked] = useState<SegmentId | null>(null);
  const active = picked ?? first;
  const seg = SEGMENTS.find((s) => s.id === active)!;
  const [templates, setTemplates] = useState<Partial<Record<SegmentId, string>>>({});
  const template = templates[active] ?? seg.message("{اسم المطعم}");
  const phoneOf = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const c of contacts) map.set(c.id, normalizeSaPhone(c.social_whatsapp) ?? normalizeSaPhone(c.phone));
    return map;
  }, [contacts]);

  const list = groups?.[active] ?? [];

  return (
    <section>
      <h2 className="font-display text-lg font-extrabold text-ink">حملات واتساب</h2>
      <p className="mt-0.5 text-xs text-faint">رسالة جاهزة لكل شريحة — تنفتح من واتساب جوالك وتعدّلها قبل ما ترسل.</p>

      {groups === null ? (
        <Skeleton className="mt-3 h-40" />
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            {SEGMENTS.map((s) => (
              <button
                key={s.id}
                onClick={() => setPicked(s.id)}
                className={cn(
                  "min-h-9 rounded-full border px-3.5 text-xs font-bold",
                  active === s.id ? "border-gold bg-gold/12 text-gold" : "border-line text-dim hover:text-ink"
                )}
              >
                {s.label} ({groups[s.id].length})
              </button>
            ))}
          </div>

          <Card className="mt-3">
            <p className="text-xs text-dim">{seg.why}</p>
            <label className="mt-3 block text-xs font-bold text-ink" htmlFor="wa-template">
              نصّ الرسالة — <span className="font-normal text-faint">{"{اسم المطعم}"} يتبدّل تلقائياً</span>
            </label>
            <Textarea
              id="wa-template"
              className="mt-1"
              rows={3}
              value={template}
              onChange={(e) => setTemplates((t) => ({ ...t, [active]: e.target.value }))}
            />

            {list.length === 0 ? (
              <p className="mt-4 text-center text-sm text-dim">ما فيه أحد في هالشريحة الحين ✓</p>
            ) : (
              <ul className="mt-4 flex flex-col divide-y divide-line">
                {list.map((m) => {
                  const phone = phoneOf.get(m.id) ?? null;
                  const text = template.split("{اسم المطعم}").join(m.name);
                  return (
                    <li key={m.id} className="flex flex-wrap items-center gap-2 py-2.5">
                      <Link to={`/founder/merchants/${m.id}`} className="min-w-0 flex-1 truncate text-sm font-bold text-ink hover:underline">
                        {m.name}
                      </Link>
                      {phone ? (
                        <a
                          href={waLink(phone, text)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-good px-3 text-xs font-black text-white hover:opacity-90"
                        >
                          <Icon name="chat" size={14} /> واتساب
                        </a>
                      ) : (
                        <Badge variant="neutral">ما عنده رقم</Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigator.clipboard
                            ?.writeText(text)
                            .then(() => toast("نُسخت الرسالة ✓"))
                            .catch(() => toast("ما قدرنا ننسخ.", "err"))
                        }
                      >
                        <Icon name="copy" size={13} /> انسخ
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </>
      )}
    </section>
  );
}

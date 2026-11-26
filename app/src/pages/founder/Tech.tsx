/**
 * «الفنّي» — هل كل شي شغّال الآن؟ ثم النسخة، والتكاملات، والروابط، ثم أقسام
 * الصحة والأخطاء والإعدادات وسجلّ التدقيق (`Health`).
 *
 * الفحوص الحيّة من **متصفّحك أنت** لا من خادم: تقيس ما يراه زائرٌ الآن —
 * الموقع، واستعلامٌ عامّ حقيقي (نفس ما تفحصه النبضة كل نصف ساعة، ويمسك عموداً
 * بلا `grant select` — القاعدة «و»)، وخدمة الدخول.
 */
import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card } from "@/components/ui";
import { rest } from "@/lib/api";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/config";
import { SUPABASE_REF } from "@/lib/founderGate";
import { getApiKeys, getWebhookEvents, type ApiKeyLite, type WebhookEventLite } from "@/lib/founder";
import { Icon } from "@/lib/icons";
import { cn, formatDate } from "@/lib/utils";
import Health from "./Health";

type CheckState = { ok: boolean; ms: number } | null;

const CHECKS = [
  { id: "site", label: "الموقع يفتح", hint: "صفحة المنيو التجريبي من نفس الموقع" },
  { id: "db", label: "المنيو العامّ يقرأ", hint: "استعلامٌ كالذي يرسله زبون — يمسك عموداً بلا صلاحية" },
  { id: "auth", label: "خدمة الدخول", hint: "تسجيل دخول التجّار" },
] as const;

type CheckId = (typeof CHECKS)[number]["id"];

async function timed(fn: () => Promise<unknown>): Promise<{ ok: boolean; ms: number }> {
  const t = performance.now();
  try {
    await fn();
    return { ok: true, ms: Math.round(performance.now() - t) };
  } catch {
    return { ok: false, ms: Math.round(performance.now() - t) };
  }
}

const RUN: Record<CheckId, () => Promise<unknown>> = {
  site: async () => {
    const r = await fetch("/demo", { cache: "no-store" });
    if (!r.ok) throw new Error(String(r.status));
  },
  db: () => rest("restaurants?select=id,slug&limit=1", { anonymous: true }),
  auth: async () => {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/health`, { headers: { apikey: SUPABASE_ANON_KEY } });
    if (!r.ok) throw new Error(String(r.status));
  },
};

const BUILD_SHA = typeof __BUILD_SHA__ === "string" ? __BUILD_SHA__ : "local";
const BUILD_TIME = typeof __BUILD_TIME__ === "string" ? __BUILD_TIME__ : null;

const LINKS = [
  { href: `https://supabase.com/dashboard/project/${SUPABASE_REF}`, label: "Supabase — القاعدة" },
  { href: `https://supabase.com/dashboard/project/${SUPABASE_REF}/sql/new`, label: "محرّر SQL" },
  { href: "https://app.netlify.com/projects/neon-frangollo-2c189e/deploys", label: "Netlify — النشر" },
  { href: "https://github.com/s751010/sayaf/actions", label: "GitHub — الفحوص" },
];

export default function Tech() {
  const [checks, setChecks] = useState<Record<CheckId, CheckState>>({ site: null, db: null, auth: null });
  const [running, setRunning] = useState(false);
  const [hooks, setHooks] = useState<WebhookEventLite[] | null>(null);
  const [keys, setKeys] = useState<ApiKeyLite[] | null>(null);

  const runAll = useCallback(async () => {
    setRunning(true);
    setChecks({ site: null, db: null, auth: null });
    await Promise.all(
      CHECKS.map(async (c) => {
        const r = await timed(RUN[c.id]);
        setChecks((prev) => ({ ...prev, [c.id]: r }));
      })
    );
    setRunning(false);
  }, []);

  useEffect(() => {
    void runAll();
    getWebhookEvents(7).then(setHooks).catch(() => setHooks([]));
    getApiKeys().then(setKeys).catch(() => setKeys([]));
  }, [runAll]);

  const delivered = hooks?.filter((h) => h.delivered_at).length ?? 0;
  const failed = hooks?.filter((h) => !h.delivered_at && h.last_error).length ?? 0;
  const liveKeys = keys?.filter((k) => !k.revoked_at) ?? [];
  const usedWeek = liveKeys.filter((k) => k.last_used_at && Date.now() - new Date(k.last_used_at).getTime() < 7 * 86_400_000).length;

  return (
    <div>
      <h1 className="font-display text-2xl font-black text-ink">الفنّي</h1>
      <p className="mt-1 text-sm text-dim">هل كل شي شغّال، والنسخة المنشورة، والتكاملات، والأخطاء، والإعدادات.</p>

      {/* الفحص الحيّ */}
      <section className="mt-5">
        <Card className="p-0">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <h2 className="font-display text-base font-extrabold text-ink">فحص حيّ الحين</h2>
            <Button size="sm" variant="outline" busy={running} busyText="يفحص…" onClick={runAll}>
              أعد الفحص
            </Button>
          </div>
          <ul>
            {CHECKS.map((c) => {
              const r = checks[c.id];
              return (
                <li key={c.id} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      r === null ? "bg-ink/8 text-faint" : r.ok ? "bg-good/12 text-good" : "bg-bad/12 text-bad"
                    )}
                  >
                    <Icon name={r === null ? "clock" : r.ok ? "check" : "warn"} size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink">{c.label}</p>
                    <p className="text-[11px] text-faint">{c.hint}</p>
                  </div>
                  <span className="text-xs font-bold text-dim" dir="ltr">
                    {r === null ? "…" : r.ok ? `${r.ms} ms` : "عطل"}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>

      {/* النسخة والتكاملات */}
      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs font-bold text-dim">النسخة على الموقع</p>
          <p className="mt-1 font-mono text-lg font-black text-ink" dir="ltr">
            {BUILD_SHA}
          </p>
          <p className="text-[11px] text-faint">{BUILD_TIME ? `بُنيت ${formatDate(BUILD_TIME)}` : "نسخة محلّية"}</p>
        </Card>
        <Card>
          <p className="text-xs font-bold text-dim">الويبهوكات — ٧ أيام</p>
          <p className="mt-1 font-display text-lg font-black text-ink">{hooks === null ? "…" : `${delivered} وصلت`}</p>
          {failed > 0 ? <Badge variant="red">{failed} فشلت</Badge> : <p className="text-[11px] text-faint">بلا فشل</p>}
        </Card>
        <Card>
          <p className="text-xs font-bold text-dim">مفاتيح API</p>
          <p className="mt-1 font-display text-lg font-black text-ink">{keys === null ? "…" : `${liveKeys.length} فعّال`}</p>
          <p className="text-[11px] text-faint">{usedWeek} استُخدم هالأسبوع</p>
        </Card>
      </section>

      <section className="mt-4 flex flex-wrap gap-2">
        {LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line bg-panel px-3 text-xs font-bold text-dim hover:text-ink"
          >
            <Icon name="external" size={13} /> {l.label}
          </a>
        ))}
      </section>

      <div className="mt-10">
        <Health />
      </div>
    </div>
  );
}

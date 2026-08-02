/**
 * الصحة والتشغيل: تنبيهات عملية + سجل التدقيق + إعدادات المنصة.
 *
 * كل تنبيه يقود إلى بطاقة صاحبه — لأن التنبيه بلا طريق إلى العلاج تقرير لا
 * أداة. والترتيب بالخطورة لا بالنوع: ما يمنع التاجر من العمل قبل ما يزعجه.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  ErrorNote,
  Field,
  Input,
  Skeleton,
  useToast,
} from "@/components/ui";
import {
  getAudit,
  getHealth,
  getSiteSettings,
  logAudit,
  setSiteSetting,
  type AuditEntry,
  type HealthItem,
  type SiteSetting,
} from "@/lib/founder";
import { cn, formatDate } from "@/lib/utils";

const SEVERITY: Record<HealthItem["severity"], { label: string; badge: "red" | "gold" | "neutral"; ord: number }> = {
  high: { label: "حرج", badge: "red", ord: 0 },
  medium: { label: "مهم", badge: "gold", ord: 1 },
  low: { label: "ملاحظة", badge: "neutral", ord: 2 },
};

/** رقم الواتساب يُقرأ من `site_settings` في `SupportWhatsApp.tsx` بهذا المفتاح. */
const WHATSAPP_KEY = "support_whatsapp";

function asText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && v !== null && "value" in v) return String((v as { value: unknown }).value ?? "");
  return String(v);
}

export default function Health() {
  const toast = useToast();
  const [items, setItems] = useState<HealthItem[] | null>(null);
  const [audit, setAudit] = useState<AuditEntry[] | null>(null);
  const [settings, setSettings] = useState<SiteSetting[] | null>(null);
  const [whatsapp, setWhatsapp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const [h, a, s] = await Promise.all([getHealth(), getAudit(60), getSiteSettings()]);
      setItems(h);
      setAudit(a);
      setSettings(s);
      setWhatsapp(asText(s.find((x) => x.key === WHATSAPP_KEY)?.value));
    } catch {
      setError("تعذّر تحميل قسم الصحة.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** يجمع التنبيهات المتشابهة تحت عنوان واحد — ٢٠ صفاً متطابقاً لا يُقرأ. */
  const groups = useMemo(() => {
    if (!items) return null;
    const map = new Map<string, { head: HealthItem; rows: HealthItem[] }>();
    for (const it of items) {
      const g = map.get(it.kind);
      if (g) g.rows.push(it);
      else map.set(it.kind, { head: it, rows: [it] });
    }
    return [...map.values()].sort(
      (a, b) =>
        SEVERITY[a.head.severity].ord - SEVERITY[b.head.severity].ord ||
        b.rows.length - a.rows.length
    );
  }, [items]);

  async function saveWhatsapp() {
    setBusy(true);
    try {
      await logAudit("تعديل إعداد المنصة", {
        table: "site_settings",
        name: WHATSAPP_KEY,
        details: { value: whatsapp.trim() },
      });
      await setSiteSetting(WHATSAPP_KEY, whatsapp.trim());
      await load();
      toast("حُفظ الإعداد ✓");
    } catch {
      toast("تعذّر الحفظ.", "err");
    } finally {
      setBusy(false);
    }
  }

  if (error) return <ErrorNote>{error}</ErrorNote>;

  return (
    <div>
      <h1 className="font-display text-2xl font-black text-ink">الصحة والتشغيل</h1>

      {/* التنبيهات */}
      <section className="mt-6">
        <h2 className="mb-3 font-display text-lg font-extrabold text-ink">🩺 ما يحتاج علاجاً</h2>
        {groups === null ? (
          <Skeleton className="h-56" />
        ) : groups.length === 0 ? (
          <Card className="text-center text-sm text-dim">لا تنبيهات — كل شيء سليم ✓</Card>
        ) : (
          <div className="flex flex-col gap-3">
            {groups.map((g) => {
              const sev = SEVERITY[g.head.severity];
              return (
                <Card key={g.head.kind}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={sev.badge}>{sev.label}</Badge>
                    <p className="font-bold text-ink">{g.head.title}</p>
                    <Badge variant="neutral">{g.rows.length}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-dim">{g.head.detail}</p>
                  <ul className="mt-2.5 flex flex-wrap gap-1.5">
                    {g.rows.map((r) =>
                      r.restaurant_id ? (
                        <li key={r.restaurant_id + r.kind}>
                          <Link
                            to={`/founder/merchants/${r.restaurant_id}`}
                            className={cn(
                              "inline-block rounded-lg border border-line px-2.5 py-1 text-xs font-bold",
                              "text-dim hover:border-gold/40 hover:text-ink"
                            )}
                          >
                            {r.restaurant_name ?? "بلا اسم"}
                          </Link>
                        </li>
                      ) : null
                    )}
                  </ul>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* إعدادات المنصة */}
      <section className="mt-10">
        <h2 className="mb-3 font-display text-lg font-extrabold text-ink">⚙️ إعدادات المنصة</h2>
        <Card>
          <div className="flex flex-wrap items-end gap-3">
            <Field
              label="رقم واتساب الدعم"
              className="min-w-56 flex-1"
              hint="يظهر لكل تاجر في زر الدعم — بصيغة 9665XXXXXXXX"
            >
              <Input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                dir="ltr"
                placeholder="966500000000"
              />
            </Field>
            <Button onClick={saveWhatsapp} disabled={busy}>
              حفظ
            </Button>
          </div>
          {settings && settings.length > 0 && (
            <p className="mt-3 text-xs text-faint">
              مفاتيح مخزَّنة: {settings.map((s) => s.key).join(" · ")}
            </p>
          )}
        </Card>
      </section>

      {/* سجل التدقيق */}
      <section className="mt-10">
        <h2 className="mb-3 font-display text-lg font-extrabold text-ink">🧾 سجل التدقيق</h2>
        {audit === null ? (
          <Skeleton className="h-32" />
        ) : audit.length === 0 ? (
          <Card className="text-center text-sm text-dim">لا إجراءات مسجَّلة بعد.</Card>
        ) : (
          <Card>
            <ul className="flex flex-col divide-y divide-line">
              {audit.map((e) => (
                <li key={e.id} className="flex flex-wrap items-baseline gap-2 py-2 text-sm">
                  <span className="font-bold text-ink">{e.action}</span>
                  {e.target_name && <span className="text-dim">— {e.target_name}</span>}
                  {e.target_table && (
                    <span className="text-[11px] text-faint" dir="ltr">
                      {e.target_table}
                    </span>
                  )}
                  <span className="ms-auto text-xs text-faint">{formatDate(e.at)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-faint">
              هذا السجل لا يُعدَّل ولا يُحذف — لا سياسة UPDATE ولا DELETE عليه في القاعدة.
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}

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
  getClientErrors,
  getHealth,
  getSiteSettings,
  logAudit,
  setSiteSetting,
  type AuditEntry,
  type ClientErrorGroup,
  type HealthItem,
  type SiteSetting,
} from "@/lib/founder";
import { cn, formatDate } from "@/lib/utils";
import { Icon } from "@/lib/icons";

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
  const [crashes, setCrashes] = useState<ClientErrorGroup[] | null>(null);
  const [settings, setSettings] = useState<SiteSetting[] | null>(null);
  const [whatsapp, setWhatsapp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      // ⚠️ الانهيارات **لا تُسقط القسم إن فشلت**: جدولها أحدث ما في القاعدة،
      // وعطلٌ فيه لا يجوز أن يحجب التنبيهات وسجلّ التدقيق عن المؤسّس.
      const [h, a, s, c] = await Promise.all([
        getHealth(),
        getAudit(60),
        getSiteSettings(),
        getClientErrors(200).catch(() => [] as ClientErrorGroup[]),
      ]);
      setItems(h);
      setAudit(a);
      setSettings(s);
      setCrashes(c);
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
        <h2 className="inline-flex items-center gap-2 mb-3 font-display text-lg font-extrabold text-ink">
          <Icon name="pulse" size={17} className="shrink-0 text-gold" />{" "}
          ما يحتاج علاجاً</h2>
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
        <h2 className="mb-3 inline-flex items-center gap-2 font-display text-lg font-extrabold text-ink">
          <Icon name="sliders" size={17} className="shrink-0 text-gold" /> إعدادات المنصة
        </h2>
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

      {/**
       * انهيارات الواجهة — قبل سجلّ التدقيق عمداً: التدقيق سجلّ ما فعلتَه
       * أنت، وهذا سجلّ ما انكسر عند تاجر ولم يخبرك به أحد.
       */}
      <section className="mt-10">
        <h2 className="mb-3 inline-flex items-center gap-2 font-display text-lg font-extrabold text-ink">
          <Icon name="warn" size={17} className="shrink-0 text-gold" /> انهيارات الواجهة
        </h2>
        {crashes === null ? (
          <Skeleton className="h-24" />
        ) : crashes.length === 0 ? (
          <Card className="text-center text-sm text-dim">
            لا انهيارات مسجَّلة — ولا يعني ذلك صمتاً: الحاجز يبلّغ تلقائياً منذ
            وصله، ويُبقي ثلاثين يوماً.
          </Card>
        ) : (
          <Card>
            <ul className="flex flex-col divide-y divide-line">
              {crashes.map((c) => (
                <li key={c.signature} className="flex flex-col gap-1 py-2.5">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <Badge variant={c.hits >= 5 ? "red" : "gold"}>{c.hits}×</Badge>
                    <span className="text-sm font-bold text-ink">{c.message}</span>
                    <span className="ms-auto text-xs text-faint">{formatDate(c.last_seen)}</span>
                  </div>
                  {c.page && (
                    <span className="text-[11px] text-faint" dir="ltr">
                      {c.page}
                    </span>
                  )}
                  {c.stack_head && (
                    <code className="overflow-x-auto whitespace-pre text-[11px] leading-relaxed text-dim" dir="ltr">
                      {c.stack_head.split("\n").slice(0, 3).join("\n")}
                    </code>
                  )}
                </li>
              ))}
            </ul>
            {/* ⚠️ الأثر مُصغَّر لأن `sourcemap: false` (§23) — والحلّ متتبّع
                أخطاء يستهلك خريطة `hidden`، لا إعادة نشر الخرائط للعامّة. */}
            <p className="mt-3 text-xs text-faint">
              مجمّعة بتوقيع الخطأ، وأكثرها تكراراً أولاً. الأثر مُصغَّر (خرائط
              المصدر غير منشورة عمداً)، والقاعدة تحدّ التكرار بخمسة في الدقيقة
              لكل توقيع فلا تُغرق حلقةُ انهيار السجلّ.
            </p>
          </Card>
        )}
      </section>

      {/* سجل التدقيق */}
      <section className="mt-10">
        <h2 className="inline-flex items-center gap-2 mb-3 font-display text-lg font-extrabold text-ink">
          <Icon name="card" size={17} className="shrink-0 text-gold" />{" "}
          سجل التدقيق</h2>
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

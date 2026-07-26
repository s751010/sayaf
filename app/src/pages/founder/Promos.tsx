/**
 * أكواد الخصم — إنشاء، تفعيل/تعطيل، وحذف.
 *
 * الخصم يُطبَّق على الخادم داخل `paylink-create` بقراءة هذا الجدول، ويُحتسب
 * الاستخدام في الويبهوك بعد نجاح الدفع فقط — فلا شيء هنا يقرّر مبلغاً.
 */
import { useCallback, useEffect, useState, type FormEvent } from "react";
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
import { founderAdmin } from "@/lib/api";
import { formatDate, numOrNull, strOrNull } from "@/lib/utils";
import type { PromoCode } from "@/lib/types";

export default function FounderPromos() {
  const toast = useToast();
  const [rows, setRows] = useState<PromoCode[] | null>(null);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("10");
  const [maxUses, setMaxUses] = useState("");
  const [expiry, setExpiry] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setRows(await founderAdmin<PromoCode[]>("promo_codes?select=*&order=created_at.desc"));
  }, []);

  useEffect(() => {
    load().catch(() => setRows([]));
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    const pct = numOrNull(discount);
    if (!clean) return setError("أدخل الكود.");
    if (pct === null || pct < 1 || pct > 100) return setError("نسبة الخصم بين ١ و١٠٠.");
    setBusy(true);
    setError("");
    try {
      await founderAdmin("promo_codes", {
        method: "POST",
        body: {
          code: clean,
          discount: Math.round(pct),
          max_uses: numOrNull(maxUses),
          expiry_date: strOrNull(expiry),
          description: strOrNull(description),
          active: true,
          uses: 0,
        },
      });
      setCode("");
      setMaxUses("");
      setExpiry("");
      setDescription("");
      await load();
      toast("أُنشئ الكود ✓");
    } catch {
      setError("تعذّر الإنشاء — قد يكون الكود مستخدماً.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(p: PromoCode) {
    try {
      await founderAdmin(`promo_codes?id=eq.${p.id}`, {
        method: "PATCH",
        body: { active: !p.active },
      });
      await load();
    } catch {
      toast("تعذّر التحديث.", "err");
    }
  }

  async function remove(p: PromoCode) {
    if (!window.confirm(`حذف الكود ${p.code} نهائياً؟`)) return;
    try {
      await founderAdmin(`promo_codes?id=eq.${p.id}`, { method: "DELETE" });
      await load();
      toast("حُذف الكود.");
    } catch {
      toast("تعذّر الحذف.", "err");
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-black text-ink">أكواد الخصم</h1>
      <p className="mt-1 text-sm text-dim">تُطبَّق على الاشتراكات عند الدفع.</p>

      <Card className="mt-6">
        <form onSubmit={create} className="grid gap-4 sm:grid-cols-2">
          <Field label="الكود">
            <Input
              dir="ltr"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="WELCOME20"
              required
            />
          </Field>
          <Field label="نسبة الخصم (٪)">
            <Input
              type="number"
              min="1"
              max="100"
              dir="ltr"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              required
            />
          </Field>
          <Field label="أقصى عدد استخدامات" hint="اتركه فارغاً لغير محدود">
            <Input type="number" min="1" dir="ltr" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
          </Field>
          <Field label="تاريخ الانتهاء" hint="اتركه فارغاً بلا انتهاء">
            <Input type="date" dir="ltr" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
          </Field>
          <Field label="وصف داخلي" className="sm:col-span-2">
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="حملة الافتتاح" />
          </Field>
          {error && <div className="sm:col-span-2"><ErrorNote>{error}</ErrorNote></div>}
          <Button type="submit" disabled={busy} className="sm:col-span-2 sm:justify-self-start sm:px-10">
            {busy ? "جارٍ الإنشاء…" : "إنشاء الكود"}
          </Button>
        </form>
      </Card>

      <section className="mt-8">
        {rows === null ? (
          <Skeleton className="h-40" />
        ) : rows.length === 0 ? (
          <Card className="py-10 text-center text-sm text-dim">لا توجد أكواد بعد.</Card>
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map((p) => {
              const expired = p.expiry_date ? new Date(p.expiry_date).getTime() < Date.now() : false;
              const drained = p.max_uses != null && (p.uses ?? 0) >= p.max_uses;
              return (
                <Card key={p.id} className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display font-black text-ink" dir="ltr">
                      {p.code} <span className="text-gold">−{p.discount}%</span>
                    </p>
                    <p className="mt-0.5 text-xs text-faint">
                      استُخدم {p.uses ?? 0}
                      {p.max_uses != null && ` من ${p.max_uses}`}
                      {p.expiry_date && ` · ينتهي ${formatDate(p.expiry_date)}`}
                      {p.description && ` · ${p.description}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.active && !expired && !drained ? "green" : "neutral"}>
                      {!p.active ? "معطّل" : expired ? "منتهٍ" : drained ? "مستنفد" : "فعّال"}
                    </Badge>
                    <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => toggle(p)}>
                      {p.active ? "تعطيل" : "تفعيل"}
                    </Button>
                    <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => remove(p)}>
                      حذف
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

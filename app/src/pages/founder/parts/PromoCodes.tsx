/**
 * أكواد الخصم (من «الفلوس» إلى «التسويق»، ٢٠٢٦/١١/٢٦) — إنشاء وإيقاف وحذف،
 * وكلّ إجراء في سجلّ التدقيق قبل تنفيذه.
 */
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Badge, Button, Card, Field, Input, Skeleton, useToast } from "@/components/ui";
import {
  createPromo,
  deletePromo,
  getPromos,
  logAudit,
  setPromoActive,
  type PromoCode,
} from "@/lib/founder";
import { formatDate } from "@/lib/utils";
import { Icon } from "@/lib/icons";

export function PromoCodes() {
  const toast = useToast();
  const [promos, setPromos] = useState<PromoCode[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("20");
  const [maxUses, setMaxUses] = useState("");
  const [expiry, setExpiry] = useState("");

  const load = useCallback(async () => {
    try {
      setPromos(await getPromos());
    } catch {
      toast("تعذّر تحميل الأكواد.", "err");
      setPromos([]);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addPromo(e: FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    const d = Number(discount);
    if (!c) return toast("اكتب الكود.", "err");
    if (!Number.isFinite(d) || d < 1 || d > 100) return toast("الخصم بين 1 و100.", "err");
    setBusy(true);
    try {
      await logAudit("إنشاء كود خصم", { table: "promo_codes", name: c, details: { discount: d } });
      await createPromo({
        code: c,
        discount: d,
        max_uses: maxUses.trim() ? Number(maxUses) : null,
        expiry_date: expiry || null,
        description: null,
      });
      setCode("");
      setMaxUses("");
      setExpiry("");
      await load();
      toast("أُنشئ الكود ✓");
    } catch {
      toast("تعذّر الإنشاء — قد يكون الكود مستخدماً.", "err");
    } finally {
      setBusy(false);
    }
  }

  async function togglePromo(p: PromoCode) {
    try {
      await logAudit(p.active ? "إيقاف كود خصم" : "تفعيل كود خصم", {
        table: "promo_codes",
        id: p.id,
        name: p.code,
      });
      await setPromoActive(p.id, !p.active);
      await load();
    } catch {
      toast("تعذّر التحديث.", "err");
    }
  }

  async function removePromo(p: PromoCode) {
    if (!window.confirm(`حذف الكود «${p.code}» نهائياً؟`)) return;
    try {
      await logAudit("حذف كود خصم", { table: "promo_codes", id: p.id, name: p.code });
      await deletePromo(p.id);
      await load();
      toast("حُذف الكود.");
    } catch {
      toast("تعذّر الحذف.", "err");
    }
  }


  return (
      <section>
        <h2 className="inline-flex items-center gap-2 mb-3 font-display text-lg font-extrabold text-ink">
          <Icon name="tag" size={17} className="shrink-0 text-gold" />{" "}
          أكواد الخصم</h2>
        <Card>
          <form onSubmit={addPromo} className="flex flex-wrap items-end gap-3">
            <Field label="الكود" className="w-40">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="RAMADAN30"
                dir="ltr"
              />
            </Field>
            <Field label="الخصم %" className="w-28">
              <Input
                type="number"
                min={1}
                max={100}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                dir="ltr"
              />
            </Field>
            <Field label="حد الاستخدام" className="w-32" hint="فارغ = بلا حد">
              <Input
                type="number"
                min={1}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                dir="ltr"
              />
            </Field>
            <Field label="ينتهي في" className="w-40">
              <Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} dir="ltr" />
            </Field>
            <Button type="submit" disabled={busy}>
              ＋ أنشئ
            </Button>
          </form>
        </Card>

        {promos === null ? (
          <Skeleton className="mt-4 h-24" />
        ) : promos.length === 0 ? (
          <Card className="mt-4 text-center text-sm text-dim">لا توجد أكواد بعد.</Card>
        ) : (
          <div className="mt-4 flex flex-col gap-2.5">
            {promos.map((p) => {
              const expired = p.expiry_date ? new Date(p.expiry_date) < new Date() : false;
              const spent = p.max_uses != null && (p.uses ?? 0) >= p.max_uses;
              return (
                <Card key={p.id} className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-ink" dir="ltr">
                      {p.code}{" "}
                      <span className="text-sm font-bold text-gold">−{p.discount}%</span>
                    </p>
                    <p className="mt-0.5 text-xs text-dim">
                      استُخدم {p.uses ?? 0}
                      {p.max_uses != null ? ` من ${p.max_uses}` : " (بلا حد)"}
                      {p.expiry_date && ` · ينتهي ${formatDate(p.expiry_date)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.active && !expired && !spent ? "green" : "neutral"}>
                      {!p.active ? "موقوف" : expired ? "منتهٍ" : spent ? "استُنفد" : "فعّال"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePromo(p)}
                    >
                      {p.active ? "إيقاف" : "تفعيل"}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => removePromo(p)}
                    >
                      حذف
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
        <p className="inline-flex items-center gap-2 mt-3 text-xs text-faint">
          <Icon name="warn" size={17} className="shrink-0 text-gold" />{" "}
          الأكواد تُحفظ وتُدار هنا، لكن صفحة الاشتراك عند التاجر لا تطلبها بعد — ربطها بمسار
          الدفع خطوة تالية تحتاج تعديل بوابة الدفع.
        </p>
      </section>
  );
}

/**
 * المطاعم — بحث، تعديل بيانات المطعم، والتحكم باشتراك صاحبه.
 *
 * الاشتراك يُمنح/يُلغى هنا يدوياً (هدية أو حالة دعم). التفعيل التلقائي بعد
 * الدفع يبقى مسؤولية ويبهوك PayLink وحده — لا يُكتب من المتصفح أبداً.
 */
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Badge,
  Button,
  Card,
  ErrorNote,
  Field,
  Input,
  Modal,
  Select,
  Skeleton,
  useToast,
} from "@/components/ui";
import { founderAdmin } from "@/lib/api";
import { PLANS, resolvePlan } from "@/lib/plans";
import { formatDate, slugify, strOrNull } from "@/lib/utils";
import type { Restaurant, Subscription } from "@/lib/types";

/** المطعم كما يصل للمؤسس — يشمل `user_id` (مفتاح الخدمة يتجاوز حجب الأعمدة). */
type FounderRestaurant = Restaurant & { user_id: string | null };

export default function FounderRestaurants() {
  const toast = useToast();
  const [rows, setRows] = useState<FounderRestaurant[] | null>(null);
  const [subs, setSubs] = useState<Record<string, Subscription>>({});
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<FounderRestaurant | null>(null);

  const load = useCallback(async () => {
    const [rests, subRows] = await Promise.all([
      founderAdmin<FounderRestaurant[]>("restaurants?select=*&order=created_at.desc"),
      founderAdmin<Subscription[]>("subscriptions?active=eq.true&select=*&order=end_date.desc"),
    ]);
    setRows(rests);
    // أحدث اشتراك ساري لكل مستخدم.
    const map: Record<string, Subscription> = {};
    for (const s of subRows) {
      if (!s.user_id) continue;
      const ends = s.end_date ? new Date(s.end_date).getTime() : Infinity;
      if (ends < Date.now()) continue;
      if (!map[s.user_id]) map[s.user_id] = s;
    }
    setSubs(map);
  }, []);

  useEffect(() => {
    load().catch(() => setRows([]));
  }, [load]);

  const filtered = (rows ?? []).filter((r) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return [r.name, r.slug, r.type, r.phone].some((v) => v?.toLowerCase().includes(needle));
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-black text-ink">المطاعم</h1>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 ابحث بالاسم أو الرابط…"
          className="w-full sm:w-72"
        />
      </div>

      {rows === null ? (
        <Skeleton className="mt-6 h-64" />
      ) : filtered.length === 0 ? (
        <Card className="mt-6 py-10 text-center text-sm text-dim">لا توجد نتائج.</Card>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {filtered.map((r) => {
            const sub = r.user_id ? subs[r.user_id] : undefined;
            return (
              <Card key={r.id} className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-ink">{r.name}</p>
                  <p className="mt-0.5 text-xs text-faint">
                    <span dir="ltr">/{r.slug ?? "—"}</span> · {r.type ?? "بلا نوع"} ·{" "}
                    {formatDate(r.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={sub ? "gold" : "neutral"}>
                    {sub ? resolvePlan(sub.plan_id).name : "بدون اشتراك"}
                  </Badge>
                  {r.slug && (
                    <a
                      href={`/${r.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-line px-3 py-1.5 text-xs font-bold text-dim hover:text-ink"
                    >
                      عرض ↗
                    </a>
                  )}
                  <Button
                    variant="outline"
                    className="px-3 py-1.5 text-xs"
                    onClick={() => setEditing(r)}
                  >
                    إدارة
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {editing && (
        <ManageModal
          restaurant={editing}
          sub={editing.user_id ? subs[editing.user_id] : undefined}
          onClose={() => setEditing(null)}
          onSaved={async (msg) => {
            toast(msg);
            await load().catch(() => {});
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

/* ── نافذة إدارة مطعم واحد ────────────────────────────────────────── */
function ManageModal({
  restaurant,
  sub,
  onClose,
  onSaved,
}: {
  restaurant: FounderRestaurant;
  sub: Subscription | undefined;
  onClose: () => void;
  onSaved: (msg: string) => void | Promise<void>;
}) {
  const [name, setName] = useState(restaurant.name);
  const [slug, setSlug] = useState(restaurant.slug ?? "");
  const [type, setType] = useState(restaurant.type ?? "");
  const [phone, setPhone] = useState(restaurant.phone ?? "");
  const [planId, setPlanId] = useState(sub?.plan_id ?? "premium");
  const [months, setMonths] = useState("12");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function saveDetails(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("الاسم مطلوب.");
    setBusy(true);
    setError("");
    try {
      await founderAdmin(`restaurants?id=eq.${restaurant.id}`, {
        method: "PATCH",
        body: {
          name: name.trim(),
          slug: slugify(slug) || null,
          type: strOrNull(type),
          phone: strOrNull(phone),
        },
      });
      await onSaved("حُفظت بيانات المطعم ✓");
    } catch {
      setError("تعذّر الحفظ — قد يكون الرابط مستخدماً.");
      setBusy(false);
    }
  }

  /** منح اشتراك يدوي: إلغاء الساري ثم إنشاء واحد جديد بمدة محدّدة. */
  async function grant() {
    if (!restaurant.user_id) return setError("لا يوجد مالك مرتبط بهذا المطعم.");
    const n = Number(months);
    if (!Number.isFinite(n) || n < 1) return setError("عدد الأشهر غير صالح.");
    setBusy(true);
    setError("");
    try {
      const end = new Date();
      end.setMonth(end.getMonth() + n);
      if (sub) {
        await founderAdmin(`subscriptions?id=eq.${sub.id}`, {
          method: "PATCH",
          body: { plan_id: planId, end_date: end.toISOString(), active: true, cancelled_at: null },
        });
      } else {
        // لا POST على subscriptions في القائمة البيضاء — نمدّد أي صف سابق لنفس المستخدم.
        const prior = await founderAdmin<Subscription[]>(
          `subscriptions?user_id=eq.${restaurant.user_id}&select=*&order=created_at.desc&limit=1`
        );
        if (!prior[0]) {
          setError("لا يوجد اشتراك سابق لهذا المستخدم — يُنشأ أول اشتراك عبر الدفع فقط.");
          setBusy(false);
          return;
        }
        await founderAdmin(`subscriptions?id=eq.${prior[0].id}`, {
          method: "PATCH",
          body: { plan_id: planId, end_date: end.toISOString(), active: true, cancelled_at: null },
        });
      }
      await onSaved("حُدّث الاشتراك ✓");
    } catch {
      setError("تعذّر تحديث الاشتراك.");
      setBusy(false);
    }
  }

  async function cancel() {
    if (!sub) return;
    setBusy(true);
    setError("");
    try {
      await founderAdmin(`subscriptions?id=eq.${sub.id}`, {
        method: "PATCH",
        body: { active: false, cancelled_at: new Date().toISOString() },
      });
      await onSaved("أُلغي الاشتراك.");
    } catch {
      setError("تعذّر الإلغاء.");
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`إدارة: ${restaurant.name}`} wide>
      <form onSubmit={saveDetails} className="grid gap-4 sm:grid-cols-2">
        <Field label="الاسم">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="الرابط (slug)">
          <Input dir="ltr" value={slug} onChange={(e) => setSlug(e.target.value)} />
        </Field>
        <Field label="النوع">
          <Input value={type} onChange={(e) => setType(e.target.value)} />
        </Field>
        <Field label="الهاتف">
          <Input dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Button type="submit" disabled={busy} className="sm:col-span-2">
          {busy ? "جارٍ الحفظ…" : "حفظ البيانات"}
        </Button>
      </form>

      <div className="mt-6 border-t border-line pt-5">
        <h3 className="font-display font-extrabold text-ink">📦 الاشتراك</h3>
        <p className="mt-1 text-xs text-dim">
          {sub
            ? `ساري على باقة ${resolvePlan(sub.plan_id).name} حتى ${formatDate(sub.end_date)}`
            : "لا يوجد اشتراك ساري."}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Field label="الباقة">
            <Select value={planId} onChange={(e) => setPlanId(e.target.value)}>
              {PLANS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="المدة (أشهر)">
            <Input
              type="number"
              min="1"
              max="60"
              dir="ltr"
              value={months}
              onChange={(e) => setMonths(e.target.value)}
            />
          </Field>
          <div className="flex items-end gap-2">
            <Button type="button" onClick={grant} disabled={busy} className="flex-1">
              تفعيل / تمديد
            </Button>
          </div>
        </div>

        {sub && (
          <Button type="button" variant="danger" onClick={cancel} disabled={busy} className="mt-3">
            إلغاء الاشتراك
          </Button>
        )}
      </div>

      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}
    </Modal>
  );
}

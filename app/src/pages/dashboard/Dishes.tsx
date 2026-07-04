/**
 * إدارة الأطباق — القائمة + محرر كامل.
 * ⚠️ القاعدة (أ): فورم الطبق هنا + DishPayload في lib/data هما مصدر الحقول؛
 * أي حقل جديد في جدول dishes يُضاف في الحالتين معاً وإلا يسقط بصمت.
 */
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Button,
  Card,
  EmptyState,
  ErrorNote,
  Field,
  Input,
  Modal,
  Select,
  Skeleton,
  Switch,
  Textarea,
  useToast,
} from "@/components/ui";
import {
  countDishes,
  createDish,
  deleteDish,
  getMyDishes,
  toggleDishAvailability,
  updateDish,
  type DishPayload,
} from "@/lib/data";
import { cn, csvToArray, formatPrice, numOrNull, strOrNull } from "@/lib/utils";
import type { Dish } from "@/lib/types";
import { useDashboard, UpgradeGate } from "./Dashboard";

/* تهيئة الفورم (القاعدة أ — المكان 1) */
type DishForm = {
  name: string;
  description: string;
  price: string;
  category: string;
  emoji: string;
  image: string;
  featured: boolean;
  available: boolean;
  calories: string;
  sodium_mg: string;
  caffeine_mg: string;
  burn_minutes: string;
  allergens: string;
  name_en: string;
  description_en: string;
  options: string;
  menu_id: string;
};

const EMPTY_FORM: Omit<DishForm, "menu_id"> = {
  name: "",
  description: "",
  price: "",
  category: "",
  emoji: "🍔",
  image: "",
  featured: false,
  available: true,
  calories: "",
  sodium_mg: "",
  caffeine_mg: "",
  burn_minutes: "",
  allergens: "",
  name_en: "",
  description_en: "",
  options: "",
};

function toForm(d: Dish): DishForm {
  return {
    name: d.name,
    description: d.description ?? "",
    price: d.price != null ? String(d.price) : "",
    category: d.category ?? "",
    emoji: d.emoji ?? "🍽",
    image: d.image ?? "",
    featured: d.featured ?? false,
    available: d.available ?? true,
    calories: d.calories != null ? String(d.calories) : "",
    sodium_mg: d.sodium_mg != null ? String(d.sodium_mg) : "",
    caffeine_mg: d.caffeine_mg != null ? String(d.caffeine_mg) : "",
    burn_minutes: d.burn_minutes != null ? String(d.burn_minutes) : "",
    allergens: (d.allergens ?? []).join("، "),
    name_en: d.name_en ?? "",
    description_en: d.description_en ?? "",
    options: d.options ?? "",
    menu_id: d.menu_id ?? "",
  };
}

/** الفورم → payload موحّد للإضافة والتحديث (القاعدة أ — المكانان 2 و3). */
function toPayload(f: DishForm, englishAllowed: boolean): DishPayload {
  return {
    name: f.name.trim(),
    description: strOrNull(f.description),
    price: numOrNull(f.price) ?? 0,
    category: strOrNull(f.category),
    emoji: strOrNull(f.emoji) ?? "🍽",
    image: strOrNull(f.image),
    featured: f.featured,
    available: f.available,
    calories: numOrNull(f.calories),
    sodium_mg: numOrNull(f.sodium_mg),
    caffeine_mg: numOrNull(f.caffeine_mg),
    burn_minutes: numOrNull(f.burn_minutes),
    allergens: csvToArray(f.allergens),
    name_en: englishAllowed ? strOrNull(f.name_en) : null,
    description_en: englishAllowed ? strOrNull(f.description_en) : null,
    options: strOrNull(f.options),
  };
}

const QUICK_EMOJIS = ["🍔", "🍕", "🍗", "🥩", "🍤", "🍝", "🥗", "🍚", "🌯", "🧆", "🍰", "🍩", "☕", "🧋", "🥤", "🍹"];

export default function Dishes() {
  const { user, restaurant, menus, ent } = useDashboard();
  const toast = useToast();
  const [dishes, setDishes] = useState<Dish[] | null>(null);
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<Dish | "new" | null>(null);
  const [form, setForm] = useState<DishForm>({ ...EMPTY_FORM, menu_id: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "الأطباق — كلاود منيو";
    getMyDishes(restaurant.id).then(setDishes).catch(() => setDishes([]));
  }, [restaurant.id]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return dishes ?? [];
    return (dishes ?? []).filter((d) =>
      [d.name, d.category, d.name_en].filter(Boolean).some((s) => s!.toLowerCase().includes(q))
    );
  }, [dishes, filter]);

  function openNew() {
    setForm({ ...EMPTY_FORM, menu_id: menus[0]?.id ?? "" });
    setError("");
    setEditing("new");
  }

  function openEdit(d: Dish) {
    setForm(toForm(d));
    setError("");
    setEditing(d);
  }

  const set = <K extends keyof DishForm>(k: K, v: DishForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return setError("اسم الطبق مطلوب.");
    if (!form.menu_id) return setError("اختر القائمة.");
    setBusy(true);
    setError("");
    try {
      const payload = toPayload(form, ent.english);
      if (editing === "new") {
        // فرض حدّ الأصناف حسب الباقة.
        if (ent.maxDishes !== null) {
          const count = await countDishes(restaurant.id);
          if (count >= ent.maxDishes) {
            setError(`باقتك تسمح بـ ${ent.maxDishes} صنف. رقِّ إلى الاحترافية لأصناف غير محدودة.`);
            setBusy(false);
            return;
          }
        }
        const created = await createDish(payload, {
          menu_id: form.menu_id,
          restaurant_id: restaurant.id,
          user_id: user.id,
        });
        setDishes((ds) => [created, ...(ds ?? [])]);
        toast("أُضيف الطبق ✓");
      } else if (editing) {
        await updateDish(editing.id, { ...payload, menu_id: form.menu_id });
        setDishes((ds) =>
          ds?.map((d) => (d.id === editing.id ? { ...d, ...payload, menu_id: form.menu_id } : d)) ?? null
        );
        toast("حُفظت التعديلات ✓");
      }
      setEditing(null);
    } catch {
      setError("تعذّر الحفظ. حاول مجدداً.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(d: Dish) {
    if (!window.confirm(`حذف «${d.name}» نهائياً؟`)) return;
    try {
      await deleteDish(d.id);
      setDishes((ds) => ds?.filter((x) => x.id !== d.id) ?? null);
      toast("حُذف الطبق.");
    } catch {
      toast("تعذّر الحذف.", "err");
    }
  }

  async function toggle(d: Dish) {
    const next = !(d.available ?? true);
    setDishes((ds) => ds?.map((x) => (x.id === d.id ? { ...x, available: next } : x)) ?? null);
    try {
      await toggleDishAvailability(d.id, next);
    } catch {
      setDishes((ds) => ds?.map((x) => (x.id === d.id ? { ...x, available: !next } : x)) ?? null);
      toast("تعذّر التحديث.", "err");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-ink">الأطباق</h1>
          <p className="mt-1 text-sm text-dim">
            {dishes ? `${dishes.length} طبقاً` : "…"}
            {ent.maxDishes !== null && ` من أصل ${ent.maxDishes} في باقتك`}
          </p>
        </div>
        <Button onClick={openNew}>＋ طبق جديد</Button>
      </div>

      {menus.length === 0 && (
        <Card className="mt-6 text-sm text-dim">
          أنشئ قائمة أولاً من صفحة «القوائم» ثم أضف أطباقك.
        </Card>
      )}

      <Input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="🔍 ابحث باسم الطبق أو التصنيف…"
        className="mt-5"
      />

      {dishes === null ? (
        <div className="mt-5 flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            emoji="🍽️"
            title={filter ? "لا نتائج لبحثك" : "لا توجد أطباق بعد"}
            desc={filter ? undefined : "أضف أول طبق وسيظهر في منيوك فوراً."}
            action={!filter && <Button onClick={openNew}>＋ إضافة طبق</Button>}
          />
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-2.5">
          {filtered.map((d) => (
            <Card
              key={d.id}
              className={cn("flex items-center gap-3 py-3", d.available === false && "opacity-55")}
            >
              {d.image ? (
                <img src={d.image} alt="" loading="lazy" className="h-12 w-12 rounded-xl object-cover" />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-panel2 text-2xl">
                  {d.emoji ?? "🍽"}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-ink">
                  {d.name} {d.featured && <span className="text-gold">★</span>}
                </p>
                <p className="text-xs text-faint">
                  {d.category ?? "بدون تصنيف"} · 👁️ {d.views ?? 0}
                </p>
              </div>
              <span className="hidden font-bold text-gold sm:block">
                {formatPrice(d.price ?? 0)} ر.س
              </span>
              <Switch checked={d.available ?? true} onChange={() => toggle(d)} label="متاح" />
              <button
                onClick={() => openEdit(d)}
                className="rounded-lg px-2.5 py-1.5 text-sm font-bold text-dim hover:bg-ink/6 hover:text-ink"
              >
                تعديل
              </button>
              <button
                onClick={() => remove(d)}
                aria-label="حذف"
                className="rounded-lg px-2 py-1.5 text-sm text-bad hover:bg-bad/10"
              >
                🗑
              </button>
            </Card>
          ))}
        </div>
      )}

      {/* المحرر */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "طبق جديد" : "تعديل الطبق"}
        wide
      >
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <Field label="اسم الطبق" className="sm:col-span-2">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </Field>
          <Field label="الوصف" className="sm:col-span-2">
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="وصف شهي يظهر للزبون…"
            />
          </Field>
          <Field label="السعر (ر.س)">
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.5"
              dir="ltr"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              required
            />
          </Field>
          <Field label="التصنيف" hint="مثال: المشاوي، المقبلات، الحلويات">
            <Input value={form.category} onChange={(e) => set("category", e.target.value)} />
          </Field>
          <Field label="القائمة">
            <Select value={form.menu_id} onChange={(e) => set("menu_id", e.target.value)} required>
              <option value="" disabled>اختر…</option>
              {menus.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="رابط الصورة (اختياري)">
            <Input
              dir="ltr"
              value={form.image}
              onChange={(e) => set("image", e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <Field label="الإيموجي (بديل الصورة)" className="sm:col-span-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {QUICK_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => set("emoji", em)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg border text-lg",
                    form.emoji === em ? "border-gold bg-gold/12" : "border-line hover:bg-ink/5"
                  )}
                >
                  {em}
                </button>
              ))}
              <Input
                value={form.emoji}
                onChange={(e) => set("emoji", e.target.value)}
                className="w-16 text-center"
                aria-label="إيموجي مخصص"
              />
            </div>
          </Field>

          <div className="flex items-center justify-between rounded-xl border border-line bg-panel2 px-4 py-3">
            <span className="text-sm font-bold text-ink">⭐ طبق مميز</span>
            <Switch checked={form.featured} onChange={(v) => set("featured", v)} label="مميز" />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-line bg-panel2 px-4 py-3">
            <span className="text-sm font-bold text-ink">🟢 متاح الآن</span>
            <Switch checked={form.available} onChange={(v) => set("available", v)} label="متاح" />
          </div>

          <p className="sm:col-span-2 -mb-1 mt-1 text-xs font-black text-faint">
            المعلومات الغذائية (SFDA)
          </p>
          <Field label="سعرات حرارية">
            <Input type="number" inputMode="numeric" min="0" dir="ltr" value={form.calories} onChange={(e) => set("calories", e.target.value)} />
          </Field>
          <Field label="صوديوم (ملغم)">
            <Input type="number" inputMode="numeric" min="0" dir="ltr" value={form.sodium_mg} onChange={(e) => set("sodium_mg", e.target.value)} />
          </Field>
          <Field label="كافيين (ملغم)">
            <Input type="number" inputMode="numeric" min="0" dir="ltr" value={form.caffeine_mg} onChange={(e) => set("caffeine_mg", e.target.value)} />
          </Field>
          <Field label="دقائق حرق (مشي)">
            <Input type="number" inputMode="numeric" min="0" dir="ltr" value={form.burn_minutes} onChange={(e) => set("burn_minutes", e.target.value)} />
          </Field>
          <Field label="مسببات الحساسية" hint="افصل بفاصلة: مكسرات، جلوتين، حليب" className="sm:col-span-2">
            <Input value={form.allergens} onChange={(e) => set("allergens", e.target.value)} />
          </Field>
          <Field label="الخيارات والإضافات" hint="سطر لكل خيار، أو JSON مثل: [{&quot;name&quot;:&quot;جبن إضافي&quot;,&quot;price&quot;:5}]" className="sm:col-span-2">
            <Textarea value={form.options} onChange={(e) => set("options", e.target.value)} />
          </Field>

          <p className="sm:col-span-2 -mb-1 mt-1 text-xs font-black text-faint">
            الإنجليزية {!ent.english && "— متاحة في باقة الاحترافية"}
          </p>
          <Field label="Name (EN)">
            <Input dir="ltr" value={form.name_en} onChange={(e) => set("name_en", e.target.value)} disabled={!ent.english} />
          </Field>
          <Field label="Description (EN)">
            <Input dir="ltr" value={form.description_en} onChange={(e) => set("description_en", e.target.value)} disabled={!ent.english} />
          </Field>

          {error && <div className="sm:col-span-2"><ErrorNote>{error}</ErrorNote></div>}

          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={busy} className="flex-1">
              {busy ? "جارٍ الحفظ…" : editing === "new" ? "إضافة الطبق" : "حفظ التعديلات"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              إلغاء
            </Button>
          </div>
        </form>
      </Modal>

      {!ent.active && dishes !== null && dishes.length > 0 && (
        <UpgradeGate
          title="فعّل اشتراكك لتفتح كل الميزات"
          desc="اشترك في إحدى الباقات لضمان استمرار منيوك وفتح الإحصائيات المتقدمة والمستشار الذكي."
        />
      )}
    </div>
  );
}

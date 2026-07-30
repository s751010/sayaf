/**
 * إدارة الأطباق — القائمة + محرر كامل.
 * ⚠️ القاعدة (أ): فورم الطبق هنا + DishPayload في lib/data هما مصدر الحقول؛
 * أي حقل جديد في جدول dishes يُضاف في الحالتين معاً وإلا يسقط بصمت.
 */
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorNote,
  Field,
  Input,
  Modal,
  SafeImage,
  Select,
  Skeleton,
  Switch,
  Textarea,
  useToast,
} from "@/components/ui";
import { ImageUploader } from "@/components/ImageUploader";
import { OptionsEditor } from "@/components/OptionsEditor";
import { AllergenPicker } from "@/components/AllergenPicker";
import {
  countDishes,
  createDish,
  deleteDish,
  getMyDishes,
  toggleDishAvailability,
  updateDish,
  type DishPayload,
} from "@/lib/data";
import { cn, formatPrice, numOrNull, strOrNull } from "@/lib/utils";
import { computedNutrition } from "@/lib/nutrition";
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
  /** معرّفات المسببات كما تُخزَّن في dishes.allergens. */
  allergens: string[];
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
  allergens: [],
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
    allergens: d.allergens ?? [],
    name_en: d.name_en ?? "",
    description_en: d.description_en ?? "",
    options: d.options ?? "",
    menu_id: d.menu_id ?? "",
  };
}

/**
 * الفورم → payload موحّد للإضافة والتحديث (القاعدة أ — المكانان 2 و3).
 *
 * الحقول الإنجليزية تُمرَّر كما هي دائماً: حقولها معطّلة في الواجهة عند غياب
 * الصلاحية، فتبقى محمّلة بقيمة الطبق الأصلية. تصفيرها هنا كان يمحو ترجمات
 * التاجر نهائياً عند أول تعديل بعد انتهاء الاشتراك.
 */
function toPayload(f: DishForm): DishPayload {
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
    allergens: f.allergens,
    name_en: strOrNull(f.name_en),
    description_en: strOrNull(f.description_en),
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

  // القيم التي تحسبها قاعدة البيانات — نعرضها للتاجر لحظياً وهو يكتب.
  const computed = computedNutrition(numOrNull(form.calories), numOrNull(form.sodium_mg));

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return dishes ?? [];
    return (dishes ?? []).filter((d) =>
      [d.name, d.category, d.name_en].filter(Boolean).some((s) => s!.toLowerCase().includes(q))
    );
  }, [dishes, filter]);

  function openNew() {
    setForm({ ...EMPTY_FORM, menu_id: menus?.[0]?.id ?? "" });
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
    // السعر كان يسقط إلى صفر بصمت عند إدخال غير قابل للتحويل (أرقام عربية،
    // «45 ريال»…) فيُنشر الطبق مجاناً في المنيو.
    const price = numOrNull(form.price);
    if (price === null) return setError("اكتب سعراً صحيحاً بالأرقام.");
    if (price < 0) return setError("السعر لا يمكن أن يكون سالباً.");
    setBusy(true);
    setError("");
    try {
      const payload = toPayload(form);
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

      {/* لا تُعرض هذه التعليمة إلا بعد أن تُحسم القوائم فعلاً — كانت تظهر
          لكل تاجر في كل تحميل لأن الافتراضي كان مصفوفة فارغة. */}
      {menus !== null && menus.length === 0 && (
        <Card className="mt-6 flex flex-wrap items-center justify-between gap-3 border-gold/30 bg-gold/[.04] text-sm text-ink">
          <span>تحتاج قائمة قبل إضافة الأطباق — أنشئها في خطوة واحدة.</span>
          <Link
            to="/dashboard/menus"
            className="rounded-xl bg-gold px-4 py-2 text-sm font-bold text-on-gold"
          >
            أنشئ قائمة
          </Link>
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
              <SafeImage
                src={d.image}
                alt=""
                className="h-12 w-12 rounded-xl object-cover"
                wrapperClassName="h-12 w-12 shrink-0 rounded-xl bg-panel2 text-2xl"
                fallback={d.emoji ?? "🍽"}
              />
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
              {(menus ?? []).map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <ImageUploader
              label="صورة الطبق (اختيارية)"
              value={form.image}
              onChange={(url) => set("image", url)}
              bucket="dish-images"
              pathPrefix={restaurant.id}
              shape="square"
            />
          </div>
          <Field label="الإيموجي (يظهر عند غياب الصورة)" className="sm:col-span-2">
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

          <div className="sm:col-span-2">
            <OptionsEditor
              key={editing === "new" ? "new" : (editing?.id ?? "none")}
              value={form.options}
              onChange={(v) => set("options", v)}
            />
          </div>

          {/* الحقول المتقدّمة مطويّة: التاجر يحتاج الاسم والسعر والصورة لينشر
              طبقاً، وبقيّة الحقول اختيارية تماماً. */}
          <details className="sm:col-span-2 rounded-xl border border-line bg-panel2/60 px-4 py-3 [&[open]]:pb-4">
            <summary className="cursor-pointer list-none text-sm font-bold text-ink marker:hidden">
              <span className="select-none">▾ معلومات إضافية — غذائية، حساسية، إنجليزية</span>
              <span className="mt-0.5 block text-xs font-normal text-faint">
                كلها اختيارية — يمكنك نشر الطبق بدونها.
              </span>
            </summary>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <p className="sm:col-span-2 -mb-1 text-xs font-black text-faint">
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

          {/* تُحسب في قاعدة البيانات من السعرات والصوديوم — نعرضها ولا نطلبها.
              (إرسال قيمة لعمود محسوب كان يُفشل الحفظ كاملاً.) */}
          <div className="sm:col-span-2 rounded-xl border border-line bg-panel2/60 px-4 py-3">
            <p className="text-xs font-black text-faint">يُحسب تلقائياً</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              {computed.burnMinutes !== null ? (
                <Badge variant="neutral">🔥 {computed.burnMinutes} دقيقة مشي لحرقه</Badge>
              ) : (
                <span className="text-xs text-faint">اكتب السعرات ليُحسب وقت الحرق.</span>
              )}
              {computed.highSodium && <Badge variant="red">🧂 صوديوم مرتفع</Badge>}
              {computed.sfdaCompliant ? (
                <Badge variant="green">✅ متوافق مع SFDA</Badge>
              ) : (
                <span className="text-xs text-faint">
                  أضف السعرات والصوديوم ليظهر شعار توافق SFDA للزبون.
                </span>
              )}
            </div>
          </div>

          <div className="sm:col-span-2">
            <AllergenPicker value={form.allergens} onChange={(v) => set("allergens", v)} />
          </div>

          <p className="sm:col-span-2 -mb-1 mt-1 text-xs font-black text-faint">الإنجليزية</p>
          <Field label="Name (EN)">
            <Input dir="ltr" value={form.name_en} onChange={(e) => set("name_en", e.target.value)} />
          </Field>
          <Field label="Description (EN)">
            <Input dir="ltr" value={form.description_en} onChange={(e) => set("description_en", e.target.value)} />
          </Field>
            </div>
          </details>

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

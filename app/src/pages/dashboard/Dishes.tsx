/**
 * إدارة الأطباق — القائمة + محرر كامل.
 * ⚠️ القاعدة (أ): فورم الطبق هنا + DishPayload في lib/data هما مصدر الحقول؛
 * أي حقل جديد في جدول dishes يُضاف في الحالتين معاً وإلا يسقط بصمت.
 */
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
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
import { PreviewMenuButton } from "@/components/site";
import { DishImport } from "@/components/DishImport";
import { BulkImages } from "@/components/BulkImages";
import { ImageUploader } from "@/components/ImageUploader";
import { OptionsEditor } from "@/components/OptionsEditor";
import { AllergenPicker } from "@/components/AllergenPicker";
import {
  countDishes,
  createDish,
  createDishes,
  createMenu,
  deleteDish,
  duplicateDish,
  getMyDishes,
  setDishImage,
  toggleDishAvailability,
  updateDish,
  updateDishPrice,
  type DishPayload,
} from "@/lib/data";
import {
  renameCategory,
  reorderDishes,
  updateCategoryOrder,
} from "@/lib/data";
import { rowToPayload, type ParsedRow } from "@/lib/import";
import {
  categoriesOf,
  matchKnownCategory,
  moveItem,
  parseCategoryOrder,
  reconcileOrder,
  serializeCategoryOrder,
  sortCategories,
} from "@/lib/categories";
import { ReorderList } from "@/components/Reorder";
import { CategoryManager } from "@/components/CategoryManager";
import { StarterMenu } from "@/components/StarterMenu";
import { aliasType, type StarterDish } from "@/lib/starterMenus";
import { cn, formatPrice, numOrNull, strOrNull } from "@/lib/utils";
import { computedNutrition } from "@/lib/nutrition";
import type { Dish } from "@/lib/types";
import { useDashboard, UpgradeGate } from "./Dashboard";
import { MenuTabs } from "./Tabs";

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

/** اسم التصنيف الافتراضي — يطابق ما يعرضه `MenuPage` للزبون. */
const UNCATEGORIZED = "أخرى";

/**
 * السعر قابلاً للتعديل في مكانه.
 *
 * تغيير سعر هو أكثر فعل يومي عند المطعم، وكان يكلّف فتح نموذج بعشرة حقول. هنا
 * ضغطة واحدة ثم Enter. Escape يتراجع، والخروج من الحقل يحفظ — لأن التاجر على
 * الجوال يضغط خارج الحقل أكثر مما يضغط Enter.
 */
function PriceCell({ dish: d, onSave }: { dish: Dish; onSave: (p: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");

  function commit() {
    setEditing(false);
    const n = numOrNull(value);
    if (n === null || n < 0 || n === (d.price ?? 0)) return;
    onSave(n);
  }

  if (!editing) {
    return (
      <button
        onClick={() => {
          setValue(String(d.price ?? 0));
          setEditing(true);
        }}
        title="اضغط لتعديل السعر"
        className="-mx-1 shrink-0 rounded-lg px-1 py-0.5 text-sm font-bold text-gold hover:bg-gold/10"
      >
        {formatPrice(d.price ?? 0)} ر.س
      </button>
    );
  }
  return (
    <input
      autoFocus
      dir="ltr"
      inputMode="decimal"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setEditing(false);
      }}
      className="w-20 shrink-0 rounded-lg border border-gold/50 bg-panel2 px-2 py-1 text-center text-sm font-bold text-ink"
    />
  );
}

function DishRow({
  dish: d,
  showCategory,
  onToggle,
  onEdit,
  onRemove,
  onPrice,
  onDuplicate,
}: {
  dish: Dish;
  showCategory?: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onPrice: (p: number) => void;
  onDuplicate: () => void;
}) {
  return (
    /* على الجوال ينزل شريط الأدوات سطراً ثانياً: الصف يحمل مقبض سحب وصورة
       واسماً وسعراً ومفتاحاً وثلاثة أزرار، وحشرُها في سطر واحد على ٣٩٠px كان
       يترك لاسم الطبق ٢٩ بكسل — أي يمحوه. الاسم أهمّ من توفير سطر. */
    <Card
      className={cn(
        "flex flex-wrap items-center gap-y-1.5 gap-x-2 border-transparent bg-transparent p-0 shadow-none sm:flex-nowrap sm:gap-x-3",
        d.available === false && "opacity-55"
      )}
    >
      <SafeImage
        src={d.image}
        alt=""
        className="h-12 w-12 rounded-xl object-cover"
        wrapperClassName="h-12 w-12 shrink-0 rounded-xl bg-panel2 text-2xl"
        fallback={d.emoji ?? "🍽"}
      />
      <div className="min-w-0 flex-1 basis-[55%] sm:basis-auto">
        <p className="truncate font-bold text-ink">
          {d.name} {d.featured && <span className="text-gold">★</span>}
          {/* «نفد» شارة لا مجرّد شفافية: التاجر يمرّ على القائمة سريعاً، والحالة
              التي تُغيّر ما يراه زبونه يجب أن تُقرأ لا تُستنتج. */}
          {d.available === false && (
            <span className="ms-1.5 rounded-md bg-bad/15 px-1.5 py-0.5 text-[10px] font-black text-bad">
              نفد
            </span>
          )}
        </p>
        {/* السعر تحت الاسم لا بجانبه: الصف يحمل ثمانية عناصر على عرض ٣٩٠px،
            ووضعُه أفقياً كان يسحق اسم الطبق حتى يختفي. وهنا يبقى **ظاهراً على
            الجوال** — كان `hidden sm:block`، أي أن أهمّ حقل غائب عن الشاشة التي
            يعمل عليها التاجر فعلاً. */}
        <p className="flex items-center gap-2 text-xs text-faint">
          <PriceCell dish={d} onSave={onPrice} />
          <span>
            {showCategory && `${d.category ?? "بدون تصنيف"} · `}👁️ {d.views ?? 0}
          </span>
        </p>
      </div>
      <Switch checked={d.available ?? true} onChange={onToggle} label="متاح" />
      <button
        onClick={onEdit}
        className="rounded-lg px-2.5 py-1.5 text-sm font-bold text-dim hover:bg-ink/6 hover:text-ink"
      >
        تعديل
      </button>
      <button
        onClick={onDuplicate}
        aria-label="تكرار"
        title="تكرار الطبق"
        className="hidden rounded-lg px-2 py-1.5 text-sm text-dim hover:bg-ink/6 hover:text-ink sm:block"
      >
        ⧉
      </button>
      <button
        onClick={onRemove}
        aria-label="حذف"
        className="rounded-lg px-2 py-1.5 text-sm text-bad hover:bg-bad/10"
      >
        🗑
      </button>
    </Card>
  );
}

export default function Dishes() {
  const { user, restaurant, setRestaurant, menus, refreshMenus, ent } = useDashboard();
  const toast = useToast();
  const [dishes, setDishes] = useState<Dish[] | null>(null);
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<Dish | "new" | null>(null);
  const [importing, setImporting] = useState(false);
  const [bulkImages, setBulkImages] = useState(false);
  const [managingCats, setManagingCats] = useState(false);
  // `?starter=1` يأتي من الأونبوردنغ مباشرةً بعد إنشاء المطعم.
  const [params] = useSearchParams();
  const [starter, setStarter] = useState(params.get("starter") === "1");
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

  /** الأطباق بلا صورة — عتبة ٣ كي لا يزعج تاجراً نسي طبقاً واحداً. */
  const missingImages = useMemo(
    () => (dishes ?? []).filter((d) => !d.image?.trim()),
    [dishes]
  );

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

  /**
   * يضمن وجود قائمة يُسنَد إليها الطبق.
   *
   * كان التاجر بلا قائمة يصطدم بجدار «تحتاج قائمة قبل إضافة الأطباق» ويُرسَل
   * إلى صفحة أخرى ليتعلّم مفهوماً لا يعنيه — و١٠ من ١٩ مطعماً في الإنتاج بلا
   * قائمة أصلاً لأن إنشاءها التلقائي أُضيف متأخراً. الآن تُنشأ عند الحاجة
   * ضمن نفس الحركة، ويُخبَر بما حدث بدل أن يقع صامتاً.
   */
  async function ensureMenu(): Promise<string> {
    if (form.menu_id) return form.menu_id;
    const existing = menus?.[0]?.id;
    if (existing) return existing;
    const m = await createMenu({
      name: "القائمة الرئيسية",
      restaurant_id: restaurant.id,
      user_id: user.id,
    });
    await refreshMenus();
    toast("أنشأنا لك «القائمة الرئيسية» تلقائياً ✓");
    return m.id;
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return setError("اسم الطبق مطلوب.");
    // السعر كان يسقط إلى صفر بصمت عند إدخال غير قابل للتحويل (أرقام عربية،
    // «45 ريال»…) فيُنشر الطبق مجاناً في المنيو.
    const price = numOrNull(form.price);
    if (price === null) return setError("اكتب سعراً صحيحاً بالأرقام.");
    if (price < 0) return setError("السعر لا يمكن أن يكون سالباً.");
    setBusy(true);
    setError("");
    try {
      const payload = toPayload(form);
      const menuId = await ensureMenu();
      if (editing === "new") {
        // فرض حدّ الأصناف حسب الباقة.
        if (ent.maxDishes !== null) {
          const count = await countDishes(restaurant.id);
          if (count >= ent.maxDishes) {
            setError(`بلغت الحد المسموح (${ent.maxDishes} صنفاً).`);
            setBusy(false);
            return;
          }
        }
        const created = await createDish(payload, {
          menu_id: menuId,
          restaurant_id: restaurant.id,
          user_id: user.id,
        });
        setDishes((ds) => [created, ...(ds ?? [])]);
        toast("أُضيف الطبق ✓");
      } else if (editing) {
        await updateDish(editing.id, { ...payload, menu_id: menuId });
        setDishes((ds) =>
          ds?.map((d) => (d.id === editing.id ? { ...d, ...payload, menu_id: menuId } : d)) ?? null
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

  /** التصنيفات الموجودة فعلاً — تُقترح في الفورم وللمستورِد فلا يتكاثر «مشاوي/المشاوي». */
  const knownCategories = useMemo(() => categoriesOf(dishes ?? []), [dishes]);

  const categoryOrder = useMemo(
    () => parseCategoryOrder(restaurant.category_order),
    [restaurant.category_order]
  );

  /** نفس تجميع `MenuPage` وترتيبه — اللوحة والمنيو يعرضان الشيء ذاته. */
  const groups = useMemo(() => {
    const byCat = new Map<string, Dish[]>();
    for (const d of dishes ?? []) {
      const cat = d.category?.trim() || UNCATEGORIZED;
      byCat.set(cat, [...(byCat.get(cat) ?? []), d]);
    }
    return sortCategories([...byCat.keys()], categoryOrder).map((name) => ({
      name,
      dishes: byCat.get(name)!,
    }));
  }, [dishes, categoryOrder]);

  /** ترتيب التصنيفات المعروض في مدير التصنيفات (بلا «أخرى» — ليس تصنيفاً حقيقياً). */
  const orderedCategories = useMemo(
    () => groups.map((g) => g.name).filter((n) => n !== UNCATEGORIZED),
    [groups]
  );

  /**
   * السحب داخل تصنيف.
   *
   * `sort_order` عمود واحد لكل المطعم لا لكل تصنيف، فنُعيد ترقيم **كل** الأطباق
   * حسب موضعها في القائمة المسطّحة بعد النقل. هكذا يبقى ترتيب اللوحة والمنيو
   * متطابقاً مهما تحرّك الطبق، ولا نُرسل إلا الصفوف التي تغيّر رقمها فعلاً.
   */
  async function reorder(group: string, from: number, to: number) {
    const next = groups.map((g) =>
      g.name === group ? { ...g, dishes: moveItem(g.dishes, from, to) } : g
    );
    const flat = next.flatMap((g) => g.dishes);
    const renumbered = flat.map((d, i) => ({ ...d, sort_order: i }));
    setDishes(renumbered);
    const changed = renumbered
      .filter((_, i) => (flat[i].sort_order ?? 0) !== i)
      .map((d) => ({ id: d.id, sort_order: d.sort_order }));
    if (!changed.length) return;
    try {
      await reorderDishes(changed);
    } catch {
      toast("تعذّر حفظ الترتيب.", "err");
      getMyDishes(restaurant.id).then(setDishes).catch(() => {});
    }
  }

  async function saveCategoryOrder(order: string[]) {
    const value = serializeCategoryOrder(order);
    await updateCategoryOrder(restaurant.id, value);
    setRestaurant({ ...restaurant, category_order: value });
    toast("حُفظ ترتيب التصنيفات ✓");
  }

  async function renameCat(from: string, to: string) {
    await renameCategory(restaurant.id, from, to);
    setDishes(
      (ds) => ds?.map((d) => (d.category?.trim() === from ? { ...d, category: to } : d)) ?? null
    );
    // حدّث الترتيب المحفوظ أيضاً وإلا بقي يشير لاسم لم يعد موجوداً.
    const nextOrder = reconcileOrder(
      categoryOrder.map((c) => (c === from ? to : c)),
      orderedCategories.map((c) => (c === from ? to : c))
    );
    const value = serializeCategoryOrder([...new Set(nextOrder)]);
    await updateCategoryOrder(restaurant.id, value);
    setRestaurant({ ...restaurant, category_order: value });
    toast(`أصبح التصنيف «${to}» ✓`);
  }

  async function importRows(rows: ParsedRow[], menuId: string) {
    const created = await createDishes(rows.map(rowToPayload), {
      menu_id: menuId,
      restaurant_id: restaurant.id,
      user_id: user.id,
    });
    setDishes((ds) => [...created.reverse(), ...(ds ?? [])]);
    toast(`أُضيف ${created.length} صنفاً ✓`);
    /**
     * الصور تُطلَب **الآن** لا في تنبيه لاحق.
     *
     * التاجر لتوّه أنجز شيئاً ورأى منيوه يمتلئ — وهذه أفضل لحظة يقبل فيها خطوة
     * ثانية. أنشط منيو عندنا (١٢ طبقاً) فيه **صفر صورة**، ومصدر ذلك أن الطلب
     * كان يصل كتنبيه بارد بعد أن انصرف. تُفتح النافذة بعد لحظة كي يرى الأصناف
     * وقد أُضيفت فعلاً — لا أن تُغلق نافذة وتُفتح أخرى فوراً فيبدو أنها لم تنجح.
     */
    if (created.length >= 3) window.setTimeout(() => setBulkImages(true), 700);
  }

  /** قائمة البداية تمرّ من نفس مسار الاستيراد الدفعي — لا مسار إدراج ثانٍ. */
  async function applyStarter(items: StarterDish[], menuId: string) {
    await importRows(
      items.map((d) => ({
        name: d.name,
        price: d.price,
        category: d.category,
        description: null,
        emoji: d.emoji,
        line: 0,
      })),
      menuId
    );
  }

  async function linkImages(links: { dishId: string; url: string }[]) {
    await Promise.all(links.map((l) => setDishImage(l.dishId, l.url)));
    const byId = new Map(links.map((l) => [l.dishId, l.url]));
    setDishes((ds) => ds?.map((d) => (byId.has(d.id) ? { ...d, image: byId.get(d.id)! } : d)) ?? null);
    toast(`رُبطت ${links.length} صورة ✓`);
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

  /** تعديل السعر من القائمة — تفاؤلي مع تراجع عند الفشل، كنمط `toggle`. */
  async function setPrice(d: Dish, price: number) {
    const before = d.price;
    setDishes((ds) => ds?.map((x) => (x.id === d.id ? { ...x, price } : x)) ?? null);
    try {
      await updateDishPrice(d.id, price);
      toast(`سعر «${d.name}» صار ${formatPrice(price)} ر.س ✓`);
    } catch {
      setDishes((ds) => ds?.map((x) => (x.id === d.id ? { ...x, price: before } : x)) ?? null);
      toast("تعذّر تحديث السعر.", "err");
    }
  }

  async function duplicate(d: Dish) {
    try {
      const copy = await duplicateDish(d, {
        menu_id: d.menu_id ?? menus?.[0]?.id ?? "",
        restaurant_id: restaurant.id,
        user_id: user.id,
      });
      setDishes((ds) => [copy, ...(ds ?? [])]);
      toast("نُسخ الطبق — عدّل الاسم والسعر ✓");
      openEdit(copy);
    } catch {
      toast("تعذّر تكرار الطبق.", "err");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-ink">منيوي</h1>
          <p className="mt-1 text-sm text-dim">
            {dishes ? `${dishes.length} طبقاً` : "…"}
            {ent.maxDishes !== null && ` من أصل ${ent.maxDishes} في باقتك`}
          </p>
        </div>
        {/* شريط الأدوات يختفي كلياً عند صفر طبق: الشاشة الفارغة أدناه تحمل
            نفس الأفعال، فكان التاجر يرى «استيراد» و«طبق جديد» مرّتين — أربعة
            أزرار لفعلين على شاشة جوال ضيقة. */}
        {(dishes?.length ?? 0) > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <PreviewMenuButton slug={restaurant.slug} />
            <Button variant="outline" onClick={() => setImporting(true)}>
              ⬆️ استيراد أصناف
            </Button>
            <Button variant="outline" onClick={() => setBulkImages(true)}>
              📷 صور دفعة واحدة
            </Button>
            <Button variant="outline" onClick={() => setManagingCats(true)}>
              🗂️ التصنيفات
            </Button>
            <Button onClick={openNew}>＋ طبق جديد</Button>
          </div>
        )}
      </div>

      <MenuTabs />

      {/* أكبر فجوة قائمة عند التجّار الفعليين: أنشطهم عنده ١٢ طبقاً و**صفر
          صورة**. الصورة ليست تجميلاً — هي الفرق بين منيو يُتصفَّح ومنيو يُقرأ،
          والتنبيه يفتح الرفع الدفعي مباشرة لا يرسله يبحث عنه. */}
      {missingImages.length >= 1 && (
        <Card className="mt-5 flex flex-wrap items-center justify-between gap-3 border-gold/40">
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink">
              📷 {missingImages.length} من أطباقك بلا صورة
            </p>
            <p className="mt-0.5 text-xs text-faint">
              ارفعها دفعة واحدة واسحب كل صورة على طبقها — دقيقتان لكل منيوك.
            </p>
          </div>
          <Button onClick={() => setBulkImages(true)}>ارفع الصور الآن</Button>
        </Card>
      )}

      {/* البحث يظهر حين يصير له معنى فقط — كان مربّعاً فوق صفر طبق. */}
      {(dishes?.length ?? 0) > 8 && (
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="🔍 ابحث باسم الطبق أو التصنيف…"
          className="mt-5"
        />
      )}

      {dishes === null ? (
        <div className="mt-5 flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : filtered.length === 0 && filter ? (
        <div className="mt-5">
          <EmptyState emoji="🔍" title="لا نتائج لبحثك" />
        </div>
      ) : filtered.length === 0 ? (
        /**
         * شاشة الصفر هي **أكبر نقطة تسرّب مُثبَتة**: ١٣ من ١٩ حساباً توقّفوا
         * عندها ولم يُضيفوا طبقاً واحداً.
         *
         * كانت ثلاثة أزرار متراصّة داخل `EmptyState` — والأزرار المتراصّة تُقرأ
         * «زرّ رئيسي وبدائل»، فمن عنده منيو جاهز في إكسل لا يرى مساره. الآن
         * ثلاثة مسارات **متساوية البروز**، كلٌّ يشرح لمن هو ومتى يُختار.
         */
        <div className="mt-6">
          <div className="mb-5 text-center">
            <span className="text-4xl">🍽️</span>
            <h2 className="mt-2 font-display text-xl font-black text-ink">
              ابدأ منيوك — اختر أسهل طريق لك
            </h2>
            <p className="mt-1 text-sm text-dim">كلها تنتهي بمنيو تعدّله كما تشاء.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                emoji: "⚡",
                title: "قائمة جاهزة",
                desc: `أصناف شائعة لـ«${aliasType(restaurant.type)}» تختار منها وتعدّلها.`,
                note: "الأسرع — دقيقة واحدة",
                onClick: () => setStarter(true),
              },
              {
                emoji: "⬆️",
                title: "الصق منيوك",
                desc: "عندك المنيو في إكسل أو مكتوب؟ الصقه أو ارفع CSV.",
                note: "الأدقّ — أسعارك أنت",
                onClick: () => setImporting(true),
              },
              {
                emoji: "＋",
                title: "أضف صنفاً صنفاً",
                desc: "ابدأ بطبق واحد وأكمل على راحتك.",
                note: "للمنيو الصغير",
                onClick: openNew,
              },
            ].map((c) => (
              <button
                key={c.title}
                type="button"
                onClick={c.onClick}
                className="flex flex-col items-start gap-1.5 rounded-2xl border border-line bg-panel p-5 text-start transition-colors hover:border-gold/50 hover:bg-gold/[.04]"
              >
                <span className="text-3xl">{c.emoji}</span>
                <span className="font-display text-base font-extrabold text-ink">{c.title}</span>
                <span className="text-xs leading-relaxed text-dim">{c.desc}</span>
                <span className="mt-auto pt-2 text-[11px] font-bold text-gold">{c.note}</span>
              </button>
            ))}
          </div>
        </div>
      ) : filter ? (
        /* أثناء البحث: قائمة مسطّحة بلا سحب — الترتيب بلا معنى على نتائج مفلترة. */
        <div className="mt-5 flex flex-col gap-2.5">
          {filtered.map((d) => (
            <DishRow
              key={d.id}
              dish={d}
              showCategory
              onToggle={() => toggle(d)}
              onEdit={() => openEdit(d)}
              onRemove={() => remove(d)}
              onPrice={(p) => setPrice(d, p)}
              onDuplicate={() => duplicate(d)}
            />
          ))}
        </div>
      ) : (
        /* بلا بحث: نفس تجميع المنيو وترتيبه بالضبط — ما تراه هنا يراه الزبون. */
        <div className="mt-5 flex flex-col gap-6">
          {groups.map((g) => (
            <section key={g.name}>
              <h2 className="mb-2 flex items-center gap-2 font-display text-sm font-extrabold text-dim">
                {g.name}
                <span className="font-normal text-faint">· {g.dishes.length}</span>
              </h2>
              <ReorderList
                items={g.dishes}
                keyOf={(d) => d.id}
                onReorder={(from, to) => reorder(g.name, from, to)}
                render={(d) => (
                  <DishRow
                    dish={d}
                    onToggle={() => toggle(d)}
                    onEdit={() => openEdit(d)}
                    onRemove={() => remove(d)}
                    onPrice={(p) => setPrice(d, p)}
                    onDuplicate={() => duplicate(d)}
                  />
                )}
              />
            </section>
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
          {/* اختيار من الموجود أولاً — الحقل الحر وحده كان يولّد «مشاوي» و«المشاوي». */}
          <Field label="التصنيف" hint="اختر من تصنيفاتك، أو اكتب تصنيفاً جديداً.">
            {knownCategories.length > 0 && (
              <Select
                value={knownCategories.includes(form.category) ? form.category : "__new"}
                onChange={(e) => set("category", e.target.value === "__new" ? "" : e.target.value)}
                className="mb-2"
              >
                {knownCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="__new">＋ تصنيف جديد…</option>
              </Select>
            )}
            {(knownCategories.length === 0 || !knownCategories.includes(form.category)) && (
              <Input
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                onBlur={(e) => {
                  // «المشاوي» تُضم إلى «مشاوي» الموجودة بدل أن تصير قسماً ثانياً.
                  const hit = matchKnownCategory(e.target.value, knownCategories);
                  if (hit && hit !== e.target.value.trim()) set("category", hit);
                }}
                placeholder="مثال: المشاوي، المقبلات، الحلويات"
              />
            )}
          </Field>
          {/* حقل القائمة يظهر فقط لمن عنده أكثر من واحدة. صاحب القائمة الواحدة
              (وهو الأغلب) لا يُطلب منه اختيار لا خيار فيه — و`ensureMenu` تتكفّل
              بإنشائها إن لم توجد. صفحة «القوائم» باقية لمن يحتاج أكثر. */}
          {(menus?.length ?? 0) > 1 && (
            <Field label="القائمة">
              <Select value={form.menu_id} onChange={(e) => set("menu_id", e.target.value)} required>
                <option value="" disabled>اختر…</option>
                {(menus ?? []).map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </Select>
            </Field>
          )}
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

          {/* أثر هذا المفتاح صار مرئياً في أعلى المنيو، فيجب أن يُشرح. */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-panel2 px-4 py-3">
            <span>
              <span className="block text-sm font-bold text-ink">⭐ طبق مميز</span>
              <span className="mt-0.5 block text-xs text-faint">
                أول طبق مميّز يظهر كـ«طبق اليوم» أعلى المنيو، والبقية بنجمة داخل أقسامها.
              </span>
            </span>
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

      <DishImport
        open={importing}
        onClose={() => setImporting(false)}
        menus={menus}
        knownCategories={knownCategories}
        existingNames={(dishes ?? []).map((d) => d.name)}
        remaining={
          ent.maxDishes === null ? null : Math.max(0, ent.maxDishes - (dishes?.length ?? 0))
        }
        onImport={importRows}
      />

      <BulkImages
        open={bulkImages}
        onClose={() => setBulkImages(false)}
        dishes={dishes ?? []}
        restaurantId={restaurant.id}
        onSave={linkImages}
      />

      <CategoryManager
        open={managingCats}
        onClose={() => setManagingCats(false)}
        categories={orderedCategories}
        countOf={(name) => groups.find((g) => g.name === name)?.dishes.length ?? 0}
        onSaveOrder={saveCategoryOrder}
        onRename={renameCat}
      />

      <StarterMenu
        open={starter}
        onClose={() => setStarter(false)}
        type={restaurant.type}
        menus={menus}
        onApply={applyStarter}
      />

      {!ent.active && dishes !== null && dishes.length > 0 && (
        <UpgradeGate
          title="فعّل اشتراكك لتفتح كل الميزات"
          desc="اشتراكك يضمن بقاء منيوك متاحاً لزبائنك. كل المزايا مفتوحة — 99 ر.س شهرياً."
        />
      )}
    </div>
  );
}

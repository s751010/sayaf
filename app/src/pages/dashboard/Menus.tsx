/** إدارة القوائم + اختيار ثيم المنيو. */
import { useEffect, useState, type FormEvent } from "react";
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
  Skeleton,
  Switch,
  useToast,
} from "@/components/ui";
import { PreviewMenuButton } from "@/components/site";
import {
  applyThemeToAllMenus,
  countMenus,
  createMenu,
  deleteMenu,
  updateMenu,
  updateBrandColor,
} from "@/lib/data";
import {
  THEMES,
  buildCustomTheme,
  customHexOf,
  customThemeId,
  getTheme,
  isHex,
} from "@/lib/themes";
import { cn } from "@/lib/utils";
import type { Menu } from "@/lib/types";
import { useDashboard } from "./Dashboard";

export default function Menus() {
  const { user, restaurant, setRestaurant, menus, refreshMenus, ent } = useDashboard();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const activeThemeId = menus?.find((m) => m.theme)?.theme ?? null;
  const currentTheme = getTheme(activeThemeId);
  // لون العلامة: من الثيم المخصّص إن كان مطبَّقاً، وإلا من cover_color الموجود.
  const [brandHex, setBrandHex] = useState(
    () => customHexOf(activeThemeId) ?? restaurant.cover_color ?? "#d4a843"
  );
  const brandPreview = buildCustomTheme(isHex(brandHex) ? brandHex : "#d4a843");
  const isBrandActive = customHexOf(activeThemeId) === (isHex(brandHex) ? brandHex.toLowerCase().replace(/^#?/, "#") : null);

  useEffect(() => {
    document.title = "القوائم — كلاود منيو";
  }, []);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("أدخل اسم القائمة.");
    setBusy(true);
    setError("");
    try {
      if (ent.maxMenus !== null) {
        const count = await countMenus(restaurant.id);
        if (count >= ent.maxMenus) {
          setError(`بلغت الحد المسموح (${ent.maxMenus} قائمة).`);
          setBusy(false);
          return;
        }
      }
      await createMenu({ name: name.trim(), restaurant_id: restaurant.id, user_id: user.id });
      await refreshMenus();
      setAdding(false);
      setName("");
      toast("أُنشئت القائمة ✓");
    } catch {
      setError("تعذّر إنشاء القائمة.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(m: Menu) {
    try {
      await updateMenu(m.id, { active: !(m.active ?? true) });
      await refreshMenus();
    } catch {
      toast("تعذّر التحديث.", "err");
    }
  }

  /** إعادة تسمية قائمة — `updateMenu` يقبل الاسم لكن لم تكن هناك واجهة لإرساله. */
  async function rename(m: Menu) {
    const next = window.prompt("الاسم الجديد للقائمة:", m.name)?.trim();
    if (!next || next === m.name) return;
    try {
      await updateMenu(m.id, { name: next });
      await refreshMenus();
      toast("حُدّث اسم القائمة ✓");
    } catch {
      toast("تعذّر تغيير الاسم.", "err");
    }
  }

  async function remove(m: Menu) {
    if (!window.confirm(`حذف قائمة «${m.name}» وكل أطباقها نهائياً؟`)) return;
    try {
      await deleteMenu(m.id);
      await refreshMenus();
      toast("حُذفت القائمة.");
    } catch {
      toast("تعذّر الحذف.", "err");
    }
  }

  async function pickTheme(id: string) {
    try {
      await applyThemeToAllMenus(restaurant.id, id);
      const hex = customHexOf(id);
      if (hex) {
        // اللون يُحفظ أيضاً في cover_color كي يستخدمه تدرّج ترويسة المنيو.
        await updateBrandColor(restaurant.id, hex).catch(() => {});
        setRestaurant({ ...restaurant, cover_color: hex });
      }
      await refreshMenus();
      toast("طُبّق الثيم على منيوك ✓");
    } catch {
      toast("تعذّر تطبيق الثيم.", "err");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-ink">القوائم</h1>
          <p className="mt-1 text-sm text-dim">
            {menus === null ? "…" : menus.length} قائمة
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PreviewMenuButton slug={restaurant.slug} />
          <Button onClick={() => setAdding(true)}>＋ قائمة جديدة</Button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {menus === null &&
          [...Array(2)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        {(menus ?? []).map((m) => (
          <Card key={m.id} className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/12 text-xl">📋</span>
              <div>
                <p className="font-bold text-ink">{m.name}</p>
                {/* عمود menus.views لا يكتبه أي مسار في التطبيق (التتبّع يذهب
                    إلى جدول analytics)، فكان يعرض «٠ مشاهدة» دائماً ويوهم
                    التاجر أن منيوه لا يُزار. الأرقام الحقيقية في «التحليلات». */}
                <Link
                  to="/dashboard/analytics"
                  className="text-xs text-faint hover:text-gold hover:underline"
                >
                  📊 شاهد المشاهدات في التحليلات
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={m.active !== false ? "green" : "neutral"}>
                {m.active !== false ? "منشورة" : "مخفية"}
              </Badge>
              <Switch checked={m.active !== false} onChange={() => toggleActive(m)} label="نشر" />
              <button
                onClick={() => rename(m)}
                className="rounded-lg px-2.5 py-1.5 text-sm font-bold text-dim hover:bg-ink/6 hover:text-ink"
              >
                إعادة تسمية
              </button>
              <button
                onClick={() => remove(m)}
                aria-label="حذف"
                className="rounded-lg px-2 py-1.5 text-bad hover:bg-bad/10"
              >
                🗑
              </button>
            </div>
          </Card>
        ))}
        {menus !== null && menus.length === 0 && (
          <EmptyState
            emoji="📋"
            title="لا توجد قوائم بعد"
            desc="أنشئ قائمتك الأولى (مثل: القائمة الرئيسية) ثم أضف إليها أطباقك."
            action={<Button onClick={() => setAdding(true)}>＋ أنشئ القائمة الأولى</Button>}
          />
        )}
      </div>

      {/* الثيمات */}
      <section className="mt-10">
        <h2 className="font-display text-lg font-extrabold text-ink">🎨 ثيم المنيو</h2>
        <p className="mt-1 text-sm text-dim">اختر مظهر منيوك العام — يُطبَّق فوراً على كل القوائم.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => pickTheme(t.id)}
              className={cn(
                "overflow-hidden rounded-2xl border-2 text-right transition-transform hover:scale-[1.02]",
                currentTheme.id === t.id ? "border-gold" : "border-line"
              )}
            >
              <div className="flex h-20 flex-col justify-between p-3" style={{ background: t.vars["--m-bg"] }}>
                <span
                  className="h-2 w-1/2 rounded-full"
                  style={{ background: t.vars["--m-accent"] }}
                />
                <div className="flex gap-1">
                  <span className="h-4 flex-1 rounded" style={{ background: t.vars["--m-surface"], border: `1px solid ${t.vars["--m-border"]}` }} />
                  <span className="h-4 flex-1 rounded" style={{ background: t.vars["--m-surface"], border: `1px solid ${t.vars["--m-border"]}` }} />
                </div>
              </div>
              <p className={cn(
                "px-3 py-2 text-xs font-bold",
                currentTheme.id === t.id ? "bg-gold/10 text-gold" : "bg-panel text-dim"
              )}>
                {t.name} {currentTheme.id === t.id && "✓"}
              </p>
            </button>
          ))}
        </div>

        {/* ثيم بلون العلامة — يُخزَّن كـ`custom:#hex` في نفس عمود الثيم،
            واللون نفسه في cover_color لتدرّج ترويسة المنيو. */}
        <Card className="mt-4">
          <p className="text-sm font-bold text-ink">🖌️ أو استخدم لون علامتك</p>
          <p className="mt-1 text-xs text-dim">
            اختر لون مشروعك وسنبني منه ثيماً كاملاً متناسقاً.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              type="color"
              value={brandHex}
              onChange={(e) => setBrandHex(e.target.value)}
              aria-label="لون العلامة"
              className="h-11 w-16 cursor-pointer rounded-xl border border-line bg-panel2 p-1"
            />
            <Input
              dir="ltr"
              value={brandHex}
              onChange={(e) => setBrandHex(e.target.value)}
              className="w-32 text-center"
              aria-label="كود اللون"
            />
            <div
              className="flex h-11 items-center gap-2 rounded-xl border px-3"
              style={{
                background: brandPreview.vars["--m-bg"],
                borderColor: brandPreview.vars["--m-border"],
              }}
            >
              <span
                className="h-4 w-4 rounded-full"
                style={{ background: brandPreview.vars["--m-accent"] }}
              />
              <span className="text-xs font-bold" style={{ color: brandPreview.vars["--m-text"] }}>
                معاينة
              </span>
            </div>
            <Button
              variant={isBrandActive ? "outline" : "gold"}
              onClick={() => pickTheme(customThemeId(brandHex))}
              disabled={!isHex(brandHex)}
            >
              {isBrandActive ? "مطبَّق ✓" : "طبّق لوني"}
            </Button>
          </div>
          {!isHex(brandHex) && (
            <p className="mt-2 text-xs text-bad">كود اللون غير صالح — استخدم صيغة #RRGGBB.</p>
          )}
        </Card>
      </section>

      <Modal open={adding} onClose={() => setAdding(false)} title="قائمة جديدة">
        <form onSubmit={add} className="flex flex-col gap-4">
          <Field label="اسم القائمة" hint="مثال: قائمة الإفطار، قائمة رمضان">
            <Input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </Field>
          {error && <ErrorNote>{error}</ErrorNote>}
          <Button type="submit" disabled={busy}>
            {busy ? "جارٍ الإنشاء…" : "إنشاء"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}

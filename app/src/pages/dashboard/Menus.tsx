/** إدارة القوائم + اختيار ثيم المنيو. */
import { useEffect, useState, type FormEvent } from "react";
import {
  Badge,
  Button,
  Card,
  ErrorNote,
  Field,
  Input,
  Modal,
  Switch,
  useToast,
} from "@/components/ui";
import { applyThemeToAllMenus, countMenus, createMenu, deleteMenu, updateMenu } from "@/lib/data";
import { THEMES, getTheme } from "@/lib/themes";
import { cn } from "@/lib/utils";
import type { Menu } from "@/lib/types";
import { useDashboard } from "./Dashboard";

export default function Menus() {
  const { user, restaurant, menus, refreshMenus, ent } = useDashboard();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const currentTheme = getTheme(menus.find((m) => m.theme)?.theme);

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
          setError(`باقتك تسمح بـ ${ent.maxMenus} قائمة. رقِّ إلى الاحترافية لقوائم غير محدودة.`);
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
            {menus.length} قائمة{ent.maxMenus !== null && ` من أصل ${ent.maxMenus} في باقتك`}
          </p>
        </div>
        <Button onClick={() => setAdding(true)}>＋ قائمة جديدة</Button>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {menus.map((m) => (
          <Card key={m.id} className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/12 text-xl">📋</span>
              <div>
                <p className="font-bold text-ink">{m.name}</p>
                <p className="text-xs text-faint">👁️ {m.views ?? 0} مشاهدة</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={m.active !== false ? "green" : "neutral"}>
                {m.active !== false ? "منشورة" : "مخفية"}
              </Badge>
              <Switch checked={m.active !== false} onChange={() => toggleActive(m)} label="نشر" />
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
        {menus.length === 0 && (
          <Card className="py-10 text-center text-sm text-dim">لا توجد قوائم — أنشئ الأولى الآن.</Card>
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

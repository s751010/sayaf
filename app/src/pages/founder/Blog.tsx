/** المدونة — كتابة ونشر المقالات التي تظهر في /blog. */
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Badge,
  Button,
  Card,
  ErrorNote,
  Field,
  Input,
  Modal,
  Skeleton,
  Textarea,
  useToast,
} from "@/components/ui";
import { founderAdmin } from "@/lib/api";
import { formatDate, slugify, strOrNull } from "@/lib/utils";
import type { BlogPost } from "@/lib/types";

type PostForm = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category: string;
  author: string;
  published: boolean;
};

const EMPTY: PostForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover_image: "",
  category: "",
  author: "كلاود منيو",
  published: false,
};

function toForm(p: BlogPost): PostForm {
  return {
    title: p.title,
    slug: p.slug ?? "",
    excerpt: p.excerpt ?? "",
    content: p.content ?? "",
    cover_image: p.cover_image ?? "",
    category: p.category ?? "",
    author: p.author ?? "كلاود منيو",
    published: p.published ?? false,
  };
}

/** الفورم → جسم الطلب (مصدر واحد للإنشاء والتعديل معاً). */
function toBody(f: PostForm) {
  return {
    title: f.title.trim(),
    slug: slugify(f.slug || f.title),
    excerpt: strOrNull(f.excerpt),
    content: strOrNull(f.content),
    cover_image: strOrNull(f.cover_image),
    category: strOrNull(f.category),
    author: strOrNull(f.author),
    published: f.published,
    status: f.published ? "published" : "draft",
    published_at: f.published ? new Date().toISOString() : null,
  };
}

export default function FounderBlog() {
  const toast = useToast();
  const [rows, setRows] = useState<BlogPost[] | null>(null);
  const [editing, setEditing] = useState<BlogPost | "new" | null>(null);
  const [form, setForm] = useState<PostForm>(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setRows(await founderAdmin<BlogPost[]>("blog_posts?select=*&order=created_at.desc"));
  }, []);

  useEffect(() => {
    load().catch(() => setRows([]));
  }, [load]);

  const set = <K extends keyof PostForm>(k: K, v: PostForm[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  function open(post: BlogPost | "new") {
    setEditing(post);
    setForm(post === "new" ? EMPTY : toForm(post));
    setError("");
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return setError("العنوان مطلوب.");
    setBusy(true);
    setError("");
    try {
      const body = toBody(form);
      if (editing === "new") {
        await founderAdmin("blog_posts", { method: "POST", body });
      } else if (editing) {
        await founderAdmin(`blog_posts?id=eq.${editing.id}`, { method: "PATCH", body });
      }
      await load();
      setEditing(null);
      toast("حُفظ المقال ✓");
    } catch {
      setError("تعذّر الحفظ — قد يكون الرابط مستخدماً.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(p: BlogPost) {
    if (!window.confirm(`حذف «${p.title}» نهائياً؟`)) return;
    try {
      await founderAdmin(`blog_posts?id=eq.${p.id}`, { method: "DELETE" });
      await load();
      toast("حُذف المقال.");
    } catch {
      toast("تعذّر الحذف.", "err");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-ink">المدونة</h1>
          <p className="mt-1 text-sm text-dim">المقالات المنشورة تظهر في صفحة /blog.</p>
        </div>
        <Button onClick={() => open("new")}>＋ مقال جديد</Button>
      </div>

      {rows === null ? (
        <Skeleton className="mt-6 h-40" />
      ) : rows.length === 0 ? (
        <Card className="mt-6 py-10 text-center text-sm text-dim">لا توجد مقالات بعد.</Card>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {rows.map((p) => (
            <Card key={p.id} className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-ink">{p.title}</p>
                <p className="mt-0.5 text-xs text-faint">
                  <span dir="ltr">/blog/{p.slug ?? "—"}</span> · {formatDate(p.created_at)}
                  {p.category && ` · ${p.category}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={p.published ? "green" : "neutral"}>
                  {p.published ? "منشور" : "مسودة"}
                </Badge>
                <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => open(p)}>
                  تحرير
                </Button>
                <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => remove(p)}>
                  حذف
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <Modal
          open
          onClose={() => setEditing(null)}
          title={editing === "new" ? "مقال جديد" : "تحرير المقال"}
          wide
        >
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <Field label="العنوان" className="sm:col-span-2">
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} required />
            </Field>
            <Field label="الرابط (slug)" hint={`/blog/${slugify(form.slug || form.title) || "…"}`}>
              <Input dir="ltr" value={form.slug} onChange={(e) => set("slug", e.target.value)} />
            </Field>
            <Field label="التصنيف">
              <Input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="نصائح" />
            </Field>
            <Field label="الكاتب">
              <Input value={form.author} onChange={(e) => set("author", e.target.value)} />
            </Field>
            <Field label="صورة الغلاف">
              <Input dir="ltr" value={form.cover_image} onChange={(e) => set("cover_image", e.target.value)} placeholder="https://…" />
            </Field>
            <Field label="المقتطف" className="sm:col-span-2">
              <Textarea value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
            </Field>
            <Field label="المحتوى" className="sm:col-span-2">
              <Textarea
                value={form.content}
                onChange={(e) => set("content", e.target.value)}
                className="min-h-56"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm font-bold text-ink sm:col-span-2">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => set("published", e.target.checked)}
                className="h-4 w-4 accent-[var(--c-gold)]"
              />
              نشر المقال الآن
            </label>
            {error && <div className="sm:col-span-2"><ErrorNote>{error}</ErrorNote></div>}
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={busy} className="px-10">
                {busy ? "جارٍ الحفظ…" : "حفظ"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                إلغاء
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

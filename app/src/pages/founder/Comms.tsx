/**
 * التواصل مع التجّار: إعلانات تصل لوحاتهم + محرّر المدونة.
 *
 * الجدولان (`announcements` و`blog_posts`) موجودان منذ البداية وفارغان تماماً
 * وبلا أي واجهة — لا تكتب فيهما ولا تقرأ منهما. المدونة أسوأ: القارئ موجود في
 * `Blog.tsx` و`BlogPost.tsx` ومنشور على موقعك، لكن لا محرّر يملؤه.
 *
 * الإعلان يظهر عند التاجر في `components/AnnouncementBar.tsx` فور حفظه.
 */
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Badge,
  Button,
  Card,
  ErrorNote,
  Field,
  Input,
  Select,
  Skeleton,
  Switch,
  useToast,
} from "@/components/ui";
import {
  createAnnouncement,
  createBlogPost,
  deleteAnnouncement,
  deleteBlogPost,
  getAnnouncements,
  getBlogPosts,
  logAudit,
  setAnnouncementStatus,
  updateBlogPost,
  type Announcement,
  type AnnouncementAudience,
  type AnnouncementType,
  type BlogPost,
} from "@/lib/founder";
import { cn, formatDate, slugify } from "@/lib/utils";

const AUDIENCE_LABEL: Record<AnnouncementAudience, string> = {
  all: "كل التجّار",
  active: "المشتركون فقط",
  inactive: "غير المشتركين فقط",
};

const TYPE_LABEL: Record<AnnouncementType, string> = {
  info: "📣 معلومة",
  warn: "⚠️ تنبيه",
  success: "✅ خبر جيد",
};

export default function Comms() {
  const toast = useToast();
  const [tab, setTab] = useState<"ann" | "blog">("ann");
  const [anns, setAnns] = useState<Announcement[] | null>(null);
  const [posts, setPosts] = useState<BlogPost[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // إعلان جديد
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<AnnouncementType>("info");
  const [audience, setAudience] = useState<AnnouncementAudience>("all");

  // مقال (جديد أو تحرير)
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [pTitle, setPTitle] = useState("");
  const [pSlug, setPSlug] = useState("");
  const [pExcerpt, setPExcerpt] = useState("");
  const [pContent, setPContent] = useState("");
  const [pCategory, setPCategory] = useState("");
  const [pSeoDesc, setPSeoDesc] = useState("");
  const [pPublished, setPPublished] = useState(true);

  const load = useCallback(async () => {
    setError("");
    try {
      const [a, b] = await Promise.all([getAnnouncements(), getBlogPosts()]);
      setAnns(a);
      setPosts(b);
    } catch {
      setError("تعذّر تحميل قسم التواصل.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function addAnnouncement(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return toast("اكتب العنوان والنص.", "err");
    setBusy(true);
    try {
      await logAudit("نشر إعلان للتجّار", {
        table: "announcements",
        name: title.trim(),
        details: { audience, type },
      });
      await createAnnouncement({ title: title.trim(), body: body.trim(), type, audience });
      setTitle("");
      setBody("");
      await load();
      toast("نُشر الإعلان — يظهر في لوحات التجّار الآن ✓");
    } catch {
      toast("تعذّر النشر.", "err");
    } finally {
      setBusy(false);
    }
  }

  async function toggleAnn(a: Announcement) {
    const next = a.status === "active" ? "archived" : "active";
    try {
      await logAudit(next === "active" ? "إعادة نشر إعلان" : "أرشفة إعلان", {
        table: "announcements",
        id: a.id,
        name: a.title,
      });
      await setAnnouncementStatus(a.id, next);
      await load();
    } catch {
      toast("تعذّر التحديث.", "err");
    }
  }

  async function removeAnn(a: Announcement) {
    if (!window.confirm(`حذف إعلان «${a.title}»؟`)) return;
    try {
      await logAudit("حذف إعلان", { table: "announcements", id: a.id, name: a.title });
      await deleteAnnouncement(a.id);
      await load();
      toast("حُذف الإعلان.");
    } catch {
      toast("تعذّر الحذف.", "err");
    }
  }

  function openPost(p: BlogPost | null) {
    setEditing(p);
    setPTitle(p?.title ?? "");
    setPSlug(p?.slug ?? "");
    setPExcerpt(p?.excerpt ?? "");
    setPContent(p?.content ?? "");
    setPCategory(p?.category ?? "");
    setPSeoDesc(p?.seo_description ?? "");
    setPPublished(p?.published ?? true);
    setTab("blog");
  }

  async function savePost(e: FormEvent) {
    e.preventDefault();
    if (!pTitle.trim()) return toast("اكتب عنوان المقال.", "err");
    const payload = {
      title: pTitle.trim(),
      // الرابط يُشتقّ من العنوان إن تُرك فارغاً — `slugify` نفسها التي تولّد روابط المطاعم.
      slug: (pSlug.trim() || slugify(pTitle)).slice(0, 80) || null,
      excerpt: pExcerpt.trim() || null,
      content: pContent.trim() || null,
      cover_image: editing?.cover_image ?? null,
      category: pCategory.trim() || null,
      tags: editing?.tags ?? null,
      seo_title: pTitle.trim(),
      seo_description: pSeoDesc.trim() || pExcerpt.trim() || null,
      published: pPublished,
    };
    setBusy(true);
    try {
      await logAudit(editing ? "تعديل مقال" : "نشر مقال", {
        table: "blog_posts",
        id: editing?.id,
        name: payload.title,
        details: { published: pPublished },
      });
      if (editing) await updateBlogPost(editing.id, payload);
      else await createBlogPost(payload);
      openPost(null);
      await load();
      toast(pPublished ? "نُشر المقال ✓" : "حُفظ كمسودة ✓");
    } catch {
      toast("تعذّر الحفظ — قد يكون الرابط مستخدماً.", "err");
    } finally {
      setBusy(false);
    }
  }

  async function removePost(p: BlogPost) {
    if (!window.confirm(`حذف مقال «${p.title}»؟`)) return;
    try {
      await logAudit("حذف مقال", { table: "blog_posts", id: p.id, name: p.title });
      await deleteBlogPost(p.id);
      await load();
      toast("حُذف المقال.");
    } catch {
      toast("تعذّر الحذف.", "err");
    }
  }

  if (error) return <ErrorNote>{error}</ErrorNote>;

  return (
    <div>
      <h1 className="font-display text-2xl font-black text-ink">التواصل مع التجّار</h1>

      <div className="mt-4 flex gap-2">
        {(
          [
            ["ann", "📣 الإعلانات"],
            ["blog", "📝 المدونة"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-bold transition-colors",
              tab === id ? "border-gold bg-gold/12 text-gold" : "border-line text-dim hover:text-ink"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "ann" ? (
        <>
          <Card className="mt-5">
            <h2 className="font-display text-base font-extrabold text-ink">إعلان جديد</h2>
            <p className="mt-1 text-xs text-dim">
              يظهر في أعلى لوحة كل تاجر مطابق للجمهور، ويستطيع إخفاءه بعد قراءته.
            </p>
            <form onSubmit={addAnnouncement} className="mt-3 flex flex-col gap-3">
              <Field label="العنوان">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: صيانة الليلة ١٢−٢" />
              </Field>
              <Field label="النص">
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-line bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:border-gold/50"
                  placeholder="اكتب ما تريد أن يصل تجّارك…"
                />
              </Field>
              <div className="flex flex-wrap items-end gap-3">
                <Field label="النوع" className="w-40">
                  <Select value={type} onChange={(e) => setType(e.target.value as AnnouncementType)}>
                    {Object.entries(TYPE_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="الجمهور" className="w-48">
                  <Select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value as AnnouncementAudience)}
                  >
                    {Object.entries(AUDIENCE_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Button type="submit" disabled={busy}>
                  📣 انشر
                </Button>
              </div>
            </form>
          </Card>

          {anns === null ? (
            <Skeleton className="mt-4 h-32" />
          ) : anns.length === 0 ? (
            <Card className="mt-4 text-center text-sm text-dim">لا توجد إعلانات بعد.</Card>
          ) : (
            <div className="mt-4 flex flex-col gap-2.5">
              {anns.map((a) => (
                <Card key={a.id} className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-ink">
                      {TYPE_LABEL[(a.type as AnnouncementType) ?? "info"]?.split(" ")[0]} {a.title}
                    </p>
                    <p className="mt-0.5 whitespace-pre-line text-sm text-dim">{a.body}</p>
                    <p className="mt-1 text-xs text-faint">
                      {AUDIENCE_LABEL[(a.audience as AnnouncementAudience) ?? "all"]}
                      {a.created_at && ` · ${formatDate(a.created_at)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={a.status === "active" ? "green" : "neutral"}>
                      {a.status === "active" ? "ظاهر" : "مؤرشف"}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => toggleAnn(a)}>
                      {a.status === "active" ? "أرشفة" : "إظهار"}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => removeAnn(a)}>
                      حذف
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <Card className="mt-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-extrabold text-ink">
                {editing ? "تعديل مقال" : "مقال جديد"}
              </h2>
              {editing && (
                <Button variant="ghost" size="sm" onClick={() => openPost(null)}>
                  مقال جديد بدلاً منه
                </Button>
              )}
            </div>
            <form onSubmit={savePost} className="mt-3 flex flex-col gap-3">
              <Field label="العنوان">
                <Input value={pTitle} onChange={(e) => setPTitle(e.target.value)} />
              </Field>
              <div className="flex flex-wrap gap-3">
                <Field label="الرابط" className="min-w-56 flex-1" hint="فارغ = يُشتقّ من العنوان">
                  <Input value={pSlug} onChange={(e) => setPSlug(e.target.value)} dir="ltr" />
                </Field>
                <Field label="التصنيف" className="w-44">
                  <Input value={pCategory} onChange={(e) => setPCategory(e.target.value)} />
                </Field>
              </div>
              <Field label="المقتطف" hint="يظهر في قائمة المدونة وفي نتائج البحث">
                <Input value={pExcerpt} onChange={(e) => setPExcerpt(e.target.value)} />
              </Field>
              <Field label="المحتوى">
                <textarea
                  value={pContent}
                  onChange={(e) => setPContent(e.target.value)}
                  rows={10}
                  className="w-full rounded-xl border border-line bg-panel2 px-3.5 py-2.5 text-sm leading-relaxed text-ink placeholder:text-faint focus:border-gold/50"
                />
              </Field>
              <Field label="وصف SEO" hint="فارغ = يُستخدم المقتطف">
                <Input value={pSeoDesc} onChange={(e) => setPSeoDesc(e.target.value)} />
              </Field>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Switch checked={pPublished} onChange={setPPublished} label="منشور" />
                <Button type="submit" disabled={busy}>
                  {editing ? "حفظ التعديل" : pPublished ? "انشر" : "احفظ مسودة"}
                </Button>
              </div>
            </form>
          </Card>

          {posts === null ? (
            <Skeleton className="mt-4 h-32" />
          ) : posts.length === 0 ? (
            <Card className="mt-4 text-center text-sm text-dim">
              لا مقالات بعد — ومدونتك منشورة على الموقع وفارغة.
            </Card>
          ) : (
            <div className="mt-4 flex flex-col gap-2.5">
              {posts.map((p) => (
                <Card key={p.id} className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-ink">{p.title}</p>
                    <p className="mt-0.5 text-xs text-faint">
                      <span dir="ltr">/blog/{p.slug ?? p.id}</span>
                      {p.category && ` · ${p.category}`}
                      {p.created_at && ` · ${formatDate(p.created_at)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.published ? "green" : "neutral"}>
                      {p.published ? "منشور" : "مسودة"}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => openPost(p)}>
                      تعديل
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => removePost(p)}>
                      حذف
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** الإعلانات — رسائل تظهر للتجّار في لوحاتهم. */
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
  Textarea,
  useToast,
} from "@/components/ui";
import { founderAdmin } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Announcement } from "@/lib/types";

const TYPES = [
  { id: "info", label: "📢 معلومة" },
  { id: "success", label: "🎉 خبر سار" },
  { id: "warning", label: "⚠️ تنبيه" },
  { id: "danger", label: "🚨 عاجل" },
];

const AUDIENCES = [
  { id: "all", label: "كل التجّار" },
  { id: "active", label: "المشتركون فقط" },
  { id: "inactive", label: "غير المشتركين" },
];

export default function FounderAnnouncements() {
  const toast = useToast();
  const [rows, setRows] = useState<Announcement[] | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("info");
  const [audience, setAudience] = useState("all");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setRows(await founderAdmin<Announcement[]>("announcements?select=*&order=created_at.desc"));
  }, []);

  useEffect(() => {
    load().catch(() => setRows([]));
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return setError("اكتب العنوان والنص.");
    setBusy(true);
    setError("");
    try {
      await founderAdmin("announcements", {
        method: "POST",
        body: { title: title.trim(), body: body.trim(), type, audience, status: "active" },
      });
      setTitle("");
      setBody("");
      await load();
      toast("نُشر الإعلان ✓");
    } catch {
      setError("تعذّر النشر.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(a: Announcement) {
    try {
      await founderAdmin(`announcements?id=eq.${a.id}`, {
        method: "PATCH",
        body: { status: a.status === "active" ? "archived" : "active" },
      });
      await load();
    } catch {
      toast("تعذّر التحديث.", "err");
    }
  }

  async function remove(a: Announcement) {
    if (!window.confirm(`حذف الإعلان «${a.title}» نهائياً؟`)) return;
    try {
      await founderAdmin(`announcements?id=eq.${a.id}`, { method: "DELETE" });
      await load();
      toast("حُذف الإعلان.");
    } catch {
      toast("تعذّر الحذف.", "err");
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-black text-ink">الإعلانات</h1>
      <p className="mt-1 text-sm text-dim">تظهر للتجّار في صفحة «نظرة عامة» بلوحاتهم.</p>

      <Card className="mt-6">
        <form onSubmit={create} className="grid gap-4 sm:grid-cols-2">
          <Field label="العنوان" className="sm:col-span-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="تحديث جديد في المنصة" required />
          </Field>
          <Field label="النص" className="sm:col-span-2">
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} required />
          </Field>
          <Field label="النوع">
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="الجمهور">
            <Select value={audience} onChange={(e) => setAudience(e.target.value)}>
              {AUDIENCES.map((a) => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </Select>
          </Field>
          {error && <div className="sm:col-span-2"><ErrorNote>{error}</ErrorNote></div>}
          <Button type="submit" disabled={busy} className="sm:col-span-2 sm:justify-self-start sm:px-10">
            {busy ? "جارٍ النشر…" : "نشر الإعلان"}
          </Button>
        </form>
      </Card>

      <section className="mt-8">
        {rows === null ? (
          <Skeleton className="h-40" />
        ) : rows.length === 0 ? (
          <Card className="py-10 text-center text-sm text-dim">لا توجد إعلانات.</Card>
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map((a) => (
              <Card key={a.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-ink">{a.title}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-dim">{a.body}</p>
                    <p className="mt-2 text-xs text-faint">
                      {TYPES.find((t) => t.id === a.type)?.label ?? a.type} ·{" "}
                      {AUDIENCES.find((x) => x.id === a.audience)?.label ?? a.audience} ·{" "}
                      {formatDate(a.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={a.status === "active" ? "green" : "neutral"}>
                      {a.status === "active" ? "منشور" : "مؤرشف"}
                    </Badge>
                    <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => toggle(a)}>
                      {a.status === "active" ? "أرشفة" : "نشر"}
                    </Button>
                    <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => remove(a)}>
                      حذف
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

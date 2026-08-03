/**
 * شريط إعلانات المؤسس داخل لوحة التاجر.
 *
 * هذا هو **الوصل** بين اللوحتين: ما يكتبه المؤسس في قسم التواصل يصل التاجر هنا
 * بلا بريد ولا واتساب. جدول `announcements` وسياساته كانت موجودة منذ البداية
 * وفارغة تماماً — لا واجهة تكتب فيه ولا واجهة تقرؤه.
 *
 * ═══ الجمهور ═══
 *
 * `audience` يُصفّى **في العميل** لا في الاستعلام: سياسة القراءة تعطي كل
 * الإعلانات النشطة لأي مسجَّل، وحالة اشتراك التاجر معروفة هنا أصلاً من
 * `entitlements` فلا حاجة لنداء ثانٍ ولا لعمود يربط الإعلان بالمستخدم.
 *
 * ═══ الإخفاء ═══
 *
 * محلي عبر `K.SEEN_ANNOUNCEMENTS`. البديل (صف لكل تاجر × إعلان في القاعدة)
 * ثمن لا يستحقه إخفاء شريط، ويجعل كل تحميل للوحة استعلاماً إضافياً.
 */
import { useEffect, useMemo, useState } from "react";
import { rest } from "@/lib/api";
import { K, getItem, setItem } from "@/lib/storage";
import type { Announcement, AnnouncementAudience } from "@/lib/founder";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/lib/icons";

const TONE: Record<string, { box: string; icon: IconName }> = {
  info: { box: "border-gold/30 bg-gold/[.07]", icon: "megaphone" as const },
  warn: { box: "border-bad/40 bg-bad/[.07]", icon: "warn" as const },
  success: { box: "border-good/40 bg-good/[.07]", icon: "check" as const },
};

function seenIds(): string[] {
  return (getItem(K.SEEN_ANNOUNCEMENTS) ?? "").split(",").filter(Boolean);
}

function fits(a: Announcement, subscribed: boolean): boolean {
  const aud: AnnouncementAudience = (a.audience as AnnouncementAudience) ?? "all";
  if (aud === "active") return subscribed;
  if (aud === "inactive") return !subscribed;
  return true;
}

export function AnnouncementBar({ subscribed }: { subscribed: boolean }) {
  const [rows, setRows] = useState<Announcement[] | null>(null);
  const [seen, setSeen] = useState<string[]>(seenIds);

  useEffect(() => {
    let alive = true;
    rest<Announcement[]>(
      "announcements?status=eq.active&select=id,title,body,type,audience,status,created_at&order=created_at.desc&limit=5"
    )
      .then((r) => alive && setRows(r))
      // الإعلانات ليست جوهرية: فشلها لا يُظهر خطأً في لوحة التاجر.
      .catch(() => alive && setRows([]));
    return () => {
      alive = false;
    };
  }, []);

  const shown = useMemo(
    () => (rows ?? []).filter((a) => fits(a, subscribed) && !seen.includes(a.id)),
    [rows, subscribed, seen]
  );

  if (!shown.length) return null;

  function hide(id: string) {
    const next = [...seen, id];
    setSeen(next);
    setItem(K.SEEN_ANNOUNCEMENTS, next.join(","));
  }

  return (
    <div className="mb-4 flex flex-col gap-2">
      {shown.map((a) => {
        const tone = TONE[a.type ?? "info"] ?? TONE.info;
        return (
          <div
            key={a.id}
            className={cn("flex items-start gap-3 rounded-2xl border px-4 py-3", tone.box)}
          >
            <Icon name={tone.icon} size={18} className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-ink">{a.title}</p>
              <p className="mt-0.5 whitespace-pre-line text-sm text-dim">{a.body}</p>
            </div>
            <button
              onClick={() => hide(a.id)}
              aria-label="إخفاء"
              className="shrink-0 rounded-lg px-2 py-0.5 text-dim hover:bg-ink/5 hover:text-ink"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}

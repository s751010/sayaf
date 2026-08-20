/**
 * `/restaurants` — دليل المطاعم العامة.
 *
 * ═══ لماذا وُجد ═══
 *
 * كل منيو كان جزيرة: لا صفحة عامة تجمع المطاعم، فلا يصل زائرٌ لمطعمٍ إلا
 * بكوده المطبوع. الدليل يفعل شيئين معاً: يجلب زيارات عضوية للمنصّة (صفحة
 * فهرس تتحسّن في البحث مع كل مطعم جديد)، ويريها لتاجرٍ متردّد ممتلئةً
 * بأقرانه — أقوى حجة بيع من أي نصّ تسويقي.
 *
 * ═══ من يظهر ═══
 *
 * المعيار في `listPublicRestaurants()` لا هنا، وهو **نفس معيار
 * `sitemap.mjs` حرفياً**: slug + قائمة نشطة + طبقان فأكثر.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar, Footer } from "@/components/site";
import { listPublicRestaurants, type DirectoryRow } from "@/lib/data";
import { restaurantTypeLabel } from "@/lib/menuText";
import { menuUrl } from "@/lib/menuUrl";
import { Icon } from "@/lib/icons";

export default function Restaurants() {
  // `null` = يُحمَّل، `[]` = فارغ فعلاً (القاعدة (ج)).
  const [rows, setRows] = useState<DirectoryRow[] | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    document.title = "دليل المطاعم — كلاود منيو";
    listPublicRestaurants()
      .then(setRows)
      .catch(() => setRows([]));
  }, []);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows ?? [];
    return (rows ?? []).filter((r) =>
      [r.name, restaurantTypeLabel(r.type)]
        .filter(Boolean)
        .some((s) => s!.toLowerCase().includes(needle))
    );
  }, [rows, q]);

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <header className="mx-auto max-w-xl text-center">
          <h1 className="font-display text-3xl font-extrabold text-ink">دليل المطاعم</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            مطاعم ومقاهٍ تعرض منيوهاتها على كلاود منيو — تصفّح واطلب.
          </p>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث باسم المطعم أو نوعه…"
            aria-label="ابحث في دليل المطاعم"
            className="mt-5 w-full rounded-full border border-line bg-card px-5 py-3 text-sm text-ink"
          />
        </header>

        {rows === null ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="mt-14 text-center text-sm text-muted">
            {q ? "لا نتائج تطابق بحثك." : "لا مطاعم منشورة بعد — كن أوّلها!"}
          </p>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((r) => {
              const href = menuUrl(r.slug, "");
              const accent = r.cover_color || "#d4a843";
              const typeLabel = restaurantTypeLabel(r.type);
              return (
                <a
                  key={r.id}
                  href={href ?? "#"}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-card transition-transform hover:-translate-y-0.5"
                >
                  {/* شريط علوي بلون علامة المطعم — هويةٌ بلا صورة مطلوبة. */}
                  <div className="h-2 w-full" style={{ background: accent }} />
                  <div className="flex items-center gap-3 p-4">
                    <span
                      className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line text-2xl"
                      style={{ background: `${accent}1a` }}
                    >
                      {r.logo_image ? (
                        <img
                          src={r.logo_image}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span aria-hidden="true">{r.logo || "🍽"}</span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-black text-ink">{r.name}</span>
                      <span className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                        {typeLabel && <span className="truncate">{typeLabel}</span>}
                        {typeLabel && <span aria-hidden="true">·</span>}
                        <span className="shrink-0">{r.dishes} طبقاً</span>
                      </span>
                    </span>
                    <Icon
                      name="chevron"
                      size={16}
                      className="shrink-0 text-muted transition-transform group-hover:-translate-x-0.5"
                    />
                  </div>
                </a>
              );
            })}
          </div>
        )}

        <p className="mt-14 text-center text-sm text-muted">
          عندك مطعم؟{" "}
          <Link to="/login" className="font-bold text-gold underline underline-offset-2">
            أنشئ منيوك في دقائق
          </Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}

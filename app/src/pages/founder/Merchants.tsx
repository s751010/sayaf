/**
 * سجل التجّار — كل مطعم على المنصة في جدول واحد.
 *
 * البيانات كلها من `founder_merchants()` بنداء واحد: بريد المالك (من
 * `auth.users` غير المكشوف لـPostgREST) وعدد القوائم والأطباق والمشاهدات وحالة
 * الاشتراك. جلبُها من المتصفح كان سيعني N+1 استعلاماً لكل صف.
 *
 * الفلاتر ليست زينة: `?filter=no-dishes` هو ما تقود إليه بطاقة «يحتاج انتباهك»،
 * فيصل المؤسس من الرقم إلى الأسماء بضغطة.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Badge, Card, ErrorNote, Input, Select, Skeleton } from "@/components/ui";
import { getMerchants, type FounderMerchant } from "@/lib/founder";
import { cn, formatDate } from "@/lib/utils";

type FilterId = "all" | "no-dishes" | "expiring" | "inactive" | "paid";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "no-dishes", label: "بلا أطباق" },
  { id: "expiring", label: "ينتهي خلال ٧ أيام" },
  { id: "inactive", label: "بلا اشتراك نشط" },
  { id: "paid", label: "مشتركون مدفوعون" },
];

type SortId = "newest" | "views" | "dishes" | "ending";

const DAY = 86400_000;

function matches(m: FounderMerchant, f: FilterId): boolean {
  const endsIn = m.sub_end ? new Date(m.sub_end).getTime() - Date.now() : -1;
  switch (f) {
    case "no-dishes":
      return m.dishes_count === 0;
    case "expiring":
      return m.sub_active && endsIn > 0 && endsIn < 7 * DAY;
    case "inactive":
      return !m.sub_active;
    case "paid":
      return m.sub_active && m.sub_plan !== "trial";
    default:
      return true;
  }
}

/** شارة حالة الاشتراك — مصدر واحد كي لا تختلف بين الجدول والبطاقة. */
export function SubBadge({ m }: { m: Pick<FounderMerchant, "sub_active" | "sub_plan" | "sub_end"> }) {
  if (!m.sub_active) return <Badge variant="red">بلا اشتراك</Badge>;
  const days = m.sub_end ? Math.ceil((new Date(m.sub_end).getTime() - Date.now()) / DAY) : 0;
  if (m.sub_plan === "trial")
    return <Badge variant="gold">تجربة · {days} يوماً</Badge>;
  return <Badge variant="green">مشترك · {days} يوماً</Badge>;
}

export default function Merchants() {
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState<FounderMerchant[] | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortId>("newest");

  const filter = (params.get("filter") as FilterId) || "all";

  const load = useCallback(async () => {
    setError("");
    try {
      setRows(await getMerchants());
    } catch {
      setError("تعذّر تحميل سجل التجّار.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const shown = useMemo(() => {
    if (!rows) return null;
    const needle = q.trim().toLowerCase();
    const out = rows.filter((m) => {
      if (!matches(m, filter)) return false;
      if (!needle) return true;
      return (
        m.name.toLowerCase().includes(needle) ||
        (m.slug ?? "").toLowerCase().includes(needle) ||
        (m.owner_email ?? "").toLowerCase().includes(needle)
      );
    });
    const by: Record<SortId, (a: FounderMerchant, b: FounderMerchant) => number> = {
      newest: (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
      views: (a, b) => b.views_30d - a.views_30d,
      dishes: (a, b) => b.dishes_count - a.dishes_count,
      ending: (a, b) => +new Date(a.sub_end ?? 0) - +new Date(b.sub_end ?? 0),
    };
    return [...out].sort(by[sort]);
  }, [rows, q, filter, sort]);

  if (error) return <ErrorNote>{error}</ErrorNote>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-ink">التجّار</h1>
          <p className="mt-1 text-sm text-dim">
            {rows === null ? "…" : `${shown?.length ?? 0} من ${rows.length} مطعماً`}
          </p>
        </div>
        {/* الغلاف هو ما يحمل العرض: `fieldClass` يحمل `w-full` فلا يُلغيه
            `w-56` على العنصر نفسه (نفس أولوية Tailwind)، فيتكدّس الحقلان. */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-56">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث باسم أو رابط أو بريد…"
              aria-label="بحث"
            />
          </div>
          <div className="w-44">
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortId)}
              aria-label="الترتيب"
            >
              <option value="newest">الأحدث</option>
              <option value="views">الأكثر مشاهدة</option>
              <option value="dishes">الأكثر أطباقاً</option>
              <option value="ending">الأقرب انتهاءً</option>
            </Select>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const on = filter === f.id;
          const n = rows?.filter((m) => matches(m, f.id)).length;
          return (
            <button
              key={f.id}
              onClick={() => setParams(f.id === "all" ? {} : { filter: f.id }, { replace: true })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-bold transition-colors",
                on ? "border-gold bg-gold/12 text-gold" : "border-line text-dim hover:text-ink"
              )}
            >
              {f.label}
              {n !== undefined && <span className="ms-1.5 opacity-70">{n}</span>}
            </button>
          );
        })}
      </div>

      {shown === null ? (
        <Skeleton className="mt-5 h-64" />
      ) : shown.length === 0 ? (
        <Card className="mt-5 text-center text-sm text-dim">لا يوجد تاجر مطابق.</Card>
      ) : (
        <div className="mt-5 flex flex-col gap-2.5">
          {shown.map((m) => (
            <Card key={m.id} className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/founder/merchants/${m.id}`}
                    className="font-bold text-ink hover:text-gold hover:underline"
                  >
                    {m.logo} {m.name}
                  </Link>
                  <SubBadge m={m} />
                  {m.dishes_count === 0 && <Badge variant="red">بلا أطباق</Badge>}
                  {m.tickets_open > 0 && <Badge variant="gold">{m.tickets_open} تذكرة</Badge>}
                </div>
                <p className="mt-1 text-xs text-faint" dir="ltr">
                  {m.owner_email ?? "— بلا مالك —"}
                </p>
                <p className="mt-0.5 text-xs text-dim">
                  {m.menus_count} قائمة · {m.dishes_count} طبق · {m.views_30d} مشاهدة (٣٠ يوماً)
                  {" · "}
                  {formatDate(m.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {m.slug && (
                  <a
                    href={`/${m.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-dim hover:bg-ink/5 hover:text-ink"
                  >
                    منيوه ↗
                  </a>
                )}
                <Link
                  to={`/founder/merchants/${m.id}`}
                  className="rounded-lg border border-line-gold px-3 py-1.5 text-xs font-bold text-ink hover:bg-gold/10"
                >
                  افتح البطاقة
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

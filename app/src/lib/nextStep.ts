/**
 * «خطوتك التالية» — محرّك أولويات واحد بدل أربع بطاقات تتنافس.
 *
 * ═══ ما كان ═══
 *
 * «نظرة عامة» كانت تحمل **أربع بطاقات تجيب السؤال نفسه** — «وش أسوي الحين؟»:
 * التوصيات، ودليل الخطوات، واكتمال المنيو، وتنبيه المنيو الراكد. واثنتان منها
 * حُجبتا عن بعضهما بتعليق في الكود يقول «شريطا تقدّم متجاوران يُربكان» — وهذا
 * اعترافٌ بأن المشكلة عُرفت وعولجت بالإخفاء لا بالتوحيد. وثلاث بطاقات تظهر
 * معاً ليست ثلاث نصائح بل **لا نصيحة**: التاجر لا يعرف بأيّها يبدأ.
 *
 * ═══ ما صار ═══
 *
 * سلّم واحد يرتّب كل الأسباب الممكنة، ويُخرج **فعلاً واحداً** هو الأولى الآن،
 * وما بقي مطويّاً تحته. والترتيب ليس ذوقاً: يبدأ بما يمنع المنيو من العمل
 * أصلاً، ثم بما يكلّف التاجر مبيعات اليوم، ثم بالتحسينات.
 *
 * يُعاد استخدام `Insight` من `lib/insights.ts` كما هو — نوع واحد للكل، فبطاقة
 * العرض لا تعرف من أين جاء البند.
 */
import { buildInsights, type Insight } from "./insights";
import type { AnalyticsRow, Dish, Restaurant } from "./types";
import type { Menu } from "./types";

export interface NextStep {
  /** الفعل الأولى الآن — `null` حين لا ينقص شيء. */
  action: Insight | null;
  /** البقية بالترتيب، تُعرض مطويّة. */
  rest: Insight[];
}

/**
 * يبني السلّم كاملاً ثم يقطعه.
 *
 * `null` في أي مُدخَل يعني «لم تُحسم البيانات بعد» — فنعيد لا شيء بدل أن نقول
 * للتاجر إنه لم يُنجز شيئاً بينما نحن ما زلنا نُحمِّل (قاعدة «لا تكسر حالات
 * التحميل»).
 */
export function buildNextStep(
  dishes: Dish[] | null,
  menus: Menu[] | null,
  rows: AnalyticsRow[] | null,
  restaurant: Restaurant
): NextStep {
  if (!dishes || !menus || !rows) return { action: null, rest: [] };

  const out: Insight[] = [];
  const n = dishes.length;

  /* ١) لا منيو أصلاً — كل ما دونه بلا معنى. */
  if (n === 0) {
    out.push({
      id: "no-dishes",
      severity: "high",
      icon: "🍽️",
      text: "منيوك فارغ — أضف أصنافك ليصير للكود الذي تطبعه ما يعرضه.",
      action: { label: "ابدأ منيوك", to: "/dashboard/dishes" },
    });
    return { action: out[0], rest: [] };
  }

  /* ٢) صور الأطباق — أعلى أثر لأقل جهد، ومُثبَت أنه أكبر نقص عندنا. */
  const noImage = dishes.filter((d) => !d.image?.trim());
  if (noImage.length) {
    out.push({
      id: "dishes-no-image",
      severity: noImage.length > n / 2 ? "high" : "info",
      icon: "📷",
      text:
        noImage.length === n
          ? `كل أطباقك (${n}) بلا صورة — الصورة أكثر ما يرفع الطلب على الصنف.`
          : `${noImage.length} من ${n} أطباق بلا صورة.`,
      action: { label: "ارفع الصور", to: "/dashboard/dishes" },
    });
  }

  /* ٣) توصيات الأرقام — تعمل وحدها متى بلغت المشاهدات حدّاً معقولاً. */
  out.push(...buildInsights(dishes, rows, restaurant));

  /* ٤) نواقص تُرى في المنيو. */
  const gaps: [boolean, string, string, string, string][] = [
    [!restaurant.logo_image?.trim(), "logo", "🏷️", "منيوك بلا شعار — أول ما تراه عين الزبون أعلى الصفحة.", "/dashboard/design"],
    [!restaurant.working_hours?.trim(), "hours", "🕐", "ساعات العمل غير محدّدة — الزبون لا يعرف «مفتوح الآن» بلا اتصال.", "/dashboard/settings"],
    [!restaurant.google_review_url?.trim(), "review", "⭐", "لا رابط تقييم قوقل — أرخص قناة نمو لمطعمك.", "/dashboard/settings"],
    [!restaurant.social_maps?.trim(), "maps", "📍", "موقعك غير مربوط بالخريطة — زبون جديد يصلك بضغطة.", "/dashboard/settings"],
  ];
  for (const [missing, id, icon, text, to] of gaps) {
    if (missing) out.push({ id: `gap-${id}`, severity: "info", icon, text, action: { label: "أكمله", to } });
  }

  /* ٥) الركود — آخر السلّم: منيو مكتمل لكنه لم يتغيّر منذ مدّة. */
  const newest = Math.max(...dishes.map((d) => +new Date(d.created_at ?? 0)));
  const staleDays = Number.isFinite(newest) && newest > 0
    ? Math.floor((Date.now() - newest) / 86400_000)
    : null;
  if (staleDays !== null && staleDays >= 21) {
    out.push({
      id: "stale",
      severity: "info",
      icon: "🌱",
      text: `لم تُضف طبقاً منذ ${staleDays} يوماً — جديدٌ أو عرضُ اليوم يعطي زبونك سبباً ليمسح الكود ثانيةً.`,
      action: { label: "أضف طبقاً", to: "/dashboard/dishes" },
    });
  }

  // الأهمّ أولاً مع الحفاظ على ترتيب السلّم داخل كل درجة.
  const ranked = [...out].sort(
    (a, b) => (a.severity === "high" ? 0 : 1) - (b.severity === "high" ? 0 : 1)
  );
  return { action: ranked[0] ?? null, rest: ranked.slice(1) };
}

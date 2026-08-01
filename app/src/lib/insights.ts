/**
 * التوصيات: تحويل الأرقام إلى «وش أسوي».
 *
 * التاجر قال: «التحليلات الآن تقول ١٢٠ مشاهدة. أبي: طبق الكبسة يُفتح كثير وما
 * فيه صورة — أضف صورة. التوصية أثمن من الرقم.»
 *
 * منطق خالص من بيانات موجودة أصلاً (`analytics` + `dishes` + `restaurants`) —
 * لا استعلام جديد ولا عمود جديد. كل توصية تحمل وجهتها: الزر يفتح مكان الإصلاح.
 */
import type { AnalyticsRow, Dish, Restaurant } from "./types";

export type Insight = {
  id: string;
  /** high = يكلّفه مبيعات الآن · info = تحسين يستحق. */
  severity: "high" | "info";
  icon: string;
  text: string;
  action?: { label: string; to: string };
};

/** الحد الذي دونه لا معنى للنِسب — عيّنة صغيرة تنتج نصائح عشوائية. */
const MIN_VIEWS = 20;

export function buildInsights(
  dishes: Dish[],
  rows: AnalyticsRow[],
  restaurant: Restaurant
): Insight[] {
  const out: Insight[] = [];
  const menuRows = rows.filter((r) => !r.dish_id);
  const dishRows = rows.filter((r) => r.dish_id);

  const views = menuRows.reduce((s, r) => s + (r.views ?? 0), 0);

  const hits = new Map<string, number>();
  for (const r of dishRows) {
    if (r.dish_id) hits.set(r.dish_id, (hits.get(r.dish_id) ?? 0) + (r.views ?? 0));
  }
  const opens = [...hits.values()].reduce((s, v) => s + v, 0);
  const ranked = [...dishes].sort((a, b) => (hits.get(b.id) ?? 0) - (hits.get(a.id) ?? 0));
  const top = ranked.slice(0, 10).filter((d) => (hits.get(d.id) ?? 0) > 0);

  /* ١) طبق مطلوب بلا صورة — أعلى عائد لأقل جهد. */
  const popularNoImage = top.filter((d) => !d.image?.trim());
  if (popularNoImage.length) {
    const names = popularNoImage.slice(0, 3).map((d) => `«${d.name}»`).join("، ");
    out.push({
      id: "popular-no-image",
      severity: "high",
      icon: "📷",
      text: `${names} من الأكثر فتحاً وما فيه صورة — أضف صورة وسترتفع الطلبات عليه.`,
      action: { label: "أضف الصور", to: "/dashboard/dishes" },
    });
  }

  /* ٢) أطباق لا يفتحها أحد. */
  const dead = dishes.filter((d) => (hits.get(d.id) ?? 0) === 0);
  if (views >= MIN_VIEWS && dead.length >= 3) {
    out.push({
      id: "dead-dishes",
      severity: "info",
      icon: "🕳️",
      text: `${dead.length} طبقاً لم يفتحه أحد خلال الفترة — راجع صورته ووصفه وتصنيفه، أو أخفِه ليبرز الباقي.`,
      action: { label: "راجع الأطباق", to: "/dashboard/dishes" },
    });
  }

  /* ٣) الزبون يمرّ ولا يفتح شيئاً. */
  const openRate = views > 0 ? Math.round((opens / views) * 100) : 0;
  if (views >= MIN_VIEWS && openRate < 20) {
    out.push({
      id: "low-open-rate",
      severity: "high",
      icon: "👀",
      text: `${openRate}% فقط ممن فتحوا المنيو فتحوا طبقاً. غالباً الصور قليلة أو التصنيفات كثيرة — قلّل الأقسام وأضف صوراً للأطباق الأولى.`,
      action: { label: "رتّب التصنيفات", to: "/dashboard/dishes" },
    });
  }

  /* ٤) ساعة الذروة — متى يُنشر العرض. */
  if (views >= MIN_VIEWS) {
    const byHour = new Array<number>(24).fill(0);
    for (const r of menuRows) {
      if (r.hour != null && r.hour >= 0 && r.hour <= 23) byHour[r.hour] += r.views ?? 0;
    }
    const peak = byHour.indexOf(Math.max(...byHour));
    // ذروة حقيقية لا مجرد أعلى قيمة في توزيع مسطّح.
    if (byHour[peak] > views * 0.2) {
      out.push({
        id: "peak-hour",
        severity: "info",
        icon: "⏰",
        text: `ذروتك الساعة ${peak}:00 بتوقيت الرياض — انشر عرضك أو رسالتك قبلها بساعة.`,
      });
    }
  }

  /* ٥) تقييم قوقل — أرخص طريق لعملاء جدد. */
  if (views >= MIN_VIEWS && !restaurant.google_review_url?.trim()) {
    out.push({
      id: "no-google",
      severity: "high",
      icon: "⭐",
      text: `${views} زائراً فتحوا منيوك ولا يوجد زر تقييم قوقل — أضف رابطك وحوّلهم إلى تقييمات.`,
      action: { label: "أضف الرابط", to: "/dashboard/settings" },
    });
  }

  /* ٦) الولاء معطّل رغم وجود زوّار. */
  if (views >= MIN_VIEWS && !restaurant.loyalty_enabled) {
    out.push({
      id: "loyalty-off",
      severity: "info",
      icon: "💛",
      text: "بطاقة الولاء مطفأة — فعّلها ليعود الزبون مرة أخرى بدل أن يجرّب غيرك.",
      action: { label: "فعّل الولاء", to: "/dashboard/settings" },
    });
  }

  /* ٧) الإنجليزية مطفأة رغم أن زبائن يقلبون إليها. */
  const enViews = menuRows.reduce((s, r) => s + (r.lang === "en" ? (r.views ?? 0) : 0), 0);
  if (enViews > 0 && !restaurant.english_enabled) {
    out.push({
      id: "english-off",
      severity: "info",
      icon: "🌐",
      text: `${enViews} مشاهدة بالإنجليزية ومبدّل اللغة مطفأ — فعّله وأضف الأسماء الإنجليزية.`,
      action: { label: "فعّل الإنجليزية", to: "/dashboard/settings" },
    });
  }

  /* ٨) بيانات هيئة الغذاء والدواء ناقصة. */
  const incomplete = dishes.filter((d) => d.calories == null || d.sodium_mg == null);
  if (dishes.length > 0 && incomplete.length > dishes.length / 2) {
    out.push({
      id: "sfda",
      severity: "info",
      icon: "🥗",
      text: `${incomplete.length} طبقاً بلا سعرات أو صوديوم — إكمالها يعرض شارة التوافق مع هيئة الغذاء والدواء للزبون.`,
      action: { label: "أكمل البيانات", to: "/dashboard/dishes" },
    });
  }

  /* ٩) لا صور إطلاقاً — الحالة الأسوأ، تسبق كل ما سبق. */
  if (dishes.length >= 3 && dishes.every((d) => !d.image?.trim())) {
    out.unshift({
      id: "no-images",
      severity: "high",
      icon: "🖼️",
      text: "لا يوجد صورة واحدة في منيوك — الصور أكثر ما يرفع الطلب. ارفعها دفعة واحدة في دقيقتين.",
      action: { label: "ارفع الصور", to: "/dashboard/dishes" },
    });
  }

  // الأهم أولاً، مع الحفاظ على ترتيب كل مجموعة.
  return [...out.filter((i) => i.severity === "high"), ...out.filter((i) => i.severity === "info")];
}

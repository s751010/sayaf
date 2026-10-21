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
import type { IconName } from "./icons";

export type Insight = {
  id: string;
  /** high = يكلّفه مبيعات الآن · info = تحسين يستحق. */
  severity: "high" | "info";
  icon: IconName;
  text: string;
  action?: { label: string; to: string };
};

/** الحد الذي دونه لا معنى للنِسب — عيّنة صغيرة تنتج نصائح عشوائية. */
const MIN_VIEWS = 20;

/**
 * لغة الزبون الفعلية: **من فتح الأطباق لا من مشاهدة المنيو.**
 *
 * ═══ العطل ═══
 *
 * كانت «لغة العرض» تُعدّ من صفوف مشاهدة المنيو — وتلك تُسجَّل عند التحميل،
 * **قبل** أن يلمس الزبون مبدّل اللغة، فلغتها `ar` دائماً. فكانت البطاقة تقول
 * «English: 0» لكل مطعم، وتوصية الإنجليزية لا تظهر أبداً.
 *
 * وفتح الطبق يُسجَّل بلغة الشاشة لحظتها — هي اللغة التي قرأ بها فعلاً. ولا
 * يتغيّر شيء في القاعدة: الحقل نفسه، من الصفوف التي كانت تحمله صحيحاً أصلاً.
 *
 * ⚠️ **وهو تقريبي**: الفهرس الفريد `analytics_dish_hour_unique` على
 * `(menu_id, date, hour, dish_id)` بلا `lang`، فكل فتحات الصنف في الساعة
 * الواحدة صفٌّ واحد بلغة واحدة. يصحّ تماماً حين يُفتح الصنف مرّة في الساعة —
 * وهي حال أغلب المطاعم — ويميل حين تختلط اللغتان على صنفٍ واحد في ساعة.
 * إصلاحه في القاعدة (`LAUNCH.md`).
 */
export function languageSplit(rows: AnalyticsRow[], inRange?: Set<string>): { ar: number; en: number } {
  let ar = 0;
  let en = 0;
  for (const r of rows) {
    if (!r.dish_id || (inRange && (!r.date || !inRange.has(r.date)))) continue;
    if (r.lang === "en") en += r.views ?? 0;
    else ar += r.views ?? 0;
  }
  return { ar, en };
}

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
      icon: "image",
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
      icon: "warn",
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
      icon: "eye",
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
        icon: "clock",
        text: `ذروتك الساعة ${peak}:00 بتوقيت الرياض — انشر عرضك أو رسالتك قبلها بساعة.`,
      });
    }
  }

  /* ٥) تقييم قوقل — أرخص طريق لعملاء جدد. */
  if (views >= MIN_VIEWS && !restaurant.google_review_url?.trim()) {
    out.push({
      id: "no-google",
      severity: "high",
      icon: "star",
      text: `${views} زائراً فتحوا منيوك ولا يوجد زر تقييم قوقل — أضف رابطك وحوّلهم إلى تقييمات.`,
      action: { label: "أضف الرابط", to: "/dashboard/settings" },
    });
  }

  /* ٦) الولاء معطّل رغم وجود زوّار. */
  if (views >= MIN_VIEWS && !restaurant.loyalty_enabled) {
    out.push({
      id: "loyalty-off",
      severity: "info",
      icon: "heart",
      text: "بطاقة الولاء مطفأة — فعّلها ليعود الزبون مرة أخرى بدل أن يجرّب غيرك.",
      // الولاء في صفحته (`Loyalty.tsx`) لا في الإعدادات — كان الزرّ يقود إلى
      // صفحة لا مفتاح ولاء فيها.
      action: { label: "فعّل الولاء", to: "/dashboard/loyalty" },
    });
  }

  /*
   * ٧) زبائن يقرؤون بالإنجليزية وأصنافٌ بلا اسم إنجليزي.
   *
   * ⚠️ كانت «الإنجليزية مطفأة رغم أن زبائن يقلبون إليها» — وهذا **مستحيل**:
   * المبدّل لا يظهر للزبون إلا حين تكون مفعّلة. فالتوصية الممكنة هي التالية:
   * من يقرأ بالإنجليزية يرى الصنف غير المترجَم باسمه العربي.
   */
  // من الفتحات **بالإنجليزية** وحدها: صنفٌ يفتحه العرب كثيراً ولم يفتحه قارئ
  // إنجليزي واحد ليس ما يراه ذلك القارئ بلا ترجمة.
  const enHits = new Map<string, number>();
  for (const r of dishRows) {
    if (r.dish_id && r.lang === "en") enHits.set(r.dish_id, (enHits.get(r.dish_id) ?? 0) + (r.views ?? 0));
  }
  const enOpens = [...enHits.values()].reduce((s, v) => s + v, 0);
  const untranslated = dishes
    .filter((d) => (enHits.get(d.id) ?? 0) > 0 && !d.name_en?.trim())
    .sort((a, b) => (enHits.get(b.id) ?? 0) - (enHits.get(a.id) ?? 0));
  if (restaurant.english_enabled && untranslated.length) {
    out.push({
      id: "english-gaps",
      severity: "info",
      icon: "link",
      text: `${enOpens} فتحاً بالإنجليزية، و${untranslated.length} من الأصناف التي فُتحت بها بلا اسم إنجليزي — ابدأ بـ«${untranslated[0].name}».`,
      action: { label: "أكمل الترجمة", to: "/dashboard/dishes" },
    });
  }

  /* ٨) بيانات هيئة الغذاء والدواء ناقصة. */
  const incomplete = dishes.filter((d) => d.calories == null || d.sodium_mg == null);
  if (dishes.length > 0 && incomplete.length > dishes.length / 2) {
    out.push({
      id: "sfda",
      severity: "info",
      icon: "salad",
      // ما يراه الزبون فعلاً «القيم الغذائية مُعلنة من المطعم» (`DishModal`) —
      // لا «شارة توافق مع الهيئة»: لا شارة رسمية، والوعد بها كان كاذباً.
      text: `${incomplete.length} طبقاً بلا سعرات أو صوديوم — والهيئة تطلب السعرات بجانب كل صنف. احسبها من الوصفة.`,
      action: { label: "أكمل الأرقام", to: "/dashboard/nutrition" },
    });
  }

  /* ٩) لا صور إطلاقاً — الحالة الأسوأ، تسبق كل ما سبق. */
  if (dishes.length >= 3 && dishes.every((d) => !d.image?.trim())) {
    out.unshift({
      id: "no-images",
      severity: "high",
      icon: "image",
      text: "لا يوجد صورة واحدة في منيوك — الصور أكثر ما يرفع الطلب. ارفعها دفعة واحدة في دقيقتين.",
      action: { label: "ارفع الصور", to: "/dashboard/dishes" },
    });
  }

  // الأهم أولاً، مع الحفاظ على ترتيب كل مجموعة.
  return [...out.filter((i) => i.severity === "high"), ...out.filter((i) => i.severity === "info")];
}

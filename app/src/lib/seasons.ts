/**
 * الزينة الموسمية — طبقة تُضاف **فوق** أي طابع بلا أن تُبدّله.
 *
 * لماذا بتحكّم التاجر لا بالتاريخ: منيو يتغيّر شكله بلا إذن صاحبه مفاجأة غير
 * محبوبة، ورمضان هجري يحتاج حساباً تقريبياً يخطئ بيوم أو يومين — فيظهر الهلال
 * قبل الشهر أو يبقى بعده.
 *
 * الطبقة تلمس الزخرفة ولون التمييز الثانوي فقط، ولا تمسّ `--m-bg` ولا
 * `--m-text` — فالتباين الذي ضبطه الطابع يبقى سليماً مهما كانت الزينة.
 */
import type { PatternId } from "./patterns";

export type SeasonId = "ramadan" | "national" | "founding";

export interface Season {
  id: SeasonId;
  name: string;
  /** ما يظهر للزبون أعلى المنيو. */
  greeting: string;
  greetingEn: string;
  emoji: string;
  pattern: PatternId;
  /** لون الزينة — يُطبَّق على `--m-accent-2` وحده. */
  tint: string;
}

export const SEASONS: Season[] = [
  {
    id: "ramadan",
    name: "رمضان",
    greeting: "رمضان مبارك",
    greetingEn: "Ramadan Mubarak",
    emoji: "🌙",
    pattern: "crescent",
    tint: "#e8c56a",
  },
  {
    id: "national",
    name: "اليوم الوطني",
    greeting: "كل عام والوطن بخير",
    greetingEn: "Happy Saudi National Day",
    emoji: "🇸🇦",
    pattern: "palm",
    tint: "#1c8a4e",
  },
  {
    id: "founding",
    name: "يوم التأسيس",
    greeting: "يوم بدينا",
    greetingEn: "Founding Day",
    emoji: "🌴",
    pattern: "sadu",
    tint: "#8c6239",
  },
];

export function getSeason(id: string | null | undefined): Season | null {
  return SEASONS.find((s) => s.id === id) ?? null;
}

/**
 * هل موسم هذه الزينة قريب؟ — للوحة التاجر لا للمنيو.
 *
 * ⚠️ **هذا لا يشغّل الزينة**: التشغيل يبقى بيد التاجر كما يقول رأس الملف. هذه
 * تقرّر متى يُعرض **الخيار** في اللوحة. صفر من تسعة عشر تاجراً استعملوا الزينة،
 * وقسمٌ ميّت أحد عشر شهراً في السنة ضريبةٌ على انتباه كل من يمرّ بالصفحة.
 *
 * النوافذ تقريبية عمداً: يوم التأسيس ٢٢ فبراير والوطني ٢٣ سبتمبر ميلاديان
 * فيُحسبان بدقّة، ورمضان هجري يزحف ~١١ يوماً كل سنة — فالنافذة واسعة (شهران)
 * ولا تدّعي دقّة لا تملكها. خطأ الاتّساع يُظهر خياراً مبكراً، وخطأ الضيق يمنع
 * تاجراً من تزيين منيوه في موسمه.
 */
export function seasonWindowOpen(id: SeasonId | "", now = new Date()): boolean {
  if (!id) return true;
  const m = now.getUTCMonth() + 1; // 1..12
  const d = now.getUTCDate();
  if (id === "national") return (m === 9 && d >= 1) || (m === 10 && d <= 5);
  if (id === "founding") return (m === 2 && d >= 1) || (m === 3 && d <= 5);
  // رمضان: نافذة زاحفة تقريبية — تُراجَع مرة كل بضع سنوات.
  return m >= 1 && m <= 4;
}

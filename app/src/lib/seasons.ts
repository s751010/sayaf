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

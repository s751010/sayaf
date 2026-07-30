/**
 * ساعات العمل.
 *
 * تُخزَّن في عمود `restaurants.working_hours` النصّي. الصيغة المعتمدة JSON:
 *   {"sat":{"open":true,"from":"07:00","to":"01:00"}, …}
 *
 * ⚠️ هذه ليست صيغة جديدة — بيانات إنتاج فعلية تستخدمها بالفعل (مطعم «مشراق»)،
 * فالقارئ يطابقها حرفياً. وصفوف أخرى تحمل نصاً حراً («يومياً 12:00 ظهراً …»)
 * فنتسامح معه ونعرضه كما هو بدل أن نُسقطه.
 *
 * قبل هذا الملف كانت `MenuPage` تطبع القيمة كما هي في ترويسة المنيو، أي أن
 * زبون «مشراق» كان يرى JSON خاماً على شاشته.
 */

/** ترتيب أيام الأسبوع كما يبدأ في السعودية. */
export const DAYS = [
  { id: "sat", ar: "السبت", en: "Saturday" },
  { id: "sun", ar: "الأحد", en: "Sunday" },
  { id: "mon", ar: "الاثنين", en: "Monday" },
  { id: "tue", ar: "الثلاثاء", en: "Tuesday" },
  { id: "wed", ar: "الأربعاء", en: "Wednesday" },
  { id: "thu", ar: "الخميس", en: "Thursday" },
  { id: "fri", ar: "الجمعة", en: "Friday" },
] as const;

export type DayId = (typeof DAYS)[number]["id"];

export type DayHours = { open: boolean; from: string; to: string };
export type WeekHours = Record<DayId, DayHours>;

/** `Date.getDay()` → معرّف اليوم (0 = الأحد). */
const JS_DAY_TO_ID: DayId[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export const DEFAULT_DAY: DayHours = { open: true, from: "12:00", to: "23:00" };

export function defaultWeek(): WeekHours {
  return DAYS.reduce((acc, d) => {
    acc[d.id] = { ...DEFAULT_DAY };
    return acc;
  }, {} as WeekHours);
}

function isTime(v: unknown): v is string {
  return typeof v === "string" && /^\d{1,2}:\d{2}$/.test(v);
}

/**
 * القيمة المخزَّنة → أسبوع مهيكل، أو `null` إن كانت نصاً حراً.
 * `null` تعني «اعرض النص كما هو» لا «لا توجد ساعات».
 */
export function parseWeek(raw: string | null | undefined): WeekHours | null {
  if (!raw?.trim()) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null; // نص حر
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;

  const src = parsed as Record<string, unknown>;
  const week = defaultWeek();
  let matched = 0;
  for (const d of DAYS) {
    const v = src[d.id];
    if (!v || typeof v !== "object") continue;
    const o = v as Record<string, unknown>;
    week[d.id] = {
      open: o.open !== false,
      from: isTime(o.from) ? normalizeTime(o.from) : DEFAULT_DAY.from,
      to: isTime(o.to) ? normalizeTime(o.to) : DEFAULT_DAY.to,
    };
    matched++;
  }
  // JSON لا يحتوي أي يوم معروف ⇒ ليس أسبوع ساعات.
  return matched > 0 ? week : null;
}

export function serializeWeek(week: WeekHours): string {
  return JSON.stringify(week);
}

/** `7:0` → `07:00` كي تبقى المقارنات النصّية صحيحة. */
export function normalizeTime(v: string): string {
  const [h, m] = v.split(":");
  return `${String(Number(h)).padStart(2, "0")}:${(m ?? "00").padStart(2, "0")}`;
}

function toMinutes(v: string): number {
  const [h, m] = normalizeTime(v).split(":").map(Number);
  return h * 60 + m;
}

/** الوقت الحالي في الرياض (UTC+3، بلا توقيت صيفي) كدقائق من منتصف الليل. */
function riyadhNow(now = new Date()): { minutes: number; dayId: DayId } {
  const riyadh = new Date(now.getTime() + 3 * 3600_000);
  return {
    minutes: riyadh.getUTCHours() * 60 + riyadh.getUTCMinutes(),
    dayId: JS_DAY_TO_ID[riyadh.getUTCDay()],
  };
}

/**
 * معرّف يوم اليوم بتوقيت الرياض.
 * تُصدَّر كي لا يُعيد المُستدعي حساب خريطة `getUTCDay()` بنفسه — ترتيب `DAYS`
 * يبدأ بالسبت لا بالأحد، وهذا مصدر خطأ إزاحة مغرٍ.
 */
export function riyadhTodayId(now = new Date()): DayId {
  return riyadhNow(now).dayId;
}

export type OpenState = { open: boolean; label: string; until: string | null };

/**
 * هل المطعم مفتوح الآن؟
 * يتعامل مع الفترات التي تعبر منتصف الليل (07:00 → 01:00): الفترة تخصّ يوم
 * البداية، فبعد منتصف الليل نفحص أيضاً ساعات اليوم السابق.
 */
export function openState(week: WeekHours, en = false, now = new Date()): OpenState {
  const { minutes, dayId } = riyadhNow(now);
  const idx = DAYS.findIndex((d) => d.id === dayId);
  const today = week[dayId];
  const prev = week[DAYS[(idx - 1 + DAYS.length) % DAYS.length].id];

  // فترة أمس الممتدّة بعد منتصف الليل
  if (prev.open) {
    const from = toMinutes(prev.from);
    const to = toMinutes(prev.to);
    if (to < from && minutes < to) {
      return { open: true, label: en ? "Open now" : "مفتوح الآن", until: prev.to };
    }
  }

  if (today.open) {
    const from = toMinutes(today.from);
    const to = toMinutes(today.to);
    const overnight = to < from;
    const isOpen = overnight ? minutes >= from : minutes >= from && minutes < to;
    if (isOpen) {
      return { open: true, label: en ? "Open now" : "مفتوح الآن", until: today.to };
    }
    if (minutes < from) {
      return {
        open: false,
        label: en ? `Opens at ${today.from}` : `يفتح ${today.from}`,
        until: null,
      };
    }
  }

  return { open: false, label: en ? "Closed now" : "مغلق الآن", until: null };
}

/** ملخّص قصير للترويسة: «يومياً 12:00 – 23:00» أو «مغلق الجمعة». */
export function weekSummary(week: WeekHours, en = false): string {
  const openDays = DAYS.filter((d) => week[d.id].open);
  if (openDays.length === 0) return en ? "Closed" : "مغلق";

  const first = week[openDays[0].id];
  const allSame = openDays.every(
    (d) => week[d.id].from === first.from && week[d.id].to === first.to
  );

  if (allSame && openDays.length === DAYS.length) {
    return en ? `Daily ${first.from} – ${first.to}` : `يومياً ${first.from} – ${first.to}`;
  }
  if (allSame) {
    const names = openDays.map((d) => (en ? d.en : d.ar)).join("، ");
    return `${names} ${first.from} – ${first.to}`;
  }
  return en ? "See hours" : "ساعات متغيّرة";
}

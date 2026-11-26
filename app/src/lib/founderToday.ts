/**
 * «اليوم» في لوحة المؤسّس — قائمة «ينتظرك» من أرقامٍ موجودة، بلا استعلام زائد.
 *
 * الرقم وحده لا يقول ماذا أفعل. فكلّ بندٍ هنا جملةٌ بفعلٍ ورابطٍ يفتح المكان
 * الذي يُحلّ فيه، ويظهر فقط إن كان عدده أكبر من صفر. والترتيب بالإلحاح:
 * ما يمسّ تاجراً الآن أولاً، ثم ما يمسّ المنصّة، ثم مهامّ المالك.
 *
 * دالّة خالصة — تُفحص في `founder-today.test.ts` بلا شبكة.
 */
import type { ClientErrorGroup, FounderOverview, HealthItem } from "./founder";

export type QueueTone = "bad" | "warn" | "calm";

export interface QueueItem {
  id: string;
  n: number;
  text: string;
  to: string;
  tone: QueueTone;
}

const DAY = 86_400_000;

export function buildQueue(input: {
  overview: FounderOverview | null;
  health: HealthItem[] | null;
  errors: ClientErrorGroup[] | null;
  tasksLeft: number | null;
  now?: number;
}): QueueItem[] {
  const { overview: o, health, errors, tasksLeft } = input;
  const now = input.now ?? Date.now();
  const items: QueueItem[] = [];

  if (o) {
    items.push(
      { id: "tickets", n: o.tickets_unread, text: "تذكرة دعم ما قريتها", to: "/founder/support", tone: "bad" },
      {
        id: "expiring",
        n: o.subs_expiring_7d,
        text: "اشتراك ينتهي خلال ٧ أيام — كلّمهم قبل",
        to: "/founder/merchants?filter=expiring",
        tone: "warn",
      },
      {
        id: "no-dish",
        n: o.restaurants_no_dish,
        text: "مطعم سجّل وما أضاف ولا طبق",
        to: "/founder/merchants?filter=no-dishes",
        tone: "warn",
      }
    );
  }

  if (health) {
    items.push({
      id: "health",
      n: health.filter((h) => h.severity === "high").length,
      text: "مشكلة تشغيل خطيرة",
      to: "/founder/site",
      tone: "bad",
    });
  }

  if (errors) {
    items.push({
      id: "errors",
      n: errors.filter((e) => now - new Date(e.last_seen).getTime() < DAY).length,
      text: "خطأ ظهر لزوّار الموقع آخر ٢٤ ساعة",
      to: "/founder/site",
      tone: "warn",
    });
  }

  if (tasksLeft !== null) {
    items.push({ id: "tasks", n: tasksLeft, text: "مهمة باقية عليك", to: "/founder/tasks", tone: "calm" });
  }

  const order: Record<QueueTone, number> = { bad: 0, warn: 1, calm: 2 };
  return items.filter((i) => i.n > 0).sort((a, b) => order[a.tone] - order[b.tone]);
}

/** تحية بحسب ساعة الرياض — صباح حتى الظهر، ثم مساء. */
export function greeting(now = new Date()): string {
  const h = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Riyadh" }).format(now)
  );
  return h >= 4 && h < 12 ? "صباح الخير" : "مساء الخير";
}

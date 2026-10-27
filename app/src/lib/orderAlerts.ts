/**
 * تنبيه الطلب الجديد — **المنطق وحده، بلا شبكة ولا DOM**.
 *
 * ═══ سؤالان لا سؤال ═══
 *
 * «هل وصل طلبٌ جديد؟» سؤالان مختلفان يخلطهما من يعدّ:
 *
 *  ١. **هل نرنّ له؟** — مرّة واحدة لكل طلب، مهما تكرّر الاستطلاع أو فُتح
 *     تبويبٌ ثانٍ أو أُعيد تحميل الصفحة. فالطلب يُحفظ في `alerted` لحظة الرنين.
 *  ٢. **هل رآه التاجر؟** — الشارة على «الطلبات» تبقى حتى يفتح شاشةً تعرضه
 *     (الطلبات أو شاشة الكاشير)، لا حتى يرنّ الجرس. فالرنين لا يُطفئ الشارة،
 *     ومن غاب عن الجهاز يعود فيجدها.
 *
 * ولذلك مجموعتان مستقلّتان. ورؤية الطلب **لا** تُدخله في `alerted`: صفحة
 * الطلبات تستطلع بنفسها، وقد ترى الطلب قبل استطلاع الجرس بثوانٍ — ولو عُدّت
 * الرؤية رنيناً لصمت الجرس عن طلبٍ وصل والكاشير ينظر إلى الشاشة الأخرى.
 *
 * ═══ «جديد» = حالته `new` ولم يُرَ ═══
 *
 * الطلب الذي بدأ تحضيره ليس جديداً ولو لم تُفتح شاشة الطلبات (فتحه أحدٌ من
 * جهاز آخر). فالمجموعتان تُقلَّمان إلى طلبات `new` الحاضرة في كل جولة: الحجم
 * محدود بما ينتظر فعلاً، والطلب لا يعود إلى `new` بعد مغادرتها (تريجر
 * `guard_order_status` يمنع الرجوع)، فالتقليم لا يُعيد رنيناً.
 *
 * ═══ أوّل تشغيل على الجهاز ═══
 *
 * بلا حالةٍ محفوظة لا نعرف عمر ما ينتظر: قد يكون طلباً عالقاً في `new` من
 * أسبوع. فيُعدّ «مُنبَّهاً» بلا رنين — والشارة تعدّه مع ذلك، لأن التاجر لم يره.
 */

/** ما يُحفظ لكل مطعم في `localStorage` — معرّفات فقط، لا اسم ولا جوال زبون. */
export type AlertState = {
  /** طلبات رنّ لها الجرس (أو كانت قائمةً عند أوّل تشغيل). */
  alerted: string[];
  /** طلبات عرضتها شاشةٌ أمام التاجر. */
  seen: string[];
};

export type Reconciled = {
  state: AlertState;
  /** طلبات يُرنّ لها الآن — بترتيب وصولها في القائمة. */
  toAlert: string[];
  /** عدد الشارة: طلبات `new` لم تُعرض على التاجر. */
  unseen: number;
};

/** حالةٌ محفوظة تالفة (تحرير يدوي · نسخة قديمة) تُعامل كأوّل تشغيل لا كانهيار. */
export function parseAlertState(raw: unknown): AlertState | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const ids = (v: unknown) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : null;
  const alerted = ids(r.alerted);
  const seen = ids(r.seen);
  if (!alerted || !seen) return null;
  return { alerted, seen };
}

/**
 * جولة استطلاع واحدة.
 *
 * @param prev   الحالة المحفوظة — `null` أوّل تشغيل على هذا الجهاز.
 * @param newIds معرّفات الطلبات التي حالتها `new` الآن.
 * @param opts.seen الشاشة التي جلبت القائمة تعرضها للتاجر (الطلبات · الكاشير).
 */
export function reconcile(
  prev: AlertState | null,
  newIds: readonly string[],
  opts: { seen?: boolean } = {}
): Reconciled {
  const current = [...new Set(newIds)];
  const live = new Set(current);
  const keep = (ids: readonly string[]) => ids.filter((id) => live.has(id));

  const alertedBefore = prev ? new Set(prev.alerted) : new Set(current);
  const toAlert = prev ? current.filter((id) => !alertedBefore.has(id)) : [];

  const alerted = keep([...alertedBefore, ...toAlert]);
  const seen = opts.seen ? current : keep(prev?.seen ?? []);
  const seenSet = new Set(seen);

  return {
    state: { alerted: [...new Set(alerted)], seen },
    toAlert,
    unseen: current.filter((id) => !seenSet.has(id)).length,
  };
}

/** نصّ الشارة: لا شيء للصفر، و«9+» فوق التسعة — الشارة تُلمح ولا تُقرأ. */
export function badgeText(n: number): string | null {
  if (!Number.isFinite(n) || n <= 0) return null;
  return n > 9 ? "9+" : String(Math.floor(n));
}

const COUNT_PREFIX = /^\(\d+\+?\)\s*/;

/**
 * عنوان التبويب بعدد الطلبات الجديدة — يُقرأ من شريط التبويبات وهو في غيره.
 *
 * يُضاف كبادئة على العنوان القائم لا بدلاً منه: كل صفحة في اللوحة تضبط
 * عنوانها، والبادئة تُنزع حين يصير العدد صفراً فيعود عنوان الصفحة كما كان.
 */
export function titleWithCount(title: string, n: number): string {
  const base = title.replace(COUNT_PREFIX, "");
  const badge = badgeText(n);
  return badge ? `(${badge}) ${base}` : base;
}

/** نصّ إشعار النظام — طلبٌ واحد برقمه، وأكثر بعددها وأرقامها. */
export function notificationText(codes: readonly number[]): { title: string; body: string } {
  if (codes.length === 1) {
    return { title: `طلب جديد — رقم ${codes[0]}`, body: "افتح شاشة الطلبات لتبدأ التحضير." };
  }
  const shown = codes.slice(0, 5).join("، ");
  const more = codes.length > 5 ? " …" : "";
  return {
    title: `${codes.length} طلبات جديدة`,
    body: `الأرقام: ${shown}${more}`,
  };
}

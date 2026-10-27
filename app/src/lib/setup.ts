/**
 * «إعداد منيوك» — أربع خطوات من مطعمٍ أُنشئ لتوّه إلى منيوٍ منشور (§19).
 *
 * ═══ لماذا مسارٌ لا صفحات متفرّقة ═══
 *
 * القطع كلّها كانت موجودة — قراءة المنيو من صورة، وقوائم البداية، ومُنتقي
 * الطوابع حسب النوع، والشعار واللون، والرابط والمشاركة — لكن في خمس صفحات،
 * والتاجر الجديد لا يعرف أيّها قبل أيّها. فيهبط على صفحة الأطباق وحدها ويؤجّل
 * «لبكرة» (١٣ من ١٩ توقّفوا عندها). المسار يرتّبها له بالترتيب الذي يُنتج
 * منيواً: أصناف ⇐ شكل ⇐ هوية ⇐ نشر.
 *
 * ═══ لماذا التقدّم على الجهاز لا في القاعدة ═══
 *
 * لا هجرة (قرار المالك: Supabase لا يُلمس). والضرر محدود: كل خطوة **تكتب
 * نتيجتها في القاعدة فور الضغط** (الأصناف · الطابع · الشعار)، فالمحفوظ محلياً
 * هو «أين توقّفت» وحده — وإن ضاع (جهاز آخر) يُشتقّ من البيانات: من له أصناف لا
 * يُعاد إلى خطوة الأصناف (`resumeProgress`).
 *
 * كلّها دوالّ خالصة: بلا شبكة ولا React ولا تخزين — والقراءة والكتابة في الصفحة.
 */
import type { TrackEvent } from "./track";
import type { ParsedRow } from "./import";
import { iconValue } from "./icons";
import { starterFor } from "./starterMenus";
import { K } from "./storage";

/** مفتاح «أين توقّف» لكل مطعم — جهازٌ مشترك بين مطعمين لا يخلط تقدّمهما. */
export function setupKey(restaurantId: string): string {
  return `${K.SETUP}_${restaurantId}`;
}

/** مفتاح مسوّدة الأصناف قبل حفظها. */
export function draftKey(restaurantId: string): string {
  return `${K.SETUP_ROWS}_${restaurantId}`;
}

/* ── الخطوات ──────────────────────────────────────────────────────── */

export type SetupStepId = "dishes" | "look" | "brand" | "publish";

export interface SetupStep {
  id: SetupStepId;
  /** يظهر في شريط التقدّم — قصيرٌ يسع ربع ٣٢٠px. */
  label: string;
  title: string;
  hint: string;
  /** اختيارية: تخطّيها لا يُنقص المنيو شيئاً يراه الزبون ناقصاً. */
  optional: boolean;
}

export const SETUP_STEPS: readonly SetupStep[] = [
  {
    id: "dishes",
    label: "أصنافك",
    title: "أصنافك",
    hint: "صوّر منيوك المطبوع، أو ابدأ بقائمة جاهزة لنوعك، أو أضِف بيدك — وراجعها قبل الحفظ.",
    optional: false,
  },
  {
    id: "look",
    label: "الطابع",
    title: "شكل منيوك",
    hint: "رتّبنا الطوابع حسب نوع نشاطك. اختر واحداً وعاينه — لا يتغيّر شيء حتى تضغط «طبّق».",
    optional: false,
  },
  {
    id: "brand",
    label: "الشعار",
    title: "شعارك ولونك",
    hint: "يظهر أعلى منيوك. تقدر تتخطّاه وتضيفه لاحقاً من «التصميم».",
    optional: true,
  },
  {
    id: "publish",
    label: "النشر",
    title: "انشر وشارك",
    hint: "هذا رابط منيوك — عاينه كما يراه زبونك، ثم أرسله.",
    optional: false,
  },
];

const IDS: readonly SetupStepId[] = SETUP_STEPS.map((s) => s.id);

export function isStepId(v: unknown): v is SetupStepId {
  return typeof v === "string" && (IDS as readonly string[]).includes(v);
}

export function stepIndex(id: SetupStepId): number {
  return IDS.indexOf(id);
}

/** الخطوة التالية، أو `null` بعد الأخيرة. */
export function nextStepId(id: SetupStepId): SetupStepId | null {
  return IDS[stepIndex(id) + 1] ?? null;
}

/**
 * حدثٌ لكل خطوة تُنجَز — أسماءٌ مجرّدة بلا معرّف ولا اسم مطعم (`lib/track.ts`).
 * أسماءٌ مستقلّة لا حدثٌ بخاصّية: المزوّدان يعدّان الاسم وحده بلا إعداد، فيقرأ
 * المالك القمع خطوةً خطوة مباشرةً — أين يسقط التاجر الجديد.
 */
export const STEP_EVENT: Readonly<Record<SetupStepId, TrackEvent>> = {
  dishes: "setup_dishes_done",
  look: "setup_look_done",
  brand: "setup_brand_done",
  publish: "setup_published",
};

/* ── التقدّم ──────────────────────────────────────────────────────── */

export interface SetupProgress {
  /** نسخة الشكل — تغييره لاحقاً لا يقرأ القديم خطأً. */
  v: 1;
  /** حيث توقّف التاجر — منها يُستأنف. */
  step: SetupStepId;
  done: SetupStepId[];
  skipped: SetupStepId[];
  /** أنهى المسار أو أخفاه — فلا تظهر بطاقة «أكمل الإعداد» بعدها. */
  finished: boolean;
}

/** ما تقوله البيانات الحيّة — `null` = لم تُحسم بعد (القاعدة ج). */
export interface SetupFacts {
  dishCount: number | null;
}

export function freshProgress(): SetupProgress {
  return { v: 1, step: "dishes", done: [], skipped: [], finished: false };
}

/**
 * يقرأ المخزَّن بتسامح: شكلٌ غريب (يدٌ عبثت بالتخزين، أو نسخةٌ أقدم) ⇒ `null`
 * فيبدأ من البيانات — لا انهيار، ولا خطوةٌ لا وجود لها.
 */
export function parseProgress(raw: unknown): SetupProgress | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.v !== 1 || !isStepId(o.step)) return null;
  const list = (x: unknown): SetupStepId[] =>
    Array.isArray(x) ? [...new Set(x.filter(isStepId))] : [];
  return {
    v: 1,
    step: o.step,
    done: list(o.done),
    skipped: list(o.skipped),
    finished: o.finished === true,
  };
}

const without = (xs: SetupStepId[], id: SetupStepId) => xs.filter((x) => x !== id);
const withId = (xs: SetupStepId[], id: SetupStepId) => (xs.includes(id) ? xs : [...xs, id]);

/** أُنجزت أو تُخطّيت — لم يبقَ فيها ما ينتظر. */
export function isResolved(p: SetupProgress, id: SetupStepId): boolean {
  return p.done.includes(id) || p.skipped.includes(id);
}

/**
 * من أين يُستأنف المسار.
 *
 * - **بلا مخزَّن** (أوّل مرّة، أو جهاز آخر): من له أصناف تُحسب له خطوتها
 *   ويبدأ من الطابع — لا نطلب منه منيواً بناه من صفحة الأطباق.
 * - **مع المخزَّن**: حيث توقّف حرفياً — إلا إن كانت خطوة الأصناف وقد صار له
 *   أصناف من غير المسار، فتُحسب وينتقل لما بعدها.
 * - `dishCount === null` (لم تُحسم): لا يُشتقّ شيء من غيابها.
 */
export function resumeProgress(stored: SetupProgress | null, facts: SetupFacts): SetupProgress {
  const p = stored ?? freshProgress();
  const hasDishes = (facts.dishCount ?? 0) > 0;
  if (!hasDishes || p.done.includes("dishes")) return p;
  const done = withId(p.done, "dishes");
  const skipped = without(p.skipped, "dishes");
  return { ...p, done, skipped, step: p.step === "dishes" ? "look" : p.step };
}

/** أنجز خطوة وانتقل لما بعدها — والأخيرة تُنهي المسار. */
export function completeStep(p: SetupProgress, id: SetupStepId): SetupProgress {
  const next = nextStepId(id);
  return {
    ...p,
    done: withId(p.done, id),
    skipped: without(p.skipped, id),
    step: next ?? id,
    finished: p.finished || next === null,
  };
}

/** تخطٍّ: لا تُحسب منجزة، وتبقى قابلةً للعودة إليها من الشريط. */
export function skipStep(p: SetupProgress, id: SetupStepId): SetupProgress {
  const next = nextStepId(id);
  return {
    ...p,
    // من أنجزها من قبل ثم مرّ عليها لا يخسر إنجازه.
    skipped: p.done.includes(id) ? p.skipped : withId(p.skipped, id),
    step: next ?? id,
    finished: p.finished || next === null,
  };
}

export function goToStep(p: SetupProgress, id: SetupStepId): SetupProgress {
  return { ...p, step: id };
}

/** «أكمل لاحقاً» لا تُنهي، أمّا «أخفِ» فتُنهي: لا بطاقة استئناف بعدها. */
export function dismissSetup(p: SetupProgress): SetupProgress {
  return { ...p, finished: true };
}

/** نسبة الشريط — ما حُسم من الأربع (المنجز والمتخطّى معاً). */
export function progressPercent(p: SetupProgress): number {
  if (p.finished) return 100;
  const n = IDS.filter((id) => isResolved(p, id)).length;
  return Math.round((n / IDS.length) * 100);
}

/** هل تظهر بطاقة «أكمل إعداد منيوك» في الرئيسية؟ */
export function setupPending(p: SetupProgress | null): boolean {
  return p !== null && !p.finished;
}

/* ── جدول المراجعة ────────────────────────────────────────────────── */

/** صفٌّ في جدول المراجعة — من الصورة أو القائمة الجاهزة أو يد التاجر. */
export type ReviewRow = ParsedRow & { include: boolean };

export type DraftSource = "scan" | "starter" | "manual";

/**
 * المسوّدة قبل الحفظ — تُحفظ على الجهاز مع كل تعديل.
 *
 * ⚠️ **ولهذا سببٌ مالي لا راحة فقط**: قراءة الصورة نداءٌ مدفوع (`menu-scan`).
 * لو غادر التاجر بعد القراءة وقبل الحفظ ثم عاد، لصوّر ثانيةً ودفعنا ثانيةً
 * ثمن الصورة نفسها. فالنتيجة تبقى حتى يحفظها أو يبدأ من جديد بنفسه.
 */
export interface SetupDraft {
  v: 1;
  source: DraftSource;
  /** قالب القائمة الجاهزة — لمصدر `starter` وحده. */
  template: string | null;
  rows: ReviewRow[];
}

export function parseDraft(raw: unknown): SetupDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.v !== 1 || !["scan", "starter", "manual"].includes(o.source as string)) return null;
  if (!Array.isArray(o.rows)) return null;
  const rows: ReviewRow[] = [];
  for (const r of o.rows as Record<string, unknown>[]) {
    if (!r || typeof r !== "object" || typeof r.name !== "string") continue;
    const price = typeof r.price === "number" && Number.isFinite(r.price) ? r.price : null;
    rows.push({
      name: r.name,
      price,
      category: typeof r.category === "string" && r.category.trim() ? r.category : null,
      description: typeof r.description === "string" ? r.description : null,
      emoji: typeof r.emoji === "string" ? r.emoji : "",
      line: typeof r.line === "number" ? r.line : rows.length + 1,
      include: r.include !== false,
    });
  }
  return {
    v: 1,
    source: o.source as DraftSource,
    template: typeof o.template === "string" ? o.template : null,
    rows,
  };
}

export function toReviewRows(rows: ParsedRow[]): ReviewRow[] {
  return rows.map((r) => ({ ...r, include: true }));
}

/** القائمة الجاهزة صفوفَ مراجعة — بنفس تحويل `applyStarter` في صفحة الأطباق. */
export function starterRows(template: string | null | undefined): ReviewRow[] {
  return toReviewRows(
    starterFor(template).map((d, i) => ({
      name: d.name,
      price: d.price,
      category: d.category,
      description: null,
      emoji: iconValue(d.icon),
      line: i + 1,
    }))
  );
}

/** صفٌّ فارغ لـ«أضِف بيدك». */
export function blankRow(line: number): ReviewRow {
  return { name: "", price: null, category: null, description: null, emoji: "", line, include: true };
}

export interface ReviewCheck {
  /** ما سيُحفظ: المختار وله اسم. */
  chosen: ReviewRow[];
  missingPrice: number;
  /** رسالة المنع، أو `null` إن صلح الحفظ. */
  error: string | null;
}

/**
 * ما يُحفظ وما يمنعه — بقواعد `DishImport` نفسها: بلا سعر لا يُحفظ (كان السعر
 * يسقط إلى صفر فيُنشر الطبق مجاناً)، والسعر السالب مرفوض.
 *
 * الصفّ بلا اسم **يُتجاهَل لا يمنع**: «أضِف بيدك» يبدأ بثلاثة صفوف فارغة، ومن
 * ملأ اثنين لا يُطلب منه حذف الثالث.
 */
export function checkReview(rows: ReviewRow[]): ReviewCheck {
  const chosen = rows.filter((r) => r.include && r.name.trim());
  const missingPrice = chosen.filter((r) => r.price === null).length;
  const negative = chosen.some((r) => r.price !== null && r.price < 0);
  const error = !chosen.length
    ? "لم تختر أي صنف — اكتب اسماً وسعراً، أو اختر من القائمة."
    : missingPrice
      ? `${missingPrice} صنفاً بلا سعر — اكتب سعره أو استبعده.`
      : negative
        ? "السعر لا يمكن أن يكون سالباً."
        : null;
  return { chosen, missingPrice, error };
}

/** دفعات الحفظ — كي يُحذف المحفوظ من المسوّدة دفعةً دفعة فلا يتكرّر عند الإعادة. */
export function chunk<T>(xs: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += size) out.push(xs.slice(i, i + size));
  return out;
}

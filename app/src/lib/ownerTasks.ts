/**
 * «مهامي» — ما لا يستطيع أحدٌ غير المالك فعله، بلغةٍ واحدة وخطواتٍ قصيرة.
 *
 * كانت هذه البنود مبعثرة بين `LAUNCH.md` (أكثر من ٧٠٠ سطر) و`company/owner-queue.md`
 * — ملفّات في المستودع لا يفتحها المالك. صارت هنا قائمةً واحدة في لوحته، وما
 * أنجزه منها يُحفظ في `site_settings.founder_todo` فيراه على أيّ جهاز.
 *
 * **المعرّف ثابت**: علامة «تمّ» محفوظة به — تغييره يُنسي البند أنه أُنجز.
 * والنصّ يُعدَّل بحرّية.
 */

export type TaskGroup = "launch" | "supabase" | "outside";

export interface OwnerTask {
  id: string;
  group: TaskGroup;
  title: string;
  /** لماذا — سطرٌ واحد. */
  why: string;
  steps: string[];
  /** رابطٌ يفتح المكان الصحيح مباشرة، إن وُجد. */
  link?: { href: string; label: string };
}

export const TASK_GROUPS: { id: TaskGroup; label: string; hint: string }[] = [
  { id: "launch", label: "قبل أوّل ريال", hint: "بدونها لا يصحّ أن تأخذ اشتراكاً مدفوعاً" },
  { id: "supabase", label: "في Supabase", hint: "إعدادات في لوحة قاعدة البيانات" },
  { id: "outside", label: "خارج الموقع", hint: "حسابات وخدمات خارجية" },
];

export const OWNER_TASKS: OwnerTask[] = [
  {
    id: "legal-identity",
    group: "launch",
    title: "سجل تجاري أو وثيقة عمل حر",
    why: "الشروط والخصوصية تحتاج اسم المنشأة ورقمها، والدفع الإلكتروني يطلبها.",
    steps: [
      "استخرج وثيقة العمل الحر (منصّة العمل الحر) أو سجلاً تجارياً.",
      "سجّل متجراً إلكترونياً في منصّة الأعمال.",
      "أرسل لي الاسم والرقم وأضعها في صفحتَي الشروط والخصوصية.",
    ],
  },
  {
    id: "trademark",
    group: "launch",
    title: "تسجيل العلامة «كلاود منيو»",
    why: "الاسم غير مسجّل اليوم — أيّ أحد يقدر يسجّله قبلك.",
    steps: ["قدّم طلب تسجيل علامة لدى الهيئة السعودية للملكية الفكرية (SAIP)."],
    link: { href: "https://www.saip.gov.sa", label: "موقع الهيئة" },
  },
  {
    id: "real-payment",
    group: "launch",
    title: "جرّب دفعة اشتراك حقيقية",
    why: "نتأكّد أن الدفع يمشي من البداية للنهاية قبل أول تاجر.",
    steps: [
      "سجّل حساب تاجر تجريبي وادفع اشتراكاً حقيقياً بمبلغ صغير.",
      "تأكّد أن الاشتراك تفعّل في «التجّار» وأن الدفعة ظهرت في «الفلوس».",
    ],
  },
  {
    id: "domain",
    group: "launch",
    title: "اختر دومين الموقع",
    why: "أكواد QR المطبوعة تبقى على رابطها للأبد — والطباعة مقفلة حتى الدومين.",
    steps: [
      "اشترِ الدومين (مثلاً من Namecheap أو SaudiNIC لـ .sa).",
      "أرسل لي اسمه وأربطه بالموقع وأفتح الطباعة.",
    ],
  },
  {
    id: "functions-deploy",
    group: "supabase",
    title: "نشر دوالّ الطلبات الثلاث",
    why: "سلّة الزبون والدفع داخل المنيو ما تشتغل قبلها.",
    steps: [
      "في Supabase ⇐ Edge Functions انشر بالترتيب: paylink-order-create ثم order-verify ثم api.",
      "أو قل لي «انشرها» وأجهّز نشراً تلقائياً من GitHub.",
    ],
    link: { href: "https://supabase.com/dashboard/projects", label: "لوحة Supabase" },
  },
  {
    id: "auth-hardening",
    group: "supabase",
    title: "تأمين الدخول",
    why: "حماية حسابات التجّار وحسابك.",
    steps: [
      "Authentication ⇐ Providers ⇐ Email: فعّل «Confirm email».",
      "Authentication ⇐ Policies: فعّل «Leaked password protection».",
      "فعّل التحقّق الثنائي (MFA) لحسابك.",
    ],
  },
  {
    id: "schema-snapshot",
    group: "supabase",
    title: "لقطة احتياطية لهيكل القاعدة",
    why: "عشرون دالّة حيّة بلا نسخة في المستودع — لو ضاع المشروع تضيع معه.",
    steps: [
      "على جهازك: supabase db dump --schema public -f baseline.sql",
      "أرسل الملف لي وأضيفه للمستودع.",
    ],
  },
  {
    id: "hse-leftovers",
    group: "supabase",
    title: "قرار بقايا تطبيق السلامة القديم",
    why: "مخزن صور وسياسات قديمة داخل مشروع كلاود منيو — لا علاقة لها بالمنتج.",
    steps: ["قل لي: امسحها · صدّر الصور ثم امسح · أبقِها."],
  },
  {
    id: "uptime",
    group: "outside",
    title: "مراقب خارجي للموقع",
    why: "يرسل لك تنبيهاً على جوالك لو طاح الموقع.",
    steps: [
      "uptimerobot.com ⇐ حساب مجاني ⇐ Add New Monitor ⇐ HTTP(s).",
      "الرابط: https://neon-frangollo-2c189e.netlify.app/demo — كل ٥ دقائق.",
    ],
    link: { href: "https://uptimerobot.com", label: "UptimeRobot" },
  },
  {
    id: "analytics",
    group: "outside",
    title: "أداة الزيارات",
    why: "تعرف كم زائر دخل الموقع ومن وين — بدون ملفّات تعريف.",
    steps: [
      "أنشئ حساباً في plausible.io وأضف موقعك.",
      "قل لي «فعّل التحليلات» وأضبطها.",
    ],
    link: { href: "https://plausible.io", label: "Plausible" },
  },
  {
    id: "protect-main",
    group: "outside",
    title: "حماية الفرع الرئيسي في GitHub",
    why: "ما يُدمج شيء والفحوص حمراء.",
    steps: [
      "GitHub ⇐ المستودع ⇐ Settings ⇐ Rules ⇐ New branch ruleset.",
      "الهدف main ⇐ فعّل «Require status checks to pass» واختر check ⇐ Save.",
    ],
  },
];

/** حالة الإنجاز: معرّف البند ⇐ تاريخ «تمّ». */
export type TodoState = Record<string, string>;

/** يقرأ القيمة المخزّنة بتسامح — أيّ شكلٍ غير متوقّع = لا شيء منجز. */
export function parseTodoState(raw: unknown): TodoState {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: TodoState = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "string" && OWNER_TASKS.some((t) => t.id === k)) out[k] = v;
  }
  return out;
}

export function toggleTask(state: TodoState, id: string, now = new Date()): TodoState {
  const next = { ...state };
  if (next[id]) delete next[id];
  else next[id] = now.toISOString();
  return next;
}

export function remainingCount(state: TodoState): number {
  return OWNER_TASKS.filter((t) => !state[t.id]).length;
}

export const TODO_SETTING_KEY = "founder_todo";

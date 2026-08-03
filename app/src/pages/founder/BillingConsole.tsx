/**
 * وحدة «الاستلام» — كل ما يلزم المؤسّس ليقبض فعلاً.
 *
 * ═══ ثلاثة أقسام، وترتيبها مقصود ═══
 *
 * 1. **حالة البوّابة وقائمة التجهيز** — قبل أي رقم: إن لم تكن البوّابة موصولة
 *    فكل ما تحته صفر، وعرض إيرادٍ فوق بوّابة مقطوعة يُطمئن كذباً.
 * 2. **التحصيل** — من ينتهي اشتراكه ومتى، ومن انتهى ولم يجدّد. هذا الفعل
 *    اليومي: المال لا يأتي من لوحة، يأتي من رسالة تُرسَل لتاجر في وقتها.
 * 3. **مفاتيح التحكّم** — إيقاف التحصيل، وقفل نشر المنيو.
 *
 * ═══ ⚠️ ما لا تعرضه هذه الشاشة ولن تعرضه ═══
 *
 * • **مفتاح PayLink السرّي ولا أي جزء منه** — يعيش في أسرار دوال Supabase
 *   وحدها ولا يدخل متصفّحاً. المعروض هو آخر ثلاثة محارف من **المعرّف** لا
 *   السرّ: تكفي لتعرف أي حساب موصول، ولا تكفي لانتحاله.
 * • **بيانات زبائن التجّار** — لا جوّال ولا اسم ولا بطاقة ولاء (§11). الصفوف
 *   عن التجّار وحدهم.
 * • **رصيدك البنكي** — الأرقام هنا «مسجَّل عندنا» لا «مستلَم في حسابك».
 *   بينهما عمولة البوّابة ودورة التسوية، وادّعاء المساواة كذب.
 */
import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, ErrorNote, Skeleton, Switch, useToast } from "@/components/ui";
import {
  getBillingRows,
  getGatewayStatus,
  readBillingFlags,
  setBillingFlags,
  type BillingFlags,
  type BillingRow,
  type GatewayStatus,
  type SiteSetting,
} from "@/lib/founder";
import { CURRENCY, PLAN } from "@/lib/plans";
import { SITE_URL, SUPABASE_URL } from "@/lib/config";
import { formatDate, formatPrice, whatsappUrl } from "@/lib/utils";
import { Icon, type IconName } from "@/lib/icons";

/* ── نسخ بزرّ ──────────────────────────────────────────────────────── */

function CopyRow({ label, value }: { label: string; value: string }) {
  const toast = useToast();
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-panel2 px-3 py-2">
      <span className="text-xs font-bold text-dim">{label}</span>
      <code dir="ltr" className="min-w-0 flex-1 truncate text-[11px] text-faint">
        {value || "—"}
      </code>
      <Button
        variant="ghost"
        className="shrink-0 px-2 py-1 text-xs"
        disabled={!value}
        onClick={() => {
          navigator.clipboard?.writeText(value).then(
            () => toast("نُسخ ✓"),
            () => toast("تعذّر النسخ.", "err")
          );
        }}
      >
        <Icon name="copy" size={14} /> نسخ
      </Button>
    </div>
  );
}

/* ── قائمة التجهيز ─────────────────────────────────────────────────── */

type Step = { n: number; title: string; detail: string; state: "done" | "todo" | "manual" };

/**
 * ⚠️ **ما لا نستطيع التحقّق منه يُعرض «يدوي» لا «تمّ».**
 * ادّعاء إتمام خطوة لم نرَها أسوأ من عدم عرضها: يجعل المؤسّس يظنّ أنه جاهز
 * ثم تسقط أول دفعة حقيقية.
 */
function buildSteps(g: GatewayStatus | null, flags: BillingFlags, paidCount: number): Step[] {
  return [
    {
      n: 1,
      title: "افتح حساب تاجر في PayLink",
      detail:
        "جهّز قبل التقديم: سجل تجاري أو وثيقة عمل حرّ · آيبان بنكي · هوية. " +
        "المتطلّبات النهائية يحدّدها PayLink — راجع صفحتهم.",
      state: "manual",
    },
    {
      n: 2,
      title: "انسخ apiId و secretKey من لوحة PayLink",
      detail: "لوحة PayLink ← الإعدادات ← API.",
      state: "manual",
    },
    {
      n: 3,
      title: "ألصقهما في أسرار Supabase",
      detail:
        "Supabase ← Edge Functions ← Secrets، بالاسمين PAYLINK_API_ID و PAYLINK_SECRET_KEY. " +
        "لا تلصقهما هنا ولا في أي صفحة — لا حقل يقبلهما عمداً.",
      state: g?.credentials_set ? "done" : "todo",
    },
    {
      n: 4,
      title: "تحقّق أن المفاتيح تعمل",
      detail: g?.connected
        ? `الاتصال ناجح (${g.env === "production" ? "إنتاج" : "تجريبي"}).`
        : g?.error ?? "لم يُفحص بعد.",
      state: g?.connected ? "done" : "todo",
    },
    {
      n: 5,
      title: "ألصق رابط الويبهوك في لوحة PayLink",
      detail: "هذا ما يُفعّل الاشتراك بعد الدفع — بدونه يدفع التاجر ولا يُفعَّل شيء.",
      state: "manual",
    },
    {
      n: 6,
      title: "تأكّد أن روابط العودة مسموحة",
      detail: "رابط النجاح ورابط الإلغاء أدناه.",
      state: "manual",
    },
    {
      n: 7,
      title: "حوّل PAYLINK_ENV إلى production",
      detail:
        g?.env === "production"
          ? "البوّابة على الإنتاج — المبالغ حقيقية."
          : "ما زالت تجريبية: لا تُخصم مبالغ حقيقية.",
      state: g?.env === "production" ? "done" : "todo",
    },
    {
      n: 8,
      title: "جرّب دفعة حقيقية بمبلغ صغير",
      detail:
        paidCount > 0
          ? `وصلتك ${paidCount} دفعة مسجَّلة.`
          : "لم تصل أي دفعة بعد — جرّب من حساب تاجر تجريبي قبل أن تدعو أحداً.",
      state: paidCount > 0 ? "done" : "todo",
    },
    {
      n: 9,
      title: "افتح قفل نشر المنيو",
      detail:
        "آخر خطوة عمداً: فتحه يوقف عرض منيو كل من لا اشتراك له. لا تفتحه قبل " +
        "أن تتأكّد أن الدفع يعمل من طرفٍ إلى طرف.",
      state: flags.enforce_publishing ? "done" : "todo",
    },
  ];
}

const STEP_ICON: Record<Step["state"], { icon: IconName; cls: string }> = {
  done: { icon: "check", cls: "text-good" },
  todo: { icon: "warn", cls: "text-gold" },
  manual: { icon: "info", cls: "text-faint" },
};

/* ── الوحدة ────────────────────────────────────────────────────────── */

export function BillingConsole({
  settings,
  onSettingsChange,
}: {
  settings: SiteSetting[] | null;
  onSettingsChange: () => void;
}) {
  const toast = useToast();
  const [gateway, setGateway] = useState<GatewayStatus | null>(null);
  const [checking, setChecking] = useState(true);
  const [rows, setRows] = useState<BillingRow[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const flags = readBillingFlags(settings);

  /** الروابط مشتقّة محلّياً — لا تعتمد على نجاح فحص البوّابة. */
  const links = {
    webhook: `${SUPABASE_URL}/functions/v1/paylink-webhook`,
    callback: `${SITE_URL}/dashboard/billing?payment=done`,
    cancel: `${SITE_URL}/dashboard/billing?payment=cancelled`,
  };

  const check = useCallback(async () => {
    setChecking(true);
    try {
      setGateway(await getGatewayStatus());
    } catch {
      setGateway(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    check();
    getBillingRows().then(setRows).catch(() => setRows([]));
  }, [check]);

  async function toggle(key: keyof BillingFlags, value: boolean) {
    setSaving(true);
    setError("");
    try {
      await setBillingFlags({ ...flags, [key]: value });
      onSettingsChange();
      toast(value ? "فُعِّل ✓" : "أُوقف ✓");
    } catch {
      setError("تعذّر الحفظ. حاول مجدداً.");
    } finally {
      setSaving(false);
    }
  }

  /* ── اشتقاقات التحصيل ── */
  const paid = rows?.filter((r) => r.paid_total > 0) ?? [];
  const soon = rows?.filter((r) => (r.days_left ?? 999) >= 0 && (r.days_left ?? 999) <= 7) ?? [];
  const later =
    rows?.filter((r) => (r.days_left ?? 999) > 7 && (r.days_left ?? 999) <= 30) ?? [];
  const lapsed = rows?.filter((r) => r.days_left != null && r.days_left < 0) ?? [];

  /** الاشتراكات المدفوعة النشطة مُطبَّعة شهرياً — التجربة لا تُحسب إيراداً. */
  const mrr = (rows ?? [])
    .filter((r) => !r.is_trial && (r.days_left ?? -1) >= 0)
    .length * PLAN.monthly;
  const dueNext30 = [...soon, ...later].filter((r) => !r.is_trial).length * PLAN.monthly;
  const collected = (rows ?? []).reduce((s, r) => s + Number(r.paid_total ?? 0), 0);

  const steps = buildSteps(gateway, flags, paid.length);
  const doneCount = steps.filter((s) => s.state === "done").length;

  return (
    <>
      {/* ══ ١. حالة البوّابة ══ */}
      <section className="mt-8">
        <h2 className="mb-3 inline-flex items-center gap-2 font-display text-lg font-extrabold text-ink">
          <Icon name="plug" size={17} className="shrink-0 text-gold" /> بوّابة الاستلام
        </h2>

        <Card
          className={
            gateway?.connected ? "border-good/40 bg-good/[.04]" : "border-gold/40 bg-gold/[.04]"
          }
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-display text-lg font-black text-ink">
                {checking
                  ? "جارٍ الفحص…"
                  : gateway?.connected
                    ? "PayLink متّصلة"
                    : "PayLink غير متّصلة"}
              </p>
              <p className="mt-0.5 text-xs text-dim">
                {checking
                  ? "نطلب رمز وصول من البوّابة…"
                  : gateway?.connected
                    ? `الحساب ‹…${gateway.api_id_tail}› · فُحص ${formatDate(gateway.checked_at)}`
                    : (gateway?.error ?? "تعذّر الوصول إلى دالة الفحص.")}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {gateway && (
                <Badge variant={gateway.env === "production" ? "green" : "neutral"}>
                  {gateway.env === "production" ? "إنتاج" : "تجريبي"}
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={check} disabled={checking}>
                <Icon name="clock" size={14} /> أعِد الفحص
              </Button>
            </div>
          </div>

          {/* ⚠️ تحذير صريح: تجريبي يعني أن لا مال يصل. */}
          {gateway && gateway.env !== "production" && (
            <p className="mt-3 rounded-xl border border-gold/30 bg-gold/[.06] px-3 py-2 text-xs font-bold text-ink">
              وضع تجريبي — لا تُخصم مبالغ حقيقية ولا يصلك شيء. حوّل
              <code dir="ltr" className="mx-1 text-faint">PAYLINK_ENV=production</code>
              في أسرار الدوال عند الجاهزية.
            </p>
          )}
        </Card>

        {/*
          الروابط الثلاثة — تُولَّد ولا تُكتب بيدٍ.

          ⚠️ **تُعرض حتى لو كانت البوّابة غير موصولة.** أول محاولة ربطتها
          بوجود `gateway`، فكانت تختفي بالضبط في اللحظة التي تحتاجها فيها:
          لا تستطيع توصيل البوّابة قبل أن تلصق رابط الويبهوك عندهم. فالقيم
          تُشتقّ محلّياً وتُستبدل بما تعيده الدالة إن وصلت.
        */}
        <div className="mt-3 flex flex-col gap-2">
          <CopyRow label="الويبهوك" value={gateway?.webhook_url ?? links.webhook} />
          <CopyRow label="رابط النجاح" value={gateway?.callback_url ?? links.callback} />
          <CopyRow label="رابط الإلغاء" value={gateway?.cancel_url ?? links.cancel} />
        </div>

        {/* قائمة التجهيز */}
        <Card className="mt-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="font-display font-extrabold text-ink">خطوات التشغيل</p>
            <Badge variant={doneCount >= 5 ? "green" : "neutral"}>
              {doneCount} من {steps.length}
            </Badge>
          </div>
          <ol className="flex flex-col gap-2.5">
            {steps.map((s) => {
              const look = STEP_ICON[s.state];
              return (
                <li key={s.n} className="flex items-start gap-2.5">
                  <Icon name={look.icon} size={16} className={`mt-0.5 shrink-0 ${look.cls}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink">
                      {s.n}. {s.title}
                      {s.state === "manual" && (
                        <span className="ms-2 text-[11px] font-normal text-faint">
                          (خارج المنصّة — لا نستطيع التحقّق)
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-dim">{s.detail}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
      </section>

      {/* ══ ٢. الأرقام ══ */}
      <section className="mt-8">
        <h2 className="mb-3 inline-flex items-center gap-2 font-display text-lg font-extrabold text-ink">
          <Icon name="money" size={17} className="shrink-0 text-gold" /> إيرادك
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { l: "متكرّر شهرياً (MRR)", v: mrr, hint: "اشتراكات مدفوعة نشطة" },
            { l: "مستحقّ خلال ٣٠ يوماً", v: dueNext30, hint: "ما يُجدَّد إن جدّدوا" },
            { l: "إجمالي المحصَّل", v: collected, hint: "كل ما سُجِّل عندنا" },
          ].map((c) => (
            <Card key={c.l}>
              <p className="text-xs text-dim">{c.l}</p>
              <p className="mt-1 font-display text-2xl font-black text-gold" dir="ltr">
                {formatPrice(c.v)} <span className="text-sm font-normal text-dim">{CURRENCY}</span>
              </p>
              <p className="mt-0.5 text-[11px] text-faint">{c.hint}</p>
            </Card>
          ))}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-faint">
          ⚠️ هذه أرقام <b className="text-dim">مسجَّلة عندنا</b> لا رصيدك البنكي: عمولة
          البوّابة ودورة التسوية عند PayLink، فراجع لوحتهم للمبالغ المُحوَّلة فعلاً.
        </p>
      </section>

      {/* ══ ٣. التحصيل ══ */}
      <section className="mt-8">
        <h2 className="mb-3 inline-flex items-center gap-2 font-display text-lg font-extrabold text-ink">
          <Icon name="bell" size={17} className="shrink-0 text-gold" /> التحصيل — من تراسله اليوم
        </h2>
        {rows === null ? (
          <div className="flex flex-col gap-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Bucket
              title="انتهى ولم يجدّد"
              tone="red"
              rows={lapsed}
              empty="لا أحد — ممتاز."
            />
            <Bucket
              title="ينتهي خلال ٧ أيام"
              tone="gold"
              rows={soon}
              empty="لا أحد قريب من الانتهاء."
            />
            <Bucket
              title="ينتهي خلال ٣٠ يوماً"
              tone="neutral"
              rows={later}
              empty="لا أحد."
            />
          </div>
        )}
      </section>

      {/* ══ ٤. مفاتيح التحكّم ══ */}
      <section className="mt-8">
        <h2 className="mb-3 inline-flex items-center gap-2 font-display text-lg font-extrabold text-ink">
          <Icon name="sliders" size={17} className="shrink-0 text-gold" /> مفاتيح التحكّم
        </h2>
        {error && (
          <div className="mb-3">
            <ErrorNote>{error}</ErrorNote>
          </div>
        )}
        <Card className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-ink">قبول اشتراكات جديدة</p>
              <p className="mt-0.5 text-xs leading-relaxed text-dim">
                إيقافه يمنع إنشاء أي فاتورة جديدة <b className="text-ink">فوراً وبلا نشر</b> —
                لو اكتشفت خللاً في التسعير أو البوّابة. الاشتراكات القائمة لا تتأثّر.
              </p>
            </div>
            <Switch
              checked={flags.enabled}
              disabled={saving}
              onChange={(v) => toggle("enabled", v)}
              label="قبول اشتراكات جديدة"
            />
          </div>

          <div className="flex flex-wrap items-start justify-between gap-3 border-t border-line pt-4">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-ink">
                قفل نشر المنيو لغير المشتركين
                {!flags.enforce_publishing && (
                  <Badge variant="neutral" className="ms-2">مطفأ</Badge>
                )}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-dim">
                فتحه يوقف عرض منيو كل تاجر لا اشتراك له —{" "}
                <b className="text-ink">
                  الآن ذلك {(rows ?? []).filter((r) => (r.days_left ?? -1) < 0).length} تاجراً
                </b>
                ، وسيصير {(rows ?? []).filter((r) => r.is_trial).length} حين تنتهي التجارب.
                لا تفتحه قبل أن تتأكّد أن أول دفعة وصلت فعلاً.
              </p>
            </div>
            <Switch
              checked={flags.enforce_publishing}
              disabled={saving}
              onChange={(v) => toggle("enforce_publishing", v)}
              label="قفل نشر المنيو"
            />
          </div>
        </Card>
      </section>
    </>
  );
}

/* ── مجموعة تحصيل ──────────────────────────────────────────────────── */

function Bucket({
  title,
  tone,
  rows,
  empty,
}: {
  title: string;
  tone: "red" | "gold" | "neutral";
  rows: BillingRow[];
  empty: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <p className="font-display font-extrabold text-ink">{title}</p>
        <Badge variant={rows.length ? (tone === "red" ? "red" : tone === "gold" ? "gold" : "neutral") : "neutral"}>
          {rows.length}
        </Badge>
      </div>
      {rows.length === 0 ? (
        <Card className="text-center text-sm text-faint">{empty}</Card>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((r) => (
            <Card key={r.restaurant_id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-bold text-ink">
                  {r.name ?? "بلا اسم"}
                  {r.is_trial && (
                    <Badge variant="neutral" className="ms-2">تجربة</Badge>
                  )}
                </p>
                <p className="text-xs text-faint" dir="ltr">{r.email ?? "—"}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-dim">
                  {r.end_date ? (
                    <>
                      {r.days_left != null && r.days_left < 0
                        ? `انتهى منذ ${Math.abs(r.days_left)} يوماً`
                        : `باقٍ ${r.days_left} يوماً`}{" "}
                      · {formatDate(r.end_date)}
                    </>
                  ) : (
                    "بلا اشتراك"
                  )}
                </span>
                <span className="text-xs text-faint">
                  دفع {formatPrice(Number(r.paid_total ?? 0))} {CURRENCY}
                </span>
                {r.phone && (
                  <a
                    href={whatsappUrl(
                      r.phone,
                      `مرحباً${r.name ? ` ${r.name}` : ""} 👋\nاشتراكك في كلاود منيو ${
                        (r.days_left ?? 0) < 0 ? "انتهى" : "قارب على الانتهاء"
                      }. جدّده من لوحتك ليبقى منيوك ظاهراً لزبائنك.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line-gold px-2.5 py-1 text-xs font-bold text-ink hover:bg-gold/10"
                  >
                    <Icon name="share" size={13} /> ذكّره
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

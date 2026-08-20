/**
 * إعدادات المطعم.
 *
 * ═══ حفظ لكل قسم لا زرّ واحد في القاع ═══
 *
 * كانت الصفحة ثلاثين حقلاً في ستّة أقسام + أربع بطاقات مستقلّة، وزرّ حفظ واحد
 * في القاع يحفظ الستّة بينما البطاقات الأربع تحفظ نفسها. أي **نموذجان ذهنيان
 * في صفحة واحدة**: التاجر لا يعرف هل ضغط الزر يحفظ ما عدّله أم لا. الآن لكل
 * قسم زرّه وحالته، فالنموذج واحد ويسري على الصفحة كلها.
 *
 * ⚠️ القاعدة (أ) قائمة كما هي: الحقول تمرّ بـ`RestaurantSettingsPayload`
 * (عبر `Partial` — انظر `updateRestaurantFields`)، فأي مفتاح خارجها يُرفض وقت
 * الترجمة. حقلٌ جديد في الجدول يُضاف في النوع وفي القسم المناسب معاً.
 *
 * ═══ ما خرج من هنا ═══
 *
 * - **الشعار والغلاف والزينة الموسمية** ⇐ صفحة «التصميم»: مكانها مع الطابع
 *   واللون، فالتاجر الذي جاء يزيّن منيوه لا يتنقّل بين صفحتين.
 * - **بطاقة الولاء** ⇐ صفحة «الولاء»: كانت **مكرّرة** هنا وهناك بحقول قد
 *   تتعارض، والتعليق في `Loyalty.tsx` يقول صراحةً إن التفعيل موطنه تلك الصفحة.
 */
import { useEffect, useState } from "react";
import {
  Button,
  CollapsibleCard,
  ErrorNote,
  Field,
  Input,
  SavedBadge,
  Select,
  Switch,
  Textarea,
  useToast,
} from "@/components/ui";
import { HoursEditor } from "@/components/HoursEditor";
import { SupportBox } from "@/components/SupportBox";
import { PaymentSettingsCard } from "@/components/PaymentSettingsCard";
import { ApiKeysCard } from "@/components/ApiKeysCard";
import { WebhooksCard } from "@/components/WebhooksCard";
import { changeSlug, updateRestaurantFields, type RestaurantSettingsPayload } from "@/lib/data";
import { STARTER_TYPES } from "@/lib/starterMenus";
import { cn, normalizeDigits, strOrNull } from "@/lib/utils";
import { useDashboard } from "./Dashboard";
import type { Restaurant } from "@/lib/types";
import { Icon } from "@/lib/icons";
import { menuUrl, slugError, urlAffixes } from "@/lib/menuUrl";

/** حسابات التواصل — تُعرض عند الحاجة لا كخمسة حقول فارغة دائمة. */
const SOCIALS = [
  { key: "social_whatsapp", label: "واتساب", emoji: "💬", ph: "9665…" },
  { key: "social_instagram", label: "إنستغرام", emoji: "📸", ph: "https://instagram.com/…" },
  { key: "social_twitter", label: "تويتر / X", emoji: "𝕏", ph: "https://x.com/…" },
  { key: "social_tiktok", label: "تيك توك", emoji: "🎵", ph: "https://tiktok.com/@…" },
  { key: "social_snapchat", label: "سناب شات", emoji: "👻", ph: "https://snapchat.com/add/…" },
] as const;

type SocialKey = (typeof SOCIALS)[number]["key"];


/**
 * تغيير رابط المنيو — **مرّة واحدة**، مع إبقاء القديم يعمل.
 *
 * ═══ ⚠️ لماذا التحذير صريح والتأكيد مطلوب ═══
 *
 * الرابط ليس إعداداً كبقيّة الإعدادات: هو **مطبوع على طاولات المطعم** داخل
 * كود QR لا يُحدَّث. فالقديم يبقى مسجَّلاً ويُحوَّل ٣٠١ (وهذا شرط لا تحسين)،
 * لكن التاجر يجب أن يعرف قبل أن يضغط — لا بعد أن يطبع مئة بطاقة جديدة.
 *
 * و«مرّة واحدة» تحرسها القاعدة لا هذه الصفحة: تريجر يمنع الثانية، وآخر يمنع
 * PATCH المباشر على العمود.
 */
function SlugChanger({
  restaurant,
  onChanged,
}: {
  restaurant: Restaurant;
  onChanged: (r: Restaurant) => void;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const used = !!restaurant.slug_changed_at;
  const clean = value.trim().toLowerCase();
  const msg = clean ? slugError(clean) : null;
  const affix = urlAffixes();

  if (used) {
    return (
      <p className="mt-1 text-xs text-faint">
        غُيّر الرابط مرّة، ولا يُغيَّر مجدداً — راسل الدعم إن كان لا بدّ.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 text-xs font-bold text-gold hover:underline"
      >
        غيّر رابط المنيو (مرّة واحدة)
      </button>
    );
  }

  async function save() {
    if (msg) return setErr(msg);
    setBusy(true);
    setErr("");
    try {
      const next = await changeSlug(restaurant.id, clean);
      onChanged({ ...restaurant, slug: next, slug_changed_at: new Date().toISOString() });
      toast("تم تغيير الرابط. القديم يبقى يعمل ويحوّل إلى الجديد.");
      setOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "تعذّر التغيير.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 max-w-md rounded-2xl border border-line-gold bg-gold/[.06] p-4">
      <p className="text-sm font-black text-ink">غيّر رابط المنيو</p>
      <p className="mt-1.5 text-xs leading-relaxed text-dim">
        ⚠️ <b className="text-ink">مرّة واحدة فقط.</b> رابطك الحالي سيبقى يعمل
        ويحوّل تلقائياً إلى الجديد، فلا ينكسر أي كود QR طبعتَه — لكن ما تطبعه
        بعد اليوم يحمل الجديد.
      </p>
      <div dir="ltr" className="mt-3 flex items-stretch overflow-hidden rounded-xl border border-line bg-panel2">
        {affix.before && (
          <span className="grid place-items-center border-e border-line bg-panel px-2.5 text-xs font-bold text-dim">
            {affix.before}
          </span>
        )}
        <input
          dir="ltr"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="aldiwan"
          aria-label="الرابط الجديد"
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-ink outline-none placeholder:text-faint"
        />
        {affix.after && (
          <span className="grid place-items-center border-s border-line bg-panel px-2.5 text-xs font-bold text-dim">
            {affix.after}
          </span>
        )}
      </div>
      {(msg || err) && <p className="mt-1.5 text-xs text-bad">{msg || err}</p>}
      <div className="mt-3 flex gap-2">
        <Button onClick={save} disabled={busy || !clean || !!msg} className="px-4 py-2 text-sm">
          {busy ? "…" : "غيّر الرابط"}
        </Button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setValue("");
            setErr("");
          }}
          className="rounded-xl border border-line px-4 py-2 text-sm font-bold text-dim hover:text-ink"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}

export default function Settings() {
  const { user, restaurant, setRestaurant } = useDashboard();
  const toast = useToast();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  /* تهيئة الفورم (القاعدة أ — المكان 1) */
  const [f, setF] = useState(() => ({
    name: restaurant.name,
    type: restaurant.type ?? "",
    phone: restaurant.phone ?? "",
    address: restaurant.address ?? "",
    working_hours: restaurant.working_hours ?? "",
    allergens_text: restaurant.allergens_text ?? "",
    english_enabled: restaurant.english_enabled ?? false,
    google_review_url: restaurant.google_review_url ?? "",
    // `!== false` لا `?? true`: الصفوف القديمة تحمل null والافتراضي في القاعدة
    // true، فمن لم يلمس المفتاح قطّ يبقى زرّه ظاهراً كما اعتاد.
    reviews_enabled: restaurant.reviews_enabled !== false,
    social_maps: restaurant.social_maps ?? "",
    social_whatsapp: restaurant.social_whatsapp ?? "",
    whatsapp_orders_enabled: restaurant.whatsapp_orders_enabled ?? false,
    accepting_orders: restaurant.accepting_orders ?? true,
    prep_minutes: String(restaurant.prep_minutes ?? 20),
    min_order_amount: String(restaurant.min_order_amount ?? 0),
    social_instagram: restaurant.social_instagram ?? "",
    social_twitter: restaurant.social_twitter ?? "",
    social_tiktok: restaurant.social_tiktok ?? "",
    social_snapchat: restaurant.social_snapchat ?? "",
    // العمود NOT NULL بافتراضي true — الأغلب في السوق السعودي أسعار شاملة.
    prices_include_vat: restaurant.prices_include_vat ?? true,
    vat_number: restaurant.vat_number ?? "",
    meta_pixel_id: restaurant.meta_pixel_id ?? "",
    ga_measurement_id: restaurant.ga_measurement_id ?? "",
    snap_pixel_id: restaurant.snap_pixel_id ?? "",
  }));

  /** الحسابات المعروضة: ما له قيمة محفوظة + ما فتحه التاجر في هذه الجلسة. */
  const [openSocials, setOpenSocials] = useState<Set<SocialKey>>(
    () => new Set(SOCIALS.filter((s) => restaurant[s.key]?.trim()).map((s) => s.key))
  );

  useEffect(() => {
    document.title = "الإعدادات — كلاود منيو";
  }, []);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) =>
    setF((s) => ({ ...s, [k]: v }));

  /** هل يختلف حقل عمّا في القاعدة؟ — يقود شارة الحالة وتعطيل الزر. */
  const dirty = (keys: (keyof typeof f)[]) =>
    keys.some((k) => {
      const cur = f[k];
      const saved = restaurant[k as keyof Restaurant];
      if (typeof cur === "boolean") return cur !== (saved ?? (k === "prices_include_vat"));
      return (cur as string) !== ((saved as string | null) ?? "");
    });

  /**
   * حفظ قسم واحد.
   *
   * ⚠️ الخطر الحقيقي في الحفظ الجزئي أن يمسح قسمٌ حقولَ قسمٍ آخر. لا يحدث هنا:
   * `updateRestaurantFields` يرسل PATCH بالمفاتيح المذكورة وحدها، وPostgREST
   * لا يمسّ عموداً لم يُذكر.
   */
  async function saveSection(id: string, patch: Partial<RestaurantSettingsPayload>) {
    if (id === "identity" && !f.name.trim()) return setError("اسم المطعم مطلوب.");
    setSaving(id);
    setError("");
    try {
      await updateRestaurantFields(restaurant.id, patch);
      setRestaurant({ ...restaurant, ...patch });
      toast("حُفظ ✓");
    } catch {
      setError("تعذّر الحفظ. حاول مجدداً.");
    } finally {
      setSaving(null);
    }
  }

  /** زرّ الحفظ + حالته — مكرّر خمس مرات، فيُكتب مرة. */
  function SaveRow({ id, keys, patch }: { id: string; keys: (keyof typeof f)[]; patch: () => Partial<RestaurantSettingsPayload> }) {
    const d = dirty(keys);
    return (
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <Button disabled={saving !== null || !d} onClick={() => saveSection(id, patch())}>
          {saving === id ? "جارٍ الحفظ…" : "حفظ"}
        </Button>
        <SavedBadge dirty={d} />
      </div>
    );
  }

  const typeValue = f.type.trim();

  return (
    <div>
      <h1 className="font-display text-2xl font-black text-ink">الإعدادات</h1>
      <p className="mt-1 text-sm text-dim">
        رابط منيوك:{" "}
        <span className="font-bold text-gold" dir="ltr">
          {menuUrl(restaurant.slug)?.replace("https://", "")}
        </span>
      </p>
      <SlugChanger restaurant={restaurant} onChanged={setRestaurant} />

      {error && (
        <div className="mt-4">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-5">
        <CollapsibleCard
          title="🏷️ معلومات مطعمك"
          subtitle="الاسم والنوع وساعات العمل والتواصل"
          defaultOpen
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="اسم المطعم">
              <Input value={f.name} onChange={(e) => set("name", e.target.value)} required />
            </Field>
            {/* ⚠️ قائمة لا نصّ حرّ: `starterFor` تختار قالب البداية من هذه
                القيمة، والنصّ الحرّ أنتج في الإنتاج «مأكولات سعودية وعالمية»
                و`general` فلم يطابقا أي قالب. القيمة القديمة تبقى معروضة كما
                هي فلا نبدّل بيانات التاجر من تحت يده. */}
            <Field label="نوع النشاط" hint="يحدّد قالب قائمة البداية المقترحة">
              <Select value={typeValue} onChange={(e) => set("type", e.target.value)}>
                {!STARTER_TYPES.includes(typeValue) && (
                  <option value={typeValue}>{typeValue || "— اختر —"}</option>
                )}
                {STARTER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <HoursEditor value={f.working_hours} onChange={(v) => set("working_hours", v)} />
            </div>
            <Field label="الهاتف">
              <Input
                dir="ltr"
                inputMode="tel"
                value={f.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+9665…"
              />
            </Field>
            <Field label="العنوان">
              <Input value={f.address} onChange={(e) => set("address", e.target.value)} />
            </Field>
            <Field
              label="تنبيه الحساسية العام"
              hint="يظهر أسفل المنيو لكل الزبائن"
              className="sm:col-span-2"
            >
              <Textarea
                value={f.allergens_text}
                onChange={(e) => set("allergens_text", e.target.value)}
                placeholder="أطباقنا قد تحتوي مكسرات أو جلوتين…"
              />
            </Field>
            <div className="flex items-center justify-between rounded-xl border border-line bg-panel2 px-4 py-3 sm:col-span-2">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-bold text-ink">
          <Icon name="link" size={17} className="shrink-0 text-gold" />{" "}
          منيو ثنائي اللغة (عربي/إنجليزي)</p>
                <p className="text-xs text-faint">
                  يُظهر مبدّل اللغة للزبون — أضف الأسماء الإنجليزية داخل كل طبق.
                </p>
              </div>
              <Switch
                checked={f.english_enabled}
                onChange={(v) => set("english_enabled", v)}
                label="ثنائي اللغة"
              />
            </div>
          </div>
          <SaveRow
            id="identity"
            keys={["name", "type", "phone", "address", "working_hours", "allergens_text", "english_enabled"]}
            patch={() => ({
              name: f.name.trim(),
              type: strOrNull(f.type),
              phone: strOrNull(f.phone),
              address: strOrNull(f.address),
              working_hours: strOrNull(f.working_hours),
              allergens_text: strOrNull(f.allergens_text),
              english_enabled: f.english_enabled,
            })}
          />
        </CollapsibleCard>

        <CollapsibleCard
          title="🔗 روابطك وحساباتك"
          subtitle="تقييم قوقل، الموقع على الخريطة، وحسابات التواصل"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {/**
             * ⚠️ **١٨ من ١٩ تاجراً تركوا هذا الحقل فارغاً.** والحقل لم يكن
             * فيه ما يقول **من أين** يُجلب الرابط — و«رابط تقييم قوقل» ليست
             * تعليمات، فمن لا يعرف الطريق لا يبحث عنه. الخطوات الثلاث أدناه
             * هي كل الفرق بين حقل يُملأ وحقل يُتخطّى.
             */}
            <Field
              label="رابط تقييم قوقل"
              hint="أرخص قناة نمو لمطعمك — التقييمات ترفع ظهورك في خرائط قوقل"
            >
              <Input
                dir="ltr"
                value={f.google_review_url}
                onChange={(e) => set("google_review_url", e.target.value)}
                placeholder="https://g.page/r/…"
              />
              <p className="mt-2 text-xs leading-relaxed text-faint">
                من أين تجلبه: افتح <b className="text-dim">ملف نشاطك التجاري</b> على
                قوقل ← <b className="text-dim">«اطلب تقييمات»</b> ← انسخ الرابط
                القصير والصقه هنا. سيظهر للزبون زرّ «قيّمنا على قوقل» أعلى
                منيوك، بعد أن يأكل مباشرة — وهي أفضل لحظة يُطلب فيها التقييم.
              </p>
            </Field>
            <Field label="الموقع (خرائط قوقل)">
              <Input
                dir="ltr"
                value={f.social_maps}
                onChange={(e) => set("social_maps", e.target.value)}
              />
            </Field>
          </div>

          {/* خمسة حقول ظاهرة دائماً تُوحي بأن على التاجر ملأها كلها، وأغلب
              المطاعم على منصّة أو اثنتين. تُضاف عند الحاجة. */}
          <div className="mt-4 flex flex-col gap-3">
            {SOCIALS.filter((s) => openSocials.has(s.key)).map((s) => (
              <Field key={s.key} label={`${s.emoji} ${s.label}`}>
                <Input
                  dir="ltr"
                  value={f[s.key]}
                  onChange={(e) => set(s.key, e.target.value)}
                  placeholder={s.ph}
                />
              </Field>
            ))}
            <div className="flex flex-wrap items-center gap-2">
              {SOCIALS.filter((s) => !openSocials.has(s.key)).map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setOpenSocials((p) => new Set(p).add(s.key))}
                  className="inline-flex min-h-9 items-center rounded-full border border-line px-3 py-1.5 text-xs font-bold text-dim hover:border-line-gold hover:text-ink"
                >
                  ＋ {s.emoji} {s.label}
                </button>
              ))}
            </div>
          </div>
          {f.google_review_url.trim() && (
            <div className="mt-4 border-t border-line pt-4">
              <Switch
                checked={f.reviews_enabled}
                onChange={(v) => set("reviews_enabled", v)}
                label="أظهر زرّ التقييم في المنيو"
              />
              <p className="mt-1.5 text-xs text-faint">
                أطفئه مؤقتاً إن أردت — مثلاً أثناء تغيير الطاقم أو بعد شكوى
                تعالجها. الرابط يبقى محفوظاً.
              </p>
            </div>
          )}
          <SaveRow
            id="links"
            keys={[
              "google_review_url", "reviews_enabled", "social_maps", "social_whatsapp",
              "social_instagram", "social_twitter", "social_tiktok", "social_snapchat",
            ]}
            patch={() => ({
              google_review_url: strOrNull(f.google_review_url),
              reviews_enabled: f.reviews_enabled,
              social_maps: strOrNull(f.social_maps),
              social_whatsapp: strOrNull(f.social_whatsapp),
              social_instagram: strOrNull(f.social_instagram),
              social_twitter: strOrNull(f.social_twitter),
              social_tiktok: strOrNull(f.social_tiktok),
              social_snapchat: strOrNull(f.social_snapchat),
            })}
          />
        </CollapsibleCard>

        {/* استقبال الطلبات — قسم مستقلّ لا شريحة داخل «روابطك»: هذا قرار
            تشغيلي يفتح سلّة في منيو الزبون، لا مجرّد رقم للتواصل. */}
        <CollapsibleCard
          title="🛒 استقبال الطلبات على واتساب"
          subtitle="يبني الزبون طلبه من المنيو، ويصلك نصّاً مرتّباً على واتساب"
        >
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3.5">
            <Switch
              checked={f.whatsapp_orders_enabled}
              onChange={(v) => set("whatsapp_orders_enabled", v)}
              label="استقبال الطلبات على واتساب"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-ink">فعّل سلّة الطلب</span>
              <span className="mt-1 block text-xs leading-relaxed text-faint">
                لا تحتاج بوابة دفع: يصلك الطلب بأصنافه وكمياته ورقم الطاولة، وأنت
                تؤكّد السعر النهائي وتستلم في مطعمك كالمعتاد.
              </span>
            </span>
          </label>

          {/* مفتاحٌ يعمل بلا رقم يعرض للزبون زرّاً يفتح فراغاً — أسوأ من غياب
              الميزة. فالتحذير صريح ومربوط بالحقل الذي يُصلحه. */}
          {f.whatsapp_orders_enabled && !f.social_whatsapp.trim() && (
            <p className="mt-3 rounded-xl border border-bad/30 bg-bad/10 px-3.5 py-2.5 text-xs font-bold leading-relaxed text-bad">
              ⚠️ لم تحفظ رقم واتساب بعد، فلن يظهر الزرّ في منيوك. أضِف الرقم من
              قسم «🔗 روابطك وحساباتك» أعلاه ثم احفظه.
            </p>
          )}

          <SaveRow
            id="orders"
            keys={["whatsapp_orders_enabled"]}
            patch={() => ({ whatsapp_orders_enabled: f.whatsapp_orders_enabled })}
          />
        </CollapsibleCard>

        {/* الدفع الإلكتروني — قسم مستقلّ عن واتساب: مساران مختلفان تماماً،
            هذا يقبض ثمن الطلب مقدَّماً وذاك يرسل نصّاً. */}
        <CollapsibleCard
          title="💳 الطلب والدفع الإلكتروني"
          subtitle="الزبون يدفع من المنيو، ويصلك الطلب برقم استلام في لوحة الطلبات"
        >
          {!restaurant.online_payment_enabled && (
            <p className="mb-3 rounded-xl border border-line bg-bg-2 px-3.5 py-2.5 text-xs leading-relaxed text-faint">
              اربط بوابة الدفع أولاً من صفحة «الاشتراك والفوترة» ← بطاقة «الدفع
              الإلكتروني». بدونها لا تظهر السلّة لزبائنك.
            </p>
          )}

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3.5">
            <Switch
              checked={f.accepting_orders}
              onChange={(v) => set("accepting_orders", v)}
              label="استقبال الطلبات الآن"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-ink">نستقبل طلبات الآن</span>
              <span className="mt-1 block text-xs leading-relaxed text-faint">
                أغلقه عند الضغط أو بعد إقفال المطعم — تختفي السلّة من المنيو فوراً،
                فلا يدفع زبون ثمن طلبٍ لن يُحضَّر. وتقدر تفتحه وتغلقه بضغطة من
                صفحة «الطلبات» أثناء الدوام.
              </span>
            </span>
          </label>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="وقت التحضير (دقيقة)" hint="يُعرض للزبون كوعد، ويُلوّن الطلب المتأخّر في لوحتك">
              <Input
                type="number"
                min="1"
                max="240"
                inputMode="numeric"
                value={f.prep_minutes}
                onChange={(e) => set("prep_minutes", e.target.value)}
              />
            </Field>
            <Field label="أقل مبلغ للطلب (ر.س)" hint="صفر = بلا حدّ">
              <Input
                type="number"
                min="0"
                inputMode="decimal"
                value={f.min_order_amount}
                onChange={(e) => set("min_order_amount", e.target.value)}
              />
            </Field>
          </div>

          <SaveRow
            id="online-orders"
            keys={["accepting_orders", "prep_minutes", "min_order_amount"]}
            patch={() => ({
              accepting_orders: f.accepting_orders,
              // القاعدة تقصّ ١..٢٤٠؛ نقصّه هنا أيضاً كي لا يُرفض الحفظ بخطأ خام.
              prep_minutes: Math.min(
                240,
                Math.max(1, Math.round(Number(normalizeDigits(f.prep_minutes)) || 20))
              ),
              min_order_amount: Math.max(
                0,
                Number(normalizeDigits(f.min_order_amount)) || 0
              ),
            })}
          />
        </CollapsibleCard>

        {/* الزبون السعودي يسأل «هل السعر شامل الضريبة؟» — الجواب يظهر في المنيو. */}
        <CollapsibleCard
          title="🧾 الضريبة"
          subtitle={
            f.prices_include_vat
              ? "الأسعار شاملة ضريبة القيمة المضافة 15%"
              : "الأسعار غير شاملة الضريبة"
          }
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-panel2 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-ink">
                  الأسعار المعروضة شاملة ضريبة القيمة المضافة 15%
                </p>
                <p className="text-xs text-faint">يظهر للزبون سطر واضح أسفل المنيو يوضّح ذلك.</p>
              </div>
              <Switch
                checked={f.prices_include_vat}
                onChange={(v) => set("prices_include_vat", v)}
                label="شاملة الضريبة"
              />
            </div>
            <Field
              label="الرقم الضريبي (اختياري)"
              hint="١٥ رقماً — يظهر في تذييل المنيو لمن يطلبه من زبائنك."
            >
              <Input
                value={f.vat_number}
                onChange={(e) =>
                  set("vat_number", normalizeDigits(e.target.value).replace(/\D/g, "").slice(0, 15))
                }
                dir="ltr"
                inputMode="numeric"
                placeholder="3xxxxxxxxxxxxx3"
              />
            </Field>
            {f.vat_number.length > 0 && f.vat_number.length !== 15 && (
              <p className="text-xs text-bad">
                الرقم الضريبي السعودي ١٥ رقماً — كتبت {f.vat_number.length}.
              </p>
            )}
          </div>
          <SaveRow
            id="vat"
            keys={["prices_include_vat", "vat_number"]}
            patch={() => ({
              prices_include_vat: f.prices_include_vat,
              vat_number: strOrNull(f.vat_number),
            })}
          />
        </CollapsibleCard>

        {/* بكسلات التتبّع — اختيارية ومطفأة تماماً بلا معرّف (§15). */}
        <CollapsibleCard
          title="📊 التتبّع والإعلانات"
          subtitle="اربط منيوك بمنصّات إعلاناتك لتقيس من أين يأتي زبائنك"
        >
          <div className="flex flex-col gap-4">
            <p className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel2 px-4 py-3 text-xs leading-relaxed text-dim">
          <Icon name="warn" size={17} className="shrink-0 text-gold" />{" "}
          تشغيل أيٍّ من هذه يعني أن سلوك زبائنك في منيوك يُشارَك مع تلك
              المنصّة. اتركها فارغة إن لم تكن تعلن — منيوك لا يحمّل أي سكربت
              خارجي بدونها إطلاقاً.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Meta (فيسبوك/إنستقرام) Pixel ID" hint="أرقام فقط">
                <Input
                  dir="ltr"
                  inputMode="numeric"
                  value={f.meta_pixel_id}
                  onChange={(e) => set("meta_pixel_id", e.target.value.replace(/\D/g, "").slice(0, 20))}
                  placeholder="123456789012345"
                />
              </Field>
              <Field label="Google Analytics 4" hint="يبدأ بـ G-">
                <Input
                  dir="ltr"
                  value={f.ga_measurement_id}
                  onChange={(e) =>
                    set("ga_measurement_id", e.target.value.trim().toUpperCase().slice(0, 20))
                  }
                  placeholder="G-XXXXXXXXXX"
                />
              </Field>
              <Field label="Snapchat Pixel ID" className="sm:col-span-2">
                <Input
                  dir="ltr"
                  value={f.snap_pixel_id}
                  onChange={(e) => set("snap_pixel_id", e.target.value.trim().slice(0, 60))}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
              </Field>
            </div>
          </div>
          <SaveRow
            id="pixels"
            keys={["meta_pixel_id", "ga_measurement_id", "snap_pixel_id"]}
            patch={() => ({
              meta_pixel_id: strOrNull(f.meta_pixel_id),
              ga_measurement_id: strOrNull(f.ga_measurement_id),
              snap_pixel_id: strOrNull(f.snap_pixel_id),
            })}
          />
        </CollapsibleCard>
      </div>

      {/* الدفع الإلكتروني — بطاقة مستقلّة: تحفظ جدولين بضغطتها الخاصة. */}
      <div className="mt-5">
        <PaymentSettingsCard
          restaurant={restaurant}
          userId={user.id}
          onToggled={(on) => setRestaurant({ ...restaurant, online_payment_enabled: on })}
        />
      </div>

      {/* واجهة API — تظهر لمن فتح له المؤسس البوّابة فقط (§14). */}
      {restaurant.api_enabled && (
        <>
          <div className="mt-5">
            <ApiKeysCard restaurant={restaurant} userId={user.id} />
          </div>
          <div className="mt-5">
            <WebhooksCard restaurant={restaurant} userId={user.id} />
          </div>
        </>
      )}

      <div className="mt-5">
        <SupportBox userId={user.id} email={user.email ?? null} restaurantName={restaurant.name} />
      </div>

      {/* ما انتقل — سطر واحد يمنع البحث عمّا لم يعد هنا. */}
      <p className={cn("mt-6 text-center text-xs text-faint")}>
        الشعار والغلاف والزينة الموسمية في <b className="text-dim">التصميم</b> ·
        بطاقة الولاء في <b className="text-dim">التحليلات ← الولاء</b>
      </p>
    </div>
  );
}

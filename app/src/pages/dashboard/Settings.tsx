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
import { updateRestaurantFields, type RestaurantSettingsPayload } from "@/lib/data";
import { STARTER_TYPES } from "@/lib/starterMenus";
import { cn, normalizeDigits, strOrNull } from "@/lib/utils";
import { useDashboard } from "./Dashboard";
import type { Restaurant } from "@/lib/types";

/** حسابات التواصل — تُعرض عند الحاجة لا كخمسة حقول فارغة دائمة. */
const SOCIALS = [
  { key: "social_whatsapp", label: "واتساب", emoji: "💬", ph: "9665…" },
  { key: "social_instagram", label: "إنستغرام", emoji: "📸", ph: "https://instagram.com/…" },
  { key: "social_twitter", label: "تويتر / X", emoji: "𝕏", ph: "https://x.com/…" },
  { key: "social_tiktok", label: "تيك توك", emoji: "🎵", ph: "https://tiktok.com/@…" },
  { key: "social_snapchat", label: "سناب شات", emoji: "👻", ph: "https://snapchat.com/add/…" },
] as const;

type SocialKey = (typeof SOCIALS)[number]["key"];

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
    social_maps: restaurant.social_maps ?? "",
    social_whatsapp: restaurant.social_whatsapp ?? "",
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
        رابط منيوك: <span className="font-bold text-gold" dir="ltr">/{restaurant.slug}</span>
      </p>

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
                <p className="text-sm font-bold text-ink">🌐 منيو ثنائي اللغة (عربي/إنجليزي)</p>
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
            <Field label="رابط تقييم قوقل" hint="أرخص قناة نمو لمطعمك">
              <Input
                dir="ltr"
                value={f.google_review_url}
                onChange={(e) => set("google_review_url", e.target.value)}
                placeholder="https://g.page/r/…"
              />
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
                  className="rounded-full border border-line px-3 py-1.5 text-xs font-bold text-dim hover:border-line-gold hover:text-ink"
                >
                  ＋ {s.emoji} {s.label}
                </button>
              ))}
            </div>
          </div>
          <SaveRow
            id="links"
            keys={[
              "google_review_url", "social_maps", "social_whatsapp",
              "social_instagram", "social_twitter", "social_tiktok", "social_snapchat",
            ]}
            patch={() => ({
              google_review_url: strOrNull(f.google_review_url),
              social_maps: strOrNull(f.social_maps),
              social_whatsapp: strOrNull(f.social_whatsapp),
              social_instagram: strOrNull(f.social_instagram),
              social_twitter: strOrNull(f.social_twitter),
              social_tiktok: strOrNull(f.social_tiktok),
              social_snapchat: strOrNull(f.social_snapchat),
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
            <p className="rounded-xl border border-line bg-panel2 px-4 py-3 text-xs leading-relaxed text-dim">
              ⚠️ تشغيل أيٍّ من هذه يعني أن سلوك زبائنك في منيوك يُشارَك مع تلك
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

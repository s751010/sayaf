/**
 * إعدادات المطعم — الهوية، التواصل، الولاء، واللغة.
 * ⚠️ القاعدة (أ): الحقول هنا تطابق RestaurantSettingsPayload في lib/data —
 * حقل جديد في الجدول يُضاف في الاثنين معاً.
 */
import { useEffect, useState, type FormEvent } from "react";
import {
  Button,
  CollapsibleCard,
  ErrorNote,
  Field,
  Input,
  Switch,
  Textarea,
  useToast,
} from "@/components/ui";
import { ImageUploader } from "@/components/ImageUploader";
import { HoursEditor } from "@/components/HoursEditor";
import { SupportBox } from "@/components/SupportBox";
import { PaymentSettingsCard } from "@/components/PaymentSettingsCard";
import { ApiKeysCard } from "@/components/ApiKeysCard";
import { WebhooksCard } from "@/components/WebhooksCard";
import { updateRestaurant, type RestaurantSettingsPayload } from "@/lib/data";
import { SEASONS } from "@/lib/seasons";
import { cn, normalizeDigits, numOrNull, strOrNull } from "@/lib/utils";
import { useDashboard } from "./Dashboard";

export default function Settings() {
  const { user, restaurant, setRestaurant } = useDashboard();
  const toast = useToast();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  /* تهيئة الفورم (القاعدة أ — المكان 1) */
  const [f, setF] = useState(() => ({
    name: restaurant.name,
    type: restaurant.type ?? "",
    phone: restaurant.phone ?? "",
    address: restaurant.address ?? "",
    logo_image: restaurant.logo_image ?? "",
    banner_image: restaurant.banner_image ?? "",
    working_hours: restaurant.working_hours ?? "",
    allergens_text: restaurant.allergens_text ?? "",
    google_review_url: restaurant.google_review_url ?? "",
    social_whatsapp: restaurant.social_whatsapp ?? "",
    social_instagram: restaurant.social_instagram ?? "",
    social_twitter: restaurant.social_twitter ?? "",
    social_tiktok: restaurant.social_tiktok ?? "",
    social_snapchat: restaurant.social_snapchat ?? "",
    social_maps: restaurant.social_maps ?? "",
    english_enabled: restaurant.english_enabled ?? false,
    loyalty_enabled: restaurant.loyalty_enabled ?? false,
    loyalty_goal: restaurant.loyalty_goal != null ? String(restaurant.loyalty_goal) : "5",
    loyalty_reward: restaurant.loyalty_reward ?? "",
    // العمود NOT NULL بافتراضي true — الأغلب في السوق السعودي أسعار شاملة.
    prices_include_vat: restaurant.prices_include_vat ?? true,
    vat_number: restaurant.vat_number ?? "",
    season: restaurant.season ?? "",
    meta_pixel_id: restaurant.meta_pixel_id ?? "",
    ga_measurement_id: restaurant.ga_measurement_id ?? "",
    snap_pixel_id: restaurant.snap_pixel_id ?? "",
  }));

  useEffect(() => {
    document.title = "الإعدادات — كلاود منيو";
  }, []);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) =>
    setF((s) => ({ ...s, [k]: v }));

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) return setError("اسم المطعم مطلوب.");
    setBusy(true);
    setError("");
    const payload: RestaurantSettingsPayload = {
      name: f.name.trim(),
      type: strOrNull(f.type),
      phone: strOrNull(f.phone),
      address: strOrNull(f.address),
      logo_image: strOrNull(f.logo_image),
      banner_image: strOrNull(f.banner_image),
      working_hours: strOrNull(f.working_hours),
      allergens_text: strOrNull(f.allergens_text),
      google_review_url: strOrNull(f.google_review_url),
      social_whatsapp: strOrNull(f.social_whatsapp),
      social_instagram: strOrNull(f.social_instagram),
      social_twitter: strOrNull(f.social_twitter),
      social_tiktok: strOrNull(f.social_tiktok),
      social_snapchat: strOrNull(f.social_snapchat),
      social_maps: strOrNull(f.social_maps),
      english_enabled: f.english_enabled,
      loyalty_enabled: f.loyalty_enabled,
      // يُحصر عند الكتابة أيضاً لا عند القراءة فقط — صفحة الزبون ترسم بطاقة
      // بعدد الأختام، وقيمة خارج المدى كانت تُسقط الصفحة.
      loyalty_goal: (() => {
        const n = numOrNull(f.loyalty_goal);
        return n === null ? null : Math.min(20, Math.max(1, Math.round(n)));
      })(),
      loyalty_reward: strOrNull(f.loyalty_reward),
      prices_include_vat: f.prices_include_vat,
      vat_number: strOrNull(f.vat_number),
      season: strOrNull(f.season),
      meta_pixel_id: strOrNull(f.meta_pixel_id),
      ga_measurement_id: strOrNull(f.ga_measurement_id),
      snap_pixel_id: strOrNull(f.snap_pixel_id),
    };
    try {
      await updateRestaurant(restaurant.id, payload);
      setRestaurant({ ...restaurant, ...payload });
      toast("حُفظت الإعدادات ✓");
    } catch {
      setError("تعذّر الحفظ. حاول مجدداً.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-black text-ink">الإعدادات</h1>
      <p className="mt-1 text-sm text-dim">
        رابط منيوك: <span className="font-bold text-gold" dir="ltr">/{restaurant.slug}</span>
      </p>

      <form onSubmit={save} className="mt-6 flex flex-col gap-5">
        <CollapsibleCard
          title="🏷️ الهوية"
          subtitle="الاسم والشعار والغلاف وساعات العمل"
          defaultOpen
        >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="اسم المطعم">
            <Input value={f.name} onChange={(e) => set("name", e.target.value)} required />
          </Field>
          <Field label="نوع النشاط">
            <Input value={f.type} onChange={(e) => set("type", e.target.value)} placeholder="مطعم، كافيه…" />
          </Field>
          <ImageUploader
            label="شعار المطعم"
            value={f.logo_image}
            onChange={(url) => set("logo_image", url)}
            bucket="restaurant-images"
            pathPrefix={`${restaurant.id}/logo`}
            shape="square"
          />
          <ImageUploader
            label="صورة الغلاف"
            value={f.banner_image}
            onChange={(url) => set("banner_image", url)}
            bucket="restaurant-images"
            pathPrefix={`${restaurant.id}/banner`}
            shape="wide"
          />
          <div className="sm:col-span-2">
            <HoursEditor
              value={f.working_hours}
              onChange={(v) => set("working_hours", v)}
            />
          </div>
          <Field label="الهاتف">
            <Input dir="ltr" inputMode="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+9665…" />
          </Field>
          <Field label="العنوان" className="sm:col-span-2">
            <Input value={f.address} onChange={(e) => set("address", e.target.value)} />
          </Field>
          <Field label="تنبيه الحساسية العام" hint="يظهر أسفل المنيو لكل الزبائن" className="sm:col-span-2">
            <Textarea value={f.allergens_text} onChange={(e) => set("allergens_text", e.target.value)} placeholder="أطباقنا قد تحتوي مكسرات أو جلوتين…" />
          </Field>
        </div>
        </CollapsibleCard>

        <CollapsibleCard
          title="🔗 التواصل والتقييم"
          subtitle="تقييم قوقل، الموقع على الخريطة، وحسابات التواصل"
        >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="رابط تقييم قوقل" className="sm:col-span-2">
            <Input dir="ltr" value={f.google_review_url} onChange={(e) => set("google_review_url", e.target.value)} placeholder="https://g.page/r/…" />
          </Field>
          <Field label="واتساب (رقم أو رابط)">
            <Input dir="ltr" value={f.social_whatsapp} onChange={(e) => set("social_whatsapp", e.target.value)} />
          </Field>
          <Field label="إنستغرام">
            <Input dir="ltr" value={f.social_instagram} onChange={(e) => set("social_instagram", e.target.value)} placeholder="https://instagram.com/…" />
          </Field>
          <Field label="تويتر / X">
            <Input dir="ltr" value={f.social_twitter} onChange={(e) => set("social_twitter", e.target.value)} />
          </Field>
          <Field label="تيك توك">
            <Input dir="ltr" value={f.social_tiktok} onChange={(e) => set("social_tiktok", e.target.value)} />
          </Field>
          <Field label="سناب شات">
            <Input dir="ltr" value={f.social_snapchat} onChange={(e) => set("social_snapchat", e.target.value)} />
          </Field>
          <Field label="الموقع (خرائط قوقل)">
            <Input dir="ltr" value={f.social_maps} onChange={(e) => set("social_maps", e.target.value)} />
          </Field>
        </div>
        </CollapsibleCard>

        <CollapsibleCard
          title="✨ مزايا المنيو"
          subtitle="اللغة الإنجليزية وبطاقة الولاء"
        >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-xl border border-line bg-panel2 px-4 py-3">
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
          <div className="flex items-center justify-between rounded-xl border border-line bg-panel2 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-ink">💛 بطاقة الولاء للزبائن</p>
              <p className="text-xs text-faint">بطاقة أختام رقمية تظهر أسفل المنيو.</p>
            </div>
            <Switch
              checked={f.loyalty_enabled}
              onChange={(v) => set("loyalty_enabled", v)}
              label="الولاء"
            />
          </div>
          {f.loyalty_enabled && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="عدد الزيارات للمكافأة">
                <Input
                  type="number"
                  inputMode="numeric"
                  min="2"
                  max="20"
                  dir="ltr"
                  value={f.loyalty_goal}
                  onChange={(e) => set("loyalty_goal", e.target.value)}
                />
              </Field>
              <Field label="المكافأة">
                <Input
                  value={f.loyalty_reward}
                  onChange={(e) => set("loyalty_reward", e.target.value)}
                  placeholder="مشروب مجاني"
                />
              </Field>
            </div>
          )}
        </div>
        </CollapsibleCard>

        {/* زينة موسمية — تُضاف فوق طابع منيوك بلا أن تبدّله. */}
        <CollapsibleCard
          title="🌙 زينة الموسم"
          subtitle="لمسة موسمية أعلى منيوك — تُشغّلها وتُطفئها متى شئت"
        >
          <div className="grid gap-2 sm:grid-cols-4">
            {[{ id: "", name: "بلا زينة", emoji: "—" }, ...SEASONS].map((s) => {
              const on = f.season === s.id;
              return (
                <button
                  key={s.id || "none"}
                  type="button"
                  onClick={() => set("season", s.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-sm font-bold transition-colors",
                    on
                      ? "border-gold bg-gold/12 text-ink"
                      : "border-line text-dim hover:border-line-gold hover:text-ink"
                  )}
                >
                  <span className="text-xl">{s.emoji}</span>
                  {s.name}
                </button>
              );
            })}
          </div>
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
              <p className="text-xs text-faint">
                يظهر للزبون سطر واضح أسفل المنيو يوضّح ذلك.
              </p>
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
        </CollapsibleCard>

        {error && <ErrorNote>{error}</ErrorNote>}
        <Button type="submit" disabled={busy} className="w-full py-3 sm:w-auto sm:self-start sm:px-10">
          {busy ? "جارٍ الحفظ…" : "حفظ الإعدادات"}
        </Button>
      </form>

      {/* الدفع الإلكتروني — خارج الفورم: يحفظ جدولين بضغطته الخاصة (انظر الملف). */}
      <div className="mt-5">
        <PaymentSettingsCard
          restaurant={restaurant}
          userId={user.id}
          onToggled={(on) => setRestaurant({ ...restaurant, online_payment_enabled: on })}
        />
      </div>

      {/* واجهة API — تظهر لمن فتح له المؤسس البوّابة فقط (§14). قسم معطَّل
          لكل تاجر ضجيج في شاشة مزدحمة أصلاً. */}
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

      {/* الدعم الفني — خارج فورم الإعدادات كي لا يتشابك الإرسال بينهما. */}
      <div className="mt-5">
        <SupportBox
          userId={user.id}
          email={user.email ?? null}
          restaurantName={restaurant.name}
        />
      </div>
    </div>
  );
}

/**
 * إعدادات المطعم — الهوية، التواصل، الولاء، واللغة.
 * ⚠️ القاعدة (أ): الحقول هنا تطابق RestaurantSettingsPayload في lib/data —
 * حقل جديد في الجدول يُضاف في الاثنين معاً.
 */
import { useEffect, useState, type FormEvent } from "react";
import {
  Button,
  Card,
  ErrorNote,
  Field,
  Input,
  Switch,
  Textarea,
  useToast,
} from "@/components/ui";
import { updateRestaurant, type RestaurantSettingsPayload } from "@/lib/data";
import { numOrNull, strOrNull } from "@/lib/utils";
import { useDashboard } from "./Dashboard";

export default function Settings() {
  const { restaurant, setRestaurant, ent } = useDashboard();
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
    // الصلاحيات: الولاء والإنجليزي حصريان للاحترافية — نُجبر الإيقاف بدونها.
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
      english_enabled: ent.english && f.english_enabled,
      loyalty_enabled: ent.loyalty && f.loyalty_enabled,
      loyalty_goal: numOrNull(f.loyalty_goal),
      loyalty_reward: strOrNull(f.loyalty_reward),
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

  const section = "font-display text-lg font-extrabold text-ink";

  return (
    <div>
      <h1 className="font-display text-2xl font-black text-ink">الإعدادات</h1>
      <p className="mt-1 text-sm text-dim">
        رابط منيوك: <span className="font-bold text-gold" dir="ltr">/{restaurant.slug}</span>
      </p>

      <form onSubmit={save} className="mt-6 flex flex-col gap-5">
        <Card className="grid gap-4 sm:grid-cols-2">
          <h2 className={`${section} sm:col-span-2`}>🏷️ الهوية</h2>
          <Field label="اسم المطعم">
            <Input value={f.name} onChange={(e) => set("name", e.target.value)} required />
          </Field>
          <Field label="نوع النشاط">
            <Input value={f.type} onChange={(e) => set("type", e.target.value)} placeholder="مطعم، كافيه…" />
          </Field>
          <Field label="رابط الشعار (صورة)">
            <Input dir="ltr" value={f.logo_image} onChange={(e) => set("logo_image", e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="رابط الغلاف (صورة)">
            <Input dir="ltr" value={f.banner_image} onChange={(e) => set("banner_image", e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="ساعات العمل" hint="نص حر يظهر أعلى المنيو">
            <Input value={f.working_hours} onChange={(e) => set("working_hours", e.target.value)} placeholder="يومياً 12م — 12ص" />
          </Field>
          <Field label="الهاتف">
            <Input dir="ltr" inputMode="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+9665…" />
          </Field>
          <Field label="العنوان" className="sm:col-span-2">
            <Input value={f.address} onChange={(e) => set("address", e.target.value)} />
          </Field>
          <Field label="تنبيه الحساسية العام" hint="يظهر أسفل المنيو لكل الزبائن" className="sm:col-span-2">
            <Textarea value={f.allergens_text} onChange={(e) => set("allergens_text", e.target.value)} placeholder="أطباقنا قد تحتوي مكسرات أو جلوتين…" />
          </Field>
        </Card>

        <Card className="grid gap-4 sm:grid-cols-2">
          <h2 className={`${section} sm:col-span-2`}>🔗 التواصل والتقييم</h2>
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
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className={section}>👑 ميزات الاحترافية</h2>
          <div className="flex items-center justify-between rounded-xl border border-line bg-panel2 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-ink">🌐 منيو ثنائي اللغة (عربي/إنجليزي)</p>
              {!ent.english && <p className="text-xs text-faint">متاح في باقة الاحترافية</p>}
            </div>
            <Switch
              checked={ent.english && f.english_enabled}
              onChange={(v) => set("english_enabled", v)}
              disabled={!ent.english}
              label="ثنائي اللغة"
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-line bg-panel2 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-ink">💛 بطاقة الولاء للزبائن</p>
              {!ent.loyalty && <p className="text-xs text-faint">متاحة في باقة الاحترافية</p>}
            </div>
            <Switch
              checked={ent.loyalty && f.loyalty_enabled}
              onChange={(v) => set("loyalty_enabled", v)}
              disabled={!ent.loyalty}
              label="الولاء"
            />
          </div>
          {ent.loyalty && f.loyalty_enabled && (
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
        </Card>

        {error && <ErrorNote>{error}</ErrorNote>}
        <Button type="submit" disabled={busy} className="w-full py-3 sm:w-auto sm:self-start sm:px-10">
          {busy ? "جارٍ الحفظ…" : "حفظ الإعدادات"}
        </Button>
      </form>
    </div>
  );
}

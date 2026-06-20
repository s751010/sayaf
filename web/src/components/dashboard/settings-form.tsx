"use client";

import { useActionState, useState } from "react";
import { Check } from "lucide-react";
import { updateRestaurant, type ActionState } from "@/app/dashboard/actions";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { THEMES } from "@/lib/themes";
import { cn } from "@/lib/utils";
import type { Restaurant } from "@/lib/types";

export function SettingsForm({
  restaurant,
  currentTheme,
}: {
  restaurant: Restaurant;
  currentTheme: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    updateRestaurant,
    {}
  );
  const [theme, setTheme] = useState(currentTheme);
  const r = restaurant;

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="menu_theme" value={theme} />

      <Card className="flex flex-col gap-4">
        <h2 className="font-bold text-cream">معلومات المطعم</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="اسم المطعم" htmlFor="name">
            <Input id="name" name="name" defaultValue={r.name} />
          </Field>
          <Field label="النوع" htmlFor="type">
            <Input id="type" name="type" defaultValue={r.type ?? ""} />
          </Field>
          <Field label="رابط الشعار" htmlFor="logo_image">
            <Input id="logo_image" name="logo_image" dir="ltr" defaultValue={r.logo_image ?? ""} />
          </Field>
          <Field label="رابط الغلاف" htmlFor="banner_image">
            <Input id="banner_image" name="banner_image" dir="ltr" defaultValue={r.banner_image ?? ""} />
          </Field>
        </div>
        <Field label="ساعات العمل" htmlFor="working_hours">
          <Input id="working_hours" name="working_hours" defaultValue={r.working_hours ?? ""} />
        </Field>
        <Field label="تنبيه مسببات الحساسية" htmlFor="allergens_text">
          <Textarea id="allergens_text" name="allergens_text" defaultValue={r.allergens_text ?? ""} />
        </Field>
      </Card>

      {/* Theme picker */}
      <Card className="flex flex-col gap-4">
        <div>
          <h2 className="font-bold text-cream">ثيم المنيو</h2>
          <p className="mt-1 text-sm text-warm">اختر هوية بصرية احترافية لصفحة منيو مطعمك.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {THEMES.map((t) => {
            const selected = theme === t.id;
            return (
              <button
                type="button"
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "relative overflow-hidden rounded-xl border-2 p-0 text-right transition-all",
                  selected ? "border-gold" : "border-transparent hover:border-line"
                )}
              >
                <div
                  className="flex h-16 items-end gap-1 p-2"
                  style={{ background: t.vars["--m-bg"] }}
                >
                  <span className="h-6 w-6 rounded-full" style={{ background: t.vars["--m-accent"] }} />
                  <span className="h-4 w-4 rounded-full" style={{ background: t.vars["--m-accent-2"] }} />
                  <span className="h-8 flex-1 rounded-md" style={{ background: t.vars["--m-surface"] }} />
                </div>
                <div className="flex items-center justify-between bg-charcoal-3 px-2.5 py-1.5">
                  <span className="text-xs font-semibold text-cream">{t.name}</span>
                  {selected && <Check size={14} className="text-gold" />}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="font-bold text-cream">روابط التواصل</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="تقييم قوقل" htmlFor="google_review_url">
            <Input id="google_review_url" name="google_review_url" dir="ltr" defaultValue={r.google_review_url ?? ""} />
          </Field>
          <Field label="واتساب (رقم أو رابط)" htmlFor="social_whatsapp">
            <Input id="social_whatsapp" name="social_whatsapp" dir="ltr" defaultValue={r.social_whatsapp ?? ""} placeholder="9665xxxxxxxx" />
          </Field>
          <Field label="إنستغرام" htmlFor="social_instagram">
            <Input id="social_instagram" name="social_instagram" dir="ltr" defaultValue={r.social_instagram ?? ""} />
          </Field>
          <Field label="X (تويتر)" htmlFor="social_twitter">
            <Input id="social_twitter" name="social_twitter" dir="ltr" defaultValue={r.social_twitter ?? ""} />
          </Field>
          <Field label="تيك توك" htmlFor="social_tiktok">
            <Input id="social_tiktok" name="social_tiktok" dir="ltr" defaultValue={r.social_tiktok ?? ""} />
          </Field>
          <Field label="سناب شات" htmlFor="social_snapchat">
            <Input id="social_snapchat" name="social_snapchat" dir="ltr" defaultValue={r.social_snapchat ?? ""} />
          </Field>
          <Field label="الموقع (خرائط)" htmlFor="social_maps">
            <Input id="social_maps" name="social_maps" dir="ltr" defaultValue={r.social_maps ?? ""} />
          </Field>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="font-bold text-cream">برنامج الولاء</h2>
        <label className="flex items-center gap-2 text-sm text-cream">
          <input
            type="checkbox"
            name="loyalty_enabled"
            defaultChecked={r.loyalty_enabled ?? false}
            className="h-4 w-4 accent-gold"
          />
          تفعيل بطاقة الولاء
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="عدد الزيارات للمكافأة" htmlFor="loyalty_goal">
            <Input id="loyalty_goal" name="loyalty_goal" type="number" min="1" defaultValue={r.loyalty_goal ?? ""} />
          </Field>
          <Field label="المكافأة" htmlFor="loyalty_reward">
            <Input id="loyalty_reward" name="loyalty_reward" defaultValue={r.loyalty_reward ?? ""} placeholder="مثال: مشروب مجاني" />
          </Field>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
        </Button>
        {state.error && <span className="text-sm text-danger">{state.error}</span>}
        {state.message && <span className="text-sm text-success">{state.message}</span>}
      </div>
    </form>
  );
}

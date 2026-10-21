/**
 * «شوف منيوك قبل أن تسجّل» — بطل الهبوط.
 *
 * ═══ الفكرة ═══
 *
 * الزائر تاجرٌ يسأل سؤالاً واحداً: **هل سيبدو منيوي هكذا؟** فبدل أن نصف له
 * المنتج نريه منيوه هو: يكتب اسم مطعمه، ويرفع شعاره، ويختار لونه وطابعه —
 * فيتبدّل المنيو في الجوّال أمامه وهو يكتب.
 *
 * ═══ لماذا إطارٌ لـ`/demo` لا نسخةٌ تسويقية ═══
 *
 * كانت المعاينة نسخةً ثانية من المنيو (٦٠٠ سطر) تُرسم بيدٍ أخرى، فتتأخّر عن
 * الأصل مع كل تحسين. الإطار يعرض **المنيو الحقيقي نفسه** (`/demo?embed=1`):
 * يُمرَّر ويُفتح فيه الطبق وتُضاف السلّة — وما يراه التاجر هو ما سيراه زبونه
 * حرفياً. والهويّة تصله برسالة (`postMessage`) من الأصل نفسه وحده.
 *
 * ⚠️ والشعار **لا يغادر جهاز الزائر**: رابط `blob:` محلّي يُبطَل عند تبديله
 * وعند مغادرة الصفحة — لا رفع، ولا تخزين.
 */
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/lib/icons";
import { ALL_THEMES, getTheme, isHex } from "@/lib/themes";

export type Brand = { name: string; color: string | null; theme: string; logo: string | null };

export const DEFAULT_BRAND: Brand = { name: "", color: null, theme: "dark-gold", logo: null };

/** ألوان شائعة في علامات المطاعم — والمخصّص بعدها لمن يعرف لونه. */
// سبعةٌ والمخصّص ثامنها: صفٌّ واحد على أضيق جوّال (٣٢٠px داخل البطاقة).
const SWATCHES = ["#c8102e", "#ff5a1f", "#e0a526", "#1f7a72", "#2f6b3f", "#1d4ed8", "#111113"];

/** أبعاد شاشة الجوّال الحقيقية — والإطار يصغّرها بنسبةٍ ثابتة فلا يتبدّل التخطيط. */
const SCREEN_W = 390;
const SCREEN_H = 844;
const SCALE = 0.74;

export function BrandControls({ brand, onChange }: { brand: Brand; onChange: (b: Brand) => void }) {
  const set = (patch: Partial<Brand>) => onChange({ ...brand, ...patch });

  // يُبطَل الرابط القديم عند تبديل الشعار وعند المغادرة — لا يبقى ملفٌّ معلّقاً في الذاكرة.
  const last = useRef<string | null>(null);
  useEffect(() => () => {
    if (last.current) URL.revokeObjectURL(last.current);
  }, []);

  const onLogo = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return;
    if (last.current) URL.revokeObjectURL(last.current);
    last.current = URL.createObjectURL(file);
    set({ logo: last.current });
  };

  const accent = brand.color ?? getTheme(brand.theme).vars["--m-accent"];

  return (
    <div className="rounded-[20px] border border-line bg-panel p-4 text-start shadow-[0_18px_40px_-28px_rgba(0,0,0,.35)] sm:p-5">
      <p className="flex items-center gap-2 text-sm font-bold text-ink">
        <Icon name="sparkle" size={16} className="text-gold" />
        جرّبه على مطعمك — المنيو يتغيّر وأنت تكتب
      </p>

      <div className="mt-3 flex gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">اسم مطعمك</span>
          {/* ‏16px: أصغر منها يجعل آيفون يكبّر الصفحة عند الكتابة. */}
          <input
            value={brand.name}
            onChange={(e) => set({ name: e.target.value.slice(0, 40) })}
            placeholder="اسم مطعمك"
            autoComplete="organization"
            className="h-12 w-full rounded-[12px] border border-line bg-page px-4 text-base text-ink outline-none transition-colors placeholder:text-faint focus:border-ink/40"
          />
        </label>
        <label className="press flex h-12 shrink-0 cursor-pointer items-center gap-2 rounded-[12px] border border-line bg-page px-3.5 text-sm font-bold text-ink transition-colors hover:border-ink/35 focus-within:border-ink/40">
          {brand.logo ? (
            <img src={brand.logo} alt="" className="h-7 w-7 rounded-md object-cover" />
          ) : (
            <Icon name="upload" size={18} />
          )}
          <span className="hidden sm:inline">{brand.logo ? "غيّر الشعار" : "ارفع شعارك"}</span>
          <span className="sm:hidden">الشعار</span>
          <input type="file" accept="image/*" onChange={onLogo} className="sr-only" />
        </label>
      </div>

      <p className="mt-4 text-xs font-bold text-dim">لون علامتك</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2" role="radiogroup" aria-label="لون علامتك">
        {SWATCHES.map((c) => {
          const on = brand.color === c;
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={c}
              onClick={() => set({ color: on ? null : c })}
              className={cn(
                "h-8 w-8 rounded-full transition-transform hover:scale-105 sm:h-9 sm:w-9",
                on && "ring-2 ring-ink ring-offset-2 ring-offset-panel"
              )}
              style={{ background: c, boxShadow: "inset 0 0 0 1px rgba(0,0,0,.12)" }}
            />
          );
        })}
        {/* المخصّص: دائرة طيفٍ تفتح منتقي النظام — ومن يعرف لونه يجده. */}
        <label
          className={cn(
            "relative h-8 w-8 cursor-pointer overflow-hidden rounded-full transition-transform hover:scale-105 sm:h-9 sm:w-9",
            brand.color && !SWATCHES.includes(brand.color) && "ring-2 ring-ink ring-offset-2 ring-offset-panel"
          )}
          style={{ background: "conic-gradient(#ef4444,#f59e0b,#22c55e,#06b6d4,#6366f1,#d946ef,#ef4444)" }}
          title="لون آخر"
        >
          <span className="sr-only">لون آخر</span>
          <input
            type="color"
            value={isHex(accent ?? "") ? accent : "#d4a843"}
            onChange={(e) => set({ color: e.target.value })}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
      </div>

      <p className="mt-4 text-xs font-bold text-dim">الطابع</p>
      <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label="طابع المنيو">
        {ALL_THEMES.map((t) => {
          const on = brand.theme === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => set({ theme: t.id })}
              title={t.tagline}
              className={cn(
                "press flex h-11 items-center justify-center gap-2 rounded-[11px] border text-sm font-bold transition-colors",
                on ? "border-ink bg-ink text-page" : "border-line bg-page text-dim hover:text-ink"
              )}
            >
              <span
                aria-hidden="true"
                className="h-3.5 w-3.5 shrink-0 rounded-full"
                style={{ background: t.vars["--m-bg"], boxShadow: `inset 0 0 0 3px ${t.vars["--m-accent"]}` }}
              />
              {t.name}
            </button>
          );
        })}
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-faint">
        <Icon name="lock" size={13} /> شعارك يبقى على جهازك — لا يُرفع إلى أي مكان.
      </p>
    </div>
  );
}

/**
 * الجوّال: إطارٌ ثابت المقاس فيه المنيو الحقيقي بمقاس شاشة آيفون، مصغّراً.
 * الرسالة تُرسَل بعد أن يُعلن الإطار جاهزيته، ثم مع كل تغيير بعد مهلة قصيرة
 * (الكتابة حرفاً حرفاً لا تستحق إعادة رسم لكل ضغطة).
 */
export function PhoneMenu({ brand }: { brand: Brand }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      if ((e.data as { type?: string } | null)?.type === "cm-ready") setReady(true);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = window.setTimeout(() => {
      frame.current?.contentWindow?.postMessage(
        { type: "cm-brand", name: brand.name, color: brand.color, theme: brand.theme, logo: brand.logo },
        window.location.origin
      );
    }, 120);
    return () => window.clearTimeout(t);
  }, [brand, ready]);

  const w = Math.round(SCREEN_W * SCALE);
  const h = Math.round(SCREEN_H * SCALE);

  return (
    <div className="mx-auto w-fit">
      <div
        className="relative rounded-[46px] bg-[#0d0d0f] p-[10px] shadow-[0_40px_80px_-30px_rgba(0,0,0,.55),inset_0_0_0_1px_rgba(255,255,255,.08)]"
        dir="ltr"
      >
        <div className="relative overflow-hidden rounded-[36px] bg-[#141210]" style={{ width: w, height: h }}>
          {!ready && <div className="skeleton absolute inset-0" aria-hidden="true" />}
          <iframe
            ref={frame}
            src="/demo?embed=1"
            title="معاينة منيو مطعمك"
            className={cn("absolute left-0 top-0 border-0 transition-opacity duration-300", ready ? "opacity-100" : "opacity-0")}
            style={{ width: SCREEN_W, height: SCREEN_H, transform: `scale(${SCALE})`, transformOrigin: "0 0" }}
          />
          {/* الجزيرة: حلية جوّال لا تُغطّي إلا الغلاف، ولا تلتقط اللمس. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-2 h-[22px] w-[86px] -translate-x-1/2 rounded-full bg-[#0d0d0f]"
          />
        </div>
      </div>
    </div>
  );
}

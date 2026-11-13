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
import { Link } from "react-router-dom";
import { useFirstInteraction, useNearViewport } from "@/lib/useNearViewport";
import { cn } from "@/lib/utils";
import { Icon } from "@/lib/icons";
import { ALL_THEMES, getTheme, isHex, type MenuTheme } from "@/lib/themes";
import type { DemoKind } from "@/lib/demoMenus";

/**
 * هويّة الزائر في الجوّال. و`kind` (٢٠٢٦/١١/١١) منيو نوعه من «وش نوع مطعمك؟» —
 * يصل الإطار برسالة لا برابط، فلا يُعاد بناؤه مع كل نقرة. بلا `kind` يبقى منيو الرابط.
 */
export type Brand = { name: string; color: string | null; theme: string; logo: string | null; kind?: DemoKind };

export const DEFAULT_BRAND: Brand = { name: "", color: null, theme: "dark-gold", logo: null };

/** ألوان شائعة في علامات المطاعم — والمخصّص بعدها لمن يعرف لونه. */
// سبعةٌ والمخصّص ثامنها: صفٌّ واحد على أضيق جوّال (٣٢٠px داخل البطاقة).
const SWATCHES = ["#c8102e", "#ff5a1f", "#e0a526", "#1f7a72", "#2f6b3f", "#1d4ed8", "#111113"];

/** أبعاد شاشة الجوّال الحقيقية — والإطار يصغّرها بنسبةٍ ثابتة فلا يتبدّل التخطيط. */
const SCREEN_W = 390;
const SCREEN_H = 844;
const SCALE = 0.74;

export function BrandControls({
  brand,
  onChange,
  themes = ALL_THEMES,
  themesLabel = "الطابع",
}: {
  brand: Brand;
  onChange: (b: Brand) => void;
  /**
   * الطوابع المعروضة — الهبوط يمرّر طوابع نوع الزائر (٤–٩) لا الثمانية والثلاثين:
   * جدار أزرارٍ بعشرة صفوف كان يدفع زرّ التجربة ١٩٠٠px تحت أوّل شاشة (٢٠٢٦/١١/١١).
   */
  themes?: readonly MenuTheme[];
  themesLabel?: string;
}) {
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
                "hit h-8 w-8 rounded-full transition-transform hover:scale-105 sm:h-9 sm:w-9",
                on && "ring-2 ring-ink ring-offset-2 ring-offset-panel"
              )}
              style={{ background: c, boxShadow: "inset 0 0 0 1px rgba(0,0,0,.12)" }}
            />
          );
        })}
        {/* المخصّص: دائرة طيفٍ تفتح منتقي النظام — ومن يعرف لونه يجده. */}
        <label
          className={cn(
            "hit h-8 w-8 cursor-pointer rounded-full transition-transform hover:scale-105 sm:h-9 sm:w-9",
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

      <p className="mt-4 text-xs font-bold text-dim">{themesLabel}</p>
      {/* أربعة أعمدة (ستّة على الشاشة العريضة) — كانت خمسةً حتى ٠٩/١١، فتركت الستّة والثلاثون طابعاً
          وحيداً في آخر صفّ. والثمانية والثلاثون (١١/١١) آخر صفّها اثنان على الاثنين: لا طابع وحيد.
          وفي الخانة يعلو الاسمَ قرصُ لون الطابع: أرضيته وحلقة تمييزه، فتُقرأ الشبكة
          لوحةَ ألوانٍ قبل أن تُقرأ أسماءً (تدقيق ٢٠٢٦/١١/٠٧). */}
      <div className="mt-2 grid grid-cols-4 gap-1.5 sm:grid-cols-6 sm:gap-2" role="radiogroup" aria-label="طابع المنيو">
        {themes.map((t) => {
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
                "press flex h-[3.6rem] min-w-0 flex-col items-center justify-center gap-1 rounded-[11px] border px-1 text-[12.5px] font-bold leading-none transition-colors",
                on ? "border-ink bg-ink text-page" : "border-line bg-page text-dim hover:text-ink"
              )}
            >
              <span
                aria-hidden="true"
                className="h-4 w-4 shrink-0 rounded-full"
                style={{
                  background: t.vars["--m-bg"],
                  boxShadow: `inset 0 0 0 3.5px ${t.vars["--m-accent"]}, 0 0 0 1px rgba(0,0,0,.08)`,
                }}
              />
              {/* يلتفّ ولا يُقصّ: «لوحة حروف» أعرض من خانتها على ٣٦٠ — سطران فيها
                  أوضح من «لوحة حـ…». */}
              <span className="max-w-full text-center leading-[1.15] [text-wrap:balance] max-[359px]:text-[11.5px]">
                {t.name}
              </span>
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
 *
 * ‏`src` يُثبَّت عند أوّل رسم: النوع والطابع بعده **برسالة** — تغيير الرابط كان
 * سيبني نسخة التطبيق الثانية من الصفر مع كل نقرة على «وش نوع مطعمك؟».
 * و`onReady` لجولة البطل: لا تدور الأنواع على هيكلٍ فارغ.
 */
export function PhoneMenu({
  brand,
  kind,
  onReady,
  peek = 0,
  tapHref,
}: {
  brand: Brand;
  kind?: DemoKind;
  onReady?: () => void;
  /** يزيد ⇒ «لمحة»: يُمرَّر المنيو قليلاً ويعود فيُرى الطابع يتحرّك (جولة البطل وحدها). */
  peek?: number;
  /**
   * على شاشات اللمس: الإطار يبتلع تمرير الصفحة (الإصبع فوقه يمرّر المنيو لا الهبوط)،
   * وجوّالٌ داخل جوّال تجربةٌ مصغّرة بلا داعٍ. فغطاءٌ شفّاف يترك التمرير للصفحة،
   * والضغطة تفتح المنيو نفسه بملء الشاشة.
   */
  tapHref?: string;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  // الإطار نسخةٌ ثانية من التطبيق كلّه — وكان وحده كلَّ زمن الحجب في الهبوط.
  // فلا يُحمَّل قبل أن يظهر وبعد `load`، ولا قبل أوّل تفاعلٍ من الزائر (أو أربع
  // ثوانٍ من السكون). ومقاسه ثابت والهيكل مكانه، فلا قفزة حين يصل
  // (`lib/useNearViewport.ts`، تدقيق ٢٠٢٦/١١/٠٩ البند ٣).
  const visible = useNearViewport(box, { rootMargin: "200px", afterLoad: true });
  const woke = useFirstInteraction(4000);
  const near = visible && woke;
  const [src] = useState(() => {
    const q = new URLSearchParams({ embed: "1" });
    const k = kind ?? brand.kind;
    if (k) q.set("kind", k);
    if (brand.kind && brand.theme) q.set("theme", brand.theme);
    return `/demo?${q.toString()}`;
  });
  const readyCb = useRef(onReady);
  useEffect(() => {
    readyCb.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      if ((e.data as { type?: string } | null)?.type === "cm-ready") {
        setReady(true);
        readyCb.current?.();
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = window.setTimeout(() => {
      frame.current?.contentWindow?.postMessage(
        { type: "cm-brand", name: brand.name, color: brand.color, theme: brand.theme, logo: brand.logo, kind: brand.kind },
        window.location.origin
      );
    }, 120);
    return () => window.clearTimeout(t);
  }, [brand, ready]);

  useEffect(() => {
    if (!ready || !peek) return;
    // بعد الرسالة وإعادة رسم المنيو بنوعه — لا قبلها فتُمرَّر شجرةٌ تُستبدل.
    const t = window.setTimeout(() => {
      frame.current?.contentWindow?.postMessage({ type: "cm-peek" }, window.location.origin);
    }, 900);
    return () => window.clearTimeout(t);
  }, [peek, ready]);

  const w = Math.round(SCREEN_W * SCALE);
  const h = Math.round(SCREEN_H * SCALE);
  // مسحة عند تبديل النوع أو الطابع: الإطار يُعاد رسمه دفعةً، والمسحة تجعلها «تحوّلاً» لا ومضة.
  const flip = `${brand.kind ?? ""}:${brand.theme}`;

  return (
    <div className="mx-auto w-fit">
      <div
        className="phone-shell relative rounded-[46px] bg-[#0d0d0f] p-[10px] shadow-[0_40px_80px_-30px_rgba(0,0,0,.55),inset_0_0_0_1px_rgba(255,255,255,.08)]"
        dir="ltr"
      >
        <div ref={box} className="relative overflow-hidden rounded-[36px] bg-[#141210]" style={{ width: w, height: h }}>
          {!ready && <div className="skeleton absolute inset-0" aria-hidden="true" />}
          {near && <iframe
            ref={frame}
            src={src}
            title="معاينة منيو مطعمك"
            className={cn("absolute left-0 top-0 border-0 transition-opacity duration-300", ready ? "opacity-100" : "opacity-0")}
            style={{ width: SCREEN_W, height: SCREEN_H, transform: `scale(${SCALE})`, transformOrigin: "0 0" }}
          />}
          {ready && <span key={flip} aria-hidden="true" className="phone-wipe pointer-events-none absolute inset-0" />}
          {tapHref && (
            <Link
              to={tapHref}
              dir="rtl"
              className="absolute inset-0 z-10 hidden items-center justify-center [@media(hover:none)]:flex"
            >
              <span className="rounded-full bg-[#0d0d0f]/85 px-4 py-2.5 text-sm font-black text-white shadow-lg">
                جرّبه على جوّالك ←
              </span>
            </Link>
          )}
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

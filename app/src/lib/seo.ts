/**
 * وسوم الصفحة لكل مسار — بمصدر واحد.
 *
 * ═══ ما كان قبلها ═══
 *
 * اثنان وعشرون موضعاً يكتبون `document.title = "…"` بيدهم، و**صفر** منهم يكتب
 * وصفاً أو `canonical` أو وسم مشاركة. فكل مسار — منيو تاجر، ومقال، والديمو —
 * يتقاسم وصف الصفحة الرئيسية نفسه.
 *
 * ═══ ⚠️ وما لا تفعله هذه الوحدة ═══
 *
 * **لا تُغني عن الوسوم الساكنة في `index.html`.** واتساب وتويتر وتيليقرام لا
 * تشغّل جافاسكربت إطلاقاً: تقرأ ملفّ HTML وتغلقه. فما تكتبه هذه الوحدة يراه
 * **قوقل وحده** (وهو يشغّل JS). القاعدة العملية:
 *
 *   · الوسوم الساكنة = بطاقة المشاركة على واتساب.
 *   · هذه الوحدة     = عنوان ووصف كل مسار في نتائج البحث.
 *
 * والحلّ الكامل تصييرٌ مسبق للمسارات العامّة — وهو خارج نطاق هذه الجولة،
 * ومكتوب في تقرير الجاهزية.
 *
 * ═══ النطاق ═══
 *
 * يُقرأ من `SITE_URL` في `config.ts` — مصدر واحد. فيوم يُربَط نطاق مخصّص،
 * تتبعه كل الروابط الكنسية والمطلقة بتغيير سطر واحد لا بمطاردة نصوص.
 */
import { useEffect } from "react";
import { SITE_NAME, SITE_URL } from "./config";

const BASE = SITE_URL.replace(/\/+$/, "");

/** يبني رابطاً مطلقاً — الروابط النسبية لا تصلح في `canonical` ولا `og:url`. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${BASE}/${String(path).replace(/^\/+/, "")}`;
}

/**
 * يقصّ الوصف عند حدّ معقول.
 *
 * قوقل يقطع ما يتجاوز ~١٦٠ محرفاً، والقطع في منتصف كلمة يُقرأ عطلاً. فيُقصّ
 * عند آخر مسافة قبل الحدّ، ويُختم بعلامة حذف.
 */
export function clampDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * يضبط وسماً واحداً، ويُنشئه إن لم يوجد.
 *
 * ⚠️ يُوسَم كل وسم يُنشئه بـ`data-seo` كي **يُنظَّف عند مغادرة المسار**. بدون
 * ذلك يتراكم ما تكتبه الصفحات على بعضها: زائر يمرّ بمنيو مطعم ثم بالمدوّنة
 * يبقى في صفحته وسمُ `og:type=restaurant` من الصفحة السابقة. أما الوسوم
 * الساكنة الأصلية فلا تحمل السمة، فتبقى قيمتها الأولى مرجعاً يُعاد إليه.
 */
function setTag(selector: string, create: () => HTMLElement, value: string): void {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    el.setAttribute("data-seo", "");
    document.head.appendChild(el);
  }
  if (el.tagName === "LINK") el.setAttribute("href", value);
  else el.setAttribute("content", value);
}

function meta(name: string, value: string): void {
  setTag(`meta[name="${name}"]`, () => {
    const el = document.createElement("meta");
    el.setAttribute("name", name);
    return el;
  }, value);
}

function property(prop: string, value: string): void {
  setTag(`meta[property="${prop}"]`, () => {
    const el = document.createElement("meta");
    el.setAttribute("property", prop);
    return el;
  }, value);
}

export type Seo = {
  /** بلا اسم المنصّة — يُلحق هنا كي لا يتكرّر في اثنين وعشرين موضعاً. */
  title: string;
  description?: string;
  /** مسار نسبي أو رابط كامل. يُترك فارغاً للصفحات التي لا تُفهرَس. */
  path?: string;
  image?: string;
  type?: "website" | "article" | "restaurant";
  /** يمنع الفهرسة — للوحات والصفحات الخاصّة. */
  noindex?: boolean;
};

/**
 * يضبط وسوم المسار الحالي، ويرجعها عند الخروج.
 *
 * `deps` ليست ترفاً: بيانات المنيو والمقال تصل **بعد** التصيير الأول، فلو
 * ضُبطت الوسوم مرّة واحدة لبقي عنوان الصفحة «جارٍ التحميل» في نتائج البحث.
 */
export function useSeo(seo: Seo | null): void {
  const key = seo ? JSON.stringify(seo) : "";

  useEffect(() => {
    if (!seo) return;
    const full = `${seo.title} — ${SITE_NAME}`;
    document.title = full;

    const desc = seo.description ? clampDescription(seo.description) : "";
    if (desc) {
      meta("description", desc);
      property("og:description", desc);
      meta("twitter:description", desc);
    }

    property("og:title", full);
    meta("twitter:title", full);
    property("og:type", seo.type === "article" ? "article" : "website");

    if (seo.path) {
      const url = absoluteUrl(seo.path);
      property("og:url", url);
      setTag('link[rel="canonical"]', () => {
        const el = document.createElement("link");
        el.setAttribute("rel", "canonical");
        return el;
      }, url);
    }

    if (seo.image) {
      const img = absoluteUrl(seo.image);
      property("og:image", img);
      meta("twitter:image", img);
    }

    // `noindex` يُكتب ويُمحى: لوحة التحكّم لا تُفهرَس، والمنيو العام يجب ألّا
    // يرث المنع من لوحة زارها التاجر قبله في الجلسة نفسها.
    if (seo.noindex) meta("robots", "noindex, nofollow");
    else document.head.querySelector('meta[name="robots"][data-seo]')?.remove();

    return () => {
      for (const el of document.head.querySelectorAll("[data-seo]")) el.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

/* ── البيانات المنظّمة (JSON-LD) ──────────────────────────────────────
 *
 * صفر بيانات منظّمة كانت على الموقع، بينما **أربعة عشر منيو مطعم منشوراً** —
 * وهي أثمن صفحاتنا العامّة وأكثرها استحقاقاً لنتيجة غنيّة في قوقل.
 *
 * ⚠️ **لا يُبثّ حقل لا نملك قيمته.** مخطّط فيه `null` أو نصّ فارغ أسوأ من
 * غيابه: قوقل يعدّه بياناً منظّماً ناقصاً لا بياناً غائباً.
 */

/** يحذف المفاتيح الفارغة تعاودياً — الحارس الوحيد ضدّ مخطّط نصفه فراغ. */
function prune<T>(value: T): T {
  if (Array.isArray(value)) {
    const arr = value.map(prune).filter((v) => v !== undefined && v !== null && v !== "");
    return (arr.length ? arr : undefined) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const p = prune(v);
      if (p !== undefined && p !== null && p !== "") out[k] = p;
    }
    return (Object.keys(out).length ? out : undefined) as T;
  }
  return value;
}

/**
 * يحقن مخطّطاً واحداً ويزيله عند الخروج.
 *
 * ⚠️ المعرّف ثابت لكل مخطّط: بدونه يتراكم مخطّط لكل تصيير، فتجد الصفحة عشرة
 * مخطّطات متطابقة — وقوقل يقرؤها كلها.
 */
export function useJsonLd(id: string, data: unknown): void {
  const json = data ? JSON.stringify(prune(data)) : "";

  useEffect(() => {
    if (!json || json === "undefined") return;
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = `ld-${id}`;
    el.textContent = json;
    document.head.querySelector(`#ld-${id}`)?.remove();
    document.head.appendChild(el);
    return () => {
      document.head.querySelector(`#ld-${id}`)?.remove();
    };
  }, [id, json]);
}

export const ORGANIZATION = {
  "@type": "Organization",
  name: SITE_NAME,
  url: BASE,
  logo: absoluteUrl("/icon-512.png"),
};

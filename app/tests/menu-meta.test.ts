/**
 * دالة حقن وسوم المشاركة.
 *
 * ⚠️ **هذه الفحوص هي كل ما يحرس البند**: دالة الحافة تعمل على Deno في بيئة
 * Netlify، ولا Deno ولا Netlify CLI في بيئة التطوير — فالمنطق كلّه أُخرج إلى
 * `shared/menu-meta.mjs` ليُفحص هنا، ولم يبقَ هناك إلا: اجلب، نادِ، أعِد.
 *
 * ويُقرأ `app/index.html` **المصدر** لا `deploy/index.html`: الثاني ناتج بناء
 * لا يُلتزَم في git، فالفحص عليه ينجح محلياً ويفشل في CI. والوسوم متطابقة
 * بينهما — Vite ينسخها كما هي.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { RESERVED, escapeAttr, injectMeta, pickOgImage, slugFromPath } from "../../shared/menu-meta.mjs";

const HTML = readFileSync(fileURLToPath(new URL("../index.html", import.meta.url)), "utf8");
const SITE = "https://cloudsmenu.netlify.app";

describe("slugFromPath", () => {
  it.each([
    ["/مشراق-0e94", "مشراق-0e94"],
    ["/sa-46a3", "sa-46a3"],
    ["/%D9%85%D8%B4%D8%B1%D8%A7%D9%82-0e94", "مشراق-0e94"],
  ])("%s ⇒ منيو", (path, slug) => {
    expect(slugFromPath(path)).toBe(slug);
  });

  it.each([
    ["/", "الجذر"],
    ["/about", "محجوز"],
    ["/demo", "محجوز — ومطعم فعليّ يحمله ولا يفتحه أحد"],
    ["/Blog", "محجوز بأي حالة أحرف"],
    ["/blog/qr-menu-mistakes", "مقطعان"],
    ["/dashboard/settings", "مقطعان"],
    ["/og.png", "ملفّ"],
    ["/sw.js", "ملفّ"],
    ["/assets/index-abc.js", "أصل"],
  ])("%s ⇒ ليس منيواً (%s)", (path) => {
    expect(slugFromPath(path)).toBeNull();
  });

  it("كل مسار في RESERVED مرفوض", () => {
    for (const r of RESERVED) expect(slugFromPath(`/${r}`), r).toBeNull();
  });
});

describe("pickOgImage", () => {
  it("الغلاف يسبق الشعار", () => {
    const got = pickOgImage(
      { banner_image: "https://x/b.webp", logo_image: "https://x/l.webp" },
      SITE
    );
    expect(got).toEqual({ url: "https://x/b.webp", own: true });
  });

  it("⚠️ data URI مرفوضة — واتساب لا يجلبها", () => {
    const got = pickOgImage({ logo_image: "data:image/png;base64,AAAA", banner_image: null }, SITE);
    expect(got).toEqual({ url: `${SITE}/og.png`, own: false });
  });

  it("http غير المشفّر مرفوض", () => {
    expect(pickOgImage({ logo_image: "http://x/l.png" }, SITE).own).toBe(false);
  });

  it("المسار النسبي مرفوض — الزاحف خارجيّ", () => {
    expect(pickOgImage({ logo_image: "/uploads/l.png" }, SITE).own).toBe(false);
  });

  it("بلا صور ⇒ صورة المنصّة", () => {
    expect(pickOgImage({}, SITE).url).toBe(`${SITE}/og.png`);
    expect(pickOgImage(null, SITE).url).toBe(`${SITE}/og.png`);
  });
});

describe("escapeAttr", () => {
  it("يهرب ما يكسر السمة", () => {
    expect(escapeAttr('مطعم "الفخامة" & <b>')).toBe("مطعم &quot;الفخامة&quot; &amp; &lt;b&gt;");
  });
});

describe("injectMeta", () => {
  const rest = { name: "مطعم الديوان", description: "أكلات سعودية أصيلة" };

  it("العنوان والوسوم تحمل اسم المطعم", () => {
    const out = injectMeta(HTML, { ...rest, banner_image: "https://x/b.webp" }, SITE, "diwan");
    expect(out).toContain("<title>مطعم الديوان — المنيو</title>");
    expect(out).toContain('content="مطعم الديوان — المنيو"');
    expect(out).toContain('content="أكلات سعودية أصيلة"');
    expect(out).toContain(`href="${SITE}/diwan"`);
    expect(out).toContain(`content="${SITE}/diwan"`);
  });

  it("⚠️ الأبعاد تُحذف مع صورة التاجر — ١٢٠٠×٦٣٠ كذبٌ على شعار مربّع", () => {
    const own = injectMeta(HTML, { ...rest, banner_image: "https://x/b.webp" }, SITE, "d");
    expect(own).toContain("https://x/b.webp");
    expect(own).not.toContain("og:image:width");
    expect(own).not.toContain("og:image:height");
  });

  it("الأبعاد تبقى مع og.png — مقاسها معروف", () => {
    const fallback = injectMeta(HTML, { ...rest, logo_image: "data:image/png;base64,A" }, SITE, "d");
    expect(fallback).toContain("og:image:width");
    expect(fallback).toContain(`${SITE}/og.png`);
    expect(fallback).not.toContain("data:image");
  });

  it("تويتر يتبع og في الصورة والعنوان", () => {
    const out = injectMeta(HTML, { ...rest, banner_image: "https://x/b.webp" }, SITE, "d");
    const hits = out.match(/https:\/\/x\/b\.webp/g) ?? [];
    expect(hits.length).toBeGreaterThanOrEqual(2);
  });

  it("بلا وصف ⇒ وصف مولَّد يذكر الاسم", () => {
    const out = injectMeta(HTML, { name: "كافيه الركن" }, SITE, "rukn");
    expect(out).toMatch(/content="تصفّح منيو كافيه الركن/);
  });

  it("الاسم يُهرَب فلا ينكسر الوسم", () => {
    const out = injectMeta(HTML, { name: 'مطعم "س" & <b>' }, SITE, "x");
    expect(out).toContain("&quot;س&quot; &amp; &lt;b&gt;");
    expect(out).not.toContain('content="مطعم "س"');
  });

  it("الـslug يُرمَّز في الرابط", () => {
    const out = injectMeta(HTML, { name: "م" }, SITE, "مشراق-0e94");
    expect(out).toContain(`${SITE}/%D9%85%D8%B4%D8%B1%D8%A7%D9%82-0e94`);
  });

  it("⚠️ صفّ بلا اسم ⇒ HTML كما هو حرفياً", () => {
    expect(injectMeta(HTML, { name: "   " }, SITE, "x")).toBe(HTML);
    expect(injectMeta(HTML, {}, SITE, "x")).toBe(HTML);
    expect(injectMeta(HTML, null, SITE, "x")).toBe(HTML);
  });

  it("بنية الصفحة سليمة بعد الحقن", () => {
    const out = injectMeta(HTML, { ...rest, banner_image: "https://x/b.webp" }, SITE, "d");
    expect(out).toContain("</head>");
    expect(out).toMatch(/id="root"/);
    expect((out.match(/<title>/g) ?? []).length).toBe(1);
    // لا سمة content مكسورة في أي وسم meta
    for (const tag of out.match(/<meta\b[^>]*>/g) ?? []) {
      const contents = tag.match(/\bcontent="/g) ?? [];
      expect(contents.length, tag.slice(0, 80)).toBeLessThanOrEqual(1);
    }
  });
});

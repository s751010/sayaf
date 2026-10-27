/**
 * صفحات الشرائح (`/for/<slug>`) — **لا وعد بلا شيفرة، ولا قائمة ثانية**.
 *
 * - كل ميزةٍ تَعِد بها الصفحة تحمل دليلاً (ملفّ + نصّ) يُفتح هنا ويُبحث فيه:
 *   حُذفت الميزة أو أُعيدت تسميتها ⇐ يسقط الفحص قبل أن يقرأ التاجر وعداً ميتاً.
 * - الطوابع من `SUGGESTED` نفسها التي يرتّب بها المُنتقي — لا نسخة بيد.
 * - `for` محجوزة كي لا يأخذها تاجر، ومسار الشريحة ليس منيواً عند الحافة.
 * - الخريطتان (المولِّد والاحتياطية) تعرفان كل صفحة.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SEGMENTS, segmentBySlug, segmentThemeIds, segmentThemes, linkLabel } from "@/lib/segments";
import { SEGMENT_BASE, SEGMENT_LINKS, segmentPath } from "@/lib/segmentLinks";
import { SUGGESTED, suggestionKey } from "@/lib/themeSuggest";
import { STARTER_TYPES } from "@/lib/starterMenus";
import { ALL_THEMES } from "@/lib/themes";
import { PLANS } from "@/lib/plans";
import { RESERVED, slugError, slugFromRequest } from "../../shared/menu-url.mjs";

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
const src = (rel: string) => read(`../src/${rel}`);
const ARTICLES = JSON.parse(src("content/articles.json")) as { slug: string }[];

describe("الشرائح — المحتوى والروابط", () => {
  it("ثلاث شرائح، ولكلّ رابطٍ في الذيل محتوى (والعكس)", () => {
    expect(SEGMENTS.map((s) => s.slug).sort()).toEqual(SEGMENT_LINKS.map((l) => l.slug).sort());
    expect(SEGMENTS.length).toBe(3);
    for (const s of SEGMENTS) {
      expect(segmentBySlug(s.slug)).toBe(s);
      expect(linkLabel(s.slug), "شارة الصفحة = نصّ رابط الذيل").toBe(s.label);
      expect(segmentPath(s.slug)).toBe(`${SEGMENT_BASE}/${s.slug}`);
    }
    expect(segmentBySlug("nope")).toBeNull();
    expect(segmentBySlug(undefined)).toBeNull();
  });

  it("نوع النشاط قيمةٌ يختارها التاجر فعلاً في نموذج إنشاء المطعم", () => {
    for (const s of SEGMENTS) expect(STARTER_TYPES, s.slug).toContain(s.typeKey);
  });

  it("الطوابع هي ما يضعه المُنتقي أوّلاً لذلك النوع — من `SUGGESTED` لا بيد", () => {
    for (const s of SEGMENTS) {
      const ids = segmentThemeIds(s);
      expect(ids).toEqual(SUGGESTED[suggestionKey(s.typeKey)]);
      // كل معرّف طابعٌ قائم — فلا يسقط شيءٌ بصمت في `segmentThemes`.
      expect(segmentThemes(s).map((t) => t.id)).toEqual([...ids]);
      for (const id of ids) expect(ALL_THEMES.some((t) => t.id === id), id).toBe(true);
    }
    // الكافيه المختصّ لا الشعبي: «كافيه» بلا تلميح شعبي ⇐ صفّ المختصّ.
    expect(suggestionKey(segmentBySlug("specialty-coffee")!.typeKey)).toBe("كافيه");
  });

  it.each(SEGMENTS.flatMap((s) => s.features.flatMap((f) => f.proof.map((p) => [s.slug, f.title, p.file, p.needle]))))(
    "%s · «%s» ⇐ %s يحوي %s",
    (_slug, _title, file, needle) => {
      expect(src(file), `الوعد بلا دليل: ${needle} غير موجود في ${file}`).toContain(needle);
    }
  );

  it("كل ميزة لها دليلٌ واحد على الأقلّ", () => {
    for (const s of SEGMENTS) for (const f of s.features) expect(f.proof.length, f.title).toBeGreaterThan(0);
  });

  it("المقالات المقترحة موجودة في المدونة الثابتة", () => {
    const slugs = ARTICLES.map((a) => a.slug);
    for (const s of SEGMENTS) for (const a of s.articles) expect(slugs, `${s.slug} → ${a}`).toContain(a);
  });

  it("لا سعر مكتوب ولا ادّعاء امتثال في النصوص", () => {
    const prices = PLANS.flatMap((p) => [p.monthly, p.yearly]).map(String);
    for (const s of SEGMENTS) {
      const text = JSON.stringify(s);
      for (const p of prices) expect(text, `${s.slug}: سعر ${p} مكتوب بيد`).not.toMatch(new RegExp(`(?<!\\d)${p}(?!\\d)`));
      expect(text, s.slug).not.toMatch(/ممتثل|معتمد من|متوافق مع الهيئة|مجاناً للأبد/);
    }
  });
});

describe("`/for` لا يصطدم برابط منيو", () => {
  it("`for` محجوزة: لا يأخذها تاجر رابطاً", () => {
    expect(RESERVED.has("for")).toBe(true);
    expect(slugError("for")).toBe("هذا الاسم محجوز — اختر غيره.");
  });

  it("مسار الشريحة ليس منيواً عند الحافة ولا في المتصفّح", () => {
    expect(slugFromRequest("example.netlify.app", "/for")).toBeNull();
    for (const l of SEGMENT_LINKS) {
      expect(slugFromRequest("example.netlify.app", segmentPath(l.slug))).toBeNull();
    }
  });

  it("الراوتر يعرّف المسار قبل `/:slug`", () => {
    const app = src("App.tsx");
    const seg = app.indexOf('path="/for/:segment"');
    expect(seg).toBeGreaterThan(-1);
    expect(seg).toBeLessThan(app.indexOf('path="/:slug"'));
    expect(app).toMatch(/lazy\(\(\) => import\("@\/pages\/Segment"\)\)/);
  });
});

describe("خريطة الموقع", () => {
  it.each([
    ["المولِّد", "../scripts/sitemap.mjs", (p: string) => `loc: "${p}"`],
    ["الاحتياطية", "../public/sitemap.xml", (p: string) => `${p}</loc>`],
  ])("%s تعرف كل صفحة شريحة", (_name, rel, needle) => {
    const text = read(rel);
    for (const l of SEGMENT_LINKS) expect(text, l.slug).toContain(needle(segmentPath(l.slug)));
  });
});

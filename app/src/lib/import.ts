/**
 * استيراد الأصناف دفعة واحدة — منطق خالص بلا React.
 *
 * السبب: التاجر عنده منيو ورقي أو ملف Excel، وإدخال ٦٠ صنفاً واحداً واحداً هو
 * أكبر سبب تسرّب في المنتج. هنا نقرأ ما يملكه فعلاً: نصّاً ملصوقاً أو CSV.
 *
 * ملاحظة عن Excel: لا نقرأ `.xlsx` الثنائي (يحتاج مكتبة ثقيلة). الطريقان
 * المدعومان يغطّيانه عملياً — تصدير CSV، أو **نسخ الخلايا ولصقها مباشرة**
 * فتصل مفصولة بـ Tab ويلتقطها `parseMenuText`.
 */
import { normalizeDigits, numOrNull, strOrNull } from "./utils";
import { matchKnownCategory } from "./categories";
import type { DishPayload } from "./data";

export type ParsedRow = {
  name: string;
  /** `null` = لم نجد سعراً في السطر؛ الصف يحتاج تدخّل التاجر قبل الحفظ. */
  price: number | null;
  category: string | null;
  description: string | null;
  emoji: string;
  /** رقم السطر في المصدر — لعرضه في جدول المراجعة. */
  line: number;
};

/* ── تنظيف السعر ──────────────────────────────────────────────────── */

/** وحدات العملة التي يكتبها التاجر بجوار الرقم وتفسد التحويل. */
const CURRENCY = /(ر\.?\s?س|ريال|ريالاً|SAR|SR|﷼|\brs\b)/gi;

/** يزيل رمز العملة والزخارف ويترك رقماً قابلاً للتحويل. */
function priceOf(raw: string): number | null {
  const cleaned = normalizeDigits(raw).replace(CURRENCY, " ").replace(/[.\-–—:]+$/g, " ");
  // آخر رقم في المقطع هو السعر عادةً: «كبسة لحم عرضنا 45» → 45.
  const matches = cleaned.match(/\d+(?:[.,٫]\d{1,2})?/g);
  if (!matches) return null;
  return numOrNull(matches[matches.length - 1]);
}

/** يحذف السعر (وما حوله من عملة) من السطر ليتبقّى الاسم. */
function stripPrice(raw: string, price: number): string {
  const normalized = normalizeDigits(raw);
  const idx = normalized.lastIndexOf(String(price).replace(/\.0+$/, ""));
  const base = idx >= 0 ? normalized.slice(0, idx) : normalized;
  return base.replace(CURRENCY, " ").replace(/[\s.\-–—:،|]+$/g, "").trim();
}

/* ── الإيموجي المقترح ─────────────────────────────────────────────── */

const EMOJI_HINTS: [RegExp, string][] = [
  [/برجر|برغر|burger/i, "🍔"],
  [/بيتزا|pizza/i, "🍕"],
  [/دجاج|فراخ|بروست|chicken/i, "🍗"],
  [/لحم|ستيك|كباب|steak|meat/i, "🥩"],
  [/روبيان|جمبري|سمك|فيليه|shrimp|fish/i, "🍤"],
  [/باستا|مكرونة|معكرونة|pasta/i, "🍝"],
  [/سلطة|فتوش|تبولة|salad/i, "🥗"],
  [/كبسة|مندي|مظبي|رز|أرز|برياني|rice/i, "🍚"],
  [/شاورما|راب|تورتيلا|wrap/i, "🌯"],
  [/فلافل|كبة|سمبوسة|معجنات/i, "🧆"],
  [/كيك|تشيز|حلى|حلا|كنافة|بسبوسة|cake|dessert/i, "🍰"],
  [/دونات|كوكيز|براوني|donut|cookie/i, "🍩"],
  [/قهوة|إسبريسو|اسبريسو|لاتيه|كابتشينو|أمريكانو|coffee|latte/i, "☕"],
  [/شاي|ماتشا|موهيتو|tea|matcha/i, "🧋"],
  [/عصير|ليمون|مشروب|صودا|بيبسي|كولا|ماء|juice|soda/i, "🥤"],
  [/موكتيل|كوكتيل|سموذي|smoothie/i, "🍹"],
];

/** إيموجي مبدئي من اسم الصنف — التاجر يعدّله لاحقاً بضغطة. */
export function suggestEmoji(name: string): string {
  for (const [re, emoji] of EMOJI_HINTS) if (re.test(name)) return emoji;
  return "🍽";
}

/* ── تطبيع التصنيف ────────────────────────────────────────────────── */

/**
 * يطابق التصنيف المكتوب بتصنيف معروف إن كانا نفس الشيء.
 * هذا ما يمنع أن يصبح «مشاوي» و«المشاوي» تصنيفين منفصلين في المنيو.
 */
export function normalizeCategory(raw: string, known: string[]): string {
  const v = raw.trim().replace(/[:：]\s*$/, "");
  if (!v) return v;
  return matchKnownCategory(v, known) ?? v;
}

/* ── محلّل النص الملصوق ───────────────────────────────────────────── */

/** فواصل الأعمدة المدعومة: Tab (لصق Excel) و | و ؛ */
const COLUMN_SPLIT = /\t|\s*[|؛;]\s*/;

/**
 * يقرأ قائمة ملصوقة سطراً سطراً.
 *
 * صيغتان تعملان معاً في نفس اللصقة:
 *  - أعمدة:  `كبسة دجاج | 45 | مشاوي | وصف اختياري`
 *  - سطر حر: `كبسة دجاج 45 ر.س`  (السعر = آخر رقم)
 *
 * وأي سطر **بلا رقم إطلاقاً** يُعامل عنوانَ تصنيف يسري على ما بعده — هكذا
 * يكتب التاجر منيوه الورقي فعلاً.
 */
export function parseMenuText(raw: string, known: string[] = []): ParsedRow[] {
  const rows: ParsedRow[] = [];
  let current: string | null = null;
  /**
   * كل عنوان تصنيف وعدد ما تبعه من أصناف. العنوان الذي لم يتبعه شيء ليس
   * تصنيفاً في الغالب بل صنفاً نسي التاجر سعره — نُظهره في جدول المراجعة
   * بسعر فارغ بدل أن يختفي بصمت.
   */
  const headings: { name: string; line: number; count: number }[] = [];

  raw.split(/\r?\n/).forEach((rawLine, i) => {
    const line = rawLine.trim();
    if (!line) return;

    const cols = line.split(COLUMN_SPLIT).map((c) => c.trim());
    if (cols.length > 1) {
      const price = priceOf(cols[1] ?? "");
      const category = strOrNull(cols[2] ?? "");
      rows.push({
        name: cols[0],
        price,
        category: category ? normalizeCategory(category, known) : current,
        description: strOrNull(cols[3] ?? ""),
        emoji: suggestEmoji(cols[0]),
        line: i + 1,
      });
      if (headings.length) headings[headings.length - 1].count++;
      return;
    }

    const price = priceOf(line);
    if (price === null) {
      current = normalizeCategory(line, known);
      headings.push({ name: current, line: i + 1, count: 0 });
      return;
    }
    const name = stripPrice(line, price);
    // سطر يحمل رقماً بلا اسم (فاصل، رقم صفحة…) — لا يصلح صنفاً ولا تصنيفاً.
    if (!name) return;
    rows.push({
      name,
      price,
      category: current,
      description: null,
      emoji: suggestEmoji(name),
      line: i + 1,
    });
    if (headings.length) headings[headings.length - 1].count++;
  });

  // عناوين بلا أصناف تحتها → أصناف بلا سعر، تُدرج في مكانها الأصلي.
  const orphans = headings
    .filter((h) => h.count === 0)
    .map((h) => ({
      name: h.name,
      price: null,
      category: null,
      description: null,
      emoji: suggestEmoji(h.name),
      line: h.line,
    }));

  return [...rows, ...orphans].sort((a, b) => a.line - b.line);
}

/* ── محلّل CSV ────────────────────────────────────────────────────── */

/** تقسيم سطر CSV يحترم الاقتباس المزدوج (`"كبسة، لحم",45`). */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === "," || ch === ";" || ch === "\t") {
      out.push(field.trim());
      field = "";
    } else field += ch;
  }
  out.push(field.trim());
  return out;
}

const HEADERS: Record<keyof Pick<ParsedRow, "name" | "price" | "category" | "description">, RegExp> = {
  name: /^(اسم|الاسم|الصنف|الطبق|name|item|dish)/i,
  price: /^(سعر|السعر|price|amount)/i,
  category: /^(تصنيف|التصنيف|قسم|القسم|category|section)/i,
  description: /^(وصف|الوصف|تفاصيل|description|desc)/i,
};

/**
 * يقرأ CSV مُصدَّراً من Excel أو Google Sheets.
 * بلا صفّ ترويسة يُفترض الترتيب: الاسم، السعر، التصنيف، الوصف.
 */
export function parseMenuCsv(text: string, known: string[] = []): ParsedRow[] {
  // BOM من Excel يلتصق بأول عنوان فيمنع مطابقته.
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];

  const first = splitCsvLine(lines[0]);
  const map = { name: 0, price: 1, category: 2, description: 3 };
  let start = 0;

  const isHeader = first.some((c) => HEADERS.name.test(c) || HEADERS.price.test(c));
  if (isHeader) {
    start = 1;
    (Object.keys(HEADERS) as (keyof typeof HEADERS)[]).forEach((key) => {
      const idx = first.findIndex((c) => HEADERS[key].test(c));
      map[key] = idx; // -1 = العمود غير موجود، ويُقرأ لاحقاً كفراغ
    });
  }

  const at = (cols: string[], idx: number) => (idx >= 0 ? cols[idx] ?? "" : "");

  return lines.slice(start).flatMap((line, i) => {
    const cols = splitCsvLine(line);
    const name = at(cols, map.name).trim();
    if (!name) return [];
    const category = strOrNull(at(cols, map.category));
    return [
      {
        name,
        price: priceOf(at(cols, map.price)),
        category: category ? normalizeCategory(category, known) : null,
        description: strOrNull(at(cols, map.description)),
        emoji: suggestEmoji(name),
        line: start + i + 1,
      },
    ];
  });
}

/* ── الصف → payload ───────────────────────────────────────────────── */

/**
 * ⚠️ يجب أن يملأ **كل** مفاتيح `DishPayload` حرفياً.
 *
 * PostgREST يُدرج المصفوفة صفوفاً دفعةً واحدة، وإن اختلفت مجموعة المفاتيح بين
 * عناصرها فشل الطلب كاملاً. النوع `DishPayload` (لا Partial) هو ما يضمن ذلك
 * وقت الترجمة — فلا تجعل أي مفتاح هنا اختيارياً.
 */
export function rowToPayload(row: ParsedRow): DishPayload {
  return {
    name: row.name.trim(),
    description: row.description,
    price: row.price ?? 0,
    category: row.category,
    emoji: row.emoji || "🍽",
    image: null,
    featured: false,
    available: true,
    calories: null,
    sodium_mg: null,
    caffeine_mg: null,
    allergens: [],
    name_en: null,
    description_en: null,
    options: null,
  };
}

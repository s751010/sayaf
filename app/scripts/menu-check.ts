/**
 * فحص منيو مطعمٍ مرشَّح — **يحسب ولا يكتب شيفرة**.
 *
 * يشغّله وكيل «فاحص المنيو» (`.claude/agents/cm-menu-check.md`) كي لا يكتب
 * شيفرةً في كل زيارة (وهي ما يكلّف): يكتب الوصفات نصّاً في ملفّ، وهذا السكربت
 * يحسبها بمحرّك المنتج نفسه (`lib/recipe.ts`) ويطبع جدولاً.
 *
 *   npx vite-node scripts/menu-check.ts ../company/sales/checks/<ملف>.txt
 *
 * صيغة الملفّ — كتلة لكل صنف، تبدأ بـ`#` واسمه، وتحتها سطر لكل مكوّن:
 *
 *   # لاتيه
 *   شوتين إسبريسو
 *   حليب كامل الدسم 200 مل
 *
 *   # كبسة دجاج — حصص 4
 *   رز مطبوخ 800 غ
 *   ...
 *
 * «حصص N» في سطر الاسم تقسم الوصفة على N. والسطر الذي لم يُفهم يُطبع تحت
 * الجدول بنصّه — لا يدخل الحساب ولا يُخمَّن.
 */
import { readFileSync } from "node:fs";
import { computeNutrition, parseRecipe } from "@/lib/recipe";

const file = process.argv[2];
if (!file) {
  console.error("الاستعمال: npx vite-node scripts/menu-check.ts <ملف الوصفات>");
  process.exit(1);
}

type Block = { name: string; servings: number; lines: string[] };

function blocks(text: string): Block[] {
  const out: Block[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#")) {
      const head = line.replace(/^#+\s*/, "");
      const m = head.match(/حصص\s*(\d+)/);
      out.push({ name: head.replace(/[—-]?\s*حصص\s*\d+/, "").trim(), servings: m ? Number(m[1]) : 1, lines: [] });
    } else if (out.length) {
      out[out.length - 1].lines.push(line);
    }
  }
  return out;
}

const rows: string[] = [];
const misses: string[] = [];
for (const b of blocks(readFileSync(file, "utf8"))) {
  const r = computeNutrition(parseRecipe(b.lines.join("\n")), b.servings);
  rows.push(
    `| ${b.name} | ${r.kcal} | ${r.sodium}${r.highSodium ? " 🧂" : ""} | ${r.caffeine || "—"} | ${r.burnMinutes} | ${r.hasEstimates ? "فيه تقدير" : ""} |`
  );
  for (const u of r.unresolved) misses.push(`- ${b.name}: «${u}»`);
}

console.log("| الصنف | السعرات | الصوديوم (ملغم) | الكافيين (ملغم) | دقائق المشي | ملاحظة |");
console.log("|---|---|---|---|---|---|");
for (const r of rows) console.log(r);
if (misses.length) {
  console.log("\n**أسطر لم تُفهم (لم تدخل الحساب):**");
  for (const m of misses) console.log(m);
}

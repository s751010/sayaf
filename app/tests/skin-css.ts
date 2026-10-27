/**
 * نصّ CSS الطوابع **كما يبنيه Vite**: `menu-skins.css` وملفّات `skins/<id>.css`
 * مدموجةً في موضع `@import` كلٍّ منها.
 *
 * ⚠️ الفحوص كانت تقرأ `menu-skins.css` وحده، فطابعٌ خامته في ملفّه (دكّان ·
 * عسير، ٢٧/١٠) كان سيسقط «لكلّ خامةٍ قاعدتها» وهو سليم — أو أسوأ: فحصٌ يمرّ على
 * الملفّ الكبير وملفّ الطابع غير مستورَدٍ أصلاً. فالدمج يتبع `@import` الفعلي:
 * ملفٌّ في `skins/` لا يستورده `menu-skins.css` لا يدخل النصّ.
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const STYLES = fileURLToPath(new URL("../src/styles/", import.meta.url));

/** `@import "./skins/x.css";` ⇐ ملفّاتها، بالترتيب. */
export const IMPORT_RE = /@import\s+"\.\/skins\/([a-z0-9-]+)\.css";/g;

export function skinFile(id: string): string {
  return readFileSync(`${STYLES}skins/${id}.css`, "utf8");
}

/** معرّفات ملفّات `skins/` الموجودة على القرص. */
export function skinFileIds(): string[] {
  return readdirSync(`${STYLES}skins`)
    .filter((f) => f.endsWith(".css"))
    .map((f) => f.slice(0, -4));
}

/** `menu-skins.css` بملفّاته المستوردة في مواضعها. */
export function menuSkinsCss(): string {
  const main = readFileSync(`${STYLES}menu-skins.css`, "utf8");
  return main.replace(IMPORT_RE, (_, id: string) => skinFile(id));
}

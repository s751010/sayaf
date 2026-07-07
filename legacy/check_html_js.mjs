#!/usr/bin/env node
// Rule (ب): extract every inline <script> from the HTML and run a syntax
// check on each. Usage: node scripts/check_html_js.mjs <file.html>
import fs from 'node:fs';
import vm from 'node:vm';

const file = process.argv[2] || 'cloudmenu_v43_security_storage.html';
const html = fs.readFileSync(file, 'utf8');

const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
let m, i = 0, failed = 0;
while ((m = re.exec(html)) !== null) {
  const attrs = m[1] || '';
  const code = m[2] || '';
  i++;
  if (/\bsrc\s*=/.test(attrs)) { console.log(`#${i} external script (skipped)`); continue; }
  if (/type\s*=\s*["']application\/(ld\+json|json)["']/i.test(attrs)) {
    try { JSON.parse(code); console.log(`#${i} JSON ok (${code.length} bytes)`); }
    catch (e) { failed++; console.error(`#${i} JSON FAIL: ${e.message}`); }
    continue;
  }
  try {
    new vm.Script(code, { filename: `inline-script-${i}.js` });
    console.log(`#${i} JS ok (${code.length} bytes)`);
  } catch (e) {
    failed++;
    console.error(`#${i} JS FAIL: ${e.message}`);
  }
}
console.log(`\n${i} script(s) checked, ${failed} failed.`);
process.exit(failed ? 1 : 0);

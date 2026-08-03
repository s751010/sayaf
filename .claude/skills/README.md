# مهارات المستودع

## graphify

مثبَّتة بالأمر `graphify claude install --project` من `@sentropic/graphify`.
لا تُحرَّر يدوياً — تُحدَّث بإعادة تنفيذ الأمر بعد ترقية الحزمة عامّياً.

## ui-ux-pro-max وأخواتها (٦ مهارات)

`banner-design` · `brand` · `design` · `design-system` · `slides` · `ui-styling` ·
`ui-ux-pro-max`

المصدر: <https://github.com/nextlevelbuilder/ui-ux-pro-max-skill> — إصدار
**2.11.0**، رخصة **MIT** (وخطوط `ui-styling/canvas-fonts` تحت **Apache-2.0**؛
كلتاهما متساهلة فلا تعارض مع منتج تجاري مغلق — قارن §7 في `CLAUDE.md`).

هي في الأصل **إضافة (plugin)** تُثبَّت بـ`/plugin`، لكن `/plugin` غير متاح في
هذه البيئة، فنُسخ محتوى `.claude/skills/` من المستودع كما هو.

### ما عُدِّل عن الأصل — وهو ما يجب إعادته عند الترقية

النسخة الأصلية تفترض أنها تعمل **إضافةً**، فتشير إلى ملفّاتها بمسارات لا تصحّ
لمهارة داخل مستودع. عُدِّل موضعان فقط:

| المسار الأصلي | صار | أين |
|---|---|---|
| `${CLAUDE_PLUGIN_ROOT}/.claude/skills/ui-ux-pro-max/…` | `.claude/skills/ui-ux-pro-max/…` | `ui-ux-pro-max/SKILL.md` (١١ موضعاً) |
| `~/.claude/skills/design/…` | `.claude/skills/design/…` | `design/` — `SKILL.md` و`references/*.md` و`scripts/cip/generate.py` |

الأول **كان معطوباً فعلاً**: `CLAUDE_PLUGIN_ROOT` لا تُضبط خارج تثبيت الإضافة،
فيصير المسار مطلقاً من الجذر `/`. والثاني يشير إلى مجلد المستخدم بينما التثبيت
هنا داخل المستودع.

بقيت مسارات مثل `python scripts/search-slides.py` كما هي في الأصل (نسبيّة إلى
مجلد المهارة نفسها) — تركها يقلّل الانحراف عن المنبع.

**للترقية**: انسخ `.claude/skills/` من الإصدار الجديد ثم أعِد التعديلين أعلاه.

### حدود معروفة

- **`banner-design` ناقصة الاعتماديات**: تنادي `.claude/skills/ai-artist/` و
  `.claude/skills/ai-multimodal/` و`.claude/skills/chrome-devtools/` و
  `.claude/skills/.venv/` — ولا شيء منها في هذه الحزمة. مسارها الرئيسي لا يعمل
  بلا تثبيتها، ونصائحها النصّية تبقى مفيدة.
- **توليد الصور يحتاج مفاتيح**: `GEMINI_API_KEY` (شعارات وأيقونات في `design`)
  و`MISTRAL_API_KEY`. غير مضبوطة، ولا تُضبط في المستودع (§7).
- سكربتات بايثون تحتاج **Python 3** بلا اعتماديات خارجية.
- قواعد بيانات هذه المهارات **لاتينية التوجّه** (٧٤ اقتران خطوط، ١٩٢ لوحة لون).
  المنتج عربي RTL وخطوطه ذاتية الاستضافة عبر `@fontsource` — فخُذ منها المبادئ
  (التباين، مقاسات اللمس، الإيقاع) لا أسماء الخطوط.

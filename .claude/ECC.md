# ECC — إعداد المستودع

[ECC](https://github.com/affaan-m/ECC) طبقةُ تشغيل للوكيل: وكلاء ومهارات وأوامر
وhooks وقواعد. رُكِّب هنا **كإضافة (plugin)** لا كنسخ ملفات، فالتحديث يأتي من
GitHub بلا commit، والـdiff في هذا المستودع بقي سطوراً معدودة.

## ما رُكِّب — وأين

| الموضع | ما فيه |
|---|---|
| `.claude/settings.json` | `extraKnownMarketplaces.ecc` ← `affaan-m/ECC` و `enabledPlugins["ecc@ecc"]` |
| `.claude/rules/ecc/` | حزم القواعد: `common` · `typescript` · `react` · `web` |

**لماذا القواعد منسوخة وحدها:** إضافات Claude Code **لا توزّع `rules/`** — هذا قيد
في الإضافات نفسها لا خيار. فالوكلاء والمهارات والأوامر تصل من الإضافة تلقائياً،
والقواعد وحدها تُنسخ يدوياً وتُلتزَم. الحزم الأربع مختارة لمكدّس المشروع
(TypeScript + React + واجهة ويب)؛ ما عداها من ٢٣ حزمة في ECC لا يخصّنا.

## الأسبقية — `CLAUDE.md` يفوز

قواعد ECC **عامّة**، وقواعد هذا المستودع **مخصوصة ولها تاريخ أعطال**. عند أي
تعارض: `CLAUDE.md` و `docs/` هما المرجع.

تعارضان قائمان اليوم، اذكرهما ولا تتبع فيهما ECC:

1. **رسائل الـcommit**: `rules/ecc/common/git-workflow.md` يفرض
   `feat:`/`fix:` بالإنجليزية. تاريخ هذا المستودع **جملٌ عربية وصفية** — أبقِه
   عربياً.
2. **سير العمل قبل الدفع**: الحارس هو §6 في `CLAUDE.md`
   (`typecheck` ← `npm test` ← `npm run build`)، لا سلّم ECC العام.

وثوابت `CLAUDE.md` السبعة (قيم الطوابع · لا `select=*` · الأعمدة المحسوبة ·
القوائم البيضاء · تكافؤ `_shared` · باقة `standard` · قفل النشر) **لا يمسّها
شيء من ECC**.

## التحديث والصيانة

```bash
npx ecc-universal setup          # تحديث الإضافة، أو تغيير النطاق/الـhooks
```

القواعد لا تتحدّث مع الإضافة — لتحديثها:

```bash
git clone https://github.com/affaan-m/ECC.git /tmp/ecc
for p in common typescript react web; do cp -R "/tmp/ecc/rules/$p" .claude/rules/ecc/; done
```

داخل Claude Code بعد التركيب: `/ecc:configure-ecc` لإعادة الضبط.

## تنبيه — لا تُكدِّس طرق التركيب

ECC يحذّر صراحةً من تركيبه مرتين في نفس الـharness (تكرار مهارات وhooks
وإعدادات). هذا المستودع على **مسار الإضافة**؛ فلا تُشغّل
`install.sh --profile full` ولا `--target claude-project` فوقه. وإن التبس الأمر
يوماً: `npx ecc-universal setup` يفحص الحالة القائمة ويصلحها بدل أن يضيف نسخة
ثانية.

## هل يعمل في جلسات الويب؟

الإضافة تحتاج دعم `/plugin` في العميل. في جلسة Claude Code على الويب أو في
حاوية بعيدة قد لا تُحمَّل الإضافة، لكن **`.claude/rules/ecc/` ملفاتٌ في
المستودع** — تصل في كل جلسة على أي حال.

#!/usr/bin/env node
/**
 * ينقل الصور المخزَّنة **data URI داخل القاعدة** إلى دلاء التخزين.
 *
 * ═══ لماذا ═══
 *
 * إحدى عشرة صورة في الإنتاج مخزَّنة base64 داخل أعمدة نصّية (أطولها ٢٨٨٬٣٨٧
 * محرفاً). وهذه ليست مسألة مساحة قاعدة: العمود يُقرأ في **ردّ JSON حاجز**
 * لصفحة المنيو، فيُنزَّل كاملاً قبل أن تُرسم الصفحة — لا كصورة كسولة تُحمَّل
 * بعدها. ثلاثة مطاعم كانت تكلّف زائرها ٤٦٤–٥٣٩ كيلوبايت على هذا النحو.
 *
 * (المستبعَد منها `menus.cover_image` — حُذف من `PUBLIC_MENU_COLS` لأنه لا
 * يُعرض أصلاً، فلا يحتاج ترحيلاً. هذا السكربت للصور التي **تُرى**.)
 *
 * ═══ ⚠️ لماذا لم يُنفَّذ من جلسة المساعد ═══
 *
 * رفع البايتات يحتاج Storage API على `<ref>.supabase.co`، وسياسة الشبكة في
 * بيئة التنفيذ تحجب النطاق (`CONNECT tunnel failed, 403`). أُدوات SQL المتاحة
 * تكتب صفوفاً لا ملفّات — وبايتات التخزين لا تعيش في Postgres. فالسكربت
 * ✅ **الترحيل تمّ بالفعل** (٢٠٢٦-٠٨): صفر صفّ يحمل `data:` في الجداول
 * الثلاثة، و`owner` مضبوط لكل ملفّ منقول، وتريجر `reject_base64_image`
 * يمنع عودتها. هذا السكربت يبقى **آلةً لا مهمّة**: تشغيله اليوم لا يجد ما
 * ينقله فيخرج بلا تغيير، وينفع إن ظهرت صفوف قديمة من نسخة احتياطية.
 *
 * ═══ التشغيل ═══
 *
 *   export SUPABASE_URL="https://wxrukupcyfypnqnotmxv.supabase.co"
 *   export SUPABASE_SERVICE_ROLE_KEY="..."   # Settings ← API ← service_role
 *
 *   node app/scripts/migrate-data-uris.mjs             # فحص جافّ (الافتراضي)
 *   node app/scripts/migrate-data-uris.mjs --apply     # التنفيذ الفعلي
 *
 * ═══ ⚠️ ثلاثة قيود مبنيّة في السكربت ═══
 *
 * ١. **لا يُمسح عمود قبل التحقّق من بديله.** بعد الرفع يُطلب الرابط العام
 *    فعلاً (GET) ويُقارَن حجمه بالبايتات المرفوعة؛ وإن اختلّ شيء يبقى الـ
 *    data URI في مكانه. صورة مفقودة في منيو حيّ أسوأ من صورة ثقيلة.
 *
 * ٢. **يُصحَّح `owner` بعد الرفع.** الرفع بمفتاح الخدمة لا يحمل `sub`، فيصل
 *    الكائن بـ`owner = NULL` — وسياسات §٢٤ صارت `owner = auth.uid()`، أي أن
 *    التاجر لن يستطيع استبدال صورته ولا حذفها بعد الترحيل. لا PostgREST ولا
 *    مفتاح الخدمة يكتبان في `storage.objects`، فيُكتب ملفّ SQL مجاور
 *    (`migrate-data-uris.owner.sql`) تلصقه في محرّر SQL. **الترحيل لا يكتمل
 *    بدونه** — والسكربت يقولها في مخرجه لا في تعليق هنا.
 *
 * ٣. **قابل للاستئناف**: ما صار رابطاً يُتخطّى، فإعادة التشغيل بعد انقطاع
 *    لا تُنشئ نسخاً ثانية.
 *
 * ═══ الخطوة التالية بعد نجاحه (وليس قبله) ═══
 *
 * قيد يمنع عودة data URI من أي مسار كتابة — بما فيها API §١٤:
 *
 *   alter table public.dishes      add constraint dishes_image_not_data_uri
 *     check (image is null or image not like 'data:%') not valid;
 *   alter table public.restaurants add constraint restaurants_logo_not_data_uri
 *     check (logo_image is null or logo_image not like 'data:%') not valid;
 *
 * ⚠️ **لا تُضِفه قبل الترحيل**: فورم الطبق يعيد إرسال `image` كما هي، فتاجر
 * يحرّر طبقاً صورتُه data URI كان سيُمنع من الحفظ. و`not valid` تعني «افحص
 * الجديد ودع القديم» — وهي المطلوبة هنا بالضبط.
 */

const DRY = !process.argv.includes("--apply");
const URL_BASE = (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!URL_BASE || !KEY) {
  console.error("✋ اضبط SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY أولاً.");
  process.exit(1);
}

/**
 * الأعمدة المرشَّحة. `bucket` و`prefix` يطابقان ما تكتبه الواجهة اليوم
 * (`ImageUploader` و`BulkImages`) حتى لا يصير في الدلو عُرفان للمسارات.
 */
const TARGETS = [
  { table: "dishes", column: "image", bucket: "dish-images", folder: "migrated" },
  { table: "restaurants", column: "logo_image", bucket: "restaurant-images", folder: "logo" },
  { table: "restaurants", column: "banner_image", bucket: "restaurant-images", folder: "banner" },
];

const EXT = { "image/webp": "webp", "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png" };

async function pg(path, init = {}) {
  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

/** يفكّ `data:<mime>;base64,<payload>` ويرفض ما ليس صورة من الأنواع المسموحة. */
function decodeDataUri(value) {
  const m = /^data:([^;,]+);base64,(.+)$/s.exec(value);
  if (!m) return { error: "ليست data URI بترميز base64" };
  const mime = m[1].toLowerCase();
  if (!EXT[mime]) return { error: `نوع غير مسموح في الدلو: ${mime}` };
  let bytes;
  try {
    bytes = Buffer.from(m[2], "base64");
  } catch {
    return { error: "base64 تالفة" };
  }
  // الدلاء محدودة بخمسة ميغابايت (§٢٤) — فالرفض هنا أوضح من ٤١٣ بعد الرفع.
  if (bytes.length > 5 * 1024 * 1024) return { error: `أكبر من حدّ الدلو (${bytes.length} بايت)` };
  return { mime, bytes, ext: EXT[mime] };
}

async function upload(bucket, path, bytes, mime) {
  const res = await fetch(`${URL_BASE}/storage/v1/object/${bucket}/${encodeURI(path)}`, {
    method: "POST",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": mime,
      "cache-control": "31536000",
    },
    body: bytes,
  });
  if (!res.ok) throw new Error(`رفع ${res.status}: ${await res.text()}`);
  return `${URL_BASE}/storage/v1/object/public/${bucket}/${encodeURI(path)}`;
}

/**
 * يحذف كائناً رُفع ثم فشلت خطوة بعده.
 *
 * ⚠️ كُشف بفحص على خادم محاكٍ: صفٌّ يفشل تحقّقه كان يُبقي الملفّ المرفوع في
 * الدلو، فكل إعادة تشغيل تضيف نسخة يتيمة أخرى — والسياسات الجديدة (§٢٤) تمنع
 * التاجر من حذفها لأن `owner` فارغ. النظافة جزء من «قابل للاستئناف».
 */
async function discard(bucket, path) {
  await fetch(`${URL_BASE}/storage/v1/object/${bucket}/${encodeURI(path)}`, {
    method: "DELETE",
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  }).catch(() => {});
}

/** يتأكّد أن الرابط يُخدَم فعلاً وبنفس الحجم قبل مسح المصدر. */
async function verify(url, expected) {
  const res = await fetch(url);
  if (!res.ok) return `الرابط يعيد ${res.status}`;
  const got = Number(res.headers.get("content-length") ?? NaN);
  if (Number.isFinite(got) && got !== expected) return `الحجم ${got} ≠ ${expected}`;
  return null;
}

const ownerSql = [];
let moved = 0,
  skipped = 0,
  failed = 0,
  savedBytes = 0;

console.log(DRY ? "🔍 فحص جافّ — لا شيء يُكتب. أضف --apply للتنفيذ.\n" : "🚚 تنفيذ فعلي.\n");

/**
 * مالك كل مطعم — يُجلب مرّة واحدة بدل تضمين (`restaurants!inner(user_id)`) في
 * كل استعلام. والمرساة هي **مالك المطعم** لا `dishes.user_id`: الثاني يحمل من
 * أنشأ الصفّ (وقد يكون المؤسّس في دعم يدوي)، والأوّل من سيستبدل الصورة لاحقاً.
 */
const owners = new Map(
  (await pg("restaurants?select=id,user_id")).map((r) => [r.id, r.user_id])
);

for (const t of TARGETS) {
  const idCol = t.table === "restaurants" ? "id" : "restaurant_id";
  const select = t.table === "restaurants" ? `id,${t.column}` : `id,${idCol},${t.column}`;

  const rows = await pg(
    `${t.table}?${t.column}=like.data:*&select=${encodeURIComponent(select)}`
  );

  for (const row of rows) {
    const label = `${t.table}.${t.column} · ${row.id}`;
    const value = row[t.column];
    const decoded = decodeDataUri(value);
    if (decoded.error) {
      console.log(`  ⏭️  ${label} — ${decoded.error}`);
      skipped++;
      continue;
    }

    const restaurantId = t.table === "restaurants" ? row.id : row[idCol];
    const userId = owners.get(restaurantId);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${decoded.ext}`;
    const path = `${restaurantId}/${t.folder}/${name}`;

    console.log(
      `  ${DRY ? "•" : "→"} ${label} — ${(value.length / 1024).toFixed(0)}ك base64 ⇒ ` +
        `${(decoded.bytes.length / 1024).toFixed(0)}ك في ${t.bucket}/${path}`
    );
    savedBytes += value.length - decoded.bytes.length;

    if (DRY) {
      moved++;
      continue;
    }

    let uploaded = false;
    try {
      const url = await upload(t.bucket, path, decoded.bytes, decoded.mime);
      uploaded = true;
      const bad = await verify(url, decoded.bytes.length);
      if (bad) throw new Error(`تحقّق فاشل — ${bad}`);

      await pg(`${t.table}?id=eq.${row.id}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ [t.column]: url }),
      });

      if (userId) {
        ownerSql.push(
          `update storage.objects set owner = '${userId}', owner_id = '${userId}'\n` +
            `  where bucket_id = '${t.bucket}' and name = '${path}';`
        );
      } else {
        console.log(`     ⚠️ بلا user_id — سيبقى owner فارغاً ولن يستطيع التاجر استبدالها.`);
      }
      moved++;
    } catch (e) {
      // العمود لم يُمسّ: الـPATCH يقع **بعد** التحقّق، ففشل أيّ خطوة يُبقي
      // الصورة تعمل كما هي اليوم — ويُحذف ما رُفع فلا يتراكم يتيماً.
      if (uploaded) await discard(t.bucket, path);
      console.log(`  ❌ ${label} — ${e.message} (بقيت data URI كما هي)`);
      failed++;
    }
  }
}

console.log(
  `\n${DRY ? "سيُنقل" : "نُقل"}: ${moved} · تُخطّي: ${skipped} · فشل: ${failed} · ` +
    `توفير الحمولة ≈ ${(savedBytes / 1024).toFixed(0)} كيلوبايت`
);

if (!DRY && ownerSql.length) {
  const { writeFileSync } = await import("node:fs");
  const out = new URL("./migrate-data-uris.owner.sql", import.meta.url);
  writeFileSync(
    out,
    "-- ⚠️ الترحيل لا يكتمل بدون هذا: الرفع بمفتاح الخدمة يترك owner فارغاً،\n" +
      "-- وسياسات التخزين (§٢٤) تشترط owner = auth.uid() للاستبدال والحذف.\n" +
      "-- الصقه في Supabase ← SQL Editor.\n\n" +
      ownerSql.join("\n") +
      "\n"
  );
  console.log(`\n⚠️ ناقص خطوة: الصق ${out.pathname} في محرّر SQL لضبط owner.`);
}

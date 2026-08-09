/**
 * يولّد `deploy/sitemap.xml` و`deploy/robots.txt` من **القاعدة الحيّة**.
 *
 * ═══ لماذا مولَّدان ═══
 *
 * الخريطة المكتوبة بيد كانت ثلاثة روابط: `/` و`/blog` و`/login`.
 *  · `/login` **لا قيمة بحثية لها** — صفحة دخول لا يبحث عنها أحد.
 *  · `/blog` كانت مُدرَجة و`blog_posts` فيه **صفر صفّ** — أي أننا نرشد قوقل
 *    إلى صفحة فارغة، وهذا يضرّ ولا ينفع.
 *  · و**كل منيو تاجر غائب** — وهي أثمن صفحاتنا العامّة وأكثرها استحقاقاً
 *    للفهرسة، وتزداد مع كل تاجر جديد. خريطة يدوية تعني أن كل تسجيل جديد
 *    يحتاج تعديلاً بيد، وهذا لا يحدث أبداً.
 *
 * ═══ ما يُدرَج وما لا يُدرَج ═══
 *
 * لا يُدرَج مطعم **بلا قائمة مفعّلة أو بلا أصناف**: رابطٌ يفتح صفحة فارغة
 * يُنفق ميزانية زحف ويُقرأ محتوىً رقيقاً. والفهرسة تُكسب لا تُطلب.
 *
 * ═══ المفتاح ═══
 *
 * يُقرأ `SUPABASE_ANON_KEY` من `src/lib/config.ts` — وهو **عام بطبيعته**
 * (محكوم بـRLS ومضمَّن في الحزمة أصلاً). ولا يُقرأ إلا الأعمدة العامّة، فلا
 * يتجاوز هذا السكربت ما يراه أي زائر.
 *
 * يُشغَّل بعد البناء:  npm run build   (postbuild)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, "..");
const deploy = join(app, "..", "deploy");

const config = readFileSync(join(app, "src/lib/config.ts"), "utf8");
const pick = (name) => config.match(new RegExp(`${name}\\s*=\\s*\\n?\\s*"([^"]+)"`))?.[1] ?? "";

const SUPABASE_URL = pick("SUPABASE_URL");
const ANON = pick("SUPABASE_ANON_KEY");
const SITE = pick("SITE_URL").replace(/\/+$/, "");

if (!SUPABASE_URL || !ANON || !SITE) {
  console.error("✗ تعذّر قراءة الإعدادات من src/lib/config.ts");
  process.exit(1);
}

async function rest(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

// القائمة مشتركة مع دالة حافة معاينة واتساب: القائمتان كانتا ستتباعدان،
// فيُدرَج في الخريطة رابطٌ لا يفتح أو تُحقن وسوم في مسار ليس منيواً.
import { RESERVED } from "../../shared/menu-meta.mjs";

/**
 * أقلّ عدد أصناف يدخل به منيو الخريطة.
 *
 * **بوّابة جودة يتحكّم بها التاجر نفسه**: منيو بصنف واحد محتوىً رقيق بمعيار
 * قوقل الصريح، وفهرسته تضرّ نطاقنا كلّه لا صفحته وحدها. ومتى أضاف التاجر
 * صنفاً ثانياً دخل تلقائياً في البناء التالي — فالبوّابة تُفتح بالعمل لا
 * بالمراسلة. (اليوم هذا يستبعد حسابات اختبار بصنف واحد.)
 */
const MIN_DISHES = 2;

/** المسارات الثابتة. `/login` و`/stamp` و`/reset-password` **ليست منها** عمداً. */
const STATIC = [
  { loc: "/", priority: "1.0", changefreq: "weekly" },
  { loc: "/demo", priority: "0.9", changefreq: "monthly" },
  { loc: "/about", priority: "0.7", changefreq: "monthly" },
  { loc: "/help", priority: "0.7", changefreq: "monthly" },
  { loc: "/docs/api", priority: "0.5", changefreq: "monthly" },
  { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
  { loc: "/terms", priority: "0.3", changefreq: "yearly" },
];

const urls = [...STATIC];
let merchants = 0;
let posts = 0;

try {
  // القوائم المفعّلة وحدها، ومنها نعرف أي المطاعم لها ما يُعرض.
  const [restaurants, menus, dishes] = await Promise.all([
    rest("restaurants?select=id,slug,created_at"),
    rest("menus?select=restaurant_id,active"),
    rest("dishes?select=restaurant_id&limit=5000"),
  ]);

  const withMenu = new Set(menus.filter((m) => m.active !== false).map((m) => m.restaurant_id));
  const dishCount = new Map();
  for (const d of dishes) dishCount.set(d.restaurant_id, (dishCount.get(d.restaurant_id) ?? 0) + 1);

  for (const r of restaurants) {
    if (!r.slug || RESERVED.has(r.slug.toLowerCase())) continue;
    if (!withMenu.has(r.id)) continue;
    if ((dishCount.get(r.id) ?? 0) < MIN_DISHES) continue;
    // ⚠️ الترميز إلزامي: أغلب الـslugs عربية، والحرف العربي الخام في XML
    // يكسر قارئ الخريطة عند بعض الزواحف.
    urls.push({
      loc: `/${encodeURIComponent(r.slug)}`,
      priority: "0.8",
      changefreq: "weekly",
      lastmod: r.created_at?.slice(0, 10),
    });
    merchants++;
  }

  const published = await rest("blog_posts?select=slug,created_at&published=is.true");
  for (const p of published) {
    if (!p.slug) continue;
    urls.push({
      loc: `/blog/${encodeURIComponent(p.slug)}`,
      priority: "0.6",
      changefreq: "monthly",
      lastmod: p.created_at?.slice(0, 10),
    });
    posts++;
  }
  // `/blog` تُدرَج **فقط إن كان فيها مقال** — فهرسة صفحة فارغة تضرّ.
  if (posts > 0) urls.push({ loc: "/blog", priority: "0.6", changefreq: "weekly" });
} catch (err) {
  // ⚠️ الفشل لا يُسقط البناء ولا يكتب خريطة ناقصة فوق خريطة صحيحة: خريطة
  // بلا منيوهات أسوأ من خريطة الأمس. يُترك الملفّ القائم كما هو.
  console.error(`⚠️  تعذّر جلب البيانات (${err.message}) — أُبقيت الخريطة القائمة.`);
  process.exit(0);
}

const today = new Date().toISOString().slice(0, 10);
const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map(
    (u) =>
      `  <url><loc>${SITE}${u.loc}</loc>` +
      `<lastmod>${u.lastmod || today}</lastmod>` +
      `<changefreq>${u.changefreq}</changefreq>` +
      `<priority>${u.priority}</priority></url>`
  ),
  "</urlset>",
  "",
].join("\n");

writeFileSync(join(deploy, "sitemap.xml"), xml);

const robots = `# كلاود منيو
User-agent: *
Allow: /

# مسارات خاصّة — لا قيمة لفهرستها، وبعضها يكشف بنية اللوحة.
Disallow: /dashboard
Disallow: /founder
Disallow: /login
Disallow: /reset-password
# وضع الكاشير: عامّ بالتصميم (الرمز بوّابته، §8) ولا معنى لظهوره في البحث.
Disallow: /stamp

Sitemap: ${SITE}/sitemap.xml
`;
writeFileSync(join(deploy, "robots.txt"), robots);

console.log(
  `✓ sitemap.xml — ${urls.length} رابطاً (${STATIC.length} ثابتة · ${merchants} منيو · ${posts} مقالاً)`
);
console.log("✓ robots.txt");

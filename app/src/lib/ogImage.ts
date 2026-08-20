/**
 * توليد صورة المشاركة (Open Graph) لمطعمٍ بلا بانر.
 *
 * ═══ لماذا في المتصفّح لا على الحافة ═══
 *
 * الواقع: **١٧ من ١٩ مطعماً بلا بانر**، فروابط منيوهاتهم تُشارَك على واتساب
 * بصورة `og.png` عامّة واحدة — نفسها لكل مطعم.
 *
 * والحلّ البديهي «دالة حافة تولّد الصورة عند الطلب» **خطأ هنا**: واتساب
 * وفيسبوك **لا يعرضان SVG** في `og:image`، وتحويله إلى PNG على الحافة يحتاج
 * satori + resvg-wasm — وزنٌ ومخاطرة في مسارٍ إن تعطّل صمت بلا أثر (نفس درس
 * مفتاح anon في رأس `menu-meta.ts`).
 *
 * فالتوليد هنا: `canvas` في المتصفّح ⇒ PNG حقيقي ⇒ يُرفع إلى Storage مرّة
 * واحدة ⇒ رابط `https` ثابت يقبله كل زاحف ويُخزَّن في كاشه. صفر كلفة عند
 * الطلب، ويستطيع التاجر استبداله بصورته متى شاء.
 */

/** مقاس البطاقة المعياري الذي تتوقّعه واتساب وتويتر وفيسبوك. */
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** هاش ثابت — نفس منطق `DishArtwork` كي تتناغم الصورتان. */
function hashOf(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** `#rrggbb` → `rgba(...)` بشفافية. */
function rgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const n = parseInt(full, 16);
  if (!Number.isFinite(n)) return `rgba(212,168,67,${alpha})`;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export type OgInput = {
  name: string;
  /** لون علامة المطعم — يأتي من `cover_color` أو لون الطابع. */
  accent: string;
  /** رمز/إيموجي المطعم إن وُجد. */
  logo?: string | null;
  /** نوع المطعم للسطر الثانوي. */
  type?: string | null;
};

/**
 * يرسم البطاقة ويعيدها PNG.
 *
 * ⚠️ الخطوط: `document.fonts.ready` يُنتظر قبل الرسم، وإلا رُسم الاسم العربي
 * بخطّ احتياطي ثم ثُبّت في صورة لا تُصحَّح.
 */
export async function renderOgImage(input: OgInput): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = OG_WIDTH;
  canvas.height = OG_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("تعذّر إنشاء الصورة في هذا المتصفّح.");

  try {
    await document.fonts.ready;
  } catch {
    /* متصفّح بلا Font Loading API — نرسم بما توفّر. */
  }

  const accent = /^#[0-9a-f]{3,8}$/i.test(input.accent) ? input.accent : "#d4a843";
  const h = hashOf(input.name || "مطعم");

  // ── الأرضية: تدرّج داكن يجعل الذهبي يلمع، ويعمل خلف أي لون علامة ──
  const bg = ctx.createLinearGradient(0, 0, OG_WIDTH, OG_HEIGHT);
  bg.addColorStop(0, "#14120e");
  bg.addColorStop(1, "#0b0a08");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT);

  // ── وهج من لون العلامة في الزاوية ──
  const glow = ctx.createRadialGradient(OG_WIDTH * 0.82, 120, 40, OG_WIDTH * 0.82, 120, 620);
  glow.addColorStop(0, rgba(accent, 0.34));
  glow.addColorStop(1, rgba(accent, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT);

  // ── أقواس زخرفية، زاويتها من اسم المطعم فتختلف البطاقات ──
  ctx.strokeStyle = rgba(accent, 0.18);
  ctx.lineWidth = 3;
  const shift = (h % 90) - 45;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(160 + shift, OG_HEIGHT + 90, 260 + i * 86, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }

  // ── شريط اللون على الحافة اليمنى (اتجاه عربي) ──
  ctx.fillStyle = accent;
  ctx.fillRect(OG_WIDTH - 14, 0, 14, OG_HEIGHT);

  ctx.textAlign = "right";
  ctx.direction = "rtl";
  const right = OG_WIDTH - 90;

  // ── الرمز ──
  if (input.logo?.trim()) {
    ctx.font = "96px system-ui, 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif";
    ctx.fillText(input.logo.trim().slice(0, 2), right, 210);
  }

  // ── اسم المطعم: يتقلّص ليسع سطراً واحداً بدل أن يُبتر ──
  let size = 92;
  const name = (input.name || "منيو").trim();
  do {
    ctx.font = `800 ${size}px Tajawal, 'IBM Plex Sans Arabic', system-ui, sans-serif`;
    size -= 4;
  } while (ctx.measureText(name).width > OG_WIDTH - 200 && size > 42);
  ctx.fillStyle = "#f5efe3";
  ctx.fillText(name, right, input.logo?.trim() ? 340 : 300);

  // ── النوع ──
  if (input.type?.trim()) {
    ctx.font = "500 40px 'IBM Plex Sans Arabic', Tajawal, system-ui, sans-serif";
    ctx.fillStyle = rgba(accent, 0.95);
    ctx.fillText(input.type.trim(), right, input.logo?.trim() ? 404 : 364);
  }

  // ── الدعوة ──
  ctx.font = "600 34px 'IBM Plex Sans Arabic', Tajawal, system-ui, sans-serif";
  ctx.fillStyle = "rgba(245,239,227,0.62)";
  ctx.fillText("تصفّح المنيو واطلب", right, OG_HEIGHT - 118);

  // ── علامة المنصّة ──
  ctx.font = "700 28px Tajawal, system-ui, sans-serif";
  ctx.fillStyle = rgba(accent, 0.75);
  ctx.fillText("كلاود منيو", right, OG_HEIGHT - 58);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("تعذّر تحويل الصورة."))),
      "image/png"
    );
  });
}

/**
 * توليد أكواد QR — مصدر واحد لصفحة الأكواد ولاستوديو البطاقات.
 *
 * كانت هذه الدوال داخل `pages/dashboard/Qr.tsx`، فلمّا احتاجها الاستوديو صار
 * أمامنا نسخُها أو نقلُها. نُقلت: كودان يُولَّدان بمنطقين مختلفين يعنيان أن
 * البطاقة قد تحمل كوداً لا يُقرأ بينما الصفحة تعرض واحداً يُقرأ.
 */
import QRCode from "qrcode";

export function loadImage(src: string, cors = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // بدون `crossOrigin` تُلوَّث اللوحة فيرمي `toDataURL` خطأ أمني — وSupabase
    // Storage يرسل ترويسات CORS فيمرّ الطلب.
    if (cors) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image"));
    img.src = src;
  });
}

/**
 * كود QR بشعار المطعم في وسطه.
 *
 * الشعار يحجب جزءاً من الكود، لذا يرتفع تصحيح الأخطاء إلى `H` (يتحمّل ~٣٠٪ تلفاً)
 * **فقط حين يوجد شعار** — رفعه دائماً يزيد كثافة الوحدات بلا سبب فيصعب مسحه من
 * بعيد على الطاولة.
 *
 * وأي فشل (شعار لا يُحمَّل، أو CORS يلوّث اللوحة) **يعود بالكود العادي**: كود
 * بلا شعار خير من زرّ تنزيل لا يعمل.
 */
export async function qrDataUrl(
  url: string,
  logo: string | null,
  size = 640,
  colors: { dark?: string; light?: string } = {}
): Promise<string> {
  const dark = colors.dark ?? "#141210";
  const light = colors.light ?? "#ffffff";
  const base = await QRCode.toDataURL(url, {
    width: size,
    margin: 2,
    color: { dark, light },
    errorCorrectionLevel: logo ? "H" : "M",
  });
  if (!logo) return base;
  try {
    const [qrImg, logoImg] = await Promise.all([loadImage(base), loadImage(logo, true)]);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return base;
    ctx.drawImage(qrImg, 0, 0, size, size);

    const box = Math.round(size * 0.2);
    const at = Math.round((size - box) / 2);
    const pad = Math.round(size * 0.015);
    // خلفية بلون الكود الفاتح خلف الشعار: بدونها تختلط وحدات الكود بحوافّ الشعار
    // فيفشل المسح. وتتبع لون الخلفية لا الأبيض دائماً كي تندمج في بطاقة ملوّنة.
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.roundRect(at - pad, at - pad, box + pad * 2, box + pad * 2, pad * 2);
    ctx.fill();
    ctx.drawImage(logoImg, at, at, box, box);
    return canvas.toDataURL("image/png");
  } catch {
    return base;
  }
}

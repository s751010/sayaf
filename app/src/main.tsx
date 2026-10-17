import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// كايرو وطجوال ثابتان لأن **المنيو** مبنيّ عليهما: طوابع كثيرة تختارهما خطّاً،
// وجذر المنيو مثبَّت على طجوال (`MenuPage`) فلا يتغيّر شكل منيو مطبوع رابطه.
// خطوط الطوابع الأخرى (أميري، ريم كوفي…) تُحمَّل عند الطلب عبر `lib/fonts.ts`.
import "@fontsource-variable/cairo";
import "@fontsource/tajawal/400.css";
import "@fontsource/tajawal/500.css";
import "@fontsource/tajawal/700.css";
// خطّا **المنصّة** (الهبوط واللوحة): **المراعي** للعناوين و**طجوال** للنصّ.
// ⚠️ كانا IBM Plex وريم كوفي (٢٠٢٦/١٠) فقال المالك: «غير معروف ولا مقبول عند
// الناس». والمراعي خطٌّ سعودي يعرفه كل من في السوق، وطجوال أشيع خطّ ويب عربي
// في المملكة — ومحمَّل أصلاً للمنيو، فلا يُنزَّل للمنصّة بايتٌ جديد للنصّ.
// تصريحات `@font-face` فقط: الملفّ لا يُنزَّل إلا حين يُرسم به نصّ.
import "@fontsource/almarai/700.css";
import "@fontsource/almarai/800.css";
import "./styles/global.css";
import App from "./App";
import { applyStoredTheme } from "./components/ui";

applyStoredTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Service worker: قشرة أوفلاين + كاش الأصول — لا يكاش Supabase ولا بوّابة الدفع أبداً.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    // صامتة عمداً: متصفّح يرفض عامل الخدمة (وضع خاصّ، أو إعداد مؤسّسي) يعمل
    // بلا كاش ولا ينقص المستخدمَ شيء — فليست عطلاً يُبلَّغ عنه.
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

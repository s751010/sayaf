import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// كايرو وطجوال وحدهما ثابتان — واجهة التطبيق كلها مبنيّة عليهما. خطوط الطوابع
// (أميري، ريم كوفي، وما بعدهما) تُحمَّل عند الطلب عبر `lib/fonts.ts`: كانت
// تُنزَّل لكل زائر منيو ولو لم يستعملها طابع مطعمه.
import "@fontsource-variable/cairo";
import "@fontsource/tajawal/400.css";
import "@fontsource/tajawal/500.css";
import "@fontsource/tajawal/700.css";
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

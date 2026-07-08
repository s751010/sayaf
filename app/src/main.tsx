import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/cairo";
import "@fontsource/tajawal/400.css";
import "@fontsource/tajawal/500.css";
import "@fontsource/tajawal/700.css";
import "@fontsource/reem-kufi/400.css";
import "@fontsource/reem-kufi/600.css";
import "@fontsource/amiri/400.css";
import "@fontsource/amiri/700.css";
import "./styles/global.css";
import App from "./App";
import { applyStoredTheme } from "./components/ui";

applyStoredTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Service worker: قشرة أوفلاين + كاش الأصول — لا يكاش Supabase/Moyasar أبداً.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

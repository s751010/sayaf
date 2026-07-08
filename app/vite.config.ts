import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

// الناتج يُبنى في deploy/ بجذر المستودع — وهو المجلد الذي يُسحب إلى Netlify.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  build: {
    outDir: "../deploy",
    emptyOutDir: true,
    chunkSizeWarningLimit: 900,
  },
});

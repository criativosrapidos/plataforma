// Gera a demonstração navegável num único HTML (site + plataforma), para publicar com link.
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const aqui = (p) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  root: aqui("."),
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "next/link": aqui("./shims/next-link.tsx"),
      "next/navigation": aqui("./shims/next-navigation.ts"),
      "next/font/google": aqui("./shims/next-font-google.ts"),
      "@": aqui("../src"),
    },
  },
  build: {
    outDir: aqui("../dist-demo"),
    emptyOutDir: true,
    rollupOptions: {
      onwarn(w, padrao) {
        if (w.code === "MODULE_LEVEL_DIRECTIVE") return;
        padrao(w);
      },
    },
  },
});

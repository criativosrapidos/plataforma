import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Painel e app são muito dinâmicos: usamos o modelo dinâmico clássico (sem Cache Components).
  transpilePackages: ["@aviso/shared"],
  // Texto integral de editais longos (Pergunte ao edital) é salvo pelo painel via Server Action.
  experimental: { serverActions: { bodySizeLimit: "8mb" } },
  turbopack: {
    root: path.join(__dirname, "../.."),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/** Carrega .env.local / .env para scripts fora do Next. */
export function carregarEnv() {
  for (const nome of [".env.local", ".env"]) {
    const p = path.join(__dirname, "..", nome);
    if (!existsSync(p)) continue;
    for (const linha of readFileSync(p, "utf8").split("\n")) {
      const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m || process.env[m[1]] !== undefined) continue;
      process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
    }
  }
}

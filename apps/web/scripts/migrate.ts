// Aplica db/migrations/*.sql em ordem, uma vez cada. Uso: tsx scripts/migrate.ts [--reset]
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { carregarEnv } from "./env";

carregarEnv();
const sql = postgres(process.env.DATABASE_URL!, { onnotice: () => {} });
const dir = path.join(__dirname, "..", "db", "migrations");

async function main() {
  if (process.argv.includes("--reset")) {
    if (process.env.NODE_ENV === "production") throw new Error("--reset bloqueado em produção");
    // Só apaga banco local. Para um banco remoto (ex.: staging), exija o nome dele: PERMITIR_RESET=<nome do banco>.
    const alvo = new URL(process.env.DATABASE_URL!);
    const nomeBanco = alvo.pathname.replace(/^\//, "");
    const local = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(alvo.hostname);
    if (!local && process.env.PERMITIR_RESET !== nomeBanco) {
      throw new Error(`--reset recusado: ${alvo.hostname} não é local. Se é isso mesmo, rode com PERMITIR_RESET=${nomeBanco}.`);
    }
    await sql.unsafe("drop schema public cascade; create schema public;");
    console.log("schema recriado");
  }
  await sql`create table if not exists schema_migrations (nome text primary key, aplicada_em timestamptz not null default now())`;
  const feitas = new Set((await sql`select nome from schema_migrations`).map((r) => r.nome as string));
  const arquivos = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const f of arquivos) {
    if (feitas.has(f)) continue;
    const conteudo = readFileSync(path.join(dir, f), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(conteudo);
      await tx`insert into schema_migrations (nome) values (${f})`;
    });
    console.log("aplicada", f);
  }
  console.log("migrações em dia");
  await sql.end();
}
main().catch(async (e) => {
  console.error(e);
  await sql.end();
  process.exit(1);
});

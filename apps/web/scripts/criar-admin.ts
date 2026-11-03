// Cria (ou promove) a conta de administração de produção com uma senha aleatória forte.
// Uso: DATABASE_URL=... npx tsx scripts/criar-admin.ts "Nome" email@dominio [admin|editor]
import { randomBytes } from "node:crypto";
import postgres from "postgres";
import { carregarEnv } from "./env";
import { hashSenha } from "../src/lib/auth/password";

carregarEnv();
const [nome, email, papel = "admin"] = process.argv.slice(2);
if (!nome || !email || !["admin", "editor"].includes(papel)) {
  console.error('Uso: npx tsx scripts/criar-admin.ts "Nome" email@dominio [admin|editor]');
  process.exit(1);
}
const sql = postgres(process.env.DATABASE_URL!, { onnotice: () => {} });

async function main() {
  const senha = randomBytes(18).toString("base64url");
  const [u] = await sql<{ id: string; novo: boolean }[]>`
    insert into users (nome, email, senha_hash, role, termos_aceitos_em)
    values (${nome}, ${email.trim().toLowerCase()}, ${await hashSenha(senha)}, ${papel}, now())
    on conflict (email) do update set role = excluded.role, senha_hash = excluded.senha_hash, updated_at = now()
    returning id, (xmax = 0) as novo`;
  await sql`insert into user_settings (user_id) values (${u.id}) on conflict do nothing`;
  await sql`update sessions set revoked_at = now() where user_id = ${u.id} and revoked_at is null`;
  await sql`insert into audit_log (acao, entidade, entidade_id, dados) values ('equipe.criar', 'user', ${u.id}, ${sql.json({ papel, novo: u.novo })})`;
  console.log(`${u.novo ? "Conta criada" : "Conta atualizada"}: ${email} (${papel})`);
  console.log(`Senha (mostrada só agora; troque em /conta/seguranca): ${senha}`);
}
main().then(() => sql.end()).catch(async (e) => { console.error(e); await sql.end(); process.exit(1); });

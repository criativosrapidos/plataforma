import type { Metadata } from "next";
import { sql } from "@/lib/db";
import { exigirLogin } from "@/lib/auth/guards";
import { CabecalhoConta } from "@/components/conta/Blocos";
import { Sessoes, TrocarSenha, type Sessao } from "@/components/conta/Seguranca";

export const metadata: Metadata = { title: "Segurança", robots: { index: false, follow: false } };

export default async function PaginaSeguranca() {
  const s = await exigirLogin("/conta/seguranca");
  const sessoes = await sql<Sessao[]>`
    select id, cliente, user_agent, created_at, expires_at, (id = ${s.sessaoId}) as atual
    from sessions where user_id = ${s.id} and revoked_at is null and expires_at > now()
    order by (id = ${s.sessaoId}) desc, created_at desc`;
  return (
    <div className="grid grid-cols-1 gap-6">
      <CabecalhoConta rotulo="Segurança" titulo="Senha e sessões" texto="Troque a senha e veja onde a sua conta está aberta: navegadores e o app." />
      <TrocarSenha />
      <Sessoes sessoes={sessoes.map((x) => ({ ...x }))} />
    </div>
  );
}

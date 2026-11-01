import type { Metadata } from "next";
import { casarPerfil } from "@aviso/shared";
import { sql } from "@/lib/db";
import { exigirLogin } from "@/lib/auth/guards";
import { concursosParaMatch, listarPerfis } from "@/lib/repo/perfis";
import { CabecalhoConta } from "@/components/conta/Blocos";
import { GerenciarPerfis } from "@/components/conta/GerenciarPerfis";
import { mostrarExemplos } from "@/components/site/concursos/util";
import { param } from "@/components/ui/destino";

export const metadata: Metadata = { title: "Perfis de busca", robots: { index: false, follow: false } };

type Busca = Promise<Record<string, string | string[] | undefined>>;

export default async function PaginaPerfis({ searchParams }: { searchParams: Busca }) {
  const u = await exigirLogin("/conta/perfis");
  const sp = await searchParams;
  const perfis = await listarPerfis(u.id);

  // Quantos concursos abertos/previstos combinam com cada perfil agora (mesma regra do envio de avisos).
  const candidatos = await sql<{ id: string }[]>`
    select id from contests
    where publicado and status in ('edital_aberto','autorizado','previsto','banca_definida')
      ${mostrarExemplos() ? sql`` : sql`and not exemplo`}`;
  const dados = candidatos.length ? await concursosParaMatch(candidatos.map((c) => c.id)) : [];
  const combinam: Record<string, number> = {};
  for (const p of perfis) combinam[p.id] = dados.filter((c) => casarPerfil(p, c).casa).length;

  return (
    <div className="grid grid-cols-1 gap-6">
      <CabecalhoConta
        rotulo="Perfis de busca"
        titulo="O que você procura"
        texto="Cada perfil é um filtro. Saiu concurso que combina com algum perfil ativo? Chega notificação no app. Perfis ilimitados."
      />
      <GerenciarPerfis perfis={perfis} combinam={combinam} abrirNovo={param(sp.novo) === "1"} />
    </div>
  );
}

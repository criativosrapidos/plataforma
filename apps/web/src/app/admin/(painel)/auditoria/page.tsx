import type { Metadata } from "next";
import Link from "next/link";
import { dataHoraBR, numeroBR } from "@aviso/shared";
import { FiltroBusca, FiltroSelect, FiltrosForm } from "@/components/admin/FiltrosForm";
import { Paginacao } from "@/components/admin/navegacao-tabela";
import { Cabecalho, Cartao, Etiqueta, Tabela, Td, Th, Tr, Vazio } from "@/components/admin/ui";
import { exigirPainel } from "@/lib/admin/auth";
import { like } from "@/lib/admin/consultas/busca";
import { ehUuid, int, str, type SP } from "@/lib/admin/params";
import { sql } from "@/lib/db";

export const metadata: Metadata = { title: "Auditoria" };

const LINK: Record<string, string> = {
  contest: "/admin/concursos/",
  user: "/admin/usuarios/",
  extraction: "/admin/revisao/",
  raw_document: "/admin/documentos/",
  source: "/admin/fontes/",
};

export default async function Auditoria({ searchParams }: { searchParams: Promise<SP> }) {
  await exigirPainel("admin", "/admin/auditoria");
  const sp = await searchParams;
  const pagina = int(sp, "pagina", 1, 1);
  const porPagina = 50;
  const entidade = str(sp, "entidade");
  const atorParam = str(sp, "ator");
  const ator = ehUuid(atorParam) ? atorParam : undefined;
  const q = str(sp, "q");
  const where = sql`
    true
    ${entidade ? sql`and a.entidade = ${entidade}` : sql``}
    ${ator ? sql`and a.actor_id = ${ator}::uuid` : sql``}
    ${q ? sql`and (a.acao || ' ' || coalesce(a.entidade_id, '') || ' ' || a.dados::text) ilike ${like(q)}` : sql``}`;
  const [[{ total }], itens, entidades, atores] = await Promise.all([
    sql<{ total: number }[]>`select count(*)::int as total from audit_log a where ${where}`,
    sql<{ id: number; acao: string; entidade: string; entidade_id: string | null; dados: unknown; created_at: Date; actor_id: string | null; ator: string | null }[]>`
      select a.id, a.acao, a.entidade, a.entidade_id, a.dados, a.created_at, a.actor_id, u.nome as ator
      from audit_log a left join users u on u.id = a.actor_id where ${where}
      order by a.id desc limit ${porPagina} offset ${(pagina - 1) * porPagina}`,
    sql<{ entidade: string }[]>`select distinct entidade from audit_log order by 1`,
    sql<{ id: string; nome: string }[]>`select distinct u.id, u.nome from audit_log a join users u on u.id = a.actor_id order by u.nome`,
  ]);

  return (
    <>
      <Cabecalho titulo="Auditoria" sub={`${numeroBR(total)} registros. Ações sensíveis da equipe: aprovações, erratas, papéis, cortesias, exportações, configurações.`} />
      <div className="mb-3">
        <FiltrosForm acao="/admin/auditoria">
          <FiltroBusca valor={q} placeholder="Ação, id ou conteúdo" />
          <FiltroSelect nome="entidade" rotulo="Entidade" valor={entidade} todos="Todas" opcoes={entidades.map((e) => ({ valor: e.entidade, rotulo: e.entidade }))} />
          <FiltroSelect nome="ator" rotulo="Quem" valor={ator} opcoes={atores.map((a) => ({ valor: a.id, rotulo: a.nome }))} />
        </FiltrosForm>
      </div>
      <Cartao corpo={false}>
        {itens.length === 0 ? (
          <Vazio titulo="Nada registrado" texto="As ações sensíveis do painel aparecem aqui." />
        ) : (
          <>
            <Tabela>
              <thead>
                <tr>
                  <Th>Quando</Th>
                  <Th>Quem</Th>
                  <Th>Ação</Th>
                  <Th>Alvo</Th>
                  <Th>Dados</Th>
                </tr>
              </thead>
              <tbody>
                {itens.map((a) => {
                  const json = JSON.stringify(a.dados);
                  return (
                    <Tr key={a.id}>
                      <Td className="whitespace-nowrap align-top font-mono text-[12px]">{dataHoraBR(a.created_at)}</Td>
                      <Td className="whitespace-nowrap align-top">{a.ator ?? <span className="text-tx2">sistema</span>}</Td>
                      <Td className="align-top">
                        <Etiqueta tom={/apagar|revogar|rejeitar|despublicar|exportar/.test(a.acao) ? "ambar" : "cinza"}>{a.acao}</Etiqueta>
                      </Td>
                      <Td className="align-top text-[12.5px]">
                        {a.entidade}
                        {a.entidade_id &&
                          (LINK[a.entidade] && /^[0-9a-f-]{36}$/.test(a.entidade_id) ? (
                            <Link href={LINK[a.entidade] + a.entidade_id} className="ml-1 font-mono text-[11.5px] text-azul hover:underline">
                              {a.entidade_id.slice(0, 8)}
                            </Link>
                          ) : (
                            <span className="ml-1 font-mono text-[11.5px] text-tx2">{a.entidade_id}</span>
                          ))}
                      </Td>
                      <Td className="max-w-[520px] align-top">
                        {json === "{}" ? (
                          <span className="text-tx2">—</span>
                        ) : json.length < 90 ? (
                          <code className="font-mono text-[11.5px] text-tx2">{json}</code>
                        ) : (
                          <details>
                            <summary className="cursor-pointer truncate font-mono text-[11.5px] text-tx2">{json.slice(0, 80)}…</summary>
                            <pre className="mt-1 max-h-72 overflow-auto rounded-lg bg-papel p-2 font-mono text-[11px]">{JSON.stringify(a.dados, null, 2)}</pre>
                          </details>
                        )}
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Tabela>
            <Paginacao base="/admin/auditoria" sp={sp} pagina={pagina} porPagina={porPagina} total={total} />
          </>
        )}
      </Cartao>
    </>
  );
}

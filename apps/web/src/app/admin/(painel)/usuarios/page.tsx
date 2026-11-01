import type { Metadata } from "next";
import Link from "next/link";
import { dataBR, numeroBR, SUB_STATUS } from "@aviso/shared";
import { FiltroBusca, FiltroSelect, FiltrosForm } from "@/components/admin/FiltrosForm";
import { Paginacao, ThOrdem } from "@/components/admin/navegacao-tabela";
import { Cabecalho, Cartao, Etiqueta, Tabela, Td, Th, Tr, Vazio } from "@/components/admin/ui";
import { exigirPainel } from "@/lib/admin/auth";
import { listarUsuarios, ORDENS_USUARIO } from "@/lib/admin/consultas/usuarios";
import { CICLO_ROTULO, idade, PAPEL_ROTULO, PAPEL_TOM, PLANO_ROTULO, SUB_STATUS_ROTULO, SUB_STATUS_TOM } from "@/lib/admin/formato";
import { int, str, um, type SP } from "@/lib/admin/params";

export const metadata: Metadata = { title: "Usuários" };

export default async function Usuarios({ searchParams }: { searchParams: Promise<SP> }) {
  await exigirPainel("admin", "/admin/usuarios");
  const sp = await searchParams;
  const ordem = um(sp, "ordem", ORDENS_USUARIO) ?? "cadastro";
  const dir = um(sp, "dir", ["asc", "desc"] as const) ?? (ordem === "nome" ? "asc" : "desc");
  const pagina = int(sp, "pagina", 1, 1);
  const porPagina = 50;
  const { itens, total } = await listarUsuarios({
    q: str(sp, "q"),
    status: um(sp, "status", [...SUB_STATUS, "sem"] as const),
    plano: um(sp, "plano", ["aviso", "aprovado"] as const),
    papel: um(sp, "papel", ["user", "editor", "admin"] as const),
    ordem,
    dir,
    pagina,
    porPagina,
  });
  const th = { base: "/admin/usuarios", sp, atual: ordem, dir };
  const agora = new Date();

  return (
    <>
      <Cabecalho titulo="Usuários" sub={`${numeroBR(total)} ${total === 1 ? "pessoa" : "pessoas"} com estes filtros.`} />
      <div className="mb-3">
        <FiltrosForm acao="/admin/usuarios" manter={{ ordem: str(sp, "ordem"), dir: str(sp, "dir") }}>
          <FiltroBusca valor={str(sp, "q")} placeholder="Nome, e-mail ou telefone" />
          <FiltroSelect nome="status" rotulo="Assinatura" valor={str(sp, "status")} opcoes={[...SUB_STATUS, "sem"].map((x) => ({ valor: x, rotulo: SUB_STATUS_ROTULO[x] }))} />
          <FiltroSelect nome="plano" rotulo="Plano" valor={str(sp, "plano")} opcoes={[{ valor: "aviso", rotulo: "Aviso" }, { valor: "aprovado", rotulo: "Aprovado" }]} />
          <FiltroSelect nome="papel" rotulo="Papel" valor={str(sp, "papel")} opcoes={["user", "editor", "admin"].map((x) => ({ valor: x, rotulo: PAPEL_ROTULO[x] }))} />
        </FiltrosForm>
      </div>
      <Cartao corpo={false}>
        {itens.length === 0 ? (
          <Vazio titulo="Ninguém encontrado" texto="Ajuste a busca ou os filtros." />
        ) : (
          <>
            <Tabela>
              <thead>
                <tr>
                  <ThOrdem {...th} campo="nome" padraoDir="asc">
                    Pessoa
                  </ThOrdem>
                  <Th>Papel</Th>
                  <Th>Assinatura</Th>
                  <Th>Teste / período até</Th>
                  <Th num>Acompanha</Th>
                  <ThOrdem {...th} campo="cadastro">
                    Cadastro
                  </ThOrdem>
                  <ThOrdem {...th} campo="acesso">
                    Último acesso
                  </ThOrdem>
                </tr>
              </thead>
              <tbody>
                {itens.map((u) => (
                  <Tr key={u.id}>
                    <Td className="min-w-[240px]">
                      <Link href={`/admin/usuarios/${u.id}`} className="font-semibold hover:text-azul">
                        {u.nome}
                      </Link>
                      <p className="text-[12px] text-tx2">{u.email}</p>
                    </Td>
                    <Td>
                      <Etiqueta tom={PAPEL_TOM[u.role]}>{PAPEL_ROTULO[u.role]}</Etiqueta>
                    </Td>
                    <Td className="whitespace-nowrap">
                      {u.status ? (
                        <span className="flex items-center gap-1.5">
                          <Etiqueta tom={SUB_STATUS_TOM[u.status]}>{SUB_STATUS_ROTULO[u.status]}</Etiqueta>
                          <span className="text-[12.5px]">
                            {PLANO_ROTULO[u.plano ?? ""]} <span className="text-tx2">· {CICLO_ROTULO[u.ciclo ?? ""]}</span>
                          </span>
                          {u.provider === "cortesia" && <Etiqueta tom="roxo">Cortesia</Etiqueta>}
                        </span>
                      ) : (
                        <span className="text-[12.5px] text-tx2">Sem assinatura</span>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap font-mono text-[12px]">
                      {u.status === "trial" ? (
                        <span className={u.trial_ends_at && new Date(u.trial_ends_at) < agora ? "text-verm" : undefined}>teste {dataBR(u.trial_ends_at)}</span>
                      ) : u.current_period_end ? (
                        dataBR(u.current_period_end)
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td num>{u.acompanhando}</Td>
                    <Td className="whitespace-nowrap font-mono text-[12px]">{dataBR(u.created_at)}</Td>
                    <Td className="whitespace-nowrap font-mono text-[12px] text-tx2">{idade(u.ultimo_acesso_em, agora)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Tabela>
            <Paginacao base="/admin/usuarios" sp={sp} pagina={pagina} porPagina={porPagina} total={total} />
          </>
        )}
      </Cartao>
    </>
  );
}

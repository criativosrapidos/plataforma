import type { Metadata } from "next";
import Link from "next/link";
import { brl, CONTEST_STATUS, CONTEST_STATUS_LABEL, dataBR, DATE_TIPO_LABEL, numeroBR, UFS, type ContestStatus, type DateTipo } from "@aviso/shared";
import { AcaoBotao } from "@/components/admin/AcaoBotao";
import { FiltroBusca, FiltroSelect, FiltrosForm } from "@/components/admin/FiltrosForm";
import { Paginacao, ThOrdem } from "@/components/admin/navegacao-tabela";
import { botao, Cabecalho, Cartao, Etiqueta, Tabela, Td, Th, Tr, Vazio } from "@/components/admin/ui";
import { apagarExemplosAcao } from "@/lib/admin/acoes/concursos";
import { exigirPainel } from "@/lib/admin/auth";
import { bancasEmUso, contagemExemplos, listarConcursos, ORDENS_CONCURSO } from "@/lib/admin/consultas/concursos";
import { CONCURSO_STATUS_TOM } from "@/lib/admin/formato";
import { boolParam, int, str, um, type SP } from "@/lib/admin/params";

export const metadata: Metadata = { title: "Concursos" };

export default async function Concursos({ searchParams }: { searchParams: Promise<SP> }) {
  const s = await exigirPainel("editor", "/admin/concursos");
  const sp = await searchParams;
  const ordem = um(sp, "ordem", ORDENS_CONCURSO) ?? "atualizado";
  const dir = um(sp, "dir", ["asc", "desc"] as const) ?? (ordem === "titulo" ? "asc" : "desc");
  const pagina = int(sp, "pagina", 1, 1);
  const porPagina = 25;
  const [{ itens, total }, bancas, exemplos] = await Promise.all([
    listarConcursos({
      q: str(sp, "q"),
      status: um(sp, "status", CONTEST_STATUS),
      esfera: um(sp, "esfera", ["federal", "estadual", "municipal"] as const),
      uf: str(sp, "uf"),
      banca: str(sp, "banca"),
      publicado: boolParam(sp, "publicado"),
      exemplo: boolParam(sp, "exemplo"),
      ordem,
      dir,
      pagina,
      porPagina,
    }),
    bancasEmUso(),
    contagemExemplos(),
  ]);
  const th = { base: "/admin/concursos", sp, atual: ordem, dir };

  return (
    <>
      <Cabecalho titulo="Concursos" sub={`${numeroBR(total)} ${total === 1 ? "concurso" : "concursos"} com estes filtros.`}>
        {s.role === "admin" && exemplos.concursos > 0 && (
          <AcaoBotao
            acao={apagarExemplosAcao}
            rotulo={`Apagar ${exemplos.concursos} de exemplo`}
            variante="sec"
            className="text-verm"
            confirmar={{
              titulo: "Apagar todos os concursos de exemplo?",
              texto: (
                <>
                  Remove <b>{exemplos.concursos}</b> concursos marcados como exemplo, com cargos, datas, matérias e{" "}
                  <b>{exemplos.seguidores}</b> acompanhamentos (e os avisos ligados a eles). Concursos reais não são afetados. Não dá para desfazer.
                </>
              ),
              botao: "Apagar exemplos",
              perigo: true,
            }}
          />
        )}
        <Link href="/admin/concursos/novo" className={botao("primario")}>
          + Novo concurso
        </Link>
      </Cabecalho>

      <div className="mb-3">
        <FiltrosForm acao="/admin/concursos" manter={{ ordem: str(sp, "ordem"), dir: str(sp, "dir") }}>
          <FiltroBusca valor={str(sp, "q")} placeholder="Órgão, título, sigla, edital, cidade" />
          <FiltroSelect nome="status" rotulo="Situação" valor={str(sp, "status")} opcoes={CONTEST_STATUS.map((x) => ({ valor: x, rotulo: CONTEST_STATUS_LABEL[x] }))} />
          <FiltroSelect nome="esfera" rotulo="Esfera" valor={str(sp, "esfera")} todos="Todas" opcoes={[{ valor: "federal", rotulo: "Federal" }, { valor: "estadual", rotulo: "Estadual" }, { valor: "municipal", rotulo: "Municipal" }]} />
          <FiltroSelect nome="uf" rotulo="UF" valor={str(sp, "uf")} todos="Todas" opcoes={[{ valor: "nacional", rotulo: "Nacional" }, ...UFS.map((u) => ({ valor: u, rotulo: u }))]} />
          <FiltroSelect nome="banca" rotulo="Banca" valor={str(sp, "banca")} todos="Todas" opcoes={[{ valor: "sem", rotulo: "Sem banca" }, ...bancas.map((b) => ({ valor: b, rotulo: b }))]} />
          <FiltroSelect nome="publicado" rotulo="Publicado" valor={str(sp, "publicado")} opcoes={[{ valor: "sim", rotulo: "Publicados" }, { valor: "nao", rotulo: "Rascunhos" }]} />
          <FiltroSelect nome="exemplo" rotulo="Exemplo" valor={str(sp, "exemplo")} opcoes={[{ valor: "nao", rotulo: "Reais" }, { valor: "sim", rotulo: "De exemplo" }]} />
        </FiltrosForm>
      </div>

      <Cartao corpo={false}>
        {itens.length === 0 ? (
          <Vazio titulo="Nenhum concurso" texto="Ajuste os filtros ou cadastre um concurso à mão.">
            <Link href="/admin/concursos/novo" className={botao("primario", "md", "mt-2")}>
              + Novo concurso
            </Link>
          </Vazio>
        ) : (
          <>
            <Tabela>
              <thead>
                <tr>
                  <ThOrdem {...th} campo="titulo" padraoDir="asc">
                    Concurso
                  </ThOrdem>
                  <Th>Situação</Th>
                  <Th>Local</Th>
                  <Th>Banca</Th>
                  <ThOrdem {...th} campo="vagas" num>
                    Vagas
                  </ThOrdem>
                  <ThOrdem {...th} campo="salario" num>
                    Salário até
                  </ThOrdem>
                  <ThOrdem {...th} campo="seguidores" num>
                    Seguidores
                  </ThOrdem>
                  <ThOrdem {...th} campo="prazo" padraoDir="asc">
                    Próxima data
                  </ThOrdem>
                  <ThOrdem {...th} campo="atualizado">
                    Atualizado
                  </ThOrdem>
                </tr>
              </thead>
              <tbody>
                {itens.map((c) => (
                  <Tr key={c.id}>
                    <Td className="min-w-[220px] max-w-[340px]">
                      <Link href={`/admin/concursos/${c.id}`} className="font-semibold hover:text-azul">
                        {c.titulo}
                      </Link>
                      <p className="truncate text-[12px] text-tx2" title={c.orgao}>
                        {c.orgao}
                        {c.numero_edital && <span className="font-mono"> · ed. {c.numero_edital}</span>}
                      </p>
                      {(!c.publicado || c.exemplo) && (
                        <p className="mt-0.5 flex gap-1">
                          {!c.publicado && <Etiqueta tom="ambar">Rascunho</Etiqueta>}
                          {c.exemplo && <Etiqueta tom="cinza">Exemplo</Etiqueta>}
                        </p>
                      )}
                    </Td>
                    <Td>
                      <Etiqueta tom={CONCURSO_STATUS_TOM[c.status]}>{CONTEST_STATUS_LABEL[c.status as ContestStatus]}</Etiqueta>
                    </Td>
                    <Td className="whitespace-nowrap text-[12.5px]">
                      <span className="capitalize">{c.esfera}</span> · <span className="font-mono">{c.uf ?? "BR"}</span>
                    </Td>
                    <Td className="whitespace-nowrap text-[12.5px]">{c.banca ?? <span className="text-tx2">—</span>}</Td>
                    <Td num>{numeroBR(c.vagas_total)}</Td>
                    <Td num>{brl(c.salario_max_centavos)}</Td>
                    <Td num>{numeroBR(c.seguidores)}</Td>
                    <Td className="whitespace-nowrap text-[12.5px] leading-tight">
                      {c.proxima ? (
                        <>
                          <span className="font-mono">{dataBR(c.proxima.data)}</span>
                          <span className="block text-[11.5px] text-tx2">{DATE_TIPO_LABEL[c.proxima.tipo as DateTipo]}</span>
                        </>
                      ) : (
                        <span className="text-tx2">—</span>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap font-mono text-[12px] text-tx2">{dataBR(c.updated_at)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Tabela>
            <Paginacao base="/admin/concursos" sp={sp} pagina={pagina} porPagina={porPagina} total={total} />
          </>
        )}
      </Cartao>
    </>
  );
}


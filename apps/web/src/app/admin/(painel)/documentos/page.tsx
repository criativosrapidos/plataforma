import type { Metadata } from "next";
import Link from "next/link";
import { dataBR, dataHoraBR, numeroBR } from "@aviso/shared";
import { AcaoBotao } from "@/components/admin/AcaoBotao";
import { FiltroBusca, FiltroData, FiltroSelect, FiltrosForm } from "@/components/admin/FiltrosForm";
import { Paginacao } from "@/components/admin/navegacao-tabela";
import { Cabecalho, Cartao, cx, Etiqueta, Tabela, Td, Th, Tr, Vazio } from "@/components/admin/ui";
import { reprocessarDocumentoAcao } from "@/lib/admin/acoes/coleta";
import { exigirPainel } from "@/lib/admin/auth";
import { listarDocumentos, todasFontes } from "@/lib/admin/consultas/coleta";
import { DOC_STATUS, DOC_STATUS_ROTULO, DOC_STATUS_TOM } from "@/lib/admin/formato";
import { dataParam, int, str, um, urlCom, type SP } from "@/lib/admin/params";

export const metadata: Metadata = { title: "Documentos" };

export default async function Documentos({ searchParams }: { searchParams: Promise<SP> }) {
  await exigirPainel("editor", "/admin/documentos");
  const sp = await searchParams;
  const pagina = int(sp, "pagina", 1, 1);
  const porPagina = 50;
  const status = um(sp, "status", DOC_STATUS);
  const [{ itens, total, porStatus }, fontes] = await Promise.all([
    listarDocumentos({ status, fonte: str(sp, "fonte"), de: dataParam(sp, "de"), ate: dataParam(sp, "ate"), q: str(sp, "q"), pagina, porPagina }),
    todasFontes(),
  ]);

  return (
    <>
      <Cabecalho titulo="Documentos" sub="Tudo o que os coletores guardaram dos diários e das bancas. Rodar a coleta 2 vezes não duplica (hash do conteúdo)." />

      <div className="mb-3 flex flex-wrap gap-1.5">
        {DOC_STATUS.map((st) => {
          const n = porStatus.find((p) => p.status === st)?.n ?? 0;
          const ativo = status === st;
          return (
            <Link
              key={st}
              href={urlCom("/admin/documentos", sp, { status: ativo ? undefined : st, pagina: undefined })}
              aria-pressed={ativo}
              className={cx(
                "inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-[12.5px] font-semibold",
                ativo ? "border-tinta bg-tinta text-white" : "border-linha bg-branco hover:border-tinta/40",
              )}
            >
              {DOC_STATUS_ROTULO[st]} <span className={cx("font-mono text-[12px]", !ativo && "text-tx2")}>{numeroBR(n)}</span>
            </Link>
          );
        })}
      </div>

      <div className="mb-3">
        <FiltrosForm acao="/admin/documentos" manter={{ status }}>
          <FiltroBusca valor={str(sp, "q")} placeholder="Título ou URL" />
          <FiltroSelect nome="fonte" rotulo="Fonte" valor={str(sp, "fonte")} todos="Todas" opcoes={fontes.map((f) => ({ valor: f.id, rotulo: f.nome }))} />
          <FiltroData nome="de" rotulo="Coletado de" valor={dataParam(sp, "de")} />
          <FiltroData nome="ate" rotulo="até" valor={dataParam(sp, "ate")} />
        </FiltrosForm>
      </div>

      <Cartao corpo={false}>
        {itens.length === 0 ? (
          <Vazio titulo="Nenhum documento" texto="Nada coletado com esses filtros." />
        ) : (
          <>
            <Tabela>
              <thead>
                <tr>
                  <Th>Coletado · publicado</Th>
                  <Th>Documento</Th>
                  <Th>Fonte</Th>
                  <Th>Situação</Th>
                  <Th num>Extrações</Th>
                  <Th num>Caracteres</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {itens.map((d) => (
                  <Tr key={d.id}>
                    <Td className="whitespace-nowrap font-mono text-[12px] leading-tight">
                      {dataHoraBR(d.coletado_em)}
                      <span className="block text-[11px] text-tx2">pub. {dataBR(d.publicado_em)}</span>
                    </Td>
                    <Td className="min-w-[240px] max-w-[400px]">
                      <Link href={`/admin/documentos/${d.id}`} className="line-clamp-1 font-semibold hover:text-azul">
                        {d.titulo ?? d.url}
                      </Link>
                      {d.erro ? <p className="truncate font-mono text-[11px] text-verm">{d.erro}</p> : <p className="truncate text-[11.5px] text-tx2">{d.url}</p>}
                    </Td>
                    <Td className="max-w-[170px] truncate whitespace-nowrap text-[12.5px]" >{d.fonte ?? "—"}</Td>
                    <Td>
                      <Etiqueta tom={DOC_STATUS_TOM[d.status]}>{DOC_STATUS_ROTULO[d.status]}</Etiqueta>
                    </Td>
                    <Td num>{d.extracoes}</Td>
                    <Td num className="whitespace-nowrap text-tx2">
                      {d.tamanho ? numeroBR(d.tamanho) : "—"}
                    </Td>
                    <Td className="text-right">
                      <AcaoBotao
                        acao={reprocessarDocumentoAcao.bind(null, d.id)}
                        rotulo="Reprocessar"
                        tamanho="sm"
                        variante="fantasma"
                        confirmar={{ titulo: "Reprocessar documento?", texto: "Classifica e extrai de novo. Se virar concurso com baixa confiança, volta para a fila de revisão.", botao: "Reprocessar" }}
                      />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Tabela>
            <Paginacao base="/admin/documentos" sp={sp} pagina={pagina} porPagina={porPagina} total={total} />
          </>
        )}
      </Cartao>
    </>
  );
}

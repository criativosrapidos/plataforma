import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ACT_TIPO_LABEL, dataHoraBR, type ActTipo } from "@aviso/shared";
import { AcaoBotao } from "@/components/admin/AcaoBotao";
import { DocumentoOriginal } from "@/components/admin/DocumentoOriginal";
import { Cabecalho, Cartao, Definicoes, Etiqueta } from "@/components/admin/ui";
import { reprocessarDocumentoAcao } from "@/lib/admin/acoes/coleta";
import { exigirPainel } from "@/lib/admin/auth";
import { documentoDetalhe } from "@/lib/admin/consultas/coleta";
import { DOC_STATUS_ROTULO, DOC_STATUS_TOM, EXTRACAO_STATUS_ROTULO, EXTRACAO_STATUS_TOM, pct } from "@/lib/admin/formato";
import { ehUuid } from "@/lib/admin/params";

export const metadata: Metadata = { title: "Documento" };

export default async function Documento({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await exigirPainel("editor", `/admin/documentos/${id}`);
  if (!ehUuid(id)) notFound();
  const d = await documentoDetalhe(id);
  if (!d) notFound();
  const meta = d.metadata && typeof d.metadata === "object" && Object.keys(d.metadata).length ? JSON.stringify(d.metadata, null, 2) : null;

  return (
    <>
      <Cabecalho
        titulo="Documento"
        voltar={{ href: "/admin/documentos", rotulo: "Documentos" }}
        sub={
          <span className="flex flex-wrap items-center gap-1.5">
            <Etiqueta tom={DOC_STATUS_TOM[d.status]}>{DOC_STATUS_ROTULO[d.status]}</Etiqueta>
            {d.titulo}
          </span>
        }
      >
        <AcaoBotao
          acao={reprocessarDocumentoAcao.bind(null, d.id)}
          rotulo="Reprocessar"
          variante="primario"
          confirmar={{ titulo: "Reprocessar documento?", texto: "Classifica e extrai de novo com a IA. O custo da extração entra no painel.", botao: "Reprocessar" }}
        />
      </Cabecalho>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <DocumentoOriginal
          doc={{ titulo: d.titulo, url: d.url, texto: d.conteudo_texto, fonte: d.fonte, publicado_em: d.publicado_em, coletado_em: d.coletado_em }}
          className="h-[75dvh]"
        />
        <aside className="space-y-4">
          {d.erro && (
            <Cartao titulo="Erro no processamento">
              <p className="font-mono text-[12px] text-verm">{d.erro}</p>
            </Cartao>
          )}
          <Cartao titulo="Detalhes">
            <Definicoes
              colunas={1}
              itens={[
                ["Fonte", d.fonte_id ? <Link href={`/admin/fontes/${d.fonte_id}`} className="text-azul hover:underline">{d.fonte}</Link> : "—"],
                ["Coletado", <span key="c" className="font-mono">{dataHoraBR(d.coletado_em)}</span>],
                ["Tipo", d.mime ?? "—"],
                ["Original guardado em", d.storage_path ? <span key="s" className="font-mono text-[12px]">{d.storage_path}</span> : "—"],
                ["Hash (sha256)", <span key="h" className="break-all font-mono text-[11px]">{d.hash}</span>],
              ]}
            />
            {meta && (
              <details className="mt-3">
                <summary className="cursor-pointer text-[12.5px] font-semibold text-tx2">Metadados</summary>
                <pre className="mt-1 max-h-60 overflow-auto rounded-lg bg-papel p-2 font-mono text-[11px]">{meta}</pre>
              </details>
            )}
          </Cartao>
          <Cartao titulo={`Extrações (${d.extracoes.length})`} corpo={false}>
            {d.extracoes.length === 0 ? (
              <p className="p-4 text-[13px] text-tx2">Nenhuma extração deste documento.</p>
            ) : (
              <ul className="divide-y divide-linha">
                {d.extracoes.map((x) => (
                  <li key={x.id}>
                    <Link href={`/admin/revisao/${x.id}`} className="block px-4 py-2.5 text-[13px] hover:bg-papel">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate font-semibold">{x.orgao ?? "Sem órgão"}</span>
                        <Etiqueta tom={EXTRACAO_STATUS_TOM[x.status]}>{EXTRACAO_STATUS_ROTULO[x.status]}</Etiqueta>
                      </span>
                      <span className="font-mono text-[11.5px] text-tx2">
                        {dataHoraBR(x.created_at)} · {pct(x.confianca)} · {x.modelo}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Cartao>
          <Cartao titulo={`Atos (${d.atos.length})`} corpo={false}>
            {d.atos.length === 0 ? (
              <p className="p-4 text-[13px] text-tx2">Nenhum ato classificado.</p>
            ) : (
              <ul className="divide-y divide-linha">
                {d.atos.map((a) => (
                  <li key={a.id} className="px-4 py-2.5 text-[13px]">
                    <Etiqueta tom={a.tipo === "retificacao" ? "roxo" : "cinza"}>{ACT_TIPO_LABEL[a.tipo as ActTipo]}</Etiqueta>{" "}
                    {a.contest_id ? (
                      <Link href={`/admin/concursos/${a.contest_id}`} className="font-semibold text-azul hover:underline">
                        {a.contest_titulo}
                      </Link>
                    ) : (
                      <span className="text-tx2">sem concurso</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Cartao>
        </aside>
      </div>
    </>
  );
}

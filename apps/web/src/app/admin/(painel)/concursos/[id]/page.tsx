import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ACT_TIPO_LABEL, CONTEST_STATUS_LABEL, dataBR, dataHoraBR, numeroBR, type ActTipo, type ContestStatus } from "@aviso/shared";
import { AcaoBotao } from "@/components/admin/AcaoBotao";
import { DiffVersao } from "@/components/admin/concursos/DiffVersao";
import { EditorConcurso } from "@/components/admin/concursos/EditorConcurso";
import { Icone } from "@/components/admin/icones";
import { botao, Cabecalho, Cartao, Etiqueta } from "@/components/admin/ui";
import { publicarConcursoAcao } from "@/lib/admin/acoes/concursos";
import { exigirPainel } from "@/lib/admin/auth";
import { modeloDeBanco } from "@/lib/admin/concurso-form";
import { concursoBanco, extrasDoConcurso, todasMaterias } from "@/lib/admin/consultas/concursos";
import { CONCURSO_STATUS_TOM, EXTRACAO_STATUS_ROTULO, EXTRACAO_STATUS_TOM, linkSeguro, pct } from "@/lib/admin/formato";
import { ehUuid } from "@/lib/admin/params";
import { sql } from "@/lib/db";

export const metadata: Metadata = { title: "Concurso" };

export default async function Concurso({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await exigirPainel("editor", `/admin/concursos/${id}`);
  if (!ehUuid(id)) notFound();
  const [c, extras, materias, [meta]] = await Promise.all([
    concursoBanco(id),
    extrasDoConcurso(id),
    todasMaterias(),
    sql<{ updated_at: Date }[]>`select updated_at from contests where id = ${id}`,
  ]);
  if (!c || !meta) notFound();

  return (
    <>
      <Cabecalho
        titulo={c.titulo}
        voltar={{ href: "/admin/concursos", rotulo: "Concursos" }}
        sub={
          <span className="flex flex-wrap items-center gap-1.5">
            <Etiqueta tom={CONCURSO_STATUS_TOM[c.status]}>{CONTEST_STATUS_LABEL[c.status as ContestStatus]}</Etiqueta>
            {c.publicado ? <Etiqueta tom="verde">Publicado</Etiqueta> : <Etiqueta tom="ambar">Rascunho</Etiqueta>}
            {c.exemplo && <Etiqueta tom="cinza">Exemplo</Etiqueta>}
            <span>
              {c.orgao} · <b className="font-mono">{numeroBR(extras.seguidores)}</b> {extras.seguidores === 1 ? "pessoa acompanha" : "pessoas acompanham"} · atualizado{" "}
              <span className="font-mono">{dataHoraBR(meta.updated_at)}</span>
            </span>
          </span>
        }
      >
        <a href={linkSeguro(c.url_oficial)} target="_blank" rel="noopener noreferrer" className={botao("sec")}>
          Fonte oficial <Icone nome="externo" className="size-4" />
        </a>
        {c.publicado ? (
          <AcaoBotao
            acao={publicarConcursoAcao.bind(null, id, false)}
            rotulo="Despublicar"
            confirmar={{
              titulo: "Despublicar este concurso?",
              texto: `Ele some do app e do site. ${extras.seguidores ? `${extras.seguidores} pessoas acompanham e deixam de ver as datas na agenda.` : ""}`,
              botao: "Despublicar",
              perigo: true,
            }}
          />
        ) : (
          <AcaoBotao
            acao={publicarConcursoAcao.bind(null, id, true)}
            rotulo="Publicar"
            variante="primario"
            confirmar={{ titulo: "Publicar este concurso?", texto: "Ele passa a aparecer no app e no site. Confira o link oficial e as datas.", botao: "Publicar" }}
          />
        )}
      </Cabecalho>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <EditorConcurso
          key={meta.updated_at.toISOString()}
          id={id}
          modeloInicial={modeloDeBanco(c)}
          publicado={c.publicado}
          seguidores={extras.seguidores}
          materias={materias}
        />

        <aside className="space-y-4">
          <Cartao titulo="Histórico de versões" sub="Erratas e retificações registradas (o que quem acompanha viu mudar).">
            {extras.versoes.length === 0 ? (
              <p className="text-[13px] text-tx2">Nenhuma errata registrada.</p>
            ) : (
              <ol className="space-y-4">
                {extras.versoes.map((v) => (
                  <li key={v.versao} className="border-l-2 border-azul/30 pl-3">
                    <p className="flex flex-wrap items-center gap-1.5 text-[12px] text-tx2">
                      <Etiqueta tom="azul">v{v.versao}</Etiqueta>
                      <span className="font-mono">{dataHoraBR(v.created_at)}</span>
                      {v.act_tipo && <span>· {ACT_TIPO_LABEL[v.act_tipo as ActTipo]}</span>}
                    </p>
                    {v.resumo && <p className="mt-1 text-[13px] font-semibold">{v.resumo}</p>}
                    <div className="mt-1.5">
                      <DiffVersao diff={v.diff_json} />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Cartao>

          <Cartao titulo={`Atos ligados (${extras.atos.length})`} corpo={false}>
            {extras.atos.length === 0 ? (
              <p className="p-4 text-[13px] text-tx2">Nenhum ato do diário ligado a este concurso.</p>
            ) : (
              <ul className="divide-y divide-linha">
                {extras.atos.map((a) => (
                  <li key={a.id} className="px-4 py-2.5 text-[13px]">
                    <p className="flex flex-wrap items-center gap-1.5">
                      <Etiqueta tom={a.tipo === "retificacao" ? "roxo" : "cinza"}>{ACT_TIPO_LABEL[a.tipo as ActTipo]}</Etiqueta>
                      <span className="font-mono text-[12px] text-tx2">{dataBR(a.publicado_em ?? a.created_at)}</span>
                      {a.confianca != null && <span className="font-mono text-[12px] text-tx2">· {pct(a.confianca)}</span>}
                    </p>
                    {a.resumo && <p className="mt-1 line-clamp-2 text-tx2">{a.resumo}</p>}
                    <p className="mt-1 flex gap-3 text-[12.5px]">
                      {a.doc_id && (
                        <Link href={`/admin/documentos/${a.doc_id}`} className="font-semibold text-azul hover:underline">
                          Documento
                        </Link>
                      )}
                      {a.url_oficial && (
                        <a href={linkSeguro(a.url_oficial)} target="_blank" rel="noopener noreferrer" className="font-semibold text-azul hover:underline">
                          Oficial ↗
                        </a>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Cartao>

          {extras.extracoes.length > 0 && (
            <Cartao titulo="Extrações" corpo={false}>
              <ul className="divide-y divide-linha">
                {extras.extracoes.map((x) => (
                  <li key={x.id}>
                    <Link href={`/admin/revisao/${x.id}`} className="flex items-center justify-between gap-2 px-4 py-2 text-[13px] hover:bg-papel">
                      <span className="font-mono text-[12px]">{dataHoraBR(x.created_at)}</span>
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[12px] text-tx2">{pct(x.confianca)}</span>
                        <Etiqueta tom={EXTRACAO_STATUS_TOM[x.status]}>{EXTRACAO_STATUS_ROTULO[x.status]}</Etiqueta>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Cartao>
          )}
        </aside>
      </div>
    </>
  );
}

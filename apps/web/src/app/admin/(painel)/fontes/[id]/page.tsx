import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dataHoraBR, numeroBR } from "@aviso/shared";
import { AcaoBotao } from "@/components/admin/AcaoBotao";
import { FormFonte } from "@/components/admin/fontes/FormFonte";
import { Paginacao } from "@/components/admin/navegacao-tabela";
import { Cabecalho, Cartao, cx, Etiqueta, Tabela, Td, Th, Tr, Vazio } from "@/components/admin/ui";
import { rodarFonteAcao } from "@/lib/admin/acoes/coleta";
import { exigirPainel } from "@/lib/admin/auth";
import { fonteDetalhe } from "@/lib/admin/consultas/coleta";
import { FONTE_TIPO_ROTULO, RUN_STATUS_ROTULO, RUN_STATUS_TOM } from "@/lib/admin/formato";
import { boolParam, ehUuid, int, urlCom, type SP } from "@/lib/admin/params";

export const metadata: Metadata = { title: "Fonte" };

export default async function Fonte({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  const { id } = await params;
  await exigirPainel("editor", `/admin/fontes/${id}`);
  if (!ehUuid(id)) notFound();
  const sp = await searchParams;
  const pagina = int(sp, "pagina", 1, 1);
  const soErros = boolParam(sp, "erros") === true;
  const r = await fonteDetalhe(id, { soErros, pagina, porPagina: 50 });
  if (!r) notFound();
  const { fonte, runs, total } = r;

  return (
    <>
      <Cabecalho
        titulo={fonte.nome}
        voltar={{ href: "/admin/fontes", rotulo: "Fontes" }}
        sub={
          <span className="flex flex-wrap items-center gap-1.5">
            <Etiqueta tom={fonte.ativo ? "verde" : "cinza"}>{fonte.ativo ? "Ativa" : "Desligada"}</Etiqueta>
            {FONTE_TIPO_ROTULO[fonte.tipo]} · <span className="font-mono">{fonte.slug}</span>
            {fonte.ultimo_hash && <span className="font-mono text-[11.5px]">· hash {fonte.ultimo_hash.slice(0, 12)}…</span>}
          </span>
        }
      >
        <AcaoBotao acao={rodarFonteAcao.bind(null, fonte.id)} rotulo="Rodar agora" variante="primario" desabilitado={!fonte.ativo} />
      </Cabecalho>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Cartao titulo="Configuração">
          <FormFonte
            id={fonte.id}
            inicial={{
              nome: fonte.nome,
              slug: fonte.slug,
              tipo: fonte.tipo,
              url: fonte.url ?? "",
              frequencia_min: fonte.frequencia_min,
              ativo: fonte.ativo,
              config: JSON.stringify(fonte.config ?? {}, null, 2),
            }}
          />
        </Cartao>

        <Cartao
          titulo="Execuções"
          sub={`${numeroBR(total)} ${soErros ? "com erro" : "no histórico"}`}
          corpo={false}
          acao={
            <div className="inline-flex rounded-lg border border-linha p-0.5 text-[12.5px] font-semibold">
              <Link href={urlCom(`/admin/fontes/${id}`, sp, { erros: undefined, pagina: undefined })} className={cx("rounded-md px-2.5 py-1", !soErros ? "bg-tinta text-white" : "text-tx2")}>
                Todas
              </Link>
              <Link href={urlCom(`/admin/fontes/${id}`, sp, { erros: "sim", pagina: undefined })} className={cx("rounded-md px-2.5 py-1", soErros ? "bg-tinta text-white" : "text-tx2")}>
                Só erros
              </Link>
            </div>
          }
        >
          {runs.length === 0 ? (
            <Vazio titulo={soErros ? "Nenhum erro" : "Nunca rodou"} texto={soErros ? "Nenhuma execução com erro." : "Use “Rodar agora” para a primeira coleta."} />
          ) : (
            <>
              <Tabela>
                <thead>
                  <tr>
                    <Th>Início</Th>
                    <Th>Situação</Th>
                    <Th num>Duração</Th>
                    <Th num>Encontrados</Th>
                    <Th num>Novos</Th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((x) => (
                    <Tr key={x.id}>
                      <Td className="whitespace-nowrap font-mono text-[12px]">
                        {dataHoraBR(x.iniciado_em)}
                        {x.erro && (
                          <details className="mt-0.5 max-w-[340px] font-sans">
                            <summary className="cursor-pointer text-[11.5px] font-semibold text-verm">Ver erro</summary>
                            <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-verm-t p-2 font-mono text-[11px] text-tinta">{x.erro}</pre>
                          </details>
                        )}
                      </Td>
                      <Td>
                        <Etiqueta tom={RUN_STATUS_TOM[x.status]}>{RUN_STATUS_ROTULO[x.status]}</Etiqueta>
                      </Td>
                      <Td num className="text-tx2">
                        {x.terminado_em ? `${Math.max(1, Math.round((new Date(x.terminado_em).getTime() - new Date(x.iniciado_em).getTime()) / 1000))} s` : "—"}
                      </Td>
                      <Td num>{x.docs_encontrados}</Td>
                      <Td num className={x.docs_novos ? "font-bold" : "text-tx2"}>
                        {x.docs_novos}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Tabela>
              <Paginacao base={`/admin/fontes/${id}`} sp={sp} pagina={pagina} porPagina={50} total={total} />
            </>
          )}
        </Cartao>
      </div>
    </>
  );
}

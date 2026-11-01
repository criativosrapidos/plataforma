import type { Metadata } from "next";
import Link from "next/link";
import { ACT_TIPO_LABEL, ACT_TIPOS, dataHoraBR, type ActTipo } from "@aviso/shared";
import { FiltroSelect, FiltrosForm } from "@/components/admin/FiltrosForm";
import { Paginacao } from "@/components/admin/navegacao-tabela";
import { Cabecalho, Cartao, cx, Etiqueta, Tabela, Td, Th, Tr, Vazio } from "@/components/admin/ui";
import { exigirPainel } from "@/lib/admin/auth";
import { lerConfigValor } from "@/lib/admin/consultas/config";
import { fontesComExtracao, listarFila } from "@/lib/admin/consultas/revisao";
import { EXTRACAO_STATUS_ROTULO, EXTRACAO_STATUS_TOM, horasDesde, idade, pct, tomConfianca } from "@/lib/admin/formato";
import { int, str, um, urlCom, type SP } from "@/lib/admin/params";

export const metadata: Metadata = { title: "Revisão" };

const STATUS = ["pendente", "aprovada", "rejeitada"] as const;

export default async function Revisao({ searchParams }: { searchParams: Promise<SP> }) {
  await exigirPainel("editor", "/admin/revisao");
  const sp = await searchParams;
  const status = um(sp, "status", STATUS) ?? "pendente";
  const pagina = int(sp, "pagina", 1, 1);
  const porPagina = 50;
  const [{ itens, total }, fontes, limiar] = await Promise.all([
    listarFila({ status, tipo: um(sp, "tipo", ACT_TIPOS), fonte: str(sp, "fonte"), pagina, porPagina }),
    fontesComExtracao(),
    lerConfigValor("limiar_confianca").then(Number),
  ]);
  const primeira = status === "pendente" ? itens[0] : undefined;

  return (
    <>
      <Cabecalho
        titulo="Revisão"
        sub={`O que a IA extraiu dos diários com confiança abaixo de ${pct(limiar)} espera aqui antes de virar aviso. Mais antigas primeiro.`}
      >
        {primeira && (
          <Link href={`/admin/revisao/${primeira.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-azul px-4 text-sm font-semibold text-white hover:bg-azul-2">
            Começar pela mais antiga →
          </Link>
        )}
      </Cabecalho>

      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <nav aria-label="Situação" className="inline-flex rounded-lg border border-linha bg-branco p-1">
          {STATUS.map((st) => (
            <Link
              key={st}
              href={urlCom("/admin/revisao", sp, { status: st === "pendente" ? undefined : st, pagina: undefined })}
              aria-current={st === status ? "page" : undefined}
              className={cx("grid min-h-9 place-items-center rounded-md px-3 text-[13px] font-semibold", st === status ? "bg-tinta text-white" : "text-tx2 hover:bg-papel")}
            >
              {st === "pendente" ? "Na fila" : EXTRACAO_STATUS_ROTULO[st] + "s"}
            </Link>
          ))}
        </nav>
        <FiltrosForm acao="/admin/revisao" manter={{ status: status === "pendente" ? undefined : status }}>
          <FiltroSelect nome="tipo" rotulo="Tipo de ato" valor={str(sp, "tipo")} opcoes={ACT_TIPOS.map((t) => ({ valor: t, rotulo: ACT_TIPO_LABEL[t] }))} />
          <FiltroSelect nome="fonte" rotulo="Fonte" valor={str(sp, "fonte")} todos="Todas" opcoes={fontes.map((f) => ({ valor: f.id, rotulo: f.nome }))} />
        </FiltrosForm>
      </div>

      <Cartao corpo={false}>
        {itens.length === 0 ? (
          <Vazio
            titulo={status === "pendente" ? "Fila zerada" : "Nada por aqui"}
            texto={status === "pendente" ? "Nenhuma extração aguardando revisão. As novas aparecem aqui assim que o extrator marcar baixa confiança." : "Nenhuma extração com esses filtros."}
          />
        ) : (
          <>
            <Tabela>
              <thead>
                <tr>
                  <Th>{status === "pendente" ? "Na fila há" : "Revisada"}</Th>
                  <Th>Concurso extraído</Th>
                  <Th>Tipo de ato</Th>
                  <Th num>Confiança</Th>
                  <Th>Motivo da revisão</Th>
                  <Th>Fonte</Th>
                  {status !== "pendente" && <Th>Por</Th>}
                </tr>
              </thead>
              <tbody>
                {itens.map((it) => (
                  <Tr key={it.id}>
                    <Td className="whitespace-nowrap font-mono text-[12px]">
                      {status === "pendente" ? (
                        <span className={cx(horasDesde(it.created_at) > 6 && "font-bold text-verm")}>{idade(it.created_at)}</span>
                      ) : (
                        dataHoraBR(it.revisado_em)
                      )}
                    </Td>
                    <Td className="min-w-[240px]">
                      <Link href={`/admin/revisao/${it.id}`} className="font-semibold hover:text-azul">
                        {it.titulo || it.orgao || it.doc_titulo || "Sem título"}
                      </Link>
                      <p className="text-[12px] text-tx2">
                        {it.orgao}
                        {it.contest_titulo && <> · liga a {it.contest_titulo}</>}
                      </p>
                    </Td>
                    <Td>
                      <Etiqueta tom={it.tipo_ato === "retificacao" ? "roxo" : "cinza"}>{ACT_TIPO_LABEL[it.tipo_ato as ActTipo] ?? it.tipo_ato ?? "—"}</Etiqueta>
                    </Td>
                    <Td num>
                      <Confianca valor={it.confianca} limiar={limiar} />
                    </Td>
                    <Td className="max-w-[360px] text-[12.5px] text-tx2">
                      <span className="line-clamp-2">{it.motivo_revisao ?? "—"}</span>
                    </Td>
                    <Td className="whitespace-nowrap text-[12.5px]">{it.fonte ?? "—"}</Td>
                    {status !== "pendente" && (
                      <Td className="whitespace-nowrap text-[12.5px]">
                        <Etiqueta tom={EXTRACAO_STATUS_TOM[it.status]}>{EXTRACAO_STATUS_ROTULO[it.status]}</Etiqueta> {it.revisor}
                      </Td>
                    )}
                  </Tr>
                ))}
              </tbody>
            </Tabela>
            <Paginacao base="/admin/revisao" sp={sp} pagina={pagina} porPagina={porPagina} total={total} />
          </>
        )}
      </Cartao>
    </>
  );
}

function Confianca({ valor, limiar }: { valor: number; limiar: number }) {
  const tom = tomConfianca(valor, limiar);
  const cor = tom === "verm" ? "bg-verm" : tom === "ambar" ? "bg-[#E0A100]" : "bg-verde";
  return (
    <span className="inline-flex items-center gap-2" title={`Confiança ${pct(valor)} (limiar ${pct(limiar)})`}>
      <span aria-hidden className="h-1.5 w-12 overflow-hidden rounded-full bg-[#EDEFF3]">
        <span className={cx("block h-full rounded-full", cor)} style={{ width: `${Math.round(valor * 100)}%` }} />
      </span>
      <span className={cx("font-bold", tom === "verm" && "text-verm")}>{pct(valor)}</span>
    </span>
  );
}

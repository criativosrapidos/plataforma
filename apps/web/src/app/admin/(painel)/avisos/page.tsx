import type { Metadata } from "next";
import Link from "next/link";
import { ALERT_CANAIS, ALERT_TIPO_LABEL, ALERT_TIPOS, dataHoraBR, numeroBR, type AlertTipo } from "@aviso/shared";
import { FiltroBusca, FiltroData, FiltroSelect, FiltrosForm } from "@/components/admin/FiltrosForm";
import { Paginacao } from "@/components/admin/navegacao-tabela";
import { botao, Cabecalho, Cartao, Etiqueta, Kpi, Tabela, Td, Th, Tr, Vazio } from "@/components/admin/ui";
import { exigirPainel } from "@/lib/admin/auth";
import { listarAvisos } from "@/lib/admin/consultas/negocio";
import { ALERTA_STATUS_ROTULO, ALERTA_STATUS_TOM, brlFino, CANAL_ROTULO, pct } from "@/lib/admin/formato";
import { dataParam, int, str, um, type SP } from "@/lib/admin/params";

export const metadata: Metadata = { title: "Avisos" };

export default async function Avisos({ searchParams }: { searchParams: Promise<SP> }) {
  await exigirPainel("admin", "/admin/avisos");
  const sp = await searchParams;
  const pagina = int(sp, "pagina", 1, 1);
  const porPagina = 50;
  const filtros = {
    tipo: um(sp, "tipo", ALERT_TIPOS),
    canal: um(sp, "canal", ALERT_CANAIS),
    status: um(sp, "status", ["pendente", "enviado", "falhou", "suprimido"] as const),
    de: dataParam(sp, "de"),
    ate: dataParam(sp, "ate"),
    q: str(sp, "q"),
  };
  const { resumo, porCanal, itens } = await listarAvisos(filtros, { pagina, porPagina });
  const exportar = new URLSearchParams(Object.entries(filtros).flatMap(([k, v]) => (v ? [[k, v]] : []))).toString();
  const tentativas = resumo.enviados + resumo.falhas;

  return (
    <>
      <Cabecalho titulo="Avisos" sub="Log de tudo o que saiu (ou tentou sair) para as pessoas: push, WhatsApp, e-mail e no app. Rodar 2 vezes não manda 2 vezes (dedup_key + canal).">
        <a href={`/admin/exportar/avisos${exportar ? `?${exportar}` : ""}`} className={botao("sec")} download>
          Exportar CSV
        </a>
      </Cabecalho>

      <div className="mb-3">
        <FiltrosForm acao="/admin/avisos">
          <FiltroBusca valor={filtros.q} placeholder="Título, nome ou e-mail" />
          <FiltroSelect nome="tipo" rotulo="Tipo" valor={filtros.tipo} opcoes={ALERT_TIPOS.map((t) => ({ valor: t, rotulo: ALERT_TIPO_LABEL[t] }))} />
          <FiltroSelect nome="canal" rotulo="Canal" valor={filtros.canal} opcoes={ALERT_CANAIS.map((c) => ({ valor: c, rotulo: CANAL_ROTULO[c] }))} />
          <FiltroSelect nome="status" rotulo="Situação" valor={filtros.status} opcoes={Object.entries(ALERTA_STATUS_ROTULO).map(([valor, rotulo]) => ({ valor, rotulo }))} />
          <FiltroData nome="de" rotulo="De" valor={filtros.de} />
          <FiltroData nome="ate" rotulo="até" valor={filtros.ate} />
        </FiltrosForm>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi rotulo="Avisos" valor={numeroBR(resumo.total)} detalhe={`${numeroBR(resumo.pendentes)} pendentes · ${numeroBR(resumo.suprimidos)} suprimidos`} />
        <Kpi rotulo="Enviados" valor={numeroBR(resumo.enviados)} />
        <Kpi rotulo="Taxa de falha" valor={pct(tentativas ? resumo.falhas / tentativas : null, 1)} alerta={tentativas > 0 && resumo.falhas / tentativas > 0.05} detalhe={`${numeroBR(resumo.falhas)} falhas`} />
        <Kpi rotulo="Custo somado" valor={brlFino(resumo.custo)} detalhe={porCanal.map((c) => `${CANAL_ROTULO[c.canal]} ${brlFino(c.custo)}`).join(" · ") || "—"} />
      </div>

      <Cartao corpo={false}>
        {itens.length === 0 ? (
          <Vazio titulo="Nenhum aviso" texto="Nada com esses filtros." />
        ) : (
          <>
            <Tabela>
              <thead>
                <tr>
                  <Th>Quando</Th>
                  <Th>Aviso</Th>
                  <Th>Pessoa</Th>
                  <Th>Canal</Th>
                  <Th>Situação</Th>
                  <Th num>Custo</Th>
                </tr>
              </thead>
              <tbody>
                {itens.map((a) => (
                  <Tr key={a.id}>
                    <Td className="whitespace-nowrap font-mono text-[12px]">
                      {dataHoraBR(a.enviado_em ?? a.created_at)}
                      {a.lido_em && <p className="text-[11px] text-tx2">lido {dataHoraBR(a.lido_em)}</p>}
                    </Td>
                    <Td className="min-w-[260px] max-w-[440px]">
                      <span className="font-semibold">{a.titulo}</span>
                      <p className="text-[12px] text-tx2">
                        {ALERT_TIPO_LABEL[a.tipo as AlertTipo] ?? a.tipo}
                        {a.contest_id && (
                          <>
                            {" · "}
                            <Link href={`/admin/concursos/${a.contest_id}`} className="hover:text-azul">
                              {a.concurso}
                            </Link>
                          </>
                        )}
                      </p>
                      {a.erro && <p className="truncate font-mono text-[11px] text-verm">{a.erro}</p>}
                    </Td>
                    <Td className="min-w-[180px]">
                      <Link href={`/admin/usuarios/${a.user_id}`} className="hover:text-azul">
                        {a.nome}
                      </Link>
                      <p className="text-[11.5px] text-tx2">{a.email}</p>
                    </Td>
                    <Td className="text-[12.5px]">{CANAL_ROTULO[a.canal]}</Td>
                    <Td>
                      <Etiqueta tom={ALERTA_STATUS_TOM[a.status]}>{ALERTA_STATUS_ROTULO[a.status]}</Etiqueta>
                    </Td>
                    <Td num className={a.custo_centavos ? undefined : "text-tx2"}>
                      {brlFino(a.custo_centavos)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Tabela>
            <Paginacao base="/admin/avisos" sp={sp} pagina={pagina} porPagina={porPagina} total={resumo.total} />
          </>
        )}
      </Cartao>
    </>
  );
}

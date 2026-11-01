import type { Metadata } from "next";
import Link from "next/link";
import { brl, dataCurtaBR, dataBR, numeroBR, PLANO_INFO } from "@aviso/shared";
import { BarraSegmentada, Colunas, Medidor } from "@/components/admin/graficos";
import { COR } from "@/lib/admin/cores";
import { Aviso, Cabecalho, Cartao, cx, Etiqueta, Kpi, Tabela, Td, Th, Tr } from "@/components/admin/ui";
import { exigirPainel } from "@/lib/admin/auth";
import { metricasNegocio, metricasOperacao, type Comparativo, type Coletor } from "@/lib/admin/consultas/metricas";
import { brlFino, CANAL_ROTULO, duracao, FONTE_TIPO_ROTULO, horasDesde, idade, pct, PLANO_ROTULO, SUB_STATUS_ROTULO } from "@/lib/admin/formato";
import { PERIODOS, periodo, str, type SP } from "@/lib/admin/params";

export const metadata: Metadata = { title: "Visão geral" };

const SERIES_CANAL = [
  { chave: "push", rotulo: "Push", cor: COR.s1 },
  { chave: "email", rotulo: "E-mail", cor: COR.s2 },
  { chave: "whatsapp", rotulo: "WhatsApp", cor: COR.s3 },
  { chave: "inapp", rotulo: "No app", cor: COR.s4 },
];
const SERIES_CUSTO = [
  { chave: "extracao", rotulo: "IA · extração", cor: COR.s1 },
  { chave: "perguntas", rotulo: "IA · perguntas", cor: COR.s2 },
  { chave: "whatsapp", rotulo: "WhatsApp", cor: COR.s3 },
];

export default async function VisaoGeral({ searchParams }: { searchParams: Promise<SP> }) {
  const s = await exigirPainel("editor");
  const sp = await searchParams;
  const p = periodo(sp);
  const admin = s.role === "admin";
  const [op, neg] = await Promise.all([metricasOperacao(p), admin ? metricasNegocio(p) : null]);

  return (
    <>
      <Cabecalho titulo="Visão geral" sub={`Últimos ${p} dias, horário de Brasília. ${admin ? "Métricas de negócio excluem a equipe e cortesias." : ""}`}>
        <nav aria-label="Período" className="inline-flex rounded-lg border border-linha bg-branco p-1">
          {PERIODOS.map((n) => (
            <Link
              key={n}
              href={n === 30 ? "/admin" : `/admin?p=${n}`}
              aria-current={n === p ? "true" : undefined}
              className={cx(
                "grid min-h-9 min-w-[64px] place-items-center rounded-md px-3 font-mono text-[13px] font-bold",
                n === p ? "bg-tinta text-white" : "text-tx2 hover:bg-papel",
              )}
            >
              {n} dias
            </Link>
          ))}
        </nav>
      </Cabecalho>

      {str(sp, "negado") && (
        <div className="mb-4">
          <Aviso>Essa tela é só para administradores. Peça acesso a um admin se precisar.</Aviso>
        </div>
      )}

      {neg && <Negocio neg={neg} p={p} />}

      <h2 className="mb-3 mt-2 font-sans text-[13px] font-bold uppercase tracking-[.1em] text-tx2">Operação</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          rotulo="Fila de revisão"
          valor={numeroBR(op.fila.total)}
          alerta={op.fila.total > 0 && horasDesde(op.fila.mais_antiga) > 6}
          detalhe={op.fila.mais_antiga ? `mais antiga ${idade(op.fila.mais_antiga)}` : "fila zerada"}
          href="/admin/revisao"
        />
        <Kpi
          rotulo="Publicação → aviso (mediana)"
          valor={duracao(op.tempo.mediana)}
          alerta={op.tempo.mediana != null && op.tempo.mediana > 60}
          detalhe={op.tempo.n ? `meta 1 h · ${pct(op.tempo.dentro_meta / op.tempo.n)} dentro · média ${duracao(op.tempo.media)}` : "sem avisos de ato no período"}
        />
        <Kpi
          rotulo="Avisos enviados"
          valor={numeroBR(op.avisosCanal.reduce((a, c) => a + c.enviados, 0))}
          detalhe={(() => {
            const env = op.avisosCanal.reduce((a, c) => a + c.enviados, 0);
            const fal = op.avisosCanal.reduce((a, c) => a + c.falhas, 0);
            return env + fal ? `${pct(fal / (env + fal), 1)} de falha` : "nenhum no período";
          })()}
          href={admin ? "/admin/avisos" : undefined}
        />
        <Kpi
          rotulo="Custo variável (IA + WhatsApp)"
          valor={brl(Math.round(op.custos.extracao + op.custos.perguntas_custo + (op.avisosCanal.find((c) => c.canal === "whatsapp")?.custo ?? 0)))}
          detalhe={`${numeroBR(op.custos.extracoes)} extrações · ${numeroBR(op.custos.perguntas)} perguntas`}
        />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-2">
        <Cartao titulo="Avisos enviados por dia" sub="Por canal. Push é o canal principal; WhatsApp só no Aprovado, para prazo acabando.">
          <Colunas
            dados={op.avisosDia.map(({ dia, ...v }) => ({ x: dataCurtaBR(dia), titulo: dataBR(dia), v }))}
            series={SERIES_CANAL}
            rotuloTabela="Avisos enviados por dia e canal"
          />
          <Tabela className="mt-3 rounded-lg border border-linha">
            <thead>
              <tr>
                <Th>Canal</Th>
                <Th num>Enviados</Th>
                <Th num>Falhas</Th>
                <Th num>Custo</Th>
              </tr>
            </thead>
            <tbody>
              {SERIES_CANAL.map((sc) => {
                const c = op.avisosCanal.find((x) => x.canal === sc.chave);
                return (
                  <Tr key={sc.chave}>
                    <Td>
                      <span className="inline-flex items-center gap-2">
                        <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: sc.cor }} />
                        {CANAL_ROTULO[sc.chave]}
                      </span>
                    </Td>
                    <Td num>{numeroBR(c?.enviados ?? 0)}</Td>
                    <Td num className={c?.falhas ? "text-verm" : undefined}>
                      {numeroBR(c?.falhas ?? 0)}
                    </Td>
                    <Td num>{brlFino(c?.custo ?? 0)}</Td>
                  </Tr>
                );
              })}
            </tbody>
          </Tabela>
        </Cartao>

        <Cartao titulo="Custo variável por dia" sub="IA (extração dos editais e Pergunte ao edital) e mensagens de WhatsApp.">
          <Colunas
            dados={op.custosDia.map(({ dia, ...v }) => ({ x: dataCurtaBR(dia), titulo: dataBR(dia), v }))}
            series={SERIES_CUSTO}
            formato="brlFino"
            rotuloTabela="Custo variável por dia"
          />
          <div className="mt-3 grid grid-cols-3 gap-2 text-[12.5px]">
            <MiniNumero rotulo="IA · extração" valor={brlFino(op.custos.extracao)} detalhe={`${numeroBR(op.custos.extracoes)} extrações`} />
            <MiniNumero rotulo="IA · perguntas" valor={brlFino(op.custos.perguntas_custo)} detalhe={`${numeroBR(op.custos.perguntas)} perguntas`} />
            <MiniNumero
              rotulo="WhatsApp"
              valor={brlFino(op.avisosCanal.find((c) => c.canal === "whatsapp")?.custo ?? 0)}
              detalhe={`${numeroBR(op.avisosCanal.find((c) => c.canal === "whatsapp")?.enviados ?? 0)} mensagens`}
            />
          </div>
        </Cartao>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[1.6fr_1fr]">
        <Cartao
          titulo="Saúde dos coletores"
          sub={`${op.coletores.filter((c) => c.saude === "ok").length} de ${op.coletores.filter((c) => c.ativo).length} fontes ativas em dia`}
          acao={
            <Link href="/admin/fontes" className="text-[13px] font-semibold text-azul hover:underline">
              Gerenciar fontes →
            </Link>
          }
          corpo={false}
        >
          <Tabela>
            <thead>
              <tr>
                <Th>Fonte</Th>
                <Th>Saúde</Th>
                <Th>Última execução</Th>
                <Th num>Docs novos</Th>
                <Th num>Erros / execuções</Th>
              </tr>
            </thead>
            <tbody>
              {op.coletores.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <Link href={`/admin/fontes/${c.id}`} className="font-semibold hover:text-azul">
                      {c.nome}
                    </Link>
                    <span className="ml-1.5 text-[11.5px] text-tx2">{FONTE_TIPO_ROTULO[c.tipo]}</span>
                    {c.saude === "erro" && c.erro && <p className="mt-0.5 max-w-md truncate font-mono text-[11px] text-verm">{c.erro}</p>}
                  </Td>
                  <Td>
                    <SaudeColetor c={c} />
                  </Td>
                  <Td className="whitespace-nowrap font-mono text-[12px]">{c.iniciado_em ? idade(c.iniciado_em) : "nunca rodou"}</Td>
                  <Td num>{c.docs_novos ?? "—"}</Td>
                  <Td num className={c.erros ? "text-verm" : undefined}>
                    {c.erros} / {c.runs}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Tabela>
        </Cartao>

        <Cartao titulo="Pipeline no período" sub="Do documento coletado ao concurso publicado.">
          <dl className="grid grid-cols-2 gap-3">
            <MiniNumero rotulo="Documentos coletados" valor={numeroBR(op.docs.coletados)} />
            <MiniNumero rotulo="Extrações automáticas" valor={numeroBR(op.docs.auto)} />
            <MiniNumero rotulo="Aprovadas na revisão" valor={numeroBR(op.docs.aprovadas)} />
            <MiniNumero rotulo="Rejeitadas" valor={numeroBR(op.docs.rejeitadas)} />
          </dl>
          {(() => {
            const total = op.docs.auto + op.docs.aprovadas + op.docs.rejeitadas + op.docs.pendentes;
            const humanas = op.docs.aprovadas + op.docs.rejeitadas + op.docs.pendentes;
            return (
              <div className="mt-4">
                <BarraSegmentada
                  rotulo="Destino das extrações"
                  partes={[
                    { chave: "auto", rotulo: "Automáticas", valor: op.docs.auto, cor: COR.s1 },
                    { chave: "aprovadas", rotulo: "Aprovadas", valor: op.docs.aprovadas, cor: COR.bom },
                    { chave: "pendentes", rotulo: "Na fila", valor: op.docs.pendentes, cor: COR.atencao, textoEscuro: true },
                    { chave: "rejeitadas", rotulo: "Rejeitadas", valor: op.docs.rejeitadas, cor: COR.critico },
                  ]}
                />
                <p className="mt-2 text-[12.5px] text-tx2">
                  Revisão humana em {total ? pct(humanas / total) : "—"} das extrações. {op.fila.baixa > 0 && `${op.fila.baixa} na fila com confiança abaixo de 60%.`}
                </p>
              </div>
            );
          })()}
        </Cartao>
      </div>
    </>
  );
}

function MiniNumero({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: string }) {
  return (
    <div className="rounded-xl bg-papel px-3 py-2">
      <dt className="text-[11.5px] font-semibold text-tx2">{rotulo}</dt>
      <dd className="font-mono text-[16px] font-bold">{valor}</dd>
      {detalhe && <dd className="text-[11.5px] text-tx2">{detalhe}</dd>}
    </div>
  );
}

function SaudeColetor({ c }: { c: Coletor }) {
  const mapa = {
    ok: { tom: "verde", t: "Em dia" },
    erro: { tom: "verm", t: "Erro" },
    atrasada: { tom: "ambar", t: "Atrasada" },
    desligada: { tom: "cinza", t: "Desligada" },
    nunca: { tom: "cinza", t: "Nunca rodou" },
  } as const;
  const m = mapa[c.saude];
  return <Etiqueta tom={m.tom}>{m.t}</Etiqueta>;
}

function Delta({ c, p, moeda }: { c: Comparativo; p: number; moeda?: boolean }) {
  const d = c.atual - c.anterior;
  if (d === 0) return <span>igual aos {p} dias anteriores</span>;
  const fmt = moeda ? brl(Math.abs(d)) : numeroBR(Math.abs(d));
  return (
    <span className={d > 0 ? "text-verde" : "text-verm"}>
      {d > 0 ? "↑" : "↓"} {fmt} <span className="text-tx2">vs {p} dias anteriores</span>
    </span>
  );
}

function Negocio({ neg, p }: { neg: NonNullable<Awaited<ReturnType<typeof metricasNegocio>>>; p: number }) {
  const statusCont = (st: string) => neg.porStatus.filter((r) => r.status === st).reduce((a, r) => a + r.n, 0);
  const avisoLiquido = PLANO_INFO.aviso.precoMensalCentavos - 50; // ≈ R$ 9,40 por assinante (briefing)
  const assinaturasEquilibrio = Math.ceil(neg.custoFixo / avisoLiquido);
  return (
    <>
      <h2 className="mb-3 font-sans text-[13px] font-bold uppercase tracking-[.1em] text-tx2">Negócio</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi rotulo="MRR estimado" valor={brl(Math.round(neg.mrr))} detalhe={`${numeroBR(neg.pagantes)} pagantes · mensal + anual ÷ 12`} href="/admin/financeiro" />
        <Kpi rotulo="Testes iniciados" valor={numeroBR(neg.testes.atual)} detalhe={<Delta c={neg.testes} p={p} />} />
        <Kpi
          rotulo="Conversão teste → pago"
          valor={pct(neg.conversao.taxa)}
          detalhe={`${numeroBR(neg.conversao.convertidos)} de ${numeroBR(neg.conversao.encerrados)} testes encerrados`}
        />
        <Kpi
          rotulo="Churn de pagantes"
          valor={pct(neg.churn.taxa, 1)}
          alerta={(neg.churn.taxa ?? 0) > 0.08}
          detalhe={`${numeroBR(neg.churn.cancelados)} cancelamentos · ${numeroBR(neg.churn.cancelados_teste)} no teste`}
        />
        <Kpi rotulo="Novos cadastros" valor={numeroBR(neg.cadastros.atual)} detalhe={<Delta c={neg.cadastros} p={p} />} href="/admin/usuarios" />
        <Kpi rotulo="Leads" valor={numeroBR(neg.leads.atual)} detalhe={<Delta c={neg.leads} p={p} />} href="/admin/leads" />
        <Kpi rotulo="Receita recebida" valor={brl(neg.receita.atual)} detalhe={<Delta c={neg.receita} p={p} moeda />} href="/admin/financeiro" />
        <Kpi
          rotulo="Inadimplentes"
          valor={numeroBR(statusCont("inadimplente"))}
          alerta={statusCont("inadimplente") > 0}
          detalhe={`${brl(Math.round(neg.emRisco))}/mês em risco`}
          href="/admin/financeiro?aba=inadimplentes"
        />
      </div>

      <div className="mb-6 mt-3 grid gap-3 xl:grid-cols-3">
        <Cartao titulo="Ponto de equilíbrio" sub={`Custo fixo ${brl(neg.custoFixo)}/mês ≈ ${assinaturasEquilibrio} assinaturas Aviso (sobra ≈ ${brl(avisoLiquido)} cada).`}>
          <Medidor
            rotulo="MRR contra o custo fixo"
            partes={[
              { chave: "aviso", rotulo: "Aviso", valor: Math.round(neg.mrrPorPlano.aviso), cor: COR.s1 },
              { chave: "aprovado", rotulo: "Aprovado", valor: Math.round(neg.mrrPorPlano.aprovado), cor: COR.s2 },
            ]}
            meta={neg.custoFixo}
            rotuloMeta={`Equilíbrio ${brl(neg.custoFixo)}`}
            formato="brl"
          />
          <p className="mt-3 text-[13px]">
            {neg.mrr >= neg.custoFixo ? (
              <>
                <b className="text-verde">Acima do equilíbrio</b> em {brl(Math.round(neg.mrr - neg.custoFixo))}/mês.
              </>
            ) : (
              <>
                Faltam <b className="font-mono">{brl(Math.round(neg.custoFixo - neg.mrr))}</b>/mês, cerca de{" "}
                <b className="font-mono">{Math.ceil((neg.custoFixo - neg.mrr) / avisoLiquido)}</b> assinaturas Aviso.
              </>
            )}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-2">
            <MiniNumero rotulo="Cobertura do custo fixo" valor={pct(neg.custoFixo ? neg.mrr / neg.custoFixo : null)} />
            <MiniNumero rotulo="Pagantes (sem cortesia)" valor={numeroBR(neg.pagantes)} />
            <MiniNumero rotulo="MRR Aviso" valor={brl(Math.round(neg.mrrPorPlano.aviso))} />
            <MiniNumero rotulo="MRR Aprovado" valor={brl(Math.round(neg.mrrPorPlano.aprovado))} />
          </dl>
          <p className="mt-3 text-[12px] text-tx2">
            Inadimplentes não entram no MRR ({brl(Math.round(neg.emRisco))}/mês em risco). O custo fixo é ajustável em{" "}
            <Link href="/admin/config" className="font-semibold text-azul hover:underline">
              Configurações
            </Link>
            .
          </p>
        </Cartao>

        <Cartao titulo="Assinantes por status" sub="Assinatura mais recente de cada pessoa.">
          <BarraSegmentada
            rotulo="Assinantes por status"
            partes={[
              { chave: "ativa", rotulo: "Ativa", valor: statusCont("ativa"), cor: COR.bom },
              { chave: "trial", rotulo: "Teste", valor: statusCont("trial"), cor: COR.s1 },
              { chave: "inadimplente", rotulo: "Inadimplente", valor: statusCont("inadimplente"), cor: COR.atencao, textoEscuro: true },
              { chave: "cancelada", rotulo: "Cancelada", valor: statusCont("cancelada"), cor: COR.critico },
            ]}
          />
          <Tabela className="mt-3 rounded-lg border border-linha">
            <thead>
              <tr>
                <Th>Status</Th>
                <Th num>{PLANO_ROTULO.aviso}</Th>
                <Th num>{PLANO_ROTULO.aprovado}</Th>
                <Th num>Total</Th>
              </tr>
            </thead>
            <tbody>
              {["trial", "ativa", "inadimplente", "cancelada"].map((st) => {
                const n = (pl: string) => neg.porStatus.find((r) => r.status === st && r.plano === pl)?.n ?? 0;
                return (
                  <Tr key={st}>
                    <Td>{SUB_STATUS_ROTULO[st]}</Td>
                    <Td num>{n("aviso")}</Td>
                    <Td num>{n("aprovado")}</Td>
                    <Td num className="font-bold">
                      {n("aviso") + n("aprovado")}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Tabela>
        </Cartao>

        <Cartao titulo="Aquisição por dia" sub="Cadastros, testes iniciados e leads da landing.">
          <div className="space-y-3">
            {(
              [
                ["cadastros", "Novos cadastros"],
                ["testes", "Testes iniciados"],
                ["leads", "Leads"],
              ] as const
            ).map(([k, rot]) => (
              <div key={k}>
                <p className="mb-1 flex justify-between text-[12px] font-semibold text-tx2">
                  {rot}
                  <span className="font-mono text-tinta">{numeroBR(neg.serie.reduce((a, d) => a + d[k], 0))}</span>
                </p>
                <Colunas
                  altura={88}
                  dados={neg.serie.map((d) => ({ x: dataCurtaBR(d.dia), titulo: dataBR(d.dia), v: { [k]: d[k] } }))}
                  series={[{ chave: k, rotulo: rot, cor: COR.s1 }]}
                  rotuloTabela={`${rot} por dia`}
                  tabela={false}
                />
              </div>
            ))}
          </div>
        </Cartao>
      </div>
    </>
  );
}

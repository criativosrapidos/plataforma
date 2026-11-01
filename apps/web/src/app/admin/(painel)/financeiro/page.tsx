import type { Metadata } from "next";
import Link from "next/link";
import { brl, dataBR, dataHoraBR, numeroBR, SUB_STATUS } from "@aviso/shared";
import { FiltroBusca, FiltroData, FiltroSelect, FiltrosForm } from "@/components/admin/FiltrosForm";
import { Colunas } from "@/components/admin/graficos";
import { Paginacao } from "@/components/admin/navegacao-tabela";
import { botao, Cabecalho, Cartao, cx, Etiqueta, Kpi, Tabela, Td, Th, Tr, Vazio } from "@/components/admin/ui";
import { exigirPainel } from "@/lib/admin/auth";
import { COR } from "@/lib/admin/cores";
import { metricasNegocio } from "@/lib/admin/consultas/metricas";
import { listarAssinaturas, listarInadimplentes, listarPagamentos, providersEmUso, receitaMensal, resumoFinanceiro } from "@/lib/admin/consultas/negocio";
import { CICLO_ROTULO, idade, PAGAMENTO_ROTULO, PAGAMENTO_TOM, PLANO_ROTULO, SUB_STATUS_ROTULO, SUB_STATUS_TOM } from "@/lib/admin/formato";
import { dataParam, int, str, um, type SP } from "@/lib/admin/params";

export const metadata: Metadata = { title: "Financeiro" };

const ABAS = ["assinaturas", "pagamentos", "inadimplentes"] as const;
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export default async function Financeiro({ searchParams }: { searchParams: Promise<SP> }) {
  await exigirPainel("admin", "/admin/financeiro");
  const sp = await searchParams;
  const aba = um(sp, "aba", ABAS) ?? "assinaturas";
  const pagina = int(sp, "pagina", 1, 1);
  const porPagina = 50;
  const [resumo, receita, neg] = await Promise.all([resumoFinanceiro(), receitaMensal(12), metricasNegocio(30)]);
  const total12 = receita.reduce((s, m) => s + m.aviso + m.aprovado + m.outros, 0);
  const filtrosExport = new URLSearchParams(Object.entries(sp).flatMap(([k, v]) => (typeof v === "string" && v && !["aba", "pagina"].includes(k) ? [[k, v]] : []))).toString();

  return (
    <>
      <Cabecalho titulo="Financeiro" sub="Assinaturas, pagamentos e inadimplência. O webhook do provedor é a fonte da verdade do status de pagamento." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi rotulo="MRR estimado" valor={brl(Math.round(neg.mrr))} detalhe={`${numeroBR(neg.pagantes)} pagantes · sem equipe e cortesias`} />
        <Kpi
          rotulo="Recebido neste mês"
          valor={brl(resumo.mes_atual)}
          detalhe={
            <>
              mês passado <span className="font-mono">{brl(resumo.mes_anterior)}</span>
            </>
          }
        />
        <Kpi
          rotulo="Inadimplentes"
          valor={numeroBR(resumo.inadimplentes)}
          alerta={resumo.inadimplentes > 0}
          detalhe={`${brl(resumo.valor_falhas)} em cobranças que falharam`}
          href="/admin/financeiro?aba=inadimplentes"
        />
        <Kpi rotulo="Estornos (90 dias)" valor={brl(resumo.estornos_90d)} detalhe={`${numeroBR(resumo.cortesias)} cortesias ativas`} />
      </div>

      <Cartao titulo="Receita recebida por mês" sub={`Pagamentos confirmados, por plano. Últimos 12 meses: ${brl(total12)}.`} className="mt-3">
        <Colunas
          dados={receita.map((m) => ({ x: `${MESES[+m.mes.slice(5) - 1]}/${m.mes.slice(2, 4)}`, titulo: `${MESES[+m.mes.slice(5) - 1]}/${m.mes.slice(0, 4)}`, v: { aviso: m.aviso, aprovado: m.aprovado, outros: m.outros } }))}
          series={[
            { chave: "aviso", rotulo: "Aviso", cor: COR.s1 },
            { chave: "aprovado", rotulo: "Aprovado", cor: COR.s2 },
            ...(receita.some((m) => m.outros) ? [{ chave: "outros", rotulo: "Sem assinatura", cor: COR.s3 }] : []),
          ]}
          formato="brl"
          altura={220}
          rotuloTabela="Receita por mês e plano"
        />
      </Cartao>

      <div className="mb-3 mt-6 flex flex-wrap items-end justify-between gap-3">
        <nav aria-label="Listas" className="inline-flex rounded-lg border border-linha bg-branco p-1">
          {ABAS.map((a) => (
            <Link
              key={a}
              href={a === "assinaturas" ? "/admin/financeiro" : `/admin/financeiro?aba=${a}`}
              aria-current={a === aba ? "page" : undefined}
              className={cx("grid min-h-9 place-items-center rounded-md px-3 text-[13px] font-semibold capitalize", a === aba ? "bg-tinta text-white" : "text-tx2 hover:bg-papel")}
            >
              {a}
              {a === "inadimplentes" && resumo.inadimplentes > 0 && ` (${resumo.inadimplentes})`}
            </Link>
          ))}
        </nav>
        {aba !== "inadimplentes" && (
          <a href={`/admin/exportar/${aba}${filtrosExport ? `?${filtrosExport}` : ""}`} className={botao("sec")} download>
            Exportar CSV
          </a>
        )}
      </div>

      {aba === "assinaturas" && <Assinaturas sp={sp} pagina={pagina} porPagina={porPagina} />}
      {aba === "pagamentos" && <Pagamentos sp={sp} pagina={pagina} porPagina={porPagina} />}
      {aba === "inadimplentes" && <Inadimplentes />}
    </>
  );
}

async function Assinaturas({ sp, pagina, porPagina }: { sp: SP; pagina: number; porPagina: number }) {
  const [{ itens, total }, providers] = await Promise.all([
    listarAssinaturas(
      { status: um(sp, "status", SUB_STATUS), plano: um(sp, "plano", ["aviso", "aprovado"] as const), ciclo: um(sp, "ciclo", ["mensal", "anual"] as const), provider: str(sp, "provider"), q: str(sp, "q") },
      { pagina, porPagina },
    ),
    providersEmUso(),
  ]);
  return (
    <>
      <div className="mb-3">
        <FiltrosForm acao="/admin/financeiro">
          <FiltroBusca valor={str(sp, "q")} placeholder="Nome ou e-mail" />
          <FiltroSelect nome="status" rotulo="Situação" valor={str(sp, "status")} opcoes={SUB_STATUS.map((x) => ({ valor: x, rotulo: SUB_STATUS_ROTULO[x] }))} />
          <FiltroSelect nome="plano" rotulo="Plano" valor={str(sp, "plano")} opcoes={[{ valor: "aviso", rotulo: "Aviso" }, { valor: "aprovado", rotulo: "Aprovado" }]} />
          <FiltroSelect nome="ciclo" rotulo="Ciclo" valor={str(sp, "ciclo")} opcoes={[{ valor: "mensal", rotulo: "Mensal" }, { valor: "anual", rotulo: "Anual" }]} />
          <FiltroSelect nome="provider" rotulo="Provedor" valor={str(sp, "provider")} opcoes={providers.map((x) => ({ valor: x, rotulo: x }))} />
        </FiltrosForm>
      </div>
      <Cartao corpo={false}>
        {itens.length === 0 ? (
          <Vazio titulo="Nenhuma assinatura" />
        ) : (
          <>
            <Tabela>
              <thead>
                <tr>
                  <Th>Pessoa</Th>
                  <Th>Situação</Th>
                  <Th>Plano</Th>
                  <Th>Pagamento</Th>
                  <Th>Teste até</Th>
                  <Th>Período até</Th>
                  <Th num>Total pago</Th>
                  <Th>Criada</Th>
                </tr>
              </thead>
              <tbody>
                {itens.map((a) => (
                  <Tr key={a.id}>
                    <Td className="min-w-[200px]">
                      <Link href={`/admin/usuarios/${a.user_id}`} className="font-semibold hover:text-azul">
                        {a.nome}
                      </Link>
                      <p className="text-[12px] text-tx2">{a.email}</p>
                    </Td>
                    <Td>
                      <Etiqueta tom={SUB_STATUS_TOM[a.status]}>{SUB_STATUS_ROTULO[a.status]}</Etiqueta>
                    </Td>
                    <Td className="whitespace-nowrap">
                      {PLANO_ROTULO[a.plano]} <span className="text-tx2">· {CICLO_ROTULO[a.ciclo]}</span>
                    </Td>
                    <Td className="whitespace-nowrap text-[12.5px]">
                      {a.provider === "cortesia" ? <Etiqueta tom="roxo">Cortesia</Etiqueta> : `${a.metodo === "pix_automatico" ? "Pix" : a.metodo === "cartao" ? "Cartão" : "—"} · ${a.provider}`}
                    </Td>
                    <Td className="font-mono text-[12px]">{dataBR(a.trial_ends_at)}</Td>
                    <Td className="font-mono text-[12px]">{dataBR(a.current_period_end)}</Td>
                    <Td num>{brl(a.pago_total)}</Td>
                    <Td className="font-mono text-[12px] text-tx2">{dataBR(a.created_at)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Tabela>
            <Paginacao base="/admin/financeiro" sp={sp} pagina={pagina} porPagina={porPagina} total={total} />
          </>
        )}
      </Cartao>
    </>
  );
}

async function Pagamentos({ sp, pagina, porPagina }: { sp: SP; pagina: number; porPagina: number }) {
  const { itens, total, soma } = await listarPagamentos(
    { status: um(sp, "status", ["pendente", "pago", "falhou", "estornado"] as const), de: dataParam(sp, "de"), ate: dataParam(sp, "ate"), q: str(sp, "q") },
    { pagina, porPagina },
  );
  return (
    <>
      <div className="mb-3">
        <FiltrosForm acao="/admin/financeiro" manter={{ aba: "pagamentos" }}>
          <FiltroBusca valor={str(sp, "q")} placeholder="Nome, e-mail ou id do provedor" />
          <FiltroSelect nome="status" rotulo="Situação" valor={str(sp, "status")} opcoes={Object.entries(PAGAMENTO_ROTULO).map(([valor, rotulo]) => ({ valor, rotulo }))} />
          <FiltroData nome="de" rotulo="Criado de" valor={dataParam(sp, "de")} />
          <FiltroData nome="ate" rotulo="até" valor={dataParam(sp, "ate")} />
        </FiltrosForm>
      </div>
      <Cartao corpo={false} titulo={`${numeroBR(total)} pagamentos`} sub={<>Soma: <span className="font-mono font-bold text-tinta">{brl(soma)}</span></>}>
        {itens.length === 0 ? (
          <Vazio titulo="Nenhum pagamento" />
        ) : (
          <>
            <Tabela>
              <thead>
                <tr>
                  <Th>Vencimento</Th>
                  <Th>Pessoa</Th>
                  <Th>Plano</Th>
                  <Th num>Valor</Th>
                  <Th>Situação</Th>
                  <Th>Pago em</Th>
                  <Th>Id no provedor</Th>
                </tr>
              </thead>
              <tbody>
                {itens.map((p) => (
                  <Tr key={p.id}>
                    <Td className="whitespace-nowrap font-mono text-[12px]">{dataBR(p.vencimento ?? p.created_at)}</Td>
                    <Td className="min-w-[200px]">
                      <Link href={`/admin/usuarios/${p.user_id}`} className="font-semibold hover:text-azul">
                        {p.nome}
                      </Link>
                      <p className="text-[12px] text-tx2">{p.email}</p>
                    </Td>
                    <Td className="text-[12.5px]">{p.plano ? PLANO_ROTULO[p.plano] : "—"}</Td>
                    <Td num>{brl(p.valor_centavos)}</Td>
                    <Td>
                      <Etiqueta tom={PAGAMENTO_TOM[p.status]}>{PAGAMENTO_ROTULO[p.status]}</Etiqueta>
                    </Td>
                    <Td className="whitespace-nowrap font-mono text-[12px]">{dataHoraBR(p.pago_em)}</Td>
                    <Td className="max-w-[180px] truncate font-mono text-[11.5px] text-tx2">{p.provider_payment_id ?? "—"}</Td>
                  </Tr>
                ))}
              </tbody>
            </Tabela>
            <Paginacao base="/admin/financeiro" sp={sp} pagina={pagina} porPagina={porPagina} total={total} />
          </>
        )}
      </Cartao>
    </>
  );
}

async function Inadimplentes() {
  const itens = await listarInadimplentes();
  const agora = new Date();
  return (
    <Cartao corpo={false} titulo="Cobrança falhou" sub="Acesso continua por 3 dias de tolerância depois do vencimento; depois, só a tela de planos.">
      {itens.length === 0 ? (
        <Vazio titulo="Ninguém inadimplente" texto="Todas as cobranças em dia." />
      ) : (
        <Tabela>
          <thead>
            <tr>
              <Th>Pessoa</Th>
              <Th>Plano</Th>
              <Th num>Valor</Th>
              <Th>Falhou</Th>
              <Th num>Tentativas</Th>
              <Th>Período venceu</Th>
              <Th>Contato</Th>
            </tr>
          </thead>
          <tbody>
            {itens.map((x) => (
              <Tr key={x.id}>
                <Td className="min-w-[200px]">
                  <Link href={`/admin/usuarios/${x.user_id}`} className="font-semibold hover:text-azul">
                    {x.nome}
                  </Link>
                  <p className="text-[12px] text-tx2">{x.email}</p>
                </Td>
                <Td className="whitespace-nowrap">
                  {PLANO_ROTULO[x.plano]} <span className="text-tx2">· {CICLO_ROTULO[x.ciclo]}</span>
                </Td>
                <Td num>{brl(x.valor)}</Td>
                <Td className="whitespace-nowrap font-mono text-[12px] text-verm">{idade(x.falhou_em, agora)}</Td>
                <Td num>{x.tentativas}</Td>
                <Td className="font-mono text-[12px]">{dataBR(x.current_period_end)}</Td>
                <Td className="whitespace-nowrap font-mono text-[12px]">{x.telefone ?? "—"}</Td>
              </Tr>
            ))}
          </tbody>
        </Tabela>
      )}
    </Cartao>
  );
}


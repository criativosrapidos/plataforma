import type { Metadata } from "next";
import clsx from "clsx";
import { PLANO_INFO, brl, dataBR, precoCentavos } from "@aviso/shared";
import { sql } from "@/lib/db";
import { exigirLogin } from "@/lib/auth/guards";
import { acessoDoUsuario, assinaturaAtual, jaUsouTeste } from "@/lib/repo/assinaturas";
import { resumoAssinatura } from "@/components/conta/status";
import { CabecalhoConta, Painel } from "@/components/conta/Blocos";
import { GerenciarAssinatura } from "@/components/conta/GerenciarAssinatura";
import { Etiqueta, type TomEtiqueta } from "@/components/ui/Etiqueta";
import { Icone } from "@/components/ui/Icone";

export const metadata: Metadata = { title: "Assinatura", robots: { index: false, follow: false } };

type Pagamento = {
  id: string;
  valor_centavos: number;
  status: "pendente" | "pago" | "falhou" | "estornado";
  metodo: string | null;
  vencimento: string | null;
  pago_em: Date | null;
  created_at: Date;
};

const STATUS_PAGAMENTO: Record<Pagamento["status"], { r: string; tom: TomEtiqueta }> = {
  pago: { r: "Pago", tom: "verde" },
  pendente: { r: "Pendente", tom: "marca" },
  falhou: { r: "Falhou", tom: "verm" },
  estornado: { r: "Estornado", tom: "cinza" },
};

const METODO: Record<string, string> = { pix_automatico: "Pix automático", cartao: "Cartão", pix: "Pix", boleto: "Boleto" };

export default async function PaginaAssinatura() {
  const u = await exigirLogin("/conta/assinatura");
  const [assinatura, acesso, usouTeste, pagamentos] = await Promise.all([
    assinaturaAtual(u.id),
    acessoDoUsuario(u.id),
    jaUsouTeste(u.id),
    sql<Pagamento[]>`
      select id, valor_centavos, status, metodo, vencimento, pago_em, created_at
      from payments where user_id = ${u.id} order by coalesce(vencimento, created_at::date) desc, created_at desc limit 50`,
  ]);
  const resumo = resumoAssinatura(assinatura, acesso, usouTeste);

  return (
    <div className="grid grid-cols-1 gap-6">
      <CabecalhoConta rotulo="Assinatura" titulo="Seu plano" texto="Troque de plano, mude o ciclo ou cancele quando quiser. Sem multa e sem fidelidade." />

      <section aria-labelledby="t-situacao" className="rounded-[24px] border border-linha bg-branco p-5 sm:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <Etiqueta tom={resumo.tom}>{resumo.etiqueta}</Etiqueta>
            <h2 id="t-situacao" className="mt-3 font-sans text-2xl font-extrabold tracking-normal normal-case">
              {resumo.titulo}
            </h2>
            <p className="mt-1.5 leading-relaxed text-tx2">{resumo.texto}</p>
          </div>
          {assinatura && assinatura.status !== "expirada" ? (
            <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-3 rounded-2xl bg-papel p-4 text-[15px] md:min-w-[260px]">
              <div>
                <dt className="font-mono text-[10.5px] font-bold tracking-[0.12em] text-tx2 uppercase">Plano</dt>
                <dd className="font-bold">{PLANO_INFO[assinatura.plano].nome}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10.5px] font-bold tracking-[0.12em] text-tx2 uppercase">Valor</dt>
                <dd className="font-bold">
                  {brl(precoCentavos(assinatura.plano, assinatura.ciclo))}/{assinatura.ciclo === "anual" ? "ano" : "mês"}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10.5px] font-bold tracking-[0.12em] text-tx2 uppercase">Pagamento</dt>
                <dd className="font-bold">{assinatura.metodo ? METODO[assinatura.metodo] : "—"}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10.5px] font-bold tracking-[0.12em] text-tx2 uppercase">
                  {assinatura.status === "cancelada" ? "Acesso até" : assinatura.status === "trial" ? "Teste até" : "Próxima cobrança"}
                </dt>
                <dd className="font-bold">
                  {dataBR(assinatura.status === "trial" ? assinatura.trial_ends_at : (assinatura.current_period_end ?? assinatura.trial_ends_at))}
                </dd>
              </div>
            </dl>
          ) : null}
        </div>
      </section>

      <GerenciarAssinatura assinatura={assinatura} viva={resumo.viva} liberado={acesso.liberado} podeTestar={!usouTeste} />

      <Painel id="pagamentos" titulo="Histórico de pagamentos" descricao="Cobranças da sua assinatura. Durante o teste grátis não há cobrança.">
        {pagamentos.length ? (
          <div className="relative -mx-5 overflow-x-auto sm:mx-0">
            <table className="w-full min-w-[520px] border-collapse text-left text-[15px]">
              <caption className="sr-only">Pagamentos</caption>
              <thead>
                <tr className="border-b border-linha">
                  {["Data", "Valor", "Forma", "Situação"].map((h) => (
                    <th key={h} scope="col" className="px-5 py-3 font-mono text-[11px] font-bold tracking-[0.12em] text-tx2 uppercase sm:px-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagamentos.map((p) => (
                  <tr key={p.id} className="border-b border-linha last:border-0">
                    <td className="px-5 py-3 font-mono sm:px-3">{dataBR(p.pago_em ?? p.vencimento ?? p.created_at)}</td>
                    <td className="px-5 py-3 font-mono font-bold sm:px-3">{brl(p.valor_centavos)}</td>
                    <td className="px-5 py-3 sm:px-3">{p.metodo ? (METODO[p.metodo] ?? p.metodo) : "—"}</td>
                    <td className="px-5 py-3 sm:px-3">
                      <Etiqueta tom={STATUS_PAGAMENTO[p.status].tom}>{STATUS_PAGAMENTO[p.status].r}</Etiqueta>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={clsx("flex items-center gap-3 rounded-2xl bg-papel px-4 py-4 text-tx2")}>
            <Icone nome="documento" tamanho={20} className="shrink-0" />
            Nenhum pagamento ainda.
          </p>
        )}
      </Painel>
    </div>
  );
}

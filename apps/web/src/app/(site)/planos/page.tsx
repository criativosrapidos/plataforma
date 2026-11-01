import type { Metadata } from "next";
import { PLANO_INFO, TRIAL_DAYS } from "@aviso/shared";
import { TabelaPlanos } from "@/components/site/Planos";
import { LinhaTeste } from "@/components/site/LinhaTeste";
import { Cabecalho, Container } from "@/components/site/Secao";
import { FaixaCta, TopoPagina } from "@/components/site/Blocos";
import { JsonLdDuvidas, ListaDuvidas } from "@/components/site/Duvidas";
import { DUVIDAS, precoCurto } from "@/components/site/conteudo";
import { Icone } from "@/components/ui/Icone";
import { Etiqueta } from "@/components/ui/Etiqueta";

export const metadata: Metadata = {
  title: "Planos e preços",
  description: `Aviso por ${precoCurto(PLANO_INFO.aviso.precoMensalCentavos)}/mês ou Aprovado por ${precoCurto(PLANO_INFO.aprovado.precoMensalCentavos)}/mês, com ${TRIAL_DAYS} dias grátis. Anual com 2 meses grátis. Pix automático ou cartão, cancele quando quiser.`,
  alternates: { canonical: "/planos" },
};

type Valor = boolean | string;
const RECURSOS: { nome: string; aviso: Valor; aprovado: Valor; dica?: string }[] = [
  { nome: "Perfis de busca", aviso: "Ilimitados", aprovado: "Ilimitados" },
  { nome: "Notificação no celular na hora", aviso: true, aprovado: true },
  { nome: "Lembrete de isenção e de inscrição", aviso: true, aprovado: true },
  { nome: "Aviso de errata, com o que mudou", aviso: true, aprovado: true },
  { nome: "Local de prova, gabarito e resultado", aviso: true, aprovado: true },
  { nome: "Agenda com todos os concursos", aviso: true, aprovado: true },
  { nome: "Matérias em comum e checklist", aviso: true, aprovado: true },
  { nome: "Prazo acabando também no WhatsApp", aviso: false, aprovado: "Até 10 por mês", dica: "Isenção ou inscrição que acaba no dia seguinte." },
  { nome: "Pergunte ao edital com IA", aviso: false, aprovado: "30 por mês", dica: "Responde só com base no edital, citando item e página." },
  { nome: "Radar de previstos e autorizados", aviso: false, aprovado: true, dica: "Acompanhe o concurso desde o pedido de vagas." },
  { nome: "Convocação com seu nome no Diário Oficial", aviso: false, aprovado: true, dica: "Só com a sua autorização expressa." },
];

function Celula({ v }: { v: Valor }) {
  if (v === true)
    return (
      <span className="inline-flex items-center gap-1.5 font-bold text-azul">
        <Icone nome="check" tamanho={18} strokeWidth={3} rotulo="Incluído" />
      </span>
    );
  if (v === false) return <span className="text-tx2" aria-label="Não incluído">—</span>;
  return <span className="font-bold">{v}</span>;
}

export default function PaginaPlanos() {
  const anual = (p: "aviso" | "aprovado") => PLANO_INFO[p].precoMensalCentavos * 12 - PLANO_INFO[p].precoAnualCentavos;
  return (
    <>
      <TopoPagina
        rotulo="Planos e preços"
        titulo={
          <>
            Menos que uma <span className="grifo">taxa de inscrição</span>
          </>
        }
        texto={`Todo mundo começa com ${TRIAL_DAYS} dias grátis no plano que escolher. Depois, continua se quiser. Sem plano grátis, sem fidelidade e sem multa.`}
      />

      <section className="py-14 md:py-20">
        <Container>
          <TabelaPlanos />
          <p className="mt-6 max-w-3xl text-[15px] text-tx2">
            No plano anual você paga uma vez por ano: economiza {precoCurto(anual("aviso"))} no Aviso e {precoCurto(anual("aprovado"))} no
            Aprovado, o equivalente a 2 meses grátis.
          </p>
        </Container>
      </section>

      <section className="border-y border-linha bg-branco py-16 md:py-24">
        <Container>
          <Cabecalho rotulo="Comparar" titulo="O que cada plano inclui" />
          <div className="relative mt-10 overflow-x-auto rounded-[24px] border border-linha">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <caption className="sr-only">Recursos dos planos Aviso e Aprovado</caption>
              <thead>
                <tr className="border-b border-linha bg-papel">
                  <th scope="col" className="px-5 py-4 font-mono text-[12px] font-bold tracking-[0.12em] text-tx2 uppercase">
                    Recurso
                  </th>
                  <th scope="col" className="w-[22%] px-5 py-4 font-display text-2xl font-extrabold uppercase">
                    Aviso
                    <span className="block font-mono text-[12px] font-bold tracking-normal text-tx2 normal-case">
                      {precoCurto(PLANO_INFO.aviso.precoMensalCentavos)}/mês
                    </span>
                  </th>
                  <th scope="col" className="w-[22%] bg-tinta px-5 py-4 font-display text-2xl font-extrabold text-white uppercase">
                    Aprovado
                    <span className="block font-mono text-[12px] font-bold tracking-normal text-white/75 normal-case">
                      {precoCurto(PLANO_INFO.aprovado.precoMensalCentavos)}/mês
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {RECURSOS.map((r) => (
                  <tr key={r.nome} className="border-b border-linha last:border-0">
                    <th scope="row" className="px-5 py-4 font-semibold">
                      {r.nome}
                      {r.dica ? <span className="block text-sm font-normal text-tx2">{r.dica}</span> : null}
                    </th>
                    <td className="px-5 py-4">
                      <Celula v={r.aviso} />
                    </td>
                    <td className="bg-papel/60 px-5 py-4">
                      <Celula v={r.aprovado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      <section className="py-16 md:py-24">
        <Container className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Cabecalho
              rotulo="Teste grátis"
              titulo={
                <>
                  Como funcionam os <span className="grifo">{TRIAL_DAYS} dias</span>
                </>
              }
              texto="Você cadastra o Pix automático ou o cartão e usa tudo do plano. A cobrança só acontece no 4º dia, e só se você não cancelar."
            />
            <LinhaTeste className="mt-10" />
          </div>
          <div className="grid content-start gap-4">
            <div className="card p-6">
              <div className="flex flex-wrap gap-2">
                <Etiqueta tom="azul" icone="pix">
                  Pix automático
                </Etiqueta>
                <Etiqueta tom="azul" icone="cartao">
                  Cartão de crédito
                </Etiqueta>
              </div>
              <p className="mt-4 text-lg font-extrabold">Pagamento sem boleto para lembrar</p>
              <p className="mt-1 text-tx2">
                Com o Pix automático, você autoriza uma vez no app do seu banco e a cobrança acontece sozinha. Dá para cancelar a
                autorização quando quiser, no banco ou aqui.
              </p>
            </div>
            <div className="card p-6">
              <p className="text-lg font-extrabold">Por que não tem plano grátis?</p>
              <p className="mt-1 text-tx2">
                Ler os diários oficiais todo dia, conferir os editais difíceis e mandar aviso na hora custa caro. O Aviso Concurso vive
                só da assinatura: sem anúncio e sem vender seus dados. O teste existe para você decidir com calma.
              </p>
            </div>
            <div className="card p-6">
              <p className="text-lg font-extrabold">Cancelou? Usa até o fim</p>
              <p className="mt-1 text-tx2">
                Ao cancelar, você continua com acesso até o fim do período já pago (ou do teste) e não recebe nova cobrança.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="pb-16 md:pb-24">
        <Container className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-14">
          <Cabecalho rotulo="Dúvidas" titulo="Sobre planos e cobrança" />
          <ListaDuvidas itens={DUVIDAS[0].itens} />
          <JsonLdDuvidas itens={DUVIDAS[0].itens} />
        </Container>
      </section>

      <FaixaCta />
    </>
  );
}

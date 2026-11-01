import type { Metadata } from "next";
import { TRIAL_DAYS } from "@aviso/shared";
import { Cabecalho, Container } from "@/components/site/Secao";
import { TelasApp, TopoPagina } from "@/components/site/Blocos";
import { BotoesLojas, temLojas } from "@/components/site/Lojas";
import { FormLead } from "@/components/site/FormLead";
import { BotaoLink } from "@/components/ui/Botao";
import { Icone } from "@/components/ui/Icone";

export const metadata: Metadata = {
  title: "Baixar o app",
  description: `Baixe o Aviso Concurso para iPhone e Android e receba avisos de edital, prazo e prova no celular. ${TRIAL_DAYS} dias grátis.`,
  alternates: { canonical: "/baixar" },
};

const PASSOS = [
  { t: "Crie sua conta", d: "Pelo site ou pelo app, com e-mail e senha." },
  { t: "Escolha o plano", d: `${TRIAL_DAYS} dias grátis no plano que preferir.` },
  { t: "Entre no app", d: "Com o mesmo e-mail. Tudo o que você configurou já está lá." },
];

export default function PaginaBaixar() {
  return (
    <>
      <TopoPagina
        rotulo="App para iPhone e Android"
        titulo={
          temLojas ? (
            <>
              Baixe o <span className="grifo">Aviso Concurso</span>
            </>
          ) : (
            <>
              O app está chegando <span className="grifo">às lojas</span>
            </>
          )
        }
        texto={
          temLojas
            ? "Notificação na hora, agenda de todos os seus concursos e matérias em comum. Entre com a mesma conta do site."
            : "Deixe seu contato e receba o link no dia do lançamento. Enquanto isso, você já pode criar a conta e escolher o plano pelo site."
        }
      >
        {temLojas ? <BotoesLojas className="mt-8" /> : null}
      </TopoPagina>

      {!temLojas ? (
        <section className="py-14 md:py-20">
          <Container className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
            <div>
              <Cabecalho rotulo="Enquanto isso" titulo="Comece pelo site" />
              <ol className="mt-8 grid gap-4">
                {PASSOS.map((p, i) => (
                  <li key={p.t} className="flex gap-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full border-[3px] border-tinta font-mono font-bold">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-extrabold">{p.t}</p>
                      <p className="text-tx2">{p.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <BotaoLink href="/cadastro" tamanho="lg" className="mt-8" iconeDepois="setaDireita">
                Criar minha conta
              </BotaoLink>
              <p className="mt-6 flex items-start gap-2 text-[15px] text-tx2">
                <Icone nome="celular" tamanho={18} className="mt-0.5 shrink-0" />
                No iPhone e no Android, o app avisa por notificação. Pelo site você cuida da conta, da assinatura e dos perfis de busca.
              </p>
            </div>
            <FormLead origem="baixar" />
          </Container>
        </section>
      ) : null}

      <section className="border-t border-linha bg-branco py-14 md:py-20">
        <Container>
          <Cabecalho
            rotulo="Telas"
            titulo={
              <>
                O que você vai <span className="grifo">encontrar</span>
              </>
            }
          />
          <TelasApp className="mt-12" carregarJa />
          <p className="mt-6 font-mono text-[11px] font-bold tracking-[0.18em] text-tx2 uppercase">Telas ilustrativas</p>
        </Container>
      </section>
    </>
  );
}

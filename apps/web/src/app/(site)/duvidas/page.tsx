import type { Metadata } from "next";
import { Container } from "@/components/site/Secao";
import { FaixaCta, TopoPagina } from "@/components/site/Blocos";
import { JsonLdDuvidas, ListaDuvidas } from "@/components/site/Duvidas";
import { DUVIDAS, EMAIL_CONTATO } from "@/components/site/conteudo";
import { Icone } from "@/components/ui/Icone";

export const metadata: Metadata = {
  title: "Dúvidas frequentes",
  description:
    "Como funciona o teste de 3 dias, o que cada plano inclui, como chegam os avisos, de onde vêm os dados e como cancelar. Respostas diretas sobre o Aviso Concurso.",
  alternates: { canonical: "/duvidas" },
};

export default function PaginaDuvidas() {
  const todas = DUVIDAS.flatMap((g) => g.itens);
  return (
    <>
      <TopoPagina
        rotulo="Dúvidas"
        titulo={
          <>
            Perguntas <span className="grifo">frequentes</span>
          </>
        }
        texto="Respostas diretas sobre teste, planos, avisos e dados."
      >
        <nav aria-label="Assuntos" className="mt-8">
          <ul className="flex flex-wrap gap-2">
            {DUVIDAS.map((g) => (
              <li key={g.id}>
                <a
                  href={`#${g.id}`}
                  className="inline-flex min-h-11 items-center rounded-full border border-linha bg-branco px-4 font-bold text-tinta no-underline hover:border-tinta"
                >
                  {g.titulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </TopoPagina>

      <section className="py-14 md:py-20">
        <Container className="grid gap-14">
          {DUVIDAS.map((g) => (
            <div key={g.id} id={g.id} className="grid scroll-mt-24 gap-6 lg:grid-cols-[0.6fr_1.4fr] lg:gap-14">
              <h2 className="text-[clamp(2rem,5vw,3rem)]">{g.titulo}</h2>
              <ListaDuvidas itens={g.itens} />
            </div>
          ))}
          <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
            <div>
              <p className="text-xl font-extrabold">Não achou o que procurava?</p>
              <p className="mt-1 text-tx2">Escreva para a gente. Respondemos em até 2 dias úteis.</p>
            </div>
            <a
              href={`mailto:${EMAIL_CONTATO}`}
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-tinta px-6 font-bold text-white no-underline hover:bg-[#1c2448]"
            >
              <Icone nome="email" tamanho={18} />
              {EMAIL_CONTATO}
            </a>
          </div>
        </Container>
      </section>
      <JsonLdDuvidas itens={todas} />
      <FaixaCta />
    </>
  );
}

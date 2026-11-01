import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Cabecalho, Container } from "@/components/site/Secao";
import { CaminhoDoEdital, FaixaCta, TelasApp, TopoPagina } from "@/components/site/Blocos";
import { PASSOS, TIPOS_DE_AVISO } from "@/components/site/conteudo";
import { Icone } from "@/components/ui/Icone";

export const metadata: Metadata = {
  title: "Como funciona",
  description:
    "Monte seu perfil, a gente lê o Diário Oficial e os sites das bancas todo dia e avisa no celular quando sai concurso para você. Depois, acompanha isenção, inscrição, errata e prova numa agenda só.",
  alternates: { canonical: "/como-funciona" },
};

const NAO_FAZEMOS = [
  { t: "Aula, apostila, questões ou curso", d: "A gente organiza datas e matérias. O estudo é com você." },
  { t: "Inscrição no seu lugar", d: "Ela é feita no site oficial da banca. A gente manda o link certo." },
  { t: "Notícia sem fonte oficial", d: "Boato de concurso não vira aviso. Só ato publicado." },
  { t: "Opinião política", d: "Edital, vaga e prazo. Só isso." },
];

export default function PaginaComoFunciona() {
  return (
    <>
      <TopoPagina
        rotulo="Como funciona"
        titulo={
          <>
            Do Diário Oficial para o <span className="grifo">seu celular</span>
          </>
        }
        texto="Você diz o que procura uma vez. Todo dia, a gente lê o que foi publicado, separa o que é concurso e avisa quem precisa saber. Depois, organiza as datas de todos os seus concursos numa agenda só."
      />

      <section className="py-16 md:py-24">
        <Container>
          <ol className="grid gap-5">
            {PASSOS.map((p, i) => (
              <li
                key={p.letra}
                data-revelar
                style={{ "--atraso": `${i * 0.05}s` } as CSSProperties}
                className="grid gap-5 rounded-[28px] border border-linha bg-branco p-6 md:grid-cols-[96px_1fr_1.1fr] md:items-start md:gap-8 md:p-8"
              >
                <span
                  aria-hidden="true"
                  className={
                    i === 2
                      ? "grid size-16 place-items-center rounded-full border-4 border-azul bg-azul font-mono text-2xl font-bold text-white"
                      : "grid size-16 place-items-center rounded-full border-4 border-tinta font-mono text-2xl font-bold"
                  }
                >
                  {p.letra}
                </span>
                <div>
                  <p className="rotulo text-azul">Passo {i + 1}</p>
                  <h2 className="mt-2 text-[34px] md:text-[40px]">{p.titulo}</h2>
                  <p className="mt-2 text-lg text-tinta">{p.texto}</p>
                </div>
                <p className="text-[16px] leading-relaxed text-tx2 md:pt-8">{p.detalhe}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="border-y border-linha bg-branco py-16 md:py-24">
        <Container>
          <Cabecalho
            rotulo="Avisos"
            titulo={
              <>
                O que chega no <span className="grifo">seu celular</span>
              </>
            }
            texto="Push do app para tudo, na hora e sem limite. No plano Aprovado, os prazos que acabam amanhã também vão pelo WhatsApp."
          />
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TIPOS_DE_AVISO.map((t) => (
              <li key={t.nome} className="rounded-[22px] border border-linha p-5">
                <Icone nome="sino" tamanho={20} className="text-azul" />
                <p className="mt-3 font-extrabold">{t.nome}</p>
                <p className="mt-1 text-[15px] leading-relaxed text-tx2">{t.texto}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="py-16 md:py-24">
        <Container>
          <Cabecalho
            rotulo="O app"
            titulo={
              <>
                Por dentro do <span className="grifo">app</span>
              </>
            }
            texto="Hoje, Agenda, Matérias, Concursos e Ajustes. A experiência principal é no celular; pelo site você cuida da conta e da assinatura."
          />
          <TelasApp className="mt-12" />
        </Container>
      </section>

      <section className="bg-tinta py-16 text-white md:py-24">
        <Container>
          <Cabecalho
            escuro
            rotulo="Nos bastidores"
            titulo={
              <>
                O caminho de um <span className="text-marca">edital</span>
              </>
            }
            texto="Tudo sai de fonte pública e oficial. O trabalho é coletar todo dia, achar o que é concurso no meio de milhares de atos e transformar o PDF em campos que dá para filtrar."
          />
          <CaminhoDoEdital escuro className="mt-12" />
        </Container>
      </section>

      <section className="py-16 md:py-24">
        <Container className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <Cabecalho rotulo="Combinado" titulo="O que a gente não faz" texto="Para você saber exatamente o que esperar." />
          <ul className="grid gap-3 sm:grid-cols-2">
            {NAO_FAZEMOS.map((n) => (
              <li key={n.t} className="card flex gap-3 p-5">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-verm-t text-[#A8232A]">
                  <Icone nome="fechar" tamanho={16} strokeWidth={3} />
                </span>
                <div>
                  <p className="font-extrabold">{n.t}</p>
                  <p className="mt-0.5 text-[15px] text-tx2">{n.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <FaixaCta />
    </>
  );
}

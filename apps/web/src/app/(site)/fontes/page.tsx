import type { Metadata } from "next";
import { BANCAS } from "@aviso/shared";
import { Cabecalho, Container } from "@/components/site/Secao";
import { CaminhoDoEdital, FaixaCta, TopoPagina } from "@/components/site/Blocos";
import { FONTES } from "@/components/site/conteudo";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Icone, type NomeIcone } from "@/components/ui/Icone";
import { Aviso } from "@/components/ui/Aviso";

export const metadata: Metadata = {
  title: "De onde vêm os dados",
  description:
    "O Aviso Concurso lê o Diário Oficial da União, os diários municipais do Querido Diário, os diários estaduais e os sites das bancas. Todo aviso traz o link da fonte oficial.",
  alternates: { canonical: "/fontes" },
};

const REGRAS: { icone: NomeIcone; t: string; d: string }[] = [
  { icone: "externo", t: "Todo aviso tem link oficial", d: "Diário Oficial, órgão ou banca. Sem link de fonte oficial, não tem aviso." },
  { icone: "documento", t: "Guardamos o original", d: "Cada documento coletado fica guardado com o endereço e a data em que foi lido." },
  { icone: "escudo", t: "Revisão quando há dúvida", d: "Se a leitura automática não tiver certeza, a equipe confere antes de avisar." },
  { icone: "checklist", t: "Nada de aviso repetido", d: "Coletar o mesmo diário duas vezes não duplica concurso nem notificação." },
  { icone: "raio", t: "Errata comparada", d: "Retificação é ligada ao edital original. Você recebe só o que mudou." },
  { icone: "globo", t: "Coleta responsável", d: "Respeitamos os termos de uso e o robots.txt de cada site, sem sobrecarregar ninguém." },
];

export default function PaginaFontes() {
  return (
    <>
      <TopoPagina
        rotulo="Fontes oficiais"
        titulo={
          <>
            De onde vêm <span className="grifo">os dados</span>
          </>
        }
        texto="Tudo sai de fonte pública e oficial. Nada de boato, grupo de mensagem ou notícia sem ato publicado."
      />

      <section className="py-16 md:py-24">
        <Container>
          <Cabecalho rotulo="Fontes" titulo="O que a gente lê" />
          <div className="relative mt-10 hidden overflow-hidden rounded-[24px] border border-linha bg-branco lg:block">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">Fontes de dados do Aviso Concurso</caption>
              <thead>
                <tr className="border-b border-linha bg-papel">
                  {["Fonte", "O que traz", "Como a gente lê", "Frequência", "Situação"].map((h) => (
                    <th key={h} scope="col" className="px-5 py-4 font-mono text-[12px] font-bold tracking-[0.12em] text-tx2 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FONTES.map((f) => (
                  <tr key={f.nome} className="border-b border-linha align-top last:border-0">
                    <th scope="row" className="px-5 py-5 text-[17px] font-extrabold">
                      {f.nome}
                    </th>
                    <td className="px-5 py-5 text-tx2">{f.traz}</td>
                    <td className="px-5 py-5 text-tx2">{f.como}</td>
                    <td className="px-5 py-5 font-mono text-[13px] font-bold whitespace-nowrap">{f.frequencia}</td>
                    <td className="px-5 py-5">
                      <Etiqueta tom={f.fase === "no ar" ? "verde" : "marca"}>{f.fase}</Etiqueta>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="mt-10 grid gap-3 lg:hidden">
            {FONTES.map((f) => (
              <li key={f.nome} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-lg font-extrabold">{f.nome}</p>
                  <Etiqueta tom={f.fase === "no ar" ? "verde" : "marca"}>{f.fase}</Etiqueta>
                </div>
                <dl className="mt-3 grid gap-2 text-[15px]">
                  <div>
                    <dt className="font-mono text-[11px] font-bold tracking-[0.12em] text-tx2 uppercase">O que traz</dt>
                    <dd>{f.traz}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[11px] font-bold tracking-[0.12em] text-tx2 uppercase">Como a gente lê</dt>
                    <dd>{f.como}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[11px] font-bold tracking-[0.12em] text-tx2 uppercase">Frequência</dt>
                    <dd className="font-bold">{f.frequencia}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <p className="rotulo text-tx2">Bancas acompanhadas</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {BANCAS.map((b) => (
                <li key={b} className="rounded-full border border-linha bg-branco px-4 py-2 font-mono text-[13px] font-bold">
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <section className="bg-tinta py-16 text-white md:py-24">
        <Container>
          <Cabecalho
            escuro
            rotulo="Como a coleta funciona"
            titulo={
              <>
                Do PDF para <span className="text-marca">o aviso</span>
              </>
            }
            texto="O conteúdo programático também vira uma lista de matérias padronizadas, para cruzar editais diferentes na aba Matérias."
          />
          <CaminhoDoEdital escuro className="mt-12" />
        </Container>
      </section>

      <section className="py-16 md:py-24">
        <Container>
          <Cabecalho rotulo="Compromissos" titulo="Regras que a gente segue" />
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {REGRAS.map((r) => (
              <li key={r.t} className="card p-5">
                <span className="grid size-11 place-items-center rounded-2xl bg-azul-t text-azul">
                  <Icone nome={r.icone} tamanho={20} />
                </span>
                <p className="mt-3 font-extrabold">{r.t}</p>
                <p className="mt-1 text-[15px] leading-relaxed text-tx2">{r.d}</p>
              </li>
            ))}
          </ul>
          <Aviso tom="atencao" titulo="Edital falso existe" className="mt-8 max-w-3xl">
            O governo federal já alertou para sites falsos de inscrição. Regra de ouro: só pague a taxa no site da banca organizadora
            que aparece no edital. Se um link pedir pagamento em outro lugar, desconfie.
          </Aviso>
        </Container>
      </section>

      <FaixaCta />
    </>
  );
}

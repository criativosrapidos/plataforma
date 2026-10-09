import Link from "next/link";
import { Logo } from "@/components/Logo";
import { PecaPreview } from "@/components/PecaPreview";
import { BotaoLink, Cartao, Destaque, Rotulo } from "@/components/ui";
import { MARCAS, PECAS } from "@/lib/mock";
import { DETALHES, PACOTES, economia, pecas, precoPorPeca, reais } from "@/lib/pacotes";


const peca = (id: string) => PECAS.find((p) => p.id === id)!;
const marca = (id: string) => MARCAS.find((m) => m.id === id)!;

const O_QUE_FAZEMOS = [
  { t: "Reels e vídeos", d: `Vídeos verticais de ${DETALHES.duracaoVideo}, com animação, legenda na tela e música.`, ex: "p3" },
  { t: "Carrosséis", d: `Conteúdo que ensina e vende, em ${DETALHES.slidesCarrossel}, no formato do feed.`, ex: "p8" },
  { t: "Posts", d: "Peça única pro feed ou stories, com a sua logo e as suas cores.", ex: "p1" },
  { t: "Anúncios", d: "Os vídeos e carrosséis saem prontos pra rodar como anúncio no Instagram e Facebook.", ex: "p4" },
];

const PASSOS = [
  { t: "Escolha o pacote", d: "Paga no Pix ou no cartão." },
  { t: "Conte sobre a sua marca", d: "Manda a logo, as cores e o que quer vender. Leva 5 minutos." },
  { t: "Receba os criativos", d: "Prontos pra postar, com legenda. Não gostou de algo? A gente ajusta." },
];

const FAQ = [
  {
    p: "Em quanto tempo eu recebo?",
    r: `Start em até ${PACOTES[0].prazoDiasUteis} dias úteis, Pro em até ${PACOTES[1].prazoDiasUteis} e Max em até ${PACOTES[2].prazoDiasUteis}, contando a partir do envio das informações da sua marca.`,
  },
  {
    p: "E se eu não gostar?",
    r: `Cada peça tem ${DETALHES.ajustesPorPeca} rodada de ajuste incluída. E se pedir em até 7 dias da compra, antes da entrega, devolvemos 100% do valor.`,
  },
  {
    p: "Preciso mandar fotos e vídeos?",
    r: "Se tiver, ajuda: fotos do produto, do espaço ou da equipe deixam tudo mais real. Se não tiver, a gente usa imagens de banco e animações.",
  },
  {
    p: "Os criativos servem pra anúncio?",
    r: "Servem. Entregamos nos formatos do Instagram e do Facebook, prontos pra subir no gerenciador de anúncios.",
  },
  {
    p: "Vocês postam por mim?",
    r: "Por enquanto, a gente entrega os arquivos com a legenda pronta e você posta ou agenda. A gestão do perfil vem em breve.",
  },
  {
    p: "Como eu pago?",
    r: "Pix à vista ou cartão de crédito.",
  },
];

export default function Home() {
  return (
    <main className="overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b border-linha/70 bg-off/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="flex items-center gap-2">
            <Link href="#exemplos" className="hidden px-3 text-sm font-extrabold sm:block">
              Exemplos
            </Link>
            <Link href="#pacotes" className="hidden px-3 text-sm font-extrabold sm:block">
              Pacotes
            </Link>
            <BotaoLink href="#pacotes" tamanho="sm">
              Ver pacotes
            </BotaoLink>
          </nav>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 md:grid-cols-2 md:pt-20">
        <div>
          <Rotulo>Produção de criativos para Instagram</Rotulo>
          <h1 className="mt-4 text-[44px] md:text-6xl">
            Reels e carrosséis que param o <Destaque>scroll.</Destaque>
          </h1>
          <p className="mt-5 max-w-md text-lg text-cinza">
            A gente cria os vídeos, carrosséis, posts e anúncios da sua marca. Você só aprova e posta.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <BotaoLink href="#pacotes" tamanho="lg">
              Ver pacotes
            </BotaoLink>
            <BotaoLink href="/pedido?pacote=start" variante="contorno" tamanho="lg">
              Começar com {reais(PACOTES[0].preco)}
            </BotaoLink>
          </div>
          <p className="mt-4 text-sm text-cinza">1 reel + 1 carrossel por {reais(PACOTES[0].preco)}. Pronto em até {PACOTES[0].prazoDiasUteis} dias úteis.</p>
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -inset-6 -z-10 -skew-y-3 rounded-3xl bg-amarelo" />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-3">
              <PecaPreview peca={peca("p8")} marca={marca("brasa")} />
              <PecaPreview peca={peca("f1")} marca={marca("forno")} />
            </div>
            <div className="space-y-3 pt-10">
              <PecaPreview peca={peca("p3")} marca={marca("brasa")} />
            </div>
          </div>
        </div>
      </section>

      {/* o que fazemos */}
      <section id="exemplos" className="scroll-mt-16 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Rotulo>O que a gente produz</Rotulo>
          <h2 className="mt-3 max-w-2xl text-4xl md:text-5xl">
            Tudo que o seu Instagram precisa pra <Destaque>vender.</Destaque>
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {O_QUE_FAZEMOS.map((f) => {
              const p = peca(f.ex);
              return (
                <div key={f.t}>
                  <div className="mx-auto max-w-[260px]">
                    <PecaPreview peca={{ ...p, formato: "4:5" }} marca={marca(p.marcaId)} />
                  </div>
                  <h3 className="mt-4 text-xl">{f.t}</h3>
                  <p className="mt-1 text-cinza">{f.d}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-8 text-sm text-cinza">Exemplos com marcas fictícias.</p>
        </div>
      </section>

      {/* como funciona */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Rotulo>Como funciona</Rotulo>
          <h2 className="mt-3 text-4xl md:text-5xl">
            Três passos e o seu conteúdo está <Destaque>pronto.</Destaque>
          </h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {PASSOS.map((p, i) => (
              <li key={p.t}>
                <Cartao className="h-full p-6">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-amarelo font-extrabold">{i + 1}</span>
                  <h3 className="mt-4 text-xl">{p.t}</h3>
                  <p className="mt-1 text-cinza">{p.d}</p>
                </Cartao>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* pacotes */}
      <section id="pacotes" className="scroll-mt-16 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <Rotulo>Pacotes</Rotulo>
            <h2 className="mt-3 text-4xl md:text-5xl">
              Quanto mais conteúdo, mais <Destaque>barato.</Destaque>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-cinza">Cada pacote vem com reels e carrosséis na mesma quantidade, com legenda pronta.</p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {PACOTES.map((p) => {
              const d = p.destaque;
              const apoio = d ? "text-white/70" : "text-cinza";
              const eco = economia(p);
              return (
                <div key={p.id} className={`relative flex flex-col rounded-2xl border p-6 ${d ? "border-preto bg-preto text-white" : "border-linha bg-off"}`}>
                  {d && (
                    <span className="absolute -top-3 left-6 rounded-full bg-amarelo px-3 py-1 text-xs font-extrabold text-preto">Melhor custo</span>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-2xl">{p.nome}</h3>
                    {eco > 0 && (
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${d ? "bg-amarelo text-preto" : "bg-white"}`}>
                        Economize {reais(eco)}
                      </span>
                    )}
                  </div>
                  <p className={`mt-1 text-sm ${apoio}`}>{p.paraQuem}</p>

                  <div className="mt-5 flex items-end gap-1">
                    <span className="pb-1.5 text-sm font-extrabold">R$</span>
                    <span className="text-5xl font-extrabold tracking-tight">{p.preco}</span>
                  </div>
                  <p className={`mt-1 text-xs ${apoio}`}>
                    {reais(precoPorPeca(p))} por peça · Pix ou cartão
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    {[
                      [p.videos, p.videos === 1 ? "reel" : "reels"],
                      [p.carrosseis, p.carrosseis === 1 ? "carrossel" : "carrosséis"],
                    ].map(([n, t]) => (
                      <div key={t} className={`rounded-xl p-3 ${d ? "bg-white/10" : "bg-white"}`}>
                        <p className="text-3xl font-extrabold">{n}</p>
                        <p className={`text-sm ${apoio}`}>{t}</p>
                      </div>
                    ))}
                  </div>

                  <ul className="mt-5 flex-1 space-y-2 text-sm">
                    <li>· Reels de {DETALHES.duracaoVideo}</li>
                    <li>· Carrosséis de {DETALHES.slidesCarrossel}</li>
                    <li>· Legenda e hashtags em cada peça</li>
                    <li>· Prontos pra usar como anúncio</li>
                    <li>· {DETALHES.ajustesPorPeca} ajuste por peça</li>
                    <li>· Entrega em até {p.prazoDiasUteis} dias úteis</li>
                  </ul>

                  <BotaoLink href={`/pedido?pacote=${p.id}`} variante={d ? "primario" : "secundario"} className="mt-6 w-full">
                    Quero o {p.nome}
                  </BotaoLink>
                  <p className={`mt-2 text-center text-xs ${apoio}`}>{pecas(p)} peças no total</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* faq */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-4xl">Perguntas frequentes</h2>
          <div className="mt-8 divide-y divide-linha border-y border-linha">
            {FAQ.map((f) => (
              <details key={f.p} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-extrabold">
                  {f.p}
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-cinza">{f.r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-preto py-20 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-4xl md:text-5xl">
            Seu próximo reel pode sair <span className="inline-block -skew-x-[9deg] text-amarelo">essa semana.</span>
          </h2>
          <p className="mt-4 text-white/70">Comece com o Start e veja a qualidade antes de fechar um pacote maior.</p>
          <BotaoLink href="/pedido?pacote=start" tamanho="lg" className="mt-8">
            Começar com {reais(PACOTES[0].preco)}
          </BotaoLink>
        </div>
      </section>

      <footer className="bg-preto pb-10 text-white/60">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 border-t border-white/10 px-4 pt-8 text-sm sm:flex-row sm:items-center">
          <Logo escuro />
          <p>© 2026 Criativos Rápidos · criativosrapidos.com.br</p>
        </div>
      </footer>
    </main>
  );
}

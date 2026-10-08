import Link from "next/link";
import { Logo } from "@/components/Logo";
import { PecaPreview } from "@/components/PecaPreview";
import { PlanCards } from "@/components/PlanCards";
import { BotaoLink, Cartao, Destaque, Rotulo } from "@/components/ui";
import { MARCAS, PECAS } from "@/lib/mock";
import { CUSTO_CREDITOS, PACOTES_CREDITOS, brl } from "@/lib/plans";

const marca = MARCAS[0];
const peca = (id: string) => PECAS.find((p) => p.id === id)!;

const RECURSOS = [
  { t: "Calendário do mês pronto", d: "Datas, horários e o que postar em cada dia, montado pra sua marca." },
  { t: "Posts e carrosséis", d: "No formato do feed (4:5) e dos stories (9:16), com suas cores e logo." },
  { t: "Vídeos de até 30s", d: "Reels com animação e locução, sem abrir CapCut." },
  { t: "Criativos de anúncio", d: "Peças com oferta e chamada pra ação, prontas pro Meta Ads." },
  { t: "Legenda e hashtags", d: "Cada peça já sai com texto no tom da sua marca." },
  { t: "Aprovação com o cliente", d: "No Profissional, você manda um link e o cliente aprova sozinho." },
];

const FAQ = [
  {
    p: "Como funcionam os créditos?",
    r: `Cada peça gerada usa créditos: post, stories e anúncio usam ${CUSTO_CREDITOS.post}, carrossel usa ${CUSTO_CREDITOS.carrossel} e vídeo usa ${CUSTO_CREDITOS.video}. Os créditos do plano renovam todo mês. Se acabar antes, você compra um pacote extra, que não expira.`,
  },
  {
    p: "Por que o pagamento é anual?",
    r: "Assim a gente segura o menor preço. Você paga o ano à vista no Pix ou parcela em 12x no cartão, e os créditos renovam todo mês do mesmo jeito.",
  },
  {
    p: "Preciso saber design ou usar Canva?",
    r: "Não. Você conecta sua marca uma vez e a plataforma cuida das cores, da logo e do tom. Você só aprova, ajusta se quiser e baixa.",
  },
  {
    p: "Posso cancelar?",
    r: "Pode. Nos primeiros 7 dias, devolvemos 100% do valor. Depois disso, o plano segue ativo até o fim do período pago.",
  },
  {
    p: "Serve pra agência?",
    r: "Serve. O plano Profissional tem até 5 marcas, 3 usuários, link de aprovação pro cliente e sua logo no lugar da nossa.",
  },
];

export default function Home() {
  return (
    <main className="overflow-x-hidden">
      {/* topo */}
      <header className="sticky top-0 z-30 border-b border-linha/70 bg-off/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="flex items-center gap-2">
            <Link href="#planos" className="hidden px-3 text-sm font-extrabold sm:block">
              Planos
            </Link>
            <Link href="/entrar" className="px-3 text-sm font-extrabold">
              Entrar
            </Link>
            <BotaoLink href="/cadastro" tamanho="sm">
              Começar grátis
            </BotaoLink>
          </nav>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 md:grid-cols-2 md:pt-20">
        <div>
          <Rotulo>Agência de marketing com IA</Rotulo>
          <h1 className="mt-4 text-[44px] md:text-6xl">
            Um mês de conteúdo pronto em <Destaque>minutos.</Destaque>
          </h1>
          <p className="mt-5 max-w-md text-lg text-cinza">
            Posts, carrosséis, vídeos e anúncios com a cara da sua marca. Você só aprova e baixa.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <BotaoLink href="/cadastro" tamanho="lg">
              Começar grátis
            </BotaoLink>
            <BotaoLink href="/app" variante="contorno" tamanho="lg">
              Ver a plataforma
            </BotaoLink>
          </div>
          <p className="mt-4 text-sm text-cinza">10 créditos grátis por mês. Sem cartão.</p>
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -inset-6 -z-10 -skew-y-3 rounded-3xl bg-amarelo" />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-3">
              <PecaPreview peca={peca("p1")} marca={marca} />
              <PecaPreview peca={peca("p4")} marca={marca} />
            </div>
            <div className="space-y-3 pt-10">
              <PecaPreview peca={peca("p3")} marca={marca} />
            </div>
          </div>
        </div>
      </section>

      {/* como funciona */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <Rotulo>Como funciona</Rotulo>
            <h2 className="mt-3 text-4xl md:text-5xl">
              Três passos. O resto fica com a <Destaque>plataforma.</Destaque>
            </h2>
          </div>

          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {/* passo 1 */}
            <div>
              <div className="rounded-3xl bg-off p-5">
                <Cartao className="p-4">
                  <div className="flex items-center justify-between border-b border-linha pb-3">
                    <span className="font-extrabold">Minha marca</span>
                    <span className="rounded-full bg-amarelo px-2.5 py-0.5 text-xs font-extrabold">Conectado</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="font-extrabold">{marca.instagram}</span>
                    <span className="text-sm text-cinza">Instagram</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-off p-3">
                    <div>
                      <Rotulo className="!text-[10px]">Cores</Rotulo>
                      <div className="mt-1.5 flex gap-1.5">
                        {marca.cores.map((c) => (
                          <span key={c} className="h-6 w-6 rounded-full border border-linha" style={{ background: c }} />
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <Rotulo className="!text-[10px]">Tom</Rotulo>
                      <span className="mt-1.5 inline-block rounded-full bg-white px-2.5 py-0.5 text-sm font-extrabold">{marca.tom}</span>
                    </div>
                  </div>
                </Cartao>
              </div>
              <p className="mt-5 text-sm font-extrabold text-cinza">01</p>
              <h3 className="mt-1 text-2xl">É só conectar sua marca.</h3>
              <p className="mt-2 text-cinza">Seu Instagram ou seu site ensinam cores, tom e estilo. Você faz isso uma vez.</p>
            </div>

            {/* passo 2 */}
            <div>
              <div className="rounded-3xl bg-off p-5">
                <div className="flex items-center justify-between rounded-full border-2 border-preto bg-white py-2 pl-4 pr-2">
                  <span className="text-sm">Promoção do combo de terça</span>
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-amarelo font-extrabold">→</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <PecaPreview peca={peca("p9")} marca={marca} tamanho="mini" />
                  <PecaPreview peca={peca("p7")} marca={marca} tamanho="mini" />
                  <PecaPreview peca={peca("p11")} marca={marca} tamanho="mini" />
                </div>
              </div>
              <p className="mt-5 text-sm font-extrabold text-cinza">02</p>
              <h3 className="mt-1 text-2xl">Diga o tema ou deixe com a gente.</h3>
              <p className="mt-2 text-cinza">A plataforma monta o calendário do mês com posts, carrosséis, vídeos e anúncios.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Post", "Carrossel", "Vídeo", "Stories", "Anúncio"].map((t) => (
                  <span key={t} className="rounded-full bg-off px-3 py-1 text-xs font-extrabold uppercase tracking-wider">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* passo 3 */}
            <div>
              <div className="rounded-3xl bg-off p-5">
                <Cartao className="p-4">
                  <div className="flex items-center justify-between border-b border-linha pb-3">
                    <span className="font-extrabold">Esta semana</span>
                    <span className="rounded-full bg-preto px-2.5 py-0.5 text-xs font-extrabold text-white">3 aprovadas</span>
                  </div>
                  <div className="mt-3 grid grid-cols-5 gap-1.5 text-center text-[10px] font-extrabold text-cinza">
                    {["SEG", "TER", "QUA", "QUI", "SEX"].map((d, i) => (
                      <div key={d}>
                        {d}
                        <div className="mt-1">
                          {i % 2 === 0 ? (
                            <PecaPreview peca={peca(["p1", "p4", "p6"][i / 2])} marca={marca} tamanho="mini" />
                          ) : (
                            <div className="aspect-[4/5] rounded-md bg-off" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-sm font-extrabold">✓ Qua, 18h · Instagram</p>
                </Cartao>
              </div>
              <p className="mt-5 text-sm font-extrabold text-cinza">03</p>
              <h3 className="mt-1 text-2xl">É só aprovar e baixar.</h3>
              <p className="mt-2 text-cinza">Ajuste o que quiser, gere de novo se não gostar e baixe a peça pronta pra postar.</p>
            </div>
          </div>
        </div>
      </section>

      {/* o que você acessa */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Rotulo>O que você acessa</Rotulo>
          <h2 className="mt-3 max-w-2xl text-4xl md:text-5xl">
            Tudo que uma agência entrega, sem a <Destaque>demora.</Destaque>
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {RECURSOS.map((r, i) => (
              <Cartao key={r.t} className="p-6">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-amarelo text-sm font-extrabold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-xl">{r.t}</h3>
                <p className="mt-2 text-cinza">{r.d}</p>
              </Cartao>
            ))}
          </div>
        </div>
      </section>

      {/* planos */}
      <section id="planos" className="scroll-mt-16 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <Rotulo>Planos</Rotulo>
            <h2 className="mt-3 text-4xl md:text-5xl">
              Comece grátis. Cresça quando <Destaque>quiser.</Destaque>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-cinza">Preço por mês no plano anual. Créditos renovam todo mês.</p>
          </div>
          <div className="mt-12">
            <PlanCards />
          </div>

          {/* créditos */}
          <div className="mt-10 grid gap-6 rounded-2xl bg-off p-6 md:grid-cols-2 md:p-8">
            <div>
              <h3 className="text-2xl">Como funcionam os créditos</h3>
              <p className="mt-2 text-cinza">Cada peça usa uma quantidade de créditos. Acabou antes do mês virar? Compra um pacote extra, que não expira.</p>
              <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
                {[
                  ["Post", CUSTO_CREDITOS.post],
                  ["Stories", CUSTO_CREDITOS.stories],
                  ["Anúncio", CUSTO_CREDITOS.anuncio],
                  ["Carrossel", CUSTO_CREDITOS.carrossel],
                  ["Vídeo até 30s", CUSTO_CREDITOS.video],
                ].map(([t, c]) => (
                  <li key={t} className="flex justify-between rounded-lg bg-white px-3 py-2">
                    <span>{t}</span>
                    <span className="font-extrabold">
                      {c} {c === 1 ? "crédito" : "créditos"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-2xl">Créditos extras</h3>
              <p className="mt-2 text-cinza">Nos planos Básico e Profissional.</p>
              <ul className="mt-4 space-y-2">
                {PACOTES_CREDITOS.map((p) => (
                  <li key={p.id} className="flex items-center justify-between rounded-lg bg-white px-4 py-3">
                    <span className="font-extrabold">+{p.creditos} créditos</span>
                    <span>{brl(p.preco)}</span>
                  </li>
                ))}
              </ul>
            </div>
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

      {/* cta final */}
      <section className="bg-preto py-20 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-4xl md:text-5xl">
            Seu próximo mês de posts começa <span className="inline-block -skew-x-[9deg] text-amarelo">agora.</span>
          </h2>
          <p className="mt-4 text-white/70">Crie sua conta grátis e veja sua marca virar conteúdo em minutos.</p>
          <BotaoLink href="/cadastro" tamanho="lg" className="mt-8">
            Começar grátis
          </BotaoLink>
        </div>
      </section>

      <footer className="bg-preto pb-10 text-white/60">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 border-t border-white/10 px-4 pt-8 text-sm sm:flex-row sm:items-center">
          <Logo escuro />
          <p>© 2026 Criativos Rápidos. Todos os direitos reservados.</p>
        </div>
      </footer>
    </main>
  );
}

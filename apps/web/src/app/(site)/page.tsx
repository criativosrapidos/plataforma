import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import { BANCAS, PLANO_INFO, TRIAL_DAYS } from "@aviso/shared";
import { Cabecalho, Container } from "@/components/site/Secao";
import { CelularAvisos } from "@/components/site/landing/CelularAvisos";
import { AgendaMock, MateriasMock, ResumoEdital } from "@/components/site/landing/Mockups";
import { Contagem } from "@/components/site/landing/Contagem";
import { TabelaPlanos } from "@/components/site/Planos";
import { LinhaTeste } from "@/components/site/LinhaTeste";
import { Comparacao } from "@/components/site/Comparacao";
import { JsonLdDuvidas, ListaDuvidas } from "@/components/site/Duvidas";
import { FormLead } from "@/components/site/FormLead";
import { BotoesLojas, temLojas } from "@/components/site/Lojas";
import { CICLO, DUVIDAS_DESTAQUE, FONTES, PASSOS, PRECO_AVISO } from "@/components/site/conteudo";
import { BotaoLink } from "@/components/ui/Botao";
import { Icone, type NomeIcone } from "@/components/ui/Icone";
import { Etiqueta } from "@/components/ui/Etiqueta";
import telaPush from "../../../public/app/push.png";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const atraso = (s: number) => ({ "--atraso": `${s}s` }) as CSSProperties;

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_43px,rgb(225_227_234/0.75)_43px,rgb(225_227_234/0.75)_44px)] [mask-image:radial-gradient(ellipse_70%_60%_at_25%_35%,black,transparent)]"
      />
      <Container className="relative grid items-center gap-14 pt-10 pb-16 sm:pt-14 lg:grid-cols-[1.2fr_0.8fr] lg:gap-6 lg:pt-20 lg:pb-24">
        <div>
          <p className="rotulo flex items-center gap-2.5 text-azul">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-verde opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex size-2.5 rounded-full bg-verde" />
            </span>
            Alertas de concurso público
          </p>
          <h1 className="mt-5 text-[clamp(3.3rem,10vw,6.6rem)]">
            Você já perdeu concurso. <span className="ac-grifo-varre whitespace-nowrap">E nem viu.</span>
          </h1>
          <p className="mt-6 max-w-[590px] text-lg leading-relaxed text-tx2 md:text-[21px]">
            Edital que saiu e você não viu. Isenção que passou. Inscrição que fechou. O Aviso Concurso lê o Diário Oficial e os
            sites das bancas todo dia e te avisa no celular.{" "}
            <strong className="font-bold text-tinta">Nunca mais se preocupe em perder uma data.</strong>
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <BotoesLojas textoFallback={`Testar ${TRIAL_DAYS} dias grátis`} />
            <BotaoLink href="/como-funciona" variante="secundario" tamanho="lg">
              Ver como funciona
            </BotaoLink>
          </div>
          <p className="mt-5 font-mono text-[13px] text-tx2">
            {TRIAL_DAYS} dias grátis · depois {PRECO_AVISO}/mês · cancele quando quiser
          </p>
        </div>
        <CelularAvisos />
      </Container>
      <div className="relative border-y border-linha bg-branco/70">
        <Container className="flex flex-col gap-3 py-5 md:flex-row md:items-center md:gap-6">
          <p className="rotulo shrink-0 text-tx2">A gente lê todo dia</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[13px] font-bold text-tinta">
            {["Diário Oficial da União", "Querido Diário", ...BANCAS].map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </Container>
      </div>
    </section>
  );
}

const PERDAS = [
  { quando: "Terça, 06:00", texto: "O edital saiu no Diário Oficial.", nota: "Ninguém lê 300 páginas de diário antes do café." },
  { quando: "5 dias depois", texto: "A isenção da taxa fechou.", nota: "Prazo próprio, bem mais curto que o da inscrição.", risco: true },
  { quando: "Quando você viu", texto: "A inscrição já tinha acabado.", nota: "E lá se foi a chance de fazer essa prova.", carimbo: true },
];

function Dor() {
  return (
    <section className="relative overflow-hidden bg-tinta py-20 text-white md:py-28">
      <div aria-hidden="true" className="absolute -top-40 -right-40 size-[520px] rounded-full border-[40px] border-white/[0.04]" />
      <Container className="relative">
        <p className="rotulo text-marca">Acontece</p>
        <h2 className="mt-3 max-w-4xl text-[clamp(2.6rem,7vw,5.2rem)]">
          Não foi falta de estudo. Foi falta de <span className="text-marca">aviso.</span>
        </h2>
        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {PERDAS.map((p, i) => (
            <li
              key={p.quando}
              data-revelar
              style={atraso(i * 0.12)}
              className="relative overflow-hidden rounded-[24px] border border-white/12 bg-white/[0.04] p-6"
            >
              <p className="font-mono text-[12px] font-bold tracking-[0.14em] text-marca uppercase">{p.quando}</p>
              <p className="mt-3 text-[22px] leading-snug font-bold">
                {p.risco ? <span className="ac-risco">{p.texto}</span> : p.texto}
              </p>
              <p className="mt-2 text-white/70">{p.nota}</p>
              {p.carimbo ? (
                <span
                  aria-hidden="true"
                  className="ac-carimbo mt-5 inline-block rounded-md border-[3px] border-verm px-2.5 py-0.5 font-display text-[24px] font-extrabold tracking-wide text-[#FF6B70] uppercase"
                >
                  Inscrição encerrada
                </span>
              ) : null}
            </li>
          ))}
        </ol>
        <div className="mt-12 flex flex-col gap-6 border-t border-white/12 pt-10 md:flex-row md:items-end md:justify-between">
          <p className="max-w-2xl text-xl leading-relaxed text-[#D6DCFA] md:text-2xl">
            O Aviso Concurso lê o Diário Oficial e os sites das bancas todo dia. Saiu concurso do seu perfil? Chega uma notificação
            no seu celular, com resumo e link oficial.
          </p>
          <BotaoLink href="/cadastro" variante="marca" tamanho="lg" iconeDepois="setaDireita" className="shrink-0">
            Começar meu teste
          </BotaoLink>
        </div>
      </Container>
    </section>
  );
}

function ComoFunciona() {
  return (
    <section id="como" className="scroll-mt-20 py-20 md:py-28">
      <Container>
        <Cabecalho
          rotulo="Como funciona"
          titulo={
            <>
              Você escolhe. A gente <span className="grifo">procura.</span>
            </>
          }
          texto="Nada de abrir 30 sites por dia. Configure uma vez e receba no celular só o que serve para você."
        />
        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PASSOS.map((p, i) => (
            <li key={p.letra} data-revelar style={atraso(i * 0.08)} className="group card flex flex-col gap-3 p-6">
              <span
                aria-hidden="true"
                className={
                  p.letra === "C"
                    ? "grid size-12 place-items-center rounded-full border-[3px] border-azul bg-azul font-mono text-lg font-bold text-white"
                    : "grid size-12 place-items-center rounded-full border-[3px] border-tinta font-mono text-lg font-bold transition-colors group-hover:border-azul group-hover:bg-azul group-hover:text-white"
                }
              >
                {p.letra}
              </span>
              <h3 className="mt-1 text-xl font-extrabold">{p.titulo}</h3>
              <p className="text-[15.5px] leading-relaxed text-tx2">{p.texto}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8">
          <Link href="/como-funciona" className="inline-flex min-h-11 items-center gap-2 font-bold text-azul">
            Ver o passo a passo completo <Icone nome="setaDireita" tamanho={18} />
          </Link>
        </p>
      </Container>
    </section>
  );
}

const RECURSOS_AGENDA: { icone: NomeIcone; titulo: string; texto: string }[] = [
  { icone: "relogio", titulo: "Contagem regressiva", texto: "Quantos dias faltam para cada prova, na tela inicial." },
  { icone: "checklist", titulo: "Checklist por concurso", texto: "Isenção, inscrição, boleto, local de prova, documento e caneta." },
  { icone: "raio", titulo: "Errata atualiza sozinha", texto: "Mudou a data no edital? A agenda muda junto e você recebe o que mudou." },
  { icone: "sino", titulo: "Lembrete na hora certa", texto: "1, 2, 3 ou 5 dias antes de cada prazo, com horário silencioso." },
];

const CONTAGENS = [
  { nome: "Tribunal", dias: 21, cor: "#1F3FD1" },
  { nome: "SEFAZ", dias: 35, cor: "#7A3FD1" },
  { nome: "Prefeitura", dias: 40, cor: "#0B7F86" },
];

function Agenda() {
  return (
    <section id="agenda" className="scroll-mt-20 border-y border-linha bg-branco py-20 md:py-28">
      <Container className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <Cabecalho
            rotulo="Agenda"
            titulo={
              <>
                Estudando para <span className="grifo">vários</span> concursos?
              </>
            }
            texto="A agenda junta todos os concursos que você acompanha: isenção, inscrição, local de prova e prova, cada um com sua cor."
          />
          <div className="mt-8 grid max-w-md grid-cols-3 gap-2.5" data-revelar>
            {CONTAGENS.map((c) => (
              <div key={c.nome} className="overflow-hidden rounded-2xl border border-linha bg-branco" style={{ borderTop: `4px solid ${c.cor}` }}>
                <div className="p-3">
                  <p className="font-mono text-[10.5px] font-bold tracking-[0.12em] text-tx2 uppercase">{c.nome}</p>
                  <p className="mt-1 font-display text-[44px] leading-none font-extrabold">
                    <Contagem ate={c.dias} />
                  </p>
                  <p className="text-sm font-bold">dias</p>
                </div>
              </div>
            ))}
          </div>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2">
            {RECURSOS_AGENDA.map((r) => (
              <li key={r.titulo} className="flex gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-azul-t text-azul">
                  <Icone nome={r.icone} tamanho={20} />
                </span>
                <div>
                  <p className="font-bold">{r.titulo}</p>
                  <p className="text-[15px] leading-relaxed text-tx2">{r.texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <AgendaMock />
      </Container>

      <Container className="mt-24 grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div className="lg:order-2">
          <Cabecalho
            rotulo="Matérias em comum"
            titulo={
              <>
                Português cai nos 3? <span className="grifo">Aparece primeiro.</span>
              </>
            }
            texto="O app lê o conteúdo programático de cada edital e mostra primeiro as matérias que caem em mais concursos, com as questões somadas. Liga e desliga concursos para ver o que muda."
          />
          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-papel px-4 py-2 text-[15px] font-bold ring-1 ring-linha">
            <Icone nome="livro" tamanho={18} className="text-azul" />A gente organiza. Não dá aula.
          </p>
        </div>
        <MateriasMock className="lg:order-1" />
      </Container>
    </section>
  );
}

function Ciclo() {
  return (
    <section className="relative overflow-hidden bg-azul py-20 text-white md:py-28">
      <div aria-hidden="true" className="absolute -bottom-48 -left-24 size-[460px] rounded-full border-[36px] border-white/[0.06]" />
      <div aria-hidden="true" className="absolute top-10 right-6 size-20 rounded-full border-[10px] border-azul bg-marca ring-[10px] ring-white/10 md:right-12 md:size-28" />
      <Container className="relative">
        <Cabecalho
          escuro
          rotulo="O ciclo do concurso"
          titulo={
            <>
              Avisamos antes do <span className="text-marca">edital</span>
            </>
          }
          texto="No plano Aprovado, você acompanha o concurso desde o pedido de vagas. Em todos os planos, do edital até o resultado."
        />
        <ol className="mt-12 grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 lg:grid-cols-6">
          {CICLO.map((e, i) => (
            <li key={e.nome} data-revelar style={atraso(i * 0.07)} className="border-t-4 border-marca pt-4">
              <p className="font-mono text-[12px] font-bold text-marca">0{i + 1}</p>
              <p className="mt-1 font-display text-[28px] leading-none font-extrabold uppercase">{e.nome}</p>
              <p className="mt-2 text-[15px] leading-snug text-[#D6DCFA]">{e.texto}</p>
              {e.aprovado ? (
                <span className="mt-3 inline-block rounded-full bg-white/15 px-2.5 py-0.5 font-mono text-[10.5px] font-bold tracking-wide">
                  PLANO APROVADO
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

function Fontes() {
  return (
    <section id="fontes" className="scroll-mt-20 py-20 md:py-28">
      <Container className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <Cabecalho
            rotulo="Fontes oficiais"
            titulo={
              <>
                Só link <span className="grifo">oficial.</span>
              </>
            }
            texto="Sites falsos de inscrição existem. Todo aviso traz a fonte para você conferir: Diário Oficial, órgão ou banca."
          />
          <ul className="mt-8 grid gap-3">
            {FONTES.slice(0, 3).map((f) => (
              <li key={f.nome} className="card flex items-start gap-3 p-4">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-verde-t text-[#0A6633]">
                  <Icone nome="check" tamanho={16} strokeWidth={3} />
                </span>
                <div className="min-w-0">
                  <p className="font-bold">{f.nome}</p>
                  <p className="text-[15px] text-tx2">{f.traz}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link href="/fontes" className="mt-6 inline-flex min-h-11 items-center gap-2 font-bold text-azul">
            Como a gente puxa os concursos <Icone nome="setaDireita" tamanho={18} />
          </Link>
        </div>
        <ResumoEdital />
      </Container>
    </section>
  );
}

function SecaoPlanos() {
  return (
    <section id="planos" className="scroll-mt-20 border-y border-linha bg-branco py-20 md:py-28">
      <Container className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:grid-rows-[auto_1fr] lg:gap-x-14 lg:gap-y-0">
        <div className="lg:col-start-1 lg:row-start-1">
          <Cabecalho
            rotulo="Planos"
            titulo={
              <>
                Menos que uma <span className="grifo">taxa de inscrição</span>
              </>
            }
            texto={`${TRIAL_DAYS} dias grátis com o plano completo. Depois, escolha. Sem plano grátis e sem fidelidade.`}
          />
        </div>
        <div className="order-last lg:order-none lg:col-start-1 lg:row-start-2 lg:pt-10">
          <LinhaTeste />
          <p className="mt-8 flex flex-wrap items-center gap-2 text-[15px] text-tx2">
            <Etiqueta tom="cinza" icone="pix">
              Pix automático
            </Etiqueta>
            <Etiqueta tom="cinza" icone="cartao">
              Cartão
            </Etiqueta>
            <span>Cancele quando quiser.</span>
          </p>
        </div>
        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <TabelaPlanos />
          <p className="mt-6 text-[15px] text-tx2">
            Compare tudo o que cada plano inclui em{" "}
            <Link href="/planos" className="font-bold text-azul">
              planos e preços
            </Link>
            .
          </p>
        </div>
      </Container>
    </section>
  );
}

function SecaoComparacao() {
  return (
    <section className="py-20 md:py-28">
      <Container>
        <Cabecalho
          rotulo="Comparação"
          titulo={
            <>
              Procurar sozinho <span className="grifo">cansa</span>
            </>
          }
        />
        <div className="mt-10" data-revelar>
          <Comparacao />
        </div>
      </Container>
    </section>
  );
}

function SecaoDuvidas() {
  return (
    <section id="duvidas" className="scroll-mt-20 pb-20 md:pb-28">
      <Container className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-14">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Cabecalho
            rotulo="Dúvidas"
            titulo={
              <>
                Perguntas <span className="grifo">frequentes</span>
              </>
            }
            texto="Não achou a sua? Veja todas as dúvidas ou fale com a gente."
          />
          <BotaoLink href="/duvidas" variante="secundario" className="mt-6" iconeDepois="setaDireita">
            Todas as dúvidas
          </BotaoLink>
        </div>
        <ListaDuvidas itens={DUVIDAS_DESTAQUE} abrirPrimeira />
        <JsonLdDuvidas itens={DUVIDAS_DESTAQUE} />
      </Container>
    </section>
  );
}

function CtaFinal() {
  return (
    <section id="lista" className="scroll-mt-20 overflow-hidden bg-marca py-20 md:py-28">
      <Container className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="text-[clamp(2.8rem,7.5vw,5.4rem)] !leading-[1.06]">
            Nunca mais se preocupe em perder{" "}
            <span className="bg-tinta px-2 text-marca [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">uma data.</span>
          </h2>
          <p className="mt-6 max-w-xl text-xl leading-relaxed">
            {TRIAL_DAYS} dias grátis com o plano completo. Depois, {PRECO_AVISO} por mês no plano {PLANO_INFO.aviso.nome}. Cancele
            quando quiser.
          </p>
          <BotoesLojas className="mt-8" varianteFallback="escuro" textoFallback="Criar minha conta grátis" />
          {!temLojas ? (
            <p className="mt-4 max-w-md text-[15px]">
              O app está chegando às lojas. Crie sua conta pelo site agora ou deixe seu contato para receber o link no lançamento.
            </p>
          ) : null}
        </div>
        {temLojas ? (
          <div className="relative mx-auto w-[260px]">
            <Image src={telaPush} alt="Tela Hoje do app, com a contagem para a próxima prova e os avisos do dia" className="h-auto w-full drop-shadow-2xl" />
          </div>
        ) : (
          <FormLead origem="landing" />
        )}
      </Container>
    </section>
  );
}

function JsonLdOrganizacao() {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const dados = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${base}/#org`,
        name: "Aviso Concurso",
        url: base,
        logo: `${base}/simbolo.svg`,
        sameAs: ["https://www.instagram.com/avisoconcurso"],
      },
      { "@type": "WebSite", name: "Aviso Concurso", url: base, inLanguage: "pt-BR", publisher: { "@id": `${base}/#org` } },
      {
        "@type": "SoftwareApplication",
        name: "Aviso Concurso",
        applicationCategory: "EducationalApplication",
        operatingSystem: "iOS, Android",
        description: "Avisos de edital, prazo e prova de concursos públicos no celular, com agenda de vários concursos.",
        offers: (["aviso", "aprovado"] as const).map((p) => ({
          "@type": "Offer",
          name: `Plano ${PLANO_INFO[p].nome}`,
          price: (PLANO_INFO[p].precoMensalCentavos / 100).toFixed(2),
          priceCurrency: "BRL",
        })),
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dados).replace(/</g, "\\u003c") }} />;
}

export default function PaginaInicial() {
  return (
    <>
      <Hero />
      <Dor />
      <ComoFunciona />
      <Agenda />
      <Ciclo />
      <Fontes />
      <SecaoPlanos />
      <SecaoComparacao />
      <SecaoDuvidas />
      <CtaFinal />
      <JsonLdOrganizacao />
    </>
  );
}

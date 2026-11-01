import Image from "next/image";
import clsx from "clsx";
import type { CSSProperties, ReactNode } from "react";
import { Icone, type NomeIcone } from "@/components/ui/Icone";
import { BotoesLojas, temLojas } from "./Lojas";
import { Container } from "./Secao";
import telaPush from "../../../public/app/push.png";
import telaAgenda from "../../../public/app/agenda.png";
import telaMaterias from "../../../public/app/materias.png";
import telaConcursos from "../../../public/app/concursos.png";
import telaPergunte from "../../../public/app/pergunte.png";

const TELAS = [
  { img: telaPush, titulo: "Hoje", texto: "Contagem para a próxima prova e os avisos do dia.", alt: "Tela Hoje do app com notificação de edital publicado" },
  { img: telaAgenda, titulo: "Agenda", texto: "Todos os concursos, uma cor para cada.", alt: "Tela Agenda com compromissos de três concursos" },
  { img: telaMaterias, titulo: "Matérias", texto: "O que cai em mais editais aparece primeiro.", alt: "Tela Matérias em comum entre três concursos" },
  { img: telaConcursos, titulo: "Concursos", texto: "Etapas e checklist de cada concurso.", alt: "Tela Concursos com checklist de isenção e inscrição" },
  { img: telaPergunte, titulo: "Pergunte ao edital", texto: "Respostas citando item e página. Plano Aprovado.", alt: "Tela Pergunte ao edital com resposta citando o item do edital" },
];

/** Telas do app lado a lado (rolagem com encaixe no celular). */
export function TelasApp({ className, carregarJa }: { className?: string; carregarJa?: boolean }) {
  return (
    <ul
      className={clsx(
        "relative -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0",
        className,
      )}
      aria-label="Telas do app"
    >
      {TELAS.map((t, i) => (
        <li key={t.titulo} data-revelar style={{ "--atraso": `${i * 0.07}s` } as CSSProperties} className="w-[220px] shrink-0 snap-start lg:w-auto">
          <Image src={t.img} alt={t.alt} loading={carregarJa && i < 2 ? "eager" : "lazy"} className="h-auto w-full drop-shadow-[0_20px_30px_rgb(15_21_48/0.25)]" sizes="(min-width: 1024px) 220px, 220px" />
          <p className="mt-4 font-display text-2xl leading-none font-extrabold uppercase">{t.titulo}</p>
          <p className="mt-1 text-[15px] text-tx2">{t.texto}</p>
        </li>
      ))}
    </ul>
  );
}

const ETAPAS_COLETA: { icone: NomeIcone; titulo: string; texto: string }[] = [
  { icone: "globo", titulo: "Coletor", texto: "Baixa o Diário Oficial, os diários municipais e as páginas das bancas. Guarda o original com link e data." },
  { icone: "filtro", titulo: "Filtro", texto: "No meio de milhares de atos, separa o que é concurso: previsto, autorização, edital, errata, resultado, convocação." },
  { icone: "documento", titulo: "Leitor com IA", texto: "Transforma o PDF em campos: órgão, cargos, vagas, salário, taxa, datas e matérias, com item e página de origem." },
  { icone: "escudo", titulo: "Revisão humana", texto: "Leitura com pouca confiança vai para a equipe conferir antes de qualquer aviso sair." },
  { icone: "pasta", titulo: "Concursos", texto: "Um concurso por edital, sem duplicar. Errata liga ao edital original e mostra o que mudou." },
  { icone: "sino", titulo: "Notificação", texto: "Cruza com os perfis de busca e avisa quem precisa saber, com o link oficial." },
];

/** Caminho de um edital: do diário oficial até a notificação. */
export function CaminhoDoEdital({ escuro, className }: { escuro?: boolean; className?: string }) {
  return (
    <ol className={clsx("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {ETAPAS_COLETA.map((e, i) => (
        <li
          key={e.titulo}
          data-revelar
          style={{ "--atraso": `${i * 0.06}s` } as CSSProperties}
          className={clsx(
            "relative flex gap-4 rounded-[22px] p-5",
            escuro ? "bg-white/[0.06] ring-1 ring-white/12" : "border border-linha bg-branco",
          )}
        >
          <span
            className={clsx(
              "grid size-12 shrink-0 place-items-center rounded-2xl",
              escuro ? "bg-white/10 text-marca" : "bg-azul-t text-azul",
            )}
          >
            <Icone nome={e.icone} tamanho={22} />
          </span>
          <div>
            <p className={clsx("font-mono text-[11px] font-bold tracking-[0.14em] uppercase", escuro ? "text-marca" : "text-azul")}>
              Etapa {i + 1}
            </p>
            <p className="mt-0.5 text-lg font-extrabold">{e.titulo}</p>
            <p className={clsx("mt-1 text-[15px] leading-relaxed", escuro ? "text-[#D6DCFA]" : "text-tx2")}>{e.texto}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Faixa de chamada no fim das páginas internas. */
export function FaixaCta({
  titulo = (
    <>
      Nunca mais se preocupe em perder <span className="text-marca">uma data.</span>
    </>
  ),
  texto = "Teste 3 dias grátis com o plano completo. Depois, R$ 9,90 por mês. Cancele quando quiser.",
}: {
  titulo?: ReactNode;
  texto?: ReactNode;
}) {
  return (
    <section className="px-4 pb-20 sm:px-6 md:pb-28">
      <div className="relative mx-auto max-w-[1152px] overflow-hidden rounded-[32px] bg-tinta px-6 py-12 text-white sm:px-10 md:px-14 md:py-16">
        <div aria-hidden="true" className="absolute -top-24 -right-24 size-72 rounded-full border-[28px] border-white/[0.05]" />
        <div aria-hidden="true" className="absolute right-10 bottom-10 hidden size-16 rounded-full bg-marca md:block" />
        <div className="relative grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div>
            <h2 className="text-[clamp(2.4rem,6vw,4.2rem)]">{titulo}</h2>
            <p className="mt-4 max-w-xl text-lg text-[#D6DCFA]">{texto}</p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <BotoesLojas varianteFallback="marca" claro />
            {!temLojas ? <p className="text-sm text-white/70">Crie a conta pelo site. O app chega às lojas em breve.</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Topo das páginas internas. */
export function TopoPagina({
  rotulo,
  titulo,
  texto,
  children,
  className,
}: {
  rotulo: ReactNode;
  titulo: ReactNode;
  texto?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={clsx("relative overflow-hidden border-b border-linha", className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_43px,rgb(225_227_234/0.75)_43px,rgb(225_227_234/0.75)_44px)] [mask-image:radial-gradient(ellipse_60%_80%_at_20%_40%,black,transparent)]"
      />
      <Container className="relative pt-12 pb-14 md:pt-20 md:pb-20">
        <p className="rotulo text-azul">{rotulo}</p>
        <h1 className="mt-4 max-w-4xl text-[clamp(2.9rem,8vw,5.6rem)]">{titulo}</h1>
        {texto ? <div className="mt-6 max-w-2xl text-lg leading-relaxed text-tx2 md:text-xl">{texto}</div> : null}
        {children}
      </Container>
    </header>
  );
}

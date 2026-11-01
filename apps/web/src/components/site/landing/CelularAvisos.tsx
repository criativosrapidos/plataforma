import type { CSSProperties } from "react";
import clsx from "clsx";
import { Simbolo } from "@/components/ui/Logo";
import { Etiqueta, type TomEtiqueta } from "@/components/ui/Etiqueta";
import { Icone } from "@/components/ui/Icone";

const NOTIFICACOES: { quando: string; tom: TomEtiqueta; tag: string; titulo: string; texto: string; atraso: number }[] = [
  {
    quando: "agora",
    tom: "verde-solido",
    tag: "Edital publicado",
    titulo: "Tribunal Regional · Técnico Judiciário",
    texto: "Nível médio · 42 vagas + CR · R$ 8.500,00 · inscrições de 03/11 a 02/12",
    atraso: 0.5,
  },
  {
    quando: "1 h",
    tom: "verm-solido",
    tag: "Isenção acaba amanhã",
    titulo: "SEFAZ · Auditor Fiscal",
    texto: "Peça a isenção da taxa até 04/11, no site da banca.",
    atraso: 1.3,
  },
  {
    quando: "ontem",
    tom: "marca",
    tag: "Errata",
    titulo: "Prova mudou de 14/12 para 21/12",
    texto: "Prefeitura · Professor PEB II. Sua agenda já foi atualizada.",
    atraso: 2.1,
  },
];

function Notificacao({ n }: { n: (typeof NOTIFICACOES)[number] }) {
  return (
    <li className="ac-notif" style={{ "--atraso": `${n.atraso}s` } as CSSProperties}>
      <div className="rounded-[20px] bg-white/95 px-3.5 py-3 text-tinta shadow-[0_10px_30px_-8px_rgb(15_21_48/0.45)] backdrop-blur">
        <div className="flex items-center gap-2">
          <Simbolo tamanho={18} />
          <span className="font-mono text-[10.5px] font-bold tracking-[0.1em] text-tx2 uppercase">Aviso Concurso</span>
          <span className="ml-auto font-mono text-[10.5px] text-tx2">{n.quando}</span>
        </div>
        <Etiqueta tom={n.tom} className="mt-2 !text-[10px]">
          {n.tag}
        </Etiqueta>
        <p className="mt-1.5 text-[14px] leading-snug font-bold">{n.titulo}</p>
        <p className="mt-0.5 text-[12.5px] leading-snug text-tx2">{n.texto}</p>
      </div>
    </li>
  );
}

/** Celular com tela de bloqueio recebendo avisos (animação de entrada, sem loop). */
export function CelularAvisos({ className }: { className?: string }) {
  return (
    <div className={clsx("relative mx-auto w-[292px] sm:w-[322px]", className)}>
      <div aria-hidden="true" className="absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(closest-side,rgb(31_63_209/0.28),transparent)]" />
      <div
        role="img"
        aria-label="Exemplo de avisos no celular: edital publicado do Tribunal Regional, isenção da SEFAZ acabando amanhã e errata que mudou a data de uma prova."
        className="relative rounded-[52px] bg-tinta p-[10px] shadow-[0_50px_90px_-30px_rgb(15_21_48/0.6)]"
      >
        <div className="absolute top-[110px] -left-[3px] h-14 w-[3px] rounded-l bg-tinta" />
        <div className="absolute top-[150px] -right-[3px] h-20 w-[3px] rounded-r bg-tinta" />
        <div className="relative min-h-[560px] overflow-hidden rounded-[43px] bg-[linear-gradient(165deg,#3354EA_0%,#1F3FD1_45%,#14299A_100%)] pb-14 sm:min-h-[640px]">
          <div aria-hidden="true" className="absolute -top-24 -right-20 size-72 rounded-full bg-marca/25 blur-3xl" />
          <div aria-hidden="true" className="absolute top-3 left-1/2 h-[25px] w-[88px] -translate-x-1/2 rounded-full bg-tinta" />
          <div aria-hidden="true" className="relative flex items-center justify-between px-7 pt-[15px] text-[12px] font-bold text-white">
            <span>08:14</span>
            <span className="flex items-center gap-1">
              <span className="flex items-end gap-[2px]">
                <i className="block h-[5px] w-[3px] rounded-sm bg-white" />
                <i className="block h-[7px] w-[3px] rounded-sm bg-white" />
                <i className="block h-[9px] w-[3px] rounded-sm bg-white" />
                <i className="block h-[11px] w-[3px] rounded-sm bg-white/50" />
              </span>
              <span className="ml-1 block h-[11px] w-[22px] rounded-[3px] border border-white/80 p-[1.5px]">
                <span className="block h-full w-3/4 rounded-[1.5px] bg-white" />
              </span>
            </span>
          </div>
          <div aria-hidden="true" className="relative mt-5 text-center text-white sm:mt-7">
            <p className="text-[13px] font-semibold text-white/85">terça-feira, 3 de novembro</p>
            <p className="font-display text-[72px] leading-[0.9] font-extrabold tracking-[-0.02em] sm:text-[86px]">08:14</p>
          </div>
          <ol aria-hidden="true" className="relative mt-5 grid gap-2.5 px-3 sm:mt-6">
            {NOTIFICACOES.map((n) => (
              <Notificacao key={n.tag} n={n} />
            ))}
          </ol>
          <div aria-hidden="true" className="absolute inset-x-0 bottom-3 flex flex-col items-center gap-2">
            <p className="font-mono text-[9.5px] font-bold tracking-[0.2em] text-white/70 uppercase">Exemplo ilustrativo</p>
            <span className="block h-[5px] w-28 rounded-full bg-white/80" />
          </div>
        </div>
      </div>

      {/* cartões flutuando ao redor (só em telas maiores) */}
      <div
        aria-hidden="true"
        className="ac-flutua absolute -bottom-14 -left-28 hidden w-[184px] rounded-[22px] bg-azul p-4 text-white shadow-[0_24px_50px_-20px_rgb(15_21_48/0.55)] ring-4 ring-papel xl:block"
        style={{ "--atraso": "0.8s" } as CSSProperties}
      >
        <p className="font-mono text-[10px] font-bold tracking-[0.16em] text-white/80 uppercase">Próxima prova</p>
        <p className="mt-1 font-display text-[40px] leading-none font-extrabold uppercase">
          Faltam <span className="text-marca">21</span>
        </p>
        <p className="mt-1 text-[12px] text-white/85">Tribunal Regional · 24/11</p>
      </div>
      <div
        aria-hidden="true"
        className="ac-flutua absolute -top-11 -right-12 hidden items-center gap-2 rounded-full bg-white py-2 pr-4 pl-2 shadow-[0_18px_40px_-18px_rgb(15_21_48/0.5)] ring-1 ring-linha xl:flex"
      >
        <span className="grid size-8 place-items-center rounded-full bg-verde-t text-[#0A6633]">
          <Icone nome="check" tamanho={16} strokeWidth={3} />
        </span>
        <span className="font-mono text-[11px] leading-tight font-bold text-tinta">
          DOU lido às 06:00
          <br />
          <span className="font-medium text-tx2">Seções 1, 2 e 3 · todo dia</span>
        </span>
      </div>
    </div>
  );
}

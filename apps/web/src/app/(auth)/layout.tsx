import "@/components/ui/movimento.css";
import type { CSSProperties } from "react";
import { Gabarito, Logo, Simbolo } from "@/components/ui/Logo";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { TRIAL_DAYS } from "@aviso/shared";

const AVISOS = [
  { tag: "Edital publicado", tom: "verde-solido" as const, t: "TJ · Técnico Judiciário", d: "80 vagas · R$ 5.200,00 · inscrições até 25/11" },
  { tag: "Isenção acaba amanhã", tom: "verm-solido" as const, t: "SEFAZ · Auditor Fiscal", d: "Peça a isenção no site da banca." },
];

export default function LayoutAutenticacao({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,560px)] xl:grid-cols-[1fr_640px]">
      <div className="flex min-w-0 flex-col">
        <header className="flex h-16 items-center px-4 sm:h-[72px] sm:px-8">
          <Logo />
        </header>
        <main id="conteudo" className="flex flex-1 items-start justify-center px-4 pt-6 pb-16 sm:items-center sm:px-8 sm:pt-0">
          <div className="w-full max-w-[440px]">{children}</div>
        </main>
      </div>
      <aside
        aria-hidden="true"
        className="relative hidden overflow-hidden bg-tinta text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-14"
      >
        <div className="absolute -top-32 -right-32 size-96 rounded-full border-[40px] border-white/[0.05]" />
        <div className="absolute -bottom-40 -left-20 size-80 rounded-full bg-azul/30 blur-3xl" />
        <Gabarito marcada="C" escuro cor="marca" className="relative" />
        <div className="relative">
          <p className="font-display text-[64px] leading-[0.92] font-extrabold uppercase xl:text-[76px]">
            Nunca mais se preocupe em perder <span className="text-marca">uma data.</span>
          </p>
          <ul className="mt-10 grid max-w-[380px] gap-3">
            {AVISOS.map((a, i) => (
              <li key={a.t} className="ac-notif" style={{ "--atraso": `${0.4 + i * 0.6}s` } as CSSProperties}>
                <div className="rounded-[20px] bg-white px-4 py-3.5 text-tinta shadow-xl">
                  <div className="flex items-center gap-2">
                    <Simbolo tamanho={18} />
                    <span className="font-mono text-[10.5px] font-bold tracking-[0.1em] text-tx2 uppercase">Aviso Concurso</span>
                    <span className="ml-auto font-mono text-[10.5px] text-tx2">{i === 0 ? "agora" : "1 h"}</span>
                  </div>
                  <Etiqueta tom={a.tom} className="mt-2 !text-[10px]">
                    {a.tag}
                  </Etiqueta>
                  <p className="mt-1.5 text-[14px] font-bold">{a.t}</p>
                  <p className="text-[12.5px] text-tx2">{a.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative font-mono text-[12px] tracking-[0.12em] text-white/60 uppercase">
          {TRIAL_DAYS} dias grátis · cancele quando quiser · exemplo ilustrativo
        </p>
      </aside>
    </div>
  );
}

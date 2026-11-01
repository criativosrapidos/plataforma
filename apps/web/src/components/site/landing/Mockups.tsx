import clsx from "clsx";
import type { CSSProperties } from "react";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Icone } from "@/components/ui/Icone";
import { SeloExemplo } from "../Secao";

const C = { tribunal: "#1F3FD1", sefaz: "#7A3FD1", prefeitura: "#0B7F86" };

const LEGENDA = [
  { nome: "Tribunal", cor: C.tribunal },
  { nome: "SEFAZ", cor: C.sefaz },
  { nome: "Prefeitura", cor: C.prefeitura },
];

const SEMANA = [
  { d: "S", n: 2 },
  { d: "T", n: 3, hoje: true },
  { d: "Q", n: 4, cor: C.sefaz },
  { d: "Q", n: 5 },
  { d: "S", n: 6 },
  { d: "S", n: 7 },
  { d: "D", n: 8 },
];

const COMPROMISSOS = [
  { dia: "04", mes: "nov", titulo: "Prazo de isenção", quem: "SEFAZ · fim do pedido de isenção", cor: C.sefaz, falta: "amanhã", urgente: true },
  { dia: "10", mes: "nov", titulo: "Local de prova sai", quem: "Tribunal · conferir no site da banca", cor: C.tribunal, falta: "7 dias" },
  { dia: "18", mes: "nov", titulo: "Fim das inscrições", quem: "SEFAZ · boleto até 19/11", cor: C.sefaz, falta: "15 dias" },
  { dia: "24", mes: "nov", titulo: "Prova objetiva e redação", quem: "Tribunal · 13h, portões fecham 12h30", cor: C.tribunal, falta: "21 dias", prova: true },
  { dia: "13", mes: "dez", titulo: "Prova objetiva", quem: "Prefeitura · 8h", cor: C.prefeitura, falta: "40 dias", prova: true },
];

/** Agenda do app com vários concursos, uma cor por concurso. */
export function AgendaMock({ className }: { className?: string }) {
  return (
    <div
      className={clsx("rounded-[28px] border border-linha bg-branco p-4 shadow-[0_30px_60px_-30px_rgb(15_21_48/0.35)] sm:p-6", className)}
      role="img"
      aria-label="Exemplo da agenda: prazos de isenção, inscrição, local de prova e provas de três concursos, cada um com sua cor."
    >
      <div aria-hidden="true">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm text-tx2">Novembro</p>
            <p className="font-display text-[34px] leading-none font-extrabold uppercase">Agenda</p>
          </div>
          <SeloExemplo />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {LEGENDA.map((l) => (
            <span key={l.nome} className="inline-flex items-center gap-2 rounded-full border border-linha px-3 py-1.5 text-[13px] font-bold">
              <span className="size-2.5 rounded-full" style={{ background: l.cor }} />
              {l.nome}
            </span>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {SEMANA.map((s) => (
            <div
              key={s.n}
              className={clsx(
                "flex flex-col items-center rounded-2xl border py-2",
                s.hoje ? "border-tinta bg-tinta text-white" : "border-linha bg-branco",
              )}
            >
              <span className={clsx("text-[11px] font-semibold", s.hoje ? "text-white/75" : "text-tx2")}>{s.d}</span>
              <span className="font-mono text-[15px] font-bold">{s.n}</span>
              <span className="mt-1 size-1.5 rounded-full" style={{ background: s.cor ?? "transparent" }} />
            </div>
          ))}
        </div>
        <p className="mt-5 text-[15px] font-bold">Próximos compromissos</p>
        <ul className="mt-2.5 grid gap-2">
          {COMPROMISSOS.map((c, i) => (
            <li
              key={c.titulo + c.dia}
              data-revelar
              style={{ "--atraso": `${i * 0.08}s` } as CSSProperties}
              className="flex items-center gap-3 overflow-hidden rounded-2xl border border-linha bg-branco py-2.5 pr-3 pl-0"
            >
              <span className="w-1.5 self-stretch rounded-r-full" style={{ background: c.cor }} />
              <span className="w-10 shrink-0 text-center font-mono leading-tight">
                <span className="block text-[19px] font-bold">{c.dia}</span>
                <span className="block text-[10px] font-bold tracking-wider text-tx2 uppercase">{c.mes}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[14px] font-bold">
                  {c.prova ? <Icone nome="documento" tamanho={14} className="shrink-0 text-tx2" /> : null}
                  <span className="truncate">{c.titulo}</span>
                </span>
                <span className="block truncate text-[12.5px] text-tx2">{c.quem}</span>
              </span>
              <Etiqueta tom={c.urgente ? "verm" : "cinza"} className="hidden shrink-0 sm:inline-flex">
                {c.falta}
              </Etiqueta>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const MATERIAS = [
  { nome: "Língua Portuguesa", em: [true, true, true], questoes: 50 },
  { nome: "Raciocínio Lógico", em: [true, true, true], questoes: 30 },
  { nome: "Direito Administrativo", em: [true, true, true], questoes: 25 },
  { nome: "Direito Constitucional", em: [true, true, false], questoes: 20 },
  { nome: "Informática", em: [true, false, true], questoes: 15 },
];

/** Matérias em comum entre os editais, com questões somadas. */
export function MateriasMock({ className }: { className?: string }) {
  const cores = [C.tribunal, C.sefaz, C.prefeitura];
  const letras = ["T", "S", "P"];
  return (
    <div
      data-revelar
      className={clsx("rounded-[28px] border border-linha bg-branco p-4 shadow-[0_30px_60px_-30px_rgb(15_21_48/0.35)] sm:p-6", className)}
      role="img"
      aria-label="Exemplo de matérias em comum: Língua Portuguesa, Raciocínio Lógico e Direito Administrativo caem nos três concursos."
    >
      <div aria-hidden="true">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm text-tx2">Seus 3 concursos</p>
            <p className="font-display text-[34px] leading-none font-extrabold uppercase">Matérias em comum</p>
          </div>
        </div>
        <ul className="mt-5 grid gap-2.5">
          {MATERIAS.map((m, i) => {
            const qtd = m.em.filter(Boolean).length;
            return (
              <li key={m.nome} className="rounded-2xl border border-linha p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-[15px] font-bold">{m.nome}</span>
                  <span className="flex shrink-0 gap-1">
                    {m.em.map((tem, j) => (
                      <span
                        key={j}
                        className={clsx(
                          "grid size-6 place-items-center rounded-full font-mono text-[10px] font-bold",
                          tem ? "text-white" : "bg-papel text-tx2 ring-1 ring-linha",
                        )}
                        style={tem ? { background: cores[j] } : undefined}
                      >
                        {letras[j]}
                      </span>
                    ))}
                  </span>
                </div>
                <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-linha">
                  <div
                    className="ac-barra h-full rounded-full bg-azul"
                    style={{ width: `${(m.questoes / 50) * 100}%`, "--atraso": `${0.15 + i * 0.1}s` } as CSSProperties}
                  />
                </div>
                <p className="mt-1.5 text-[12.5px] text-tx2">
                  Cai em {qtd} de 3 · {m.questoes} questões somadas
                </p>
              </li>
            );
          })}
        </ul>
        <SeloExemplo className="mt-4" />
      </div>
    </div>
  );
}

/** Resumo do edital como chega na notificação. */
export function ResumoEdital({ className }: { className?: string }) {
  const linhas: [string, string][] = [
    ["Órgão", "Tribunal Regional"],
    ["Cargo", "Técnico Judiciário · nível médio"],
    ["Vagas", "42 + cadastro reserva"],
    ["Salário", "R$ 8.500,00"],
    ["Taxa", "R$ 85,00 · isenção até 07/11"],
    ["Inscrição", "03/11 a 02/12"],
    ["Prova", "24/11 · objetiva e redação"],
    ["Banca", "Cebraspe"],
  ];
  return (
    <div className={clsx("rounded-[28px] border border-linha bg-branco p-5 shadow-[0_30px_60px_-30px_rgb(15_21_48/0.35)] sm:p-7", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Etiqueta tom="verde-solido">Edital publicado</Etiqueta>
        <SeloExemplo />
      </div>
      <p className="mt-3 text-xl font-extrabold">Resumo do edital, do jeito que chega</p>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5 text-[15px]">
        {linhas.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="pt-0.5 font-mono text-[11px] font-bold tracking-[0.12em] text-tx2 uppercase">{k}</dt>
            <dd className="font-bold">{v}</dd>
          </div>
        ))}
        <dt className="pt-0.5 font-mono text-[11px] font-bold tracking-[0.12em] text-tx2 uppercase">Fonte</dt>
        <dd>
          <span className="inline-flex items-center gap-1.5 font-bold text-azul">
            DOU · Seção 3
            <Icone nome="externo" tamanho={15} />
          </span>
        </dd>
      </dl>
    </div>
  );
}

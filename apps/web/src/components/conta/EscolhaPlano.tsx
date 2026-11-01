"use client";

import clsx from "clsx";
import { PLANO_INFO, brl, precoCentavos, type Ciclo, type Plano } from "@aviso/shared";
import { Icone } from "@/components/ui/Icone";
import { precoCurto } from "@/components/site/conteudo";

export type Metodo = "pix_automatico" | "cartao";

/** Cartões de plano selecionáveis (radio). */
export function EscolhaPlano({
  plano,
  ciclo,
  aoMudar,
  atual,
}: {
  plano: Plano;
  ciclo: Ciclo;
  aoMudar: (p: Plano) => void;
  atual?: Plano | null;
}) {
  return (
    <div role="radiogroup" aria-label="Plano" className="grid gap-3 md:grid-cols-2">
      {(["aviso", "aprovado"] as const).map((p) => {
        const info = PLANO_INFO[p];
        const marcado = plano === p;
        const centavos = precoCentavos(p, ciclo);
        return (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={marcado}
            onClick={() => aoMudar(p)}
            className={clsx(
              "relative flex flex-col rounded-[24px] border-2 bg-branco p-5 text-left transition-[border-color,box-shadow] sm:p-6",
              marcado ? "border-azul shadow-[0_20px_40px_-28px_rgb(31_63_209/0.6)]" : "border-linha hover:border-tinta/40",
            )}
          >
            <span className="flex items-start justify-between gap-3">
              <span>
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-[34px] leading-none font-extrabold uppercase">{info.nome}</span>
                  {atual === p ? (
                    <span className="rounded-full bg-tinta px-2 py-0.5 font-mono text-[10.5px] font-bold text-white">ATUAL</span>
                  ) : p === "aviso" ? (
                    <span className="rounded-full bg-marca px-2 py-0.5 font-mono text-[10.5px] font-bold">MAIS ESCOLHIDO</span>
                  ) : (
                    <span className="rounded-full bg-tinta/5 px-2 py-0.5 font-mono text-[10.5px] font-bold ring-1 ring-linha">COMPLETO</span>
                  )}
                </span>
                <span className="mt-2 block font-mono text-[22px] font-bold">
                  {precoCurto(centavos)}
                  <span className="font-sans text-[15px] font-medium text-tx2">/{ciclo === "anual" ? "ano" : "mês"}</span>
                </span>
                {ciclo === "anual" ? (
                  <span className="block text-sm text-tx2">sai {brl(Math.floor(centavos / 12))} por mês</span>
                ) : null}
              </span>
              <span
                aria-hidden="true"
                className={clsx(
                  "grid size-7 shrink-0 place-items-center rounded-full border-[2.5px]",
                  marcado ? "border-azul bg-azul text-white" : "border-[#C7CBD6]",
                )}
              >
                {marcado ? <Icone nome="check" tamanho={14} strokeWidth={3.5} /> : null}
              </span>
            </span>
            <span className="mt-4 grid gap-1.5 border-t border-linha pt-4 text-[14.5px]">
              {info.inclui.map((i) => (
                <span key={i} className="flex gap-2">
                  <Icone nome="check" tamanho={15} strokeWidth={3} className="mt-1 shrink-0 text-azul" />
                  {i}
                </span>
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Pix automático ou cartão (radio). */
export function EscolhaMetodo({ metodo, aoMudar }: { metodo: Metodo; aoMudar: (m: Metodo) => void }) {
  const opcoes: { v: Metodo; t: string; d: string; icone: "pix" | "cartao" }[] = [
    { v: "pix_automatico", t: "Pix automático", d: "Autoriza uma vez no app do banco. Sem boleto para lembrar.", icone: "pix" },
    { v: "cartao", t: "Cartão de crédito", d: "Cobrança automática no cartão a cada período.", icone: "cartao" },
  ];
  return (
    <div role="radiogroup" aria-label="Forma de pagamento" className="grid gap-3 sm:grid-cols-2">
      {opcoes.map((o) => {
        const marcado = metodo === o.v;
        return (
          <button
            key={o.v}
            type="button"
            role="radio"
            aria-checked={marcado}
            onClick={() => aoMudar(o.v)}
            className={clsx(
              "flex min-h-11 items-start gap-3 rounded-[20px] border-2 bg-branco p-4 text-left transition-colors",
              marcado ? "border-azul" : "border-linha hover:border-tinta/40",
            )}
          >
            <span className={clsx("grid size-10 shrink-0 place-items-center rounded-xl", marcado ? "bg-azul text-white" : "bg-papel text-tinta")}>
              <Icone nome={o.icone} tamanho={20} />
            </span>
            <span>
              <span className="block font-bold">{o.t}</span>
              <span className="block text-sm text-tx2">{o.d}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
